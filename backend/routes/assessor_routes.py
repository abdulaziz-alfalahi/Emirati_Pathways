"""
API Routes for Assessor Persona
Handles assessment planning, competency validation, and assessor management
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json
import logging

from backend.assessment_planning_system import AssessmentPlanningSystem, AssessmentTemplate, Assessment, CompetencyModel
from backend.competency_validation_framework import CompetencyValidationFramework
from backend.auth.auth_manager import require_role

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
assessor_bp = Blueprint('assessor', __name__, url_prefix='/api/assessor')

def get_db_connection():
    """Get database connection string from app config"""
    return current_app.config.get('DATABASE_URL', 'postgresql://localhost/emirati_platform')

# Assessment Template Routes

@assessor_bp.route('/templates', methods=['POST'])
@jwt_required()
@require_role(['assessor', 'admin'])
def create_assessment_template():
    """Create a new assessment template"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'template_type', 'competency_framework', 'assessment_criteria']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Create assessment template object
        template = AssessmentTemplate(
            name=data['name'],
            description=data.get('description', ''),
            template_type=data['template_type'],
            competency_framework=data['competency_framework'],
            assessment_criteria=data['assessment_criteria'],
            duration_minutes=data.get('duration_minutes', 60),
            passing_score=data.get('passing_score', 70.0),
            nqf_level=data.get('nqf_level'),
            industry_sector=data.get('industry_sector'),
            is_active=data.get('is_active', True),
            created_by=current_user_id
        )
        
        # Create template using planning system
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.create_assessment_template(template)
        
        planning_system.close_db()
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating assessment template: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to create assessment template"
        }), 500

@assessor_bp.route('/templates', methods=['GET'])
@jwt_required()
@require_role(['assessor', 'admin', 'hr_recruiter'])
def get_assessment_templates():
    """Get assessment templates with optional filters"""
    try:
        # Get query parameters for filtering
        filters = {}
        if request.args.get('template_type'):
            filters['template_type'] = request.args.get('template_type')
        if request.args.get('industry_sector'):
            filters['industry_sector'] = request.args.get('industry_sector')
        if request.args.get('nqf_level'):
            filters['nqf_level'] = int(request.args.get('nqf_level'))
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.get_assessment_templates(filters)
        
        planning_system.close_db()
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving assessment templates: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve assessment templates"
        }), 500

@assessor_bp.route('/templates/<int:template_id>', methods=['PUT'])
@jwt_required()
@require_role(['assessor', 'admin'])
def update_assessment_template(template_id):
    """Update an existing assessment template"""
    try:
        data = request.get_json()
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.update_assessment_template(template_id, data)
        
        planning_system.close_db()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error updating assessment template: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to update assessment template"
        }), 500

# Assessment Management Routes

@assessor_bp.route('/assessments', methods=['POST'])
@jwt_required()
@require_role(['assessor', 'admin'])
def create_assessment():
    """Create a new assessment"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['template_id', 'candidate_id', 'assessment_title']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Parse scheduled_date if provided
        scheduled_date = None
        if data.get('scheduled_date'):
            scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
        
        # Create assessment object
        assessment = Assessment(
            template_id=data['template_id'],
            candidate_id=data['candidate_id'],
            assessor_id=current_user_id,
            assessment_title=data['assessment_title'],
            assessment_purpose=data.get('assessment_purpose', ''),
            scheduled_date=scheduled_date,
            status=data.get('status', 'scheduled'),
            assessment_mode=data.get('assessment_mode', 'online'),
            location=data.get('location'),
            special_requirements=data.get('special_requirements')
        )
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.create_assessment(assessment)
        
        planning_system.close_db()
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating assessment: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to create assessment"
        }), 500

@assessor_bp.route('/assessments', methods=['GET'])
@jwt_required()
@require_role(['assessor', 'admin', 'hr_recruiter'])
def get_assessments():
    """Get assessments with optional filters"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters for filtering
        filters = {}
        
        # For assessors, default to their own assessments unless they're admin
        user_roles = request.headers.get('X-User-Roles', '').split(',')
        if 'admin' not in user_roles:
            filters['assessor_id'] = current_user_id
        
        if request.args.get('candidate_id'):
            filters['candidate_id'] = int(request.args.get('candidate_id'))
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('date_from'):
            filters['date_from'] = datetime.fromisoformat(request.args.get('date_from'))
        if request.args.get('date_to'):
            filters['date_to'] = datetime.fromisoformat(request.args.get('date_to'))
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.get_assessments(filters)
        
        planning_system.close_db()
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving assessments: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve assessments"
        }), 500

@assessor_bp.route('/assessments/<int:assessment_id>/status', methods=['PUT'])
@jwt_required()
@require_role(['assessor', 'admin'])
def update_assessment_status(assessment_id):
    """Update assessment status"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({
                "success": False,
                "message": "Status is required"
            }), 400
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.update_assessment_status(
            assessment_id, 
            data['status'], 
            current_user_id,
            data.get('notes')
        )
        
        planning_system.close_db()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error updating assessment status: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to update assessment status"
        }), 500

# Competency Management Routes

@assessor_bp.route('/competencies', methods=['POST'])
@jwt_required()
@require_role(['assessor', 'admin'])
def create_competency_model():
    """Create a new competency model"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'competency_type', 'competency_definition', 'proficiency_levels']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Create competency model object
        competency = CompetencyModel(
            name=data['name'],
            description=data.get('description', ''),
            competency_type=data['competency_type'],
            competency_definition=data['competency_definition'],
            assessment_methods=data.get('assessment_methods', {}),
            proficiency_levels=data['proficiency_levels'],
            industry_relevance=data.get('industry_relevance', []),
            nqf_alignment=data.get('nqf_alignment', {}),
            validation_criteria=data.get('validation_criteria', {}),
            is_core_competency=data.get('is_core_competency', False)
        )
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.create_competency_model(competency)
        
        planning_system.close_db()
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating competency model: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to create competency model"
        }), 500

