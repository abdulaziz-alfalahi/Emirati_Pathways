-- =============================================================================
-- 006 — Repair the users.role / users.user_type split  (issue #93)
--
-- The platform authorises on `role` (+ `secondary_roles`):
--     backend/auth/access_control.py:84  SELECT role, secondary_roles FROM users
--     backend/routes/uaepass_routes.py:281  'role': user_data.get('role','candidate')
--
-- but company onboarding wrote only `user_type`
--     backend/growth_system.py  INSERT INTO users (... user_type ...)
--
-- so an invited recruiter kept role='candidate' (the column default) and was
-- treated as a candidate on every sign-in after the first.
--
-- `role` is canonical; `user_type` is a legacy alias that is still SELECTed for
-- display/analytics (administrator_system.py:343, platform_ops_routes.py:611),
-- so it is kept in sync rather than dropped. Two existing migration scripts
-- already assert this direction (scripts/migration/phase4_debug.py:53 and
-- phase4_fix_constraints.py:54 both run `SET user_type = role`).
--
-- Both columns are plain varchar with no enum and no CHECK constraint
-- (verified against the deployed schema), so these writes cannot fail on a
-- domain violation.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

-- Snapshot before touching anything. Kept, not dropped — this is auth data.
CREATE TABLE IF NOT EXISTS _backup_users_roles_006 AS
SELECT id, role, user_type, secondary_roles, NOW() AS backed_up_at
FROM users
WHERE user_type IS DISTINCT FROM role;

-- 1. RESCUE: users whose real persona only ever reached `user_type`.
--    Restricted to employer-side roles so we cannot demote or promote anyone
--    outside the onboarding bug's blast radius.
--
--    NOTE both NULL and 'candidate'. database/setup_database.sql:29 declares
--    `role ... NOT NULL DEFAULT 'candidate'`, but the DEPLOYED schema has no
--    default and is nullable (verified against the live database), so the old
--    INSERT left role = NULL rather than 'candidate'. That is worse than it
--    sounds: access_control.resolve_roles does `if row.get('role')`, so a NULL
--    contributes no role at all, and the UAE Pass claim
--    `user_data.get('role','candidate')` returns None — the key exists — so the
--    JWT carries role=None rather than falling back to the default.
UPDATE users
SET role = user_type,
    updated_at = NOW()
WHERE (role IS NULL OR role = 'candidate')
  AND user_type IN ('recruiter', 'employer_admin');

-- 2. MIRROR: bring the legacy alias back in line with the canonical column.
--    Nothing authorises on user_type, so this only affects display/analytics.
UPDATE users
SET user_type = role,
    updated_at = NOW()
WHERE user_type IS DISTINCT FROM role
  AND role IS NOT NULL;

COMMIT;

-- Verification (expect 0 rows):
--   SELECT count(*) FROM users WHERE user_type IS DISTINCT FROM role AND role IS NOT NULL;
--   SELECT count(*) FROM users WHERE role = 'candidate' AND user_type IN ('recruiter','employer_admin');
