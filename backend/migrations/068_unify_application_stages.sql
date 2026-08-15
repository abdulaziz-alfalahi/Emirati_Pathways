-- 068: one stage vocabulary for applications (Phase A of #410)
--
-- WHY: the platform held three overlapping stage vocabularies and none agreed.
--
--   job_applications.status          submitted · under_review · shortlisted ·
--                                    interview · offer · accepted ·
--                                    interview_scheduled · offered · rejected ·
--                                    withdrawn
--   applications_api._VALID_STATUSES submitted · under_review · shortlisted ·
--                                    interview · offer · hired · rejected ·
--                                    withdrawn
--   event_outcomes.stage             shortlisted · interviewed · offered ·
--                                    placed · rejected
--
-- The API's validation set did not contain three values its own code wrote, so
-- a status could be stored that the endpoint validating statuses would have
-- rejected. Meanwhile event_outcomes was given its names FOR the shared
-- pipeline request (migration 061 says so) and nothing brought applications
-- into line. Building the employer pipeline on top would have made a fourth.
--
-- Settled now because it is cheap now: 9 application rows and 0 outcome rows.
-- After launch this is a data migration with live employers watching.
--
-- THE LADDER (owner-approved, #410):
--   submitted -> under_review -> shortlisted -> interview_scheduled ->
--   interviewed -> offered -> placed
--   off-ramps: rejected (with a standardised reason) · withdrawn
--
-- 'hired' and 'placed' are ONE stage, named `placed`. Two names for one thing
-- is how a pipeline stops being countable.
--
-- 'interview' becomes 'interview_scheduled', NOT 'interviewed': it was set when
-- an interview was booked. Mapping it to 'interviewed' would assert that an
-- interview took place, inventing a fact about 3 real applications.
--
-- 'under_review' is KEPT although the scoped ladder omitted it — it is in the
-- API contract and two code paths write it, so dropping it is a behaviour
-- change, not a rename. That belongs with the employer UI in Phase B.
--
-- PRECONDITION (verified live 2026-08-15): job_applications has 9 rows
-- (interview 3, under_review 2, shortlisted 2, withdrawn 2) and
-- application_status_history 16 (submitted 8, interview 4, withdrawn 2,
-- under_review 1, shortlisted 1). No status CHECK constraint exists on either.
--
-- Data-safe: every legacy value maps to exactly one canonical value, and the
-- backup below preserves the originals.

BEGIN;

-- Snapshot before rewriting statuses, per house rule for destructive changes.
CREATE TABLE IF NOT EXISTS _backup_application_status_068 AS
SELECT id, status AS old_status, now() AS backed_up_at FROM job_applications;

CREATE TABLE IF NOT EXISTS _backup_status_history_068 AS
SELECT id, previous_status AS old_previous, new_status AS old_new, now() AS backed_up_at
  FROM application_status_history;

UPDATE job_applications SET status = CASE lower(trim(status))
    WHEN 'accepted'  THEN 'placed'
    WHEN 'hired'     THEN 'placed'
    WHEN 'interview' THEN 'interview_scheduled'
    WHEN 'offer'     THEN 'offered'
    WHEN 'reviewing' THEN 'under_review'
    WHEN 'pending'   THEN 'submitted'
    ELSE lower(trim(status))
END
WHERE status IS NOT NULL;

UPDATE application_status_history SET
    previous_status = CASE lower(trim(previous_status))
        WHEN 'accepted' THEN 'placed' WHEN 'hired' THEN 'placed'
        WHEN 'interview' THEN 'interview_scheduled' WHEN 'offer' THEN 'offered'
        WHEN 'reviewing' THEN 'under_review' WHEN 'pending' THEN 'submitted'
        ELSE lower(trim(previous_status)) END,
    new_status = CASE lower(trim(new_status))
        WHEN 'accepted' THEN 'placed' WHEN 'hired' THEN 'placed'
        WHEN 'interview' THEN 'interview_scheduled' WHEN 'offer' THEN 'offered'
        WHEN 'reviewing' THEN 'under_review' WHEN 'pending' THEN 'submitted'
        ELSE lower(trim(new_status)) END;

-- What stops a fourth vocabulary appearing. NOT VALID: the rows above are
-- normalised, but this table is written from six code paths and a value missed
-- in one of them should be refused at the next write rather than block this
-- migration. VALIDATE once the production reset clears the legacy rows:
--   ALTER TABLE job_applications VALIDATE CONSTRAINT job_applications_status_check;
ALTER TABLE job_applications
    DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications
    ADD CONSTRAINT job_applications_status_check
    CHECK (status IS NULL OR status IN (
        'submitted', 'under_review', 'shortlisted', 'interview_scheduled',
        'interviewed', 'offered', 'placed', 'rejected', 'withdrawn'))
    NOT VALID;

COMMENT ON CONSTRAINT job_applications_status_check ON job_applications IS
    'The single application stage ladder (#410). Defined in code at '
    'backend/application_stages.py — change both together. event_outcomes.stage '
    'shares this vocabulary so open-day results and application pipelines can '
    'be counted as one thing.';

COMMIT;

-- Verification:
--   SELECT status, count(*) FROM job_applications GROUP BY 1 ORDER BY 2 DESC;
--     -- expect interview_scheduled 3, under_review 2, shortlisted 2, withdrawn 2
--   SELECT new_status, count(*) FROM application_status_history GROUP BY 1;
--     -- expect no 'interview', no 'offer', no 'accepted'
--   -- a legacy value is now refused:
--   BEGIN;
--     UPDATE job_applications SET status = 'interview' WHERE id = (SELECT id FROM job_applications LIMIT 1);
--   ROLLBACK;                                   -- must fail
--   -- rollback of the data change, if ever needed:
--   --   UPDATE job_applications a SET status = b.old_status
--   --     FROM _backup_application_status_068 b WHERE b.id = a.id;
