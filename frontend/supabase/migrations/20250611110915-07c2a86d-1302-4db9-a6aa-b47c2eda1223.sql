
-- Create university_programs table
CREATE TABLE university_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  degree_level TEXT NOT NULL, -- e.g., 'Bachelor', 'Master', 'PhD'
  field_of_study TEXT NOT NULL,
  description TEXT,
  duration_years INTEGER,
  application_deadline DATE,
  program_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE university_programs ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view programs
CREATE POLICY "University programs are viewable by authenticated users." ON university_programs
  FOR SELECT USING (is_active = TRUE);

-- Insert mockup data
INSERT INTO university_programs (university_name, program_name, degree_level, field_of_study, description, duration_years, application_deadline, program_url)
VALUES
  (
    'United Arab Emirates University',
    'Bachelor of Science in Computer Science',
    'Bachelor',
    'Computer Science',
    'A comprehensive program covering algorithms, data structures, and software engineering principles.',
    4,
    '2025-08-15',
    'https://www.uaeu.ac.ae/en/programs/cs'
  ),
  (
    'Khalifa University',
    'Master of Science in Artificial Intelligence',
    'Master',
    'Artificial Intelligence',
    'Advanced studies in machine learning, deep learning, and AI applications.',
    2,
    '2025-07-30',
    'https://www.ku.ac.ae/ai-ms'
  ),
  (
    'American University of Sharjah',
    'Bachelor of Architecture',
    'Bachelor',
    'Architecture',
    'A five-year professional program focusing on design, history, and theory of architecture.',
    5,
    '2025-09-01',
    'https://www.aus.edu/architecture'
  ),
  (
    'University of Dubai',
    'Master of Business Administration',
    'Master',
    'Business Administration',
    'A comprehensive MBA program designed for working professionals.',
    2,
    '2025-06-30',
    'https://www.ud.ac.ae/mba'
  ),
  (
    'Zayed University',
    'Bachelor of Science in Environmental Science',
    'Bachelor',
    'Environmental Science',
    'Study environmental issues and sustainable development practices.',
    4,
    '2025-08-01',
    'https://www.zu.ac.ae/environmental-science'
  ),
  (
    'Higher Colleges of Technology',
    'Bachelor of Applied Science in Engineering Technology',
    'Bachelor',
    'Engineering Technology',
    'Hands-on engineering program with industry partnerships.',
    4,
    '2025-07-15',
    'https://www.hct.ac.ae/engineering'
  );
