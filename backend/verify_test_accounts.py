import psycopg2
import psycopg2.extras
import os

conn = psycopg2.connect(
    host='localhost',
    database='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    port=5432
)
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Get test users
cur.execute("""
    SELECT id, phone, full_name, role FROM users 
    WHERE phone IN ('+971500001001', '+971500001002', '+971500001003')
""")
rows = cur.fetchall()

print("=" * 60)
print("TEST ACCOUNTS VERIFICATION")
print("=" * 60)
for r in rows:
    print(f"  {r['full_name']}")
    print(f"    Phone: {r['phone']}")
    print(f"    Role:  {r['role']}")
    print(f"    ID:    {r['id']}")
    print()

# Get company
cur.execute("SELECT id, name FROM companies WHERE name = 'Test Team Chat Company'")
company = cur.fetchone()
if company:
    print(f"Company: {company['name']}")
    print(f"Company ID: {company['id']}")
else:
    print("Company not found!")

conn.close()
