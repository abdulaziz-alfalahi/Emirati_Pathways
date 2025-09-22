-- Comprehensive RLS Implementation - Drop all existing policies first
-- This migration drops ALL existing policies and recreates them systematically

-- =================
-- DROP ALL EXISTING POLICIES TO AVOID CONFLICTS
-- =================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can manage their own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can manage their own financial projections" ON public.financial_projections;
DROP POLICY IF EXISTS "Users can view their own scholarship applications" ON public.scholarship_applications;
DROP POLICY IF EXISTS "Users can create their own scholarship applications" ON public.scholarship_applications;
DROP POLICY IF EXISTS "Users can update their own scholarship applications" ON public.scholarship_applications;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can manage their own advisory applications" ON public.advisory_applications;
DROP POLICY IF EXISTS "Users can manage their own camp enrollments" ON public.camp_enrollments;
DROP POLICY IF EXISTS "Users can manage their own course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can view their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Users can create their own assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Training centers can manage assessment sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Advisory sessions access policy" ON public.advisory_sessions;
DROP POLICY IF EXISTS "Users can create advisory sessions" ON public.advisory_sessions;
DROP POLICY IF EXISTS "Advisors can update their sessions" ON public.advisory_sessions;
DROP POLICY IF EXISTS "Users can view active career advisors" ON public.career_advisors;
DROP POLICY IF EXISTS "Users can create their advisor profile" ON public.career_advisors;
DROP POLICY IF EXISTS "Advisors can update their profile" ON public.career_advisors;
DROP POLICY IF EXISTS "Users can manage their event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can manage their event feedback" ON public.event_feedback;
DROP POLICY IF EXISTS "Blockchain credentials access policy" ON public.blockchain_credentials;
DROP POLICY IF EXISTS "Only issuers can create credentials" ON public.blockchain_credentials;
DROP POLICY IF EXISTS "Issuers can update their credentials" ON public.blockchain_credentials;
DROP POLICY IF EXISTS "Users can manage their verification requests" ON public.credential_verification_requests;
DROP POLICY IF EXISTS "Only platform operators can access API keys" ON public.api_keys;

-- =================
-- UTILITY FUNCTIONS
-- =================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = target_user_id
    AND role IN ('administrator', 'super_user', 'platform_operator')
  );
$$;

-- Function to check if user is training center staff
CREATE OR REPLACE FUNCTION public.is_training_center_staff(target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = target_user_id
    AND role IN ('training_center', 'assessment_center')
  );
$$;

-- =================
-- ENABLE RLS ON CRITICAL TABLES
-- =================

-- Enable RLS on tables that need protection
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camp_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- =================
-- RECREATE ALL POLICIES
-- =================

-- Financial Goals: Users own their financial data
CREATE POLICY "Users can manage their own financial goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Financial Projections: Users own their projection data
CREATE POLICY "Users can manage their own financial projections" ON public.financial_projections
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Scholarship Applications: Users own their applications
CREATE POLICY "Users can view their own scholarship applications" ON public.scholarship_applications
  FOR SELECT USING (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Users can create their own scholarship applications" ON public.scholarship_applications
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own scholarship applications" ON public.scholarship_applications
  FOR UPDATE USING (auth.uid() = student_id OR public.is_admin());

-- Advisory Applications: Users own their applications
CREATE POLICY "Users can manage their own advisory applications" ON public.advisory_applications
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Camp Enrollments: Users own their enrollments
CREATE POLICY "Users can manage their own camp enrollments" ON public.camp_enrollments
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Course Enrollments: Users own their enrollments
CREATE POLICY "Users can manage their own course enrollments" ON public.course_enrollments
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Certificates: Users can view their own certificates
CREATE POLICY "Users can view their own certificates" ON public.certificates
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Assessment Sessions: Users own their sessions, training centers can view assigned sessions
CREATE POLICY "Users can view their own assessment sessions" ON public.assessment_sessions
  FOR SELECT USING (auth.uid() = user_id OR public.is_training_center_staff() OR public.is_admin());

CREATE POLICY "Users can create their own assessment sessions" ON public.assessment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Training centers can manage assessment sessions" ON public.assessment_sessions
  FOR UPDATE USING (public.is_training_center_staff() OR public.is_admin());

-- Advisory Sessions: Users can view their own sessions, advisors can view assigned sessions
CREATE POLICY "Advisory sessions access policy" ON public.advisory_sessions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = advisor_id OR 
    public.is_admin()
  );

CREATE POLICY "Users can create advisory sessions" ON public.advisory_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their sessions" ON public.advisory_sessions
  FOR UPDATE USING (auth.uid() = advisor_id OR public.is_admin());

-- Career Advisors: Advisors can manage their profile, users can view active advisors
CREATE POLICY "Users can view active career advisors" ON public.career_advisors
  FOR SELECT USING (is_active = true OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their advisor profile" ON public.career_advisors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their profile" ON public.career_advisors
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Event Registrations: Users own their registrations
CREATE POLICY "Users can manage their event registrations" ON public.event_registrations
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Event Feedback: Users own their feedback
CREATE POLICY "Users can manage their event feedback" ON public.event_feedback
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Blockchain Credentials: Recipients can view their credentials, issuers can manage
CREATE POLICY "Blockchain credentials access policy" ON public.blockchain_credentials
  FOR SELECT USING (
    auth.uid() = recipient_id OR 
    auth.uid() = issuer_id OR 
    public.is_admin()
  );

CREATE POLICY "Only issuers can create credentials" ON public.blockchain_credentials
  FOR INSERT WITH CHECK (auth.uid() = issuer_id OR public.is_admin());

CREATE POLICY "Issuers can update their credentials" ON public.blockchain_credentials
  FOR UPDATE USING (auth.uid() = issuer_id OR public.is_admin());

-- Credential Verification Requests: Users own their requests
CREATE POLICY "Users can manage their verification requests" ON public.credential_verification_requests
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- API Keys: Only platform operators and super users
CREATE POLICY "Only platform operators can access API keys" ON public.api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('platform_operator', 'super_user')
    )
  );

-- =================
-- VERIFICATION FUNCTION
-- =================

-- Function to verify RLS configuration
CREATE OR REPLACE FUNCTION public.verify_rls_configuration()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    schemaname || '.' || tablename as table_name,
    rowsecurity as rls_enabled,
    (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = pg_tables.tablename
    ) as policy_count
  FROM pg_tables 
  WHERE schemaname = 'public'
  AND rowsecurity = true
  ORDER BY tablename;
$$;