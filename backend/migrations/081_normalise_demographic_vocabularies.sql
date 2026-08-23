-- 081_normalise_demographic_vocabularies.sql
--
-- WHY
--
-- Two importers wrote two spellings of the same categories into
-- candidate_profiles.education_level, so the board's Demographics tab drew
-- duplicate bars for one category. The NAFIS bulk file uses a compact
-- vocabulary ("HighSchool"); the CRM's own entry screens and the university
-- feeds use a spelled-out one ("High School"). Both land in the same column.
--
-- Measured live on dghr_prod 2026-08-23, candidate_profiles (38,297 rows):
--
--     HighSchool          15,949      High School            798
--     BelowHighSchool      4,540      Below High School      131
--     Master's Degree         94      Master                   1
--
-- and in emirate_of_residence, casing and typos in a column that is only 9%
-- populated to begin with:
--
--     Dubai   3,191 / DUBAI 11        Abu Dhabi 197 / Abu Dahbi 1 / Abu dahbi 1
--     Al Ain      3 / Al ain 1 / Alain 1 / alain 1
--     Fujairah   17 / Al Fujairah 1   Umm Al Quwain 14 / Umm Al quwain 1
--
-- nafis_job_seekers carries the compact vocabulary too (HighSchool 2,122;
-- BelowHighSchool 519; Bachelor 2; Master 1) with no spelled-out duplicates and
-- a clean emirate column. It is normalised here as well, because the same
-- importer writes both tables and leaving one behind guarantees they drift.
--
-- NOT DONE HERE, DELIBERATELY
--
--   * 'University' (12,078) is NOT merged into "Bachelor's Degree" (1,168).
--     They look like the same duplicate-vocabulary problem and they are not:
--     'University' is the NAFIS file's single coarse bucket for all
--     university-level education, while the spelled-out vocabulary separates
--     Bachelor's / Master's / Doctorate. Merging would assert that none of
--     those 12,078 people hold a postgraduate degree. Both vocabularies occur
--     within the same candidates_source values, so no importer rule could split
--     them after the fact either. It stays its own bucket and the UI labels it
--     as an unspecified level.
--
--   * 'Al Ain' is NOT folded into 'Abu Dhabi', nor 'Hatta' into 'Dubai'. Those
--     are cities within those emirates; rolling them up is a geographic
--     judgement rather than a spelling fix, and Hatta is a named CRM cohort the
--     team tracks on purpose.
--
-- DECAY
--
-- A one-off UPDATE that nothing enforces is a cleanup with a shelf life: the
-- CRM importer runs again and reintroduces "HighSchool". The write path is
-- fixed in the same change — backend/demographics.py holds the alias maps and
-- scripts/import_crm_master_file.py normalises before insert. This migration
-- repairs the rows already stored; that code stops them coming back.
--
-- IF THE PRECONDITION DIFFERS ELSEWHERE
--
-- Every statement is a value-mapped UPDATE guarded by its own WHERE, so a
-- database that never received the compact vocabulary simply updates 0 rows.
-- Re-running is a no-op: the targets are not themselves aliases.

BEGIN;

-- Snapshot before any write. Keyed by user_id / emirates_id so a repair can be
-- joined back row by row, not just counted.
CREATE TABLE IF NOT EXISTS _backup_demographic_vocab_081 AS
SELECT user_id,
       education_level      AS education_level_before,
       emirate_of_residence AS emirate_before,
       NOW()                AS captured_at
  FROM candidate_profiles
 WHERE education_level IS NOT NULL OR emirate_of_residence IS NOT NULL;

CREATE TABLE IF NOT EXISTS _backup_njs_vocab_081 AS
SELECT emirates_id,
       education_level      AS education_level_before,
       emirate_of_residence AS emirate_before,
       NOW()                AS captured_at
  FROM nafis_job_seekers
 WHERE education_level IS NOT NULL OR emirate_of_residence IS NOT NULL;

-- ── candidate_profiles.education_level ──────────────────────────────────────
UPDATE candidate_profiles SET education_level = 'High School'
 WHERE education_level = 'HighSchool';

UPDATE candidate_profiles SET education_level = 'Below High School'
 WHERE education_level = 'BelowHighSchool';

UPDATE candidate_profiles SET education_level = 'High Diploma'
 WHERE education_level = 'HighDiploma';

UPDATE candidate_profiles SET education_level = 'Master''s Degree'
 WHERE education_level IN ('Master', 'Masters');

UPDATE candidate_profiles SET education_level = 'Bachelor''s Degree'
 WHERE education_level IN ('Bachelor', 'Bachelors');

UPDATE candidate_profiles SET education_level = 'Doctorate'
 WHERE education_level IN ('PhD', 'Phd');

