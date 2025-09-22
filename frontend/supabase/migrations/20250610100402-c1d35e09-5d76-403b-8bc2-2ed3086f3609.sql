
-- Create volunteer_opportunities table
CREATE TABLE public.volunteer_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organization_name TEXT NOT NULL,
  organization_contact_email TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  time_commitment TEXT, -- e.g., "2 hours/week", "Full day"
  skills_required TEXT[],
  category TEXT CHECK (category IN ('education', 'environment', 'healthcare', 'community', 'sports', 'arts', 'technology')),
  max_volunteers INTEGER,
  current_volunteers INTEGER DEFAULT 0,
  is_remote BOOLEAN DEFAULT false,
  requirements TEXT,
  benefits TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create volunteer_applications table
CREATE TABLE public.volunteer_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.volunteer_opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'withdrawn')),
  application_message TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hours_completed INTEGER DEFAULT 0,
  volunteer_feedback TEXT,
  organization_feedback TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(opportunity_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for volunteer_opportunities
CREATE POLICY "Anyone can view active volunteer opportunities" 
  ON public.volunteer_opportunities 
  FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Authenticated users can create volunteer opportunities" 
  ON public.volunteer_opportunities 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own volunteer opportunities" 
  ON public.volunteer_opportunities 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- RLS policies for volunteer_applications
CREATE POLICY "Users can view their own volunteer applications" 
  ON public.volunteer_applications 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own volunteer applications" 
  ON public.volunteer_applications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own volunteer applications" 
  ON public.volunteer_applications 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_volunteer_opportunities_updated_at
  BEFORE UPDATE ON public.volunteer_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_applications_updated_at
  BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mockup data for volunteer_opportunities only
INSERT INTO public.volunteer_opportunities (title, description, organization_name, organization_contact_email, location, start_date, end_date, time_commitment, skills_required, category, max_volunteers, current_volunteers, is_remote, requirements, benefits) VALUES
('Beach Cleanup Initiative', 'Join us in cleaning Dubai beaches and protecting marine life', 'Emirates Environmental Group', 'volunteer@eeg.ae', 'Jumeirah Beach, Dubai', '2024-07-15', '2024-07-15', '4 hours', ARRAY['environmental awareness'], 'environment', 50, 12, false, 'Must be physically able to walk on sand and lift light objects', 'Certificate of participation, refreshments'),
('Digital Literacy for Seniors', 'Teach basic computer and smartphone skills to elderly residents', 'Dubai Digital Society', 'info@dubaids.org', 'Community Center, Al Barsha', '2024-08-01', '2024-08-31', '2 hours/week', ARRAY['computer skills', 'patience', 'communication'], 'education', 20, 8, false, 'Basic computer knowledge required', 'Training provided, volunteer certificate'),
('Special Needs Sports Coaching', 'Support sports activities for children with special needs', 'UAE Special Olympics', 'coaching@uaeso.org', 'Sports Complex, Sharjah', '2024-07-20', '2024-09-20', '3 hours/week', ARRAY['sports coaching', 'patience'], 'sports', 15, 5, false, 'First aid certification preferred', 'Training provided, sports equipment'),
('Community Garden Project', 'Help maintain and develop community gardens in residential areas', 'Green UAE Initiative', 'gardens@greenuae.org', 'Various locations, Dubai', '2024-07-01', '2024-12-31', 'Flexible', ARRAY['gardening', 'physical work'], 'environment', 30, 18, false, 'Interest in gardening and environment', 'Fresh produce, gardening tools'),
('Virtual English Tutoring', 'Provide online English language support to immigrant families', 'UAE Integration Center', 'tutoring@integration.ae', 'Remote', '2024-08-15', '2024-11-15', '1-2 hours/week', ARRAY['English fluency', 'teaching'], 'education', 25, 10, true, 'Fluent English speaker, reliable internet', 'Teaching materials provided, flexible schedule'),
('Art Therapy for Hospital Patients', 'Conduct art activities for patients in local hospitals', 'Healing Arts Foundation', 'art@healing.ae', 'Dubai Hospital', '2024-07-10', '2024-12-10', '2 hours/week', ARRAY['art skills', 'empathy'], 'healthcare', 12, 4, false, 'Background check required, art experience preferred', 'Art supplies, training workshops'),
('Tech Mentorship Program', 'Mentor young people in programming and technology skills', 'Future Coders UAE', 'mentors@futurecoders.ae', 'Innovation Hub, Abu Dhabi', '2024-09-01', '2024-11-30', '3 hours/week', ARRAY['programming', 'mentoring'], 'technology', 20, 7, false, 'Programming experience in any language', 'Professional development, networking opportunities'),
('Community Kitchen Support', 'Help prepare and distribute meals for families in need', 'Food Bank Emirates', 'kitchen@foodbank.ae', 'Central Kitchen, Dubai', '2024-07-05', '2024-07-05', '5 hours', ARRAY['food handling', 'teamwork'], 'community', 40, 25, false, 'Food safety certification provided', 'Meals provided, transportation allowance');
