"""
Revolutionary AI-Powered Video Interview System
WebRTC-based video conferencing with real-time AI analysis
"""

import os

import json
import logging
import asyncio
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    from backend.config.qwen_config import DASHSCOPE_API_KEY
    _qwen_available = bool(DASHSCOPE_API_KEY)
except ImportError:
    _qwen_available = False
from dataclasses import dataclass
from backend.user_helpers import user_display_name
import uuid
import base64
import hashlib
import hmac
import time
import requests
from livekit.api import AccessToken, VideoGrants

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InterviewStatus(Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class InterviewType(Enum):
    PHONE_SCREENING = "phone_screening"
    VIDEO_INTERVIEW = "video_interview"
    TECHNICAL_ASSESSMENT = "technical_assessment"
    PANEL_INTERVIEW = "panel_interview"
    FINAL_INTERVIEW = "final_interview"

@dataclass
class VideoInterviewSession:
    id: str
    application_id: str
    interviewer_id: str
    candidate_id: str
    interview_type: InterviewType
    scheduled_time: datetime
    duration_minutes: int
    status: InterviewStatus
    room_id: str
    recording_id: Optional[str]
    ai_analysis_id: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]

@dataclass
class RealTimeAnalysis:
    session_id: str
    timestamp: datetime
    speech_quality: float
    sentiment_score: float
    engagement_level: float
    technical_accuracy: float
    communication_clarity: float
    confidence_level: float
    bias_indicators: List[str]
    key_insights: List[str]

class VideoInterviewEngine:
    def __init__(self):
        """Initialize the Video Interview Engine"""
        # Database connection
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': os.getenv('DB_PORT', '5432')
        }
        
        # Qwen AI (lazy-loaded via qwen_client module)
        if _qwen_available:
            logger.info("✅ Video Interview Engine AI ready (Qwen / DashScope)")
        else:
            logger.warning("⚠️ DASHSCOPE_API_KEY not found - AI analysis will be disabled")
        
        # Video service configuration (LiveKit)
        self.livekit_url = os.getenv('LIVEKIT_URL', 'ws://localhost:7880')
        self.livekit_api_key = os.getenv('LIVEKIT_API_KEY', 'devkey')
        self.livekit_api_secret = os.getenv('LIVEKIT_API_SECRET', 'secret')
        
        # Storage configuration
        self.video_storage_bucket = os.getenv('VIDEO_STORAGE_BUCKET', 'emirati-interviews')
        self.encryption_key = os.getenv('VIDEO_ENCRYPTION_KEY', 'default_key_change_in_production')
        
        # Granite Speech Server (sidecar)
        self.granite_speech_url = os.getenv('GRANITE_SPEECH_URL', 'http://localhost:8001')
        
        logger.info("Video Interview Engine initialized (Granite @ %s)", self.granite_speech_url)

    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def generate_livekit_token(self, room_name: str, participant_identity: str, participant_name: str) -> str:
        """Generate LiveKit JWT token for video session"""
        try:
            grant = VideoGrants(room_join=True, room=room_name)
            access_token = AccessToken(
                self.livekit_api_key, 
                self.livekit_api_secret
            )
            access_token.with_identity(participant_identity)
            access_token.with_name(participant_name)
            access_token.with_grants(grant)
            # Add 24-hour expiration equivalent (TTL)
            access_token.with_ttl(timedelta(hours=24))
            return access_token.to_jwt()
        except Exception as e:
            logger.error(f"Error generating LiveKit token: {e}")
            return "demo_token"

