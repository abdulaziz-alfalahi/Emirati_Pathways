-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 039 — community_memberships (EID-keyed, JWT-scoped)
--
-- Feature: Professional Growth → Communities (P5). The page faked membership in
--   the client (`joined: i < 3`) and every action button (Join / Leave / My
--   Communities) was dead — there was no membership backend at all, only
--   read-only GET /communities|feed|events (data-honesty audit). This table +
--   the join/leave/my endpoints make "Join a community" and "My Communities"
--   real.
--
-- PRECONDITION verified against live DB (dghr_prod) 2026-07-29: no
--   community_memberships table exists; `communities` has integer ids (1..5);
--   users.id is CHAR(15) (Emirates ID).
--
-- Idempotent + transactional. Safe to run repeatedly.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS community_memberships (
    id            SERIAL PRIMARY KEY,
    user_id       VARCHAR(15) NOT NULL,   -- Emirates ID (users.id)
    community_id  INTEGER     NOT NULL,   -- communities.id
    created_at    TIMESTAMP   DEFAULT NOW(),
    UNIQUE (user_id, community_id)
);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user ON community_memberships (user_id);

COMMIT;

-- ── Verification (expected results) ────────────────────────────────────────
-- SELECT to_regclass('public.community_memberships');   -- not null
-- SELECT count(*) FROM community_memberships;           -- 0 initially
