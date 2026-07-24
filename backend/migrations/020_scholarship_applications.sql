-- 020_scholarship_applications.sql
-- Landmine fix (service-catalog audit follow-through): the scholarship apply
-- endpoint (education_api_routes.apply_to_scholarship) INSERTs into
-- scholarship_applications, but that relation never existed on the live DB —
-- every apply attempt 500'd (it also selected a phantom skills_required
-- column, fixed in code alongside this migration).
--
-- PRECONDITION (verified live 2026-07-24 via information_schema):
--   - scholarship_applications: ABSENT from schema public.
--   - scholarships: EXISTS (id integer, ...), 0 rows.
--   - users.id: character(15).
-- Idempotent; creates nothing but this empty table + index.

BEGIN;

CREATE TABLE IF NOT EXISTS scholarship_applications (
    id               SERIAL PRIMARY KEY,
    user_id          CHAR(15) NOT NULL REFERENCES users(id),
    scholarship_id   INTEGER NOT NULL REFERENCES scholarships(id),
    application_data JSONB NOT NULL DEFAULT '{}',
    ai_match_score   NUMERIC,                         -- nullable: no fabricated scores
    status           VARCHAR(30) NOT NULL DEFAULT 'submitted',
    submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, scholarship_id)
);
CREATE INDEX IF NOT EXISTS idx_schol_apps_scholarship ON scholarship_applications (scholarship_id);

COMMIT;

-- VERIFICATION:
--   SELECT COUNT(*) FROM scholarship_applications;   -- 0
--   \d scholarship_applications                       -- user_id character(15)
