"""
Interview Preparation API — /api/interview-prep

Backs the Career Entry → Interview Preparation page (P5). Serves the curated
question bank (migration 038) and records practice sessions so the Performance
tab shows real history. AI feedback on a candidate's answer is handled by the
shared /api/ai/assist endpoint (feature 'interview_feedback') — not here.

The question bank is curated, non-PII content, so browsing is public; recording
and listing a candidate's own practice sessions requires auth and is scoped to
the caller's Emirates ID.
"""

import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

try:
    from backend.db_utils import execute_query
except ImportError:
    from db_utils import execute_query

logger = logging.getLogger(__name__)

interview_prep_bp = Blueprint('interview_prep', __name__, url_prefix='/api/interview-prep')

_VALID_CATEGORIES = {
    'behavioral', 'technical', 'situational', 'cultural_fit', 'leadership', 'problem_solving',
}


@interview_prep_bp.route('/categories', methods=['GET'])
def categories():
    """Question categories with their real counts (for the category cards)."""
    rows = execute_query(
        "SELECT category, COUNT(*) AS count FROM interview_questions "
        "WHERE is_active GROUP BY category ORDER BY category"
    ) or []
    total = sum(int(r['count']) for r in rows)
    return jsonify({'success': True,
                    'categories': [{'category': r['category'], 'count': int(r['count'])} for r in rows],
                    'total': total})


@interview_prep_bp.route('/questions', methods=['GET'])
def questions():
    """Browse/pull questions, optionally filtered by category / industry / limit.

    industry matching is inclusive of 'general' so a filtered practice set is
    never empty.
    """
    category = (request.args.get('category') or '').strip()
    industry = (request.args.get('industry') or '').strip()
    try:
        limit = min(max(int(request.args.get('limit', 50)), 1), 100)
    except (TypeError, ValueError):
        limit = 50

    where = ["is_active"]
    params = []
    if category and category in _VALID_CATEGORIES:
        where.append("category = %s")
        params.append(category)
    if industry and industry != 'general':
        where.append("(industry = %s OR industry = 'general')")
        params.append(industry)
    params.append(limit)

    rows = execute_query(
        f"SELECT id, external_key, category, question_en, question_ar, hint_en, hint_ar, "
        f"industry, difficulty, is_uae, is_common "
        f"FROM interview_questions WHERE {' AND '.join(where)} "
        f"ORDER BY sort_order, id LIMIT %s",
        tuple(params),
    ) or []
    return jsonify({'success': True, 'questions': [dict(r) for r in rows], 'total': len(rows)})


@interview_prep_bp.route('/sessions', methods=['GET'])
@jwt_required()
def list_sessions():
    """The caller's own completed practice sessions (Performance tab)."""
    user_id = str(get_jwt_identity())
    rows = execute_query(
        "SELECT id, mode, category, industry, total_questions, answered, created_at "
        "FROM interview_practice_sessions WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
        (user_id,),
    ) or []
    out = []
    for r in rows:
        d = dict(r)
        if d.get('created_at'):
            d['created_at'] = d['created_at'].isoformat()
        out.append(d)
    return jsonify({'success': True, 'sessions': out, 'total': len(out)})


@interview_prep_bp.route('/sessions', methods=['POST'])
@jwt_required()
def log_session():
    """Record a completed practice session for the caller."""
    user_id = str(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    mode = (data.get('mode') or 'practice')[:40]
    category = (data.get('category') or None)
    if category:
        category = category[:40]
    industry = (data.get('industry') or None)
    if industry:
        industry = industry[:40]
    try:
        total = max(0, int(data.get('total_questions') or 0))
        answered = max(0, int(data.get('answered') or 0))
    except (TypeError, ValueError):
        total, answered = 0, 0

    row = execute_query(
        "INSERT INTO interview_practice_sessions "
        "(user_id, mode, category, industry, total_questions, answered) "
        "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
        (user_id, mode, category, industry, total, answered),
        fetch_one=True,
    )
    if not row:
        return jsonify({'success': False, 'message': 'Failed to record session'}), 500
    return jsonify({'success': True, 'id': row['id']}), 201
