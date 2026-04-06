"""
Enhanced Job Matching Engine with Qwen / DashScope Integration
Provides AI-powered job recommendations for Emirati candidates
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    from backend.config.qwen_config import DASHSCOPE_API_KEY
    _qwen_available = bool(DASHSCOPE_API_KEY)
except ImportError:
    _qwen_available = False
from dataclasses import dataclass
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class JobMatch:
    job_id: str
    title: str
    company: str
    location: str
    salary_range: str
    match_score: float
    reasons: List[str]
    emiratization_eligible: bool
    skills_match: Dict[str, float]
    experience_match: float
    education_match: float
    location_preference_match: float

class EnhancedJobMatchingEngine:
    def __init__(self):
        """Initialize the enhanced job matching engine with Qwen / DashScope"""
        self.api_key = DASHSCOPE_API_KEY
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY environment variable is required")
        # AI model initialized via qwen_client (lazy-loaded)
        
        # Database connection
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': os.getenv('DB_PORT', '5432')
        }
        
        logger.info("Enhanced Job Matching Engine initialized with Qwen / DashScope")

    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def get_candidate_profile(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive candidate profile from database"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get user profile
                    cur.execute("""
                        SELECT u.*, p.* FROM users u
                        LEFT JOIN profiles p ON u.id = p.user_id
                        WHERE u.id = %s
                    """, (user_id,))
                    profile = cur.fetchone()
                    
                    if not profile:
                        return {}
                    
                    # Get skills
                    cur.execute("""
                        SELECT skill_name, proficiency_level FROM user_skills
                        WHERE user_id = %s
                    """, (user_id,))
                    skills = cur.fetchall()
                    
                    # Get experience
                    cur.execute("""
                        SELECT * FROM work_experience
                        WHERE user_id = %s ORDER BY start_date DESC
                    """, (user_id,))
                    experience = cur.fetchall()
                    
                    # Get education
                    cur.execute("""
                        SELECT * FROM education
                        WHERE user_id = %s ORDER BY graduation_date DESC
                    """, (user_id,))
                    education = cur.fetchall()
                    
                    return {
                        'profile': dict(profile),
                        'skills': [dict(skill) for skill in skills],
                        'experience': [dict(exp) for exp in experience],
                        'education': [dict(edu) for edu in education]
                    }
                    
        except Exception as e:
            logger.error(f"Error getting candidate profile: {e}")
            return {}

    def get_available_jobs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get available jobs from database"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT j.*, c.name as company_name, c.industry
                        FROM jobs j
                        LEFT JOIN companies c ON j.company_id = c.id
                        WHERE j.status = 'active' AND j.application_deadline > %s
                        ORDER BY j.created_at DESC
                        LIMIT %s
                    """, (datetime.now(), limit))
                    
                    jobs = cur.fetchall()
                    return [dict(job) for job in jobs]
                    
        except Exception as e:
            logger.error(f"Error getting available jobs: {e}")
            return []

    def analyze_job_match_with_ai(self, candidate_profile: Dict, job: Dict) -> Dict[str, Any]:
        """Use Qwen / DashScope to analyze job match compatibility"""
        try:
            prompt = f"""
            Analyze the job match compatibility between this Emirati candidate and job opportunity.
            
            CANDIDATE PROFILE:
            - Skills: {json.dumps(candidate_profile.get('skills', []), indent=2)}
            - Experience: {json.dumps(candidate_profile.get('experience', []), indent=2)}
            - Education: {json.dumps(candidate_profile.get('education', []), indent=2)}
            - Location: {candidate_profile.get('profile', {}).get('location', 'UAE')}
            - Career Level: {candidate_profile.get('profile', {}).get('career_level', 'Entry')}
            
            JOB OPPORTUNITY:
            - Title: {job.get('title', '')}
            - Company: {job.get('company_name', '')}
            - Industry: {job.get('industry', '')}
            - Location: {job.get('location', '')}
            - Requirements: {job.get('requirements', '')}
            - Description: {job.get('description', '')}
            - Salary Range: {job.get('salary_range', '')}
            - Experience Required: {job.get('experience_required', '')}
            - Emiratization Priority: {job.get('emiratization_priority', False)}
            
            Provide a comprehensive analysis in JSON format with:
            {{
                "overall_match_score": 0.0-1.0,
                "skills_match_score": 0.0-1.0,
                "experience_match_score": 0.0-1.0,
                "education_match_score": 0.0-1.0,
                "location_match_score": 0.0-1.0,
                "emiratization_eligible": true/false,
                "matching_skills": ["skill1", "skill2"],
                "missing_skills": ["skill1", "skill2"],
                "match_reasons": ["reason1", "reason2"],
                "growth_opportunities": ["opportunity1", "opportunity2"],
                "recommendations": ["recommendation1", "recommendation2"],
                "uae_career_alignment": "explanation of how this aligns with UAE career development",
                "confidence_level": 0.0-1.0
            }}
            
            Focus on UAE market context, Emiratization benefits, and career growth potential.
            """
            
            messages = [

            
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON. No markdown, no code fences."},

            
                {"role": "user", "content": prompt},

            
            ]

            
            response = chat_completion(task_type="match", messages=messages, response_format={"type": "json_object"})
            
            # Parse JSON response
            try:
                analysis = response  # chat_completion returns parsed JSON directly
                return analysis
            except json.JSONDecodeError:
                # Fallback parsing if JSON is malformed
                return self._parse_fallback_response(str(response) if isinstance(response, dict) else response)
                
        except Exception as e:
            logger.error(f"Error in AI job match analysis: {e}")
            return self._get_default_analysis()

    def _parse_fallback_response(self, response_text: str) -> Dict[str, Any]:
        """Fallback parsing for non-JSON responses"""
        return {
            "overall_match_score": 0.5,
            "skills_match_score": 0.5,
            "experience_match_score": 0.5,
            "education_match_score": 0.5,
            "location_match_score": 0.8,
            "emiratization_eligible": True,
            "matching_skills": [],
            "missing_skills": [],
            "match_reasons": ["AI analysis available"],
            "growth_opportunities": ["Career development potential"],
            "recommendations": ["Consider applying"],
            "uae_career_alignment": "Supports UAE career development goals",
            "confidence_level": 0.5
        }

    def _get_default_analysis(self) -> Dict[str, Any]:
        """Default analysis when AI fails"""
        return {
            "overall_match_score": 0.3,
            "skills_match_score": 0.3,
            "experience_match_score": 0.3,
            "education_match_score": 0.3,
            "location_match_score": 0.8,
            "emiratization_eligible": True,
            "matching_skills": [],
            "missing_skills": [],
            "match_reasons": ["Basic compatibility"],
            "growth_opportunities": [],
            "recommendations": [],
            "uae_career_alignment": "Standard UAE opportunity",
            "confidence_level": 0.3
        }

    def calculate_enhanced_match_score(self, ai_analysis: Dict, job: Dict) -> float:
        """Calculate enhanced match score with UAE-specific factors"""
        base_score = ai_analysis.get('overall_match_score', 0.5)
        
        # UAE-specific bonuses
        emiratization_bonus = 0.1 if ai_analysis.get('emiratization_eligible', False) else 0
        location_bonus = 0.05 if job.get('location', '').lower() in ['dubai', 'abu dhabi', 'sharjah'] else 0
        industry_bonus = 0.05 if job.get('industry', '').lower() in ['technology', 'finance', 'healthcare', 'education'] else 0
        
        # Confidence factor
        confidence = ai_analysis.get('confidence_level', 0.5)
        
        enhanced_score = (base_score + emiratization_bonus + location_bonus + industry_bonus) * confidence
        
        return min(enhanced_score, 1.0)  # Cap at 1.0

    def find_job_matches(self, user_id: str, limit: int = 20) -> List[JobMatch]:
        """Find and rank job matches for a candidate"""
        try:
            # Get candidate profile
            candidate_profile = self.get_candidate_profile(user_id)
            if not candidate_profile:
                logger.warning(f"No profile found for user {user_id}")
                return []
            
            # Get available jobs
            jobs = self.get_available_jobs(limit * 3)  # Get more to filter better matches
            if not jobs:
                logger.warning("No jobs available")
                return []
            
            matches = []
            
            for job in jobs:
                # AI analysis
                ai_analysis = self.analyze_job_match_with_ai(candidate_profile, job)
                
                # Calculate enhanced score
                match_score = self.calculate_enhanced_match_score(ai_analysis, job)
                
                # Create job match object
                job_match = JobMatch(
                    job_id=str(job.get('id', '')),
                    title=job.get('title', ''),
                    company=job.get('company_name', ''),
                    location=job.get('location', ''),
                    salary_range=job.get('salary_range', ''),
                    match_score=match_score,
                    reasons=ai_analysis.get('match_reasons', []),
                    emiratization_eligible=ai_analysis.get('emiratization_eligible', False),
                    skills_match={
                        'matching': ai_analysis.get('matching_skills', []),
                        'missing': ai_analysis.get('missing_skills', []),
                        'score': ai_analysis.get('skills_match_score', 0.5)
                    },
                    experience_match=ai_analysis.get('experience_match_score', 0.5),
                    education_match=ai_analysis.get('education_match_score', 0.5),
                    location_preference_match=ai_analysis.get('location_match_score', 0.5)
                )
                
                matches.append(job_match)
            
            # Sort by match score and return top matches
            matches.sort(key=lambda x: x.match_score, reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error finding job matches: {e}")
            return []

    def save_job_recommendation(self, user_id: str, job_match: JobMatch):
        """Save job recommendation to database"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO job_recommendations 
                        (user_id, job_id, match_score, reasons, created_at)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (user_id, job_id) DO UPDATE SET
                        match_score = EXCLUDED.match_score,
                        reasons = EXCLUDED.reasons,
                        updated_at = CURRENT_TIMESTAMP
                    """, (
                        user_id,
                        job_match.job_id,
                        job_match.match_score,
                        json.dumps(job_match.reasons),
                        datetime.now()
                    ))
                    conn.commit()
                    
        except Exception as e:
            logger.error(f"Error saving job recommendation: {e}")

    def get_job_recommendations(self, user_id: str, refresh: bool = False) -> List[JobMatch]:
        """Get job recommendations for a user (cached or fresh)"""
        try:
            if not refresh:
                # Try to get cached recommendations first
                with self.get_db_connection() as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute("""
                            SELECT jr.*, j.title, j.company_id, c.name as company_name,
                                   j.location, j.salary_range
                            FROM job_recommendations jr
                            JOIN jobs j ON jr.job_id = j.id
                            LEFT JOIN companies c ON j.company_id = c.id
                            WHERE jr.user_id = %s AND jr.created_at > %s
                            ORDER BY jr.match_score DESC
                            LIMIT 20
                        """, (user_id, datetime.now() - timedelta(hours=24)))
                        
                        cached_recommendations = cur.fetchall()
                        
                        if cached_recommendations:
                            # Convert to JobMatch objects
                            matches = []
                            for rec in cached_recommendations:
                                match = JobMatch(
                                    job_id=str(rec['job_id']),
                                    title=rec['title'],
                                    company=rec['company_name'] or '',
                                    location=rec['location'] or '',
                                    salary_range=rec['salary_range'] or '',
                                    match_score=float(rec['match_score']),
                                    reasons=json.loads(rec['reasons']) if rec['reasons'] else [],
                                    emiratization_eligible=True,  # Default for cached
                                    skills_match={'matching': [], 'missing': [], 'score': 0.5},
                                    experience_match=0.5,
                                    education_match=0.5,
                                    location_preference_match=0.5
                                )
                                matches.append(match)
                            
                            return matches
            
            # Generate fresh recommendations
            matches = self.find_job_matches(user_id)
            
            # Save recommendations
            for match in matches:
                self.save_job_recommendation(user_id, match)
            
            return matches
            
        except Exception as e:
            logger.error(f"Error getting job recommendations: {e}")
            return []

    def get_job_insights(self, user_id: str) -> Dict[str, Any]:
        """Get job market insights for the candidate"""
        try:
            candidate_profile = self.get_candidate_profile(user_id)
            if not candidate_profile:
                return {}
            
            prompt = f"""
            Provide UAE job market insights for this Emirati candidate:
            
            CANDIDATE PROFILE:
            - Skills: {json.dumps(candidate_profile.get('skills', []), indent=2)}
            - Experience: {json.dumps(candidate_profile.get('experience', []), indent=2)}
            - Education: {json.dumps(candidate_profile.get('education', []), indent=2)}
            
            Provide insights in JSON format:
            {{
                "market_demand": "High/Medium/Low",
                "salary_expectations": "AED range",
                "growth_sectors": ["sector1", "sector2"],
                "skill_gaps": ["skill1", "skill2"],
                "recommendations": ["rec1", "rec2"],
                "emiratization_opportunities": "explanation",
                "career_progression": "pathway description"
            }}
            
            Focus on UAE job market trends and Emiratization initiatives.
            """
            
            messages = [

            
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON. No markdown, no code fences."},

            
                {"role": "user", "content": prompt},

            
            ]

            
            response = chat_completion(task_type="match", messages=messages, response_format={"type": "json_object"})
            
            try:
                insights = response  # chat_completion returns parsed JSON directly
                return insights
            except json.JSONDecodeError:
                return {
                    "market_demand": "Medium",
                    "salary_expectations": "Competitive",
                    "growth_sectors": ["Technology", "Healthcare"],
                    "skill_gaps": [],
                    "recommendations": ["Continue skill development"],
                    "emiratization_opportunities": "Good opportunities available",
                    "career_progression": "Multiple pathways available"
                }
                
        except Exception as e:
            logger.error(f"Error getting job insights: {e}")
            return {}

# Initialize the enhanced job matching engine
enhanced_job_matcher = EnhancedJobMatchingEngine()
