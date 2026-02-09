#!/usr/bin/env python3
"""
Quick test to validate communication endpoints are working
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_BASE_URL = "http://localhost:5005"

def test_communication_endpoints():
    """Test communication endpoints with user 108 (recruiter)"""
    
    # Step 1: Login to get token
    print("\n1. Logging in as user 108...")
    login_response = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={
            "email": "hr@company.com",  # Update with actual recruiter email
            "password": "password123"  # Update with actual password
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    token = login_response.json().get('access_token')
    if not token:
        print("❌ No access token in response")
        return
    
    print(f"✅ Login successful, got token: {token[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Test get conversations
    print("\n2. Fetching conversations...")
    conversations_response = requests.get(
        f"{API_BASE_URL}/api/communication/conversations",
        headers=headers
    )
    
    print(f"Status Code: {conversations_response.status_code}")
    print(f"Response: {json.dumps(conversations_response.json(), indent=2)}")
    
    # Step 3: Test get notifications
    print("\n3. Fetching notifications...")
    notifications_response = requests.get(
        f"{API_BASE_URL}/api/communication/notifications",
        headers=headers
    )
    
    print(f"Status Code: {notifications_response.status_code}")
    print(f"Response: {json.dumps(notifications_response.json(), indent=2)}")

if __name__ == "__main__":
    test_communication_endpoints()
