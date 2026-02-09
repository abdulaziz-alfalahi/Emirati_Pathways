
import psycopg2
import os

def apply_schema():
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
        
        with open('backend/create_scholarships_schema.sql', 'r') as f:
            schema_sql = f.read()
            
        cursor.execute(schema_sql)
        print("✅ Scholarships and Programs schema applied successfully.")
        
        # Insert some sample data if tables are empty
        cursor.execute("SELECT count(*) FROM scholarships")
        if cursor.fetchone()[0] == 0:
            print("Populating sample scholarships...")
            cursor.execute("""
                INSERT INTO scholarships (title, provider_name, description, amount, deadline, min_gpa, academic_level)
                VALUES 
                ('Future Leaders Scholarship', 'Ministry of Education', 'For outstanding Emirati students', 'AED 50,000/year', '2026-05-30', 3.5, 'Undergraduate'),
                ('STEM Excellence Grant', 'TechCorp UAE', 'Supporting STEM fields', 'Full Tuition', '2026-04-15', 3.8, 'University')
            """)
            
        cursor.execute("SELECT count(*) FROM educational_programs")
        if cursor.fetchone()[0] == 0:
            print("Populating sample programs...")
            cursor.execute("""
                INSERT INTO educational_programs (title, organizer_name, program_type, start_date, end_date, location, age_group)
                VALUES 
                ('AI & Robotics Summer Camp', 'Dubai Future Foundation', 'Summer Camp', '2026-07-10', '2026-07-25', 'Museum of the Future', '16-19'),
                ('Young Entrepreneurs Bootcamp', 'SME Dubai', 'Bootcamp', '2026-08-05', '2026-08-15', 'Business Bay', '15-18')
            """)
            
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply_schema()
