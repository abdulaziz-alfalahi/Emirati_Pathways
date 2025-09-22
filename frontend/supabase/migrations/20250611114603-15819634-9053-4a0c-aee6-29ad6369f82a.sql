
-- Create youth_development_programs table
CREATE TABLE youth_development_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name TEXT NOT NULL,
  organizer TEXT NOT NULL,
  focus_area TEXT NOT NULL, -- e.g., 'Leadership', 'Skills', 'Innovation', 'Community'
  age_group TEXT, -- e.g., '12-15', '16-18'
  description TEXT,
  start_date DATE,
  end_date DATE,
  program_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE youth_development_programs ENABLE ROW LEVEL SECURITY;

-- Policy for all users to view active programs (public access for youth programs)
CREATE POLICY "Youth development programs are viewable by everyone." ON youth_development_programs
  FOR SELECT USING (is_active = TRUE);

-- Insert mockup data
INSERT INTO youth_development_programs (program_name, organizer, focus_area, age_group, description, start_date, end_date, program_url)
VALUES
  (
    'Young Leaders Academy',
    'Youth Empowerment Foundation',
    'Leadership',
    '16-18',
    'A program designed to cultivate leadership skills and civic responsibility among young Emiratis.',
    '2025-07-01',
    '2025-07-30',
    'https://example.com/young-leaders'
  ),
  (
    'Digital Innovators Workshop',
    'Ministry of Youth',
    'Innovation',
    '12-15',
    'Hands-on workshops introducing coding, AI, and digital design to young minds.',
    '2025-08-05',
    '2025-08-15',
    'https://example.com/digital-innovators'
  ),
  (
    'Community Service Challenge',
    'Emirati Volunteering Association',
    'Community',
    '14-17',
    'Engaging youth in local community projects to foster social responsibility.',
    '2025-09-01',
    '2025-12-31',
    'https://example.com/community-challenge'
  ),
  (
    'Tech Entrepreneurship Bootcamp',
    'UAE Innovation Hub',
    'Innovation',
    '16-20',
    'Intensive program for young entrepreneurs to develop tech startups and business skills.',
    '2025-06-15',
    '2025-08-30',
    'https://example.com/tech-bootcamp'
  ),
  (
    'Cultural Heritage Program',
    'Emirates Heritage Foundation',
    'Cultural',
    '13-17',
    'Explore and preserve Emirati culture through traditional arts, crafts, and storytelling.',
    '2025-07-10',
    '2025-09-10',
    'https://example.com/heritage-program'
  ),
  (
    'Environmental Champions Initiative',
    'Green UAE Organization',
    'Community',
    '15-19',
    'Youth-led environmental projects focusing on sustainability and climate action.',
    '2025-08-01',
    '2025-11-30',
    'https://example.com/eco-champions'
  );
