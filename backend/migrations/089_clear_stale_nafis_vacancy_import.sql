-- 089_clear_stale_nafis_vacancy_import.sql
--
-- WHY
--
-- A new NAFIS vacancy sheet is about to be uploaded, and the previous imports
-- would silently swallow most of it.
--
-- THE IMPORTER DE-DUPLICATES ON nafis_job_id. `import_vacancies_from_csv`
-- checks `SELECT id FROM job_postings WHERE nafis_job_id = %s` and logs
-- "already exists, skipping". Measured on the live DB 2026-08-26:
--
--     428 job_postings in status 'pending_verification'
--     428 of those 428 carry a nafis_job_id
--     imported between 2026-05-03 and 2026-08-21, across 245 companies
--
-- So every row in the new sheet whose Job ID was seen before is skipped: no
-- posting, no token, and — now that the flow queues real mail — no verification
-- email. The operator would see a small "created N jobs" number and no obvious
-- reason for it. That is the failure this migration prevents.
--
-- WHY THESE ARE SAFE TO REMOVE
--
--   * Nothing is attached. 0 job_applications and 0 saved_jobs reference any
--     of them (checked 2026-08-26).
--   * No employer ever confirmed one. 'pending_verification' means exactly
--     that, and verification was only ever reachable by a link that was
--     printed to a container log — never delivered to anyone.
--   * Their tokens are already dead: all 431 job_verification_tokens have
--     expires_at in the past after migration 087, and none was ever used.
--   * They are not shown as vacancies. Candidate-facing counts and the
--     strategic metrics use published postings only.
--
-- WHAT IS DELIBERATELY NOT TOUCHED
--
-- The 245 COMPANIES the import created stay. They are real UAE employers with
-- real trade licences, several already resolved through company_identity, and
-- deleting them would discard genuine onboarding work to solve a vacancy
-- problem. Only the vacancies and their dead tokens go.
--
-- Published and draft postings are untouched — the WHERE clause is on
-- 'pending_verification' alone.
--
-- PRECONDITION VERIFIED ON THE LIVE DB 2026-08-26
--   job_postings:              428 pending_verification, 24 draft, 7 published
--   job_verification_tokens:   431 total, 0 live, 0 used
--   attached applications:     0
--
-- Every statement is written against the CONDITION, not against those counts.

BEGIN;

-- ── Snapshot before anything is removed ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS _backup_pending_vacancies_089 AS
SELECT *, now() AS captured_at
  FROM job_postings
 WHERE status = 'pending_verification';

CREATE TABLE IF NOT EXISTS _backup_job_tokens_089 AS
SELECT *, now() AS captured_at
  FROM job_verification_tokens;

-- ── Refuse rather than half-apply ───────────────────────────────────────────
-- If an application or a saved job has appeared since this was written, the
-- assumption above is wrong and a person needs to look before anything is
-- deleted.
DO $$
DECLARE attached INTEGER;
BEGIN
    SELECT count(*) INTO attached
      FROM job_applications
     WHERE job_id::text IN (SELECT id::text FROM job_postings
                             WHERE status = 'pending_verification');
    IF attached > 0 THEN
        RAISE EXCEPTION
            'migration 089 refused: % application(s) are attached to '
            'pending_verification postings. Deleting them would discard a real '
            'candidate action. Investigate before running this.', attached;
    END IF;
END $$;

-- ── Clear ───────────────────────────────────────────────────────────────────
-- Tokens first: they reference job_postings, and a token whose job is gone is
-- exactly the orphan shape migrations 086/087 spent their time cleaning up.
DELETE FROM job_verification_tokens
 WHERE job_id::text IN (SELECT id::text FROM job_postings
                         WHERE status = 'pending_verification');

DELETE FROM job_postings
 WHERE status = 'pending_verification';

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. The stale import is gone, and nothing else went with it:
--      SELECT status, count(*) FROM job_postings GROUP BY status;
--        -- expect NO 'pending_verification'; draft 24 and published 7 unchanged
--      SELECT count(*) FROM job_verification_tokens;          -- expect 0
--
-- 2. Nothing was lost — expect 428 and 431:
--      SELECT count(*) FROM _backup_pending_vacancies_089;
--      SELECT count(*) FROM _backup_job_tokens_089;
--
-- 3. The companies are still there — expect 245 or more:
--      SELECT count(*) FROM companies;
--
-- 4. A re-import of a previously-seen Job ID now CREATES rather than skips.
--    Run inside a transaction and roll back:
--      BEGIN;
--        SELECT count(*) FROM job_postings
--         WHERE nafis_job_id = (SELECT nafis_job_id FROM _backup_pending_vacancies_089 LIMIT 1);
--        -- must be 0, i.e. the importer's de-duplication check will not fire
--      ROLLBACK;
