-- 093_reject_and_remove_unintended_outbound_mail.sql
--
-- Owner instruction, 2026-08-27: "Reject and remove the 267 and the al
-- Rostamani message."
--
-- WHY
--
-- Every message in the queue got there without anyone deciding to write to the
-- recipient.
--
--   * 267 vacancy_verification messages to 145 REAL employers, created in ONE
--     transaction at 11:15:38 on 2026-08-27 with no attribution at all
--     (recruiter_id the literal '0', created_by NULL). The NAFIS import
--     composed one email per vacancy ROW as an unavoidable side effect, and the
--     operator screen uploads the CSV the moment it is CHOSEN — so picking a
--     file to preview and filter composed all 267.
--
--   * 1 company_invitation to al Rostamani Group. The "Send Invite" button
--     queued it while telling the operator "Copy this magic link and send it to
--     the employer" — i.e. that the platform had sent nothing. Asked about it,
--     the operator truthfully said he had not taken that action.
--
-- Nothing was ever delivered: the recipient allow-list and per-message approval
-- both held. Both causes are fixed in the same branch. This clears what they
-- produced.
--
-- REJECTED **AND THEN** REMOVED, DELIBERATELY IN THAT ORDER
--
-- outbound_mail.reject() says of a rejected row: "It is never sent, and it
-- stays as evidence." The owner asked for removal as well, so the evidence
-- moves rather than disappearing: every row is stamped with the decision, then
-- copied whole — bodies included — into _backup_rejected_outbound_mail_093, and
-- only then deleted. The backup is now where the record of these 268 messages
-- lives.
--
-- PRECONDITION, verified against dghr_prod on 2026-08-27:
--   * outbound_mail holds exactly 268 rows, ALL with status 'held'
--       267 vacancy_verification to 145 distinct addresses
--         1 company_invitation  to   1 address
--   * nothing has ever been approved, sent or rejected (non-held count = 0)
-- The DELETE is therefore scoped to status='held' and cannot take a sent or
-- approved message if this runs somewhere those exist.
--
-- WHAT THIS DELIBERATELY DOES NOT TOUCH
--
-- The credentials the messages carried:
--   * 267 rows in job_verification_tokens (7-day vacancy-verification links)
--   * 1 row in company_invitations (a magic link conferring employer_admin)
-- None was ever transmitted, and expiring them decides something separate —
-- whether those vacancies can still be verified without re-importing. Raised
-- with the owner rather than folded into a message cleanup. A cancelled
-- invitation whose link still works is not fully cancelled.

BEGIN;

-- ------------------------------------------- 1. record the decision --------
UPDATE outbound_mail
   SET status = 'rejected',
       rejected_by = '784000000000240',          -- the owner, who asked for this
       rejected_at = now(),
       decision_note = 'Rejected and removed by owner instruction 2026-08-27: '
                       'composed without intent — the NAFIS import queued one '
                       'message per vacancy row on file selection, and the '
                       'employer invite button queued mail while telling the '
                       'operator it had not. Never delivered. Migration 093.'
 WHERE status = 'held';

-- --------------------------------------- 2. keep the evidence --------------
-- Whole rows, bodies and all: what was almost sent is the part worth keeping.
CREATE TABLE IF NOT EXISTS _backup_rejected_outbound_mail_093 AS
SELECT *, now() AS captured_at
  FROM outbound_mail
 WHERE status = 'rejected';

-- ------------------------------------------------- 3. remove ---------------
DELETE FROM outbound_mail
 WHERE status = 'rejected'
   AND id IN (SELECT id FROM _backup_rejected_outbound_mail_093);

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0:
--   SELECT count(*) FROM outbound_mail;
--
-- Expect 268, of which 267 vacancy_verification and 1 company_invitation:
--   SELECT kind, count(*) FROM _backup_rejected_outbound_mail_093 GROUP BY kind;
--
-- Expect every backed-up row to carry the decision:
--   SELECT count(*) FROM _backup_rejected_outbound_mail_093
--    WHERE rejected_by IS NULL OR rejected_at IS NULL OR decision_note IS NULL;
--
-- Restore (if ever needed) — puts them back as HELD, never as approved:
--   INSERT INTO outbound_mail
--   SELECT id, to_email, to_name, subject, body_text, body_html, kind,
--          related_type, related_id, status, created_at, created_by,
--          approved_by, approved_at, rejected_by, rejected_at, decision_note,
--          attempts, sent_at, last_error, gate_decision, provider_id,
--          template_fingerprint, release_basis, released_by, released_at
--     FROM _backup_rejected_outbound_mail_093;
--   UPDATE outbound_mail SET status = 'held', rejected_by = NULL,
--          rejected_at = NULL WHERE status = 'rejected';
