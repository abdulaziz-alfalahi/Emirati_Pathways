"""
Interview Scheduling Engine
Core business logic for managing candidate interviews
"""

from enum import Enum
from datetime import datetime, timedelta, time as dt_time
try:
    from backend.services.communication_service import communication_service, NotificationType
except ImportError:
    communication_service = None
    NotificationType = None
from typing import List, Dict, Optional, Tuple
import uuid
import logging

logger = logging.getLogger(__name__)


class InterviewType(Enum):
    """Interview type enumeration"""
    PHONE = "phone"
    VIDEO = "video"
    IN_PERSON = "in_person"
    PANEL = "panel"


class InterviewStatus(Enum):
    """Interview status enumeration"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"


class ConfirmationStatus(Enum):
    """Confirmation status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"


class Recommendation(Enum):
    """Interview recommendation enumeration"""
    HIRE = "hire"
    REJECT = "reject"
    NEXT_ROUND = "next_round"
    HOLD = "hold"


class InterviewSchedulingEngine:
    """Engine for managing interview scheduling operations"""
    
    def __init__(self):
        """Initialize the interview scheduling engine"""
        self.logger = logging.getLogger(__name__)
    
    def generate_interview_id(self) -> str:
        """Generate unique interview ID"""
        return f"int_{uuid.uuid4().hex[:12]}"
    
    def generate_availability_id(self) -> str:
        """Generate unique availability ID"""
        return f"avail_{uuid.uuid4().hex[:12]}"
    
    def validate_interview_data(self, data: Dict) -> Tuple[bool, Optional[str]]:
        """
        Validate interview data
        
        Args:
            data: Interview data dictionary
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        required_fields = ['shortlist_id', 'recruiter_id', 'interview_type', 
                          'scheduled_date', 'scheduled_time']
        
        # Check required fields
        for field in required_fields:
            if field not in data or not data[field]:
                return False, f"Missing required field: {field}"
        
        # Validate interview type
        try:
            InterviewType(data['interview_type'])
        except ValueError:
            return False, f"Invalid interview type: {data['interview_type']}"
        
        # Validate duration
        duration = data.get('duration_minutes', 60)
        if not isinstance(duration, int) or duration < 15 or duration > 240:
            return False, "Duration must be between 15 and 240 minutes"
        
        # Validate date format
        try:
            scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
            # Check if date is in the future (allow same day)
            if scheduled_date < datetime.now().date():
                return False, "Interview date cannot be in the past"
        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD"
        
        # Validate time format
        try:
            datetime.strptime(data['scheduled_time'], '%H:%M:%S')
        except ValueError:
            try:
                # Try without seconds
                datetime.strptime(data['scheduled_time'], '%H:%M')
            except ValueError:
                return False, "Invalid time format. Use HH:MM:SS or HH:MM"
        
        # Validate meeting link for video interviews
        # if data['interview_type'] == 'video' and not data.get('meeting_link'):
        #     return False, "Meeting link is required for video interviews"
        
        # Validate location for in-person interviews
        if data['interview_type'] == 'in_person' and not data.get('location'):
            return False, "Location is required for in-person interviews"
        
        return True, None
    
    def check_scheduling_conflicts(self, conn, recruiter_id: str, 
                                   scheduled_date: str, scheduled_time: str,
                                   duration_minutes: int,
                                   exclude_interview_id: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Check for scheduling conflicts
        
        Args:
            conn: Database connection
            recruiter_id: Recruiter ID
            scheduled_date: Interview date
            scheduled_time: Interview start time
            duration_minutes: Interview duration
            exclude_interview_id: Interview ID to exclude from conflict check (for rescheduling)
            
        Returns:
            Tuple of (has_conflict, conflict_message)
        """
        cur = conn.cursor()
        
        # Parse the scheduled time
        try:
            start_time = datetime.strptime(scheduled_time, '%H:%M:%S').time()
        except ValueError:
            start_time = datetime.strptime(scheduled_time, '%H:%M').time()
        
        # Calculate end time
        start_datetime = datetime.combine(datetime.today(), start_time)
        end_datetime = start_datetime + timedelta(minutes=duration_minutes)
        end_time = end_datetime.time()
        
        # Check for overlapping interviews
        query = """
            SELECT interview_id, scheduled_time, duration_minutes
            FROM interview_schedules
            WHERE recruiter_id = %s
            AND scheduled_date = %s
            AND status NOT IN ('cancelled', 'completed')
        """
        params = [recruiter_id, scheduled_date]
        
        if exclude_interview_id:
            query += " AND interview_id != %s"
            params.append(exclude_interview_id)
        
        cur.execute(query, params)
        existing_interviews = cur.fetchall()
        
        for interview in existing_interviews:
            existing_start = interview[1]
            existing_duration = interview[2]
            
            # Calculate existing end time
            existing_start_dt = datetime.combine(datetime.today(), existing_start)
            existing_end_dt = existing_start_dt + timedelta(minutes=existing_duration)
            existing_end = existing_end_dt.time()
            
            # Check for overlap
            if (start_time < existing_end and end_time > existing_start):
                return True, f"Scheduling conflict with existing interview {interview[0]}"
        
        return False, None
    
    def create_interview(self, conn, data: Dict) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new interview
        
        Args:
            conn: Database connection
            data: Interview data
            
        Returns:
            Tuple of (success, interview_id_or_error, message)
        """
        # Validate data
        is_valid, error_msg = self.validate_interview_data(data)
        if not is_valid:
            return False, error_msg, None
        
        interview_id = self.generate_interview_id()
        cur = conn.cursor()
        
        # Create table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS interview_schedules (
                id SERIAL PRIMARY KEY,
                interview_id VARCHAR(100) UNIQUE NOT NULL,
                shortlist_id VARCHAR(100) NOT NULL,
                candidate_id VARCHAR(100) NOT NULL,
                recruiter_id VARCHAR(100) NOT NULL,
                jd_id VARCHAR(100),
                interview_type VARCHAR(50) NOT NULL,
                interview_round INTEGER DEFAULT 1,
                interview_title VARCHAR(255),
                scheduled_date DATE NOT NULL,
                scheduled_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
                location VARCHAR(500),
                meeting_link VARCHAR(500),
                meeting_platform VARCHAR(50),
                status VARCHAR(50) DEFAULT 'scheduled',
                confirmation_status VARCHAR(50) DEFAULT 'pending',
                interviewers JSONB DEFAULT '[]',
                reminder_sent BOOLEAN DEFAULT FALSE,
                reminder_sent_at TIMESTAMP,
                feedback TEXT,
                rating INTEGER,
                recommendation VARCHAR(50),
                notes TEXT,
                internal_notes TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cancelled_at TIMESTAMP,
                cancellation_reason TEXT
            )
        """)
        
        # Check for conflicts (now that table exists)
        # Ensure schema is up to date (add missing columns if table existed)
        try:
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS meeting_platform VARCHAR(50)")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500)")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS interviewers JSONB DEFAULT '[]'")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS feedback TEXT")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS rating INTEGER")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS recommendation VARCHAR(50)")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS internal_notes TEXT")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Dubai'")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS location VARCHAR(500)")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS cancellation_reason TEXT")
            cur.execute("ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP")
            conn.commit()
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Schema migration failed: {e}")

        has_conflict, conflict_msg = self.check_scheduling_conflicts(
            conn,
            data['recruiter_id'],
            data['scheduled_date'],
            data['scheduled_time'],
            data.get('duration_minutes', 60)
        )
        if has_conflict:
            return False, conflict_msg, None
        
        # Get candidate_id from shortlist (Updated to use shortlisted_candidates)
        # We also need jd_id (UUID) which is in job_postings
        cur.execute("""
            SELECT sc.candidate_id, jp.jd_id, jp.title 
            FROM shortlisted_candidates sc
            JOIN job_postings jp ON sc.job_id = jp.id
            WHERE sc.id::text = %s
        """, (data['shortlist_id'],))
        
        shortlist_entry = cur.fetchone()
        if not shortlist_entry:
            # Fallback: check legacy table just in case
            cur.execute("""
                 SELECT candidate_id, jd_id FROM candidate_shortlist
                 WHERE shortlist_id = %s
            """, (data['shortlist_id'],))
            shortlist_entry = cur.fetchone()
            job_title = "Unknown Role"  # Default
            
            if not shortlist_entry:
                # Fallback: check legacy table just in case with job join
                cur.execute("""
                     SELECT cs.candidate_id, cs.jd_id, j.title
                     FROM candidate_shortlist cs
                     LEFT JOIN job_postings j ON cs.jd_id::text = j.jd_id::text
                     WHERE shortlist_id = %s
                """, (data['shortlist_id'],))
                shortlist_entry = cur.fetchone()
                
            if not shortlist_entry:
                return False, "Shortlist entry not found", None
        
        candidate_id = shortlist_entry[0]
        jd_id = data.get('jd_id') or shortlist_entry[1]
        job_title = shortlist_entry[2] if len(shortlist_entry) > 2 else "Unknown Role"
        
        # Prepare JSONB fields
        import json as json_module
        interviewers = data.get('interviewers', [])
        if isinstance(interviewers, list):
            interviewers = json_module.dumps(interviewers)
        elif isinstance(interviewers, str):
            pass  # Already a string
        else:
            interviewers = '[]'
        
        metadata = data.get('metadata', {})
        if isinstance(metadata, dict):
            metadata = json_module.dumps(metadata)
        elif isinstance(metadata, str):
            pass  # Already a string
        else:
            metadata = '{}'
        
        # Insert interview
        cur.execute("""
            INSERT INTO interview_schedules (
                interview_id, shortlist_id, candidate_id, recruiter_id, jd_id,
                interview_type, interview_round, interview_title,
                scheduled_date, scheduled_time, duration_minutes, timezone,
                location, meeting_link, meeting_platform,
                interviewers, notes, internal_notes, metadata
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            interview_id,
            data['shortlist_id'],
            candidate_id,
            data['recruiter_id'],
            jd_id,
            data['interview_type'],
            data.get('interview_round', 1),
            data.get('interview_title', ''),
            data['scheduled_date'],
            data['scheduled_time'],
            data.get('duration_minutes', 60),
            data.get('timezone', 'Asia/Dubai'),
            data.get('location', ''),
            data.get('meeting_link', ''),
            data.get('meeting_platform', ''),
            interviewers,
            data.get('notes', ''),
            data.get('internal_notes', ''),
            metadata
        ))
        
        # Update candidate status in shortlist (use SAVEPOINT so failure doesn't poison the transaction)
        try:
            cur.execute("SAVEPOINT pre_shortlist_update")
            cur.execute("""
                UPDATE candidate_shortlist
                SET status = 'interview_scheduled',
                    updated_at = CURRENT_TIMESTAMP
                WHERE shortlist_id = %s
            """, (data['shortlist_id'],))
            cur.execute("RELEASE SAVEPOINT pre_shortlist_update")
        except Exception as e:
            self.logger.warning(f"Could not update candidate_shortlist status: {e}")
            cur.execute("ROLLBACK TO SAVEPOINT pre_shortlist_update")
        
        # Also update job_applications status to 'interview' so it shows in candidate's Application Tracker
        # CRITICAL: Use SAVEPOINT because a type mismatch here will poison the entire transaction
        # in PostgreSQL/psycopg2, causing conn.commit() to silently roll back everything
        try:
            cur.execute("SAVEPOINT pre_app_update")
            cur.execute("""
                UPDATE job_applications
                SET status = 'interview'
                WHERE candidate_id::text = %s
                  AND job_id::text IN (SELECT id::text FROM job_postings WHERE jd_id::text = %s)
                  AND status NOT IN ('withdrawn', 'rejected', 'interview')
            """, (str(candidate_id), str(jd_id)))
            self.logger.info(f"Updated job_applications status to 'interview' for candidate {candidate_id}, jd_id {jd_id}")
            cur.execute("RELEASE SAVEPOINT pre_app_update")
        except Exception as e:
            self.logger.warning(f"Could not update job_applications status: {e}")
            cur.execute("ROLLBACK TO SAVEPOINT pre_app_update")
        
        conn.commit()

        # Send Notification to Candidate
        try:
            communication_service.create_notification(
                user_id=candidate_id,
                notification_type=NotificationType.INTERVIEW_SCHEDULED,
                metadata={
                    'interview_title': data.get('interview_title', 'Video Interview'),
                    'job_title': job_title,
                    'interview_id': interview_id,
                    'scheduled_at': f"{data['scheduled_date']} {data['scheduled_time']}",
                    'role': 'candidate'
                }
            )
        except Exception as e:
            self.logger.error(f"Failed to send interview notification to candidate: {e}")

        # Send Notification to Recruiter
        try:
            communication_service.create_notification(
                user_id=data['recruiter_id'],
                notification_type=NotificationType.INTERVIEW_SCHEDULED,
                metadata={
                    'interview_title': data.get('interview_title', 'Video Interview'),
                    'job_title': job_title,
                    'interview_id': interview_id,
                    'scheduled_at': f"{data['scheduled_date']} {data['scheduled_time']}",
                    'candidate_name': "Candidate", # We could fetch name if we want, but keeping it simple for now
                    'role': 'recruiter'
                }
            )
        except Exception as e:
            self.logger.error(f"Failed to send interview notification to recruiter: {e}")
        
        self.logger.info(f"Interview created: {interview_id}")
        return True, interview_id, "Interview scheduled successfully"
    
    def get_interviews(self, conn, filters: Dict) -> List[Dict]:
        """
        Get interviews with filters
        
        Args:
            conn: Database connection
            filters: Filter criteria (jd_id, recruiter_id, status, date_from, date_to, etc.)
            
        Returns:
            List of interview dictionaries
        """
        cur = conn.cursor()
        
        query = """
            SELECT i.*
            FROM interview_schedules i
            WHERE 1=1
        """
        params = []
        
        if filters.get('jd_id'):
            query += " AND i.jd_id = %s"
            params.append(filters['jd_id'])
        
        if filters.get('recruiter_id'):
            query += " AND i.recruiter_id = %s"
            params.append(filters['recruiter_id'])
        
        if filters.get('status'):
            query += " AND i.status = %s"
            params.append(filters['status'])
        
        if filters.get('date_from'):
            query += " AND i.scheduled_date >= %s"
            params.append(filters['date_from'])
        
        if filters.get('date_to'):
            query += " AND i.scheduled_date <= %s"
            params.append(filters['date_to'])
        
        if filters.get('interview_type'):
            query += " AND i.interview_type = %s"
            params.append(filters['interview_type'])
        
        query += " ORDER BY i.scheduled_date DESC, i.scheduled_time DESC"
        
        cur.execute(query, params)
        columns = [desc[0] for desc in cur.description]
        interviews = [dict(zip(columns, row)) for row in cur.fetchall()]
        
        return interviews
    
    def get_interview_by_id(self, conn, interview_id: str) -> Optional[Dict]:
        """Get interview by ID"""
        interviews = self.get_interviews(conn, {'interview_id': interview_id})
        return interviews[0] if interviews else None
    
    def update_interview(self, conn, interview_id: str, updates: Dict) -> Tuple[bool, str]:
        """
        Update interview details
        
        Args:
            conn: Database connection
            interview_id: Interview ID
            updates: Dictionary of fields to update
            
        Returns:
            Tuple of (success, message)
        """
        cur = conn.cursor()
        
        # Check if rescheduling
        if 'scheduled_date' in updates or 'scheduled_time' in updates:
            # Get current interview details
            cur.execute("""
                SELECT recruiter_id, scheduled_date, scheduled_time, duration_minutes
                FROM interview_schedules
                WHERE interview_id = %s OR id::text = %s
            """, (interview_id, str(interview_id)))
            
            current = cur.fetchone()
            if not current:
                return False, "Interview not found"
            
            new_date = updates.get('scheduled_date', current[1])
            new_time = updates.get('scheduled_time', current[2])
            duration = updates.get('duration_minutes', current[3])
            
            # Check for conflicts
            has_conflict, conflict_msg = self.check_scheduling_conflicts(
                conn, current[0], str(new_date), str(new_time), duration,
                exclude_interview_id=interview_id
            )
            if has_conflict:
                return False, conflict_msg
        
        # Build update query
        set_clauses = []
        params = []
        
        allowed_fields = [
            'interview_type', 'interview_round', 'interview_title',
            'scheduled_date', 'scheduled_time', 'duration_minutes',
            'location', 'meeting_link', 'meeting_platform',
            'status', 'confirmation_status', 'interviewers',
            'notes', 'internal_notes', 'metadata',
            'feedback', 'rating', 'recommendation'  # Added for interview feedback
        ]
        
        for field in allowed_fields:
            if field in updates:
                set_clauses.append(f"{field} = %s")
                params.append(updates[field])
        
        if not set_clauses:
            return False, "No valid fields to update"
        
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        params.append(interview_id)
        
        params.append(str(interview_id))  # for the second OR condition
        query = f"""
            UPDATE interview_schedules
            SET {', '.join(set_clauses)}
            WHERE interview_id = %s OR id::text = %s
        """
        
        cur.execute(query, params)
        conn.commit()
        
        self.logger.info(f"Interview updated: {interview_id}")
        return True, "Interview updated successfully"
    
    def cancel_interview(self, conn, interview_id: str, reason: str) -> Tuple[bool, str]:
        """
        Cancel an interview
        
        Args:
            conn: Database connection
            interview_id: Interview ID
            reason: Cancellation reason
            
        Returns:
            Tuple of (success, message)
        """
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE interview_schedules
            SET status = 'cancelled',
                cancellation_reason = %s,
                cancelled_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE (interview_id = %s OR id::text = %s)
            AND status NOT IN ('completed', 'cancelled')
        """, (reason, interview_id, str(interview_id)))
        
        if cur.rowcount == 0:
            return False, "Interview not found or already completed/cancelled"
        
        conn.commit()
        
        self.logger.info(f"Interview cancelled: {interview_id}")
        return True, "Interview cancelled successfully"
    
    def complete_interview(self, conn, interview_id: str, feedback_data: Dict) -> Tuple[bool, str]:
        """
        Mark interview as completed and add feedback
        
        Args:
            conn: Database connection
            interview_id: Interview ID
            feedback_data: Feedback data (feedback, rating, recommendation, internal_notes)
            
        Returns:
            Tuple of (success, message)
        """
        cur = conn.cursor()
        
        # Validate recommendation if provided
        if 'recommendation' in feedback_data:
            try:
                Recommendation(feedback_data['recommendation'])
            except ValueError:
                return False, f"Invalid recommendation: {feedback_data['recommendation']}"
        
        # Validate rating if provided
        if 'rating' in feedback_data:
            rating = feedback_data['rating']
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                return False, "Rating must be between 1 and 5"
        
        cur.execute("""
            UPDATE interview_schedules
            SET status = 'completed',
                feedback = %s,
                rating = %s,
                recommendation = %s,
                internal_notes = COALESCE(%s, internal_notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE interview_id = %s
            AND status NOT IN ('completed', 'cancelled')
        """, (
            feedback_data.get('feedback', ''),
            feedback_data.get('rating'),
            feedback_data.get('recommendation'),
            feedback_data.get('internal_notes'),
            interview_id
        ))
        
        if cur.rowcount == 0:
            return False, "Interview not found or already completed/cancelled"
        
        # Update candidate status based on recommendation
        if feedback_data.get('recommendation'):
            status_map = {
                'hire': 'offer_pending',
                'reject': 'rejected',
                'next_round': 'interview_scheduled',
                'hold': 'on_hold'
            }
            new_status = status_map.get(feedback_data['recommendation'])
            
            if new_status:
                # Update status in the CORRECT table: shortlisted_candidates
                cur.execute("""
                    UPDATE shortlisted_candidates sc
                    SET status = %s,
                        updated_at = CURRENT_TIMESTAMP
                    FROM interview_schedules i
                    WHERE i.interview_id = %s
                    AND sc.id::text = i.shortlist_id
                """, (new_status, interview_id))
        
        conn.commit()
        
        self.logger.info(f"Interview completed: {interview_id}")
        return True, "Interview completed and feedback saved"
    
    def get_statistics(self, conn, jd_id: str) -> Dict:
        """
        Get interview statistics for a job description
        
        Args:
            conn: Database connection
            jd_id: Job description ID
            
        Returns:
            Statistics dictionary
        """
        cur = conn.cursor()
        
        # Total interviews
        cur.execute("""
            SELECT COUNT(*) FROM interview_schedules
            WHERE jd_id = %s
        """, (jd_id,))
        total_interviews = cur.fetchone()[0]
        
        # Status breakdown
        cur.execute("""
            SELECT status, COUNT(*) FROM interview_schedules
            WHERE jd_id = %s
            GROUP BY status
        """, (jd_id,))
        status_counts = dict(cur.fetchall())
        
        # Average rating
        cur.execute("""
            SELECT AVG(rating) FROM interview_schedules
            WHERE jd_id = %s AND rating IS NOT NULL
        """, (jd_id,))
        avg_rating = cur.fetchone()[0]
        
        # Recommendations breakdown
        cur.execute("""
            SELECT recommendation, COUNT(*) FROM interview_schedules
            WHERE jd_id = %s AND recommendation IS NOT NULL
            GROUP BY recommendation
        """, (jd_id,))
        recommendations = dict(cur.fetchall())
        
        return {
            'total_interviews': total_interviews,
            'scheduled': status_counts.get('scheduled', 0),
            'confirmed': status_counts.get('confirmed', 0),
            'completed': status_counts.get('completed', 0),
            'cancelled': status_counts.get('cancelled', 0),
            'no_show': status_counts.get('no_show', 0),
            'avg_rating': float(avg_rating) if avg_rating else 0,
            'recommendations': {
                'hire': recommendations.get('hire', 0),
                'reject': recommendations.get('reject', 0),
                'next_round': recommendations.get('next_round', 0),
                'hold': recommendations.get('hold', 0)
            }
        }

