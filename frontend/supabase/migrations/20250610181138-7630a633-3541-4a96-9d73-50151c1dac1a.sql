
-- Create the retiree_resources table
CREATE TABLE public.retiree_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'post_career_consulting', 'post_career_volunteering', 'post_career_entrepreneurship', 'post_career_mentoring',
    'retirement_pension', 'retirement_financial_planning', 'retirement_healthcare', 'retirement_benefits'
  )),
  resource_url TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_read_time INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.retiree_resources ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view resources
CREATE POLICY "Retiree resources are viewable by authenticated users" ON public.retiree_resources
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for admins to manage resources
CREATE POLICY "Admins can manage retiree resources" ON public.retiree_resources
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert mockup data for both categories
INSERT INTO public.retiree_resources (title, category, description, resource_url, tags, is_featured, difficulty_level, estimated_read_time)
VALUES
  -- Post-Career Options
  (
    'Consulting Opportunities for Experienced Professionals',
    'post_career_consulting',
    'Discover how to leverage your decades of experience into flexible consulting roles that provide value to organizations while maintaining work-life balance.',
    'https://www.mckinsey.com/careers/career-advice/consulting-after-retirement',
    ARRAY['consulting', 'post-career', 'expertise', 'flexible-work'],
    TRUE,
    'intermediate',
    8
  ),
  (
    'Board Advisory Positions for Senior Executives',
    'post_career_consulting',
    'Learn about opportunities to serve on corporate boards and advisory committees, sharing your strategic expertise.',
    'https://www.boardprospects.com/senior-executive-board-positions',
    ARRAY['board-positions', 'advisory', 'corporate-governance'],
    TRUE,
    'advanced',
    12
  ),
  (
    'Volunteer Programs for Seniors in UAE',
    'post_career_volunteering',
    'Find meaningful volunteer opportunities that align with your passions and give back to the UAE community.',
    'https://www.volunteer.ae/senior-programs',
    ARRAY['volunteering', 'community', 'seniors', 'social-impact'],
    FALSE,
    'beginner',
    6
  ),
  (
    'Starting Your Own Business After Retirement',
    'post_career_entrepreneurship',
    'Explore how to turn your passion projects into profitable ventures with reduced risk and flexible timelines.',
    'https://www.entrepreneur.com/retirement-business-ideas',
    ARRAY['entrepreneurship', 'business', 'startup', 'passion-projects'],
    FALSE,
    'intermediate',
    10
  ),
  (
    'Mentoring the Next Generation of Leaders',
    'post_career_mentoring',
    'Share your knowledge and experience by becoming a mentor to young professionals and entrepreneurs.',
    'https://www.mentorship.ae/senior-mentors',
    ARRAY['mentoring', 'leadership', 'knowledge-transfer', 'youth-development'],
    TRUE,
    'beginner',
    7
  ),
  
  -- Retirement Benefits
  (
    'Understanding UAE Pension Schemes',
    'retirement_pension',
    'A comprehensive guide to the various pension and gratuity schemes available for UAE nationals and long-term residents.',
    'https://www.uae.gov.ae/en/information-and-services/social-affairs/pension-schemes',
    ARRAY['pension', 'retirement', 'financial-planning', 'government-benefits'],
    TRUE,
    'intermediate',
    15
  ),
  (
    'End of Service Benefits Calculator',
    'retirement_benefits',
    'Calculate your end of service benefits and understand your entitlements under UAE labor law.',
    'https://www.uae.gov.ae/calculators/end-of-service-benefits',
    ARRAY['end-of-service', 'benefits', 'calculator', 'labor-law'],
    TRUE,
    'beginner',
    5
  ),
  (
    'Healthcare Options for Retirees',
    'retirement_healthcare',
    'Explore healthcare plans, insurance options, and medical services available to retirees in the UAE.',
    'https://www.dha.gov.ae/retiree-healthcare',
    ARRAY['healthcare', 'insurance', 'medical-services', 'wellness'],
    FALSE,
    'intermediate',
    12
  ),
  (
    'Retirement Financial Planning Guide',
    'retirement_financial_planning',
    'Learn how to manage your finances, investments, and savings to ensure a comfortable retirement lifestyle.',
    'https://www.centralbank.ae/retirement-planning',
    ARRAY['financial-planning', 'investments', 'savings', 'budgeting'],
    TRUE,
    'intermediate',
    20
  ),
  (
    'Social Security Benefits for UAE Nationals',
    'retirement_benefits',
    'Understanding social security benefits, disability support, and other government assistance programs.',
    'https://www.mohre.gov.ae/social-security-benefits',
    ARRAY['social-security', 'disability-support', 'government-assistance'],
    FALSE,
    'beginner',
    8
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_retiree_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_retiree_resources_updated_at
    BEFORE UPDATE ON public.retiree_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_retiree_resources_updated_at();
