import { createClient } from '@supabase/supabase-js';
import {
  CategoryConfig,
  ClassCategoryMapping,
  FestSettings,
  Program,
  ProgramResult,
  Registration,
  ScoringConfigMap,
  Student,
  Team,
  User,
  AuditLog
} from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sebphzbptktohcisskht.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Q5kbGgWhHvmZ_UMi9qdKtw_7-VMbSJq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const FEST_STATE_KEY = 'fest_core_data_v1';
export const USERS_STATE_KEY = 'fest_users_data_v1';

// =========================================================================
// RELATIONAL DATA CONVERTERS (Frontend Types <-> Supabase DB Columns)
// =========================================================================

export function mapCategoryConfigToDb(c: CategoryConfig) {
  return {
    id: c.id,
    category: c.category,
    display_name: c.displayName,
    section_scope: c.sectionScope || 'ALL',
    assigned_classes: c.assignedClasses || [],
    max_individual_programs_per_student: c.maxIndividualProgramsPerStudent != null ? Number(c.maxIndividualProgramsPerStudent) : 5,
    min_individual_programs_per_student: c.minIndividualProgramsPerStudent != null ? Number(c.minIndividualProgramsPerStudent) : 0,
    min_stage_programs: c.minStagePrograms != null ? Number(c.minStagePrograms) : 0,
    max_stage_programs: c.maxStagePrograms != null ? Number(c.maxStagePrograms) : 2,
    min_non_stage_programs: c.minNonStagePrograms != null ? Number(c.minNonStagePrograms) : 0,
    max_non_stage_programs: c.maxNonStagePrograms != null ? Number(c.maxNonStagePrograms) : 3,
    min_sports_programs: c.minSportsPrograms != null ? Number(c.minSportsPrograms) : 0,
    max_sports_programs: c.maxSportsPrograms != null ? Number(c.maxSportsPrograms) : 2,
    chest_no_start: c.chestNoStart,
    chest_no_end: c.chestNoEnd,
    status: c.status || 'ACTIVE'
  };
}

export function mapCategoryConfigFromDb(row: any): CategoryConfig {
  return {
    id: row.id,
    category: row.category,
    displayName: row.display_name,
    sectionScope: row.section_scope || 'ALL',
    assignedClasses: row.assigned_classes || [],
    maxIndividualProgramsPerStudent: row.max_individual_programs_per_student != null ? Number(row.max_individual_programs_per_student) : 5,
    minIndividualProgramsPerStudent: row.min_individual_programs_per_student != null ? Number(row.min_individual_programs_per_student) : undefined,
    minStagePrograms: row.min_stage_programs != null ? Number(row.min_stage_programs) : undefined,
    maxStagePrograms: row.max_stage_programs != null ? Number(row.max_stage_programs) : undefined,
    minNonStagePrograms: row.min_non_stage_programs != null ? Number(row.min_non_stage_programs) : undefined,
    maxNonStagePrograms: row.max_non_stage_programs != null ? Number(row.max_non_stage_programs) : undefined,
    minSportsPrograms: row.min_sports_programs != null ? Number(row.min_sports_programs) : undefined,
    maxSportsPrograms: row.max_sports_programs != null ? Number(row.max_sports_programs) : undefined,
    chestNoStart: row.chest_no_start != null ? Number(row.chest_no_start) : 101,
    chestNoEnd: row.chest_no_end != null ? Number(row.chest_no_end) : 199,
    status: row.status || 'ACTIVE'
  };
}

export function mapClassMappingToDb(m: ClassCategoryMapping) {
  return {
    id: m.id,
    class_number: m.classNumber,
    category: m.category,
    description: m.description || null
  };
}

export function mapClassMappingFromDb(row: any): ClassCategoryMapping {
  return {
    id: row.id,
    classNumber: row.class_number,
    category: row.category,
    description: row.description
  };
}

export function mapTeamToDb(t: Team) {
  return {
    id: t.id,
    name: t.name,
    code: t.code,
    color: t.color,
    bg_class: t.bgClass || null,
    border_class: t.borderClass || null,
    leader_id: t.leaderId || null,
    leader_name: t.leaderName,
    leader_email: t.leaderEmail,
    leader_phone: t.leaderPhone || null,
    motto: t.motto || null,
    status: t.status || 'ACTIVE'
  };
}

