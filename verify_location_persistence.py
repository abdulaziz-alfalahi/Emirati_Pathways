import requests
import json
import uuid
import datetime

BASE_URL = "http://localhost:5005"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NzQ1MTg4NCwianRpIjoiMzE2YjJlMTUtYmJhYi00MjViLWFmMzEtZDMxYWEzNjhlZDNkIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MTQsIm5iZiI6MTc2NzQ1MTg4NCwiY3NyZiI6IjMzZDYzOWVkLTI1NDYtNDFhOS04OGIyLWM1NGM0OTU3ODYzOCIsImV4cCI6MTc2NzQ1Mjc4NCwicm9sZSI6ImhyX3JlY3J1aXRlciJ9.9fRQDsOXE3o969XVmz4hP7IaYbjoBy1IAxuM4hKmrSM"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def verify():
    # 1. Create Job with Location
    print("Creating job with coordinates...")
    payload = {
        "title": f"GIS Specialist {uuid.uuid4().hex[:4]}",
        "description": "Verification job for location",
        "location": "Dubai Silicon Oasis",
        "latitude": 25.123456,
        "longitude": 55.654321
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/api/hr/jobs/", headers=HEADERS, json=payload)
        if resp.status_code != 201:
            print(f"FAILED: Create job returned {resp.status_code}: {resp.text}")
            return
            
        job_data = resp.json()['data']['job_posting']
        job_id = job_data['id']
        print(f"Created job ID: {job_id}")
        
        # Verify coordinates in response
        lat = job_data.get('latitude')
        lng = job_data.get('longitude')
        print(f"Initial coordinates: {lat}, {lng}")
        
        if str(lat) != "25.123456" or str(lng) != "55.654321":
            print("FAILED: Initial coordinates do not match input")
        else:
            print("SUCCESS: Initial coordinates match")

        # 2. Update Job with new coordinates
        print("\nUpdating job coordinates...")
        update_payload = {
            "latitude": 24.999999,
            "longitude": 54.888888,
            "location": "Abu Dhabi"
        }
        
        resp = requests.put(f"{BASE_URL}/api/hr/jobs/{job_id}", headers=HEADERS, json=update_payload)
        if resp.status_code != 200:
             print(f"FAILED: Update job returned {resp.status_code}: {resp.text}")
             return
             
        updated_data = resp.json()['data']['job_posting']
        lat = updated_data.get('latitude')
        lng = updated_data.get('longitude')
        print(f"Updated coordinates: {lat}, {lng}")
        
        if str(lat) != "24.999999" or str(lng) != "54.888888":
            print("FAILED: Updated coordinates do not match input")
        else:
            print("SUCCESS: Updated coordinates match")

        # 3. Create Batch
        print("\nCreating batch with coordinates...")
        batch_payload = {
            "jobs": [
                {
                    "title": f"Batch Job {uuid.uuid4().hex[:4]}",
                    "description": "Batch creation test",
                    "latitude": 25.555555,
                    "longitude": 55.444444
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/hr/jobs/batch", headers=HEADERS, json=batch_payload)
        if resp.status_code != 201:
            print(f"FAILED: Batch create returned {resp.status_code}: {resp.text}")
            return
            
        batch_data = resp.json()['data'][0]
        lat = batch_data.get('latitude')
        lng = batch_data.get('longitude')
        print(f"Batch job coordinates: {lat}, {lng}")
        
        if str(lat) != "25.555555" or str(lng) != "55.444444":
             print("FAILED: Batch coordinates do not match input")
        else:
            print("SUCCESS: Batch coordinates match")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    verify()
