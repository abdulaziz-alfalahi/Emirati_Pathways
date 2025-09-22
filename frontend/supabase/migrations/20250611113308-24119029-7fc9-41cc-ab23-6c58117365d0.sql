
-- Create graduate_programs table
CREATE TABLE graduate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  degree_level TEXT NOT NULL, -- e.g., 'Master', 'PhD', 'Postgraduate Diploma'
  field_of_study TEXT NOT NULL,
  description TEXT,
  duration_years INTEGER,
  application_deadline DATE,
  program_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE graduate_programs ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view programs
CREATE POLICY "Graduate programs are viewable by authenticated users." ON graduate_programs
  FOR SELECT USING (is_active = TRUE);

-- Insert mockup data
INSERT INTO graduate_programs (university_name, program_name, degree_level, field_of_study, description, duration_years, application_deadline, program_url)
VALUES
  (
    'United Arab Emirates University',
    'Master of Science in Mechanical Engineering',
    'Master',
    'Mechanical Engineering',
    'An advanced program focusing on research and development in mechanical systems.',
    2,
    '2025-08-20',
    'https://www.uaeu.ac.ae/en/programs/me-ms'
  ),
  (
    'Khalifa University',
    'PhD in Electrical Engineering and Computer Science',
    'PhD',
    'Electrical Engineering',
    'Doctoral research opportunities in cutting-edge areas of electrical and computer science.',
    4,
    '2025-07-25',
    'https://www.ku.ac.ae/eecs-phd'
  ),
  (
    'Sorbonne University Abu Dhabi',
    'Master in Urban Planning and Development',
    'Master',
    'Urban Planning',
    'A program exploring sustainable urban development and smart city concepts.',
    2,
    '2025-09-05',
    'https://www.sorbonne.ae/urban-planning'
  ),
  (
    'American University of Sharjah',
    'Master of Business Administration (MBA)',
    'Master',
    'Business Administration',
    'A comprehensive MBA program with focus on regional business practices.',
    2,
    '2025-06-30',
    'https://www.aus.edu/mba'
  ),
  (
    'University of Dubai',
    'Master of Science in Data Science',
    'Master',
    'Data Science',
    'Advanced analytics and machine learning for business applications.',
    2,
    '2025-08-01',
    'https://www.ud.ac.ae/data-science'
  ),
  (
    'Zayed University',
    'PhD in Education Leadership',
    'PhD',
    'Education',
    'Research-focused doctorate in educational leadership and policy.',
    4,
    '2025-07-15',
    'https://www.zu.ac.ae/education-phd'
  );
