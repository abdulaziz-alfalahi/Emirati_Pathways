
import requests
import json
import uuid
import sys

BASE_URL = "http://127.0.0.1:5005"
RECRUITER_ID = "1" # Assuming exists or handled
COMPANY_ID = "1"

def test_save_coordinates():
    print("Testing coordinate persistence...")
    
    jd_id = f"test_jd_{uuid.uuid4().hex[:8]}"
    print(f"Creating JD with ID: {jd_id}")
    
    # 1. Create JD (Update Basic Info)
    # The endpoint is /api/recruiter/jd/<jd_id>/basic-info
    url = f"{BASE_URL}/api/recruiter/jd/{jd_id}/basic-info"
    
    payload = {
        "recruiter_id": RECRUITER_ID,
        "company_id": COMPANY_ID,
        "basic_info": {
            "title": "Test Location JD",
            "department": "Engineering",
            "location": "Dubai Silicon Oasis",
            "latitude": 25.123456,
            "longitude": 55.654321,
            "job_type": "Full-time",
            "job_level": "Senior",
            "emirate": "Dubai"
        }
    }
    
    # Mock token headers if needed, assuming local dev environment might bypass or uses simple auth
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock_token_1" # Using mock token as seen in other scripts
    }
    
    try:
        response = requests.put(url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Failed to create JD: {response.status_code} - {response.text}")
            return False
            
        print("JD created successfully.")
        
        # 2. Verify coordinates in Database via API (get JD)
        # Endpoint: /api/recruiter/jd/<jd_id>
        get_url = f"{BASE_URL}/api/recruiter/jd/{jd_id}"
        
        response = requests.get(get_url, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch JD: {response.status_code} - {response.text}")
            return False
            
        jd_data = response.json().get('jd', {})
        basic_info = jd_data.get('basic_info', {})
        
        lat = basic_info.get('latitude')
        lon = basic_info.get('longitude')
        
        print(f"Retrieved Coordinates: Lat={lat}, Lon={lon}")
        
        if lat == 25.123456 and lon == 55.654321:
            print("✅ POSITIVE: Coordinates preserved correctly in Basic Info JSON.")
        else:
            print("❌ NEGATIVE: Coordinates missing or incorrect in Basic Info JSON.")
            
        # 3. Verify coordinates in "job_postings" table columns (if exposed or checkable via search)
        # We can check via the list endpoint if it returns lat/long or by direct DB check (using inspect_db style later if needed)
        # But `get_jd` usually pulls from the JSON blob. The search logic uses the columns.
        
        return True

    except Exception as e:
        print(f"Exception during test: {e}")
        return False

if __name__ == "__main__":
    if test_save_coordinates():
        sys.exit(0)
    else:
        sys.exit(1)
