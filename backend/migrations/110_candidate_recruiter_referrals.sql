-- 110: candidate_recruiter_referrals — a candidate invites a recruiter to view them
--
-- Why. The CV "Share Link" produced a public, unauthenticated, never-expiring
-- URL to a citizen's employment history (/cv/share/<uuid>) with no record of
-- who opened it. Owner decision 2026-09-06: the platform is closed; a
-- candidate who wants a recruiter to see their profile INVITES that recruiter
-- to the platform instead. This table is the candidate's consent: who may
-- view them, for how long, revocable, and with the views recorded.
--
-- What happens to a referral depends on what the platform already knows:
--   recruiter already has an account          -> status 'granted' at once
--   company is on the platform (has a workspace) -> 'pending', its HR admins
--                                                  are asked to invite the person
--   company unknown                            -> 'pending', a companies row
--                                                  with lead_source='candidate_referral'
--                                                  enters the growth pipeline
-- The grant binds to the recruiter's EMAIL as typed by the candidate; when an
-- account with that email exists or appears (any invitation path), the
-- referral is linked to it (recruiter_user_id) and becomes 'granted'.
--
-- Precondition verified against the live DB 2026-09-06: no table named
-- candidate_recruiter_referrals or profile_view_grants; companies.id and
-- company_invitations.id are uuid; users.id is CHAR(15). Idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS candidate_recruiter_referrals (
    id                      SERIAL PRIMARY KEY,
    candidate_id            CHAR(15) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recruiter_name          TEXT NOT NULL,
    recruiter_email         TEXT NOT NULL,             -- canonical (lower, trimmed)
    company_name            TEXT,
    company_id              UUID REFERENCES companies(id) ON DELETE SET NULL,
    company_invitation_id   UUID REFERENCES company_invitations(id) ON DELETE SET NULL,
    recruiter_user_id       CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    note                    TEXT,
    status                  TEXT NOT NULL DEFAULT 'pending',
    grant_expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    view_count              INTEGER NOT NULL DEFAULT 0,
    last_viewed_at          TIMESTAMPTZ,
    revoked_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT candidate_recruiter_referrals_status_chk
        CHECK (status IN ('pending', 'granted', 'revoked', 'expired')),
    CONSTRAINT candidate_recruiter_referrals_email_chk
        CHECK (recruiter_email = lower(btrim(recruiter_email)) AND position('@' in recruiter_email) > 1)
);

CREATE INDEX IF NOT EXISTS idx_crr_candidate ON candidate_recruiter_referrals (candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crr_recruiter_email ON candidate_recruiter_referrals (recruiter_email);
CREATE INDEX IF NOT EXISTS idx_crr_recruiter_user ON candidate_recruiter_referrals (recruiter_user_id);
-- one live referral per candidate/recruiter pair; revoked or expired ones may be re-issued
CREATE UNIQUE INDEX IF NOT EXISTS uq_crr_live_pair
    ON candidate_recruiter_referrals (candidate_id, recruiter_email)
    WHERE status IN ('pending', 'granted');

COMMENT ON TABLE candidate_recruiter_referrals IS
    'A candidate''s consent for one named recruiter to view their profile: time-boxed, revocable, views recorded (migration 110)';

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.columns WHERE table_name = 'candidate_recruiter_referrals';  -- 16
--   SELECT indexname FROM pg_indexes WHERE tablename = 'candidate_recruiter_referrals';                -- 5 incl. pkey
-- Negative probes (rolled back):
--   INSERT ... status = 'viewed'            -> violates candidate_recruiter_referrals_status_chk
--   INSERT ... recruiter_email = 'A@X.ae '  -> violates candidate_recruiter_referrals_email_chk
