import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sebphzbptktohcisskht.supabase.co';
const supabaseKey = 'sb_publishable_Q5kbGgWhHvmZ_UMi9qdKtw_7-VMbSJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('--- VERIFYING SUPABASE TABLES & ROW COUNTS VIA CLIENT SDK ---');

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

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${table}: Error (${error.message})`);
    } else {
      console.log(`✅ ${table}: ${count} rows`);
    }
  }
}

verify();
