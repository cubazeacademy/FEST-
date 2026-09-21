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

    const sqlPath = path.resolve(process.cwd(), 'scripts', 'apply_performance_indexes_and_cache.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Performance Optimization SQL migration...');
    await client.query(sql);
    console.log('✅ Performance Indexes, Result Cache Table & RPC Stored Procedures created successfully!');

    // Verify indexes
    const indexRes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    console.log('\n--- VERIFIED PERFORMANCE INDEXES ---');
    indexRes.rows.forEach(r => console.log(`• ${r.tablename}: ${r.indexname}`));

    // Verify result_cache table
    const cacheRes = await client.query(`SELECT count(*) FROM public.result_cache;`);
    console.log(`\n✅ result_cache table verified: ${cacheRes.rows[0].count} rows`);

  } catch (err: any) {
    console.error('Migration error:', err.message || err);
  } finally {
    await client.end();
  }
}

runMigration();
