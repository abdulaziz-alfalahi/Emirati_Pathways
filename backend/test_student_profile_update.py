
import requests
import json
import random
import string
import sys
import time

# Configuration
BASE_URL = "http://127.0.0.1:5005"

def get_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_test():
    email = f"student_{get_random_string()}@example.com"
    password = "Password123!"
    
    print(f"[*] Testing with Student: {email}")
    
    # 1. Register
    reg_url = f"{BASE_URL}/api/auth/register"
    reg_payload = {
        "email": email, 
        "password": password,
        "first_name": "Student", 
        "last_name": "Test",
        "role": "student",
        "phone": "+971500000000",
        "emirate": "Dubai",
        "terms_accepted": True
    }
    
    print(f"[*] Registering... {reg_url}")
    # We use requests directly. If bcrypt fails again on register, we might have issue.
    # But previous crash was likely due to invalid bcrypt installation or configuration on valid python.
    # We validated bcrypt standalone works. 
    # The crash on register earlier: "Connection reset".
    # If this crashes, I'll use Zara and just update her profile.
    try:
        resp = requests.post(reg_url, json=reg_payload)
    except requests.exceptions.ConnectionError:
        print("[!] Connection Error on Register (Backend Crashed?)")
        return

    if resp.status_code != 201:
        print(f"[!] Registration failed: {resp.status_code} {resp.text}")
        return

    # 2. Login
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {"email": email, "password": password}
    print(f"[*] Logging in... {login_url}")
    resp = requests.post(login_url, json=login_payload)
    if resp.status_code != 200:
        print(f"[!] Login failed: {resp.status_code} {resp.text}")
        return

    token = resp.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    print("[+] Login successful.")

    # 3. PUT Profile (Student Fields)
    put_url = f"{BASE_URL}/api/auth/profile"
    put_payload = {
        "schoolName": "Khalifa University",
        "gradeLevel": "Senior",
        "gpa": "3.9",
        "majorInterests": "AI, Robotics",
        "extracurriculars": "Robotics Club",
        "achievements": "First Place Hackathon"
    }
    
    print(f"[*] Sending PUT {put_url} with student data...")
    resp = requests.put(put_url, json=put_payload, headers=headers)
    print(f"[*] PUT Response: {resp.status_code} {resp.text}")
    
    if resp.status_code != 200:
        print("[!] PUT failed.")
        return

    # 4. GET Profile to verify persistence
    print("[*] Verifying via GET /api/auth/profile...")
    get_url = f"{BASE_URL}/api/auth/profile"
    resp = requests.get(get_url, headers=headers)
    
    if resp.status_code == 200:
        data = resp.json().get('data', {})
        print(f"    DATA: {json.dumps(data, indent=2)}")
        
        # Verify fields
        # Check student_info
        s_info = data.get('student_info', {})
        failures = []
        if s_info.get('schoolName') != "Khalifa University": failures.append("schoolName")
        if s_info.get('gpa') != "3.9": failures.append("gpa")
        
        # Check mapped education
        education = data.get('education', [])
        mapped_edu = False
        for edu in education:
            if edu.get('institution') == "Khalifa University":
                mapped_edu = True
                break
        
        if not mapped_edu: failures.append("education mapping")

        if not failures:
            print("[+] SUCCESS: Student profile persisted correctly.")
        else:
            print(f"[!] FAILURE: Fields not updated: {failures}")
    else:
        print(f"[!] GET failed: {resp.status_code}")

if __name__ == "__main__":
    run_test()
