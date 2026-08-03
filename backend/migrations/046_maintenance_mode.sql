-- 046: Platform maintenance mode
--
-- WHY: taking the platform down for an upgrade currently means editing files
-- inside the nginx container and stopping backend containers by hand on every
-- app node (done on production 2026-08-03 — roughly a dozen manual steps, and
-- only reversible the same way). Owner feedback fb_1785729286 asked whether a
-- maintenance toggle belongs in the admin Modules tab; this table backs it, so
-- an admin can hold traffic with one click and switch it off again without
-- shell access.
--
-- Single-row table (id = 1, enforced by the CHECK) rather than a settings
-- key/value blob: the state is read on EVERY request, so a one-row lookup with
-- typed columns keeps the hot path cheap and unambiguous.
--
-- PRECONDITION (verified live 2026-08-03): platform_maintenance does not
-- exist; there is no platform_settings table to extend. feature_flags exists
-- but is a per-module on/off list read publicly by the frontend on boot —
-- deliberately NOT reused: a mis-toggled row there must never be able to take
-- the whole API down, and maintenance state needs its own audit columns.
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS platform_maintenance (
    id            smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    is_enabled    boolean     NOT NULL DEFAULT false,
    message_en    text,
    message_ar    text,
    expected_end  timestamptz,
    started_at    timestamptz,
    started_by    char(15),
    ended_at      timestamptz,
    ended_by      char(15),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_maintenance (id, is_enabled)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verification:
--   SELECT * FROM platform_maintenance;            -- exactly 1 row, is_enabled=false
--   INSERT INTO platform_maintenance (id) VALUES (2);  -- must fail the CHECK
