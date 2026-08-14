-- 064: let a candidate register their own interest in an open day
--
-- WHY: the calendar is now browsable by every signed-in candidate, and the
-- owner asked that they be able to register interest from it. Until now the
-- only way onto an event's list was for a CRM agent to phone someone and record
-- the call, so event_invitations assumes an agent behind every row: invited_by
-- is NOT NULL and the funnel counts every row as "called".
--
-- Owner request 2026-08-14: "allow me to see a monthly calendar of events and
-- register my interest."
--
-- The interest goes in event_invitations rather than a new table, because it is
-- the same fact — this person intends to come — and a second table would mean
-- two places to look before printing a door list, and two counts to reconcile.
--
-- What it must NOT do is inflate the funnel. "Of the 400 we called for Al
-- Barsha, how many turned up?" is the number EHRDC gets asked for, and folding
-- self-registrations into it would overstate how well the calling worked —
-- exactly the reasoning that already keeps walk-ins reported separately from
-- invited attendance (migration 061). Hence `source`, and hence the funnel
-- reporting the two apart.
--
-- invited_by becomes nullable because for a self-registration there is no
-- inviting agent. Writing the candidate's own id there would read as "she
-- invited herself" and would quietly corrupt any future question about which
-- agent's calls converted.
--
-- PRECONDITION (verified live 2026-08-14): event_invitations exists with 8
-- columns, invited_by NOT NULL, no source column, and 0 rows — so dropping the
-- NOT NULL cannot orphan anything and the DEFAULT 'agent' backfills nothing.
-- Every row created from here by an agent still carries invited_by.
--
-- Purely additive except for relaxing one NOT NULL, which cannot invalidate
-- existing data.

BEGIN;

ALTER TABLE event_invitations
    ADD COLUMN IF NOT EXISTS source varchar(10) NOT NULL DEFAULT 'agent';

ALTER TABLE event_invitations
    DROP CONSTRAINT IF EXISTS event_invitations_source_check;
ALTER TABLE event_invitations
    ADD CONSTRAINT event_invitations_source_check
    CHECK (source IN ('agent', 'self'));

ALTER TABLE event_invitations ALTER COLUMN invited_by DROP NOT NULL;

-- An agent-sourced row must still name the agent. Only a self-registration may
-- have no inviter — that is the whole distinction, so the DB holds it rather
-- than trusting every future caller to.
ALTER TABLE event_invitations
    DROP CONSTRAINT IF EXISTS event_invitations_agent_has_inviter;
ALTER TABLE event_invitations
    ADD CONSTRAINT event_invitations_agent_has_inviter
    CHECK (source <> 'agent' OR invited_by IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_event_invitations_candidate_event
    ON event_invitations (candidate_id, event_id);

COMMENT ON COLUMN event_invitations.source IS
    '''agent'' = a CRM agent phoned them and recorded the call · ''self'' = the '
    'candidate registered interest from the calendar. Kept apart so the funnel '
    'does not credit the calling with people who found the event themselves.';
COMMENT ON COLUMN event_invitations.invited_by IS
    'The agent who made the call. NULL for a self-registration: there was no '
    'inviter, and naming the candidate here would corrupt per-agent conversion.';

COMMIT;

-- Verification:
--   \d event_invitations                        -- source present, invited_by nullable
--   -- an agent row with no inviter is refused:
--   BEGIN;
--     INSERT INTO event_invitations (event_id, candidate_id, source)
--     VALUES ((SELECT id FROM recruitment_events LIMIT 1), '784000000000550', 'agent');
--   ROLLBACK;                                    -- must fail
--   -- a self row with no inviter is accepted:
--   BEGIN;
--     INSERT INTO event_invitations (event_id, candidate_id, source, response)
--     VALUES ((SELECT id FROM recruitment_events LIMIT 1), '784000000000550', 'self', 'confirmed');
--   ROLLBACK;                                    -- must succeed
--   -- an unknown source is refused:
--   BEGIN;
--     INSERT INTO event_invitations (event_id, candidate_id, source)
--     VALUES ((SELECT id FROM recruitment_events LIMIT 1), '784000000000550', 'walkin');
--   ROLLBACK;                                    -- must fail
