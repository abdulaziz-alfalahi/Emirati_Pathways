-- 021_lifelong_engagement_tables.sql
-- Lifelong-engagement go/no-go audit, cluster B1: BUILD the feature rather than
-- hide it. backend/lifelong_engagement_routes.py serves Thought Leadership,
-- Success Stories and Retiree Services, but every one of those handlers queries
-- a table that was never created on the live DB, so each endpoint 500s.
--
-- WHY: the 2026-07-24 audit proved these endpoints 500 in prod (relation does
--   not exist) because the code selects from tables that are simply absent:
--     * /api/lifelong/thought-leadership/leaders -> tl_leaders, tl_books,
--       tl_speeches
--     * /api/lifelong/success-stories            -> success_stories,
--       ss_highlights
--     * /api/lifelong/success-stories/stats      -> ss_sectors
--     * /api/lifelong/retiree/pension-benefits   -> ret_pension_benefits,
--       ret_pension_details
--     * /api/lifelong/retiree/healthcare         -> ret_healthcare
--     * /api/lifelong/retiree/engagement         -> ret_engagement
--     * /api/lifelong/retiree/perks              -> ret_lifestyle_perks,
--       ret_service_centres
--   (The ns_* national-service tables in the same file were already created by
--   migrations 017/018 and are intentionally untouched here.)
--
--   Column names below mirror EXACTLY what the handlers select and what the
--   frontend consumers map:
--     ThoughtLeadershipPage.tsx, ShareSuccessStoriesPage.tsx, RetireePage.tsx
--   i.e. the bilingual _en/_ar convention already used by the ns_* tables.
--   The backend joins children to parents on the parent's integer PK
--   (`l['id']` -> tl_books.leader_id / tl_speeches.leader_id,
--    `s['id']` -> ss_highlights.story_id,
--    `b['id']` -> ret_pension_details.benefit_id), so those integer FKs are
--   declared accordingly. tl_leaders also carries a `leader_id` column because
--   the frontend keys its rows on `l.leader_id`.
--
-- PRECONDITION (verified live 2026-07-24 via information_schema):
--   - tl_leaders, tl_books, tl_speeches, success_stories, ss_highlights,
--     ss_sectors, ret_pension_benefits, ret_pension_details, ret_healthcare,
--     ret_engagement, ret_lifestyle_perks, ret_service_centres:
--     all ABSENT from schema public.
--   - users.id: character(15). (None of these tables reference users, so there
--     is no users FK to type; noted for completeness per the CHAR(15) rule.)
-- Every statement is CREATE TABLE IF NOT EXISTS, so if any table already exists
-- with another shape the statement no-ops instead of destroying it. Nothing
-- here drops or rewrites data.
--
-- Content policy: all tables are created EMPTY. No fabricated leaders, books,
-- speeches, success stories, pension benefits, sector counts or statistics are
-- seeded (audit issue #26) -- the endpoints will return honest empty lists
-- (200, not 500) until an operator enters real, sourced content.

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
--  THOUGHT LEADERSHIP
-- ═══════════════════════════════════════════════════════════════════════════

-- tl_leaders: SELECT * FROM tl_leaders ORDER BY id
--   frontend maps: leader_id, name_en/ar, title_en/ar, era, role_en/ar,
--                  avatar, theme_bg, theme_accent, theme_light, bio_en/ar
CREATE TABLE IF NOT EXISTS tl_leaders (
    id           SERIAL PRIMARY KEY,
    leader_id    INTEGER,
    name_en      VARCHAR(255) DEFAULT '', name_ar  VARCHAR(255) DEFAULT '',
    title_en     VARCHAR(255) DEFAULT '', title_ar VARCHAR(255) DEFAULT '',
    era          VARCHAR(120) DEFAULT '',
    role_en      VARCHAR(255) DEFAULT '', role_ar  VARCHAR(255) DEFAULT '',
    avatar       VARCHAR(60)  DEFAULT '',
    theme_bg     VARCHAR(40)  DEFAULT '',
    theme_accent VARCHAR(40)  DEFAULT '',
    theme_light  VARCHAR(40)  DEFAULT '',
    bio_en       TEXT DEFAULT '', bio_ar TEXT DEFAULT ''
);

-- tl_books: SELECT * FROM tl_books WHERE leader_id = %s ORDER BY id
--   frontend maps: title_en/ar, author_en/ar, year, desc_en/ar
CREATE TABLE IF NOT EXISTS tl_books (
    id         SERIAL PRIMARY KEY,
    leader_id  INTEGER REFERENCES tl_leaders(id),
    title_en   VARCHAR(255) DEFAULT '', title_ar  VARCHAR(255) DEFAULT '',
    author_en  VARCHAR(255) DEFAULT '', author_ar VARCHAR(255) DEFAULT '',
    year       VARCHAR(20)  DEFAULT '',
    desc_en    TEXT DEFAULT '', desc_ar TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_tl_books_leader ON tl_books (leader_id);

-- tl_speeches: SELECT * FROM tl_speeches WHERE leader_id = %s ORDER BY id
--   frontend maps: title_en/ar, quote_en/ar
CREATE TABLE IF NOT EXISTS tl_speeches (
    id         SERIAL PRIMARY KEY,
    leader_id  INTEGER REFERENCES tl_leaders(id),
    title_en   VARCHAR(255) DEFAULT '', title_ar VARCHAR(255) DEFAULT '',
    quote_en   TEXT DEFAULT '', quote_ar TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_tl_speeches_leader ON tl_speeches (leader_id);

-- ═══════════════════════════════════════════════════════════════════════════
--  SUCCESS STORIES
-- ═══════════════════════════════════════════════════════════════════════════

-- success_stories: SELECT * FROM success_stories ORDER BY id
--   frontend maps: name_en/ar, role_en/ar, prev_role_en/ar, company_en/ar,
--                  sector_en/ar, location_en/ar, avatar, theme_bg/accent/light,
--                  story_en/ar, quote_en/ar
CREATE TABLE IF NOT EXISTS success_stories (
    id            SERIAL PRIMARY KEY,
    name_en       VARCHAR(255) DEFAULT '', name_ar     VARCHAR(255) DEFAULT '',
    role_en       VARCHAR(255) DEFAULT '', role_ar     VARCHAR(255) DEFAULT '',
    prev_role_en  VARCHAR(255) DEFAULT '', prev_role_ar VARCHAR(255) DEFAULT '',
    company_en    VARCHAR(255) DEFAULT '', company_ar  VARCHAR(255) DEFAULT '',
    sector_en     VARCHAR(120) DEFAULT '', sector_ar   VARCHAR(120) DEFAULT '',
    location_en   VARCHAR(255) DEFAULT '', location_ar VARCHAR(255) DEFAULT '',
    avatar        VARCHAR(60)  DEFAULT '',
    theme_bg      VARCHAR(40)  DEFAULT '',
    theme_accent  VARCHAR(40)  DEFAULT '',
    theme_light   VARCHAR(40)  DEFAULT '',
    story_en      TEXT DEFAULT '', story_ar TEXT DEFAULT '',
    quote_en      TEXT DEFAULT '', quote_ar TEXT DEFAULT ''
);

-- ss_highlights: SELECT highlight_en, highlight_ar FROM ss_highlights
--                WHERE story_id = %s ORDER BY id
CREATE TABLE IF NOT EXISTS ss_highlights (
    id            SERIAL PRIMARY KEY,
    story_id      INTEGER REFERENCES success_stories(id),
    highlight_en  TEXT DEFAULT '', highlight_ar TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_ss_highlights_story ON ss_highlights (story_id);

-- ss_sectors: SELECT * FROM ss_sectors ORDER BY id
--   frontend maps: sector_en/ar, count, icon, color, color_text
CREATE TABLE IF NOT EXISTS ss_sectors (
    id          SERIAL PRIMARY KEY,
    sector_en   VARCHAR(120) DEFAULT '', sector_ar VARCHAR(120) DEFAULT '',
    count       INTEGER NOT NULL DEFAULT 0,
    icon        VARCHAR(60) DEFAULT '',
    color       VARCHAR(40) DEFAULT '',
    color_text  VARCHAR(40) DEFAULT ''
);

-- ═══════════════════════════════════════════════════════════════════════════
--  RETIREE SERVICES
-- ═══════════════════════════════════════════════════════════════════════════

-- ret_pension_benefits: SELECT * FROM ret_pension_benefits ORDER BY id
--   frontend maps: title_en/ar, desc_en/ar, icon, provider_en/ar
CREATE TABLE IF NOT EXISTS ret_pension_benefits (
    id           SERIAL PRIMARY KEY,
    title_en     VARCHAR(255) DEFAULT '', title_ar    VARCHAR(255) DEFAULT '',
    desc_en      TEXT DEFAULT '', desc_ar TEXT DEFAULT '',
    icon         VARCHAR(60) DEFAULT '',
    provider_en  VARCHAR(255) DEFAULT '', provider_ar VARCHAR(255) DEFAULT ''
);

-- ret_pension_details: SELECT detail_en, detail_ar FROM ret_pension_details
--                      WHERE benefit_id = %s ORDER BY id
CREATE TABLE IF NOT EXISTS ret_pension_details (
    id          SERIAL PRIMARY KEY,
    benefit_id  INTEGER REFERENCES ret_pension_benefits(id),
    detail_en   TEXT DEFAULT '', detail_ar TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_ret_pension_details_benefit ON ret_pension_details (benefit_id);

-- ret_healthcare: SELECT * FROM ret_healthcare ORDER BY id
--   frontend maps: title_en/ar, provider_en/ar, desc_en/ar, coverage_en/ar, icon
CREATE TABLE IF NOT EXISTS ret_healthcare (
    id           SERIAL PRIMARY KEY,
    title_en     VARCHAR(255) DEFAULT '', title_ar    VARCHAR(255) DEFAULT '',
    provider_en  VARCHAR(255) DEFAULT '', provider_ar VARCHAR(255) DEFAULT '',
    desc_en      TEXT DEFAULT '', desc_ar TEXT DEFAULT '',
    coverage_en  VARCHAR(120) DEFAULT '', coverage_ar VARCHAR(120) DEFAULT '',
    icon         VARCHAR(60) DEFAULT ''
);

-- ret_engagement: SELECT * FROM ret_engagement ORDER BY id
--   frontend maps: title_en/ar, org_en/ar, type_en/ar, desc_en/ar,
--                  commitment_en/ar, spots
CREATE TABLE IF NOT EXISTS ret_engagement (
    id             SERIAL PRIMARY KEY,
    title_en       VARCHAR(255) DEFAULT '', title_ar VARCHAR(255) DEFAULT '',
    org_en         VARCHAR(255) DEFAULT '', org_ar   VARCHAR(255) DEFAULT '',
    type_en        VARCHAR(120) DEFAULT '', type_ar  VARCHAR(120) DEFAULT '',
    desc_en        TEXT DEFAULT '', desc_ar TEXT DEFAULT '',
    commitment_en  VARCHAR(255) DEFAULT '', commitment_ar VARCHAR(255) DEFAULT '',
    spots          INTEGER NOT NULL DEFAULT 0
);

-- ret_lifestyle_perks: SELECT * FROM ret_lifestyle_perks ORDER BY id
--   frontend maps: icon, title_en/ar, desc_en/ar, category_en/ar
CREATE TABLE IF NOT EXISTS ret_lifestyle_perks (
    id           SERIAL PRIMARY KEY,
    icon         VARCHAR(60) DEFAULT '',
    title_en     VARCHAR(255) DEFAULT '', title_ar    VARCHAR(255) DEFAULT '',
    desc_en      TEXT DEFAULT '', desc_ar TEXT DEFAULT '',
    category_en  VARCHAR(120) DEFAULT '', category_ar VARCHAR(120) DEFAULT ''
);

-- ret_service_centres: SELECT * FROM ret_service_centres ORDER BY id
--   frontend maps: city_en/ar, location_en/ar, phone
CREATE TABLE IF NOT EXISTS ret_service_centres (
    id           SERIAL PRIMARY KEY,
    city_en      VARCHAR(120) DEFAULT '', city_ar     VARCHAR(120) DEFAULT '',
    location_en  VARCHAR(255) DEFAULT '', location_ar VARCHAR(255) DEFAULT '',
    phone        VARCHAR(60) DEFAULT ''
);

COMMIT;

-- VERIFICATION (run after):
--   SELECT COUNT(*) FROM tl_leaders;          -- 0
--   SELECT COUNT(*) FROM tl_books;            -- 0
--   SELECT COUNT(*) FROM tl_speeches;         -- 0
--   SELECT COUNT(*) FROM success_stories;     -- 0
--   SELECT COUNT(*) FROM ss_highlights;       -- 0
--   SELECT COUNT(*) FROM ss_sectors;          -- 0
--   SELECT COUNT(*) FROM ret_pension_benefits;-- 0
--   SELECT COUNT(*) FROM ret_pension_details; -- 0
--   SELECT COUNT(*) FROM ret_healthcare;      -- 0
--   SELECT COUNT(*) FROM ret_engagement;      -- 0
--   SELECT COUNT(*) FROM ret_lifestyle_perks; -- 0
--   SELECT COUNT(*) FROM ret_service_centres; -- 0
