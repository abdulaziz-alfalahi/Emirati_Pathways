-- Migration 029: Candidate consolidation (Phase A of the identity-model rework)
--
-- WHY (owner design session 2026-07-24): collapse the redundant `job_seeker` role
-- into the single workforce role `candidate` (today 4,092 candidate vs 1 job_seeker),
-- and replace the four scattered visibility flags (users.is_visible,
-- users.available_for_recruitment, users.employment_status, candidate_profiles
-- .work_status) with ONE authoritative pair on users:
--   * availability_status ∈ {job_seeking, open_to_opportunities, not_visible}
--       — the single driver of recruiter visibility
--   * currently_employed  boolean — orthogonal employment fact (lets us express
--       "employed but open to opportunities", the valuable passive candidate)
--
-- PRECONDITION verified live 2026-07-24: users.role has 1 'job_seeker' + 1 in
-- secondary_roles; users has is_visible/available_for_recruitment (all TRUE) and
-- employment_status (uniformly 'job_seeker' — a legacy default, ignored for backfill);
-- candidate_profiles.work_status carries the real signal (Working 725 / Not Working
-- 2436 / NULL 902 / Retired 31). users.id is char(15); user_type mirrors role (#93).
--
-- SAFETY: snapshots the changed user columns into _backup_users_ident_029 before the
-- UPDATEs. Column adds are IF NOT EXISTS; the backfill is guarded to only touch rows
-- still at the 'job_seeking' default, so re-running never clobbers user-set values.
-- Backfill preserves everyone's CURRENT visibility (all become job_seeking or
-- open_to_opportunities — nobody is hidden). Legacy flags are KEPT (deprecated) until
-- the new field is verified in production; a later migration drops them.

BEGIN;

-- 0. Snapshot the columns we mutate.
CREATE TABLE IF NOT EXISTS _backup_users_ident_029 AS
    SELECT id, role, user_type, secondary_roles, employment_status,
           is_visible, available_for_recruitment
    FROM users;

-- 1. Collapse job_seeker -> candidate (role + user_type mirror + secondary_roles).
UPDATE users SET role = 'candidate' WHERE role = 'job_seeker';
UPDATE users SET user_type = 'candidate' WHERE user_type = 'job_seeker';
UPDATE users SET secondary_roles = (
        SELECT COALESCE(jsonb_agg(DISTINCT CASE WHEN e = 'job_seeker' THEN 'candidate' ELSE e END), '[]'::jsonb)
        FROM jsonb_array_elements_text(secondary_roles) e)
    WHERE secondary_roles IS NOT NULL AND secondary_roles::text ILIKE '%job_seeker%';

-- 2. New authoritative availability pair.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'job_seeking',
    ADD COLUMN IF NOT EXISTS currently_employed  BOOLEAN     DEFAULT FALSE;

-- 3. Backfill from candidate_profiles.work_status (guarded to defaults only).
UPDATE users u SET
        currently_employed  = (cp.work_status = 'Working'),
        availability_status = CASE
            WHEN cp.work_status IN ('Working', 'Retired') THEN 'open_to_opportunities'
            ELSE 'job_seeking'   -- 'Not Working' / NULL
        END
    FROM candidate_profiles cp
    WHERE cp.user_id = u.id AND u.availability_status = 'job_seeking';

COMMIT;

-- Verification (expected):
--   SELECT count(*) FROM users WHERE role = 'job_seeker';                    -> 0
--   SELECT column_name FROM information_schema.columns WHERE table_name='users'
--     AND column_name IN ('availability_status','currently_employed');       -> 2
--   SELECT availability_status, count(*) FROM users GROUP BY 1;
--       -> job_seeking ~3338+, open_to_opportunities ~756  (all visible)
--   SELECT count(*) FROM users WHERE currently_employed;                     -> ~725
--   SELECT count(*) FROM _backup_users_ident_029;                            -> 4117
