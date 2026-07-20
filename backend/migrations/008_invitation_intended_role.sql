-- =============================================================================
-- 008 — Give company_invitations a server-set intended_role  (issue #89)
--
-- The accept flow used to take the role straight from the request body:
--     role = user_data.get('role', 'recruiter')     # backend/growth_system.py
-- and write it into users with no allow-list, while the onboarding wizard
-- offered "HR Manager" (employer_admin) as a self-service choice. Anyone
-- holding a recruiter invite link could therefore grant themselves the role
-- that owns workspace.manage_employees for that company.
--
-- The role now belongs to the INVITATION, decided by the operator who creates
-- it, and the client's value is ignored.
--
-- Existing invitations predate the column and get the least-privileged role,
-- which is the safe default — an operator who intended employer_admin can
-- reissue. On staging this is all 7 rows, none of which has ever been redeemed.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

ALTER TABLE company_invitations
    ADD COLUMN IF NOT EXISTS intended_role VARCHAR(50) NOT NULL DEFAULT 'recruiter';

-- Constrain it to the roles an invitation may ever confer. Added only if absent
-- so re-runs are safe; the DEFAULT above guarantees no row violates it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'company_invitations'::regclass
          AND conname = 'company_invitations_intended_role_check'
    ) THEN
        ALTER TABLE company_invitations
        ADD CONSTRAINT company_invitations_intended_role_check
        CHECK (intended_role IN ('recruiter', 'employer_admin'));
    END IF;
END $$;

COMMIT;

-- Verification:
--   SELECT intended_role, count(*) FROM company_invitations GROUP BY 1;
--   -- and the constraint should reject anything wider:
--   UPDATE company_invitations SET intended_role = 'admin';  -- violates check
