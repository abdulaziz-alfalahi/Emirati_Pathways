"""
HR/Recruiter Offers Routes
Create, send e-sign token, list/get offers; accept/decline by token.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime, timedelta
import os
import uuid
import json
import secrets
from backend.db import get_db_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hr_offer_bp = Blueprint("hr_offer", __name__, url_prefix="/api/hr/offers")
print("!!! DEBUG: LOADING NEW HR_OFFER_ROUTES (SQL FIX APPLIED) !!!")
public_offer_bp = Blueprint("public_offer", __name__, url_prefix="/api/offers")




def _verify_job_ownership(cursor, user_id: int, job_posting_id: str) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM job_postings jp
        INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id::text
        WHERE jp.jd_id = %s AND hp.user_id = %s
        """,
        (job_posting_id, user_id),
    )
    return cursor.fetchone() is not None


@hr_offer_bp.route("/", methods=["GET"])
def list_offers():
    """List offers for recruiter's company, with optional filters."""
    try:
            
        # Check for mock token (development mode)
        auth_header = request.headers.get('Authorization', '')
        is_mock_token = auth_header and 'mock_token' in auth_header
        
        if is_mock_token:
            mock_token = auth_header.replace('Bearer ', '').strip()
            user_id = mock_token.replace('mock_token_', '')
            logger.info(f"Mock token detected - User ID: {user_id}, Allowing access for development")
            user_role = 'recruiter'
            current_user_id = user_id
            claims = {'role': 'recruiter'}
        else:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            claims = get_jwt()
            user_role = claims.get('role', '') if claims else ''

        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({"success": False, "message": f"Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}"}), 403

        job_id = request.args.get("job_id")
        candidate_id = request.args.get("candidate_id", type=int)
        status = request.args.get("status")
        limit = min(int(request.args.get("limit", 20)), 100)
        offset = int(request.args.get("offset", 0))
        sort_by = (request.args.get("sort_by") or "created_at").lower()
        sort_order = (request.args.get("sort_order") or "desc").upper()
        if sort_order not in ("ASC", "DESC"):
            sort_order = "DESC"
        sort_map = {
            "created_at": "o.created_at",
            "status": "o.status",
            "job_title": "jp.title",
            "candidate_name": "u.last_name",
        }
        order_clause = sort_map.get(sort_by, "o.created_at")

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            print(f"DEBUG: list_offers - user_id={current_user_id}")
            # Determine recruiter's company via HR profile
            cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id=%s", (current_user_id,))
            row = cursor.fetchone()
            print(f"DEBUG: list_offers - hr_profile row={row}")

            if not row or not row.get("company_id"):
                # No HR profile yet - return empty list
                return jsonify({"success": True, "data": {"offers": [], "total_count": 0}}), 200
            company_id = row["company_id"]

            where = ["jp.company_id = %s"]
            params = [company_id]
            if job_id:
                where.append("o.job_posting_id = %s")
                params.append(job_id)
            if candidate_id is not None:
                where.append("o.candidate_id = %s")
                params.append(candidate_id)
            if status:
                where.append("o.status = %s")
                params.append(status)

            where_clause = " AND ".join(where)
            # Build order by (candidate_name orders by last_name then first_name)
            if order_clause == "u.last_name":
                order_sql = f"u.last_name {sort_order}, u.first_name {sort_order}"
            else:
                order_sql = f"{order_clause} {sort_order}"
            cursor.execute(
                f"""
                SELECT o.*, u.first_name AS candidate_first_name, u.last_name AS candidate_last_name,
                       jp.title AS job_title
                FROM offers o
                INNER JOIN job_postings jp ON o.job_posting_id::text = jp.jd_id::text
                LEFT JOIN users u ON o.candidate_id::text = u.id::text
                WHERE {where_clause}
                ORDER BY {order_sql}
                LIMIT %s OFFSET %s
                """,
                params + [limit, offset],
            )
            offers = [dict(r) for r in cursor.fetchall()]

            # Count
            cursor.execute(
                f"""
                SELECT COUNT(1)
                FROM offers o
                INNER JOIN job_postings jp ON o.job_posting_id::text = jp.jd_id::text
                WHERE {where_clause}
                """,
                params,
            )
            total_count = cursor.fetchone()["count"]

            # Parse JSONB offer_data for response
            for o in offers:
                if o.get("offer_data") and isinstance(o["offer_data"], str):
                    try:
                        o["offer_data"] = json.loads(o["offer_data"])
                    except Exception:
                        o["offer_data"] = {}

            return jsonify({
                "success": True,
                "data": {"offers": offers, "total_count": total_count, "current_page": offset // limit + 1}
            })
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        with open("debug_offers.log", "a") as f:
            f.write(f"ERROR: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())
        logger.error(f"Error listing offers: {str(e)}")
        return jsonify({"success": False, "message": "Failed to list offers"}), 500


@hr_offer_bp.route("/", methods=["POST"])
def create_offer():
    """Create a new offer. Optionally send immediately."""
    try:
        # Check for mock token (development mode)
        auth_header = request.headers.get('Authorization', '')
        is_mock_token = auth_header and 'mock_token' in auth_header
        
        if is_mock_token:
            mock_token = auth_header.replace('Bearer ', '').strip()
            user_id = mock_token.replace('mock_token_', '')
            logger.info(f"Mock token detected - User ID: {user_id}, Allowing access for development")
            user_role = 'recruiter'
            current_user_id = user_id
            claims = {'role': 'recruiter'}
        else:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            claims = get_jwt()
            user_role = claims.get('role', '') if claims else ''

        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({"success": False, "message": f"Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}"}), 403

        data = request.get_json() or {}
        job_posting_id = data.get("job_posting_id")
        candidate_id = data.get("candidate_id")
        application_id = data.get("application_id")
        offer_data = data.get("offer_data")
        send_now = bool(data.get("send_now", False))
        expires_in_days = int(data.get("expires_in_days", 7))

        if not job_posting_id or not candidate_id or not offer_data:
            return jsonify({"success": False, "message": "job_posting_id, candidate_id, and offer_data are required"}), 400

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify recruiter has access to this job
            if not _verify_job_ownership(cursor, current_user_id, job_posting_id):
                return jsonify({"success": False, "message": "Job posting not found or access denied"}), 404

            # Ensure candidate exists
            cursor.execute("SELECT 1 FROM users WHERE id=%s", (candidate_id,))
            if not cursor.fetchone():
                return jsonify({"success": False, "message": "Candidate not found"}), 404

            signature_token = None
            status = "draft"
            expires_at = None
            if send_now:
                signature_token = secrets.token_urlsafe(32)[:128]
                status = "sent"
                expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

            cursor.execute(
                """
                INSERT INTO offers (job_posting_id, application_id, candidate_id, recruiter_id, offer_data,
                                    status, signature_token, expires_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING *
                """,
                (
                    job_posting_id,
                    application_id,
                    candidate_id,
                    current_user_id,
                    json.dumps(offer_data),
                    status,
                    signature_token,
                    expires_at,
                ),
            )
            offer = dict(cursor.fetchone())
            conn.commit()

            # Build a signing URL if sent
            sign_url = None
            if signature_token:
                base_url = os.getenv("PUBLIC_BASE_URL", f"http://localhost:{os.getenv('PORT', '5003')}")
                sign_url = f"{base_url}/api/offers/{offer['id']}/accept?token={signature_token}"

            if offer.get("offer_data") and isinstance(offer["offer_data"], str):
                try:
                    offer["offer_data"] = json.loads(offer["offer_data"])
                except Exception:
                    offer["offer_data"] = {}

            return jsonify({"success": True, "message": "Offer created", "data": {"offer": offer, "sign_url": sign_url}}), 201
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error creating offer: {str(e)}")
        return jsonify({"success": False, "message": "Failed to create offer"}), 500


@hr_offer_bp.route("/<offer_id>", methods=["GET"])
def get_offer(offer_id):
    """Get offer details if recruiter has access."""
    try:
        # Check for mock token (development mode)
        auth_header = request.headers.get('Authorization', '')
        is_mock_token = auth_header and 'mock_token' in auth_header
        
        if is_mock_token:
            mock_token = auth_header.replace('Bearer ', '').strip()
            user_id = mock_token.replace('mock_token_', '')
            logger.info(f"Mock token detected - User ID: {user_id}, Allowing access for development")
            user_role = 'recruiter'
            current_user_id = user_id
            claims = {'role': 'recruiter'}
        else:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            claims = get_jwt()
            user_role = claims.get('role', '') if claims else ''

        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({"success": False, "message": f"Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}"}), 403

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                SELECT o.*, jp.company_id, jp.title AS job_title, u.first_name AS candidate_first_name, u.last_name AS candidate_last_name
                FROM offers o
                INNER JOIN job_postings jp ON o.job_posting_id::text = jp.jd_id::text
                LEFT JOIN users u ON o.candidate_id::text = u.id::text
                WHERE o.id = %s
                """,
                (offer_id,),
            )
            offer = cursor.fetchone()
            if not offer:
                return jsonify({"success": False, "message": "Offer not found"}), 404

            # Recruiter must belong to same company
            cursor.execute("SELECT 1 FROM hr_profiles WHERE user_id=%s AND company_id::text=%s", (current_user_id, offer["company_id"]))
            if not cursor.fetchone():
                return jsonify({"success": False, "message": "Access denied"}), 403

            result = dict(offer)
            if result.get("offer_data") and isinstance(result["offer_data"], str):
                try:
                    result["offer_data"] = json.loads(result["offer_data"])
                except Exception:
                    result["offer_data"] = {}
            return jsonify({"success": True, "data": result})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error getting offer: {str(e)}")
        return jsonify({"success": False, "message": "Failed to retrieve offer"}), 500


@hr_offer_bp.route("/<offer_id>/send", methods=["POST"])
def send_offer(offer_id):
    """Generate a signature token and mark offer as sent."""
    try:
        # Check for mock token (development mode)
        auth_header = request.headers.get('Authorization', '')
        is_mock_token = auth_header and 'mock_token' in auth_header
        
        if is_mock_token:
            mock_token = auth_header.replace('Bearer ', '').strip()
            user_id = mock_token.replace('mock_token_', '')
            logger.info(f"Mock token detected - User ID: {user_id}, Allowing access for development")
            user_role = 'recruiter'
            current_user_id = user_id
            claims = {'role': 'recruiter'}
        else:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            claims = get_jwt()
            user_role = claims.get('role', '') if claims else ''

        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({"success": False, "message": f"Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}"}), 403

        data = request.get_json() or {}
        expires_in_days = int(data.get("expires_in_days", 7))

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Fetch and verify ownership
            cursor.execute(
                """
                SELECT o.*, jp.company_id
                FROM offers o
                INNER JOIN job_postings jp ON o.job_posting_id::text = jp.jd_id::text
                WHERE o.id = %s
                """,
                (offer_id,),
            )
            offer = cursor.fetchone()
            if not offer:
                return jsonify({"success": False, "message": "Offer not found"}), 404

            cursor.execute("SELECT 1 FROM hr_profiles WHERE user_id=%s AND company_id::text=%s", (current_user_id, offer["company_id"]))
            if not cursor.fetchone():
                return jsonify({"success": False, "message": "Access denied"}), 403

            token = secrets.token_urlsafe(32)[:128]
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
            cursor.execute(
                """
                UPDATE offers
                SET status='sent', signature_token=%s, expires_at=%s, updated_at=CURRENT_TIMESTAMP
                WHERE id=%s
                RETURNING *
                """,
                (token, expires_at, offer_id),
            )
            updated = dict(cursor.fetchone())
            conn.commit()

            base_url = os.getenv("PUBLIC_BASE_URL", f"http://localhost:{os.getenv('PORT', '5003')}")
            sign_url = f"{base_url}/api/offers/{offer_id}/accept?token={token}"
            return jsonify({"success": True, "message": "Offer sent", "data": {"offer": updated, "sign_url": sign_url}})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error sending offer: {str(e)}")
        return jsonify({"success": False, "message": "Failed to send offer"}), 500


@public_offer_bp.route("/<offer_id>/accept", methods=["POST"])
def accept_offer(offer_id):
    """Accept an offer by signature token (no auth required)."""
    try:
        token = request.args.get("token") or (request.get_json() or {}).get("token")
        if not token:
            return jsonify({"success": False, "message": "token is required"}), 400

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("SELECT * FROM offers WHERE id=%s", (offer_id,))
            offer = cursor.fetchone()
            if not offer:
                return jsonify({"success": False, "message": "Offer not found"}), 404
            if offer.get("signature_token") != token:
                return jsonify({"success": False, "message": "Invalid token"}), 400
            if offer.get("expires_at") and datetime.utcnow() > offer["expires_at"].replace(tzinfo=None):
                return jsonify({"success": False, "message": "Token expired"}), 400
            if offer.get("status") in ("accepted", "declined"):
                return jsonify({"success": False, "message": f"Offer already {offer['status']}"}), 400

            cursor.execute(
                """
                UPDATE offers
                SET status='accepted', signed_at=CURRENT_TIMESTAMP, accepted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
                WHERE id=%s
                RETURNING *
                """,
                (offer_id,),
            )
            updated = dict(cursor.fetchone())
            conn.commit()
            return jsonify({"success": True, "message": "Offer accepted", "data": updated})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error accepting offer: {str(e)}")
        return jsonify({"success": False, "message": "Failed to accept offer"}), 500


@public_offer_bp.route("/<offer_id>/decline", methods=["POST"])
def decline_offer(offer_id):
    """Decline an offer by signature token (no auth required)."""
    try:
        token = request.args.get("token") or (request.get_json() or {}).get("token")
        if not token:
            return jsonify({"success": False, "message": "token is required"}), 400

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("SELECT * FROM offers WHERE id=%s", (offer_id,))
            offer = cursor.fetchone()
            if not offer:
                return jsonify({"success": False, "message": "Offer not found"}), 404
            if offer.get("signature_token") != token:
                return jsonify({"success": False, "message": "Invalid token"}), 400
            if offer.get("expires_at") and datetime.utcnow() > offer["expires_at"].replace(tzinfo=None):
                return jsonify({"success": False, "message": "Token expired"}), 400
            if offer.get("status") in ("accepted", "declined"):
                return jsonify({"success": False, "message": f"Offer already {offer['status']}"}), 400

            cursor.execute(
                """
                UPDATE offers
                SET status='declined', declined_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
                WHERE id=%s
                RETURNING *
                """,
                (offer_id,),
            )
            updated = dict(cursor.fetchone())
            conn.commit()
            return jsonify({"success": True, "message": "Offer declined", "data": updated})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error declining offer: {str(e)}")
        return jsonify({"success": False, "message": "Failed to decline offer"}), 500
