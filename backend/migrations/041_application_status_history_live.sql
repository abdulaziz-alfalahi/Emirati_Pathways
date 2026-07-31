-- 041: make application_status_history usable with the LIVE schema, backfill.
--
-- The table existed (0 rows) from an old migration with application_id UUID,
-- but live job_applications.id is TEXT ('APP-XXXXXXXX') — no row could ever
-- have been written. Retype, index, and backfill so the candidate-facing
-- status timeline has a real spine from day one.

ALTER TABLE application_status_history
    ALTER COLUMN application_id TYPE TEXT USING application_id::text;
ALTER TABLE application_status_history
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_app_status_history_app
    ON application_status_history (application_id, changed_at);

-- Backfill 1: every application began life submitted, at its submission time.
INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_at)
SELECT gen_random_uuid(), ja.id, NULL, 'submitted',
       COALESCE(ja.submitted_at, ja.applied_at, NOW())
FROM job_applications ja
WHERE NOT EXISTS (
    SELECT 1 FROM application_status_history h
    WHERE h.application_id = ja.id AND h.new_status = 'submitted');

-- Backfill 2: the current status, best-effort dated by the last update. We only
-- know the latest state, not intermediate hops — the timeline shows what is
-- known, never invented intermediate steps.
INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_at)
SELECT gen_random_uuid(), ja.id, 'submitted', LOWER(ja.status),
       COALESCE(ja.updated_at, ja.last_updated, NOW())
FROM job_applications ja
WHERE LOWER(COALESCE(ja.status, 'submitted')) NOT IN ('submitted', 'pending')
  AND NOT EXISTS (
    SELECT 1 FROM application_status_history h
    WHERE h.application_id = ja.id AND h.new_status = LOWER(ja.status));
