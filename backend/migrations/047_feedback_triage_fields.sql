-- 047: Feedback triage fields — severity, title, richer statuses, resolution link
--
-- WHY (from actually triaging the 183 live reports on 2026-08-03):
--   * severity and the report title are only present INSIDE the message text
--     ("[Title]\n\n...\n\n[Severity]: MEDIUM"), so the admin tab cannot sort or
--     filter by them — a HIGH from a recruiter looks like a passing remark.
--   * status is effectively binary (open/resolved). Items that were *answered*,
--     *awaiting the reporter*, or *fixed pending verification* all had to be
--     marked resolved, so the open list stopped meaning "needs attention" —
--     which is exactly why a genuine new report (fb_1785752603) sat unnoticed
--     next to a deliberately parked one.
--   * 181 reports are resolved but only 78 carry a note and NONE reference the
--     PR that fixed them, so the ledger is not auditable.
--
-- PRECONDITION (verified live 2026-08-04): the feedback table has no severity,
-- title, resolution_ref, resolved_by or resolved_at column; status currently
-- holds only 'open' and 'resolved'. No CHECK constraint on status is added —
-- existing rows and older app versions must keep writing their values.
--
-- Backfill parses the widget's own formatting; rows that do not match keep
-- NULL and simply show as unset in the UI. Purely additive.

BEGIN;

ALTER TABLE feedback
    ADD COLUMN IF NOT EXISTS title          varchar(300),
    ADD COLUMN IF NOT EXISTS severity       varchar(20),
    ADD COLUMN IF NOT EXISTS resolution_ref varchar(200),   -- e.g. "PR #265"
    ADD COLUMN IF NOT EXISTS resolved_by    char(15),
    ADD COLUMN IF NOT EXISTS resolved_at    timestamptz;

CREATE INDEX IF NOT EXISTS idx_feedback_status   ON feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_severity ON feedback (severity);

-- Backfill title: the widget writes "[Title]" as the first line.
UPDATE feedback
-- NB {1,255} not {1,300}: Postgres rejects a repetition count above 255.
SET title = NULLIF(TRIM(BOTH ' ' FROM SUBSTRING(message FROM '^\[([^\]]{1,255})\]')), '')
WHERE title IS NULL AND message ~ '^\[';

-- Backfill severity: "[Severity]: HIGH" appended by the widget.
UPDATE feedback
SET severity = UPPER(TRIM(BOTH ' ' FROM SUBSTRING(message FROM '\[Severity\]:\s*([A-Za-z]+)')))
WHERE severity IS NULL AND message ~ '\[Severity\]';

-- Resolved rows predate resolved_at; approximate with the last update so the
-- age/SLA view has something truthful to show (never invents a fresh date).
UPDATE feedback SET resolved_at = updated_at
WHERE status = 'resolved' AND resolved_at IS NULL AND updated_at IS NOT NULL;

COMMIT;

-- Verification:
--   SELECT count(*) FILTER (WHERE title IS NOT NULL),
--          count(*) FILTER (WHERE severity IS NOT NULL), count(*) FROM feedback;
--   SELECT severity, count(*) FROM feedback GROUP BY 1 ORDER BY 2 DESC;
