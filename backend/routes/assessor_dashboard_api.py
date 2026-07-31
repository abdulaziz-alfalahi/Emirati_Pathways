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
import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import require_roles, resolve_roles, ADMIN_ROLES, RECRUITER_ROLES
except ImportError:  # pragma: no cover
    from db_utils import execute_query
    from auth.access_control import require_roles, resolve_roles, ADMIN_ROLES, RECRUITER_ROLES

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
               WHERE (a.assessor_id = %s OR a.assessor_id IS NULL)
                 AND COALESCE(a.consent_status, 'not_required') <> 'pending'
                 AND COALESCE(a.status, '') NOT IN ('cancelled', 'denied')
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
        # A date was being set with no signal to the person being assessed.
        try:
            try:
                from backend.notification_helper import create_notification as _notify
            except ImportError:
                from notification_helper import create_notification as _notify
            cand = execute_query(
                "SELECT candidate_id, assessment_title FROM assessments WHERE id::text = %s",
                (str(app_id),), fetch_one=True)
            if cand and cand.get('candidate_id'):
                _notify(user_id=str(cand['candidate_id']),
                        notification_type='assessment_scheduled',
                        title='Assessment scheduled',
                        message=f"Your assessment '{cand.get('assessment_title') or 'Assessment'}' has been scheduled for {when}.",
                        metadata={'assessment_id': str(app_id), 'scheduled_at': when})
        except Exception as notify_err:
            logger.warning(f"assessment schedule notify failed: {notify_err}")
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
        row = execute_query("SELECT id, candidate_id, status, assessor_id, assessment_title, "
                            "requested_by, pass_fail_status "
                            "FROM assessments WHERE id::text = %s",
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
        # Verified skills only count for a PASSING assessment — a failed
        # assessment must not stamp a "verified skill" or mark it present in the
        # skill graph (previously it stamped regardless of pass/fail).
        passed = score >= 60
        stamped = 0
        skills_verified = 0
        cand = row.get('candidate_id')
        if passed and skills and cand:
            passport = execute_query("SELECT id FROM career_passports WHERE user_id = %s",
                                     (cand,), fetch_one=True)
            if not passport:
                passport = execute_query(
                    "INSERT INTO career_passports (user_id) VALUES (%s) RETURNING id",
                    (cand,), fetch_one=True)
            for skill in skills:
                name = skill.strip()
                if passport:
                    execute_query(
                        """INSERT INTO passport_stamps (id, passport_id, category, title_en, title_ar,
                               description_en, issuer, icon, color, earned_at, verified)
                           VALUES (gen_random_uuid(), %s, 'skill', %s, %s,
                                   'Skill verified through a professional assessment',
                                   'Assessment verification', 'award', '#006E6D', NOW(), TRUE)""",
                        (passport['id'], name, name), fetch_all=False)
                    stamped += 1
                # Feed the skills graph so the verified skill flows into skill-gap
                # analysis → training recommendations (closes the assessment→AI gap;
                # the dormant SkillGraphEngine.update_skills_from_assessment bridge
                # was never called by any route).
                existing = execute_query(
                    "SELECT id FROM user_skills WHERE user_id = %s AND LOWER(skill_name) = LOWER(%s)",
                    (cand, name), fetch_one=True)
                evidence = f"Assessment score: {score:.0f}"
                if existing:
                    execute_query(
                        "UPDATE user_skills SET verified = TRUE, source = 'assessment', "
                        "evidence = %s, last_assessed = NOW(), updated_at = NOW() WHERE id = %s",
                        (evidence, existing['id']), fetch_all=False)
                else:
                    slug = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_') or name.lower()
                    execute_query(
                        "INSERT INTO user_skills (user_id, skill_id, skill_name, proficiency, "
                        "source, verified, evidence, last_assessed, created_at, updated_at) "
                        "VALUES (%s, %s, %s, 'intermediate', 'assessment', TRUE, %s, NOW(), NOW(), NOW())",
                        (cand, slug, name, evidence), fetch_all=False)
                skills_verified += 1

        # Certification issuance (Rework D): a PASSING assessment is itself a
        # credential — mint a certification onto the portfolio/passport, issued by
        # the assessor's accredited center, with NQF level + a 2-year validity.
        cert_issued = False
        if passed and cand:
            passport = execute_query("SELECT id FROM career_passports WHERE user_id = %s",
                                     (cand,), fetch_one=True)
            if not passport:
                passport = execute_query(
                    "INSERT INTO career_passports (user_id) VALUES (%s) RETURNING id",
                    (cand,), fetch_one=True)
            center = execute_query(
                "SELECT COALESCE(c.name, c.company_name) AS name FROM company_team_members ctm "
                "JOIN companies c ON c.id = ctm.company_id "
                "WHERE ctm.user_id = %s AND ctm.role = 'assessor' "
                "AND ctm.invitation_status = 'accepted' AND c.business_type = 'assessment_center' LIMIT 1",
                (me,), fetch_one=True)
            issuer = (center or {}).get('name') or 'Professional Assessment'
            prof = execute_query("SELECT nqf_authorization_level FROM assessor_profiles WHERE user_id = %s",
                                 (me,), fetch_one=True)
            nqf = (prof or {}).get('nqf_authorization_level')
            title = (row.get('assessment_title') or 'Professional Assessment') + ' — Certified'
            cert_no = 'CERT-' + str(app_id) + '-' + str(int(score))
            if passport:
                execute_query(
                    "INSERT INTO passport_stamps (id, passport_id, category, title_en, title_ar, "
                    "description_en, issuer, icon, color, earned_at, verified, metadata) "
                    "VALUES (gen_random_uuid(), %s, 'certification', %s, %s, "
                    "'Certification earned by passing a professional assessment', %s, "
                    "'certificate', '#1D4ED8', NOW(), TRUE, "
                    "jsonb_build_object('nqf_level', %s, 'certificate_number', %s, "
                    "'assessment_id', %s, 'score', %s, "
                    "'expires_at', (NOW() + interval '2 years')::text)) ",
                    (passport['id'], title, title, issuer, nqf, cert_no, str(app_id), score),
                    fetch_all=False)
                cert_issued = True

        # Tell the candidate their result, and close the loop with the
        # recruiter who requested the assessment (counterpart of the
        # assessment_requested notification).
        try:
            try:
                from backend.notification_helper import create_notification as _notify
            except ImportError:
                from notification_helper import create_notification as _notify
            outcome = 'passed' if (row.get('pass_fail_status') or ('pass' if score >= 60 else 'fail')) in ('pass', 'passed') else 'completed'
            a_title = row.get('assessment_title') or 'Assessment'
            if row.get('candidate_id'):
                _notify(user_id=str(row['candidate_id']),
                        notification_type='assessment_completed',
                        title='Assessment result available',
                        message=f"Your assessment '{a_title}' has been evaluated (score {int(score)}).",
                        metadata={'assessment_id': str(app_id), 'score': score})
            if row.get('requested_by'):
                _notify(user_id=str(row['requested_by']),
                        notification_type='assessment_completed',
                        title='Requested assessment completed',
                        message=f"The assessment '{a_title}' you requested has been {outcome} (score {int(score)}).",
                        metadata={'assessment_id': str(app_id), 'score': score})
        except Exception as notify_err:
            logger.warning(f"assessment complete notify failed: {notify_err}")

        return jsonify({'success': True, 'message': 'Evaluation completed',
                        'skills_stamped': stamped, 'skills_verified': skills_verified,
                        'certification_issued': cert_issued})
    except Exception as e:
        logger.error(f"assessor complete failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to complete evaluation'}), 500


@assessor_dash_bp.route('/operator/stats', methods=['GET'])
@require_roles(*_ASSESSOR_ROLES)
def operator_stats():
    """Aggregate statistics for the Assessment Operator Dashboard — real counts
    from the live assessment_templates / competency_models / assessments tables,
    with honest zeros/empties when there is no data.

    Ported from the retired assessor_routes.py, whose blueprint never registered
    (bad `require_role` import) so this endpoint 404'd for the frontend.
    Gated because recent_assessments exposes candidate ids/titles.
    """
    try:
        templates = execute_query(
            """SELECT id, name, template_type, nqf_level, industry_sector,
                      passing_score, is_active, created_at::text AS created_at
               FROM assessment_templates
               ORDER BY created_at DESC LIMIT 10""") or []
        total_templates = execute_query(
            "SELECT COUNT(*) AS n FROM assessment_templates", fetch_one=True) or {'n': 0}
        competency_models = execute_query(
            "SELECT COUNT(*) AS n FROM competency_models", fetch_one=True) or {'n': 0}
        recent = execute_query(
            """SELECT id, assessment_title, status,
                      scheduled_date::text AS scheduled_date, created_at::text AS created_at
               FROM assessments ORDER BY created_at DESC LIMIT 10""") or []
        counts = execute_query(
            """SELECT COUNT(*) AS total,
                      COUNT(*) FILTER (WHERE status IN ('scheduled','in_progress')) AS active,
                      COUNT(*) FILTER (WHERE status IN ('pending_review','pending')) AS pending
               FROM assessments""", fetch_one=True) or {'total': 0, 'active': 0, 'pending': 0}
        return jsonify({
            'success': True,
            'stats': {
                'total_templates': total_templates['n'],
                'active_assessments': counts['active'],
                'competency_models': competency_models['n'],
                'pending_reviews': counts['pending'],
                'total_assessed': counts['total'],
            },
            'templates': templates,
            'recent_assessments': recent,
        })
    except Exception as e:
        logger.error(f"assessor operator stats failed: {e}")
        return jsonify({
            'success': True,
            'stats': {'total_templates': 0, 'active_assessments': 0,
                      'competency_models': 0, 'pending_reviews': 0, 'total_assessed': 0},
            'templates': [], 'recent_assessments': [],
        })


# ─────────────────────────────────────────────────────────────────────────────
# Assessment Operator onboarding (Rework A) — enrol assessment centers + bind
# certified assessors. An assessment center is a companies row
# (business_type='assessment_center'); an assessor is a company_team_members
# row (role='assessor', accepted) + an assessor_profiles cert record + the
# 'assessor' user role. Reuses the same entity model as the hiring cluster.
# ─────────────────────────────────────────────────────────────────────────────

_OPERATOR_ROLES = tuple(ADMIN_ROLES | {'assessment_operator'})


def _assessor_code(user_id):
    return 'ASR-' + str(user_id)[-6:]


@assessor_dash_bp.route('/operator/centers', methods=['POST'])
@require_roles(*_OPERATOR_ROLES)
def create_assessment_center():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'name is required'}), 400
    existing = execute_query(
        "SELECT id, name FROM companies WHERE business_type='assessment_center' "
        "AND LOWER(COALESCE(name, company_name)) = LOWER(%s)", (name,), fetch_one=True)
    if existing:
        return jsonify({'success': True, 'data': existing, 'message': 'Already exists'}), 200
    row = execute_query(
        "INSERT INTO companies (name, company_name, business_type, is_verified, industry, "
        "emirate, website, provisioned_by, provisioned_at, verified_by, verified_at) "
        "VALUES (%s, %s, 'assessment_center', TRUE, %s, %s, %s, %s, NOW(), %s, NOW()) "
        "RETURNING id, name",
        (name, name, data.get('industry'), data.get('emirate'), data.get('website'),
         get_jwt_identity(), get_jwt_identity()), fetch_one=True)
    return jsonify({'success': True, 'data': row, 'message': 'Assessment center created'}), 201


