
import psycopg2
import os

db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': os.getenv('DB_PORT', '5432')
}

try:
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    print("Checking company_team_members schema...")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_team_members';")
    rows = cur.fetchall()
    for row in rows:
        print(row)

    print("\nChecking companies table existence...")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'companies';")
    print(cur.fetchall())
    
    # If companies exists, get one ID
    try:
        cur.execute("SELECT id FROM companies LIMIT 1;")
        print("First company ID:", cur.fetchone())
    except:
        print("Could not query companies")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
