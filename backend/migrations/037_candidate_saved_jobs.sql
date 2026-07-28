-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 037 — candidate_saved_jobs (clean, EID-keyed, JWT-scoped)
--
-- Feature: Career Entry → Job Matching (P4). The page's "Saved Jobs" tab shipped
--   as a hard-coded fabricated list (Microsoft/DP World) and the heart/save icon
--   on match cards had no action — saving a job did nothing (data-honesty audit).
--
-- WHY a NEW table (not the existing saved_jobs): the legacy `saved_jobs` table is
--   drifted and unsafe — it exists in BOTH public and qa schemas with conflicting
--   column types (user_id is `integer` in one and `character` in another), and its
--   /api/jobs/*/save endpoints take user_id from the request body (not the JWT),
--   an open BOLA (any user can save/read/delete for any user_id). users.id is a
--   CHAR(15) Emirates ID, which does not fit the legacy integer user_id anyway.
--   A fresh table keyed on the EID with JWT-scoped endpoints avoids all of that.
--
-- PRECONDITION verified against live DB (dghr_prod @ 10.228.145.66:5454) on
--   2026-07-28: no `candidate_saved_jobs` table exists; job_postings.id is INTEGER
--   (public + qa); users.id is CHAR(15). job_id stored as TEXT and cast ::int on
--   join, mirroring how applications_api handles job_id.
--
-- Idempotent + transactional. Safe to run repeatedly.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(15) NOT NULL,   -- Emirates ID (users.id)
    job_id      TEXT        NOT NULL,   -- job_postings.id as text
    created_at  TIMESTAMP   DEFAULT NOW(),
    UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_saved_jobs_user ON candidate_saved_jobs (user_id);

COMMIT;

-- ── Verification (expected results) ────────────────────────────────────────
-- SELECT to_regclass('public.candidate_saved_jobs');            -- not null
-- SELECT count(*) FROM candidate_saved_jobs;                    -- 0 initially
-- \d candidate_saved_jobs  -- UNIQUE(user_id, job_id), user_id varchar(15)
