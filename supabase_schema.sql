-- =========================================================================
-- COMPLETE SUPABASE POSTGRESQL SCHEMA FOR ARTS & SPORTS FEST PLATFORM
-- Project URL: https://sebphzbptktohcisskht.supabase.co
-- =========================================================================

-- 1. APP USERS & AUTH
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'CONTROLLER', 'PUBLIC')),
  team_id TEXT,
  assigned_program_ids JSONB DEFAULT '[]'::jsonb,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FEST SETTINGS & CONFIGURATION
CREATE TABLE IF NOT EXISTS public.fest_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_settings',
  fest_name TEXT NOT NULL,
  fest_tagline TEXT,
  fest_year TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  registration_open BOOLEAN DEFAULT TRUE,
  registration_opens_at TEXT,
  registration_closes_at TEXT,
  allow_combined_leaderboard BOOLEAN DEFAULT TRUE,
  require_admin_approval BOOLEAN DEFAULT TRUE,
  show_public_live_scores BOOLEAN DEFAULT TRUE,
  enable_arts_section BOOLEAN DEFAULT TRUE,
  enable_sports_section BOOLEAN DEFAULT TRUE,
  max_individual_programs_default INT DEFAULT 4,
  theme_mode TEXT DEFAULT 'light',
  banner_slides JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOUSES / TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  bg_class TEXT,
  border_class TEXT,
  leader_id TEXT,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_phone TEXT,
  motto TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORY DEFINITIONS
CREATE TABLE IF NOT EXISTS public.category_configs (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  section_scope TEXT DEFAULT 'ALL',
  assigned_classes JSONB DEFAULT '[]'::jsonb,
  max_individual_programs_per_student INT DEFAULT 4,
  chest_no_start INT NOT NULL,
  chest_no_end INT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLASS TO CATEGORY MAPPINGS
CREATE TABLE IF NOT EXISTS public.class_mappings (
  id TEXT PRIMARY KEY,
  class_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT
);

-- 6. STUDENT ROSTER
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  admission_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  class_number TEXT NOT NULL,
  section_letter TEXT,
  category TEXT NOT NULL,
  team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  chest_number INT,
  gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  avatar_url TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROGRAMS / COMPETITIONS
CREATE TABLE IF NOT EXISTS public.programs (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('ARTS', 'SPORTS')),
  subsection TEXT NOT NULL,
  category TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('INDIVIDUAL', 'GROUP', 'GENERAL')),
  min_participants INT DEFAULT 1,
  max_participants INT DEFAULT 1,
  max_groups_per_team INT DEFAULT 1,
  required_members_per_group INT,
  registration_open BOOLEAN DEFAULT TRUE,
  assigned_controller_id TEXT,
  assigned_controller_name TEXT,
  rules TEXT,
  stage_location TEXT,
  schedule_time TEXT,
  status TEXT DEFAULT 'UPCOMING',
  result_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.registrations (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES public.programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  section TEXT NOT NULL,
  subsection TEXT NOT NULL,
  category TEXT NOT NULL,
  program_type TEXT NOT NULL,
  team_id TEXT REFERENCES public.teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_color TEXT NOT NULL,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT,
  admission_no TEXT,
  chest_number INT,
  class_number TEXT,
  group_id TEXT,
  group_number INT,
  group_name TEXT,
  group_members JSONB,
  registered_by TEXT NOT NULL,
  registered_role TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'CONFIRMED'
);

-- 9. RESULTS & SCORES
CREATE TABLE IF NOT EXISTS public.results (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES public.programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  section TEXT NOT NULL,
  category TEXT NOT NULL,
  program_type TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'PUBLISHED')),
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SCORING MATRIX CONFIGURATION
CREATE TABLE IF NOT EXISTS public.scoring_configs (
  id TEXT PRIMARY KEY DEFAULT 'current_scoring',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  role TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 12. HIGH-PERFORMANCE REALTIME STATE SNAPSHOT
CREATE TABLE IF NOT EXISTS public.fest_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- INDEXES FOR MAXIMUM QUERY SPEED
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_students_team_id ON public.students(team_id);
CREATE INDEX IF NOT EXISTS idx_students_category ON public.students(category);
CREATE INDEX IF NOT EXISTS idx_registrations_program_id ON public.registrations(program_id);
CREATE INDEX IF NOT EXISTS idx_registrations_team_id ON public.registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student_id ON public.registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_results_program_id ON public.results(program_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fest_state ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'app_users', 'fest_settings', 'teams', 'category_configs',
    'class_mappings', 'students', 'programs', 'registrations',
    'results', 'scoring_configs', 'audit_logs', 'fest_state'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow public read %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public insert %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public update %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public delete %I" ON public.%I', t, t);

    EXECUTE format('CREATE POLICY "Allow public read %I" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "Allow public insert %I" ON public.%I FOR INSERT WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "Allow public update %I" ON public.%I FOR UPDATE USING (true)', t, t);
    EXECUTE format('CREATE POLICY "Allow public delete %I" ON public.%I FOR DELETE USING (true)', t, t);

    EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role', t);
  END LOOP;
END $$;

-- =========================================================================
-- REALTIME REPLICATION PUBLICATION
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fest_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_mappings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.programs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fest_state;
