-- 075: a waiting room for board meetings (GH #466, feedback fb_1787129152)
--
-- WHY: the board secretary asked for it directly — "I can't invite additional
-- attendees and i need waiting room to admit them at their discussion point".
-- The first half shipped in PR #469 (attendees can now be added to a live
-- meeting). This is the second half: a guest brought in for ONE agenda item
-- should not be sitting in the room for the items before theirs. A board
-- discusses things that a subject expert invited for item 4 has no business
-- hearing during items 1 to 3.
--
-- WHY A SEPARATE AXIS, NOT A NEW invite_status:
-- `invite_status` already carries two different ideas — invitation
-- ('invited') and presence ('attended', 'absent', 'observer') — and quorum is
-- computed from it:
--     COUNT(*) FILTER (WHERE a.invite_status = 'attended') AS attended
-- Adding a 'waiting' value to that column would put a third idea into it and
-- put admission on the same axis as the number that decides whether the board
-- could lawfully sit. A held guest must not silently change quorum, in either
-- direction. So admission gets its own columns and the quorum query is
-- untouched by this migration.
--
-- DEFAULT FALSE IS LOAD-BEARING: every existing attendee, and every board
-- member added the normal way, keeps joining without an admission step. Only
-- rows explicitly marked wait. A migration that made the whole board queue for
-- admission would be a far worse outage than the gap it closes.
--
-- admitted_by IS RECORDED because letting someone into a board meeting is a
-- decision someone made, and the rest of this subsystem is auditable
-- (attendance, quorum, minutes). "Who let them in" belongs with it.
--
-- PRECONDITION (verified live 2026-08-21): board_meeting_attendees exists with
-- columns id, meeting_id, user_id, invite_status, is_required, joined_at,
-- left_at, created_at and holds 14 rows (11 'absent', 3 'attended'). None of
-- the three columns below exist yet. If they already exist elsewhere this file
-- is a no-op — every statement is guarded.

BEGIN;

ALTER TABLE board_meeting_attendees
    ADD COLUMN IF NOT EXISTS requires_admission BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS waiting_since TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admitted_by CHAR(15);

COMMENT ON COLUMN board_meeting_attendees.requires_admission IS
    'Guest who must be admitted by an organiser before a token is issued. '
    'FALSE for board members and every pre-existing row — they join directly.';
COMMENT ON COLUMN board_meeting_attendees.waiting_since IS
    'First time this person tried to join and was held. NULL means they have '
    'not knocked yet, which is what separates "waiting" from merely "invited".';
COMMENT ON COLUMN board_meeting_attendees.admitted_at IS
    'When an organiser let them in. Once set, joining behaves normally for the '
    'rest of the meeting — admission is granted once, not per attempt.';
COMMENT ON COLUMN board_meeting_attendees.admitted_by IS
    'The organiser who admitted them. Letting someone into a board meeting is '
    'a decision, and this subsystem records decisions.';

-- The organiser's waiting list: held guests who have actually knocked, for one
-- meeting. Small table today, but this is polled while a meeting is live.
CREATE INDEX IF NOT EXISTS idx_bma_waiting
    ON board_meeting_attendees (meeting_id)
    WHERE requires_admission AND admitted_at IS NULL;

DO $$
DECLARE
    held INTEGER;
BEGIN
    SELECT COUNT(*) INTO held FROM board_meeting_attendees WHERE requires_admission;
    IF held <> 0 THEN
        RAISE EXCEPTION 'expected 0 rows to require admission after this migration, found %. Refusing.', held;
    END IF;
    RAISE NOTICE 'waiting room columns added; % attendees, none held', (SELECT COUNT(*) FROM board_meeting_attendees);
END $$;

COMMIT;

-- Verification:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='board_meeting_attendees'
--      AND column_name IN ('requires_admission','waiting_since','admitted_at','admitted_by');
--   -- expect 4 rows
--   SELECT count(*) FROM board_meeting_attendees WHERE requires_admission;
--   -- expect 0 — nobody is retroactively made to wait
--   SELECT count(*) FROM board_meeting_attendees WHERE invite_status = 'attended';
--   -- expect 3 — quorum inputs unchanged by this migration
