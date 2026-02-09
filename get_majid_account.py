import psycopg2
import psycopg2.extras
import os

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=os.getenv('DB_PORT', 5432)
)

cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Get Majid's account details
print("=== Majid Alsharif Account Details ===\n")
cur.execute("""
    SELECT 
        id,
        email,
        phone,
        first_name,
        last_name,
        role,
        created_at,
        is_active
    FROM users 
    WHERE id = 81
""")

user = cur.fetchone()

if user:
    print(f"User ID: {user['id']}")
    print(f"Name: {user['first_name']} {user['last_name']}")
    print(f"Email: {user['email']}")
    print(f"Phone: {user['phone']}")
    print(f"Role: {user['role']}")
    print(f"Active: {user['is_active']}")
    print(f"Created: {user['created_at']}")
    
    print(f"\n=== Login Information ===")
    print(f"Login Method: OTP (One-Time Password)")
    print(f"Phone Number: {user['phone']}")
    
    print(f"\n=== How to Sign In ===")
    print(f"1. Go to the login page")
    print(f"2. Enter phone number: {user['phone']}")
    print(f"3. Request OTP code")
    print(f"4. Check backend console for OTP code")
    print(f"5. Enter OTP to sign in")
    
    # Check if there are any recent OTP codes in the database
    print(f"\n=== Checking for OTP History ===")
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name IN ('otp_codes', 'auth_codes', 'verification_codes')
    """)
    otp_tables = cur.fetchall()
    
    if otp_tables:
        for table in otp_tables:
            print(f"Found table: {table['table_name']}")
            cur.execute(f"SELECT * FROM {table['table_name']} WHERE phone = %s OR user_id = %s ORDER BY created_at DESC LIMIT 3", (user['phone'], user['id']))
            codes = cur.fetchall()
            if codes:
                print(f"  Recent codes:")
                for code in codes:
                    print(f"    {dict(code)}")
    else:
        print("No OTP tables found - check backend logs for OTP codes")
        
else:
    print("User not found!")

cur.close()
conn.close()
