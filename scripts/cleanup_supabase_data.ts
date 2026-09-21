import pg from 'pg';
const { Client } = pg;
import {
  INITIAL_CATEGORY_CONFIGS,
  INITIAL_CLASS_MAPPINGS,
  INITIAL_SCORING_CONFIGS,
  INITIAL_SETTINGS
} from '../src/utils/seedData';

// Load connection string from environment variable
const connectionString = process.env.DATABASE_URL ||
  (process.env.POSTGRES_USER && process.env.POSTGRES_HOST
    ? `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DATABASE || 'postgres'}`
    : undefined);

const SUPER_ADMIN_USER = {
  id: 'usr_admin',
  username: 'admin',
  password: process.env.INITIAL_ADMIN_PASSWORD || 'password123',
  name: 'Super Administrator',
  email: 'admin@festportal.edu',
  role: 'SUPER_ADMIN' as const,
  isActive: true,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
};

async function cleanupData() {
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

    console.log('Performing clean-up: purging test data and keeping ONLY Super Admin...');

    // 1. Delete all results
    console.log('Deleting results...');
    await client.query('DELETE FROM public.results;');

    // 2. Delete all registrations
    console.log('Deleting registrations...');
    await client.query('DELETE FROM public.registrations;');

    // 3. Delete all students
    console.log('Deleting students...');
    await client.query('DELETE FROM public.students;');

    // 4. Delete all programs
    console.log('Deleting programs...');
    await client.query('DELETE FROM public.programs;');

    // 5. Delete all teams
    console.log('Deleting teams...');
    await client.query('DELETE FROM public.teams;');

    // 6. Delete all users except Super Admin
    console.log('Purging test users from app_users, retaining ONLY Super Admin...');
    await client.query('DELETE FROM public.app_users WHERE username != $1;', ['admin']);

    // Ensure Super Admin exists with proper details
    await client.query(`
      INSERT INTO public.app_users (id, username, password, name, email, role, team_id, assigned_program_ids, avatar_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        team_id = NULL,
        assigned_program_ids = '[]'::jsonb,
        is_active = TRUE;
    `, [
      SUPER_ADMIN_USER.id,
      SUPER_ADMIN_USER.username,
      SUPER_ADMIN_USER.password,
      SUPER_ADMIN_USER.name,
      SUPER_ADMIN_USER.email,
      SUPER_ADMIN_USER.role,
      null,
      '[]',
      SUPER_ADMIN_USER.avatarUrl,
      true
    ]);

    // 7. Reset audit logs to a clean initial log
    console.log('Resetting audit_logs...');
    await client.query('DELETE FROM public.audit_logs;');
    await client.query(`
      INSERT INTO public.audit_logs (id, action, entity, details, performed_by, role, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, NOW());
    `, [
      'log_init_' + Date.now(),
      'INIT_SYSTEM',
      'SETTING',
      'System initialized in clean production state with Super Admin access.',
      'Super Administrator',
      'SUPER_ADMIN'
    ]);

    // 8. Update fest_state snapshots in Supabase for instant real-time hydration
    console.log('Updating fest_state document snapshots in Supabase...');
    const cleanFestCoreData = {
      settings: INITIAL_SETTINGS,
      teams: [],
      students: [],
      categoryConfigs: INITIAL_CATEGORY_CONFIGS,
      classMappings: INITIAL_CLASS_MAPPINGS,
      programs: [],
      registrations: [],
      results: [],
      scoringConfigs: INITIAL_SCORING_CONFIGS,
      gradeConfigs: INITIAL_SCORING_CONFIGS.INDIVIDUAL.gradeConfigs,
      positionConfigs: INITIAL_SCORING_CONFIGS.INDIVIDUAL.positionConfigs,
      auditLogs: [
        {
          id: 'log_init_' + Date.now(),
          action: 'INIT_SYSTEM',
          entity: 'SETTING',
          details: 'System initialized in clean production state with Super Admin access.',
          performedBy: 'Super Administrator',
          role: 'SUPER_ADMIN',
          timestamp: new Date().toISOString()
        }
      ]
    };

    const cleanUsersData = [SUPER_ADMIN_USER];

    await client.query(`
      INSERT INTO public.fest_state (id, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
    `, ['fest_core_data_v1', JSON.stringify(cleanFestCoreData)]);

    await client.query(`
      INSERT INTO public.fest_state (id, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
    `, ['fest_users_data_v1', JSON.stringify(cleanUsersData)]);

    console.log('\n--- VERIFYING CLEAN STATE COUNTS IN SUPABASE ---');
    const tables = [
      'app_users',
      'fest_settings',
      'teams',
      'category_configs',
      'class_mappings',
      'students',
      'programs',
      'registrations',
      'results',
      'scoring_configs',
      'audit_logs',
      'fest_state'
    ];

    for (const t of tables) {
      const res = await client.query(`SELECT count(*) FROM public.${t};`);
      console.log(`- ${t}: ${res.rows[0].count} rows`);
    }

    const usersRes = await client.query(`SELECT id, username, role, name, email FROM public.app_users;`);
    console.log('\nRemaining Users in app_users:', usersRes.rows);

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await client.end();
  }
}

cleanupData();
