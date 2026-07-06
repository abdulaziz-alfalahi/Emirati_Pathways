-- =============================================================================
-- T4.2 (PDPL) — Consent capture table
-- =============================================================================
-- Records data-processing consent granted at registration / UAE Pass onboarding
-- and any later withdrawal. users.id is INTEGER (SERIAL). Idempotent.
-- Apply on APPDEV, then run the 127-test suite before pushing.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS consents (
    id              SERIAL PRIMARY KEY,
    user_id         character(15) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type    VARCHAR(64)  NOT NULL,   -- 'terms' | 'privacy' | 'data_processing' | 'marketing'
    granted         BOOLEAN      NOT NULL,
    policy_version  VARCHAR(32)  NOT NULL,   -- version of the policy the user agreed to
    source          VARCHAR(32)  NOT NULL DEFAULT 'registration', -- 'registration' | 'uaepass' | 'settings'
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    withdrawn_at    TIMESTAMPTZ              -- NULL unless later withdrawn
);

CREATE INDEX IF NOT EXISTS idx_consents_user_id ON consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_user_type ON consents(user_id, consent_type);

COMMIT;
