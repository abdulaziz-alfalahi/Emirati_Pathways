-- 104_remove_redundant_test_persona.sql
--
-- Delete one invented test persona: "Khalid Al Mansouri"
-- (khalid@test.ehrdc.ae, 784000000000200).
--
-- WHY
--
-- Owner, 2026-09-01, looking at Admin Dashboard -> Operators: "These operators
-- are invented. Please review and delete them if doing so would cause no harm."
--
-- They are invented — they are the dev-login fleet (migration 073), one account
-- per role under invented Emirati names. Deleting most of them WOULD cause
-- harm: dev-login refuses any account not flagged is_test_account, there is no
-- password login on this platform, and four of the five the owner pointed at
-- are the ONLY test account for their role (assessor, board_member,
-- call_center_agent, talent_operator). Removing those ends the ability to
-- verify those roles end to end.
--
-- This one is the exception. It is a redundant recruiter persona: three others
-- remain (dev.recruiter@, hr.recruiter@, zara.saeed@), and its `admin`
-- secondary role is held by nine other accounts. Nothing loses coverage.
--
-- The rest of the fleet stays and is now MARKED instead — the staff directory
-- reports is_test_account and the screen shows a TEST badge, which is the
-- actual fix for "these read as real people".
--
-- WHAT IT HOLDS, verified against dghr_prod 2026-09-01:
--
--   candidate_profiles  1    notifications  14
--   messages            1    user_cvs       14
--
--   * 0 vacancies created, 0 company memberships, 0 interviews as recruiter
--   * the single message ("Salam", 2026-05-05) has a recipient_id that resolves
--     to NO user, so removing it takes nothing out of a real person's thread
--   * 0 messages received
--
-- All four foreign keys are ON DELETE NO ACTION, so the dependent rows must go
-- first and in order. Every one is snapshotted before it does.

BEGIN;

-- Snapshots first. A test persona is still 30 rows of state, and "it was only
-- a test account" is not a reason to make a delete unrecoverable.
CREATE TABLE IF NOT EXISTS _backup_test_persona_user_104 AS
SELECT * FROM users WHERE id = '784000000000200';

CREATE TABLE IF NOT EXISTS _backup_test_persona_profiles_104 AS
SELECT * FROM candidate_profiles WHERE user_id = '784000000000200';

CREATE TABLE IF NOT EXISTS _backup_test_persona_messages_104 AS
SELECT * FROM messages WHERE sender_id = '784000000000200';

CREATE TABLE IF NOT EXISTS _backup_test_persona_notifications_104 AS
SELECT * FROM notifications WHERE user_id = '784000000000200';

CREATE TABLE IF NOT EXISTS _backup_test_persona_cvs_104 AS
SELECT * FROM user_cvs WHERE user_id = '784000000000200';

-- Dependents before the parent; each is idempotent by its own WHERE clause.
DELETE FROM user_cvs           WHERE user_id   = '784000000000200';
DELETE FROM notifications      WHERE user_id   = '784000000000200';
DELETE FROM messages           WHERE sender_id = '784000000000200';
DELETE FROM candidate_profiles WHERE user_id   = '784000000000200';

DELETE FROM users WHERE id = '784000000000200';

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0 — the persona is gone:
--   SELECT count(*) FROM users WHERE id = '784000000000200';
--
-- Expect 1 / 1 / 1 / 14 / 14 — everything is recoverable:
--   SELECT (SELECT count(*) FROM _backup_test_persona_user_104)          AS usr,
--          (SELECT count(*) FROM _backup_test_persona_profiles_104)      AS prof,
--          (SELECT count(*) FROM _backup_test_persona_messages_104)      AS msg,
--          (SELECT count(*) FROM _backup_test_persona_notifications_104) AS notif,
--          (SELECT count(*) FROM _backup_test_persona_cvs_104)           AS cvs;
--
-- Expect 23 — the rest of the dev-login fleet is untouched:
--   SELECT count(*) FROM users WHERE is_test_account IS TRUE;
--
-- Expect 3 test recruiters to remain:
--   SELECT email FROM users
--    WHERE is_test_account IS TRUE
--      AND (role = 'recruiter' OR secondary_roles::text LIKE '%recruiter%');
--
-- To restore, parent first, then the dependents:
--   INSERT INTO users SELECT * FROM _backup_test_persona_user_104;
--   INSERT INTO candidate_profiles SELECT * FROM _backup_test_persona_profiles_104;
--   INSERT INTO messages          SELECT * FROM _backup_test_persona_messages_104;
--   INSERT INTO notifications     SELECT * FROM _backup_test_persona_notifications_104;
--   INSERT INTO user_cvs          SELECT * FROM _backup_test_persona_cvs_104;
