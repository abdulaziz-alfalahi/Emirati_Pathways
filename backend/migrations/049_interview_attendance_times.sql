-- 049: Record when an interview call actually started and ended
--
-- WHY: the owner's rule is that an interview only counts as held if someone
-- was in the call for at least two minutes ("The previous interviews are
-- showing as 'Completed', although I was not interviewed; I only joined the
-- call and then left"). Nothing on the platform recorded attendance times:
-- interview_schedules has only duration_minutes (the PLANNED length), and
-- video_interview_sessions — which does have started_at/ended_at — is never
-- written to (0 rows live). Status was therefore settled purely from the
-- scheduled window, so a 10-second join looked identical to a full interview.
--
-- PRECONDITION (verified live 2026-08-04): interview_schedules has no
-- started_at/ended_at column; video_interview_sessions is empty.
--
-- Purely additive.

BEGIN;

ALTER TABLE interview_schedules
    ADD COLUMN IF NOT EXISTS started_at timestamptz,
    ADD COLUMN IF NOT EXISTS ended_at   timestamptz;

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.columns
--    WHERE table_name='interview_schedules' AND column_name IN ('started_at','ended_at');
--   -- expect 2
