"""
Assessor Dashboard API — /api/assessor

The AssessorDashboard frontend has always called /api/assessor/dashboard,
/api/assessor/applications and the schedule/complete actions, but the legacy
assessor blueprint was never registered (and its planning system queries a
phantom schema). The 2026-07-23 service-catalog audit logged the resulting
404s (catalog EN-02).

This blueprint implements those four endpoints directly against the LIVE
`assessments` table (verified 2026-07-23: assessment_title, candidate_id,
assessor_id, scheduled_date, status, percentage_score, feedback, ...).
On completion, verified skills become career-passport stamps when the
candidate holds a passport.
"""

import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import require_roles, resolve_roles, ADMIN_ROLES
except ImportError:  # pragma: no cover
    from db_utils import execute_query
    from auth.access_control import require_roles, resolve_roles, ADMIN_ROLES

logger = logging.getLogger(__name__)

assessor_dash_bp = Blueprint('assessor_dashboard_api', __name__, url_prefix='/api/assessor')

_ASSESSOR_ROLES = tuple(ADMIN_ROLES | {'assessor', 'assessment_operator'})
# Supervisors who may act on any assessor's assessments; a plain 'assessor'
# may only act on their own (or as-yet-unassigned) assessments.
_ASSESSOR_SUPERVISOR_ROLES = ADMIN_ROLES | {'assessment_operator'}


def _may_act_on(row_assessor_id, me):
    """An assessment may be acted on by its assigned assessor, by anyone if it
    is still unassigned, or by an assessment supervisor/admin."""
    if row_assessor_id in (None, '', me):
        return True
    return bool(resolve_roles() & _ASSESSOR_SUPERVISOR_ROLES)


