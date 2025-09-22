
-- Create communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  focus_area TEXT, -- e.g., 'Technology', 'Finance', 'Education', 'Arts'
  community_type TEXT, -- e.g., 'Professional', 'Interest-based', 'Alumni'
  member_count INTEGER DEFAULT 0,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view communities
CREATE POLICY "Communities are viewable by authenticated users." ON communities
  FOR SELECT USING (is_active = TRUE);

-- Insert mockup data
INSERT INTO communities (name, description, focus_area, community_type, member_count, logo_url, website_url, contact_email)
VALUES
  (
    'UAE Tech Innovators',
    'A community for technology enthusiasts and professionals in the UAE to share knowledge and collaborate on projects.',
    'Technology',
    'Professional',
    1500,
    'https://example.com/uae-tech-innovators-logo.png',
    'https://www.uaetechinnovators.com',
    'info@uaetechinnovators.com'
  ),
  (
    'Emirati Artists Collective',
    'Connecting Emirati artists across various disciplines to promote local art and culture.',
    'Arts',
    'Interest-based',
    500,
    'https://example.com/emirati-artists-logo.png',
    'https://www.emiratiartists.org',
    'contact@emiratiartists.org'
  ),
  (
    'Future Leaders of UAE',
    'A community dedicated to developing leadership skills and civic engagement among young Emiratis.',
    'Leadership',
    'Interest-based',
    800,
    'https://example.com/future-leaders-logo.png',
    'https://www.futureleadersuae.org',
    'admin@futureleadersuae.org'
  ),
  (
    'Dubai Finance Professionals',
    'Connecting financial sector professionals for networking and knowledge sharing.',
    'Finance',
    'Professional',
    950,
    'https://example.com/dubai-finance-logo.png',
    'https://www.dubaifinance.pro',
    'connect@dubaifinance.pro'
  ),
  (
    'Green UAE Initiative',
    'Environmental enthusiasts working towards sustainable development in the UAE.',
    'Environment',
    'Interest-based',
    650,
    'https://example.com/green-uae-logo.png',
    'https://www.greenuae.org',
    'info@greenuae.org'
  ),
  (
    'UAE University Alumni Network',
    'Connecting graduates from UAE universities for professional networking.',
    'Education',
    'Alumni',
    2200,
    'https://example.com/uae-alumni-logo.png',
    'https://www.uaealumni.net',
    'alumni@uaealumni.net'
  );
