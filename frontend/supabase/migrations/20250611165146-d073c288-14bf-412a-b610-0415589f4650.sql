
-- Create professional_certifications table
CREATE TABLE professional_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_name TEXT NOT NULL,
  issuing_body TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  cost DECIMAL(10, 2),
  certification_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE professional_certifications ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view certifications
CREATE POLICY "Professional certifications are viewable by authenticated users." ON professional_certifications
  FOR SELECT USING (is_active = TRUE AND auth.role() = 'authenticated');

-- Insert mockup data
INSERT INTO professional_certifications (certification_name, issuing_body, industry, description, duration_weeks, cost, certification_url)
VALUES
  (
    'Project Management Professional (PMP)',
    'Project Management Institute (PMI)',
    'Project Management',
    'Globally recognized certification for project managers.',
    12,
    555.00,
    'https://www.pmi.org/certifications/project-management-pmp'
  ),
  (
    'Certified Public Accountant (CPA)',
    'AICPA',
    'Finance',
    'A license for qualified accountants in the United States.',
    24,
    1500.00,
    'https://www.aicpa.org/career/licensure/requirements.html'
  ),
  (
    'AWS Certified Solutions Architect - Associate',
    'Amazon Web Services',
    'IT',
    'Validates knowledge of AWS services and architecture.',
    8,
    150.00,
    'https://aws.amazon.com/certification/certified-solutions-architect-associate/'
  ),
  (
    'Certified Information Systems Security Professional (CISSP)',
    'ISC2',
    'IT',
    'Advanced-level certification for cybersecurity professionals.',
    16,
    749.00,
    'https://www.isc2.org/Certifications/CISSP'
  ),
  (
    'Chartered Financial Analyst (CFA)',
    'CFA Institute',
    'Finance',
    'Investment management and financial analysis certification.',
    52,
    1450.00,
    'https://www.cfainstitute.org/en/programs/cfa'
  ),
  (
    'Certified ScrumMaster (CSM)',
    'Scrum Alliance',
    'Project Management',
    'Foundational certification for Scrum methodology.',
    2,
    1395.00,
    'https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster'
  ),
  (
    'Google Cloud Professional Cloud Architect',
    'Google Cloud',
    'IT',
    'Designs and manages Google Cloud solutions.',
    12,
    200.00,
    'https://cloud.google.com/certification/cloud-architect'
  ),
  (
    'Certified Management Accountant (CMA)',
    'Institute of Management Accountants',
    'Finance',
    'Management accounting and financial management certification.',
    20,
    415.00,
    'https://www.imanet.org/cma-certification'
  );
