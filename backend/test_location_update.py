
import requests
import json
import random
import string

# Configuration
BASE_URL = "http://127.0.0.1:5005"

def get_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_test():
    email = f"loc_test_{get_random_string()}@example.com"
    password = "Password123!"
    
    print(f"[*] Testing Location/EmiratesID with: {email}")
    
    # 1. Register
    reg_url = f"{BASE_URL}/api/auth/register"
    requests.post(reg_url, json={
        "email": email, 
        "password": password,
        "first_name": "Location", 
        "last_name": "Tester",
        "role": "job_seeker", # Job seeker usually has map
        "phone": "+971509999999",
        "emirate": "Dubai",
        "terms_accepted": True
    })
    
    # 2. Login
    login_url = f"{BASE_URL}/api/auth/login"
    resp = requests.post(login_url, json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"[!] Login failed: {resp.status_code}")
        return
        
    token = resp.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. PUT Profile (Location & Emirates ID)
    put_url = f"{BASE_URL}/api/auth/profile"
    
    # Example coordinates for Dubai Mall
    lat = 25.1972
    lng = 55.2744
    emirates_id = "784-1990-1234567-1"
    
    put_payload = {
        "personal_info": {
            "location": "Dubai Mall",
            "latitude": lat,
            "longitude": lng,
            "emirates_id": emirates_id,
            "nationality": "UAE"
        },
        # Top level as well to match frontend behavior
        "latitude": lat,
        "longitude": lng
    }
    
    print(f"[*] Sending PUT with lat={lat}, lng={lng}, eid={emirates_id}...")
    resp = requests.put(put_url, json=put_payload, headers=headers)
    print(f"[*] PUT Response: {resp.status_code}")
    
    if resp.status_code == 200:
         # 4. GET Profile
         get_url = f"{BASE_URL}/api/auth/profile"
         resp = requests.get(get_url, headers=headers)
         data = resp.json().get('data', {})
         
         print(f"[*] Retrieved Data Keys: {list(data.keys())}")
         
         r_lat = data.get('latitude')
         r_lng = data.get('longitude')
         r_eid = data.get('emirates_id')
         
         print(f"[*] Retrieved: lat={r_lat}, lng={r_lng}, eid={r_eid}")
         
         if str(r_lat) == str(lat) and str(r_lng) == str(lng) and r_eid == emirates_id:
             print("[+] VERIFIED: Location and Emirates ID persisted.")
         else:
             print("[!] FAILED: Data mismatch.")
             # Debug info
             print(f"Expected: {lat}, {lng}, {emirates_id}")
             print(f"Got: {r_lat}, {r_lng}, {r_eid}")
    else:
         print("[!] PUT Failed.")

if __name__ == "__main__":
    run_test()
