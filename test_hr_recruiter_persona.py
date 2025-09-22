#!/usr/bin/env python3
"""
Comprehensive HR/Recruiter Persona Testing Script
Emirati Journey Platform - HR/Recruiter Functionality Testing

This script tests all HR/Recruiter persona features including:
- HR Profile Management
- Company Profile Setup
- Job Posting Management
- Candidate Tracking
- Interview Scheduling
- Compliance Management
- Analytics Dashboard
- HRIS Integration
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

class HRRecruiterPersonaTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "persona": "HR/Recruiter",
            "tests": {},
            "overall_score": 0,
            "issues": [],
            "recommendations": []
        }
        
    def log_test(self, test_name, status, details="", score=0):
        """Log test results"""
        self.test_results["tests"][test_name] = {
            "status": status,
            "details": details,
            "score": score,
            "timestamp": datetime.now().isoformat()
        }
        print(f"{'✅' if status == 'PASS' else '❌' if status == 'FAIL' else '⚠️'} {test_name}: {details}")
        
    def test_server_connectivity(self):
        """Test if backend server is accessible"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Server Connectivity", "PASS", "Backend server accessible", 10)
                return True
            else:
                self.log_test("Server Connectivity", "FAIL", f"Server returned {response.status_code}", 0)
                return False
        except Exception as e:
            self.log_test("Server Connectivity", "FAIL", f"Connection error: {str(e)}", 0)
            return False
            
    def test_hr_registration(self):
        """Test HR/Recruiter registration process"""
        try:
            registration_data = {
                "email": "hr.manager@emiratestech.ae",
                "password": "SecurePass123!",
                "first_name": "Sarah",
                "last_name": "Al Zahra",
                "user_type": "recruiter",
                "phone": "+971501234567",
                "emirate": "Dubai",
                "nationality": "UAE",
                "education_level": "Bachelor's Degree",
                "gender": "Female"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/register", json=registration_data)
            
            if response.status_code == 201:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user_id")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("HR Registration", "PASS", "HR account created successfully", 15)
                return True
            else:
                self.log_test("HR Registration", "FAIL", f"Registration failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("HR Registration", "FAIL", f"Registration error: {str(e)}", 0)
            return False
            
    def test_hr_login(self):
        """Test HR/Recruiter login process"""
        try:
            login_data = {
                "email": "hr.manager@emiratestech.ae",
                "password": "SecurePass123!"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("HR Login", "PASS", "Login successful", 10)
                return True
            else:
                self.log_test("HR Login", "FAIL", f"Login failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("HR Login", "FAIL", f"Login error: {str(e)}", 0)
            return False
            
    def test_hr_profile_management(self):
        """Test HR profile creation and management"""
        try:
            profile_data = {
                "personal_info": {
                    "first_name": "Sarah",
                    "last_name": "Al Zahra",
                    "email": "hr.manager@emiratestech.ae",
                    "phone": "+971501234567",
                    "location": "Dubai, UAE",
                    "nationality": "UAE"
                },
                "professional_info": {
                    "position": "Senior HR Manager",
                    "department": "Human Resources",
                    "years_experience": 8,
                    "specializations": ["Talent Acquisition", "Employee Relations", "Emiratization"],
                    "certifications": ["SHRM-CP", "UAE Labor Law Certification"]
                },
                "company_info": {
                    "company_name": "Emirates Technology Solutions",
                    "company_sector": "Technology",
                    "company_size": "500-1000",
                    "company_location": "Dubai Internet City",
                    "trade_license": "DIC-123456789"
                }
            }
            
            # Test profile creation
            response = self.session.post(f"{self.base_url}/api/hr/profile", json=profile_data)
            
            if response.status_code in [200, 201]:
                self.log_test("HR Profile Creation", "PASS", "Profile created successfully", 15)
                
                # Test profile retrieval
                response = self.session.get(f"{self.base_url}/api/hr/profile")
                if response.status_code == 200:
                    profile = response.json()
                    self.log_test("HR Profile Retrieval", "PASS", f"Profile retrieved: {profile.get('personal_info', {}).get('first_name', 'Unknown')}", 10)
                    return True
                else:
                    self.log_test("HR Profile Retrieval", "FAIL", "Could not retrieve profile", 0)
                    return False
            else:
                self.log_test("HR Profile Creation", "FAIL", f"Profile creation failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("HR Profile Management", "FAIL", f"Profile error: {str(e)}", 0)
            return False
            
    def test_company_profile_setup(self):
        """Test company profile setup and management"""
        try:
            company_data = {
                "company_details": {
                    "name": "Emirates Technology Solutions",
                    "sector": "Information Technology",
                    "size": "500-1000 employees",
                    "founded": "2015",
                    "headquarters": "Dubai Internet City",
                    "website": "https://emiratestech.ae",
                    "description": "Leading technology solutions provider in the UAE"
                },
                "legal_info": {
                    "trade_license": "DIC-123456789",
                    "tax_registration": "100123456789003",
                    "emiratization_quota": 25,
                    "current_emiratization": 18
                },
                "benefits": [
                    "Health Insurance",
                    "Annual Bonus",
                    "Professional Development",
                    "Flexible Working Hours",
                    "UAE National Development Program"
                ],
                "culture": {
                    "values": ["Innovation", "Diversity", "Excellence", "Emiratization"],
                    "work_environment": "Collaborative and inclusive",
                    "languages": ["Arabic", "English"]
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/hr/company", json=company_data)
            
            if response.status_code in [200, 201]:
                self.log_test("Company Profile Setup", "PASS", "Company profile configured", 15)
                return True
            else:
                self.log_test("Company Profile Setup", "FAIL", f"Company setup failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Company Profile Setup", "FAIL", f"Company setup error: {str(e)}", 0)
            return False
            
    def test_job_posting_management(self):
        """Test job posting creation and management"""
        try:
            job_data = {
                "title": "Senior Software Engineer",
                "department": "Engineering",
                "location": "Dubai, UAE",
                "employment_type": "Full-time",
                "experience_level": "Senior",
                "salary_range": {
                    "min": 15000,
                    "max": 25000,
                    "currency": "AED"
                },
                "description": "We are seeking a Senior Software Engineer to join our growing team in Dubai.",
                "requirements": [
                    "Bachelor's degree in Computer Science or related field",
                    "5+ years of software development experience",
                    "Proficiency in React, Node.js, and Python",
                    "Experience with cloud platforms (AWS/Azure)",
                    "Strong communication skills in English and Arabic"
                ],
                "responsibilities": [
                    "Design and develop scalable web applications",
                    "Collaborate with cross-functional teams",
                    "Mentor junior developers",
                    "Participate in code reviews and technical discussions"
                ],
                "benefits": [
                    "Competitive salary",
                    "Health insurance",
                    "Annual bonus",
                    "Professional development opportunities"
                ],
                "emiratization_priority": True,
                "visa_sponsorship": True,
                "remote_work": "Hybrid"
            }
            
            # Test job posting creation
            response = self.session.post(f"{self.base_url}/api/hr/jobs", json=job_data)
            
            if response.status_code in [200, 201]:
                job_id = response.json().get("job_id")
                self.log_test("Job Posting Creation", "PASS", f"Job posted with ID: {job_id}", 15)
                
                # Test job listing
                response = self.session.get(f"{self.base_url}/api/hr/jobs")
                if response.status_code == 200:
                    jobs = response.json()
                    self.log_test("Job Listing", "PASS", f"Retrieved {len(jobs)} job postings", 10)
                    return True
                else:
                    self.log_test("Job Listing", "FAIL", "Could not retrieve job listings", 0)
                    return False
            else:
                self.log_test("Job Posting Creation", "FAIL", f"Job posting failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Job Posting Management", "FAIL", f"Job posting error: {str(e)}", 0)
            return False
            
    def test_candidate_tracking(self):
        """Test candidate tracking and management"""
        try:
            # Test candidate search
            search_params = {
                "skills": ["React", "Node.js"],
                "experience_min": 3,
                "location": "Dubai",
                "nationality": "UAE"
            }
            
            response = self.session.get(f"{self.base_url}/api/hr/candidates/search", params=search_params)
            
            if response.status_code == 200:
                candidates = response.json()
                self.log_test("Candidate Search", "PASS", f"Found {len(candidates)} candidates", 10)
                
                # Test candidate profile view
                if candidates:
                    candidate_id = candidates[0].get("id")
                    response = self.session.get(f"{self.base_url}/api/hr/candidates/{candidate_id}")
                    if response.status_code == 200:
                        self.log_test("Candidate Profile View", "PASS", "Candidate profile accessible", 10)
                    else:
                        self.log_test("Candidate Profile View", "FAIL", "Could not view candidate profile", 0)
                
                return True
            else:
                self.log_test("Candidate Search", "FAIL", f"Search failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Candidate Tracking", "FAIL", f"Candidate tracking error: {str(e)}", 0)
            return False
            
    def test_interview_scheduling(self):
        """Test interview scheduling functionality"""
        try:
            interview_data = {
                "candidate_id": "candidate_123",
                "job_id": "job_456",
                "interview_type": "Technical",
                "scheduled_date": (datetime.now() + timedelta(days=7)).isoformat(),
                "duration": 60,
                "interviewer": "Ahmed Al Mansouri",
                "location": "Dubai Office - Conference Room A",
                "notes": "Technical interview focusing on React and Node.js skills"
            }
            
            response = self.session.post(f"{self.base_url}/api/hr/interviews", json=interview_data)
            
            if response.status_code in [200, 201]:
                interview_id = response.json().get("interview_id")
                self.log_test("Interview Scheduling", "PASS", f"Interview scheduled with ID: {interview_id}", 15)
                
                # Test interview listing
                response = self.session.get(f"{self.base_url}/api/hr/interviews")
                if response.status_code == 200:
                    interviews = response.json()
                    self.log_test("Interview Listing", "PASS", f"Retrieved {len(interviews)} interviews", 10)
                    return True
                else:
                    self.log_test("Interview Listing", "FAIL", "Could not retrieve interviews", 0)
                    return False
            else:
                self.log_test("Interview Scheduling", "FAIL", f"Scheduling failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Interview Scheduling", "FAIL", f"Interview error: {str(e)}", 0)
            return False
            
    def test_compliance_management(self):
        """Test UAE compliance and Emiratization features"""
        try:
            # Test Emiratization tracking
            response = self.session.get(f"{self.base_url}/api/hr/compliance/emiratization")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Emiratization Tracking", "PASS", f"Current rate: {data.get('current_rate', 0)}%", 10)
                
                # Test visa tracking
                response = self.session.get(f"{self.base_url}/api/hr/compliance/visas")
                if response.status_code == 200:
                    visa_data = response.json()
                    self.log_test("Visa Tracking", "PASS", f"Tracking {len(visa_data)} visa records", 10)
                    
                    # Test labor law compliance
                    response = self.session.get(f"{self.base_url}/api/hr/compliance/labor-law")
                    if response.status_code == 200:
                        self.log_test("Labor Law Compliance", "PASS", "Compliance check completed", 10)
                        return True
                    else:
                        self.log_test("Labor Law Compliance", "FAIL", "Compliance check failed", 0)
                        return False
                else:
                    self.log_test("Visa Tracking", "FAIL", "Visa tracking failed", 0)
                    return False
            else:
                self.log_test("Emiratization Tracking", "FAIL", f"Tracking failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Compliance Management", "FAIL", f"Compliance error: {str(e)}", 0)
            return False
            
    def test_analytics_dashboard(self):
        """Test HR analytics and reporting"""
        try:
            # Test recruitment analytics
            response = self.session.get(f"{self.base_url}/api/hr/analytics/recruitment")
            
            if response.status_code == 200:
                analytics = response.json()
                self.log_test("Recruitment Analytics", "PASS", f"Analytics data retrieved", 10)
                
                # Test performance metrics
                response = self.session.get(f"{self.base_url}/api/hr/analytics/performance")
                if response.status_code == 200:
                    performance = response.json()
                    self.log_test("Performance Metrics", "PASS", "Performance data available", 10)
                    
                    # Test diversity reports
                    response = self.session.get(f"{self.base_url}/api/hr/analytics/diversity")
                    if response.status_code == 200:
                        self.log_test("Diversity Reports", "PASS", "Diversity analytics available", 10)
                        return True
                    else:
                        self.log_test("Diversity Reports", "FAIL", "Diversity reports failed", 0)
                        return False
                else:
                    self.log_test("Performance Metrics", "FAIL", "Performance metrics failed", 0)
                    return False
            else:
                self.log_test("Recruitment Analytics", "FAIL", f"Analytics failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Analytics Dashboard", "FAIL", f"Analytics error: {str(e)}", 0)
            return False
            
    def test_hris_integration(self):
        """Test HRIS integration capabilities"""
        try:
            # Test payroll integration
            payroll_data = {
                "employee_id": "EMP001",
                "salary": 20000,
                "benefits": ["health_insurance", "annual_bonus"],
                "effective_date": datetime.now().isoformat()
            }
            
            response = self.session.post(f"{self.base_url}/api/hr/hris/payroll", json=payroll_data)
            
            if response.status_code in [200, 201]:
                self.log_test("HRIS Payroll Integration", "PASS", "Payroll data synced", 10)
                
                # Test employee data sync
                response = self.session.get(f"{self.base_url}/api/hr/hris/employees")
                if response.status_code == 200:
                    employees = response.json()
                    self.log_test("Employee Data Sync", "PASS", f"Synced {len(employees)} employee records", 10)
                    return True
                else:
                    self.log_test("Employee Data Sync", "FAIL", "Employee sync failed", 0)
                    return False
            else:
                self.log_test("HRIS Payroll Integration", "FAIL", f"Payroll integration failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("HRIS Integration", "FAIL", f"HRIS error: {str(e)}", 0)
            return False
            
    def calculate_overall_score(self):
        """Calculate overall functionality score"""
        total_score = sum(test["score"] for test in self.test_results["tests"].values())
        max_possible_score = 175  # Maximum possible score based on all tests
        self.test_results["overall_score"] = round((total_score / max_possible_score) * 100, 1)
        
    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        failed_tests = [name for name, result in self.test_results["tests"].items() if result["status"] == "FAIL"]
        
        if failed_tests:
            self.test_results["recommendations"].extend([
                "Implement missing backend endpoints for failed functionality",
                "Add proper error handling and validation",
                "Ensure database schema supports all HR features"
            ])
            
        if self.test_results["overall_score"] < 80:
            self.test_results["recommendations"].extend([
                "Focus on core HR functionality implementation",
                "Prioritize Arabic language support for UAE market",
                "Implement mobile-responsive design for field recruitment"
            ])
            
    def run_all_tests(self):
        """Run comprehensive HR/Recruiter persona testing"""
        print("🧪 Starting HR/Recruiter Persona Comprehensive Testing")
        print("=" * 60)
        
        # Core connectivity and authentication tests
        if not self.test_server_connectivity():
            print("❌ Cannot proceed - server not accessible")
            return False
            
        if not self.test_hr_registration():
            print("⚠️ Registration failed, trying login...")
            if not self.test_hr_login():
                print("❌ Cannot proceed - authentication failed")
                return False
                
        # Core HR functionality tests
        self.test_hr_profile_management()
        self.test_company_profile_setup()
        self.test_job_posting_management()
        self.test_candidate_tracking()
        self.test_interview_scheduling()
        self.test_compliance_management()
        self.test_analytics_dashboard()
        self.test_hris_integration()
        
        # Calculate results
        self.calculate_overall_score()
        self.generate_recommendations()
        
        # Display results
        print("\n" + "=" * 60)
        print("🏆 HR/RECRUITER PERSONA TESTING RESULTS")
        print("=" * 60)
        print(f"Overall Functionality Score: {self.test_results['overall_score']}%")
        
        passed = len([t for t in self.test_results["tests"].values() if t["status"] == "PASS"])
        failed = len([t for t in self.test_results["tests"].values() if t["status"] == "FAIL"])
        total = len(self.test_results["tests"])
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Tests Failed: {failed}/{total}")
        
        if self.test_results["recommendations"]:
            print("\n📋 Recommendations:")
            for rec in self.test_results["recommendations"]:
                print(f"  • {rec}")
                
        return True

def main():
    """Main testing function"""
    tester = HRRecruiterPersonaTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save results to file
        with open("/home/ubuntu/emirati-platform/hr_recruiter_test_results.json", "w") as f:
            json.dump(tester.test_results, f, indent=2)
            
        print(f"\n📄 Test results saved to: hr_recruiter_test_results.json")
        
        if success:
            print("✅ HR/Recruiter persona testing completed successfully")
            return 0
        else:
            print("❌ HR/Recruiter persona testing failed")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Testing failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
