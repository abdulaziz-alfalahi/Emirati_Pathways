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
        # ASR endpoints (Granite Speech). Comma-separated for HA failover across
        # the GPU VMs (e.g. http://10.228.145.194:8001,http://10.228.145.195:8001).
        # Defaults to localhost for local dev.
        self.granite_speech_urls = [
            u.strip() for u in os.getenv('GRANITE_SPEECH_URL', 'http://localhost:8001').split(',') if u.strip()
        ]
        self.granite_speech_url = self.granite_speech_urls[0] if self.granite_speech_urls else 'http://localhost:8001'
        
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

    def _healthy_asr_url(self):
        """Return the first reachable Granite ASR endpoint (HA failover), or None."""
        for url in self.granite_speech_urls:
            try:
                h = requests.get(f"{url}/health", timeout=2)
                if h.status_code == 200 and h.json().get('engine', {}).get('loaded'):
                    return url
            except requests.RequestException:
                continue
        return None

    def process_real_time_audio(self, session_id: str, audio_data: bytes) -> RealTimeAnalysis:
        """Real-time audio flows through the Granite ASR WebSocket
        (ws://<granite>/ws/transcribe/<session_id>). This REST shim only reports
        availability; it never fabricates metrics."""
        try:
            if self._healthy_asr_url():
                logger.debug("Granite ASR available — audio handled via WebSocket")
            else:
                logger.debug("Granite ASR not reachable")
            return self._unavailable_realtime_analysis(session_id)
        except Exception as e:
            logger.error(f"Error processing real-time audio: {e}")
            return self._unavailable_realtime_analysis(session_id)

    def _unavailable_realtime_analysis(self, session_id: str) -> RealTimeAnalysis:
        """Neutral placeholder when live analysis isn't connected — NEVER fabricated
        scores. Real metrics come from the Granite ASR WebSocket path."""
        return RealTimeAnalysis(
            session_id=session_id,
            timestamp=datetime.now(),
            speech_quality=0.0, sentiment_score=0.0, engagement_level=0.0,
            technical_accuracy=0.0, communication_clarity=0.0, confidence_level=0.0,
            bias_indicators=[],
            key_insights=["Real-time analysis unavailable — speech-to-text (Granite ASR) is not connected."],
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
                    
                    # Honest analysis: only score a REAL transcript. Until speech-to-text
                    # produces one, return an explicit "pending" report — never fabricate
                    # scores from the job title alone.
                    actual_session_id = session.get('interview_id') or session.get('id') or session_id
                    transcript = self._fetch_transcript(cur, actual_session_id)
                    if transcript and _qwen_available:
                        report = self._generate_ai_report(session, transcript)
                    else:
                        report = self._pending_report(session, has_transcript=bool(transcript))

                    # Store report in database
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

    def _fetch_transcript(self, cur, interview_id):
        """Return the REAL interview transcript for a session, or None.

        Reads the per-segment rows the LiveKit agent writes to interview_transcripts
        (joined to interview_recordings by interview_id). Fail-neutral: any missing
        table/column yields None (-> honest 'pending' report), and a SAVEPOINT keeps
        a missing-table error from aborting the outer transaction.
        """
        try:
            cur.execute("SAVEPOINT sp_transcript")
            cur.execute("""
                SELECT t.speaker, t.text, t.competencies_detected
                FROM interview_transcripts t
                JOIN interview_recordings r ON r.id = t.recording_id
                WHERE r.interview_id = %s
                ORDER BY t.segment_index
            """, (str(interview_id),))
            rows = cur.fetchall()
            cur.execute("RELEASE SAVEPOINT sp_transcript")
        except Exception:
            try:
                cur.execute("ROLLBACK TO SAVEPOINT sp_transcript")
            except Exception:
                pass
            return None
        if not rows:
            return None
        lines, competencies = [], set()
        for r in rows:
            speaker = r.get('speaker') or 'Speaker'
            text = (r.get('text') or '').strip()
            if text:
                lines.append(f"{speaker}: {text}")
            comp = r.get('competencies_detected')
            if isinstance(comp, list):
                competencies.update(c for c in comp if isinstance(c, str))
        if not lines:
            return None
        return {"text": "\n".join(lines), "segments": len(rows), "competencies": sorted(competencies)}

    def _pending_report(self, session: Dict[str, Any], has_transcript: bool = False) -> Dict[str, Any]:
        """Honest report when automated analysis can't be produced yet — contains
        NO fabricated scores. Used when there is no transcript (speech-to-text has
        not run) or the AI analyzer is unavailable."""
        reason = ("The interview transcript is available but the AI analyzer is offline."
                  if has_transcript else
                  "No interview transcript is available yet — automated analysis runs "
                  "after the recording is transcribed by speech-to-text (Granite ASR).")
        return {
            "status": "analysis_pending",
            "analysis_source": "none",
            "summary": f"Automated analysis pending. {reason} Please review the recording directly.",
            "strengths": [],
            "improvements": [],
            "recommendations": [],
            "overall_assessment": {
                "recommendation": None,
                "confidence_score": None,
                "overall_rating": None,
                "summary": "Pending automated analysis.",
            },
        }

    def _generate_ai_report(self, session: Dict[str, Any], transcript: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the REAL interview transcript with Qwen and produce a report
        grounded in transcript evidence. Falls back to an honest 'pending' report
        on any error — never fabricates from the job title."""
        try:
            transcript_text = (transcript.get("text") or "")[:12000]
            detected = ", ".join(transcript.get("competencies") or []) or "none detected"
            prompt = f"""
            You are assessing a REAL UAE job interview from its transcript. Base every
            judgement ONLY on what the transcript actually shows — do not invent facts.

            Position: {session.get('job_title')}
            Competencies auto-detected in the transcript: {detected}

            TRANSCRIPT:
            {transcript_text}

            Return ONLY valid JSON with this exact shape:
            {{
              "summary": "2-3 sentence evidence-based summary grounded in the transcript",
              "strengths": ["evidence-based strength", "..."],
              "improvements": ["evidence-based gap / area to improve", "..."],
              "recommendations": ["specific next step or platform resource to bridge a gap", "..."],
              "overall_assessment": {{
                "recommendation": "hire" | "maybe" | "no-hire",
                "confidence_score": 0.0,
                "overall_rating": 1,
                "summary": "one-line rationale grounded in the transcript"
              }},
              "competency_evaluation": {{"competency": 1}}
            }}
            If the transcript is too short or empty to judge fairly, say so in "summary"
            and use null for the ratings. Never guess.
            """
            messages = [
                {"role": "system", "content": "You assess interviews strictly from transcript evidence. Return ONLY raw, valid JSON. No markdown, no code fences."},
                {"role": "user", "content": prompt},
            ]
            report = chat_completion(task_type="interview", messages=messages, response_format={"type": "json_object"})
            if not isinstance(report, dict) or not report.get("summary"):
                return self._pending_report(session, has_transcript=True)
            report["status"] = "analyzed"
            report["analysis_source"] = "transcript"
            report["transcript_segments"] = transcript.get("segments")
            return report
        except Exception as e:
            logger.error(f"Error generating transcript-grounded AI report: {e}")
            return self._pending_report(session, has_transcript=True)

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
        """Recommend REAL, gap-driven resources to bridge the candidate's skill gaps.

        Uses the platform's SkillGraphEngine (skill-gap analysis) -> RecommendationEngine
        (real training/mentor/certification matches from training_programs / mentor
        tables). Honest-empty if nothing matches or data is sparse — never the old
        "first 10 rows + LLM guess". Grounded in the candidate's actual skill gaps.
        """
        recs_out = {"recommended_articles": [], "recommended_trainings": [], "recommended_mentors": []}
        try:
            try:
                from backend.skill_graph_engine import SkillGraphEngine
                from backend.recommendation_engine import RecommendationEngine
            except ImportError:
                from skill_graph_engine import SkillGraphEngine
                from recommendation_engine import RecommendationEngine
            with self.get_db_connection() as conn:
                sg = SkillGraphEngine(db_connection=conn)
                re_engine = RecommendationEngine(db_connection=conn, skill_graph=sg)
                gap = sg.analyze_skill_gaps(candidate_id)
                result = re_engine.generate_recommendations(candidate_id, gap_analysis=gap)
                for rec in (result.get("recommendations") or []):
                    rtype = rec.get("type")
                    item = {
                        "title": rec.get("title"),
                        "title_ar": rec.get("title_ar"),
                        "description": rec.get("description"),
                        "action_url": rec.get("action_url"),
                        "gap_skill": rec.get("gap_skill"),
                        "priority": rec.get("priority"),
                    }
                    if rtype in ("training", "certification"):
                        recs_out["recommended_trainings"].append(item)
                    elif rtype == "mentor":
                        recs_out["recommended_mentors"].append({**item, "full_name": rec.get("title")})
                    elif rtype == "advisory":
                        recs_out["recommended_articles"].append(item)
        except Exception as e:
            logger.error(f"Gap-based recommendation error: {e}")
        # Bound each list to a sensible number.
        for k in recs_out:
            recs_out[k] = recs_out[k][:5]
        self._save_recommendations(session_id, candidate_id, recs_out)
        return recs_out

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
