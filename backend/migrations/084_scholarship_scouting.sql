-- 084_scholarship_scouting.sql
--
-- WHY
--
-- Phase 2 of docs/scope_scholarship_scouting.md: the AI scouts an allow-list of
-- sources, pre-fills DRAFT entries, and the Education Operator verifies and
-- publishes. Owner decisions, 2026-08-23: allow-list only (no open-web
-- crawling), daily re-scout, the operator alone owns the queue, and the operator
-- may add allow-list domains themselves.
--
-- Three tables, each earning its place:
--
--   scholarship_sources        what we are allowed to read, and who said so
--   scholarship_drafts         what the scout found, with its provenance
--   scholarship_rejections     what the operator has already turned down
--
-- WHY REJECTIONS ARE A TABLE AND NOT A FLAG
--
-- The scout reads the same pages EVERY DAY. Without a memory of what was
-- rejected, the same item returns to the queue every morning and the operator
-- rejects it again. Within a fortnight the queue is mostly things they have
-- already dismissed and they stop opening it. That is how this tool dies — not
-- by being wrong, but by being repetitive.
--
-- So a rejection stores the source URL and a content fingerprint, which together
-- identify the same thing tomorrow. It is re-raised ONLY when the page
-- materially changes, using the same signal as the link checker.
--
-- WHY PROVENANCE IS PER-FIELD
--
-- An approved listing must stay distinguishable from an invented one six months
-- later, because "where did this number come from" is a question a government
-- directory will be asked. extracted_raw keeps what the model was given;
-- operator_edits records which fields a human corrected, which is also the
-- signal for whether the scout is worth its cost.
--
-- PRECONDITION, verified live 2026-08-25: `scholarships` exists with the Phase 0
-- link columns (link_type, link_status, link_status_detail, link_checked_at,
-- link_fingerprint) and none of the three tables below exist.
--
-- Additive only. Nothing existing is altered, and re-running is a no-op.

BEGIN;

-- ── The allow-list ─────────────────────────────────────────────────────────
--
-- Searching the open web for "UAE scholarships" surfaces scam sites and paid
-- aggregators. On a government platform, publishing one of those — even briefly,
-- even flagged — is a reputational event rather than a bug. An allow-list makes
-- the failure mode "we missed a programme" instead of "we advertised a fraud".
--
-- added_by is NOT decoration: decision 5 lets the operator add domains alone, so
-- the audit trail is the only thing making that attributable.
CREATE TABLE IF NOT EXISTS scholarship_sources (
    id              SERIAL PRIMARY KEY,
    domain          TEXT        NOT NULL UNIQUE,
    label           TEXT,
    start_url       TEXT        NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    added_by        CHAR(15),
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_scouted_at TIMESTAMPTZ,
    last_outcome    TEXT,
    notes           TEXT
);

COMMENT ON TABLE scholarship_sources IS
    'The ONLY places the scout may read. Open-web crawling is ruled out by owner '
    'decision (2026-08-23): a scam site published even briefly on a government '
    'platform is a reputational event, not a bug.';

COMMENT ON COLUMN scholarship_sources.last_outcome IS
    'What happened on the last scout. A source that has produced nothing for '
    'days is a signal — silence is not success.';

-- ── Drafts ─────────────────────────────────────────────────────────────────
--
-- Nothing here is visible to a candidate. A draft becomes a scholarship only
-- when the operator approves it, and approval is a copy, not a promotion, so the
-- draft and its provenance survive the decision.
CREATE TABLE IF NOT EXISTS scholarship_drafts (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER     REFERENCES scholarship_sources(id) ON DELETE SET NULL,
    source_url      TEXT        NOT NULL,
    fingerprint     TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'pending',
    -- The proposed entry, in the shape of `scholarships`.
    title           TEXT,
    provider_name   TEXT,
    description     TEXT,
    amount          NUMERIC,
    coverage_type   TEXT,
    deadline        DATE,
    min_gpa         NUMERIC,
    academic_level  TEXT,
    eligible_majors TEXT,
    application_link TEXT,
    link_type       TEXT        NOT NULL DEFAULT 'web',
    -- Provenance. extracted_raw is what the model was handed; operator_edits is
    -- what a human changed, per field.
    extracted_raw   TEXT,
    model           TEXT,
    scouted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator_edits  JSONB       NOT NULL DEFAULT '{}'::jsonb,
    reviewed_by     CHAR(15),
    reviewed_at     TIMESTAMPTZ,
    published_id    INTEGER     REFERENCES scholarships(id) ON DELETE SET NULL,
    CONSTRAINT scholarship_drafts_status_chk
        CHECK (status IN ('pending', 'approved', 'rejected', 'superseded'))
);

