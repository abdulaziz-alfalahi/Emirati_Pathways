-- 062: pin an open day's venue on a map
--
-- WHY: recruitment_events.venue is free text ("ZZ Mall of the Emirates"). A name
-- alone does not get an attendee to the door — Dubai's community malls are large,
-- the entrance matters, and the whole point of the event is that people turn up.
-- The venue keeps its NAME and gains a pinned POINT, so the candidate-facing
-- event page can show where it actually is and hand off to a maps app.
--
-- Owner request 2026-08-14: "make the venue a selectable location on a map and a
-- name" — so both, not one replacing the other.
--
-- Reuses the same representation as job_postings' pinned location, which the JD
-- wizard already writes with components/common/LocationPicker: plain lat/lng
-- columns, no PostGIS. Nothing here needs distance queries, and adding a
-- geometry type for two numbers would be a dependency for its own sake.
--
-- PRECONDITION (verified live 2026-08-14): recruitment_events exists (migration
-- 061) with venue/venue_ar varchar(300) and no location columns. 0 rows, so no
-- backfill question arises.
--
-- Purely additive. Both columns are nullable: an event may be created before its
-- venue is confirmed, and a pin is not required to publish.

BEGIN;

ALTER TABLE recruitment_events
    ADD COLUMN IF NOT EXISTS venue_lat numeric(10, 7),
    ADD COLUMN IF NOT EXISTS venue_lng numeric(10, 7);

-- Either both coordinates or neither: half a pin is not a location, and a row
-- carrying only a latitude would silently render in the Gulf of Guinea.
ALTER TABLE recruitment_events
    DROP CONSTRAINT IF EXISTS recruitment_events_venue_point_check;
ALTER TABLE recruitment_events
    ADD CONSTRAINT recruitment_events_venue_point_check
    CHECK ((venue_lat IS NULL) = (venue_lng IS NULL));

-- Refuse impossible coordinates. A transposed lat/lng pair for Dubai
-- (55.2, 25.2) would otherwise be stored happily and put the venue in Kazakhstan.
ALTER TABLE recruitment_events
    DROP CONSTRAINT IF EXISTS recruitment_events_venue_range_check;
ALTER TABLE recruitment_events
    ADD CONSTRAINT recruitment_events_venue_range_check
    CHECK (venue_lat IS NULL OR (venue_lat BETWEEN -90 AND 90 AND venue_lng BETWEEN -180 AND 180));

COMMENT ON COLUMN recruitment_events.venue_lat IS
    'Venue pin, paired with venue_lng. The venue NAME stays in venue/venue_ar — '
    'a pin without a name is unreadable, a name without a pin does not get anyone '
    'to the door.';

COMMIT;

-- Verification:
--   \d recruitment_events                       -- venue_lat/venue_lng present
--   -- half a pin is refused:
--   BEGIN;
--     INSERT INTO recruitment_events (title, starts_at, created_by, venue_lat)
--     VALUES ('ZZ', now(), (SELECT id FROM users LIMIT 1), 25.1);
--   ROLLBACK;                                    -- must fail
--   -- a transposed Dubai pair is refused:
--   BEGIN;
--     INSERT INTO recruitment_events (title, starts_at, created_by, venue_lat, venue_lng)
--     VALUES ('ZZ', now(), (SELECT id FROM users LIMIT 1), 155.2, 25.2);
--   ROLLBACK;                                    -- must fail
