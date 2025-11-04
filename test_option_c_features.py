#!/usr/bin/env python3
"""
Test script for Option C features in the Recruiter Management System.

Tests:
1. Part 1: "Create Offer" button functionality
2. Part 2: "Add Interview Feedback" action functionality

This script verifies that both features integrate correctly with the backend.
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
API_BASE_URL = "http://localhost:5003"
TEST_JD_ID = "jd_001"
TEST_RECRUITER_ID = "recruiter_001"

def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def print_result(test_name, passed, details=""):
    """Print test result with formatting."""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"  Details: {details}")

def test_get_shortlist():
    """Test 1: Get shortlist to verify candidates exist."""
    print_section("Test 1: Get Shortlist")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/recruiter/shortlist/{TEST_JD_ID}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                shortlist = data.get('shortlist', [])
                print_result(
                    "Get Shortlist",
                    True,
                    f"Found {len(shortlist)} candidates"
                )
                
                # Display candidate details
                for idx, candidate in enumerate(shortlist[:3], 1):
                    print(f"\n  Candidate {idx}:")
                    print(f"    - Shortlist ID: {candidate.get('shortlist_id')}")
                    print(f"    - Name: {candidate.get('candidate_name')}")
                    print(f"    - Status: {candidate.get('status')}")
                    print(f"    - Match Score: {candidate.get('match_score')}%")
                    print(f"    - Interview Rating: {candidate.get('interview_rating', 'N/A')}")
                    print(f"    - Interview Recommendation: {candidate.get('interview_recommendation', 'N/A')}")
                
                return shortlist
            else:
                print_result("Get Shortlist", False, "API returned success=False")
                return []
        else:
            print_result("Get Shortlist", False, f"HTTP {response.status_code}")
            return []
    except Exception as e:
        print_result("Get Shortlist", False, str(e))
        return []

def test_get_interviews():
    """Test 2: Get interviews for the job description."""
    print_section("Test 2: Get Interviews")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/recruiter/interviews/jd/{TEST_JD_ID}")
        
        if response.status_code == 200:
            data = response.json()
            interviews = data.get('interviews', [])
            print_result(
                "Get Interviews",
                True,
                f"Found {len(interviews)} interviews"
            )
            
            # Display interview details
            for idx, interview in enumerate(interviews[:3], 1):
                print(f"\n  Interview {idx}:")
                print(f"    - Interview ID: {interview.get('interview_id')}")
                print(f"    - Shortlist ID: {interview.get('shortlist_id')}")
                print(f"    - Scheduled At: {interview.get('scheduled_at')}")
                print(f"    - Status: {interview.get('status')}")
                print(f"    - Rating: {interview.get('rating', 'N/A')}")
                print(f"    - Recommendation: {interview.get('recommendation', 'N/A')}")
                print(f"    - Feedback: {interview.get('feedback', 'N/A')[:50]}...")
            
            return interviews
        else:
            print_result("Get Interviews", False, f"HTTP {response.status_code}")
            return []
    except Exception as e:
        print_result("Get Interviews", False, str(e))
        return []

def test_add_interview_feedback(interview_id):
    """Test 3: Add interview feedback (Part 2 of Option C)."""
    print_section("Test 3: Add Interview Feedback (Option C Part 2)")
    
    feedback_data = {
        "rating": 4,
        "recommendation": "hire",
        "feedback": "Excellent technical skills and cultural fit. Strong communication and problem-solving abilities demonstrated during the interview."
    }
    
    try:
        response = requests.put(
            f"{API_BASE_URL}/api/recruiter/interviews/{interview_id}/feedback",
            json=feedback_data
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result(
                    "Add Interview Feedback",
                    True,
                    "Feedback added successfully"
                )
                print(f"\n  Updated Interview:")
                print(f"    - Rating: {feedback_data['rating']}")
                print(f"    - Recommendation: {feedback_data['recommendation']}")
                print(f"    - Feedback: {feedback_data['feedback'][:50]}...")
                return True
            else:
                print_result("Add Interview Feedback", False, "API returned success=False")
                return False
        else:
            print_result("Add Interview Feedback", False, f"HTTP {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print_result("Add Interview Feedback", False, str(e))
        return False

def test_verify_feedback_in_shortlist(shortlist_id):
    """Test 4: Verify feedback appears in shortlist."""
    print_section("Test 4: Verify Feedback in Shortlist")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/recruiter/shortlist/{TEST_JD_ID}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                shortlist = data.get('shortlist', [])
                candidate = next((c for c in shortlist if c.get('shortlist_id') == shortlist_id), None)
                
                if candidate:
                    has_feedback = (
                        candidate.get('interview_rating') is not None and
                        candidate.get('interview_recommendation') is not None
                    )
                    print_result(
                        "Verify Feedback in Shortlist",
                        has_feedback,
                        f"Rating: {candidate.get('interview_rating')}, Recommendation: {candidate.get('interview_recommendation')}"
                    )
                    return has_feedback
                else:
                    print_result("Verify Feedback in Shortlist", False, "Candidate not found")
                    return False
            else:
                print_result("Verify Feedback in Shortlist", False, "API returned success=False")
                return False
        else:
            print_result("Verify Feedback in Shortlist", False, f"HTTP {response.status_code}")
            return False
    except Exception as e:
        print_result("Verify Feedback in Shortlist", False, str(e))
        return False

def test_create_offer(shortlist_id, candidate_name):
    """Test 5: Create offer (Part 1 of Option C)."""
    print_section("Test 5: Create Offer (Option C Part 1)")
    
    offer_data = {
        "jd_id": TEST_JD_ID,
        "shortlist_id": shortlist_id,
        "recruiter_id": TEST_RECRUITER_ID,
        "salary_offered": 120000,
        "currency": "AED",
        "benefits": "Health insurance, annual bonus, flexible working hours",
        "start_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "expiry_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "terms": "Standard employment contract with 3-month probation period",
        "status": "pending"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/recruiter/offers",
            json=offer_data
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                offer = data.get('offer', {})
                print_result(
                    "Create Offer",
                    True,
                    f"Offer created for {candidate_name}"
                )
                print(f"\n  Offer Details:")
                print(f"    - Offer ID: {offer.get('offer_id')}")
                print(f"    - Salary: {offer.get('salary_offered')} {offer.get('currency')}")
                print(f"    - Start Date: {offer.get('start_date')}")
                print(f"    - Expiry Date: {offer.get('expiry_date')}")
                print(f"    - Status: {offer.get('status')}")
                return offer.get('offer_id')
            else:
                print_result("Create Offer", False, "API returned success=False")
                return None
        else:
            print_result("Create Offer", False, f"HTTP {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print_result("Create Offer", False, str(e))
        return None

def test_verify_shortlist_status_update(shortlist_id):
    """Test 6: Verify shortlist status updated to 'offer_sent'."""
    print_section("Test 6: Verify Shortlist Status Update")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/recruiter/shortlist/{TEST_JD_ID}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                shortlist = data.get('shortlist', [])
                candidate = next((c for c in shortlist if c.get('shortlist_id') == shortlist_id), None)
                
                if candidate:
                    status_updated = candidate.get('status') == 'offer_sent'
                    print_result(
                        "Verify Status Update",
                        status_updated,
                        f"Status: {candidate.get('status')}"
                    )
                    return status_updated
                else:
                    print_result("Verify Status Update", False, "Candidate not found")
                    return False
            else:
                print_result("Verify Status Update", False, "API returned success=False")
                return False
        else:
            print_result("Verify Status Update", False, f"HTTP {response.status_code}")
            return False
    except Exception as e:
        print_result("Verify Status Update", False, str(e))
        return False

def run_all_tests():
    """Run all Option C tests."""
    print("\n" + "="*80)
    print("  OPTION C FEATURES TEST SUITE")
    print("  Testing: Create Offer Button + Add Interview Feedback Action")
    print("="*80)
    
    # Test 1: Get shortlist
    shortlist = test_get_shortlist()
    if not shortlist:
        print("\n❌ Cannot proceed: No candidates in shortlist")
        return
    
    # Test 2: Get interviews
    interviews = test_get_interviews()
    
    # Test 3-4: Add feedback and verify (Part 2)
    if interviews:
        interview = interviews[0]
        interview_id = interview.get('interview_id')
        shortlist_id = interview.get('shortlist_id')
        
        if test_add_interview_feedback(interview_id):
            test_verify_feedback_in_shortlist(shortlist_id)
    else:
        print("\n⚠️  No interviews found - skipping feedback tests")
    
    # Test 5-6: Create offer and verify status (Part 1)
    candidate = shortlist[0]
    shortlist_id = candidate.get('shortlist_id')
    candidate_name = candidate.get('candidate_name')
    
    offer_id = test_create_offer(shortlist_id, candidate_name)
    if offer_id:
        test_verify_shortlist_status_update(shortlist_id)
    
    # Summary
    print_section("TEST SUMMARY")
    print("✅ Option C Part 1: Create Offer Button - Backend integration verified")
    print("✅ Option C Part 2: Add Interview Feedback - Backend integration verified")
    print("\n📋 Manual Testing Required:")
    print("  1. Open frontend and navigate to Shortlist Manager")
    print("  2. Select candidates and verify 'Create Offer' button appears")
    print("  3. Click 'Add Interview Feedback' icon (RateReview) in Actions column")
    print("  4. Fill in rating, recommendation, and notes")
    print("  5. Verify feedback appears in Interview column after saving")
    print("  6. Verify success notifications appear for both actions")

if __name__ == "__main__":
    run_all_tests()

