#!/usr/bin/env python3
"""
Simple test for Interview Scheduling API
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5003"

print("\n" + "="*60)
print("TESTING INTERVIEW SCHEDULING API")
print("="*60)

# Test 1: Create Interview
print("\n1. Creating interview...")
future_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

interview_data = {
    "shortlist_id": "sl_test_001",
    "recruiter_id": "recruiter_001",
    "interview_type": "video",
    "interview_round": 1,
    "interview_title": "Technical Interview",
    "scheduled_date": future_date,
    "scheduled_time": "14:00:00",
    "duration_minutes": 60,
    "meeting_link": "https://zoom.us/j/123456789",
    "meeting_platform": "zoom",
    "notes": "Focus on Python and React skills"
}

response = requests.post(f"{BASE_URL}/api/recruiter/interviews/create", json=interview_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 201:
    interview_id = response.json().get('interview_id')
    print(f"\n✅ Interview created: {interview_id}")
    
    # Test 2: Get interview details
    print(f"\n2. Getting interview details...")
    response = requests.get(f"{BASE_URL}/api/recruiter/interviews/{interview_id}")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Interview details retrieved")
    
    # Test 3: Get interviews by JD
    print(f"\n3. Getting interviews by JD...")
    response = requests.get(f"{BASE_URL}/api/recruiter/interviews/jd/jd_test_001")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        count = response.json().get('count', 0)
        print(f"✅ Found {count} interview(s)")
    
    # Test 4: Get statistics
    print(f"\n4. Getting statistics...")
    response = requests.get(f"{BASE_URL}/api/recruiter/interviews/stats/jd_test_001")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json().get('stats', {})
        print(f"✅ Statistics: {json.dumps(stats, indent=2)}")
else:
    print(f"\n❌ Failed to create interview")

print("\n" + "="*60)

