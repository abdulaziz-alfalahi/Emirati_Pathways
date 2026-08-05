-- 053: Record board-meeting joiners who are not on the attendee list
--
-- WHY: found while verifying the board join button on staging 2026-08-05.
-- The join handler records attendance with
--     UPDATE board_meeting_attendees SET invite_status='attended' ...
-- which only touches an EXISTING row. Admins bypass the attendee check (see
-- the `is_admin` branch in board_meetings_routes.join_meeting), so an admin or
-- board operator who joins a meeting they were not invited to leaves NO trace
-- at all — they were in the room and the record does not show it.
--
-- For a governance feature that exists to evidence who attended a board
-- meeting, a silent gap in the attendance record is the whole problem. An
-- auditor asking "who was present?" would get an incomplete answer.
--
-- DELIBERATE: such a joiner is recorded as 'observer', NOT 'attended'. Quorum
-- is computed as COUNT(*) WHERE invite_status='attended', so an observer is
-- visible in the record without inflating quorum — someone who was never
-- invited to the board must not help the board reach quorum. This keeps the
-- attendance record complete and the quorum arithmetic honest at the same
-- time, which is why it is a new status rather than reusing 'attended'.
--
-- PRECONDITION (verified live 2026-08-05): the CHECK constraint is
--   board_meeting_attendees_invite_status_check
--   allowing exactly: invited, accepted, declined, attended, absent.
-- board_meeting_attendees currently holds 0 rows, so widening the constraint
-- cannot invalidate existing data.
--
-- Purely additive: it only widens an allowed set. No existing row changes and
-- nothing that was previously accepted is now rejected.

BEGIN;

ALTER TABLE board_meeting_attendees
    DROP CONSTRAINT IF EXISTS board_meeting_attendees_invite_status_check;

ALTER TABLE board_meeting_attendees
    ADD CONSTRAINT board_meeting_attendees_invite_status_check
    CHECK (invite_status IN ('invited', 'accepted', 'declined',
                             'attended', 'absent', 'observer'));

COMMENT ON COLUMN board_meeting_attendees.invite_status IS
    'invited/accepted/declined are pre-meeting RSVP; attended/absent are the '
    'post-meeting record. observer = joined the room without being on the '
    'attendee list (e.g. an admin). Observers are NOT counted toward quorum, '
    'which counts invite_status = ''attended'' only.';

COMMIT;

-- Verification:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conname='board_meeting_attendees_invite_status_check';  -- 6 values
--   -- negative probe (must fail), run inside a rolled-back transaction:
--   BEGIN;
--     INSERT INTO board_meeting_attendees (meeting_id, user_id, invite_status)
--     VALUES (gen_random_uuid(), '000000000000000', 'bogus');      -- must fail
--   ROLLBACK;
