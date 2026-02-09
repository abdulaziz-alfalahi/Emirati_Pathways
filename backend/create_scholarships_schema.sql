
-- Scholarships Table
CREATE TABLE IF NOT EXISTS scholarships (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount VARCHAR(100), -- e.g. "AED 50,000"
    coverage_type VARCHAR(100), -- e.g. "Full Tuition", "Partial", "Stipend"
    deadline DATE,
    min_gpa DECIMAL(3, 2),
    academic_level VARCHAR(100), -- Undergraduate, Postgraduate, High School
    eligible_majors JSONB DEFAULT '[]', -- List of majors
    application_link VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    institution_id UUID REFERENCES educational_institutions(id)
);

-- Programs Table (for Camps, Workshops not under courses)
CREATE TABLE IF NOT EXISTS educational_programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organizer_name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type VARCHAR(100), -- Summer Camp, Bootcamp, Workshop
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    age_group VARCHAR(50),
    application_deadline DATE,
    cost VARCHAR(100) DEFAULT 'Free',
    application_link VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
