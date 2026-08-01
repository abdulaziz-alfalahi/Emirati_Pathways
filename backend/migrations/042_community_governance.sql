-- 042: real governance model for communities.
--
-- The operator dashboard governed seeded demo tables (community_groups/
-- content/events) disconnected from the real `communities` +
-- `community_memberships` (migration 039). This adds what real governance
-- needs: a moderator role on memberships, lifecycle fields on communities,
-- and a moderation state on real posts.

ALTER TABLE community_memberships
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
CREATE INDEX IF NOT EXISTS idx_community_memberships_role
    ON community_memberships (community_id, role);

ALTER TABLE communities
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE communities
    ADD COLUMN IF NOT EXISTS created_by TEXT;

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS community_id INTEGER;
ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS author_user_id TEXT;

-- Remove the fabricated demo rows the old dashboard displayed as real
-- (planted by ensure_community_tables' seeder; invented member counts,
-- authors and events).
DELETE FROM community_content;
DELETE FROM community_events;
DELETE FROM community_groups;
