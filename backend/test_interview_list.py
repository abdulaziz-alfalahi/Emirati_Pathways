import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:5003"
RECRUITER_ID = "omar.alrashid@recruitment.ae" # Matches previous test

# Get token (simulated or Login) - For now assuming NO AUTH on this endpoint for testing OR I need to implement auth headers.
# Video interview routes use @jwt_required().
# I need a valid token.
# I will use the `backend/auth_routes.py` format or just mock it if I can't login easily.
# Actually, I can use the existing `test_shortlist_add.py` logic if it logged in? No it didn't.
# The `unified_server.py` has `missing_token_callback`.
# I need to login first.

def test_list_interviews():
    # 1. Login
    login_payload = {
        "email": "omar.alrashid@recruitment.ae",
        "password": "password123" # Assuming default password
    }
    
    # Try login
    try:
        auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        if auth_resp.status_code == 200:
            token = auth_resp.json().get('token') or auth_resp.json().get('access_token')
            if not token:
                logger.error("No token returned")
                # return
                # If login fails/mock auth, maybe I can't test easily without knowing exact creds.
                # However, I can inspect output of my previous run where I saw 401?
                # The previous test `test_interview_create.py` did NOT use auth headers and it WORKED (201).
                # Wait, `interview_routes.py` uses `@jwt_required()`?
                # Let's check `interview_routes.py` again.
                pass
        else:
             logger.warning(f"Login failed: {auth_resp.status_code}")
             # Proceeding without token if previous tests worked without it (maybe jwt disabled in dev?)
    except Exception as e:
        logger.error(f"Login error: {e}")

    # 2. List Interviews (using the NEW endpoint)
    # Headers
    headers = {}
    # if token: headers['Authorization'] = f"Bearer {token}"
    
    # Actually, let's assume dev environment might have JWT disabled or I need to find how `test_interview_create.py` worked.
    # `test_interview_create.py`:
    # response = requests.post(f"{BASE_URL}/api/recruiter/interviews/create", json=payload)
    # It worked. 
    # `interview_routes.py` does NOT have `@jwt_required` on `create_interview`?
    # `video_interview_routes.py` DOES have `@jwt_required()`.
    
    # If `video_interview_routes` requires JWT, I MUST provide it.
    # If I can't get a token, I can't verify via script easily.
    # But I can modify `video_interview_routes.py` to comment out `@jwt_required` temporarily for verification?
    # No, that's bad practice.
    
    # Let's try to hit the endpoint and see if 401.
    try:
        resp = requests.get(f"{BASE_URL}/api/video-interview/sessions?role=recruiter")
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Sessions found: {len(data['sessions'])}")
            print(json.dumps(data, indent=2))
        else:
            print(f"Error: {resp.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_list_interviews()
