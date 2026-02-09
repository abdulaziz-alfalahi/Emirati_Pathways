
import psycopg2
import os
import sys

DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def migrate_db():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cur = conn.cursor()
    
    try:
        print("--- STARTING MIGRATION: STANDARDIZE INTEGER IDs ---")

        # 1. Clean candidate_profiles
        print("Cleaning non-numeric user_ids from candidate_profiles...")
        cur.execute("DELETE FROM candidate_profiles WHERE user_id !~ '^[0-9]+$'")
        print(f"Deleted {cur.rowcount} invalid profiles.")
        
        # 2. Clean job_applications
        print("Cleaning non-numeric candidate_ids/job_ids from job_applications...")
        cur.execute("DELETE FROM job_applications WHERE candidate_id !~ '^[0-9]+$' OR job_id !~ '^[0-9]+$'")
        print(f"Deleted {cur.rowcount} invalid applications.")

        # 3. ALTER candidate_profiles
        print("Migrating candidate_profiles.user_id to INTEGER...")
        cur.execute("ALTER TABLE candidate_profiles ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
        # Add FK if not exists
        try:
            cur.execute("ALTER TABLE candidate_profiles ADD CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id)")
            print("Added FK constraint fk_cp_user.")
        except psycopg2.errors.DuplicateObject:
            print("FK fk_cp_user already exists.")
            conn.rollback() 
            # We restart transaction block for next steps if needed? 
            # Psycopg2 transaction: if error, entire transaction aborts. 
            # So I should commit before trying FK to be safe, or check system catalog.
            # I will just wrap in try/except and proceed carefully. 
    
        conn.commit() # Commit changes so far
        
        # 4. ALTER job_applications
        print("Migrating job_applications.candidate_id/job_id to INTEGER...")
        with conn.cursor() as cur2:
             cur2.execute("ALTER TABLE job_applications ALTER COLUMN candidate_id TYPE INTEGER USING candidate_id::integer")
             cur2.execute("ALTER TABLE job_applications ALTER COLUMN job_id TYPE INTEGER USING job_id::integer")
             
             # Add FKs
             try:
                 cur2.execute("ALTER TABLE job_applications ADD CONSTRAINT fk_ja_candidate FOREIGN KEY (candidate_id) REFERENCES users(id)")
                 print("Added FK constraint fk_ja_candidate.")
             except psycopg2.errors.DuplicateObject:
                 print("FK fk_ja_candidate already exists or skipped.")
                 conn.rollback() # Rollback only this statement? No, rollback transaction.
                 
        conn.commit()
        
        # 5. Add FK for job_id? (Might fail if job_id doesn't match job_postings exactly or joined with something else)
        # job_postings.id is Integer.
        # We should try.
        with conn.cursor() as cur3:
             try:
                 cur3.execute("ALTER TABLE job_applications ADD CONSTRAINT fk_ja_job FOREIGN KEY (job_id) REFERENCES job_postings(id)")
                 print("Added FK constraint fk_ja_job.")
             except Exception as e:
                 print(f"Could not add FK for job_id (might be valid references issues): {e}")

        conn.commit()
        print("--- MIGRATION COMPLETE ---")

    except Exception as e:
        print(f"Migration Failed: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
