import psycopg2
import os

def load_env_manual():
    env_vars = {}
    try:
        with open(os.path.join(os.path.dirname(__file__), '.env'), 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except Exception as e:
        print(f"Error reading .env: {e}")
    return env_vars

def check_khalid():
    env = load_env_manual()
    
    # Fallover to os.environ if not in .env (or use defaults)
    dbname = env.get('DB_NAME') or os.environ.get('DB_NAME', 'emirati_pathway_db')
    user = env.get('DB_USER') or os.environ.get('DB_USER', 'postgres')
    password = env.get('DB_PASSWORD') or os.environ.get('DB_PASSWORD', 'password')
    host = env.get('DB_HOST') or os.environ.get('DB_HOST', 'localhost')
    port = env.get('DB_PORT') or os.environ.get('DB_PORT', '5432')

    print(f"Connecting to DB: {dbname} as {user}")

    try:
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )
        cur = conn.cursor()
        
        # 1. List ALL Users to see what we have
        print("Listing ALL Users:")
        cur.execute("SELECT id, first_name, last_name, email, role FROM users LIMIT 50")
        all_users = cur.fetchall()
        for u in all_users:
            print(f" - ID: {u[0]}, Name: '{u[1]} {u[2]}', Email: {u[3]}, Role: {u[4]}")
            
        # 2. Find HR Coordinator Job ID
        cur.execute("SELECT jd_id, title FROM job_descriptions WHERE title ILIKE '%HR Coordinator%'")
        jobs = cur.fetchall()
        print("\nJob IDs for 'HR Coordinator':")
        for j in jobs:
            print(f" - ID: {j[0]}, Title: {j[1]}")
            
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    check_khalid()
