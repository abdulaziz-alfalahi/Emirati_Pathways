
-- Create national_service_resources table
CREATE TABLE national_service_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('overview', 'eligibility', 'benefits', 'post_service')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('article', 'guide', 'faq', 'video', 'document')),
  content_url TEXT,
  content_markdown TEXT,
  image_url TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE national_service_resources ENABLE ROW LEVEL SECURITY;

-- Policy for all users to view active resources (public access)
CREATE POLICY "National service resources are viewable by everyone." ON national_service_resources
  FOR SELECT USING (is_active = TRUE);

-- Insert mockup data
INSERT INTO national_service_resources (title, description, category, resource_type, content_markdown, tags, is_featured)
VALUES
  (
    'What is National Service?',
    'An overview of the UAE National Service program and its objectives.',
    'overview',
    'article',
    '# National Service Overview

The UAE National Service is a program designed to instill values of loyalty and belonging to the UAE, develop physical fitness, and enhance discipline among young Emiratis.

## Key Objectives:
- Strengthen national identity and belonging
- Develop leadership and teamwork skills
- Enhance physical and mental fitness
- Prepare citizens for future challenges

## Duration:
- 12 months for high school graduates
- 9 months for university graduates',
    ARRAY['national service', 'overview', 'uae'],
    TRUE
  ),
  (
    'Eligibility Requirements',
    'Complete guide to national service eligibility criteria.',
    'eligibility',
    'guide',
    '# Eligibility Criteria

## Age Requirements:
- Males: 18-30 years old
- Must be UAE nationals

## Educational Status:
- High school graduates: 12-month service
- University graduates: 9-month service

## Medical Requirements:
- Pass medical examination
- Meet physical fitness standards

## Exemptions:
- Students pursuing higher education (deferment available)
- Medical exemptions for health conditions',
    ARRAY['eligibility', 'requirements', 'age'],
    TRUE
  ),
  (
    'Service Benefits',
    'Overview of benefits provided during and after national service.',
    'benefits',
    'article',
    '# National Service Benefits

## During Service:
- Monthly allowance
- Accommodation and meals
- Medical coverage
- Training and skill development

## Post-Service Benefits:
- Priority in government job applications
- University admission advantages
- Professional development opportunities
- Alumni network access

## Long-term Advantages:
- Enhanced career prospects
- Leadership experience
- Strong professional network',
    ARRAY['benefits', 'allowance', 'career'],
    TRUE
  ),
  (
    'Career Transition Support',
    'Resources for transitioning from national service to civilian careers.',
    'post_service',
    'guide',
    '# Post-Service Career Support

## Job Placement Services:
- Resume building workshops
- Interview preparation
- Job matching services
- Career counseling

## Educational Opportunities:
- University application support
- Scholarship programs
- Professional certifications
- Continuing education

## Networking:
- Alumni association
- Professional mentorship
- Industry connections
- Peer support groups',
    ARRAY['career', 'job placement', 'education'],
    FALSE
  ),
  (
    'Training Programs',
    'Information about training programs available during service.',
    'overview',
    'article',
    '# Training Programs

## Military Training:
- Basic military skills
- Leadership development
- Team building exercises
- Physical fitness programs

## Professional Development:
- Communication skills
- Project management
- Technology training
- Language courses

## Specialized Tracks:
- Technical specializations
- Administrative roles
- Security services
- Support functions',
    ARRAY['training', 'military', 'professional development'],
    FALSE
  ),
  (
    'How to Apply',
    'Step-by-step guide for national service application.',
    'eligibility',
    'guide',
    '# Application Process

## Step 1: Registration
- Visit official website
- Complete online registration
- Upload required documents

## Step 2: Medical Examination
- Schedule medical checkup
- Complete fitness assessment
- Submit medical reports

## Step 3: Confirmation
- Receive service assignment
- Attend orientation session
- Begin service period

## Required Documents:
- UAE passport
- Educational certificates
- Medical reports
- Emirates ID',
    ARRAY['application', 'registration', 'process'],
    FALSE
  );
