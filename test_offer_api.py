"""
Test script for Offer Management API
Tests all offer management endpoints
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5003/api/recruiter/offers"

def print_section(title):
    """Print section header"""
    print("\n" + "="*60)
    print(title)
    print("="*60 + "\n")

def test_create_offer():
    """Test creating a new offer"""
    print("1. Creating job offer...")
    
    # Calculate dates
    start_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    response_deadline = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    offer_data = {
        "jd_id": "jd_test_001",
        "shortlist_id": "sl_20251030_232607_139190d1",
        "candidate_id": "candidate_123",
        "recruiter_id": "recruiter_001",
        "position_title": "Senior Software Engineer",
        "department": "Engineering",
        "employment_type": "full_time",
        "start_date": start_date,
        "salary_amount": 180000,
        "salary_currency": "AED",
        "salary_period": "annual",
        "bonus_amount": 20000,
        "equity_percentage": 0.5,
        "benefits": {
            "health_insurance": True,
            "housing_allowance": 36000,
            "transportation_allowance": 12000,
            "annual_leave_days": 30,
            "flight_tickets": 2
        },
        "probation_period_months": 3,
        "notice_period_days": 30,
        "work_location": "Dubai, UAE",
        "remote_work_policy": "hybrid",
        "response_deadline": response_deadline,
        "notes": "Excellent candidate with strong technical skills"
    }
    
    response = requests.post(f"{BASE_URL}/create", json=offer_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        print("✅ Offer created successfully")
        return response.json()['offer_id']
    else:
        print("❌ Failed to create offer")
        return None

def test_get_offers_by_jd(jd_id):
    """Test getting all offers for a JD"""
    print(f"\n2. Getting all offers for JD: {jd_id}...")
    
    response = requests.get(f"{BASE_URL}/jd/{jd_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data['offers'])} offer(s)")
        for offer in data['offers']:
            print(f"   - {offer['offer_id']}: {offer['position_title']} - Status: {offer['status']}")
        return data['offers']
    else:
        print("❌ Failed to get offers")
        return []

def test_get_offer_details(offer_id):
    """Test getting offer details"""
    print(f"\n3. Getting details for offer: {offer_id}...")
    
    response = requests.get(f"{BASE_URL}/{offer_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        offer = response.json()['offer']
        print("✅ Offer details:")
        print(f"   Position: {offer['position_title']}")
        print(f"   Salary: {offer['salary_amount']} {offer['salary_currency']} ({offer['salary_period']})")
        print(f"   Status: {offer['status']}")
        print(f"   Benefits: {json.dumps(offer.get('benefits', {}), indent=6)}")
        return True
    else:
        print("❌ Failed to get offer details")
        return False

def test_update_offer(offer_id):
    """Test updating offer details"""
    print(f"\n4. Updating offer: {offer_id}...")
    
    updates = {
        "salary_amount": 190000,
        "bonus_amount": 25000,
        "notes": "Updated salary after negotiation"
    }
    
    response = requests.put(f"{BASE_URL}/{offer_id}", json=updates)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Offer updated successfully")
        return True
    else:
        print("❌ Failed to update offer")
        return False

def test_send_offer(offer_id):
    """Test sending offer to candidate"""
    print(f"\n5. Sending offer: {offer_id}...")
    
    data = {
        "send_method": "email",
        "message": "Congratulations! Please review the attached offer."
    }
    
    response = requests.post(f"{BASE_URL}/{offer_id}/send", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Offer sent successfully")
        return True
    else:
        print("❌ Failed to send offer")
        return False

def test_record_response(offer_id, response_type):
    """Test recording candidate response"""
    print(f"\n6. Recording candidate response ({response_type})...")
    
    data = {
        "response": response_type,
        "notes": f"Candidate {response_type} the offer"
    }
    
    response = requests.post(f"{BASE_URL}/{offer_id}/response", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print(f"✅ Response '{response_type}' recorded successfully")
        return True
    else:
        print(f"❌ Failed to record response")
        return False

def test_start_negotiation(offer_id):
    """Test starting negotiation"""
    print(f"\n7. Starting negotiation for offer: {offer_id}...")
    
    data = {
        "notes": "Candidate requested higher salary and additional benefits"
    }
    
    response = requests.post(f"{BASE_URL}/{offer_id}/negotiate", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Negotiation started successfully")
        return True
    else:
        print("❌ Failed to start negotiation")
        return False

def test_approve_offer(offer_id):
    """Test approving offer"""
    print(f"\n8. Approving offer: {offer_id}...")
    
    data = {
        "approved_by": "manager_001",
        "notes": "Approved by hiring manager"
    }
    
    response = requests.post(f"{BASE_URL}/{offer_id}/approve", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Offer approved successfully")
        return True
    else:
        print("❌ Failed to approve offer")
        return False

def test_get_statistics(jd_id):
    """Test getting offer statistics"""
    print(f"\n9. Getting offer statistics for JD: {jd_id}...")
    
    response = requests.get(f"{BASE_URL}/stats/{jd_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        stats = response.json()['stats']
        print("✅ Statistics:")
        print(f"   Total offers: {stats.get('total_offers', 0)}")
        print(f"   Draft: {stats.get('draft', 0)}")
        print(f"   Sent: {stats.get('sent', 0)}")
        print(f"   Accepted: {stats.get('accepted', 0)}")
        print(f"   Rejected: {stats.get('rejected', 0)}")
        print(f"   Negotiating: {stats.get('negotiating', 0)}")
        print(f"   Acceptance rate: {stats.get('acceptance_rate', 0)}%")
        return True
    else:
        print("❌ Failed to get statistics")
        return False

def test_withdraw_offer(offer_id):
    """Test withdrawing offer"""
    print(f"\n10. Withdrawing offer: {offer_id}...")
    
    data = {
        "reason": "Position filled by another candidate"
    }
    
    response = requests.post(f"{BASE_URL}/{offer_id}/withdraw", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Offer withdrawn successfully")
        return True
    else:
        print("❌ Failed to withdraw offer")
        return False

def main():
    """Run all tests"""
    print_section("TESTING OFFER MANAGEMENT API")
    
    # Test 1: Create offer
    offer_id = test_create_offer()
    if not offer_id:
        print("\n❌ Cannot continue tests without offer_id")
        return
    
    # Test 2: Get offers by JD
    test_get_offers_by_jd("jd_test_001")
    
    # Test 3: Get offer details
    test_get_offer_details(offer_id)
    
    # Test 4: Update offer (only works in draft status)
    test_update_offer(offer_id)
    
    # Test 5: Approve offer
    test_approve_offer(offer_id)
    
    # Test 6: Send offer
    test_send_offer(offer_id)
    
    # Test 7: Record candidate response (negotiating)
    test_record_response(offer_id, "negotiating")
    
    # Test 8: Start negotiation
    test_start_negotiation(offer_id)
    
    # Test 9: Get statistics
    test_get_statistics("jd_test_001")
    
    # Test 10: Get updated offer details
    print("\n11. Getting updated offer details...")
    test_get_offer_details(offer_id)
    
    print_section("ALL TESTS COMPLETED ✅")

if __name__ == "__main__":
    main()