export function mapTeamFromDb(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    color: row.color,
    bgClass: row.bg_class || '',
    borderClass: row.border_class || '',
    leaderId: row.leader_id || '',
    leaderName: row.leader_name || '',
    leaderEmail: row.leader_email || '',
    leaderPhone: row.leader_phone || '',
    motto: row.motto || '',
    status: row.status || 'ACTIVE'
  };
}

export function mapStudentToDb(s: Student) {
  return {
    id: s.id,
    admission_no: s.admissionNo,
    name: s.name,
    class_number: s.classNumber,
    section_letter: s.sectionLetter || null,
    category: s.category,
    team_id: s.teamId || null,
    chest_number: s.chestNumber ? Number(s.chestNumber) : null,
    gender: s.gender || null,
    avatar_url: s.avatarUrl || null,
    status: s.status || 'ACTIVE',
    created_date: s.createdDate || new Date().toISOString().split('T')[0]
  };
}

export function mapStudentFromDb(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    admissionNo: row.admission_no,
    classNumber: row.class_number,
    sectionLetter: row.section_letter || undefined,
    category: row.category,
    teamId: row.team_id || '',
    chestNumber: row.chest_number || undefined,
    gender: row.gender || undefined,
    avatarUrl: row.avatar_url || undefined,
    status: row.status || 'ACTIVE',
    createdDate: row.created_date || ''
  };
}

export function mapProgramToDb(p: Program) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    section: p.section,
    subsection: p.subsection,
    category: p.category,
    program_type: p.programType,
    min_participants: p.minParticipants || 1,
    max_participants: p.maxParticipants || 1,
    max_groups_per_team: p.maxGroupsPerTeam || 1,
    required_members_per_group: p.requiredMembersPerGroup || null,
    registration_open: p.registrationOpen ?? true,
    assigned_controller_id: p.assignedControllerId || null,
    assigned_controller_name: p.assignedControllerName || null,
    rules: p.rules || null,
    stage_location: p.stageLocation || null,
    schedule_time: p.scheduleTime || null,
    status: p.status || 'UPCOMING',
    result_status: p.resultStatus || 'PENDING'
  };
}

export function mapProgramFromDb(row: any): Program {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    section: row.section,
    subsection: row.subsection,
    category: row.category,
    programType: row.program_type,
    minParticipants: row.min_participants,
    maxParticipants: row.max_participants,
    maxGroupsPerTeam: row.max_groups_per_team,
    requiredMembersPerGroup: row.required_members_per_group || undefined,
    registrationOpen: row.registration_open,
    assignedControllerId: row.assigned_controller_id || undefined,
    assignedControllerName: row.assigned_controller_name || undefined,
    rules: row.rules || undefined,
    stageLocation: row.stage_location || undefined,
    scheduleTime: row.schedule_time || undefined,
    status: row.status || 'UPCOMING',
    resultStatus: row.result_status || 'PENDING'
  };
}

export function mapRegistrationToDb(r: Registration) {
  return {
    id: r.id,
    program_id: r.programId,
    program_name: r.programName,
    section: r.section,
    subsection: r.subsection,
    category: r.category,
    program_type: r.programType,
    team_id: r.teamId,
    team_name: r.teamName,
    team_color: r.teamColor,
    student_id: r.studentId || null,
    student_name: r.studentName || null,
    admission_no: r.admissionNo || null,
    chest_number: r.chestNumber ? Number(r.chestNumber) : null,
    class_number: r.classNumber || null,
    group_id: r.groupId || null,
    group_number: r.groupNumber || null,
    group_name: r.groupName || null,
    group_members: r.groupMembers || [],
    registered_by: r.registeredBy,
    registered_role: r.registeredRole,
    timestamp: r.timestamp || new Date().toISOString(),
    status: r.status || 'CONFIRMED'
  };
}

export function mapRegistrationFromDb(row: any): Registration {
  return {
    id: row.id,
    programId: row.program_id,
    programName: row.program_name,
    section: row.section,
    subsection: row.subsection,
    category: row.category,
    programType: row.program_type,
    teamId: row.team_id,
    teamName: row.team_name,
    teamColor: row.team_color,
    studentId: row.student_id || undefined,
    studentName: row.student_name || undefined,
    admissionNo: row.admission_no || undefined,
    chestNumber: row.chest_number || undefined,
    classNumber: row.class_number || undefined,
    groupId: row.group_id || undefined,
    groupNumber: row.group_number || undefined,
    groupName: row.group_name || undefined,
    groupMembers: row.group_members || [],
    registeredBy: row.registered_by,
    registeredRole: row.registered_role,
    timestamp: row.timestamp,
    status: row.status
  };
}

