-- Migration 035 — Team invitation links (HR-manager → teammate)
--
-- WHY: An HR manager could only ADD a teammate who had already registered (by
-- email, no link). The owner wants a proper copyable invite LINK so a teammate
-- can join the platform AND the workspace even if they've never signed in — like
-- the operator's company magic link, but issued by the workspace admin and
-- carrying the workspace's company_id + the intended team role. (Auto-emailing the
-- link from the platform is a later enhancement; for now the HR manager copies it.)
--
-- Carries company_id (a UUID FK) — NEVER a company name — per the platform's
-- identity rule (#5): team membership must resolve by id, not by name string.
--
-- PRECONDITION (verified live 2026-07-26): team_invitations does not exist.
-- Idempotent; no destructive statements.

BEGIN;

CREATE TABLE IF NOT EXISTS team_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token           VARCHAR(64) NOT NULL UNIQUE,
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role            VARCHAR(30) NOT NULL DEFAULT 'recruiter',   -- recruiter | hr_manager
    invited_by      CHAR(15),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',     -- pending | accepted | revoked
    is_used         BOOLEAN NOT NULL DEFAULT FALSE,
    created_user_id CHAR(15),                                    -- who redeemed it
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '7 days'),
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_team_invitations_company ON team_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

COMMIT;

-- Verify: SELECT to_regclass('team_invitations');  -- non-NULL
