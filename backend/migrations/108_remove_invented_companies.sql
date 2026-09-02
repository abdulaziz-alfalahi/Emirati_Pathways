-- 108_remove_invented_companies.sql
--
-- Remove nine invented companies and their workspaces, and clear the workspace
-- flags from the one real company that was provisioned during testing.
--
-- OWNER, 2026-09-02: "There are no companies onboarded on the platform yet...
-- the companies you see in the workspace tab are mock or invented during
-- testing." — and, asked whether to remove them: "clear them out".
--
-- WHAT THEY WERE
--
-- Airbus, Amazon, Google, HSBC, JPMorgan, Marriott, Microsoft, Pfizer and
-- Shell: nine foreign multinationals, none holding a UAE trade licence, all
-- with a workspace, and until migration 107 all marked is_verified = TRUE with
-- verified_by NULL — verified by a seed rather than by anyone. Because
-- publishing is gated on verification, they were until today the only employers
-- on the platform who could reach a candidate, while 269 companies holding
-- genuine trade licences could not.
--
-- Leaving them would mean the first real onboarding happens into a workspace
-- tab already full of companies that do not exist.
--
-- MATCHED ON NAME **AND** THE ABSENCE OF A TRADE LICENCE. A real "Amazon" with
-- a UAE licence would not be caught by this, which matters because these are
-- names real employers could plausibly register under.
--
-- PRECONDITION, verified against dghr_prod 2026-09-02:
--   * exactly 9 rows match; none has a trade licence; all are workspace_enabled
--   * they hold 13 dependent rows in total:
--       assessment_applications        2   ON DELETE NO ACTION -> deleted here
--       company_career_progressions    9   ON DELETE CASCADE
--       event_employers                2   ON DELETE CASCADE
--   * 2 company_team_members rows, both dev-login TEST accounts
--     (HR Manager 1, Zara Saeed) — the people are kept, only the membership goes
--   * 0 job_postings reference them, so no vacancy is removed
--
-- SEDDIQI HOLDING (L.L.C) IS NOT DELETED. It holds a real trade licence
-- (595724) and came from the employer import; only its workspace flags are
-- cleared, because that workspace was provisioned during testing rather than by
-- an approval. The company row stays exactly as it was.

BEGIN;

CREATE TEMP TABLE _invented ON COMMIT DROP AS
SELECT id FROM companies
 WHERE company_name IN ('Airbus', 'Amazon', 'Google', 'HSBC', 'JPMorgan',
                        'Marriott', 'Microsoft', 'Pfizer', 'Shell')
   AND (trade_license_no IS NULL OR trade_license_no = '');

-- Snapshots. Nine companies is small, and "it was only test data" is not a
-- reason to make a delete unrecoverable.
CREATE TABLE IF NOT EXISTS _backup_invented_companies_108 AS
SELECT c.* FROM companies c JOIN _invented i ON i.id = c.id;

CREATE TABLE IF NOT EXISTS _backup_invented_members_108 AS
SELECT m.* FROM company_team_members m JOIN _invented i ON i.id::text = m.company_id::text;

CREATE TABLE IF NOT EXISTS _backup_invented_assessments_108 AS
SELECT a.* FROM assessment_applications a JOIN _invented i ON i.id::text = a.company_id::text;

CREATE TABLE IF NOT EXISTS _backup_invented_progressions_108 AS
SELECT p.* FROM company_career_progressions p JOIN _invented i ON i.id::text = p.company_id::text;

CREATE TABLE IF NOT EXISTS _backup_invented_event_employers_108 AS
SELECT e.* FROM event_employers e JOIN _invented i ON i.id::text = e.company_id::text;

-- The one real company whose workspace was a test artefact.
CREATE TABLE IF NOT EXISTS _backup_seddiqi_workspace_108 AS
SELECT id, company_name, workspace_enabled, workspace_slug, workspace_admin_id,
       provisioned_by, provisioned_at
  FROM companies
 WHERE trade_license_no = '595724' AND workspace_enabled IS TRUE;

-- Dependents that do not cascade, then the memberships, then the parents.
DELETE FROM assessment_applications
 WHERE company_id::text IN (SELECT id::text FROM _invented);

DELETE FROM company_team_members
 WHERE company_id::text IN (SELECT id::text FROM _invented);

-- company_career_progressions and event_employers cascade with the company.
DELETE FROM companies WHERE id IN (SELECT id FROM _invented);

-- Clear the test-provisioned workspace from the real company. The company row
-- is otherwise untouched, and it will be provisioned properly when an operator
-- approves it.
UPDATE companies
   SET workspace_enabled = FALSE,
       workspace_slug = NULL,
       workspace_admin_id = NULL,
       provisioned_by = NULL,
       provisioned_at = NULL
 WHERE trade_license_no = '595724' AND workspace_enabled IS TRUE;

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0 — the invented companies are gone:
--   SELECT count(*) FROM companies
--    WHERE company_name IN ('Airbus','Amazon','Google','HSBC','JPMorgan',
--                           'Marriott','Microsoft','Pfizer','Shell');
--
-- Expect 0 — the workspace tab is genuinely empty, which is the honest starting
-- state for real onboarding:
--   SELECT count(*) FROM companies WHERE workspace_enabled;
--
-- Expect 269 — every company holding a real trade licence is untouched:
--   SELECT count(*) FROM companies
--    WHERE trade_license_no IS NOT NULL AND trade_license_no <> '';
--
-- Expect 9 / 2 — recoverable:
--   SELECT (SELECT count(*) FROM _backup_invented_companies_108) AS companies,
--          (SELECT count(*) FROM _backup_invented_members_108)   AS members;
--
-- Expect the two test accounts to still EXIST — only their membership went:
--   SELECT id, email FROM users WHERE id IN ('784000000000120','784000000000210');
--
-- To restore, parents first:
--   INSERT INTO companies SELECT * FROM _backup_invented_companies_108;
--   INSERT INTO company_team_members SELECT * FROM _backup_invented_members_108;
--   INSERT INTO assessment_applications SELECT * FROM _backup_invented_assessments_108;
--   INSERT INTO company_career_progressions SELECT * FROM _backup_invented_progressions_108;
--   INSERT INTO event_employers SELECT * FROM _backup_invented_event_employers_108;
--   UPDATE companies c SET workspace_enabled = b.workspace_enabled,
--          workspace_slug = b.workspace_slug, workspace_admin_id = b.workspace_admin_id
--     FROM _backup_seddiqi_workspace_108 b WHERE b.id = c.id;
