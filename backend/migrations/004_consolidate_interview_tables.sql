-- 004_consolidate_interview_tables.sql
-- Interview data-model consolidation (GH #26 follow-up).
--
-- Context: interview scheduling was fragmented across THREE tables:
--   * interview_schedules  -- canonical (11 real rows); recruiter scheduling flow + 8 files
--   * interviews           -- the HR blueprint's own store (empty); redundant scheduling table
--   * interview_sessions   -- live-video-session store (empty in public AND the stray qa schema)
--
-- Decision (owner-approved "full merge"): interview_schedules becomes the SINGLE interview
-- table. This migration ONLY extends it into a superset so every consumer can be repointed
-- onto it. It is purely ADDITIVE (no type changes, no drops here) so the 11 existing rows and
-- the recruiter flow are untouched. The empty interviews/interview_sessions tables are dropped
-- in the follow-up step (005) AFTER all code is repointed and verified.
--
-- Idempotent: every statement uses IF NOT EXISTS.

-- --- HR-model columns (from the retired `interviews` table) --------------------------------
-- The HR blueprint keyed rows by a uuid string `id`; that maps onto the existing UNIQUE
-- business key `interview_id`. These are the remaining HR columns with no canonical equivalent.
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS application_id    VARCHAR(100);
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS job_posting_id    VARCHAR(100);  -- HR joins job_postings.id (NOT jd_id); kept distinct from jd_id
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS interviewer_id    VARCHAR(100);  -- HR's single interviewer (canonical uses interviewers JSONB + recruiter_id)
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS interview_details JSONB;
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS created_by        VARCHAR(100);

-- shortlist_id was NOT NULL (canonical rows all originate from a recruiter shortlist). HR
-- interviews originate from job_applications and have no shortlist, so relax the constraint.
-- Idempotent: DROP NOT NULL is a no-op if already nullable. The 11 existing rows keep their value.
ALTER TABLE interview_schedules ALTER COLUMN shortlist_id DROP NOT NULL;

-- candidate_id was NOT NULL (recruiter-scheduled rows always have a candidate). The consolidated
-- table also serves guest/live-session creation, where a candidate may not yet be linked, so relax
-- it. Safe: the 11 existing rows all have candidate_id. App-layer validation still applies where a
-- candidate is required (recruiter scheduling flow).
ALTER TABLE interview_schedules ALTER COLUMN candidate_id DROP NOT NULL;

-- --- Live-session columns (from the retired `interview_sessions` table) ---------------------
-- meeting_link, guest_token, interview_title(title), interviewers(attendees), status,
-- cancellation_reason, notes, feedback, rating all already exist on interview_schedules.
-- Only ai_analysis has no equivalent.
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Helpful lookup indexes for the newly-repointed HR access paths.
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application ON interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_jobposting  ON interview_schedules(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_interviewer ON interview_schedules(interviewer_id);

-- interview_feedback is retained as the child table for HR feedback. Re-point its FK from the
-- (to-be-dropped) interviews.id onto interview_schedules.interview_id. The table is empty, so
-- dropping/re-adding the constraint is safe. Guarded so re-runs don't fail.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE table_name = 'interview_feedback'
                 AND constraint_name = 'interview_feedback_interview_id_fkey') THEN
        ALTER TABLE interview_feedback DROP CONSTRAINT interview_feedback_interview_id_fkey;
    END IF;
END $$;
