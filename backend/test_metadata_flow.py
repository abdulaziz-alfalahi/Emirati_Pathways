import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://localhost:8089/api"

def make_request(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
        
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.add_header('Content-Length', len(json_data))
        
    try:
        if data:
            with urllib.request.urlopen(req, data=json_data) as response:
                resp_body = response.read().decode('utf-8')
                return response.status, resp_body
        else:
            with urllib.request.urlopen(req) as response:
                resp_body = response.read().decode('utf-8')
                return response.status, resp_body
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode('utf-8')
        return e.code, resp_body
    except Exception as e:
        print(f"Request Error: {e}")
        return 0, str(e)

def test_onboarding():
    print("--- Starting Onboarding Flow Test (urllib) ---")
    
    # 1. Login with a NEW phone number (Magic OTP)
    phone = "+971501234567" 
    
    print(f"1. Requesting OTP for {phone}...")
    status, body = make_request(f"{BASE_URL}/auth/request-otp", method='POST', data={"phone": phone})
    print(f"OTP Status: {status}")

    print("2. Logging in with Magic OTP...")
    status, body = make_request(f"{BASE_URL}/auth/login-with-otp", method='POST', data={
        "phone": phone,
        "code": "123456"
    })
    
    if status != 200:
        print(f"Login failed: {body}")
        return
        
    try:
        resp_json = json.loads(body)
        data = resp_json['data']
        token = data['access_token']
        user_id = data['user']['id']
        print(f"Login successful. User ID: {user_id}")
    except Exception as e:
        print(f"Error parsing login response: {e} - Body: {body}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Update Role to Student with University
    print("\n3. Updating role to 'student' with Metadata...")
    update_payload = {
        "primary_role": "student",
        "metadata": {
            "university_name": "Test University of UAE"
        }
    }
    
    status, body = make_request(f"{BASE_URL}/auth/update-roles", method='PUT', data=update_payload, headers=headers)
    print(f"Update Status: {status}")
    print(f"Update Response: {body}")
    
    if status == 200:
        print("SUCCESS: Role updated to Student.")
    else:
        print("FAILED to update role.")

    # 4. Update Role to Recruiter with Company
    print("\n4. Updating role to 'recruiter' with Company Metadata...")
    update_payload_recruiter = {
        "primary_role": "recruiter",
        "metadata": {
            "company_name": "Test Company Corp"
        }
    }
    
    status, body = make_request(f"{BASE_URL}/auth/update-roles", method='PUT', data=update_payload_recruiter, headers=headers)
    print(f"Update Status: {status}")
    print(f"Update Response: {body}")
    
    if status == 200:
         print("SUCCESS: Role updated to Recruiter.")
    else:
         print("FAILED to update role.")

if __name__ == "__main__":
    test_onboarding()
