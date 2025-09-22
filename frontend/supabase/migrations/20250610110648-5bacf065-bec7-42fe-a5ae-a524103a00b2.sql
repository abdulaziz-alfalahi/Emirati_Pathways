
-- Create community_leadership_resources table
CREATE TABLE public.community_leadership_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('training', 'workshop', 'opportunity', 'story')),
  provider TEXT,
  start_date DATE,
  end_date DATE,
  application_deadline DATE,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  url TEXT,
  requirements TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  duration_hours INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_leadership_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active community leadership resources" 
  ON public.community_leadership_resources 
  FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Authenticated users can create community leadership resources" 
  ON public.community_leadership_resources 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update community leadership resources" 
  ON public.community_leadership_resources 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_community_leadership_resources_updated_at
  BEFORE UPDATE ON public.community_leadership_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mockup data
INSERT INTO public.community_leadership_resources (title, description, type, provider, start_date, end_date, application_deadline, location, is_virtual, url, requirements, tags, duration_hours, difficulty_level, is_featured) VALUES
('Community Leadership Foundations', 'A comprehensive 3-day workshop covering the fundamentals of community leadership, including communication, team building, and project management skills.', 'training', 'UAE Leadership Institute', '2024-07-15', '2024-07-17', '2024-07-01', 'Dubai, UAE', false, 'https://leadership.ae/foundations', 'No prior experience required, open to all UAE residents', ARRAY['leadership', 'communication', 'team building'], 24, 'beginner', true),

('Advanced Strategic Planning Workshop', 'An intensive workshop for experienced leaders focusing on strategic planning, vision development, and long-term community impact.', 'workshop', 'Strategic Leaders Network', '2024-08-20', '2024-08-22', '2024-08-05', 'Abu Dhabi, UAE', false, 'https://strategic.ae/planning', 'Minimum 2 years of leadership experience', ARRAY['strategy', 'planning', 'vision'], 20, 'advanced', true),

('Virtual Leadership Mentorship Program', 'A 6-month online mentorship program pairing emerging leaders with experienced community leaders across the UAE.', 'training', 'Community Connect UAE', '2024-09-01', '2025-03-01', '2024-08-15', 'Online', true, 'https://connect.ae/mentorship', 'Commitment to attend monthly virtual sessions', ARRAY['mentorship', 'networking', 'virtual'], 48, 'intermediate', false),

('Neighborhood Council Leadership Role', 'Opportunity to lead a local neighborhood council, working on community improvement projects and representing resident interests.', 'opportunity', 'Dubai Municipality', NULL, NULL, '2024-07-30', 'Various Dubai neighborhoods', false, 'https://dubai.ae/council-apply', 'Dubai resident, strong communication skills, community involvement', ARRAY['governance', 'community service', 'advocacy'], NULL, 'intermediate', true),

('Youth Program Coordinator Position', 'Lead youth development programs in community centers, organizing activities, workshops, and mentorship opportunities for young people.', 'opportunity', 'UAE Youth Development Foundation', NULL, NULL, '2024-08-10', 'Sharjah, UAE', false, 'https://youth.ae/coordinator', 'Experience working with youth, program management skills', ARRAY['youth development', 'program management', 'education'], NULL, 'intermediate', false),

('Environmental Initiative Leader', 'Spearhead community environmental projects including recycling programs, green spaces development, and sustainability education.', 'opportunity', 'Green Communities UAE', NULL, NULL, '2024-09-01', 'Abu Dhabi, UAE', false, 'https://green.ae/leader', 'Passion for environmental issues, project management experience', ARRAY['environment', 'sustainability', 'community projects'], NULL, 'beginner', true),

('Digital Literacy Program Director', 'Oversee digital literacy training programs for elderly and underserved community members, managing volunteers and curriculum.', 'opportunity', 'Digital Inclusion Initiative', NULL, NULL, '2024-08-20', 'Multiple UAE locations', true, 'https://digital.ae/director', 'Technology background, training experience, cultural sensitivity', ARRAY['digital literacy', 'education', 'social impact'], NULL, 'advanced', false),

('Community Event Management Training', 'Learn to plan, organize, and execute successful community events including festivals, fundraisers, and awareness campaigns.', 'workshop', 'Event Leaders Academy', '2024-08-05', '2024-08-07', '2024-07-20', 'Ajman, UAE', false, 'https://events.ae/training', 'Interest in event planning, basic organizational skills', ARRAY['event management', 'fundraising', 'community engagement'], 18, 'beginner', false),

('Conflict Resolution and Mediation Workshop', 'Develop skills in resolving community disputes, facilitating difficult conversations, and building consensus among diverse groups.', 'workshop', 'Mediation Center UAE', '2024-09-10', '2024-09-12', '2024-08-25', 'Ras Al Khaimah, UAE', false, 'https://mediation.ae/workshop', 'Open to all, particularly beneficial for community leaders', ARRAY['conflict resolution', 'mediation', 'communication'], 16, 'intermediate', true),

('Financial Management for Community Organizations', 'Essential training on budgeting, fundraising, and financial oversight for leaders of community groups and non-profits.', 'training', 'Community Finance Institute', '2024-07-25', '2024-07-26', '2024-07-10', 'Dubai, UAE', true, 'https://finance.ae/community', 'Leadership role in community organization preferred', ARRAY['finance', 'budgeting', 'fundraising'], 12, 'intermediate', false);
