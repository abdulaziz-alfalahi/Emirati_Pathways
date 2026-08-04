-- 048: Feedback grouping — error fingerprint + admin-confirmed clusters
--
-- WHY: different people describe the same failure differently, and in two
-- languages, so prose cannot group reports. The diagnostics the widget already
-- captures can: fingerprinting each report's failing request (method +
-- id-normalised path + status) found SEVEN clusters in the existing 183
-- reports where DIFFERENT people hit the identical failure — e.g. three
-- /api/intelligence/* endpoints each 500ing for 2 people across 6 reports,
-- and 3 people on 400 /socket.io/. Scattered across the list, nobody saw them.
--
-- Grouping is SUGGESTED by fingerprint and CONFIRMED by an admin: the same
-- signature can have different root causes (a 403 from a role check vs from
-- company scoping), so nothing is merged automatically. Every reporter keeps
-- their own row and their own reply — a cluster never hides or deletes a
-- submission.
--
-- PRECONDITION (verified live 2026-08-04): feedback has no fingerprint,
-- duplicate_of or cluster_id column; feedback_clusters does not exist.
-- feedback.id is varchar (fb_<epoch>_<hex>), so duplicate_of matches that type.
--
-- Purely additive. The backfill only sets fingerprint (a derived value);
-- it never groups anything on its own.

BEGIN;

ALTER TABLE feedback
    ADD COLUMN IF NOT EXISTS fingerprint  varchar(200),
    -- Points at the PARENT report of a confirmed group. NULL = not grouped.
    -- Self-referencing FK is deliberately omitted: reports are never deleted,
    -- and a hard FK would block the parent's own deletion path if that ever
    -- changes. Application code keeps this one level deep (no chains).
    ADD COLUMN IF NOT EXISTS duplicate_of varchar(64),
    ADD COLUMN IF NOT EXISTS grouped_at   timestamptz,
    ADD COLUMN IF NOT EXISTS grouped_by   char(15);

CREATE INDEX IF NOT EXISTS idx_feedback_fingerprint  ON feedback (fingerprint);
CREATE INDEX IF NOT EXISTS idx_feedback_duplicate_of ON feedback (duplicate_of);

COMMIT;

-- Verification:
--   SELECT count(*) FILTER (WHERE fingerprint IS NOT NULL), count(*) FROM feedback;
--   SELECT fingerprint, count(DISTINCT user_id) people, count(*) reports
--     FROM feedback WHERE fingerprint IS NOT NULL
--     GROUP BY 1 HAVING count(DISTINCT user_id) > 1 ORDER BY people DESC;
--   -- expect the 7 cross-person clusters described above
