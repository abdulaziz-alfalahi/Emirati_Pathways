-- 059: device tokens for mobile push
--
-- WHY: push is the wake-up mechanism the mobile app exists for. An Emirates ID
-- identifies someone; it does not reach them. Nothing in the schema stores a
-- device token today (verified live 2026-08-09: no device/push table of any
-- kind), so there is nowhere to send to.
--
-- This is the registry only. It is deliberately shipped AHEAD of delivery:
-- the APNs key comes with the Apple developer account (in procurement) and FCM
-- needs a Firebase project, so credentials do not exist yet. Storing tokens now
-- means the app can register from its first build and no re-collection is needed
-- later. NOTHING here implies a notification was delivered.
--
-- THE PRIVACY TRAP THIS SCHEMA IS SHAPED AROUND:
-- a device token belongs to a DEVICE, not a person. If user A signs out of the
-- app and user B signs in on the same phone, that token now belongs to B. If the
-- old row is left pointing at A, B's phone receives A's notifications — a real
-- personal-data leak, and the single most common push bug. Hence UNIQUE(token):
-- re-registration REASSIGNS the token rather than creating a second row, so a
-- token can only ever belong to one user.
--
-- PRECONDITION (verified live 2026-08-09): no device_tokens table exists;
-- users.id is CHAR(15) (Emirates ID).
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS device_tokens (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Owner as of the last registration. Reassigned on re-register (see above).
    user_id      char(15) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- The APNs/FCM registration token.
    token        text NOT NULL,
    -- ios | android | web
    platform     varchar(16) NOT NULL,
    -- Which build is installed. Needed to honour min_supported_version and to
    -- avoid sending a payload an older client cannot render.
    app_version  varchar(32),
    device_model varchar(120),
    -- The app is bilingual, so the push itself must be. Held per DEVICE, not per
    -- user: someone may run the app in Arabic on a phone and English elsewhere.
    locale       varchar(8),
    -- Set false when the provider reports the token unregistered/invalid. Kept
    -- rather than deleted so a device that reinstalls can be recognised.
    is_active    boolean NOT NULL DEFAULT true,
    -- Refreshed on every register; lets a cleanup job retire silent devices.
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT device_tokens_platform_check
        CHECK (platform IN ('ios', 'android', 'web'))
);

-- One row per token, always. This is the constraint that makes re-registration
-- a REASSIGNMENT and prevents one device holding two users' notifications.
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_token
    ON device_tokens (token);

-- The send path's only query: active devices for a user.
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active
    ON device_tokens (user_id) WHERE is_active;

COMMENT ON TABLE device_tokens IS
    'Mobile push registry. A token belongs to a DEVICE, not a person: '
    'UNIQUE(token) means re-registering reassigns it to the new signed-in user, '
    'so a shared phone never delivers the previous user''s notifications. '
    'Presence of a row implies NOTHING about delivery — push credentials are not '
    'configured yet (APNs key ships with the Apple developer account).';
COMMENT ON COLUMN device_tokens.is_active IS
    'False once the provider reports the token unregistered. Rows are retired, '
    'not deleted, so a reinstalling device is recognisable.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM device_tokens;                       -- 0
--   -- the same token cannot be held twice (the privacy guarantee):
--   BEGIN;
--     INSERT INTO device_tokens (user_id, token, platform)
--     VALUES ('784000000000320','ZZ-TOK','ios'), ('784000000000240','ZZ-TOK','ios');
--   ROLLBACK;                                                 -- must fail
--   -- an unknown platform is refused:
--   BEGIN;
--     INSERT INTO device_tokens (user_id, token, platform)
--     VALUES ('784000000000320','ZZ-TOK-2','symbian');
--   ROLLBACK;                                                 -- must fail
