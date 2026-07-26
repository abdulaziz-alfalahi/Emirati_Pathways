-- Migration 034 — Recruiter-requested assessments + candidate consent
--
-- WHY: The owner's assessment vision (2026-07-26) — assessments are self-initiated
-- OR requested by recruiters, and a recruiter-requested assessment needs candidate
-- consent (the outcome is PII the recruiter will see). Adds:
--   * assessments.requested_by   — the recruiter who requested it (NULL = self-initiated)
--   * assessments.consent_status — not_required (self) | pending | granted | denied
-- The assessor pool hides consent='pending' rows until the candidate grants consent;
-- the requesting recruiter can view the outcome only once granted + completed.
--
-- PRECONDITION (verified live 2026-07-26): neither column exists on `assessments`.
-- Idempotent (ADD COLUMN IF NOT EXISTS). Additive; existing rows default to
-- consent_status='not_required' (they are all self/operator-created today).

BEGIN;

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS requested_by CHAR(15);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS consent_status VARCHAR(20) DEFAULT 'not_required';
UPDATE assessments SET consent_status = 'not_required' WHERE consent_status IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessments_requested_by ON assessments(requested_by);

COMMIT;

-- Verify: SELECT column_name FROM information_schema.columns
--   WHERE table_name='assessments' AND column_name IN ('requested_by','consent_status'); -- 2 rows
