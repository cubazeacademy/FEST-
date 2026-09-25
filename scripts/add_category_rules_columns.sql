-- ============================================================================
-- MIGRATION: Add granular candidate participation program limit rules to category_configs
-- ============================================================================

ALTER TABLE public.category_configs
ADD COLUMN IF NOT EXISTS min_individual_programs_per_student INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stage_programs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stage_programs INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS min_non_stage_programs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_non_stage_programs INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS min_sports_programs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_sports_programs INT DEFAULT 2;
