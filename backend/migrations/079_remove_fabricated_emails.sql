-- 079: remove fabricated @example.com email addresses from users
--
-- WHY: backend/scripts/migrate_crm_candidates.py created every account with
--
--     f"{eid}@example.com"
--
-- 1,046 live accounts carry one. Nothing was ever sent to them — example.com is
-- reserved by IANA precisely so it cannot receive mail — but that is luck, not
-- design. The address is indistinguishable from a real one to every query,
-- export and operator on the platform: a CRM screen shows it as the person's
-- email, and an operator reading "784198640525865@example.com" has no way to
-- know the platform invented it.
--
-- A BLANK FIELD IS HONEST AND A FABRICATED ONE IS NOT. "We do not have an email
-- for this person" is a fact an operator can act on — ask for one. A made-up
-- address is a silent dead end that looks like data.
--
-- NULL IS ALREADY THE NORMAL STATE HERE: 32,053 of 38,336 users have no email,
-- so nothing in the application depends on the column being populated, and
-- idx_users_email is a plain btree, not unique. Emptying these is not a new
-- shape of row.
--
-- 72 ARE RECOVERABLE. The CRM roster (nafis_job_seekers) holds a real address
-- for 72 of these people. Those are restored rather than blanked — the platform
-- had the true value all along and was displaying its own invention over it.
--
-- NOT LOAD-BEARING: none of the 1,046 has a password, a UAE Pass identity, or
-- is a test account. Twenty have a last_login, all from seeded demo identities
-- (784111100000xxx) signing in before dev-login was restricted to test
-- accounts; email is not a login route on this platform, so removing it cannot
-- lock anyone out.
--
-- PRECONDITION (verified live 2026-08-21): 1,046 users match
-- '%@example.com'; users.email is nullable; idx_users_email is non-unique;
-- 72 have a recoverable address in nafis_job_seekers.

BEGIN;

-- Snapshot before anything is changed, per house rule.
CREATE TABLE IF NOT EXISTS _backup_fabricated_emails_079 AS
    SELECT id, email AS fabricated_email, NOW() AS captured_at
      FROM users
     WHERE email LIKE '%@example.com';

-- 1. Restore the real address where the CRM roster holds one.
UPDATE users u
   SET email = n.email,
       updated_at = NOW()
  FROM nafis_job_seekers n
 WHERE n.emirates_id = u.id
   AND u.email LIKE '%@example.com'
   AND n.email IS NOT NULL
   AND n.email NOT LIKE '%@example.com'
   AND POSITION('@' IN n.email) > 1;

-- 2. Blank the rest. NULL, not empty string: the column already uses NULL for
--    "not known" on 32,053 rows, and two spellings of absent is how a filter
--    starts missing people.
UPDATE users
   SET email = NULL,
       updated_at = NOW()
 WHERE email LIKE '%@example.com';

DO $$
DECLARE
    remaining INTEGER;
    restored INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining FROM users WHERE email LIKE '%@example.com';
    IF remaining <> 0 THEN
        RAISE EXCEPTION 'expected no fabricated addresses to survive, found %. Refusing.', remaining;
    END IF;
    SELECT COUNT(*) INTO restored
      FROM _backup_fabricated_emails_079 b
      JOIN users u ON u.id = b.id
     WHERE u.email IS NOT NULL;
    RAISE NOTICE 'fabricated addresses cleared; % restored from the CRM roster, % blanked',
                 restored, (SELECT COUNT(*) FROM _backup_fabricated_emails_079) - restored;
END $$;

COMMIT;

-- Verification:
--   SELECT count(*) FROM users WHERE email LIKE '%@example.com';   -- expect 0
--   SELECT count(*) FROM _backup_fabricated_emails_079;            -- expect 1046
--   SELECT count(*) FROM _backup_fabricated_emails_079 b
--     JOIN users u ON u.id = b.id WHERE u.email IS NOT NULL;       -- expect 72
--
-- To undo:
--   UPDATE users u SET email = b.fabricated_email
--     FROM _backup_fabricated_emails_079 b WHERE b.id = u.id;
