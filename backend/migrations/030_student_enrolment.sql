-- Migration 030: Student enrolment (Phase B of the identity-model rework)
--
-- WHY (owner design session 2026-07-24): make `student` a first-class,
-- enrolment-verified role. A student is a person whose enrolment an institution
-- (education_operator/admin) or their internship coordinator has verified. The
-- `students` table already exists (empty) keyed by user_id, and
-- `advisor_student_assignments` links a coordinator/advisor to a student — but
-- `students` has no institution/program and no record of who verified enrolment.
--
-- PRECONDITION verified live 2026-07-24: students(user_id, student_id, status all
-- nullable, 0 rows); advisor_student_assignments(advisor_id, student_id, status,
-- 0 rows). users.id char(15).
--
-- SAFETY: additive only. Both tables empty, so the new unique index on user_id
-- cannot conflict.

BEGIN;

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS institution VARCHAR(255),
    ADD COLUMN IF NOT EXISTS program     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS enrolled_by CHAR(15),
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- One student record per user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_user_id
    ON students (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asa_advisor ON advisor_student_assignments (advisor_id);
CREATE INDEX IF NOT EXISTS idx_asa_student ON advisor_student_assignments (student_id);

COMMIT;

-- Verification:
--   SELECT column_name FROM information_schema.columns WHERE table_name='students'
--     AND column_name IN ('institution','program','enrolled_by','verified_at');  -> 4
--   SELECT indexname FROM pg_indexes WHERE tablename='students'
--     AND indexname='uq_students_user_id';                                       -> 1
