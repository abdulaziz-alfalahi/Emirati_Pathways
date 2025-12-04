
import os
import psycopg2
import json
import logging

# Mock logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def check_jd_matching():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # JD ID for 'Chiefe Software Engineer'
        jd_id = "07b54189-60e5-49ad-2b76-692e1be6ac49" # This is a guess based on the previous output which showed req IDs like req_07b54189... wait, I need the actual JD ID.
        # I will use the one found in check_db.py output: "Found JD: Chiefe Software Engineer (ID: 5)" -> Wait, ID is integer 5? 
        # The check_db.py output said: "Found JD: Chiefe Software Engineer (ID: 5)"
        # But job_postings has `jd_id` (varchar) and `id` (serial).
        # The previous check_db.py output showed `jd_id` in the SELECT.
        # Let me re-read the check_db.py output carefully.
        # "Found JD: Chiefe Software Engineer (ID: 84c9c7f1-7b0b-4f0b-8269-746019fa3a91)" -> No, I didn't see the full ID.
        # I will use a query to get the ID first.
        
        cur.execute("SELECT jd_id FROM job_postings WHERE title LIKE '%Chiefe%' LIMIT 1")
        row = cur.fetchone()
        if not row:
            print("JD not found.")
            return
        jd_id = row[0]
        print(f"Checking JD ID: {jd_id}")
        
        # Fetch JD requirements
        cur.execute("SELECT requirements FROM job_postings WHERE jd_id = %s", (jd_id,))
        jd = cur.fetchone()
        
        if not jd:
            print("JD not found.")
            return

        requirements_raw = jd[0]
        requirements = requirements_raw
        
        # Extract required skills
        required_skills = []
        print("Checking requirements...")
        if requirements:
            for req in requirements:
                print(f"  Category: {req.get('category')}, Desc: {req.get('description')}")
                if req.get('category') == 'skills':
                    required_skills.append(req.get('description', '').lower())
        else:
            print("Requirements are empty or None.")
        
        print(f"Required Skills ({len(required_skills)}): {required_skills}")
        
        # Get a candidate
        cur.execute("SELECT id, skills FROM users WHERE role = 'candidate' LIMIT 1;")
        candidate = cur.fetchone()
        
        if not candidate:
            print("No candidates found.")
            return
            
        cand_id, cand_skills = candidate
        print(f"Candidate ID: {cand_id}")
        print(f"Candidate Skills: {cand_skills}")
        
        # Simulate matching
        matched = 0
        matching_skills = []
        missing_skills = []
        
        cand_skills_lower = [s.lower() for s in cand_skills] if cand_skills else []
        
        if required_skills:
            for skill_req in required_skills:
                matched_this_req = False
                for cand_skill in cand_skills_lower:
                    if cand_skill in skill_req or skill_req in cand_skill:
                        matched_this_req = True
                        matching_skills.append(skill_req)
                        break
                
                if matched_this_req:
                    matched += 1
                else:
                    missing_skills.append(skill_req)
            
            score = (matched / len(required_skills)) * 40
            print(f"Calculated Skills Score: {score}")
            print(f"Matching Skills: {matching_skills}")
            print(f"Missing Skills: {missing_skills}")
        else:
            print("No required skills found in JD.")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_jd_matching()
