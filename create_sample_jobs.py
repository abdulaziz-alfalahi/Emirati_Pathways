"""
Create diverse sample job postings for testing job matching differentiation.
All jobs will be posted by recruiter: u971528983000.0db9a6cc@emirati-pathway.temp
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import uuid
import json

# Database connection - using same config as backend
conn = psycopg2.connect(
    dbname='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    host='localhost',
    port='5432'
)

cur = conn.cursor(cursor_factory=RealDictCursor)

# Get recruiter's user_id from email
recruiter_email = 'u971528983000.0db9a6cc@emirati-pathway.temp'
cur.execute("SELECT id FROM users WHERE email = %s", (recruiter_email,))
recruiter = cur.fetchone()

if not recruiter:
    print(f"❌ Recruiter not found: {recruiter_email}")
    conn.close()
    exit(1)

recruiter_id = str(recruiter['id'])
print(f"✅ Found recruiter: {recruiter_email} (ID: {recruiter_id})")

# Helper function to parse salary ranges
def parse_salary(salary_str):
    """Extract min/max from salary strings like 'AED 12,000 - 18,000' or 'AED 35,000+'"""
    import re
    salary_str = salary_str.replace(',', '').replace('AED', '').strip()
    
    if '-' in salary_str:
        parts = salary_str.split('-')
        return int(parts[0].strip()), int(parts[1].strip())
    elif '+' in salary_str:
        base = int(salary_str.replace('+', '').strip())
        return base, base * 2
    else:
        # Try to extract single number
        match = re.search(r'\d+', salary_str)
        if match:
            val = int(match.group())
            return val, val
        return 0, 0

# Sample job postings with diversity
sample_jobs = [
    # Tech roles
    {
        'title': 'Frontend Developer',
        'description': 'Build responsive web applications using React, TypeScript, and modern CSS frameworks.',
        'requirements': 'React, TypeScript, CSS, 2+ years experience',
        'skills_required': ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML'],
        'experience_level': 'mid_level',
        'salary': 'AED 12,000 - 18,000',
        'location': 'Dubai',
        'company': 'TechCorp UAE',
    },
    {
        'title': 'Data Scientist',
        'description': 'Analyze large datasets and build machine learning models to drive business insights.',
        'requirements': 'Python, Machine Learning, SQL, Statistics, 3+ years experience',
        'skills_required': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Pandas'],
        'experience_level': 'senior',
        'salary': 'AED 20,000 - 28,000',
        'location': 'Abu Dhabi',
        'company': 'DataHub Inc',
    },
    {
        'title': 'Junior Software Developer',
        'description': 'Entry-level position for recent graduates. Learn full-stack development with mentorship.',
        'requirements': 'Basic programming knowledge, willingness to learn, Bachelor\'s degree',
        'skills_required': ['Python', 'JavaScript', 'Git'],
        'experience_level': 'entry_level',
        'salary': 'AED 8,000 - 10,000',
        'location': 'Sharjah',
        'company': 'StartupX',
    },
    {
        'title': 'Cloud Architect',
        'description': 'Design and implement cloud infrastructure using AWS/Azure. Lead cloud migration projects.',
        'requirements': 'AWS, Azure, Kubernetes, 5+ years experience, Cloud certifications preferred',
        'skills_required': ['AWS', 'Azure', 'Kubernetes', 'Docker', 'Terraform'],
        'experience_level': 'executive',
        'salary': 'AED 35,000+',
        'location': 'Dubai',
        'company': 'CloudTech Solutions',
    },
    
    # Marketing roles
    {
        'title': 'Digital Marketing Manager',
        'description': 'Lead digital marketing campaigns across social media, SEO, and paid advertising.',
        'requirements': 'SEO, Google Ads, Social Media Marketing, 3+ years experience',
        'skills_required': ['SEO', 'Google Ads', 'Social Media', 'Content Marketing', 'Analytics'],
        'experience_level': 'mid_level',
        'salary': 'AED 15,000 - 20,000',
        'location': 'Dubai',
        'company': 'Marketing Hub',
    },
    {
        'title': 'Content Writer',
        'description': 'Create engaging content for blogs, social media, and marketing materials.',
        'requirements': 'Excellent writing skills, creativity, 1+ year experience',
        'skills_required': ['Content Writing', 'Copywriting', 'SEO Writing', 'Research'],
        'experience_level': 'entry_level',
        'salary': 'AED 6,000 - 9,000',
        'location': 'Dubai',
        'company': 'Creative Agency',
    },
    
    # Finance roles
    {
        'title': 'Financial Analyst',
        'description': 'Perform financial modeling, budgeting, and forecasting for strategic decisions.',
        'requirements': 'Excel, Financial Modeling, Accounting, 2+ years experience',
        'skills_required': ['Excel', 'Financial Modeling', 'Accounting', 'Budgeting'],
        'experience_level': 'mid_level',
        'salary': 'AED 14,000 - 18,000',
        'location': 'Abu Dhabi',
        'company': 'Finance Corp',
    },
    {
        'title': 'Chief Financial Officer',
        'description': 'Oversee all financial operations, strategy, and compliance for the organization.',
        'requirements': 'CPA/CFA, Leadership, 10+ years experience, Strategic planning',
        'skills_required': ['Financial Strategy', 'Leadership', 'Compliance', 'Risk Management'],
        'experience_level': 'executive',
        'salary': 'AED 50,000+',
        'location': 'Dubai',
        'company': 'Global Enterprises',
    },
    
    # HR roles
    {
        'title': 'HR Generalist',
        'description': 'Manage recruitment, employee relations, and HR operations.',
        'requirements': 'HR experience, recruitment, employee relations, 2+ years',
        'skills_required': ['Recruitment', 'Employee Relations', 'HRIS', 'Communication'],
        'experience_level': 'mid_level',
        'salary': 'AED 10,000 - 14,000',
        'location': 'Dubai',
        'company': 'HR Solutions LLC',
    },
    
    # Other sectors
    {
        'title': 'Sales Executive',
        'description': 'Drive B2B sales, build client relationships, and meet revenue targets.',
        'requirements': 'Sales experience, negotiation skills, CRM knowledge, 2+ years',
        'skills_required': ['Sales', 'Negotiation', 'CRM', 'Communication', 'Client Relations'],
        'experience_level': 'mid_level',
        'salary': 'AED 12,000 - 16,000 + Commission',
        'location': 'Dubai',
        'company': 'Sales Pro Inc',
    },
    {
        'title': 'Product Manager',
        'description': 'Define product strategy, manage roadmap, and work with cross-functional teams.',
        'requirements': 'Product management, Agile, stakeholder management, 4+ years',
        'skills_required': ['Product Management', 'Agile', 'Jira', 'Stakeholder Management'],
        'experience_level': 'senior',
        'salary': 'AED 22,000 - 30,000',
        'location': 'Dubai',
        'company': 'Product Innovations',
    },
    {
        'title': 'UI/UX Designer',
        'description': 'Design intuitive user interfaces and create exceptional user experiences.',
        'requirements': 'Figma, Adobe XD, Design thinking, 2+ years experience',
        'skills_required': ['Figma', 'Adobe XD', 'UI Design', 'UX Design', 'Prototyping'],
        'experience_level': 'mid_level',
        'salary': 'AED 13,000 - 17,000',
        'location': 'Dubai',
        'company': 'Design Studio',
    },
]

print(f"\n📝 Creating {len(sample_jobs)} diverse job postings...\n")

created_count = 0
for job in sample_jobs:
    try:
        # Parse salary range (handle edge cases like "16,000 + Commission")
        salary_str = job['salary'].split('+')[0].strip() if '+' in job['salary'] else job['salary']
        salary_min, salary_max = parse_salary(salary_str)
        
        # Insert job posting - using actual schema
        cur.execute("""
            INSERT INTO job_postings (
                recruiter_id, title, description, requirements,
                experience_level, location, status,
                employment_type, salary_range_min, salary_range_max,
                created_at, updated_at, posted_date
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
        """, (
            recruiter_id,
            job['title'],
            job['description'],
            json.dumps({'skills': job['skills_required'], 'text': job['requirements']}),  # JSON serialized
            job['experience_level'],
            job['location'],
            'published',
            'full_time',
            salary_min,
            salary_max,
            datetime.now(),
            datetime.now(),
            datetime.now()
        ))
        
        created_count += 1
        print(f"  ✅ {job['title']} ({job['experience_level']}) - {job['location']}")
        
    except Exception as e:
        print(f"  ❌ Failed to create {job['title']}: {e}")
        conn.rollback()  # Rollback failed transaction
        continue

conn.commit()
conn.close()

print(f"\n✅ Successfully created {created_count}/{len(sample_jobs)} job postings")
print(f"🎯 All jobs posted by: {recruiter_email}")
print(f"\n💡 Now test job matching with Jasim and Buthaina to see differentiation!")
