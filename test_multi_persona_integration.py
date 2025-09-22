#!/usr/bin/env python3
"""
Multi-Persona Integration Test
Emirati Journey Platform - Complete End-to-End Testing
Simulates real-world interactions between Candidate and HR personas
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid
import os
from typing import Dict, List, Any, Optional

class MultiPersonaIntegrationTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        
        # Test users and data
        self.hr_user = {
            "auth_token": None,
            "user_id": None,
            "email": f"fatima.alzahra.{uuid.uuid4().hex[:8]}@emiratesdigital.ae",
            "company_id": None,
            "job_posting_id": None
        }
        
        self.candidate_user = {
            "auth_token": None,
            "user_id": None,
            "email": f"omar.almansouri.{uuid.uuid4().hex[:8]}@gmail.com",
            "application_id": None,
            "interview_id": None
        }
        
        # Test results tracking
        self.test_results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': [],
            'performance_metrics': {},
            'integration_score': 0
        }
        
        # Shared data between personas
        self.shared_data = {
            "job_posting": None,
            "application": None,
            "interview": None
        }
    
    def log_test_result(self, test_name, success, message, details=None, performance_data=None):
        """Log test result with performance metrics"""
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
            'performance_data': performance_data,
            'timestamp': datetime.now().isoformat()
        }
        
        self.test_results['test_details'].append(result)
        print(f"{status}: {test_name} - {message}")
        
        if details:
            print(f"   Details: {details}")
        
        if performance_data:
            print(f"   Performance: {performance_data}")
    
    def measure_performance(self, func, *args, **kwargs):
        """Measure function execution time"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        return result, execution_time
    
    def setup_hr_user(self):
        """Set up HR user with complete profile and company"""
        print("\n👩‍💼 Setting up HR User (Fatima Al-Zahra)...")
        
        # Register HR user
        hr_registration_data = {
            "first_name": "Fatima",
            "last_name": "Al-Zahra",
            "email": self.hr_user["email"],
            "password": "SecureHR123!",
            "role": "recruiter",
            "phone": "+971501234567",
            "emirate": "Dubai",
            "nationality": "UAE"
        }
        
        try:
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/auth/register", json=hr_registration_data
            )
            
            if response.status_code == 201:
                self.hr_user["user_id"] = response.json().get('data', {}).get('user_id')
                self.log_test_result("HR Registration", True, "HR user registered successfully", 
                                   f"User ID: {self.hr_user['user_id']}", f"{exec_time:.3f}s")
            else:
                self.log_test_result("HR Registration", False, f"Registration failed: {response.status_code}", 
                                   response.text)
                return False
        except Exception as e:
            self.log_test_result("HR Registration", False, f"Registration error: {str(e)}")
            return False
        
        # Login HR user
        hr_login_data = {
            "email": self.hr_user["email"],
            "password": "SecureHR123!"
        }
        
        try:
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/auth/login", json=hr_login_data
            )
            
            if response.status_code == 200:
                self.hr_user["auth_token"] = response.json().get('data', {}).get('access_token')
                self.log_test_result("HR Login", True, "HR user logged in successfully", 
                                   performance_data=f"{exec_time:.3f}s")
            else:
                self.log_test_result("HR Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test_result("HR Login", False, f"Login error: {str(e)}")
            return False
        
        # Create HR profile
        hr_profile_data = {
            "position_title": "Senior HR Manager",
            "department": "Human Resources",
            "years_of_experience": 8,
            "specializations": ["Recruitment", "Talent Acquisition", "HR Analytics"],
            "hiring_authority_level": "senior",
            "regions_of_focus": ["Dubai", "Abu Dhabi"],
            "industries_of_expertise": ["Technology", "Finance"],
            "languages_spoken": ["Arabic", "English"],
            "professional_summary": "Experienced HR professional specializing in tech recruitment in the UAE market."
        }
        
        try:
            headers = {'Authorization': f'Bearer {self.hr_user["auth_token"]}'}
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/hr/profile", json=hr_profile_data, headers=headers
            )
            
            if response.status_code == 200:
                self.log_test_result("HR Profile Creation", True, "HR profile created successfully", 
                                   performance_data=f"{exec_time:.3f}s")
            else:
                self.log_test_result("HR Profile Creation", False, f"Profile creation failed: {response.status_code}", 
                                   response.text)
        except Exception as e:
            self.log_test_result("HR Profile Creation", False, f"Profile creation error: {str(e)}")
        
        return True
    
    def setup_candidate_user(self):
        """Set up Candidate user with complete profile"""
        print("\n👨‍💻 Setting up Candidate User (Omar Al-Mansouri)...")
        
        # Register Candidate user
        candidate_registration_data = {
            "first_name": "Omar",
            "last_name": "Al-Mansouri",
            "email": self.candidate_user["email"],
            "password": "SecureCandidate123!",
            "role": "candidate",
            "phone": "+971509876543",
            "emirate": "Dubai",
            "nationality": "UAE"
        }
        
        try:
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/auth/register", json=candidate_registration_data
            )
            
            if response.status_code == 201:
                self.candidate_user["user_id"] = response.json().get('data', {}).get('user_id')
                self.log_test_result("Candidate Registration", True, "Candidate user registered successfully", 
                                   f"User ID: {self.candidate_user['user_id']}", f"{exec_time:.3f}s")
            else:
                self.log_test_result("Candidate Registration", False, f"Registration failed: {response.status_code}", 
                                   response.text)
                return False
        except Exception as e:
            self.log_test_result("Candidate Registration", False, f"Registration error: {str(e)}")
            return False
        
        # Login Candidate user
        candidate_login_data = {
            "email": self.candidate_user["email"],
            "password": "SecureCandidate123!"
        }
        
        try:
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/auth/login", json=candidate_login_data
            )
            
            if response.status_code == 200:
                self.candidate_user["auth_token"] = response.json().get('data', {}).get('access_token')
                self.log_test_result("Candidate Login", True, "Candidate user logged in successfully", 
                                   performance_data=f"{exec_time:.3f}s")
            else:
                self.log_test_result("Candidate Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test_result("Candidate Login", False, f"Login error: {str(e)}")
            return False
        
        # Create candidate profile with CV
        candidate_profile_data = {
            "personal_info": {
                "date_of_birth": "1990-05-15",
                "gender": "male",
                "marital_status": "single",
                "visa_status": "uae_national"
            },
            "professional_summary": "Experienced software engineer with 5 years in full-stack development, specializing in Python, React, and cloud technologies.",
            "experience_years": 5,
            "current_position": "Software Engineer",
            "current_company": "Tech Innovations LLC",
            "education": [
                {
                    "degree": "Bachelor of Computer Science",
                    "institution": "American University of Sharjah",
                    "graduation_year": 2018,
                    "gpa": "3.7"
                }
            ],
            "skills": ["Python", "JavaScript", "React", "Node.js", "AWS", "Docker", "Kubernetes"],
            "languages": ["Arabic", "English"],
            "certifications": ["AWS Solutions Architect", "Certified Kubernetes Administrator"],
            "salary_expectation": 25000,
            "notice_period": "2 weeks",
            "preferred_locations": ["Dubai", "Abu Dhabi"],
            "remote_work_preference": True
        }
        
        try:
            headers = {'Authorization': f'Bearer {self.candidate_user["auth_token"]}'}
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/profile/candidate", json=candidate_profile_data, headers=headers
            )
            
            if response.status_code in [200, 201]:
                self.log_test_result("Candidate Profile Creation", True, "Candidate profile created successfully", 
                                   performance_data=f"{exec_time:.3f}s")
            else:
                self.log_test_result("Candidate Profile Creation", False, f"Profile creation failed: {response.status_code}", 
                                   response.text)
        except Exception as e:
            self.log_test_result("Candidate Profile Creation", False, f"Profile creation error: {str(e)}")
        
        return True
    
    def execute_hr_workflow(self):
        """Execute HR workflow: company setup and job posting"""
        print("\n🏢 Executing HR Workflow...")
        
        headers = {'Authorization': f'Bearer {self.hr_user["auth_token"]}'}
        
        # Create company profile (attempt, may fail due to known issue)
        company_data = {
            "name": "Emirates Digital Solutions",
            "description": "Leading digital transformation company in the UAE specializing in innovative technology solutions",
            "industry": "Technology",
            "size": "201-500",
            "website": "https://emiratesdigital.ae",
            "address": "Dubai Internet City, Building 3",
            "city": "Dubai",
            "country": "UAE",
            "founded_year": 2015,
            "company_type": "private",
            "benefits": [
                "Health insurance",
                "Annual leave (30 days)",
                "Professional development budget",
                "Flexible working hours",
                "Remote work options"
            ]
        }
        
        try:
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/hr/company", json=company_data, headers=headers
            )
            
            if response.status_code == 200:
                self.hr_user["company_id"] = response.json().get('data', {}).get('id')
                self.log_test_result("Company Creation", True, "Company profile created successfully", 
                                   f"Company ID: {self.hr_user['company_id']}", f"{exec_time:.3f}s")
                company_created = True
            else:
                self.log_test_result("Company Creation", False, f"Company creation failed: {response.status_code}", 
                                   response.text)
                company_created = False
        except Exception as e:
            self.log_test_result("Company Creation", False, f"Company creation error: {str(e)}")
            company_created = False
        
        # Create job posting (only if company was created successfully)
        if company_created:
            job_posting_data = {
                "title": "Senior Software Engineer",
                "description": """We are seeking a talented Senior Software Engineer to join our dynamic team in Dubai. 
                
The ideal candidate will have strong experience in full-stack development with modern technologies and a passion for innovation. You will be working on cutting-edge projects that shape the digital landscape of the UAE.

Key Responsibilities:
- Design and develop scalable web applications using Python and React
- Collaborate with cross-functional teams to deliver high-quality solutions
- Mentor junior developers and contribute to technical decision-making
- Participate in code reviews and maintain high coding standards
- Work with cloud technologies (AWS) and containerization (Docker, Kubernetes)

What We Offer:
- Competitive salary package (20,000 - 30,000 AED)
- Comprehensive health insurance
- 30 days annual leave
- Professional development opportunities
- Flexible working arrangements including remote work
- Visa sponsorship for qualified candidates""",
                "requirements": {
                    "min_experience": 5,
                    "education_level": "Bachelor",
                    "skills": ["Python", "React", "Node.js", "AWS", "Docker", "Kubernetes"],
                    "languages": ["English", "Arabic (preferred)"],
                    "certifications": ["AWS certification preferred"]
                },
                "responsibilities": [
                    "Design and develop scalable web applications",
                    "Collaborate with cross-functional teams",
                    "Mentor junior developers",
                    "Participate in code reviews and technical discussions",
                    "Work with cloud technologies and DevOps practices"
                ],
                "benefits": [
                    "Competitive salary package",
                    "Health insurance",
                    "Annual leave (30 days)",
                    "Professional development opportunities",
                    "Flexible working arrangements",
                    "Visa sponsorship available"
                ],
                "salary_range_min": 20000,
                "salary_range_max": 30000,
                "currency": "AED",
                "location": "Dubai, UAE",
                "remote_work_allowed": True,
                "employment_type": "full-time",
                "experience_level": "senior",
                "emiratization_target": 10,
                "visa_sponsorship_available": True,
                "tags": ["software", "engineering", "full-stack", "senior", "python", "react"],
                "application_deadline": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                "department": "Engineering",
                "reports_to": "Engineering Manager"
            }
            
            try:
                response, exec_time = self.measure_performance(
                    requests.post, f"{self.base_url}/api/hr/jobs/", json=job_posting_data, headers=headers
                )
                
                if response.status_code == 201:
                    job_data = response.json().get('data', {})
                    self.hr_user["job_posting_id"] = job_data.get('job_posting', {}).get('id')
                    self.shared_data["job_posting"] = job_data.get('job_posting')
                    compliance_score = job_data.get('compliance_check', {}).get('compliance_score', 'N/A')
                    
                    self.log_test_result("Job Posting Creation", True, "Job posting created successfully", 
                                       f"Job ID: {self.hr_user['job_posting_id']}, Compliance: {compliance_score}", 
                                       f"{exec_time:.3f}s")
                    
                    # Publish the job
                    try:
                        response, exec_time = self.measure_performance(
                            requests.post, f"{self.base_url}/api/hr/jobs/{self.hr_user['job_posting_id']}/publish", 
                            headers=headers
                        )
                        
                        if response.status_code == 200:
                            self.log_test_result("Job Publishing", True, "Job published successfully", 
                                               performance_data=f"{exec_time:.3f}s")
                        else:
                            self.log_test_result("Job Publishing", False, f"Job publishing failed: {response.status_code}", 
                                               response.text)
                    except Exception as e:
                        self.log_test_result("Job Publishing", False, f"Job publishing error: {str(e)}")
                    
                else:
                    self.log_test_result("Job Posting Creation", False, f"Job creation failed: {response.status_code}", 
                                       response.text)
            except Exception as e:
                self.log_test_result("Job Posting Creation", False, f"Job creation error: {str(e)}")
        else:
            self.log_test_result("Job Posting Creation", False, "Skipped due to company creation failure", 
                               "Company profile is required for job posting")
    
    def execute_candidate_workflow(self):
        """Execute Candidate workflow: job search and application"""
        print("\n🔍 Executing Candidate Workflow...")
        
        headers = {'Authorization': f'Bearer {self.candidate_user["auth_token"]}'}
        
        # Search for jobs
        try:
            search_params = {
                'location': 'Dubai',
                'experience_level': 'senior',
                'remote_work': 'true',
                'limit': 10
            }
            
            response, exec_time = self.measure_performance(
                requests.get, f"{self.base_url}/api/jobs/search", params=search_params, headers=headers
            )
            
            if response.status_code == 200:
                jobs = response.json().get('data', {}).get('jobs', [])
                self.log_test_result("Job Search", True, f"Found {len(jobs)} jobs matching criteria", 
                                   f"Search filters: {search_params}", f"{exec_time:.3f}s")
                
                # Find our posted job
                target_job = None
                if self.hr_user["job_posting_id"]:
                    for job in jobs:
                        if job.get('id') == self.hr_user["job_posting_id"]:
                            target_job = job
                            break
                
                if target_job:
                    self.log_test_result("Job Discovery", True, "Target job found in search results", 
                                       f"Job: {target_job.get('title', 'Unknown')}")
                else:
                    self.log_test_result("Job Discovery", False, "Target job not found in search results", 
                                       "Job may not be published or indexed yet")
            else:
                self.log_test_result("Job Search", False, f"Job search failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_test_result("Job Search", False, f"Job search error: {str(e)}")
        
        # Apply for the job (if job posting exists)
        if self.hr_user["job_posting_id"]:
            application_data = {
                "job_id": self.hr_user["job_posting_id"],
                "cover_letter": """Dear Hiring Manager,

I am excited to apply for the Senior Software Engineer position at Emirates Digital Solutions. With 5 years of experience in full-stack development and a strong background in the technologies you're seeking, I believe I would be a valuable addition to your team.

My experience includes:
- 5+ years of Python and JavaScript development
- Extensive work with React and Node.js
- Cloud deployment experience with AWS
- Container orchestration with Docker and Kubernetes
- Strong problem-solving and team collaboration skills

As a UAE national with a passion for technology and innovation, I am particularly drawn to Emirates Digital Solutions' mission of digital transformation in the region. I am excited about the opportunity to contribute to cutting-edge projects while growing my career in a dynamic environment.

I am available for an interview at your convenience and can start with a 2-week notice period.

Thank you for considering my application.

Best regards,
Omar Al-Mansouri""",
                "salary_expectation": 25000,
                "availability_date": (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
                "additional_notes": "I am particularly interested in working with cloud technologies and would love to contribute to the company's digital transformation initiatives."
            }
            
            try:
                response, exec_time = self.measure_performance(
                    requests.post, f"{self.base_url}/api/jobs/apply", json=application_data, headers=headers
                )
                
                if response.status_code == 201:
                    application_result = response.json().get('data', {})
                    self.candidate_user["application_id"] = application_result.get('application_id')
                    self.shared_data["application"] = application_result
                    
                    self.log_test_result("Job Application Submission", True, "Application submitted successfully", 
                                       f"Application ID: {self.candidate_user['application_id']}", f"{exec_time:.3f}s")
                else:
                    self.log_test_result("Job Application Submission", False, f"Application failed: {response.status_code}", 
                                       response.text)
            except Exception as e:
                self.log_test_result("Job Application Submission", False, f"Application error: {str(e)}")
        else:
            self.log_test_result("Job Application Submission", False, "No job posting available to apply to", 
                               "Job posting creation failed in HR workflow")
    
    def test_interview_scheduling(self):
        """Test interview scheduling including video interview setup"""
        print("\n📅 Testing Interview Scheduling...")
        
        if not self.candidate_user["application_id"] or not self.hr_user["auth_token"]:
            self.log_test_result("Interview Scheduling", False, "Prerequisites not met", 
                               "Application ID and HR auth token required")
            return
        
        headers = {'Authorization': f'Bearer {self.hr_user["auth_token"]}'}
        
        # Schedule interview
        interview_data = {
            "application_id": self.candidate_user["application_id"],
            "scheduled_date": (datetime.now() + timedelta(days=3, hours=10)).isoformat(),
            "interviewer_id": self.hr_user["user_id"],
            "duration_minutes": 60,
            "interview_type": "video",
            "location": "Video Conference",
            "meeting_link": "https://meet.emiratesdigital.ae/interview-room-12345",
            "notes": "Technical interview focusing on Python, React, and system design. Please prepare for coding exercises.",
            "preparation_materials": [
                "Company overview document",
                "Technical assessment guidelines",
                "Sample coding problems"
            ]
        }
        
        try:
            response, exec_time = self.measure_performance(
                requests.post, f"{self.base_url}/api/hr/interviews/", json=interview_data, headers=headers
            )
            
            if response.status_code == 201:
                interview_result = response.json().get('data', {})
                self.candidate_user["interview_id"] = interview_result.get('id')
                self.shared_data["interview"] = interview_result
                
                self.log_test_result("Interview Scheduling", True, "Interview scheduled successfully", 
                                   f"Interview ID: {self.candidate_user['interview_id']}, Type: Video", f"{exec_time:.3f}s")
                
                # Test interview details retrieval
                try:
                    response, exec_time = self.measure_performance(
                        requests.get, f"{self.base_url}/api/hr/interviews/{self.candidate_user['interview_id']}", 
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        interview_details = response.json().get('data', {})
                        self.log_test_result("Interview Details Retrieval", True, "Interview details retrieved successfully", 
                                           f"Meeting link: {interview_details.get('interview_details', {}).get('meeting_link', 'N/A')}", 
                                           f"{exec_time:.3f}s")
                    else:
                        self.log_test_result("Interview Details Retrieval", False, f"Failed: {response.status_code}", 
                                           response.text)
                except Exception as e:
                    self.log_test_result("Interview Details Retrieval", False, f"Error: {str(e)}")
                
                # Test interview calendar
                try:
                    response, exec_time = self.measure_performance(
                        requests.get, f"{self.base_url}/api/hr/interviews/calendar", headers=headers
                    )
                    
                    if response.status_code == 200:
                        calendar_data = response.json().get('data', {})
                        events = calendar_data.get('events', [])
                        self.log_test_result("Interview Calendar", True, f"Calendar retrieved with {len(events)} events", 
                                           performance_data=f"{exec_time:.3f}s")
                    else:
                        self.log_test_result("Interview Calendar", False, f"Failed: {response.status_code}", response.text)
                except Exception as e:
                    self.log_test_result("Interview Calendar", False, f"Error: {str(e)}")
                
            else:
                self.log_test_result("Interview Scheduling", False, f"Scheduling failed: {response.status_code}", 
                                   response.text)
        except Exception as e:
            self.log_test_result("Interview Scheduling", False, f"Scheduling error: {str(e)}")
    
    def test_hr_candidate_search(self):
        """Test HR candidate search and filtering"""
        print("\n🔍 Testing HR Candidate Search...")
        
        headers = {'Authorization': f'Bearer {self.hr_user["auth_token"]}'}
        
        # Search for candidates
        try:
            search_params = {
                'skills': 'Python,React',
                'experience_min': 3,
                'location': 'Dubai',
                'education_level': 'Bachelor',
                'limit': 10
            }
            
            response, exec_time = self.measure_performance(
                requests.get, f"{self.base_url}/api/hr/candidates/search", params=search_params, headers=headers
            )
            
            if response.status_code == 200:
                search_result = response.json().get('data', {})
                candidates = search_result.get('candidates', [])
                
                # Check if our test candidate is in the results
                target_candidate_found = False
                for candidate in candidates:
                    if candidate.get('email') == self.candidate_user["email"]:
                        target_candidate_found = True
                        break
                
                self.log_test_result("HR Candidate Search", True, f"Found {len(candidates)} candidates", 
                                   f"Target candidate found: {target_candidate_found}", f"{exec_time:.3f}s")
            else:
                self.log_test_result("HR Candidate Search", False, f"Search failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_test_result("HR Candidate Search", False, f"Search error: {str(e)}")
        
        # Test job matching if job posting exists
        if self.hr_user["job_posting_id"]:
            try:
                response, exec_time = self.measure_performance(
                    requests.get, f"{self.base_url}/api/hr/candidates/match/{self.hr_user['job_posting_id']}", 
                    headers=headers
                )
                
                if response.status_code == 200:
                    match_result = response.json().get('data', {})
                    matched_candidates = match_result.get('matched_candidates', [])
                    match_summary = match_result.get('match_summary', {})
                    
                    self.log_test_result("Job Candidate Matching", True, 
                                       f"Found {len(matched_candidates)} matching candidates", 
                                       f"Average match score: {match_summary.get('average_match_score', 'N/A')}", 
                                       f"{exec_time:.3f}s")
                else:
                    self.log_test_result("Job Candidate Matching", False, f"Matching failed: {response.status_code}", 
                                       response.text)
            except Exception as e:
                self.log_test_result("Job Candidate Matching", False, f"Matching error: {str(e)}")
    
    def validate_cross_persona_integration(self):
        """Validate data consistency and integration between personas"""
        print("\n🔄 Validating Cross-Persona Integration...")
        
        # Test simultaneous access
        hr_headers = {'Authorization': f'Bearer {self.hr_user["auth_token"]}'}
        candidate_headers = {'Authorization': f'Bearer {self.candidate_user["auth_token"]}'}
        
        # Concurrent API calls
        try:
            import threading
            import queue
            
            results_queue = queue.Queue()
            
            def hr_dashboard_call():
                try:
                    response = requests.get(f"{self.base_url}/api/hr/dashboard/stats", headers=hr_headers)
                    results_queue.put(('hr_dashboard', response.status_code, time.time()))
                except Exception as e:
                    results_queue.put(('hr_dashboard', 'error', str(e)))
            
            def candidate_profile_call():
                try:
                    response = requests.get(f"{self.base_url}/api/profile/candidate", headers=candidate_headers)
                    results_queue.put(('candidate_profile', response.status_code, time.time()))
                except Exception as e:
                    results_queue.put(('candidate_profile', 'error', str(e)))
            
            # Start concurrent requests
            start_time = time.time()
            hr_thread = threading.Thread(target=hr_dashboard_call)
            candidate_thread = threading.Thread(target=candidate_profile_call)
            
            hr_thread.start()
            candidate_thread.start()
            
            hr_thread.join()
            candidate_thread.join()
            
            # Collect results
            concurrent_results = []
            while not results_queue.empty():
                concurrent_results.append(results_queue.get())
            
            total_time = time.time() - start_time
            
            success_count = sum(1 for result in concurrent_results if isinstance(result[1], int) and result[1] < 400)
            
            self.log_test_result("Concurrent Access", success_count == 2, 
                               f"Concurrent API calls: {success_count}/2 successful", 
                               f"Results: {concurrent_results}", f"{total_time:.3f}s")
            
        except Exception as e:
            self.log_test_result("Concurrent Access", False, f"Concurrent access test error: {str(e)}")
        
        # Test data consistency
        if self.candidate_user["application_id"]:
            try:
                # Check application from HR perspective
                response = requests.get(f"{self.base_url}/api/hr/dashboard/stats", headers=hr_headers)
                if response.status_code == 200:
                    hr_stats = response.json().get('data', {})
                    total_applications = hr_stats.get('total_applications', 0)
                    
                    # Check application from candidate perspective
                    response = requests.get(f"{self.base_url}/api/jobs/applications", headers=candidate_headers)
                    if response.status_code == 200:
                        candidate_apps = response.json().get('data', {}).get('applications', [])
                        
                        # Find our application
                        our_application = None
                        for app in candidate_apps:
                            if app.get('id') == self.candidate_user["application_id"]:
                                our_application = app
                                break
                        
                        if our_application:
                            self.log_test_result("Data Consistency", True, 
                                               "Application data consistent between personas", 
                                               f"HR sees {total_applications} total applications, candidate sees own application")
                        else:
                            self.log_test_result("Data Consistency", False, 
                                               "Application not found in candidate's view", 
                                               f"Application ID: {self.candidate_user['application_id']}")
                    else:
                        self.log_test_result("Data Consistency", False, 
                                           f"Failed to get candidate applications: {response.status_code}")
                else:
                    self.log_test_result("Data Consistency", False, 
                                       f"Failed to get HR stats: {response.status_code}")
            except Exception as e:
                self.log_test_result("Data Consistency", False, f"Data consistency check error: {str(e)}")
    
    def calculate_integration_score(self):
        """Calculate overall integration score"""
        if self.test_results['total_tests'] == 0:
            return 0
        
        # Weight different categories
        category_weights = {
            'Authentication': 0.15,
            'Profile': 0.15,
            'Job Posting': 0.20,
            'Application': 0.20,
            'Interview': 0.15,
            'Search': 0.10,
            'Integration': 0.05
        }
        
        # Calculate weighted score
        total_score = 0
        total_weight = 0
        
        for test in self.test_results['test_details']:
            test_name = test['test_name']
            is_passed = '✅' in test['status']
            
            # Determine category and weight
            weight = 0.05  # default weight
            if any(keyword in test_name for keyword in ['Registration', 'Login', 'Authentication']):
                weight = category_weights['Authentication']
            elif any(keyword in test_name for keyword in ['Profile', 'Company']):
                weight = category_weights['Profile']
            elif any(keyword in test_name for keyword in ['Job', 'Posting']):
                weight = category_weights['Job Posting']
            elif any(keyword in test_name for keyword in ['Application', 'Apply']):
                weight = category_weights['Application']
            elif any(keyword in test_name for keyword in ['Interview', 'Scheduling']):
                weight = category_weights['Interview']
            elif any(keyword in test_name for keyword in ['Search', 'Matching']):
                weight = category_weights['Search']
            elif any(keyword in test_name for keyword in ['Integration', 'Concurrent', 'Consistency']):
                weight = category_weights['Integration']
            
            if is_passed:
                total_score += weight
            total_weight += weight
        
        integration_score = (total_score / total_weight) * 100 if total_weight > 0 else 0
        self.test_results['integration_score'] = integration_score
        return integration_score
    
    def run_comprehensive_test(self):
        """Run the complete multi-persona integration test"""
        print("🚀 Starting Multi-Persona Integration Test")
        print("=" * 70)
        print("Testing complete recruitment lifecycle with Candidate and HR personas")
        print("=" * 70)
        
        start_time = datetime.now()
        
        # Phase 1: Set up test users
        print("\n📋 PHASE 1: Setting up test environment and users")
        hr_setup_success = self.setup_hr_user()
        candidate_setup_success = self.setup_candidate_user()
        
        if not (hr_setup_success and candidate_setup_success):
            print("❌ User setup failed. Cannot proceed with integration test.")
            return
        
        # Phase 2: Execute HR workflow
        print("\n📋 PHASE 2: Executing HR workflow")
        self.execute_hr_workflow()
        
        # Phase 3: Execute Candidate workflow
        print("\n📋 PHASE 3: Executing Candidate workflow")
        self.execute_candidate_workflow()
        
        # Phase 4: Test interview scheduling
        print("\n📋 PHASE 4: Testing interview scheduling")
        self.test_interview_scheduling()
        
        # Phase 5: Test HR candidate search
        print("\n📋 PHASE 5: Testing HR candidate search")
        self.test_hr_candidate_search()
        
        # Phase 6: Validate cross-persona integration
        print("\n📋 PHASE 6: Validating cross-persona integration")
        self.validate_cross_persona_integration()
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Calculate integration score
        integration_score = self.calculate_integration_score()
        
        # Generate final report
        print("\n" + "=" * 70)
        print("📊 MULTI-PERSONA INTEGRATION TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests']) * 100 if self.test_results['total_tests'] > 0 else 0
        
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed_tests']}")
        print(f"Failed: {self.test_results['failed_tests']}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Integration Score: {integration_score:.1f}%")
        print(f"Test Duration: {duration.total_seconds():.2f} seconds")
        
        # Performance summary
        performance_times = [
            float(test.get('performance_data', '0s').replace('s', ''))
            for test in self.test_results['test_details']
            if test.get('performance_data') and 's' in str(test.get('performance_data'))
        ]
        
        if performance_times:
            avg_response_time = sum(performance_times) / len(performance_times)
            max_response_time = max(performance_times)
            print(f"Average Response Time: {avg_response_time:.3f}s")
            print(f"Max Response Time: {max_response_time:.3f}s")
        
        # Integration assessment
        print(f"\n🎯 INTEGRATION ASSESSMENT:")
        if integration_score >= 90:
            print("🟢 EXCELLENT: Multi-persona integration is production-ready")
        elif integration_score >= 75:
            print("🟡 GOOD: Multi-persona integration is mostly functional with minor issues")
        elif integration_score >= 50:
            print("🟠 FAIR: Multi-persona integration has significant gaps")
        else:
            print("🔴 POOR: Multi-persona integration requires major improvements")
        
        # Key findings
        print(f"\n📋 KEY FINDINGS:")
        print(f"• HR User Setup: {'✅ Success' if hr_setup_success else '❌ Failed'}")
        print(f"• Candidate User Setup: {'✅ Success' if candidate_setup_success else '❌ Failed'}")
        print(f"• Job Posting Created: {'✅ Yes' if self.hr_user['job_posting_id'] else '❌ No'}")
        print(f"• Application Submitted: {'✅ Yes' if self.candidate_user['application_id'] else '❌ No'}")
        print(f"• Interview Scheduled: {'✅ Yes' if self.candidate_user['interview_id'] else '❌ No'}")
        
        # Save detailed results
        test_results_file = '/home/ubuntu/emirati-platform/multi_persona_integration_test_results.json'
        with open(test_results_file, 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': self.test_results['total_tests'],
                    'passed_tests': self.test_results['passed_tests'],
                    'failed_tests': self.test_results['failed_tests'],
                    'success_rate': success_rate,
                    'integration_score': integration_score,
                    'test_duration_seconds': duration.total_seconds(),
                    'timestamp': start_time.isoformat(),
                    'average_response_time': avg_response_time if performance_times else 0,
                    'max_response_time': max_response_time if performance_times else 0
                },
                'test_details': self.test_results['test_details'],
                'shared_data': self.shared_data,
                'user_data': {
                    'hr_user': {k: v for k, v in self.hr_user.items() if k != 'auth_token'},
                    'candidate_user': {k: v for k, v in self.candidate_user.items() if k != 'auth_token'}
                }
            }, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: {test_results_file}")
        
        return integration_score

if __name__ == "__main__":
    tester = MultiPersonaIntegrationTester()
    integration_score = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    exit(0 if integration_score >= 75 else 1)
