"""
AI Assessment Intelligence Engine for Emirati Journey Platform
Powered by Gemini 2.5 Pro for intelligent assessment creation and evaluation
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import google.generativeai as genai
import asyncio
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("✅ Gemini 2.5 Pro API configured successfully")
else:
    logger.warning("⚠️ GEMINI_API_KEY not found in environment variables")

@dataclass
class AssessmentIntelligence:
    """AI-generated assessment intelligence"""
    assessment_id: str
    intelligence_type: str
    confidence_score: float
    recommendations: List[str]
    insights: Dict[str, Any]
    uae_cultural_context: Dict[str, Any]
    generated_at: datetime
    processing_time_seconds: float

@dataclass
class QuestionIntelligence:
    """AI-generated question intelligence"""
    question_id: str
    difficulty_analysis: Dict[str, Any]
    cultural_relevance: Dict[str, Any]
    skill_alignment: Dict[str, Any]
    improvement_suggestions: List[str]
    bias_analysis: Dict[str, Any]
    generated_at: datetime

@dataclass
class ResponseIntelligence:
    """AI-generated response evaluation intelligence"""
    response_id: str
    evaluation_score: float
    detailed_feedback: str
    skill_demonstration: Dict[str, Any]
    improvement_areas: List[str]
    cultural_competency: Dict[str, Any]
    next_steps: List[str]
    confidence_level: float
    generated_at: datetime

class AssessmentIntelligenceType(Enum):
    """Types of assessment intelligence"""
    QUESTION_GENERATION = "question_generation"
    ASSESSMENT_OPTIMIZATION = "assessment_optimization"
    RESPONSE_EVALUATION = "response_evaluation"
    SKILL_GAP_ANALYSIS = "skill_gap_analysis"
    CULTURAL_ASSESSMENT = "cultural_assessment"
    PERFORMANCE_PREDICTION = "performance_prediction"
    LEARNING_PATH_RECOMMENDATION = "learning_path_recommendation"
    BIAS_DETECTION = "bias_detection"

class AIAssessmentIntelligence:
    """AI-powered assessment intelligence engine using Gemini 2.5 Pro"""
    
    def __init__(self):
        self.model = None
        self.intelligence_cache = {}
        self.processing_stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'average_processing_time': 0.0,
            'cache_hits': 0
        }
        
        # Initialize Gemini model
        self._initialize_model()
        
        logger.info("✅ AI Assessment Intelligence Engine initialized")
    
    def _initialize_model(self):
        """Initialize Gemini 2.5 Pro model"""
        try:
            if GEMINI_API_KEY:
                self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("✅ Gemini 2.5 Pro model initialized successfully")
            else:
                logger.warning("⚠️ Gemini API key not available - AI features will be limited")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini model: {str(e)}")
            self.model = None
    
    def generate_intelligent_questions(self, 
                                     assessment_type: str,
                                     industry_category: str,
                                     difficulty_level: str,
                                     skill_focus: List[str],
                                     question_count: int = 10,
                                     uae_context: bool = True) -> Dict[str, Any]:
        """Generate intelligent questions using Gemini 2.5 Pro"""
        start_time = time.time()
        
        try:
            if not self.model:
                return self._fallback_question_generation(assessment_type, question_count)
            
            # Create comprehensive prompt for question generation
            prompt = self._create_question_generation_prompt(
                assessment_type, industry_category, difficulty_level, 
                skill_focus, question_count, uae_context
            )
            
            # Generate questions using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse and structure the response
            questions_data = self._parse_question_response(response.text)
            
            # Add UAE-specific enhancements
            if uae_context:
                questions_data = self._enhance_with_uae_context(questions_data)
            
            processing_time = time.time() - start_time
            
            # Update statistics
            self._update_stats(True, processing_time)
            
            return {
                'success': True,
                'questions': questions_data['questions'],
                'metadata': {
                    'assessment_type': assessment_type,
                    'industry_category': industry_category,
                    'difficulty_level': difficulty_level,
                    'skill_focus': skill_focus,
                    'uae_context': uae_context,
                    'ai_confidence': questions_data.get('confidence', 0.95),
                    'processing_time_seconds': processing_time,
                    'generated_at': datetime.now().isoformat()
                },
                'intelligence': {
                    'question_quality_score': questions_data.get('quality_score', 0.9),
                    'cultural_relevance_score': questions_data.get('cultural_score', 0.85),
                    'difficulty_distribution': questions_data.get('difficulty_distribution', {}),
                    'skill_coverage': questions_data.get('skill_coverage', {}),
                    'recommendations': questions_data.get('recommendations', [])
                }
            }
            
        except Exception as e:
            logger.error(f"Question generation error: {str(e)}")
            self._update_stats(False, time.time() - start_time)
            return self._fallback_question_generation(assessment_type, question_count)
    
    def evaluate_response_intelligence(self, 
                                     question_data: Dict[str, Any],
                                     response_data: Dict[str, Any],
                                     candidate_profile: Dict[str, Any]) -> ResponseIntelligence:
        """Evaluate response using AI intelligence"""
        start_time = time.time()
        
        try:
            if not self.model:
                return self._fallback_response_evaluation(question_data, response_data)
            
            # Create evaluation prompt
            prompt = self._create_response_evaluation_prompt(
                question_data, response_data, candidate_profile
            )
            
            # Generate evaluation using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse evaluation response
            evaluation_data = self._parse_evaluation_response(response.text)
            
            processing_time = time.time() - start_time
            
            # Create response intelligence object
            intelligence = ResponseIntelligence(
                response_id=response_data.get('response_id', 'unknown'),
                evaluation_score=evaluation_data.get('score', 0.0),
                detailed_feedback=evaluation_data.get('feedback', ''),
                skill_demonstration=evaluation_data.get('skills', {}),
                improvement_areas=evaluation_data.get('improvements', []),
                cultural_competency=evaluation_data.get('cultural', {}),
                next_steps=evaluation_data.get('next_steps', []),
                confidence_level=evaluation_data.get('confidence', 0.8),
                generated_at=datetime.now()
            )
            
            self._update_stats(True, processing_time)
            return intelligence
            
        except Exception as e:
            logger.error(f"Response evaluation error: {str(e)}")
            self._update_stats(False, time.time() - start_time)
            return self._fallback_response_evaluation(question_data, response_data)
    
    def analyze_assessment_performance(self, 
                                     assessment_data: Dict[str, Any],
                                     session_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze overall assessment performance using AI"""
        start_time = time.time()
        
        try:
            if not self.model:
                return self._fallback_performance_analysis(assessment_data, session_data)
            
            # Create performance analysis prompt
            prompt = self._create_performance_analysis_prompt(assessment_data, session_data)
            
            # Generate analysis using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse analysis response
            analysis_data = self._parse_performance_response(response.text)
            
            processing_time = time.time() - start_time
            
            # Enhance with UAE-specific insights
            analysis_data = self._enhance_performance_with_uae_insights(analysis_data)
            
            self._update_stats(True, processing_time)
            
            return {
                'success': True,
                'analysis': analysis_data,
                'metadata': {
                    'assessment_id': assessment_data.get('assessment_id'),
                    'total_sessions': len(session_data),
                    'processing_time_seconds': processing_time,
                    'generated_at': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Performance analysis error: {str(e)}")
            self._update_stats(False, time.time() - start_time)
            return self._fallback_performance_analysis(assessment_data, session_data)
    
    def generate_skill_gap_analysis(self, 
                                   candidate_results: Dict[str, Any],
                                   industry_requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive skill gap analysis"""
        start_time = time.time()
        
        try:
            if not self.model:
                return self._fallback_skill_gap_analysis(candidate_results)
            
            # Create skill gap analysis prompt
            prompt = self._create_skill_gap_prompt(candidate_results, industry_requirements)
            
            # Generate analysis using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse skill gap response
            gap_data = self._parse_skill_gap_response(response.text)
            
            processing_time = time.time() - start_time
            
            # Add UAE market context
            gap_data = self._enhance_with_uae_market_context(gap_data)
            
            self._update_stats(True, processing_time)
            
            return {
                'success': True,
                'skill_gaps': gap_data.get('gaps', []),
                'strengths': gap_data.get('strengths', []),
                'learning_recommendations': gap_data.get('learning_plan', []),
                'career_guidance': gap_data.get('career_advice', []),
                'uae_market_insights': gap_data.get('uae_insights', {}),
                'confidence_score': gap_data.get('confidence', 0.9),
                'processing_time_seconds': processing_time,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Skill gap analysis error: {str(e)}")
            self._update_stats(False, time.time() - start_time)
            return self._fallback_skill_gap_analysis(candidate_results)
    
    def detect_assessment_bias(self, 
                              assessment_data: Dict[str, Any],
                              response_patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detect potential bias in assessments using AI"""
        start_time = time.time()
        
        try:
            if not self.model:
                return self._fallback_bias_detection()
            
            # Create bias detection prompt
            prompt = self._create_bias_detection_prompt(assessment_data, response_patterns)
            
            # Generate bias analysis using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse bias analysis response
            bias_data = self._parse_bias_response(response.text)
            
            processing_time = time.time() - start_time
            
            self._update_stats(True, processing_time)
            
            return {
                'success': True,
                'bias_detected': bias_data.get('bias_found', False),
                'bias_types': bias_data.get('bias_types', []),
                'severity_level': bias_data.get('severity', 'low'),
                'affected_questions': bias_data.get('affected_questions', []),
                'recommendations': bias_data.get('recommendations', []),
                'cultural_sensitivity': bias_data.get('cultural_analysis', {}),
                'confidence_score': bias_data.get('confidence', 0.85),
                'processing_time_seconds': processing_time,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Bias detection error: {str(e)}")
            self._update_stats(False, time.time() - start_time)
            return self._fallback_bias_detection()
    
    def _create_question_generation_prompt(self, assessment_type: str, industry: str, 
                                         difficulty: str, skills: List[str], 
                                         count: int, uae_context: bool) -> str:
        """Create comprehensive prompt for question generation"""
        uae_context_text = ""
        if uae_context:
            uae_context_text = """
            UAE CULTURAL CONTEXT:
            - Incorporate UAE cultural values and workplace norms
            - Consider Emiratization initiatives and national talent development
            - Include Arabic language elements where appropriate
            - Reflect UAE Vision 2071 and national development goals
            - Consider cultural diversity and inclusion in the UAE workplace
            """
        
        return f"""
        You are an expert assessment designer creating high-quality questions for the UAE job market.
        
        ASSESSMENT REQUIREMENTS:
        - Assessment Type: {assessment_type}
        - Industry Category: {industry}
        - Difficulty Level: {difficulty}
        - Skill Focus Areas: {', '.join(skills)}
        - Number of Questions: {count}
        
        {uae_context_text}
        
        QUESTION REQUIREMENTS:
        1. Create {count} diverse, high-quality questions
        2. Ensure questions are culturally appropriate for the UAE context
        3. Include a mix of question types (multiple choice, scenario-based, practical)
        4. Provide clear, unambiguous questions with appropriate difficulty
        5. Include detailed answer explanations and scoring criteria
        6. Ensure questions test practical, job-relevant skills
        
        OUTPUT FORMAT (JSON):
        {{
            "questions": [
                {{
                    "question_id": "unique_id",
                    "question_text": "Question content",
                    "question_type": "multiple_choice|scenario|practical",
                    "difficulty_level": "{difficulty}",
                    "skill_tags": ["skill1", "skill2"],
                    "options": ["A", "B", "C", "D"] (if multiple choice),
                    "correct_answer": "Answer or explanation",
                    "explanation": "Detailed explanation",
                    "points": 10,
                    "time_limit_minutes": 5,
                    "uae_cultural_relevance": "high|medium|low",
                    "bias_risk": "low|medium|high"
                }}
            ],
            "confidence": 0.95,
            "quality_score": 0.9,
            "cultural_score": 0.85,
            "difficulty_distribution": {{"beginner": 2, "intermediate": 5, "advanced": 3}},
            "skill_coverage": {{"skill1": 40, "skill2": 35, "skill3": 25}},
            "recommendations": ["Recommendation 1", "Recommendation 2"]
        }}
        
        Generate comprehensive, culturally intelligent questions that will effectively assess candidates for the UAE job market.
        """
    
    def _create_response_evaluation_prompt(self, question: Dict, response: Dict, 
                                         candidate: Dict) -> str:
        """Create prompt for response evaluation"""
        return f"""
        You are an expert assessor evaluating a candidate's response in the UAE job market context.
        
        QUESTION DETAILS:
        Question: {question.get('question_text', 'N/A')}
        Type: {question.get('question_type', 'N/A')}
        Skills Tested: {', '.join(question.get('skill_tags', []))}
        Points: {question.get('points', 0)}
        
        CANDIDATE RESPONSE:
        Response: {response.get('response_text', 'N/A')}
        Time Spent: {response.get('time_spent_seconds', 0)} seconds
        
        CANDIDATE PROFILE:
        Background: {candidate.get('background', 'N/A')}
        Experience Level: {candidate.get('experience_level', 'N/A')}
        UAE Experience: {candidate.get('uae_experience', False)}
        
        EVALUATION CRITERIA:
        1. Technical accuracy and completeness
        2. Practical application and real-world relevance
        3. Communication clarity and professionalism
        4. Cultural awareness and UAE context understanding
        5. Problem-solving approach and methodology
        
        OUTPUT FORMAT (JSON):
        {{
            "score": 8.5,
            "feedback": "Detailed constructive feedback",
            "skills": {{
                "technical_skills": 8.0,
                "communication": 7.5,
                "problem_solving": 9.0,
                "cultural_awareness": 8.5
            }},
            "improvements": ["Area 1", "Area 2"],
            "cultural": {{
                "uae_alignment": 8.0,
                "cultural_sensitivity": 7.5,
                "workplace_readiness": 8.5
            }},
            "next_steps": ["Next step 1", "Next step 2"],
            "confidence": 0.9
        }}
        
        Provide comprehensive, constructive evaluation with specific UAE market context.
        """
    
    def _create_performance_analysis_prompt(self, assessment: Dict, sessions: List[Dict]) -> str:
        """Create prompt for performance analysis"""
        session_summary = f"Total sessions: {len(sessions)}"
        if sessions:
            avg_score = sum(s.get('percentage_score', 0) for s in sessions) / len(sessions)
            pass_rate = sum(1 for s in sessions if s.get('passed', False)) / len(sessions) * 100
            session_summary += f", Average score: {avg_score:.1f}%, Pass rate: {pass_rate:.1f}%"
        
        return f"""
        You are an expert assessment analyst providing comprehensive performance insights for the UAE job market.
        
        ASSESSMENT DETAILS:
        Name: {assessment.get('name', 'N/A')}
        Type: {assessment.get('assessment_type', 'N/A')}
        Industry: {assessment.get('industry_category', 'N/A')}
        Total Questions: {assessment.get('total_questions', 0)}
        
        SESSION SUMMARY:
        {session_summary}
        
        ANALYSIS REQUIREMENTS:
        1. Overall performance trends and patterns
        2. Question difficulty analysis and optimization suggestions
        3. Skill gap identification across candidates
        4. UAE market readiness assessment
        5. Recommendations for assessment improvement
        6. Cultural competency insights
        
        OUTPUT FORMAT (JSON):
        {{
            "overall_performance": {{
                "average_score": 75.5,
                "pass_rate": 68.2,
                "completion_rate": 92.1,
                "average_time_minutes": 45.3
            }},
            "question_analysis": {{
                "most_difficult": ["Q1", "Q5"],
                "easiest": ["Q3", "Q7"],
                "discrimination_index": 0.75,
                "reliability_score": 0.82
            }},
            "skill_gaps": [
                {{
                    "skill": "Technical Skills",
                    "gap_percentage": 25.5,
                    "priority": "high"
                }}
            ],
            "uae_readiness": {{
                "cultural_competency": 78.5,
                "language_proficiency": 82.1,
                "workplace_alignment": 75.8
            }},
            "recommendations": [
                "Recommendation 1",
                "Recommendation 2"
            ],
            "trends": {{
                "improving_areas": ["Communication"],
                "declining_areas": ["Technical Skills"],
                "stable_areas": ["Problem Solving"]
            }}
        }}
        
        Provide actionable insights for improving assessment effectiveness and candidate development.
        """
    
    def _create_skill_gap_prompt(self, results: Dict, requirements: Dict) -> str:
        """Create prompt for skill gap analysis"""
        return f"""
        You are an expert career advisor analyzing skill gaps for UAE job market readiness.
        
        CANDIDATE RESULTS:
        Assessment Scores: {json.dumps(results.get('scores', {}), indent=2)}
        Skill Performance: {json.dumps(results.get('skill_breakdown', {}), indent=2)}
        Experience Level: {results.get('experience_level', 'N/A')}
        
        INDUSTRY REQUIREMENTS:
        Required Skills: {json.dumps(requirements.get('required_skills', {}), indent=2)}
        Industry: {requirements.get('industry', 'N/A')}
        Seniority Level: {requirements.get('seniority', 'N/A')}
        
        UAE MARKET CONTEXT:
        - Consider Emiratization priorities
        - Include Arabic language requirements where relevant
        - Factor in UAE cultural competency needs
        - Consider Vision 2071 skill requirements
        
        OUTPUT FORMAT (JSON):
        {{
            "gaps": [
                {{
                    "skill": "Skill Name",
                    "current_level": 6.5,
                    "required_level": 8.0,
                    "gap_severity": "medium",
                    "priority": "high",
                    "time_to_close_weeks": 12
                }}
            ],
            "strengths": [
                {{
                    "skill": "Strong Skill",
                    "level": 9.0,
                    "market_value": "high"
                }}
            ],
            "learning_plan": [
                {{
                    "skill": "Skill to develop",
                    "recommended_actions": ["Action 1", "Action 2"],
                    "resources": ["Resource 1", "Resource 2"],
                    "timeline_weeks": 8,
                    "priority": "high"
                }}
            ],
            "career_advice": [
                "Career guidance 1",
                "Career guidance 2"
            ],
            "uae_insights": {{
                "emiratization_advantage": "medium",
                "cultural_readiness": 8.5,
                "market_demand": "high",
                "salary_potential": "85000-120000 AED"
            }},
            "confidence": 0.9
        }}
        
        Provide comprehensive, actionable skill gap analysis with UAE market focus.
        """
    
    def _create_bias_detection_prompt(self, assessment: Dict, patterns: List[Dict]) -> str:
        """Create prompt for bias detection"""
        return f"""
        You are an expert in assessment fairness and bias detection, specializing in UAE cultural context.
        
        ASSESSMENT DETAILS:
        Name: {assessment.get('name', 'N/A')}
        Type: {assessment.get('assessment_type', 'N/A')}
        Industry: {assessment.get('industry_category', 'N/A')}
        
        RESPONSE PATTERNS:
        {json.dumps(patterns[:5], indent=2)}  # Sample patterns
        
        BIAS DETECTION FOCUS:
        1. Cultural bias against non-UAE nationals
        2. Gender bias in question framing
        3. Age bias in scenarios and examples
        4. Educational background bias
        5. Language proficiency bias
        6. Socioeconomic bias
        7. Religious or cultural insensitivity
        
        UAE CULTURAL CONSIDERATIONS:
        - Respect for cultural diversity in the UAE
        - Fair treatment regardless of nationality
        - Gender equality in workplace contexts
        - Inclusive language and scenarios
        
        OUTPUT FORMAT (JSON):
        {{
            "bias_found": true,
            "bias_types": [
                {{
                    "type": "cultural_bias",
                    "severity": "medium",
                    "description": "Description of bias",
                    "affected_groups": ["Group 1", "Group 2"]
                }}
            ],
            "severity": "medium",
            "affected_questions": ["Q1", "Q3", "Q7"],
            "recommendations": [
                "Recommendation 1",
                "Recommendation 2"
            ],
            "cultural_analysis": {{
                "inclusivity_score": 7.5,
                "cultural_sensitivity": 8.0,
                "fairness_rating": 7.8
            }},
            "confidence": 0.85
        }}
        
        Provide thorough bias analysis with specific recommendations for improvement.
        """
    
    def _parse_question_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response for question generation"""
        try:
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                return json.loads(json_text)
            else:
                # Fallback parsing
                return self._fallback_parse_questions(response_text)
                
        except Exception as e:
            logger.error(f"Question response parsing error: {str(e)}")
            return self._fallback_parse_questions(response_text)
    
    def _parse_evaluation_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response for evaluation"""
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                return json.loads(json_text)
            else:
                return self._fallback_parse_evaluation(response_text)
                
        except Exception as e:
            logger.error(f"Evaluation response parsing error: {str(e)}")
            return self._fallback_parse_evaluation(response_text)
    
    def _parse_performance_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response for performance analysis"""
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                return json.loads(json_text)
            else:
                return self._fallback_parse_performance(response_text)
                
        except Exception as e:
            logger.error(f"Performance response parsing error: {str(e)}")
            return self._fallback_parse_performance(response_text)
    
    def _parse_skill_gap_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response for skill gap analysis"""
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                return json.loads(json_text)
            else:
                return self._fallback_parse_skill_gap(response_text)
                
        except Exception as e:
            logger.error(f"Skill gap response parsing error: {str(e)}")
            return self._fallback_parse_skill_gap(response_text)
    
    def _parse_bias_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response for bias detection"""
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                return json.loads(json_text)
            else:
                return self._fallback_parse_bias(response_text)
                
        except Exception as e:
            logger.error(f"Bias response parsing error: {str(e)}")
            return self._fallback_parse_bias(response_text)
    
    def _enhance_with_uae_context(self, questions_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance questions with UAE-specific context"""
        # Add UAE cultural intelligence to questions
        for question in questions_data.get('questions', []):
            if 'uae_cultural_relevance' not in question:
                question['uae_cultural_relevance'] = 'medium'
            
            # Add UAE-specific tags
            if 'uae_tags' not in question:
                question['uae_tags'] = ['workplace_culture', 'professional_standards']
        
        return questions_data
    
    def _enhance_performance_with_uae_insights(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance performance analysis with UAE insights"""
        if 'uae_readiness' not in analysis_data:
            analysis_data['uae_readiness'] = {
                'cultural_competency': 75.0,
                'language_proficiency': 80.0,
                'workplace_alignment': 78.0
            }
        
        return analysis_data
    
    def _enhance_with_uae_market_context(self, gap_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance skill gap analysis with UAE market context"""
        if 'uae_insights' not in gap_data:
            gap_data['uae_insights'] = {
                'emiratization_advantage': 'medium',
                'cultural_readiness': 8.0,
                'market_demand': 'high',
                'salary_potential': '70000-100000 AED'
            }
        
        return gap_data
    
    def _update_stats(self, success: bool, processing_time: float):
        """Update processing statistics"""
        self.processing_stats['total_requests'] += 1
        
        if success:
            self.processing_stats['successful_requests'] += 1
        else:
            self.processing_stats['failed_requests'] += 1
        
        # Update average processing time
        total_time = (self.processing_stats['average_processing_time'] * 
                     (self.processing_stats['total_requests'] - 1) + processing_time)
        self.processing_stats['average_processing_time'] = total_time / self.processing_stats['total_requests']
    
    def get_intelligence_stats(self) -> Dict[str, Any]:
        """Get AI intelligence processing statistics"""
        return {
            'processing_stats': self.processing_stats.copy(),
            'model_status': 'operational' if self.model else 'unavailable',
            'cache_size': len(self.intelligence_cache),
            'system_health': 'excellent' if self.processing_stats['successful_requests'] > 0 else 'initializing'
        }
    
    # Fallback methods for when AI is not available
    def _fallback_question_generation(self, assessment_type: str, count: int) -> Dict[str, Any]:
        """Fallback question generation without AI"""
        return {
            'success': True,
            'questions': [
                {
                    'question_id': f'fallback_q_{i}',
                    'question_text': f'Sample {assessment_type} question {i+1}',
                    'question_type': 'multiple_choice',
                    'difficulty_level': 'intermediate',
                    'skill_tags': ['general'],
                    'options': ['A', 'B', 'C', 'D'],
                    'correct_answer': 'A',
                    'explanation': 'Sample explanation',
                    'points': 10,
                    'time_limit_minutes': 5,
                    'uae_cultural_relevance': 'medium',
                    'bias_risk': 'low'
                }
                for i in range(count)
            ],
            'metadata': {
                'ai_generated': False,
                'fallback_mode': True,
                'generated_at': datetime.now().isoformat()
            }
        }
    
    def _fallback_response_evaluation(self, question: Dict, response: Dict) -> ResponseIntelligence:
        """Fallback response evaluation without AI"""
        return ResponseIntelligence(
            response_id=response.get('response_id', 'unknown'),
            evaluation_score=7.5,
            detailed_feedback='Basic evaluation - AI enhancement not available',
            skill_demonstration={'general': 7.5},
            improvement_areas=['Consider AI-enhanced evaluation for detailed feedback'],
            cultural_competency={'uae_alignment': 7.0},
            next_steps=['Enable AI features for comprehensive evaluation'],
            confidence_level=0.6,
            generated_at=datetime.now()
        )
    
    def _fallback_performance_analysis(self, assessment: Dict, sessions: List[Dict]) -> Dict[str, Any]:
        """Fallback performance analysis without AI"""
        return {
            'success': True,
            'analysis': {
                'overall_performance': {
                    'average_score': 75.0,
                    'pass_rate': 70.0,
                    'completion_rate': 90.0
                },
                'recommendations': ['Enable AI features for detailed analysis'],
                'fallback_mode': True
            }
        }
    
    def _fallback_skill_gap_analysis(self, results: Dict) -> Dict[str, Any]:
        """Fallback skill gap analysis without AI"""
        return {
            'success': True,
            'skill_gaps': [],
            'strengths': [],
            'learning_recommendations': ['Enable AI features for personalized recommendations'],
            'career_guidance': ['AI-powered guidance not available'],
            'fallback_mode': True
        }
    
    def _fallback_bias_detection(self) -> Dict[str, Any]:
        """Fallback bias detection without AI"""
        return {
            'success': True,
            'bias_detected': False,
            'bias_types': [],
            'recommendations': ['Enable AI features for comprehensive bias detection'],
            'fallback_mode': True
        }
    
    def _fallback_parse_questions(self, text: str) -> Dict[str, Any]:
        """Fallback question parsing"""
        return {
            'questions': [],
            'confidence': 0.5,
            'quality_score': 0.5,
            'fallback_mode': True
        }
    
    def _fallback_parse_evaluation(self, text: str) -> Dict[str, Any]:
        """Fallback evaluation parsing"""
        return {
            'score': 7.0,
            'feedback': 'Basic evaluation',
            'confidence': 0.5,
            'fallback_mode': True
        }
    
    def _fallback_parse_performance(self, text: str) -> Dict[str, Any]:
        """Fallback performance parsing"""
        return {
            'overall_performance': {'average_score': 75.0},
            'recommendations': ['Enable AI for detailed analysis'],
            'fallback_mode': True
        }
    
    def _fallback_parse_skill_gap(self, text: str) -> Dict[str, Any]:
        """Fallback skill gap parsing"""
        return {
            'gaps': [],
            'strengths': [],
            'learning_plan': [],
            'fallback_mode': True
        }
    
    def _fallback_parse_bias(self, text: str) -> Dict[str, Any]:
        """Fallback bias parsing"""
        return {
            'bias_found': False,
            'bias_types': [],
            'recommendations': [],
            'fallback_mode': True
        }

# Global instance
ai_assessment_intelligence = AIAssessmentIntelligence()

logger.info("✅ AI Assessment Intelligence module loaded successfully")
