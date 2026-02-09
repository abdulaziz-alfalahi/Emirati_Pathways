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

print("Complete CFO Application Analysis")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Get all CFO applications with full details
cur.execute("""
    SELECT 
        ja.id,
        ja.candidate_id::text,
        ja.status,
        ja.submitted_at,
        COALESCE(u.email, 'USER NOT FOUND') as candidate_email,
        CASE 
            WHEN u.id IS NULL THEN 'ORPHANED - User deleted or never existed'
            ELSE 'Valid'
        END as user_status
    FROM job_applications ja
    LEFT JOIN users u ON ja.candidate_id::text = u.id::text
    WHERE ja.job_id::text = '756'
    ORDER BY ja.submitted_at DESC
""")
apps = cur.fetchall()

print(f"\nTotal Applications for CFO Job: {len(apps)}\n")

for i, app in enumerate(apps, 1):
    print(f"Application #{i}:")
    print(f"  ID: {app['id']}")
    print(f"  Candidate ID: {app['candidate_id']}")
    print(f"  Email: {app['candidate_email']}")
    print(f"  Status: {app['status']}")
    print(f"  Submitted: {app['submitted_at']}")
    print(f"  User Status: {app['user_status']}")
    print()

# Check if we should clean up orphaned applications
orphaned = [app for app in apps if 'ORPHANED' in app['user_status']]
if orphaned:
    print(f"⚠️  Found {len(orphaned)} orphaned application(s) (candidate not in users table)")
    print("   These should be cleaned up or the user should be recreated.")

conn.close()
