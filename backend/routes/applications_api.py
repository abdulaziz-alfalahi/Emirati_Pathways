"""
Job Applications API — /api/applications

The frontend applicationService (src/services/applicationService.ts) has always
called /api/applications/*, but no blueprint ever owned that prefix — the
2026-07-23 service-catalog audit found /api/applications/my-applications
returning the global 404 handler, which is why the Applications page never
listed anything (catalog EJ-02).

Implements the candidate-facing core against the LIVE schema
(job_applications: id text, job_id text, candidate_id text, status,
cover_letter, applied_at/submitted_at, expected_salary text) joined to
job_postings (id integer) and companies (name/company_name drift → COALESCE).
"""

import uuid
import logging
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import (require_auth, require_roles, resolve_roles,
                                             RECRUITER_ROLES, ADMIN_ROLES)
    from backend.workspace_middleware import get_company_context
except ImportError:  # pragma: no cover — app also runs from backend/ as cwd
    from db_utils import execute_query
    from auth.access_control import (require_auth, require_roles, resolve_roles,
                                     RECRUITER_ROLES, ADMIN_ROLES)
    from workspace_middleware import get_company_context

logger = logging.getLogger(__name__)

applications_bp = Blueprint('applications_api', __name__, url_prefix='/api/applications')


def _company_of_job(job_id):
    """Return the owning company_id (uuid) of a job posting, or None."""
    row = execute_query("SELECT company_id FROM job_postings WHERE id::text = %s",
                        (str(job_id),), fetch_one=True)
    return row['company_id'] if row else None


def _caller_owns_job(user_id, job_id):
    """True if the caller created/owns this job posting.

    31 of 329 live postings have no company_id (created through the JD builder,
    which only stores a company when it resolves to a real UUID). A company-only
    check locks those jobs' own recruiter out of their applicants — reported as
    'applicants list unavailable' (feedback fb_1785752603). Ownership is checked
    against the posting's own recruiter columns, so this unblocks the owner
    without widening cross-company access.
    """
    if not job_id:
        return False
    row = execute_query(
        """SELECT COALESCE(recruiter_id::text, posted_by::text, created_by::text) AS owner
           FROM job_postings WHERE id::text = %s OR jd_id = %s LIMIT 1""",
        (str(job_id), str(job_id)), fetch_one=True)
    return bool(row and row.get('owner') and str(row['owner']) == str(user_id))


def _caller_may_manage_company(user_id, company_id, job_id=None):
    """Recruiter-side authorization: the caller must be an accepted team member
    (or growth operator) of the company that owns the job, the job's own
    recruiter, or a platform admin. Closes the cross-company BOLA (audit H1)."""
    if resolve_roles() & ADMIN_ROLES:
        return True
    if job_id is not None and _caller_owns_job(user_id, job_id):
        return True
    if not company_id:
        return False
    try:
        ctx = get_company_context(user_id, str(company_id))
    except Exception as e:  # never fail open
        logger.warning(f"company context check failed: {e}")
        return False
    return bool(ctx and (ctx.get('is_member') or ctx.get('is_growth_operator')))

try:
    from backend.application_history import record_status_change as _record_status
except ImportError:  # pragma: no cover
    from application_history import record_status_change as _record_status

# Statuses a candidate may see; transitions the candidate may set themselves.
_CANDIDATE_SETTABLE = {'withdrawn'}
# The canonical ladder, from the one module that defines it (#410). This set
# previously omitted three values its OWN code wrote — 'accepted',
# 'interview_scheduled' and 'offered' — so a status could be written that this
# very endpoint would have refused.
try:
    from backend.application_stages import ALL_APPLICATION_STATUSES, normalise_status
except ImportError:  # pragma: no cover
    from application_stages import ALL_APPLICATION_STATUSES, normalise_status

_VALID_STATUSES = set(ALL_APPLICATION_STATUSES)

