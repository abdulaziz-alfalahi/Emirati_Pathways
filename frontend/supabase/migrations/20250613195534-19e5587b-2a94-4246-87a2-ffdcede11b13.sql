-- Add missing columns to summer_camps table first
ALTER TABLE public.summer_camps 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AED',
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS registration_deadline DATE,
ADD COLUMN IF NOT EXISTS rating NUMERIC;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_scholarships_provider ON public.scholarships(created_by);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_scholarship ON public.scholarship_applications(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_student ON public.scholarship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_status ON public.scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_summer_camps_organizer ON public.summer_camps(created_by);
CREATE INDEX IF NOT EXISTS idx_summer_camps_category ON public.summer_camps(category);
CREATE INDEX IF NOT EXISTS idx_summer_camps_location ON public.summer_camps(location);
CREATE INDEX IF NOT EXISTS idx_camp_enrollments_camp ON public.camp_enrollments(camp_id);
CREATE INDEX IF NOT EXISTS idx_camp_enrollments_user ON public.camp_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON public.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_advisory_sessions_advisor ON public.advisory_sessions(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisory_sessions_user ON public.advisory_sessions(user_id);