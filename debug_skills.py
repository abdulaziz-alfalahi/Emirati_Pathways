
import os
import sys
import psycopg2
import psycopg2.extras
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath('backend'))

def check_candidate_skills():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("SELECT id, skills, experience_years, education_level FROM users WHERE role = 'candidate' LIMIT 5")
        candidates = cur.fetchall()
        
        print(f"Found {len(candidates)} candidates")
        for c in candidates:
            print(f"Candidate {c['id']}:")
            print(f"  Skills type: {type(c['skills'])}")
            print(f"  Skills value: {c['skills']}")
            print(f"  Exp Years: {c['experience_years']}")
            print(f"  Edu Level: {c['education_level']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_candidate_skills()
