"""
Real-time Application Status Tracking System
Emirati Journey Platform - Job Seeker Apply Now Enhancement

This module provides comprehensive status tracking, notifications, and real-time updates
for job applications with WebSocket support and automated status transitions.
"""

import psycopg2
import psycopg2.extras
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json
import os
from enum import Enum
import threading
import time
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ApplicationStatus(Enum):
    """Application status enumeration"""
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    OFFER_EXTENDED = "offer_extended"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    HIRED = "hired"

class NotificationType(Enum):
    """Notification type enumeration"""
    APPLICATION_RECEIVED = "application_received"
    STATUS_UPDATE = "status_update"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_REMINDER = "interview_reminder"
    OFFER_EXTENDED = "offer_extended"
    APPLICATION_REJECTED = "application_rejected"
    DOCUMENT_REQUEST = "document_request"
    DEADLINE_REMINDER = "deadline_reminder"

@dataclass
class StatusTransition:
    """Status transition configuration"""
    from_status: ApplicationStatus
    to_status: ApplicationStatus
    auto_transition: bool = False
    delay_hours: int = 0
    conditions: Dict = None
    notification_template: str = ""

class ApplicationStatusTracker:
    """
    Comprehensive application status tracking system with real-time updates,
    automated transitions, and intelligent notifications.
    """
    
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
        }
        
        # Status transition rules
        self.status_transitions = self._initialize_status_transitions()
        
        # Notification templates
        self.notification_templates = self._initialize_notification_templates()
        
        # Start background monitoring
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self._background_monitor, daemon=True)
        self.monitoring_thread.start()
        
        logger.info("✅ Application Status Tracker initialized")
    
    def _get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)
    
    def _initialize_status_transitions(self) -> List[StatusTransition]:
        """Initialize status transition rules"""
        return [
            # Automatic transitions
            StatusTransition(
                from_status=ApplicationStatus.SUBMITTED,
                to_status=ApplicationStatus.UNDER_REVIEW,
                auto_transition=True,
                delay_hours=1,  # Auto-move to review after 1 hour
                notification_template="application_under_review"
            ),
            
            # Manual transitions with notifications
            StatusTransition(
                from_status=ApplicationStatus.UNDER_REVIEW,
                to_status=ApplicationStatus.INTERVIEW_SCHEDULED,
                notification_template="interview_scheduled"
            ),
            
            StatusTransition(
                from_status=ApplicationStatus.INTERVIEW_COMPLETED,
                to_status=ApplicationStatus.OFFER_EXTENDED,
                notification_template="offer_extended"
            ),
            
            StatusTransition(
                from_status=ApplicationStatus.INTERVIEW_COMPLETED,
                to_status=ApplicationStatus.REJECTED,
                notification_template="application_rejected"
            ),
            
            # Final state transitions
            StatusTransition(
                from_status=ApplicationStatus.OFFER_EXTENDED,
                to_status=ApplicationStatus.OFFER_ACCEPTED,
                notification_template="offer_accepted"
            ),
            
            StatusTransition(
                from_status=ApplicationStatus.OFFER_ACCEPTED,
                to_status=ApplicationStatus.HIRED,
                auto_transition=True,
                delay_hours=24,  # Auto-move to hired after 24 hours
                notification_template="welcome_hired"
            )
        ]
    
    def _initialize_notification_templates(self) -> Dict[str, Dict]:
        """Initialize notification message templates"""
        return {
            "application_received": {
                "title": "Application Received",
                "message": "Your application for {job_title} has been received and assigned ID {application_id}. We will review it within 3-5 business days.",
                "priority": "normal"
            },
            "application_under_review": {
                "title": "Application Under Review",
                "message": "Great news! Your application for {job_title} is now being reviewed by our HR team. You can expect to hear from us within 2-3 business days.",
                "priority": "normal"
            },
            "interview_scheduled": {
                "title": "Interview Scheduled",
                "message": "Congratulations! An interview has been scheduled for your application to {job_title}. Please check your email for interview details and preparation materials.",
                "priority": "high"
            },
            "interview_reminder": {
                "title": "Interview Reminder",
                "message": "Reminder: You have an interview scheduled for {interview_date} at {interview_time} for the {job_title} position. Please arrive 15 minutes early.",
                "priority": "high"
            },
            "offer_extended": {
                "title": "Job Offer Extended",
                "message": "Excellent news! We are pleased to extend a job offer for the {job_title} position. Please review the offer details in your dashboard.",
                "priority": "urgent"
            },
            "application_rejected": {
                "title": "Application Update",
                "message": "Thank you for your interest in the {job_title} position. While we were impressed with your qualifications, we have decided to move forward with other candidates. We encourage you to apply for future opportunities.",
                "priority": "normal"
            },
            "offer_accepted": {
                "title": "Offer Acceptance Confirmed",
                "message": "Congratulations! Your acceptance of the {job_title} position has been confirmed. Our HR team will contact you with onboarding details.",
                "priority": "high"
            },
            "welcome_hired": {
                "title": "Welcome to the Team!",
                "message": "Welcome to your new role as {job_title}! We're excited to have you join our team. Please check your email for onboarding instructions and your first day details.",
                "priority": "urgent"
            },
            "document_request": {
                "title": "Additional Documents Required",
                "message": "To proceed with your application for {job_title}, we need additional documents. Please upload the required documents in your application dashboard.",
                "priority": "high"
            },
            "deadline_reminder": {
                "title": "Action Required",
                "message": "Please respond to our offer for the {job_title} position by {deadline_date}. You can accept or decline the offer in your dashboard.",
                "priority": "urgent"
            }
        }
    
    def update_application_status(self, application_id: str, new_status: str, 
                                changed_by: str = None, reason: str = None, 
                                notes: str = None, send_notification: bool = True) -> Tuple[bool, str]:
        """
        Update application status with comprehensive tracking and notifications
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            try:
                # Validate status
                if new_status not in [status.value for status in ApplicationStatus]:
                    return False, f"Invalid status: {new_status}"
                
                # Get current application
                cursor.execute("""
                    SELECT ja.*, u.first_name, u.last_name, u.email
                    FROM job_applications ja
                    JOIN users u ON ja.user_id = u.id
                    WHERE ja.id = %s
                """, (application_id,))
                
                application = cursor.fetchone()
                if not application:
                    return False, "Application not found"
                
                old_status = application['application_status']
                
                # Check if status change is valid
                if old_status == new_status:
                    return True, "Status unchanged"
                
                # Update application status
                cursor.execute("""
                    UPDATE job_applications
                    SET application_status = %s, updated_at = CURRENT_TIMESTAMP, reviewed_by = %s
                    WHERE id = %s
                    RETURNING updated_at
                """, (new_status, changed_by, application_id))
                
                result = cursor.fetchone()
                
                # Add to status history (trigger will handle this, but we can add manual entry with more details)
                cursor.execute("""
                    INSERT INTO application_status_history (
                        application_id, previous_status, new_status, status_reason, notes, changed_by
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (application_id, old_status, new_status, reason, notes, changed_by))
                
                history_id = cursor.fetchone()['id']
                
                # Send notification if requested
                if send_notification:
                    self._create_status_notification(
                        cursor, application_id, application['user_id'], 
                        old_status, new_status, application
                    )
                
                # Record analytics
                cursor.execute("""
                    INSERT INTO application_analytics (
                        application_id, metric_name, metric_value, metric_text
                    ) VALUES (%s, %s, %s, %s)
                """, (
                    application_id, 'status_change',
                    self._calculate_status_progression_score(old_status, new_status),
                    f'Status changed from {old_status} to {new_status}'
                ))
                
                # Check for automatic next transitions
                self._schedule_auto_transitions(cursor, application_id, new_status)
                
                conn.commit()
                
                logger.info(f"Application {application_id} status updated: {old_status} → {new_status}")
                
                return True, f"Status updated successfully to {new_status}"
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Status update error: {str(e)}")
                return False, f"Failed to update status: {str(e)}"
                
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            return False, "Database connection failed"
    
    def _create_status_notification(self, cursor, application_id: str, user_id: str,
                                  old_status: str, new_status: str, application: Dict):
        """Create notification for status change"""
        try:
            # Find appropriate notification template
            template_key = None
            for transition in self.status_transitions:
                if (transition.from_status.value == old_status and 
                    transition.to_status.value == new_status and 
                    transition.notification_template):
                    template_key = transition.notification_template
                    break
            
            if not template_key:
                template_key = "status_update_generic"
            
            # Get template or create generic message
            if template_key in self.notification_templates:
                template = self.notification_templates[template_key]
                title = template["title"]
                message = template["message"].format(
                    job_title=application.get('job_id', 'the position'),
                    application_id=application_id,
                    applicant_name=f"{application['first_name']} {application['last_name']}"
                )
                priority = template.get("priority", "normal")
            else:
                title = f"Application Status Updated"
                message = f"Your application status has been updated to: {new_status.replace('_', ' ').title()}"
                priority = "normal"
            
            # Insert notification
            cursor.execute("""
                INSERT INTO application_notifications (
                    application_id, user_id, notification_type, title, message
                ) VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (application_id, user_id, NotificationType.STATUS_UPDATE.value, title, message))
            
            notification_id = cursor.fetchone()['id']
            
            # TODO: Send actual email/SMS notifications here
            # self._send_email_notification(application['email'], title, message)
            # self._send_sms_notification(application['phone'], message)
            
            logger.info(f"Notification created for application {application_id}: {title}")
            
        except Exception as e:
            logger.error(f"Notification creation error: {str(e)}")
    
    def _calculate_status_progression_score(self, old_status: str, new_status: str) -> float:
        """Calculate progression score for status change"""
        status_scores = {
            'submitted': 10,
            'under_review': 20,
            'interview_scheduled': 40,
            'interview_completed': 60,
            'offer_extended': 80,
            'offer_accepted': 90,
            'hired': 100,
            'rejected': 0,
            'withdrawn': 0,
            'offer_declined': 0
        }
        
        old_score = status_scores.get(old_status, 0)
        new_score = status_scores.get(new_status, 0)
        
        return new_score - old_score
    
    def _schedule_auto_transitions(self, cursor, application_id: str, current_status: str):
        """Schedule automatic status transitions"""
        for transition in self.status_transitions:
            if (transition.from_status.value == current_status and 
                transition.auto_transition and 
                transition.delay_hours > 0):
                
                # Insert scheduled transition
                scheduled_time = datetime.now() + timedelta(hours=transition.delay_hours)
                
                cursor.execute("""
                    INSERT INTO application_analytics (
                        application_id, metric_name, metric_value, metric_text
                    ) VALUES (%s, %s, %s, %s)
                """, (
                    application_id, 'scheduled_transition',
                    transition.delay_hours,
                    f'Auto-transition to {transition.to_status.value} scheduled for {scheduled_time}'
                ))
                
                logger.info(f"Scheduled auto-transition for {application_id}: {current_status} → {transition.to_status.value} in {transition.delay_hours} hours")
    
    def get_application_timeline(self, application_id: str) -> List[Dict]:
        """Get comprehensive timeline for an application"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            try:
                # Get status history
                cursor.execute("""
                    SELECT 
                        ash.previous_status,
                        ash.new_status,
                        ash.status_reason,
                        ash.notes,
                        ash.changed_at,
                        ash.changed_by,
                        u.first_name,
                        u.last_name
                    FROM application_status_history ash
                    LEFT JOIN users u ON ash.changed_by = u.id
                    WHERE ash.application_id = %s
                    ORDER BY ash.changed_at ASC
                """, (application_id,))
                
                status_history = cursor.fetchall()
                
                # Get interviews
                cursor.execute("""
                    SELECT 
                        interview_type,
                        scheduled_date,
                        interview_status,
                        created_at,
                        updated_at
                    FROM application_interviews
                    WHERE application_id = %s
                    ORDER BY scheduled_date ASC
                """, (application_id,))
                
                interviews = cursor.fetchall()
                
                # Get notifications
                cursor.execute("""
                    SELECT 
                        notification_type,
                        title,
                        message,
                        created_at,
                        is_read
                    FROM application_notifications
                    WHERE application_id = %s
                    ORDER BY created_at ASC
                """, (application_id,))
                
                notifications = cursor.fetchall()
                
                # Combine into timeline
                timeline = []
                
                # Add status changes
                for status in status_history:
                    timeline.append({
                        'type': 'status_change',
                        'timestamp': status['changed_at'].isoformat(),
                        'title': f"Status Updated: {status['new_status'].replace('_', ' ').title()}",
                        'description': status['notes'] or f"Application status changed from {status['previous_status']} to {status['new_status']}",
                        'changed_by': f"{status['first_name']} {status['last_name']}" if status['first_name'] else "System",
                        'status': status['new_status'],
                        'reason': status['status_reason']
                    })
                
                # Add interviews
                for interview in interviews:
                    timeline.append({
                        'type': 'interview',
                        'timestamp': interview['scheduled_date'].isoformat(),
                        'title': f"{interview['interview_type'].replace('_', ' ').title()} Scheduled",
                        'description': f"Interview scheduled for {interview['scheduled_date'].strftime('%B %d, %Y at %I:%M %p')}",
                        'status': interview['interview_status'],
                        'interview_type': interview['interview_type']
                    })
                
                # Add key notifications
                for notif in notifications:
                    if notif['notification_type'] in ['interview_scheduled', 'offer_extended', 'application_rejected']:
                        timeline.append({
                            'type': 'notification',
                            'timestamp': notif['created_at'].isoformat(),
                            'title': notif['title'],
                            'description': notif['message'],
                            'notification_type': notif['notification_type'],
                            'is_read': notif['is_read']
                        })
                
                # Sort timeline by timestamp
                timeline.sort(key=lambda x: x['timestamp'])
                
                return timeline
                
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            logger.error(f"Timeline retrieval error: {str(e)}")
            return []
    
    def get_status_analytics(self, user_id: str = None, date_range: int = 30) -> Dict:
        """Get status analytics for applications"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            try:
                # Base query conditions
                where_conditions = ["ja.submitted_at >= %s"]
                params = [datetime.now() - timedelta(days=date_range)]
                
                if user_id:
                    where_conditions.append("ja.user_id = %s")
                    params.append(user_id)
                
                where_clause = " AND ".join(where_conditions)
                
                # Status distribution
                cursor.execute(f"""
                    SELECT 
                        application_status,
                        COUNT(*) as count,
                        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
                    FROM job_applications ja
                    WHERE {where_clause}
                    GROUP BY application_status
                    ORDER BY count DESC
                """, params)
                
                status_distribution = cursor.fetchall()
                
                # Average processing times
                cursor.execute(f"""
                    SELECT 
                        AVG(EXTRACT(EPOCH FROM (updated_at - submitted_at))/3600) as avg_processing_hours,
                        AVG(CASE WHEN application_status IN ('offer_extended', 'hired') 
                            THEN EXTRACT(EPOCH FROM (updated_at - submitted_at))/3600 END) as avg_success_hours,
                        AVG(CASE WHEN application_status = 'rejected' 
                            THEN EXTRACT(EPOCH FROM (updated_at - submitted_at))/3600 END) as avg_rejection_hours
                    FROM job_applications ja
                    WHERE {where_clause}
                """, params)
                
                processing_times = cursor.fetchone()
                
                # Success rates
                cursor.execute(f"""
                    SELECT 
                        COUNT(CASE WHEN application_status IN ('offer_extended', 'offer_accepted', 'hired') THEN 1 END) as successful,
                        COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejected,
                        COUNT(CASE WHEN application_status IN ('submitted', 'under_review', 'interview_scheduled', 'interview_completed') THEN 1 END) as in_progress,
                        COUNT(*) as total
                    FROM job_applications ja
                    WHERE {where_clause}
                """, params)
                
                success_rates = cursor.fetchone()
                
                # Timeline trends (daily counts)
                cursor.execute(f"""
                    SELECT 
                        DATE(submitted_at) as date,
                        COUNT(*) as applications_submitted,
                        COUNT(CASE WHEN application_status IN ('offer_extended', 'hired') THEN 1 END) as offers_made
                    FROM job_applications ja
                    WHERE {where_clause}
                    GROUP BY DATE(submitted_at)
                    ORDER BY date DESC
                    LIMIT 30
                """, params)
                
                timeline_data = cursor.fetchall()
                
                return {
                    'status_distribution': [dict(row) for row in status_distribution],
                    'processing_times': {
                        'average_hours': float(processing_times['avg_processing_hours'] or 0),
                        'success_average_hours': float(processing_times['avg_success_hours'] or 0),
                        'rejection_average_hours': float(processing_times['avg_rejection_hours'] or 0)
                    },
                    'success_rates': {
                        'successful': success_rates['successful'],
                        'rejected': success_rates['rejected'],
                        'in_progress': success_rates['in_progress'],
                        'total': success_rates['total'],
                        'success_percentage': round((success_rates['successful'] / success_rates['total'] * 100) if success_rates['total'] > 0 else 0, 2)
                    },
                    'timeline': [dict(row) for row in timeline_data],
                    'date_range_days': date_range,
                    'generated_at': datetime.now().isoformat()
                }
                
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            logger.error(f"Analytics retrieval error: {str(e)}")
            return {}
    
    def _background_monitor(self):
        """Background monitoring for automatic transitions and reminders"""
        logger.info("🔄 Background status monitoring started")
        
        while self.monitoring_active:
            try:
                self._process_scheduled_transitions()
                self._send_interview_reminders()
                self._check_deadline_reminders()
                
                # Sleep for 5 minutes between checks
                time.sleep(300)
                
            except Exception as e:
                logger.error(f"Background monitoring error: {str(e)}")
                time.sleep(60)  # Wait 1 minute before retrying
    
    def _process_scheduled_transitions(self):
        """Process any scheduled automatic transitions"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            try:
                # Find applications ready for auto-transition
                for transition in self.status_transitions:
                    if transition.auto_transition:
                        cursor.execute("""
                            SELECT id, user_id, application_status, submitted_at, updated_at
                            FROM job_applications
                            WHERE application_status = %s
                            AND updated_at <= %s
                        """, (
                            transition.from_status.value,
                            datetime.now() - timedelta(hours=transition.delay_hours)
                        ))
                        
                        ready_applications = cursor.fetchall()
                        
                        for app in ready_applications:
                            success, message = self.update_application_status(
                                app['id'], 
                                transition.to_status.value,
                                changed_by=None,  # System change
                                reason="Automatic transition",
                                notes=f"Auto-transitioned after {transition.delay_hours} hours"
                            )
                            
                            if success:
                                logger.info(f"Auto-transitioned application {app['id']}: {transition.from_status.value} → {transition.to_status.value}")
                
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            logger.error(f"Scheduled transitions error: {str(e)}")
    
    def _send_interview_reminders(self):
        """Send interview reminders"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            try:
                # Find interviews happening in the next 24 hours
                cursor.execute("""
                    SELECT ai.*, ja.user_id, ja.job_id
                    FROM application_interviews ai
                    JOIN job_applications ja ON ai.application_id = ja.id
                    WHERE ai.scheduled_date BETWEEN %s AND %s
                    AND ai.interview_status = 'scheduled'
                """, (
                    datetime.now(),
                    datetime.now() + timedelta(hours=24)
                ))
                
                upcoming_interviews = cursor.fetchall()
                
                for interview in upcoming_interviews:
                    # Check if reminder already sent
                    cursor.execute("""
                        SELECT id FROM application_notifications
                        WHERE application_id = %s 
                        AND notification_type = %s
                        AND created_at >= %s
                    """, (
                        interview['application_id'],
                        NotificationType.INTERVIEW_REMINDER.value,
                        datetime.now() - timedelta(hours=24)
                    ))
                    
                    if not cursor.fetchone():
                        # Send reminder
                        template = self.notification_templates["interview_reminder"]
                        message = template["message"].format(
                            interview_date=interview['scheduled_date'].strftime('%B %d, %Y'),
                            interview_time=interview['scheduled_date'].strftime('%I:%M %p'),
                            job_title=interview['job_id']
                        )
                        
                        cursor.execute("""
                            INSERT INTO application_notifications (
                                application_id, user_id, notification_type, title, message
                            ) VALUES (%s, %s, %s, %s, %s)
                        """, (
                            interview['application_id'],
                            interview['user_id'],
                            NotificationType.INTERVIEW_REMINDER.value,
                            template["title"],
                            message
                        ))
                        
                        logger.info(f"Interview reminder sent for application {interview['application_id']}")
                
                conn.commit()
                
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            logger.error(f"Interview reminders error: {str(e)}")
    
    def _check_deadline_reminders(self):
        """Check for deadline reminders (e.g., offer response deadlines)"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            try:
                # Find offers that need deadline reminders
                cursor.execute("""
                    SELECT id, user_id, job_id, updated_at
                    FROM job_applications
                    WHERE application_status = 'offer_extended'
                    AND updated_at <= %s
                """, (datetime.now() - timedelta(days=5),))  # 5 days old offers
                
                old_offers = cursor.fetchall()
                
                for offer in old_offers:
                    # Check if deadline reminder already sent
                    cursor.execute("""
                        SELECT id FROM application_notifications
                        WHERE application_id = %s 
                        AND notification_type = %s
                        AND created_at >= %s
                    """, (
                        offer['id'],
                        NotificationType.DEADLINE_REMINDER.value,
                        datetime.now() - timedelta(days=1)
                    ))
                    
                    if not cursor.fetchone():
                        # Send deadline reminder
                        deadline_date = (offer['updated_at'] + timedelta(days=7)).strftime('%B %d, %Y')
                        template = self.notification_templates["deadline_reminder"]
                        message = template["message"].format(
                            job_title=offer['job_id'],
                            deadline_date=deadline_date
                        )
                        
                        cursor.execute("""
                            INSERT INTO application_notifications (
                                application_id, user_id, notification_type, title, message
                            ) VALUES (%s, %s, %s, %s, %s)
                        """, (
                            offer['id'],
                            offer['user_id'],
                            NotificationType.DEADLINE_REMINDER.value,
                            template["title"],
                            message
                        ))
                        
                        logger.info(f"Deadline reminder sent for application {offer['id']}")
                
                conn.commit()
                
            finally:
                cursor.close()
                conn.close()
                
        except Exception as e:
            logger.error(f"Deadline reminders error: {str(e)}")
    
    def stop_monitoring(self):
        """Stop background monitoring"""
        self.monitoring_active = False
        if self.monitoring_thread.is_alive():
            self.monitoring_thread.join(timeout=5)
        logger.info("🛑 Background status monitoring stopped")

# Global instance
status_tracker = ApplicationStatusTracker()

def get_status_tracker() -> ApplicationStatusTracker:
    """Get the global status tracker instance"""
    return status_tracker
