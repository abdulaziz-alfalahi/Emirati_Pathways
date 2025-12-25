
import psycopg2
import psycopg2.extras
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def debug_shortlist_insert():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False # Test transaction
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Hardcoded for Zara Saeed (ID 47) and job 29
        current_user_id = 47
        job_id = 29
        
        # Candidate ID from frontend calls? Usually an integer for candidates.
        # Let's pick a valid candidate.
        cursor.execute("SELECT id FROM users WHERE role = 'candidate' LIMIT 1")
        candidate = cursor.fetchone()
        candidate_id = candidate['id'] if candidate else 52 # Fallback
        
        print(f"Debug: Adding Candidate {candidate_id} to Job {job_id} by User {current_user_id}")
        
        # 1. Check table existence logic
        cursor.execute("SELECT to_regclass('public.job_shortlists') as exists")
        if not cursor.fetchone()['exists']:
            print("Table doesn't exist, attempting creation logic...")
            cursor.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'id'")
            row = cursor.fetchone()
            id_type = row['data_type'] if row else 'UUID'
            
            print(f"Job Posting ID Type: {id_type}")
            
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS job_shortlists (
                    job_posting_id {id_type} REFERENCES job_postings(id) ON DELETE CASCADE,
                    candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (job_posting_id, candidate_id)
                )
            """)
            conn.commit() # Commit the table creation
            print("Table creation query executed and committed.")

        # 2. Attempt Insert
        params = (job_id, candidate_id, current_user_id, "Debug Note")
        print(f"Executing INSERT with params: {params}")
        
        cursor.execute("""
            INSERT INTO job_shortlists (job_posting_id, candidate_id, added_by, notes)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (job_posting_id, candidate_id) 
            DO UPDATE SET notes = EXCLUDED.notes
            RETURNING *
        """, params)
        
        row = cursor.fetchone()
        print(f"✅ Success! Inserted: {row}")
        conn.rollback() # Don't actually save

    except Exception as e:
        print(f"❌ SQL Execution Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    debug_shortlist_insert()
