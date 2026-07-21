-- =============================================================================
-- 013 — Canonicalise users.email and users.phone (issue #95)
--
-- UAE Pass sign-in matches accounts by email and phone, but the table
-- predates canonicalisation: 43 rows carry mixed-case/padded emails and
-- phones appear as '9715…', '05…', '+971…' or a literal '0'. The code now
-- canonicalises on write and matches legacy variants on read
-- (backend/utils/contact_identity.py); this migration normalises the stored
-- data so the variant-matching becomes belt-and-braces rather than
-- load-bearing.
--
-- Canonical forms: email lower(btrim(…)); phone digits-only '9715XXXXXXXX'.
-- Junk phones (fewer than 9 significant digits, e.g. the seven '0' rows)
-- become NULL — they can never match a real number and '00000000' sentinels
-- collide with each other.
--
-- Precondition verified against the live DB (2026-07-21): zero email pairs
-- differing only in case/whitespace, so the email UPDATE cannot merge two
-- accounts' addresses. Snapshot taken first.
--
-- Idempotent: safe to run repeatedly (re-runs find nothing to change).
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS _backup_contact_points_013 AS
SELECT id, email, phone FROM users
WHERE (email IS NOT NULL AND email <> lower(btrim(email)))
   OR (phone IS NOT NULL AND phone <> '' AND phone !~ '^971[0-9]{9}$');

-- Guard: abort if canonicalising emails would collide two accounts.
DO $$
BEGIN
    IF EXISTS (
        SELECT lower(btrim(email)) FROM users WHERE email IS NOT NULL
        GROUP BY 1 HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'duplicate emails differing only in case/whitespace — merge accounts before running 013';
    END IF;
END $$;

UPDATE users SET email = lower(btrim(email))
WHERE email IS NOT NULL AND email <> lower(btrim(email));

-- Phones: strip non-digits, fold 00971/971/leading-0 prefixes, require 9
-- significant digits, store as 971XXXXXXXXX. Everything else → NULL.
UPDATE users SET phone = CASE
    WHEN length(
        ltrim(
            CASE
                WHEN regexp_replace(phone, '\D', '', 'g') LIKE '00971%'
                    THEN substr(regexp_replace(phone, '\D', '', 'g'), 6)
                WHEN regexp_replace(phone, '\D', '', 'g') LIKE '971%'
                    THEN substr(regexp_replace(phone, '\D', '', 'g'), 4)
                ELSE regexp_replace(phone, '\D', '', 'g')
            END, '0')
    ) = 9
    THEN '971' || ltrim(
            CASE
                WHEN regexp_replace(phone, '\D', '', 'g') LIKE '00971%'
                    THEN substr(regexp_replace(phone, '\D', '', 'g'), 6)
                WHEN regexp_replace(phone, '\D', '', 'g') LIKE '971%'
                    THEN substr(regexp_replace(phone, '\D', '', 'g'), 4)
                ELSE regexp_replace(phone, '\D', '', 'g')
            END, '0')
    ELSE NULL
END
WHERE phone IS NOT NULL AND phone <> '' AND phone !~ '^971[0-9]{9}$';

COMMIT;

-- Verification:
--   SELECT count(*) FROM users WHERE email <> lower(btrim(email));   -- 0
--   SELECT count(*) FROM users
--   WHERE phone IS NOT NULL AND phone <> '' AND phone !~ '^971[0-9]{9}$';  -- 0
--   SELECT count(*) FROM _backup_contact_points_013;  -- = rows touched
