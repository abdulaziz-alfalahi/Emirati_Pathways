-- 082_normalise_age_bands.sql
--
-- WHY
--
-- The board's age-distribution chart drew an empty "30-35" tick between two
-- populated bands, and the owner read it as a missing age group: "الرسم البياني
-- لا يحتوي على عمر 30 إلى 35. أرجو تصحيح الرسم." (feedback fb_1787451875,
-- 2026-08-23 — "the chart does not contain age 30 to 35, please correct it").
--
-- Nothing is missing. The scheme this platform uses is
--
--     18-23, 24-35, 36-45, 46-60, 60+
--
-- and 30-35 falls INSIDE 24-35. What put the label on the axis is a single row
-- carrying a value from a second, finer vocabulary — the same duplicate-
-- vocabulary problem migration 081 fixed in education_level, in a column where
-- one stray row is enough to invent a category on a chart axis.
--
-- Measured live on dghr_prod 2026-08-23, candidate_profiles (38,297 rows):
--
--     24-35   13,878        18-23   12,400        36-45    6,767
--     46-60    4,326        60+        239        (null)     686
--     30-35        1     <-- the entire defect
--
-- nafis_job_seekers carries the same stray vocabulary (25-30: 2, 30-35: 1) and
-- is normalised here too, because the same importer writes both tables and
-- leaving one behind guarantees they drift.
--
-- WHY MERGE RATHER THAN KEEP THE FINER BAND
--
-- Three rows cannot support a sixth band. Keeping 30-35 as its own category
-- would split 24-35 into two bands whose boundary is decided by which importer
-- happened to touch a record, and the chart would then under-report 24-35 by an
-- unknowable amount. Merging into the containing band is lossless in the only
-- sense that matters here: every one of these people IS 24-35.
--
-- The source data has no date of birth to re-bucket from, so a genuine 30-35
-- band is not available at any row count. If the board wants finer age bands,
-- that is an upstream request to the CRM, not a transformation this platform
-- can perform.
--
-- DECAY
--
-- backend/demographics.py holds AGE_ALIASES and scripts/import_crm_master_file.py
-- calls normalise_age() on write, so the next import cannot reintroduce the
-- phantom band. This migration repairs the rows already stored.
--
-- IF THE PRECONDITION DIFFERS ELSEWHERE
--
-- Each statement is a value-mapped UPDATE guarded by its own WHERE, so a
-- database that never received the finer vocabulary updates 0 rows. Re-running
-- is a no-op: the targets are not themselves aliases.

BEGIN;

CREATE TABLE IF NOT EXISTS _backup_age_band_082 AS
SELECT user_id, age_group AS age_group_before, NOW() AS captured_at
  FROM candidate_profiles
 WHERE age_group IS NOT NULL;

CREATE TABLE IF NOT EXISTS _backup_njs_age_band_082 AS
SELECT emirates_id, age_group AS age_group_before, NOW() AS captured_at
  FROM nafis_job_seekers
 WHERE age_group IS NOT NULL;

-- 24-35 contains both of these.
UPDATE candidate_profiles SET age_group = '24-35'
 WHERE age_group IN ('25-30', '30-35');

UPDATE nafis_job_seekers SET age_group = '24-35'
 WHERE age_group IN ('25-30', '30-35');

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. No finer-vocabulary bands left. Expect 0 rows.
--
--    SELECT 'candidate_profiles' AS t, age_group, COUNT(*) FROM candidate_profiles
--     WHERE age_group IN ('25-30','30-35') GROUP BY 1,2
--    UNION ALL
--    SELECT 'nafis_job_seekers', age_group, COUNT(*) FROM nafis_job_seekers
--     WHERE age_group IN ('25-30','30-35') GROUP BY 1,2;
--
-- 2. The chart's bands, and only those. Expect exactly
--    18-23, 24-35 (13,879 — was 13,878 plus the one merged row), 36-45, 46-60, 60+.
--
--    SELECT age_group, COUNT(*) FROM candidate_profiles
--     WHERE age_group IS NOT NULL GROUP BY 1 ORDER BY 2 DESC;
--
-- 3. Nobody lost their band. Expect 0 rows.
--
--    SELECT COUNT(*) FROM _backup_age_band_082 b
--      JOIN candidate_profiles cp USING (user_id)
--     WHERE cp.age_group IS NULL;
--
-- 4. The total in a band never fell. Expect 0 rows.
--
--    SELECT b.age_group_before, COUNT(*) AS was,
--           (SELECT COUNT(*) FROM candidate_profiles cp
--             WHERE cp.age_group = b.age_group_before) AS now_
--      FROM _backup_age_band_082 b GROUP BY 1
--    HAVING (SELECT COUNT(*) FROM candidate_profiles cp
--             WHERE cp.age_group = b.age_group_before) < COUNT(*);
