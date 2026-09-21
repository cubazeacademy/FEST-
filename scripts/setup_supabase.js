import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.sebphzbptktohcisskht:Sinan751033@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

async function setup() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    // Create fest_state table
    console.log('Creating fest_state table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.fest_state (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.fest_state ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if any
      DROP POLICY IF EXISTS "Allow public read fest_state" ON public.fest_state;
      DROP POLICY IF EXISTS "Allow public insert fest_state" ON public.fest_state;
      DROP POLICY IF EXISTS "Allow public update fest_state" ON public.fest_state;
      DROP POLICY IF EXISTS "Allow public delete fest_state" ON public.fest_state;

      -- Allow anon read/write
      CREATE POLICY "Allow public read fest_state" ON public.fest_state FOR SELECT USING (true);
      CREATE POLICY "Allow public insert fest_state" ON public.fest_state FOR INSERT WITH CHECK (true);
      CREATE POLICY "Allow public update fest_state" ON public.fest_state FOR UPDATE USING (true);
      CREATE POLICY "Allow public delete fest_state" ON public.fest_state FOR DELETE USING (true);

      -- Grant permissions to anon & authenticated roles
      GRANT ALL ON public.fest_state TO anon, authenticated, service_role;
    `);

    console.log('Schema created and permissions granted successfully!');

    const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', ['public']);
    console.log('Public tables in Supabase:', res.rows.map(r => r.table_name));

  } catch (err) {
    console.error('Error executing SQL migration:', err);
  } finally {
    await client.end();
  }
}

setup();
