-- 109: staff_invitations.emirates_id — the attribute that authorises a non-national
--
-- Why. UAE Pass assessment (email of 2026-09-04) asks "which user attribute
-- identifies that a specific non-UAE national has been authorised to access
-- the platform?". Today the honest answer is "possession of the invitation
-- link": staff_invitations records name, email and phone but NOT the Emirates
-- ID, and redemption grants the role to whichever UAE Pass identity opens the
-- link. The seeker flow already refuses a link opened by a different EID; this
-- gives the staff flow the same rule. From now on the administrator records
-- the invitee's Emirates ID at authorisation and the callback refuses the
-- grant unless UAE Pass asserts the same EID.
--
-- Precondition verified against the live DB 2026-09-04: staff_invitations has
-- columns (id, token, full_name, email, phone, intended_role, organization,
-- notes, status, is_used, expires_at, accepted_at, revoked_at,
-- created_user_id, invited_by, created_at, updated_at) — no emirates_id.
-- 4 rows (2 accepted, 2 revoked); none pending, so nothing in flight is
-- affected. If the column already exists elsewhere, ADD COLUMN IF NOT EXISTS
-- is a no-op and the CHECK is only added when absent.
--
-- Nullable on purpose: existing rows predate the rule, and an invitation to a
-- UAE national (who has an account already) does not need it. Redemption
-- enforces the match only when the column is set. Digits only, 15 long,
-- starting 784 — the same shape as users.id.

BEGIN;

ALTER TABLE staff_invitations ADD COLUMN IF NOT EXISTS emirates_id CHAR(15);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'staff_invitations_emirates_id_shape'
    ) THEN
        ALTER TABLE staff_invitations
            ADD CONSTRAINT staff_invitations_emirates_id_shape
            CHECK (emirates_id IS NULL OR emirates_id ~ '^784[0-9]{12}$');
    END IF;
END $$;

COMMENT ON COLUMN staff_invitations.emirates_id IS
    'Emirates ID the administrator authorised; redemption refuses a different UAE Pass idn (migration 109)';

COMMIT;

-- Verification:
--   SELECT column_name, data_type, character_maximum_length
--     FROM information_schema.columns
--    WHERE table_name = 'staff_invitations' AND column_name = 'emirates_id';
--   -- expect: emirates_id | character | 15
--   SELECT conname FROM pg_constraint WHERE conname = 'staff_invitations_emirates_id_shape';
--   -- expect: one row
-- Negative probe (inside a rolled-back transaction):
--   UPDATE staff_invitations SET emirates_id = '123' WHERE id = (SELECT min(id) FROM staff_invitations);
--   -- expect: violates check constraint "staff_invitations_emirates_id_shape"
