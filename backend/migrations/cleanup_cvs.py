
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

def migrate_cvs():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cur = conn.cursor()
    
    try:
        print("--- MIGRATION: STANDARDIZE USER_CVS ---")

        # 1. Clean user_cvs
        print("Cleaning non-numeric user_ids from user_cvs...")
        cur.execute("DELETE FROM user_cvs WHERE user_id !~ '^[0-9]+$'")
        print(f"Deleted {cur.rowcount} invalid CVs.")
        
        # 2. ALTER user_cvs
        print("Migrating user_cvs.user_id to INTEGER...")
        cur.execute("ALTER TABLE user_cvs ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
        
        # 3. Add FK
        try:
            cur.execute("ALTER TABLE user_cvs ADD CONSTRAINT fk_cvs_user FOREIGN KEY (user_id) REFERENCES users(id)")
            print("Added FK constraint fk_cvs_user.")
        except psycopg2.errors.DuplicateObject:
            print("FK fk_cvs_user already exists.")
            conn.rollback()

        conn.commit()
        print("--- CV MIGRATION COMPLETE ---")

    except Exception as e:
        print(f"Migration Failed: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_cvs()
