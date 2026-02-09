
import psycopg2
import datetime

def create_internship():
    DB_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'emirati_journey',
        'user': 'emirati_user',
        'password': 'emirati_secure_password'
    }

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Inserting sample internship...")
        # Note: Added jd_id=1, recruiter_id=1, company_id=UUID
        cursor.execute("""
            INSERT INTO job_postings (
                title, employment_type, location, 
                salary_range_min, salary_range_max, posted_date, 
                description, status, created_by, 
                jd_id, recruiter_id, company_id
            )
            VALUES 
            ('Software Engineering Intern', 'Internship', 'Dubai Internet City', 
             3000, 5000, NOW(), 
             'Great opportunity for students', 'open', 1, 
             1, 1, '7e5edea0-ea73-436c-b7ed-f47cfe57423a')
        """)
        
        print("✅ Sample internship created.")
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_internship()
