-- G26: Demand Signals table for Growth→NAFIS integration
-- Tracks companies with published jobs and their hiring demand

CREATE TABLE IF NOT EXISTS demand_signals (
    id SERIAL PRIMARY KEY,
    company_id TEXT NOT NULL UNIQUE,
    company_name TEXT,
    job_count INTEGER DEFAULT 1,
    sector TEXT,
    emirate TEXT,
    matching_candidates INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_signals_company ON demand_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_demand_signals_sector ON demand_signals(sector);
CREATE INDEX IF NOT EXISTS idx_demand_signals_emirate ON demand_signals(emirate);
