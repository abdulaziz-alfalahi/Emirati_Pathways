-- 106_vacancy_branches_and_accessibility.sql
--
-- Three things recruiters asked for on 2026-09-02, all on the job posting and
-- all from the same UAT session:
--
--   fb_1788340436  "Multiple locations needed in the job posting. e.g.
--                   different branches."
--   fb_1788342002  "...indicate whether a job vacancy is designated for, or
--                   suitable for, People of Determination, through a simple
--                   Yes/No option within the job posting details."
--   fb_1788341608  "...a dedicated field to specify the number of vacancies...
--                   the job posting will remain active and continue accepting
--                   applications until all approved vacancies... have been
--                   covered."
--
-- PRECONDITION, verified against dghr_prod 2026-09-02:
--   * job_postings has 289 rows
--   * `location` (text), `emirate` and `city` (varchar) exist and are SINGLE
--     valued — 273 of 289 have no location recorded at all
--   * `number_of_vacancies` (integer) ALREADY EXISTS and every row holds 1:
--     migration 102 and PR #564 added it to the insert, but nothing lets a
--     recruiter set it above 1 and nothing reads it. That is an application
--     gap, not a schema one, so this migration does not touch that column.
--   * no column exists for People of Determination
--
-- WHY `locations` IS ADDITIVE RATHER THAN A REPLACEMENT
--
-- emirate/city/location/latitude/longitude are read in many places, including
-- the JD wizard's map pin and the commute information shown to candidates.
-- Replacing them with an array would mean finding every reader in one change.
-- Instead the FIRST entry of `locations` is the existing single location, and
-- the old columns keep working untouched. A posting with one branch is
-- byte-for-byte what it was.
--
-- Nothing here affects match scoring. GH #12 settled that there is no geography
-- factor: commute is informational, and adding branches must not quietly turn
-- location into a ranking signal.

BEGIN;

ALTER TABLE job_postings
    -- Additional branches for one vacancy, as [{"emirate": "...", "city": "...",
    -- "branch": "..."}]. jsonb rather than a child table: this is display and
    -- filter data with no identity of its own, nothing joins to a branch, and a
    -- posting has a handful at most.
    ADD COLUMN IF NOT EXISTS locations jsonb,
    -- Yes / No / not stated. NULLABLE ON PURPOSE: 289 existing postings were
    -- created before anyone was asked, and defaulting them to FALSE would state
    -- on every one of them that the employer had considered accessibility and
    -- declined it. "Not stated" is the truth for those rows.
    ADD COLUMN IF NOT EXISTS suitable_for_people_of_determination boolean;

COMMENT ON COLUMN job_postings.locations IS
    'Additional branches for this vacancy. The first location remains in '
    'emirate/city/location so existing readers are unaffected.';
COMMENT ON COLUMN job_postings.suitable_for_people_of_determination IS
    'Employer statement. NULL means not stated, which is not the same as No.';

-- Postings suitable for People of Determination are a small subset that
-- candidates will want to filter to; the partial index keeps that cheap without
-- indexing the 289 NULLs.
CREATE INDEX IF NOT EXISTS idx_job_postings_pod
    ON job_postings(suitable_for_people_of_determination)
 WHERE suitable_for_people_of_determination IS TRUE;

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect both columns, and number_of_vacancies unchanged:
--   SELECT column_name, data_type, is_nullable FROM information_schema.columns
--    WHERE table_name = 'job_postings'
--      AND column_name IN ('locations', 'suitable_for_people_of_determination',
--                          'number_of_vacancies');
--
-- Expect 289 / 0 / 0 — no row is altered, and NOBODY is recorded as having
-- declined accessibility:
--   SELECT count(*) AS total,
--          count(locations) AS with_branches,
--          count(suitable_for_people_of_determination) AS pod_stated
--     FROM job_postings;
--
-- Expect every row still to say 1 vacancy, untouched by this migration:
--   SELECT number_of_vacancies, count(*) FROM job_postings GROUP BY 1;
