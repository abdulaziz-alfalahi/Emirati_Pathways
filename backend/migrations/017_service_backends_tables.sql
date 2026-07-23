-- 017_service_backends_tables.sql
-- Service-catalog deep audit (PR #152 follow-up): create the tables that
-- "active" services query but that never existed on the live DB, and align
-- the one drifted table (community_events).
--
-- WHY: the 2026-07-23 functional audit proved these endpoints 500 in prod:
--   * /api/community-mentorship/communities|community-feed  -> relations
--     "communities" / "community_posts" do not exist
--   * /api/community-mentorship/community-events            -> column "title"
--     does not exist (live table has name/name_ar; code expects title/title_ar
--     plus start_time/end_time/event_type/attendees/... — dual-DDL drift)
--   * /api/career-services/startups                          -> relation
--     "startup_programs" does not exist
--   * /api/lifelong/national-service/*                       -> ns_* relations
--     do not exist (6 tables)
--   * /api/training-center/profile|programs                  -> the blueprint's
--     ensure_tables() DDL declares user_id INTEGER REFERENCES users(id), but
--     users.id is CHAR(15) (Emirates ID) — the CREATE fails on every request,
--     so training_center_profiles never comes into existence
--   * /api/mentor/progress/* (mentor skill verification)     -> no storage at
--     all; new table mentor_skill_verifications backs the new endpoints
--
-- PRECONDITION (verified live 2026-07-23 via information_schema):
--   - communities, community_posts, startup_programs, ns_programs,
--     ns_sustainability_opportunities, ns_partners, ns_milestones,
--     ns_sustainability_impact, ns_enrolment_steps, training_center_profiles,
--     mentor_skill_verifications: all ABSENT from schema public.
--   - community_events: EXISTS with columns (id, name, name_ar, event_date,
--     location, registrations, status, created_at), 4 rows — therefore this
--     migration only ADDs columns there (additive; other writers keep working)
--     and backfills title/title_ar from name/name_ar.
--   - users.id: character(15). All user FKs below use CHAR(15).
-- If a precondition fails elsewhere (e.g. a table already exists with another
-- shape), the guarded IF NOT EXISTS statements no-op instead of destroying it;
-- nothing here drops or rewrites existing data.
--
-- Content policy: tables are created EMPTY except a small set of communities
-- seeded with honest zero counters (members=0, posts_count=0). No fabricated
-- statistics (audit issue #26).

BEGIN;

-- 1) communities ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS communities (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    name_ar       VARCHAR(255) DEFAULT '',
    description   TEXT DEFAULT '',
    description_ar TEXT DEFAULT '',
    category      VARCHAR(120) DEFAULT '',
    category_ar   VARCHAR(120) DEFAULT '',
    members       INTEGER NOT NULL DEFAULT 0,
    posts_count   INTEGER NOT NULL DEFAULT 0,
    verified      BOOLEAN NOT NULL DEFAULT FALSE,
    avatar        TEXT DEFAULT '',
    tags          JSONB NOT NULL DEFAULT '[]',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Starter communities (honest zero counters; real platform topics).
INSERT INTO communities (name, name_ar, description, description_ar, category, category_ar, verified, tags)
SELECT * FROM (VALUES
  ('Emirati Engineers Network','شبكة المهندسين الإماراتيين','Connect with Emirati engineers across all disciplines.','تواصل مع المهندسين الإماراتيين في جميع التخصصات.','Engineering','الهندسة', TRUE, '["engineering","careers"]'::jsonb),
  ('Tech & Digital Careers','التقنية والمهن الرقمية','Software, data and digital-transformation careers in the UAE.','مهن البرمجيات والبيانات والتحول الرقمي في الإمارات.','Technology','التقنية', TRUE, '["technology","digital"]'::jsonb),
  ('Finance & Banking Professionals','محترفو المالية والمصرفية','Careers in banking, fintech and financial services.','المهن في المصارف والتقنية المالية والخدمات المالية.','Finance','المالية', TRUE, '["finance","banking"]'::jsonb),
  ('Healthcare Careers','المهن الصحية','For Emiratis building careers in healthcare.','للإماراتيين الذين يبنون مسيرتهم في القطاع الصحي.','Healthcare','الرعاية الصحية', TRUE, '["healthcare"]'::jsonb),
  ('Women in Leadership','المرأة في القيادة','Supporting Emirati women advancing into leadership roles.','دعم المرأة الإماراتية في الوصول إلى الأدوار القيادية.','Leadership','القيادة', TRUE, '["leadership","women"]'::jsonb)
) AS seed(name,name_ar,description,description_ar,category,category_ar,verified,tags)
WHERE NOT EXISTS (SELECT 1 FROM communities);

-- 2) community_posts ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_posts (
    id                SERIAL PRIMARY KEY,
    author_name       VARCHAR(255) NOT NULL DEFAULT '',
    author_name_ar    VARCHAR(255) DEFAULT '',
    author_title      VARCHAR(255) DEFAULT '',
    author_title_ar   VARCHAR(255) DEFAULT '',
    author_company    VARCHAR(255) DEFAULT '',
    author_company_ar VARCHAR(255) DEFAULT '',
    author_avatar     TEXT DEFAULT '',
    community_name    VARCHAR(255) DEFAULT '',
    community_name_ar VARCHAR(255) DEFAULT '',
    content           TEXT NOT NULL DEFAULT '',
    content_ar        TEXT DEFAULT '',
    likes             INTEGER NOT NULL DEFAULT 0,
    comments          INTEGER NOT NULL DEFAULT 0,
    verified          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) community_events: additive alignment (live table keeps its 4 rows and its
--    other writers; the reader needs these columns) -------------------------
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS title             VARCHAR(255);
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS title_ar          VARCHAR(255);
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS start_time        VARCHAR(40);
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS end_time          VARCHAR(40);
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS location_ar       VARCHAR(255);
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS event_type        VARCHAR(80) DEFAULT 'meetup';
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS attendees         INTEGER DEFAULT 0;
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS max_attendees     INTEGER DEFAULT 0;
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS community_name    VARCHAR(255) DEFAULT '';
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS community_name_ar VARCHAR(255) DEFAULT '';
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS organizer         VARCHAR(255) DEFAULT '';
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS organizer_ar      VARCHAR(255) DEFAULT '';
UPDATE community_events SET title    = name    WHERE title    IS NULL;
UPDATE community_events SET title_ar = name_ar WHERE title_ar IS NULL;
UPDATE community_events SET attendees = COALESCE(registrations, 0) WHERE attendees = 0;

-- 4) startup_programs ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_programs (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    name_ar        VARCHAR(255) DEFAULT '',
    location       VARCHAR(255) DEFAULT '',
    location_ar    VARCHAR(255) DEFAULT '',
    description    TEXT DEFAULT '',
    description_ar TEXT DEFAULT '',
    website        VARCHAR(500) DEFAULT '',
    type           VARCHAR(80) DEFAULT 'accelerator',
    focus          JSONB NOT NULL DEFAULT '[]',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) national service (ns_*) — column names mirror the frontend contract
--    (title_en/title_ar etc., NationalServicePage.tsx) ------------------------
CREATE TABLE IF NOT EXISTS ns_programs (
    id              SERIAL PRIMARY KEY,
    title_en        VARCHAR(255) DEFAULT '', title_ar VARCHAR(255) DEFAULT '',
    org_en          VARCHAR(255) DEFAULT '', org_ar VARCHAR(255) DEFAULT '',
    duration_en     VARCHAR(120) DEFAULT '', duration_ar VARCHAR(120) DEFAULT '',
    icon            VARCHAR(60) DEFAULT '',
    status_key      VARCHAR(40) DEFAULT 'open',
    status_label_en VARCHAR(120) DEFAULT '', status_label_ar VARCHAR(120) DEFAULT '',
    spots           VARCHAR(60) DEFAULT '',
    desc_en         TEXT DEFAULT '', desc_ar TEXT DEFAULT '',
    tags_en         JSONB NOT NULL DEFAULT '[]', tags_ar JSONB NOT NULL DEFAULT '[]',
    highlights_en   JSONB NOT NULL DEFAULT '[]', highlights_ar JSONB NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS ns_sustainability_opportunities (
    id          SERIAL PRIMARY KEY,
    title_en    VARCHAR(255) DEFAULT '', title_ar VARCHAR(255) DEFAULT '',
    location_en VARCHAR(255) DEFAULT '', location_ar VARCHAR(255) DEFAULT '',
    org_en      VARCHAR(255) DEFAULT '', org_ar VARCHAR(255) DEFAULT '',
    type_en     VARCHAR(120) DEFAULT '', type_ar VARCHAR(120) DEFAULT '',
    sector_en   VARCHAR(120) DEFAULT '', sector_ar VARCHAR(120) DEFAULT '',
    desc_en     TEXT DEFAULT '', desc_ar TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ns_partners (
    id      SERIAL PRIMARY KEY,
    name_en VARCHAR(255) DEFAULT '', name_ar VARCHAR(255) DEFAULT '',
    role_en VARCHAR(255) DEFAULT '', role_ar VARCHAR(255) DEFAULT '',
    logo    VARCHAR(500) DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ns_milestones (
    id        SERIAL PRIMARY KEY,
    event_en  VARCHAR(255) DEFAULT '', event_ar VARCHAR(255) DEFAULT '',
    detail_en TEXT DEFAULT '', detail_ar TEXT DEFAULT '',
    date      VARCHAR(60) DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ns_sustainability_impact (
    id       SERIAL PRIMARY KEY,
    value_en VARCHAR(120) DEFAULT '', value_ar VARCHAR(120) DEFAULT '',
    label_en VARCHAR(255) DEFAULT '', label_ar VARCHAR(255) DEFAULT '',
    icon     VARCHAR(60) DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ns_enrolment_steps (
    id       SERIAL PRIMARY KEY,
    step     INTEGER NOT NULL DEFAULT 1,
    title_en VARCHAR(255) DEFAULT '', title_ar VARCHAR(255) DEFAULT '',
    desc_en  TEXT DEFAULT '', desc_ar TEXT DEFAULT ''
);

-- 6) training_center_profiles — with the CORRECT user_id type ----------------
CREATE TABLE IF NOT EXISTS training_center_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         CHAR(15) REFERENCES users(id) UNIQUE,
    center_name     VARCHAR(255) NOT NULL DEFAULT '',
    accreditations  JSONB NOT NULL DEFAULT '[]',
    specializations JSONB NOT NULL DEFAULT '[]',
    facilities      TEXT DEFAULT '',
    website         VARCHAR(500) DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7) mentor skill verifications ----------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_skill_verifications (
    id             SERIAL PRIMARY KEY,
    candidate_id   CHAR(15) NOT NULL REFERENCES users(id),
    mentor_id      CHAR(15) REFERENCES users(id),
    skill_name     VARCHAR(255) NOT NULL,
    skill_level    VARCHAR(80) DEFAULT '',
    skill_category VARCHAR(120) DEFAULT '',
    status         VARCHAR(30) NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
    requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_msv_status ON mentor_skill_verifications (status);

COMMIT;

-- VERIFICATION (run after):
--   SELECT COUNT(*) FROM communities;                      -- expect 5 (seed) or prior count
--   SELECT title, title_ar FROM community_events LIMIT 4;  -- expect non-NULL (backfilled)
--   SELECT COUNT(*) FROM startup_programs;                 -- expect 0
--   SELECT COUNT(*) FROM ns_programs;                      -- expect 0
--   SELECT data_type FROM information_schema.columns
--     WHERE table_name='training_center_profiles' AND column_name='user_id';
--                                                          -- expect character (15)
--   SELECT COUNT(*) FROM mentor_skill_verifications;       -- expect 0
