-- 023_education_intelligence_tables.sql
-- Cluster B8 (education) + B13 (intelligence) landmine fix.
--
-- B8: education_api_routes.py queries five relations that never existed on the
-- live DB. Every reachable endpoint touching them either 500'd (POST
-- course-enroll, course-complete, program-apply) or silently returned empty
-- via the query_all/query_one try/except (GET universities, programs, the
-- education-operator dashboards). role_routes.py:62 also selects from
-- `universities`. This migration creates the five missing tables to match
-- exactly what the code reads/writes — no fabricated seed rows, so the
-- endpoints return real (empty) data instead of errors.
--
-- B13: recommendation_engine.py wrote/read phantom `recommendations` and
-- `recommendation_feedback`. A `user_recommendations` table ALREADY EXISTS
-- live (with inline feedback columns: feedback, feedback_notes, acted_at,
-- status), so the engine is being repointed to it in code — NO new
-- recommendation table is created here (none is needed).
--
-- PRECONDITION (verified live 2026-07-24 via information_schema):
--   - universities, university_programs, lms_enrollments,
--     program_applications, education_programs: ALL ABSENT from schema public.
--   - scholarships: EXISTS, 0 rows (columns: title, provider_name, description,
--     amount, coverage_type, deadline, min_gpa, academic_level, eligible_majors,
--     application_link, is_active, created_at, institution_id). create-scholarship
--     is fixed IN CODE to insert only these columns — schema untouched here.
--   - lms_courses: EXISTS (id integer PK) — lms_enrollments.course_id FKs it.
--   - user_recommendations: EXISTS, 0 rows — engine repointed in code.
--   - recommendation_feedback: ABSENT and NOT needed (feedback is inline on
--     user_recommendations).
--   - users.id: character(15).
-- Idempotent; additive; CREATE TABLE IF NOT EXISTS only; NO DROP; NO seed rows.

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- universities  (education_api_routes get_universities/get_university,
--                the operator dashboards, and role_routes.py institution search)
-- get_universities selects: id, name, name_ar, location, type, established,
--   ranking, students_count, programs_count, website, description,
--   description_ar, specialties, logo_url  WHERE active = TRUE
-- operator endpoints select u.is_active; role_routes filters is_active = true.
-- Both `active` and `is_active` are read by live code, so both exist.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS universities (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    name_ar         VARCHAR(255),
    location        VARCHAR(255),
    type            VARCHAR(100),
    established      INTEGER,
    ranking         INTEGER,
    students_count  INTEGER,
    programs_count  INTEGER,
    website         VARCHAR(500),
    description     TEXT,
    description_ar  TEXT,
    specialties     JSONB DEFAULT '[]'::jsonb,
    logo_url        VARCHAR(500),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- university_programs  (get_programs/get_program/get_university, apply,
--                       my_progress, and the operator dashboards)
-- get_programs uses p.* + filters category/degree/university_id/title/title_ar
--   and orders by is_popular, rating; JSON fields career_outcomes/subjects/
--   skills_taught/accreditation; WHERE p.active = TRUE.
-- operator dashboards read: name, name_ar, program_type, enrolled, capacity,
--   is_active, created_at.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS university_programs (
    id               SERIAL PRIMARY KEY,
    university_id    INTEGER REFERENCES universities(id),
    title            VARCHAR(255),
    title_ar         VARCHAR(255),
    name             VARCHAR(255),
    name_ar          VARCHAR(255),
    degree           VARCHAR(100),
    category         VARCHAR(100),
    program_type     VARCHAR(100),
    description      TEXT,
    description_ar   TEXT,
    duration         VARCHAR(100),
    rating           NUMERIC,
    is_popular       BOOLEAN NOT NULL DEFAULT FALSE,
    enrolled         INTEGER NOT NULL DEFAULT 0,
    capacity         INTEGER NOT NULL DEFAULT 0,
    career_outcomes  JSONB DEFAULT '[]'::jsonb,
    subjects         JSONB DEFAULT '[]'::jsonb,
    skills_taught    JSONB DEFAULT '[]'::jsonb,
    accreditation    JSONB DEFAULT '[]'::jsonb,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_university_programs_university
    ON university_programs (university_id);

-- ─────────────────────────────────────────────────────────────
-- lms_enrollments  (enroll_in_course, complete_course, my_progress)
-- INSERT (user_id, course_id) ON CONFLICT (user_id, course_id) DO NOTHING
--   RETURNING id, status, enrolled_at
-- UPDATE ... SET status='completed', progress_pct=100, completed_at=NOW()
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_enrollments (
    id            SERIAL PRIMARY KEY,
    user_id       CHAR(15) NOT NULL REFERENCES users(id),
    course_id     INTEGER NOT NULL REFERENCES lms_courses(id),
    status        VARCHAR(30) NOT NULL DEFAULT 'active',
    progress_pct  INTEGER NOT NULL DEFAULT 0,
    enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMPTZ,
    UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_user
    ON lms_enrollments (user_id);

-- ─────────────────────────────────────────────────────────────
-- program_applications  (apply_to_program, my_progress)
-- INSERT (user_id, program_id, application_data)
--   RETURNING id, status, submitted_at
-- existence check: SELECT id WHERE user_id = %s AND program_id = %s
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_applications (
    id                SERIAL PRIMARY KEY,
    user_id           CHAR(15) NOT NULL REFERENCES users(id),
    program_id        INTEGER NOT NULL REFERENCES university_programs(id),
    application_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
    status            VARCHAR(30) NOT NULL DEFAULT 'submitted',
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, program_id)
);
CREATE INDEX IF NOT EXISTS idx_program_applications_program
    ON program_applications (program_id);

-- ─────────────────────────────────────────────────────────────
-- education_programs  (government_dashboard: SELECT COUNT(*) only)
-- Minimal, sensible shape; the sole live reference is a guarded COUNT.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS education_programs (
    id             SERIAL PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    title_ar       VARCHAR(255),
    provider       VARCHAR(255),
    category       VARCHAR(100),
    description    TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;

-- VERIFICATION:
--   SELECT COUNT(*) FROM universities;          -- 0
--   SELECT COUNT(*) FROM university_programs;    -- 0
--   SELECT COUNT(*) FROM lms_enrollments;        -- 0
--   SELECT COUNT(*) FROM program_applications;   -- 0
--   SELECT COUNT(*) FROM education_programs;      -- 0
--   \d lms_enrollments                            -- user_id character(15), UNIQUE(user_id,course_id)
