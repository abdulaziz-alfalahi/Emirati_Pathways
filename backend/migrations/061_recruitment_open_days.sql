-- 061: recruitment open days (Phase 1)
--
-- WHY: EHRDC runs recruitment open days at community malls with vacancy-posting
-- companies. CRM agents phone targeted candidates to invite them; on the day
-- candidates scan a QR, register attendance and receive a queue token; employers
-- interview at the venue; afterwards EHRDC needs the outcome from each employer.
-- None of that is currently recorded anywhere, so the funnel — called, confirmed,
-- attended, interviewed, hired — cannot be measured at all.
-- Scope + owner decisions: docs/scope_recruitment_open_days.md.
--
-- OWNER DECISIONS (2026-08-13) encoded here:
--   • ONE queue per event, first-come-first-served. Invitee priority was
--     considered and explicitly DROPPED, so there is no priority column: a
--     nullable "priority" nobody sets is worse than none.
--   • NO capacity cap for now (hence no max_attendees column).
--   • NO check-in code. Identity at the door is UAE Pass, or staff check-in.
--     The invitation therefore carries no secret.
--   • The calendar is for signed-in platform users, not public.
--   • A walk-in who signs in at the venue joins the CRM roster, and their
--     attendance links to that account — so attendance references users(id),
--     never a free-text name.
--
-- PRECONDITION (verified live 2026-08-13): none of these four tables exist.
-- public.users.id is character(15) (the Emirates ID) and public.companies.id is
-- uuid. NB information_schema also reports a shadow `qa.users` whose id is uuid;
-- the public schema is the one in the search_path and the one meant here. FKs
-- built against the qa shape would fail.
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS recruitment_events (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title        varchar(200) NOT NULL,
    title_ar     varchar(200),
    venue        varchar(300),
    venue_ar     varchar(300),
    description  text,
    description_ar text,
    starts_at    timestamptz NOT NULL,
    ends_at      timestamptz,
    -- draft: being prepared · published: visible to platform users and open for
    -- check-in · completed: held · cancelled
    status       varchar(16) NOT NULL DEFAULT 'draft',
    created_by   char(15) NOT NULL REFERENCES users(id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT recruitment_events_status_check
        CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
    CONSTRAINT recruitment_events_ends_after_start
        CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

-- Which companies are attending. Their vacancies are read live from
-- job_postings rather than copied here, so the calendar cannot show a vacancy
-- that has since been filled or withdrawn.
CREATE TABLE IF NOT EXISTS event_employers (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   uuid NOT NULL REFERENCES recruitment_events(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    note       text,
    added_by   char(15) REFERENCES users(id),
    added_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT event_employers_unique UNIQUE (event_id, company_id)
);

-- Who was invited, and what they said. `response` starts at 'invited' because
-- the agent records the invitation during the call; the candidate's answer may
-- arrive on that same call or later in the app.
CREATE TABLE IF NOT EXISTS event_invitations (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id     uuid NOT NULL REFERENCES recruitment_events(id) ON DELETE CASCADE,
    candidate_id char(15) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by   char(15) NOT NULL REFERENCES users(id),
    invited_at   timestamptz NOT NULL DEFAULT now(),
    response     varchar(16) NOT NULL DEFAULT 'invited',
    responded_at timestamptz,
    note         text,
    CONSTRAINT event_invitations_response_check
        CHECK (response IN ('invited', 'confirmed', 'declined', 'no_answer')),
    -- A candidate is invited to a given event once. Re-inviting updates the row.
    CONSTRAINT event_invitations_unique UNIQUE (event_id, candidate_id)
);

-- Attendance is a fact about a real account, never a typed-in name: a walk-in
-- signs in with UAE Pass at the venue, so by the time this row exists there is
-- always a user to point at.
CREATE TABLE IF NOT EXISTS event_attendance (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      uuid NOT NULL REFERENCES recruitment_events(id) ON DELETE CASCADE,
    user_id       char(15) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checked_in_at timestamptz NOT NULL DEFAULT now(),
    -- 'self' = scanned the QR and signed in · 'staff' = checked in at the desk
    -- when a phone or the signal failed. Staff check-in is load-bearing, not a
    -- nicety, because there is no code fallback.
    method        varchar(10) NOT NULL DEFAULT 'self',
    -- Sequential within the event, first-come-first-served (no priority).
    queue_token   integer NOT NULL,
    checked_in_by char(15) REFERENCES users(id),
    -- Whether they had been invited is derivable from event_invitations; it is
    -- NOT duplicated here, so the two can never disagree.
    CONSTRAINT event_attendance_method_check CHECK (method IN ('self', 'staff')),
    CONSTRAINT event_attendance_once UNIQUE (event_id, user_id),
    -- What makes the token a queue position rather than a suggestion.
    CONSTRAINT event_attendance_token_unique UNIQUE (event_id, queue_token)
);

-- Post-event outcome per candidate per employer. The stage vocabulary is the
-- one the CRM team asked for in the "Shared Pipeline Views" request, so the two
-- features share a stage model rather than growing competing ones.
CREATE TABLE IF NOT EXISTS event_outcomes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id     uuid NOT NULL REFERENCES recruitment_events(id) ON DELETE CASCADE,
    candidate_id char(15) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stage        varchar(24) NOT NULL,
    reason       text,
    recorded_by  char(15) NOT NULL REFERENCES users(id),
    recorded_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT event_outcomes_stage_check
        CHECK (stage IN ('interviewed', 'shortlisted', 'offered', 'placed', 'rejected')),
    CONSTRAINT event_outcomes_unique UNIQUE (event_id, candidate_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_recruitment_events_starts
    ON recruitment_events (starts_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_event_invitations_event ON event_invitations (event_id, response);
CREATE INDEX IF NOT EXISTS idx_event_invitations_candidate ON event_invitations (candidate_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event ON event_attendance (event_id, queue_token);
CREATE INDEX IF NOT EXISTS idx_event_outcomes_event ON event_outcomes (event_id, stage);

COMMENT ON TABLE recruitment_events IS
    'Recruitment open days. One queue per event, first-come-first-served: invitee '
    'priority was considered and dropped, so there is deliberately no priority column.';
COMMENT ON COLUMN event_attendance.queue_token IS
    'Sequential within the event. UNIQUE(event_id, queue_token) is what makes it a '
    'queue position rather than a suggestion under concurrent check-in.';
COMMENT ON TABLE event_outcomes IS
    'Post-event result per candidate per employer. Stage vocabulary shared with the '
    'Shared Pipeline Views request so the two do not grow competing stage models.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM recruitment_events;   -- 0
--   -- two people cannot hold the same queue position:
--   BEGIN;
--     INSERT INTO recruitment_events (title, starts_at, created_by)
--     VALUES ('ZZ-probe', now(), (SELECT id FROM users LIMIT 1)) RETURNING id;
--     -- using that id twice with the same queue_token must fail
--   ROLLBACK;
--   -- an unknown stage is refused:
--   BEGIN;
--     INSERT INTO event_outcomes (event_id, candidate_id, company_id, stage, recorded_by)
--     VALUES (gen_random_uuid(), '784000000000550', gen_random_uuid(), 'hired', '784000000000510');
--   ROLLBACK;                                   -- must fail (stage + FK)
