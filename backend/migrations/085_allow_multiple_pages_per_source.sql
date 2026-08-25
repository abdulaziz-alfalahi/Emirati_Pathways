-- 085_allow_multiple_pages_per_source.sql
--
-- WHY
--
-- The allow-list keyed identity on DOMAIN, so adding a second page from a site
-- already listed silently REPLACED the first one's start URL instead of adding
-- it. Adding khda.gov.ae/en/hbmsp after khda.gov.ae/ would have moved the
-- existing row rather than created a new one, and the operator would have had
-- no way to tell from the screen — the list would still show one KHDA entry,
-- now pointing somewhere else.
--
-- That is the wrong identity. A domain is the ALLOW-LIST decision — "we trust
-- KHDA" — and a URL is the WORK — "read this page every morning". One trusted
-- domain routinely has several pages worth reading: KHDA runs the Hamdan bin
-- Mohammed programme on its own page while the homepage carries none, and
-- pointing the scout at a homepage yields nothing, as it did on 2026-08-25.
--
-- So start_url becomes the unique identity and domain becomes a plain indexed
-- attribute, which is what it always was in meaning.
--
-- PRECONDITION, verified live 2026-08-25: scholarship_sources holds 2 rows,
-- www.khda.gov.ae and www.mohesr.gov.ae, with distinct start_urls — so making
-- start_url unique cannot fail on existing data.
--
-- Idempotent and additive in effect: no row is altered, only the constraint.

BEGIN;

-- Safety: refuse to proceed if duplicates would make the new index impossible.
-- Better a loud failure here than a half-applied migration on a live table.
DO $$
DECLARE dupes INTEGER;
BEGIN
    SELECT COUNT(*) INTO dupes FROM (
        SELECT start_url FROM scholarship_sources
         GROUP BY start_url HAVING COUNT(*) > 1
    ) d;
    IF dupes > 0 THEN
        RAISE EXCEPTION 'start_url is not unique in % case(s); resolve before migrating', dupes;
    END IF;
END $$;

ALTER TABLE scholarship_sources DROP CONSTRAINT IF EXISTS scholarship_sources_domain_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_scholarship_sources_start_url
    ON scholarship_sources (start_url);

-- Still worth an index: the scout and the UI both group by domain, and a future
-- allow-list check ("is this host trusted at all?") reads it.
CREATE INDEX IF NOT EXISTS idx_scholarship_sources_domain
    ON scholarship_sources (domain);

COMMENT ON COLUMN scholarship_sources.domain IS
    'The allow-list decision — which host we trust. NOT unique: one trusted '
    'domain can have several pages worth reading, and a homepage often carries '
    'no programme at all while a deep page does.';

COMMENT ON COLUMN scholarship_sources.start_url IS
    'The page the scout reads. Unique — this is the identity of a source, '
    'because the work is per page, not per site.';

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. The domain constraint is gone and start_url is unique. Expect
--    idx_scholarship_sources_start_url (UNIQUE) and no ..._domain_key.
--
--    SELECT indexname, indexdef FROM pg_indexes
--     WHERE tablename = 'scholarship_sources';
--
-- 2. Two pages from ONE domain can coexist. Expect both to insert, then
--    ROLLBACK.
--
--    BEGIN;
--      INSERT INTO scholarship_sources (domain, start_url)
--           VALUES ('www.khda.gov.ae', 'https://www.khda.gov.ae/zz-a');
--      INSERT INTO scholarship_sources (domain, start_url)
--           VALUES ('www.khda.gov.ae', 'https://www.khda.gov.ae/zz-b');
--    ROLLBACK;
--
-- 3. The SAME page twice is still refused. Expect the second to error.
--
--    BEGIN;
--      INSERT INTO scholarship_sources (domain, start_url)
--           VALUES ('x.ae', 'https://x.ae/p');
--      INSERT INTO scholarship_sources (domain, start_url)
--           VALUES ('x.ae', 'https://x.ae/p');   -- must fail
--    ROLLBACK;
