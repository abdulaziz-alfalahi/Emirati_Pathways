-- 086_reset_undelivered_message_queues.sql
--
-- WHY
--
-- DGHR issued the Azure app registration for platform email on 2026-08-25, so
-- the platform is about to be able to send mail for the first time. Before the
-- credentials go into backend/.env, every row that a future sender could pick
-- up and deliver has to be accounted for — because the platform has spent
-- months accumulating "queued" messages that nothing has ever drained.
--
-- WHAT WAS ACTUALLY SITTING THERE (measured on the live DB, 2026-08-25)
--
--   board_office_notifications:  46 rows, status='pending', queued 18-21 Aug
--
-- Of those 46:
--
--   * 42 are ORPHANED — their meeting_id points at a board_meetings row that
--     no longer exists. They are my own ZZ- test meetings (ZZ-E2E, ZZ-CHAIR,
--     ZZ-DEMO, ZZ-DIAG), deleted during test cleanup. The notifications
--     survived the cleanup because there is NO FOREIGN KEY on meeting_id, and
--     because subject/body/office_email are denormalised into each row. Every
--     one of them is a complete, sendable email.
--
--   * They are addressed to REAL government offices: 39 at dghr.gov.ae and 7
--     at ehrdc.gov.ae.
--
--   * The remaining 4 belong to meetings that are already completed (Q3
--     Meeting, and "Test - Board Meeting - 1", both 2026-08-19).
--
-- So configuring mail without this migration would have sent 46 emails to real
-- board member offices, 42 of them announcing test meetings that do not exist,
-- with subjects like "EHRDC Board meeting has been scheduled: ZZ-E2E Waiting
-- room 2". None of them is a message anyone should receive.
--
--   application_status_history:  17 rows with notification_sent = false,
--                                oldest 2026-05-05
--
-- Nothing in the codebase reads or writes that column today (it survives only
-- in an old DDL file), but "WHERE notification_sent = false" is exactly the
-- query someone implementing status-change email would write, and it would
-- reach back to May.
--
-- PRECONDITION VERIFIED ON THE LIVE DB 2026-08-25
--   board_office_notifications: 46 pending / 42 orphaned / 0 sent / 0 failed
--   application_status_history: 17 rows notification_sent = false
--   status CHECK allows exactly ('pending','sent','failed') — widened below
--   no foreign key of any kind on board_office_notifications
--
-- If the counts differ when this runs elsewhere, that is fine: every statement
-- is written against the CONDITION (pending / false), not against those counts.
--
-- WHAT THIS DOES NOT DO
--
-- It does not delete the orphans, and so it cannot add the missing foreign key
-- (an FK cannot be created while 42 rows violate it). Superseding stops them
-- being sent, which is what was asked for; deleting them and adding
-- ON DELETE CASCADE is a separate decision because it discards evidence of how
-- this happened. Until that is done, deleting a board meeting still leaves its
-- queued emails behind.
--
-- It also does not touch invitation tokens (company_invitations,
-- seeker_invitations, job_verification_tokens, event_invitations). Those are
-- links a person hands out on purpose, not messages that fire on their own.

BEGIN;

-- ── Snapshot before anything changes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS _backup_board_office_queue_086 AS
SELECT n.*,
       (m.id IS NULL)      AS was_orphaned,
       m.title             AS meeting_title,
       now()               AS captured_at
  FROM board_office_notifications n
  LEFT JOIN board_meetings m ON m.id = n.meeting_id
 WHERE n.status = 'pending';

CREATE TABLE IF NOT EXISTS _backup_status_history_notify_086 AS
SELECT id, application_id, previous_status, new_status, changed_at,
       notification_sent, now() AS captured_at
  FROM application_status_history
 WHERE notification_sent = false;

-- ── Allow a state that means "deliberately never sent" ──────────────────────
-- 'failed' would be a lie: these were never attempted. 'sent' would be worse.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint
                WHERE conname = 'board_office_notifications_status_check') THEN
        ALTER TABLE board_office_notifications
            DROP CONSTRAINT board_office_notifications_status_check;
    END IF;
    ALTER TABLE board_office_notifications
        ADD CONSTRAINT board_office_notifications_status_check
        CHECK (status IN ('pending', 'sent', 'failed', 'superseded'));
END $$;

COMMENT ON COLUMN board_office_notifications.status IS
    'pending = waiting for a sender. sent/failed = a sender tried. '
    'superseded = deliberately retired without being sent; a sender must '
    'never pick these up. Added by migration 086 when the backlog that '
    'accumulated while mail was unconfigured was retired ahead of the first '
    'real mail credentials.';

-- ── The reset ───────────────────────────────────────────────────────────────
UPDATE board_office_notifications
   SET status     = 'superseded',
       last_error = 'retired by migration 086 on 2026-08-25: queued while mail '
                    'delivery was unconfigured, and never sent. Not to be '
                    'delivered — most of this backlog announced deleted test '
                    'meetings to real offices.'
 WHERE status = 'pending';

-- Vestigial today, but it is the obvious guard for whoever wires status-change
-- email, and it must not reach back to May.
UPDATE application_status_history
   SET notification_sent = true
 WHERE notification_sent = false;

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. Nothing is left for a sender to pick up. Expect ZERO rows:
--      SELECT status, count(*) FROM board_office_notifications
--       WHERE status = 'pending' GROUP BY status;
--      SELECT count(*) FROM application_status_history
--       WHERE notification_sent = false;
--
-- 2. The backlog is retired, not lost. Expect 46 superseded, 46 backed up:
--      SELECT status, count(*) FROM board_office_notifications GROUP BY status;
--      SELECT count(*) FILTER (WHERE was_orphaned) AS orphaned, count(*) AS total
--        FROM _backup_board_office_queue_086;
--
-- 3. A new notification can still be queued normally (the constraint was
--    widened, not tightened) — run inside a transaction and roll back:
--      BEGIN;
--        INSERT INTO board_office_notifications
--               (meeting_id, board_member_id, office_email, kind, subject,
--                body, status, attempts)
--        SELECT meeting_id, board_member_id, office_email, kind,
--               'ZZ-086 constraint probe', 'probe', 'pending', 0
--          FROM _backup_board_office_queue_086 LIMIT 1;   -- must succeed
--        INSERT INTO board_office_notifications
--               (meeting_id, board_member_id, office_email, kind, subject,
--                body, status, attempts)
--        SELECT meeting_id, board_member_id, office_email, kind,
--               'ZZ-086 bad state', 'probe', 'nonsense', 0
--          FROM _backup_board_office_queue_086 LIMIT 1;   -- must FAIL
--      ROLLBACK;
