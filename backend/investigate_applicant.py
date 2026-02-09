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

print("Investigating CFO Application - User 73 vs Majed Alsharif")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Check User 73
print("\n1. Checking User 73:")
cur.execute("""
    SELECT id::text, email, user_type
    FROM users
    WHERE id::text = '73'
""")
user73 = cur.fetchone()
if user73:
    print(f"   User 73 exists:")
    print(f"   - Email: {user73['email']}")
    print(f"   - Type: {user73['user_type']}")
else:
    print("   ⚠️  User 73 NOT FOUND in database!")

# Check current CFO applications
print("\n2. Current CFO job applications:")
cur.execute("""
    SELECT 
        ja.id,
        ja.candidate_id::text,
        ja.status,
        ja.submitted_at,
        u.id::text as user_id,
        u.email,
        u.user_type
    FROM job_applications ja
    LEFT JOIN users u ON ja.candidate_id::text = u.id::text
    WHERE ja.job_id::text = '756'
    ORDER BY ja.submitted_at DESC
""")
apps = cur.fetchall()

if not apps:
    print("   No applications found!")
else:
    print(f"   Found {len(apps)} application(s):")
    for app in apps:
        print(f"\n   Application: {app['id']}")
        print(f"   - Candidate ID: {app['candidate_id']}")
        print(f"   - User exists: {'Yes' if app['user_id'] else 'NO'}")
        print(f"   - Email: {app['email'] or 'NULL'}")
        print(f"   - User Type: {app['user_type'] or 'N/A'}")
        print(f"   - Status: {app['status']}")
        print(f"   - Submitted: {app['submitted_at']}")

# Check who Majed Alsharif is
print("\n3. Searching for 'Majed Alsharif':")
cur.execute("""
    SELECT id::text, email, user_type
    FROM users
    WHERE LOWER(email) LIKE '%majed%' OR LOWER(email) LIKE '%alsharif%'
""")
majed = cur.fetchall()
if majed:
    for user in majed:
        print(f"   - User ID: {user['id']}")
        print(f"     Email: {user['email']}")
        print(f"     Type: {user['user_type']}")
else:
    print("   No users found matching 'Majed Alsharif'")

# Check recent applications from User 73
print("\n4. All applications from User 73:")
cur.execute("""
    SELECT 
        ja.id,
        ja.job_id::text,
        jp.title as job_title,
        ja.status,
        ja.submitted_at
    FROM job_applications ja
    LEFT JOIN job_postings jp ON ja.job_id::text = jp.id::text
    WHERE ja.candidate_id::text = '73'
    ORDER BY ja.submitted_at DESC
    LIMIT 5
""")
user73_apps = cur.fetchall()
if user73_apps:
    print(f"   Found {len(user73_apps)} application(s) from User 73:")
    for app in user73_apps:
        print(f"   - {app['job_title']} (Job {app['job_id']})")
        print(f"     Status: {app['status']}, Submitted: {app['submitted_at']}")
else:
    print("   No applications found from User 73")

conn.close()
