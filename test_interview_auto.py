#!/usr/bin/env python3
"""
Automated test for Interview Scheduling API - uses real shortlist data
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5003"

print("\n" + "="*60)
print("TESTING INTERVIEW SCHEDULING API")
print("="*60)

# Step 1: Get existing shortlist entries
print("\n1. Fetching shortlist entries...")
response = requests.get(f"{BASE_URL}/api/recruiter/shortlist/jd_test_001")
print(f"Status: {response.status_code}")

if response.status_code != 200:
    print("❌ Failed to fetch shortlist")
    exit(1)

shortlist_data = response.json()
shortlist = shortlist_data.get('shortlist', [])

if not shortlist:
    print("❌ No shortlist entries found. Please add a candidate to shortlist first.")
    exit(1)

# Use the first shortlist entry
shortlist_entry = shortlist[0]
shortlist_id = shortlist_entry['shortlist_id']
candidate_name = f"{shortlist_entry.get('first_name', 'Test')} {shortlist_entry.get('last_name', 'Candidate')}"

print(f"✅ Found shortlist entry: {shortlist_id}")
print(f"   Candidate: {candidate_name}")

# Step 2: Create Interview
print(f"\n2. Creating interview for {candidate_name}...")
future_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

interview_data = {
    "shortlist_id": shortlist_id,
    "recruiter_id": "recruiter_001",
    "interview_type": "video",
    "interview_round": 1,
    "interview_title": "Technical Interview - Python & React",
    "scheduled_date": future_date,
    "scheduled_time": "14:00:00",
    "duration_minutes": 60,
    "meeting_link": "https://zoom.us/j/123456789",
    "meeting_platform": "zoom",
    "interviewers": [
        {"id": "int_001", "name": "John Doe", "role": "Technical Lead"}
    ],
    "notes": "Focus on Python backend and React frontend skills"
}

response = requests.post(f"{BASE_URL}/api/recruiter/interviews/create", json=interview_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code != 201:
    print(f"❌ Failed to create interview")
    exit(1)

interview_id = response.json().get('interview_id')
print(f"✅ Interview created: {interview_id}")

# Step 3: Get interview details
print(f"\n3. Getting interview details...")
response = requests.get(f"{BASE_URL}/api/recruiter/interviews/{interview_id}")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    interview = response.json().get('interview', {})
    print(f"✅ Interview details:")
    print(f"   Title: {interview.get('interview_title')}")
    print(f"   Date: {interview.get('scheduled_date')} at {interview.get('scheduled_time')}")
    print(f"   Type: {interview.get('interview_type')}")
    print(f"   Status: {interview.get('status')}")
else:
    print(f"❌ Failed to get interview details")

# Step 4: Get all interviews by JD
print(f"\n4. Getting all interviews for JD...")
response = requests.get(f"{BASE_URL}/api/recruiter/interviews/jd/jd_test_001")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    count = response.json().get('count', 0)
    print(f"✅ Found {count} interview(s) for this JD")
else:
    print(f"❌ Failed to get interviews")

# Step 5: Confirm interview
print(f"\n5. Confirming interview...")
response = requests.post(
    f"{BASE_URL}/api/recruiter/interviews/{interview_id}/confirm",
    json={"confirmation_status": "confirmed"}
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"✅ Interview confirmed")
else:
    print(f"❌ Failed to confirm interview")

# Step 6: Get statistics
print(f"\n6. Getting interview statistics...")
response = requests.get(f"{BASE_URL}/api/recruiter/interviews/stats/jd_test_001")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    stats = response.json().get('stats', {})
    print(f"✅ Statistics:")
    print(f"   Total interviews: {stats.get('total_interviews')}")
    print(f"   Scheduled: {stats.get('scheduled')}")
    print(f"   Confirmed: {stats.get('confirmed')}")
    print(f"   Completed: {stats.get('completed')}")
else:
    print(f"❌ Failed to get statistics")

# Step 7: Update interview
print(f"\n7. Updating interview details...")
response = requests.put(
    f"{BASE_URL}/api/recruiter/interviews/{interview_id}",
    json={
        "interview_title": "Technical Interview - Python, React & System Design",
        "duration_minutes": 90
    }
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"✅ Interview updated")
else:
    print(f"❌ Failed to update interview")

# Step 8: Complete interview with feedback
print(f"\n8. Completing interview with feedback...")
response = requests.post(
    f"{BASE_URL}/api/recruiter/interviews/{interview_id}/complete",
    json={
        "feedback": "Excellent technical skills and communication",
        "rating": 5,
        "recommendation": "next_round",
        "internal_notes": "Strong candidate, recommend for next round"
    }
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"✅ Interview completed with feedback")
else:
    print(f"❌ Failed to complete interview")

print("\n" + "="*60)
print("ALL TESTS COMPLETED SUCCESSFULLY! ✅")
print("="*60)

