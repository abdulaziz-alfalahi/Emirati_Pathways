
import logging
import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import secrets
from backend.user_helpers import user_display_name

# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    _qwen_available = True
except ImportError:
    _qwen_available = False

logger = logging.getLogger(__name__)

class InterviewService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.upload_folder = os.path.join(os.getcwd(), 'uploads', 'interviews')
        os.makedirs(self.upload_folder, exist_ok=True)
        
        # Qwen client is lazy-loaded via qwen_client module; no init needed
        if _qwen_available:
            self.logger.info("✅ Interview service AI ready (Qwen / DashScope)")
        else:
            self.logger.warning("⚠️ Qwen client not available. AI analysis disabled.")

    def _get_db_connection(self):
        try:
            return psycopg2.connect(
                dbname=os.getenv('DB_NAME', 'emirati_journey'),
                user=os.getenv('DB_USER', 'emirati_user'),
                password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
                host=os.getenv('DB_HOST', 'localhost'),
                port=int(os.getenv('DB_PORT', 5432))
            )
        except Exception as e:
            self.logger.error(f"Failed to connect to DB: {e}")
            raise

    def ensure_tables_exist(self):
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                # interview_sessions consolidated into interview_schedules (migration 004/005)

                # Recordings Metadata Table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS interview_recordings (
                        id UUID PRIMARY KEY,
                        session_id VARCHAR(100),
                        user_id INTEGER,
                        file_path TEXT,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                conn.commit()
                self.logger.info("Checked/Created interview tables.")
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error ensuring interview tables: {e}")
        finally:
            conn.close()

    def create_session(self, application_id, recruiter_id, candidate_id, scheduled_at: datetime, title: str = None, attendees: List[str] = None) -> Dict:
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                session_id = str(uuid.uuid4())
                guest_token = secrets.token_urlsafe(16) # Secure random token
                if attendees is None:
                    attendees = []

                # scheduled_at (timestamp) -> scheduled_date (DATE) + scheduled_time (TIME)
                scheduled_dt = datetime.fromisoformat(scheduled_at) if isinstance(scheduled_at, str) else scheduled_at
                scheduled_date = scheduled_dt.date() if scheduled_dt else None
                scheduled_time = scheduled_dt.time() if scheduled_dt else None
                interview_type = 'video'  # NOT NULL on interview_schedules; default

                cur.execute("""
                    INSERT INTO interview_schedules (interview_id, application_id, recruiter_id, candidate_id, interview_type, scheduled_date, scheduled_time, status, guest_token, interview_title, interviewers)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'scheduled', %s, %s, %s)
                    RETURNING *, (scheduled_date + scheduled_time) AS scheduled_at
                """, (session_id, str(application_id) if application_id else None, recruiter_id, str(candidate_id) if candidate_id else None, interview_type, scheduled_date, scheduled_time, guest_token, title, json.dumps(attendees)))
                session = cur.fetchone()
                conn.commit()
                return self._serialize_session(session)
        finally:
            conn.close()

    def get_session(self, session_id: str) -> Optional[Dict]:
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT *, (scheduled_date + scheduled_time) AS scheduled_at FROM interview_schedules WHERE interview_id = %s", (session_id,))
                session = cur.fetchone()
                if session:
                    return self._serialize_session(session)
                return None
        finally:
            conn.close()
            
    def get_session_by_guest_token(self, token: str) -> Optional[Dict]:
        """Fetch session for guest access (no auth required)"""
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"""
                    SELECT s.*, (s.scheduled_date + s.scheduled_time) AS scheduled_at,
                           u_rec.first_name as recruiter_first_name, u_rec.last_name as recruiter_last_name,
                           {user_display_name('recruiter_display_name', 'u_rec')}
                    FROM interview_schedules s
                    LEFT JOIN users u_rec ON s.recruiter_id = u_rec.id
                    WHERE s.guest_token = %s
                """, (token,))
                session = cur.fetchone()
                if session:
                    return self._serialize_session(dict(session))
                return None
        finally:
            conn.close()
            
    def update_session(self, session_id: str, data: Dict) -> Optional[Dict]:
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                fields = []
                values = []
                if 'scheduled_at' in data:
                    sched = data['scheduled_at']
                    sched_dt = datetime.fromisoformat(sched) if isinstance(sched, str) else sched
                    fields.append("scheduled_date = %s")
                    values.append(sched_dt.date() if sched_dt else None)
                    fields.append("scheduled_time = %s")
                    values.append(sched_dt.time() if sched_dt else None)
                if 'title' in data:
                    fields.append("interview_title = %s")
                    values.append(data['title'])

                if not fields:
                    return None

                values.append(session_id)
                query = f"UPDATE interview_schedules SET {', '.join(fields)} WHERE interview_id = %s RETURNING *, (scheduled_date + scheduled_time) AS scheduled_at"
                cur.execute(query, tuple(values))
                session = cur.fetchone()
                conn.commit()
                return self._serialize_session(session) if session else None
        finally:
            conn.close()

    def cancel_session(self, session_id: str, reason: str = None) -> bool:
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE interview_schedules
                    SET status = 'cancelled', cancellation_reason = %s
                    WHERE interview_id = %s
                """, (reason, session_id))
                conn.commit()
                return True
        finally:
            conn.close()

    def get_user_sessions(self, user_id: str, role: str) -> List[Dict]:
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if role == 'recruiter':
                    cur.execute(f"""
                        SELECT s.*, (s.scheduled_date + s.scheduled_time) AS scheduled_at,
                               u.first_name as candidate_first_name,
                               u.last_name as candidate_last_name,
                               {user_display_name('candidate_display_name')},
                               u.email as candidate_email
                        FROM interview_schedules s
                        LEFT JOIN users u ON s.candidate_id = u.id::text
                        WHERE s.recruiter_id = %s
                        ORDER BY (s.scheduled_date + s.scheduled_time) DESC
                    """, (user_id,))
                else:
                    cur.execute(f"""
                        SELECT s.*, (s.scheduled_date + s.scheduled_time) AS scheduled_at,
                               u.first_name as recruiter_first_name,
                               u.last_name as recruiter_last_name,
                               {user_display_name('recruiter_display_name')},
                               u.email as recruiter_email
                        FROM interview_schedules s
                        LEFT JOIN users u ON s.recruiter_id = u.id
                        WHERE s.candidate_id = %s
                        ORDER BY (s.scheduled_date + s.scheduled_time) DESC
                    """, (user_id,))
                
                sessions = cur.fetchall()
                return [self._serialize_session(dict(s)) for s in sessions]
        finally:
            conn.close()

    def get_all_sessions(self) -> List[Dict]:
        """Fetch all sessions for Admin dashboard (ordered by scheduled_at desc)"""
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"""
                    SELECT s.*, (s.scheduled_date + s.scheduled_time) AS scheduled_at,
                           u_rec.first_name as recruiter_first_name, u_rec.last_name as recruiter_last_name,
                           {user_display_name('recruiter_display_name', 'u_rec')},
                           u_can.first_name as candidate_first_name, u_can.last_name as candidate_last_name,
                           {user_display_name('candidate_display_name', 'u_can')}
                    FROM interview_schedules s
                    LEFT JOIN users u_rec ON s.recruiter_id = u_rec.id
                    LEFT JOIN users u_can ON s.candidate_id::text = u_can.id::text
                    ORDER BY (s.scheduled_date + s.scheduled_time) DESC
                """)
                sessions = cur.fetchall()
                return [self._serialize_session(dict(s)) for s in sessions]
        finally:
            conn.close()

    def update_status(self, session_id: str, status: str):
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE interview_schedules SET status = %s WHERE interview_id = %s", (status, session_id))
                conn.commit()
        finally:
            conn.close()

    def save_recording_chunk(self, session_id: str, user_id: str, chunk_data: bytes, chunk_index: int, is_final: bool):
        # Initial chunk logic: Save as separate parts to avoid write conflicts
        temp_dir = os.path.join(self.upload_folder, 'temp', session_id)
        os.makedirs(temp_dir, exist_ok=True)

        # Handle Empty "Stop" Chunk (often sent by browsers as final)
        if len(chunk_data) > 0:
            chunk_filename = f"{chunk_index:06d}_{user_id}.part"
            chunk_path = os.path.join(temp_dir, chunk_filename)
            with open(chunk_path, 'wb') as f:
                f.write(chunk_data)

        if is_final:
            # Assembly Phase
            final_filename = f"{session_id}_{user_id}.webm"
            final_path = os.path.join(self.upload_folder, final_filename)
            
            # Find all parts for this user
            parts = sorted([p for p in os.listdir(temp_dir) if p.endswith(f"_{user_id}.part")])
            
            with open(final_path, 'wb') as outfile:
                for part in parts:
                    part_path = os.path.join(temp_dir, part)
                    with open(part_path, 'rb') as infile:
                        outfile.write(infile.read())
                    # Optional: Delete part after merging
                    # os.remove(part_path)
            
            # Cleanup temp dir if empty? Or keep for debugging.
            
            self.logger.info(f"Recording assembled: {final_path}")
            self._register_recording(session_id, user_id, final_path)
            
            # Trigger analysis (Async recommended, sync for now)
            # self.analyze_interview(session_id, final_path)
            
            return final_path
        
        return None

    def _register_recording(self, session_id, user_id, file_path):
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                rec_id = str(uuid.uuid4())
                # Normalize path for DB (store relative to uploads or full? Relative is better)
                rel_path = os.path.relpath(file_path, os.getcwd())
                
                cur.execute("""
                    INSERT INTO interview_recordings (id, session_id, user_id, file_path)
                    VALUES (%s, %s, %s, %s)
                """, (rec_id, session_id, user_id, rel_path))
                conn.commit()
        except Exception as e:
            self.logger.error(f"Failed to register recording: {e}")
        finally:
            conn.close()

    def _get_transcript_for_session(self, session_id: str) -> Optional[str]:
        """
        Fetch Granite ASR transcript segments from the database.
        Returns concatenated transcript text or None if unavailable.
        """
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Try interview_transcripts table (LiveKit Granite pipeline)
                try:
                    cur.execute("""
                        SELECT it.text, it.speaker, it.start_time_s
                        FROM interview_transcripts it
                        JOIN interview_recordings ir ON it.recording_id = ir.id
                        WHERE ir.interview_id = %s
                        ORDER BY it.segment_index ASC
                    """, (session_id,))
                    segments = cur.fetchall()
                    if segments:
                        lines = []
                        for seg in segments:
                            speaker = seg.get('speaker', 'Unknown')
                            text = seg.get('text', '')
                            lines.append(f"[{speaker}]: {text}")
                        return "\n".join(lines)
                except Exception:
                    pass  # Table may not exist

                # Fallback: try the simpler interview_recordings table
                try:
                    cur.execute("""
                        SELECT file_path FROM interview_recordings
                        WHERE session_id = %s LIMIT 1
                    """, (session_id,))
                    row = cur.fetchone()
                    if row:
                        # Recording exists but no transcript — return None
                        # Caller can decide to do audio extraction or placeholder
                        return None
                except Exception:
                    pass

            return None
        finally:
            conn.close()

    def analyze_interview(self, session_id: str, file_path: str = None):
        """
        Analyze interview using Qwen on transcript data.

        Strategy:
          1. Try to fetch Granite ASR transcript from DB
          2. If transcript found → send to qwen-plus for analysis
          3. If no transcript → save placeholder analysis with note

        NOTE: Post-migration, video body-language analysis is no longer
        available. Analysis is transcript-only (verbal + content).
        """
        # 1. Try to get transcript
        transcript = self._get_transcript_for_session(session_id)

        if not transcript and not _qwen_available:
            self.logger.warning("No transcript and no AI available — skipping analysis.")
            return

        if not transcript:
            self.logger.warning(
                f"No ASR transcript found for session {session_id}. "
                "Saving placeholder analysis."
            )
            placeholder = {
                "technical_score": 0,
                "soft_skills_score": 0,
                "key_strengths": [],
                "areas_for_improvement": ["Transcript unavailable — manual review required"],
                "summary": (
                    "Automated analysis could not be completed because no ASR transcript "
                    "was found for this interview session. Please review the recording manually."
                ),
                "analysis_model": "none",
                "analysis_type": "placeholder",
            }
            self._save_analysis(session_id, placeholder)
            return

        # 2. Send transcript to Qwen for analysis
        try:
            self.logger.info(f"Analyzing transcript for session {session_id} via Qwen...")

            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are an expert interview analyst for the UAE job market. "
                        "Analyze the provided interview transcript and return a structured "
                        "evaluation. Return ONLY raw, valid JSON. No markdown, no code fences."
                    ),
                },
                {
                    "role": "user",
                    "content": f"""Analyze this interview transcript and evaluate the candidate.

