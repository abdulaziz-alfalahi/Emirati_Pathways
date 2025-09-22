
-- Create digital_skills_resources table
CREATE TABLE digital_skills_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  difficulty_level TEXT,
  description TEXT,
  duration_hours INTEGER,
  cost DECIMAL(10, 2),
  resource_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE digital_skills_resources ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view resources
CREATE POLICY "Digital skills resources are viewable by authenticated users." ON digital_skills_resources
  FOR SELECT USING (is_active = TRUE AND auth.role() = 'authenticated');

-- Insert mockup data
INSERT INTO digital_skills_resources (title, provider, skill_category, difficulty_level, description, duration_hours, cost, resource_url)
VALUES
  (
    'Introduction to Python Programming',
    'Coursera',
    'Coding',
    'Beginner',
    'Learn the fundamentals of Python for data analysis and web development.',
    40,
    0.00,
    'https://www.coursera.org/learn/python'
  ),
  (
    'Machine Learning Specialization',
    'DeepLearning.AI',
    'AI/ML',
    'Advanced',
    'Master machine learning concepts from basic to advanced, including supervised and unsupervised learning.',
    120,
    49.99,
    'https://www.deeplearning.ai/courses/machine-learning-specialization/'
  ),
  (
    'Cybersecurity Fundamentals',
    'edX',
    'Cybersecurity',
    'Intermediate',
    'Understand core cybersecurity principles and practices to protect systems and data.',
    60,
    199.00,
    'https://www.edx.org/course/cybersecurity-fundamentals'
  ),
  (
    'Web Development Bootcamp',
    'Udemy',
    'Coding',
    'Beginner',
    'Complete web development course covering HTML, CSS, JavaScript, and modern frameworks.',
    80,
    89.99,
    'https://www.udemy.com/course/web-development-bootcamp/'
  ),
  (
    'Data Science with R',
    'Johns Hopkins University',
    'Data Science',
    'Intermediate',
    'Learn data science fundamentals using R programming language.',
    50,
    79.00,
    'https://www.coursera.org/specializations/jhu-data-science'
  ),
  (
    'Digital Marketing Fundamentals',
    'Google Digital Garage',
    'Digital Marketing',
    'Beginner',
    'Master the basics of digital marketing including SEO, SEM, and social media.',
    25,
    0.00,
    'https://learndigital.withgoogle.com/digitalgarage'
  ),
  (
    'Advanced React Development',
    'Frontend Masters',
    'Coding',
    'Advanced',
    'Deep dive into React patterns, performance optimization, and advanced concepts.',
    35,
    39.99,
    'https://frontendmasters.com/courses/advanced-react-patterns/'
  ),
  (
    'Cloud Computing with AWS',
    'Amazon Web Services',
    'Cloud Computing',
    'Intermediate',
    'Learn cloud fundamentals and AWS services for modern application deployment.',
    45,
    150.00,
    'https://aws.amazon.com/training/'
  );
