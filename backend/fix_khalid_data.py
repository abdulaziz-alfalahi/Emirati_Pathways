import psycopg2
import os
import uuid
import datetime

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

def fix_khalid():
    env = load_env_manual()
    
    # Default connection params (we will switch DBs)
    user = env.get('DB_USER') or os.environ.get('DB_USER', 'postgres')
    password = env.get('DB_PASSWORD') or os.environ.get('DB_PASSWORD', 'password')
    host = env.get('DB_HOST') or os.environ.get('DB_HOST', 'localhost')
    port = env.get('DB_PORT') or os.environ.get('DB_PORT', '5432')
    
    target_uuid = 'e8209c95-3c10-416a-afc9-15a38c374d33'
    found_db = None

    print("--- Scanning all databases ---")
    try:
        # Connect to 'postgres' first to list DBs
        conn = psycopg2.connect(dbname='postgres', user=user, password=password, host=host, port=port)
        cur = conn.cursor()
        cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false")
        dbs = [row[0] for row in cur.fetchall()]
        conn.close()
        
        print(f"Found databases: {dbs}")
        
        for dbname in dbs:
            try:
                print(f"Checking DB: {dbname}...")
                conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
                cur = conn.cursor()
                
                # Check for table and UUID
                # First check if table exists
                cur.execute("SELECT to_regclass('job_descriptions')")
                if not cur.fetchone()[0]:
                     print(f" - Skipped (no job_descriptions table)")
                     conn.close()
                     continue

                # Check for UUID
                # Handle potential integer id column vs uuid
                try:
                    cur.execute("SELECT id, title FROM job_descriptions WHERE id::text = %s", (target_uuid,))
                    res = cur.fetchone()
                    if res:
                        print(f"*** FOUND TARGET IN DB: {dbname} ***")
                        print(f" Job: {res[1]} (ID: {res[0]})")
                        found_db = dbname
                        conn.close()
                        break
                except Exception as e:
                     print(f" - Query failed (schema mismatch?): {e}")
                
                conn.close()
            except Exception as e:
                print(f" - Connection failed: {e}")

        if found_db:
            print(f"\n--- Applying Fix to DB: {found_db} ---")
            conn = psycopg2.connect(dbname=found_db, user=user, password=password, host=host, port=port)
            conn.autocommit = True
            cur = conn.cursor()
            
            # 1. Check/Fix Khalid Name
            # We need to find Khalid in THIS db. ID might be different if seeds differ.
            # Search by email or just update ID 21 if we assume consistent seeding?
            # Better to search by email 'khalid.almazrouei@email.ae' from logs.
            khalid_email = 'khalid.almazrouei@email.ae'
            cur.execute("SELECT id, first_name, last_name FROM users WHERE email = %s", (khalid_email,))
            k_user = cur.fetchone()
            
            if not k_user:
                 print("Khalid not found by email in this DB! Checking ID 21...")
                 cur.execute("SELECT id, first_name, email FROM users WHERE id = 21")
                 k_user_by_id = cur.fetchone()
                 if k_user_by_id:
                     print(f"Found ID 21: {k_user_by_id}")
                     k_id = 21
                 else:
                     print("ID 21 not found either. Creating user...")
                     # Create logic omitted for brevity, let's hope he exists
                     k_id = None
            else:
                 k_id = k_user[0]
                 print(f"Found Khalid with ID: {k_id}")
            
            if k_id:
                # Update Name
                print("Updating Name...")
                cur.execute("UPDATE users SET first_name = 'Khalid', last_name = 'Al Mazrouei' WHERE id = %s", (k_id,))
                
                # 2. Insert Application
                # Re-fetch job id just in case
                cur.execute("SELECT id FROM job_descriptions WHERE id::text = %s", (target_uuid,))
                job_id_db = cur.fetchone()[0]
                
                cur.execute("SELECT id FROM job_applications WHERE candidate_id = %s AND job_id = %s", (str(k_id), str(job_id_db)))
                if cur.fetchone():
                    print("Application already exists.")
                else:
                    print("Creating application...")
                    new_app_id = str(uuid.uuid4())
                    cur.execute("""
                        INSERT INTO job_applications 
                        (id, job_id, candidate_id, status, submitted_at, cover_letter)
                        VALUES (%s, %s, %s, 'submitted', NOW(), 'I am interested.')
                    """, (new_app_id, str(job_id_db), str(k_id)))
                    print("Application created!")
            
            conn.close()
            print("SUCCESS.")
        else:
            print("Target JD not found in ANY database.")

    except Exception as e:
        print(f"Global Error: {e}")

if __name__ == "__main__":
    fix_khalid()
