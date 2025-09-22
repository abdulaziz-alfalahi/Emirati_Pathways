#!/usr/bin/env python3
"""
Complete Apply Now Flow Test
Emirati Journey Platform - End-to-End Job Application Testing

This script tests the complete job application flow from submission to status tracking,
including file uploads, notifications, and real-time status updates.
"""

import requests
import json
import time
import os
import tempfile
from datetime import datetime
import uuid

class CompleteApplyNowTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.application_id = None
        self.test_user_email = f"test.applynow.{int(time.time())}@example.com"
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "test_type": "Complete Apply Now Flow",
            "tests": [],
            "overall_success": False,
            "application_id": None
        }
        
    def log_test(self, test_name, success, details="", data=None):
        """Log test results"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results["tests"].append(result)
        
        icon = "✅" if success else "❌"
        print(f"{icon} {test_name}: {details}")
        
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
    
    def setup_test_user(self):
        """Create and authenticate test user"""
        print("\n🔧 Setting up test user...")
        
        # Register user
        registration_data = {
            "email": self.test_user_email,
            "password": "TestPass123!",
            "first_name": "Apply",
            "last_name": "Now Tester",
            "user_type": "candidate",
            "phone": "+971501234567",
            "emirate": "Dubai",
            "nationality": "UAE",
            "education_level": "Bachelor's Degree",
            "gender": "Male"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/register", json=registration_data)
            
            if response.status_code == 201 or response.status_code == 200:
                self.log_test("User Registration", True, "Test user registered successfully")
                
                # Always try to login after registration to get token
                login_data = {
                    "email": self.test_user_email,
                    "password": "TestPass123!"
                }
                
                response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
                
                if response.status_code == 200:
                    self.log_test("User Login", True, "User logged in successfully")
                else:
                    self.log_test("User Login", False, f"Login failed: {response.text}")
                    return False
            else:
                # Try login if user already exists
                login_data = {
                    "email": self.test_user_email,
                    "password": "TestPass123!"
                }
                
                response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
                
                if response.status_code == 200:
                    self.log_test("User Login", True, "Existing test user logged in")
                else:
                    self.log_test("User Authentication", False, f"Failed: {response.text}")
                    return False
            
            # Extract token
            data = response.json()
            # Try different possible token locations
            self.auth_token = (
                data.get("data", {}).get("access_token") or
                data.get("access_token") or
                data.get("token") or
                data.get("data", {}).get("token")
            )
            
            if self.auth_token:
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("Token Authentication", True, "Authentication token obtained")
                return True
            else:
                self.log_test("Token Authentication", False, "No token received")
                return False
                
        except Exception as e:
            self.log_test("User Setup", False, f"Error: {str(e)}")
            return False
    
    def create_test_files(self):
        """Create test files for upload"""
        print("\n📄 Creating test files...")
        
        self.test_files = {}
        
        try:
            # Create a test resume file
            resume_content = """
APPLY NOW TESTER
Software Engineer

EXPERIENCE:
- 5 years in Python development
- 3 years in React.js
- Experience with Flask and Django

EDUCATION:
- Bachelor's in Computer Science
- UAE University

SKILLS:
- Python, JavaScript, React
- Database design
- API development
"""
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(resume_content)
                self.test_files['resume'] = f.name
            
            # Create a test portfolio file
            portfolio_content = """
PORTFOLIO DOCUMENT
Apply Now Tester

PROJECT 1: E-commerce Platform
- Built with React and Node.js
- Integrated payment gateway
- 10,000+ active users

