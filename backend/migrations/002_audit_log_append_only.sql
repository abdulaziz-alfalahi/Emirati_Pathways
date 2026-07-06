-- =============================================================================
-- T4.3 — Make admin_audit_log tamper-evident (append-only)
-- =============================================================================
-- Columns/keys verified against backend/DATABASE_SCHEMA.md (admin_audit_log).
-- users.id is INTEGER (SERIAL). Idempotent. Apply on APPDEV, then run the
-- 127-test suite before pushing.
-- =============================================================================

BEGIN;

-- 1. Remove UPDATE/DELETE/TRUNCATE from PUBLIC so no ambient role can mutate history.
REVOKE UPDATE, DELETE, TRUNCATE ON admin_audit_log FROM PUBLIC;

-- 2. Defense-in-depth: enforce append-only at the DB level regardless of role.
--    (A table-owner role bypasses GRANT/REVOKE, so a trigger is required to make
--     the guarantee hold even for the app's current owner connection.)
CREATE OR REPLACE FUNCTION admin_audit_log_no_mutate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'admin_audit_log is append-only: % is not permitted', TG_OP
        USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_audit_log_no_update ON admin_audit_log;
CREATE TRIGGER trg_admin_audit_log_no_update
    BEFORE UPDATE ON admin_audit_log
    FOR EACH ROW EXECUTE FUNCTION admin_audit_log_no_mutate();

DROP TRIGGER IF EXISTS trg_admin_audit_log_no_delete ON admin_audit_log;
CREATE TRIGGER trg_admin_audit_log_no_delete
    BEFORE DELETE ON admin_audit_log
    FOR EACH ROW EXECUTE FUNCTION admin_audit_log_no_mutate();

COMMIT;

-- -----------------------------------------------------------------------------
-- FULL LEAST-PRIVILEGE (recommended follow-up, infra change):
-- Run the application under a dedicated non-owner role granted only INSERT+SELECT
-- on admin_audit_log, so the REVOKE above is also effective at the grant layer:
--
--   CREATE ROLE emirati_app LOGIN PASSWORD '<from vault>';
--   GRANT INSERT, SELECT ON admin_audit_log TO emirati_app;
--   GRANT USAGE, SELECT ON SEQUENCE admin_audit_log_id_seq TO emirati_app;
--   -- deliberately NO UPDATE/DELETE grant
--
-- The triggers above already enforce append-only even for the owner role.
-- -----------------------------------------------------------------------------