export function mapResultToDb(res: ProgramResult) {
  return {
    id: res.id,
    program_id: res.programId,
    program_name: res.programName,
    section: res.section,
    category: res.category,
    program_type: res.programType,
    status: res.status,
    submitted_by: res.submittedBy,
    submitted_at: res.submittedAt || null,
    published_at: res.publishedAt || null,
    entries: res.entries || [],
    remarks: res.remarks || null
  };
}

export function mapResultFromDb(row: any): ProgramResult {
  return {
    id: row.id,
    programId: row.program_id,
    programName: row.program_name,
    section: row.section,
    category: row.category,
    programType: row.program_type,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at || undefined,
    publishedAt: row.published_at || undefined,
    entries: row.entries || [],
    remarks: row.remarks || undefined
  };
}

export function mapSettingsToDb(s: FestSettings) {
  return {
    id: 'current_settings',
    fest_name: s.festName,
    fest_tagline: s.festTagline || null,
    fest_year: s.festYear,
    institution_name: s.institutionName,
    registration_open: s.registrationOpen ?? true,
    registration_opens_at: s.registrationOpensAt || null,
    registration_closes_at: s.registrationClosesAt || null,
    allow_combined_leaderboard: s.allowCombinedLeaderboard ?? true,
    require_admin_approval: s.requireAdminApproval ?? true,
    show_public_live_scores: s.showPublicLiveScores ?? true,
    enable_arts_section: s.enableArtsSection ?? true,
    enable_sports_section: s.enableSportsSection ?? true,
    max_individual_programs_default: s.maxIndividualProgramsDefault || 4,
    theme_mode: s.themeMode || 'light',
    banner_slides: s.bannerSlides || []
  };
}

export function mapSettingsFromDb(row: any): FestSettings {
  return {
    festName: row.fest_name,
    festTagline: row.fest_tagline || '',
    festYear: row.fest_year,
    institutionName: row.institution_name,
    registrationOpen: row.registration_open,
    registrationOpensAt: row.registration_opens_at || '',
    registrationClosesAt: row.registration_closes_at || '',
    allowCombinedLeaderboard: row.allow_combined_leaderboard,
    requireAdminApproval: row.require_admin_approval,
    showPublicLiveScores: row.show_public_live_scores,
    enableArtsSection: row.enable_arts_section,
    enableSportsSection: row.enable_sports_section,
    maxIndividualProgramsDefault: row.max_individual_programs_default,
    themeMode: row.theme_mode || 'light',
    bannerSlides: row.banner_slides || []
  };
}

export function mapUserToDb(u: User) {
  return {
    id: u.id,
    username: u.username,
    password: u.password || 'password123',
    name: u.name,
    email: u.email,
    role: u.role,
    team_id: u.teamId || null,
    assigned_program_ids: u.assignedProgramIds || [],
    avatar_url: u.avatarUrl || null,
    is_active: u.isActive ?? true,
    last_login: u.lastLogin || null
  };
}

export function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    name: row.name,
    email: row.email,
    role: row.role,
    teamId: row.team_id || undefined,
    assignedProgramIds: row.assigned_program_ids || [],
    avatarUrl: row.avatar_url || undefined,
    isActive: row.is_active,
    lastLogin: row.last_login || undefined
  };
}

export function mapAuditLogToDb(a: AuditLog) {
  return {
    id: a.id,
    action: a.action,
    entity: a.entity,
    entity_id: a.entityId || null,
    details: a.details,
    performed_by: a.performedBy,
    role: a.role,
    timestamp: a.timestamp || new Date().toISOString()
  };
}

export function mapAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id || undefined,
    details: row.details,
    performedBy: row.performed_by,
    role: row.role,
    timestamp: row.timestamp
  };
}

// =========================================================================
// FULL RELATIONAL DATABASE FETCH
// =========================================================================

