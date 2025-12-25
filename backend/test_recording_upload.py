import requests
import os
import time

# Configuration
BASE_URL = "http://localhost:5003/api/interviews/sessions"
MOCK_TOKEN = "Bearer mock_token"
SESSION_ID = "test_session_recording_v1"
USER_ID = "mock_user_candidate"

def run_test():
    print(f"🎥 Testing Recording Upload to {BASE_URL}...")
    
    # 0. Authenticate
    print("   Authenticating...")
    token = None
    try:
        # Use dev-login with correct payload (user_id, not email/pass)
        auth_res = requests.post("http://localhost:5003/api/auth/dev-login", json={
            "user_id": USER_ID,
            "role": "candidate",
            "email": "test_candidate@emirati.ae"
        })
        
        if auth_res.status_code == 200:
            data = auth_res.json().get('data', {})
            token = data.get('access_token')
            # Extract token if nested differently (check auth_routes logic: data -> access_token)
            # auth_routes says: data: { access_token: "...", user: {...} }
            print("   ✅ Authenticated.")
        else:
            print(f"   ❌ Auth Failed: {auth_res.text}")
            return
            
    except Exception as e:
        print(f"   ❌ Auth Error: {e}")
        return

    headers = {'Authorization': f'Bearer {token}'}
    
    # Simulate 3 chunks of video data
    chunks = [
        b"header_video_data_part1",
        b"middle_video_data_part2",
        b"footer_video_data_part3"
    ]
    
    # 1. Upload Chunks
    for i, data in enumerate(chunks):
        print(f"   Uploading chunk {i}...")
        files = {'chunk': ('blob', data, 'application/octet-stream')}
        data_payload = {
            'index': i,
            'is_final': 'false'
        }
        
        try:
            res = requests.post(
                f"{BASE_URL}/{SESSION_ID}/record/chunk",
                files=files,
                data=data_payload,
                headers=headers
            )
            print(f"   Stats: {res.status_code}")
            if res.status_code != 200:
                print(f"   Error: {res.text}")
        except Exception as e:
            print(f"   ❌ Upload Failed: {e}")

    # 2. Finalize
    print("   Finalizing recording...")
    files = {'chunk': ('blob', b"", 'application/octet-stream')} # Empty final chunk
    data_payload = {
        'index': len(chunks),
        'is_final': 'true'
    }
    res = requests.post(
        f"{BASE_URL}/{SESSION_ID}/record/chunk",
        files=files,
        data=data_payload,
        headers=headers
    )
    
    print(f"🏁 Final Result: {res.status_code}")
    if res.status_code == 200:
        print("✅ SUCCESS: Recording assembled.")
        print(res.json())
    else:
        print("❌ FAILURE: Assembly failed.")
        print(res.text)

if __name__ == "__main__":
    run_test()
