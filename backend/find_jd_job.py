import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

print("Finding Job Associated with JD: JD108_20260128_8")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Find what job has this JD
jd_id = 'JD108_20260128_8'
print(f"\n1. Finding job_postings with jd_id = '{jd_id}':")
cur.execute("""
    SELECT id::text, title, jd_id, recruiter_id::text
    FROM job_postings
    WHERE jd_id = %s
""", (jd_id,))
job = cur.fetchone()

if job:
    print(f"   ✅ Job found:")
    print(f"   Job ID: {job['id']}")
    print(f"   Title: {job['title']}")
    print(f"   JD ID: {job['jd_id']}")
    print(f"   Recruiter: {job['recruiter_id']}")
    
    job_id = job['id']
    
    # Check applications for this job
    print(f"\n2. Applications for this job (ID {job_id}):")
    cur.execute("""
        SELECT 
            ja.id,
            ja.candidate_id::text,
            ja.status,
            ja.submitted_at,
            u.id::text as user_id,
            u.email
        FROM job_applications ja
        LEFT JOIN users u ON ja.candidate_id::text = u.id::text
        WHERE ja.job_id::text = %s
        ORDER BY ja.submitted_at DESC
    """, (job_id,))
    apps = cur.fetchall()
    
    if apps:
        for i, app in enumerate(apps, 1):
            print(f"\n   Application #{i}:")
            print(f"   - App ID: {app['id']}")
            print(f"   - Candidate ID: {app['candidate_id']}")
            print(f"   - User exists: {'YES' if app['user_id'] else 'NO - ORPHANED'}")
            print(f"   - Email: {app['email'] or 'NULL'}")
            print(f"   - Status: {app['status']}")
            print(f"   - Submitted: {app['submitted_at']}")
    else:
        print("   No applications found")
else:
    print(f"   ❌ No job found with jd_id = '{jd_id}'")

conn.close()
