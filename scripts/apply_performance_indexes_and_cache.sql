-- =========================================================================
-- PERFORMANCE OPTIMIZATION: MISSING INDEXES, RESULT CACHE & ATOMIC RPCS
-- =========================================================================

-- 1. HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_results_status_prog ON public.results(status, program_id);
CREATE INDEX IF NOT EXISTS idx_results_entries_gin ON public.results USING gin(entries);
CREATE INDEX IF NOT EXISTS idx_programs_section_status ON public.programs(section, status);
CREATE INDEX IF NOT EXISTS idx_programs_result_status ON public.programs(result_status);
CREATE INDEX IF NOT EXISTS idx_programs_controller ON public.programs(assigned_controller_id);
CREATE INDEX IF NOT EXISTS idx_students_cat_team ON public.students(category, team_id);
CREATE INDEX IF NOT EXISTS idx_students_chest ON public.students(chest_number);
CREATE INDEX IF NOT EXISTS idx_registrations_compound ON public.registrations(status, program_id, team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ts ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

-- 2. DEDICATED RESULT CACHE TABLE FOR INSTANT PUBLIC LEADERBOARDS
CREATE TABLE IF NOT EXISTS public.result_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS on result_cache is readable by everyone
ALTER TABLE public.result_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read result_cache" ON public.result_cache;
CREATE POLICY "Allow public read result_cache" ON public.result_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all write result_cache" ON public.result_cache;
CREATE POLICY "Allow all write result_cache" ON public.result_cache FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.result_cache TO anon, authenticated, service_role;

-- 3. ATOMIC STORED PROCEDURE FOR CONCURRENT MARK ENTRY & RESULT SUBMISSION
CREATE OR REPLACE FUNCTION public.submit_program_result(
  p_program_id TEXT,
  p_program_name TEXT,
  p_section TEXT,
  p_category TEXT,
  p_program_type TEXT,
  p_status TEXT,
  p_submitted_by TEXT,
  p_entries JSONB,
  p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Insert or update result atomically
  INSERT INTO public.results (
    id, program_id, program_name, section, category, program_type,
    status, submitted_by, submitted_at, published_at, entries, remarks, created_at
  )
  VALUES (
    'res_' || p_program_id,
    p_program_id,
    p_program_name,
    p_section,
    p_category,
    p_program_type,
    p_status,
    p_submitted_by,
    v_now,
    CASE WHEN p_status = 'PUBLISHED' THEN v_now ELSE NULL END,
    p_entries,
    p_remarks,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    section = EXCLUDED.section,
    category = EXCLUDED.category,
    program_type = EXCLUDED.program_type,
    status = EXCLUDED.status,
    submitted_by = EXCLUDED.submitted_by,
    submitted_at = EXCLUDED.submitted_at,
    published_at = CASE WHEN EXCLUDED.status = 'PUBLISHED' THEN v_now ELSE public.results.published_at END,
    entries = EXCLUDED.entries,
    remarks = EXCLUDED.remarks;

  -- Update program result status
  UPDATE public.programs
  SET
    result_status = p_status,
    status = CASE WHEN p_status = 'PUBLISHED' THEN 'COMPLETED' ELSE status END
  WHERE id = p_program_id;

  RETURN jsonb_build_object(
    'success', true,
    'program_id', p_program_id,
    'status', p_status,
    'updated_at', v_now
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.submit_program_result TO anon, authenticated, service_role;

-- 4. Enable Realtime Replication for result_cache
ALTER PUBLICATION supabase_realtime ADD TABLE public.result_cache;
