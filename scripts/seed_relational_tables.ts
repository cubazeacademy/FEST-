import pg from 'pg';
const { Client } = pg;
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CATEGORY_CONFIGS,
  INITIAL_CLASS_MAPPINGS,
  INITIAL_PROGRAMS,
  INITIAL_REGISTRATIONS,
  INITIAL_RESULTS,
  INITIAL_SCORING_CONFIGS,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TEAMS,
  INITIAL_USERS
} from '../src/utils/seedData';

const connectionString = 'postgresql://postgres.sebphzbptktohcisskht:Sinan751033@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

async function seedData() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();

    // 1. Seed app_users
    console.log('Seeding app_users...');
    for (const u of INITIAL_USERS) {
      await client.query(`
        INSERT INTO public.app_users (id, username, password, name, email, role, team_id, assigned_program_ids, avatar_url, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          team_id = EXCLUDED.team_id,
          assigned_program_ids = EXCLUDED.assigned_program_ids,
          avatar_url = EXCLUDED.avatar_url,
          is_active = EXCLUDED.is_active;
      `, [u.id, u.username, u.password || 'password123', u.name, u.email, u.role, u.teamId || null, JSON.stringify(u.assignedProgramIds || []), u.avatarUrl || null, u.isActive ?? true]);
    }

    // 2. Seed fest_settings
    console.log('Seeding fest_settings...');
    await client.query(`
      INSERT INTO public.fest_settings (id, fest_name, fest_tagline, fest_year, institution_name, registration_open, registration_opens_at, registration_closes_at, allow_combined_leaderboard, require_admin_approval, show_public_live_scores, enable_arts_section, enable_sports_section, max_individual_programs_default, theme_mode, banner_slides)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        fest_name = EXCLUDED.fest_name,
        fest_tagline = EXCLUDED.fest_tagline,
        fest_year = EXCLUDED.fest_year,
        institution_name = EXCLUDED.institution_name,
        registration_open = EXCLUDED.registration_open,
        allow_combined_leaderboard = EXCLUDED.allow_combined_leaderboard,
        require_admin_approval = EXCLUDED.require_admin_approval,
        show_public_live_scores = EXCLUDED.show_public_live_scores,
        enable_arts_section = EXCLUDED.enable_arts_section,
        enable_sports_section = EXCLUDED.enable_sports_section,
        max_individual_programs_default = EXCLUDED.max_individual_programs_default,
        banner_slides = EXCLUDED.banner_slides;
    `, [
      'current_settings',
      INITIAL_SETTINGS.festName,
      INITIAL_SETTINGS.festTagline,
      INITIAL_SETTINGS.festYear,
      INITIAL_SETTINGS.institutionName,
      INITIAL_SETTINGS.registrationOpen,
      INITIAL_SETTINGS.registrationOpensAt,
      INITIAL_SETTINGS.registrationClosesAt,
      INITIAL_SETTINGS.allowCombinedLeaderboard,
      INITIAL_SETTINGS.requireAdminApproval,
      INITIAL_SETTINGS.showPublicLiveScores,
      INITIAL_SETTINGS.enableArtsSection ?? true,
      INITIAL_SETTINGS.enableSportsSection ?? true,
      INITIAL_SETTINGS.maxIndividualProgramsDefault,
      INITIAL_SETTINGS.themeMode,
      JSON.stringify(INITIAL_SETTINGS.bannerSlides || [])
    ]);

    // 3. Seed teams
    console.log('Seeding teams...');
    for (const t of INITIAL_TEAMS) {
      await client.query(`
        INSERT INTO public.teams (id, name, code, color, bg_class, border_class, leader_id, leader_name, leader_email, leader_phone, motto, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          color = EXCLUDED.color,
          leader_name = EXCLUDED.leader_name,
          leader_email = EXCLUDED.leader_email,
          motto = EXCLUDED.motto,
          status = EXCLUDED.status;
      `, [t.id, t.name, t.code, t.color, t.bgClass, t.borderClass, t.leaderId, t.leaderName, t.leaderEmail, t.leaderPhone || null, t.motto || null, t.status]);
    }

    // 4. Seed category_configs
    console.log('Seeding category_configs...');
    for (const c of INITIAL_CATEGORY_CONFIGS) {
      await client.query(`
        INSERT INTO public.category_configs (id, category, display_name, section_scope, assigned_classes, max_individual_programs_per_student, chest_no_start, chest_no_end, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          category = EXCLUDED.category,
          display_name = EXCLUDED.display_name,
          assigned_classes = EXCLUDED.assigned_classes,
          chest_no_start = EXCLUDED.chest_no_start,
          chest_no_end = EXCLUDED.chest_no_end;
      `, [c.id, c.category, c.displayName, c.sectionScope, JSON.stringify(c.assignedClasses), c.maxIndividualProgramsPerStudent, c.chestNoStart, c.chestNoEnd, c.status]);
    }

    // 5. Seed class_mappings
    console.log('Seeding class_mappings...');
    for (const m of INITIAL_CLASS_MAPPINGS) {
      await client.query(`
        INSERT INTO public.class_mappings (id, class_number, category, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (class_number) DO UPDATE SET
          category = EXCLUDED.category,
          description = EXCLUDED.description;
      `, [m.id, m.classNumber, m.category, m.description || null]);
    }

    // 6. Seed students
    console.log('Seeding students...');
    for (const s of INITIAL_STUDENTS) {
      await client.query(`
        INSERT INTO public.students (id, admission_no, name, class_number, section_letter, category, team_id, chest_number, gender, status, created_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (admission_no) DO UPDATE SET
          name = EXCLUDED.name,
          class_number = EXCLUDED.class_number,
          category = EXCLUDED.category,
          team_id = EXCLUDED.team_id,
          chest_number = EXCLUDED.chest_number,
          gender = EXCLUDED.gender;
      `, [s.id, s.admissionNo, s.name, s.classNumber, s.sectionLetter || null, s.category, s.teamId, s.chestNumber || null, s.gender || null, s.status, s.createdDate]);
    }

    // 7. Seed programs
    console.log('Seeding programs...');
    for (const p of INITIAL_PROGRAMS) {
      await client.query(`
        INSERT INTO public.programs (id, code, name, section, subsection, category, program_type, min_participants, max_participants, max_groups_per_team, required_members_per_group, registration_open, assigned_controller_id, assigned_controller_name, rules, stage_location, schedule_time, status, result_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          section = EXCLUDED.section,
          subsection = EXCLUDED.subsection,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          result_status = EXCLUDED.result_status;
      `, [p.id, p.code, p.name, p.section, p.subsection, p.category, p.programType, p.minParticipants, p.maxParticipants, p.maxGroupsPerTeam || 1, p.requiredMembersPerGroup || null, p.registrationOpen, p.assignedControllerId || null, p.assignedControllerName || null, p.rules || null, p.stageLocation || null, p.scheduleTime || null, p.status, p.resultStatus]);
    }

    // 8. Seed registrations
    console.log('Seeding registrations...');
    for (const r of INITIAL_REGISTRATIONS) {
      await client.query(`
        INSERT INTO public.registrations (id, program_id, program_name, section, subsection, category, program_type, team_id, team_name, team_color, student_id, student_name, admission_no, chest_number, class_number, group_id, group_number, group_name, group_members, registered_by, registered_role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status;
      `, [r.id, r.programId, r.programName, r.section, r.subsection, r.category, r.programType, r.teamId, r.teamName, r.teamColor, r.studentId || null, r.studentName || null, r.admissionNo || null, r.chestNumber || null, r.classNumber || null, r.groupId || null, r.groupNumber || null, r.groupName || null, JSON.stringify(r.groupMembers || []), r.registeredBy, r.registeredRole, r.status]);
    }

    // 9. Seed results
    console.log('Seeding results...');
    for (const res of INITIAL_RESULTS) {
      await client.query(`
        INSERT INTO public.results (id, program_id, program_name, section, category, program_type, status, submitted_by, submitted_at, published_at, entries, remarks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          entries = EXCLUDED.entries;
      `, [res.id, res.programId, res.programName, res.section, res.category, res.programType, res.status, res.submittedBy, res.submittedAt || null, res.publishedAt || null, JSON.stringify(res.entries || []), res.remarks || null]);
    }

    // 10. Seed scoring_configs
    console.log('Seeding scoring_configs...');
    await client.query(`
      INSERT INTO public.scoring_configs (id, data)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
    `, ['current_scoring', JSON.stringify(INITIAL_SCORING_CONFIGS)]);

    // 11. Seed audit_logs
    console.log('Seeding audit_logs...');
    for (const a of INITIAL_AUDIT_LOGS) {
      await client.query(`
        INSERT INTO public.audit_logs (id, action, entity, entity_id, details, performed_by, role, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING;
      `, [a.id, a.action, a.entity, a.entityId || null, a.details, a.performedBy, a.role, a.timestamp]);
    }

    console.log('\n--- DATA SEEDING COMPLETE FOR ALL TABLES! ---');

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

seedData();
