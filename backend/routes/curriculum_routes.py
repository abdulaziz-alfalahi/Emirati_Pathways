"""
Curriculum Management — HTTP API.

Exposes the (previously unwired) Qwen-powered curriculum engine in
``curriculum_management_system.py`` as real, authenticated endpoints, plus read access
to the real course / curriculum-standard tables:

  GET  /api/curriculum/health    — engine / Qwen availability (no auth, no data)
  POST /api/curriculum/generate  — REAL Qwen-generated curriculum modules
  GET  /api/curriculum/courses   — real rows from the courses table
  GET  /api/curriculum/standards — real rows from curriculum_standards (MoE standards)

The legacy engine path fabricated curricula (it discarded the AI response and returned
hardcoded module titles with invented scores). This uses the engine's new real
generate_curriculum(), which returns genuine model output and clearly flags a fallback
when DASHSCOPE_API_KEY is absent — never fabricated-as-real. (#26)
"""
import json
import logging
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

logger = logging.getLogger(__name__)

try:
    from backend.curriculum_management_system import curriculum_system, _qwen_available
except ImportError:  # pragma: no cover
    from curriculum_management_system import curriculum_system, _qwen_available

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

curriculum_bp = Blueprint('curriculum', __name__, url_prefix='/api/curriculum')

_ALLOWED_ROLES = {
    'admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator',
    'educator', 'education_operator', 'assessment_operator', 'professional_dev_operator',
    'training_provider',
}


def _identity_roles():
    """Resolve every role for the JWT identity (primary claim + secondary_roles claim +
    DB fallback) — this platform carries the relevant roles as secondary roles."""
    claims = get_jwt() or {}
    roles = set()
    if claims.get('role'):
        roles.add(claims['role'])
    sec_claim = claims.get('secondary_roles')
    if isinstance(sec_claim, (list, tuple)):
        roles.update(sec_claim)
    try:
        uid = get_jwt_identity()
        if uid is not None:
            row = execute_query(
                "SELECT role, secondary_roles FROM users WHERE id::text = %s",
                (str(uid),), fetch_one=True
            )
            if row:
                if row.get('role'):
                    roles.add(row['role'])
                sec = row.get('secondary_roles') or []
                if isinstance(sec, str):
                    try:
                        sec = json.loads(sec)
                    except Exception:
                        sec = [sec]
                roles.update(sec or [])
    except Exception as e:
        logger.warning(f"curriculum role lookup failed: {e}")
    return roles


def _require_curriculum_role(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        if not (_identity_roles() & _ALLOWED_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden - curriculum/education role required'}), 403
        return f(*args, **kwargs)
    return wrapper


def _iso(v):
    return v.isoformat() if v is not None and hasattr(v, 'isoformat') else v


@curriculum_bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        'success': True,
        'engine': 'curriculum_management_system',
        'qwen_available': bool(_qwen_available),
        'mode': 'ai' if _qwen_available else 'fallback',
    })


@curriculum_bp.route('/generate', methods=['POST'])
@_require_curriculum_role
def generate_curriculum():
    """Generate a real AI curriculum via the Qwen engine."""
    data = request.get_json(silent=True) or {}
    program_name = (data.get('program_name') or '').strip()
    if not program_name:
        return jsonify({'success': False, 'message': 'program_name is required'}), 400

    learning_outcomes = data.get('learning_outcomes') or []
    if isinstance(learning_outcomes, str):
        learning_outcomes = [s.strip() for s in learning_outcomes.split(',') if s.strip()]
    try:
        duration_weeks = int(data.get('duration_weeks', 16))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'duration_weeks must be an integer'}), 400
    duration_weeks = max(1, min(duration_weeks, 104))

    requirements = {
        'program_name': program_name,
        'duration_weeks': duration_weeks,
        'target_level': (data.get('target_level') or 'intermediate').strip(),
        'industry_focus': (data.get('industry_focus') or 'general').strip(),
        'learning_outcomes': learning_outcomes if isinstance(learning_outcomes, list) else [],
    }
    try:
        return jsonify(curriculum_system.generate_curriculum(requirements))
    except Exception as e:
        logger.error(f"curriculum generate error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@curriculum_bp.route('/courses', methods=['GET'])
@_require_curriculum_role
def list_courses():
    """Real course catalogue from the courses table."""
    try:
        rows = execute_query(
            """
            SELECT id::text AS id, course_code, course_name, course_description,
                   course_level, course_type, subject_area, duration_weeks, credit_hours,
                   learning_outcomes, created_at
            FROM courses
            ORDER BY created_at DESC NULLS LAST
            LIMIT 200
            """
        ) or []
        data = []
        for r in rows:
            d = dict(r)
            d['created_at'] = _iso(d.get('created_at'))
            data.append(d)
        return jsonify({'success': True, 'data': data, 'count': len(data)})
    except Exception as e:
        logger.error(f"courses list error: {e}")
        return jsonify({'success': True, 'data': [], 'count': 0})


@curriculum_bp.route('/standards', methods=['GET'])
@_require_curriculum_role
def list_standards():
    """Real MoE curriculum standards (empty until seeded)."""
    try:
        subject = request.args.get('subject_area')
        grade = request.args.get('grade_level')
        where, params = ["is_active IS NOT FALSE"], []
        if subject:
            where.append("subject_area ILIKE %s")
            params.append(subject)
        if grade:
            where.append("grade_level = %s")
            params.append(grade)
        rows = execute_query(
            f"""
            SELECT id::text AS id, standard_code, standard_name, subject_area, grade_level,
                   description, learning_objectives, assessment_criteria, moe_reference
            FROM curriculum_standards
            WHERE {' AND '.join(where)}
            ORDER BY standard_code NULLS LAST
            LIMIT 500
            """,
            tuple(params) if params else None
        ) or []
        return jsonify({'success': True, 'data': [dict(r) for r in rows], 'count': len(rows)})
    except Exception as e:
        logger.error(f"standards list error: {e}")
        return jsonify({'success': True, 'data': [], 'count': 0})
