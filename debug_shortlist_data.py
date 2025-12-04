import requests
import json
import uuid
import psycopg2
import os

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

BASE_URL = "http://localhost:5003/api/recruiter"
JD_ID = "jd_20251124_184251_c863c1f4" # From screenshot

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def debug_shortlist_data():
    print(f"Debugging shortlist for JD: {JD_ID}")
    
    # 1. Get a valid user ID
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, first_name, last_name FROM users LIMIT 1")
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        print("No users found in DB. Cannot test with valid user.")
        return

    user_id = str(user[0])
    print(f"Found user: {user[1]} {user[2]} (ID: {user_id})")
    
    # 2. Add to shortlist via API
    payload = {
        "jd_id": JD_ID,
        "candidate_id": user_id,
        "recruiter_id": "recruiter_debug",
        "match_score": 95.0,
        "match_details": {"skills": {"matched": ["Debug Skill"], "missing": []}},
        "notes": "Debug insertion"
    }
    
    print("Adding to shortlist via API...")
    response = requests.post(f"{BASE_URL}/shortlist/add", json=payload)
    print(f"Add response: {response.status_code} {response.text}")
    
    # 3. Verify via API
    print("Verifying via API...")
    response = requests.get(f"{BASE_URL}/shortlist/{JD_ID}")
    data = response.json()
    print(f"Get response: {json.dumps(data, indent=2)}")
    
    if data.get('success') and len(data.get('shortlist', [])) > 0:
        print("SUCCESS: Data exists in backend. Now check frontend.")
    else:
        print("FAILURE: Data not returned by API.")

if __name__ == "__main__":
    debug_shortlist_data()
