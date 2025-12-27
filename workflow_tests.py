"""
Workflow Tests for Emirati Pathways

This script tests complete user workflows for each persona:
1. Candidate: CV upload, job search, applications
2. Recruiter: JD creation, AI matching, shortlisting
3. HR Manager: Approval workflows, delegation
4. Growth Operator: Domain-specific operations
5. Administrator: User management, domain assignment
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any, List

BASE_URL = 'http://localhost:5005'

class WorkflowTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
    
    def log(self, workflow: str, step: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅" if passed else "❌"
        print(f"{status} [{workflow}] {step}")
        if not passed and details:
            print(f"   Error: {details[:100]}")
        self.results.append({
            'workflow': workflow,
            'step': step,
            'passed': passed,
            'details': details
        })
    
    def get(self, endpoint: str, params: Dict = None) -> Dict:
        """Make GET request"""
        try:
            resp = self.session.get(f"{BASE_URL}{endpoint}", params=params, timeout=10)
            return resp.json() if resp.status_code < 500 else {'error': resp.text}
        except Exception as e:
            return {'error': str(e)}
    
    def post(self, endpoint: str, data: Dict = None) -> Dict:
        """Make POST request"""
        try:
            resp = self.session.post(f"{BASE_URL}{endpoint}", json=data, timeout=10)
            return resp.json() if resp.status_code < 500 else {'error': resp.text}
        except Exception as e:
            return {'error': str(e)}
    
    def put(self, endpoint: str, data: Dict = None) -> Dict:
        """Make PUT request"""
        try:
            resp = self.session.put(f"{BASE_URL}{endpoint}", json=data, timeout=10)
            return resp.json() if resp.status_code < 500 else {'error': resp.text}
        except Exception as e:
            return {'error': str(e)}


# =====================================================
# CANDIDATE WORKFLOW TESTS
# =====================================================

def test_candidate_workflow(tester: WorkflowTester):
    """Test complete candidate workflow"""
    print("\n" + "="*60)
    print("CANDIDATE WORKFLOW TEST")
    print("="*60)
    
    # Step 1: Create/Save CV
    cv_data = {
        'personalInfo': {
            'fullName': 'Ahmed Al Maktoum',
            'email': 'ahmed@example.com',
            'phone': '+971501234567',
            'location': 'Dubai, UAE'
        },
        'experience': [
            {
                'jobTitle': 'Software Engineer',
                'company': 'Tech Corp',
                'startDate': '2020-01',
                'endDate': '2024-12',
                'description': 'Developed web applications using Python and JavaScript'
            }
        ],
        'education': [
            {
                'degree': 'Bachelor of Computer Science',
                'institution': 'UAE University',
                'graduationYear': '2020'
            }
        ],
        'skills': [
            {'name': 'Python', 'level': 'Expert'},
            {'name': 'JavaScript', 'level': 'Advanced'},
            {'name': 'React', 'level': 'Intermediate'}
        ]
    }
    
    result = tester.post('/api/cv/save', cv_data)
    passed = result.get('success', False) or 'cv_id' in str(result.get('data', {}))
    tester.log('Candidate', 'Save CV', passed, str(result))
    
    # Step 2: Search for jobs
    result = tester.get('/api/jobs/search', {'query': 'developer'})
    passed = result.get('success', False) or 'data' in result
    tester.log('Candidate', 'Search Jobs', passed, str(result))
    
    # Step 3: View job listings
    result = tester.get('/api/jobs')
    passed = result.get('success', False) or 'data' in result
    tester.log('Candidate', 'View Job Listings', passed, str(result))
    
    # Step 4: Get saved jobs
    result = tester.get('/api/candidate/saved-jobs')
    passed = result.get('success', False) or 'data' in result
    tester.log('Candidate', 'Get Saved Jobs', passed, str(result))
    
    # Step 5: Get applications
    result = tester.get('/api/candidate/applications')
    passed = result.get('success', False) or 'data' in result
    tester.log('Candidate', 'Get Applications', passed, str(result))
    
    # Step 6: Get job matches
    result = tester.get('/api/candidate/job-matches')
    passed = result.get('success', False) or 'data' in result
    tester.log('Candidate', 'Get Job Matches', passed, str(result))


# =====================================================
# RECRUITER WORKFLOW TESTS
# =====================================================

def test_recruiter_workflow(tester: WorkflowTester):
    """Test complete recruiter workflow"""
    print("\n" + "="*60)
    print("RECRUITER WORKFLOW TEST")
    print("="*60)
    
    # Step 1: Get JD templates
    result = tester.get('/api/jd/templates')
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Get JD Templates', passed, str(result))
    
    # Step 2: Create a new JD
    jd_data = {
        'title': 'Senior Software Engineer',
        'company': 'Tech Innovations LLC',
        'description': 'Looking for an experienced software engineer to lead our development team',
        'requirements': ['Python', 'JavaScript', 'AWS', '5+ years experience'],
        'location': 'Dubai',
        'salary_range': 'AED 25,000 - 35,000'
    }
    result = tester.post('/api/recruiter/jd', jd_data)
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Create Job Description', passed, str(result))
    
    # Step 3: Get JD list
    result = tester.get('/api/recruiter/jd')
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Get JD List', passed, str(result))
    
    # Step 4: AI Match candidates
    result = tester.post('/api/recruiter/jd/1/match', {'limit': 10})
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'AI Match Candidates', passed, str(result))
    
    # Step 5: Get shortlist
    result = tester.get('/api/recruiter/shortlist')
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Get Shortlist', passed, str(result))
    
    # Step 6: Get dashboard overview
    result = tester.get('/api/recruiter/dashboard/overview')
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Dashboard Overview', passed, str(result))
    
    # Step 7: Get active vacancies
    result = tester.get('/api/recruiter/dashboard/vacancies')
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Get Active Vacancies', passed, str(result))
    
    # Step 8: Get offers
    result = tester.get('/api/recruiter/dashboard/offers')
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Get Offers', passed, str(result))
    
    # Step 9: Create offer
    offer_data = {
        'candidate_id': 1,
        'job_id': 1,
        'salary': 30000,
        'start_date': '2025-02-01',
        'benefits': ['Health Insurance', 'Annual Leave', 'Transportation']
    }
    result = tester.post('/api/recruiter/offers/create', offer_data)
    passed = result.get('success', False) or 'data' in result
    tester.log('Recruiter', 'Create Offer', passed, str(result))


# =====================================================
# HR MANAGER WORKFLOW TESTS
# =====================================================

def test_hr_manager_workflow(tester: WorkflowTester):
    """Test complete HR Manager workflow"""
    print("\n" + "="*60)
    print("HR MANAGER WORKFLOW TEST")
    print("="*60)
    
    # Step 1: Get HR Dashboard
    result = tester.get('/api/hr/dashboard')
    passed = result.get('success', False) or 'data' in result
    tester.log('HR Manager', 'Get Dashboard', passed, str(result))
    
    # Step 2: Get shortlisted candidates
    result = tester.get('/api/hr/dashboard/shortlisted')
    passed = result.get('success', False) or 'data' in result
    tester.log('HR Manager', 'Get Shortlisted Candidates', passed, str(result))
    
    # Step 3: Get team members
    result = tester.get('/api/hr/dashboard/team')
    passed = result.get('success', False) or 'data' in result
    tester.log('HR Manager', 'Get Team Members', passed, str(result))
    
    # Step 4: Search candidates
    result = tester.get('/api/hr/dashboard/candidates/search', {'query': 'developer'})
    passed = result.get('success', False) or 'data' in result
    tester.log('HR Manager', 'Search Candidates', passed, str(result))
    
    # Step 5: Get approval workflows
    result = tester.get('/api/hr/approval-workflows')
    passed = result.get('success', False) or 'data' in result
    tester.log('HR Manager', 'Get Approval Workflows', passed, str(result))
    
    # Step 6: Delegate approval
    delegation_data = {
        'workflow_id': 1,
        'delegate_to': 2,
        'reason': 'Out of office for training'
    }
    result = tester.post('/api/hr/approval-workflows/delegate', delegation_data)
    passed = result.get('success', False) or 'data' in result
    tester.log('HR Manager', 'Delegate Approval', passed, str(result))


# =====================================================
# GROWTH OPERATOR WORKFLOW TESTS
# =====================================================

def test_growth_operator_workflow(tester: WorkflowTester):
    """Test Growth Operator domain-specific workflows"""
    print("\n" + "="*60)
    print("GROWTH OPERATOR WORKFLOW TEST")
    print("="*60)
    
    # Step 1: Get all domain metrics
    result = tester.get('/api/growth-operator/metrics')
    passed = result.get('success', False) or 'data' in result
    tester.log('Growth Operator', 'Get All Domain Metrics', passed, str(result))
    
    # Step 2: Candidate Operations
    result = tester.get('/api/growth-operator/candidate/list')
    passed = result.get('success', False) or 'data' in result
    tester.log('Growth Operator', 'Candidate Operations - List', passed, str(result))
    
    # Step 3: Company Operations
    result = tester.get('/api/growth-operator/company/list')
    passed = result.get('success', False) or 'data' in result
    tester.log('Growth Operator', 'Company Operations - List', passed, str(result))
    
    # Step 4: Education Operations
    result = tester.get('/api/growth-operator/education/programs')
    passed = result.get('success', False) or 'data' in result
    tester.log('Growth Operator', 'Education Operations - Programs', passed, str(result))
    
    # Step 5: Assessment Operations
    result = tester.get('/api/growth-operator/assessment/list')
    passed = result.get('success', False) or 'data' in result
    tester.log('Growth Operator', 'Assessment Operations - List', passed, str(result))
    
    # Step 6: Mentorship Operations
    result = tester.get('/api/growth-operator/mentorship/matches')
    passed = result.get('success', False) or 'data' in result
    tester.log('Growth Operator', 'Mentorship Operations - Matches', passed, str(result))
    
    # Step 7: Community Operations
    result = tester.get('/api/growth-operator/community/stats')
    passed = result.get('success', False) or 'data' in result
    tester.log('Growth Operator', 'Community Operations - Stats', passed, str(result))


# =====================================================
# ADMINISTRATOR WORKFLOW TESTS
# =====================================================

def test_administrator_workflow(tester: WorkflowTester):
    """Test Administrator workflows"""
    print("\n" + "="*60)
    print("ADMINISTRATOR WORKFLOW TEST")
    print("="*60)
    
    # Step 1: Get dashboard stats
    result = tester.get('/api/admin/dashboard/stats')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'Get Dashboard Stats', passed, str(result))
    
    # Step 2: Get alerts
    result = tester.get('/api/admin/alerts')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'Get System Alerts', passed, str(result))
    
    # Step 3: Get recent activity
    result = tester.get('/api/admin/activity/recent')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'Get Recent Activity', passed, str(result))
    
    # Step 4: List users
    result = tester.get('/api/admin/users')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'List Users', passed, str(result))
    
    # Step 5: Get user statistics
    result = tester.get('/api/admin/users/statistics')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'Get User Statistics', passed, str(result))
    
    # Step 6: List roles
    result = tester.get('/api/admin/roles')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'List Roles', passed, str(result))
    
    # Step 7: Get Growth Operator domains
    result = tester.get('/api/admin/growth-operators/domains')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'Get GO Domains', passed, str(result))
    
    # Step 8: List Growth Operators
    result = tester.get('/api/admin/growth-operators')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'List Growth Operators', passed, str(result))
    
    # Step 9: Get domain statistics
    result = tester.get('/api/admin/growth-operators/statistics')
    passed = result.get('success', False) or 'data' in result
    tester.log('Administrator', 'Get Domain Statistics', passed, str(result))
    
    # Step 10: Assign domains to operator
    assignment_data = {
        'domains': ['candidate', 'company'],
        'primary_domain': 'candidate'
    }
    result = tester.post('/api/admin/growth-operators/1/domains', assignment_data)
    passed = result.get('success', False) or 'message' in result
    tester.log('Administrator', 'Assign Domains to Operator', passed, str(result))


# =====================================================
# INTERVIEW SCHEDULING WORKFLOW TESTS
# =====================================================

def test_interview_workflow(tester: WorkflowTester):
    """Test interview scheduling workflow"""
    print("\n" + "="*60)
    print("INTERVIEW SCHEDULING WORKFLOW TEST")
    print("="*60)
    
    # Step 1: Get all sessions
    result = tester.get('/api/interviews/sessions')
    passed = result.get('success', False) or 'data' in result
    tester.log('Interviews', 'Get All Sessions', passed, str(result))
    
    # Step 2: Get upcoming interviews
    result = tester.get('/api/interviews/upcoming')
    passed = result.get('success', False) or 'data' in result
    tester.log('Interviews', 'Get Upcoming Interviews', passed, str(result))


# =====================================================
# MAIN TEST RUNNER
# =====================================================

def main():
    """Run all workflow tests"""
    print("="*60)
    print("EMIRATI PATHWAYS - WORKFLOW TESTS")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*60)
    
    tester = WorkflowTester()
    
    # Run all workflow tests
    test_candidate_workflow(tester)
    test_recruiter_workflow(tester)
    test_hr_manager_workflow(tester)
    test_growth_operator_workflow(tester)
    test_administrator_workflow(tester)
    test_interview_workflow(tester)
    
    # Generate summary
    print("\n" + "="*60)
    print("WORKFLOW TEST SUMMARY")
    print("="*60)
    
    total = len(tester.results)
    passed = sum(1 for r in tester.results if r['passed'])
    failed = total - passed
    
    print(f"Total Steps: {total}")
    print(f"Passed: {passed} ({(passed/total*100):.1f}%)")
    print(f"Failed: {failed} ({(failed/total*100):.1f}%)")
    
    # Group by workflow
    workflows = {}
    for r in tester.results:
        wf = r['workflow']
        if wf not in workflows:
            workflows[wf] = {'passed': 0, 'failed': 0}
        if r['passed']:
            workflows[wf]['passed'] += 1
        else:
            workflows[wf]['failed'] += 1
    
    print("\nResults by Workflow:")
    print("-"*40)
    for wf, stats in workflows.items():
        total_wf = stats['passed'] + stats['failed']
        pct = (stats['passed']/total_wf*100) if total_wf > 0 else 0
        status = "✅" if pct == 100 else "⚠️" if pct >= 75 else "❌"
        print(f"{status} {wf}: {stats['passed']}/{total_wf} ({pct:.0f}%)")
    
    # Save results
    with open('workflow_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'summary': {'total': total, 'passed': passed, 'failed': failed},
            'by_workflow': workflows,
            'results': tester.results
        }, f, indent=2)
    
    print(f"\nDetailed results saved to: workflow_test_results.json")
    
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    exit(main())
