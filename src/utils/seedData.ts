import {
  CategoryConfig,
  ClassCategoryMapping,
  FestSettings,
  GradePointConfig,
  PositionPointConfig,
  Program,
  ProgramResult,
  Registration,
  Student,
  Team,
  User,
  AuditLog,
  ScoringConfigMap
} from '../types';

export const INITIAL_SETTINGS: FestSettings = {
  festName: 'KALA & KREEDA 2026',
  festTagline: 'Annual Inter-House Arts & Sports Fest',
  festYear: '2026',
  institutionName: 'St. Xavier Grand Academy of Arts & Athletics',
  registrationOpen: true,
  registrationOpensAt: '2026-09-10T09:00',
  registrationClosesAt: '2026-09-25T23:59',
  allowCombinedLeaderboard: false,
  requireAdminApproval: false,
  showPublicLiveScores: true,
  enableArtsSection: true,
  enableSportsSection: true,
  maxIndividualProgramsDefault: 5,
  themeMode: 'dark',
  bannerSlides: [
    {
      id: 'slide_1',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
      title: 'KALA & KREEDA 2026',
      subtitle: 'Annual Inter-House Arts & Sports Extravaganza',
      caption: 'Witness 45+ cultural events, athletic championships, and stage performances.',
      isActive: true
    },
    {
      id: 'slide_2',
      imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80',
      title: 'Athletics & Sports Meet',
      subtitle: 'Track, Field, and Team Tournaments',
      caption: 'Inter-house glory across track, football, badminton, and relay championships.',
      isActive: true
    },
    {
      id: 'slide_3',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
      title: 'Grand Stage & Cultural Finale',
      subtitle: 'Music, Dance, Theatrical & Fine Arts',
      caption: 'Celebrating student talent, creativity, and institutional leadership.',
      isActive: true
    }
  ]
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    password: 'password123',
    name: 'Dr. Alexander Vance (Super Admin)',
    email: 'admin@festportal.edu',
    role: 'SUPER_ADMIN',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_lead_red',
    username: 'ruby_leader',
    password: 'password123',
    name: 'Elena Rostova (Ruby Leader)',
    email: 'ruby.leader@festportal.edu',
    role: 'TEAM_LEADER',
    teamId: 'team_red',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_lead_blue',
    username: 'sapphire_leader',
    password: 'password123',
    name: 'Marcus Chen (Sapphire Leader)',
    email: 'sapphire.leader@festportal.edu',
    role: 'TEAM_LEADER',
    teamId: 'team_blue',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_lead_green',
    username: 'emerald_leader',
    password: 'password123',
    name: 'Aisha Al-Mansoor (Emerald Leader)',
    email: 'emerald.leader@festportal.edu',
    role: 'TEAM_LEADER',
    teamId: 'team_green',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_lead_yellow',
    username: 'topaz_leader',
    password: 'password123',
    name: 'Julian Sterling (Topaz Leader)',
    email: 'topaz.leader@festportal.edu',
    role: 'TEAM_LEADER',
    teamId: 'team_yellow',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_ctrl_main',
    username: 'controller',
    password: 'password123',
    name: 'Official Event Controller',
    email: 'controller@festportal.edu',
    role: 'CONTROLLER',
    assignedProgramIds: [],
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team_red',
    name: 'Ruby Phoenix',
    code: 'RUBY',
    color: '#ef4444',
    bgClass: 'bg-red-500/10 text-red-500 border-red-500/30',
    borderClass: 'border-red-500',
    leaderId: 'usr_lead_red',
    leaderName: 'Elena Rostova',
    leaderEmail: 'ruby.leader@festportal.edu',
    motto: 'Rising Fierce from the Ashes',
    status: 'ACTIVE'
  },
  {
    id: 'team_blue',
    name: 'Sapphire Titans',
    code: 'SAPPHIRE',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    borderClass: 'border-blue-500',
    leaderId: 'usr_lead_blue',
    leaderName: 'Marcus Chen',
    leaderEmail: 'sapphire.leader@festportal.edu',
    motto: 'Boundless Wisdom, Infinite Strength',
    status: 'ACTIVE'
  },
  {
    id: 'team_green',
    name: 'Emerald Dragons',
    code: 'EMERALD',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    borderClass: 'border-emerald-500',
    leaderId: 'usr_lead_green',
    leaderName: 'Aisha Al-Mansoor',
    leaderEmail: 'emerald.leader@festportal.edu',
    motto: 'Unstoppable Vitality and Power',
    status: 'ACTIVE'
  },
  {
    id: 'team_yellow',
    name: 'Topaz Warriors',
    code: 'TOPAZ',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    borderClass: 'border-amber-500',
    leaderId: 'usr_lead_yellow',
    leaderName: 'Julian Sterling',
    leaderEmail: 'topaz.leader@festportal.edu',
    motto: 'Courage, Radiance, and Glory',
    status: 'ACTIVE'
  }
];

