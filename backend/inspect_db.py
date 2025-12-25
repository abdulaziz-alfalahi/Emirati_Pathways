
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
    
    print("Checking tables...")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = cur.fetchall()
    print("Tables:", [t[0] for t in tables])

    if 'companies' in [t[0] for t in tables]:
        print("\nChecking companies table...")
        cur.execute("SELECT id, name FROM companies LIMIT 5;")
        rows = cur.fetchall()
        print("Companies:", rows)
    else:
        print("\nCompanies table not found")

    if 'company_team_members' in [t[0] for t in tables]:
        print("\nChecking company_team_members schema...")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_team_members';")
        rows = cur.fetchall()
        print("Schema:", rows)

    conn.close()
except Exception as e:
    print(f"Error: {e}")
