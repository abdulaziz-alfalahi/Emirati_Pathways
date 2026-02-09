
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
    
    # 2. Login
    login_url = f"{BASE_URL}/api/auth/login"
    
    try:
        resp = requests.post(reg_url, json=reg_payload)
        if resp.status_code == 201:
             print("[*] Registered.")
        else:
             print(f"[!] Register failed: {resp.status_code}")
             # try login if exists
        
        resp = requests.post(login_url, json={"email": email, "password": password})
        if resp.status_code != 200:
             print(f"[!] Login failed: {resp.status_code}")
             return
             
        token = resp.json()['data']['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. PUT Profile (Student Fields) via /api/auth/profile (Simulating Frontend)
        put_url = f"{BASE_URL}/api/auth/profile"
        put_payload = {
            "schoolName": "Khalifa University",
            "gpa": "4.0",
        }
        
        print(f"[*] Sending PUT {put_url}...")
        resp = requests.put(put_url, json=put_payload, headers=headers)
        print(f"[*] PUT Response: {resp.status_code}")
        
        if resp.status_code == 200:
             print("[+] PUT Success.")
             
             # 4. GET Profile
             get_url = f"{BASE_URL}/api/auth/profile"
             resp = requests.get(get_url, headers=headers)
             data = resp.json().get('data', {})
             
             # Check if data persists
             info = data.get('student_info', {})
             print(f"[*] Retrieved Info: {info}")
             
             if info.get('gpa') == "4.0":
                 print("[+] VERIFIED: Data persisted.")
             else:
                 print("[!] FAILED: Data mismatch.")
        else:
             print("[!] PUT Failed.")

    except Exception as e:
        print(f"[!] Error: {e}")

if __name__ == "__main__":
    run_test()
