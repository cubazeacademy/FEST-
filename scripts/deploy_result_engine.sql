-- =========================================================================
-- HIGH-PERFORMANCE FESTIVAL RESULT ENGINE FOR SUPABASE POSTGRESQL + JSONB
-- =========================================================================

-- 1. RESULT CACHE TABLE
CREATE TABLE IF NOT EXISTS public.result_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_results_status_prog ON public.results(status, program_id);
CREATE INDEX IF NOT EXISTS idx_results_entries_gin ON public.results USING gin(entries);
CREATE INDEX IF NOT EXISTS idx_programs_section_status ON public.programs(section, status);
CREATE INDEX IF NOT EXISTS idx_programs_result_status ON public.programs(result_status);
CREATE INDEX IF NOT EXISTS idx_students_cat_team ON public.students(category, team_id);
CREATE INDEX IF NOT EXISTS idx_students_chest ON public.students(chest_number);
CREATE INDEX IF NOT EXISTS idx_registrations_compound ON public.registrations(status, program_id, team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON public.registrations(student_id);

-- 3. RLS POLICIES FOR RESULT CACHE
ALTER TABLE public.result_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read result_cache" ON public.result_cache;
CREATE POLICY "Allow public read result_cache" ON public.result_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all write result_cache" ON public.result_cache;
CREATE POLICY "Allow all write result_cache" ON public.result_cache FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.result_cache TO anon, authenticated, service_role;

-- 4. MASTER REBUILD FUNCTION: CALCULATES ALL LEADERBOARDS & CHAMPIONS IN POSTGRESQL
CREATE OR REPLACE FUNCTION public.rebuild_all_result_cache()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_arts_enabled BOOLEAN := true;
  v_sports_enabled BOOLEAN := true;
  v_settings RECORD;
  v_team_leaderboard_arts JSONB;
  v_team_leaderboard_sports JSONB;
  v_team_leaderboard_overall JSONB;
  v_student_champions JSONB;
  v_public_summary JSONB;
  v_published_count INT := 0;
  v_total_programs INT := 0;
  v_total_students INT := 0;
BEGIN
  -- Load fest settings
  SELECT * INTO v_settings FROM public.fest_settings WHERE id = 'current_settings' LIMIT 1;
  IF FOUND THEN
    v_arts_enabled := COALESCE(v_settings.enable_arts_section, true);
    v_sports_enabled := COALESCE(v_settings.enable_sports_section, true);
  END IF;

  SELECT count(*) INTO v_total_programs FROM public.programs;
  SELECT count(*) INTO v_published_count FROM public.results WHERE status = 'PUBLISHED';
  SELECT count(*) INTO v_total_students FROM public.students WHERE status = 'ACTIVE';

  -- =========================================================================
  -- A. CALCULATE TEAM SCORES (ARTS, SPORTS & OVERALL)
  -- =========================================================================
  WITH published_entries AS (
    SELECT 
      r.id AS result_id,
      r.program_id,
      p.section,
      p.subsection,
      p.category,
      p.program_type,
      (entry->>'teamId') AS team_id,
      (entry->>'position') AS pos,
      (entry->>'grade') AS grd,
      COALESCE((entry->>'totalPoints')::numeric, 0) AS points,
      COALESCE((entry->>'positionPoints')::numeric, 0) AS pos_points,
      COALESCE((entry->>'gradePoints')::numeric, 0) AS grd_points
    FROM public.results r
    JOIN public.programs p ON p.id = r.program_id
    CROSS JOIN LATERAL jsonb_array_elements(r.entries) AS entry
    WHERE r.status = 'PUBLISHED'
      AND (
        (p.section = 'ARTS' AND v_arts_enabled) OR
        (p.section = 'SPORTS' AND v_sports_enabled)
      )
  ),
  team_aggregates AS (
    SELECT
      t.id AS team_id,
      t.name AS team_name,
      t.color AS team_color,
      t.code AS team_code,
      -- Arts Breakdown
      COALESCE(SUM(CASE WHEN e.section = 'ARTS' AND e.subsection = 'STAGE' THEN e.points ELSE 0 END), 0) AS arts_stage_points,
      COALESCE(SUM(CASE WHEN e.section = 'ARTS' AND e.subsection = 'NON_STAGE' THEN e.points ELSE 0 END), 0) AS arts_non_stage_points,
      COALESCE(SUM(CASE WHEN e.section = 'ARTS' THEN e.points ELSE 0 END), 0) AS arts_total_points,
      -- Sports Breakdown
      COALESCE(SUM(CASE WHEN e.section = 'SPORTS' THEN e.points ELSE 0 END), 0) AS sports_total_points,
      -- Total Points
      COALESCE(SUM(e.points), 0) AS total_points,
      -- Arts Medals
      COUNT(CASE WHEN e.section = 'ARTS' AND e.pos = 'FIRST' THEN 1 END) AS arts_first_count,
      COUNT(CASE WHEN e.section = 'ARTS' AND e.pos = 'SECOND' THEN 1 END) AS arts_second_count,
      COUNT(CASE WHEN e.section = 'ARTS' AND e.pos = 'THIRD' THEN 1 END) AS arts_third_count,
      -- Sports Medals
      COUNT(CASE WHEN e.section = 'SPORTS' AND e.pos = 'FIRST' THEN 1 END) AS sports_first_count,
      COUNT(CASE WHEN e.section = 'SPORTS' AND e.pos = 'SECOND' THEN 1 END) AS sports_second_count,
      COUNT(CASE WHEN e.section = 'SPORTS' AND e.pos = 'THIRD' THEN 1 END) AS sports_third_count,
      -- Overall Medals
      COUNT(CASE WHEN e.pos = 'FIRST' THEN 1 END) AS first_count,
      COUNT(CASE WHEN e.pos = 'SECOND' THEN 1 END) AS second_count,
      COUNT(CASE WHEN e.pos = 'THIRD' THEN 1 END) AS third_count
    FROM public.teams t
    LEFT JOIN published_entries e ON e.team_id = t.id
    WHERE t.status = 'ACTIVE' OR t.status IS NULL
    GROUP BY t.id, t.name, t.color, t.code
  ),
  ranked_teams AS (
    SELECT
      ta.*,
      DENSE_RANK() OVER (
        ORDER BY ta.arts_total_points DESC, ta.arts_first_count DESC, ta.arts_second_count DESC, ta.arts_third_count DESC, ta.team_name ASC
      ) AS arts_rank,
      DENSE_RANK() OVER (
        ORDER BY ta.sports_total_points DESC, ta.sports_first_count DESC, ta.sports_second_count DESC, ta.sports_third_count DESC, ta.team_name ASC
      ) AS sports_rank,
      DENSE_RANK() OVER (
        ORDER BY ta.total_points DESC, ta.first_count DESC, ta.second_count DESC, ta.third_count DESC, ta.team_name ASC
      ) AS overall_rank
    FROM team_aggregates ta
  )
  SELECT
    -- Overall Leaderboard JSON
    jsonb_agg(
      jsonb_build_object(
        'teamId', team_id,
        'teamName', team_name,
        'teamColor', team_color,
        'teamCode', team_code,
        'artsStagePoints', arts_stage_points,
        'artsNonStagePoints', arts_non_stage_points,
        'artsTotalPoints', arts_total_points,
        'sportsTotalPoints', sports_total_points,
        'totalPoints', total_points,
        'artsFirstCount', arts_first_count,
        'artsSecondCount', arts_second_count,
        'artsThirdCount', arts_third_count,
        'sportsFirstCount', sports_first_count,
        'sportsSecondCount', sports_second_count,
        'sportsThirdCount', sports_third_count,
        'firstCount', first_count,
        'secondCount', second_count,
        'thirdCount', third_count,
        'artsRank', arts_rank,
        'sportsRank', sports_rank,
        'rank', arts_rank,
        'overallRank', overall_rank
      ) ORDER BY arts_rank ASC
    )
  INTO v_team_leaderboard_arts
  FROM ranked_teams;

  -- Sports Leaderboard JSON
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'teamId', team_id,
        'teamName', team_name,
        'teamColor', team_color,
        'teamCode', team_code,
        'sportsTotalPoints', sports_total_points,
        'sportsFirstCount', sports_first_count,
        'sportsSecondCount', sports_second_count,
        'sportsThirdCount', sports_third_count,
        'sportsRank', sports_rank,
        'rank', sports_rank
      ) ORDER BY sports_rank ASC
    )
  INTO v_team_leaderboard_sports
  FROM (
    SELECT * FROM jsonb_to_recordset(v_team_leaderboard_arts) AS x(
      "teamId" TEXT, "teamName" TEXT, "teamColor" TEXT, "teamCode" TEXT,
      "sportsTotalPoints" NUMERIC, "sportsFirstCount" INT, "sportsSecondCount" INT, "sportsThirdCount" INT, "sportsRank" INT
    )
  ) sub;

  v_team_leaderboard_overall := v_team_leaderboard_arts;

  -- =========================================================================
  -- B. CALCULATE INDIVIDUAL STUDENT CHAMPIONS (INDIVIDUAL PROGRAMS ONLY)
  -- =========================================================================
  WITH student_individual_entries AS (
    SELECT
      (entry->>'studentId') AS student_id,
      p.section,
      p.category,
      (entry->>'position') AS pos,
      (entry->>'grade') AS grd,
      COALESCE((entry->>'totalPoints')::numeric, 0) AS points
    FROM public.results r
    JOIN public.programs p ON p.id = r.program_id
    CROSS JOIN LATERAL jsonb_array_elements(r.entries) AS entry
    WHERE r.status = 'PUBLISHED'
      AND p.program_type = 'INDIVIDUAL'
      AND (entry->>'studentId') IS NOT NULL
      AND (
        (p.section = 'ARTS' AND v_arts_enabled) OR
        (p.section = 'SPORTS' AND v_sports_enabled)
      )
  ),
  student_scores AS (
    SELECT
      s.id AS student_id,
      s.name AS student_name,
      s.admission_no,
      s.chest_number,
      s.class_number,
      s.category,
      s.team_id,
      t.name AS team_name,
      t.color AS team_color,
      COALESCE(SUM(CASE WHEN e.section = 'ARTS' THEN e.points ELSE 0 END), 0) AS arts_points,
      COALESCE(SUM(CASE WHEN e.section = 'SPORTS' THEN e.points ELSE 0 END), 0) AS sports_points,
      COUNT(CASE WHEN e.pos = 'FIRST' THEN 1 END) AS first_count,
      COUNT(CASE WHEN e.pos = 'SECOND' THEN 1 END) AS second_count,
      COUNT(CASE WHEN e.pos = 'THIRD' THEN 1 END) AS third_count,
      COUNT(CASE WHEN e.grd = 'A' THEN 1 END) AS grade_a_count
    FROM public.students s
    LEFT JOIN public.teams t ON t.id = s.team_id
    LEFT JOIN student_individual_entries e ON e.student_id = s.id
    WHERE s.status = 'ACTIVE' OR s.status IS NULL
    GROUP BY s.id, s.name, s.admission_no, s.chest_number, s.class_number, s.category, s.team_id, t.name, t.color
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'studentId', student_id,
        'studentName', student_name,
        'admissionNo', admission_no,
        'chestNumber', chest_number,
        'classNumber', class_number,
        'category', category,
        'teamId', team_id,
        'teamName', team_name,
        'teamColor', team_color,
        'artsIndividualPoints', arts_points,
        'sportsIndividualPoints', sports_points,
        'firstCount', first_count,
        'secondCount', second_count,
        'thirdCount', third_count,
        'gradeACount', grade_a_count
      ) ORDER BY (arts_points + sports_points) DESC, first_count DESC, second_count DESC, grade_a_count DESC
    )
  INTO v_student_champions
  FROM student_scores
  WHERE (arts_points + sports_points) > 0;

  -- =========================================================================
  -- C. PUBLIC SUMMARY CARD JSON
  -- =========================================================================
  v_public_summary := jsonb_build_object(
    'totalCompetitions', v_total_programs,
    'publishedCompetitions', v_published_count,
    'totalStudents', v_total_students,
    'topArtsTeam', COALESCE(v_team_leaderboard_arts->0, '{}'::jsonb),
    'topSportsTeam', COALESCE(v_team_leaderboard_sports->0, '{}'::jsonb),
    'updatedAt', v_now
  );

  -- =========================================================================
  -- D. WRITE PRE-CALCULATED JSONB OBJECTS TO RESULT_CACHE TABLE
  -- =========================================================================
  INSERT INTO public.result_cache (cache_key, data, version, updated_at)
  VALUES ('team_leaderboard_arts', COALESCE(v_team_leaderboard_arts, '[]'::jsonb), 1, v_now)
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    version = public.result_cache.version + 1,
    updated_at = v_now;

  INSERT INTO public.result_cache (cache_key, data, version, updated_at)
  VALUES ('team_leaderboard_sports', COALESCE(v_team_leaderboard_sports, '[]'::jsonb), 1, v_now)
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    version = public.result_cache.version + 1,
    updated_at = v_now;

  INSERT INTO public.result_cache (cache_key, data, version, updated_at)
  VALUES ('team_leaderboard_overall', COALESCE(v_team_leaderboard_overall, '[]'::jsonb), 1, v_now)
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    version = public.result_cache.version + 1,
    updated_at = v_now;

  INSERT INTO public.result_cache (cache_key, data, version, updated_at)
  VALUES ('student_champions', COALESCE(v_student_champions, '[]'::jsonb), 1, v_now)
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    version = public.result_cache.version + 1,
    updated_at = v_now;

  INSERT INTO public.result_cache (cache_key, data, version, updated_at)
  VALUES ('public_summary', COALESCE(v_public_summary, '{}'::jsonb), 1, v_now)
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    version = public.result_cache.version + 1,
    updated_at = v_now;

  RETURN jsonb_build_object(
    'success', true,
    'publishedCount', v_published_count,
    'updatedAt', v_now
  );
END;
$$;

-- 5. TRANSACTIONAL RESULT SUBMISSION STORED PROCEDURE
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
  v_result_id TEXT;
  v_prog RECORD;
BEGIN
  -- Row-level lock program to avoid concurrent conflicting mark submissions
  SELECT * INTO v_prog FROM public.programs WHERE id = p_program_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  v_result_id := 'res_' || p_program_id;

  -- Insert or update result row atomically
  INSERT INTO public.results (
    id, program_id, program_name, section, category, program_type,
    status, submitted_by, submitted_at, published_at, entries, remarks, created_at
  )
  VALUES (
    v_result_id,
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

  -- If status is PUBLISHED, trigger immediate server-side leaderboard cache recalculation
  IF p_status = 'PUBLISHED' THEN
    PERFORM public.rebuild_all_result_cache();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'programId', p_program_id,
    'resultId', v_result_id,
    'status', p_status,
    'updatedAt', v_now
  );
END;
$$;

-- 6. GRANT RPC PERMISSIONS
GRANT EXECUTE ON FUNCTION public.rebuild_all_result_cache() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_program_result(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;

-- 7. ENSURE REALTIME ON RESULT_CACHE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'result_cache'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.result_cache;
  END IF;
END $$;
