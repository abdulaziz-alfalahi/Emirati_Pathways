
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
        
        # Add columns to user_cvs
        print("Updating user_cvs table...")
        try:
            cur.execute("ALTER TABLE user_cvs ADD COLUMN latitude FLOAT;")
            print("Added latitude to user_cvs")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("latitude already exists in user_cvs")
        except Exception as e:
             conn.rollback()
             print(f"Error adding latitude: {e}")

        try:
            cur.execute("ALTER TABLE user_cvs ADD COLUMN longitude FLOAT;")
            print("Added longitude to user_cvs")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("longitude already exists in user_cvs")
        except Exception as e:
             conn.rollback()
             print(f"Error adding longitude: {e}")

        # Add columns to recruiter_vacancies
        print("Updating recruiter_vacancies table...")
        try:
            cur.execute("ALTER TABLE recruiter_vacancies ADD COLUMN latitude FLOAT;")
            print("Added latitude to recruiter_vacancies")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("latitude already exists in recruiter_vacancies")
        except psycopg2.errors.UndefinedTable:
             conn.rollback()
             print("recruiter_vacancies table does not exist.")
        except Exception as e:
             conn.rollback()
             print(f"Error adding latitude: {e}")

        try:
            cur.execute("ALTER TABLE recruiter_vacancies ADD COLUMN longitude FLOAT;")
            print("Added longitude to recruiter_vacancies")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("longitude already exists in recruiter_vacancies")
        except psycopg2.errors.UndefinedTable:
             conn.rollback()
             print("recruiter_vacancies table does not exist.")
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