@assessor_bp.route('/competencies', methods=['GET'])
@jwt_required()
@require_role(['assessor', 'admin', 'hr_recruiter', 'mentor', 'educator'])
def get_competency_models():
    """Get competency models with optional filters"""
    try:
        # Get query parameters for filtering
        filters = {}
        if request.args.get('competency_type'):
            filters['competency_type'] = request.args.get('competency_type')
        if request.args.get('is_core_competency'):
            filters['is_core_competency'] = request.args.get('is_core_competency').lower() == 'true'
        if request.args.get('industry'):
            filters['industry'] = request.args.get('industry')
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.get_competency_models(filters)
        
        planning_system.close_db()
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving competency models: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve competency models"
        }), 500

# Competency Validation Routes

@assessor_bp.route('/assessments/<int:assessment_id>/validate', methods=['POST'])
@jwt_required()
@require_role(['assessor', 'admin'])
def validate_assessment_competencies():
    """Validate competencies for an assessment"""
    try:
        data = request.get_json()
        
        if 'competency_results' not in data:
            return jsonify({
                "success": False,
                "message": "Competency results are required"
            }), 400
        
        # Convert competency_results keys to integers
        competency_results = {}
        for comp_id_str, results in data['competency_results'].items():
            competency_results[int(comp_id_str)] = results
        
        validation_framework = CompetencyValidationFramework(get_db_connection())
        validation_framework.connect_db()
        
        result = validation_framework.batch_validate_competencies(assessment_id, competency_results)
        
        validation_framework.close_db()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error validating assessment competencies: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to validate assessment competencies"
        }), 500

@assessor_bp.route('/competencies/<int:competency_id>/validate', methods=['POST'])
@jwt_required()
@require_role(['assessor', 'admin'])
def validate_single_competency():
    """Validate a single competency"""
    try:
        data = request.get_json()
        
        required_fields = ['assessment_id', 'assessment_results']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        validation_framework = CompetencyValidationFramework(get_db_connection())
        validation_framework.connect_db()
        
        result = validation_framework.validate_competency(
            data['assessment_id'],
            competency_id,
            data['assessment_results']
        )
        
        validation_framework.close_db()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error validating competency: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to validate competency"
        }), 500

# Assessment Scheduling Routes

@assessor_bp.route('/assessments/<int:assessment_id>/schedule', methods=['POST'])
@jwt_required()
@require_role(['assessor', 'admin'])
def schedule_assessment():
    """Schedule an assessment session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['candidate_id', 'scheduled_date', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Parse scheduled_date
        scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.schedule_assessment(
            assessment_id,
            current_user_id,
            data['candidate_id'],
            scheduled_date,
            data['start_time'],
            data['end_time'],
            data.get('location'),
            data.get('timezone', 'Asia/Dubai')
        )
        
        planning_system.close_db()
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error scheduling assessment: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to schedule assessment"
        }), 500

# Dashboard and Analytics Routes

@assessor_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_role(['assessor', 'admin'])
def get_assessor_dashboard():
    """Get assessor dashboard data"""
    try:
        current_user_id = get_jwt_identity()
        
        planning_system = AssessmentPlanningSystem(get_db_connection())
        planning_system.connect_db()
        
        result = planning_system.get_assessor_dashboard_data(current_user_id)
        
        planning_system.close_db()
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving assessor dashboard: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve dashboard data"
        }), 500

@assessor_bp.route('/competencies/<int:competency_id>/analytics', methods=['GET'])
@jwt_required()
@require_role(['assessor', 'admin'])
def get_competency_analytics(competency_id):
    """Get analytics for a specific competency"""
    try:
        # Parse date range parameters
        date_from = None
        date_to = None
        
        if request.args.get('date_from'):
            date_from = datetime.fromisoformat(request.args.get('date_from'))
        if request.args.get('date_to'):
            date_to = datetime.fromisoformat(request.args.get('date_to'))
        
        validation_framework = CompetencyValidationFramework(get_db_connection())
        validation_framework.connect_db()
        
        result = validation_framework.get_competency_analytics(competency_id, date_from, date_to)
        
        validation_framework.close_db()
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving competency analytics: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve competency analytics"
        }), 500

# Health Check Routes

@assessor_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for assessor services"""
    try:
        from backend.assessment_planning_system import health_check as planning_health
        from backend.competency_validation_framework import health_check as validation_health
        
        db_connection = get_db_connection()
        
        planning_status = planning_health(db_connection)
        validation_status = validation_health(db_connection)
        
        overall_status = "healthy" if (
            planning_status.get('status') == 'healthy' and 
            validation_status.get('status') == 'healthy'
        ) else "unhealthy"
        
        return jsonify({
            "status": overall_status,
            "services": {
                "assessment_planning": planning_status,
                "competency_validation": validation_status
            },
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# Error Handlers

@assessor_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        "success": False,
        "error": "Bad Request",
        "message": "Invalid request data"
    }), 400

@assessor_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        "success": False,
        "error": "Unauthorized",
        "message": "Authentication required"
    }), 401

@assessor_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        "success": False,
        "error": "Forbidden",
        "message": "Insufficient permissions"
    }), 403

@assessor_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Not Found",
        "message": "Resource not found"
    }), 404

@assessor_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal Server Error",
        "message": "An unexpected error occurred"
    }), 500
