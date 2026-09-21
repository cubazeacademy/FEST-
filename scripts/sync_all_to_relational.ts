import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sebphzbptktohcisskht.supabase.co';
const supabaseKey = 'sb_publishable_Q5kbGgWhHvmZ_UMi9qdKtw_7-VMbSJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncStateToRelationalTables() {
  console.log('Fetching fest_state document...');
  const { data: stateDoc } = await supabase.from('fest_state').select('data').eq('id', 'fest_core_data_v1').single();

  if (!stateDoc || !stateDoc.data) {
    console.log('No fest_state found.');
    return;
  }

  const d = stateDoc.data;
  console.log('Syncing categories to category_configs table:', d.categoryConfigs?.length || 0);

  if (d.categoryConfigs && d.categoryConfigs.length > 0) {
    const dbCats = d.categoryConfigs.map((c: any) => ({
      id: c.id,
      category: c.category,
      display_name: c.displayName,
      section_scope: c.sectionScope || 'ALL',
      assigned_classes: c.assignedClasses || [],
      max_individual_programs_per_student: c.maxIndividualProgramsPerStudent || 4,
      chest_no_start: c.chestNoStart,
      chest_no_end: c.chestNoEnd,
      status: c.status || 'ACTIVE'
    }));
    const { error: catErr } = await supabase.from('category_configs').upsert(dbCats);
    console.log('Category upsert result:', { error: catErr });
  }

  if (d.classMappings && d.classMappings.length > 0) {
    const dbMaps = d.classMappings.map((m: any) => ({
      id: m.id,
      class_number: m.classNumber,
      category: m.category,
      description: m.description || null
    }));
    const { error: mapErr } = await supabase.from('class_mappings').upsert(dbMaps, { onConflict: 'class_number' });
    console.log('Class mappings upsert result:', { error: mapErr });
  }

  // Check counts
  const { count: catCount } = await supabase.from('category_configs').select('*', { count: 'exact', head: true });
  console.log('Verified category_configs count in Supabase:', catCount);

  const { data: catRows } = await supabase.from('category_configs').select('category, display_name, assigned_classes');
  console.log('Category rows currently in Supabase:', catRows);
}

syncStateToRelationalTables();
