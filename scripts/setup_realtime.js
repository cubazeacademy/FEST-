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

    // Enable realtime publication for fest_state
    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.fest_state;`);
      console.log('Added fest_state to supabase_realtime publication.');
    } catch (e) {
      console.log('Realtime publication note:', e.message);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

setup();
