-- 057: The counselling fields the CRM team actually records on a call
--
-- WHY: feedback fb_1786009859 listed 21 fields the career-services team needs
-- on the "Edit Details" form. Most already exist on candidate_profiles and were
-- simply never exposed — date_of_call, education_level, is_student,
-- specialization, english_proficiency, salary_expectations, candidates_source,
-- cv_status, looking_status, preferred_work_setup. Those need form work, not
-- schema.
--
-- These eight have nowhere to go today, so agents have been putting them in the
-- free-text remarks field, where nothing can filter, count or report on them.
--
-- All nullable free text or short enums, because a counselling record is
-- assembled over several calls and is normally incomplete. A NOT NULL here
-- would force an agent to invent a value to save the one field they did learn —
-- which is how "Unknown" ends up meaning three different things.
--
-- PRECONDITION (verified live 2026-08-07): candidate_profiles has 52 columns
-- and none of the eight below; 5,295 rows.
--
-- Purely additive.

BEGIN;

ALTER TABLE candidate_profiles
    -- Where they last worked. Free text: the team records employer names,
    -- emirates and sometimes both.
    ADD COLUMN IF NOT EXISTS previous_work_location varchar(300),
    -- Kept as text, not numeric: institutions report 3.6/4, 88%, "Distinction"
    -- and "Very Good". Forcing a number would lose most of them.
    ADD COLUMN IF NOT EXISTS gpa                    varchar(40),
    -- Likewise text — agents are often told only a year.
    ADD COLUMN IF NOT EXISTS graduation_date        varchar(40),
    ADD COLUMN IF NOT EXISTS sub_specialization     varchar(200),
    -- "3 years", "6 months", "fresh graduate" — a stated duration, not a
    -- computed one, so it stays as given.
    ADD COLUMN IF NOT EXISTS experience_duration    varchar(100),
    -- completed | not_yet_joined | exempted | in_service | not_required
    -- ("not_required" covers female candidates, per the team's own list).
    ADD COLUMN IF NOT EXISTS military_status        varchar(40),
    -- same_field | different_field | any_field
    ADD COLUMN IF NOT EXISTS field_preference       varchar(40),
    -- How long they have been looking. Text for the same reason as above.
    ADD COLUMN IF NOT EXISTS job_search_duration    varchar(100);

-- The CRM filters and reports on these two, so they earn an index.
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_military
    ON candidate_profiles (military_status) WHERE military_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_field_pref
    ON candidate_profiles (field_preference) WHERE field_preference IS NOT NULL;

COMMENT ON COLUMN candidate_profiles.gpa IS
    'Free text on purpose — institutions report 3.6/4, 88%, Distinction and '
    'Very Good. Do not convert to numeric without a normalisation pass.';
COMMENT ON COLUMN candidate_profiles.military_status IS
    'completed | not_yet_joined | exempted | in_service | not_required';
COMMENT ON COLUMN candidate_profiles.field_preference IS
    'same_field | different_field | any_field';

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.columns
--    WHERE table_name='candidate_profiles'
--      AND column_name IN ('previous_work_location','gpa','graduation_date',
--                          'sub_specialization','experience_duration',
--                          'military_status','field_preference',
--                          'job_search_duration');            -- expect 8
--   SELECT count(*) FROM candidate_profiles WHERE gpa IS NOT NULL;  -- 0, additive
