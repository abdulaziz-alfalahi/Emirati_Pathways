-- 091_event_share_links.sql
--
-- WHY
--
-- Owner, 2026-08-27: deliver a shareable live tracking dashboard for open days,
-- like the one the Ithra exhibition runs at ops.eif.gov.ae. That reference is
-- open to anyone holding the URL, which is the point — it goes on a projector
-- at the venue, into a WhatsApp group, to a partner ministry.
--
-- Our version is the same idea with an off switch: an unguessable token per
-- event, revocable, and dead once the event is over.
--
-- WHY A TOKEN RATHER THAN JUST OPENING /events/<id>/live
--
-- Event ids already appear in other links — the check-in page, the QR code, the
-- calendar. Making the id itself the credential would mean anyone who ever saw
-- a check-in URL could watch the live figures for ever, with no way to withdraw
-- it short of deleting the event. A separate token can be revoked without
-- touching anything else.
--
-- WHAT A LINK-HOLDER MAY SEE (owner's decision, same date)
--
-- Turnout and demographics: participating employers, registered, attended,
-- walk-ins, and the gender and education of attendees. NOT the hiring funnel —
-- interviewed, offered and hired stay in the organiser view. Those are
-- commercially sensitive to the employers in the room, and a live "hired: 2"
-- beside "340 attended" becomes a published statistic the moment the link is
-- forwarded.
--
-- That rule is enforced in the endpoint, not here; this table only decides WHO
-- may look.
--
-- PRECONDITION VERIFIED ON THE LIVE DB 2026-08-27
--   recruitment_events exists, 6 rows, id is uuid
--   no table named event_share_links

BEGIN;

CREATE TABLE IF NOT EXISTS event_share_links (
    id          BIGSERIAL PRIMARY KEY,
    event_id    UUID        NOT NULL
                REFERENCES recruitment_events(id) ON DELETE CASCADE,

    -- The credential. Long enough that guessing is not a strategy, and stored
    -- as-is rather than hashed: a viewer presents it in a URL, so it is not a
    -- password and treating it like one would only prevent us showing an
    -- operator the link they just created.
    token       TEXT        NOT NULL UNIQUE,

    created_by  CHAR(15),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Revocation is a fact with a time and a person, not a deleted row. "Who
    -- turned this off and when" is the first question after a link leaks.
    revoked_at  TIMESTAMPTZ,
    revoked_by  CHAR(15),

    -- Beyond this, the link is dead regardless of revocation. An open day
    -- dashboard has no audience a week later, and a link that outlives its
    -- event is one nobody remembers to withdraw.
    expires_at  TIMESTAMPTZ NOT NULL,

    label       TEXT,
    last_seen_at TIMESTAMPTZ,
    view_count  INTEGER     NOT NULL DEFAULT 0,

    CONSTRAINT event_share_links_revoked_pair
        CHECK ((revoked_at IS NULL) = (revoked_by IS NULL))
);

-- ON DELETE CASCADE above is deliberate, and is the lesson from migration 086:
-- board notifications survived the deletion of their meetings because nothing
-- tied them together, leaving 42 live-looking rows for meetings that no longer
-- existed. A share link for a deleted event is the same shape of problem.

CREATE INDEX IF NOT EXISTS idx_event_share_links_live
    ON event_share_links (token)
 WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_share_links_event
    ON event_share_links (event_id, created_at DESC);

COMMENT ON TABLE event_share_links IS
    'Unguessable, revocable, self-expiring links to one event''s live turnout '
    'dashboard. Viewers need no account. Created by migration 091 so an open '
    'day can be followed on a projector or by a partner ministry without '
    'opening the platform to them.';

COMMENT ON COLUMN event_share_links.expires_at IS
    'Hard stop, independent of revocation. An open-day dashboard has no '
    'audience a week later, and a link that outlives its event is one nobody '
    'remembers to withdraw.';

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. The table and its guards exist:
--      SELECT count(*) FROM information_schema.tables WHERE table_name='event_share_links';
--      SELECT conname FROM pg_constraint WHERE conrelid='event_share_links'::regclass;
--
-- 2. A link cannot be half-revoked. Second statement must FAIL:
--      BEGIN;
--        INSERT INTO event_share_links (event_id, token, expires_at)
--        SELECT id, 'zz-probe-1', now() + interval '1 day' FROM recruitment_events LIMIT 1;
--        UPDATE event_share_links SET revoked_at = now() WHERE token = 'zz-probe-1';  -- must FAIL
--      ROLLBACK;
--
-- 3. Two links cannot share a token:
--      BEGIN;
--        INSERT INTO event_share_links (event_id, token, expires_at)
--        SELECT id, 'zz-probe-2', now() + interval '1 day' FROM recruitment_events LIMIT 1;
--        INSERT INTO event_share_links (event_id, token, expires_at)
--        SELECT id, 'zz-probe-2', now() + interval '1 day' FROM recruitment_events LIMIT 1;  -- must FAIL
--      ROLLBACK;
--
-- 4. Deleting an event takes its links with it:
--      BEGIN;
--        INSERT INTO recruitment_events (title, starts_at, ends_at, status)
--        VALUES ('ZZ-091 probe', now(), now() + interval '1 hour', 'draft');
--        INSERT INTO event_share_links (event_id, token, expires_at)
--        SELECT id, 'zz-probe-3', now() + interval '1 day'
--          FROM recruitment_events WHERE title = 'ZZ-091 probe';
--        DELETE FROM recruitment_events WHERE title = 'ZZ-091 probe';
--        SELECT count(*) FROM event_share_links WHERE token = 'zz-probe-3';  -- must be 0
--      ROLLBACK;
