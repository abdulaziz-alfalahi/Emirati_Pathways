-- =============================================================================
-- 011 — Unique business-identity keys for companies (issue #99)
--
-- Companies were matched by exact name string in four find-or-create paths
-- (growth CSV import, check-companies dedupe, invitation redemption, and the
-- role-change flow in auth_manager_fixed), so any case or whitespace variant
-- of the same employer forked a shadow company row, splitting recruiters,
-- job postings and metrics.
--
-- The code now resolves companies through backend/company_identity.py:
-- trade licence number first, then the whitespace-collapsed case-folded
-- name. These two indexes make the DB enforce the same identity, so any
-- code path that still bypasses the helper fails loudly with a unique
-- violation instead of silently forking a duplicate.
--
-- The normalised-name expression here must stay textually identical to
-- NORMALIZED_NAME_SQL in backend/company_identity.py.
--
-- Precondition verified against the live DB (2026-07-21): 12 companies,
-- zero duplicate normalised names, zero duplicate trade licences, and
-- name = company_name on every row — both indexes apply cleanly. If a
-- future environment does contain duplicates, CREATE UNIQUE INDEX aborts
-- the transaction and this migration fails without changing anything:
-- merge the duplicates first (they are shadow companies by definition).
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_normalized_name
    ON public.companies (lower(regexp_replace(btrim(company_name), '\s+', ' ', 'g')));

CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_trade_license
    ON public.companies (btrim(trade_license_no))
    WHERE trade_license_no IS NOT NULL AND btrim(trade_license_no) <> '';

COMMIT;

-- Verification:
--   SELECT indexname FROM pg_indexes
--   WHERE tablename='companies'
--     AND indexname IN ('uq_companies_normalized_name',
--                       'uq_companies_trade_license');      -- expect 2 rows
--   INSERT INTO companies (company_name) VALUES ('  aMaZoN ');  -- must fail
