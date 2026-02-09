#!/usr/bin/env python3
"""
Quick script to delete broken CFO application and verify User 73 exists
Run this AFTER restarting the backend server
"""
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

print("=" * 70)
print("CLEANUP AND VERIFICATION SCRIPT")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Step 1: Delete broken CFO applications
print("\n[1/3] Deleting all CFO applications...")
cur.execute("DELETE FROM job_applications WHERE job_id::text = '756'")
deleted = cur.rowcount
conn.commit()
print(f"   ✅ Deleted {deleted} application(s)")

# Step 2: Verify User 73 exists
print("\n[2/3] Verifying User 73 exists...")
cur.execute("""
    SELECT id::text, email, user_type
    FROM users
    WHERE id::text = '73'
""")
user = cur.fetchone()
if user:
    print(f"   ✅ User 73 found")
    print(f"      Email: {user['email']}")
    print(f"      Type: {user['user_type']}")
else:
    print(f"   ❌ ERROR: User 73 not found!")
    print(f"      Cannot proceed with testing")
    conn.close()
    exit(1)

# Step 3: Check recruiter can see the job
print("\n[3/3] Verifying CFO job exists...")
cur.execute("""
    SELECT id::text, title, recruiter_id::text, status
    FROM job_postings
    WHERE id::text = '756'
""")
job = cur.fetchone()
if job:
    print(f"   ✅ CFO job found")
    print(f"      Title: {job['title']}")
    print(f"      Recruiter: User {job['recruiter_id']}")
    print(f"      Status: {job['status']}")
else:
    print(f"   ❌ ERROR: CFO job not found!")

conn.close()

print("\n" + "=" * 70)
print("✅ READY FOR TESTING")
print("=" * 70)
print("\nNext steps:")
print("  1. Login as User 73 (job seeker)")
print("  2. Apply to CFO job")
print("  3. Check recruiter dashboard")
print("  4. Should show User 73's email, not 'Majed Alsharif'")
print()
