
-- Create legacy_projects table
CREATE TABLE public.legacy_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  focus_area TEXT CHECK (focus_area IN ('education', 'environment', 'healthcare', 'culture', 'technology', 'community', 'arts')),
  initiator_id UUID REFERENCES auth.users(id),
  funding_goal NUMERIC,
  current_funding NUMERIC DEFAULT 0,
  funding_currency TEXT DEFAULT 'AED',
  location TEXT,
  project_status TEXT DEFAULT 'proposal' CHECK (project_status IN ('proposal', 'active', 'completed', 'paused')),
  start_date DATE,
  expected_completion_date DATE,
  requirements TEXT,
  skills_needed TEXT[],
  impact_metrics TEXT,
  image_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_contributions table
CREATE TABLE public.project_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.legacy_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('financial', 'time', 'skills', 'resources')),
  amount NUMERIC,
  currency TEXT DEFAULT 'AED',
  hours_contributed INTEGER,
  skills_provided TEXT[],
  description TEXT,
  contribution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.legacy_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies for legacy_projects
CREATE POLICY "Anyone can view active legacy projects" 
  ON public.legacy_projects 
  FOR SELECT 
  USING (project_status IN ('proposal', 'active', 'completed'));

CREATE POLICY "Authenticated users can create legacy projects" 
  ON public.legacy_projects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update their own legacy projects" 
  ON public.legacy_projects 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = initiator_id);

-- RLS policies for project_contributions
CREATE POLICY "Users can view their own project contributions" 
  ON public.project_contributions 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Project initiators can view contributions to their projects"
  ON public.project_contributions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.legacy_projects 
      WHERE legacy_projects.id = project_contributions.project_id 
      AND legacy_projects.initiator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own project contributions" 
  ON public.project_contributions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project contributions" 
  ON public.project_contributions 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_legacy_projects_updated_at
  BEFORE UPDATE ON public.legacy_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_contributions_updated_at
  BEFORE UPDATE ON public.project_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mockup data for legacy_projects only (without initiator_id to avoid foreign key issues)
INSERT INTO public.legacy_projects (title, description, focus_area, funding_goal, current_funding, location, project_status, start_date, expected_completion_date, requirements, skills_needed, impact_metrics, contact_email, is_featured) VALUES
('Digital Heritage Archive', 'Preserving UAE cultural heritage through digitization of historical documents, photographs, and artifacts for future generations', 'culture', 500000, 125000, 'Dubai, UAE', 'active', '2024-01-15', '2025-12-31', 'Access to historical materials, scanning equipment, cultural expertise', ARRAY['digital archiving', 'cultural research', 'photography', 'database management'], 'Over 10,000 historical items digitized and made publicly accessible', 'heritage@legacy.ae', true),

('Sustainable Schools Initiative', 'Transforming 50 UAE schools into sustainable, eco-friendly learning environments with solar panels, water recycling, and green spaces', 'environment', 2000000, 450000, 'Nationwide, UAE', 'active', '2024-03-01', '2026-06-30', 'Partnership with Ministry of Education, technical expertise in renewable energy', ARRAY['renewable energy', 'project management', 'education', 'environmental science'], '50 schools converted, 40% reduction in energy consumption, educating 25,000 students', 'schools@greenfuture.ae', true),

('Elderly Care Technology Hub', 'Developing and deploying assistive technologies to improve quality of life for elderly residents in UAE care facilities', 'healthcare', 800000, 200000, 'Abu Dhabi, UAE', 'proposal', '2024-08-01', '2025-12-31', 'Healthcare partnerships, technology development, user testing', ARRAY['healthcare technology', 'software development', 'elderly care', 'user experience'], 'Improved care for 1,000+ elderly residents across 20 facilities', 'elderly@techcare.ae', false),

('Youth Innovation Labs', 'Establishing maker spaces and innovation labs in underserved communities to foster creativity and technical skills among young people', 'education', 1200000, 300000, 'Sharjah, UAE', 'active', '2024-02-01', '2025-08-31', 'Community partnerships, technical mentors, equipment procurement', ARRAY['education', 'technology', 'mentoring', 'community outreach'], '500 young people trained, 50 innovation projects completed, 10 startups launched', 'youth@innovate.ae', true),

('Marine Conservation Network', 'Protecting UAE marine ecosystems through coral restoration, marine life monitoring, and community education programs', 'environment', 1500000, 600000, 'Coastal UAE', 'active', '2024-01-01', '2026-12-31', 'Marine biology expertise, diving equipment, research vessels', ARRAY['marine biology', 'diving', 'data analysis', 'environmental education'], '100 hectares of coral reef restored, 500 species monitored, 5,000 people educated', 'marine@conservation.ae', true),

('Cultural Bridge Program', 'Connecting UAE communities through art, music, and cultural exchange programs that celebrate diversity and promote understanding', 'culture', 600000, 150000, 'Dubai & Abu Dhabi', 'proposal', '2024-09-01', '2025-12-31', 'Cultural organizations, artist networks, venue partnerships', ARRAY['cultural programming', 'event management', 'arts', 'community engagement'], '100 cultural events, 50 artist collaborations, 10,000 participants', 'culture@bridge.ae', false),

('Skills for Tomorrow', 'Providing digital literacy and vocational training to unemployed and underemployed adults to prepare them for the modern workforce', 'education', 900000, 225000, 'Nationwide, UAE', 'active', '2024-04-01', '2025-10-31', 'Training facilities, industry partnerships, curriculum development', ARRAY['adult education', 'vocational training', 'digital literacy', 'career counseling'], '2,000 adults trained, 70% job placement rate, 50 employer partnerships', 'skills@future.ae', false),

('Community Health Champions', 'Training community volunteers to provide basic health education and support in remote and underserved areas of the UAE', 'healthcare', 400000, 100000, 'Remote UAE communities', 'proposal', '2024-10-01', '2025-12-31', 'Healthcare professional supervision, training materials, transportation', ARRAY['healthcare', 'community outreach', 'training', 'public health'], '200 health champions trained, 5,000 people reached, improved health outcomes', 'health@champions.ae', false);
