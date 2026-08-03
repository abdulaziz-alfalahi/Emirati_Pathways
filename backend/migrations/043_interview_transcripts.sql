-- 043: server-side interview transcripts.
--
-- Until now the only transcript source was the recruiter's browser
-- (webkitSpeechRecognition → Google's cloud, one-sided, no speaker labels).
-- The LiveKit transcription agent writes labelled per-speaker segments here;
-- attribution is perfect because each participant is a separate audio track.

CREATE TABLE IF NOT EXISTS interview_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name TEXT NOT NULL,             -- LiveKit room == interview session id
    participant_identity TEXT NOT NULL,  -- verified LiveKit identity (user id)
    participant_name TEXT,
    text TEXT NOT NULL,
    language TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_transcripts_room
    ON interview_transcripts (room_name, created_at);
