-- =============================================================================
-- 009 — Audit columns for the company approval gate  (issue #96)
--
-- `companies.is_verified` becomes load-bearing: the job-posting publish
-- paths (hr_job_posting_routes._unverified_company_block) refuse to publish
-- for unverified companies, and operators flip the flag via
-- POST /api/growth/companies/<id>/verify.
--
-- An approval that gates marketplace exposure needs an audit trail, so this
-- records WHO approved and WHEN. No data is modified — columns only —
-- which is also why there is no backup table here, unlike 006–008.
--
-- Note: every existing company keeps its current is_verified value. On
-- staging, 9 of 12 companies are seeded with workspace_enabled but only a
-- minority are verified — companies that were never explicitly approved
-- remain unverified and their recruiters cannot publish until an operator
-- approves them. That is the intended effect of the gate, not a migration
-- side-effect.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS verified_by VARCHAR(50);

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

COMMIT;

-- Verification:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'companies' AND column_name IN ('verified_by','verified_at');
--   -- expect 2 rows
