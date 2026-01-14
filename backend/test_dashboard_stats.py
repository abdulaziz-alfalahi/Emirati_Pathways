import requests
import json
import os

BASE_URL = 'http://127.0.0.1:5005/api'

def test_dashboard_stats_photo():
    print("\n--- Testing Dashboard Stats Photo ---")
    
    # 1. Register a new user
    email = f"test_stats_{os.urandom(4).hex()}@example.com"
    password = "Password123!"
    
    print(f"Registering user: {email}")
    reg_response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "first_name": "Stats",
        "last_name": "Tester",
        "phone": "0501234567",
        "emirate": "Dubai",
        "role": "job_seeker"
    })
    
    if reg_response.status_code not in [200, 201]:
        print(f"Registration failed: {reg_response.text}")
        return
        
    # 2. Login
    print("Logging in...")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    token = login_response.json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # 2.5 Create Profile first (needed for photo upload)
    print("Creating initial profile...")
    profile_resp = requests.post(f"{BASE_URL}/profile/candidate", json={
        "personal_info": {"first_name": "Stats", "last_name": "Tester"},
        "professional_summary": "Test Summary"
    }, headers=headers)
    if profile_resp.status_code not in [200, 201]:
        print(f"Profile creation failed: {profile_resp.text}")
        
    # 3. Upload Photo
    print("Uploading photo...")
    # Create a dummy image file
    with open('test_photo.jpg', 'wb') as f:
        f.write(os.urandom(1024))
        
    with open('test_photo.jpg', 'rb') as f:
        files = {'photo': f}
        upload_response = requests.post(
            f"{BASE_URL}/profile/candidate/photo",
            headers=headers,
            files=files
        )
    
    print(f"Upload response: {upload_response.status_code}")
    print(upload_response.json())
    
    photo_url = upload_response.json()['data']['photo_url']
    print(f"Uploaded photo URL: {photo_url}")
    
    # 4. Get Dashboard Stats
    print("Fetching Dashboard Stats...")
    stats_response = requests.get(
        f"{BASE_URL}/candidate/dashboard/stats",
        headers=headers
    )
    
    print(f"Stats response: {stats_response.status_code}")
    stats_data = stats_response.json()
    # print(json.dumps(stats_data, indent=2))
    
    profile_data = stats_data['data']['profile']
    fetched_photo_url = profile_data.get('profile_photo_url')
    
    print(f"fetched_photo_url from stats: {fetched_photo_url}")
    
    if fetched_photo_url == photo_url:
        print("SUCCESS: Photo URL matches!")
    else:
        print("FAILURE: Photo URL missing or mismatch")
        
    # Clean up
    try:
        os.remove('test_photo.jpg')
    except:
        pass

if __name__ == "__main__":
    test_dashboard_stats_photo()
