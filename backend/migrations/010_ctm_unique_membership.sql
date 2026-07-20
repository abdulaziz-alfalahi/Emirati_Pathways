-- =============================================================================
-- 010 — Add the UNIQUE(company_id, user_id) the DDL always promised
--
-- create_hr_recruiter_tables.sql:68 declares UNIQUE(company_id, user_id) on
-- company_team_members, but the DEPLOYED table has only the primary key and
-- the 007 status CHECK — the same dual-DDL drift behind issues #93/#91.
--
-- This is not cosmetic: TWO code paths upsert memberships with
-- ON CONFLICT (company_id, user_id) and both ERROR without the constraint
-- ("no unique or exclusion constraint matching the ON CONFLICT
-- specification"):
--   - workspace_routes.py:133  (workspace provisioning, admin membership)
--   - growth_system.redeem_invitation_for_user  (magic-link redemption)
-- Discovered when the first live end-to-end invitation redemption on staging
-- failed at exactly this INSERT. It also explains why 9/12 companies show
-- workspace_enabled=TRUE with provisioned_by NULL — the provisioning flow
-- errors on this statement, so those flags can only have been seeded.
--
-- Precondition verified against the live DB: 0 duplicate (company_id,
-- user_id) pairs among the existing rows, so the constraint adds cleanly.
-- The DELETE below is a safety net for any environment that does have
-- duplicates: it keeps, per pair, the row that grants access ('accepted'
-- first), breaking ties by newest joined_at. Snapshot taken first — this
-- table controls access.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS _backup_ctm_dedup_010 AS
SELECT * FROM company_team_members
WHERE (company_id, user_id) IN (
    SELECT company_id, user_id FROM company_team_members
    GROUP BY company_id, user_id HAVING count(*) > 1
);

DELETE FROM company_team_members ctm
USING company_team_members keeper
WHERE ctm.company_id = keeper.company_id
  AND ctm.user_id = keeper.user_id
  AND ctm.id <> keeper.id
  AND (
        -- keeper outranks ctm: accepted beats non-accepted…
        (keeper.invitation_status = 'accepted' AND ctm.invitation_status IS DISTINCT FROM 'accepted')
        -- …otherwise the newer row wins; id breaks exact ties.
        OR (keeper.invitation_status IS NOT DISTINCT FROM ctm.invitation_status
            AND (keeper.joined_at, keeper.id::text) > (ctm.joined_at, ctm.id::text))
      );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'company_team_members'::regclass
          AND conname = 'company_team_members_company_user_key'
    ) THEN
        ALTER TABLE company_team_members
        ADD CONSTRAINT company_team_members_company_user_key
        UNIQUE (company_id, user_id);
    END IF;
END $$;

COMMIT;

-- Verification:
--   SELECT conname FROM pg_constraint
--   WHERE conrelid='company_team_members'::regclass
--     AND conname='company_team_members_company_user_key';   -- expect 1 row
--   -- and both ON CONFLICT call sites now execute instead of erroring.
