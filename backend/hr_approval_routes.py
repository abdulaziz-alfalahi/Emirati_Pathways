"""
HR/Recruiter Approval Workflow Routes
Create and manage approval requests for job postings and offers.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
import os
import uuid
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hr_approval_bp = Blueprint("hr_approval", __name__, url_prefix="/api/hr/approvals")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "emirati_journey"),
    "user": os.getenv("DB_USER", "emirati_user"),
    "password": os.getenv("DB_PASSWORD", "emirati_secure_password"),
}


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


def _company_for_resource(cursor, resource_type: str, resource_id: str):
    if resource_type == "job_posting":
        cursor.execute("SELECT company_id FROM job_postings WHERE id=%s", (resource_id,))
        row = cursor.fetchone()
        return row["company_id"] if row else None
    if resource_type == "offer":
        cursor.execute(
            """
            SELECT jp.company_id
            FROM offers o
            INNER JOIN job_postings jp ON o.job_posting_id = jp.id
            WHERE o.id=%s
            """,
            (resource_id,),
        )
        row = cursor.fetchone()
        return row["company_id"] if row else None
    return None


@hr_approval_bp.route("/requests", methods=["POST"])
@jwt_required()
def create_approval_request():
    """Create an approval request for a resource (job_posting or offer)."""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get("role") not in ("hr_recruiter", "admin"):
            return jsonify({"success": False, "message": "Insufficient permissions"}), 403

        data = request.get_json() or {}
        resource_type = (data.get("resource_type") or "").strip()
        resource_id = data.get("resource_id")
        approver_id = data.get("approver_id")
        comment = data.get("comment")

        if resource_type not in ("job_posting", "offer"):
            return jsonify({"success": False, "message": "resource_type must be 'job_posting' or 'offer'"}), 400
        if not resource_id or not approver_id:
            return jsonify({"success": False, "message": "resource_id and approver_id are required"}), 400

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify both requester and approver belong to same company as resource
            company_id = _company_for_resource(cursor, resource_type, resource_id)
            if not company_id:
                return jsonify({"success": False, "message": "Resource not found"}), 404

            cursor.execute("SELECT 1 FROM hr_profiles WHERE user_id=%s AND company_id=%s", (current_user_id, company_id))
            if not cursor.fetchone():
                return jsonify({"success": False, "message": "Access denied"}), 403

            cursor.execute("SELECT 1 FROM hr_profiles WHERE user_id=%s AND company_id=%s", (approver_id, company_id))
            if not cursor.fetchone():
                return jsonify({"success": False, "message": "Approver not in same company"}), 400

            cursor.execute(
                """
                INSERT INTO approval_requests (company_id, resource_type, resource_id, requested_by, approver_id, status, comment)
                VALUES (%s,%s,%s,%s,%s,'pending',%s)
                ON CONFLICT (resource_type, resource_id, approver_id)
                DO UPDATE SET status='pending', comment=EXCLUDED.comment, decided_at=NULL
                RETURNING *
                """,
                (company_id, resource_type, resource_id, current_user_id, approver_id, comment),
            )
            req = dict(cursor.fetchone())
            conn.commit()
            return jsonify({"success": True, "message": "Approval request created", "data": req}), 201
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error creating approval request: {str(e)}")
        return jsonify({"success": False, "message": "Failed to create approval request"}), 500


@hr_approval_bp.route("/requests", methods=["GET"])
@jwt_required()
def list_approval_requests():
    """List approval requests for the recruiter's company."""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get("role") not in ("hr_recruiter", "admin"):
            return jsonify({"success": False, "message": "Insufficient permissions"}), 403

        status = request.args.get("status")
        resource_type = request.args.get("resource_type")
        approver_id = request.args.get("approver_id", type=int)
        requested_by = request.args.get("requested_by", type=int)
        limit = min(int(request.args.get("limit", 20)), 100)
        offset = int(request.args.get("offset", 0))

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id=%s", (current_user_id,))
            row = cursor.fetchone()
            if not row or not row.get("company_id"):
                return jsonify({"success": False, "message": "No company associated with your profile"}), 400
            company_id = row["company_id"]

            where = ["ar.company_id = %s"]
            params = [company_id]
            if status:
                where.append("ar.status = %s")
                params.append(status)
            if resource_type:
                where.append("ar.resource_type = %s")
                params.append(resource_type)
            if approver_id is not None:
                where.append("ar.approver_id = %s")
                params.append(approver_id)
            if requested_by is not None:
                where.append("ar.requested_by = %s")
                params.append(requested_by)

            where_clause = " AND ".join(where)
            cursor.execute(
                f"""
                SELECT ar.*
                FROM approval_requests ar
                WHERE {where_clause}
                ORDER BY ar.created_at DESC
                LIMIT %s OFFSET %s
                """,
                params + [limit, offset],
            )
            reqs = [dict(r) for r in cursor.fetchall()]
            cursor.execute(
                f"SELECT COUNT(1) FROM approval_requests ar WHERE {where_clause}",
                params,
            )
            total_count = cursor.fetchone()["count"]

            return jsonify({"success": True, "data": {"requests": reqs, "total_count": total_count}})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error listing approval requests: {str(e)}")
        return jsonify({"success": False, "message": "Failed to list approval requests"}), 500


