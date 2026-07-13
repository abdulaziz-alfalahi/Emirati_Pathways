-- Issue #12 — National Development Priority axis: config-governed weights.
-- Versioned, EHRDC-editable weights for the National Development Priority score.
-- The application also ensures/seeds this table idempotently at runtime
-- (national_priority_engine.ensure_weights_table); this migration is the
-- canonical, reviewable definition. Additive only — no existing data touched.

CREATE TABLE IF NOT EXISTS national_priority_weights (
    code       VARCHAR(64) PRIMARY KEY,
    label      VARCHAR(255) NOT NULL,
    points     INTEGER NOT NULL DEFAULT 0,
    category   VARCHAR(64) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    version    INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO national_priority_weights (code, label, points, category) VALUES
    ('emp_entry_stage',           'Entering the workforce (first job search / early career)', 40, 'employment_support'),
    ('emp_early_stage',           'Building profile / exploring career direction',            25, 'employment_support'),
    ('strategic_priority_skills', 'Skills in a national priority sector',                     35, 'strategic_skills'),
    ('dev_certification',         'Holds a professional certification',                       25, 'development'),
    ('dev_training_completion',   'Completed on-platform training',                           20, 'development')
ON CONFLICT (code) DO NOTHING;
