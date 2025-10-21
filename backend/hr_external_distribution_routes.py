"""
External Job Board Distribution Stubs
Queue/distribute job postings to external targets and receive callbacks.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import logging
import os
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hr_distribution_bp = Blueprint("hr_distribution", __name__, url_prefix="/api/hr/distribution")
external_distribution_bp = Blueprint("external_distribution", __name__, url_prefix="/api/ext/job-board")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "emirati_journey"),
    "user": os.getenv("DB_USER", "emirati_user"),
    "password": os.getenv("DB_PASSWORD", "emirati_secure_password"),
}


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


@hr_distribution_bp.route("/jobs/<job_id>/distribute", methods=["POST"])
@jwt_required()
def distribute_job(job_id):
    """Queue a job for distribution to a list of external targets."""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get("role") not in ("hr_recruiter", "admin"):
            return jsonify({"success": False, "message": "Insufficient permissions"}), 403
        data = request.get_json() or {}
        targets = data.get("targets") or []  # e.g., ["linkedin", "indeed"]
        payload = data.get("payload") or {}
        if not targets:
            return jsonify({"success": False, "message": "targets is required (non-empty array)"}), 400

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify job ownership
            cursor.execute(
                """
                SELECT 1 FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id=%s AND hp.user_id=%s
                """,
                (job_id, current_user_id),
            )
            if not cursor.fetchone():
                return jsonify({"success": False, "message": "Job posting not found or access denied"}), 404

            created = []
            for t in targets:
                cursor.execute(
                    """
                    INSERT INTO external_job_distribution (job_posting_id, target, payload, status)
                    VALUES (%s,%s,%s,'queued')
                    RETURNING *
                    """,
                    (job_id, t, json.dumps(payload)),
                )
                created.append(dict(cursor.fetchone()))
            conn.commit()
            return jsonify({"success": True, "message": "Queued for distribution", "data": created}), 201
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error distributing job: {str(e)}")
        return jsonify({"success": False, "message": "Failed to queue distribution"}), 500


@external_distribution_bp.route("/callbacks/<target>/<job_id>", methods=["POST"])
def distribution_callback(target, job_id):
    """Stub endpoint external boards can call to update status for a job."""
    try:
        data = request.get_json() or {}
        external_id = data.get("external_id")
        response = data.get("response")
        status = data.get("status") or "processed"

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                UPDATE external_job_distribution
                SET status=%s, external_id=COALESCE(%s, external_id), response=COALESCE(%s, response), updated_at=CURRENT_TIMESTAMP
                WHERE job_posting_id=%s AND target=%s
                RETURNING *
                """,
                (status, external_id, json.dumps(response) if response is not None else None, job_id, target),
            )
            row = cursor.fetchone()
            if not row:
                return jsonify({"success": False, "message": "Distribution record not found"}), 404
            conn.commit()
            return jsonify({"success": True, "message": "Callback processed", "data": dict(row)})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error processing distribution callback: {str(e)}")
        return jsonify({"success": False, "message": "Failed to process callback"}), 500
