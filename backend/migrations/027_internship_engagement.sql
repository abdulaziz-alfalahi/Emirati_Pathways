-- Migration 027: Internship engagement — 3-way handshake schema
--
-- WHY: Feedback fb_1784892515 + the owner design session (2026-07-24). The recruiter
-- lists internships (table `internships`); a university *internship coordinator* reviews
-- the list and assigns opportunities to students by their major; recruiter + student
-- (+ parent, only when the student is a minor) complete a 3-way handshake before the
-- placement becomes active; the engagement then runs listing→assigning→assessing→
-- beginning→reporting→tracking→ending. The pieces existed but were DISCONNECTED:
--   * `internship_applications` linked internship<->student and had an educator column,
--     but no recruiter approval, no coordinator-proposal direction, no lifecycle stage.
--   * `internship_placements` keyed only to a coordinator `program_id`, never to the
--     recruiter's `internships` listing — so a recruiter's internship could not flow to
--     the coordinator for assignment (the reported "no internship listed").
-- This migration makes `internship_applications` the engagement spine and links
-- `internship_placements` back to the recruiter opportunity + the engagement record.
--
-- PRECONDITION verified live 2026-07-24: internship_applications exists
-- (id int, internship_id int, user_id varchar, status, educator_*); internship_placements
-- exists with program_id nullable=YES; internships.id int; users.id char(15). The table
-- is empty today (0 rows), so the new UNIQUE(internship_id,user_id) index cannot conflict.
--
-- SAFETY: purely ADDITIVE (ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS) — safe
-- to run repeatedly and a no-op if already applied. No destructive statements, so no
-- backup snapshot is required. If run against a DB where these columns already exist it
-- silently does nothing.

BEGIN;

-- ── Engagement handshake fields on internship_applications (the spine) ──────────────
-- `status` (legacy) is left as-is for backward-compat; `stage` is the authoritative
-- lifecycle. The legacy `educator_*` columns are superseded by `coordinator_*` here.
ALTER TABLE internship_applications
    ADD COLUMN IF NOT EXISTS initiated_by          VARCHAR(20) DEFAULT 'student',      -- 'student' | 'coordinator'
    ADD COLUMN IF NOT EXISTS stage                 VARCHAR(20) DEFAULT 'proposed',     -- proposed|confirmed|active|completed|declined|withdrawn
    ADD COLUMN IF NOT EXISTS recruiter_status      VARCHAR(20) DEFAULT 'pending',      -- pending|approved|declined
    ADD COLUMN IF NOT EXISTS recruiter_id          CHAR(15),
    ADD COLUMN IF NOT EXISTS student_status        VARCHAR(20) DEFAULT 'pending',      -- pending|accepted|declined
    ADD COLUMN IF NOT EXISTS coordinator_status    VARCHAR(20) DEFAULT 'pending',      -- pending|approved|declined
    ADD COLUMN IF NOT EXISTS coordinator_id        CHAR(15),
    ADD COLUMN IF NOT EXISTS parent_consent_status VARCHAR(20) DEFAULT 'not_required', -- not_required|pending|granted|denied
    ADD COLUMN IF NOT EXISTS decline_reason        TEXT,
    ADD COLUMN IF NOT EXISTS proposed_at           TIMESTAMP   DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS confirmed_at          TIMESTAMP,
    ADD COLUMN IF NOT EXISTS started_at            TIMESTAMP,
    ADD COLUMN IF NOT EXISTS completed_at          TIMESTAMP;

-- ── Link placements to the recruiter opportunity + the engagement record ────────────
-- program_id stays (nullable) as an optional cohort grouping; the engagement is now
-- opportunity-centric.
ALTER TABLE internship_placements
    ADD COLUMN IF NOT EXISTS opportunity_id INTEGER REFERENCES internships(id),
    ADD COLUMN IF NOT EXISTS application_id INTEGER REFERENCES internship_applications(id),
    ADD COLUMN IF NOT EXISTS coordinator_id CHAR(15);

-- ── Constraints / indexes ───────────────────────────────────────────────────────────
-- One engagement per (internship, student). Re-proposal after a decline reuses this row
-- (the propose/apply endpoints UPSERT on this key).
CREATE UNIQUE INDEX IF NOT EXISTS uq_internship_appl_internship_student
    ON internship_applications (internship_id, user_id);
CREATE INDEX IF NOT EXISTS idx_internship_appl_stage       ON internship_applications (stage);
CREATE INDEX IF NOT EXISTS idx_internship_appl_recruiter   ON internship_applications (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_internship_appl_coordinator ON internship_applications (coordinator_id);
CREATE INDEX IF NOT EXISTS idx_placements_opportunity      ON internship_placements (opportunity_id);

COMMIT;

-- Verification (expected):
--   SELECT column_name FROM information_schema.columns WHERE table_name='internship_applications'
--     AND column_name IN ('stage','recruiter_status','student_status','coordinator_status',
--                         'parent_consent_status','initiated_by');   -> 6 rows
--   SELECT indexname FROM pg_indexes WHERE tablename='internship_applications'
--     AND indexname='uq_internship_appl_internship_student';          -> 1 row
--   SELECT count(*) FROM internship_applications;                     -> 0 (today)
