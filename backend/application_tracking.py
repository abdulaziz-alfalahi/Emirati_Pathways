"""
Enhanced Application Tracking System
Provides comprehensive job application lifecycle management
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ApplicationStatus(Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    OFFER_RECEIVED = "offer_received"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class InterviewType(Enum):
    PHONE_SCREENING = "phone_screening"
    VIDEO_INTERVIEW = "video_interview"
    IN_PERSON = "in_person"
    TECHNICAL_ASSESSMENT = "technical_assessment"
    PANEL_INTERVIEW = "panel_interview"
    FINAL_INTERVIEW = "final_interview"

@dataclass
class JobApplication:
    id: str
    user_id: str
    job_id: str
    job_title: str
    company_name: str
    status: ApplicationStatus
    applied_date: datetime
    last_updated: datetime
    cover_letter: str
    resume_version: str
    notes: str
    timeline: List[Dict[str, Any]]
    interviews: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    emiratization_status: bool

@dataclass
class ApplicationMetrics:
    total_applications: int
    active_applications: int
    interviews_scheduled: int
    offers_received: int
    success_rate: float
    avg_response_time: float
    top_industries: List[str]
    application_trends: Dict[str, int]

class EnhancedApplicationTracker:
    def __init__(self):
        """Initialize the enhanced application tracking system"""
        # Database connection
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': os.getenv('DB_PORT', '5432')
        }
        
        logger.info("Enhanced Application Tracker initialized")

    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def create_application(self, user_id: str, job_id: str, application_data: Dict[str, Any]) -> str:
        """Create a new job application"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Generate application ID
                    application_id = f"app_{user_id}_{job_id}_{int(datetime.now().timestamp())}"
                    
                    # Create timeline entry
                    timeline = [{
                        'status': ApplicationStatus.SUBMITTED.value,
                        'timestamp': datetime.now().isoformat(),
                        'notes': 'Application submitted successfully'
                    }]
                    
                    # Insert application
                    cur.execute("""
                        INSERT INTO job_applications (
                            id, user_id, job_id, status, applied_date, last_updated,
                            cover_letter, resume_version, notes, timeline, emiratization_status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        application_id,
                        user_id,
                        job_id,
                        ApplicationStatus.SUBMITTED.value,
                        datetime.now(),
                        datetime.now(),
                        application_data.get('cover_letter', ''),
                        application_data.get('resume_version', 'latest'),
                        application_data.get('notes', ''),
                        json.dumps(timeline),
                        application_data.get('emiratization_status', True)
                    ))
                    
                    conn.commit()
                    logger.info(f"Created application {application_id} for user {user_id}")
                    return application_id
                    
        except Exception as e:
            logger.error(f"Error creating application: {e}")
            raise

    def get_user_applications(self, user_id: str, status_filter: Optional[str] = None) -> List[JobApplication]:
        """Get all applications for a user"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                        SELECT ja.*, j.title as job_title, c.name as company_name
                        FROM job_applications ja
                        LEFT JOIN jobs j ON ja.job_id = j.id
                        LEFT JOIN companies c ON j.company_id = c.id
                        WHERE ja.user_id = %s
                    """
                    params = [user_id]
                    
                    if status_filter:
                        query += " AND ja.status = %s"
                        params.append(status_filter)
                    
                    query += " ORDER BY ja.applied_date DESC"
                    
                    cur.execute(query, params)
                    applications_data = cur.fetchall()
                    
                    applications = []
                    for app_data in applications_data:
                        # Get interviews
                        cur.execute("""
                            SELECT * FROM job_interviews 
                            WHERE application_id = %s 
                            ORDER BY scheduled_date ASC
                        """, (app_data['id'],))
                        interviews = cur.fetchall()
                        
                        # Get documents
                        cur.execute("""
                            SELECT * FROM application_documents 
                            WHERE application_id = %s 
                            ORDER BY uploaded_date DESC
                        """, (app_data['id'],))
                        documents = cur.fetchall()
                        
                        application = JobApplication(
                            id=app_data['id'],
                            user_id=app_data['user_id'],
                            job_id=app_data['job_id'],
                            job_title=app_data['job_title'] or 'Unknown Position',
                            company_name=app_data['company_name'] or 'Unknown Company',
                            status=ApplicationStatus(app_data['status']),
                            applied_date=app_data['applied_date'],
                            last_updated=app_data['last_updated'],
                            cover_letter=app_data['cover_letter'] or '',
                            resume_version=app_data['resume_version'] or 'latest',
                            notes=app_data['notes'] or '',
                            timeline=json.loads(app_data['timeline']) if app_data['timeline'] else [],
                            interviews=[dict(interview) for interview in interviews],
                            documents=[dict(doc) for doc in documents],
                            emiratization_status=app_data.get('emiratization_status', True)
                        )
                        applications.append(application)
                    
                    return applications
                    
        except Exception as e:
            logger.error(f"Error getting user applications: {e}")
            return []

    def update_application_status(self, application_id: str, new_status: ApplicationStatus, notes: str = '') -> bool:
        """Update application status and add timeline entry"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Get current timeline
                    cur.execute("SELECT timeline FROM job_applications WHERE id = %s", (application_id,))
                    result = cur.fetchone()
                    
                    if not result:
                        logger.error(f"Application {application_id} not found")
                        return False
                    
                    timeline = json.loads(result[0]) if result[0] else []
                    
                    # Add new timeline entry
                    timeline.append({
                        'status': new_status.value,
                        'timestamp': datetime.now().isoformat(),
                        'notes': notes
                    })
                    
                    # Update application
                    cur.execute("""
                        UPDATE job_applications 
                        SET status = %s, last_updated = %s, timeline = %s
                        WHERE id = %s
                    """, (
                        new_status.value,
                        datetime.now(),
                        json.dumps(timeline),
                        application_id
                    ))
                    
                    conn.commit()
                    logger.info(f"Updated application {application_id} status to {new_status.value}")
                    return True
                    
        except Exception as e:
            logger.error(f"Error updating application status: {e}")
            return False

    def schedule_interview(self, application_id: str, interview_data: Dict[str, Any]) -> str:
        """Schedule an interview for an application"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    interview_id = f"int_{application_id}_{int(datetime.now().timestamp())}"
                    
                    cur.execute("""
                        INSERT INTO job_interviews (
                            id, application_id, interview_type, scheduled_date,
                            duration_minutes, location, interviewer_name,
                            interviewer_email, notes, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        interview_id,
                        application_id,
                        interview_data.get('type', InterviewType.VIDEO_INTERVIEW.value),
                        interview_data.get('scheduled_date'),
                        interview_data.get('duration_minutes', 60),
                        interview_data.get('location', ''),
                        interview_data.get('interviewer_name', ''),
                        interview_data.get('interviewer_email', ''),
                        interview_data.get('notes', ''),
                        'scheduled'
                    ))
                    
                    # Update application status
                    self.update_application_status(
                        application_id, 
                        ApplicationStatus.INTERVIEW_SCHEDULED,
                        f"Interview scheduled for {interview_data.get('scheduled_date')}"
                    )
                    
                    conn.commit()
                    logger.info(f"Scheduled interview {interview_id} for application {application_id}")
                    return interview_id
                    
        except Exception as e:
            logger.error(f"Error scheduling interview: {e}")
            raise

    def get_application_metrics(self, user_id: str) -> ApplicationMetrics:
        """Get comprehensive application metrics for a user"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Total applications
                    cur.execute("SELECT COUNT(*) FROM job_applications WHERE user_id = %s", (user_id,))
                    total_applications = cur.fetchone()[0]
                    
                    # Active applications (not rejected, withdrawn, or accepted)
                    cur.execute("""
                        SELECT COUNT(*) FROM job_applications 
                        WHERE user_id = %s AND status NOT IN ('rejected', 'withdrawn', 'accepted')
                    """, (user_id,))
                    active_applications = cur.fetchone()[0]
                    
                    # Interviews scheduled
                    cur.execute("""
                        SELECT COUNT(*) FROM job_interviews ji
                        JOIN job_applications ja ON ji.application_id = ja.id
                        WHERE ja.user_id = %s
                    """, (user_id,))
                    interviews_scheduled = cur.fetchone()[0]
                    
                    # Offers received
                    cur.execute("""
                        SELECT COUNT(*) FROM job_applications 
                        WHERE user_id = %s AND status = 'offer_received'
                    """, (user_id,))
                    offers_received = cur.fetchone()[0]
                    
                    # Success rate
                    success_rate = (offers_received / total_applications * 100) if total_applications > 0 else 0
                    
                    # Average response time (days)
                    cur.execute("""
                        SELECT AVG(EXTRACT(EPOCH FROM (last_updated - applied_date))/86400) 
                        FROM job_applications 
                        WHERE user_id = %s AND status != 'submitted'
                    """, (user_id,))
                    avg_response_time = cur.fetchone()[0] or 0
                    
                    # Top industries
                    cur.execute("""
                        SELECT c.industry, COUNT(*) as count
                        FROM job_applications ja
                        JOIN jobs j ON ja.job_id = j.id
                        JOIN companies c ON j.company_id = c.id
                        WHERE ja.user_id = %s
                        GROUP BY c.industry
                        ORDER BY count DESC
                        LIMIT 5
                    """, (user_id,))
                    top_industries = [row['industry'] for row in cur.fetchall() if row['industry']]
                    
                    # Application trends (last 6 months)
                    cur.execute("""
                        SELECT DATE_TRUNC('month', applied_date) as month, COUNT(*) as count
                        FROM job_applications 
                        WHERE user_id = %s AND applied_date >= %s
                        GROUP BY month
                        ORDER BY month
                    """, (user_id, datetime.now() - timedelta(days=180)))
                    trends_data = cur.fetchall()
                    application_trends = {
                        row['month'].strftime('%Y-%m'): row['count'] 
                        for row in trends_data
                    }
                    
                    return ApplicationMetrics(
                        total_applications=total_applications,
                        active_applications=active_applications,
                        interviews_scheduled=interviews_scheduled,
                        offers_received=offers_received,
                        success_rate=round(success_rate, 1),
                        avg_response_time=round(float(avg_response_time), 1),
                        top_industries=top_industries,
                        application_trends=application_trends
                    )
                    
        except Exception as e:
            logger.error(f"Error getting application metrics: {e}")
            return ApplicationMetrics(
                total_applications=0,
                active_applications=0,
                interviews_scheduled=0,
                offers_received=0,
                success_rate=0.0,
                avg_response_time=0.0,
                top_industries=[],
                application_trends={}
            )

    def get_upcoming_interviews(self, user_id: str, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """Get upcoming interviews for a user"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT ji.*, ja.job_id, j.title as job_title, c.name as company_name
                        FROM job_interviews ji
                        JOIN job_applications ja ON ji.application_id = ja.id
                        JOIN jobs j ON ja.job_id = j.id
                        LEFT JOIN companies c ON j.company_id = c.id
                        WHERE ja.user_id = %s 
                        AND ji.scheduled_date >= %s 
                        AND ji.scheduled_date <= %s
                        AND ji.status = 'scheduled'
                        ORDER BY ji.scheduled_date ASC
                    """, (
                        user_id,
                        datetime.now(),
                        datetime.now() + timedelta(days=days_ahead)
                    ))
                    
                    interviews = cur.fetchall()
                    return [dict(interview) for interview in interviews]
                    
        except Exception as e:
            logger.error(f"Error getting upcoming interviews: {e}")
            return []

    def add_application_note(self, application_id: str, note: str) -> bool:
        """Add a note to an application"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE job_applications 
                        SET notes = COALESCE(notes, '') || %s || E'\n',
                            last_updated = %s
                        WHERE id = %s
                    """, (
                        f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {note}",
                        datetime.now(),
                        application_id
                    ))
                    
                    conn.commit()
                    return True
                    
        except Exception as e:
            logger.error(f"Error adding application note: {e}")
            return False

    def withdraw_application(self, application_id: str, reason: str = '') -> bool:
        """Withdraw a job application"""
        return self.update_application_status(
            application_id,
            ApplicationStatus.WITHDRAWN,
            f"Application withdrawn. Reason: {reason}" if reason else "Application withdrawn"
        )

# Initialize the enhanced application tracker
enhanced_application_tracker = EnhancedApplicationTracker()
