import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sebphzbptktohcisskht.supabase.co';
const supabaseKey = 'sb_publishable_Q5kbGgWhHvmZ_UMi9qdKtw_7-VMbSJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('\n--- SUPABASE TEAMS TABLE ---');
  const { data: teams, error: teamErr } = await supabase.from('teams').select('*');
  if (teamErr) console.error(teamErr);
  else console.log(JSON.stringify(teams, null, 2));

  console.log('\n--- SUPABASE APP_USERS TABLE ---');
  const { data: users, error: userErr } = await supabase.from('app_users').select('*');
  if (userErr) console.error(userErr);
  else console.log(JSON.stringify(users, null, 2));
}

inspectDatabase();
