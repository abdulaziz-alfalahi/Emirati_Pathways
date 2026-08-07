-- 054: Record how long each board member was actually present
--
-- WHY: the board asked for "the exact time of joining and leaving, providing an
-- accurate record of the member's attendance duration" (feedback
-- fb_1786012027). Today board_meeting_attendees carries joined_at and a
-- left_at column that NOTHING EVER SETS — we record that someone arrived and
-- never that they left, so no duration can be computed at all.
--
-- WHY A SEPARATE TABLE rather than just filling in left_at: a member can leave
-- and rejoin, and on this platform that is likely rather than exotic — external
-- participants are currently dropped mid-call by the media-path problem
-- (issue #308). With one column pair, duration would be
-- last_leave - first_join, which silently counts the time they were ABSENT as
-- attendance. A board member who joined, dropped for forty minutes and returned
-- for the close would read as present throughout. Summing intervals is the only
-- way to state presence honestly.
--
-- board_meeting_attendees keeps first join / last leave for the register; this
-- table is the evidence behind the duration.
--
-- PRECONDITION (verified live 2026-08-07): board_meeting_presence does not
-- exist; board_meeting_attendees has joined_at and left_at, and left_at is NULL
-- in every row because no code path writes it.
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS board_meeting_presence (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id uuid NOT NULL,
    user_id    char(15) NOT NULL,
    joined_at  timestamptz NOT NULL DEFAULT now(),
    -- NULL = still in the room. Closed on leave, or at meeting close for
    -- anyone whose browser never told us they had gone.
    left_at    timestamptz,
    -- How the interval ended, so a duration is never quietly overstated:
    --   left        — the participant left the room deliberately
    --   meeting_end — still present when the secretary closed the meeting
    --   assumed     — never signalled; closed at meeting end, exact time unknown
    ended_reason varchar(20),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT board_meeting_presence_interval CHECK (left_at IS NULL OR left_at >= joined_at)
);

CREATE INDEX IF NOT EXISTS idx_bm_presence_meeting ON board_meeting_presence (meeting_id);
CREATE INDEX IF NOT EXISTS idx_bm_presence_user    ON board_meeting_presence (meeting_id, user_id);
-- At most one open interval per person per meeting.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bm_presence_open
    ON board_meeting_presence (meeting_id, user_id) WHERE left_at IS NULL;

COMMENT ON TABLE board_meeting_presence IS
    'One row per continuous period a participant was in a board meeting room. '
    'Total presence is the SUM of intervals, never last_leave - first_join, '
    'because that would count time away as attendance.';

COMMENT ON COLUMN board_meeting_presence.ended_reason IS
    'left | meeting_end | assumed. "assumed" means the participant never '
    'signalled leaving (browser closed, connection dropped) and the interval '
    'was closed when the meeting was; treat that duration as an upper bound.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM board_meeting_presence;                  -- 0 on a new table
--   -- the partial unique index must forbid a second open interval:
--   BEGIN;
--     INSERT INTO board_meeting_presence (meeting_id, user_id) VALUES
--       ('00000000-0000-0000-0000-000000000001','000000000000001'),
--       ('00000000-0000-0000-0000-000000000001','000000000000001');  -- must fail
--   ROLLBACK;
--   -- and the interval CHECK must reject a leave before the join:
--   BEGIN;
--     INSERT INTO board_meeting_presence (meeting_id, user_id, joined_at, left_at)
--     VALUES ('00000000-0000-0000-0000-000000000002','000000000000001',
--             now(), now() - interval '1 minute');                   -- must fail
--   ROLLBACK;