-- ── candidate_profiles.emirate_of_residence ─────────────────────────────────
UPDATE candidate_profiles SET emirate_of_residence = 'Dubai'
 WHERE emirate_of_residence <> 'Dubai' AND LOWER(TRIM(emirate_of_residence)) = 'dubai';

UPDATE candidate_profiles SET emirate_of_residence = 'Abu Dhabi'
 WHERE emirate_of_residence <> 'Abu Dhabi'
   AND LOWER(TRIM(emirate_of_residence)) IN ('abu dhabi', 'abu dahbi');

UPDATE candidate_profiles SET emirate_of_residence = 'Al Ain'
 WHERE emirate_of_residence <> 'Al Ain'
   AND LOWER(TRIM(emirate_of_residence)) IN ('al ain', 'alain');

UPDATE candidate_profiles SET emirate_of_residence = 'Fujairah'
 WHERE emirate_of_residence <> 'Fujairah'
   AND LOWER(TRIM(emirate_of_residence)) IN ('fujairah', 'al fujairah');

UPDATE candidate_profiles SET emirate_of_residence = 'Umm Al Quwain'
 WHERE emirate_of_residence <> 'Umm Al Quwain'
   AND LOWER(TRIM(emirate_of_residence)) = 'umm al quwain';

UPDATE candidate_profiles SET emirate_of_residence = 'Ras Al Khaimah'
 WHERE emirate_of_residence <> 'Ras Al Khaimah'
   AND LOWER(TRIM(emirate_of_residence)) = 'ras al khaimah';

UPDATE candidate_profiles SET emirate_of_residence = 'Sharjah'
 WHERE emirate_of_residence <> 'Sharjah' AND LOWER(TRIM(emirate_of_residence)) = 'sharjah';

UPDATE candidate_profiles SET emirate_of_residence = 'Ajman'
 WHERE emirate_of_residence <> 'Ajman' AND LOWER(TRIM(emirate_of_residence)) = 'ajman';

UPDATE candidate_profiles SET emirate_of_residence = 'Hatta'
 WHERE emirate_of_residence <> 'Hatta' AND LOWER(TRIM(emirate_of_residence)) = 'hatta';

-- ── nafis_job_seekers, same vocabulary ──────────────────────────────────────
UPDATE nafis_job_seekers SET education_level = 'High School'
 WHERE education_level = 'HighSchool';

UPDATE nafis_job_seekers SET education_level = 'Below High School'
 WHERE education_level = 'BelowHighSchool';

UPDATE nafis_job_seekers SET education_level = 'High Diploma'
 WHERE education_level = 'HighDiploma';

UPDATE nafis_job_seekers SET education_level = 'Master''s Degree'
 WHERE education_level IN ('Master', 'Masters');

UPDATE nafis_job_seekers SET education_level = 'Bachelor''s Degree'
 WHERE education_level IN ('Bachelor', 'Bachelors');

UPDATE nafis_job_seekers SET education_level = 'Doctorate'
 WHERE education_level IN ('PhD', 'Phd');

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. No compact spellings left in either table. Expect 0 rows.
--
--    SELECT 'candidate_profiles' AS t, education_level, COUNT(*)
--      FROM candidate_profiles
--     WHERE education_level IN ('HighSchool','BelowHighSchool','HighDiploma',
--                               'Master','Masters','Bachelor','Bachelors','PhD','Phd')
--     GROUP BY 1,2
--    UNION ALL
--    SELECT 'nafis_job_seekers', education_level, COUNT(*)
--      FROM nafis_job_seekers
--     WHERE education_level IN ('HighSchool','BelowHighSchool','HighDiploma',
--                               'Master','Masters','Bachelor','Bachelors','PhD','Phd')
--     GROUP BY 1,2;
--
-- 2. The merged buckets carry the sum of their parts. Expect
--    High School 16,747; Below High School 4,671; Master's Degree 95;
--    University 12,078 (UNCHANGED — see the note above).
--
--    SELECT education_level, COUNT(*) FROM candidate_profiles
--     GROUP BY 1 ORDER BY 2 DESC;
--
-- 3. Nothing was lost: every row still has whatever it had before.
--    Expect 0 rows.
--
--    SELECT COUNT(*) FROM _backup_demographic_vocab_081 b
--      JOIN candidate_profiles cp USING (user_id)
--     WHERE (b.education_level_before IS NULL) <> (cp.education_level IS NULL)
--        OR (b.emirate_before IS NULL) <> (cp.emirate_of_residence IS NULL);
--
-- 4. Emirate casing collapsed. Expect one row per emirate, no case variants.
--
--    SELECT emirate_of_residence, COUNT(*) FROM candidate_profiles
--     WHERE emirate_of_residence IS NOT NULL GROUP BY 1 ORDER BY 2 DESC;
