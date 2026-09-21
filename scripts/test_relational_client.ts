import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sebphzbptktohcisskht.supabase.co';
const supabaseKey = 'sb_publishable_Q5kbGgWhHvmZ_UMi9qdKtw_7-VMbSJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRelationalSync() {
  console.log('Testing direct relational table writes with Supabase client...');

  // 1. Test category_configs
  const testCat = {
    id: 'cat_test_bidaya',
    category: 'BIDAYA',
    display_name: 'BIDAYA',
    section_scope: 'ALL',
    assigned_classes: ['1'],
    max_individual_programs_per_student: 5,
    chest_no_start: 101,
    chest_no_end: 200,
    status: 'ACTIVE'
  };

  const { error: catErr } = await supabase.from('category_configs').upsert(testCat);
  console.log('Category upsert error:', catErr);

  // 2. Test class_mappings
  const testMap = {
    id: 'map_test_1',
    class_number: '1',
    category: 'BIDAYA',
    description: 'BIDAYA (Class 1)'
  };

  const { error: mapErr } = await supabase.from('class_mappings').upsert(testMap);
  console.log('Class mapping upsert error:', mapErr);

  // 3. Read back
  const { data: cats } = await supabase.from('category_configs').select('*');
  console.log('Categories in Supabase:', cats);

  const { data: maps } = await supabase.from('class_mappings').select('*');
  console.log('Class mappings in Supabase:', maps);
}

testRelationalSync();
