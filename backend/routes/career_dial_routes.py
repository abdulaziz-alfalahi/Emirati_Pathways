"""
Career Dial API Routes
Blueprint prefix: /api/candidate/profile

G21/G22 Career Dial endpoints for:
- Querying current visibility and availability state
- Toggling visibility (is_visible)
- Toggling recruitment availability (available_for_recruitment)
- Setting Career Dial level directly (0 = Invisible, 1 = Stealth, 2 = Active)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os
import logging

logger = logging.getLogger(__name__)
career_dial_bp = Blueprint('career_dial', __name__, url_prefix='/api/candidate/profile')

DB_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)


def get_db():
    try:
        return psycopg2.connect(DB_URL)
    except Exception as e:
        logger.error(f"Career Dial DB error: {e}")
        return None


def _compute_dial_level(is_visible, available_for_recruitment):
    """Map boolean flags to Career Dial level.

    0 = Invisible  (both false)
    1 = Stealth     (visible but not available)
    2 = Active      (both true)
    """
    if not is_visible:
        return 0
    if not available_for_recruitment:
        return 1
    return 2


# ─── GET CAREER DIAL STATE ───────────────────────────────────────────────────

@career_dial_bp.route('/career-dial', methods=['GET'])
@jwt_required()
def get_career_dial():
    """Return current Career Dial state for the authenticated user."""
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT is_visible, available_for_recruitment, employment_status FROM users WHERE id = %s",
            (current_user_id,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return jsonify({"error": "User not found"}), 404

        is_visible = row['is_visible'] if row['is_visible'] is not None else True
        available = row['available_for_recruitment'] if row['available_for_recruitment'] is not None else True
        dial_level = _compute_dial_level(is_visible, available)

        return jsonify({
            "dial_level": dial_level,
            "is_visible": is_visible,
            "available_for_recruitment": available,
            "employment_status": row.get('employment_status') or 'job_seeker'
        }), 200
    except Exception as e:
        conn.close()
        logger.error(f"Get career dial error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── TOGGLE VISIBILITY ──────────────────────────────────────────────────────

@career_dial_bp.route('/visibility', methods=['PUT'])
@jwt_required()
def update_visibility():
    """Toggle visibility for the authenticated user.

    Body: { is_visible: boolean }
    If is_visible is set to false, available_for_recruitment is also set to false.
    """
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    if 'is_visible' not in data:
        return jsonify({"error": "is_visible is required"}), 400

    is_visible = bool(data['is_visible'])

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if not is_visible:
            # Can't be available if invisible
            cur.execute(
                "UPDATE users SET is_visible = %s, available_for_recruitment = false WHERE id = %s "
                "RETURNING is_visible, available_for_recruitment",
                (is_visible, current_user_id)
            )
        else:
            cur.execute(
                "UPDATE users SET is_visible = %s WHERE id = %s "
                "RETURNING is_visible, available_for_recruitment",
                (is_visible, current_user_id)
            )

        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        cur.close(); conn.close()

        vis = row['is_visible']
        avail = row['available_for_recruitment'] if row['available_for_recruitment'] is not None else False
        dial_level = _compute_dial_level(vis, avail)

        return jsonify({
            "status": "updated",
            "is_visible": vis,
            "available_for_recruitment": avail,
            "dial_level": dial_level
        }), 200
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"Update visibility error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── TOGGLE AVAILABILITY ────────────────────────────────────────────────────

@career_dial_bp.route('/availability', methods=['PUT'])
@jwt_required()
def update_availability():
    """Toggle recruitment availability for the authenticated user.

    Body: { available_for_recruitment: boolean }
    Cannot set available_for_recruitment to true if is_visible is false.
    """
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    if 'available_for_recruitment' not in data:
        return jsonify({"error": "available_for_recruitment is required"}), 400

    available = bool(data['available_for_recruitment'])

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Check current visibility first
        cur.execute("SELECT is_visible FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()
        if not user:
            cur.close(); conn.close()
            return jsonify({"error": "User not found"}), 404

        is_visible = user['is_visible'] if user['is_visible'] is not None else True

        if available and not is_visible:
            cur.close(); conn.close()
            return jsonify({"error": "Must be visible to be available"}), 400

        cur.execute(
            "UPDATE users SET available_for_recruitment = %s WHERE id = %s "
            "RETURNING is_visible, available_for_recruitment",
            (available, current_user_id)
        )
        row = cur.fetchone()

        conn.commit()
        cur.close(); conn.close()

        vis = row['is_visible'] if row['is_visible'] is not None else True
        avail = row['available_for_recruitment']
        dial_level = _compute_dial_level(vis, avail)

        return jsonify({
            "status": "updated",
            "is_visible": vis,
            "available_for_recruitment": avail,
            "dial_level": dial_level
        }), 200
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"Update availability error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── SET CAREER DIAL LEVEL DIRECTLY ─────────────────────────────────────────

@career_dial_bp.route('/career-dial', methods=['PUT'])
@jwt_required()
def set_career_dial():
    """Set Career Dial level directly.

    Body: { dial_level: 0|1|2 }
    0 → is_visible=false, available_for_recruitment=false
    1 → is_visible=true,  available_for_recruitment=false
    2 → is_visible=true,  available_for_recruitment=true
    """
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    dial_level = data.get('dial_level')

    if dial_level not in (0, 1, 2):
        return jsonify({"error": "dial_level must be 0, 1, or 2"}), 400

    # Map dial level to boolean flags
    if dial_level == 0:
        is_visible = False
        available = False
    elif dial_level == 1:
        is_visible = True
        available = False
    else:  # 2
        is_visible = True
        available = True

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "UPDATE users SET is_visible = %s, available_for_recruitment = %s WHERE id = %s "
            "RETURNING is_visible, available_for_recruitment",
            (is_visible, available, current_user_id)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        cur.close(); conn.close()

        return jsonify({
            "status": "updated",
            "dial_level": dial_level,
            "is_visible": is_visible,
            "available_for_recruitment": available
        }), 200
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"Set career dial error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── SET EMPLOYMENT STATUS ──────────────────────────────────────────────────

VALID_EMPLOYMENT_STATUSES = {'job_seeker', 'employed_open', 'employed_not_looking', 'freelancer'}


@career_dial_bp.route('/career-dial/employment-status', methods=['PUT'])
@jwt_required()
def update_employment_status():
    """Update employment status for the authenticated user.

    Body: { employment_status: "job_seeker"|"employed_open"|"employed_not_looking"|"freelancer" }
    G22/G23: Controls passive talent visibility for recruiters.
    """
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    employment_status = data.get('employment_status')

    if employment_status not in VALID_EMPLOYMENT_STATUSES:
        return jsonify({
            "error": f"employment_status must be one of: {', '.join(sorted(VALID_EMPLOYMENT_STATUSES))}"
        }), 400

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "UPDATE users SET employment_status = %s WHERE id = %s "
            "RETURNING employment_status, is_visible, available_for_recruitment",
            (employment_status, current_user_id)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        cur.close(); conn.close()

        vis = row['is_visible'] if row['is_visible'] is not None else True
        avail = row['available_for_recruitment'] if row['available_for_recruitment'] is not None else False
        dial_level = _compute_dial_level(vis, avail)

        return jsonify({
            "status": "updated",
            "employment_status": row['employment_status'],
            "dial_level": dial_level,
            "is_visible": vis,
            "available_for_recruitment": avail
        }), 200
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"Update employment status error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── GET EMPLOYMENT STATUS ──────────────────────────────────────────────────

@career_dial_bp.route('/career-dial/employment-status', methods=['GET'])
@jwt_required()
def get_employment_status():
    """Return current employment status for the authenticated user."""
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT employment_status FROM users WHERE id = %s",
            (current_user_id,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "employment_status": row['employment_status'] or 'job_seeker'
        }), 200
    except Exception as e:
        conn.close()
        logger.error(f"Get employment status error: {e}")
        return jsonify({"error": str(e)}), 500
