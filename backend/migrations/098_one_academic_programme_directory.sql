-- 098_one_academic_programme_directory.sql
--
-- Owner, 2026-08-30: "take university programs next."
--
-- WHAT WAS THERE
--
-- University Programs is a DOUBLY PARALLEL subsystem. Two tables exist for each
-- concept the platform already had:
--
--   an institution   institutions       (referenced by institution_staff,
--                                        students, knowledge_camps and
--                                        graduate_programs — the real one)
--                    universities       (referenced by university_programs and
--                                        nothing else)
--
--   a programme      graduate_programs  (migration 097 — sourced, link-checked)
--                    university_programs
--
-- Both parallel tables are EMPTY. They are filled only by
-- backend/migrations/seed_education.py, which the migrations README documents
-- as the way to populate this page, and which would insert:
--
--   * a RANKING of real UAE universities — 1st, 2nd, 3rd — invented, published
--     by a government council
--   * student counts (14,000 / 6,000 / 3,000)
--   * EMPLOYMENT RATES of 96%, 98%, 94%, 92% attributed to named universities
--   * ratings of 4.6-4.9 from a rating system that does not exist
--
-- An invented graduate employment rate is the worst item in this whole sweep:
-- it is the exact number a student uses to choose a degree, and the exact number
-- the Council exists to measure honestly. That script is deleted in the same
-- commit; it also seeds invented scholarships and LMS courses.
--
-- WHAT REPLACES IT
--
-- One directory. An undergraduate degree and a master's are the same object —
-- a programme, at an institution, with a link and a date its details were
-- checked — differing by LEVEL. So graduate_programs becomes academic_programs
-- with a `level`, and serves both pages.
--
-- The table is renamed rather than reused under a name that would then be a
-- lie. It holds 0 rows and shipped hours ago, so this is the cheapest this
-- rename will ever be.
--
-- PRECONDITION, verified against dghr_prod on 2026-08-30:
--   * graduate_programs: 0 rows, graduate_program_interest: 0 rows
--   * universities: 0 rows, university_programs: 0 rows
--   * program_applications: 0 rows, and it FKs to university_programs
--   * institutions is referenced by institution_staff, students,
--     knowledge_camps and graduate_programs — it is the one that stays
--
-- I first wrote this precondition as "nothing outside university_programs
-- references universities", having checked only what points AT `universities`.
-- The rehearsal caught it: program_applications points at university_programs.
-- Recorded because a precondition that was wrong once is worth the next reader
-- knowing about.
--
-- program_applications backs POST /api/education/programs/<id>/apply, which
-- returns "Application submitted successfully" while submitting nothing to any
-- university — the very claim the graduate-programme design establishes this
-- platform cannot honestly make. It is called by no page: the service function
-- exists, no component uses it. It goes with the tables it depends on, and the
-- endpoint with it.

BEGIN;

-- ------------------------------------------- one programme directory -------
ALTER TABLE graduate_programs RENAME TO academic_programs;
ALTER TABLE graduate_program_interest RENAME TO academic_program_interest;

ALTER TABLE academic_programs
    ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL DEFAULT 'masters';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_programs_level_ck') THEN
        ALTER TABLE academic_programs ADD CONSTRAINT academic_programs_level_ck
            CHECK (level IN ('undergraduate','masters','doctorate','diploma','certificate'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_academic_programs_level ON academic_programs(level);

-- --------------------------------------------- retire the parallel pair ----
-- Both are empty and reference only each other. Keeping two empty tables for
-- concepts the platform already has is how the next person ends up filling the
-- wrong one — which is precisely how these came to exist.
DROP TABLE IF EXISTS program_applications;
DROP TABLE IF EXISTS university_programs;
DROP TABLE IF EXISTS universities;

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect academic_programs and academic_program_interest to exist, and the old
-- four names not to:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--      AND table_name IN ('academic_programs','academic_program_interest',
--                         'graduate_programs','graduate_program_interest',
--                         'universities','university_programs','program_applications');
--
-- Expect the level constraint to hold (run and roll back):
--   INSERT INTO academic_programs (title, university, level) VALUES ('ZZ','ZZ','phd');   -- rejected
--   INSERT INTO academic_programs (title, university, level) VALUES ('ZZ','ZZ','doctorate'); -- accepted
--
-- Expect the sourced-publishing rule from 097 to have survived the rename:
--   INSERT INTO academic_programs (title, university, status) VALUES ('ZZ','ZZ','published'); -- rejected
