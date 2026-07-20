-- =============================================================================
-- 007 — Normalise company_team_members.invitation_status  (issue #91)
--
-- The permission layer honours exactly ONE value:
--     backend/workspace_middleware.py:83   ... AND ctm.invitation_status = 'accepted'
--     backend/routes/assessor_routes.py:745 ... AND invitation_status = 'accepted'
--
-- but the HR-manager invite path wrote 'active'
--     backend/company_team_system.py   VALUES (..., 'active', NOW())
--     backend/scripts/backfill_team_members.py
--
-- while the DDL default is a third value, 'pending'
--     backend/create_hr_recruiter_tables.sql:64
--
-- Net effect before this fix: a member added through the Team tab got a row that
-- granted nothing — every workspace endpoint 403'd them — while the UI rendered
-- a green "Active" badge. Only workspace_routes.py:134 (provisioning) wrote the
-- correct value, which is why admin rows worked and invited rows did not.
--
-- Vocabulary, per the DDL's own comment
-- (create_hr_recruiter_tables_fixed.sql:58 -- 'pending', 'accepted', 'declined'):
--     pending   invited, no access yet  (DDL default — correct for a real invite)
--     accepted  active member, access granted
--     declined  invitation refused
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

-- Snapshot before touching anything — this table controls access.
CREATE TABLE IF NOT EXISTS _backup_ctm_status_007 AS
SELECT id, company_id, user_id, role, invitation_status, NOW() AS backed_up_at
FROM company_team_members
WHERE invitation_status IS DISTINCT FROM 'accepted';

-- 1. Rows written by the invite path / backfill are real memberships that were
--    silently powerless. 'active' only ever meant "accepted" here.
UPDATE company_team_members
SET invitation_status = 'accepted'
WHERE invitation_status = 'active';

-- 2. Anything NULL is indistinguishable from 'pending' to the readers (both use
--    equality, so NULL never matches); make that explicit.
UPDATE company_team_members
SET invitation_status = 'pending'
WHERE invitation_status IS NULL;

-- 3. Stop a fourth spelling appearing. Added only if not already present, and
--    after normalisation so it cannot fail on legacy data.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'company_team_members'::regclass
          AND conname = 'company_team_members_invitation_status_check'
    ) THEN
        ALTER TABLE company_team_members
        ADD CONSTRAINT company_team_members_invitation_status_check
        CHECK (invitation_status IN ('pending', 'accepted', 'declined'));
    END IF;
END $$;

COMMIT;

-- Verification (expect 0 rows):
--   SELECT count(*) FROM company_team_members WHERE invitation_status = 'active';
--   SELECT count(*) FROM company_team_members WHERE invitation_status IS NULL;
-- And the constraint should now reject anything else:
--   INSERT ... invitation_status = 'active'  ->  violates check constraint
