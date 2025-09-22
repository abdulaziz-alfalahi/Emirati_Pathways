#!/usr/bin/env python3
"""
Comprehensive HR/Recruiter Functionality Test
Emirati Journey Platform - Complete End-to-End Testing
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid

class HRRecruiterFunctionalityTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.hr_user_id = None
        self.company_id = None
        self.job_posting_id = None
        self.candidate_id = None
        self.application_id = None
        self.interview_id = None
        
        # Test results tracking
        self.test_results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': []
        }
    
    def log_test_result(self, test_name, success, message, details=None):
        """Log test result"""
        self.test_results['total_tests'] += 1
        if success:
            self.test_results['passed_tests'] += 1
            status = "✅ PASS"
        else:
            self.test_results['failed_tests'] += 1
            status = "❌ FAIL"
        
        result = {
            'test_name': test_name,
            'status': status,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        
        self.test_results['test_details'].append(result)
        print(f"{status}: {test_name} - {message}")
        
        if details:
            print(f"   Details: {details}")
    
    def test_hr_authentication(self):
        """Test HR user registration and authentication"""
        print("\n🔐 Testing HR Authentication...")
        
        # Register HR user
        hr_email = f"hr_test_{uuid.uuid4().hex[:8]}@emiratijourney.ae"
        registration_data = {
            "first_name": "Ahmed",
            "last_name": "Al-Mansouri",
            "email": hr_email,
            "password": "SecurePass123!",
            "role": "recruiter",
            "phone": "+971501234567",
            "emirate": "Dubai",
            "nationality": "UAE"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/register", json=registration_data)
            if response.status_code == 201:
                self.hr_user_id = response.json().get('data', {}).get('user', {}).get('id')
                self.log_test_result("HR Registration", True, "HR user registered successfully", 
                                   f"User ID: {self.hr_user_id}")
            else:
                self.log_test_result("HR Registration", False, f"Registration failed: {response.status_code}", 
                                   response.text)
                return False
        except Exception as e:
            self.log_test_result("HR Registration", False, f"Registration error: {str(e)}")
            return False
        
        # Login HR user
        login_data = {
            "email": hr_email,
            "password": "SecurePass123!"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            if response.status_code == 200:
                self.auth_token = response.json().get('data', {}).get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_test_result("HR Login", True, "HR user logged in successfully")
                return True
            else:
                self.log_test_result("HR Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test_result("HR Login", False, f"Login error: {str(e)}")
            return False
    
    def test_hr_profile_management(self):
        """Test HR profile creation and management"""
        print("\n👤 Testing HR Profile Management...")
        
        # Test HR profile health check
        try:
            response = self.session.get(f"{self.base_url}/api/hr/health")
            if response.status_code == 200:
                self.log_test_result("HR Profile Health Check", True, "HR Profile API is operational")
            else:
                self.log_test_result("HR Profile Health Check", False, f"Health check failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("HR Profile Health Check", False, f"Health check error: {str(e)}")
        
        # Create HR profile
        hr_profile_data = {
            "position_title": "Senior HR Manager",
            "department": "Human Resources",
            "years_of_experience": 8,
            "specializations": ["Recruitment", "Employee Relations", "Performance Management"],
            "hiring_authority_level": "senior",
            "regions_of_focus": ["Dubai", "Abu Dhabi"],
            "industries_of_expertise": ["Technology", "Finance", "Healthcare"],
            "languages_spoken": ["Arabic", "English"],
            "professional_summary": "Experienced HR professional with expertise in recruitment and talent management in the UAE market."
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/hr/profile", json=hr_profile_data)
            if response.status_code == 200:
                self.log_test_result("HR Profile Creation", True, "HR profile created successfully")
            else:
                self.log_test_result("HR Profile Creation", False, f"Profile creation failed: {response.status_code}", 
                                   response.text)
        except Exception as e:
            self.log_test_result("HR Profile Creation", False, f"Profile creation error: {str(e)}")
        
        # Get HR profile
        try:
            response = self.session.get(f"{self.base_url}/api/hr/profile")
            if response.status_code == 200:
                self.log_test_result("HR Profile Retrieval", True, "HR profile retrieved successfully")
            else:
                self.log_test_result("HR Profile Retrieval", False, f"Profile retrieval failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("HR Profile Retrieval", False, f"Profile retrieval error: {str(e)}")
    
    def test_company_management(self):
        """Test company profile creation and management"""
        print("\n🏢 Testing Company Management...")
        
        # Create company profile
        company_data = {
            "name": "Emirates Tech Solutions",
            "description": "Leading technology company in the UAE specializing in digital transformation",
            "industry": "Technology",
            "size": "201-500",
            "website": "https://emiratestech.ae",
            "address": "Dubai Internet City",
            "city": "Dubai"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/hr/company", json=company_data)
            if response.status_code == 200:
                self.company_id = response.json().get('data', {}).get('id')
                self.log_test_result("Company Creation", True, "Company profile created successfully", 
                                   f"Company ID: {self.company_id}")
            else:
                self.log_test_result("Company Creation", False, f"Company creation failed: {response.status_code}", 
                                   response.text)
        except Exception as e:
            self.log_test_result("Company Creation", False, f"Company creation error: {str(e)}")
        
        # Get company profile
        try:
            response = self.session.get(f"{self.base_url}/api/hr/company")
            if response.status_code == 200:
                self.log_test_result("Company Retrieval", True, "Company profile retrieved successfully")
            else:
                self.log_test_result("Company Retrieval", False, f"Company retrieval failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Company Retrieval", False, f"Company retrieval error: {str(e)}")
    
    def test_job_posting_functionality(self):
        """Test job posting creation and management"""
        print("\n📝 Testing Job Posting Functionality...")
        
        # Test job posting health check
        try:
            response = self.session.get(f"{self.base_url}/api/hr/jobs/health")
            if response.status_code == 200:
                self.log_test_result("Job Posting Health Check", True, "Job Posting API is operational")
            else:
                self.log_test_result("Job Posting Health Check", False, f"Health check failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Job Posting Health Check", False, f"Health check error: {str(e)}")
        
        # Create job posting
        job_data = {
            "title": "Senior Software Engineer",
            "description": "We are seeking a talented Senior Software Engineer to join our dynamic team in Dubai. The ideal candidate will have strong experience in full-stack development and a passion for innovation.",
            "requirements": {
                "min_experience": 5,
                "education_level": "Bachelor",
                "skills": ["Python", "React", "Node.js", "AWS", "Docker"],
                "languages": ["English", "Arabic (preferred)"]
            },
            "responsibilities": [
                "Design and develop scalable web applications",
                "Collaborate with cross-functional teams",
                "Mentor junior developers",
                "Participate in code reviews and technical discussions"
            ],
            "benefits": [
                "Competitive salary package",
                "Health insurance",
                "Annual leave (30 days)",
                "Professional development opportunities",
                "Flexible working arrangements"
            ],
            "salary_range_min": 15000,
            "salary_range_max": 25000,
            "currency": "AED",
            "location": "Dubai, UAE",
            "remote_work_allowed": True,
            "employment_type": "full-time",
            "experience_level": "senior",
            "emiratization_target": 5,
            "visa_sponsorship_available": True,
            "tags": ["software", "engineering", "full-stack", "senior"],
            "application_deadline": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/hr/jobs/", json=job_data)
            if response.status_code == 201:
                self.job_posting_id = response.json().get('data', {}).get('job_posting', {}).get('id')
                compliance_check = response.json().get('data', {}).get('compliance_check', {})
                self.log_test_result("Job Posting Creation", True, "Job posting created successfully", 
                                   f"Job ID: {self.job_posting_id}, Compliance Score: {compliance_check.get('compliance_score', 'N/A')}")
            else:
                self.log_test_result("Job Posting Creation", False, f"Job creation failed: {response.status_code}", 
                                   response.text)
        except Exception as e:
            self.log_test_result("Job Posting Creation", False, f"Job creation error: {str(e)}")
        
        # Get job postings
        try:
            response = self.session.get(f"{self.base_url}/api/hr/jobs/")
            if response.status_code == 200:
                jobs = response.json().get('data', {}).get('job_postings', [])
                self.log_test_result("Job Postings Retrieval", True, f"Retrieved {len(jobs)} job postings")
            else:
                self.log_test_result("Job Postings Retrieval", False, f"Job retrieval failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Job Postings Retrieval", False, f"Job retrieval error: {str(e)}")
        
        # Test compliance check
        if self.job_posting_id:
            try:
                response = self.session.post(f"{self.base_url}/api/hr/jobs/{self.job_posting_id}/compliance-check")
                if response.status_code == 200:
                    compliance_result = response.json().get('data', {})
                    self.log_test_result("UAE Compliance Check", True, 
                                       f"Compliance check completed - Score: {compliance_result.get('compliance_score', 'N/A')}")
                else:
                    self.log_test_result("UAE Compliance Check", False, f"Compliance check failed: {response.status_code}")
            except Exception as e:
                self.log_test_result("UAE Compliance Check", False, f"Compliance check error: {str(e)}")
        
        # Test job publishing
        if self.job_posting_id:
            try:
                response = self.session.post(f"{self.base_url}/api/hr/jobs/{self.job_posting_id}/publish")
                if response.status_code == 200:
                    self.log_test_result("Job Publishing", True, "Job published successfully")
                else:
                    self.log_test_result("Job Publishing", False, f"Job publishing failed: {response.status_code}", 
                                       response.text)
            except Exception as e:
                self.log_test_result("Job Publishing", False, f"Job publishing error: {str(e)}")
    
    def test_candidate_search_functionality(self):
        """Test candidate search and filtering"""
        print("\n🔍 Testing Candidate Search Functionality...")
        
        # Test candidate search health check
        try:
            response = self.session.get(f"{self.base_url}/api/hr/candidates/health")
            if response.status_code == 200:
                self.log_test_result("Candidate Search Health Check", True, "Candidate Search API is operational")
            else:
                self.log_test_result("Candidate Search Health Check", False, f"Health check failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Candidate Search Health Check", False, f"Health check error: {str(e)}")
        
        # Test basic candidate search
        try:
            response = self.session.get(f"{self.base_url}/api/hr/candidates/search")
            if response.status_code == 200:
                candidates = response.json().get('data', {}).get('candidates', [])
                self.log_test_result("Basic Candidate Search", True, f"Found {len(candidates)} candidates")
            else:
                self.log_test_result("Basic Candidate Search", False, f"Search failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Basic Candidate Search", False, f"Search error: {str(e)}")
        
        # Test filtered candidate search
        search_params = {
            'emirate': 'Dubai',
            'min_experience': 3,
            'education_level': 'Bachelor',
            'is_uae_national': 'true',
            'limit': 10
        }
        
        try:
            response = self.session.get(f"{self.base_url}/api/hr/candidates/search", params=search_params)
            if response.status_code == 200:
                candidates = response.json().get('data', {}).get('candidates', [])
                filters_applied = response.json().get('data', {}).get('filters_applied', {})
                self.log_test_result("Filtered Candidate Search", True, 
                                   f"Found {len(candidates)} candidates with filters: {filters_applied}")
            else:
                self.log_test_result("Filtered Candidate Search", False, f"Filtered search failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Filtered Candidate Search", False, f"Filtered search error: {str(e)}")
        
        # Test filter options
        try:
            response = self.session.get(f"{self.base_url}/api/hr/candidates/filters/options")
            if response.status_code == 200:
                filter_options = response.json().get('data', {})
                self.log_test_result("Filter Options Retrieval", True, 
                                   f"Retrieved filter options: {list(filter_options.keys())}")
            else:
                self.log_test_result("Filter Options Retrieval", False, f"Filter options failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Filter Options Retrieval", False, f"Filter options error: {str(e)}")
        
        # Test job matching
        if self.job_posting_id:
            try:
                response = self.session.get(f"{self.base_url}/api/hr/candidates/match/{self.job_posting_id}")
                if response.status_code == 200:
                    matched_candidates = response.json().get('data', {}).get('matched_candidates', [])
                    match_summary = response.json().get('data', {}).get('match_summary', {})
                    self.log_test_result("Job Candidate Matching", True, 
                                       f"Found {len(matched_candidates)} matching candidates, Average score: {match_summary.get('average_match_score', 'N/A')}")
                else:
                    self.log_test_result("Job Candidate Matching", False, f"Job matching failed: {response.status_code}")
            except Exception as e:
                self.log_test_result("Job Candidate Matching", False, f"Job matching error: {str(e)}")
    
    def test_interview_scheduling_functionality(self):
        """Test interview scheduling system"""
        print("\n📅 Testing Interview Scheduling Functionality...")
        
        # Test interview scheduling health check
        try:
            response = self.session.get(f"{self.base_url}/api/hr/interviews/health")
            if response.status_code == 200:
                self.log_test_result("Interview Scheduling Health Check", True, "Interview Scheduling API is operational")
            else:
                self.log_test_result("Interview Scheduling Health Check", False, f"Health check failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Interview Scheduling Health Check", False, f"Health check error: {str(e)}")
        
        # Test interviewer availability (using HR user as interviewer)
        if self.hr_user_id:
            try:
                start_date = datetime.now().strftime('%Y-%m-%d')
                end_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
                
                response = self.session.get(f"{self.base_url}/api/hr/interviews/availability/{self.hr_user_id}", 
                                          params={'start_date': start_date, 'end_date': end_date})
                if response.status_code == 200:
                    availability = response.json().get('data', {})
                    available_slots = availability.get('available_slots', [])
                    self.log_test_result("Interviewer Availability", True, 
                                       f"Found {len(available_slots)} available slots")
                else:
                    self.log_test_result("Interviewer Availability", False, f"Availability check failed: {response.status_code}")
            except Exception as e:
                self.log_test_result("Interviewer Availability", False, f"Availability check error: {str(e)}")
        
        # Test interview calendar
        try:
            response = self.session.get(f"{self.base_url}/api/hr/interviews/calendar")
            if response.status_code == 200:
                calendar_data = response.json().get('data', {})
                events = calendar_data.get('events', [])
                self.log_test_result("Interview Calendar", True, f"Retrieved calendar with {len(events)} events")
            else:
                self.log_test_result("Interview Calendar", False, f"Calendar retrieval failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Interview Calendar", False, f"Calendar retrieval error: {str(e)}")
        
        # Test get interviews
        try:
            response = self.session.get(f"{self.base_url}/api/hr/interviews/")
            if response.status_code == 200:
                interviews = response.json().get('data', {}).get('interviews', [])
                self.log_test_result("Interview Retrieval", True, f"Retrieved {len(interviews)} interviews")
            else:
                self.log_test_result("Interview Retrieval", False, f"Interview retrieval failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Interview Retrieval", False, f"Interview retrieval error: {str(e)}")
    
    def test_dashboard_and_analytics(self):
        """Test HR dashboard and analytics"""
        print("\n📊 Testing Dashboard and Analytics...")
        
        # Test dashboard stats
        try:
            response = self.session.get(f"{self.base_url}/api/hr/dashboard/stats")
            if response.status_code == 200:
                stats = response.json().get('data', {})
                self.log_test_result("Dashboard Statistics", True, f"Retrieved dashboard stats: {list(stats.keys())}")
            else:
                self.log_test_result("Dashboard Statistics", False, f"Dashboard stats failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Dashboard Statistics", False, f"Dashboard stats error: {str(e)}")
        
        # Test team management
        try:
            response = self.session.get(f"{self.base_url}/api/hr/team")
            if response.status_code == 200:
                team_data = response.json().get('data', {})
                team_members = team_data.get('team_members', [])
                self.log_test_result("Team Management", True, f"Retrieved {len(team_members)} team members")
            else:
                self.log_test_result("Team Management", False, f"Team retrieval failed: {response.status_code}")
        except Exception as e:
            self.log_test_result("Team Management", False, f"Team retrieval error: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run all HR/Recruiter functionality tests"""
        print("🚀 Starting Comprehensive HR/Recruiter Functionality Test")
        print("=" * 60)
        
        start_time = datetime.now()
        
        # Run all test suites
        if self.test_hr_authentication():
            self.test_hr_profile_management()
            self.test_company_management()
            self.test_job_posting_functionality()
            self.test_candidate_search_functionality()
            self.test_interview_scheduling_functionality()
            self.test_dashboard_and_analytics()
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Generate final report
        print("\n" + "=" * 60)
        print("📋 COMPREHENSIVE TEST RESULTS")
        print("=" * 60)
        
        success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests']) * 100 if self.test_results['total_tests'] > 0 else 0
        
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed_tests']}")
        print(f"Failed: {self.test_results['failed_tests']}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Test Duration: {duration.total_seconds():.2f} seconds")
        
        # Categorize results
        categories = {
            'Authentication': [],
            'Profile Management': [],
            'Job Posting': [],
            'Candidate Search': [],
            'Interview Scheduling': [],
            'Dashboard & Analytics': []
        }
        
        for test in self.test_results['test_details']:
            test_name = test['test_name']
            if 'Authentication' in test_name or 'Login' in test_name or 'Registration' in test_name:
                categories['Authentication'].append(test)
            elif 'Profile' in test_name or 'Company' in test_name:
                categories['Profile Management'].append(test)
            elif 'Job' in test_name or 'Posting' in test_name or 'Compliance' in test_name:
                categories['Job Posting'].append(test)
            elif 'Candidate' in test_name or 'Search' in test_name or 'Filter' in test_name or 'Matching' in test_name:
                categories['Candidate Search'].append(test)
            elif 'Interview' in test_name or 'Scheduling' in test_name or 'Calendar' in test_name or 'Availability' in test_name:
                categories['Interview Scheduling'].append(test)
            elif 'Dashboard' in test_name or 'Team' in test_name or 'Statistics' in test_name:
                categories['Dashboard & Analytics'].append(test)
        
        print("\n📊 RESULTS BY CATEGORY:")
        for category, tests in categories.items():
            if tests:
                passed = len([t for t in tests if '✅' in t['status']])
                total = len(tests)
                category_success = (passed / total) * 100 if total > 0 else 0
                print(f"  {category}: {passed}/{total} ({category_success:.1f}%)")
        
        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if success_rate >= 90:
            print("🟢 EXCELLENT: HR/Recruiter functionality is production-ready")
        elif success_rate >= 75:
            print("🟡 GOOD: HR/Recruiter functionality is mostly operational with minor issues")
        elif success_rate >= 50:
            print("🟠 FAIR: HR/Recruiter functionality has significant gaps that need attention")
        else:
            print("🔴 POOR: HR/Recruiter functionality requires major improvements")
        
        # Save detailed results
        with open('/home/ubuntu/emirati-platform/hr_recruiter_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': self.test_results['total_tests'],
                    'passed_tests': self.test_results['passed_tests'],
                    'failed_tests': self.test_results['failed_tests'],
                    'success_rate': success_rate,
                    'test_duration_seconds': duration.total_seconds(),
                    'timestamp': start_time.isoformat()
                },
                'test_details': self.test_results['test_details'],
                'categories': categories
            }, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: hr_recruiter_test_results.json")
        
        return success_rate

if __name__ == "__main__":
    tester = HRRecruiterFunctionalityTester()
    success_rate = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    exit(0 if success_rate >= 75 else 1)
