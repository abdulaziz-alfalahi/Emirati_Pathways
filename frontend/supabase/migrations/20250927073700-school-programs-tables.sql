-- School Programs Database Schema
-- KHDA Content Management System for Dubai School Programs
-- Created: 2025-09-27

-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- KHDA school code
  location TEXT NOT NULL,
  district TEXT NOT NULL,
  coordinates POINT, -- Geographic coordinates
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  khda_rating TEXT, -- Outstanding, Very Good, Good, Acceptable
  curriculum_type TEXT[], -- British, American, IB, UAE National, etc.
  student_capacity INTEGER,
  current_enrollment INTEGER,
  established_year INTEGER,
  principal_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create school_programs table
CREATE TABLE public.school_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  category TEXT NOT NULL, -- STEM, Arts, Sports, Languages, etc.
  subcategory TEXT,
  target_age_min INTEGER NOT NULL,
  target_age_max INTEGER NOT NULL,
  duration_value INTEGER NOT NULL,
  duration_unit TEXT NOT NULL DEFAULT 'years', -- years, months, weeks
  capacity_total INTEGER NOT NULL,
  capacity_available INTEGER NOT NULL,
  fees_currency TEXT NOT NULL DEFAULT 'AED',
  fees_amount DECIMAL(10,2) NOT NULL,
  fees_frequency TEXT NOT NULL DEFAULT 'annual', -- annual, monthly, one-time
  start_date DATE,
  end_date DATE,
  application_deadline DATE,
  requirements TEXT[],
  learning_outcomes TEXT[],
  assessment_methods TEXT[],
  certification_offered TEXT,
  language_of_instruction TEXT[] DEFAULT ARRAY['English'],
  schedule_days TEXT[], -- Monday, Tuesday, etc.
  schedule_time_start TIME,
  schedule_time_end TIME,
  location_on_campus BOOLEAN DEFAULT true,
  location_details TEXT,
  equipment_provided TEXT[],
  prerequisites TEXT[],
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  image_urls TEXT[],
  video_urls TEXT[],
  brochure_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'published', 'archived', 'rejected')),
  workflow_stage TEXT NOT NULL DEFAULT 'content_creation' CHECK (workflow_stage IN (
    'content_creation', 'submission', 'technical_review', 'educational_review', 
    'policy_review', 'final_approval', 'staging', 'publication', 'maintenance'
  )),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  last_modified_by UUID REFERENCES auth.users
);

-- Create program_success_metrics table
CREATE TABLE public.program_success_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.school_programs(id) ON DELETE CASCADE,
  graduation_rate DECIMAL(5,2), -- percentage
  employment_rate DECIMAL(5,2), -- percentage
  satisfaction_score DECIMAL(3,2), -- out of 5.0
  industry_partnerships INTEGER DEFAULT 0,
  awards_received TEXT[],
  alumni_achievements TEXT[],
  parent_feedback_score DECIMAL(3,2),
  student_retention_rate DECIMAL(5,2),
  university_acceptance_rate DECIMAL(5,2),
  scholarship_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_workflow_history table
CREATE TABLE public.program_workflow_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.school_programs(id) ON DELETE CASCADE,
  stage_from TEXT NOT NULL,
  stage_to TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'submit', 'approve', 'reject', 'request_revision'
  actor_id UUID NOT NULL REFERENCES auth.users,
  actor_role TEXT NOT NULL, -- 'content_creator', 'technical_reviewer', 'educational_reviewer', etc.
  comments TEXT,
  review_notes TEXT,
  attachments TEXT[],
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_reviews table
CREATE TABLE public.program_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.school_programs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users,
  review_type TEXT NOT NULL, -- 'technical', 'educational', 'policy', 'final'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  score INTEGER CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  checklist_items JSONB, -- structured review checklist
  recommendations TEXT[],
  compliance_notes TEXT,
  khda_standards_met BOOLEAN,
  education33_alignment BOOLEAN,
  d33_alignment BOOLEAN,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE
);