PROJECT 2: Mobile App
- React Native development
- iOS and Android deployment
- 4.8 star rating
"""
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(portfolio_content)
                self.test_files['portfolio'] = f.name
            
            self.log_test("Test Files Creation", True, f"Created {len(self.test_files)} test files")
            return True
            
        except Exception as e:
            self.log_test("Test Files Creation", False, f"Error: {str(e)}")
            return False
    
    def test_job_application_submission(self):
        """Test comprehensive job application submission with files"""
        print("\n📝 Testing job application submission...")
        
        try:
            # Prepare application data
            job_id = f"TEST-JOB-{uuid.uuid4().hex[:8].upper()}"
            
            # Test with multipart form data (file upload)
            files = {}
            data = {
                'job_id': job_id,
                'cover_letter': 'I am excited to apply for this position. My experience in software development and passion for innovation make me an ideal candidate for this role.',
                'expected_salary': '15000',
                'expected_salary_currency': 'AED',
                'availability_date': '2024-11-01',
                'notice_period_days': '30',
                'willing_to_relocate': 'true',
                'visa_status': 'UAE National',
                'additional_notes': 'I am particularly interested in working with cutting-edge technologies and contributing to the UAE\'s digital transformation.'
            }
            
            # Add files to the request
            if self.test_files:
                for file_type, file_path in self.test_files.items():
                    files[f'{file_type}_file'] = open(file_path, 'rb')
            
            # Submit application
            response = self.session.post(
                f"{self.base_url}/api/jobs/apply",
                data=data,
                files=files
            )
            
            # Close files
            for file_obj in files.values():
                file_obj.close()
            
            if response.status_code == 201:
                result_data = response.json()
                self.application_id = result_data.get('data', {}).get('application_id')
                
                self.log_test(
                    "Job Application Submission", 
                    True, 
                    f"Application submitted successfully",
                    {
                        "application_id": self.application_id,
                        "job_id": job_id,
                        "documents_uploaded": result_data.get('data', {}).get('documents_uploaded', 0)
                    }
                )
                return True
            else:
                self.log_test("Job Application Submission", False, f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Job Application Submission", False, f"Error: {str(e)}")
            return False
    
    def test_application_retrieval(self):
        """Test retrieving application details"""
        print("\n📋 Testing application retrieval...")
        
        try:
            # Get user's applications
            response = self.session.get(f"{self.base_url}/api/jobs/applications")
            
            if response.status_code == 200:
                data = response.json()
                applications = data.get('data', {}).get('applications', [])
                
                if applications:
                    latest_app = applications[0]  # Should be our test application
                    
                    self.log_test(
                        "Applications List Retrieval", 
                        True, 
                        f"Retrieved {len(applications)} applications",
                        {
                            "total_applications": len(applications),
                            "latest_application_id": latest_app.get('application_id'),
                            "status": latest_app.get('status')
                        }
                    )
                    
                    # Test detailed application retrieval
                    if self.application_id:
                        detail_response = self.session.get(f"{self.base_url}/api/jobs/applications/{self.application_id}")
                        
                        if detail_response.status_code == 200:
                            detail_data = detail_response.json()
                            app_details = detail_data.get('data', {})
                            
                            self.log_test(
                                "Application Details Retrieval", 
                                True, 
                                "Detailed application data retrieved",
                                {
                                    "application_id": app_details.get('application_id'),
                                    "documents_count": len(app_details.get('documents', [])),
                                    "status_timeline_events": len(app_details.get('status_timeline', []))
                                }
                            )
                            return True
                        else:
                            self.log_test("Application Details Retrieval", False, f"Failed: {detail_response.text}")
                            return False
                else:
                    self.log_test("Applications List Retrieval", False, "No applications found")
                    return False
            else:
                self.log_test("Applications List Retrieval", False, f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Application Retrieval", False, f"Error: {str(e)}")
            return False
    
    def test_status_tracking(self):
        """Test status tracking functionality"""
        print("\n📊 Testing status tracking...")
        
        if not self.application_id:
            self.log_test("Status Tracking", False, "No application ID available")
            return False
        
        try:
            # Test status options
            response = self.session.get(f"{self.base_url}/api/applications/status-options")
            
            if response.status_code == 200:
                status_data = response.json()
                status_options = status_data.get('data', {}).get('status_options', {})
                
                self.log_test(
                    "Status Options Retrieval", 
                    True, 
                    f"Retrieved {len(status_options)} status options",
                    {"available_statuses": list(status_options.keys())}
                )
            else:
                self.log_test("Status Options Retrieval", False, f"Failed: {response.text}")
            
            # Test application status
            response = self.session.get(f"{self.base_url}/api/applications/{self.application_id}/status")
            
            if response.status_code == 200:
                status_data = response.json()
                current_status = status_data.get('data', {}).get('current_status', {})
                
                self.log_test(
                    "Application Status Retrieval", 
                    True, 
                    f"Current status: {current_status.get('status')}",
                    {
                        "status": current_status.get('status'),
                        "progress_percentage": status_data.get('data', {}).get('progress_percentage'),
                        "next_actions": len(status_data.get('data', {}).get('next_actions', []))
                    }
                )
            else:
                self.log_test("Application Status Retrieval", False, f"Failed: {response.text}")
            
            # Test timeline
            response = self.session.get(f"{self.base_url}/api/applications/{self.application_id}/timeline")
            
            if response.status_code == 200:
                timeline_data = response.json()
                timeline = timeline_data.get('data', {}).get('timeline', [])
                
                self.log_test(
                    "Application Timeline Retrieval", 
                    True, 
                    f"Timeline has {len(timeline)} events",
                    {
                        "timeline_events": len(timeline),
                        "event_types": list(set(event.get('type') for event in timeline))
                    }
                )
                return True
            else:
                self.log_test("Application Timeline Retrieval", False, f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Status Tracking", False, f"Error: {str(e)}")
            return False
    
    def test_status_update(self):
        """Test status update functionality"""
        print("\n🔄 Testing status updates...")
        
        if not self.application_id:
            self.log_test("Status Update", False, "No application ID available")
            return False
        
        try:
            # Test status update to "under_review"
            update_data = {
                "status": "under_review",
                "reason": "Automated test status update",
                "notes": "Moving application to review phase for testing purposes",
                "send_notification": True
            }
            
            response = self.session.put(
                f"{self.base_url}/api/applications/{self.application_id}/status",
                json=update_data
            )
            
            if response.status_code == 200:
                result_data = response.json()
                
                self.log_test(
                    "Status Update", 
                    True, 
                    f"Status updated to: {result_data.get('data', {}).get('new_status')}",
                    {
                        "new_status": result_data.get('data', {}).get('new_status'),
                        "updated_at": result_data.get('data', {}).get('updated_at')
                    }
                )
                
                # Wait a moment and check if status was actually updated
                time.sleep(1)
                
                status_response = self.session.get(f"{self.base_url}/api/applications/{self.application_id}/status")
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    current_status = status_data.get('data', {}).get('current_status', {}).get('status')
                    
                    if current_status == "under_review":
                        self.log_test("Status Update Verification", True, "Status update verified")
                        return True
                    else:
                        self.log_test("Status Update Verification", False, f"Status not updated: {current_status}")
                        return False
                else:
                    self.log_test("Status Update Verification", False, "Could not verify status update")
                    return False
            else:
                self.log_test("Status Update", False, f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Status Update", False, f"Error: {str(e)}")
            return False
    
    def test_notifications(self):
        """Test notification system"""
        print("\n🔔 Testing notifications...")
        
        try:
            # Get user notifications
            response = self.session.get(f"{self.base_url}/api/applications/notifications")
            
            if response.status_code == 200:
                data = response.json()
                notifications = data.get('data', {}).get('notifications', [])
                pagination = data.get('data', {}).get('pagination', {})
                
                self.log_test(
                    "Notifications Retrieval", 
                    True, 
                    f"Retrieved {len(notifications)} notifications",
                    {
                        "total_notifications": len(notifications),
                        "unread_count": pagination.get('unread_count', 0),
                        "notification_types": list(set(n.get('type') for n in notifications))
                    }
                )
                
                # Test marking notification as read
                if notifications:
                    first_notification = notifications[0]
                    notification_id = first_notification.get('id')
                    
                    if notification_id and not first_notification.get('is_read'):
                        read_response = self.session.post(
                            f"{self.base_url}/api/applications/notifications/{notification_id}/read"
                        )
                        
                        if read_response.status_code == 200:
                            self.log_test("Mark Notification Read", True, "Notification marked as read")
                        else:
                            self.log_test("Mark Notification Read", False, f"Failed: {read_response.text}")
                
                return True
            else:
                self.log_test("Notifications Retrieval", False, f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Notifications", False, f"Error: {str(e)}")
            return False
    
    def test_analytics(self):
        """Test analytics functionality"""
        print("\n📈 Testing analytics...")
        
        try:
            # Get status analytics
            response = self.session.get(f"{self.base_url}/api/applications/analytics/status?date_range=30")
            
            if response.status_code == 200:
                data = response.json()
                analytics = data.get('data', {}).get('user_analytics', {})
                
                self.log_test(
                    "Status Analytics", 
                    True, 
                    "Analytics data retrieved",
                    {
                        "status_distribution": len(analytics.get('status_distribution', [])),
                        "success_rate": analytics.get('success_rates', {}).get('success_percentage', 0),
                        "total_applications": analytics.get('success_rates', {}).get('total', 0)
                    }
                )
                return True
            else:
                self.log_test("Status Analytics", False, f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Analytics", False, f"Error: {str(e)}")
            return False
    
    def cleanup_test_files(self):
        """Clean up test files"""
        print("\n🧹 Cleaning up test files...")
        
        try:
            for file_path in self.test_files.values():
                if os.path.exists(file_path):
                    os.unlink(file_path)
            
            self.log_test("Test Files Cleanup", True, f"Cleaned up {len(self.test_files)} test files")
        except Exception as e:
            self.log_test("Test Files Cleanup", False, f"Error: {str(e)}")
    
    def run_complete_test(self):
        """Run complete Apply Now flow test"""
        print("🧪 Starting Complete Apply Now Flow Test")
        print("=" * 60)
        
        success_count = 0
        total_tests = 0
        
        # Run all test phases
        test_phases = [
            ("Setup", self.setup_test_user),
            ("File Creation", self.create_test_files),
            ("Application Submission", self.test_job_application_submission),
            ("Application Retrieval", self.test_application_retrieval),
            ("Status Tracking", self.test_status_tracking),
            ("Status Updates", self.test_status_update),
            ("Notifications", self.test_notifications),
            ("Analytics", self.test_analytics)
        ]
        
        for phase_name, test_function in test_phases:
            print(f"\n📋 Phase: {phase_name}")
            print("-" * 30)
            
            try:
                if test_function():
                    success_count += 1
                total_tests += 1
            except Exception as e:
                print(f"❌ Phase {phase_name} failed with error: {str(e)}")
                total_tests += 1
        
        # Cleanup
        self.cleanup_test_files()
        
        # Calculate results
        success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
        self.test_results["overall_success"] = success_rate >= 80
        self.test_results["success_rate"] = success_rate
        self.test_results["successful_phases"] = success_count
        self.test_results["total_phases"] = total_tests
        
        # Display results
        print("\n" + "=" * 60)
        print("🏆 COMPLETE APPLY NOW FLOW TEST RESULTS")
        print("=" * 60)
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Successful Phases: {success_count}/{total_tests}")
        
        if self.application_id:
            print(f"Test Application ID: {self.application_id}")
        
        if success_rate >= 80:
            print("✅ Apply Now functionality is working correctly!")
        elif success_rate >= 60:
            print("⚠️ Apply Now functionality has some issues but core features work")
        else:
            print("❌ Apply Now functionality needs significant fixes")
        
        # Save results
        with open("/home/ubuntu/emirati-platform/complete_apply_now_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: complete_apply_now_test_results.json")
        
        return self.test_results["overall_success"]

def main():
    """Main testing function"""
    tester = CompleteApplyNowTester()
    
    try:
        success = tester.run_complete_test()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Testing failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())