CREATE INDEX IF NOT EXISTS idx_scholarship_drafts_pending
    ON scholarship_drafts (status, scouted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scholarship_drafts_pending_identity
    ON scholarship_drafts (source_url, fingerprint)
    WHERE status = 'pending';

COMMENT ON COLUMN scholarship_drafts.extracted_raw IS
    'The text the model was given. Without it an approved listing cannot be told '
    'apart from a hallucinated one, and "where did this come from" is a question '
    'this directory will be asked.';

COMMENT ON COLUMN scholarship_drafts.operator_edits IS
    'Which fields a human corrected, per field. Also the honest measure of '
    'whether the scout is worth running: drafts that are always rewritten are a '
    'cost, not an achievement.';

-- ── Rejections ─────────────────────────────────────────────────────────────
--
-- Kept INDEFINITELY (owner decision): a URL, a hash, a reason and a date are
-- small, and they answer "why isn't X listed?" better than a shrug.
CREATE TABLE IF NOT EXISTS scholarship_rejections (
    id            SERIAL PRIMARY KEY,
    source_url    TEXT        NOT NULL,
    fingerprint   TEXT        NOT NULL,
    title         TEXT,
    reason        TEXT        NOT NULL,
    note          TEXT,
    rejected_by   CHAR(15),
    rejected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT scholarship_rejections_reason_chk
        CHECK (reason IN ('not_a_scholarship', 'duplicate', 'out_of_scope',
                          'wrong_details', 'expired', 'other'))
);

-- The suppression lookup: same URL AND same content means the same rejected
-- thing. A changed page produces a different fingerprint and is therefore
-- re-raised, which is the intended behaviour rather than a leak.
CREATE UNIQUE INDEX IF NOT EXISTS idx_scholarship_rejections_identity
    ON scholarship_rejections (source_url, fingerprint);

COMMENT ON TABLE scholarship_rejections IS
    'What the operator has already said no to. The scout reads the same pages '
    'daily, so without this the same item returns every morning until they stop '
    'opening the queue. Re-raised only when the page materially changes.';

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. All three tables exist. Expect 3 rows.
--
--    SELECT table_name FROM information_schema.tables
--     WHERE table_schema = 'public'
--       AND table_name IN ('scholarship_sources','scholarship_drafts',
--                          'scholarship_rejections');
--
-- 2. The vocabularies are enforced. Both must ERROR, then ROLLBACK.
--
--    BEGIN;
--      INSERT INTO scholarship_drafts (source_url, fingerprint, status)
--           VALUES ('x', 'y', 'maybe');            -- must fail
--    ROLLBACK;
--    BEGIN;
--      INSERT INTO scholarship_rejections (source_url, fingerprint, reason)
--           VALUES ('x', 'y', 'because');          -- must fail
--    ROLLBACK;
--
-- 3. The rejection identity is unique — the second insert must fail.
--
--    BEGIN;
--      INSERT INTO scholarship_rejections (source_url, fingerprint, reason)
--           VALUES ('u', 'f', 'duplicate');
--      INSERT INTO scholarship_rejections (source_url, fingerprint, reason)
--           VALUES ('u', 'f', 'other');            -- must fail
--    ROLLBACK;
--
-- 4. Two PENDING drafts for the same page cannot coexist, but a rejected one
--    does not block a new pending one.
--
--    SELECT indexdef FROM pg_indexes
--     WHERE indexname = 'idx_scholarship_drafts_pending_identity';
