"""
Investigation: Why does dashboard show Sara Saeed for test HR Manager?
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
print("INVESTIGATION: Sara Saeed Data Confusion")
print("=" * 70)

# 1. Check user with test phone
print("\n1. USER WITH PHONE +971500001001:")
cur.execute("SELECT id, phone, email, full_name, first_name, last_name, role FROM users WHERE phone = %s", ('+971500001001',))
user = cur.fetchone()
if user:
    print(f"   ID: {user['id']}")
    print(f"   Full Name: {user['full_name']}")
    print(f"   First/Last: {user['first_name']} / {user['last_name']}")
    print(f"   Email: {user['email']}")
    print(f"   Role: {user['role']}")
else:
    print("   NOT FOUND!")

# 2. Check for any Sara/Zara Saeed users
print("\n2. SARA/ZARA SAEED USERS:")
cur.execute("SELECT id, phone, email, full_name, role FROM users WHERE full_name ILIKE '%sara%' OR full_name ILIKE '%zara%'")
for r in cur.fetchall():
    print(f"   ID: {r['id']}, Name: {r['full_name']}, Phone: {r['phone']}, Role: {r['role']}")

# 3. Check HR profiles for all users with similar phones
print("\n3. HR PROFILES FOR TEST USERS:")
cur.execute("""
    SELECT hp.user_id, u.full_name, hp.company_id, c.name as company_name, c.company_name as company_name_alt
    FROM hr_profiles hp 
    JOIN users u ON hp.user_id = u.id 
    LEFT JOIN companies c ON hp.company_id::text = c.id::text 
    WHERE u.phone LIKE '+97150000100%'
""")
for r in cur.fetchall():
    print(f"   User ID: {r['user_id']}, Name: {r['full_name']}, Company: {r['company_name'] or r['company_name_alt']}")

# 4. Check approval history tables
print("\n4. APPROVAL HISTORY (checking table structure):")
cur.execute("""
    SELECT table_name FROM information_schema.tables 
    WHERE table_name LIKE '%approval%' OR table_name LIKE '%offer%'
""")
tables = [r['table_name'] for r in cur.fetchall()]
print(f"   Found tables: {tables}")

# 5. Check offer_approval_requests columns
if 'offer_approval_requests' in tables:
    print("\n5. OFFER APPROVAL REQUESTS COLUMNS:")
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'offer_approval_requests' ORDER BY ordinal_position
    """)
    cols = [r['column_name'] for r in cur.fetchall()]
    print(f"   Columns: {cols}")
    
    print("\n6. OFFER APPROVAL REQUESTS DATA:")
    cur.execute("SELECT * FROM offer_approval_requests ORDER BY created_at DESC LIMIT 3")
    for r in cur.fetchall():
        print(f"   {dict(r)}")

# 7. Check company linkage
print("\n7. COMPANY ASSIGNMENTS:")
cur.execute("""
    SELECT c.id, c.name, c.company_name, COUNT(hp.user_id) as user_count
    FROM companies c
    LEFT JOIN hr_profiles hp ON c.id::text = hp.company_id::text
    GROUP BY c.id, c.name, c.company_name
    ORDER BY user_count DESC
    LIMIT 10
""")
for r in cur.fetchall():
    print(f"   Company: {r['name'] or r['company_name']} | Users: {r['user_count']} | ID: {str(r['id'])[:20]}...")

# 8. Check if Zara Saeed shares a company with test users
print("\n8. CHECKING COMPANY OVERLAP (same company as test users):")
cur.execute("""
    SELECT u.id, u.full_name, u.phone, hp.company_id
    FROM users u
    JOIN hr_profiles hp ON u.id = hp.user_id
    WHERE hp.company_id IN (
        SELECT hp2.company_id FROM hr_profiles hp2 
        JOIN users u2 ON hp2.user_id = u2.id 
        WHERE u2.phone LIKE '+97150000100%'
    )
""")
for r in cur.fetchall():
    print(f"   ID: {r['id']}, Name: {r['full_name']}, Phone: {r['phone']}")

# 9. Check dashboard name source
print("\n9. CHECKING HOW DASHBOARD GETS NAME:")
# The dashboard may be using a different field or profile_data
cur.execute("""
    SELECT u.id, u.full_name, u.first_name, u.last_name, 
           hp.position_title, c.name as company_name
    FROM users u
    LEFT JOIN hr_profiles hp ON u.id = hp.user_id
    LEFT JOIN companies c ON hp.company_id::text = c.id::text
    WHERE u.id = 121
""")
r = cur.fetchone()
if r:
    print(f"   Full query result for user 121:")
    print(f"   {dict(r)}")

conn.close()
print("\n" + "=" * 70)