# REMOVED: schedule_interview was dead code — shadowed by
# REMOVED: interview_sessions_api.schedule_interview (registered first via blueprint).


    def start_interview_session(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """Start a video interview session"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get session details
                    cur.execute("""
                        SELECT * FROM video_interview_sessions 
                        WHERE (id = %s OR room_id = %s) AND (interviewer_id = %s OR candidate_id = %s)
                    """, (session_id, session_id, user_id, user_id))
                    
                    session = cur.fetchone()
                    if not session:
                        # Fallback for interview_schedules
                        cur.execute("""
                            SELECT 
                                id,
                                interview_id,
                                candidate_id,
                                recruiter_id as interviewer_id,
                                status,
                                duration_minutes,
                                interview_type,
                                COALESCE(NULLIF(meeting_link, ''), interview_id) as room_id
                            FROM interview_schedules
                            WHERE (interview_id = %s OR meeting_link LIKE %s) AND (recruiter_id = %s OR candidate_id = %s)
                        """, (session_id, f"%{session_id}%", user_id, user_id))
                        row = cur.fetchone()
                        if row:
                            session = dict(row)
                            if '/' in session['room_id']:
                                session['room_id'] = session['room_id'].split('/')[-1]
                        else:
                            raise ValueError("Interview session not found or access denied")
                    
                    # Update session status
                    if session['status'] == 'scheduled' or session['status'] == InterviewStatus.SCHEDULED.value:
                        if 'interview_id' in session:
                            cur.execute("""
                                UPDATE interview_schedules
                                SET status = 'in_progress', updated_at = NOW()
                                WHERE interview_id = %s
                            """, (session['interview_id'],))
                        else:
                            cur.execute("""
                                UPDATE video_interview_sessions 
                                SET status = %s, started_at = %s
                                WHERE id = %s
                            """, (InterviewStatus.IN_PROGRESS.value, datetime.now(), session['id']))
                        conn.commit()
                    
                    # Generate LiveKit tokens
                    interviewer_token = self.generate_livekit_token(
                        session['room_id'], session['interviewer_id'], "Interviewer"
                    )
                    candidate_token = self.generate_livekit_token(
                        session['room_id'], session['candidate_id'], "Candidate"
                    )
                    
                    # Determine user role and token
                    user_role = 'interviewer' if user_id == session['interviewer_id'] else 'candidate'
                    user_token = interviewer_token if user_role == 'interviewer' else candidate_token
                    
                    return {
                        'session_id': session.get('interview_id') or session.get('id') or session_id,
                        'room_id': session['room_id'],
                        'livekit_url': self.livekit_url,
                        'token': user_token,
                        'user_id': user_id,
                        'user_role': user_role,
                        'duration_minutes': session['duration_minutes'],
                        'interview_type': session['interview_type'],
                        'recording_enabled': True,
                        'ai_monitoring_enabled': True
                    }
                    
        except Exception as e:
            logger.error(f"Error starting interview session: {e}")
            raise

    def end_interview_session(self, session_id: str, user_id: str) -> bool:
        """End a video interview session"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Update session status in video_interview_sessions first
                    cur.execute("""
                        UPDATE video_interview_sessions 
                        SET status = %s, ended_at = %s
                        WHERE (id = %s OR room_id = %s) AND (interviewer_id = %s OR candidate_id = %s)
                    """, (
                        InterviewStatus.COMPLETED.value,
                        datetime.now(),
                        session_id,
                        session_id,
                        user_id,
                        user_id
                    ))
                    
                    if cur.rowcount == 0:
                        # Fallback for interview_schedules
                        cur.execute("""
                            UPDATE interview_schedules 
                            SET status = 'completed', updated_at = NOW()
                            WHERE (interview_id = %s OR meeting_link LIKE %s) AND (recruiter_id = %s OR candidate_id = %s)
                        """, (session_id, f"%{session_id}%", user_id, user_id))
                        
                        if cur.rowcount == 0:
                            return False
                    
                    conn.commit()
                    
                    # Resolve actual interview_id for report generation
                    actual_id = session_id
                    if not session_id.startswith('int_'):
                        cur.execute("SELECT interview_id FROM interview_schedules WHERE meeting_link LIKE %s LIMIT 1", (f"%{session_id}%",))
                        row = cur.fetchone()
                        if row:
                            actual_id = row[0]
                    
                    # Trigger post-interview processing
                    self._trigger_post_interview_processing(actual_id)
                    
                    logger.info(f"Ended interview session {session_id} (resolved to {actual_id})")
                    return True
                    
        except Exception as e:
            logger.error(f"Error ending interview session: {e}")
            return False

    def _trigger_post_interview_processing(self, session_id: str):
        """Trigger post-interview AI analysis and processing"""
        try:
            logger.info(f"Triggering post-interview processing for session {session_id}")
            self.generate_interview_report(session_id)
        except Exception as e:
            logger.error(f"Error in post-interview processing: {e}")

    def process_real_time_audio(self, session_id: str, audio_data: bytes) -> RealTimeAnalysis:
        """Process real-time audio for AI analysis via Granite Speech Server."""
        try:
            # Attempt to call the Granite speech sidecar for real transcription
            health_url = f"{self.granite_speech_url}/health"
            try:
                health = requests.get(health_url, timeout=2)
                if health.status_code == 200 and health.json().get('engine', {}).get('loaded'):
                    logger.debug("Granite speech server available — audio handled via WebSocket")
                    # NOTE: Real-time audio flows through the WebSocket at
                    # ws://<granite>/ws/transcribe/<session_id>, not this REST method.
                    # This endpoint is kept for backward-compat with the existing
                    # REST-based flow; the WebSocket path is preferred.
            except requests.RequestException:
                logger.debug("Granite speech server not reachable — using mock analysis")

            return self._get_mock_analysis(session_id)
            
        except Exception as e:
            logger.error(f"Error processing real-time audio: {e}")
            return self._get_mock_analysis(session_id)

    def _get_mock_analysis(self, session_id: str) -> RealTimeAnalysis:
        """Generate mock real-time analysis for demonstration"""
        import random
        
        return RealTimeAnalysis(
            session_id=session_id,
            timestamp=datetime.now(),
            speech_quality=random.uniform(0.7, 1.0),
            sentiment_score=random.uniform(0.6, 0.9),
            engagement_level=random.uniform(0.8, 1.0),
            technical_accuracy=random.uniform(0.7, 0.95),
            communication_clarity=random.uniform(0.75, 1.0),
            confidence_level=random.uniform(0.6, 0.9),
            bias_indicators=[],
            key_insights=[
                "Candidate demonstrates strong technical knowledge",
                "Clear communication style",
                "Shows enthusiasm for the role"
            ]
        )

    def generate_interview_report(self, session_id: str) -> Dict[str, Any]:
        """Generate comprehensive AI-powered interview report"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get session details
                    cur.execute(f"""
                        SELECT vis.*, ja.job_id, j.title as job_title,
                                u1.first_name as candidate_first_name, u1.last_name as candidate_last_name,
                                {user_display_name('candidate_display_name', 'u1')},
                                u2.first_name as interviewer_first_name, u2.last_name as interviewer_last_name,
                                {user_display_name('interviewer_display_name', 'u2')}
                        FROM video_interview_sessions vis
                        JOIN job_applications ja ON vis.application_id::text = ja.id::text
                        JOIN job_postings j ON (ja.job_id::text = j.id::text OR ja.job_id::text = j.jd_id::text)
                        JOIN users u1 ON vis.candidate_id::text = u1.id::text
                        JOIN users u2 ON vis.interviewer_id::text = u2.id::text
                        WHERE vis.id = %s OR vis.room_id = %s
                    """, (session_id, session_id))
                    
                    session = cur.fetchone()
                    if not session:
                        cur.execute(f"""
                            SELECT 
                                isched.interview_id as id,
                                isched.candidate_id,
                                isched.recruiter_id as interviewer_id,
                                isched.duration_minutes,
                                isched.interview_type,
                                isched.scheduled_date as scheduled_time,
                                isched.status,
                                jp.title as job_title,
                                u1.first_name as candidate_first_name, u1.last_name as candidate_last_name,
                                {user_display_name('candidate_display_name', 'u1')},
                                u2.first_name as interviewer_first_name, u2.last_name as interviewer_last_name,
                                {user_display_name('interviewer_display_name', 'u2')}
                            FROM interview_schedules isched
                            LEFT JOIN job_postings jp ON isched.jd_id = jp.jd_id::text
                            LEFT JOIN users u1 ON isched.candidate_id::text = u1.id::text
                            LEFT JOIN users u2 ON isched.recruiter_id::text = u2.id::text
                            WHERE isched.interview_id = %s OR isched.meeting_link LIKE %s
                        """, (session_id, f"%{session_id}%"))
                        session = cur.fetchone()
                        
                    if not session:
                        raise ValueError("Interview session not found")
                    
                    if session.get('status') != 'completed':
                        raise ValueError("Interview has not been completed yet")
                    
                    # Generate AI report using Qwen / DashScope
                    if _qwen_available:
                        report = self._generate_ai_report(session)
                    else:
                        report = self._generate_mock_report(session)
                    
                    # Store report in database
                    actual_session_id = session.get('interview_id') or session.get('id') or session_id
                    cur.execute("SELECT id FROM interview_reports WHERE session_id = %s", (actual_session_id,))
                    if cur.fetchone():
                        cur.execute("""
                            UPDATE interview_reports 
                            SET report_data = %s, generated_at = %s
                            WHERE session_id = %s
                        """, (json.dumps(report), datetime.now(), actual_session_id))
                    else:
                        cur.execute("""
                            INSERT INTO interview_reports (session_id, report_data, generated_at)
                            VALUES (%s, %s, %s)
                        """, (actual_session_id, json.dumps(report), datetime.now()))
                    
                    # Generate AI recommendations for candidate
                    self.generate_ai_recommendations(actual_session_id, session['candidate_id'], session)
                    
                    conn.commit()
                    return report
                    
        except ValueError as e:
            logger.error(f"Validation error generating interview report: {e}")
            raise
        except Exception as e:
            logger.error(f"Error generating interview report: {e}")
            return {'error': 'Failed to generate report'}

    def _generate_ai_report(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered interview report using Qwen / DashScope"""
        try:
            prompt = f"""
            Generate a comprehensive interview report for this UAE job interview:
            
            INTERVIEW DETAILS:
            - Position: {session['job_title']}
            - Candidate: {session['candidate_first_name']} {session['candidate_last_name']}
            - Interviewer: {session['interviewer_first_name']} {session['interviewer_last_name']}
            - Duration: {session['duration_minutes']} minutes
            - Type: {session['interview_type']}
            - Date: {session['scheduled_time']}
            
            Based on typical interview patterns, provide a comprehensive analysis:
            
            {{
                "overall_assessment": {{
                    "recommendation": "hire/no-hire/maybe",
                    "confidence_score": 0.0-1.0,
                    "overall_rating": 1-10,
                    "summary": "brief overall assessment"
                }},
                "technical_evaluation": {{
                    "technical_skills": 1-10,
                    "problem_solving": 1-10,
                    "experience_relevance": 1-10,
                    "technical_communication": 1-10,
                    "strengths": ["strength1", "strength2"],
                    "areas_for_improvement": ["area1", "area2"]
                }},
                "soft_skills_assessment": {{
                    "communication": 1-10,
                    "leadership_potential": 1-10,
                    "cultural_fit": 1-10,
                    "adaptability": 1-10,
                    "teamwork": 1-10,
                    "motivation": 1-10
                }},
                "uae_specific_evaluation": {{
                    "cultural_awareness": 1-10,
                    "emiratization_value": 1-10,
                    "local_market_understanding": 1-10,
                    "arabic_proficiency": "excellent/good/basic/none",
                    "uae_experience": 1-10
                }},
                "interview_quality": {{
                    "question_quality": 1-10,
                    "interviewer_bias_indicators": ["indicator1", "indicator2"],
                    "process_fairness": 1-10,
                    "improvement_suggestions": ["suggestion1", "suggestion2"]
                }},
                "next_steps": {{
                    "recommended_actions": ["action1", "action2"],
                    "additional_assessments": ["assessment1", "assessment2"],
                    "timeline_suggestions": "immediate/within_week/needs_discussion"
                }},
                "development_insights": {{
                    "career_growth_potential": 1-10,
                    "mentorship_needs": ["need1", "need2"],
                    "skill_development_priorities": ["skill1", "skill2"],
                    "leadership_trajectory": "high/medium/low"
                }}
            }}
            
            Focus on UAE market context, Emiratization benefits, and objective assessment.
            """
            
            messages = [

            
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON. No markdown, no code fences."},

            
                {"role": "user", "content": prompt},

            
            ]

            
            response = chat_completion(task_type="interview", messages=messages, response_format={"type": "json_object"})
            
            try:
                return response  # chat_completion returns parsed JSON directly
            except json.JSONDecodeError:
                return self._generate_mock_report(session)
                
        except Exception as e:
            logger.error(f"Error generating AI report: {e}")
            return self._generate_mock_report(session)

    def _generate_mock_report(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock interview report for demonstration"""
        return {
            "overall_assessment": {
                "recommendation": "hire",
                "confidence_score": 0.85,
                "overall_rating": 8,
                "summary": "Strong candidate with excellent technical skills and good cultural fit"
            },
            "technical_evaluation": {
                "technical_skills": 8,
                "problem_solving": 9,
                "experience_relevance": 7,
                "technical_communication": 8,
                "strengths": ["Strong problem-solving abilities", "Clear technical communication"],
                "areas_for_improvement": ["Could benefit from more UAE market experience"]
            },
            "soft_skills_assessment": {
                "communication": 8,
                "leadership_potential": 7,
                "cultural_fit": 9,
                "adaptability": 8,
                "teamwork": 8,
                "motivation": 9
            },
            "uae_specific_evaluation": {
                "cultural_awareness": 8,
                "emiratization_value": 10,
                "local_market_understanding": 7,
                "arabic_proficiency": "good",
                "uae_experience": 6
            },
            "interview_quality": {
                "question_quality": 8,
                "interviewer_bias_indicators": [],
                "process_fairness": 9,
                "improvement_suggestions": ["Consider adding more technical deep-dive questions"]
            },
            "next_steps": {
                "recommended_actions": ["Proceed to final interview", "Check references"],
                "additional_assessments": ["Technical coding assessment"],
                "timeline_suggestions": "within_week"
            },
            "development_insights": {
                "career_growth_potential": 8,
                "mentorship_needs": ["UAE market orientation", "Leadership development"],
                "skill_development_priorities": ["Advanced technical skills", "Project management"],
                "leadership_trajectory": "high"
            }
        }

# REMOVED: get_interview_sessions was dead code — shadowed by
# REMOVED: interview_sessions_api.list_sessions (registered first via blueprint).


    def seed_recommendation_resources(self):
        """Seed courses and additional mentors if tables are empty"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Check courses count
                    cur.execute("SELECT COUNT(*) FROM courses")
                    if cur.fetchone()[0] == 0:
                        logger.info("Seeding courses for recommendations...")
                        courses_to_seed = [
                            ('c0000001-c000-c000-c000-c00000000001', 'Introduction to Software Engineering', 'Learn the basics of Python, algorithms, and software development methodologies.', 4, 'technology', 'en'),
                            ('c0000002-c000-c000-c000-c00000000002', 'UAE Labour Law and Professional Ethics', 'Understand the regulatory frameworks, worker rights, and workplace etiquette in the UAE.', 2, 'legal', 'en'),
                            ('c0000003-c000-c000-c000-c00000000003', 'AI and Machine Learning Foundations', 'A comprehensive overview of deep learning, data science, and AI systems.', 6, 'technology', 'en'),
                            ('c0000004-c000-c000-c000-c00000000004', 'Effective Business Communication', 'Master presentation skills, email writing, and professional communication standards.', 3, 'business', 'en')
                        ]
                        for cid, name, desc, weeks, area, lang in courses_to_seed:
                            cur.execute("""
                                INSERT INTO courses (id, course_name, course_description, duration_weeks, subject_area, language, is_active, is_published)
                                VALUES (%s, %s, %s, %s, %s, %s, true, true)
                                ON CONFLICT DO NOTHING
                            """, (cid, name, desc, weeks, area, lang))
                        conn.commit()
                        logger.info("Seeding courses complete.")
                        
                    # Check if we need more mentors in mentor_profiles
                    cur.execute("SELECT COUNT(*) FROM mentor_profiles")
                    if cur.fetchone()[0] <= 1:
                        logger.info("Seeding additional mentors for recommendations...")
                        cur.execute("SELECT id, full_name FROM users WHERE role = 'mentor' LIMIT 5")
                        mentors = cur.fetchall()
                        if not mentors:
                            dummy_mentors = [
                                ('784000000000910', 'Fatima Al Mansoori', 'fatima.mentor@ehrdc.gov.ae', 'mentor'),
                                ('784000000000920', 'Zayed Al Nahyan', 'zayed.mentor@ehrdc.gov.ae', 'mentor')
                            ]
                            for uid, name, email, role in dummy_mentors:
                                cur.execute("""
                                    INSERT INTO users (id, full_name, email, role, password_hash)
                                    VALUES (%s, %s, %s, %s, 'pbkdf2:sha256:dummy')
                                    ON CONFLICT (id) DO NOTHING
                                """, (uid, name, email, role))
                            conn.commit()
                            cur.execute("SELECT id, full_name FROM users WHERE role = 'mentor' LIMIT 5")
                            mentors = cur.fetchall()
                            
                        for mid, mname in mentors:
                            mp_id = str(uuid.uuid4())
                            prof_title = "Senior HR Consultant" if "Fatima" in mname else "Executive Career Coach"
                            industry = "Human Resources" if "Fatima" in mname else "Leadership Development"
                            cur.execute("""
                                INSERT INTO mentor_profiles (id, user_id, professional_title, industry, is_available, is_verified, expertise_areas)
                                VALUES (%s, %s, %s, %s, true, true, '["HR", "Career Guidance"]')
                                ON CONFLICT DO NOTHING
                            """, (mp_id, mid, prof_title, industry))
                        conn.commit()
                        logger.info("Seeding mentors complete.")
        except Exception as e:
            logger.error(f"Error seeding recommendation resources: {e}")

    def generate_ai_recommendations(self, session_id: str, candidate_id: str, session: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI matched recommendations for the candidate"""
        self.seed_recommendation_resources()
        
        articles = []
        courses = []
        mentors = []
        
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT id, title_en, title_ar, category FROM knowledge_base_articles LIMIT 10")
                    articles = [dict(r) for r in cur.fetchall()]
                    
                    cur.execute("SELECT id, course_name, course_description FROM courses WHERE is_active = true LIMIT 10")
                    courses = [dict(r) for r in cur.fetchall()]
                    
                    cur.execute("""
                        SELECT mp.id, mp.user_id, u.full_name, mp.professional_title, mp.expertise_areas 
                        FROM mentor_profiles mp 
                        JOIN users u ON mp.user_id::text = u.id::text
                        WHERE mp.is_available = true LIMIT 10
                    """)
                    mentors = [dict(r) for r in cur.fetchall()]
        except Exception as db_err:
            logger.error(f"Error fetching resources for recommendations: {db_err}")
            
        articles_str = json.dumps(articles, indent=2)
        courses_str = json.dumps(courses, indent=2)
        mentors_str = json.dumps(mentors, indent=2)
        
        fallback_recs = {
            "recommended_articles": [{"id": articles[0]["id"], "title": articles[0]["title_en"]} if articles else {}],
            "recommended_trainings": [{"id": str(courses[0]["id"]), "course_name": courses[0]["course_name"]} if courses else {}],
            "recommended_mentors": [{"id": mentors[0]["user_id"], "full_name": mentors[0]["full_name"], "title": mentors[0]["professional_title"]} if mentors else {}]
        }
        
        if not _qwen_available:
            logger.info("Qwen not available, returning fallback recommendations")
            self._save_recommendations(session_id, candidate_id, fallback_recs)
            return fallback_recs
            
        try:
            prompt = f"""
            You are an AI-powered Career Placement Advisor in the UAE. 
            A candidate has just finished a video interview for the position: {session.get('job_title', 'Software Engineer')}.
            
            Select the most relevant growth resources for this candidate from the platform databases below.
            You must choose ONLY from the resources provided. Match them based on the candidate's potential weaknesses or preparation needs.
            
            AVAILABLE ARTICLES:
            {articles_str}
            
            AVAILABLE TRAINING COURSES:
            {courses_str}
            
            AVAILABLE MENTORS:
            {mentors_str}
            
            Return a JSON object containing selected resources. Match the schema exactly:
            {{
                "recommended_articles": [
                    {{ "id": <selected article id>, "title": "<selected article title>" }}
                ],
                "recommended_trainings": [
                    {{ "id": "<selected course id>", "course_name": "<selected course name>" }}
                ],
                "recommended_mentors": [
                    {{ "id": "<selected mentor user_id>", "full_name": "<selected mentor name>", "title": "<selected mentor title>" }}
                ]
            }}
            """
            
            messages = [
                {"role": "system", "content": "You are a professional career guidance assistant. Return ONLY raw, valid JSON matching the requested schema. Do not write text outside the JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = chat_completion(task_type="interview", messages=messages, response_format={"type": "json_object"})
            
            self._save_recommendations(session_id, candidate_id, response)
            return response
            
        except Exception as e:
            logger.error(f"Error generating AI recommendations: {e}")
            self._save_recommendations(session_id, candidate_id, fallback_recs)
            return fallback_recs

    def _save_recommendations(self, session_id: str, candidate_id: str, recs: Dict[str, Any]):
        """Save recommendations to candidate_interview_recommendations table"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    recommended_articles = json.dumps(recs.get("recommended_articles", []))
                    recommended_trainings = json.dumps(recs.get("recommended_trainings", []))
                    recommended_mentors = json.dumps(recs.get("recommended_mentors", []))
                    
                    cur.execute("""
                        INSERT INTO candidate_interview_recommendations (
                            session_id, candidate_id, recommended_articles, recommended_trainings, recommended_mentors
                        ) VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (session_id) DO UPDATE SET
                            recommended_articles = EXCLUDED.recommended_articles,
                            recommended_trainings = EXCLUDED.recommended_trainings,
                            recommended_mentors = EXCLUDED.recommended_mentors
                    """, (session_id, candidate_id, recommended_articles, recommended_trainings, recommended_mentors))
                    conn.commit()
                    logger.info(f"Saved recommendations for session {session_id}")
        except Exception as e:
            logger.error(f"Error saving recommendations to DB: {e}")

    def get_session_recordings(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """Get secure access to session recordings"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Verify user has access to this session
                    cur.execute("""
                        SELECT * FROM video_interview_sessions 
                        WHERE (id = %s OR room_id = %s) AND (interviewer_id = %s OR candidate_id = %s)
                    """, (session_id, session_id, user_id, user_id))
                    
                    session = cur.fetchone()
                    if not session:
                        # Fallback for interview_schedules
                        cur.execute("""
                            SELECT 
                                interview_id as id,
                                recruiter_id as interviewer_id,
                                candidate_id,
                                NULL as recording_id
                            FROM interview_schedules 
                            WHERE (interview_id = %s OR meeting_link LIKE %s) AND (recruiter_id = %s OR candidate_id = %s)
                        """, (session_id, f"%{session_id}%", user_id, user_id))
                        session = cur.fetchone()
                        
                    if not session:
                        raise ValueError("Session not found or access denied")
                    
                    # Generate secure access token (24-hour expiry)
                    access_token = self._generate_secure_access_token(session_id, user_id)
                    
                    return {
                        'session_id': session_id,
                        'recording_available': session['recording_id'] is not None,
                        'access_token': access_token,
                        'expires_at': (datetime.now() + timedelta(hours=24)).isoformat(),
                        'streaming_url': f"/api/video/stream/{session_id}?token={access_token}" if session['recording_id'] else None
                    }
                    
        except Exception as e:
            logger.error(f"Error getting session recordings: {e}")
            return {'error': 'Failed to get recordings'}

    def _generate_secure_access_token(self, session_id: str, user_id: str) -> str:
        """Generate secure access token for video streaming"""
        try:
            payload = {
                'session_id': session_id,
                'user_id': user_id,
                'expires': int(time.time()) + 24 * 3600  # 24 hours
            }
            
            # Create HMAC signature
            message = json.dumps(payload, sort_keys=True)
            signature = hmac.new(
                self.encryption_key.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Encode token
            token = base64.b64encode(
                json.dumps({**payload, 'signature': signature}).encode()
            ).decode()
            
            return token
            
        except Exception as e:
            logger.error(f"Error generating access token: {e}")
            return "invalid_token"

# Initialize the Video Interview Engine
video_interview_engine = VideoInterviewEngine()
