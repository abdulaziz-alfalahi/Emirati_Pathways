
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection details
DB_NAME = os.getenv("DB_NAME", "emirati_pathways_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cursor = conn.cursor()

    phone = '+971502345678'
    cursor.execute("SELECT id FROM users WHERE phone = %s", (phone,))
    user_row = cursor.fetchone()

    if not user_row:
        print("User Zara Saeed not found, cannot create HR profile.")
    else:
        user_id = user_row[0]
        
        # Check if profile exists in hr_profiles
        # The schema uses uuid for hr_profiles.id, but user_id is integer from users table?
        # Wait, check schema again. checks_users_schema.py said users.id is integer.
        # But create_hr_recruiter_tables_fixed.sql said user_id UUID REFERENCES users(id).
        # THIS IS A MISMATCH. If users.id is INT and hr_profiles.user_id is UUID, this will fail.
        # Let's check hr_profiles schema first.
        
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hr_profiles' AND column_name = 'user_id';
        """)
        col_info = cursor.fetchone()
        
        if col_info:
            print(f"hr_profiles.user_id type: {col_info[1]}")
            # If it expects UUID and we have INT, that's a problem. 
            # But usually setup_database.py creates users with SERIAL (int).
            # If create_hr_recruiter_tables_fixed.sql was run, it might have failed foreign key creation if types didn't match
            # or it might have been adjusted.
            
            # Assuming it might handle integer if type is integer.
            
            # Let's try to insert safely
            try:
                # Check for existence first
                cursor.execute("SELECT id FROM hr_profiles WHERE user_id::text = %s", (str(user_id),))
                existing = cursor.fetchone()
                
                if existing:
                    print("HR Profile already exists.")
                else:
                    print("Creating HR Profile...")
                    # Insert with minimal fields
                    cursor.execute("""
                        INSERT INTO hr_profiles (user_id, position_title, department, company_id)
                        VALUES (%s, 'HR Manager', 'Human Resources', '7e5edea0-ea73-436c-b7ed-f47cfe57423a')
                    """, (user_id,))
                    print("HR Profile created.")
                    conn.commit()
            except Exception as insert_err:
                print(f"Insert failed: {insert_err}")
                conn.rollback()
        else:
             print("hr_profiles table does not exist or has no user_id column.")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
