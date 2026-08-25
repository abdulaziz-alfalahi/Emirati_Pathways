-- 088_outbound_mail_queue.sql
--
-- WHY
--
-- Migrations 086 and 087 retired a backlog of 46 board emails and 131
-- invitation links that would have gone to real employers and real board
-- offices the moment mail started working. The owner's instruction is that
-- nothing reaches a real user or company that has not been verified and
-- approved, one message at a time.
--
-- This table is where a message waits for that approval. Every outbound email
-- the platform composes lands here first; nothing is handed to Microsoft Graph
-- that does not have an approving human recorded against it.
--
-- THE STATES
--
--   held      composed, waiting for a person. THE DEFAULT — a row cannot be
--             inserted in any other state (see the trigger below).
--   approved  a named person approved it; the sender may pick it up
--   sending   claimed by a sender run, so two runs cannot send it twice
--   sent      Graph accepted it
--   failed    Graph rejected it, or the gate refused at send time
--   rejected  a person declined it; it is never sent
--
-- WHY A TRIGGER AND NOT JUST A DEFAULT
--
-- A DEFAULT is advisory: any INSERT that names the status column overrides it.
-- The whole value of this table is that no code path — including one written
-- next year by someone who has not read migration 086 — can insert a row that
-- is already approved. So the trigger REJECTS such an insert outright rather
-- than quietly correcting it, because silently rewriting somebody's INSERT
-- hides the bug instead of surfacing it.
--
-- Approval is therefore only ever reachable through an UPDATE, which is what
-- the approve endpoint does, and which requires an approver id.
--
-- PRECONDITION VERIFIED ON THE LIVE DB 2026-08-25
--   no table named outbound_mail exists
--   backend/outbound_mail.py (migration 086/087 era) has the gate but no queue

BEGIN;

CREATE TABLE IF NOT EXISTS outbound_mail (
    id               BIGSERIAL PRIMARY KEY,

    -- what
    to_email         TEXT        NOT NULL,
    to_name          TEXT,
    subject          TEXT        NOT NULL,
    body_text        TEXT        NOT NULL,
    body_html        TEXT,

    -- why: enough to find every message a feature produced, and to trace one
    -- back to the thing that caused it
    kind             TEXT        NOT NULL,
    related_type     TEXT,
    related_id       TEXT,

    -- where it is
    status           TEXT        NOT NULL DEFAULT 'held',

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       CHAR(15),

    approved_by      CHAR(15),
    approved_at      TIMESTAMPTZ,
    rejected_by      CHAR(15),
    rejected_at      TIMESTAMPTZ,
    decision_note    TEXT,

    -- what happened when a sender tried
    attempts         INTEGER     NOT NULL DEFAULT 0,
    sent_at          TIMESTAMPTZ,
    last_error       TEXT,
    gate_decision    TEXT,
    provider_id      TEXT,

    CONSTRAINT outbound_mail_status_chk CHECK (status IN
        ('held', 'approved', 'sending', 'sent', 'failed', 'rejected')),

    -- An approved row must name who approved it. Without this, "approved by
    -- nobody" is representable, and per-message approval means nothing.
    CONSTRAINT outbound_mail_approver_chk CHECK (
        (status IN ('approved', 'sending', 'sent') AND approved_by IS NOT NULL)
        OR status IN ('held', 'failed', 'rejected')),

    CONSTRAINT outbound_mail_rejecter_chk CHECK (
        status <> 'rejected' OR rejected_by IS NOT NULL)
);

-- The sender's working query: oldest approved first.
CREATE INDEX IF NOT EXISTS idx_outbound_mail_sendable
    ON outbound_mail (status, created_at)
    WHERE status = 'approved';

-- The reviewer's working query.
CREATE INDEX IF NOT EXISTS idx_outbound_mail_held
    ON outbound_mail (created_at DESC)
    WHERE status = 'held';

CREATE INDEX IF NOT EXISTS idx_outbound_mail_related
    ON outbound_mail (related_type, related_id);

-- ── Nothing may be born approved ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION outbound_mail_must_start_held()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status <> 'held' THEN
        RAISE EXCEPTION
            'outbound_mail rows must be inserted as held (got %). Approval is '
            'granted by a person through an UPDATE, never at insert time — see '
            'migration 088.', NEW.status
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
        RAISE EXCEPTION
            'outbound_mail rows may not be inserted with an approver already '
            'set — see migration 088.'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_outbound_mail_must_start_held ON outbound_mail;
CREATE TRIGGER trg_outbound_mail_must_start_held
    BEFORE INSERT ON outbound_mail
    FOR EACH ROW EXECUTE FUNCTION outbound_mail_must_start_held();

COMMENT ON TABLE outbound_mail IS
    'Every email the platform composes waits here for per-message approval by a '
    'named person before any transport may send it. Created by migration 088 '
    'after migrations 086/087 retired a backlog of 46 board emails and 131 '
    'invitation links that would have reached real employers and board offices '
    'unreviewed.';

COMMENT ON COLUMN outbound_mail.status IS
    'held (default, enforced by trigger) -> approved -> sending -> sent/failed; '
    'or held -> rejected. Only approve/reject endpoints may move a row out of '
    'held, and only with an approver or rejecter recorded.';

COMMENT ON COLUMN outbound_mail.gate_decision IS
    'The outbound_mail.decide() verdict recorded at send time — why a message '
    'was or was not handed to the transport, kept even when it was allowed.';

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. The table and its guards exist:
--      SELECT count(*) FROM information_schema.tables WHERE table_name='outbound_mail';
--      SELECT conname FROM pg_constraint WHERE conrelid='outbound_mail'::regclass;
--      SELECT tgname FROM pg_trigger WHERE tgrelid='outbound_mail'::regclass AND NOT tgisinternal;
--
-- 2. A normal insert works and lands HELD:
--      BEGIN;
--        INSERT INTO outbound_mail (to_email, subject, body_text, kind)
--        VALUES ('zz-probe@ehrdc.gov.ae', 'ZZ-088 probe', 'body', 'probe');
--        SELECT status FROM outbound_mail WHERE subject='ZZ-088 probe';  -- 'held'
--      ROLLBACK;
--
-- 3. Being born approved is REFUSED — both spellings:
--      BEGIN;
--        INSERT INTO outbound_mail (to_email, subject, body_text, kind, status)
--        VALUES ('zz@ehrdc.gov.ae','ZZ','b','probe','approved');       -- must FAIL
--      ROLLBACK;
--      BEGIN;
--        INSERT INTO outbound_mail (to_email, subject, body_text, kind, approved_by)
--        VALUES ('zz@ehrdc.gov.ae','ZZ','b','probe','784000000000020'); -- must FAIL
--      ROLLBACK;
--
-- 4. Approving without an approver is REFUSED:
--      BEGIN;
--        INSERT INTO outbound_mail (to_email, subject, body_text, kind)
--        VALUES ('zz@ehrdc.gov.ae','ZZ','b','probe');
--        UPDATE outbound_mail SET status='approved' WHERE subject='ZZ';  -- must FAIL
--      ROLLBACK;
