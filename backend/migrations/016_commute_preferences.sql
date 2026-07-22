-- =============================================================================
-- 016 — Candidate commute/work-mode preferences (issue #32)
--
-- The candidate-set preference axis of #32: max acceptable commute and
-- remote-preferred, alongside the existing willing_to_relocate. These are
-- DISPLAY/FILTER inputs for recruiters only — per the owner's scoring
-- rules (#12) they must never feed either match score, and no code path
-- reads them into scoring.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

ALTER TABLE public.candidate_profiles
    ADD COLUMN IF NOT EXISTS max_commute_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS remote_preferred BOOLEAN;

COMMIT;

-- Verification:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='candidate_profiles'
--     AND column_name IN ('max_commute_minutes','remote_preferred');  -- 2 rows