export const INITIAL_CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'cat_sub_junior',
    category: 'SUB_JUNIOR',
    displayName: 'Sub Junior (Classes 1 - 4)',
    sectionScope: 'ALL',
    assignedClasses: ['1', '2', '3', '4'],
    maxIndividualProgramsPerStudent: 5,
    chestNoStart: 101,
    chestNoEnd: 199,
    status: 'ACTIVE'
  },
  {
    id: 'cat_junior',
    category: 'JUNIOR',
    displayName: 'Junior (Classes 5 - 7)',
    sectionScope: 'ALL',
    assignedClasses: ['5', '6', '7'],
    maxIndividualProgramsPerStudent: 5,
    chestNoStart: 201,
    chestNoEnd: 299,
    status: 'ACTIVE'
  },
  {
    id: 'cat_senior',
    category: 'SENIOR',
    displayName: 'Senior (Classes 8 - 10)',
    sectionScope: 'ALL',
    assignedClasses: ['8', '9', '10'],
    maxIndividualProgramsPerStudent: 5,
    chestNoStart: 301,
    chestNoEnd: 399,
    status: 'ACTIVE'
  },
  {
    id: 'cat_super_senior',
    category: 'SUPER_SENIOR',
    displayName: 'Super Senior (Classes 11 - 12)',
    sectionScope: 'ALL',
    assignedClasses: ['11', '12'],
    maxIndividualProgramsPerStudent: 5,
    chestNoStart: 401,
    chestNoEnd: 499,
    status: 'ACTIVE'
  }
];

export const INITIAL_CLASS_MAPPINGS: ClassCategoryMapping[] = [
  { id: 'map_1', classNumber: '1', category: 'SUB_JUNIOR', description: 'Primary 1st Standard' },
  { id: 'map_2', classNumber: '2', category: 'SUB_JUNIOR', description: 'Primary 2nd Standard' },
  { id: 'map_3', classNumber: '3', category: 'SUB_JUNIOR', description: 'Primary 3rd Standard' },
  { id: 'map_4', classNumber: '4', category: 'SUB_JUNIOR', description: 'Primary 4th Standard' },
  { id: 'map_5', classNumber: '5', category: 'JUNIOR', description: 'Middle 5th Standard' },
  { id: 'map_6', classNumber: '6', category: 'JUNIOR', description: 'Middle 6th Standard' },
  { id: 'map_7', classNumber: '7', category: 'JUNIOR', description: 'Middle 7th Standard' },
  { id: 'map_8', classNumber: '8', category: 'SENIOR', description: 'High School 8th Standard' },
  { id: 'map_9', classNumber: '9', category: 'SENIOR', description: 'High School 9th Standard' },
  { id: 'map_10', classNumber: '10', category: 'SENIOR', description: 'High School 10th Standard' },
  { id: 'map_11', classNumber: '11', category: 'SUPER_SENIOR', description: 'Higher Secondary 11th' },
  { id: 'map_12', classNumber: '12', category: 'SUPER_SENIOR', description: 'Higher Secondary 12th' }
];

export const INITIAL_GRADE_CONFIGS: GradePointConfig[] = [
  { id: 'grd_a', grade: 'A', points: 5, label: 'Grade A (Outstanding)', active: true },
  { id: 'grd_b', grade: 'B', points: 3, label: 'Grade B (Excellent)', active: true },
  { id: 'grd_c', grade: 'C', points: 1, label: 'Grade C (Good)', active: true },
  { id: 'grd_d', grade: 'D', points: 0, label: 'Grade D (Pass)', active: true },
  { id: 'grd_none', grade: 'NONE', points: 0, label: 'No Grade', active: true }
];

export const INITIAL_POSITION_CONFIGS: PositionPointConfig[] = [
  { id: 'pos_1', position: 'FIRST', points: 5, label: '1st Position (Gold)', active: true },
  { id: 'pos_2', position: 'SECOND', points: 3, label: '2nd Position (Silver)', active: true },
  { id: 'pos_3', position: 'THIRD', points: 1, label: '3rd Position (Bronze)', active: true },
  { id: 'pos_other', position: 'OTHER', points: 0, label: 'Honorable Mention', active: true },
  { id: 'pos_none', position: 'NO_PRIZE', points: 0, label: 'No Position', active: true }
];

