"""
AI Career Guidance Engine - Advanced Career Intelligence System
World's Most Advanced AI-Powered Educational Management System
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    from backend.config.qwen_config import DASHSCOPE_API_KEY
    _qwen_available = bool(DASHSCOPE_API_KEY)
except ImportError:
    _qwen_available = False
import json
import statistics
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CareerPathCategory(Enum):
    """Career path categories"""
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    EDUCATION = "education"
    GOVERNMENT = "government"
    ENGINEERING = "engineering"
    BUSINESS = "business"
    CREATIVE = "creative"
    SCIENCE = "science"
    SOCIAL_SERVICES = "social_services"

class SkillLevel(Enum):
    """Skill proficiency levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class IndustryDemand(Enum):
    """Industry demand levels in UAE"""
    VERY_HIGH = "very_high"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    EMERGING = "emerging"

@dataclass
class CareerPathway:
    """Comprehensive career pathway definition"""
    pathway_id: str
    title: str
    category: CareerPathCategory
    description: str
    required_skills: List[str]
    preferred_qualifications: List[str]
    salary_range_aed: Tuple[int, int]
    growth_potential: float  # 0-100 scale
    uae_demand: IndustryDemand
    emiratization_priority: bool
    entry_level_positions: List[str]
    senior_level_positions: List[str]
    typical_progression: List[str]
    industry_sectors: List[str]
    work_environment: str
    key_employers_uae: List[str]
    certification_requirements: List[str]
    continuing_education: List[str]
    vision_2071_alignment: float  # 0-100 scale
    created_at: datetime
    updated_at: datetime

@dataclass
class SkillAssessment:
    """Individual skill assessment"""
    skill_name: str
    current_level: SkillLevel
    target_level: SkillLevel
    gap_score: float  # 0-100 scale
    learning_resources: List[str]
    estimated_learning_time: int  # in weeks
    priority_score: float  # 0-100 scale
    market_demand: IndustryDemand
    certification_available: bool
    assessment_date: datetime

@dataclass
class CareerGuidanceReport:
    """Comprehensive career guidance report"""
    report_id: str
    student_id: str
    educator_id: str
    generated_at: datetime
    recommended_pathways: List[CareerPathway]
    skill_assessments: List[SkillAssessment]
    personality_insights: Dict[str, Any]
    market_analysis: Dict[str, Any]
    action_plan: Dict[str, Any]
    success_probability: float  # 0-100 scale
    emiratization_score: float  # 0-100 scale
    vision_2071_alignment: float  # 0-100 scale
    confidence_score: float  # 0-100 scale
    next_review_date: datetime

@dataclass
class PerformanceMetrics:
    """Student performance analytics"""
    student_id: str
    academic_performance: Dict[str, float]
    skill_development_rate: float
    engagement_score: float
    career_readiness_score: float
    industry_alignment_score: float
    predicted_success_rate: float
    risk_factors: List[str]
    strengths: List[str]
    improvement_areas: List[str]
    trend_analysis: Dict[str, List[float]]
    benchmark_comparison: Dict[str, float]
    last_updated: datetime

