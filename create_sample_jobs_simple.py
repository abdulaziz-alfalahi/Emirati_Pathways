"""
Simple script to create diverse sample job postings.
Uses minimal required fields to avoid constraint violations.
"""

import psycopg2
from datetime import datetime
import json

conn = psycopg2.connect(
    dbname='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    host='localhost',
    port='5432'
)

cur = conn.cursor()

# Recruiter ID
recruiter_id = '108'

# Simple job definitions
jobs = [
    ('Frontend Developer', 'mid_level', 'Dubai', 12000, 18000, ['React', 'TypeScript', 'JavaScript']),
    ('Data Scientist', 'senior', 'Abu Dhabi', 20000, 28000, ['Python', 'Machine Learning', 'SQL']),
    ('Junior Software Developer', 'entry_level', 'Sharjah', 8000, 10000, ['Python', 'JavaScript']),
    ('Cloud Architect', 'executive', 'Dubai', 35000, 70000, ['AWS', 'Azure', 'Kubernetes']),
    ('Digital Marketing Manager', 'mid_level', 'Dubai', 15000, 20000, ['SEO', 'Google Ads', 'Social Media']),
    ('Content Writer', 'entry_level', 'Dubai', 6000, 9000, ['Content Writing', 'SEO Writing']),
    ('Financial Analyst', 'mid_level', 'Abu Dhabi', 14000, 18000, ['Excel', 'Financial Modeling']),
    ('Chief Financial Officer', 'executive', 'Dubai', 50000, 100000, ['Financial Strategy', 'Leadership']),
    ('HR Generalist', 'mid_level', 'Dubai', 10000, 14000, ['Recruitment', 'Employee Relations']),
    ('Sales Executive', 'mid_level', 'Dubai', 12000, 16000, ['Sales', 'Negotiation', 'CRM']),
    ('Product Manager', 'senior', 'Dubai', 22000, 30000, ['Product Management', 'Agile']),
    ('UI/UX Designer', 'mid_level', 'Dubai', 13000, 17000, ['Figma', 'UI Design', 'UX Design']),
]

print(f"\nCreating {len(jobs)} sample job postings...")

created = 0
for idx, (title, level, location, sal_min, sal_max, skills) in enumerate(jobs, 1):
    try:
        # Generate JD ID for this job
        jd_id = f"JD{recruiter_id}_{datetime.now().strftime('%Y%m%d')}_{idx}"
        
        cur.execute("""
            INSERT INTO job_postings (
                jd_id, recruiter_id, company_id, title, description, 
                experience_level, location, 
                salary_range_min, salary_range_max,
                status, employment_type,
                requirements,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s,
                %s, %s
            )
        """, (
            jd_id,
            recruiter_id,
            'COMP_DEFAULT',  # Default company ID
            title,
            f"Exciting opportunity for a {title} to join our growing team.",
            level,
            location,
            sal_min,
            sal_max,
            'published',
            'full_time',
            json.dumps({'skills': skills}),
            datetime.now(),
            datetime.now()
        ))
        
        created += 1
        print(f"  ✓ {title}")
        
    except Exception as e:
        print(f"  X {title}: {e}")
        conn.rollback()

conn.commit()
conn.close()

print(f"\n✅ Successfully created {created}/{len(jobs)} jobs")
print("Now test job matching to see differentiation between candidates!")
