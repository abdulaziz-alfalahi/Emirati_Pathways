-- 105_remove_cluster_verification_fixtures.sql
--
-- Remove the 24 ZZ-/UAT- persona-cluster verification fixtures, and the one
-- draft vacancy created alongside them.
--
-- WHY
--
-- Owner, 2026-09-01, looking at Admin Dashboard -> Operators. These are test
-- accounts from the per-cluster persona verification of July 2026 — C1
-- employer/hiring, C2 assessment, C3 mentorship/coaching, C4 governance — and
-- they were never cleaned up. CLAUDE.md requires exactly that of all ZZ- data.
--
-- THEY ARE NOT THE DEV-LOGIN FLEET, and the distinction is the whole point.
-- Two sets of invented people exist and they look identical on that screen:
--
--   dev-login fleet     is_test_account = TRUE,  ids 7840000…,  @test.ehrdc.ae
--                       KEEP. dev-login refuses any account without the flag,
--                       there is no password login on this platform, and most
--                       are the ONLY account for their role. Deleting them ends
--                       end-to-end verification for that role. They are marked
--                       with a TEST badge instead (PR #569).
--
--   cluster fixtures    is_test_account = FALSE, ids 784111100000…, ZZ-/UAT-
--                       THIS MIGRATION. No dev-login capability, so removing
--                       them costs no testing.
--
-- Verified immediately before writing this, 2026-09-01:
--   * 24 fixtures match; 0 of them are also flagged is_test_account
--   * the dev-login fleet stays at 23 accounts covering 18 distinct roles
--   * the fixtures hold 120 rows: notifications 108, candidate_profiles 7,
--     admin_audit_log 3, user_cvs 2
--   * 0 interviews, 0 messages sent, 0 messages received, 0 company memberships
--     — nothing they hold is visible to a real person
--   * job_postings id 76 "ZZ-C2 Backend Engineer" is a DRAFT with 0 saved_jobs
--
-- Matching is on COALESCE(full_name, first || ' ' || last) DELIBERATELY: several
-- of these carry their name in first_name/last_name, and a search on full_name
-- alone finds 1 of the 24.
--
-- All foreign keys involved are ON DELETE NO ACTION, so dependents go first.
--
-- ONE FIXTURE IS DELIBERATELY KEPT: 784111100000002 (ZZ-UAT Hana AlMansoori).
-- admin_audit_log is APPEND-ONLY — a trigger, admin_audit_log_no_mutate(),
-- raises on DELETE — and fk_admin_audit_log_user then makes the user row
-- undeletable while its 3 audit entries stand. That is the protection working
-- as designed: an audit trail exists so that what somebody did cannot be
-- erased, and "it was only a fixture" is exactly the argument it must refuse.
-- Rather than drop the constraint or weaken the trigger, this migration excludes
-- any fixture that appears in the audit log. 23 of the 24 go; that one stays,
-- named ZZ- so it still describes itself.

BEGIN;

-- Freeze the target set once, so every statement below acts on exactly the same
-- rows even though the users table is written to by other sessions.
CREATE TEMP TABLE _fixture_ids ON COMMIT DROP AS
SELECT id FROM users u
 WHERE COALESCE(u.full_name, NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '')) ~* '^(ZZ-|UAT-)'
   AND u.is_test_account IS NOT TRUE     -- belt and braces: never the dev-login fleet
   -- and never a user the append-only audit log still has evidence about
   AND NOT EXISTS (SELECT 1 FROM admin_audit_log a WHERE a.user_id = u.id);

-- Snapshots. "It was only test data" is not a reason to make this unrecoverable.
CREATE TABLE IF NOT EXISTS _backup_fixture_users_105 AS
SELECT u.* FROM users u JOIN _fixture_ids f ON f.id = u.id;

CREATE TABLE IF NOT EXISTS _backup_fixture_profiles_105 AS
SELECT p.* FROM candidate_profiles p JOIN _fixture_ids f ON f.id = p.user_id;

CREATE TABLE IF NOT EXISTS _backup_fixture_notifications_105 AS
SELECT n.* FROM notifications n JOIN _fixture_ids f ON f.id = n.user_id;

CREATE TABLE IF NOT EXISTS _backup_fixture_cvs_105 AS
SELECT c.* FROM user_cvs c JOIN _fixture_ids f ON f.id = c.user_id;

CREATE TABLE IF NOT EXISTS _backup_fixture_vacancy_105 AS
SELECT * FROM job_postings WHERE id = 76;

-- Dependents, then the parents.
DELETE FROM user_cvs          WHERE user_id IN (SELECT id FROM _fixture_ids);
DELETE FROM notifications     WHERE user_id IN (SELECT id FROM _fixture_ids);
DELETE FROM candidate_profiles WHERE user_id IN (SELECT id FROM _fixture_ids);

DELETE FROM job_postings WHERE id = 76;

DELETE FROM users WHERE id IN (SELECT id FROM _fixture_ids);

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 1 — only the audit-log-referenced fixture remains:
--   SELECT id, full_name FROM users
--    WHERE COALESCE(full_name, CONCAT(first_name,' ',last_name)) ~* '^(ZZ-|UAT-)';
--
-- Expect 23 — recoverable:
--   SELECT count(*) FROM _backup_fixture_users_105;
--
-- Expect 23 — THE DEV-LOGIN FLEET IS UNTOUCHED. This is the assertion that
-- matters; if it is not 23, roll back from the snapshots immediately:
--   SELECT count(*) FROM users WHERE is_test_account IS TRUE;
--
-- Expect 18 — every role still reachable for end-to-end verification:
--   SELECT count(DISTINCT role) FROM users WHERE is_test_account IS TRUE;
--
-- Expect 0 — the draft vacancy is gone:
--   SELECT count(*) FROM job_postings WHERE id = 76;
--
-- To restore, parents first then dependents:
--   INSERT INTO users              SELECT * FROM _backup_fixture_users_105;
--   INSERT INTO job_postings       SELECT * FROM _backup_fixture_vacancy_105;
--   INSERT INTO candidate_profiles SELECT * FROM _backup_fixture_profiles_105;
--   INSERT INTO notifications      SELECT * FROM _backup_fixture_notifications_105;
--   INSERT INTO user_cvs           SELECT * FROM _backup_fixture_cvs_105;
