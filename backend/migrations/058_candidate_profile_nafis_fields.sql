-- 058: the NAFIS-imported fields that had nowhere to land on candidate_profiles
--
-- WHY: the NAFIS talent import captures ~28 structured fields per job seeker
-- (education_level, gpa, specialization, experience_years, emirate, national
-- service, person-of-determination status …) into `nafis_job_seekers`. When the
-- seeker completes UAE Pass onboarding, redeem_seeker_invitation_for_user set
-- ONLY user_id + status — nothing was ever copied onto the candidate's own
-- record. Verified 2026-08-09 by grep: NO code path anywhere writes
-- nafis_job_seekers data into candidate_profiles or user_skills.
--
-- Consequences today: the candidate is asked to re-enter data the government
-- already supplied; the career-services CRM (which reads users +
-- candidate_profiles) cannot see any of it; and matching has no structured
-- inputs for these people.
--
-- Most NAFIS fields already have a home on candidate_profiles thanks to the CRM
-- master-file work (migration 044) and the counselling fields (057). These four
-- do not, and each is worth keeping:
--
--   is_person_of_determination / determination_type
--       PoD status exists ONLY in nafis_job_seekers today — nowhere else in the
--       schema. GH #12 names people of determination as an INCLUSION SIGNAL for
--       the disclosed national-priority axis, so dropping it on redemption
--       silently discards a governed signal the engine is meant to use.
--       (national_priority_engine cannot consume it until it lives here.)
--   marital_status      — imported, no target column.
--   emirate_of_origin   — distinct from emirate_of_residence, which already
--                         exists; NAFIS supplies both.
--
-- All nullable: a NAFIS row may omit any of them, and a candidate who never came
-- through NAFIS has none. NOT NULL would force an invented value.
--
-- PRECONDITION (verified live 2026-08-09): candidate_profiles has 60 distinct
-- columns and none of the four below; nafis_job_seekers holds 3 rows, all with
-- user_id IS NULL (nobody has completed onboarding yet), so there is no
-- historical data to backfill.
--
-- Purely additive.

BEGIN;

ALTER TABLE candidate_profiles
    -- Inclusion signal for the national-priority axis (GH #12). Nullable and
    -- three-valued on purpose: NULL means "not stated", which must NOT be read
    -- as false — the priority engine is required to fail neutral on missing data.
    ADD COLUMN IF NOT EXISTS is_person_of_determination boolean,
    -- Free text: NAFIS supplies a category label, vocabulary not fixed by us.
    ADD COLUMN IF NOT EXISTS determination_type         varchar(120),
    ADD COLUMN IF NOT EXISTS marital_status             varchar(40),
    -- Distinct from the existing emirate_of_residence.
    ADD COLUMN IF NOT EXISTS emirate_of_origin          varchar(80);

-- The priority/inclusion reporting filters on PoD, so it earns a partial index.
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_pod
    ON candidate_profiles (is_person_of_determination)
    WHERE is_person_of_determination IS TRUE;

COMMENT ON COLUMN candidate_profiles.is_person_of_determination IS
    'Inclusion signal for the disclosed national-priority axis (GH #12). '
    'NULL = not stated; do NOT treat NULL as false — the priority engine must '
    'fail neutral on missing data.';
COMMENT ON COLUMN candidate_profiles.emirate_of_origin IS
    'From the NAFIS import; distinct from emirate_of_residence. Never an input '
    'to Job Fit — geography is excluded from the match score by GH #12.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.columns
--    WHERE table_name='candidate_profiles'
--      AND column_name IN ('is_person_of_determination','determination_type',
--                          'marital_status','emirate_of_origin');   -- expect 4
--   SELECT count(*) FROM candidate_profiles
--    WHERE is_person_of_determination IS NOT NULL;                  -- 0, additive
--   -- the partial index exists:
--   SELECT indexname FROM pg_indexes
--    WHERE tablename='candidate_profiles' AND indexname='idx_candidate_profiles_pod';
