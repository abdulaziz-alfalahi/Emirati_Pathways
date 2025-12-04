CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS hr_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Seed a company and HR profile for your current user (id from your JWT: 14)
INSERT INTO companies (name) VALUES ('Demo Company') ON CONFLICT DO NOTHING;

INSERT INTO hr_profiles (user_id, company_id)
SELECT 14, (SELECT id FROM companies ORDER BY id, id LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM hr_profiles WHERE user_id = 14);
