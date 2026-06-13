"""
Quality Assurance & Bias Detection API Routes
Wraps quality_assurance_system for recruiter/admin review workflows.
"""

import os
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from quality_assurance_system import QualityAssuranceSystem, health_check


logger = logging.getLogger(__name__)

qa_bp = Blueprint("quality_assurance", __name__, url_prefix="/api/qa")


def _conn_string() -> str:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "emirati_journey")
    user = os.getenv("DB_USER", "emirati_user")
    pwd = os.getenv("DB_PASSWORD", "emirati_secure_password")
    return f"postgresql://{user}:{pwd}@{host}:{port}/{name}"


@qa_bp.route("/health", methods=["GET"])
@jwt_required()
def qa_health():
    claims = get_jwt()
    if claims and claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
    result = health_check(_conn_string())
    return jsonify({"success": True, "data": result}), 200


@qa_bp.route("/assessor/<int:assessor_id>/bias", methods=["GET"])
@jwt_required()
def assessor_bias(assessor_id: int):
    try:
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        date_from = request.args.get("from")
        date_to = request.args.get("to")

        system = QualityAssuranceSystem(_conn_string())
        system.connect_db()
        try:
            from_dt = datetime.fromisoformat(date_from) if date_from else None
            to_dt = datetime.fromisoformat(date_to) if date_to else None
            result = system.detect_assessment_bias(assessor_id, from_dt, to_dt)
        finally:
            system.close_db()

        status = 200 if result.get("success") else 400
        return jsonify({"success": result.get("success", False), "data": result}), status
    except Exception as e:
        logger.error(f"Bias detection error: {e}")
        return jsonify({"success": False, "message": "Bias detection failed"}), 500


@qa_bp.route("/assessor/<int:assessor_id>/dashboard", methods=["GET"])
@jwt_required()
def assessor_dashboard(assessor_id: int):
    try:
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        system = QualityAssuranceSystem(_conn_string())
        system.connect_db()
        try:
            result = system.get_quality_dashboard(assessor_id)
        finally:
            system.close_db()

        status = 200 if result.get("success") else 400
        return jsonify({"success": result.get("success", False), "data": result}), status
    except Exception as e:
        logger.error(f"QA dashboard error: {e}")
        return jsonify({"success": False, "message": "Failed to load QA dashboard"}), 500
