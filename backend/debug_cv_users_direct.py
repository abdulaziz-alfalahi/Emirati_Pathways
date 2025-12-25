
import psycopg2
import os
from pathlib import Path

# Manual .env loading
env_path = Path('.env')
if env_path.exists():
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            if not os.getenv(k):
                os.environ[k] = v

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

print(f"Connecting to DB: {DB_CONFIG['user']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # 1. Count by User ID
    print("\n[+] CV Counts by User ID:")
    cur.execute("SELECT user_id, COUNT(*), MIN(title) FROM user_cvs GROUP BY user_id")
    rows = cur.fetchall()
    for r in rows:
        print(f"User: {r[0]} | Count: {r[1]} | Sample: {r[2]}")
        
    # 2. Check for 'Ahmed' or 'Khalid' in Personal Info
    print("\n[+] Searching for Names in CV Data:")
    cur.execute("SELECT user_id, personal_info->>'firstName', personal_info->>'lastName', title FROM user_cvs")
    rows = cur.fetchall()
    for r in rows:
        print(f"User: {r[0]} | Name: {r[1]} {r[2]} | Title: {r[3]}")
        
    conn.close()

except Exception as e:
    print(f"DB Error: {e}")
