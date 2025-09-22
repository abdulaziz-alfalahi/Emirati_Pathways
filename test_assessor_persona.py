#!/usr/bin/env python3
"""
Comprehensive Assessor Persona Testing Script
Emirati Journey Platform - Assessor Functionality Testing

This script tests all Assessor persona features including:
- Assessor Profile Management
- Assessment Planning and Design
- Competency Validation Framework
- Certification Tracking
- UAE National Qualification Framework Integration
- Performance Analytics
- Quality Assurance Tools
- Emiratization Progress Tracking
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

class AssessorPersonaTester:
    def __init__(self, base_url="http://localhost:5003"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "persona": "Assessor",
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
            
    def test_assessor_registration(self):
        """Test Assessor registration process"""
        try:
            registration_data = {
                "email": "dr.mariam@assessment.ae",
                "password": "SecurePass123!",
                "first_name": "Dr. Mariam",
                "last_name": "Al Zahra",
                "user_type": "admin",  # Using admin as closest available role
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
                self.log_test("Assessor Registration", "PASS", "Assessor account created successfully", 15)
                return True
            else:
                self.log_test("Assessor Registration", "FAIL", f"Registration failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Assessor Registration", "FAIL", f"Registration error: {str(e)}", 0)
            return False
            
    def test_assessor_login(self):
        """Test Assessor login process"""
        try:
            login_data = {
                "email": "dr.mariam@assessment.ae",
                "password": "SecurePass123!"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                if self.auth_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("Assessor Login", "PASS", "Login successful", 10)
                return True
            else:
                self.log_test("Assessor Login", "FAIL", f"Login failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Assessor Login", "FAIL", f"Login error: {str(e)}", 0)
            return False
            
    def test_assessor_profile_management(self):
        """Test Assessor profile creation and management"""
        try:
            profile_data = {
                "personal_info": {
                    "first_name": "Dr. Mariam",
                    "last_name": "Al Zahra",
                    "email": "dr.mariam@assessment.ae",
                    "phone": "+971501234567",
                    "location": "Abu Dhabi, UAE",
                    "nationality": "UAE"
                },
                "professional_info": {
                    "title": "Senior Assessment Specialist",
                    "organization": "UAE National Qualifications Authority",
                    "department": "Competency Assessment Division",
                    "years_experience": 12,
                    "specializations": [
                        "Competency-Based Assessment",
                        "UAE National Qualification Framework",
                        "Professional Certification",
                        "Quality Assurance"
                    ],
                    "certifications": [
                        "Certified Assessment Professional (CAP)",
                        "UAE NQF Assessor Certification",
                        "ISO 9001 Quality Management"
                    ]
                },
                "assessment_expertise": {
                    "assessment_types": [
                        "Skills Assessment",
                        "Competency Validation",
                        "Professional Certification",
                        "Recognition of Prior Learning (RPL)"
                    ],
                    "industry_sectors": [
                        "Information Technology",
                        "Engineering",
                        "Healthcare",
                        "Business Administration"
                    ],
                    "qualification_levels": ["Level 4", "Level 5", "Level 6", "Level 7", "Level 8"],
                    "languages": ["Arabic", "English"]
                },
                "accreditation": {
                    "accrediting_body": "UAE National Qualifications Authority",
                    "assessor_id": "ASS-UAE-2024-001",
                    "valid_until": "2025-12-31",
                    "scope": "Technology and Engineering Assessments"
                }
            }
            
            # Test profile creation
            response = self.session.post(f"{self.base_url}/api/assessor/profile", json=profile_data)
            
            if response.status_code in [200, 201]:
                self.log_test("Assessor Profile Creation", "PASS", "Profile created successfully", 15)
                
                # Test profile retrieval
                response = self.session.get(f"{self.base_url}/api/assessor/profile")
                if response.status_code == 200:
                    profile = response.json()
                    self.log_test("Assessor Profile Retrieval", "PASS", f"Profile retrieved: {profile.get('personal_info', {}).get('first_name', 'Unknown')}", 10)
                    return True
                else:
                    self.log_test("Assessor Profile Retrieval", "FAIL", "Could not retrieve profile", 0)
                    return False
            else:
                self.log_test("Assessor Profile Creation", "FAIL", f"Profile creation failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Assessor Profile Management", "FAIL", f"Profile error: {str(e)}", 0)
            return False
            
    def test_assessment_planning_design(self):
        """Test assessment planning and design features"""
        try:
            assessment_plan = {
                "assessment_info": {
                    "title": "Software Developer Competency Assessment",
                    "type": "Professional Competency Validation",
                    "nqf_level": "Level 6",
                    "industry_sector": "Information Technology",
                    "target_qualification": "Certified Software Developer",
                    "duration": 240,  # minutes
                    "assessment_mode": "Hybrid (Theory + Practical)"
                },
                "competency_framework": {
                    "core_competencies": [
                        {
                            "competency_id": "SD-001",
                            "title": "Programming Fundamentals",
                            "description": "Demonstrate proficiency in programming concepts and languages",
                            "assessment_criteria": [
                                "Write clean, efficient code",
                                "Apply programming best practices",
                                "Debug and troubleshoot code",
                                "Use version control systems"
                            ],
                            "evidence_requirements": [
                                "Code portfolio",
                                "Practical coding test",
                                "Technical interview"
                            ],
                            "weight": 30
                        },
                        {
                            "competency_id": "SD-002",
                            "title": "System Design and Architecture",
                            "description": "Design scalable and maintainable software systems",
                            "assessment_criteria": [
                                "Create system architecture diagrams",
                                "Apply design patterns appropriately",
                                "Consider scalability and performance",
                                "Document design decisions"
                            ],
                            "evidence_requirements": [
                                "System design project",
                                "Architecture presentation",
                                "Design documentation"
                            ],
                            "weight": 25
                        },
                        {
                            "competency_id": "SD-003",
                            "title": "UAE Technology Landscape",
                            "description": "Understanding of UAE's digital transformation initiatives",
                            "assessment_criteria": [
                                "Knowledge of UAE AI Strategy 2031",
                                "Understanding of smart city initiatives",
                                "Awareness of local compliance requirements",
                                "Cultural sensitivity in technology solutions"
                            ],
                            "evidence_requirements": [
                                "Case study analysis",
                                "Presentation on UAE tech trends",
                                "Compliance checklist completion"
                            ],
                            "weight": 20
                        }
                    ]
                },
                "assessment_methods": [
                    {
                        "method": "Practical Assessment",
                        "description": "Hands-on coding and system design tasks",
                        "duration": 180,
                        "weight": 60
                    },
                    {
                        "method": "Oral Assessment",
                        "description": "Technical interview and presentation",
                        "duration": 60,
                        "weight": 40
                    }
                ],
                "quality_assurance": {
                    "moderation_required": True,
                    "external_verification": True,
                    "standardization_meeting": True,
                    "appeals_process": True
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/assessor/assessment-plans", json=assessment_plan)
            
            if response.status_code in [200, 201]:
                plan_id = response.json().get("plan_id")
                self.log_test("Assessment Planning", "PASS", f"Assessment plan created with ID: {plan_id}", 15)
                
                # Test plan retrieval
                response = self.session.get(f"{self.base_url}/api/assessor/assessment-plans/{plan_id or 'PLAN001'}")
                if response.status_code == 200:
                    plan = response.json()
                    self.log_test("Assessment Plan Retrieval", "PASS", f"Plan retrieved: {plan.get('assessment_info', {}).get('title', 'Unknown')}", 10)
                    return True
                else:
                    self.log_test("Assessment Plan Retrieval", "FAIL", "Could not retrieve assessment plan", 0)
                    return False
            else:
                self.log_test("Assessment Planning", "FAIL", f"Assessment planning failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Assessment Planning Design", "FAIL", f"Assessment planning error: {str(e)}", 0)
            return False
            
    def test_competency_validation_framework(self):
        """Test competency validation framework"""
        try:
            validation_data = {
                "candidate_info": {
                    "candidate_id": "CAND001",
                    "name": "Ahmed Al Emirati",
                    "qualification_sought": "Certified Software Developer",
                    "nqf_level": "Level 6",
                    "assessment_date": datetime.now().isoformat()
                },
                "competency_assessments": [
                    {
                        "competency_id": "SD-001",
                        "assessment_results": {
                            "practical_score": 85,
                            "theory_score": 78,
                            "overall_score": 82,
                            "competency_achieved": True,
                            "assessor_comments": "Demonstrates strong programming fundamentals with good coding practices"
                        },
                        "evidence_submitted": [
                            "Portfolio of 5 projects",
                            "Coding test completed (85%)",
                            "Technical interview passed"
                        ]
                    },
                    {
                        "competency_id": "SD-002",
                        "assessment_results": {
                            "practical_score": 90,
                            "theory_score": 88,
                            "overall_score": 89,
                            "competency_achieved": True,
                            "assessor_comments": "Excellent system design skills with clear documentation"
                        },
                        "evidence_submitted": [
                            "System design project completed",
                            "Architecture presentation delivered",
                            "Comprehensive design documentation"
                        ]
                    },
                    {
                        "competency_id": "SD-003",
                        "assessment_results": {
                            "practical_score": 75,
                            "theory_score": 80,
                            "overall_score": 77,
                            "competency_achieved": True,
                            "assessor_comments": "Good understanding of UAE technology landscape and compliance requirements"
                        },
                        "evidence_submitted": [
                            "UAE smart city case study analysis",
                            "AI Strategy 2031 presentation",
                            "Compliance checklist completed"
                        ]
                    }
                ],
                "overall_assessment": {
                    "total_score": 83,
                    "competency_level": "Competent",
                    "certification_recommended": True,
                    "areas_for_improvement": [
                        "Enhance knowledge of emerging UAE tech initiatives",
                        "Develop stronger presentation skills"
                    ],
                    "next_steps": [
                        "Issue certification",
                        "Recommend for professional registration",
                        "Suggest continuous professional development"
                    ]
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/assessor/competency-validation", json=validation_data)
            
            if response.status_code in [200, 201]:
                validation_id = response.json().get("validation_id")
                self.log_test("Competency Validation", "PASS", f"Validation completed with ID: {validation_id}", 15)
                
                # Test validation retrieval
                response = self.session.get(f"{self.base_url}/api/assessor/competency-validation/CAND001")
                if response.status_code == 200:
                    validation = response.json()
                    self.log_test("Validation Retrieval", "PASS", f"Validation retrieved for candidate", 10)
                    return True
                else:
                    self.log_test("Validation Retrieval", "FAIL", "Could not retrieve validation", 0)
                    return False
            else:
                self.log_test("Competency Validation", "FAIL", f"Validation failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Competency Validation Framework", "FAIL", f"Validation error: {str(e)}", 0)
            return False
            
    def test_certification_tracking(self):
        """Test certification tracking and management"""
        try:
            certification_data = {
                "certification_info": {
                    "certificate_id": "CERT-SD-2024-001",
                    "candidate_id": "CAND001",
                    "qualification_title": "Certified Software Developer",
                    "nqf_level": "Level 6",
                    "issue_date": datetime.now().isoformat(),
                    "expiry_date": (datetime.now() + timedelta(days=1095)).isoformat(),  # 3 years
                    "issuing_authority": "UAE National Qualifications Authority"
                },
                "competencies_certified": [
                    "Programming Fundamentals",
                    "System Design and Architecture",
                    "UAE Technology Landscape"
                ],
                "certification_status": {
                    "status": "Active",
                    "verification_code": "UAE-NQF-SD-2024-001",
                    "digital_badge_issued": True,
                    "blockchain_verified": True
                },
                "maintenance_requirements": {
                    "cpd_hours_required": 40,
                    "cpd_hours_completed": 0,
                    "renewal_due_date": (datetime.now() + timedelta(days=1095)).isoformat(),
                    "renewal_fee": 500  # AED
                },
                "recognition": {
                    "government_recognition": True,
                    "industry_recognition": True,
                    "international_equivalence": "Mapped to international standards",
                    "emirates_id_integration": True
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/assessor/certifications", json=certification_data)
            
            if response.status_code in [200, 201]:
                cert_id = response.json().get("certificate_id")
                self.log_test("Certification Tracking", "PASS", f"Certification tracked with ID: {cert_id}", 15)
                
                # Test certification listing
                response = self.session.get(f"{self.base_url}/api/assessor/certifications")
                if response.status_code == 200:
                    certifications = response.json()
                    self.log_test("Certification Listing", "PASS", f"Retrieved {len(certifications)} certifications", 10)
                    
                    # Test certification verification
                    response = self.session.get(f"{self.base_url}/api/assessor/certifications/verify/UAE-NQF-SD-2024-001")
                    if response.status_code == 200:
                        verification = response.json()
                        self.log_test("Certification Verification", "PASS", "Certification verified successfully", 10)
                        return True
                    else:
                        self.log_test("Certification Verification", "FAIL", "Could not verify certification", 0)
                        return False
                else:
                    self.log_test("Certification Listing", "FAIL", "Could not retrieve certifications", 0)
                    return False
            else:
                self.log_test("Certification Tracking", "FAIL", f"Certification tracking failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Certification Tracking", "FAIL", f"Certification error: {str(e)}", 0)
            return False
            
    def test_uae_nqf_integration(self):
        """Test UAE National Qualification Framework integration"""
        try:
            nqf_data = {
                "qualification_mapping": {
                    "qualification_title": "Certified Software Developer",
                    "nqf_level": "Level 6",
                    "credit_value": 120,
                    "guided_learning_hours": 1200,
                    "total_qualification_time": 1800
                },
                "learning_outcomes": [
                    {
                        "outcome_id": "LO-001",
                        "description": "Design and implement software solutions using appropriate programming languages",
                        "knowledge_requirements": [
                            "Programming concepts and paradigms",
                            "Software development methodologies",
                            "Data structures and algorithms"
                        ],
                        "skills_requirements": [
                            "Code development and testing",
                            "Problem-solving and debugging",
                            "Version control and collaboration"
                        ],
                        "competence_requirements": [
                            "Work independently on complex projects",
                            "Lead small development teams",
                            "Communicate technical concepts effectively"
                        ]
                    }
                ],
                "progression_pathways": {
                    "horizontal_progression": [
                        "Specialized certifications (AI, Cybersecurity, etc.)",
                        "Industry-specific qualifications"
                    ],
                    "vertical_progression": [
                        "Level 7: Senior Software Architect",
                        "Level 8: Technology Leadership"
                    ]
                },
                "recognition_arrangements": {
                    "government_sector": "Recognized for government IT positions",
                    "private_sector": "Accepted by major UAE technology companies",
                    "international": "Mapped to international frameworks",
                    "professional_bodies": "Recognized by UAE Computer Society"
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/assessor/nqf-integration", json=nqf_data)
            
            if response.status_code in [200, 201]:
                integration_id = response.json().get("integration_id")
                self.log_test("UAE NQF Integration", "PASS", f"NQF integration completed with ID: {integration_id}", 15)
                
                # Test NQF compliance check
                response = self.session.get(f"{self.base_url}/api/assessor/nqf-compliance/Level-6")
                if response.status_code == 200:
                    compliance = response.json()
                    self.log_test("NQF Compliance Check", "PASS", "NQF compliance verified", 10)
                    return True
                else:
                    self.log_test("NQF Compliance Check", "FAIL", "Could not verify NQF compliance", 0)
                    return False
            else:
                self.log_test("UAE NQF Integration", "FAIL", f"NQF integration failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("UAE NQF Integration", "FAIL", f"NQF integration error: {str(e)}", 0)
            return False
            
    def test_performance_analytics(self):
        """Test performance analytics and reporting"""
        try:
            # Test assessment analytics
            response = self.session.get(f"{self.base_url}/api/assessor/analytics/assessment-performance")
            
            if response.status_code == 200:
                analytics = response.json()
                self.log_test("Assessment Analytics", "PASS", "Assessment performance data retrieved", 10)
                
                # Test candidate success rates
                response = self.session.get(f"{self.base_url}/api/assessor/analytics/candidate-success-rates")
                if response.status_code == 200:
                    success_rates = response.json()
                    self.log_test("Candidate Success Rates", "PASS", "Success rate analytics available", 10)
                    
                    # Test quality metrics
                    response = self.session.get(f"{self.base_url}/api/assessor/analytics/quality-metrics")
                    if response.status_code == 200:
                        quality_metrics = response.json()
                        self.log_test("Quality Metrics", "PASS", "Quality metrics available", 10)
                        return True
                    else:
                        self.log_test("Quality Metrics", "FAIL", "Quality metrics failed", 0)
                        return False
                else:
                    self.log_test("Candidate Success Rates", "FAIL", "Success rate analytics failed", 0)
                    return False
            else:
                self.log_test("Assessment Analytics", "FAIL", f"Analytics failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Performance Analytics", "FAIL", f"Analytics error: {str(e)}", 0)
            return False
            
    def test_quality_assurance_tools(self):
        """Test quality assurance tools and processes"""
        try:
            qa_data = {
                "assessment_id": "ASS-001",
                "qa_checklist": {
                    "assessment_design": {
                        "learning_outcomes_aligned": True,
                        "assessment_criteria_clear": True,
                        "evidence_requirements_specified": True,
                        "marking_scheme_detailed": True
                    },
                    "assessment_delivery": {
                        "standardized_conditions": True,
                        "reasonable_adjustments_considered": True,
                        "assessment_security_maintained": True,
                        "candidate_briefing_conducted": True
                    },
                    "assessment_marking": {
                        "marking_scheme_followed": True,
                        "internal_verification_completed": True,
                        "feedback_provided": True,
                        "appeals_process_available": True
                    }
                },
                "moderation_results": {
                    "moderator_id": "MOD-001",
                    "moderation_date": datetime.now().isoformat(),
                    "sample_size": 10,
                    "agreement_rate": 95,
                    "recommendations": [
                        "Maintain current assessment standards",
                        "Consider additional practical components"
                    ]
                },
                "external_verification": {
                    "verifier_id": "EV-001",
                    "verification_date": datetime.now().isoformat(),
                    "compliance_rating": "Fully Compliant",
                    "areas_of_strength": [
                        "Clear assessment criteria",
                        "Comprehensive evidence collection",
                        "Effective candidate support"
                    ],
                    "areas_for_improvement": [
                        "Enhance digital assessment tools",
                        "Increase industry engagement"
                    ]
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/assessor/quality-assurance", json=qa_data)
            
            if response.status_code in [200, 201]:
                qa_id = response.json().get("qa_id")
                self.log_test("Quality Assurance", "PASS", f"QA process completed with ID: {qa_id}", 15)
                
                # Test QA report generation
                response = self.session.get(f"{self.base_url}/api/assessor/quality-assurance/reports/ASS-001")
                if response.status_code == 200:
                    qa_report = response.json()
                    self.log_test("QA Report Generation", "PASS", "QA report generated successfully", 10)
                    return True
                else:
                    self.log_test("QA Report Generation", "FAIL", "Could not generate QA report", 0)
                    return False
            else:
                self.log_test("Quality Assurance", "FAIL", f"QA process failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Quality Assurance Tools", "FAIL", f"QA error: {str(e)}", 0)
            return False
            
    def test_emiratization_progress_tracking(self):
        """Test Emiratization progress tracking features"""
        try:
            emiratization_data = {
                "tracking_period": {
                    "start_date": "2024-01-01",
                    "end_date": "2024-12-31",
                    "reporting_frequency": "quarterly"
                },
                "assessment_statistics": {
                    "total_assessments": 150,
                    "uae_national_assessments": 95,
                    "emiratization_rate": 63.3,
                    "certification_success_rate": 78.9
                },
                "sector_breakdown": [
                    {
                        "sector": "Information Technology",
                        "total_assessments": 60,
                        "uae_nationals": 42,
                        "success_rate": 85.7
                    },
                    {
                        "sector": "Engineering",
                        "total_assessments": 45,
                        "uae_nationals": 28,
                        "success_rate": 75.0
                    },
                    {
                        "sector": "Healthcare",
                        "total_assessments": 25,
                        "uae_nationals": 15,
                        "success_rate": 80.0
                    }
                ],
                "qualification_levels": [
                    {"level": "Level 4", "uae_nationals": 15, "total": 20},
                    {"level": "Level 5", "uae_nationals": 25, "total": 35},
                    {"level": "Level 6", "uae_nationals": 35, "total": 50},
                    {"level": "Level 7", "uae_nationals": 15, "total": 30},
                    {"level": "Level 8", "uae_nationals": 5, "total": 15}
                ],
                "government_targets": {
                    "target_emiratization_rate": 75,
                    "current_achievement": 63.3,
                    "gap_analysis": "Need to increase UAE national participation by 11.7%",
                    "recommended_actions": [
                        "Enhance outreach to UAE nationals",
                        "Provide additional support and preparation",
                        "Develop targeted training programs"
                    ]
                }
            }
            
            response = self.session.post(f"{self.base_url}/api/assessor/emiratization-tracking", json=emiratization_data)
            
            if response.status_code in [200, 201]:
                tracking_id = response.json().get("tracking_id")
                self.log_test("Emiratization Tracking", "PASS", f"Emiratization tracking completed with ID: {tracking_id}", 15)
                
                # Test Emiratization report generation
                response = self.session.get(f"{self.base_url}/api/assessor/emiratization-tracking/reports/2024")
                if response.status_code == 200:
                    report = response.json()
                    self.log_test("Emiratization Report", "PASS", "Emiratization report generated", 10)
                    return True
                else:
                    self.log_test("Emiratization Report", "FAIL", "Could not generate Emiratization report", 0)
                    return False
            else:
                self.log_test("Emiratization Tracking", "FAIL", f"Emiratization tracking failed: {response.text}", 0)
                return False
                
        except Exception as e:
            self.log_test("Emiratization Progress Tracking", "FAIL", f"Emiratization tracking error: {str(e)}", 0)
            return False
            
    def calculate_overall_score(self):
        """Calculate overall functionality score"""
        total_score = sum(test["score"] for test in self.test_results["tests"].values())
        max_possible_score = 185  # Maximum possible score based on all tests
        self.test_results["overall_score"] = round((total_score / max_possible_score) * 100, 1)
        
    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        failed_tests = [name for name, result in self.test_results["tests"].items() if result["status"] == "FAIL"]
        
        if failed_tests:
            self.test_results["recommendations"].extend([
                "Implement missing backend endpoints for assessor functionality",
                "Add comprehensive assessment planning and design tools",
                "Develop competency validation framework",
                "Implement certification tracking system"
            ])
            
        if self.test_results["overall_score"] < 80:
            self.test_results["recommendations"].extend([
                "Focus on core assessment functionality implementation",
                "Integrate with UAE National Qualification Framework",
                "Implement quality assurance and moderation tools",
                "Add Emiratization progress tracking capabilities",
                "Develop comprehensive analytics and reporting"
            ])
            
    def run_all_tests(self):
        """Run comprehensive Assessor persona testing"""
        print("🧪 Starting Assessor Persona Comprehensive Testing")
        print("=" * 60)
        
        # Core connectivity and authentication tests
        if not self.test_server_connectivity():
            print("❌ Cannot proceed - server not accessible")
            return False
            
        if not self.test_assessor_registration():
            print("⚠️ Registration failed, trying login...")
            if not self.test_assessor_login():
                print("❌ Cannot proceed - authentication failed")
                return False
                
        # Core Assessor functionality tests
        self.test_assessor_profile_management()
        self.test_assessment_planning_design()
        self.test_competency_validation_framework()
        self.test_certification_tracking()
        self.test_uae_nqf_integration()
        self.test_performance_analytics()
        self.test_quality_assurance_tools()
        self.test_emiratization_progress_tracking()
        
        # Calculate results
        self.calculate_overall_score()
        self.generate_recommendations()
        
        # Display results
        print("\n" + "=" * 60)
        print("🏆 ASSESSOR PERSONA TESTING RESULTS")
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
    tester = AssessorPersonaTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save results to file
        with open("/home/ubuntu/emirati-platform/assessor_test_results.json", "w") as f:
            json.dump(tester.test_results, f, indent=2)
            
        print(f"\n📄 Test results saved to: assessor_test_results.json")
        
        if success:
            print("✅ Assessor persona testing completed successfully")
            return 0
        else:
            print("❌ Assessor persona testing failed")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Testing failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
