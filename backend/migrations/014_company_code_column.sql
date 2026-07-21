-- =============================================================================
-- 014 — Give company_code a destination column (issue #98)
--
-- The operator collects a company code, it is stored on company_invitations,
-- selected back, and displayed in the wizard — but companies had no
-- corresponding column, so it was dead data that looked like a persisted
-- external identifier. The redemption and import paths now write it through.
--
-- No uniqueness constraint: the code is an external identifier whose
-- registry semantics are not ours to enforce (unlike trade_license_no,
-- which is unique per migration 011).
--
-- Backfill: intentionally none. The live DB has zero redeemed invitations
-- carrying a company_code that could be attributed to a company row
-- (verified 2026-07-21: the one historical redemption was ZZ-E2E test data,
-- since cleaned up).
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS company_code VARCHAR(64);

COMMIT;

-- Verification:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name='companies' AND column_name='company_code';  -- 1 row
