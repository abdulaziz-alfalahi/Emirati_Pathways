
import psycopg2
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def update_schema():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("Updating job_postings table...")
        try:
            cur.execute("ALTER TABLE job_postings ADD COLUMN latitude FLOAT;")
            print("Added latitude to job_postings")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("latitude already exists in job_postings")
        except Exception as e:
             conn.rollback()
             print(f"Error adding latitude: {e}")

        try:
            cur.execute("ALTER TABLE job_postings ADD COLUMN longitude FLOAT;")
            print("Added longitude to job_postings")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("longitude already exists in job_postings")
        except Exception as e:
             conn.rollback()
             print(f"Error adding longitude: {e}")

        conn.commit()
        cur.close()
        conn.close()
        print("Schema update complete.")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    update_schema()
