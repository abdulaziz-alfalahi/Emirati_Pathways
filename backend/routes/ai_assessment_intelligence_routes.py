"""
AI Assessment Intelligence — HTTP API.

Exposes the (previously unwired) Qwen-powered assessment engine in
``ai_assessment_intelligence.py`` as real, authenticated endpoints:

  POST /api/assessment-intelligence/questions/generate  — AI-generated assessment questions
  POST /api/assessment-intelligence/response/evaluate    — AI evaluation of a candidate response
  GET  /api/assessment-intelligence/stats                — engine usage statistics
  GET  /api/assessment-intelligence/health               — engine / Qwen availability

The engine produces genuine Qwen output (it gracefully falls back to a clearly
``fallback_mode`` result when DASHSCOPE_API_KEY is absent — never fabricated data
presented as real). Endpoints are gated to assessment / education / admin roles.
"""
import json
import logging
from dataclasses import asdict, is_dataclass
from datetime import datetime, date
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

logger = logging.getLogger(__name__)

try:
    from backend.ai_assessment_intelligence import ai_assessment_intelligence, _qwen_available
except ImportError:  # pragma: no cover - direct execution context
    from ai_assessment_intelligence import ai_assessment_intelligence, _qwen_available

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

ai_assessment_intelligence_bp = Blueprint(
    'ai_assessment_intelligence', __name__, url_prefix='/api/assessment-intelligence'
)

# Roles permitted to author/evaluate assessments via the engine.
_ALLOWED_ROLES = {
    'admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator',
    'assessor', 'assessment_operator', 'education_operator', 'educator',
    'professional_dev_operator',
}


def _identity_roles():
    """Resolve every role for the current JWT identity.

    The JWT carries only the primary ``role`` claim, but this platform's users often
    hold the relevant role (assessor, educator, admin…) as a SECONDARY role and switch
    into it. So we combine the primary claim, any ``secondary_roles`` claim, and a DB
    lookup of the user's stored roles. (Mirrors the admin-access fix in
    admin_dashboard_api.)
    """
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
        logger.warning(f"assessment-intelligence role lookup failed: {e}")
    return roles


def _require_assessment_role(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        if not (_identity_roles() & _ALLOWED_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden - assessment role required'}), 403
        return f(*args, **kwargs)
    return wrapper


def _json_safe(obj):
    """Recursively convert dataclasses / datetimes to JSON-serialisable values."""
    if is_dataclass(obj) and not isinstance(obj, type):
        obj = asdict(obj)
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj


@ai_assessment_intelligence_bp.route('/health', methods=['GET'])
def health():
    """Engine availability — does not require auth, exposes no data."""
    return jsonify({
        'success': True,
        'engine': 'ai_assessment_intelligence',
        'qwen_available': bool(_qwen_available),
        'mode': 'ai' if _qwen_available else 'fallback',
    })


@ai_assessment_intelligence_bp.route('/stats', methods=['GET'])
@_require_assessment_role
def stats():
    """Engine usage statistics (real counters maintained by the engine)."""
    try:
        return jsonify({'success': True, 'data': _json_safe(ai_assessment_intelligence.get_intelligence_stats())})
    except Exception as e:
        logger.error(f"assessment-intelligence stats error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@ai_assessment_intelligence_bp.route('/questions/generate', methods=['POST'])
@_require_assessment_role
def generate_questions():
    """Generate assessment questions via the Qwen engine."""
    data = request.get_json(silent=True) or {}
    assessment_type = (data.get('assessment_type') or '').strip()
    difficulty_level = (data.get('difficulty_level') or 'intermediate').strip()
    if not assessment_type:
        return jsonify({'success': False, 'message': 'assessment_type is required'}), 400

    industry_category = (data.get('industry_category') or 'general').strip()
    skill_focus = data.get('skill_focus') or []
    if isinstance(skill_focus, str):
        skill_focus = [s.strip() for s in skill_focus.split(',') if s.strip()]
    if not isinstance(skill_focus, list):
        return jsonify({'success': False, 'message': 'skill_focus must be a list'}), 400

    try:
        question_count = int(data.get('question_count', 10))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'question_count must be an integer'}), 400
    question_count = max(1, min(question_count, 50))

    uae_context = bool(data.get('uae_context', True))

    try:
        result = ai_assessment_intelligence.generate_intelligent_questions(
            assessment_type=assessment_type,
            industry_category=industry_category,
            difficulty_level=difficulty_level,
            skill_focus=skill_focus,
            question_count=question_count,
            uae_context=uae_context,
        )
        return jsonify(_json_safe(result))
    except Exception as e:
        logger.error(f"assessment-intelligence generate error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@ai_assessment_intelligence_bp.route('/response/evaluate', methods=['POST'])
@_require_assessment_role
def evaluate_response():
    """Evaluate a candidate's response to a question via the Qwen engine."""
    data = request.get_json(silent=True) or {}
    question = data.get('question')
    response = data.get('response')
    if not isinstance(question, dict) or not isinstance(response, dict):
        return jsonify({'success': False, 'message': "'question' and 'response' objects are required"}), 400
    candidate_profile = data.get('candidate_profile') or {}
    if not isinstance(candidate_profile, dict):
        candidate_profile = {}

    try:
        intelligence = ai_assessment_intelligence.evaluate_response_intelligence(
            question, response, candidate_profile
        )
        return jsonify({'success': True, 'data': _json_safe(intelligence)})
    except Exception as e:
        logger.error(f"assessment-intelligence evaluate error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
