#!/usr/bin/env python3
"""
Comprehensive Mentor Persona Functionality Test
Tests all mentor features: matching, scheduling, progress tracking, and communication
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class MentorPersonaTestSuite:
    """Comprehensive test suite for mentor persona functionality"""
    
    def __init__(self):
        self.base_url = "http://localhost:5004"
        self.mentor_token = None
        self.mentee_token = None
        self.mentor_user_id = None
        self.mentee_user_id = None
        self.mentor_profile_id = None
        self.mentorship_id = None
        self.session_id = None
        self.goal_id = None
        self.conversation_id = None
        self.test_results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': []
        }
        
        # Test data
        self.mentor_data = {
            'email': f'mentor_test_{int(time.time())}@example.com',
            'password': 'TestPassword123!',
            'first_name': 'Ahmed',
            'last_name': 'Al-Mansouri',
            'role': 'mentor',
            'phone': '+971501234567',
            'emirate': 'Dubai'
        }
        
        self.mentee_data = {
            'email': f'mentee_test_{int(time.time())}@example.com',
            'password': 'TestPassword123!',
            'first_name': 'Fatima',
            'last_name': 'Al-Zahra',
            'role': 'candidate',
            'phone': '+971507654321',
            'emirate': 'Abu Dhabi'
        }

    def log_test_result(self, test_name: str, success: bool, details: str = "", response_data: Dict = None):
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
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        
        if response_data:
            result['response_data'] = response_data
        
        self.test_results['test_details'].append(result)
        print(f"{status} {test_name}: {details}")

    def register_and_login_users(self) -> bool:
        """Register and login both mentor and mentee users"""
        try:
            # Register mentor
            mentor_reg_response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=self.mentor_data
            )
            
            if mentor_reg_response.status_code in [200, 201]:
                mentor_reg_data = mentor_reg_response.json()
                # Registration doesn't return user_id, we'll get it from login
                self.log_test_result("Mentor Registration", True, "Mentor registered successfully")
            else:
                self.log_test_result("Mentor Registration", False, f"Status: {mentor_reg_response.status_code}")
                return False
            
            # Register mentee
            mentee_reg_response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=self.mentee_data
            )
            
            if mentee_reg_response.status_code in [200, 201]:
                mentee_reg_data = mentee_reg_response.json()
                # Registration doesn't return user_id, we'll get it from login
                self.log_test_result("Mentee Registration", True, "Mentee registered successfully")
            else:
                self.log_test_result("Mentee Registration", False, f"Status: {mentee_reg_response.status_code}")
                return False
            
            # Login mentor
            mentor_login_response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={
                    'email': self.mentor_data['email'],
                    'password': self.mentor_data['password']
                }
            )
            
            if mentor_login_response.status_code == 200:
                mentor_login_data = mentor_login_response.json()
                self.mentor_token = mentor_login_data.get('data', {}).get('access_token')
                self.mentor_user_id = mentor_login_data.get('data', {}).get('user', {}).get('id')
                self.log_test_result("Mentor Login", True, "Mentor logged in successfully")
            else:
                self.log_test_result("Mentor Login", False, f"Status: {mentor_login_response.status_code}")
                return False
            
            # Login mentee
            mentee_login_response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={
                    'email': self.mentee_data['email'],
                    'password': self.mentee_data['password']
                }
            )
            
            if mentee_login_response.status_code == 200:
                mentee_login_data = mentee_login_response.json()
                self.mentee_token = mentee_login_data.get('data', {}).get('access_token')
                self.mentee_user_id = mentee_login_data.get('data', {}).get('user', {}).get('id')
                self.log_test_result("Mentee Login", True, "Mentee logged in successfully")
            else:
                self.log_test_result("Mentee Login", False, f"Status: {mentee_login_response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_test_result("User Registration/Login", False, f"Exception: {str(e)}")
            return False

    def test_mentor_profile_creation(self) -> bool:
        """Test mentor profile creation"""
        try:
            profile_data = {
                'user_id': self.mentor_user_id,
                'full_name': 'Ahmed Al-Mansouri',
                'email': self.mentor_data['email'],
                'current_position': 'Senior Technology Manager',
                'company': 'Emirates Technology Solutions',
                'bio': 'Experienced technology leader with 15+ years in UAE tech industry',
                'expertise_areas': ['Technology', 'Leadership', 'Digital Transformation'],
                'industry': 'Technology',
                'total_experience_years': 15,
                'location': 'Dubai',
                'languages': ['English', 'Arabic'],
                'availability': {
                    'days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                    'time_slots': ['09:00-12:00', '14:00-17:00']
                },
                'mentoring_style': 'Collaborative and goal-oriented',
                'max_mentees': 5
            }
            
            response = requests.post(
                f"{self.base_url}/api/mentor/profile",
                json=profile_data,
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if response.status_code in [200, 201]:
                profile_response = response.json()
                self.mentor_profile_id = profile_response.get('mentor_id') or profile_response.get('profile_id')
                self.log_test_result("Mentor Profile Creation", True, "Profile created successfully")
                return True
            else:
                self.log_test_result("Mentor Profile Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Mentor Profile Creation", False, f"Exception: {str(e)}")
            return False

    def test_mentee_profile_creation(self) -> bool:
        """Test mentee profile creation"""
        try:
            profile_data = {
                'professional_summary': 'Motivated software developer seeking to transition into technology leadership role',
                'experience_years': 3,
                'current_position': 'Software Developer',
                'current_company': 'Dubai Tech Solutions',
                'salary_expectation': 120000,
                'notice_period': '1 month',
                'preferred_locations': ['Dubai', 'Abu Dhabi'],
                'remote_work_preference': True,
                'personal_info': {
                    'career_goals': 'Transition into technology leadership role',
                    'interests': ['AI/ML', 'Cloud Computing', 'Team Leadership'],
                    'preferred_mentoring_style': 'Structured with regular check-ins'
                },
                'education': [
                    {
                        'degree': 'Bachelor of Computer Science',
                        'institution': 'American University of Dubai',
                        'graduation_year': 2021
                    }
                ],
                'skills': [
                    {'name': 'Python', 'level': 'Advanced'},
                    {'name': 'JavaScript', 'level': 'Intermediate'},
                    {'name': 'Project Management', 'level': 'Beginner'}
                ],
                'languages': [
                    {'language': 'English', 'proficiency': 'Native'},
                    {'language': 'Arabic', 'proficiency': 'Fluent'}
                ],
                'certifications': [
                    {
                        'name': 'AWS Cloud Practitioner',
                        'issuer': 'Amazon Web Services',
                        'date_obtained': '2023-01-15'
                    }
                ]
            }
            
            response = requests.post(
                f"{self.base_url}/api/profile/candidate",
                json=profile_data,
                headers={'Authorization': f'Bearer {self.mentee_token}'}
            )
            
            if response.status_code in [200, 201]:
                self.log_test_result("Mentee Profile Creation", True, "Profile created successfully")
                return True
            else:
                self.log_test_result("Mentee Profile Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Mentee Profile Creation", False, f"Exception: {str(e)}")
            return False

    def test_mentor_matching(self) -> bool:
        """Test mentor-mentee matching functionality"""
        try:
            # Test finding mentors for mentee
            response = requests.post(
                f"{self.base_url}/api/mentor/matching/find-mentors",
                headers={'Authorization': f'Bearer {self.mentee_token}'},
                json={'limit': 10}
            )
            
            if response.status_code == 200:
                matching_data = response.json()
                mentors = matching_data.get('mentors', [])
                self.log_test_result("Mentor Matching - Find Mentors", True, f"Found {len(mentors)} potential mentors")
                
                # Test sending mentoring request
                if mentors:
                    mentor_match = mentors[0]
                    request_data = {
                        'mentor_id': mentor_match['mentor_id'],
                        'message': 'I would like to request mentoring in technology leadership'
                    }
                    
                    request_response = requests.post(
                        f"{self.base_url}/api/mentor/matching/request",
                        json=request_data,
                        headers={'Authorization': f'Bearer {self.mentee_token}'}
                    )
                    
                    if request_response.status_code == 201:
                        request_result = request_response.json()
                        self.mentorship_id = request_result.get('request_id')
                        self.log_test_result("Mentoring Request", True, "Request sent successfully")
                        return True
                    else:
                        self.log_test_result("Mentoring Request", False, f"Status: {request_response.status_code}")
                        return False
                else:
                    self.log_test_result("Mentor Matching - Find Mentors", False, "No mentors found")
                    return False
            else:
                self.log_test_result("Mentor Matching - Find Mentors", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Mentor Matching", False, f"Exception: {str(e)}")
            return False

    def test_session_scheduling(self) -> bool:
        """Test session scheduling functionality"""
        try:
            # Test mentor availability management
            availability_data = {
                'date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
                'time_slots': [
                    {'start_time': '10:00', 'end_time': '11:00'},
                    {'start_time': '14:00', 'end_time': '15:00'}
                ]
            }
            
            availability_response = requests.post(
                f"{self.base_url}/api/mentor/sessions/availability",
                json=availability_data,
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if availability_response.status_code in [200, 201]:
                self.log_test_result("Session Availability Management", True, "Availability set successfully")
            else:
                self.log_test_result("Session Availability Management", False, f"Status: {availability_response.status_code}")
                return False
            
            # Test session scheduling
            session_data = {
                'mentee_user_id': self.mentee_user_id,
                'scheduled_date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
                'start_time': '10:00',
                'end_time': '11:00',
                'session_type': 'video_call',
                'agenda': 'Career development discussion and goal setting',
                'platform': 'zoom'
            }
            
            session_response = requests.post(
                f"{self.base_url}/api/mentor/sessions/schedule",
                json=session_data,
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if session_response.status_code == 201:
                session_result = session_response.json()
                self.session_id = session_result.get('session_id')
                self.log_test_result("Session Scheduling", True, "Session scheduled successfully")
                return True
            else:
                self.log_test_result("Session Scheduling", False, f"Status: {session_response.status_code}, Response: {session_response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Session Scheduling", False, f"Exception: {str(e)}")
            return False

    def test_progress_tracking(self) -> bool:
        """Test progress tracking and goal management"""
        try:
            # Test goal creation
            goal_data = {
                'mentorship_id': self.mentorship_id or str(uuid.uuid4()),
                'title': 'Develop Leadership Skills',
                'description': 'Improve team leadership and communication skills',
                'category': 'leadership',
                'priority': 'high',
                'target_date': (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'),
                'success_criteria': 'Lead a team project successfully and receive positive feedback',
                'milestones': [
                    {
                        'title': 'Complete leadership training course',
                        'description': 'Enroll and complete online leadership course',
                        'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                    },
                    {
                        'title': 'Shadow senior manager',
                        'description': 'Spend time observing senior manager in meetings',
                        'due_date': (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
                    }
                ]
            }
            
            goal_response = requests.post(
                f"{self.base_url}/api/mentor/progress/goals",
                json=goal_data,
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if goal_response.status_code == 201:
                goal_result = goal_response.json()
                self.goal_id = goal_result.get('goal_id')
                self.log_test_result("Goal Creation", True, "Goal created successfully")
            else:
                self.log_test_result("Goal Creation", False, f"Status: {goal_response.status_code}, Response: {goal_response.text}")
                return False
            
            # Test progress update
            progress_data = {
                'goal_id': self.goal_id,
                'progress_percentage': 25,
                'progress_notes': 'Started researching leadership training courses',
                'evidence': 'Compiled list of 5 potential courses',
                'mentor_feedback': 'Good start, focus on courses with practical components'
            }
            
            progress_response = requests.post(
                f"{self.base_url}/api/mentor/progress/update",
                json=progress_data,
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if progress_response.status_code == 201:
                self.log_test_result("Progress Update", True, "Progress updated successfully")
                return True
            else:
                self.log_test_result("Progress Update", False, f"Status: {progress_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Progress Tracking", False, f"Exception: {str(e)}")
            return False

    def test_communication_features(self) -> bool:
        """Test communication and messaging features"""
        try:
            # Test conversation creation
            conversation_data = {
                'conversation_type': 'direct_message',
                'participants': [self.mentor_user_id, self.mentee_user_id],
                'title': 'Mentorship Discussion',
                'description': 'Direct communication between mentor and mentee'
            }
            
            conversation_response = requests.post(
                f"{self.base_url}/api/mentor/communication/conversations",
                json=conversation_data,
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if conversation_response.status_code == 200:
                conversation_result = conversation_response.json()
                self.conversation_id = conversation_result.get('conversation_id')
                self.log_test_result("Conversation Creation", True, "Conversation created successfully")
            else:
                self.log_test_result("Conversation Creation", False, f"Status: {conversation_response.status_code}, Response: {conversation_response.text}")
                return False
            
            # Test message sending
            message_data = {
                'conversation_id': self.conversation_id,
                'recipient_id': self.mentee_user_id,
                'content': 'Welcome to our mentorship journey! I look forward to working with you.',
                'message_type': 'text'
            }
            
            message_response = requests.post(
                f"{self.base_url}/api/mentor/communication/messages",
                json=message_data,
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if message_response.status_code == 200:
                self.log_test_result("Message Sending", True, "Message sent successfully")
            else:
                self.log_test_result("Message Sending", False, f"Status: {message_response.status_code}")
                return False
            
            # Test getting conversations
            conversations_response = requests.get(
                f"{self.base_url}/api/mentor/communication/conversations",
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if conversations_response.status_code == 200:
                conversations_data = conversations_response.json()
                conversations = conversations_data.get('conversations', [])
                self.log_test_result("Get Conversations", True, f"Retrieved {len(conversations)} conversations")
                return True
            else:
                self.log_test_result("Get Conversations", False, f"Status: {conversations_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Communication Features", False, f"Exception: {str(e)}")
            return False

    def test_notification_system(self) -> bool:
        """Test notification system"""
        try:
            # Test getting notifications
            notifications_response = requests.get(
                f"{self.base_url}/api/mentor/communication/notifications",
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if notifications_response.status_code == 200:
                notifications_data = notifications_response.json()
                notifications = notifications_data.get('notifications', [])
                self.log_test_result("Get Notifications", True, f"Retrieved {len(notifications)} notifications")
            else:
                self.log_test_result("Get Notifications", False, f"Status: {notifications_response.status_code}")
                return False
            
            # Test unread counts
            unread_response = requests.get(
                f"{self.base_url}/api/mentor/communication/unread-counts",
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if unread_response.status_code == 200:
                unread_data = unread_response.json()
                self.log_test_result("Unread Counts", True, f"Unread messages: {unread_data.get('unread_messages', 0)}, notifications: {unread_data.get('unread_notifications', 0)}")
                return True
            else:
                self.log_test_result("Unread Counts", False, f"Status: {unread_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Notification System", False, f"Exception: {str(e)}")
            return False

    def test_analytics_and_reporting(self) -> bool:
        """Test analytics and reporting features"""
        try:
            # Test mentor analytics (use a dummy mentorship ID for testing)
            test_mentorship_id = self.mentorship_id or "test-mentorship-id"
            analytics_response = requests.get(
                f"{self.base_url}/api/mentor/progress/analytics/{test_mentorship_id}",
                headers={'Authorization': f'Bearer {self.mentor_token}'}
            )
            
            if analytics_response.status_code == 200:
                analytics_data = analytics_response.json()
                self.log_test_result("Mentor Analytics", True, "Analytics retrieved successfully")
                return True
            else:
                self.log_test_result("Mentor Analytics", False, f"Status: {analytics_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Analytics and Reporting", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run comprehensive mentor persona test suite"""
        print("🚀 Starting Comprehensive Mentor Persona Test Suite")
        print("=" * 60)
        
        start_time = time.time()
        
        # Test sequence
        test_sequence = [
            ("User Registration and Login", self.register_and_login_users),
            ("Mentor Profile Creation", self.test_mentor_profile_creation),
            ("Mentee Profile Creation", self.test_mentee_profile_creation),
            ("Mentor Matching", self.test_mentor_matching),
            ("Session Scheduling", self.test_session_scheduling),
            ("Progress Tracking", self.test_progress_tracking),
            ("Communication Features", self.test_communication_features),
            ("Notification System", self.test_notification_system),
            ("Analytics and Reporting", self.test_analytics_and_reporting)
        ]
        
        for test_name, test_function in test_sequence:
            print(f"\n🔍 Testing: {test_name}")
            try:
                success = test_function()
                if not success:
                    print(f"⚠️ {test_name} failed, continuing with remaining tests...")
            except Exception as e:
                self.log_test_result(test_name, False, f"Unexpected error: {str(e)}")
                print(f"❌ {test_name} encountered unexpected error: {str(e)}")
        
        # Calculate results
        end_time = time.time()
        duration = end_time - start_time
        success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests']) * 100 if self.test_results['total_tests'] > 0 else 0
        
        # Generate final report
        print("\n" + "=" * 60)
        print("📊 MENTOR PERSONA TEST RESULTS")
        print("=" * 60)
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed_tests']}")
        print(f"Failed: {self.test_results['failed_tests']}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Assessment
        if success_rate >= 90:
            assessment = "🏆 EXCELLENT - Production Ready"
        elif success_rate >= 75:
            assessment = "✅ GOOD - Minor Issues to Address"
        elif success_rate >= 50:
            assessment = "⚠️ FAIR - Significant Issues Need Attention"
        else:
            assessment = "❌ POOR - Major Issues Require Immediate Attention"
        
        print(f"Assessment: {assessment}")
        
        # Save detailed results
        with open('/home/ubuntu/emirati-platform/mentor_persona_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': self.test_results['total_tests'],
                    'passed_tests': self.test_results['passed_tests'],
                    'failed_tests': self.test_results['failed_tests'],
                    'success_rate': success_rate,
                    'duration_seconds': duration,
                    'assessment': assessment,
                    'timestamp': datetime.now().isoformat()
                },
                'test_details': self.test_results['test_details']
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: mentor_persona_test_results.json")
        print("=" * 60)

if __name__ == "__main__":
    test_suite = MentorPersonaTestSuite()
    test_suite.run_comprehensive_test()