export async function fetchFullRelationalData() {
  try {
    const [
      settingsRes,
      teamsRes,
      studentsRes,
      categoriesRes,
      mappingsRes,
      programsRes,
      registrationsRes,
      resultsRes,
      scoringRes,
      logsRes,
      festStateRes
    ] = await Promise.all([
      supabase.from('fest_settings').select('*').eq('id', 'current_settings').maybeSingle(),
      supabase.from('teams').select('*').order('created_at', { ascending: true }),
      supabase.from('students').select('*').order('created_at', { ascending: true }).limit(10000),
      supabase.from('category_configs').select('*').order('created_at', { ascending: true }),
      supabase.from('class_mappings').select('*'),
      supabase.from('programs').select('*').order('created_at', { ascending: true }).limit(10000),
      supabase.from('registrations').select('*').order('timestamp', { ascending: false }).limit(10000),
      supabase.from('results').select('*').order('created_at', { ascending: true }).limit(10000),
      supabase.from('scoring_configs').select('*').eq('id', 'current_scoring').maybeSingle(),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
      supabase.from('fest_state').select('data').eq('id', FEST_STATE_KEY).maybeSingle()
    ]);

    // Check if relational database has any data
    const hasData = categoriesRes.data?.length || teamsRes.data?.length || studentsRes.data?.length || programsRes.data?.length || settingsRes.data;

    if (!hasData) {
      // Fallback to fest_state snapshot if relational tables were not populated yet
      const snapshot = await fetchCloudFestState();
      return snapshot;
    }

    // Merge categoryConfigs from relational table with any snapshot rules in fest_state
    const snapshotCategories: CategoryConfig[] = festStateRes.data?.data?.categoryConfigs || [];
    const mappedCategories: CategoryConfig[] = (categoriesRes.data && categoriesRes.data.length > 0)
      ? categoriesRes.data.map(mapCategoryConfigFromDb).map(cat => {
          const snap = snapshotCategories.find(s => s.id === cat.id || s.category === cat.category);
          return {
            ...cat,
            displayName: cat.displayName || snap?.displayName || cat.category,
            assignedClasses: (cat.assignedClasses && cat.assignedClasses.length > 0) ? cat.assignedClasses : (snap?.assignedClasses || []),
            minStagePrograms: snap?.minStagePrograms !== undefined ? Number(snap.minStagePrograms) : (cat.minStagePrograms !== undefined ? Number(cat.minStagePrograms) : 0),
            maxStagePrograms: snap?.maxStagePrograms !== undefined ? Number(snap.maxStagePrograms) : (cat.maxStagePrograms !== undefined ? Number(cat.maxStagePrograms) : 2),
            minNonStagePrograms: snap?.minNonStagePrograms !== undefined ? Number(snap.minNonStagePrograms) : (cat.minNonStagePrograms !== undefined ? Number(cat.minNonStagePrograms) : 0),
            maxNonStagePrograms: snap?.maxNonStagePrograms !== undefined ? Number(snap.maxNonStagePrograms) : (cat.maxNonStagePrograms !== undefined ? Number(cat.maxNonStagePrograms) : 3),
            minSportsPrograms: snap?.minSportsPrograms !== undefined ? Number(snap.minSportsPrograms) : (cat.minSportsPrograms !== undefined ? Number(cat.minSportsPrograms) : 0),
            maxSportsPrograms: snap?.maxSportsPrograms !== undefined ? Number(snap.maxSportsPrograms) : (cat.maxSportsPrograms !== undefined ? Number(cat.maxSportsPrograms) : 2),
            minIndividualProgramsPerStudent: snap?.minIndividualProgramsPerStudent !== undefined ? Number(snap.minIndividualProgramsPerStudent) : (cat.minIndividualProgramsPerStudent !== undefined ? Number(cat.minIndividualProgramsPerStudent) : 0),
            maxIndividualProgramsPerStudent: snap?.maxIndividualProgramsPerStudent !== undefined ? Number(snap.maxIndividualProgramsPerStudent) : (cat.maxIndividualProgramsPerStudent !== undefined ? Number(cat.maxIndividualProgramsPerStudent) : 5),
            chestNoStart: cat.chestNoStart ?? snap?.chestNoStart ?? 101,
            chestNoEnd: cat.chestNoEnd ?? snap?.chestNoEnd ?? 199,
            status: cat.status || snap?.status || 'ACTIVE'
          };
        })
      : snapshotCategories;

    return {
      settings: settingsRes.data ? mapSettingsFromDb(settingsRes.data) : undefined,
      teams: teamsRes.data ? teamsRes.data.map(mapTeamFromDb) : [],
      students: studentsRes.data ? studentsRes.data.map(mapStudentFromDb) : [],
      categoryConfigs: mappedCategories.length > 0 ? mappedCategories : snapshotCategories,
      classMappings: mappingsRes.data ? mappingsRes.data.map(mapClassMappingFromDb) : [],
      programs: programsRes.data ? programsRes.data.map(mapProgramFromDb) : [],
      registrations: registrationsRes.data ? registrationsRes.data.map(mapRegistrationFromDb) : [],
      results: resultsRes.data ? resultsRes.data.map(mapResultFromDb) : [],
      scoringConfigs: scoringRes.data?.data || undefined,
      auditLogs: logsRes.data ? logsRes.data.map(mapAuditLogFromDb) : []
    };
  } catch (err) {
    console.error('Failed to fetch relational data from Supabase:', err);
    return null;
  }
}

