-- 103_null_placeholder_phone_zero.sql
--
-- Six users carry the literal string '0' in users.phone. It is a placeholder
-- written by an import, not a telephone number, and storing it as text has a
-- cost the empty string would not have.
--
-- WHY IT MATTERS RATHER THAN BEING MERELY UNTIDY
--
-- The UAE Pass callback matches a returning user by contact point when neither
-- the UAE Pass UUID nor the Emirates ID matches, and it REFUSES a match that is
-- ambiguous — two accounts sharing a value is not proof of ownership. Six
-- accounts sharing '0' makes those six mutually ambiguous with each other for
-- no reason at all. NULL is not shared: it drops out of the duplicate check
-- entirely, which is the correct meaning of "we do not have a phone number".
--
-- Found by backend/scripts/cutover_identity_check.py, which lists accounts that
-- would not survive the switch to production UAE Pass (owner asked 2026-09-01
-- whether board members onboarded on synthetic Emirates IDs would need
-- onboarding again). These six are NOT in that stranded set — they already hold
-- real Emirates IDs, so nothing about their sign-in depends on the phone. This
-- removes a latent trap rather than fixing a live break.
--
-- SCOPE, verified against dghr_prod 2026-09-01:
--   * exactly 6 rows have btrim(phone) = '0'
--   * they are the ONLY placeholder-shaped values in the column — a sweep for
--     non-numeric and all-zero values returned '0' and nothing else
--   * all six were created 2026-06-10 (and one 2026-07-03) by CRM import
--   * all six hold real (non-synthetic) Emirates IDs
--
-- The other duplicated contact points found in the same sweep are deliberately
-- NOT touched here: one shared email and two shared phone numbers belong to
-- DIFFERENT people, and one near-identical Emirates ID pair looks like the same
-- candidate entered twice with a mistyped id. Those need a person to decide
-- which value is correct; a migration must not guess at somebody's telephone
-- number or Emirates ID.

BEGIN;

-- Snapshot before the write. Six rows is small enough that there is no excuse
-- for not being able to put them back exactly as they were.
CREATE TABLE IF NOT EXISTS _backup_placeholder_phone_103 AS
SELECT id, phone, now() AS backed_up_at
  FROM users
 WHERE btrim(coalesce(phone, '')) = '0';

-- Idempotent by construction: after this runs, the WHERE clause matches nothing,
-- so a second run is a no-op rather than an error.
UPDATE users
   SET phone = NULL
 WHERE btrim(coalesce(phone, '')) = '0';

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0 — the placeholder is gone:
--   SELECT count(*) FROM users WHERE btrim(coalesce(phone, '')) = '0';
--
-- Expect 6 — the rows are recoverable:
--   SELECT count(*) FROM _backup_placeholder_phone_103;
--
-- Expect those 6 ids to have phone IS NULL now:
--   SELECT u.id, u.phone IS NULL AS cleared
--     FROM users u JOIN _backup_placeholder_phone_103 b ON b.id = u.id;
--
-- Expect the duplicate-phone groups to drop from 3 to 2:
--   SELECT btrim(phone) AS v, count(*) FROM users
--    WHERE btrim(coalesce(phone,'')) <> '' GROUP BY 1 HAVING count(*) > 1;
--
-- To restore:
--   UPDATE users u SET phone = b.phone
--     FROM _backup_placeholder_phone_103 b WHERE b.id = u.id;