@hr_approval_bp.route("/requests/<req_id>", methods=["GET"])
@jwt_required()
def get_approval_request(req_id):
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get("role") not in ("hr_recruiter", "admin"):
            return jsonify({"success": False, "message": "Insufficient permissions"}), 403

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("SELECT * FROM approval_requests WHERE id=%s", (req_id,))
            req = cursor.fetchone()
            if not req:
                return jsonify({"success": False, "message": "Not found"}), 404
            # Ensure same company
            cursor.execute("SELECT 1 FROM hr_profiles WHERE user_id=%s AND company_id=%s", (current_user_id, req["company_id"]))
            if not cursor.fetchone():
                return jsonify({"success": False, "message": "Access denied"}), 403
            return jsonify({"success": True, "data": dict(req)})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error getting approval request: {str(e)}")
        return jsonify({"success": False, "message": "Failed to get approval request"}), 500


@hr_approval_bp.route("/requests/<req_id>/approve", methods=["POST"])
@jwt_required()
def approve_request(req_id):
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get("role") not in ("hr_recruiter", "admin"):
            return jsonify({"success": False, "message": "Insufficient permissions"}), 403
        data = request.get_json() or {}
        comment = data.get("comment")

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("SELECT * FROM approval_requests WHERE id=%s", (req_id,))
            req = cursor.fetchone()
            if not req:
                return jsonify({"success": False, "message": "Not found"}), 404
            # Must be approver
            if req["approver_id"] != current_user_id and (not claims or claims.get("role") != "admin"):
                return jsonify({"success": False, "message": "Only assigned approver can approve"}), 403

            cursor.execute(
                """
                UPDATE approval_requests
                SET status='approved', comment=%s, decided_at=CURRENT_TIMESTAMP
                WHERE id=%s
                RETURNING *
                """,
                (comment, req_id),
            )
            updated = dict(cursor.fetchone())
            conn.commit()
            return jsonify({"success": True, "message": "Request approved", "data": updated})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error approving request: {str(e)}")
        return jsonify({"success": False, "message": "Failed to approve request"}), 500


@hr_approval_bp.route("/requests/<req_id>/reject", methods=["POST"])
@jwt_required()
def reject_request(req_id):
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get("role") not in ("hr_recruiter", "admin"):
            return jsonify({"success": False, "message": "Insufficient permissions"}), 403
        data = request.get_json() or {}
        comment = data.get("comment")

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("SELECT * FROM approval_requests WHERE id=%s", (req_id,))
            req = cursor.fetchone()
            if not req:
                return jsonify({"success": False, "message": "Not found"}), 404
            # Must be approver
            if req["approver_id"] != current_user_id and (not claims or claims.get("role") != "admin"):
                return jsonify({"success": False, "message": "Only assigned approver can reject"}), 403

            cursor.execute(
                """
                UPDATE approval_requests
                SET status='rejected', comment=%s, decided_at=CURRENT_TIMESTAMP
                WHERE id=%s
                RETURNING *
                """,
                (comment, req_id),
            )
            updated = dict(cursor.fetchone())
            conn.commit()
            return jsonify({"success": True, "message": "Request rejected", "data": updated})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error rejecting request: {str(e)}")
        return jsonify({"success": False, "message": "Failed to reject request"}), 500
