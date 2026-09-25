import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

// Read .env file manually if present
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...val] = trimmed.split('=');
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = val.join('=').trim();
          }
        }
      });
    }
  } catch (e) {
    console.error('Error loading .env', e);
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL ||
  (process.env.POSTGRES_USER && process.env.POSTGRES_HOST
    ? `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DATABASE || 'postgres'}`
    : undefined);

async function runMigration() {
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL or POSTGRES environment variables.');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    const sqlPath = path.resolve(process.cwd(), 'scripts', 'deploy_result_engine.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing High-Performance Festival Result Engine SQL migration...');
    await client.query(sql);
    console.log('✅ Performance Indexes, Result Cache Table & PL/pgSQL Calculation Engine deployed successfully!');

    // Test rebuild_all_result_cache
    console.log('\n--- TESTING rebuild_all_result_cache() RPC ---');
    const rebuildRes = await client.query(`SELECT public.rebuild_all_result_cache();`);
    console.log('Rebuild result:', rebuildRes.rows[0]);

    // Check result_cache entries
    const cacheRows = await client.query(`SELECT cache_key, version, updated_at, jsonb_typeof(data) as type FROM public.result_cache;`);
    console.log('\n--- VERIFIED RESULT_CACHE KEYS ---');
    cacheRows.rows.forEach(r => console.log(`• ${r.cache_key}: version=${r.version}, type=${r.type}, updated_at=${r.updated_at}`));

    // Verify indexes
    const indexRes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    console.log('\n--- VERIFIED PERFORMANCE INDEXES ---');
    indexRes.rows.forEach(r => console.log(`• ${r.tablename}: ${r.indexname}`));

  } catch (err: any) {
    console.error('Migration error:', err.message || err);
  } finally {
    await client.end();
  }
}

runMigration();
