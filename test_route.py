import requests
import time

base_url = 'http://localhost:5003/api/recruiter/jd'
jd_id = 'test_gen_id_123'

# 1. Try to create/update basic info
print(f"1. Creating JD {jd_id} via PUT /basic-info...")
try:
    r = requests.put(f"{base_url}/{jd_id}/basic-info", json={
        'basic_info': {
            'title': 'Test Job',
            'department': 'Engineering',
            'job_level': 'Senior'
        },
        'recruiter_id': 'test_recruiter',
        'company_id': 'test_company'
    })
    print(f"Status: {r.status_code}")
    print(f"Content: {r.text}")
except Exception as e:
    print(f"Error calling PUT: {e}")

# 2. Try to generate description
print(f"\n2. Generating description via POST /generate-description...")
try:
    r = requests.post(f"{base_url}/{jd_id}/generate-description", json={
        'industry': 'Technology'
    })
    print(f"Status: {r.status_code}")
    print(f"Content: {r.text}")
except Exception as e:
    print(f"Error calling POST: {e}")
