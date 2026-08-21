-- 078: whether someone is still on the CRM's active job-seeker roster
--
-- WHY: the CRM master file arrives with "Added" and "Removed" sheets — three
-- cycles in the 17 August file alone (982 added, 495 removed against a 3,936
-- roster: 37.5% churn in about two weeks). Until now the platform imported the
-- roster and had no way to record that someone had LEFT it.
--
-- That mattered less when the list was static. It matters now: 43% of the
-- people removed across those cycles appear in the private-sector employment
-- file loaded under migration 077. People are leaving the seeker roster because
-- they found work, and the platform could not see it happen.
--
-- WHY NOT REUSE nafis_job_seekers.status: that column already means the IMPORT
-- lifecycle — 'imported', 'invited', 'profile_created' — which is about what
-- the platform has done with a record, not about whether the CRM still counts
-- the person as seeking. Putting a second meaning in it is how a column stops
-- answering either question reliably.
--
-- REMOVAL IS NOT DELETION and it is not an assertion about the person. Leaving
-- the roster is a fact about the ROSTER. The platform does not know why someone
-- left, so nothing here writes looking_status or work_status: inferring "not
-- looking for work" from a removal would put a guess into a field that is
-- reported to the board as fact.
--
-- roster_last_seen_on IS THE SELF-HEALING PART. Every import stamps it for
-- every row present in the master sheet. A person who silently stops appearing
-- — dropped without ever showing up on a Removed sheet — is then visible as a
-- stale last_seen date rather than sitting in the roster forever as a
-- permanent active seeker.
--
-- PRECONDITION (verified live 2026-08-21): nafis_job_seekers holds 3,969 rows;
-- status is one of imported (3,966), invited (2), profile_created (1); no
-- roster_* column exists.

BEGIN;

ALTER TABLE nafis_job_seekers
    ADD COLUMN IF NOT EXISTS roster_status      VARCHAR(20) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS roster_last_seen_on DATE,
    ADD COLUMN IF NOT EXISTS roster_removed_on   DATE;

COMMENT ON COLUMN nafis_job_seekers.roster_status IS
    'active | removed — whether the CRM still carries this person as a job '
    'seeker. Distinct from status, which tracks what the PLATFORM has done with '
    'the record (imported / invited / profile_created).';
COMMENT ON COLUMN nafis_job_seekers.roster_last_seen_on IS
    'Date of the most recent master file this person appeared in. A stale value '
    'means they dropped off without appearing on a Removed sheet.';
COMMENT ON COLUMN nafis_job_seekers.roster_removed_on IS
    'The dated Removed cycle they left on. NULL while active. Says nothing '
    'about WHY they left — the platform is not told.';

CREATE INDEX IF NOT EXISTS idx_nafis_roster_status
    ON nafis_job_seekers (roster_status);

DO $$
DECLARE
    removed INTEGER;
BEGIN
    SELECT COUNT(*) INTO removed FROM nafis_job_seekers WHERE roster_status <> 'active';
    IF removed <> 0 THEN
        RAISE EXCEPTION 'expected every existing row to default to active, found % otherwise. Refusing.', removed;
    END IF;
    RAISE NOTICE 'roster membership columns added; % seekers, all active', (SELECT COUNT(*) FROM nafis_job_seekers);
END $$;

COMMIT;

-- Verification:
--   SELECT roster_status, count(*) FROM nafis_job_seekers GROUP BY 1;
--   -- expect active = 3969, nothing else
--   SELECT count(*) FROM nafis_job_seekers WHERE roster_removed_on IS NOT NULL;
--   -- expect 0 until an import processes a Removed sheet