export const INITIAL_SCORING_CONFIGS: ScoringConfigMap = {
  INDIVIDUAL: {
    programType: 'INDIVIDUAL',
    title: 'Individual Programs Scoring',
    description: 'Solo Stage Arts, Non-Stage Arts, and Track/Field sports events. Points award to both student and house.',
    positionConfigs: [
      { id: 'pos_ind_1', position: 'FIRST', points: 5, label: '1st Position (Gold)', active: true },
      { id: 'pos_ind_2', position: 'SECOND', points: 3, label: '2nd Position (Silver)', active: true },
      { id: 'pos_ind_3', position: 'THIRD', points: 1, label: '3rd Position (Bronze)', active: true },
      { id: 'pos_ind_other', position: 'OTHER', points: 0, label: 'Honorable Mention', active: true },
      { id: 'pos_ind_none', position: 'NO_PRIZE', points: 0, label: 'No Position', active: true }
    ],
    gradeConfigs: [
      { id: 'grd_ind_a', grade: 'A', points: 5, label: 'Grade A (Outstanding)', active: true },
      { id: 'grd_ind_b', grade: 'B', points: 3, label: 'Grade B (Excellent)', active: true },
      { id: 'grd_ind_c', grade: 'C', points: 1, label: 'Grade C (Good)', active: true },
      { id: 'grd_ind_d', grade: 'D', points: 0, label: 'Grade D (Pass)', active: true },
      { id: 'grd_ind_none', grade: 'NONE', points: 0, label: 'No Grade', active: true }
    ]
  },
  GROUP: {
    programType: 'GROUP',
    title: 'Group Programs Scoring',
    description: 'Group Dances, Relays, Skits, Mimes, and Bands. Points award once directly to House Championship totals.',
    positionConfigs: [
      { id: 'pos_grp_1', position: 'FIRST', points: 10, label: '1st Position (Gold)', active: true },
      { id: 'pos_grp_2', position: 'SECOND', points: 6, label: '2nd Position (Silver)', active: true },
      { id: 'pos_grp_3', position: 'THIRD', points: 2, label: '3rd Position (Bronze)', active: true },
      { id: 'pos_grp_other', position: 'OTHER', points: 0, label: 'Honorable Mention', active: true },
      { id: 'pos_grp_none', position: 'NO_PRIZE', points: 0, label: 'No Position', active: true }
    ],
    gradeConfigs: [
      { id: 'grd_grp_a', grade: 'A', points: 10, label: 'Grade A (Outstanding)', active: true },
      { id: 'grd_grp_b', grade: 'B', points: 6, label: 'Grade B (Excellent)', active: true },
      { id: 'grd_grp_c', grade: 'C', points: 2, label: 'Grade C (Good)', active: true },
      { id: 'grd_grp_d', grade: 'D', points: 0, label: 'Grade D (Pass)', active: true },
      { id: 'grd_grp_none', grade: 'NONE', points: 0, label: 'No Grade', active: true }
    ]
  },
  GENERAL: {
    programType: 'GENERAL',
    title: 'General Programs Scoring',
    description: 'General House Competitions (e.g. March Past, House Quiz, Fest Anthem Choir, Open Parade).',
    positionConfigs: [
      { id: 'pos_gen_1', position: 'FIRST', points: 15, label: '1st Position (Gold)', active: true },
      { id: 'pos_gen_2', position: 'SECOND', points: 10, label: '2nd Position (Silver)', active: true },
      { id: 'pos_gen_3', position: 'THIRD', points: 5, label: '3rd Position (Bronze)', active: true },
      { id: 'pos_gen_other', position: 'OTHER', points: 0, label: 'Honorable Mention', active: true },
      { id: 'pos_gen_none', position: 'NO_PRIZE', points: 0, label: 'No Position', active: true }
    ],
    gradeConfigs: [
      { id: 'grd_gen_a', grade: 'A', points: 10, label: 'Grade A (Outstanding)', active: true },
      { id: 'grd_gen_b', grade: 'B', points: 6, label: 'Grade B (Excellent)', active: true },
      { id: 'grd_gen_c', grade: 'C', points: 2, label: 'Grade C (Good)', active: true },
      { id: 'grd_gen_d', grade: 'D', points: 0, label: 'Grade D (Pass)', active: true },
      { id: 'grd_gen_none', grade: 'NONE', points: 0, label: 'No Grade', active: true }
    ]
  }
};

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_PROGRAMS: Program[] = [];

export const INITIAL_REGISTRATIONS: Registration[] = [];

export const INITIAL_RESULTS: ProgramResult[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    action: 'INIT_FEST',
    entity: 'SETTING',
    details: 'System initialized for KALA & KREEDA 2026. Ready for student and program enrollment.',
    performedBy: 'Dr. Alexander Vance (Super Admin)',
    role: 'SUPER_ADMIN',
    timestamp: '2026-09-10T09:00:00Z'
  }
];