Transcript:
{transcript[:15000]}

Return a JSON object with:
{{
    "technical_score": 1-10,
    "soft_skills_score": 1-10,
    "key_strengths": ["strength 1", "strength 2", ...],
    "areas_for_improvement": ["area 1", "area 2", ...],
    "summary": "2-3 sentence assessment of the candidate's performance",
    "communication_score": 1-10,
    "confidence_level": "high/medium/low",
    "recommended_action": "shortlist/hold/reject"
}}""",
                },
            ]

            analysis_data = chat_completion(
                task_type="interview",
                messages=messages,
                response_format={"type": "json_object"},
            )

            # Add metadata
            analysis_data["analysis_model"] = "qwen-plus"
            analysis_data["analysis_type"] = "transcript"
            analysis_data["transcript_length"] = len(transcript)

            self._save_analysis(session_id, analysis_data)
            self.logger.info("✅ Interview analysis complete and saved.")

        except (QwenParsingError, QwenClientError) as e:
            self.logger.error(f"Qwen analysis failed: {e}")
            # Save error state so the UI knows analysis was attempted
            self._save_analysis(session_id, {
                "technical_score": 0,
                "soft_skills_score": 0,
                "key_strengths": [],
                "areas_for_improvement": ["AI analysis failed — please retry or review manually"],
                "summary": f"Analysis error: {str(e)}",
                "analysis_model": "qwen-plus",
                "analysis_type": "error",
            })
        except Exception as e:
            self.logger.error(f"AI Analysis Failed: {e}")

    def _save_analysis(self, session_id, analysis_data):
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE interview_schedules SET ai_analysis = %s WHERE interview_id = %s",
                           (json.dumps(analysis_data), session_id))
                conn.commit()
        finally:
            conn.close()

    def _serialize_session(self, session):
        # Convert datetime/UUID to string
        for k, v in session.items():
            if isinstance(v, (datetime, uuid.UUID)):
                session[k] = str(v)
        return session

interview_service = InterviewService()
