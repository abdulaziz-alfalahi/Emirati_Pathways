#!/usr/bin/env python3
"""
End-to-End Recruitment Workflow Tests
Tests the complete recruitment flow from JD creation to offer acceptance
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5005"

class TestResult:
    def __init__(self, name, passed, details="", data=None):
        self.name = name
        self.passed = passed
        self.details = details
        self.data = data

def test_step(name, func):
    """Execute a test step and return result"""
    try:
        result = func()
        if result.get('success', False) or result.get('status') == 'success':
            return TestResult(name, True, "Success", result)
        else:
            return TestResult(name, False, f"Failed: {result.get('message', 'Unknown error')}", result)
    except Exception as e:
        return TestResult(name, False, f"Exception: {str(e)}")

def print_result(result, step_num):
    """Print test result with formatting"""
    status = "✅ PASS" if result.passed else "❌ FAIL"
    print(f"\n{step_num}. {result.name}: {status}")
    if result.details:
        print(f"   Details: {result.details}")
    if result.data and not result.passed:
        print(f"   Response: {json.dumps(result.data, indent=2)[:500]}")

def run_recruitment_workflow_tests():
    """Run complete recruitment workflow tests"""
    print("=" * 70)
    print("END-TO-END RECRUITMENT WORKFLOW TESTS")
    print("=" * 70)
    print(f"Base URL: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    results = []
    workflow_data = {}
    
    # =========================================================================
    # PHASE 1: JOB DESCRIPTION CREATION
    # =========================================================================
    print("\n" + "=" * 70)
    print("PHASE 1: JOB DESCRIPTION CREATION")
    print("=" * 70)
    
    # Step 1.1: Get JD Templates
    def get_jd_templates():
        resp = requests.get(f"{BASE_URL}/api/recruiter/jd/templates", timeout=10)
        data = resp.json()
        if data.get('success') and data.get('data'):
            workflow_data['templates'] = data['data']
            return {'success': True, 'message': f"Found {len(data['data'])} templates"}
        return data
    
    result = test_step("Get JD Templates", get_jd_templates)
    results.append(result)
    print_result(result, "1.1")
    
    # Step 1.2: Create Job Description
    def create_job_description():
        jd_data = {
            "title": "Senior Software Engineer",
            "company": "Emirates Tech Solutions",
            "department": "Engineering",
            "location": "Dubai, UAE",
            "employment_type": "Full-time",
            "experience_required": "5+ years",
            "salary_range": "AED 25,000 - 35,000",
            "description": "We are looking for a Senior Software Engineer to join our team.",
            "requirements": [
                "5+ years of software development experience",
                "Strong knowledge of Python, JavaScript, and cloud technologies",
                "Experience with agile methodologies",
                "Excellent communication skills"
            ],
            "responsibilities": [
                "Design and develop scalable software solutions",
                "Lead technical discussions and code reviews",
                "Mentor junior developers",
                "Collaborate with cross-functional teams"
            ],
            "skills": ["Python", "JavaScript", "AWS", "Docker", "Kubernetes"],
            "emiratization_target": True
        }
        resp = requests.post(f"{BASE_URL}/api/recruiter/jd/create", json=jd_data, timeout=10)
        data = resp.json()
        if data.get('success') and data.get('data'):
            workflow_data['jd_id'] = data['data'].get('id', 'jd_001')
            return {'success': True, 'message': f"Created JD with ID: {workflow_data['jd_id']}"}
        return data
    
    result = test_step("Create Job Description", create_job_description)
    results.append(result)
    print_result(result, "1.2")
    
    # Step 1.3: Get JD List
    def get_jd_list():
        resp = requests.get(f"{BASE_URL}/api/recruiter/jd/list", timeout=10)
        data = resp.json()
        if data.get('success'):
            return {'success': True, 'message': f"Found {len(data.get('data', []))} job descriptions"}
        return data
    
    result = test_step("Get JD List", get_jd_list)
    results.append(result)
    print_result(result, "1.3")
    
    # =========================================================================
    # PHASE 2: AI CANDIDATE MATCHING
    # =========================================================================
    print("\n" + "=" * 70)
    print("PHASE 2: AI CANDIDATE MATCHING")
    print("=" * 70)
    
    # Step 2.1: Run AI Matching
    def run_ai_matching():
        match_data = {
            "jd_id": workflow_data.get('jd_id', 'jd_001'),
            "criteria": {
                "skills": ["Python", "JavaScript", "AWS"],
                "experience_min": 3,
                "location": "Dubai"
            }
        }
        resp = requests.post(f"{BASE_URL}/api/recruiter/match", json=match_data, timeout=15)
        data = resp.json()
        if data.get('success') and data.get('data'):
            matches = data['data'].get('matches', data['data'])
            if isinstance(matches, list) and len(matches) > 0:
                workflow_data['matched_candidates'] = matches
                workflow_data['top_candidate'] = matches[0]
                return {'success': True, 'message': f"Found {len(matches)} matching candidates"}
        return data
    
    result = test_step("Run AI Candidate Matching", run_ai_matching)
    results.append(result)
    print_result(result, "2.1")
    
    # Step 2.2: Get Match Details
    def get_match_details():
        if not workflow_data.get('top_candidate'):
            return {'success': False, 'message': 'No candidate to get details for'}
        candidate_id = workflow_data['top_candidate'].get('id', workflow_data['top_candidate'].get('candidate_id', '1'))
        resp = requests.get(f"{BASE_URL}/api/recruiter/candidates/{candidate_id}", timeout=10)
        data = resp.json()
        if resp.status_code == 200:
            return {'success': True, 'message': f"Got details for candidate {candidate_id}"}
        return data
    
    result = test_step("Get Candidate Details", get_match_details)
    results.append(result)
    print_result(result, "2.2")
    
    # =========================================================================
    # PHASE 3: SHORTLISTING
    # =========================================================================
    print("\n" + "=" * 70)
    print("PHASE 3: SHORTLISTING")
    print("=" * 70)
    
    # Step 3.1: Add to Shortlist
    def add_to_shortlist():
        candidate = workflow_data.get('top_candidate', {})
        candidate_id = candidate.get('id', candidate.get('candidate_id', '1'))
        shortlist_data = {
            "candidate_id": candidate_id,
            "jd_id": workflow_data.get('jd_id', 'jd_001'),
            "notes": "Strong technical background, good culture fit",
            "rating": 4.5
        }
        resp = requests.post(f"{BASE_URL}/api/recruiter/shortlist", json=shortlist_data, timeout=10)
        data = resp.json()
        if data.get('success'):
            workflow_data['shortlist_id'] = data.get('data', {}).get('id', 'sl_001')
            return {'success': True, 'message': f"Added candidate to shortlist"}
        return data
    
    result = test_step("Add Candidate to Shortlist", add_to_shortlist)
    results.append(result)
    print_result(result, "3.1")
    
    # Step 3.2: Get Shortlist
    def get_shortlist():
        resp = requests.get(f"{BASE_URL}/api/recruiter/shortlist", timeout=10)
        data = resp.json()
        if data.get('success'):
            count = len(data.get('data', []))
            return {'success': True, 'message': f"Shortlist has {count} candidates"}
        return data
    
    result = test_step("Get Shortlist", get_shortlist)
    results.append(result)
    print_result(result, "3.2")
    
    # =========================================================================
    # PHASE 4: INTERVIEW SCHEDULING
    # =========================================================================
    print("\n" + "=" * 70)
    print("PHASE 4: INTERVIEW SCHEDULING")
    print("=" * 70)
    
    # Step 4.1: Schedule Interview
    def schedule_interview():
        candidate = workflow_data.get('top_candidate', {})
        candidate_id = candidate.get('id', candidate.get('candidate_id', '1'))
        interview_data = {
            "candidate_id": candidate_id,
            "jd_id": workflow_data.get('jd_id', 'jd_001'),
            "interview_type": "technical",
            "scheduled_date": "2025-01-15",
            "scheduled_time": "10:00",
            "duration_minutes": 60,
            "interviewers": ["interviewer_1", "interviewer_2"],
            "location": "Virtual - Microsoft Teams",
            "notes": "Technical interview focusing on system design"
        }
        resp = requests.post(f"{BASE_URL}/api/interviews/schedule", json=interview_data, timeout=10)
        data = resp.json()
        if data.get('success') and data.get('data'):
            workflow_data['interview_id'] = data['data'].get('id', 'int_001')
            return {'success': True, 'message': f"Scheduled interview: {workflow_data['interview_id']}"}
        return data
    
    result = test_step("Schedule Interview", schedule_interview)
    results.append(result)
    print_result(result, "4.1")
    
    # Step 4.2: Get Interview Sessions
    def get_interview_sessions():
        resp = requests.get(f"{BASE_URL}/api/interviews/sessions", timeout=10)
        data = resp.json()
        if data.get('success'):
            count = len(data.get('data', []))
            return {'success': True, 'message': f"Found {count} interview sessions"}
        return data
    
    result = test_step("Get Interview Sessions", get_interview_sessions)
    results.append(result)
    print_result(result, "4.2")
    
    # Step 4.3: Update Interview Status
    def update_interview_status():
        interview_id = workflow_data.get('interview_id', 'int_001')
        status_data = {"status": "completed", "outcome": "passed"}
        resp = requests.put(f"{BASE_URL}/api/interviews/sessions/{interview_id}/status", json=status_data, timeout=10)
        data = resp.json()
        if data.get('success'):
            return {'success': True, 'message': "Interview marked as completed"}
        return data
    
    result = test_step("Update Interview Status", update_interview_status)
    results.append(result)
    print_result(result, "4.3")
    
    # =========================================================================
    # PHASE 5: OFFER CREATION
    # =========================================================================
    print("\n" + "=" * 70)
    print("PHASE 5: OFFER CREATION")
    print("=" * 70)
    
    # Step 5.1: Create Offer
    def create_offer():
        candidate = workflow_data.get('top_candidate', {})
        candidate_id = candidate.get('id', candidate.get('candidate_id', '1'))
        offer_data = {
            "candidate_id": candidate_id,
            "jd_id": workflow_data.get('jd_id', 'jd_001'),
            "position": "Senior Software Engineer",
            "department": "Engineering",
            "salary": 30000,
            "currency": "AED",
            "start_date": "2025-02-01",
            "benefits": ["Health Insurance", "Annual Leave", "Training Budget"],
            "expiry_date": "2025-01-20"
        }
        resp = requests.post(f"{BASE_URL}/api/recruiter/offers", json=offer_data, timeout=10)
        data = resp.json()
        if data.get('success') and data.get('data'):
            workflow_data['offer_id'] = data['data'].get('id', 'offer_001')
            return {'success': True, 'message': f"Created offer: {workflow_data['offer_id']}"}
        return data
    
    result = test_step("Create Offer", create_offer)
    results.append(result)
    print_result(result, "5.1")
    
    # Step 5.2: Get Offers List
    def get_offers():
        resp = requests.get(f"{BASE_URL}/api/recruiter/offers", timeout=10)
        data = resp.json()
        if data.get('success'):
            count = len(data.get('data', []))
            return {'success': True, 'message': f"Found {count} offers"}
        return data
    
    result = test_step("Get Offers List", get_offers)
    results.append(result)
    print_result(result, "5.2")
    
    # =========================================================================
    # PHASE 6: HR APPROVAL WORKFLOW
    # =========================================================================
    print("\n" + "=" * 70)
    print("PHASE 6: HR APPROVAL WORKFLOW")
    print("=" * 70)
    
    # Step 6.1: Get Pending Approvals
    def get_pending_approvals():
        resp = requests.get(f"{BASE_URL}/api/hr/approvals/pending", timeout=10)
        data = resp.json()
        if data.get('success'):
            count = len(data.get('data', []))
            return {'success': True, 'message': f"Found {count} pending approvals"}
        return data
    
    result = test_step("Get Pending Approvals", get_pending_approvals)
    results.append(result)
    print_result(result, "6.1")
    
    # Step 6.2: Test Approval Delegation
    def test_approval_delegation():
        delegation_data = {
            "delegatee_id": "hr_user_2",
            "approval_types": ["offer", "interview"],
            "start_date": "2025-01-01",
            "end_date": "2025-01-31",
            "reason": "Annual leave coverage"
        }
        resp = requests.post(f"{BASE_URL}/api/hr/approvals/delegate", json=delegation_data, timeout=10)
        data = resp.json()
        if data.get('success'):
            return {'success': True, 'message': "Delegation created successfully"}
        return data
    
    result = test_step("Test Approval Delegation", test_approval_delegation)
    results.append(result)
    print_result(result, "6.2")
    
    # =========================================================================
    # PHASE 7: CANDIDATE PERSPECTIVE
    # =========================================================================
    print("\n" + "=" * 70)
    print("PHASE 7: CANDIDATE PERSPECTIVE")
    print("=" * 70)
    
    # Step 7.1: Get Job Matches for Candidate
    def get_candidate_job_matches():
        resp = requests.get(f"{BASE_URL}/api/candidate/job-matches", timeout=10)
        data = resp.json()
        if data.get('success') or (isinstance(data.get('data'), list) and len(data.get('data', [])) > 0):
            count = len(data.get('data', data.get('matches', [])))
            return {'success': True, 'message': f"Found {count} job matches for candidate"}
        return data
    
    result = test_step("Get Candidate Job Matches", get_candidate_job_matches)
    results.append(result)
    print_result(result, "7.1")
    
    # Step 7.2: Get Candidate Applications
    def get_candidate_applications():
        resp = requests.get(f"{BASE_URL}/api/candidate/applications", timeout=10)
        data = resp.json()
        if data.get('success'):
            count = len(data.get('data', []))
            return {'success': True, 'message': f"Found {count} applications"}
        return data
    
    result = test_step("Get Candidate Applications", get_candidate_applications)
    results.append(result)
    print_result(result, "7.2")
    
    # Step 7.3: Apply for Job
    def apply_for_job():
        application_data = {
            "job_id": workflow_data.get('jd_id', 'jd_001'),
            "cover_letter": "I am excited to apply for this position...",
            "resume_id": "cv_001"
        }
        resp = requests.post(f"{BASE_URL}/api/candidate/applications", json=application_data, timeout=10)
        data = resp.json()
        if data.get('success'):
            return {'success': True, 'message': "Application submitted successfully"}
        return data
    
    result = test_step("Apply for Job", apply_for_job)
    results.append(result)
    print_result(result, "7.3")
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in results if r.passed)
    failed = sum(1 for r in results if not r.passed)
    total = len(results)
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed} ({pass_rate:.1f}%)")
    print(f"Failed: {failed}")
    
    print("\n" + "-" * 70)
    print("DETAILED RESULTS:")
    print("-" * 70)
    
    for i, result in enumerate(results, 1):
        status = "✅" if result.passed else "❌"
        print(f"{status} {i:2d}. {result.name}")
    
    print("\n" + "=" * 70)
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'pass_rate': pass_rate,
        'results': [(r.name, r.passed, r.details) for r in results]
    }

if __name__ == "__main__":
    run_recruitment_workflow_tests()
