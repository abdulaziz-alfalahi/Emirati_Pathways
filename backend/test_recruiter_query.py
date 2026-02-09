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

print("Testing Updated Query - User 108's Applications")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Simulate the updated query
recruiter_id = '108'
days = 30
limit = 10

query = """
    SELECT 
        ja.id as application_id,
        ja.job_id,
        ja.candidate_id,
        ja.status,
        ja.submitted_at,
        jp.title as job_title,
        COALESCE(jp.company_id, 'Unknown Company') as company_name,
        COALESCE(u.email, CONCAT('Candidate ', SUBSTRING(CAST(ja.candidate_id AS TEXT), 1, 8))) as candidate_name,
        u.email as candidate_email
    FROM job_applications ja
    LEFT JOIN job_postings jp ON ja.job_id::text = jp.id::text
    LEFT JOIN users u ON ja.candidate_id::text = u.id::text
    WHERE ja.submitted_at >= NOW() - INTERVAL '30 days'
    AND jp.recruiter_id::text = %s
    ORDER BY ja.submitted_at DESC
    LIMIT %s
"""

cur.execute(query, (recruiter_id, limit))
applicants = cur.fetchall()

print(f"\nApplications for Recruiter {recruiter_id}: {len(applicants)}\n")

for app in applicants:
    print(f"Application ID: {app['application_id']}")
    print(f"Candidate: {app['candidate_name']} ({app['candidate_email']})")
    print(f"Job: {app['job_title']} (ID: {app['job_id']})")
    print(f"Status: {app['status']}")
    print(f"Submitted: {app['submitted_at']}")
    print("-" * 70)

conn.close()

print(f"\n✅ Query returned {len(applicants)} applications")
print("These applications should now appear in the recruiter dashboard")
