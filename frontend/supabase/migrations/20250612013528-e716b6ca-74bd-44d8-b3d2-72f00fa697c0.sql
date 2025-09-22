
-- Create success_stories table
CREATE TABLE success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story_content TEXT NOT NULL,
  category TEXT, -- e.g., 'Career Advancement', 'Education', 'Personal Growth'
  impact_metrics TEXT, -- e.g., 'Increased income by 20%', 'Secured dream job'
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT FALSE, -- For moderation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view approved stories
CREATE POLICY "Approved success stories are viewable by authenticated users." ON success_stories
  FOR SELECT USING (is_approved = TRUE);

-- Policy for users to insert their own stories
CREATE POLICY "Users can insert their own success stories." ON success_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own unapproved stories
CREATE POLICY "Users can update their own unapproved stories." ON success_stories
  FOR UPDATE USING (auth.uid() = user_id AND is_approved = FALSE);

-- Make user_id nullable for demo purposes
ALTER TABLE success_stories ALTER COLUMN user_id DROP NOT NULL;

-- Insert mockup data without user_id (will be NULL for demo stories)
INSERT INTO success_stories (title, story_content, category, impact_metrics, is_approved)
VALUES
  (
    'From Graduate to Tech Lead in 3 Years',
    'After utilizing the platform''s career advisory and digital skills programs, I landed my first tech job and quickly advanced to a leadership role. The mentorship program was invaluable!',
    'Career Advancement',
    '200% salary increase, Promoted to Tech Lead',
    TRUE
  ),
  (
    'Scholarship Opened Doors to Dream University',
    'The scholarship search tool helped me find funding for my university studies, which I never thought possible. Now I''m pursuing my passion in AI.',
    'Education',
    'Full scholarship, Admitted to top university',
    TRUE
  ),
  (
    'Finding Purpose in Retirement: My Volunteer Journey',
    'After retirement, I felt a void. The platform''s volunteer programs connected me with meaningful causes, giving me a new sense of purpose and community.',
    'Personal Growth',
    'Joined 3 volunteer initiatives, Enhanced well-being',
    TRUE
  ),
  (
    'Career Transition Success: From Finance to Tech',
    'Using the career transition resources and digital skills training, I successfully moved from finance to software development. The platform provided the perfect roadmap.',
    'Career Advancement',
    'Career change completed, 30% salary increase',
    TRUE
  ),
  (
    'Entrepreneurship Journey: Building My Startup',
    'The business development resources and mentorship network helped me launch my successful startup. I went from idea to profitable business in 18 months.',
    'Personal Growth',
    'Launched successful startup, Created 10 jobs',
    TRUE
  );
