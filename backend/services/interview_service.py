
import logging
import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
import secrets
from backend.user_helpers import user_display_name

logger = logging.getLogger(__name__)

class InterviewService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.upload_folder = os.path.join(os.getcwd(), 'uploads', 'interviews')
        os.makedirs(self.upload_folder, exist_ok=True)
        
        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)

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
                # Interview Sessions Table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS interview_sessions (
                        id UUID PRIMARY KEY,
                        application_id TEXT, 
                        recruiter_id INTEGER, 
                        candidate_id TEXT, 
                        scheduled_at TIMESTAMPTZ,
                        status TEXT DEFAULT 'scheduled', 
                        ai_analysis JSONB,
                        guest_token TEXT UNIQUE, -- For public access
                        title TEXT,              -- Custom title (optional)
                        cancellation_reason TEXT,
                        attendees JSONB,         -- List of additional attendees (User IDs)
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                
                # Manual Migration for existing tables (Idempotent)
                try:
                    cur.execute("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS guest_token TEXT UNIQUE;")
                    cur.execute("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS title TEXT;")
                    cur.execute("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;")
                    cur.execute("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS attendees JSONB;")
                except Exception:
                    conn.rollback() 
                    pass

                # Recordings Metadata Table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS interview_recordings (
                        id UUID PRIMARY KEY,
                        session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
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
                
                cur.execute("""
                    INSERT INTO interview_sessions (id, application_id, recruiter_id, candidate_id, scheduled_at, status, guest_token, title, attendees)
                    VALUES (%s, %s, %s, %s, %s, 'scheduled', %s, %s, %s)
                    RETURNING *
                """, (session_id, str(application_id) if application_id else None, recruiter_id, str(candidate_id) if candidate_id else None, scheduled_at, guest_token, title, json.dumps(attendees)))
                session = cur.fetchone()
                conn.commit()
                return self._serialize_session(session)
        finally:
            conn.close()

    def get_session(self, session_id: str) -> Optional[Dict]:
        conn = self._get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM interview_sessions WHERE id = %s", (session_id,))
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
                    SELECT s.*, 
                           u_rec.first_name as recruiter_first_name, u_rec.last_name as recruiter_last_name,
                           {user_display_name('recruiter_display_name', 'u_rec')}
                    FROM interview_sessions s
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
                    fields.append("scheduled_at = %s")
                    values.append(data['scheduled_at'])
                if 'title' in data:
                    fields.append("title = %s")
                    values.append(data['title'])
                
                if not fields:
                    return None
                    
                values.append(session_id)
                query = f"UPDATE interview_sessions SET {', '.join(fields)} WHERE id = %s RETURNING *"
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
                    UPDATE interview_sessions 
                    SET status = 'cancelled', cancellation_reason = %s 
                    WHERE id = %s
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
                        SELECT s.*, 
                               u.first_name as candidate_first_name, 
                               u.last_name as candidate_last_name,
                               {user_display_name('candidate_display_name')},
                               u.email as candidate_email
                        FROM interview_sessions s
                        LEFT JOIN users u ON s.candidate_id = u.id::text
                        WHERE s.recruiter_id = %s
                        ORDER BY s.scheduled_at DESC
                    """, (user_id,))
                else:
                    cur.execute(f"""
                        SELECT s.*, 
                               u.first_name as recruiter_first_name, 
                               u.last_name as recruiter_last_name,
                               {user_display_name('recruiter_display_name')},
                               u.email as recruiter_email
                        FROM interview_sessions s
                        LEFT JOIN users u ON s.recruiter_id = u.id
                        WHERE s.candidate_id = %s
                        ORDER BY s.scheduled_at DESC
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
                    SELECT s.*, 
                           u_rec.first_name as recruiter_first_name, u_rec.last_name as recruiter_last_name,
                           {user_display_name('recruiter_display_name', 'u_rec')},
                           u_can.first_name as candidate_first_name, u_can.last_name as candidate_last_name,
                           {user_display_name('candidate_display_name', 'u_can')}
                    FROM interview_sessions s
                    LEFT JOIN users u_rec ON s.recruiter_id = u_rec.id
                    LEFT JOIN users u_can ON s.candidate_id::text = u_can.id::text 
                    ORDER BY s.scheduled_at DESC
                """)
                sessions = cur.fetchall()
                return [self._serialize_session(dict(s)) for s in sessions]
        finally:
            conn.close()

    def update_status(self, session_id: str, status: str):
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE interview_sessions SET status = %s WHERE id = %s", (status, session_id))
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

    def analyze_interview(self, session_id: str, file_path: str = None):
        """
        Send video to Gemini for analysis.
        If file_path not provided, try to find one.
        """
        if not file_path:
            # Find a recording
            conn = self._get_db_connection()
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT file_path FROM interview_recordings WHERE session_id = %s LIMIT 1", (session_id,))
                row = cur.fetchone()
                if row:
                    file_path = row['file_path']
            conn.close()
        
        if not file_path or not os.path.exists(file_path):
            self.logger.error("No recording found for analysis.")
            return

        try:
            self.logger.info(f"Uploading {file_path} to Gemini...")
            video_file = genai.upload_file(path=file_path)
            
            # Wait for processing? Usually fast for small clips.
            # In a real async flow we'd poll. Here we assume immediate or short wait.
            import time
            while video_file.state.name == "PROCESSING":
                time.sleep(2)
                video_file = genai.get_file(video_file.name)

            if video_file.state.name == "FAILED":
                raise ValueError(f"Video processing failed: {video_file.state.name}")

            model = genai.GenerativeModel(model_name="gemini-1.5-pro")
            prompt = """
            Analyze this job interview video.
            Provide a JSON output with:
            1. "technical_score" (1-10)
            2. "soft_skills_score" (1-10)
            3. "key_strengths" (list of strings)
            4. "areas_for_improvement" (list of strings)
            5. "summary" (text)
            """
            response = model.generate_content([video_file, prompt])
            
            analysis_json = response.text.strip()
            # Clean md code blocks if present
            if "```json" in analysis_json:
                analysis_json = analysis_json.split("```json")[1].split("```")[0]
            
            self._save_analysis(session_id, json.loads(analysis_json))
            self.logger.info("Analysis complete and saved.")

        except Exception as e:
            self.logger.error(f"AI Analysis Failed: {e}")

    def _save_analysis(self, session_id, analysis_data):
        conn = self._get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE interview_sessions SET ai_analysis = %s WHERE id = %s", 
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
