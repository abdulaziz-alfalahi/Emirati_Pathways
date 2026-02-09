"""
Deep investigation: Why is user 62 only seeing 2 jobs?
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import json

conn = psycopg2.connect(
    dbname='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    host='localhost',
    port='5432'
)

cur = conn.cursor(cursor_factory=RealDictCursor)

# Get user 62's profile info
cur.execute("""
    SELECT cp.*, uc.professional_summary, uc.technical_skills
    FROM candidate_profiles cp
    LEFT JOIN user_cvs uc ON cp.user_id::text = uc.user_id::text
    WHERE cp.user_id::text = '62'
    LIMIT 1
""")
profile = cur.fetchone()

if profile:
    print("=== USER 62 PROFILE ===")
    print(f"Experience Years: {profile.get('experience_years', 'N/A')}")
    print(f"Career Level: {profile.get('career_level', 'N/A')}")
    print(f"Expected Salary: {profile.get('expected_salary_range', 'N/A')}")
    print(f"Professional Summary: {profile.get('professional_summary', 'N/A')[:100] if profile.get('professional_summary') else 'N/A'}")
    
    # Get their skills
    cur.execute("""
        SELECT name, level FROM candidate_skills 
        WHERE profile_id = (SELECT id FROM candidate_profiles WHERE user_id::text = '62')
        LIMIT 10
    """)
    skills = cur.fetchall()
    print(f"\nTop Skills:")
    for skill in skills:
        print(f"  - {skill['name']} ({skill['level']})")
else:
    print("❌ No Profile V2 found for user 62")

# Check what the SQL query returns
print("\n=== SQL QUERY RESULT (first 5 jobs) ===")
cur.execute("""
    SELECT 
        j.id,
        j.jd_id,
        j.title,
        j.experience_level,
        j.salary_range_min,
        j.salary_range_max,
        j.currency,
        CONCAT(j.salary_range_min, ' - ', j.salary_range_max, ' ', j.currency) as salary_formatted
    FROM job_postings j
    WHERE j.status = 'published' OR j.status = 'active'
    ORDER BY j.created_at DESC
    LIMIT 5
""")
jobs = cur.fetchall()
for job in jobs:
    print(f"\nJob ID: {job['id']}")
    print(f"  Title: {job['title']}")
    print(f"  Level: {job['experience_level']}")
    print(f"  Salary: {job['salary_formatted']}")

conn.close()
