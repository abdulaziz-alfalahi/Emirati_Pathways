-- 073: mark which accounts may be signed into without a credential
--
-- WHY: `dev-login` mints a session for ANY of the 5,336 users with no
-- credential at all. PR #434 made it reachable only from the host, which
-- removes the public exposure but not the real defect: it can still mint a
-- session for a REAL person, and the resulting audit row is indistinguishable
-- from that person's own login. That is not theoretical — on 2026-08-19 a
-- verification call minted a token as the platform owner's account and read two
-- candidate records, and `admin_audit_log` shows the owner performing that read
-- permanently, because migration 002 makes the table append-only.
--
-- The fix is scope, not ceremony. When dev-login can only target an account
-- that exists purely for testing, the audit row saying "coach@test.ehrdc.ae did
-- X" is TRUE — nobody is misrepresented, because nobody is behind that account.
-- An impersonation feature was scoped and then deliberately NOT built: it would
-- have added a capability to govern where removing one was sufficient.
--
-- WHAT THIS ALSO BUYS: dev-login stops being a cutover blocker. Restricted to
-- flagged accounts it structurally cannot touch a citizen's record, so it can
-- survive the NAFIS load rather than having to be deleted before it.
--
-- THE MARKING CRITERION, and why it is two conditions and not one:
--   email ILIKE '%@test.ehrdc.ae'  — a non-routable internal domain, used only
--                                    for purpose-built persona accounts;
--   AND uaepass_uuid IS NULL       — has never completed a real UAE Pass login.
-- Either alone would be too loose. A real person could in principle be given a
-- @test.ehrdc.ae address; a synthetic account could in principle be logged into
-- via UAE Pass. Requiring both means an account only qualifies while it remains
-- what it claims to be.
--
-- DELIBERATELY NOT an EID-pattern rule. Matching '7840000000000%' would quietly
-- become "any account that looks synthetic" — and every national's EID is
-- synthetic today (the 784000000000… range) until UAE Pass supplies real ones.
-- That rule would eventually match real citizens as the roster grows.
--
-- New accounts default to FALSE. Marking one is an administrator's deliberate
-- act, never inferred.
--
-- PRECONDITION (verified live 2026-08-19): users has 5,336 rows; 24 match the
-- criterion below, covering one account per platform role; 0 of those 24 have a
-- uaepass_uuid; no is_test_account column exists.

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN users.is_test_account IS
    'TRUE only for accounts that exist purely to test the platform. dev-login '
    'refuses any target where this is not TRUE, so a session can never be '
    'minted for a real person without their credential. Set deliberately by an '
    'administrator — never inferred from an email or EID pattern.';

-- Snapshot before the only data-touching statement, per house rule.
CREATE TABLE IF NOT EXISTS _backup_users_test_flag_073 AS
    SELECT id, email, uaepass_uuid, NOW() AS captured_at
      FROM users
     WHERE email ILIKE '%@test.ehrdc.ae';

UPDATE users
   SET is_test_account = TRUE
 WHERE email ILIKE '%@test.ehrdc.ae'
   AND uaepass_uuid IS NULL;

-- Refuse to proceed if the marking caught more than the known persona set. A
-- silent over-match here would hand dev-login a real account, which is the one
-- outcome this migration exists to prevent.
DO $$
DECLARE
    marked INTEGER;
BEGIN
    SELECT COUNT(*) INTO marked FROM users WHERE is_test_account IS TRUE;
    IF marked > 30 THEN
        RAISE EXCEPTION
            'is_test_account marked % accounts — expected ~24. Refusing.', marked;
    END IF;
    RAISE NOTICE 'is_test_account set on % accounts', marked;
END $$;

COMMIT;

-- Verification:
--   SELECT count(*) FROM users WHERE is_test_account;                 -- expect 24
--   SELECT count(*) FROM users WHERE is_test_account AND uaepass_uuid IS NOT NULL;
--   -- expect 0: no account that has really logged in may be a test account
--   SELECT id, email, role FROM users WHERE is_test_account ORDER BY role;
--
-- To mark another account later (deliberate, one at a time):
--   UPDATE users SET is_test_account = TRUE WHERE id = '7840000000000XX';
