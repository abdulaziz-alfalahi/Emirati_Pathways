-- 045: Platform-staff magic-link invitations
--
-- WHY: the persona model says non-nationals enter ONLY via operator-issued
-- magic-link invitations that carry the role (`intended_role`). Until now the
-- only invitation paths were company-bound: company_invitations (employer
-- onboarding) and team_invitations (a company workspace). The EHRDC CRM team
-- are non-national PLATFORM staff with no company — an admin must be able to
-- invite them to a platform role (career_services_operator, call_center_agent,
-- ...) and have them complete registration through UAE Pass.
--
-- PRECONDITION (verified live 2026-08-03): staff_invitations does not exist.
-- Column types mirror company_invitations exactly (token varchar(255),
-- invited_by/created_user_id CHAR(15) = Emirates ID, intended_role
-- varchar(50)) so the redemption code paths stay consistent. No FK on the user
-- columns — company_invitations has none either, and the invitee's account may
-- not exist when the invitation is created.
--
-- Purely additive — no destructive statements, no backup table needed.

BEGIN;

CREATE TABLE IF NOT EXISTS staff_invitations (
    id              serial PRIMARY KEY,
    token           varchar(255) NOT NULL UNIQUE,
    full_name       varchar(200),
    email           varchar(255),
    phone           varchar(30),
    intended_role   varchar(50)  NOT NULL,
    organization    varchar(200),          -- free-text team/department label
    notes           text,
    status          varchar(20)  NOT NULL DEFAULT 'pending',
    is_used         boolean      NOT NULL DEFAULT false,
    expires_at      timestamptz  NOT NULL,
    accepted_at     timestamptz,
    revoked_at      timestamptz,
    created_user_id char(15),              -- account that redeemed it
    invited_by      char(15),              -- admin who issued it
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_status  ON staff_invitations (status);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_invited ON staff_invitations (invited_by);

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.tables WHERE table_name='staff_invitations';  -- 1
--   SELECT count(*) FROM staff_invitations;                                               -- 0
--   \d staff_invitations  -- token UNIQUE, intended_role NOT NULL, expires_at NOT NULL
