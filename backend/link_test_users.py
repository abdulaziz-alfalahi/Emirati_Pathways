"""
Link test users to company via hr_profiles
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

try:
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Get company ID
    cursor.execute("SELECT id FROM companies WHERE name = 'Test Team Chat Company'")
    company = cursor.fetchone()
    if not company:
        print("Company not found!")
        exit()
    company_id = company['id']
    print(f"Company ID: {company_id}")
    
    # Get users and link them
    cursor.execute("SELECT id, full_name, role FROM users WHERE phone LIKE '+97150000100%'")
    users = cursor.fetchall()
    
    for user in users:
        user_id = user['id']
        full_name = user['full_name']
        position = 'HR Manager' if user['role'] == 'hr_manager' else 'Recruiter'
        
        # Check if profile exists
        cursor.execute("SELECT id FROM hr_profiles WHERE user_id = %s", (user_id,))
        if cursor.fetchone():
            cursor.execute("""
                UPDATE hr_profiles SET company_id = %s, position_title = %s WHERE user_id = %s
            """, (company_id, position, user_id))
            print(f"Updated HR Profile for {full_name}")
        else:
            cursor.execute("""
                INSERT INTO hr_profiles (user_id, company_id, department, position_title)
                VALUES (%s, %s, 'HR', %s)
            """, (user_id, company_id, position))
            print(f"Created HR Profile for {full_name}")
    
    conn.commit()
    print("\nDone! All users linked to company.")
    
    # Verify
    print("\nVerification:")
    cursor.execute("""
        SELECT u.full_name, u.phone, u.role, hp.company_id, c.name as company_name
        FROM users u
        LEFT JOIN hr_profiles hp ON u.id = hp.user_id
        LEFT JOIN companies c ON hp.company_id::text = c.id::text
        WHERE u.phone LIKE '+97150000100%'
    """)
    for r in cursor.fetchall():
        print(f"  {r['full_name']}: {r['phone']} -> Company: {r['company_name']}")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
finally:
    conn.close()
