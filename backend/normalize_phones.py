"""Normalize all phone numbers to E.164 format and remove resulting duplicates."""
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

# Step 1: Find all non-E.164 phones
cur.execute("""
    SELECT id, email, phone, first_name, last_name, role
    FROM users
    WHERE phone IS NOT NULL 
      AND phone != ''
      AND phone NOT LIKE '+%'
    ORDER BY phone
""")
non_e164 = cur.fetchall()
print(f"Non-E.164 phone numbers found: {len(non_e164)}\n")

for u in non_e164:
    old = u['phone']
    # Normalize
    if old.startswith('05'):
        new = '+971' + old[1:]
    elif old.startswith('5') and len(old) == 9:
        new = '+971' + old
    elif old.startswith('971') and not old.startswith('+'):
        new = '+' + old
    else:
        print(f"  SKIP (unknown format): {old} -> {u['email']}")
        continue
    
    # Check if normalized number already exists
    cur.execute("SELECT id, email FROM users WHERE phone = %s", (new,))
    existing = cur.fetchone()
    
    name = ((u.get('first_name') or '') + ' ' + (u.get('last_name') or '')).strip()
    
    if existing:
        # Duplicate! NULL out the test account's phone
        print(f"  DUPLICATE: {old} ({u['email']}, {name})")
        print(f"    Already exists as {new} -> {existing['email']}")
        print(f"    -> NULLing phone on {u['email']}")
        cur.execute("UPDATE users SET phone = NULL WHERE id = %s", (u['id'],))
    else:
        # Just normalize
        print(f"  NORMALIZE: {old} -> {new} ({u['email']}, {name})")
        cur.execute("UPDATE users SET phone = %s WHERE id = %s", (new, u['id']))

conn.commit()

# Verify
cur.execute("""
    SELECT phone, COUNT(*) as cnt FROM users
    WHERE phone IS NOT NULL
    GROUP BY phone HAVING COUNT(*) > 1
""")
remaining_dups = cur.fetchall()
if remaining_dups:
    print(f"\n⚠️  Remaining duplicates: {remaining_dups}")
else:
    print(f"\n✅ No duplicate phone numbers remain")

# Re-count magic OTP users
cur.execute("""
    SELECT COUNT(*) as cnt FROM users
    WHERE phone IS NOT NULL AND phone NOT LIKE '+%'
""")
non_e164_remaining = cur.fetchone()['cnt']
print(f"✅ Non-E.164 phones remaining: {non_e164_remaining}")

conn.close()
