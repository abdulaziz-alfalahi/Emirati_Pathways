"""
Notification Helper Module
Creates and manages notifications for cross-persona workflow events.

Provides a generic create_notification() function and convenience wrappers
for each canonical domain event in the offer lifecycle.

Usage:
    from backend.notification_helper import notify_offer_pending_approval
    notify_offer_pending_approval(hr_user_id, {
        'offer_id': offer_id,
        'candidate_name': 'Ahmed Al Falahi',
        'job_title': 'Senior Engineer',
        'company_name': 'ADNOC'
    })
"""

import psycopg2
import psycopg2.extras
import os
import json
import logging

logger = logging.getLogger(__name__)

DB_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)


def create_notification(user_id, notification_type, title, message='', metadata=None):
    """Insert a notification for a user.

    Args:
        user_id: Target user ID
        notification_type: Event type string (e.g. 'offer_pending_approval')
        title: Short notification title
        message: Optional longer description
        metadata: Optional dict with contextual data (offer_id, job_id, etc.)

    Returns:
        Notification ID on success, None on failure.
    """
    conn = None
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO notifications (user_id, type, title, content, metadata)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id,
            notification_type,
            title,
            message,
            json.dumps(metadata or {})
        ))
        notification_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"Notification created: type={notification_type} user={user_id} id={notification_id}")
        
        # G12: Push real-time notification via SocketIO
        try:
            from flask import current_app
            push_fn = getattr(current_app, 'push_notification_to_user', None)
            if push_fn:
                push_fn(user_id, 'new_notification', {
                    'id': str(notification_id),
                    'type': notification_type,
                    'title': title,
                    'message': message,
                    'metadata': metadata or {},
                    'read': False
                })
        except RuntimeError:
            # Outside Flask app context — skip SocketIO push
            pass
        except Exception as push_err:
            logger.debug(f"G12: SocketIO push skipped: {push_err}")
        
        return notification_id
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        if conn:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        return None


def _create_multi(user_ids, notification_type, title, message='', metadata=None):
    """Create the same notification for multiple users."""
    results = []
    for uid in user_ids:
        nid = create_notification(uid, notification_type, title, message, metadata)
        results.append(nid)
    return results


# ─── OFFER LIFECYCLE NOTIFICATIONS ──────────────────────────────────────────

def notify_offer_pending_approval(hr_user_id, offer_data):
    """HR Manager receives: 'New offer awaiting your approval'."""
    return create_notification(
        user_id=hr_user_id,
        notification_type='offer_pending_approval',
        title=f"Offer pending approval: {offer_data.get('candidate_name', 'Candidate')} for {offer_data.get('job_title', 'position')}",
        message=f"A new offer has been submitted for your review and approval.",
        metadata=offer_data
    )


def notify_offer_approved(recruiter_user_id, offer_data):
    """Recruiter receives: 'Offer approved by HR — ready to send'."""
    return create_notification(
        user_id=recruiter_user_id,
        notification_type='offer_approved',
        title=f"Offer approved: {offer_data.get('candidate_name', 'Candidate')} for {offer_data.get('job_title', 'position')}",
        message=f"HR has approved the offer. You can now send it to the candidate.",
        metadata=offer_data
    )


def notify_offer_rejected(recruiter_user_id, offer_data):
    """Recruiter receives: 'Offer rejected by HR'."""
    return create_notification(
        user_id=recruiter_user_id,
        notification_type='offer_rejected',
        title=f"Offer rejected: {offer_data.get('candidate_name', 'Candidate')} for {offer_data.get('job_title', 'position')}",
        message=f"HR has rejected the offer. Review the feedback and revise if needed.",
        metadata=offer_data
    )


def notify_offer_sent(candidate_user_id, offer_data):
    """Candidate receives: 'You have a new job offer!'."""
    return create_notification(
        user_id=candidate_user_id,
        notification_type='offer_sent',
        title=f"New offer received: {offer_data.get('job_title', 'position')} at {offer_data.get('company_name', 'company')}",
        message=f"You have received a job offer! Review the details and respond.",
        metadata=offer_data
    )


def notify_offer_accepted(recruiter_user_id, hr_user_id, offer_data):
    """Recruiter and HR Manager both receive: 'Candidate accepted the offer!'."""
    _create_multi(
        user_ids=[recruiter_user_id, hr_user_id],
        notification_type='offer_accepted',
        title=f"Offer accepted: {offer_data.get('candidate_name', 'Candidate')} for {offer_data.get('job_title', 'position')}",
        message=f"The candidate has accepted the offer. Onboarding can begin.",
        metadata=offer_data
    )


def notify_offer_declined(recruiter_user_id, hr_user_id, offer_data):
    """Recruiter and HR Manager both receive: 'Candidate declined the offer'."""
    _create_multi(
        user_ids=[recruiter_user_id, hr_user_id],
        notification_type='offer_declined',
        title=f"Offer declined: {offer_data.get('candidate_name', 'Candidate')} for {offer_data.get('job_title', 'position')}",
        message=f"The candidate has declined the offer.",
        metadata=offer_data
    )


# ─── INTERVIEW NOTIFICATIONS ────────────────────────────────────────────────

def notify_interview_scheduled(candidate_user_id, interview_data):
    """Candidate receives: 'Interview scheduled'."""
    return create_notification(
        user_id=candidate_user_id,
        notification_type='interview_scheduled',
        title=f"Interview scheduled: {interview_data.get('job_title', 'position')} at {interview_data.get('company_name', 'company')}",
        message=f"You have been invited to an interview. Check the details and prepare.",
        metadata=interview_data
    )


# ─── APPLICATION NOTIFICATIONS ──────────────────────────────────────────────

def notify_application_received(recruiter_user_id, application_data):
    """Recruiter receives: 'New application received'."""
    return create_notification(
        user_id=recruiter_user_id,
        notification_type='application_received',
        title=f"New application: {application_data.get('candidate_name', 'Candidate')} for {application_data.get('job_title', 'position')}",
        message=f"A new candidate has applied for your posted position.",
        metadata=application_data
    )


def notify_shortlisted(candidate_user_id, application_data):
    """Candidate receives: 'You've been shortlisted!'."""
    return create_notification(
        user_id=candidate_user_id,
        notification_type='candidate_shortlisted',
        title=f"Shortlisted: {application_data.get('job_title', 'position')} at {application_data.get('company_name', 'company')}",
        message=f"Congratulations! You have been shortlisted for this position.",
        metadata=application_data
    )


# ─── PANEL INTERVIEW NOTIFICATIONS ──────────────────────────────────────────

def notify_panel_invite(panelist_user_id, interview_data):
    """Panelist receives: 'You have been invited to a panel interview'."""
    return create_notification(
        user_id=panelist_user_id,
        notification_type='panel_invite',
        title=f"Panel Interview Invitation: {interview_data.get('job_title', 'position')}",
        message=f"You have been invited as a panelist for '{interview_data.get('interview_title', 'Interview')}' on {interview_data.get('scheduled_at', 'TBD')}.",
        metadata=interview_data
    )