// =========================================================================
// FULL RELATIONAL DATABASE SAVE (Syncs to all individual tables + fest_state)
// =========================================================================

export async function saveFullRelationalData(data: {
  settings: FestSettings;
  teams: Team[];
  students: Student[];
  categoryConfigs: CategoryConfig[];
  classMappings: ClassCategoryMapping[];
  programs: Program[];
  registrations: Registration[];
  results: ProgramResult[];
  scoringConfigs: ScoringConfigMap;
  auditLogs: AuditLog[];
}) {
  try {
    const promises: Promise<any>[] = [];

    // 1. Settings
    if (data.settings) {
      promises.push(
        (async () => {
          await supabase.from('fest_settings').upsert(mapSettingsToDb(data.settings));
        })()
      );
    }

    // 2. Category configs
    if (data.categoryConfigs) {
      const dbCategories = data.categoryConfigs.map(mapCategoryConfigToDb);
      promises.push(
        (async () => {
          if (dbCategories.length > 0) {
            await supabase.from('category_configs').upsert(dbCategories);
            // Delete removed
            const currentIds = dbCategories.map(c => c.id);
            const { data: existing } = await supabase.from('category_configs').select('id');
            const toDelete = existing?.filter(r => !currentIds.includes(r.id)).map(r => r.id) || [];
            if (toDelete.length > 0) {
              await supabase.from('category_configs').delete().in('id', toDelete);
            }
          } else {
            await supabase.from('category_configs').delete().neq('id', '___NONE___');
          }
        })()
      );
    }

    // 3. Class mappings
    if (data.classMappings) {
      const dbMappings = data.classMappings.map(mapClassMappingToDb);
      promises.push(
        (async () => {
          if (dbMappings.length > 0) {
            await supabase.from('class_mappings').upsert(dbMappings, { onConflict: 'class_number' });
            // Delete removed
            const currentClasses = dbMappings.map(m => m.class_number);
            const { data: existing } = await supabase.from('class_mappings').select('class_number');
            const toDelete = existing?.filter(r => !currentClasses.includes(r.class_number)).map(r => r.class_number) || [];
            if (toDelete.length > 0) {
              await supabase.from('class_mappings').delete().in('class_number', toDelete);
            }
          } else {
            await supabase.from('class_mappings').delete().neq('id', '___NONE___');
          }
        })()
      );
    }

    // 4. Teams
    if (data.teams) {
      const dbTeams = data.teams.map(mapTeamToDb);
      promises.push(
        (async () => {
          if (dbTeams.length > 0) {
            await supabase.from('teams').upsert(dbTeams);
            const currentIds = dbTeams.map(t => t.id);
            const { data: existing } = await supabase.from('teams').select('id');
            const toDelete = existing?.filter(r => !currentIds.includes(r.id)).map(r => r.id) || [];
            if (toDelete.length > 0) {
              await supabase.from('teams').delete().in('id', toDelete);
            }
          } else {
            await supabase.from('teams').delete().neq('id', '___NONE___');
          }
        })()
      );
    }

    // 5. Students
    if (data.students) {
      const dbStudents = data.students.map(mapStudentToDb);
      promises.push(
        (async () => {
          if (dbStudents.length > 0) {
            await supabase.from('students').upsert(dbStudents);
            const currentIds = dbStudents.map(s => s.id);
            const { data: existing } = await supabase.from('students').select('id');
            const toDelete = existing?.filter(r => !currentIds.includes(r.id)).map(r => r.id) || [];
            if (toDelete.length > 0) {
              await supabase.from('students').delete().in('id', toDelete);
            }
          } else {
            await supabase.from('students').delete().neq('id', '___NONE___');
          }
        })()
      );
    }

    // 6. Programs
    if (data.programs) {
      const dbPrograms = data.programs.map(mapProgramToDb);
      promises.push(
        (async () => {
          if (dbPrograms.length > 0) {
            await supabase.from('programs').upsert(dbPrograms);
            const currentIds = dbPrograms.map(p => p.id);
            const { data: existing } = await supabase.from('programs').select('id');
            const toDelete = existing?.filter(r => !currentIds.includes(r.id)).map(r => r.id) || [];
            if (toDelete.length > 0) {
              await supabase.from('programs').delete().in('id', toDelete);
            }
          } else {
            await supabase.from('programs').delete().neq('id', '___NONE___');
          }
        })()
      );
    }

    // 7. Registrations
    if (data.registrations) {
      const dbRegs = data.registrations.map(mapRegistrationToDb);
      promises.push(
        (async () => {
          if (dbRegs.length > 0) {
            await supabase.from('registrations').upsert(dbRegs);
            const currentIds = dbRegs.map(r => r.id);
            const { data: existing } = await supabase.from('registrations').select('id');
            const toDelete = existing?.filter(r => !currentIds.includes(r.id)).map(r => r.id) || [];
            if (toDelete.length > 0) {
              await supabase.from('registrations').delete().in('id', toDelete);
            }
          } else {
            await supabase.from('registrations').delete().neq('id', '___NONE___');
          }
        })()
      );
    }

    // 8. Results
    if (data.results) {
      const dbResults = data.results.map(mapResultToDb);
      promises.push(
        (async () => {
          if (dbResults.length > 0) {
            await supabase.from('results').upsert(dbResults);
            const currentIds = dbResults.map(r => r.id);
            const { data: existing } = await supabase.from('results').select('id');
            const toDelete = existing?.filter(r => !currentIds.includes(r.id)).map(r => r.id) || [];
            if (toDelete.length > 0) {
              await supabase.from('results').delete().in('id', toDelete);
            }
          } else {
            await supabase.from('results').delete().neq('id', '___NONE___');
          }
        })()
      );
    }

    // 9. Scoring configs
    if (data.scoringConfigs) {
      promises.push(
        (async () => {
          await supabase.from('scoring_configs').upsert({ id: 'current_scoring', data: data.scoringConfigs });
        })()
      );
    }

    // 10. Audit logs (latest 20)
    if (data.auditLogs && data.auditLogs.length > 0) {
      const dbLogs = data.auditLogs.slice(0, 20).map(mapAuditLogToDb);
      promises.push(
        (async () => {
          await supabase.from('audit_logs').upsert(dbLogs);
        })()
      );
    }

    // 11. Also update fest_state document snapshot
    promises.push(
      saveCloudFestState(data)
    );

    await Promise.all(promises);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save relational data to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save to Supabase' };
  }
}

