import requests
import json

# Test the new job-applicants-count endpoint
print("Testing /api/recruiter/job-applicants-count endpoint...")
print("=" * 70)

# You'll need to replace this with a valid JWT token for User 108
# Get it from browser dev tools -> Application -> Local Storage -> access_token
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2OTk1OTIxNywianRpIjoiYzVlZjQwNjAtZGJjOS00NDFkLTkzOTMtMzA0OGJlOTc2NDE1IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEwOCIsIm5iZiI6MTc2OTk1OTIxNywiY3NyZiI6IjU4YWI3ZWU1LTA5ZTQtNDllYy04NDE3LThkMzRkNzgyYjJjNCIsImV4cCI6MTc3MDA0NTYxNywicm9sZSI6ImpvYl9zZWVrZXIifQ.7_5fdsJB9HncvIaLJ7sDiVQUygS6Va4-X_8XWIKodnw"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

try:
    # Test the endpoint
    response = requests.get(
        "http://localhost:5005/api/recruiter/job-applicants-count",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            applicants = data.get('data', [])
            print(f"\n✅ SUCCESS! Found {len(applicants)} jobs with application data")
            for job in applicants:
                print(f"\n  Job: {job.get('job_title')}")
                print(f"  Total Applicants: {job.get('total_applicants')}")
                print(f"  New: {job.get('new_applicants')}")
        else:
            print("\n❌ API returned success=false")
    else:
        print(f"\n❌ ERROR: Got status code {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("❌ ERROR: Could not connect to backend!")
    print("Make sure Flask is running on http://localhost:5005")
except Exception as e:
    print(f"❌ ERROR: {e}")