_BASE_SELECT = """
    SELECT ja.id, ja.job_id, ja.candidate_id, ja.status, ja.cover_letter,
           ja.expected_salary, ja.applied_at, ja.submitted_at, ja.updated_at,
           COALESCE(ja.interview_date::timestamp, sched.scheduled_date::timestamp) AS interview_date,
           COALESCE(ja.interview_type, sched.interview_type) AS interview_type,
           hist.timeline,
           COALESCE(jp.recruiter_id::text, jp.posted_by::text, jp.created_by::text) AS recruiter_id,
           jp.title AS job_title, jp.emirate, jp.city,
           COALESCE(c.name, c.company_name, '') AS company_name
    FROM job_applications ja
    LEFT JOIN job_postings jp ON jp.id::text = ja.job_id
    LEFT JOIN companies c ON c.id = jp.company_id
    LEFT JOIN LATERAL (
        -- Scheduled interviews live in interview_schedules, not on
        -- job_applications.interview_date — so the column was always null even
        -- after an interview was booked (C1 UAT [C1-CAN-5]). Pull the latest
        -- non-cancelled one, matched by application id or candidate+job.
        SELECT isch.scheduled_date, isch.interview_type
        FROM interview_schedules isch
        WHERE (isch.application_id::text = ja.id::text
               OR (isch.candidate_id::text = ja.candidate_id::text
                   AND isch.job_posting_id::text = ja.job_id::text))
          AND COALESCE(isch.status, '') NOT IN ('cancelled', 'canceled')
        ORDER BY isch.scheduled_date DESC NULLS LAST
        LIMIT 1
    ) sched ON TRUE
    LEFT JOIN LATERAL (
        -- Status timeline (C1-CAN-5): every recorded transition, oldest first.
        SELECT json_agg(json_build_object(
                   'status', h.new_status,
                   'at', h.changed_at,
                   'note', h.notes) ORDER BY h.changed_at) AS timeline
        FROM application_status_history h
        WHERE h.application_id = ja.id
    ) hist ON TRUE
"""


def _row_out(r):
    return {
        'id': r['id'],
        'job_id': r['job_id'],
        'candidate_id': r['candidate_id'],
        'status': r['status'],
        'cover_letter': r.get('cover_letter'),
        'expected_salary': r.get('expected_salary'),
        'salary_currency': 'AED',
        'job_title': r.get('job_title') or '',
        'company_name': r.get('company_name') or '',
        'emirate': r.get('emirate'),
        'city': r.get('city'),
        'interview_date': r['interview_date'].isoformat() if r.get('interview_date') else None,
        'interview_type': r.get('interview_type'),
        'created_at': (r.get('applied_at') or r.get('submitted_at')).isoformat()
                      if (r.get('applied_at') or r.get('submitted_at')) else None,
        'updated_at': r['updated_at'].isoformat() if r.get('updated_at') else None,
        # Recorded transitions, oldest first (backfilled from submitted_at +
        # current status by migration 041; live transitions append via
        # application_history.record_status_change).
        'timeline': r.get('timeline') or [],
        # Job owner — lets the candidate message the right person instead of
        # the frontend's old hardcoded 'recruiter-id' placeholder.
        'recruiter_id': r.get('recruiter_id'),
    }


