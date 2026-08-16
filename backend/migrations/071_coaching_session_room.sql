-- 071: a video room for a coaching session
--
-- WHY: a coach and client should be able to meet online. The platform already
-- runs LiveKit for video interviews and board meetings, so this is a room name
-- on the session, not a second video stack.
--
-- ONE COLUMN, NOT TWO. `coaching_sessions.session_date` already exists and
-- defaults to now(). It is tempting to add `scheduled_at` alongside it and let
-- session_date stay the log timestamp — that is exactly the duplication that
-- put both `applied_at` AND `submitted_at` on job_applications, where they are
-- populated identically and nothing records which is authoritative (#417).
-- So `session_date` IS the session time: now() for one logged after the fact,
-- a future time for one being scheduled. Nothing new is needed to express that.
--
-- room_name NULL means the session has no video room. That is the honest
-- representation of a session logged retrospectively — a conversation that
-- already happened in person does not acquire a room, and a nullable column
-- says so better than a boolean that has to be kept in step.
--
-- WHAT THIS DELIBERATELY DOES NOT ADD: transcription. The interview pipeline
-- has an agent that joins a room and transcribes to `interview_transcripts`.
-- Coaching is a more sensitive conversation than an interview and the client
-- has not agreed to be recorded, so no agent joins a coaching room. Adding it
-- later is a consent decision first and a technical one second.
--
-- PRECONDITION (verified live 2026-08-16): coaching_sessions has 9 columns and
-- 0 rows; no room_name column exists. board_meetings.room_name is the pattern
-- being followed.

BEGIN;

ALTER TABLE coaching_sessions
    ADD COLUMN IF NOT EXISTS room_name VARCHAR(120);

COMMENT ON COLUMN coaching_sessions.room_name IS
    'LiveKit room for this session, or NULL when it has no video room (e.g. a '
    'session logged after it happened in person). Minted at booking; joined via '
    'POST /api/coach/sessions/<id>/join, which admits only that session''s coach '
    'and client.';

-- Joining looks the session up by id, so no index is added: the primary key
-- already serves it and coaching_sessions has no volume to justify more.

COMMIT;

-- Verification:
--   SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'coaching_sessions' AND column_name = 'room_name';
--   -- expect one row, character varying
--   SELECT count(*) FROM coaching_sessions WHERE room_name IS NOT NULL;  -- expect 0