// =========================================================================
// USERS RELATIONAL SYNC
// =========================================================================

export async function fetchRelationalUsers(): Promise<User[] | null> {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase users fetch error:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map(mapUserFromDb);
  } catch (err) {
    console.error('Failed to fetch relational users from Supabase:', err);
    return null;
  }
}

export async function saveRelationalUsers(users: User[]) {
  try {
    const dbUsers = users.map(mapUserToDb);
    if (dbUsers.length > 0) {
      await supabase.from('app_users').upsert(dbUsers);
      const currentIds = dbUsers.map(u => u.id);
      const { data: existing } = await supabase.from('app_users').select('id');
      const toDelete = existing?.filter(r => !currentIds.includes(r.id)).map(r => r.id) || [];
      if (toDelete.length > 0) {
        await supabase.from('app_users').delete().in('id', toDelete);
      }
    }

    // Also update snapshot
    await saveCloudUsers(users);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save users to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save users' };
  }
}

// =========================================================================
// SNAPSHOT HELPERS (FOR BACKWARD COMPATIBILITY & ULTRA-FAST CACHE)
// =========================================================================

export async function fetchCloudFestState() {
  try {
    const { data, error } = await supabase
      .from('fest_state')
      .select('data, updated_at')
      .eq('id', FEST_STATE_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    return data?.data || null;
  } catch (err) {
    console.error('Failed to fetch state from Supabase:', err);
    return null;
  }
}

export async function saveCloudFestState(stateData: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('fest_state')
      .upsert(
        {
          id: FEST_STATE_KEY,
          data: stateData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Supabase save error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save state to Supabase:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function fetchCloudUsers() {
  try {
    const { data, error } = await supabase
      .from('fest_state')
      .select('data, updated_at')
      .eq('id', USERS_STATE_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Supabase users fetch error:', error.message);
      return null;
    }

    return data?.data || null;
  } catch (err) {
    console.error('Failed to fetch users from Supabase:', err);
    return null;
  }
}

export async function saveCloudUsers(users: any[]) {
  try {
    const { error } = await supabase
      .from('fest_state')
      .upsert(
        {
          id: USERS_STATE_KEY,
          data: users,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Supabase users save error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save users to Supabase:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

// =========================================================================
// DISCRETE ATOMIC MUTATIONS (High Performance, No Monolithic Bulk-Dump)
// =========================================================================

export async function saveStudentDb(student: Student) {
  try {
    const { error } = await supabase.from('students').upsert(mapStudentToDb(student));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save student:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveStudentsBatchDb(students: Student[]) {
  try {
    if (students.length === 0) return { success: true };
    const { error } = await supabase.from('students').upsert(students.map(mapStudentToDb));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to batch save students:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteStudentDb(studentId: string) {
  try {
    // Clean dependent registrations first
    await supabase.from('registrations').delete().eq('student_id', studentId);
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete student:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteStudentsBatchDb(studentIds: string[]) {
  try {
    if (studentIds.length === 0) return { success: true };
    // Clean dependent registrations first
    await supabase.from('registrations').delete().in('student_id', studentIds);
    const { error } = await supabase.from('students').delete().in('id', studentIds);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to batch delete students:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveTeamDb(team: Team) {
  try {
    const { error } = await supabase.from('teams').upsert(mapTeamToDb(team));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save team:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteTeamDb(teamId: string) {
  try {
    await supabase.from('registrations').delete().eq('team_id', teamId);
    await supabase.from('students').update({ team_id: null }).eq('team_id', teamId);
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete team:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveProgramDb(program: Program) {
  try {
    const { error } = await supabase.from('programs').upsert(mapProgramToDb(program));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save program:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveProgramsBatchDb(programs: Program[]) {
  try {
    if (programs.length === 0) return { success: true };
    const { error } = await supabase.from('programs').upsert(programs.map(mapProgramToDb));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to batch save programs:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteProgramDb(programId: string) {
  try {
    // Delete any dependent results and registrations first to prevent FK constraint failures
    await supabase.from('results').delete().eq('program_id', programId);
    await supabase.from('registrations').delete().eq('program_id', programId);
    const { error } = await supabase.from('programs').delete().eq('id', programId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete program:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteProgramsBatchDb(programIds: string[]) {
  try {
    if (programIds.length === 0) return { success: true };
    // Delete any dependent results and registrations first to prevent FK constraint failures
    await supabase.from('results').delete().in('program_id', programIds);
    await supabase.from('registrations').delete().in('program_id', programIds);
    const { error } = await supabase.from('programs').delete().in('id', programIds);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to batch delete programs:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveRegistrationDb(registration: Registration) {
  try {
    const { error } = await supabase.from('registrations').upsert(mapRegistrationToDb(registration));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save registration:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveRegistrationsBatchDb(registrations: Registration[]) {
  try {
    if (registrations.length === 0) return { success: true };
    const dbRows = registrations.map(mapRegistrationToDb);
    // Upsert in chunks of 100 to guarantee database reliability for large batches
    for (let i = 0; i < dbRows.length; i += 100) {
      const chunk = dbRows.slice(i, i + 100);
      const { error } = await supabase.from('registrations').upsert(chunk);
      if (error) throw error;
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to batch save registrations:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteRegistrationDb(registrationId: string) {
  try {
    const { error } = await supabase.from('registrations').delete().eq('id', registrationId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete registration:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteRegistrationsBatchDb(registrationIds: string[]) {
  try {
    if (registrationIds.length === 0) return { success: true };
    const { error } = await supabase.from('registrations').delete().in('id', registrationIds);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to batch delete registrations:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteRegistrationsByTeamDb(teamId: string) {
  try {
    const { error } = await supabase.from('registrations').delete().eq('team_id', teamId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete registrations by team:', err);
    return { success: false, error: err?.message };
  }
}

export async function clearAllRegistrationsDb() {
  try {
    const { error } = await supabase.from('registrations').delete().neq('id', '___NONE___');
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to clear all registrations:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveResultDb(result: ProgramResult) {
  try {
    const { error: resErr } = await supabase.from('results').upsert(mapResultToDb(result));
    if (resErr) throw resErr;

    // Also update program status directly
    await supabase.from('programs').update({
      result_status: result.status,
      status: result.status === 'PUBLISHED' ? 'COMPLETED' : 'UPCOMING'
    }).eq('id', result.programId);

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save result:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteResultDb(programId: string) {
  try {
    const { error } = await supabase.from('results').delete().eq('program_id', programId);
    if (error) throw error;

    await supabase.from('programs').update({
      result_status: 'PENDING',
      status: 'UPCOMING'
    }).eq('id', programId);

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete result:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveSettingsDb(settings: FestSettings) {
  try {
    const { error } = await supabase.from('fest_settings').upsert(mapSettingsToDb(settings));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save settings:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveCategoryConfigDb(config: CategoryConfig, allConfigs?: CategoryConfig[]) {
  try {
    const fullPayload = mapCategoryConfigToDb(config);
    const { error } = await supabase.from('category_configs').upsert(fullPayload);
    if (error) {
      console.warn('Upsert with full category rules returned error, attempting fallback schema:', error.message);
      const fallbackPayload = {
        id: config.id,
        category: config.category,
        display_name: config.displayName,
        section_scope: config.sectionScope || 'ALL',
        assigned_classes: config.assignedClasses || [],
        max_individual_programs_per_student: config.maxIndividualProgramsPerStudent || 5,
        chest_no_start: config.chestNoStart,
        chest_no_end: config.chestNoEnd,
        status: config.status || 'ACTIVE'
      };
      const { error: fbErr } = await supabase.from('category_configs').upsert(fallbackPayload);
      if (fbErr) console.warn('Fallback upsert returned warning:', fbErr.message);
    }

    // Always mirror to fest_state snapshot so quota limits persist seamlessly across refreshes
    try {
      const { data: stateDoc } = await supabase
        .from('fest_state')
        .select('data')
        .eq('id', FEST_STATE_KEY)
        .maybeSingle();

      const existingData = stateDoc?.data || {};
      const currentList: CategoryConfig[] = existingData.categoryConfigs || [];
      const updatedList = allConfigs || (
        currentList.some(c => c.id === config.id)
          ? currentList.map(c => c.id === config.id ? config : c)
          : [...currentList, config]
      );
      await supabase.from('fest_state').upsert({
        id: FEST_STATE_KEY,
        data: {
          ...existingData,
          categoryConfigs: updatedList
        },
        updated_at: new Date().toISOString()
      });
    } catch (docErr) {
      console.warn('Failed to mirror category config to fest_state:', docErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save category config:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteCategoryConfigDb(configId: string) {
  try {
    const { error } = await supabase.from('category_configs').delete().eq('id', configId);
    if (error) throw error;

    try {
      const { data: stateDoc } = await supabase
        .from('fest_state')
        .select('data')
        .eq('id', FEST_STATE_KEY)
        .maybeSingle();

      if (stateDoc?.data?.categoryConfigs) {
        await supabase.from('fest_state').upsert({
          id: FEST_STATE_KEY,
          data: {
            ...stateDoc.data,
            categoryConfigs: stateDoc.data.categoryConfigs.filter((c: any) => c.id !== configId)
          },
          updated_at: new Date().toISOString()
        });
      }
    } catch (docErr) {
      console.warn('Failed to mirror category delete to fest_state:', docErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete category config:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveClassMappingDb(mapping: ClassCategoryMapping) {
  try {
    const { error } = await supabase.from('class_mappings').upsert(mapClassMappingToDb(mapping), { onConflict: 'class_number' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save class mapping:', err);
    return { success: false, error: err?.message };
  }
}

export async function deleteClassMappingDb(mappingId: string) {
  try {
    const { error } = await supabase.from('class_mappings').delete().eq('id', mappingId);
    if (error) throw error;

    try {
      const { data: stateDoc } = await supabase
        .from('fest_state')
        .select('data')
        .eq('id', FEST_STATE_KEY)
        .maybeSingle();

      if (stateDoc?.data?.classMappings) {
        await supabase.from('fest_state').upsert({
          id: FEST_STATE_KEY,
          data: {
            ...stateDoc.data,
            classMappings: stateDoc.data.classMappings.filter((m: any) => m.id !== mappingId)
          },
          updated_at: new Date().toISOString()
        });
      }
    } catch (docErr) {
      console.warn('Failed to mirror class mapping delete to fest_state:', docErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete class mapping:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveScoringConfigsDb(scoringConfigs: ScoringConfigMap) {
  try {
    const { error } = await supabase.from('scoring_configs').upsert({ id: 'current_scoring', data: scoringConfigs });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save scoring configs:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveAuditLogDb(log: AuditLog) {
  try {
    const { error } = await supabase.from('audit_logs').upsert(mapAuditLogToDb(log));
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save audit log:', err);
    return { success: false, error: err?.message };
  }
}

export async function saveLeaderboardCacheDb(leaderboard: any) {
  try {
    await supabase.from('fest_state').upsert({
      id: 'result_cache_leaderboard',
      data: leaderboard,
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
