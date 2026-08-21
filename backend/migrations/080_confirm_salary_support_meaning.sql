-- 080: record what the salary_support flag actually means
--
-- WHY: migration 077 stored the flag with an explicit warning not to publish
-- anything derived from it until the source confirmed its meaning — "currently
-- receiving" and "ever received / eligible" would support very different
-- statements, and 87.5% of the file is flagged Yes.
--
-- CONFIRMED BY THE OWNER, 2026-08-21: the flag means the person is CURRENTLY
-- RECEIVING NAFIS salary support.
--
-- That makes the figure publishable, and it is a substantial one: 29,175 of
-- 33,352 employed Emiratis in Dubai's private sector are on NAFIS support.
--
-- This migration changes no data. It replaces a caveat that is now answered,
-- because a stale warning is worse than none — the next reader would either
-- re-open a settled question or, having seen the warning ignored elsewhere,
-- learn to ignore warnings.

BEGIN;

COMMENT ON COLUMN private_sector_employment.salary_support IS
    'TRUE when the person is CURRENTLY RECEIVING NAFIS salary support '
    '(confirmed by the platform owner, 2026-08-21). Not "ever received" and not '
    'eligibility. 29,175 of 33,352 in the first file. Safe to publish, with the '
    'population stated: this file is Emiratis employed in Dubai''s PRIVATE '
    'sector, so it says nothing about government employment or about people not '
    'currently working.';

DO $$
BEGIN
    RAISE NOTICE 'salary_support meaning recorded: currently receiving NAFIS support';
END $$;

COMMIT;

-- Verification:
--   SELECT col_description('private_sector_employment'::regclass,
--          (SELECT attnum FROM pg_attribute
--            WHERE attrelid = 'private_sector_employment'::regclass
--              AND attname = 'salary_support'));