@assessor_dash_bp.route('/dashboard', methods=['GET'])
@require_roles(*_ASSESSOR_ROLES)
def dashboard():
    """Aggregates over the assessor's own assessments — real counts only."""
    try:
        me = get_jwt_identity()
        rows = execute_query(
            """SELECT id, assessment_title, status, scheduled_date, created_at,
                      percentage_score, pass_fail_status, quality_score, assessment_mode
               FROM assessments WHERE assessor_id = %s
               ORDER BY created_at DESC""", (me,)) or []
        completed = [r for r in rows if (r['status'] or '') == 'completed']
        this_month = [r for r in completed if r['created_at'] and
                      r['created_at'].month == __import__('datetime').datetime.now().month]
        passed = sum(1 for r in completed if (r['pass_fail_status'] or '').lower() == 'pass')
        failed = sum(1 for r in completed if (r['pass_fail_status'] or '').lower() == 'fail')
        pending = sum(1 for r in rows if (r['status'] or '') in ('scheduled', 'pending', 'in_progress'))
        scores = [float(r['percentage_score']) for r in completed if r['percentage_score'] is not None]
        quality = [float(r['quality_score']) for r in rows if r['quality_score'] is not None]
        modes = sorted({(r['assessment_mode'] or '').strip() for r in rows if r['assessment_mode']})
        return jsonify({
            'assessments': {
                'totalAssessments': len(rows),
                'completedThisMonth': len(this_month),
                'pendingReview': pending,
                'averageRating': round(sum(quality) / len(quality), 1) if quality else 0,
            },
            'candidates': {
                'totalCandidates': len({r['id'] for r in rows}),
                'passedAssessments': passed,
                'failedAssessments': failed,
                'awaitingResults': pending,
            },
            'performance': {
                'accuracyRate': 0,           # not tracked — honest zero
                'averageCompletionTime': 0,  # not tracked — honest zero
                'qualityScore': round(sum(quality) / len(quality), 1) if quality else 0,
                'feedbackRating': round(sum(scores) / len(scores), 1) if scores else 0,
            },
            'specializations': {
                'primaryAreas': [], 'certifications': [],
                'yearsExperience': 0, 'assessmentTypes': modes,
            },
            'activity': [{
                'id': i,
                'type': (r['status'] or 'assessment'),
                'title': r['assessment_title'] or 'Assessment',
                'description': f"Status: {r['status'] or 'unknown'}",
                'timestamp': (r['scheduled_date'] or r['created_at']).isoformat()
                             if (r['scheduled_date'] or r['created_at']) else '',
            } for i, r in enumerate(rows[:10])],
        })
    except Exception as e:
        logger.error(f"assessor dashboard failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load dashboard'}), 500


@assessor_dash_bp.route('/applications', methods=['GET'])
@require_roles(*_ASSESSOR_ROLES)
def applications():
    """Assessment bookings assigned to this assessor (or unassigned pending)."""
    try:
        me = get_jwt_identity()
        rows = execute_query(
            """SELECT a.id, a.assessment_title, a.status, a.scheduled_date, a.created_at,
                      a.feedback,
                      TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS candidate_name,
                      u.email AS candidate_email
               FROM assessments a
               LEFT JOIN users u ON u.id = a.candidate_id
               WHERE a.assessor_id = %s OR a.assessor_id IS NULL
               ORDER BY a.created_at DESC LIMIT 100""", (me,)) or []
        return jsonify({'success': True, 'applications': [{
            'id': r['id'],
            'assessment_name': r['assessment_title'] or 'Assessment',
            'candidate_name': r['candidate_name'] or 'Candidate',
            'candidate_email': r['candidate_email'] or '',
            'status': r['status'] or 'pending',
            'scheduled_at': r['scheduled_date'].isoformat() if r['scheduled_date'] else None,
            'applied_at': r['created_at'].isoformat() if r['created_at'] else None,
            'duration_minutes': None,
            'notes': r['feedback'],
        } for r in rows]})
    except Exception as e:
        logger.error(f"assessor applications failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load applications'}), 500


@assessor_dash_bp.route('/applications/<app_id>/schedule', methods=['PUT'])
@require_roles(*_ASSESSOR_ROLES)
def schedule(app_id):
    try:
        me = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        when = data.get('scheduled_at')
        if not when:
            return jsonify({'success': False, 'message': 'scheduled_at is required'}), 400
        row = execute_query("SELECT id, assessor_id FROM assessments WHERE id::text = %s",
                            (str(app_id),), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Assessment not found'}), 404
        if not _may_act_on(row.get('assessor_id'), me):
            return jsonify({'success': False, 'message': 'This assessment is assigned to another assessor'}), 403
        execute_query(
            """UPDATE assessments SET scheduled_date = %s, status = 'scheduled',
                   assessor_id = COALESCE(assessor_id, %s), updated_at = NOW()
               WHERE id::text = %s""",
            (when, me, str(app_id)), fetch_all=False)
        return jsonify({'success': True, 'message': 'Candidate scheduled'})
    except Exception as e:
        logger.error(f"assessor schedule failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to schedule candidate'}), 500


@assessor_dash_bp.route('/applications/<app_id>/complete', methods=['POST'])
@require_roles(*_ASSESSOR_ROLES)
def complete(app_id):
    """Record the evaluation; verified skills stamp the candidate's passport."""
    try:
        me = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        # Validate score is a number in 0..100 (a string/None used to reach SQL
        # and either 500 or silently mark 'fail' with a NULL score).
        try:
            score = float(data.get('score'))
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'score must be a number 0-100'}), 400
        if not (0 <= score <= 100):
            return jsonify({'success': False, 'message': 'score must be between 0 and 100'}), 400
        feedback = (data.get('feedback') or '')[:8000]
        skills = [s for s in (data.get('skills_to_verify') or []) if isinstance(s, str) and s.strip()][:20]
        row = execute_query("SELECT id, candidate_id, status, assessor_id FROM assessments WHERE id::text = %s",
                            (str(app_id),), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Assessment not found'}), 404
        if not _may_act_on(row.get('assessor_id'), me):
            return jsonify({'success': False, 'message': 'This assessment is assigned to another assessor'}), 403
        # Guard against re-completion — otherwise re-POSTing duplicates the
        # verified passport stamps.
        if (row.get('status') or '') == 'completed':
            return jsonify({'success': False, 'message': 'Assessment already completed'}), 409
        execute_query(
            """UPDATE assessments SET status = 'completed', percentage_score = %s,
                   pass_fail_status = CASE WHEN %s >= 60 THEN 'pass' ELSE 'fail' END,
                   feedback = %s, assessor_id = COALESCE(assessor_id, %s), updated_at = NOW()
               WHERE id::text = %s""",
            (score, score or 0, feedback, me, str(app_id)), fetch_all=False)
        stamped = 0
        if skills and row.get('candidate_id'):
            passport = execute_query("SELECT id FROM career_passports WHERE user_id = %s",
                                     (row['candidate_id'],), fetch_one=True)
            if passport:
                for skill in skills:
                    execute_query(
                        """INSERT INTO passport_stamps (id, passport_id, category, title_en, title_ar,
                               description_en, issuer, icon, color, earned_at, verified)
                           VALUES (gen_random_uuid(), %s, 'skill', %s, %s,
                                   'Skill verified through a professional assessment',
                                   'Assessment verification', 'award', '#006E6D', NOW(), TRUE)""",
                        (passport['id'], skill.strip(), skill.strip()), fetch_all=False)
                    stamped += 1
        return jsonify({'success': True, 'message': 'Evaluation completed', 'skills_stamped': stamped})
    except Exception as e:
        logger.error(f"assessor complete failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to complete evaluation'}), 500
