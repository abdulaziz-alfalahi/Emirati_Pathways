
import requests
import json
import sys
import os

import random
import string

# Configuration
BASE_URL = "http://127.0.0.1:5006"
random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
EMAIL = f"test_{random_suffix}@example.com"
PASSWORD = "Password123!"

def register_and_login():
    print(f"[*] Registering/Logging in user: {EMAIL}")
    
    # 1. Register
    reg_payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "first_name": "Persistence",
        "last_name": "Test",
        "role": "candidate",
        "phone": "+971500000000",
        "emirate": "Dubai",
        "terms_accepted": True
    }
    
    # Try register
    resp = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    if resp.status_code not in [201, 409]: # 409 means already exists
        print(f"[!] Registration failed: {resp.text}")
        sys.exit(1)
        
    # 2. Login
    login_payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    if resp.status_code != 200:
        print(f"[!] Login failed: {resp.text}")
        sys.exit(1)
        
    token = resp.json()['data']['access_token']
    print("[+] Login successful")
    return token

def test_profile_persistence(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n[*] Testing Profile Persistence...")
    
    # 1. Update Profile (POST)
    profile_data = {
        "personal_info": {
            "first_name": "UpdatedFirst",
            "last_name": "UpdatedLast",
            "phone": "+971555555555",
            "nationality": "UAE",
            "location": "Dubai"
        },
        "professional_summary": "This is a persisted summary.",
        "years_of_experience": 5,
        "skills": ["Python", "React", "Testing"]
    }
    
    print("[-] Sending POST /api/profile/candidate...")
    resp = requests.post(f"{BASE_URL}/api/profile/candidate", json=profile_data, headers=headers)
    if resp.status_code not in [200, 201]:
        print(f"[!] POST failed: {resp.status_code} - {resp.text}")
        return False
    print("[+] POST successful")
    
    # 2. Retrieve Profile (GET)
    print("[-] Sending GET /api/profile/candidate...")
    resp = requests.get(f"{BASE_URL}/api/profile/candidate", headers=headers)
    if resp.status_code != 200:
        print(f"[!] GET failed: {resp.status_code} - {resp.text}")
        return False
        
    data = resp.json().get('data', {})
    
    # 3. Verify Data
    print("\n[*] Verifying Data...")
    
    # Check Name (should come from users table, synced by backend)
    # The API returns first_name / last_name at root level
    print(f"    first_name: {data.get('first_name')} (Expected: UpdatedFirst)")
    print(f"    last_name:  {data.get('last_name')} (Expected: UpdatedLast)")
    print(f"    summary:    {data.get('professional_summary')} (Expected: This is a persisted summary.)")
    print(f"    skills:     {data.get('skills')} (Expected: ['Python', 'React', 'Testing'])")
    
    failures = []
    if data.get('first_name') != "UpdatedFirst": failures.append("first_name mismatch")
    if data.get('last_name') != "UpdatedLast": failures.append("last_name mismatch")
    if data.get('professional_summary') != "This is a persisted summary.": failures.append("summary mismatch")
    # Skills might be parsed from JSON string or list depending on implementation
    
    if failures:
        print(f"[!] Verification FAILED: {', '.join(failures)}")
        return False
        
    print("[+] Verification SUCCESS: Data persisted correctly.")
    return True

if __name__ == "__main__":
    try:
        token = register_and_login()
        test_profile_persistence(token)
    except Exception as e:
        print(f"[!] Unexpected error: {e}")
