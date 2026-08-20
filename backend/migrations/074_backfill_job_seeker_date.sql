-- 074: carry job_seeker_date from NAFIS staging onto candidate profiles,
--      and link the two tables together
--
-- WHY: onboarding is invitation-driven, and nobody on the platform has joined
-- yet — every candidate record is a placeholder awaiting a magic link (owner,
-- 2026-08-20). So the operational question right now is not "is this profile
-- complete" but "who do we invite first", and the answer turns on how long
-- someone has been seeking work.
--
-- That field is present for all 3,969 rows in `nafis_job_seekers`, spanning
-- 2021-11-08 to 2026-08-18 — nearly five years of waiting time — and NONE of it
-- reached `candidate_profiles`. The importer carries job_seeker_type (5,034
-- profiles populated) and specialization (2,307), but silently drops the date.
-- The CRM roster therefore cannot order the queue by the one signal that most
-- obviously should order it: someone registered in 2021 is not equivalent to
-- someone registered last week.
--
-- TWO GAPS, ONE CAUSE:
--   candidate_profiles.job_seeker_date   0 of 5,297 populated
--   nafis_job_seekers.user_id            1 of 3,969 linked
-- The tables describe the same people by Emirates ID and cannot reach each
-- other, so nothing can go from a candidate back to their NAFIS record.
--
-- WHY NOT ALSO FILL job_search_duration: it is a VARCHAR holding text like
-- "6-12 months", and a stored duration is wrong the day after it is written.
-- The DATE is the fact; duration is a view of it, computed at read time. Filling
-- the varchar would bake today's answer into a column nothing refreshes — the
-- same class of mistake as storing an age instead of a birthday.
--
-- EMIRATES ID IS THE JOIN, and it is safe: users.id IS the EID by design, and
-- nafis_job_seekers.emirates_id is the same value. No name or phone matching.
--
-- PRECONDITION (verified live 2026-08-20): nafis_job_seekers has 3,969 rows, all
-- with job_seeker_date; 2,903 of them have a matching users AND candidate_profiles
-- row; candidate_profiles has 5,297 rows with 0 job_seeker_date populated.
-- A verified backup was taken immediately before this ran (backup_db.sh, all ten
-- checked tables restored matching).

BEGIN;

-- Snapshot the columns this touches, per house rule.
CREATE TABLE IF NOT EXISTS _backup_seeker_link_074 AS
    SELECT p.user_id, p.job_seeker_date, NOW() AS captured_at
      FROM candidate_profiles p
     WHERE p.user_id IN (SELECT emirates_id FROM nafis_job_seekers);

-- 1. The date the platform will prioritise on.
UPDATE candidate_profiles p
   SET job_seeker_date = n.job_seeker_date
  FROM nafis_job_seekers n
 WHERE n.emirates_id = p.user_id
   AND n.job_seeker_date IS NOT NULL
   AND p.job_seeker_date IS NULL;   -- never overwrite a value already set

-- 2. The back-link, so a candidate record can reach its NAFIS row.
UPDATE nafis_job_seekers n
   SET user_id = u.id
  FROM users u
 WHERE u.id = n.emirates_id
   AND n.user_id IS NULL;

-- Report, and refuse anything implausible. The join is on Emirates ID so a
-- wild over-match should be impossible — which is exactly why it is worth
-- asserting rather than assuming.
DO $$
DECLARE
    dated INTEGER;
    linked INTEGER;
BEGIN
    SELECT COUNT(*) INTO dated FROM candidate_profiles WHERE job_seeker_date IS NOT NULL;
    SELECT COUNT(*) INTO linked FROM nafis_job_seekers WHERE user_id IS NOT NULL;
    IF dated > 6000 OR linked > 4000 THEN
        RAISE EXCEPTION 'implausible backfill: % dated, % linked. Refusing.', dated, linked;
    END IF;
    RAISE NOTICE 'job_seeker_date set on % profiles; % seeker rows linked', dated, linked;
END $$;

COMMIT;

-- Verification:
--   SELECT count(*) FROM candidate_profiles WHERE job_seeker_date IS NOT NULL;
--   -- expect ~2903
--   SELECT count(*) FROM nafis_job_seekers WHERE user_id IS NOT NULL;
--   -- expect ~2904 (2903 + the one already linked)
--   SELECT date_trunc('year', job_seeker_date) yr, count(*)
--     FROM candidate_profiles WHERE job_seeker_date IS NOT NULL
--    GROUP BY 1 ORDER BY 1;
--   -- the invitation queue, oldest first
