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

print("Deleting Orphaned Application")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# First, check what we're about to delete
print("\n1. Checking orphaned application details:")
cur.execute("""
    SELECT 
        ja.id,
        ja.candidate_id::text,
        ja.job_id::text,
        ja.status,
        ja.submitted_at
    FROM job_applications ja
    WHERE ja.candidate_id::text = '18c2f394-3c7e-519c-9232-7a4470c7868f'
""")
orphaned = cur.fetchall()

if not orphaned:
    print("   No orphaned application found. Already deleted?")
    conn.close()
    exit(0)

for app in orphaned:
    print(f"   Application ID: {app['id']}")
    print(f"   Candidate ID: {app['candidate_id']}")
    print(f"   Job ID: {app['job_id']}")
    print(f"   Status: {app['status']}")
    print(f"   Submitted: {app['submitted_at']}")

# Delete the orphaned application(s)
print("\n2. Deleting orphaned application...")
cur.execute("""
    DELETE FROM job_applications 
    WHERE candidate_id::text = '18c2f394-3c7e-519c-9232-7a4470c7868f'
""")
deleted_count = cur.rowcount
conn.commit()

print(f"   ✅ Deleted {deleted_count} orphaned application(s)")

# Verify the CFO job now shows only valid applicants
print("\n3. Verifying CFO job applications:")
cur.execute("""
    SELECT 
        ja.id,
        ja.candidate_id::text,
        u.email,
        ja.status,
        ja.submitted_at
    FROM job_applications ja
    LEFT JOIN users u ON ja.candidate_id::text = u.id::text
    WHERE ja.job_id::text = '756'
    ORDER BY ja.submitted_at DESC
""")
remaining = cur.fetchall()

print(f"   Total applications now: {len(remaining)}")
for app in remaining:
    print(f"   - {app['email']} (Status: {app['status']})")

conn.close()

print("\n✅ Cleanup complete! CFO job now shows only valid applicants.")
