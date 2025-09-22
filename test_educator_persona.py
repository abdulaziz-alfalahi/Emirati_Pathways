#!/usr/bin/env python3
"""
Comprehensive Educator Persona Testing Script
Emirati Journey Platform - Educator Functionality Testing

This script tests all Educator persona features including:
- Educator Profile Management
- Institution Profile Setup
- Student Tracking and Management
- Curriculum Planning and Development
- Career Guidance Tools
- Performance Analytics
- Educational Resource Management
- Assessment and Evaluation Tools
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

class EducatorPersonaTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "persona": "Educator",
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
            
    def test_educator_registration(self):
        """Test Educator registration process"""
        try:
            registration_data = {
                "email": "dr.fatima@uaeu.ac.ae",
                "password": "SecurePass123!",
                "first_name": "Dr. Fatima",
                "last_name": "Al Mansouri",
                "user_type": "mentor",
                "phone": "+971501234567",
                "emirate": "Abu Dhabi",
                "nationality": "UAE",
                "education_level": "PhD",
                "gender": "Female"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/register", json=registration_data)
            
            if response.status_code == 201:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user_id")
                if self.auth_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("Educator Registration", "PASS", "Educator account created successfully", 15)
                return True
            else:
                self.log_test("Educator Registration", "FAIL", f"Registration failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Educator Registration", "FAIL", f"Registration error: {str(e)}", 0)
            return False
            
    def test_educator_login(self):
        """Test Educator login process"""
        try:
            login_data = {
                "email": "dr.fatima@uaeu.ac.ae",
                "password": "SecurePass123!"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                if self.auth_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("Educator Login", "PASS", "Login successful", 10)
                return True
            else:
                self.log_test("Educator Login", "FAIL", f"Login failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Educator Login", "FAIL", f"Login error: {str(e)}", 0)
            return False
            
    def test_educator_profile_management(self):
        """Test Educator profile creation and management"""
        try:
            profile_data = {
                "personal_info": {
                    "first_name": "Dr. Fatima",
                    "last_name": "Al Mansouri",
                    "email": "dr.fatima@uaeu.ac.ae",
                    "phone": "+971501234567",
                    "location": "Abu Dhabi, UAE",
                    "nationality": "UAE"
                },
                "academic_info": {
                    "title": "Associate Professor",
                    "department": "Computer Science",
                    "specializations": ["Artificial Intelligence", "Machine Learning", "Data Science"],
                    "qualifications": ["PhD Computer Science", "MSc Information Technology"],
                    "years_experience": 12,
                    "research_interests": ["AI in Education", "Educational Technology"]
                },
                "institution_info": {
                    "institution_name": "United Arab Emirates University",
                    "institution_type": "Public University",
                    "location": "Al Ain, Abu Dhabi",
                    "accreditation": "UAE Ministry of Education"
                },
                "teaching_info": {
                    "subjects": ["Introduction to AI", "Machine Learning", "Data Structures"],
                    "grade_levels": ["Undergraduate", "Graduate"],
                    "teaching_methods": ["Lecture", "Laboratory", "Project-based Learning"],
                    "languages": ["Arabic", "English"]
                }
            }
            
            # Test profile creation
            response = self.session.post(f"{self.base_url}/api/educator/profile", json=profile_data)
            
            if response.status_code in [200, 201]:
                self.log_test("Educator Profile Creation", "PASS", "Profile created successfully", 15)
                
                # Test profile retrieval
                response = self.session.get(f"{self.base_url}/api/educator/profile")
                if response.status_code == 200:
                    profile = response.json()
                    self.log_test("Educator Profile Retrieval", "PASS", f"Profile retrieved: {profile.get('personal_info', {}).get('first_name', 'Unknown')}", 10)
                    return True
                else:
                    self.log_test("Educator Profile Retrieval", "FAIL", "Could not retrieve profile", 0)
                    return False
            else:
                self.log_test("Educator Profile Creation", "FAIL", f"Profile creation failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Educator Profile Management", "FAIL", f"Profile error: {str(e)}", 0)
            return False
            
    def test_institution_profile_setup(self):
        """Test institution profile setup and management"""
        try:
            institution_data = {
                "institution_details": {
                    "name": "United Arab Emirates University",
                    "type": "Public University",
                    "established": "1976",
                    "location": "Al Ain, Abu Dhabi",
                    "website": "https://www.uaeu.ac.ae",
                    "description": "Leading comprehensive university in the UAE"
                },
                "accreditation": {
                    "primary": "UAE Ministry of Education",
                    "international": ["AACSB", "ABET", "CAA"],
                    "quality_assurance": "UAE National Qualifications Authority"
                },
                "programs": [
                    {
                        "name": "Computer Science",
                        "level": "Bachelor's",
                        "duration": "4 years",
                        "language": "English"
                    },
                    {
                        "name": "Artificial Intelligence",
                        "level": "Master's",
                        "duration": "2 years",
                        "language": "English"
                    }
                ],
                "facilities": [
                    "Computer Labs",
                    "Research Centers",
                    "Library",
                    "Student Services"
                ],
                "partnerships": [
                    "Industry Collaboration Programs",
                    "International Exchange Programs",
                    "Research Partnerships"
                ]
            }
            
            response = self.session.post(f"{self.base_url}/api/educator/institution", json=institution_data)
            
            if response.status_code in [200, 201]:
                self.log_test("Institution Profile Setup", "PASS", "Institution profile configured", 15)
                return True
            else:
                self.log_test("Institution Profile Setup", "FAIL", f"Institution setup failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Institution Profile Setup", "FAIL", f"Institution setup error: {str(e)}", 0)
            return False
            
    def test_student_tracking_management(self):
        """Test student tracking and management features"""
        try:
            # Test student enrollment
            student_data = {
                "student_id": "STU001",
                "name": "Ahmed Al Emirati",
                "email": "ahmed.alemirati@student.uaeu.ac.ae",
                "program": "Computer Science",
                "year": "3rd Year",
                "gpa": 3.7,
                "courses": [
                    {
                        "course_id": "CS301",
                        "course_name": "Introduction to AI",
                        "credits": 3,
                        "grade": "A-"
                    },
                    {
                        "course_id": "CS302",
                        "course_name": "Machine Learning",
                        "credits": 3,
                        "grade": "B+"
                    }
                ],
                "career_interests": ["Software Development", "AI Research"],
                "skills": ["Python", "Java", "Machine Learning"]
            }
            
            response = self.session.post(f"{self.base_url}/api/educator/students", json=student_data)
            
            if response.status_code in [200, 201]:
                student_id = response.json().get("student_id", "STU001")
                self.log_test("Student Enrollment", "PASS", f"Student enrolled with ID: {student_id}", 15)
                
                # Test student listing
                response = self.session.get(f"{self.base_url}/api/educator/students")
                if response.status_code == 200:
                    students = response.json()
                    self.log_test("Student Listing", "PASS", f"Retrieved {len(students)} students", 10)
                    
                    # Test individual student tracking
                    response = self.session.get(f"{self.base_url}/api/educator/students/{student_id}")
                    if response.status_code == 200:
                        student_details = response.json()
                        self.log_test("Student Tracking", "PASS", f"Student details retrieved: GPA {student_details.get('gpa', 'N/A')}", 10)
                        return True
                    else:
                        self.log_test("Student Tracking", "FAIL", "Could not retrieve student details", 0)
                        return False
                else:
                    self.log_test("Student Listing", "FAIL", "Could not retrieve student list", 0)
                    return False
            else:
                self.log_test("Student Enrollment", "FAIL", f"Student enrollment failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Student Tracking Management", "FAIL", f"Student tracking error: {str(e)}", 0)
            return False
            
    def test_curriculum_planning(self):
        """Test curriculum planning and development features"""
        try:
            curriculum_data = {
                "course_info": {
                    "course_id": "CS401",
                    "course_name": "Advanced Artificial Intelligence",
                    "credits": 3,
                    "level": "Undergraduate",
                    "prerequisites": ["CS301", "CS302"],
                    "description": "Advanced topics in artificial intelligence including deep learning and neural networks"
                },
                "learning_objectives": [
                    "Understand advanced AI algorithms",
                    "Implement deep learning models",
                    "Apply AI to real-world problems",
                    "Evaluate AI system performance"
                ],
                "curriculum_structure": {
                    "weeks": 15,
                    "modules": [
                        {
                            "module": "Introduction to Deep Learning",
                            "weeks": 3,
                            "topics": ["Neural Networks", "Backpropagation", "Optimization"]
                        },
                        {
                            "module": "Convolutional Neural Networks",
                            "weeks": 4,
                            "topics": ["CNN Architecture", "Image Processing", "Computer Vision"]
                        },
                        {
                            "module": "Natural Language Processing",
                            "weeks": 4,
                            "topics": ["Text Processing", "Language Models", "Sentiment Analysis"]
                        },
                        {
                            "module": "AI Ethics and Applications",
                            "weeks": 4,
                            "topics": ["Ethical AI", "Bias in AI", "UAE AI Strategy"]
                        }
                    ]
                },
                "assessment_methods": [
                    {
                        "type": "Midterm Exam",
                        "weight": 25,
                        "description": "Written examination covering theoretical concepts"
                    },
                    {
                        "type": "Project",
                        "weight": 40,
                        "description": "AI application development project"
                    },
                    {
                        "type": "Final Exam",
                        "weight": 35,
                        "description": "Comprehensive final examination"
                    }
                ],
                "resources": [
                    "Textbook: Artificial Intelligence: A Modern Approach",
                    "Online Platform: TensorFlow and PyTorch",
                    "UAE AI Strategy 2031 Documentation"
                ]
            }
            
            response = self.session.post(f"{self.base_url}/api/educator/curriculum", json=curriculum_data)
            
            if response.status_code in [200, 201]:
                course_id = response.json().get("course_id", "CS401")
                self.log_test("Curriculum Planning", "PASS", f"Curriculum created for course: {course_id}", 15)
                
                # Test curriculum retrieval
                response = self.session.get(f"{self.base_url}/api/educator/curriculum/{course_id}")
                if response.status_code == 200:
                    curriculum = response.json()
                    self.log_test("Curriculum Retrieval", "PASS", f"Curriculum retrieved: {curriculum.get('course_info', {}).get('course_name', 'Unknown')}", 10)
                    return True
                else:
                    self.log_test("Curriculum Retrieval", "FAIL", "Could not retrieve curriculum", 0)
                    return False
            else:
                self.log_test("Curriculum Planning", "FAIL", f"Curriculum creation failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Curriculum Planning", "FAIL", f"Curriculum error: {str(e)}", 0)
            return False
            
    def test_career_guidance_tools(self):
        """Test career guidance and counseling tools"""
        try:
            guidance_data = {
                "student_id": "STU001",
                "career_assessment": {
                    "interests": ["Technology", "Innovation", "Problem Solving"],
                    "strengths": ["Analytical Thinking", "Programming", "Research"],
                    "personality_type": "INTJ",
                    "preferred_work_environment": "Collaborative, Tech-focused"
                },
                "career_recommendations": [
                    {
                        "career": "AI Engineer",
                        "match_score": 95,
                        "requirements": ["Machine Learning", "Python", "Mathematics"],
                        "growth_prospects": "High demand in UAE Vision 2071"
                    },
                    {
                        "career": "Data Scientist",
                        "match_score": 88,
                        "requirements": ["Statistics", "Data Analysis", "Visualization"],
                        "growth_prospects": "Growing field in UAE digital transformation"
                    }
                ],
                "development_plan": {
                    "short_term": [
                        "Complete AI specialization courses",
                        "Participate in hackathons",
                        "Build portfolio projects"
                    ],
                    "long_term": [
                        "Pursue graduate studies in AI",
                        "Gain industry experience",
                        "Contribute to UAE AI initiatives"
                    ]
                },
                "resources": [
                    "UAE AI Strategy 2031",
                    "Industry mentorship programs",
                    "Professional development workshops"
                ]
            }
            
            response = self.session.post(f"{self.base_url}/api/educator/career-guidance", json=guidance_data)
            
            if response.status_code in [200, 201]:
                guidance_id = response.json().get("guidance_id")
                self.log_test("Career Guidance Creation", "PASS", f"Career guidance created with ID: {guidance_id}", 15)
                
                # Test guidance retrieval
                response = self.session.get(f"{self.base_url}/api/educator/career-guidance/STU001")
                if response.status_code == 200:
                    guidance = response.json()
                    self.log_test("Career Guidance Retrieval", "PASS", f"Retrieved guidance for student", 10)
                    return True
                else:
                    self.log_test("Career Guidance Retrieval", "FAIL", "Could not retrieve career guidance", 0)
                    return False
            else:
                self.log_test("Career Guidance Creation", "FAIL", f"Career guidance failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Career Guidance Tools", "FAIL", f"Career guidance error: {str(e)}", 0)
            return False
            
    def test_performance_analytics(self):
        """Test performance analytics and reporting"""
        try:
            # Test class performance analytics
            response = self.session.get(f"{self.base_url}/api/educator/analytics/class-performance")
            
            if response.status_code == 200:
                analytics = response.json()
                self.log_test("Class Performance Analytics", "PASS", "Class analytics retrieved", 10)
                
                # Test student progress analytics
                response = self.session.get(f"{self.base_url}/api/educator/analytics/student-progress")
                if response.status_code == 200:
                    progress = response.json()
                    self.log_test("Student Progress Analytics", "PASS", "Student progress data available", 10)
                    
                    # Test curriculum effectiveness
                    response = self.session.get(f"{self.base_url}/api/educator/analytics/curriculum-effectiveness")
                    if response.status_code == 200:
                        effectiveness = response.json()
                        self.log_test("Curriculum Effectiveness", "PASS", "Curriculum analytics available", 10)
                        return True
                    else:
                        self.log_test("Curriculum Effectiveness", "FAIL", "Curriculum analytics failed", 0)
                        return False
                else:
                    self.log_test("Student Progress Analytics", "FAIL", "Student progress analytics failed", 0)
                    return False
            else:
                self.log_test("Class Performance Analytics", "FAIL", f"Analytics failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Performance Analytics", "FAIL", f"Analytics error: {str(e)}", 0)
            return False
            
    def test_educational_resource_management(self):
        """Test educational resource management"""
        try:
            resource_data = {
                "resource_info": {
                    "title": "Introduction to Machine Learning",
                    "type": "Video Lecture",
                    "subject": "Computer Science",
                    "level": "Undergraduate",
                    "duration": "45 minutes",
                    "language": "English"
                },
                "content": {
                    "description": "Comprehensive introduction to machine learning concepts",
                    "learning_objectives": [
                        "Understand ML fundamentals",
                        "Learn about supervised learning",
                        "Explore unsupervised learning"
                    ],
                    "prerequisites": ["Basic Statistics", "Programming Knowledge"],
                    "tags": ["machine-learning", "ai", "data-science"]
                },
                "access_control": {
                    "visibility": "course_students",
                    "course_id": "CS401",
                    "download_allowed": True,
                    "sharing_allowed": False
                },
                "metadata": {
                    "created_by": "Dr. Fatima Al Mansouri",
                    "institution": "UAE University",
                    "quality_rating": 4.8,
                    "usage_count": 0
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/educator/resources", json=resource_data)
            
            if response.status_code in [200, 201]:
                resource_id = response.json().get("resource_id")
                self.log_test("Resource Creation", "PASS", f"Resource created with ID: {resource_id}", 15)
                
                # Test resource listing
                response = self.session.get(f"{self.base_url}/api/educator/resources")
                if response.status_code == 200:
                    resources = response.json()
                    self.log_test("Resource Listing", "PASS", f"Retrieved {len(resources)} resources", 10)
                    return True
                else:
                    self.log_test("Resource Listing", "FAIL", "Could not retrieve resources", 0)
                    return False
            else:
                self.log_test("Resource Creation", "FAIL", f"Resource creation failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Educational Resource Management", "FAIL", f"Resource management error: {str(e)}", 0)
            return False
            
    def test_assessment_evaluation_tools(self):
        """Test assessment and evaluation tools"""
        try:
            assessment_data = {
                "assessment_info": {
                    "title": "Midterm Examination - AI Fundamentals",
                    "type": "Written Exam",
                    "course_id": "CS401",
                    "duration": 120,
                    "total_marks": 100,
                    "passing_grade": 60
                },
                "questions": [
                    {
                        "question_id": "Q1",
                        "type": "multiple_choice",
                        "question": "What is the primary goal of machine learning?",
                        "options": [
                            "To replace human intelligence",
                            "To learn patterns from data",
                            "To create robots",
                            "To process large datasets"
                        ],
                        "correct_answer": "To learn patterns from data",
                        "marks": 5
                    },
                    {
                        "question_id": "Q2",
                        "type": "essay",
                        "question": "Explain the difference between supervised and unsupervised learning with examples.",
                        "marking_criteria": [
                            "Clear definition of supervised learning",
                            "Clear definition of unsupervised learning",
                            "Appropriate examples provided",
                            "Comparison and contrast"
                        ],
                        "marks": 20
                    }
                ],
                "grading_rubric": {
                    "A": {"min": 90, "max": 100, "description": "Excellent understanding"},
                    "B": {"min": 80, "max": 89, "description": "Good understanding"},
                    "C": {"min": 70, "max": 79, "description": "Satisfactory understanding"},
                    "D": {"min": 60, "max": 69, "description": "Minimal understanding"},
                    "F": {"min": 0, "max": 59, "description": "Insufficient understanding"}
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/educator/assessments", json=assessment_data)
            
            if response.status_code in [200, 201]:
                assessment_id = response.json().get("assessment_id")
                self.log_test("Assessment Creation", "PASS", f"Assessment created with ID: {assessment_id}", 15)
                
                # Test assessment listing
                response = self.session.get(f"{self.base_url}/api/educator/assessments")
                if response.status_code == 200:
                    assessments = response.json()
                    self.log_test("Assessment Listing", "PASS", f"Retrieved {len(assessments)} assessments", 10)
                    return True
                else:
                    self.log_test("Assessment Listing", "FAIL", "Could not retrieve assessments", 0)
                    return False
            else:
                self.log_test("Assessment Creation", "FAIL", f"Assessment creation failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Assessment Evaluation Tools", "FAIL", f"Assessment error: {str(e)}", 0)
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
                "Implement missing backend endpoints for educator functionality",
                "Add comprehensive student tracking and management system",
                "Develop curriculum planning and development tools"
            ])
            
        if self.test_results["overall_score"] < 80:
            self.test_results["recommendations"].extend([
                "Focus on core educational functionality implementation",
                "Integrate with UAE educational standards and frameworks",
                "Implement Arabic language support for educational content",
                "Add UAE-specific career pathway mapping"
            ])
            
    def run_all_tests(self):
        """Run comprehensive Educator persona testing"""
        print("🧪 Starting Educator Persona Comprehensive Testing")
        print("=" * 60)
        
        # Core connectivity and authentication tests
        if not self.test_server_connectivity():
            print("❌ Cannot proceed - server not accessible")
            return False
            
        if not self.test_educator_registration():
            print("⚠️ Registration failed, trying login...")
            if not self.test_educator_login():
                print("❌ Cannot proceed - authentication failed")
                return False
                
        # Core Educator functionality tests
        self.test_educator_profile_management()
        self.test_institution_profile_setup()
        self.test_student_tracking_management()
        self.test_curriculum_planning()
        self.test_career_guidance_tools()
        self.test_performance_analytics()
        self.test_educational_resource_management()
        self.test_assessment_evaluation_tools()
        
        # Calculate results
        self.calculate_overall_score()
        self.generate_recommendations()
        
        # Display results
        print("\n" + "=" * 60)
        print("🏆 EDUCATOR PERSONA TESTING RESULTS")
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
    tester = EducatorPersonaTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save results to file
        with open("/home/ubuntu/emirati-platform/educator_test_results.json", "w") as f:
            json.dump(tester.test_results, f, indent=2)
            
        print(f"\n📄 Test results saved to: educator_test_results.json")
        
        if success:
            print("✅ Educator persona testing completed successfully")
            return 0
        else:
            print("❌ Educator persona testing failed")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Testing failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
