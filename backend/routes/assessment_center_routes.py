from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logger = logging.getLogger(__name__)

assessment_center_bp = Blueprint('assessment_center', __name__, url_prefix='/api/assessment-centers')

def get_db():
    from backend.db import get_db_connection
    return get_db_connection()

@assessment_center_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_assessment_centers():
    """List all registered Assessment Centers and their available assessment templates."""
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch all assessment centers
        cur.execute("""
            SELECT id, name, company_name, description, industry, emirate, website, phone
            FROM companies
            WHERE business_type = 'assessment_center'
        """)
        centers = [dict(row) for row in cur.fetchall()]
        
        # 2. For each center, fetch its available templates
        for center in centers:
            center_id = center['id']
            cur.execute("""
                SELECT id, name, description, template_type, duration_minutes, passing_score, nqf_level, industry_sector
                FROM assessment_templates
                WHERE created_by IN (
                    SELECT user_id::varchar FROM company_team_members WHERE company_id = %s
                ) AND is_active = true
            """, (center_id,))
            templates = [dict(t) for t in cur.fetchall()]
            center['templates'] = templates
            
        cur.close()
        conn.close()
        return jsonify({
            "success": True,
            "centers": centers
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching assessment centers: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to fetch assessment centers",
            "error": str(e)
        }), 500

@assessment_center_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_for_assessment():
    """Submit an application for a specific assessment at a center."""
    try:
        candidate_id = get_jwt_identity()
        if not candidate_id:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
            
        data = request.get_json()
        template_id = data.get('template_id')
        company_id = data.get('company_id')
        
        if not template_id or not company_id:
            return jsonify({
                "success": False,
                "message": "Missing required fields: template_id and company_id"
            }), 400
            
        conn = get_db()
        cur = conn.cursor()
        
        # Check if already applied and not completed
        cur.execute("""
            SELECT id, status FROM assessment_applications
            WHERE candidate_id = %s AND template_id = %s AND status IN ('applied', 'scheduled')
        """, (str(candidate_id), template_id))
        existing = cur.fetchone()
        
        if existing:
            cur.close()
            conn.close()
            return jsonify({
                "success": False,
                "message": f"You already have an active application for this assessment (Status: {existing[1]})"
            }), 400
            
        # Submit application
        cur.execute("""
            INSERT INTO assessment_applications (candidate_id, template_id, company_id, status)
            VALUES (%s, %s, %s, 'applied')
            RETURNING id
        """, (str(candidate_id), template_id, company_id))
        
        app_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "application_id": app_id,
            "message": "Application submitted successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"Error submitting assessment application: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to submit application",
            "error": str(e)
        }), 500

@assessment_center_bp.route('/my-applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    """Get the list of assessment applications submitted by the logged-in candidate."""
    try:
        candidate_id = get_jwt_identity()
        if not candidate_id:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
            
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT aa.id, aa.template_id, aa.company_id, aa.status, aa.applied_at, aa.scheduled_at, aa.completed_at, aa.notes,
                   c.name as center_name, c.company_name as center_full_name,
                   at.name as assessment_name, at.description as assessment_description, at.duration_minutes
            FROM assessment_applications aa
            JOIN companies c ON aa.company_id = c.id
            JOIN assessment_templates at ON aa.template_id = at.id
            WHERE aa.candidate_id = %s
            ORDER BY aa.applied_at DESC
        """, (str(candidate_id),))
        
        applications = [dict(row) for row in cur.fetchall()]
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "applications": applications
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching candidate applications: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to fetch applications",
            "error": str(e)
        }), 500
