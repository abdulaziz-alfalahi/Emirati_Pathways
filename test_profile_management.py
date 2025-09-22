#!/usr/bin/env python3
"""
Comprehensive Test Suite for Enhanced Profile Management System
Tests all persona profile components and integration
"""

import requests
import json
import time
from datetime import datetime

class ProfileManagementTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def test_backend_health(self):
        """Test if backend is running and healthy"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                self.log_test("Backend Health Check", "PASS", "Backend is running")
                return True
            else:
                self.log_test("Backend Health Check", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_hr_profile_endpoints(self):
        """Test HR/Recruiter profile management endpoints"""
        test_data = {
            "firstName": "Sarah",
            "lastName": "Al Mansouri",
            "title": "Senior HR Manager",
            "email": "sarah.almansouri@company.ae",
            "phone": "+971 50 123 4567",
            "organization": "Emirates Tech Solutions",
            "department": "Human Resources",
            "position": "Senior HR Manager",
            "yearsOfExperience": "8-12",
            "hrExperience": "6-10",
            "specializations": ["Talent Acquisition", "Performance Management", "Employee Relations"],
            "industries": ["Technology", "Financial Services"],
            "certifications": [
                {
                    "name": "SHRM-CP",
                    "issuer": "Society for Human Resource Management",
                    "year": "2022",
                    "level": "Professional"
                }
            ]
        }
        
        try:
            # Test profile creation
            response = self.session.post(
                f"{self.base_url}/api/profile/hr",
                json=test_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.log_test("HR Profile Creation", "PASS", "Profile created successfully")
                
                # Test profile retrieval
                response = self.session.get(f"{self.base_url}/api/profile/hr/1", timeout=5)
                if response.status_code == 200:
                    self.log_test("HR Profile Retrieval", "PASS", "Profile retrieved successfully")
                else:
                    self.log_test("HR Profile Retrieval", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("HR Profile Creation", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("HR Profile Endpoints", "FAIL", f"Error: {str(e)}")
    
    def test_company_profile_endpoints(self):
        """Test Company profile setup endpoints"""
        test_data = {
            "companyName": "Emirates Tech Solutions",
            "legalName": "Emirates Tech Solutions LLC",
            "industry": "Information Technology",
            "companySize": "201-500",
            "foundedYear": "2015",
            "headquarters": "Dubai, UAE",
            "website": "https://www.emiratestech.ae",
            "description": "Leading technology solutions provider in the UAE",
            "locations": [
                {
                    "city": "Dubai",
                    "country": "UAE",
                    "address": "Dubai Internet City",
                    "type": "Headquarters"
                }
            ],
            "benefits": ["Health Insurance", "Annual Leave", "Professional Development"],
            "culture": ["Innovation", "Collaboration", "Excellence"]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/profile/company",
                json=test_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.log_test("Company Profile Creation", "PASS", "Company profile created")
            else:
                self.log_test("Company Profile Creation", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Company Profile Endpoints", "FAIL", f"Error: {str(e)}")
    
    def test_educator_profile_endpoints(self):
        """Test Educator profile management endpoints"""
        test_data = {
            "firstName": "Dr. Ahmed",
            "lastName": "Al Zaabi",
            "title": "Professor of Computer Science",
            "email": "ahmed.alzaabi@university.ae",
            "phone": "+971 50 987 6543",
            "institution": "American University of Sharjah",
            "department": "Computer Science & Engineering",
            "position": "Professor",
            "yearsOfExperience": "15+",
            "teachingExperience": "12-15",
            "educationLevel": "PhD",
            "fieldOfStudy": "Computer Science",
            "specializations": ["Artificial Intelligence", "Machine Learning", "Data Science"],
            "teachingAreas": ["Programming", "Algorithms", "AI/ML"],
            "researchInterests": ["AI in Education", "Natural Language Processing"],
            "publications": [
                {
                    "title": "AI Applications in Higher Education",
                    "journal": "International Journal of Educational Technology",
                    "year": "2023",
                    "type": "Journal Article"
                }
            ]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/profile/educator",
                json=test_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.log_test("Educator Profile Creation", "PASS", "Educator profile created")
            else:
                self.log_test("Educator Profile Creation", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Educator Profile Endpoints", "FAIL", f"Error: {str(e)}")
    
    def test_institution_profile_endpoints(self):
        """Test Institution profile setup endpoints"""
        test_data = {
            "institutionName": "American University of Sharjah",
            "legalName": "American University of Sharjah",
            "institutionType": "University",
            "establishedYear": "1997",
            "accreditation": ["Commission for Academic Accreditation (CAA)", "ABET (Engineering)"],
            "licenseNumber": "EDU-123456",
            "address": "University City, Sharjah",
            "city": "Sharjah",
            "emirate": "Sharjah",
            "country": "United Arab Emirates",
            "phone": "+971 6 515 0000",
            "email": "info@aus.edu",
            "website": "https://www.aus.edu",
            "studentCapacity": "6000",
            "currentEnrollment": "5500",
            "facultyCount": "350",
            "departments": ["Engineering", "Business", "Arts & Sciences"],
            "programs": [
                {
                    "name": "Computer Science",
                    "level": "Bachelor's Degree",
                    "duration": "4 years"
                }
            ]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/profile/institution",
                json=test_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.log_test("Institution Profile Creation", "PASS", "Institution profile created")
            else:
                self.log_test("Institution Profile Creation", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Institution Profile Endpoints", "FAIL", f"Error: {str(e)}")
    
    def test_assessor_profile_endpoints(self):
        """Test Assessor profile management endpoints"""
        test_data = {
            "firstName": "Dr. Mariam",
            "lastName": "Al Rashid",
            "title": "Senior Assessment Specialist",
            "email": "mariam.alrashid@assessment.ae",
            "phone": "+971 50 555 1234",
            "organization": "UAE Assessment Institute",
            "department": "Assessment & Evaluation",
            "position": "Senior Assessment Specialist",
            "yearsOfExperience": "11-15",
            "assessmentExperience": "8-12",
            "certifications": [
                {
                    "name": "Certified Assessment Professional (CAP)",
                    "issuer": "International Assessment Institute",
                    "year": "2022",
                    "level": "Professional",
                    "credentialId": "CAP-2022-001234"
                }
            ],
            "assessmentTypes": ["Technical Skills Assessment", "Behavioral Assessment"],
            "subjectAreas": ["Information Technology", "Engineering"],
            "skillDomains": ["Technical Skills", "Soft Skills"],
            "methodologies": ["Competency-Based Assessment", "Behavioral Event Interview"]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/profile/assessor",
                json=test_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.log_test("Assessor Profile Creation", "PASS", "Assessor profile created")
            else:
                self.log_test("Assessor Profile Creation", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Assessor Profile Endpoints", "FAIL", f"Error: {str(e)}")
    
    def test_certification_tracking_endpoints(self):
        """Test Certification tracking endpoints"""
        test_data = {
            "certifications": [
                {
                    "name": "Certified Assessment Professional (CAP)",
                    "issuer": "International Assessment Institute",
                    "category": "Assessment & Evaluation",
                    "level": "Professional",
                    "issueDate": "2022-03-15",
                    "expiryDate": "2025-03-15",
                    "credentialId": "CAP-2022-001234",
                    "status": "active",
                    "importance": "critical",
                    "ceuRequired": 40,
                    "ceuEarned": 25
                }
            ],
            "continuingEducation": [
                {
                    "title": "AI in Assessment: Future Trends",
                    "provider": "Assessment Technology Institute",
                    "category": "Technology",
                    "completionDate": "2024-01-15",
                    "hours": 8,
                    "ceuCredits": 8
                }
            ]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/certifications/track",
                json=test_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.log_test("Certification Tracking", "PASS", "Certifications tracked successfully")
            else:
                self.log_test("Certification Tracking", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Certification Tracking Endpoints", "FAIL", f"Error: {str(e)}")
    
    def test_profile_integration(self):
        """Test profile management integration"""
        try:
            # Test role switching
            switch_data = {
                "userId": "1",
                "newPrimaryRole": "Assessor",
                "previousRole": "HR/Recruiter"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/profile/switch-role",
                json=switch_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.log_test("Role Switching", "PASS", "Role switched successfully")
            else:
                self.log_test("Role Switching", "FAIL", f"Status: {response.status_code}")
            
            # Test profile completion calculation
            response = self.session.get(f"{self.base_url}/api/profile/completion/1", timeout=5)
            if response.status_code == 200:
                data = response.json()
                completion = data.get('completion', 0)
                self.log_test("Profile Completion", "PASS", f"Completion: {completion}%")
            else:
                self.log_test("Profile Completion", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Profile Integration", "FAIL", f"Error: {str(e)}")
    
    def test_frontend_components(self):
        """Test frontend component accessibility"""
        frontend_url = "http://localhost:8080"
        
        try:
            # Test profile page accessibility
            response = self.session.get(f"{frontend_url}/profile", timeout=10)
            if response.status_code == 200:
                self.log_test("Profile Page Access", "PASS", "Profile page accessible")
            else:
                self.log_test("Profile Page Access", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Frontend Components", "SKIP", f"Frontend not accessible: {str(e)}")
    
    def run_all_tests(self):
        """Run all profile management tests"""
        print("🚀 Starting Enhanced Profile Management System Tests")
        print("=" * 60)
        
        # Backend tests
        if self.test_backend_health():
            self.test_hr_profile_endpoints()
            self.test_company_profile_endpoints()
            self.test_educator_profile_endpoints()
            self.test_institution_profile_endpoints()
            self.test_assessor_profile_endpoints()
            self.test_certification_tracking_endpoints()
            self.test_profile_integration()
        
        # Frontend tests
        self.test_frontend_components()
        
        # Generate summary
        self.generate_test_summary()
    
    def generate_test_summary(self):
        """Generate and display test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        skipped_tests = len([r for r in self.test_results if r['status'] == 'SKIP'])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️ Skipped: {skipped_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"  • {result['test']}: {result['details']}")
        
        # Save detailed results
        with open('/home/ubuntu/emirati-platform/profile_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: profile_test_results.json")
        
        if passed_tests == total_tests - skipped_tests:
            print("\n🎉 ALL TESTS PASSED! Profile management system is ready!")
        else:
            print(f"\n⚠️ {failed_tests} tests failed. Please review and fix issues.")

def main():
    """Main test execution"""
    print("Enhanced Profile Management System - Comprehensive Test Suite")
    print("Testing HR/Recruiter, Educator, and Assessor profile components")
    print()
    
    tester = ProfileManagementTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
