-- Migration 031 — Institution model + institution-scoped enrolment authority
--
-- WHY: Enrolment (granting a person the `student` role) was gated to the
-- internship_coordinator, but the coordinator only enters at the internship
-- stage — far too late to own who becomes a student. The Academic Advisor is
-- the institution-side role present from the start of a student's journey and
-- already owns the advisor<->student caseload (advisor_student_assignments).
-- The owner decided (2026-07-25):
--   * enrolment authority = Academic Advisor + Education Operator + Admin
--     (internship_coordinator dropped);
--   * advisors are bound to a specific institution and may only enrol / manage
--     students of that institution;
--   * students who have not yet logged in via UAE Pass are pre-created by their
--     real Emirates ID and bound when they authenticate (identity model #90).
-- This migration adds the institution model needed for that scoping. It also
-- lets the internship coordinator be scoped by institution (so "propose to my
-- student" means a student at an institution the coordinator is staff of,
-- replacing the advisor_student_assignments check the advisor now owns).
--
-- PRECONDITION (verified live against dghr_prod on 2026-07-25):
--   * to_regclass('institutions')       -> NULL  (does not exist)
--   * to_regclass('institution_staff')  -> NULL  (does not exist)
--   * students exists with a free-text `institution` VARCHAR and CHAR user_id,
--     and NO `institution_id` column.
--   * advisor_student_assignments exists (advisor caseload) and is retained.
-- If institution_id already exists elsewhere, the guarded ADD COLUMN is a no-op.
--
-- Idempotent (IF NOT EXISTS throughout); no destructive statements, so no
-- backup table is required.

BEGIN;

-- Canonical list of academic institutions (schools, universities, providers).
CREATE TABLE IF NOT EXISTS institutions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    name_ar     VARCHAR(255),
    type        VARCHAR(30)  NOT NULL DEFAULT 'university',  -- school | university | training
    emirate     VARCHAR(50),
    code        VARCHAR(50),
    created_by  CHAR(15),
    created_at  TIMESTAMP DEFAULT NOW()
);
-- Case-insensitive uniqueness on the display name (no canonical code exists yet),
-- so find-or-create at enrol time cannot fork the same institution into two rows.
CREATE UNIQUE INDEX IF NOT EXISTS ux_institutions_name_ci ON institutions (LOWER(name));

-- Institution-side staff: binds an advisor OR a coordinator to an institution.
-- A user may hold more than one staff_role at an institution, hence the triple key.
CREATE TABLE IF NOT EXISTS institution_staff (
    id             SERIAL PRIMARY KEY,
    user_id        CHAR(15) NOT NULL,
    institution_id INTEGER  NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    staff_role     VARCHAR(30) NOT NULL DEFAULT 'advisor',      -- advisor | coordinator
    status         VARCHAR(20) NOT NULL DEFAULT 'active',       -- active | inactive
    created_by     CHAR(15),
    created_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, institution_id, staff_role)
);
CREATE INDEX IF NOT EXISTS idx_institution_staff_user ON institution_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_staff_inst ON institution_staff(institution_id);

-- Scope a student to a canonical institution (legacy free-text `institution` kept).
ALTER TABLE students ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id);
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON students(institution_id);

COMMIT;

-- Verification (expected results):
--   SELECT to_regclass('institutions'), to_regclass('institution_staff');   -- both non-NULL
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='students' AND column_name='institution_id';         -- 1 row
--   SELECT indexname FROM pg_indexes WHERE tablename='institutions'
--     AND indexname='ux_institutions_name_ci';                              -- 1 row
