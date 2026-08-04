"""Application status transitions: one recorder, called by every writer.

job_applications.status is written from ~9 places (recruiter status PUT,
shortlist, interview scheduling, offers, candidate withdraw/accept, …). Each
of them should do two things it historically did not:

  1. append the transition to application_status_history (the candidate-facing
     timeline's spine), and
  2. tell the candidate — the C1-CAN-5 review found status changes produced no
     notification at any write site.

Both are best-effort: a telemetry/notification failure must never roll back or
mask the primary write, so everything here swallows and logs.
"""

import logging

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

try:
    from backend.notification_helper import create_notification
except ImportError:  # pragma: no cover
    from notification_helper import create_notification

logger = logging.getLogger(__name__)

# Candidate-facing wording per status; anything unlisted gets the generic line.
_STATUS_TITLES = {
    'under_review': 'Your application is under review',
    'shortlisted': 'You have been shortlisted',
    'interview': 'Your application moved to the interview stage',
    'interview_scheduled': 'Your application moved to the interview stage',
    'offer': 'You have received a job offer',
    'hired': 'Congratulations — you have been hired',
    'rejected': 'Update on your application',
    'withdrawn': 'Your application was withdrawn',
    'accepted': 'Offer accepted',
}


def record_status_change(application_id, new_status, changed_by=None,
                         note=None, notify_candidate=True):
    """Append a history row for the transition and notify the candidate.

    Reads the application's current status/candidate itself, so callers can
    invoke it BEFORE their UPDATE (previous status is captured) or after
    (the no-op guard keeps the history clean). Never raises.
    """
    try:
        new_status = (new_status or '').strip().lower()
        if not application_id or not new_status:
            return

        row = execute_query(
            """SELECT ja.candidate_id, LOWER(COALESCE(ja.status, '')) AS status,
                      jp.title AS job_title
               FROM job_applications ja
               LEFT JOIN job_postings jp ON jp.id::text = ja.job_id
               WHERE ja.id = %s""",
            (str(application_id),), fetch_one=True)
        if not row:
            return
        previous = row.get('status') or None
        if previous == new_status:
            return

        execute_query(
            """INSERT INTO application_status_history
                   (id, application_id, previous_status, new_status, changed_by, notes)
               VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)""",
            (str(application_id), previous, new_status,
             str(changed_by) if changed_by else None, note))

        candidate_id = row.get('candidate_id')
        # Candidate-initiated transitions (withdraw/accept) need no echo back.
        if notify_candidate and candidate_id and str(changed_by) != str(candidate_id):
            job = row.get('job_title') or 'a position'
            title = _STATUS_TITLES.get(new_status, 'Update on your application')
            create_notification(
                user_id=str(candidate_id),
                notification_type='application_update',
                title=title,
                message=f"Your application for {job} is now: {new_status.replace('_', ' ')}",
                # Land on the dashboard's Applications tab, not the legacy
                # standalone /applications page — that page has no platform
                # navigation or theme, and its list is a different data path
                # (feedback fb_1785809872).
                metadata={'application_id': str(application_id),
                          'new_status': new_status,
                          'link': '/candidate-dashboard?tab=applications'})
    except Exception as e:  # pragma: no cover
        logger.warning(f"application history record failed for {application_id}: {e}")
