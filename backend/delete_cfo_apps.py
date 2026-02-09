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

print("Deleting CFO Job Applications for Testing")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Check current applications
print("\n1. Current applications for CFO job (ID: 756):")
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
""")
apps = cur.fetchall()

if not apps:
    print("   No applications found for CFO job.")
    conn.close()
    exit(0)

print(f"   Found {len(apps)} application(s):")
for app in apps:
    print(f"   - Application ID: {app['id']}")
    print(f"     Candidate: {app['candidate_id']}")
    print(f"     Email: {app['email'] or 'NULL'}")
    print(f"     Status: {app['status']}")
    print()

# Delete all applications for CFO job
print("2. Deleting all applications for CFO job...")
cur.execute("""
    DELETE FROM job_applications 
    WHERE job_id::text = '756'
""")
deleted_count = cur.rowcount
conn.commit()

print(f"   ✅ Deleted {deleted_count} application(s)")

# Verify deletion
print("\n3. Verifying deletion:")
cur.execute("""
    SELECT COUNT(*) as count
    FROM job_applications 
    WHERE job_id::text = '756'
""")
remaining = cur.fetchone()['count']

if remaining == 0:
    print("   ✅ CFO job has no applications - ready for fresh testing!")
else:
    print(f"   ⚠️  Warning: {remaining} applications still remain")

conn.close()

print("\n✅ Cleanup complete! You can now test the application flow from scratch.")
