-- =============================================================
-- Migration: Add UAE Pass columns to users table
-- Date: 2026-05-14
-- Purpose: Support UAE Pass OIDC authentication (UC 1.3.1)
-- =============================================================

-- UAE Pass unique identifier (primary linking key)
ALTER TABLE users ADD COLUMN IF NOT EXISTS uaepass_uuid VARCHAR(255) UNIQUE;

-- Emirates ID (stored encrypted — AES-256 by application layer)
ALTER TABLE users ADD COLUMN IF NOT EXISTS emirates_id_enc VARCHAR(512);

-- Arabic name fields (from UAE Pass attributes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS fullname_ar VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality_ar VARCHAR(100);

-- UAE Pass identity metadata
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);          -- 'citizen' or 'resident'
ALTER TABLE users ADD COLUMN IF NOT EXISTS uaepass_usertype VARCHAR(50); -- SOP level from UAE Pass
ALTER TABLE users ADD COLUMN IF NOT EXISTS title_en VARCHAR(100);        -- e.g. 'Mr.', 'Mrs.'

-- Timestamp of last UAE Pass verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS uaepass_verified_at TIMESTAMP;

-- Authentication method indicator
-- 'uaepass' = authenticated via UAE Pass
-- 'otp'     = authenticated via phone OTP (dev/legacy)
-- 'email'   = authenticated via email/password (legacy)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'otp';

-- Index for fast UUID lookups during OAuth callback
CREATE INDEX IF NOT EXISTS idx_users_uaepass_uuid ON users(uaepass_uuid) WHERE uaepass_uuid IS NOT NULL;

-- =============================================================
-- Notes:
-- - All columns use IF NOT EXISTS / IF NOT EXISTS for idempotency
-- - emirates_id_enc stores the encrypted EID, NOT plaintext
-- - The application layer handles encryption/decryption
-- - Run this migration on APPDEV first, then APPQA, then production
-- =============================================================
