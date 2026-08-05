-- 050: Board meetings — schedule + attendance, with a joinable video room
--
-- WHY: board members had no way to join a board video meeting, and there was
-- no record of meetings at all (no calendar, no attendance). This adds the
-- minimum spine the owner approved: a meetings table with a video room, plus
-- per-member attendance so quorum can be evidenced later.
--
-- Attendance is recorded here rather than inferred from the video room because
-- a board meeting can be held in person, and because quorum is a governance
-- fact that must survive any change of video provider.
--
-- PRECONDITION (verified live 2026-08-05): neither board_meetings nor
-- board_meeting_attendees exists. 5 users hold board_member. users.id is
-- CHAR(15) (Emirates ID), matching board_directives.author_id varchar.
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS board_meetings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title           varchar(300) NOT NULL,
    title_ar        varchar(300),
    agenda          text,
    agenda_ar       text,
    scheduled_at    timestamptz NOT NULL,
    duration_minutes integer NOT NULL DEFAULT 60,
    location        varchar(300),           -- physical venue, when not virtual
    is_virtual      boolean NOT NULL DEFAULT true,
    -- LiveKit room name. Generated on creation so the join button is stable
    -- for the life of the meeting (and so a recording/transcript can be tied
    -- to it later).
    room_name       varchar(120) UNIQUE,
    status          varchar(20) NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
    -- Quorum required for decisions to be valid; NULL = not yet configured.
    quorum_required smallint,
    started_at      timestamptz,
    ended_at        timestamptz,
    created_by      char(15),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_meetings_scheduled ON board_meetings (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_meetings_status    ON board_meetings (status);

CREATE TABLE IF NOT EXISTS board_meeting_attendees (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id   uuid NOT NULL REFERENCES board_meetings(id) ON DELETE CASCADE,
    user_id      char(15) NOT NULL,
    -- invited -> the secretary put them on the list
    -- accepted/declined -> their RSVP
    -- attended -> they actually joined (stamped on join)
    invite_status varchar(20) NOT NULL DEFAULT 'invited'
                  CHECK (invite_status IN ('invited','accepted','declined','attended','absent')),
    is_required  boolean NOT NULL DEFAULT true,   -- counts toward quorum
    joined_at    timestamptz,
    left_at      timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_attendees_meeting ON board_meeting_attendees (meeting_id);
CREATE INDEX IF NOT EXISTS idx_board_attendees_user    ON board_meeting_attendees (user_id);

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.tables
--    WHERE table_name IN ('board_meetings','board_meeting_attendees');   -- expect 2
--   INSERT INTO board_meetings (title, scheduled_at, status)
--     VALUES ('x', now(), 'bogus');   -- must fail the status CHECK