-- Create program_categories table
CREATE TABLE public.program_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  icon_name TEXT, -- Lucide icon name
  color_code TEXT, -- Hex color for UI
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_tags table
CREATE TABLE public.program_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.school_programs(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_type TEXT DEFAULT 'general', -- 'skill', 'technology', 'methodology', 'general'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, tag_name)
);

-- Create program_enrollments table
CREATE TABLE public.program_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.school_programs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users,
  parent_id UUID REFERENCES auth.users,
  enrollment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrollment_status IN (
    'pending', 'approved', 'rejected', 'waitlisted', 'enrolled', 'completed', 'withdrawn'
  )),
  application_data JSONB,
  enrollment_date DATE,
  completion_date DATE,
  grade_achieved TEXT,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_notifications table
CREATE TABLE public.program_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.school_programs(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users,
  notification_type TEXT NOT NULL, -- 'workflow_update', 'review_assigned', 'deadline_reminder', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_schools_code ON public.schools(code);
CREATE INDEX idx_schools_location ON public.schools(location);
CREATE INDEX idx_schools_active ON public.schools(is_active);

CREATE INDEX idx_school_programs_school ON public.school_programs(school_id);
CREATE INDEX idx_school_programs_category ON public.school_programs(category);
CREATE INDEX idx_school_programs_status ON public.school_programs(status);
CREATE INDEX idx_school_programs_workflow_stage ON public.school_programs(workflow_stage);
CREATE INDEX idx_school_programs_featured ON public.school_programs(featured);
CREATE INDEX idx_school_programs_age_range ON public.school_programs(target_age_min, target_age_max);
CREATE INDEX idx_school_programs_dates ON public.school_programs(start_date, end_date);

CREATE INDEX idx_program_workflow_history_program ON public.program_workflow_history(program_id);
CREATE INDEX idx_program_workflow_history_actor ON public.program_workflow_history(actor_id);
CREATE INDEX idx_program_workflow_history_stage ON public.program_workflow_history(stage_to);

CREATE INDEX idx_program_reviews_program ON public.program_reviews(program_id);
CREATE INDEX idx_program_reviews_reviewer ON public.program_reviews(reviewer_id);
CREATE INDEX idx_program_reviews_status ON public.program_reviews(status);
CREATE INDEX idx_program_reviews_type ON public.program_reviews(review_type);

CREATE INDEX idx_program_tags_program ON public.program_tags(program_id);
CREATE INDEX idx_program_tags_name ON public.program_tags(tag_name);

CREATE INDEX idx_program_enrollments_program ON public.program_enrollments(program_id);
CREATE INDEX idx_program_enrollments_student ON public.program_enrollments(student_id);
CREATE INDEX idx_program_enrollments_status ON public.program_enrollments(enrollment_status);

CREATE INDEX idx_program_notifications_recipient ON public.program_notifications(recipient_id);
CREATE INDEX idx_program_notifications_unread ON public.program_notifications(is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_success_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools
CREATE POLICY "Anyone can view active schools" ON public.schools
  FOR SELECT USING (is_active = true);

CREATE POLICY "KHDA staff can manage schools" ON public.schools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_staff', 'khda_director')
    )
  );

-- RLS Policies for school_programs
CREATE POLICY "Anyone can view published programs" ON public.school_programs
  FOR SELECT USING (status = 'published');

CREATE POLICY "School staff can manage their programs" ON public.school_programs
  FOR ALL USING (
    school_id IN (
      SELECT s.id FROM schools s
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE ur.role IN ('school_admin', 'content_creator')
      AND ur.organization_id = s.id
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_staff', 'khda_director')
    )
  );

CREATE POLICY "Content creators can create programs" ON public.school_programs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('content_creator', 'school_admin', 'admin', 'khda_staff')
    )
  );

-- RLS Policies for program_success_metrics
CREATE POLICY "Anyone can view success metrics for published programs" ON public.program_success_metrics
  FOR SELECT USING (
    program_id IN (
      SELECT id FROM school_programs WHERE status = 'published'
    )
  );

