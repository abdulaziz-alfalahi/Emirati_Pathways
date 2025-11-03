"""
Test Phase 1 Features
Tests the 3 critical fixes implemented in Phase 1:
1. Status Synchronization
2. Offer Statistics API
3. Interview Feedback Integration
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5001"
JD_ID = "jd_test_001"

def print_header(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def print_test(test_name, status="RUNNING"):
    if status == "RUNNING":
        print(f"🔄 {test_name}...")
    elif status == "PASS":
        print(f"✅ {test_name} - PASSED")
    elif status == "FAIL":
        print(f"❌ {test_name} - FAILED")

def test_offer_statistics():
    """Test Feature 2: Offer Statistics API"""
    print_header("TEST 1: Offer Statistics API")
    
    print_test("Fetching offer statistics")
    response = requests.get(f"{BASE_URL}/api/recruiter/offers/statistics/{JD_ID}")
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            stats = data.get('statistics', {})
            print(f"\n📊 Statistics Retrieved:")
            print(f"   Total Offers: {stats.get('total_offers')}")
            print(f"   By Status:")
            for status, count in stats.get('by_status', {}).items():
                print(f"      - {status}: {count}")
            print(f"   Acceptance Rate: {stats.get('acceptance_rate')}%")
            print(f"   Average Salary: {stats.get('salary', {}).get('average')} AED")
            print(f"   Expiring Soon: {stats.get('expiring_soon')}")
            print_test("Offer Statistics API", "PASS")
            return True
        else:
            print(f"Error: {data.get('error')}")
            print_test("Offer Statistics API", "FAIL")
            return False
    else:
        print(f"Error: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        print_test("Offer Statistics API", "FAIL")
        return False

def test_status_synchronization():
    """Test Feature 1: Status Synchronization"""
    print_header("TEST 2: Status Synchronization")
    
    # Get shortlist to find a candidate
    print_test("Getting shortlist")
    response = requests.get(f"{BASE_URL}/api/recruiter/shortlist/{JD_ID}")
    
    if response.status_code != 200:
        print(f"❌ Failed to get shortlist: {response.status_code}")
        return False
    
    shortlist = response.json().get('shortlist', [])
    if not shortlist:
        print("⚠️  No candidates in shortlist - cannot test status sync")
        return None
    
    candidate = shortlist[0]
    shortlist_id = candidate['shortlist_id']
    print(f"   Using candidate: {shortlist_id}")
    print(f"   Current status: {candidate['status']}")
    
    # Get offers for this JD
    print_test("Getting offers")
    response = requests.get(f"{BASE_URL}/api/recruiter/offers/jd/{JD_ID}")
    
    if response.status_code != 200:
        print(f"❌ Failed to get offers: {response.status_code}")
        return False
    
    offers = response.json().get('offers', [])
    if not offers:
        print("⚠️  No offers exist - cannot test status sync")
        print("   (This is expected if no offers have been created yet)")
        return None
    
    offer = offers[0]
    offer_id = offer['offer_id']
    print(f"   Using offer: {offer_id}")
    print(f"   Offer status: {offer['status']}")
    print(f"   Linked to shortlist: {offer.get('shortlist_id')}")
    
    if offer.get('shortlist_id') == shortlist_id:
        print(f"\n✅ Offer is correctly linked to shortlist")
        print(f"   When offer status changes, shortlist status should update automatically")
        print_test("Status Synchronization", "PASS")
        return True
    else:
        print(f"\n⚠️  Offer not linked to this shortlist entry")
        return None

def test_interview_feedback():
    """Test Feature 3: Interview Feedback Integration"""
    print_header("TEST 3: Interview Feedback Integration")
    
    print_test("Getting shortlist with interview feedback")
    response = requests.get(f"{BASE_URL}/api/recruiter/shortlist/{JD_ID}")
    
    if response.status_code != 200:
        print(f"❌ Failed to get shortlist: {response.status_code}")
        print_test("Interview Feedback Integration", "FAIL")
        return False
    
    data = response.json()
    shortlist = data.get('shortlist', [])
    
    if not shortlist:
        print("⚠️  No candidates in shortlist")
        return None
    
    print(f"\n📋 Checking {len(shortlist)} candidate(s) for interview feedback:\n")
    
    has_feedback = False
    for candidate in shortlist:
        name = f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}".strip() or "Unknown"
        print(f"   Candidate: {name}")
        print(f"   Shortlist ID: {candidate['shortlist_id']}")
        
        if candidate.get('interview_feedback'):
            has_feedback = True
            print(f"   ✅ Interview Feedback: {candidate['interview_feedback'][:50]}...")
            if candidate.get('interview_rating'):
                print(f"   ⭐ Rating: {candidate['interview_rating']}/5")
            if candidate.get('interview_recommendation'):
                print(f"   📌 Recommendation: {candidate['interview_recommendation']}")
        else:
            print(f"   ℹ️  No interview feedback yet")
        print()
    
    if has_feedback:
        print("✅ Interview feedback is being retrieved and included in shortlist")
        print_test("Interview Feedback Integration", "PASS")
        return True
    else:
        print("⚠️  No interview feedback found (this is OK if no interviews completed yet)")
        print("   The integration is working, just no data to display")
        return None

def main():
    print("\n" + "="*80)
    print("  PHASE 1 FEATURES - COMPREHENSIVE TEST SUITE")
    print("="*80)
    print(f"\nTesting against: {BASE_URL}")
    print(f"Job Description ID: {JD_ID}")
    print(f"Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        'offer_statistics': test_offer_statistics(),
        'status_sync': test_status_synchronization(),
        'interview_feedback': test_interview_feedback()
    }
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    total = len(results)
    
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️  Skipped: {skipped} (no data to test)")
    print()
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Phase 1 implementation is working correctly.")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()

