"""
Mentor Session Scheduling System
Comprehensive scheduling system with calendar integration for the Emirati Journey Platform
"""

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SessionStatus(Enum):
    """Session status enumeration"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"

class SessionType(Enum):
    """Session type enumeration"""
    INITIAL_CONSULTATION = "initial_consultation"
    REGULAR_MENTORING = "regular_mentoring"
    SKILL_DEVELOPMENT = "skill_development"
    CAREER_GUIDANCE = "career_guidance"
    GOAL_REVIEW = "goal_review"
    PROGRESS_CHECK = "progress_check"
    FINAL_REVIEW = "final_review"

class MeetingPlatform(Enum):
    """Meeting platform enumeration"""
    IN_PERSON = "in_person"
    ZOOM = "zoom"
    TEAMS = "teams"
    GOOGLE_MEET = "google_meet"
    PLATFORM_VIDEO = "platform_video"
    PHONE = "phone"

@dataclass
class TimeSlot:
    """Time slot data structure"""
    start_time: datetime
    end_time: datetime
    is_available: bool
    timezone: str = "Asia/Dubai"

@dataclass
class SessionRequest:
    """Session request data structure"""
    mentor_id: str
    mentee_id: str
    session_type: SessionType
    preferred_date: datetime
    duration_minutes: int
    meeting_platform: MeetingPlatform
    agenda: str
    notes: str
    is_recurring: bool = False
    recurrence_pattern: Optional[Dict] = None

@dataclass
class MentorshipSession:
    """Mentorship session data structure"""
    id: str
    mentor_id: str
    mentee_user_id: str
    session_type: SessionType
    scheduled_date: datetime
    duration_minutes: int
    meeting_platform: MeetingPlatform
    meeting_link: Optional[str]
    meeting_id: Optional[str]
    agenda: str
    session_notes: str
    mentor_notes: str
    mentee_notes: str
    status: SessionStatus
    created_at: datetime
    updated_at: datetime
    reminder_sent: bool = False
    feedback_collected: bool = False

@dataclass
class AvailabilitySlot:
    """Availability slot data structure"""
    id: str
    mentor_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    timezone: str
    is_active: bool
    created_at: datetime

class MentorSessionScheduler:
    """Comprehensive session scheduling system"""
    
    def __init__(self, db_config: Dict):
        """Initialize the session scheduler with database configuration"""
        self.db_config = db_config
        
        # UAE timezone
        self.uae_timezone = timezone(timedelta(hours=4))  # UTC+4
        
        # Default session durations by type
        self.default_durations = {
            SessionType.INITIAL_CONSULTATION: 60,
            SessionType.REGULAR_MENTORING: 45,
            SessionType.SKILL_DEVELOPMENT: 60,
            SessionType.CAREER_GUIDANCE: 45,
            SessionType.GOAL_REVIEW: 30,
            SessionType.PROGRESS_CHECK: 30,
            SessionType.FINAL_REVIEW: 60
        }
        
        # Business hours in UAE
        self.business_hours = {
            'start': '08:00',
            'end': '18:00',
            'timezone': 'Asia/Dubai'
        }

    def get_database_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def set_mentor_availability(self, mentor_id: str, availability_slots: List[Dict]) -> bool:
        """Set mentor availability schedule"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    # Clear existing availability
                    cursor.execute("""
                        DELETE FROM mentor_availability WHERE mentor_id = %s
                    """, (mentor_id,))
                    
                    # Insert new availability slots
                    for slot in availability_slots:
                        cursor.execute("""
                            INSERT INTO mentor_availability 
                            (id, mentor_id, day_of_week, start_time, end_time, timezone, is_active, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            str(uuid.uuid4()),
                            mentor_id,
                            slot['day_of_week'],
                            slot['start_time'],
                            slot['end_time'],
                            slot.get('timezone', 'Asia/Dubai'),
                            slot.get('is_active', True),
                            datetime.now()
                        ))
                    
                    conn.commit()
                    return True
                    
        except Exception as e:
            logger.error(f"Error setting mentor availability: {e}")
            return False

    def get_mentor_availability(self, mentor_id: str) -> List[AvailabilitySlot]:
        """Get mentor availability schedule"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM mentor_availability 
                        WHERE mentor_id = %s AND is_active = true
                        ORDER BY day_of_week, start_time
                    """, (mentor_id,))
                    
                    slots = []
                    for row in cursor.fetchall():
                        slot = AvailabilitySlot(
                            id=str(row['id']),
                            mentor_id=str(row['mentor_id']),
                            day_of_week=row['day_of_week'],
                            start_time=row['start_time'],
                            end_time=row['end_time'],
                            timezone=row['timezone'],
                            is_active=row['is_active'],
                            created_at=row['created_at']
                        )
                        slots.append(slot)
                    
                    return slots
                    
        except Exception as e:
            logger.error(f"Error getting mentor availability: {e}")
            return []

    def get_available_time_slots(self, mentor_id: str, date_range: Tuple[datetime, datetime], 
                                duration_minutes: int = 45) -> List[TimeSlot]:
        """Get available time slots for a mentor within a date range"""
        try:
            start_date, end_date = date_range
            
            # Get mentor availability pattern
            availability_slots = self.get_mentor_availability(mentor_id)
            if not availability_slots:
                return []
            
            # Get existing sessions in the date range
            existing_sessions = self.get_mentor_sessions_in_range(mentor_id, start_date, end_date)
            
            available_slots = []
            current_date = start_date.date()
            
            while current_date <= end_date.date():
                day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
                
                # Find availability for this day of week
                day_availability = [slot for slot in availability_slots if slot.day_of_week == day_of_week]
                
                for availability in day_availability:
                    # Create datetime objects for this specific date
                    start_time = datetime.combine(current_date, 
                                                datetime.strptime(availability.start_time, '%H:%M').time())
                    end_time = datetime.combine(current_date, 
                                              datetime.strptime(availability.end_time, '%H:%M').time())
                    
                    # Generate time slots within this availability window
                    current_slot_start = start_time
                    while current_slot_start + timedelta(minutes=duration_minutes) <= end_time:
                        slot_end = current_slot_start + timedelta(minutes=duration_minutes)
                        
                        # Check if this slot conflicts with existing sessions
                        is_available = not self.has_session_conflict(existing_sessions, current_slot_start, slot_end)
                        
                        # Only include future slots
                        if current_slot_start > datetime.now():
                            time_slot = TimeSlot(
                                start_time=current_slot_start,
                                end_time=slot_end,
                                is_available=is_available,
                                timezone=availability.timezone
                            )
                            available_slots.append(time_slot)
                        
                        # Move to next slot (15-minute intervals)
                        current_slot_start += timedelta(minutes=15)
                
                current_date += timedelta(days=1)
            
            return available_slots
            
        except Exception as e:
            logger.error(f"Error getting available time slots: {e}")
            return []

    def get_mentor_sessions_in_range(self, mentor_id: str, start_date: datetime, end_date: datetime) -> List[MentorshipSession]:
        """Get mentor sessions within a date range"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM mentorship_sessions 
                        WHERE mentor_id = %s 
                        AND scheduled_date BETWEEN %s AND %s
                        AND session_status NOT IN ('cancelled', 'no_show')
                        ORDER BY scheduled_date
                    """, (mentor_id, start_date, end_date))
                    
                    sessions = []
                    for row in cursor.fetchall():
                        session = MentorshipSession(
                            id=str(row['id']),
                            mentor_id=str(row['mentor_id']),
                            mentee_user_id=str(row['mentee_user_id']),
                            session_type=SessionType(row['session_type']),
                            scheduled_date=row['scheduled_date'],
                            duration_minutes=row['duration_minutes'],
                            meeting_platform=MeetingPlatform(row['meeting_platform']),
                            meeting_link=row.get('meeting_link'),
                            meeting_id=row.get('meeting_id'),
                            agenda=row.get('agenda', ''),
                            session_notes=row.get('session_notes', ''),
                            mentor_notes=row.get('mentor_notes', ''),
                            mentee_notes=row.get('mentee_notes', ''),
                            status=SessionStatus(row['session_status']),
                            created_at=row['created_at'],
                            updated_at=row['updated_at'],
                            reminder_sent=row.get('reminder_sent', False),
                            feedback_collected=row.get('feedback_collected', False)
                        )
                        sessions.append(session)
                    
                    return sessions
                    
        except Exception as e:
            logger.error(f"Error getting mentor sessions in range: {e}")
            return []

    def has_session_conflict(self, existing_sessions: List[MentorshipSession], 
                           start_time: datetime, end_time: datetime) -> bool:
        """Check if a time slot conflicts with existing sessions"""
        for session in existing_sessions:
            session_start = session.scheduled_date
            session_end = session_start + timedelta(minutes=session.duration_minutes)
            
            # Check for overlap
            if (start_time < session_end and end_time > session_start):
                return True
        
        return False

    def schedule_session(self, session_request: SessionRequest) -> Optional[str]:
        """Schedule a new mentorship session"""
        try:
            # Validate the session request
            if not self.validate_session_request(session_request):
                return None
            
            # Check if the requested time slot is available
            duration = session_request.duration_minutes or self.default_durations.get(
                session_request.session_type, 45)
            
            end_time = session_request.preferred_date + timedelta(minutes=duration)
            existing_sessions = self.get_mentor_sessions_in_range(
                session_request.mentor_id,
                session_request.preferred_date - timedelta(hours=1),
                session_request.preferred_date + timedelta(hours=2)
            )
            
            if self.has_session_conflict(existing_sessions, session_request.preferred_date, end_time):
                logger.warning(f"Session conflict detected for mentor {session_request.mentor_id}")
                return None
            
            # Generate meeting link if needed
            meeting_link = None
            meeting_id = None
            if session_request.meeting_platform != MeetingPlatform.IN_PERSON:
                meeting_link, meeting_id = self.generate_meeting_link(session_request.meeting_platform)
            
            # Create session in database
            session_id = str(uuid.uuid4())
            
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO mentorship_sessions 
                        (id, mentor_id, mentee_user_id, session_type, scheduled_date, 
                         duration_minutes, meeting_platform, meeting_link, meeting_id,
                         agenda, session_notes, session_status, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        session_id,
                        session_request.mentor_id,
                        session_request.mentee_id,
                        session_request.session_type.value,
                        session_request.preferred_date,
                        duration,
                        session_request.meeting_platform.value,
                        meeting_link,
                        meeting_id,
                        session_request.agenda,
                        session_request.notes,
                        SessionStatus.SCHEDULED.value,
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    # If recurring session, create recurrence pattern
                    if session_request.is_recurring and session_request.recurrence_pattern:
                        self.create_recurring_sessions(session_id, session_request)
                    
                    conn.commit()
                    return session_id
                    
        except Exception as e:
            logger.error(f"Error scheduling session: {e}")
            return None

    def validate_session_request(self, session_request: SessionRequest) -> bool:
        """Validate session request"""
        try:
            # Check if mentor exists and is available
            if not self.is_mentor_available(session_request.mentor_id):
                return False
            
            # Check if mentee exists
            if not self.mentee_exists(session_request.mentee_id):
                return False
            
            # Check if session is in the future
            if session_request.preferred_date <= datetime.now():
                return False
            
            # Check if session is within business hours (for in-person meetings)
            if session_request.meeting_platform == MeetingPlatform.IN_PERSON:
                if not self.is_within_business_hours(session_request.preferred_date):
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating session request: {e}")
            return False

    def is_mentor_available(self, mentor_id: str) -> bool:
        """Check if mentor is available for scheduling"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT is_available FROM mentor_profiles 
                        WHERE id = %s
                    """, (mentor_id,))
                    
                    result = cursor.fetchone()
                    return result[0] if result else False
                    
        except Exception as e:
            logger.error(f"Error checking mentor availability: {e}")
            return False

    def mentee_exists(self, mentee_id: str) -> bool:
        """Check if mentee exists"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT id FROM users WHERE id = %s AND role = 'candidate'
                    """, (mentee_id,))
                    
                    result = cursor.fetchone()
                    return result is not None
                    
        except Exception as e:
            logger.error(f"Error checking mentee existence: {e}")
            return False

    def is_within_business_hours(self, session_date: datetime) -> bool:
        """Check if session is within business hours"""
        session_time = session_date.time()
        start_time = datetime.strptime(self.business_hours['start'], '%H:%M').time()
        end_time = datetime.strptime(self.business_hours['end'], '%H:%M').time()
        
        return start_time <= session_time <= end_time

    def generate_meeting_link(self, platform: MeetingPlatform) -> Tuple[Optional[str], Optional[str]]:
        """Generate meeting link for virtual sessions"""
        try:
            meeting_id = str(uuid.uuid4())[:8]
            
            if platform == MeetingPlatform.ZOOM:
                # In a real implementation, this would integrate with Zoom API
                meeting_link = f"https://zoom.us/j/{meeting_id}"
                return meeting_link, meeting_id
            
            elif platform == MeetingPlatform.TEAMS:
                # In a real implementation, this would integrate with Teams API
                meeting_link = f"https://teams.microsoft.com/l/meetup-join/{meeting_id}"
                return meeting_link, meeting_id
            
            elif platform == MeetingPlatform.GOOGLE_MEET:
                # In a real implementation, this would integrate with Google Meet API
                meeting_link = f"https://meet.google.com/{meeting_id}"
                return meeting_link, meeting_id
            
            elif platform == MeetingPlatform.PLATFORM_VIDEO:
                # Platform's own video calling system
                meeting_link = f"/video-call/{meeting_id}"
                return meeting_link, meeting_id
            
            return None, None
            
        except Exception as e:
            logger.error(f"Error generating meeting link: {e}")
            return None, None

    def create_recurring_sessions(self, base_session_id: str, session_request: SessionRequest):
        """Create recurring sessions based on pattern"""
        try:
            pattern = session_request.recurrence_pattern
            if not pattern:
                return
            
            frequency = pattern.get('frequency', 'weekly')  # weekly, biweekly, monthly
            count = pattern.get('count', 4)  # number of sessions
            
            current_date = session_request.preferred_date
            
            for i in range(1, count):  # Skip first session (already created)
                if frequency == 'weekly':
                    next_date = current_date + timedelta(weeks=i)
                elif frequency == 'biweekly':
                    next_date = current_date + timedelta(weeks=i*2)
                elif frequency == 'monthly':
                    next_date = current_date + timedelta(days=i*30)
                else:
                    continue
                
                # Create recurring session
                recurring_session_id = str(uuid.uuid4())
                
                with self.get_database_connection() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO mentorship_sessions 
                            (id, mentor_id, mentee_user_id, session_type, scheduled_date, 
                             duration_minutes, meeting_platform, meeting_link, meeting_id,
                             agenda, session_notes, session_status, parent_session_id, 
                             is_recurring, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            recurring_session_id,
                            session_request.mentor_id,
                            session_request.mentee_id,
                            session_request.session_type.value,
                            next_date,
                            session_request.duration_minutes,
                            session_request.meeting_platform.value,
                            None,  # Generate new meeting link for each session
                            None,
                            session_request.agenda,
                            session_request.notes,
                            SessionStatus.SCHEDULED.value,
                            base_session_id,
                            True,
                            datetime.now(),
                            datetime.now()
                        ))
                        
                        conn.commit()
                        
        except Exception as e:
            logger.error(f"Error creating recurring sessions: {e}")

    def reschedule_session(self, session_id: str, new_date: datetime, 
                          reason: str = "") -> bool:
        """Reschedule an existing session"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    # Get current session details
                    cursor.execute("""
                        SELECT mentor_id, duration_minutes FROM mentorship_sessions 
                        WHERE id = %s
                    """, (session_id,))
                    
                    session_data = cursor.fetchone()
                    if not session_data:
                        return False
                    
                    mentor_id, duration = session_data
                    
                    # Check if new time slot is available
                    end_time = new_date + timedelta(minutes=duration)
                    existing_sessions = self.get_mentor_sessions_in_range(
                        mentor_id,
                        new_date - timedelta(hours=1),
                        new_date + timedelta(hours=2)
                    )
                    
                    # Exclude current session from conflict check
                    existing_sessions = [s for s in existing_sessions if s.id != session_id]
                    
                    if self.has_session_conflict(existing_sessions, new_date, end_time):
                        return False
                    
                    # Update session
                    cursor.execute("""
                        UPDATE mentorship_sessions 
                        SET scheduled_date = %s, 
                            session_status = %s,
                            reschedule_reason = %s,
                            updated_at = %s
                        WHERE id = %s
                    """, (new_date, SessionStatus.RESCHEDULED.value, reason, datetime.now(), session_id))
                    
                    conn.commit()
                    return True
                    
        except Exception as e:
            logger.error(f"Error rescheduling session: {e}")
            return False

    def cancel_session(self, session_id: str, reason: str = "", 
                      cancelled_by: str = "") -> bool:
        """Cancel a session"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE mentorship_sessions 
                        SET session_status = %s,
                            cancellation_reason = %s,
                            cancelled_by = %s,
                            updated_at = %s
                        WHERE id = %s
                    """, (SessionStatus.CANCELLED.value, reason, cancelled_by, datetime.now(), session_id))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error cancelling session: {e}")
            return False

    def complete_session(self, session_id: str, mentor_notes: str = "", 
                        mentee_notes: str = "", session_summary: str = "") -> bool:
        """Mark session as completed and add notes"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE mentorship_sessions 
                        SET session_status = %s,
                            mentor_notes = %s,
                            mentee_notes = %s,
                            session_summary = %s,
                            completed_at = %s,
                            updated_at = %s
                        WHERE id = %s
                    """, (
                        SessionStatus.COMPLETED.value,
                        mentor_notes,
                        mentee_notes,
                        session_summary,
                        datetime.now(),
                        datetime.now(),
                        session_id
                    ))
                    
                    conn.commit()
                    return cursor.rowcount > 0
                    
        except Exception as e:
            logger.error(f"Error completing session: {e}")
            return False

    def get_session_details(self, session_id: str) -> Optional[MentorshipSession]:
        """Get detailed session information"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT ms.*, 
                               mp.user_id as mentor_user_id,
                               u_mentor.full_name as mentor_name,
                               u_mentee.full_name as mentee_name
                        FROM mentorship_sessions ms
                        JOIN mentor_profiles mp ON ms.mentor_id = mp.id
                        JOIN users u_mentor ON mp.user_id = u_mentor.id
                        JOIN users u_mentee ON ms.mentee_user_id = u_mentee.id
                        WHERE ms.id = %s
                    """, (session_id,))
                    
                    row = cursor.fetchone()
                    if not row:
                        return None
                    
                    session = MentorshipSession(
                        id=str(row['id']),
                        mentor_id=str(row['mentor_id']),
                        mentee_user_id=str(row['mentee_user_id']),
                        session_type=SessionType(row['session_type']),
                        scheduled_date=row['scheduled_date'],
                        duration_minutes=row['duration_minutes'],
                        meeting_platform=MeetingPlatform(row['meeting_platform']),
                        meeting_link=row.get('meeting_link'),
                        meeting_id=row.get('meeting_id'),
                        agenda=row.get('agenda', ''),
                        session_notes=row.get('session_notes', ''),
                        mentor_notes=row.get('mentor_notes', ''),
                        mentee_notes=row.get('mentee_notes', ''),
                        status=SessionStatus(row['session_status']),
                        created_at=row['created_at'],
                        updated_at=row['updated_at'],
                        reminder_sent=row.get('reminder_sent', False),
                        feedback_collected=row.get('feedback_collected', False)
                    )
                    
                    return session
                    
        except Exception as e:
            logger.error(f"Error getting session details: {e}")
            return None

    def get_user_sessions(self, user_id: str, user_role: str, 
                         status_filter: Optional[str] = None) -> List[MentorshipSession]:
        """Get sessions for a user (mentor or mentee)"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    if user_role == 'mentor':
                        # Get mentor profile ID
                        cursor.execute("""
                            SELECT id FROM mentor_profiles WHERE user_id = %s
                        """, (user_id,))
                        
                        mentor_profile = cursor.fetchone()
                        if not mentor_profile:
                            return []
                        
                        mentor_id = mentor_profile['id']
                        
                        # Build query for mentor sessions
                        where_clause = "WHERE ms.mentor_id = %s"
                        params = [mentor_id]
                        
                    else:  # mentee/candidate
                        where_clause = "WHERE ms.mentee_user_id = %s"
                        params = [user_id]
                    
                    # Add status filter if provided
                    if status_filter:
                        where_clause += " AND ms.session_status = %s"
                        params.append(status_filter)
                    
                    query = f"""
                        SELECT ms.*, 
                               mp.user_id as mentor_user_id,
                               u_mentor.full_name as mentor_name,
                               u_mentee.full_name as mentee_name
                        FROM mentorship_sessions ms
                        JOIN mentor_profiles mp ON ms.mentor_id = mp.id
                        JOIN users u_mentor ON mp.user_id = u_mentor.id
                        JOIN users u_mentee ON ms.mentee_user_id = u_mentee.id
                        {where_clause}
                        ORDER BY ms.scheduled_date DESC
                    """
                    
                    cursor.execute(query, params)
                    
                    sessions = []
                    for row in cursor.fetchall():
                        session = MentorshipSession(
                            id=str(row['id']),
                            mentor_id=str(row['mentor_id']),
                            mentee_user_id=str(row['mentee_user_id']),
                            session_type=SessionType(row['session_type']),
                            scheduled_date=row['scheduled_date'],
                            duration_minutes=row['duration_minutes'],
                            meeting_platform=MeetingPlatform(row['meeting_platform']),
                            meeting_link=row.get('meeting_link'),
                            meeting_id=row.get('meeting_id'),
                            agenda=row.get('agenda', ''),
                            session_notes=row.get('session_notes', ''),
                            mentor_notes=row.get('mentor_notes', ''),
                            mentee_notes=row.get('mentee_notes', ''),
                            status=SessionStatus(row['session_status']),
                            created_at=row['created_at'],
                            updated_at=row['updated_at'],
                            reminder_sent=row.get('reminder_sent', False),
                            feedback_collected=row.get('feedback_collected', False)
                        )
                        sessions.append(session)
                    
                    return sessions
                    
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []

    def get_session_analytics(self, mentor_id: str = None, mentee_id: str = None) -> Dict:
        """Get session analytics"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    where_clause = "WHERE 1=1"
                    params = []
                    
                    if mentor_id:
                        where_clause += " AND mentor_id = %s"
                        params.append(mentor_id)
                    
                    if mentee_id:
                        where_clause += " AND mentee_user_id = %s"
                        params.append(mentee_id)
                    
                    cursor.execute(f"""
                        SELECT 
                            COUNT(*) as total_sessions,
                            COUNT(CASE WHEN session_status = 'completed' THEN 1 END) as completed_sessions,
                            COUNT(CASE WHEN session_status = 'scheduled' THEN 1 END) as scheduled_sessions,
                            COUNT(CASE WHEN session_status = 'cancelled' THEN 1 END) as cancelled_sessions,
                            AVG(duration_minutes) as avg_duration,
                            COUNT(DISTINCT mentee_user_id) as unique_mentees
                        FROM mentorship_sessions
                        {where_clause}
                    """, params)
                    
                    result = cursor.fetchone()
                    return dict(result) if result else {}
                    
        except Exception as e:
            logger.error(f"Error getting session analytics: {e}")
            return {}
