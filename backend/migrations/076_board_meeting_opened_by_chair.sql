-- 076: record the chair declaring a meeting open (owner ruling 2026-08-21)
--
-- WHY: the platform had no notion of a chairman at all — the word appeared only
-- in code comments. The board is seven members with nothing distinguishing
-- them, and the two acts that belong to a chair were sitting elsewhere:
-- adopting the minutes was ORGANISER_ROLES (so the secretary approved the
-- minutes they wrote), and a meeting became 'in_progress' automatically on the
-- first join, whoever that happened to be.
--
-- A meeting starting because somebody opened a browser tab is not the same
-- event as the chair declaring it open with quorum present. The second is a
-- governance fact and the minutes should be able to state it.
--
-- WHY NOT REUSE status='in_progress': that flag already means "the room is
-- live" and the join path writes it. Overloading it would make "the chair
-- opened the meeting" unprovable after the fact, and would silently mark
-- historical meetings as chaired that never were.
--
-- opened_at IS SEPARATE FROM scheduled_at AND FROM the first join, on purpose:
-- a board that convened forty minutes late is a fact the record should keep,
-- not round away.
--
-- QUORUM IS CHECKED AT THE MOMENT OF OPENING and stored with it. Quorum is
-- computed live from who is in the room, so it can be true at 10:05 and false
-- at 10:25; without the snapshot, "was the board quorate when it opened?"
-- becomes unanswerable the moment someone leaves.
--
-- PRECONDITION (verified live 2026-08-21): board_meetings holds 5 rows, all
-- 'completed'; no opened_at/opened_by/opened_quorum column exists. Nothing is
-- backfilled — none of those five was ever declared open by a chair, and
-- inventing that would put a false statement into a governance record.

BEGIN;

ALTER TABLE board_meetings
    ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS opened_by CHAR(15),
    ADD COLUMN IF NOT EXISTS opened_quorum_present SMALLINT,
    ADD COLUMN IF NOT EXISTS opened_quorum_required SMALLINT;

COMMENT ON COLUMN board_meetings.opened_at IS
    'When the chair declared the meeting open. NULL means it was never formally '
    'opened — which is the truth for every meeting held before this existed, '
    'and must not be confused with the meeting not having taken place.';
COMMENT ON COLUMN board_meetings.opened_by IS
    'The chair who opened it. Recorded because declaring a board quorate is a '
    'statement someone makes, not a state the system observes.';
COMMENT ON COLUMN board_meetings.opened_quorum_present IS
    'Members counted toward quorum at the moment of opening. Snapshotted '
    'because the live count changes as people come and go.';
COMMENT ON COLUMN board_meetings.opened_quorum_required IS
    'The quorum rule in force at that moment, stored alongside the count so a '
    'later change to the board-wide rule cannot rewrite whether a past meeting '
    'was quorate.';

DO $$
DECLARE
    opened INTEGER;
BEGIN
    SELECT COUNT(*) INTO opened FROM board_meetings WHERE opened_at IS NOT NULL;
    IF opened <> 0 THEN
        RAISE EXCEPTION 'expected 0 meetings to be marked opened, found %. Refusing.', opened;
    END IF;
    RAISE NOTICE 'chair-opening columns added; % meetings, none marked opened', (SELECT COUNT(*) FROM board_meetings);
END $$;

COMMIT;

-- Verification:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='board_meetings'
--      AND column_name LIKE 'opened%';
--   -- expect 4 rows
--   SELECT count(*) FROM board_meetings WHERE opened_at IS NOT NULL;
--   -- expect 0 — no meeting is retroactively declared chaired
--   SELECT count(*) FROM board_meetings WHERE status = 'completed';
--   -- expect 5 — statuses untouched by this migration