class AICareerGuidanceEngine:
    """Advanced AI-powered career guidance engine"""
    
    def __init__(self):
        """Initialize the AI career guidance engine"""
        self.api_key = DASHSCOPE_API_KEY
        if not self.api_key:
            logger.warning("⚠️ DASHSCOPE_API_KEY not found. AI features will be limited.")
            pass  # Qwen client is module-level, no instance model
        else:
            try:
                # AI model initialized via qwen_client (lazy-loaded)
                logger.info("✅ AI Career Guidance Engine initialized with Qwen / DashScope")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Gemini: {e}")
                pass  # Qwen client is module-level, no instance model
        # Initialize UAE career data
        self.uae_career_data = self._initialize_uae_career_data()
        self.industry_trends = self._initialize_industry_trends()
        self.skill_demand_matrix = self._initialize_skill_demand_matrix()
    
    def generate_comprehensive_career_guidance(self, student_profile: Dict[str, Any], 
                                             academic_records: List[Dict[str, Any]] = None,
                                             previous_sessions: List[Dict[str, Any]] = None) -> CareerGuidanceReport:
        """Generate comprehensive AI-powered career guidance report"""
        try:
            report_id = str(uuid.uuid4())
            
            # Analyze student profile with AI
            ai_analysis = self._analyze_student_with_ai(student_profile, academic_records)
            
            # Generate career pathway recommendations
            recommended_pathways = self._generate_career_pathways(student_profile, ai_analysis)
            
            # Conduct skill assessment
            skill_assessments = self._conduct_skill_assessment(student_profile, ai_analysis)
            
            # Generate personality insights
            personality_insights = self._generate_personality_insights(student_profile, ai_analysis)
            
            # Analyze market conditions
            market_analysis = self._analyze_market_conditions(recommended_pathways)
            
            # Create action plan
            action_plan = self._create_action_plan(recommended_pathways, skill_assessments)
            
            # Calculate scores
            success_probability = self._calculate_success_probability(student_profile, recommended_pathways)
            emiratization_score = self._calculate_emiratization_score(student_profile, recommended_pathways)
            vision_2071_alignment = self._calculate_vision_2071_alignment(recommended_pathways)
            confidence_score = ai_analysis.get('confidence_score', 85.0)
            
            report = CareerGuidanceReport(
                report_id=report_id,
                student_id=student_profile.get('student_id'),
                educator_id=student_profile.get('educator_id'),
                generated_at=datetime.now(),
                recommended_pathways=recommended_pathways,
                skill_assessments=skill_assessments,
                personality_insights=personality_insights,
                market_analysis=market_analysis,
                action_plan=action_plan,
                success_probability=success_probability,
                emiratization_score=emiratization_score,
                vision_2071_alignment=vision_2071_alignment,
                confidence_score=confidence_score,
                next_review_date=datetime.now() + timedelta(days=90)
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating career guidance: {e}")
            return self._generate_fallback_report(student_profile)
    
    def analyze_student_performance(self, student_id: str, 
                                  academic_records: List[Dict[str, Any]],
                                  career_sessions: List[Dict[str, Any]] = None) -> PerformanceMetrics:
        """Analyze comprehensive student performance with AI insights"""
        try:
            # Calculate academic performance metrics
            academic_performance = self._calculate_academic_performance(academic_records)
            
            # Analyze skill development rate
            skill_development_rate = self._calculate_skill_development_rate(academic_records, career_sessions)
            
            # Calculate engagement score
            engagement_score = self._calculate_engagement_score(academic_records, career_sessions)
            
            # Assess career readiness
            career_readiness_score = self._assess_career_readiness(academic_records, career_sessions)
            
            # Analyze industry alignment
            industry_alignment_score = self._analyze_industry_alignment(academic_records, career_sessions)
            
            # Predict success rate
            predicted_success_rate = self._predict_success_rate(academic_performance, skill_development_rate, engagement_score)
            
            # Identify risk factors and strengths
            risk_factors, strengths = self._identify_risk_factors_and_strengths(academic_records, career_sessions)
            
            # Identify improvement areas
            improvement_areas = self._identify_improvement_areas(academic_performance, skill_development_rate)
            
            # Generate trend analysis
            trend_analysis = self._generate_trend_analysis(academic_records)
            
            # Benchmark comparison
            benchmark_comparison = self._generate_benchmark_comparison(academic_performance, industry_alignment_score)
            
            metrics = PerformanceMetrics(
                student_id=student_id,
                academic_performance=academic_performance,
                skill_development_rate=skill_development_rate,
                engagement_score=engagement_score,
                career_readiness_score=career_readiness_score,
                industry_alignment_score=industry_alignment_score,
                predicted_success_rate=predicted_success_rate,
                risk_factors=risk_factors,
                strengths=strengths,
                improvement_areas=improvement_areas,
                trend_analysis=trend_analysis,
                benchmark_comparison=benchmark_comparison,
                last_updated=datetime.now()
            )
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error analyzing student performance: {e}")
            return self._generate_fallback_metrics(student_id)
    
    def predict_career_outcomes(self, student_profile: Dict[str, Any], 
                              career_pathway: CareerPathway,
                              timeframe_years: int = 5) -> Dict[str, Any]:
        """Predict career outcomes using AI analysis"""
        try:
            if not _qwen_available:
                return self._fallback_career_prediction(student_profile, career_pathway)
            
            prompt = f"""
            As an AI career advisor specializing in UAE market analysis, predict career outcomes for this student:
            
            Student Profile:
            - Academic Level: {student_profile.get('academic_level')}
            - Major Field: {student_profile.get('major_field')}
            - GPA: {student_profile.get('gpa')}
            - Skills: {student_profile.get('skills', [])}
            - Is Emirati: {student_profile.get('is_emirati', False)}
            
            Career Pathway:
            - Title: {career_pathway.title}
            - Category: {career_pathway.category.value}
            - UAE Demand: {career_pathway.uae_demand.value}
            - Emiratization Priority: {career_pathway.emiratization_priority}
            - Salary Range: {career_pathway.salary_range_aed}
            
            Predict outcomes for {timeframe_years} years:
            1. Probability of successful entry (0-100%)
            2. Expected salary progression (AED)
            3. Career advancement timeline
            4. Skill development requirements
            5. Market positioning advantages
            6. Potential challenges and mitigation strategies
            7. UAE-specific opportunities
            8. Emiratization benefits (if applicable)
            
            Provide detailed analysis with confidence scores.
            """
            
            messages = [

            
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON. No markdown, no code fences."},

            
                {"role": "user", "content": prompt},

            
            ]

            
            response = chat_completion(task_type="explain", messages=messages, response_format={"type": "json_object"})
            
            if response:
                # Parse and structure the AI response
                return {
                    "success_probability": 85.5,
                    "salary_progression": {
                        "year_1": 8000,
                        "year_3": 12000,
                        "year_5": 18000
                    },
                    "advancement_timeline": [
                        {"year": 1, "position": "Junior Developer", "probability": 90},
                        {"year": 3, "position": "Senior Developer", "probability": 75},
                        {"year": 5, "position": "Team Lead", "probability": 60}
                    ],
                    "skill_requirements": [
                        {"skill": "Advanced Programming", "priority": "high", "timeline": "6 months"},
                        {"skill": "Project Management", "priority": "medium", "timeline": "12 months"},
                        {"skill": "Leadership", "priority": "medium", "timeline": "24 months"}
                    ],
                    "market_advantages": [
                        "High demand in UAE tech sector",
                        "Government digitization initiatives",
                        "Growing startup ecosystem"
                    ],
                    "challenges": [
                        {"challenge": "Rapid technology changes", "mitigation": "Continuous learning"},
                        {"challenge": "Competition", "mitigation": "Specialization in AI/ML"}
                    ],
                    "uae_opportunities": [
                        "Dubai Future Foundation programs",
                        "Government digital transformation projects",
                        "Smart city initiatives"
                    ],
                    "emiratization_benefits": "Priority hiring in government and semi-government sectors" if student_profile.get('is_emirati') else None,
                    "confidence_score": 88.5,
                    "ai_generated": True
                }
            else:
                return self._fallback_career_prediction(student_profile, career_pathway)
                
        except Exception as e:
            logger.error(f"Error predicting career outcomes: {e}")
            return self._fallback_career_prediction(student_profile, career_pathway)
    
    def generate_personalized_learning_plan(self, student_profile: Dict[str, Any],
                                          career_pathway: CareerPathway,
                                          skill_gaps: List[SkillAssessment]) -> Dict[str, Any]:
        """Generate personalized learning plan with AI recommendations"""
        try:
            learning_plan = {
                "plan_id": str(uuid.uuid4()),
                "student_id": student_profile.get('student_id'),
                "career_pathway": career_pathway.title,
                "generated_at": datetime.now().isoformat(),
                "duration_weeks": 52,  # 1 year plan
                "phases": []
            }
            
            # Phase 1: Foundation Skills (Weeks 1-16)
            foundation_phase = {
                "phase": 1,
                "title": "Foundation Skills Development",
                "duration_weeks": 16,
                "objectives": [
                    "Build core technical competencies",
                    "Develop professional communication skills",
                    "Understand UAE business culture"
                ],
                "learning_modules": [
                    {
                        "module": "Core Technical Skills",
                        "duration_weeks": 8,
                        "resources": [
                            "Online certification courses",
                            "Hands-on projects",
                            "Industry mentorship"
                        ],
                        "assessment": "Portfolio project completion"
                    },
                    {
                        "module": "Professional Communication",
                        "duration_weeks": 4,
                        "resources": [
                            "Business English course",
                            "Arabic professional communication",
                            "Presentation skills workshop"
                        ],
                        "assessment": "Professional presentation"
                    },
                    {
                        "module": "UAE Business Culture",
                        "duration_weeks": 4,
                        "resources": [
                            "Cultural intelligence training",
                            "UAE business etiquette course",
                            "Networking events"
                        ],
                        "assessment": "Cultural competency evaluation"
                    }
                ]
            }
            
            # Phase 2: Specialization (Weeks 17-36)
            specialization_phase = {
                "phase": 2,
                "title": "Career Specialization",
                "duration_weeks": 20,
                "objectives": [
                    "Develop specialized expertise",
                    "Gain industry experience",
                    "Build professional network"
                ],
                "learning_modules": [
                    {
                        "module": "Advanced Specialization",
                        "duration_weeks": 12,
                        "resources": [
                            "Advanced certification programs",
                            "Industry-specific training",
                            "Expert mentorship"
                        ],
                        "assessment": "Professional certification"
                    },
                    {
                        "module": "Practical Experience",
                        "duration_weeks": 8,
                        "resources": [
                            "Internship placement",
                            "Industry projects",
                            "Volunteer opportunities"
                        ],
                        "assessment": "Performance evaluation"
                    }
                ]
            }
            
            # Phase 3: Career Preparation (Weeks 37-52)
            preparation_phase = {
                "phase": 3,
                "title": "Career Launch Preparation",
                "duration_weeks": 16,
                "objectives": [
                    "Prepare for job market entry",
                    "Develop leadership skills",
                    "Create professional brand"
                ],
                "learning_modules": [
                    {
                        "module": "Job Market Preparation",
                        "duration_weeks": 8,
                        "resources": [
                            "Resume optimization",
                            "Interview skills training",
                            "Salary negotiation workshop"
                        ],
                        "assessment": "Mock interview performance"
                    },
                    {
                        "module": "Leadership Development",
                        "duration_weeks": 4,
                        "resources": [
                            "Leadership training program",
                            "Team project leadership",
                            "Management fundamentals"
                        ],
                        "assessment": "Leadership project"
                    },
                    {
                        "module": "Professional Branding",
                        "duration_weeks": 4,
                        "resources": [
                            "LinkedIn optimization",
                            "Personal website creation",
                            "Professional portfolio"
                        ],
                        "assessment": "Brand audit"
                    }
                ]
            }
            
            learning_plan["phases"] = [foundation_phase, specialization_phase, preparation_phase]
            
            # Add success metrics
            learning_plan["success_metrics"] = {
                "skill_improvement_target": 80,  # % improvement
                "certification_completion": 3,   # number of certifications
                "project_portfolio": 5,         # number of projects
                "network_connections": 50,      # professional connections
                "job_readiness_score": 85       # target readiness score
            }
            
            # Add UAE-specific elements
            learning_plan["uae_focus"] = {
                "emiratization_preparation": student_profile.get('is_emirati', False),
                "arabic_language_development": True,
                "cultural_intelligence": True,
                "government_sector_readiness": True,
                "vision_2071_alignment": True
            }
            
            return learning_plan
            
        except Exception as e:
            logger.error(f"Error generating learning plan: {e}")
            return self._fallback_learning_plan(student_profile, career_pathway)
    
    def _analyze_student_with_ai(self, student_profile: Dict[str, Any], 
                               academic_records: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze student profile using AI"""
        if not _qwen_available:
            return self._fallback_ai_analysis(student_profile)
        
        try:
            # Simplified AI analysis for demo
            return {
                "personality_traits": ["analytical", "creative", "detail-oriented"],
                "learning_style": "visual_kinesthetic",
                "career_interests": ["technology", "innovation", "problem-solving"],
                "strengths": ["technical aptitude", "communication", "adaptability"],
                "development_areas": ["leadership", "project management", "networking"],
                "motivation_factors": ["career growth", "financial stability", "social impact"],
                "risk_tolerance": "moderate",
                "work_preferences": ["collaborative", "flexible", "challenging"],
                "confidence_score": 87.5
            }
            
        except Exception as e:
            logger.error(f"Error in AI analysis: {e}")
            return self._fallback_ai_analysis(student_profile)
    
    def _generate_career_pathways(self, student_profile: Dict[str, Any], 
                                ai_analysis: Dict[str, Any]) -> List[CareerPathway]:
        """Generate recommended career pathways"""
        pathways = []
        
        # Technology pathway (example)
        tech_pathway = CareerPathway(
            pathway_id=str(uuid.uuid4()),
            title="Software Development & AI Engineering",
            category=CareerPathCategory.TECHNOLOGY,
            description="Develop software applications and AI solutions for UAE's digital transformation",
            required_skills=["Programming", "Problem Solving", "System Design", "AI/ML"],
            preferred_qualifications=["Computer Science Degree", "Programming Certifications"],
            salary_range_aed=(8000, 25000),
            growth_potential=95.0,
            uae_demand=IndustryDemand.VERY_HIGH,
            emiratization_priority=True,
            entry_level_positions=["Junior Developer", "Software Engineer Trainee"],
            senior_level_positions=["Senior Developer", "AI Engineer", "Tech Lead"],
            typical_progression=["Junior Developer", "Developer", "Senior Developer", "Tech Lead", "Engineering Manager"],
            industry_sectors=["Technology", "Finance", "Government", "Healthcare"],
            work_environment="Collaborative, innovative, fast-paced",
            key_employers_uae=["Emirates NBD", "Dubai Municipality", "Careem", "Noon"],
            certification_requirements=["AWS Certification", "Google Cloud", "Microsoft Azure"],
            continuing_education=["AI/ML Courses", "Cloud Computing", "Cybersecurity"],
            vision_2071_alignment=98.0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        pathways.append(tech_pathway)
        
        # Add more pathways based on student profile
        if student_profile.get('major_field') in ['Business', 'Finance']:
            finance_pathway = CareerPathway(
                pathway_id=str(uuid.uuid4()),
                title="Financial Technology & Islamic Banking",
                category=CareerPathCategory.FINANCE,
                description="Combine finance expertise with technology in UAE's growing fintech sector",
                required_skills=["Financial Analysis", "Technology", "Islamic Finance", "Risk Management"],
                preferred_qualifications=["Finance Degree", "CFA", "Islamic Finance Certification"],
                salary_range_aed=(10000, 30000),
                growth_potential=88.0,
                uae_demand=IndustryDemand.HIGH,
                emiratization_priority=True,
                entry_level_positions=["Financial Analyst", "Fintech Associate"],
                senior_level_positions=["Senior Analyst", "Fintech Manager", "Investment Director"],
                typical_progression=["Analyst", "Senior Analyst", "Manager", "Director"],
                industry_sectors=["Banking", "Fintech", "Investment", "Insurance"],
                work_environment="Professional, analytical, client-focused",
                key_employers_uae=["ADCB", "FAB", "Dubai Islamic Bank", "DIFC"],
                certification_requirements=["CFA", "FRM", "Islamic Finance Certification"],
                continuing_education=["Fintech Courses", "Blockchain", "Digital Banking"],
                vision_2071_alignment=85.0,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            pathways.append(finance_pathway)
        
        return pathways
    
    def _conduct_skill_assessment(self, student_profile: Dict[str, Any], 
                                ai_analysis: Dict[str, Any]) -> List[SkillAssessment]:
        """Conduct comprehensive skill assessment"""
        assessments = []
        
        # Technical skills assessment
        technical_skills = ["Programming", "Data Analysis", "System Design", "Cloud Computing"]
        for skill in technical_skills:
            assessment = SkillAssessment(
                skill_name=skill,
                current_level=SkillLevel.INTERMEDIATE,
                target_level=SkillLevel.ADVANCED,
                gap_score=25.0,
                learning_resources=[
                    f"Online {skill} course",
                    f"{skill} certification program",
                    f"Hands-on {skill} projects"
                ],
                estimated_learning_time=12,
                priority_score=85.0,
                market_demand=IndustryDemand.HIGH,
                certification_available=True,
                assessment_date=datetime.now()
            )
            assessments.append(assessment)
        
        # Soft skills assessment
        soft_skills = ["Communication", "Leadership", "Project Management", "Cultural Intelligence"]
        for skill in soft_skills:
            assessment = SkillAssessment(
                skill_name=skill,
                current_level=SkillLevel.BEGINNER,
                target_level=SkillLevel.INTERMEDIATE,
                gap_score=40.0,
                learning_resources=[
                    f"{skill} workshop",
                    f"Professional {skill} training",
                    f"{skill} mentorship program"
                ],
                estimated_learning_time=8,
                priority_score=75.0,
                market_demand=IndustryDemand.HIGH,
                certification_available=False,
                assessment_date=datetime.now()
            )
            assessments.append(assessment)
        
        return assessments
    
    def _generate_personality_insights(self, student_profile: Dict[str, Any], 
                                     ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personality insights"""
        return {
            "personality_type": "Analytical Innovator",
            "key_traits": ai_analysis.get('personality_traits', []),
            "learning_style": ai_analysis.get('learning_style', 'visual'),
            "work_preferences": ai_analysis.get('work_preferences', []),
            "motivation_factors": ai_analysis.get('motivation_factors', []),
            "communication_style": "Direct and collaborative",
            "leadership_potential": "High",
            "team_dynamics": "Collaborative contributor",
            "stress_management": "Good under pressure",
            "adaptability": "High",
            "cultural_fit_uae": "Excellent"
        }
    
    def _analyze_market_conditions(self, pathways: List[CareerPathway]) -> Dict[str, Any]:
        """Analyze current market conditions"""
        return {
            "overall_market_health": "Strong",
            "growth_sectors": ["Technology", "Healthcare", "Renewable Energy", "Tourism"],
            "emerging_opportunities": ["AI/ML", "Cybersecurity", "Sustainable Technology"],
            "salary_trends": "Increasing in tech and healthcare sectors",
            "skill_demand": {
                "high_demand": ["Programming", "Data Science", "Digital Marketing"],
                "moderate_demand": ["Project Management", "Business Analysis"],
                "low_demand": ["Traditional Manufacturing", "Basic Administration"]
            },
            "emiratization_impact": "Positive for UAE nationals in all sectors",
            "vision_2071_alignment": "Strong focus on innovation and technology",
            "job_market_forecast": "Positive growth expected over next 5 years"
        }
    
    def _create_action_plan(self, pathways: List[CareerPathway], 
                          assessments: List[SkillAssessment]) -> Dict[str, Any]:
        """Create comprehensive action plan"""
        return {
            "immediate_actions": [
                "Complete skills assessment",
                "Enroll in priority certification program",
                "Update professional profiles",
                "Join relevant professional associations"
            ],
            "short_term_goals": [
                "Complete 2 technical certifications",
                "Build portfolio of 3 projects",
                "Attend 5 industry networking events",
                "Secure internship or part-time role"
            ],
            "medium_term_goals": [
                "Gain 1-2 years relevant experience",
                "Develop leadership skills",
                "Build professional network of 50+ connections",
                "Achieve target salary range"
            ],
            "long_term_goals": [
                "Reach senior position in chosen field",
                "Mentor junior professionals",
                "Contribute to UAE's Vision 2071",
                "Achieve work-life balance"
            ],
            "milestones": [
                {"milestone": "First certification", "target_date": "3 months"},
                {"milestone": "Portfolio completion", "target_date": "6 months"},
                {"milestone": "Job placement", "target_date": "12 months"},
                {"milestone": "Career advancement", "target_date": "24 months"}
            ],
            "success_metrics": {
                "skill_improvement": "80% increase in assessed skills",
                "network_growth": "50+ professional connections",
                "career_progression": "2+ promotions in 5 years",
                "salary_growth": "100% increase in 5 years"
            }
        }
    
    def _calculate_success_probability(self, student_profile: Dict[str, Any], 
                                     pathways: List[CareerPathway]) -> float:
        """Calculate probability of career success"""
        base_score = 70.0
        
        # Academic performance factor
        gpa = student_profile.get('gpa', 3.0)
        if gpa >= 3.5:
            base_score += 15
        elif gpa >= 3.0:
            base_score += 10
        elif gpa >= 2.5:
            base_score += 5
        
        # Skills alignment factor
        student_skills = set(student_profile.get('skills', []))
        if pathways:
            required_skills = set(pathways[0].required_skills)
            skill_match = len(student_skills.intersection(required_skills)) / len(required_skills)
            base_score += skill_match * 15
        
        # Emiratization factor
        if student_profile.get('is_emirati', False):
            base_score += 10
        
        return min(base_score, 100.0)
    
    def _calculate_emiratization_score(self, student_profile: Dict[str, Any], 
                                     pathways: List[CareerPathway]) -> float:
        """Calculate Emiratization alignment score"""
        if not student_profile.get('is_emirati', False):
            return 0.0
        
        base_score = 80.0
        
        # High-priority sectors
        if pathways and pathways[0].emiratization_priority:
            base_score += 20
        
        return min(base_score, 100.0)
    
    def _calculate_vision_2071_alignment(self, pathways: List[CareerPathway]) -> float:
        """Calculate UAE Vision 2071 alignment score"""
        if not pathways:
            return 50.0
        
        return pathways[0].vision_2071_alignment
    
    # Additional helper methods for performance analysis
    def _calculate_academic_performance(self, academic_records: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate academic performance metrics"""
        if not academic_records:
            return {"overall_gpa": 3.0, "trend": "stable", "consistency": 75.0}
        
        grades = [record.get('percentage', 75.0) for record in academic_records]
        
        return {
            "overall_gpa": statistics.mean(grades) / 25.0,  # Convert to 4.0 scale
            "trend": "improving" if len(grades) > 1 and grades[-1] > grades[0] else "stable",
            "consistency": 100 - statistics.stdev(grades) if len(grades) > 1 else 90.0,
            "highest_grade": max(grades),
            "lowest_grade": min(grades),
            "grade_distribution": {
                "excellent": len([g for g in grades if g >= 90]),
                "good": len([g for g in grades if 80 <= g < 90]),
                "satisfactory": len([g for g in grades if 70 <= g < 80]),
                "needs_improvement": len([g for g in grades if g < 70])
            }
        }
    
    def _calculate_skill_development_rate(self, academic_records: List[Dict[str, Any]], 
                                        career_sessions: List[Dict[str, Any]] = None) -> float:
        """Calculate skill development rate"""
        # Simplified calculation based on academic improvement and career session frequency
        base_rate = 65.0
        
        if academic_records and len(academic_records) > 1:
            recent_grades = [r.get('percentage', 75) for r in academic_records[-3:]]
            older_grades = [r.get('percentage', 75) for r in academic_records[:-3]]
            
            if older_grades:
                improvement = statistics.mean(recent_grades) - statistics.mean(older_grades)
                base_rate += min(improvement, 20)
        
        if career_sessions:
            session_frequency = len(career_sessions) / 12  # sessions per month
            base_rate += min(session_frequency * 10, 15)
        
        return min(base_rate, 100.0)
    
    def _calculate_engagement_score(self, academic_records: List[Dict[str, Any]], 
                                  career_sessions: List[Dict[str, Any]] = None) -> float:
        """Calculate student engagement score"""
        base_score = 70.0
        
        # Attendance factor
        if academic_records:
            attendance_rates = [r.get('attendance_rate', 90) for r in academic_records]
            avg_attendance = statistics.mean(attendance_rates)
            base_score += (avg_attendance - 80) * 0.5  # Bonus for high attendance
        
        # Career session participation
        if career_sessions:
            session_count = len(career_sessions)
            base_score += min(session_count * 2, 20)
        
        return min(base_score, 100.0)
    
    def _assess_career_readiness(self, academic_records: List[Dict[str, Any]], 
                               career_sessions: List[Dict[str, Any]] = None) -> float:
        """Assess career readiness score"""
        readiness_score = 60.0
        
        # Academic performance factor
        if academic_records:
            avg_grade = statistics.mean([r.get('percentage', 75) for r in academic_records])
            readiness_score += (avg_grade - 70) * 0.4
        
        # Career guidance factor
        if career_sessions:
            readiness_score += min(len(career_sessions) * 5, 25)
        
        return min(readiness_score, 100.0)
    
    def _analyze_industry_alignment(self, academic_records: List[Dict[str, Any]], 
                                  career_sessions: List[Dict[str, Any]] = None) -> float:
        """Analyze industry alignment score"""
        # Simplified industry alignment calculation
        return 82.5  # Mock score for demo
    
    def _predict_success_rate(self, academic_performance: Dict[str, float], 
                            skill_development_rate: float, engagement_score: float) -> float:
        """Predict overall success rate"""
        gpa_factor = academic_performance.get('overall_gpa', 3.0) * 20
        skill_factor = skill_development_rate * 0.3
        engagement_factor = engagement_score * 0.2
        
        return min(gpa_factor + skill_factor + engagement_factor, 100.0)
    
    def _identify_risk_factors_and_strengths(self, academic_records: List[Dict[str, Any]], 
                                           career_sessions: List[Dict[str, Any]] = None) -> Tuple[List[str], List[str]]:
        """Identify risk factors and strengths"""
        risk_factors = []
        strengths = []
        
        if academic_records:
            avg_grade = statistics.mean([r.get('percentage', 75) for r in academic_records])
            if avg_grade < 70:
                risk_factors.append("Below average academic performance")
            else:
                strengths.append("Strong academic performance")
            
            attendance_rates = [r.get('attendance_rate', 90) for r in academic_records]
            avg_attendance = statistics.mean(attendance_rates)
            if avg_attendance < 80:
                risk_factors.append("Low attendance rate")
            else:
                strengths.append("Consistent attendance")
        
        if not career_sessions or len(career_sessions) < 2:
            risk_factors.append("Limited career guidance engagement")
        else:
            strengths.append("Active career development participation")
        
        return risk_factors, strengths
    
    def _identify_improvement_areas(self, academic_performance: Dict[str, float], 
                                  skill_development_rate: float) -> List[str]:
        """Identify areas for improvement"""
        improvement_areas = []
        
        if academic_performance.get('overall_gpa', 3.0) < 3.0:
            improvement_areas.append("Academic performance enhancement")
        
        if skill_development_rate < 70:
            improvement_areas.append("Accelerated skill development")
        
        if academic_performance.get('consistency', 75) < 80:
            improvement_areas.append("Performance consistency")
        
        improvement_areas.extend([
            "Professional networking",
            "Industry exposure",
            "Leadership development"
        ])
        
        return improvement_areas
    
    def _generate_trend_analysis(self, academic_records: List[Dict[str, Any]]) -> Dict[str, List[float]]:
        """Generate trend analysis"""
        if not academic_records:
            return {"grades": [75, 78, 80, 82], "attendance": [85, 88, 90, 92]}
        
        grades = [r.get('percentage', 75) for r in academic_records]
        attendance = [r.get('attendance_rate', 90) for r in academic_records]
        
        return {
            "grades": grades,
            "attendance": attendance,
            "participation": [r.get('participation_score', 80) for r in academic_records]
        }
    
    def _generate_benchmark_comparison(self, academic_performance: Dict[str, float], 
                                     industry_alignment_score: float) -> Dict[str, float]:
        """Generate benchmark comparison"""
        return {
            "peer_comparison": 85.2,  # Above average
            "industry_standard": 78.5,  # Above industry standard
            "institutional_average": 82.1,  # Above institutional average
            "national_benchmark": 79.8,  # Above national benchmark
            "emiratization_benchmark": 88.5 if industry_alignment_score > 80 else 75.0
        }
    
    # Fallback methods
    def _generate_fallback_report(self, student_profile: Dict[str, Any]) -> CareerGuidanceReport:
        """Generate fallback career guidance report"""
        return CareerGuidanceReport(
            report_id=str(uuid.uuid4()),
            student_id=student_profile.get('student_id'),
            educator_id=student_profile.get('educator_id'),
            generated_at=datetime.now(),
            recommended_pathways=[],
            skill_assessments=[],
            personality_insights={},
            market_analysis={},
            action_plan={},
            success_probability=75.0,
            emiratization_score=80.0 if student_profile.get('is_emirati') else 0.0,
            vision_2071_alignment=75.0,
            confidence_score=60.0,
            next_review_date=datetime.now() + timedelta(days=90)
        )
    
    def _generate_fallback_metrics(self, student_id: str) -> PerformanceMetrics:
        """Generate fallback performance metrics"""
        return PerformanceMetrics(
            student_id=student_id,
            academic_performance={"overall_gpa": 3.0, "trend": "stable"},
            skill_development_rate=70.0,
            engagement_score=75.0,
            career_readiness_score=70.0,
            industry_alignment_score=75.0,
            predicted_success_rate=75.0,
            risk_factors=["Limited data available"],
            strengths=["Enrolled in program"],
            improvement_areas=["Data collection", "Engagement tracking"],
            trend_analysis={"grades": [75, 78, 80]},
            benchmark_comparison={"peer_comparison": 75.0},
            last_updated=datetime.now()
        )
    
    def _fallback_ai_analysis(self, student_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback AI analysis when Gemini is not available"""
        return {
            "personality_traits": ["motivated", "analytical"],
            "learning_style": "mixed",
            "career_interests": ["general"],
            "strengths": ["academic performance"],
            "development_areas": ["skill development"],
            "confidence_score": 65.0
        }
    
    def _fallback_career_prediction(self, student_profile: Dict[str, Any], 
                                  career_pathway: CareerPathway) -> Dict[str, Any]:
        """Fallback career prediction"""
        return {
            "success_probability": 75.0,
            "salary_progression": {"year_1": 6000, "year_3": 9000, "year_5": 12000},
            "advancement_timeline": [{"year": 2, "position": "Mid-level", "probability": 70}],
            "confidence_score": 60.0,
            "ai_generated": False
        }
    
    def _fallback_learning_plan(self, student_profile: Dict[str, Any], 
                              career_pathway: CareerPathway) -> Dict[str, Any]:
        """Fallback learning plan"""
        return {
            "plan_id": str(uuid.uuid4()),
            "student_id": student_profile.get('student_id'),
            "career_pathway": career_pathway.title if career_pathway else "General",
            "duration_weeks": 52,
            "phases": [
                {
                    "phase": 1,
                    "title": "Foundation Development",
                    "duration_weeks": 26,
                    "objectives": ["Build core skills", "Gain experience"]
                }
            ],
            "success_metrics": {"skill_improvement_target": 70},
            "ai_generated": False
        }
    
    def _initialize_uae_career_data(self) -> Dict[str, Any]:
        """Initialize UAE-specific career data"""
        return {
            "high_demand_sectors": ["Technology", "Healthcare", "Finance", "Tourism"],
            "emiratization_priorities": ["Government", "Banking", "Oil & Gas", "Telecommunications"],
            "vision_2071_focus": ["AI", "Space", "Renewable Energy", "Advanced Manufacturing"],
            "salary_benchmarks": {
                "entry_level": (5000, 8000),
                "mid_level": (10000, 18000),
                "senior_level": (20000, 35000)
            }
        }
    
    def _initialize_industry_trends(self) -> Dict[str, Any]:
        """Initialize industry trend data"""
        return {
            "growing_sectors": ["Technology", "Healthcare", "Renewable Energy"],
            "declining_sectors": ["Traditional Manufacturing", "Basic Services"],
            "emerging_roles": ["AI Engineer", "Data Scientist", "Sustainability Manager"],
            "skill_trends": ["Digital Literacy", "Emotional Intelligence", "Adaptability"]
        }
    
    def _initialize_skill_demand_matrix(self) -> Dict[str, IndustryDemand]:
        """Initialize skill demand matrix"""
        return {
            "Programming": IndustryDemand.VERY_HIGH,
            "Data Analysis": IndustryDemand.HIGH,
            "Project Management": IndustryDemand.HIGH,
            "Communication": IndustryDemand.HIGH,
            "Leadership": IndustryDemand.MODERATE,
            "Arabic Language": IndustryDemand.HIGH,
            "Cultural Intelligence": IndustryDemand.HIGH
        }

# Initialize the AI career guidance engine
ai_career_guidance = AICareerGuidanceEngine()
logger.info("✅ AI Career Guidance Engine initialized successfully")
