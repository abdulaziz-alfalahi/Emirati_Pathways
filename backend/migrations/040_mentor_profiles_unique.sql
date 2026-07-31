-- 040: one mentor profile per user.
--
-- mentor_profiles.user_id had no unique constraint (PK is a separate UUID), and
-- a legacy seeder inserted with ON CONFLICT on the freshly-generated PK — a
-- guard that can never fire — so re-runs created duplicate profiles per user
-- (live DB: 2 rows for user 784000000000150). The operator upsert is also a
-- SELECT-then-INSERT with no index behind it. Dedupe keeping the newest row,
-- then enforce uniqueness so both writers become safe.

-- 1. Remove duplicates, keeping the most recently updated row per user.
DELETE FROM mentor_profiles mp
USING mentor_profiles newer
WHERE mp.user_id = newer.user_id
  AND mp.id <> newer.id
  AND (COALESCE(mp.updated_at, mp.created_at) < COALESCE(newer.updated_at, newer.created_at)
       OR (COALESCE(mp.updated_at, mp.created_at) = COALESCE(newer.updated_at, newer.created_at)
           AND mp.id < newer.id));

-- 2. One profile per user, forever.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mentor_profiles_user_id
    ON mentor_profiles (user_id);
