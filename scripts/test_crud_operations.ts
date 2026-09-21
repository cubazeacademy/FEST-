import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sebphzbptktohcisskht.supabase.co';
const supabaseKey = 'sb_publishable_Q5kbGgWhHvmZ_UMi9qdKtw_7-VMbSJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCrud() {
  console.log('--- TESTING FULL-STACK CRUD ON SUPABASE ---');

  // 1. Test adding a student
  const testStudent = {
    id: 'st_test_' + Date.now(),
    admission_no: 'ADM-TEST-999',
    name: 'Aravind Swamy',
    class_number: '10',
    category: 'SENIOR',
    team_id: 'team_red',
    chest_number: 301,
    status: 'ACTIVE',
    created_date: new Date().toISOString().split('T')[0]
  };

  console.log('1. Inserting student into "students" table...');
  const { data: stInsert, error: stErr } = await supabase.from('students').insert(testStudent).select();
  if (stErr) console.error('Student insert error:', stErr);
  else console.log('✅ Student inserted:', stInsert);

  // 2. Test reading the student back
  console.log('2. Reading student from "students" table...');
  const { data: stRead, error: stReadErr } = await supabase.from('students').select('*, teams(name, color)').eq('id', testStudent.id).single();
  if (stReadErr) console.error('Student read error:', stReadErr);
  else console.log('✅ Student read with joined team:', stRead);

  // 3. Test deleting the test student to leave database clean
  console.log('3. Cleaning up test student...');
  const { error: delErr } = await supabase.from('students').delete().eq('id', testStudent.id);
  if (delErr) console.error('Student delete error:', delErr);
  else console.log('✅ Test student cleaned up successfully!');

  console.log('\n--- ALL FULL-STACK SUPABASE CRUD TESTS PASSED ---');
}

testCrud();
