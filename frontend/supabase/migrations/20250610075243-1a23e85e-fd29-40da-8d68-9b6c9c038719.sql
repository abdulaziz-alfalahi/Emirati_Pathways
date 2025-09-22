
-- Create advisory_positions table
CREATE TABLE public.advisory_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  commitment_hours_per_month INTEGER,
  compensation_type TEXT CHECK (compensation_type IN ('paid', 'unpaid', 'stipend')),
  application_deadline TIMESTAMP WITH TIME ZONE,
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  skills_required TEXT[],
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  contact_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users
);

-- Enable RLS on advisory_positions
ALTER TABLE public.advisory_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow everyone to view active positions
CREATE POLICY "Anyone can view active advisory positions" 
  ON public.advisory_positions 
  FOR SELECT 
  USING (status = 'active');

-- RLS Policy: Allow authenticated users to create positions (for organizations)
CREATE POLICY "Authenticated users can create advisory positions" 
  ON public.advisory_positions 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Allow creators to update their positions
CREATE POLICY "Users can update their own advisory positions" 
  ON public.advisory_positions 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Create advisory_applications table
CREATE TABLE public.advisory_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.advisory_positions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users,
  cover_letter TEXT,
  resume_url TEXT,
  additional_documents TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on advisory_applications
ALTER TABLE public.advisory_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own applications
CREATE POLICY "Users can view their own advisory applications" 
  ON public.advisory_applications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own applications
CREATE POLICY "Users can create their own advisory applications" 
  ON public.advisory_applications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own applications
CREATE POLICY "Users can update their own advisory applications" 
  ON public.advisory_applications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Insert mockup data for advisory_positions
INSERT INTO public.advisory_positions (
  title, organization, description, requirements, commitment_hours_per_month, 
  compensation_type, application_deadline, location, remote_allowed, 
  skills_required, experience_level, contact_email, status
) VALUES 
(
  'Board Advisor - Technology Strategy',
  'Dubai Innovation Hub',
  'Seeking an experienced technology leader to provide strategic guidance on digital transformation initiatives and emerging technology adoption.',
  'Minimum 10 years of experience in technology leadership, proven track record in digital transformation, and strong understanding of emerging technologies.',
  8,
  'stipend',
  '2025-07-15 23:59:59+00',
  'Dubai, UAE',
  true,
  ARRAY['Technology Strategy', 'Digital Transformation', 'Innovation Management'],
  'executive',
  'advisory@dubaiinnovation.ae',
  'active'
),
(
  'Financial Advisory Committee Member',
  'UAE Startup Accelerator',
  'Join our financial advisory committee to guide startup funding decisions and provide mentorship to early-stage companies.',
  'CPA or equivalent qualification, experience in venture capital or startup funding, strong analytical skills.',
  12,
  'unpaid',
  '2025-08-01 23:59:59+00',
  'Abu Dhabi, UAE',
  false,
  ARRAY['Financial Analysis', 'Venture Capital', 'Startup Mentoring'],
  'senior',
  'committee@uaestartups.com',
  'active'
),
(
  'Healthcare Innovation Advisor',
  'Dubai Health Authority',
  'Provide expert guidance on healthcare innovation projects and digital health initiatives.',
  'Medical degree or healthcare management background, experience with healthcare technology, knowledge of UAE healthcare regulations.',
  6,
  'paid',
  '2025-06-30 23:59:59+00',
  'Dubai, UAE',
  true,
  ARRAY['Healthcare Innovation', 'Digital Health', 'Regulatory Compliance'],
  'senior',
  'innovation@dha.gov.ae',
  'active'
),
(
  'Sustainability Advisory Board',
  'Emirates Green Council',
  'Shape sustainability policies and initiatives across various sectors in the UAE.',
  'Background in environmental science, sustainability, or related field. Experience in policy development preferred.',
  10,
  'stipend',
  '2025-09-15 23:59:59+00',
  'Dubai, UAE',
  true,
  ARRAY['Sustainability', 'Policy Development', 'Environmental Science'],
  'mid',
  'board@emiratesgreen.ae',
  'active'
),
(
  'Education Technology Advisor',
  'UAE Ministry of Education',
  'Advise on educational technology integration and digital learning strategies for UAE schools and universities.',
  'Advanced degree in education or technology, experience in EdTech implementation, understanding of UAE education system.',
  15,
  'paid',
  '2025-07-30 23:59:59+00',
  'Abu Dhabi, UAE',
  false,
  ARRAY['Educational Technology', 'Digital Learning', 'Curriculum Development'],
  'senior',
  'advisory@moe.gov.ae',
  'active'
);

-- Insert mockup data for advisory_applications (these would be created by actual users)
-- Note: These are examples and would reference actual user IDs in a real system
-- For now, we'll leave this table empty as applications are created by users
