-- =============================================================================
-- CI-only post-migrate provisioning for the Tier-4 (PDPL) + EID test suites
-- =============================================================================
-- migrate.py builds ~130 tables from DATABASE_SCHEMA.md, but that doc still
-- reflects the PRE-EID schema: users.id is an integer serial, there are no
-- foreign keys, no secondary indexes, and the consents / nafis_job_seekers
-- tables do not exist at all. The Tier-4 and EID end-to-end tests assert the
-- POST-EID shape (users.id = CHAR(15) Emirates ID, FK web to users, an
-- idx_users_email index, a consents table, an EID-generating id default so the
-- register endpoint — which omits id and RETURNs it — works, etc.).
--
-- This script converges a freshly-migrated CI database to that shape. It is
-- idempotent and intended to run AFTER `python migrate.py` and BEFORE the
-- 003_consents_table.sql / 002_audit_log_append_only.sql migrations.
--
-- It is wired into .github/workflows/backend-ci.yml ONLY. It is NOT applied to
-- staging/production (those already carry the real EID migration, 001_eid_refactor.sql).
-- Because the CI database is empty at this point, type conversions use `USING NULL`.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. users → EID (CHAR(15)) primary key + UAE PASS / migration columns
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_type text;
BEGIN
    SELECT data_type INTO v_type
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';

    IF v_type IS DISTINCT FROM 'character' THEN
        -- Drop the serial default, widen id to CHAR(15). Table is empty in CI.
        EXECUTE 'ALTER TABLE users ALTER COLUMN id DROP DEFAULT';
        EXECUTE 'ALTER TABLE users ALTER COLUMN id TYPE char(15) USING NULLIF(id::text, '''')::char(15)';
    END IF;
END $$;

-- Synthetic-EID generator so INSERTs that omit id (auth_manager.register_user
-- does `INSERT INTO users (...) RETURNING id`) still yield a valid 15-digit EID.
-- Format: 784 + 12-digit zero-padded sequence = exactly 15 numeric chars.
CREATE SEQUENCE IF NOT EXISTS users_eid_seq;
ALTER TABLE users
    ALTER COLUMN id SET DEFAULT ('784' || lpad(nextval('users_eid_seq')::text, 12, '0'));

-- UAE PASS / EID augmentation + migration-artefact columns the tests & the
-- DSR-erase UPDATE reference.
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_old_uuid   uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS uaepass_uuid  uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emirates_id_enc text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fullname_ar   text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality_ar text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method   varchar(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name     varchar;

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_old_uuid ON users(id_old_uuid);

-- ---------------------------------------------------------------------------
-- 2. nafis_job_seekers — absent from DATABASE_SCHEMA.md, but DSR-erase does an
--    unguarded `DELETE FROM nafis_job_seekers WHERE user_id = %s`, which would
--    abort (and 500) the whole erasure if the table did not exist.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nafis_job_seekers (
    id         SERIAL PRIMARY KEY,
    user_id    char(15),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 3. Convert user-referencing child columns to CHAR(15) and add FK → users(id).
--    Covers every column the DSR export/erase touches (a type mismatch there
--    aborts the erase) and gives the EID suite its ">=15 FK constraints" gate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _ci_eid_fk(p_table text, p_col text) RETURNS void AS $$
DECLARE
    v_type  text;
    v_fkname text := 'fk_eid_' || p_table || '_' || p_col;
BEGIN
    SELECT data_type INTO v_type
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_col;

    IF v_type IS NULL THEN
        RETURN;  -- table/column not present in this DB — skip silently
    END IF;

    IF v_type IS DISTINCT FROM 'character' THEN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', p_table, p_col);
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE char(15) USING NULL::char(15)',
                       p_table, p_col);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = v_fkname
    ) THEN
        EXECUTE format(
            'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES users(id)',
            p_table, v_fkname, p_col);
    END IF;
END $$ LANGUAGE plpgsql;

SELECT _ci_eid_fk('admin_audit_log',         'user_id');
SELECT _ci_eid_fk('admin_notifications',     'target_user_id');
SELECT _ci_eid_fk('candidate_profiles',      'user_id');
SELECT _ci_eid_fk('user_cvs',                'user_id');
SELECT _ci_eid_fk('cv_profiles',             'user_id');
SELECT _ci_eid_fk('notifications',           'user_id');
SELECT _ci_eid_fk('job_applications',        'candidate_id');
SELECT _ci_eid_fk('messages',                'sender_id');
SELECT _ci_eid_fk('messages',                'recipient_id');
SELECT _ci_eid_fk('user_activity_log',       'user_id');
SELECT _ci_eid_fk('user_sessions',           'user_id');
SELECT _ci_eid_fk('user_journey_analytics',  'user_id');
SELECT _ci_eid_fk('saved_jobs',              'user_id');
SELECT _ci_eid_fk('role_requests',           'user_id');
SELECT _ci_eid_fk('job_shortlists',          'candidate_id');
SELECT _ci_eid_fk('feedback',                'user_id');
SELECT _ci_eid_fk('interview_participants',  'user_id');
SELECT _ci_eid_fk('conversation_participants','user_id');
SELECT _ci_eid_fk('nafis_job_seekers',       'user_id');

DROP FUNCTION _ci_eid_fk(text, text);

-- ---------------------------------------------------------------------------
-- 4. Minimal seed: two users with valid 15-digit EIDs so the EID suite runs
--    against real data (no child rows → no orphans). Idempotent.
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, first_name, last_name, role, is_active, is_verified, password_hash)
VALUES
    ('784199900000001', 'eid_seed_admin@emirati.gov.ae', 'Seed', 'Admin',
     'platform_administrator', true, true, ''),
    ('784199900000002', 'eid_seed_candidate@emirati.gov.ae', 'Seed', 'Candidate',
     'candidate', true, true, '')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Seed one admin_audit_log row (id = 1). test_tier4_audit's append-only
--    check does `UPDATE/DELETE ... WHERE id = 1`; the tamper guard is a
--    FOR EACH ROW trigger, so a 0-row statement against an empty table would
--    never fire it. This row (inserted before the 002 triggers, when INSERT is
--    always permitted anyway) guarantees the UPDATE/DELETE match a row and the
--    guard raises as asserted. Idempotent.
-- ---------------------------------------------------------------------------
INSERT INTO admin_audit_log (action, resource_type, resource_id, details, ip_address, user_agent)
SELECT 'ci_seed_marker', 'system', 'seed-0', '{}'::jsonb, '127.0.0.1', 'ci-seed'
WHERE NOT EXISTS (SELECT 1 FROM admin_audit_log WHERE id = 1);
