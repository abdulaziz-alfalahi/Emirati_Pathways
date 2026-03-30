"""List all users who can use the magic OTP 123456"""
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    database=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'postgres'),
    password=os.getenv('DB_PASSWORD', ''),
    port=int(os.getenv('DB_PORT', 5432))
)

cur = conn.cursor(cursor_factory=RealDictCursor)

magic_phones = [
    '+971510000000', '+971512345678', '+971513456789', '+971511234567',
    '+971517890123', '+971519999999', '+971519998888', '+971519998889',
    '+971519998890', '+971519998891', '+971519998892', '+971519998893',
    '+971519998894', '+971510000010', '+971510000011', '+971510000012',
    '+971510000013', '+971510000014', '+971510000015', '+971510000016',
    '+971510001001',
    '+971510001002', '+971510001003', '+971510001004', '+971519998901',
    '+971519998902', '+971519998903', '+971519998904',
    '+971510000017', '+971510000018',
    '+971519234567',
]

cur.execute("""
    SELECT id, email, full_name, first_name, last_name, user_type, phone
    FROM users
    WHERE phone = ANY(%s) OR phone LIKE '%%1234567'
    ORDER BY user_type, email
""", (magic_phones,))

rows = cur.fetchall()

with open('magic_otp_users.txt', 'w', encoding='utf-8') as f:
    f.write(f"Users with magic OTP (123456): {len(rows)}\n\n")
    for r in rows:
        name = r.get('full_name') or ((r.get('first_name') or '') + ' ' + (r.get('last_name') or '')).strip() or '(no name)'
        phone = r.get('phone') or '(no phone)'
        role = r.get('user_type') or '(no role)'
        email = r.get('email') or '(no email)'
        f.write(f"{phone:<20} | {name:<30} | {role:<35} | {email}\n")

print(f"Written {len(rows)} users to magic_otp_users.txt")
conn.close()