@assessor_dash_bp.route('/operator/centers', methods=['GET'])
@require_roles(*_OPERATOR_ROLES)
def list_assessment_centers():
    rows = execute_query(
        "SELECT id, COALESCE(name, company_name) AS name, industry, emirate, website, is_verified "
        "FROM companies WHERE business_type='assessment_center' ORDER BY COALESCE(name, company_name)") or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@assessor_dash_bp.route('/operator/centers/<center_id>/assessors', methods=['GET'])
@require_roles(*_OPERATOR_ROLES)
def list_center_assessors(center_id):
    rows = execute_query(
        """SELECT ctm.user_id,
                  COALESCE(u.full_name,
                           NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
                           u.email, ctm.user_id) AS full_name, ctm.invitation_status,
                  ap.certification_level, ap.specialization, ap.nqf_authorization_level, ap.is_active
           FROM company_team_members ctm
           LEFT JOIN users u ON u.id = ctm.user_id
           LEFT JOIN assessor_profiles ap ON ap.user_id = ctm.user_id
           WHERE ctm.company_id = %s AND ctm.role = 'assessor' AND ctm.invitation_status = 'accepted'
           ORDER BY full_name""",
        (center_id,)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@assessor_dash_bp.route('/operator/centers/<center_id>/assessors', methods=['POST'])
@require_roles(*_OPERATOR_ROLES)
def enrol_assessor(center_id):
    """Certify + bind an assessor to a center: company_team_members (accepted) +
    assessor_profiles (cert metadata) + grant the 'assessor' role."""
    data = request.get_json() or {}
    user_id = (data.get('user_id') or '').strip()
    if not execute_query("SELECT id FROM companies WHERE id::text = %s AND business_type='assessment_center'",
                         (str(center_id),), fetch_one=True):
        return jsonify({'success': False, 'message': 'Assessment center not found'}), 404
    if not execute_query("SELECT id FROM users WHERE id = %s", (user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'User not found'}), 404
    # bind to the center
    execute_query(
        "INSERT INTO company_team_members (company_id, user_id, role, invitation_status, invited_by, "
        "joined_at, created_at, updated_at) VALUES (%s, %s, 'assessor', 'accepted', %s, NOW(), NOW(), NOW()) "
        "ON CONFLICT (company_id, user_id) DO UPDATE SET role='assessor', invitation_status='accepted', "
        "updated_at=NOW()",
        (str(center_id), user_id, get_jwt_identity()), fetch_all=False)
    # certification profile (upsert by user_id). specialization is a NOT NULL
    # text[] column — normalise a string/list into a Postgres array.
    spec = data.get('specialization')
    spec_arr = spec if isinstance(spec, list) else ([spec] if spec else [])
    # nqf_authorization_level + years_experience are INTEGER columns, but the
    # operator form sends free text (e.g. "Level 7"). A non-int string made the
    # whole INSERT fail — and execute_query swallows write errors, so the profile
    # row was silently never created (201 returned, nothing written): the assessor
    # ended up with the role but no specialization/cert-level (C2 UAT [C2-AOP-3]).
    # Coerce to the embedded integer, else None.
    def _as_int(v):
        if v in (None, ''):
            return None
        m = re.search(r'\d+', str(v))
        return int(m.group()) if m else None
    nqf = _as_int(data.get('nqf_authorization_level'))
    yrs = _as_int(data.get('years_experience'))
    existing = execute_query("SELECT id FROM assessor_profiles WHERE user_id = %s", (user_id,), fetch_one=True)
    if existing:
        execute_query(
            "UPDATE assessor_profiles SET certification_level=%s, specialization=%s, "
            "nqf_authorization_level=%s, years_experience=%s, is_active=TRUE, updated_at=NOW() WHERE user_id=%s",
            (data.get('certification_level'), spec_arr, nqf, yrs, user_id), fetch_all=False)
    else:
        execute_query(
            "INSERT INTO assessor_profiles (user_id, assessor_code, certification_level, specialization, "
            "nqf_authorization_level, years_experience, is_active, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())",
            (user_id, _assessor_code(user_id), data.get('certification_level'),
             spec_arr, nqf, yrs), fetch_all=False)
    # grant the assessor role (idempotent secondary role)
    execute_query(
        "UPDATE users SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) "
        "|| jsonb_build_array('assessor') WHERE id = %s "
        "AND NOT (COALESCE(secondary_roles, '[]'::jsonb) ? 'assessor')",
        (user_id,), fetch_all=False)
    return jsonify({'success': True, 'message': f'{user_id} certified as assessor',
                    'data': {'user_id': user_id, 'center_id': str(center_id)}}), 201


@assessor_dash_bp.route('/operator/centers/<center_id>/assessors/<user_id>', methods=['DELETE'])
@require_roles(*_OPERATOR_ROLES)
def remove_assessor(center_id, user_id):
    """De-certify: deactivate the binding + profile (assessor user role left intact)."""
    execute_query(
        "UPDATE company_team_members SET invitation_status='inactive', updated_at=NOW() "
        "WHERE company_id::text = %s AND user_id = %s AND role='assessor'",
        (str(center_id), str(user_id).strip()), fetch_all=False)
    execute_query("UPDATE assessor_profiles SET is_active=FALSE, updated_at=NOW() WHERE user_id=%s",
                  (str(user_id).strip(),), fetch_all=False)
    return jsonify({'success': True, 'message': 'Assessor removed from center'})


@assessor_dash_bp.route('/my-centers', methods=['GET'])
@require_roles(*_ASSESSOR_ROLES)
def assessor_my_centers():
    """The assessment centers the caller is certified at (for the assessor dashboard)."""
    rows = execute_query(
        "SELECT c.id, COALESCE(c.name, c.company_name) AS name, c.emirate "
        "FROM company_team_members ctm JOIN companies c ON c.id = ctm.company_id "
        "WHERE ctm.user_id = %s AND ctm.role='assessor' AND ctm.invitation_status='accepted' "
        "AND c.business_type='assessment_center' ORDER BY name",
        (get_jwt_identity(),)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


# ─────────────────────────────────────────────────────────────────────────────
# Recruiter-requested assessments (Rework B). A recruiter requests an assessment
# of a candidate; it enters the assessor pool ONLY after the candidate consents
# (assessment outcomes are PII). The requesting recruiter can view the outcome
# once consent is granted and the assessment is completed.
# ─────────────────────────────────────────────────────────────────────────────

@assessor_dash_bp.route('/recruiter/request', methods=['POST'])
@require_roles(*RECRUITER_ROLES)
def recruiter_request_assessment():
    data = request.get_json() or {}
    candidate_id = (data.get('candidate_id') or '').strip()
    title = (str(data.get('title') or '').strip())[:250]
    if not candidate_id or not title:
        return jsonify({'success': False, 'message': 'candidate_id and title are required'}), 400
    if not execute_query("SELECT id FROM users WHERE id = %s", (candidate_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'Candidate not found'}), 404
    dup = execute_query(
        "SELECT id FROM assessments WHERE candidate_id = %s AND assessment_title = %s "
        "AND status IN ('pending','scheduled','in_progress')", (candidate_id, title), fetch_one=True)
    if dup:
        return jsonify({'success': False, 'message': 'An open assessment for this candidate/title already exists',
                        'assessment_id': dup['id']}), 409
    row = execute_query(
        """INSERT INTO assessments (assessment_code, candidate_id, assessment_title, assessment_purpose,
               status, requested_by, consent_status, created_at, updated_at)
           VALUES ('REQ-' || to_char(NOW(), 'YYYYMMDDHH24MISS'), %s, %s,
                   'Recruiter-requested assessment', 'pending', %s, 'pending', NOW(), NOW())
           RETURNING id""",
        (candidate_id, title, get_jwt_identity()), fetch_one=True)
    # Notify the candidate that an assessment awaits their consent (best-effort;
    # C1-CAN-5 — recruiter-requested assessments produced no candidate notification).
    try:
        try:
            from backend.notification_helper import create_notification as _notify
        except ImportError:
            from notification_helper import create_notification as _notify
        _notify(
            candidate_id,
            'assessment_requested',
            'Assessment requested — your consent needed',
            f"A recruiter has requested the assessment \"{title}\". Review and give or decline consent.",
            {'assessment_id': (row or {}).get('id'), 'title': title, 'consent_status': 'pending',
             'event': 'assessment_requested'}
        )
    except Exception as _notif_err:
        logger.warning(f"Assessment-request candidate notification failed (non-critical): {_notif_err}")
    return jsonify({'success': True,
                    'message': 'Assessment requested — awaiting the candidate\'s consent',
                    'data': {'id': (row or {}).get('id'), 'consent_status': 'pending'}}), 201


@assessor_dash_bp.route('/recruiter/requests', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def recruiter_my_requests():
    """Assessments this recruiter requested. Outcome (score/result) is shown ONLY
    once the candidate has consented and the assessment is completed."""
    rows = execute_query(
        """SELECT a.id, a.assessment_title, a.status, a.consent_status,
                  a.percentage_score, a.pass_fail_status,
                  a.candidate_id, COALESCE(u.full_name, a.candidate_id) AS candidate_name
           FROM assessments a LEFT JOIN users u ON u.id = a.candidate_id
           WHERE a.requested_by = %s ORDER BY a.created_at DESC""",
        (get_jwt_identity(),)) or []
    out = []
    for r in rows:
        shareable = (r.get('consent_status') == 'granted' and r.get('status') == 'completed')
        out.append({
            'id': r['id'], 'title': r['assessment_title'], 'candidate_id': r['candidate_id'],
            'candidate_name': r['candidate_name'], 'status': r['status'],
            'consent_status': r['consent_status'],
            # PII gate: never expose the score without consent + completion.
            'score': float(r['percentage_score']) if (shareable and r['percentage_score'] is not None) else None,
            'result': r['pass_fail_status'] if shareable else None,
        })
    return jsonify({'success': True, 'data': out, 'total': len(out)})
