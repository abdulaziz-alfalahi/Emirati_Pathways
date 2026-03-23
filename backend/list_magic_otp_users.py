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
    '+971500000000', '+971502345678', '+971503456789', '+971501234567',
    '+971507890123', '+971509999999', '+971509998888', '+971509998889',
    '+971509998890', '+971509998891', '+971509998892', '+971509998893',
    '+971509998894', '+971550000010', '+971550000011', '+971550000012',
    '+971550000013', '+971550000014', '+971550000015', '+971550000016',
    '+971500001001',
    '+971500001002', '+971500001003', '+971500001004', '+971509998901',
    '+971509998902', '+971509998903', '+971509998904',
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