CREATE POLICY "Authorized users can manage success metrics" ON public.program_success_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_staff', 'school_admin', 'content_creator')
    )
  );

-- RLS Policies for workflow history
CREATE POLICY "Stakeholders can view workflow history" ON public.program_workflow_history
  FOR SELECT USING (
    actor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_staff', 'khda_director')
    )
  );

CREATE POLICY "Authorized users can create workflow entries" ON public.program_workflow_history
  FOR INSERT WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_staff', 'content_creator', 'technical_reviewer', 'educational_reviewer')
    )
  );

-- RLS Policies for reviews
CREATE POLICY "Reviewers can view assigned reviews" ON public.program_reviews
  FOR SELECT USING (
    reviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_director')
    )
  );

CREATE POLICY "Reviewers can manage their reviews" ON public.program_reviews
  FOR ALL USING (
    reviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_director')
    )
  );

-- RLS Policies for categories
CREATE POLICY "Anyone can view active categories" ON public.program_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.program_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_staff')
    )
  );

-- RLS Policies for tags
CREATE POLICY "Anyone can view tags for published programs" ON public.program_tags
  FOR SELECT USING (
    program_id IN (
      SELECT id FROM school_programs WHERE status = 'published'
    )
  );

CREATE POLICY "Authorized users can manage tags" ON public.program_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'khda_staff', 'content_creator')
    )
  );

-- RLS Policies for enrollments
CREATE POLICY "Students can view their enrollments" ON public.program_enrollments
  FOR SELECT USING (
    student_id = auth.uid() OR 
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'school_admin')
    )
  );

CREATE POLICY "Students can create enrollments" ON public.program_enrollments
  FOR INSERT WITH CHECK (
    student_id = auth.uid() OR parent_id = auth.uid()
  );

CREATE POLICY "School staff can manage enrollments" ON public.program_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'school_admin')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.program_notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.program_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" ON public.program_notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Insert default program categories
INSERT INTO public.program_categories (name_en, name_ar, description_en, description_ar, icon_name, color_code, sort_order) VALUES
('STEM', 'العلوم والتكنولوجيا', 'Science, Technology, Engineering, and Mathematics programs', 'برامج العلوم والتكنولوجيا والهندسة والرياضيات', 'Cpu', '#3B82F6', 1),
('Arts', 'الفنون', 'Creative arts and cultural programs', 'برامج الفنون الإبداعية والثقافية', 'Palette', '#EC4899', 2),
('Sports', 'الرياضة', 'Physical education and sports programs', 'برامج التربية البدنية والرياضة', 'Trophy', '#10B981', 3),
('Languages', 'اللغات', 'Language learning and communication programs', 'برامج تعلم اللغات والتواصل', 'Languages', '#F59E0B', 4),
('Business', 'الأعمال', 'Entrepreneurship and business skills programs', 'برامج ريادة الأعمال والمهارات التجارية', 'Briefcase', '#8B5CF6', 5),
('Life Skills', 'المهارات الحياتية', 'Personal development and life skills programs', 'برامج التطوير الشخصي والمهارات الحياتية', 'User', '#06B6D4', 6);

-- Insert sample schools
INSERT INTO public.schools (name_en, name_ar, code, location, district, contact_email, khda_rating, curriculum_type, student_capacity, current_enrollment, established_year, is_active) VALUES
('Dubai International Academy', 'أكاديمية دبي الدولية', 'DIA001', 'Al Barsha', 'Al Barsha', 'info@dia.ae', 'Outstanding', ARRAY['IB', 'British'], 1200, 1050, 2005, true),
('GEMS Wellington Academy', 'أكاديمية جيمس ويلينغتون', 'GWA002', 'Silicon Oasis', 'Dubai Silicon Oasis', 'admissions@wellington.ae', 'Very Good', ARRAY['British'], 1500, 1350, 2010, true),
('American School of Dubai', 'المدرسة الأمريكية في دبي', 'ASD003', 'Jumeirah', 'Jumeirah', 'info@asdubai.org', 'Outstanding', ARRAY['American'], 1800, 1650, 1966, true);