@applications_bp.route('/my-applications', methods=['GET'])
@require_auth
def my_applications():
    """Applications belonging to the authenticated candidate."""
    try:
        user_id = get_jwt_identity()
        rows = execute_query(
            _BASE_SELECT + " WHERE ja.candidate_id = %s ORDER BY COALESCE(ja.applied_at, ja.submitted_at) DESC",
            (user_id,)
        ) or []
        return jsonify({'success': True, 'data': [_row_out(r) for r in rows]})
    except Exception as e:
        logger.error(f"my-applications failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load applications'}), 500


# ── Open-application limit, and the recruiter obligation that makes it fair ──
#
# Requested by a recruiter 2026-09-02 (fb_1788343258). The owner settled the
# shape of it the same day:
#
#   "I need to put a mechanism in place so the candidate can't apply for more
#    than three jobs since the matching and scoring are already done, and at the
#    same time I need to put some control on recruiters not to keep candidates
#    hanging there."
#
# Those two halves are ONE mechanism, and this is the whole design:
#
# A candidate may hold three LIVE applications. Not three ever, and not three
# per rolling window — three that an employer is currently supposed to be acting
# on. The justification is that matching already narrows the field, so applying
# to everything adds nothing.
#
# That cap is only defensible if the employer moves. So an application the
# EMPLOYER has left untouched past the response window stops counting against
# the candidate, and counts against the employer instead. A recruiter sitting on
# an application no longer costs the candidate a slot — it costs the recruiter a
# breach. Nothing else would be fair: without this, three silent employers could
# lock a citizen out of applying for work indefinitely, with no action available
# to them.
#
# WHERE THE NUMBERS COME FROM: three is the owner's and the requester's.
# RESPONSE_WINDOW_DAYS is MINE, proposed at 7 and named here so it is one edit
# to change once somebody decides the real service standard.
OPEN_APPLICATION_LIMIT = 3
RESPONSE_WINDOW_DAYS = 7

#: The employer is expected to act next.
AWAITING_EMPLOYER = ('submitted', 'under_review', 'shortlisted', 'interview_scheduled')
#: The candidate is expected to act next — the employer has done their part, so
#: these never age into a breach, and they still occupy a slot.
AWAITING_CANDIDATE = ('offered', 'offer_received')
#: Finished. Frees the slot and ends any obligation on either side.
TERMINAL = ('withdrawn', 'rejected', 'hired', 'accepted', 'declined')


def _open_application_state(user_id):
    """(counted, released, next_free_at) for this candidate.

    `counted` are live applications that still occupy a slot. `released` are
    live applications the employer has left past the window — they no longer
    count against the candidate. `next_free_at` is when the oldest counted
    application would itself age out, so the refusal can say something better
    than "later".
    """
    rows = execute_query(
        """SELECT status,
                  COALESCE(updated_at, submitted_at, applied_at) AS last_touched
             FROM job_applications
            WHERE candidate_id = %s
              AND status <> ALL(%s)
        """, (user_id, list(TERMINAL))) or []

    cutoff = datetime.now(timezone.utc) - timedelta(days=RESPONSE_WINDOW_DAYS)
    counted, released, oldest = 0, 0, None
    for row in rows:
        touched = row.get('last_touched')
        if touched is not None and touched.tzinfo is None:
            touched = touched.replace(tzinfo=timezone.utc)
        stale = (row.get('status') in AWAITING_EMPLOYER
                 and touched is not None and touched < cutoff)
        if stale:
            released += 1
            continue
        counted += 1
        if touched is not None and (oldest is None or touched < oldest):
            oldest = touched

    next_free = (oldest + timedelta(days=RESPONSE_WINDOW_DAYS)) if oldest else None
    return counted, released, next_free


def employers_not_responding(company_id=None):
    """Applications left past the response window, grouped by employer.

    The other half of the owner's instruction. Reported rather than enforced:
    the consequence of a red flag is somebody's decision, and a platform that
    silently penalises an employer it has never told is not governance.
    """
    rows = execute_query(
        """SELECT jp.company_id,
                  COUNT(*) AS overdue,
                  MIN(COALESCE(ja.updated_at, ja.submitted_at, ja.applied_at)) AS waiting_since
             FROM job_applications ja
             JOIN job_postings jp ON jp.id::text = ja.job_id::text
            WHERE ja.status = ANY(%s)
              AND COALESCE(ja.updated_at, ja.submitted_at, ja.applied_at)
                  < NOW() - make_interval(days => %s)
              AND (%s IS NULL OR jp.company_id::text = %s)
            GROUP BY jp.company_id
            ORDER BY 2 DESC
        """, (list(AWAITING_EMPLOYER), RESPONSE_WINDOW_DAYS,
              company_id, company_id)) or []
    return [{
        'company_id': str(r['company_id']) if r['company_id'] else None,
        'overdue': int(r['overdue']),
        'waiting_since': r['waiting_since'].isoformat() if r['waiting_since'] else None,
        # "more than three occasions" (fb_1788343258).
        'flagged': int(r['overdue']) > 3,
    } for r in rows]


@applications_bp.route('/apply', methods=['POST'])
@require_auth
def apply():
    """Submit an application to a job posting."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        job_id = str(data.get('job_id') or '').strip()
        if not job_id:
            return jsonify({'success': False, 'message': 'job_id is required'}), 400

        job = execute_query("SELECT id, status FROM job_postings WHERE id::text = %s",
                            (job_id,), fetch_one=True)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        # Only published jobs are open to applications — not drafts or
        # unverified-company postings (audit M1).
        if (job.get('status') or '') != 'published':
            return jsonify({'success': False, 'message': 'This job is not open for applications'}), 409

        dup = execute_query(
            "SELECT id FROM job_applications WHERE candidate_id = %s AND job_id = %s AND status != 'withdrawn'",
            (user_id, job_id), fetch_one=True)
        if dup:
            return jsonify({'success': False, 'message': 'You have already applied to this job'}), 409

        # After the duplicate check on purpose: someone re-clicking a job they
        # already applied to should be told that, not that they are at a limit.
        counted, released, next_free = _open_application_state(user_id)
        if counted >= OPEN_APPLICATION_LIMIT:
            when = (f' The earliest is likely to move on '
                    f'{next_free.date().isoformat()}.' if next_free else '')
            return jsonify({
                'success': False,
                'code': 'open_application_limit_reached',
                'message': (
                    f'You have {counted} applications still being considered, which '
                    f'is the limit. Employers are matched to you on your profile, so '
                    f'applying more widely does not improve your chances.{when} '
                    'Withdraw an application, or wait for an employer to respond.'),
                'message_ar': (
                    f'لديك {counted} طلبات ما زالت قيد النظر، وهو الحد الأقصى. '
                    'يتم ترشيحك لأصحاب العمل بناءً على ملفك، لذا فإن التقديم على '
                    'المزيد لا يحسّن فرصك. يمكنك سحب أحد الطلبات أو انتظار رد صاحب العمل.'),
                'limit': OPEN_APPLICATION_LIMIT,
                'open_applications': counted,
                # Shown so a candidate can see the platform is not holding them
                # to applications nobody is acting on.
                'released_by_employer_delay': released,
                'next_free_at': next_free.isoformat() if next_free else None,
            }), 429

        app_id = str(uuid.uuid4())
        execute_query(
            """INSERT INTO job_applications
                   (id, job_id, candidate_id, cover_letter, expected_salary,
                    status, applied_at, submitted_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, 'submitted', NOW(), NOW(), NOW())""",
            (app_id, job_id, user_id,
             (data.get('cover_letter') or '')[:8000],
             str(data.get('expected_salary') or '')[:60]),
            fetch_all=False,
        )
        # Tell the job's owner — this apply path notified nobody (the parallel
        # job_application_routes path did).
        try:
            try:
                from backend.notification_helper import create_notification as _notify
            except ImportError:
                from notification_helper import create_notification as _notify
            owner = execute_query(
                "SELECT COALESCE(recruiter_id::text, posted_by::text, created_by::text) AS owner, title "
                "FROM job_postings WHERE id::text = %s", (job_id,), fetch_one=True)
            if owner and owner.get('owner'):
                _notify(user_id=str(owner['owner']),
                        notification_type='application_received',
                        title='New application received',
                        message=f"A candidate applied to '{owner.get('title') or 'your job posting'}'.",
                        metadata={'application_id': app_id, 'job_id': job_id})
        except Exception as notify_err:
            logger.warning(f"apply notify failed: {notify_err}")
        return jsonify({'success': True, 'message': 'Application submitted successfully',
                        'data': {'id': app_id, 'job_id': job_id, 'status': 'submitted'}}), 201
    except Exception as e:
        logger.error(f"apply failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to submit application'}), 500


@applications_bp.route('/<application_id>', methods=['GET'])
@require_auth
def get_application(application_id):
    try:
        user_id = get_jwt_identity()
        row = execute_query(_BASE_SELECT + " WHERE ja.id = %s", (application_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        # Candidates may only read their own application (recruiter roles may read all).
        from backend.auth.access_control import resolve_roles  # local import keeps top clean
        roles = resolve_roles()
        if row['candidate_id'] != user_id and not (roles & RECRUITER_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        return jsonify({'success': True, 'data': _row_out(row)})
    except Exception as e:
        logger.error(f"get application failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load application'}), 500


@applications_bp.route('/<application_id>/withdraw', methods=['POST'])
@require_auth
def withdraw(application_id):
    try:
        user_id = get_jwt_identity()
        row = execute_query("SELECT candidate_id, status FROM job_applications WHERE id = %s",
                            (application_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        if row['candidate_id'] != user_id:
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        # Terminal states cannot be withdrawn — you can't un-hire, un-reject, or
        # re-withdraw. The parallel /api/candidate withdraw handler enforced this;
        # the canonical one did not, so consolidating onto it must not lose the
        # guard. (offer stays withdrawable — declining an offer by withdrawing is
        # legitimate.)
        if (row.get('status') or '') in ('withdrawn', 'rejected', 'hired'):
            return jsonify({'success': False,
                            'message': f"Cannot withdraw an application that is {row['status']}"}), 409
        # Preserve the candidate's stated reason on the timeline entry rather than
        # discarding it. The old handler kept it (string-appended to notes); this
        # records it cleanly in application_status_history.notes.
        reason = (request.get_json(silent=True) or {}).get('reason')
        reason = str(reason)[:2000] if reason else None
        _record_status(application_id, 'withdrawn', changed_by=user_id, note=reason)
        execute_query("UPDATE job_applications SET status = 'withdrawn', updated_at = NOW() WHERE id = %s",
                      (application_id,), fetch_all=False)
        return jsonify({'success': True, 'message': 'Application withdrawn'})
    except Exception as e:
        logger.error(f"withdraw failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to withdraw application'}), 500


@applications_bp.route('/<application_id>/status', methods=['PUT'])
@require_roles(*RECRUITER_ROLES)
def set_status(application_id):
    """Recruiter-side status transition."""
    try:
        data = request.get_json(silent=True) or {}
        status = str(data.get('status') or '').strip()
        if status not in _VALID_STATUSES:
            return jsonify({'success': False, 'message': f'Invalid status: {status}'}), 400
        row = execute_query("SELECT id, job_id FROM job_applications WHERE id = %s",
                            (application_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        # Company scoping: the recruiter must belong to the company that owns
        # this application's job (audit H1 — cross-company BOLA).
        if not _caller_may_manage_company(get_jwt_identity(), _company_of_job(row['job_id']), row['job_id']):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        # Timeline + candidate notification (C1-CAN-5) — before the UPDATE so
        # the previous status is captured.
        _record_status(application_id, status, changed_by=get_jwt_identity(),
                       note=data.get('notes'))
        execute_query(
            "UPDATE job_applications SET status = %s, notes = COALESCE(%s, notes), updated_at = NOW() WHERE id = %s",
            (status, data.get('notes'), application_id), fetch_all=False)
        return jsonify({'success': True, 'message': f'Status updated to {status}'})
    except Exception as e:
        logger.error(f"set status failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update status'}), 500


@applications_bp.route('/job/<job_id>', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def job_applications(job_id):
    """Recruiter view: all applications for one job."""
    try:
        # Company scoping: only staff of the job's company (or admin) may read
        # its applicant pipeline (audit H1 — cross-company BOLA).
        if not _caller_may_manage_company(get_jwt_identity(), _company_of_job(job_id), job_id):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        rows = execute_query(
            _BASE_SELECT + " WHERE ja.job_id = %s ORDER BY COALESCE(ja.applied_at, ja.submitted_at) DESC",
            (str(job_id),)) or []
        return jsonify({'success': True, 'data': [_row_out(r) for r in rows]})
    except Exception as e:
        logger.error(f"job applications failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load applications'}), 500
