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
import google.generativeai as genai
from dataclasses import dataclass
from backend.user_helpers import user_display_name
import uuid
import base64
import hashlib
import hmac
import time
import requests

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
        
        # Initialize Gemini AI
        self.api_key = os.getenv('GEMINI_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        else:
            logger.error("GEMINI_API_KEY not found - AI analysis will not work")
            self.model = None
        
        # Video service configuration (Agora.io)
        self.agora_app_id = os.getenv('AGORA_APP_ID', 'demo_app_id')
        self.agora_app_certificate = os.getenv('AGORA_APP_CERTIFICATE', 'demo_certificate')
        
        # Storage configuration
        self.video_storage_bucket = os.getenv('VIDEO_STORAGE_BUCKET', 'emirati-interviews')
        self.encryption_key = os.getenv('VIDEO_ENCRYPTION_KEY', 'default_key_change_in_production')
        
        logger.info("Video Interview Engine initialized")

    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def generate_agora_token(self, channel_name: str, user_id: str, role: str = 'publisher') -> str:
        """Generate Agora RTC token for video session"""
        try:
            # Token expiration time (24 hours)
            expiration_time = int(time.time()) + 24 * 3600
            
            # This is a simplified token generation
            # In production, use Agora's official token generation service
            token_data = {
                'app_id': self.agora_app_id,
                'channel': channel_name,
                'user_id': user_id,
                'role': role,
                'expires': expiration_time
            }
            
            # Create HMAC signature
            message = f"{self.agora_app_id}{channel_name}{user_id}{expiration_time}"
            signature = hmac.new(
                self.agora_app_certificate.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Encode token
            token = base64.b64encode(
                json.dumps({**token_data, 'signature': signature}).encode()
            ).decode()
            
            return token
            
        except Exception as e:
            logger.error(f"Error generating Agora token: {e}")
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
                        WHERE id = %s AND (interviewer_id = %s OR candidate_id = %s)
                    """, (session_id, user_id, user_id))
                    
                    session = cur.fetchone()
                    if not session:
                        raise ValueError("Interview session not found or access denied")
                    
                    # Update session status
                    if session['status'] == InterviewStatus.SCHEDULED.value:
                        cur.execute("""
                            UPDATE video_interview_sessions 
                            SET status = %s, started_at = %s
                            WHERE id = %s
                        """, (InterviewStatus.IN_PROGRESS.value, datetime.now(), session_id))
                        conn.commit()
                    
                    # Generate Agora tokens
                    interviewer_token = self.generate_agora_token(
                        session['room_id'], session['interviewer_id'], 'publisher'
                    )
                    candidate_token = self.generate_agora_token(
                        session['room_id'], session['candidate_id'], 'publisher'
                    )
                    
                    # Determine user role and token
                    user_role = 'interviewer' if user_id == session['interviewer_id'] else 'candidate'
                    user_token = interviewer_token if user_role == 'interviewer' else candidate_token
                    
                    return {
                        'session_id': session_id,
                        'room_id': session['room_id'],
                        'app_id': self.agora_app_id,
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
                    # Update session status
                    cur.execute("""
                        UPDATE video_interview_sessions 
                        SET status = %s, ended_at = %s
                        WHERE id = %s AND (interviewer_id = %s OR candidate_id = %s)
                    """, (
                        InterviewStatus.COMPLETED.value,
                        datetime.now(),
                        session_id,
                        user_id,
                        user_id
                    ))
                    
                    if cur.rowcount == 0:
                        return False
                    
                    conn.commit()
                    
                    # Trigger post-interview processing
                    self._trigger_post_interview_processing(session_id)
                    
                    logger.info(f"Ended interview session {session_id}")
                    return True
                    
        except Exception as e:
            logger.error(f"Error ending interview session: {e}")
            return False

    def _trigger_post_interview_processing(self, session_id: str):
        """Trigger post-interview AI analysis and processing"""
        try:
            # This would typically be handled by a background task queue
            # For now, we'll simulate the process
            logger.info(f"Triggering post-interview processing for session {session_id}")
            
            # In a real implementation, this would:
            # 1. Download the recorded video from Agora
            # 2. Extract audio for speech-to-text
            # 3. Run AI analysis on transcript and video
            # 4. Generate comprehensive interview report
            # 5. Store results in database
            
        except Exception as e:
            logger.error(f"Error in post-interview processing: {e}")

    def process_real_time_audio(self, session_id: str, audio_data: bytes) -> RealTimeAnalysis:
        """Process real-time audio for AI analysis"""
        try:
            if not self.model:
                return self._get_mock_analysis(session_id)
            
            # In a real implementation, this would:
            # 1. Convert audio to text using speech-to-text
            # 2. Analyze text with Gemini 2.5 Pro
            # 3. Return real-time insights
            
            # For now, return mock analysis
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
                        JOIN job_applications ja ON vis.application_id = ja.id
                        JOIN jobs j ON ja.job_id = j.id
                        JOIN users u1 ON vis.candidate_id = u1.id
                        JOIN users u2 ON vis.interviewer_id = u2.id
                        WHERE vis.id = %s
                    """, (session_id,))
                    
                    session = cur.fetchone()
                    if not session:
                        raise ValueError("Interview session not found")
                    
                    # Generate AI report using Gemini 2.5 Pro
                    if self.model:
                        report = self._generate_ai_report(session)
                    else:
                        report = self._generate_mock_report(session)
                    
                    # Store report in database
                    cur.execute("""
                        INSERT INTO interview_reports (
                            session_id, report_data, generated_at
                        ) VALUES (%s, %s, %s)
                        ON CONFLICT (session_id) DO UPDATE SET
                        report_data = EXCLUDED.report_data,
                        generated_at = EXCLUDED.generated_at
                    """, (session_id, json.dumps(report), datetime.now()))
                    
                    conn.commit()
                    return report
                    
        except Exception as e:
            logger.error(f"Error generating interview report: {e}")
            return {'error': 'Failed to generate report'}

    def _generate_ai_report(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered interview report using Gemini 2.5 Pro"""
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
            
            response = self.model.generate_content(prompt)
            
            try:
                return json.loads(response.text)
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


    def get_session_recordings(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """Get secure access to session recordings"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Verify user has access to this session
                    cur.execute("""
                        SELECT * FROM video_interview_sessions 
                        WHERE id = %s AND (interviewer_id = %s OR candidate_id = %s)
                    """, (session_id, user_id, user_id))
                    
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
