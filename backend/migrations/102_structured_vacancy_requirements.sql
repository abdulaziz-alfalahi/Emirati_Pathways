-- 102_structured_vacancy_requirements.sql
--
-- Requested by a call-centre operator, 2026-08-31 (fb_1788155502): structured
-- fields on a vacancy "to ensure that candidates are nominated based on the
-- specific vacancy requirements". Eleven fields were suggested.
--
-- NINE OF THE ELEVEN ALREADY EXISTED. This adds only the two that did not:
-- specialization and working hours. The far larger problem was never a missing
-- column — see below, because it explains why this migration is small and the
-- application change is not.
--
-- WHAT THE INVESTIGATION FOUND
--
-- The canonical matcher (backend/match_scoring.py) reads exactly ONE field from
-- a vacancy: required_skills, carrying 60% of the score. Measured on the live
-- database 2026-09-01:
--
--     vacancies with required_skills populated ..... 0 of 298
--     code anywhere in the backend that WRITES it ... none
--
-- So the dominant scoring axis contributed nothing, for every candidate against
-- every vacancy. The remaining 40% was scored from the candidate's own profile —
-- counting their job entries and checking they had any education at all — never
-- against what the employer asked for. Nothing the employer stated about a role
-- influenced who was nominated for it.
--
-- The columns below are therefore the small half of the fix. The rest is in the
-- application: persisting required_skills when a vacancy is created, and having
-- the matcher compare a candidate against the vacancy's stated requirements.
--
-- PRECONDITION, verified against dghr_prod 2026-09-01:
--   * job_postings has 298 rows
--   * specialization and working_hours do NOT exist
--   * required_skills EXISTS and is jsonb (so it is fed, not created, here)
--   * education_level, experience_level, number_of_vacancies all exist

BEGIN;

ALTER TABLE job_postings
    -- "Specialization / Major". Free text on purpose: NAFIS supplies these as
    -- written by the employer, and forcing a taxonomy we do not have would lose
    -- the employer's own words.
    ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
    -- "Working Days / Hours" as stated in the advert — "Sun–Thu, 8am–4pm".
    -- Text rather than a structured schedule: employers write this in prose and
    -- nothing in the platform reasons about it yet. A shift model can come when
    -- something needs to compute against it.
    ADD COLUMN IF NOT EXISTS working_hours VARCHAR(255);

-- Matching filters on these once the application starts populating them, and
-- job_postings is read on every candidate match.
CREATE INDEX IF NOT EXISTS idx_job_postings_specialization
    ON job_postings(specialization) WHERE specialization IS NOT NULL;

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect both columns present:
--   SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'job_postings'
--      AND column_name IN ('specialization', 'working_hours');
--
-- Expect 298 rows untouched, both columns NULL until vacancies are edited:
--   SELECT count(*) AS total,
--          count(specialization) AS with_specialization,
--          count(working_hours)  AS with_hours
--     FROM job_postings;
--
-- The empty-ness above is CORRECT: nothing backfills these. NAFIS does not
-- supply either field, so they populate as employers state them on new or
-- edited vacancies.
