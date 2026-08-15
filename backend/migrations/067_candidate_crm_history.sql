-- 067: record what changes on a candidate's counselling record
--
-- WHY: fb_1786356071_38fe48a4 asks for "full history of status updates,
-- assigned agents, and previous remarks with date/time stamps".
--
-- None of that is recoverable today. candidate_profiles is updated IN PLACE:
-- when an agent changes a call status, reassigns a caseload or rewrites a
-- remark, the previous value is gone. There is no diff, no shadow table and no
-- trigger. The other half of the request — interviews, nominations,
-- applications — IS already recorded elsewhere (interview_schedules,
-- event_invitations, event_attendance, job_applications,
-- application_status_history) and only needs reading; this table is the piece
-- that does not exist.
--
-- ONE ROW PER CHANGED FIELD, not per save. "Who reassigned this candidate, and
-- when" should be answerable by reading one row, not by diffing two JSON blobs
-- of a whole record. It also means a save that touches one field writes one
-- row rather than a snapshot of forty.
--
-- HISTORY STARTS AT DEPLOYMENT. There is nothing to backfill — the previous
-- values were overwritten and are not recoverable from anywhere. The UI says so
-- rather than presenting a short history as a complete one, which would be
-- worse than presenting none.
--
-- CONTAINS COUNSELLING REMARKS, so it inherits the CRM's sensitivity: the
-- reading endpoint is gated to CAREER_SERVICES_ROLES, exactly like
-- /api/profile/crm-candidates. This is not a general-purpose audit log.
--
-- ON DELETE CASCADE on the candidate is deliberate. This platform honours data
-- subject erasure (there are 134 'DSR Erase' rows in admin_audit_log); a
-- history of someone's counselling notes must not outlive the erasure of the
-- person. changed_by is ON DELETE SET NULL instead — losing which agent made a
-- change would falsify the record of a candidate who is still here.
--
-- PRECONDITION (verified live 2026-08-15): candidate_crm_history does not
-- exist. public.users.id is character(15) — NOT the uuid that information_schema
-- also reports for a shadow qa.users; the FK below must match the public shape
-- or it fails outright.
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS candidate_crm_history (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id char(15) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- NULL for changes not made by a person: imports, syncs, bulk actions run
    -- by the system. A name we cannot vouch for is worse than an honest blank.
    changed_by   char(15) REFERENCES users(id) ON DELETE SET NULL,
    changed_at   timestamptz NOT NULL DEFAULT now(),
    -- The candidate_profiles column that changed, e.g. 'call_status'.
    field        varchar(64) NOT NULL,
    old_value    text,
    new_value    text,
    -- How the change arrived: 'edit' (the Edit Details form), 'bulk' (a bulk
    -- action over selected rows), 'import'. Lets the timeline distinguish a
    -- considered edit from a mass update.
    source       varchar(16) NOT NULL DEFAULT 'edit',

    CONSTRAINT candidate_crm_history_source_check
        CHECK (source IN ('edit', 'bulk', 'import', 'system')),
    -- A row recording no change is noise; the writer skips them, and this makes
    -- that a guarantee rather than a convention.
    CONSTRAINT candidate_crm_history_actually_changed
        CHECK (old_value IS DISTINCT FROM new_value)
);

-- The timeline query: one candidate, newest first.
CREATE INDEX IF NOT EXISTS idx_candidate_crm_history_candidate
    ON candidate_crm_history (candidate_id, changed_at DESC);

-- "Everything this agent touched" — for supervision, and for answering a
-- candidate who asks who has been looking at their record.
CREATE INDEX IF NOT EXISTS idx_candidate_crm_history_actor
    ON candidate_crm_history (changed_by, changed_at DESC)
    WHERE changed_by IS NOT NULL;

COMMENT ON TABLE candidate_crm_history IS
    'Field-level history of counselling record changes. One row per changed '
    'field per save. Starts at deployment — earlier values were overwritten in '
    'place and are not recoverable. Contains remarks, so reads are gated to '
    'career-services roles.';
COMMENT ON COLUMN candidate_crm_history.changed_by IS
    'The agent who made the change, or NULL for imports and system updates.';

COMMIT;

-- Verification:
--   \d candidate_crm_history
--   -- a no-op change is refused:
--   BEGIN;
--     INSERT INTO candidate_crm_history (candidate_id, field, old_value, new_value)
--     VALUES ('784000000000550', 'call_status', 'Answered', 'Answered');
--   ROLLBACK;                                   -- must fail
--   -- a real change, with no actor, is accepted:
--   BEGIN;
--     INSERT INTO candidate_crm_history (candidate_id, field, old_value, new_value, source)
--     VALUES ('784000000000550', 'call_status', NULL, 'Answered', 'import');
--   ROLLBACK;                                   -- must succeed
--   -- an unknown source is refused:
--   BEGIN;
--     INSERT INTO candidate_crm_history (candidate_id, field, new_value, source)
--     VALUES ('784000000000550', 'call_status', 'x', 'guess');
--   ROLLBACK;                                   -- must fail
