-- 055: Let the board archive meetings that predate the platform
--
-- WHY: the board asked for year folders covering 2022 to 2026 so the Minutes of
-- Meeting can be archived and referred back to (feedback fb_1786008827). Board
-- meetings began in 2022; the platform did not. Those meetings were never
-- scheduled here, never had a room, and no attendance was captured for them, so
-- they cannot be represented as ordinary board_meetings rows without implying
-- the platform observed something it did not.
--
-- is_historical marks a record ENTERED AFTER THE FACT. It exists so the two are
-- never confused: an archived 2023 meeting must not be joinable, must not be
-- counted as a platform-run meeting, and its empty attendance record must read
-- as "not captured" rather than "nobody came".
--
-- NB the MoM DOCUMENT is deliberately still not accepted. The object store that
-- would hold official governance records has no confirmed backup (open with the
-- infrastructure provider). This migration builds the shelf; the documents go on
-- it once losing them is no longer possible.
--
-- PRECONDITION (verified live 2026-08-07): board_meetings has no is_historical
-- column; room_name is nullable with a UNIQUE index, so historical rows can
-- leave it NULL (Postgres permits many NULLs in a unique index) and simply have
-- no room; is_virtual is NOT NULL DEFAULT true. One meeting exists, status
-- 'scheduled'.
--
-- Purely additive.

BEGIN;

ALTER TABLE board_meetings
    ADD COLUMN IF NOT EXISTS is_historical boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_board_meetings_historical
    ON board_meetings (is_historical, scheduled_at DESC);

COMMENT ON COLUMN board_meetings.is_historical IS
    'TRUE = a meeting held before the platform existed, entered afterwards for '
    'the archive. Never joinable, never counted as a platform-run meeting, and '
    'its lack of attendance rows means "not captured", NOT "nobody attended".';

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.columns
--    WHERE table_name='board_meetings' AND column_name='is_historical';   -- 1
--   SELECT is_historical, count(*) FROM board_meetings GROUP BY 1;        -- all false
--   -- two historical rows may coexist with no room_name (unique index tolerates NULLs):
--   BEGIN;
--     INSERT INTO board_meetings (title, scheduled_at, is_historical, is_virtual, status)
--     VALUES ('probe a', now(), true, false, 'completed'),
--            ('probe b', now(), true, false, 'completed');               -- must succeed
--   ROLLBACK;
