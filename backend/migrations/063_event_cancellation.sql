-- 063: record WHY an open day was cancelled, and when
--
-- WHY: recruitment_events.status already accepts 'cancelled' (migration 061) and
-- the API already accepts the transition, but nothing anywhere captures a reason
-- — and the organiser UI never offered the action at all, so no event has ever
-- been cancelled through it.
--
-- Owner report 2026-08-14: "There is no edit or cancel for the event once
-- published."
--
-- A bare status flip is not enough, and this migration exists because of what
-- cancelling currently DOES. The candidate calendar lists `status = 'published'`
-- only, so flipping an event to 'cancelled' makes it VANISH: a candidate who was
-- phoned by a CRM agent, confirmed, and put the date in their diary would see
-- the event silently disappear — indistinguishable from having misremembered it,
-- and no reason not to travel to the mall anyway. The calendar is therefore
-- being changed to keep showing cancelled events, which means it needs something
-- to show: a reason, and the time the decision was taken.
--
-- cancelled_at is stored rather than derived from updated_at, which any later
-- edit would overwrite.
--
-- PRECONDITION (verified live 2026-08-14): recruitment_events exists with 15
-- columns and neither cancellation_reason nor cancelled_at among them. 1 row
-- ('Test - Open Day', published), so no backfill question arises. If this runs
-- somewhere with cancelled events already, they keep a NULL reason and the UI
-- says the reason was not recorded rather than inventing one.
--
-- Purely additive. Both columns nullable: an event that was never cancelled has
-- nothing to say here, and NULL is the honest representation of that.

BEGIN;

ALTER TABLE recruitment_events
    ADD COLUMN IF NOT EXISTS cancellation_reason text,
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- A reason without a cancellation is a contradiction; the API also refuses to
-- cancel without one. Deliberately NOT the reverse implication: a row cancelled
-- before this migration existed may legitimately carry a timestamp and no text.
ALTER TABLE recruitment_events
    DROP CONSTRAINT IF EXISTS recruitment_events_cancel_reason_check;
ALTER TABLE recruitment_events
    ADD CONSTRAINT recruitment_events_cancel_reason_check
    CHECK (cancellation_reason IS NULL OR cancelled_at IS NOT NULL);

COMMENT ON COLUMN recruitment_events.cancellation_reason IS
    'Shown to candidates on the calendar. A cancelled open day stays visible '
    'rather than disappearing: people were phoned and invited to attend, and a '
    'silent vanishing sends them to the venue anyway.';
COMMENT ON COLUMN recruitment_events.cancelled_at IS
    'When the event was cancelled. Stored rather than read from updated_at, which '
    'a later edit would overwrite.';

COMMIT;

-- Verification:
--   \d recruitment_events                      -- both columns present
--   -- a reason with no cancellation timestamp is refused:
--   BEGIN;
--     UPDATE recruitment_events SET cancellation_reason = 'ZZ-probe' WHERE cancelled_at IS NULL;
--   ROLLBACK;                                   -- must fail
--   -- clearing both together is allowed (re-publishing a cancelled event):
--   BEGIN;
--     UPDATE recruitment_events SET cancellation_reason = NULL, cancelled_at = NULL;
--   ROLLBACK;                                   -- must succeed
