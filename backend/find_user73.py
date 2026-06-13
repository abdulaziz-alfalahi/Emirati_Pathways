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

print("Fixing CFO Application - Updating to User 73")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Get User 73's real ID
print("\n1. Finding User 73's UUID:")
cur.execute("""
    SELECT id::text as uuid, email, user_type
    FROM users
    WHERE id::text = '73'
       OR email LIKE '%73%'
    LIMIT 5
""")
users = cur.fetchall()
if users:
    for u in users:
        print(f"   - UUID: {u['uuid']}, Email: {u['email']}, Type: {u['user_type']}")
else:
    print("   No user found with ID 73 or email containing '73'")

# Check the current broken application
print("\n2. Current broken CFO application:")
cur.execute("""
    SELECT id, candidate_id::text, submitted_at
    FROM job_applications
    WHERE job_id::text = '756'
""")
app = cur.fetchone()
if app:
    print(f"   Application: {app['id']}")
    print(f"   Wrong Candidate ID: {app['candidate_id']}")
    print(f"   Submitted: {app['submitted_at']}")
    
    # Now we need to find the RIGHT user ID
    # Let's check who logged in recently
    print("\n3. Looking for recent job seeker logins:")
    cur.execute("""
        SELECT id::text, email, user_type
        FROM users
        WHERE user_type IN ('candidate', 'candidate')
        ORDER BY id DESC
        LIMIT 10
    """)
    recent_users = cur.fetchall()
    for ru in recent_users:
        print(f"   - ID: {ru['id']}, Email: {ru['email']}")

conn.close()

print("\n⚠️  Need to identify correct user ID before updating application")
