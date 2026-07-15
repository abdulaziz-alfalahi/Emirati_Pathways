"""
Video QA — HTTP API over real interview recordings.

Exposes a real, human-in-the-loop quality-assurance workflow for interview videos,
backed by the actual ``interview_recordings`` / ``video_interview_sessions`` tables:

  GET  /api/video-qa/health                  — capabilities (honest: storage backend, auto-analysis)
  GET  /api/video-qa/dashboard               — real recording/session/QA counts
  GET  /api/video-qa/recordings              — real recordings + their QA status
  GET  /api/video-qa/<session_id>/assessment — latest stored QA assessment for a session
  POST /api/video-qa/<session_id>/review     — a reviewer records a REAL QA assessment

Design honesty (#26): automated deep video/audio analysis is NOT wired (needs a
video-processing backend that isn't configured), so there are no fabricated quality
scores — recordings are marked ``pending_review`` until a human reviewer assesses them,
and /health discloses exactly what is and isn't available. Returns empty (not fake) when
there are no recordings yet.
"""
import os
import json
import logging
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

logger = logging.getLogger(__name__)

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

video_qa_bp = Blueprint('video_qa', __name__, url_prefix='/api/video-qa')

# Roles allowed to review interview-video QA.
_ALLOWED_ROLES = {
    'admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator',
    'assessor', 'assessment_operator', 'compliance_auditor', 'recruiter', 'talent_operator',
}

_VALID_QUALITY = {'excellent', 'good', 'acceptable', 'poor', 'unacceptable', 'pending_review'}

_qa_table_ready = False


