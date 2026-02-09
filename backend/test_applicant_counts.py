import psycopg2
from psycopg2.extras import RealDictCursor
import os

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

print("Testing Application Counts Query for User 108")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

recruiter_id = '108'

# Test the exact query from the endpoint
query = """
    SELECT 
        jp.id::text as job_id,
        jp.title as job_title,
        COUNT(ja.id) as total_applicants,
        COUNT(CASE WHEN ja.status IN ('pending', 'submitted') THEN 1 END) as new_applicants,
        COUNT(CASE WHEN ja.status IN ('under_review', 'screening') THEN 1 END) as in_review,
        COUNT(CASE WHEN ja.status IN ('interview', 'interview_scheduled', 'interviewing') THEN 1 END) as in_interview,
        COUNT(CASE WHEN ja.status IN ('offer_sent', 'offer_extended') THEN 1 END) as offers_made,
        MAX(ja.submitted_at) as last_application_date
    FROM job_postings jp
    LEFT JOIN job_applications ja ON ja.job_id::text = jp.id::text
    WHERE jp.recruiter_id::text = %s
    GROUP BY jp.id, jp.title
    ORDER BY last_application_date DESC NULLS LAST
"""

cur.execute(query, (recruiter_id,))
counts = cur.fetchall()

print(f"\n✅ Found {len(counts)} jobs for recruiter {recruiter_id}\n")

for count in counts:
    print(f"Job ID: {count['job_id']}")
    print(f"Title: {count['job_title']}")
    print(f"Total Applicants: {count['total_applicants']}")
    print(f"  - New: {count['new_applicants']}")
    print(f"  - In Review: {count['in_review']}")
    print(f"  - Interview: {count['in_interview']}")
    print(f"  - Offers: {count['offers_made']}")
    print(f"Last Application: {count['last_application_date']}")
    print("-" * 70)

# Also check the job_postings table directly
print("\n📋 Checking job_postings table for recruiter 108:")
cur.execute("""
    SELECT id::text, title, recruiter_id::text, status 
    FROM job_postings 
    WHERE recruiter_id::text = %s
""", (recruiter_id,))
jobs = cur.fetchall()
print(f"Found {len(jobs)} jobs:")
for job in jobs:
    print(f"  - {job['id']}: {job['title']} (status: {job['status']})")

# Check job_applications for job 756
print("\n📝 Checking applications for Job 756 (CFO):")
cur.execute("""
    SELECT id, job_id::text, candidate_id::text, status, submitted_at
    FROM job_applications
    WHERE job_id::text = '756'
""")
apps = cur.fetchall()
print(f"Found {len(apps)} applications for Job 756:")
for app in apps:
    print(f"  - {app['id']}: Candidate {app['candidate_id']}, Status: {app['status']}, Submitted: {app['submitted_at']}")

conn.close()
