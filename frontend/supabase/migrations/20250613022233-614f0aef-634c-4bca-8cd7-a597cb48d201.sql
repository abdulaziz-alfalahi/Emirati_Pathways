
-- Create enum for training categories
CREATE TYPE training_category AS ENUM (
  'technical_skills',
  'trade_skills', 
  'service_skills',
  'entrepreneurship_business'
);

-- Create enum for training modes
CREATE TYPE training_mode AS ENUM (
  'in_person',
  'online',
  'hybrid'
);

-- Create enum for training status
CREATE TYPE training_status AS ENUM (
  'draft',
  'active',
  'full',
  'completed',
  'cancelled'
);

-- Create training providers table
CREATE TABLE training_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  partnership_level TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training programs table
CREATE TABLE training_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category training_category NOT NULL,
  subcategory TEXT,
  provider_id UUID REFERENCES training_providers(id) ON DELETE CASCADE,
  duration_weeks INTEGER,
  schedule_details TEXT,
  prerequisites TEXT[],
  learning_outcomes TEXT[],
  certification_offered BOOLEAN DEFAULT false,
  certification_name TEXT,
  job_placement_assistance BOOLEAN DEFAULT false,
  training_mode training_mode DEFAULT 'in_person',
  location TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  price_amount DECIMAL(10,2),
  price_currency TEXT DEFAULT 'AED',
  start_date DATE,
  end_date DATE,
  application_deadline DATE,
  status training_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training applications table
CREATE TABLE training_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  application_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training enrollments table
CREATE TABLE training_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  application_id UUID REFERENCES training_applications(id),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'enrolled',
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url TEXT,
  final_grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE training_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for training_providers (public read)
CREATE POLICY "Everyone can view training providers" ON training_providers
  FOR SELECT USING (true);

-- Create RLS policies for training_programs (public read)
CREATE POLICY "Everyone can view active training programs" ON training_programs
  FOR SELECT USING (status = 'active');

-- Create RLS policies for training_applications (users can manage their own)
CREATE POLICY "Users can view their own applications" ON training_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" ON training_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON training_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for training_enrollments (users can view their own)
CREATE POLICY "Users can view their own enrollments" ON training_enrollments
  FOR SELECT USING (auth.uid() = user_id);

-- Insert sample training providers
INSERT INTO training_providers (name, description, website_url, contact_email, is_verified, partnership_level) VALUES
('Dubai Skills Academy', 'Leading technical skills training provider in Dubai', 'https://dubaiskills.ae', 'info@dubaiskills.ae', true, 'premium'),
('Emirates Trade Institute', 'Specialized in trade and manufacturing skills', 'https://eti.ae', 'contact@eti.ae', true, 'standard'),
('UAE Business Hub', 'Entrepreneurship and business skills training', 'https://uaebusinesshub.ae', 'training@uaebusinesshub.ae', true, 'premium'),
('Digital Innovation Center', 'IT and digital transformation training', 'https://dic.ae', 'courses@dic.ae', true, 'standard');

-- Insert sample training programs
INSERT INTO training_programs (
  title, description, category, subcategory, provider_id, duration_weeks, 
  prerequisites, certification_offered, certification_name, job_placement_assistance,
  training_mode, location, max_participants, price_amount, start_date, end_date,
  application_deadline, status, featured
) VALUES
(
  'Full Stack Web Development Bootcamp',
  'Comprehensive training in modern web development technologies including React, Node.js, and cloud deployment.',
  'technical_skills',
  'Software Development',
  (SELECT id FROM training_providers WHERE name = 'Digital Innovation Center'),
  16,
  ARRAY['Basic computer skills', 'High school diploma'],
  true,
  'Certified Full Stack Developer',
  true,
  'hybrid',
  'Dubai Internet City',
  25,
  15000.00,
  '2024-03-01',
  '2024-06-15',
  '2024-02-15',
  'active',
  true
),
(
  'Automotive Technician Certification',
  'Professional automotive repair and maintenance training with hands-on experience.',
  'trade_skills',
  'Automotive',
  (SELECT id FROM training_providers WHERE name = 'Emirates Trade Institute'),
  12,
  ARRAY['Basic mechanical knowledge'],
  true,
  'Certified Automotive Technician',
  true,
  'in_person',
  'Dubai Industrial City',
  20,
  12000.00,
  '2024-02-15',
  '2024-05-15',
  '2024-02-01',
  'active',
  false
),
(
  'Hospitality Management Excellence',
  'Complete hospitality and customer service training for hotel and restaurant industry.',
  'service_skills',
  'Hospitality',
  (SELECT id FROM training_providers WHERE name = 'Dubai Skills Academy'),
  8,
  ARRAY['Customer service experience preferred'],
  true,
  'Hospitality Management Certificate',
  true,
  'hybrid',
  'Dubai Marina',
  30,
  8000.00,
  '2024-03-15',
  '2024-05-15',
  '2024-03-01',
  'active',
  true
),
(
  'Entrepreneurship & Startup Accelerator',
  'Intensive program for aspiring entrepreneurs to develop business skills and launch startups.',
  'entrepreneurship_business',
  'Startup Development',
  (SELECT id FROM training_providers WHERE name = 'UAE Business Hub'),
  10,
  ARRAY['Business idea or concept'],
  true,
  'Certified Entrepreneur',
  false,
  'hybrid',
  'Dubai Silicon Oasis',
  15,
  10000.00,
  '2024-04-01',
  '2024-06-15',
  '2024-03-15',
  'active',
  true
);
