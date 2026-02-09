"""
Investigation: Data leakage between HR Manager accounts
Checking company linkage for Sara Saeed and Test HR Manager
"""

import psycopg2
import psycopg2.extras

conn = psycopg2.connect(
    host='localhost',
    database='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    port=5432
)
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

print("=" * 70)
print("DATA LEAKAGE INVESTIGATION")
print("=" * 70)

# 1. Find Sara Saeed and Zara Saeed users
print("\n1. FINDING SARA/ZARA SAEED USERS:")
cur.execute("""
    SELECT id, phone, email, full_name, role 
    FROM users 
    WHERE full_name ILIKE '%sara%' OR full_name ILIKE '%zara%' OR phone = '+971502345678'
""")
for r in cur.fetchall():
    print(f"   ID: {r['id']}, Name: {r['full_name']}, Phone: {r['phone']}, Role: {r['role']}")

# 2. Find Test HR Manager
print("\n2. FINDING TEST HR MANAGER 1:")
cur.execute("""
    SELECT id, phone, email, full_name, role 
    FROM users 
    WHERE phone = '+971500001001'
""")
for r in cur.fetchall():
    print(f"   ID: {r['id']}, Name: {r['full_name']}, Phone: {r['phone']}, Role: {r['role']}")

# 3. Check HR profiles for both
print("\n3. HR PROFILES - COMPANY LINKAGE:")
cur.execute("""
    SELECT u.id, u.full_name, u.phone, hp.company_id, 
           COALESCE(c.name, c.company_name) as company_name
    FROM users u
    LEFT JOIN hr_profiles hp ON u.id = hp.user_id
    LEFT JOIN companies c ON hp.company_id::text = c.id::text
    WHERE u.phone IN ('+971502345678', '+971500001001', '+971500001002', '+971500001003')
""")
for r in cur.fetchall():
    print(f"   {r['full_name']} ({r['phone']})")
    print(f"     -> Company: {r['company_name'] or 'NO COMPANY'}")
    print(f"     -> Company ID: {r['company_id'] or 'NO LINK'}")
    print()

# 4. Check approval requests - what company are they associated with?
print("\n4. OFFER APPROVAL REQUESTS - CHECKING COMPANY SCOPE:")
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'offer_approval_requests'
""")
cols = [r['column_name'] for r in cur.fetchall()]
print(f"   Columns: {cols}")

cur.execute("""
    SELECT id, company_id, job_title, candidate_name, status, created_at
    FROM offer_approval_requests
    ORDER BY created_at DESC
    LIMIT 5
""")
print("\n   Recent Approval Requests:")
for r in cur.fetchall():
    print(f"   - Job: {r['job_title']}, Candidate: {r['candidate_name']}")
    print(f"     Company ID: {r['company_id']}, Status: {r['status']}")
    print()

# 5. List all companies and their linked users
print("\n5. ALL COMPANIES AND THEIR HR PROFILES:")
cur.execute("""
    SELECT c.id, COALESCE(c.name, c.company_name) as company_name, 
           array_agg(u.full_name) as users
    FROM companies c
    LEFT JOIN hr_profiles hp ON c.id::text = hp.company_id::text
    LEFT JOIN users u ON hp.user_id = u.id
    GROUP BY c.id, c.name, c.company_name
    ORDER BY company_name
""")
for r in cur.fetchall():
    users_list = [u for u in (r['users'] or []) if u]
    print(f"   {r['company_name']}: {users_list if users_list else 'NO USERS'}")
    print(f"     ID: {str(r['id'])[:36]}")
    print()

conn.close()
print("=" * 70)