def _ensure_qa_table():
    global _qa_table_ready
    if _qa_table_ready:
        return
    try:
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS video_quality_assessments (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL,
                video_quality TEXT,
                audio_quality DOUBLE PRECISION,
                technical_score DOUBLE PRECISION,
                content_appropriateness DOUBLE PRECISION,
                bias_indicators JSONB DEFAULT '[]'::jsonb,
                flagged_content JSONB DEFAULT '[]'::jsonb,
                recommendations JSONB DEFAULT '[]'::jsonb,
                reviewer_notes TEXT,
                assessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                assessed_by TEXT
            )
            """,
            fetch_all=False,
        )
        execute_query(
            "CREATE INDEX IF NOT EXISTS idx_vqa_session ON video_quality_assessments (session_id, assessed_at DESC)",
            fetch_all=False,
        )
        _qa_table_ready = True
    except Exception as e:
        logger.warning(f"video QA table ensure failed: {e}")


def _identity_roles():
    """Resolve every role for the JWT identity (primary claim + secondary_roles claim +
    DB fallback), because this platform carries the relevant roles as secondary roles."""
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
        logger.warning(f"video-qa role lookup failed: {e}")
    return roles


def _require_qa_role(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        if not (_identity_roles() & _ALLOWED_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden - QA reviewer role required'}), 403
        return f(*args, **kwargs)
    return wrapper


def _storage_backend():
    return 's3' if (os.getenv('AWS_ACCESS_KEY_ID') and os.getenv('AWS_SECRET_ACCESS_KEY')) else 'none'


@video_qa_bp.route('/health', methods=['GET'])
def health():
    """Honest capability disclosure — exposes no data, needs no auth."""
    return jsonify({
        'success': True,
        'service': 'video-qa',
        'storage_backend': _storage_backend(),
        # Automated deep video/audio quality analysis is not wired (no ffprobe/ffmpeg
        # pipeline). QA is human-in-the-loop; recordings are 'pending_review' until reviewed.
        'automated_quality_analysis': False,
        'manual_review': True,
    })


@video_qa_bp.route('/dashboard', methods=['GET'])
@_require_qa_role
def dashboard():
    """Real QA dashboard counts from the interview tables."""
    try:
        _ensure_qa_table()
        sessions = execute_query("SELECT COUNT(*) AS c FROM video_interview_sessions", fetch_one=True)
        recordings = execute_query("SELECT COUNT(*) AS c FROM interview_recordings", fetch_one=True)
        assessed = execute_query(
            "SELECT COUNT(DISTINCT session_id) AS c FROM video_quality_assessments WHERE assessed_by NOT LIKE 'system_%'",
            fetch_one=True
        )
        by_status = execute_query(
            "SELECT COALESCE(status, 'unknown') AS status, COUNT(*) AS c FROM video_interview_sessions GROUP BY status"
        ) or []
        total_sessions = (sessions or {}).get('c', 0) or 0
        human_assessed = (assessed or {}).get('c', 0) or 0
        return jsonify({
            'success': True,
            'data': {
                'total_sessions': total_sessions,
                'total_recordings': (recordings or {}).get('c', 0) or 0,
                'human_reviewed': human_assessed,
                'pending_review': max(total_sessions - human_assessed, 0),
                'sessions_by_status': {r['status']: r['c'] for r in by_status},
                'automated_quality_analysis': False,
            }
        })
    except Exception as e:
        logger.error(f"video-qa dashboard error: {e}")
        return jsonify({'success': True, 'data': {'total_sessions': 0, 'total_recordings': 0,
                        'human_reviewed': 0, 'pending_review': 0, 'sessions_by_status': {}}})


@video_qa_bp.route('/recordings', methods=['GET'])
@_require_qa_role
def recordings():
    """Real interview recordings with their latest QA status (empty until recordings exist)."""
    try:
        _ensure_qa_table()
        rows = execute_query(
            """
            SELECT ir.id, ir.session_id::text AS session_id, ir.file_path, ir.duration_seconds,
                   ir.created_at, ir.user_id::text AS user_id,
                   vqa.video_quality AS qa_status, vqa.assessed_by, vqa.assessed_at
            FROM interview_recordings ir
            LEFT JOIN LATERAL (
                SELECT video_quality, assessed_by, assessed_at
                FROM video_quality_assessments q
                WHERE q.session_id = ir.session_id::text
                ORDER BY assessed_at DESC LIMIT 1
            ) vqa ON true
            ORDER BY ir.created_at DESC NULLS LAST
            LIMIT 200
            """
        ) or []
        data = [
            {
                'id': r.get('id'),
                'session_id': r.get('session_id'),
                'file_path': r.get('file_path'),
                'duration_seconds': r.get('duration_seconds'),
                'created_at': r.get('created_at').isoformat() if r.get('created_at') and hasattr(r.get('created_at'), 'isoformat') else r.get('created_at'),
                'qa_status': r.get('qa_status') or 'pending_review',
                'assessed_by': r.get('assessed_by'),
                'assessed_at': r.get('assessed_at').isoformat() if r.get('assessed_at') and hasattr(r.get('assessed_at'), 'isoformat') else r.get('assessed_at'),
            }
            for r in rows
        ]
        return jsonify({'success': True, 'data': data, 'count': len(data)})
    except Exception as e:
        logger.error(f"video-qa recordings error: {e}")
        return jsonify({'success': True, 'data': [], 'count': 0})


@video_qa_bp.route('/<session_id>/assessment', methods=['GET'])
@_require_qa_role
def get_assessment(session_id):
    """Latest stored QA assessment for a session."""
    try:
        _ensure_qa_table()
        row = execute_query(
            """
            SELECT session_id, video_quality, audio_quality, technical_score,
                   content_appropriateness, bias_indicators, flagged_content,
                   recommendations, reviewer_notes, assessed_at, assessed_by
            FROM video_quality_assessments
            WHERE session_id = %s ORDER BY assessed_at DESC LIMIT 1
            """,
            (str(session_id),), fetch_one=True
        )
        if not row:
            return jsonify({'success': True, 'data': None, 'available': False,
                            'message': 'No QA assessment recorded for this session yet.'})
        d = dict(row)
        if d.get('assessed_at') and hasattr(d['assessed_at'], 'isoformat'):
            d['assessed_at'] = d['assessed_at'].isoformat()
        return jsonify({'success': True, 'data': d})
    except Exception as e:
        logger.error(f"video-qa get assessment error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@video_qa_bp.route('/<session_id>/review', methods=['POST'])
@_require_qa_role
def submit_review(session_id):
    """Record a REAL human QA assessment for a session's recording."""
    _ensure_qa_table()
    data = request.get_json(silent=True) or {}
    video_quality = (data.get('video_quality') or '').strip().lower()
    if video_quality not in _VALID_QUALITY:
        return jsonify({'success': False,
                        'message': f"video_quality must be one of {sorted(_VALID_QUALITY)}"}), 400

    def _num(v):
        try:
            return float(v) if v is not None else None
        except (TypeError, ValueError):
            return None

    reviewer = str(get_jwt_identity())
    recs = data.get('recommendations') or []
    flagged = data.get('flagged_content') or []
    bias = data.get('bias_indicators') or []
    try:
        row = execute_query(
            """
            INSERT INTO video_quality_assessments
                (session_id, video_quality, audio_quality, technical_score,
                 content_appropriateness, bias_indicators, flagged_content,
                 recommendations, reviewer_notes, assessed_at, assessed_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, %s)
            RETURNING id, assessed_at
            """,
            (
                str(session_id), video_quality, _num(data.get('audio_quality')),
                _num(data.get('technical_score')), _num(data.get('content_appropriateness')),
                json.dumps(bias if isinstance(bias, list) else []),
                json.dumps(flagged if isinstance(flagged, list) else []),
                json.dumps(recs if isinstance(recs, list) else []),
                (data.get('reviewer_notes') or data.get('notes') or ''),
                reviewer,
            ),
            fetch_one=True,
        )
        if not row:
            return jsonify({'success': False, 'message': 'Failed to record QA review'}), 500
        return jsonify({
            'success': True,
            'message': 'QA review recorded',
            'data': {
                'id': (row or {}).get('id'),
                'session_id': str(session_id),
                'video_quality': video_quality,
                'assessed_by': reviewer,
                'assessed_at': (row or {}).get('assessed_at').isoformat() if row and hasattr(row.get('assessed_at'), 'isoformat') else None,
            }
        }), 201
    except Exception as e:
        logger.error(f"video-qa submit review error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
