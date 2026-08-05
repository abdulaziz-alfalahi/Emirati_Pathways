-- 051: Board-wide settings (quorum) + snapshot quorum onto each meeting
--
-- WHY: owner ruling 2026-08-05 — quorum is a FIXED board-wide rule, not
-- something the secretary sets per meeting. Migration 050 put quorum_required
-- on each meeting, which invited per-meeting drift.
--
-- The column stays, but its meaning changes: it is now a SNAPSHOT of the
-- board-wide rule as it stood when the meeting was created. That is deliberate
-- governance behaviour — if the board later changes its quorum from 3 to 5, a
-- meeting lawfully held under the old rule must not retroactively become
-- inquorate. New meetings inherit the current setting; past meetings keep
-- the rule that applied to them.
--
-- PRECONDITION (verified live 2026-08-05): board_settings does not exist;
-- board_meetings exists from migration 050 with quorum_required smallint.
--
-- Single-row table (CHECK id = 1), same shape as platform_maintenance.

BEGIN;

CREATE TABLE IF NOT EXISTS board_settings (
    id              smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    quorum_required smallint,
    -- Free text so the secretary can record the source of the rule
    -- (e.g. "Board charter art. 7"), which auditors will ask for.
    quorum_basis    varchar(300),
    updated_by      char(15),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO board_settings (id, quorum_required)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN board_meetings.quorum_required IS
    'Snapshot of the board-wide quorum (board_settings.quorum_required) at the '
    'time this meeting was created. Historical meetings keep the rule that '
    'applied to them; changing the board rule does not rewrite the past.';

COMMIT;

-- Verification:
--   SELECT * FROM board_settings;                       -- exactly 1 row, id=1
--   INSERT INTO board_settings (id) VALUES (2);         -- must fail the CHECK
