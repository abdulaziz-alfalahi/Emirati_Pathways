-- Migration: Add lead_source column to companies table
-- Tracks where a company lead originated from: nafis_import, manual, magic_link

ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'manual';

-- Tag any existing NAFIS-imported companies (description = 'Imported from Nafis')
UPDATE companies SET lead_source = 'nafis_import'
WHERE description = 'Imported from Nafis' AND lead_source = 'manual';

-- Tag any existing magic-link-created companies
UPDATE companies SET lead_source = 'magic_link'
WHERE description = 'Invited via Growth Operator' AND lead_source = 'manual';
