
import os
import sys
import psycopg2
import json
from dotenv import load_dotenv

load_dotenv(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\.env')

def update_khalid():
    host = os.getenv('DB_HOST')
    port = os.getenv('DB_PORT')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    dbname = 'emirati_journey'

    print(f"--- Updating Khalid in {dbname} ---")
    try:
        conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
        cur = conn.cursor()
        
        # New HR Skills
        hr_skills = [
            "Recruitment", 
            "Talent Acquisition", 
            "Employee Relations", 
            "Labor Law", 
            "HRIS", 
            "Onboarding", 
            "Performance Management",
            "Microsoft Office"
        ]
        
        # 1. Update User (ID 21)
        cur.execute("""
            UPDATE users 
            SET 
                skills = %s,
                job_title = 'HR Coordinator',
                company = 'Previous HR Company',
                experience_years = 5,
                education_level = 'Bachelor''s Degree'
            WHERE id = 21
        """, (hr_skills,))
        
        conn.commit()
        print("Updated Khalid's profile with HR skills.")
        
        # Verify
        cur.execute("SELECT first_name, skills, job_title FROM users WHERE id = 21")
        print(f"New Data: {cur.fetchone()}")

        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_khalid()
