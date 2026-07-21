-- =============================================================================
-- 012 — Allow 'removed' as a company_team_members.invitation_status (issue #100)
--
-- remove_member used to hard-DELETE the membership row and nothing else: the
-- removed user vanished from the Team tab but kept working access through
-- hr_profiles and job_postings.recruiter_id, and there was no record that a
-- removal ever happened. The fix (company_team_system.remove_member) now
-- soft-removes — invitation_status = 'removed' — so joined_at/role history
-- survives and the ACL (which honours only 'accepted') locks the user out.
--
-- 007 added the status CHECK with ('pending','accepted','declined'); this
-- widens it to include 'removed'. Data precondition: none needed — no
-- existing row can violate a widened CHECK.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

ALTER TABLE company_team_members
    DROP CONSTRAINT IF EXISTS company_team_members_invitation_status_check;

ALTER TABLE company_team_members
    ADD CONSTRAINT company_team_members_invitation_status_check
    CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'removed'));

COMMIT;

-- Verification:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conname = 'company_team_members_invitation_status_check';
--   -- expect: CHECK (... 'pending','accepted','declined','removed' ...)
