import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL ||
  (process.env.POSTGRES_USER && process.env.POSTGRES_HOST
    ? `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DATABASE || 'postgres'}`
    : undefined);

async function setup() {
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
