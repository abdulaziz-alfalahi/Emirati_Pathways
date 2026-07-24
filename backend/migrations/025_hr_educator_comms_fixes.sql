-- 025_hr_educator_comms_fixes.sql
-- Cross-cluster landmine fixes: B3 (HR approvals), B7 (educator dashboard),
-- B9 (interview calendar), B11 (coach), B12 (messages).
--
-- Most items in this batch are pure column-drift CODE fixes against columns
-- that already exist live and need NO schema change:
--   B3  offer_approval_requests.submitted_at  -> requested_at  (+ position_title/
--       salary_amount read from oar itself; `offers` has neither column).
--   B11 user_skills.proficiency_level -> proficiency; skill_taxonomy PK is
--       skill_id (there is no st.id) — both fixed in coach_routes.py.
--   B12 users has no `name` column (full_name only) — fixed in
--       communication_routes.py.
-- This migration only creates the two relations the code genuinely needs and
-- the live schema lacks. No DROP, no fabricated data, idempotent.
--
-- B9 (interview calendar): hr_interview_scheduling_routes.py inserts into and
-- reads from `interview_notifications` (send calendar invites + run reminders).
-- That table is PHANTOM live — the only cousin is `application_notifications`,
-- whose shape (application_id/notification_type/title/message/is_read/...) does
-- not match what the interview code writes (interview_id/recipient_type/
-- recipient_id/message_content/delivery_status). So invite + reminder endpoints
-- 500 on every call. Create the table matching exactly what the code writes.
--
-- B7 (educator dashboard): the LIVE `student_progress` is a per-enrollment
-- course-progress tracker (enrollment_id, module_id, progress_percentage,
-- time_spent_minutes, completion_status, notes). educator_routes.py instead
-- treats it as a per-student academic gradebook (student_id, subject, score,
-- max_score, grade, assessment_type, assessment_date, feedback) to compute GPA,
-- render a student's academic history, and POST academic records. Those two
-- models are incompatible and existing columns do NOT suffice, so the educator
-- feature genuinely needs a separate academic-record store. Create
-- `student_academic_records` and repoint the educator queries to it in code.
--
-- PRECONDITION (verified live 2026-07-24 via information_schema, schema public):
--   - interview_notifications:   ABSENT.
--   - student_academic_records:  ABSENT.
--   - interview_schedules.interview_id = varchar; .candidate_id = char;
--     .interviewer_id = varchar  (recipient_id therefore varchar).
--   - students.id = uuid; students has NO enrollment_date (code now reads it
--     from enrollments via subquery).
--   - offer_approval_requests has requested_at/position_title/salary_amount and
--     NO submitted_at; `offers` has neither position_title nor salary_amount.
--   - user_skills.proficiency (not proficiency_level); skill_taxonomy.skill_id
--     (not id); users.full_name (no `name`). Those are code-only fixes.

BEGIN;

-- B9: interview invite/reminder notification log ----------------------------
CREATE TABLE IF NOT EXISTS interview_notifications (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id      varchar NOT NULL,        -- interview_schedules.interview_id
    notification_type varchar NOT NULL,        -- 'calendar_invite' | 'reminder' | ...
    recipient_type    varchar NOT NULL,        -- 'candidate' | 'interviewer'
    recipient_id      varchar,                 -- users.id (char/varchar)
    message_content   text,                    -- json.dumps(...) payload
    delivery_status   varchar NOT NULL DEFAULT 'pending',
    created_at        timestamp without time zone NOT NULL DEFAULT now()
);

-- Supports the reminder dedup lookup (interview_id + type + recipient + recency)
CREATE INDEX IF NOT EXISTS idx_interview_notifications_lookup
    ON interview_notifications (interview_id, notification_type, recipient_type, recipient_id, created_at);

-- B7: per-student academic gradebook (distinct from course student_progress) -
CREATE TABLE IF NOT EXISTS student_academic_records (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject         varchar,
    assessment_type varchar DEFAULT 'exam',
    score           numeric,
    max_score       numeric DEFAULT 100,
    grade           varchar,
    assessment_date date,
    feedback        text,
    created_at      timestamp without time zone NOT NULL DEFAULT now(),
    updated_at      timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_academic_records_student
    ON student_academic_records (student_id);

COMMIT;
