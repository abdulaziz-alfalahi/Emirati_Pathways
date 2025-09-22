"""
Curriculum Planning API Routes
Emirati Journey Platform - Educator Persona
RESTful API endpoints for comprehensive curriculum planning with UAE standards
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date
import json
import logging

from curriculum_planning_system import CurriculumPlanningSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
curriculum_planning_bp = Blueprint('curriculum_planning', __name__, url_prefix='/api/curriculum')

def get_db_connection():
    """Get database connection"""
    try:
        connection = psycopg2.connect(
            host="localhost",
            database="emirati_journey",
            user="emirati_user",
            password="emirati_secure_password",
            port="5432"
        )
        return connection
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        return None

@curriculum_planning_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Curriculum Planning System',
        'timestamp': datetime.now().isoformat()
    })

# UAE Standards Endpoints

@curriculum_planning_bp.route('/standards', methods=['GET'])
@jwt_required()
def get_uae_standards():
    """Get UAE curriculum standards with optional filtering"""
    try:
        # Get query parameters for filtering
        filters = {}
        if request.args.get('subject'):
            filters['subject'] = request.args.get('subject')
        if request.args.get('grade_level'):
            filters['grade_level'] = int(request.args.get('grade_level'))
        if request.args.get('strand'):
            filters['strand'] = request.args.get('strand')
        if request.args.get('search'):
            filters['search'] = request.args.get('search')
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.get_uae_standards(filters)
            
            return jsonify(result), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_uae_standards: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@curriculum_planning_bp.route('/standards/subjects-grades', methods=['GET'])
@jwt_required()
def get_subjects_and_grades():
    """Get available subjects and grade levels"""
    try:
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.get_subjects_and_grades()
            
            return jsonify(result), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_subjects_and_grades: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Curriculum Template Endpoints

@curriculum_planning_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_curriculum_template():
    """Create a new curriculum template"""
    try:
        educator_id = get_jwt_identity()
        template_data = request.get_json()
        
        # Validate required fields
        required_fields = ['template_name', 'subject', 'grade_level', 'academic_year', 'template_type']
        for field in required_fields:
            if field not in template_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.create_curriculum_template(template_data, educator_id)
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in create_curriculum_template: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@curriculum_planning_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_curriculum_templates():
    """Get curriculum templates for the current educator"""
    try:
        educator_id = get_jwt_identity()
        
        # Get query parameters for filtering
        filters = {}
        if request.args.get('subject'):
            filters['subject'] = request.args.get('subject')
        if request.args.get('grade_level'):
            filters['grade_level'] = int(request.args.get('grade_level'))
        if request.args.get('template_type'):
            filters['template_type'] = request.args.get('template_type')
        if request.args.get('search'):
            filters['search'] = request.args.get('search')
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.get_curriculum_templates(educator_id, filters)
            
            return jsonify(result), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_curriculum_templates: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Curriculum Management Endpoints

@curriculum_planning_bp.route('', methods=['POST'])
@jwt_required()
def create_curriculum():
    """Create a new curriculum"""
    try:
        educator_id = get_jwt_identity()
        curriculum_data = request.get_json()
        
        # Validate required fields
        required_fields = ['curriculum_name', 'class_id', 'subject', 'grade_level', 'academic_year', 'start_date', 'end_date']
        for field in required_fields:
            if field not in curriculum_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.create_curriculum(curriculum_data, educator_id)
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in create_curriculum: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@curriculum_planning_bp.route('', methods=['GET'])
@jwt_required()
def get_curricula():
    """Get curricula for the current educator"""
    try:
        educator_id = get_jwt_identity()
        
        # Get query parameters for filtering
        filters = {}
        if request.args.get('subject'):
            filters['subject'] = request.args.get('subject')
        if request.args.get('grade_level'):
            filters['grade_level'] = int(request.args.get('grade_level'))
        if request.args.get('academic_year'):
            filters['academic_year'] = request.args.get('academic_year')
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.get_curricula(educator_id, filters)
            
            return jsonify(result), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_curricula: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Lesson Planning Endpoints

@curriculum_planning_bp.route('/<curriculum_id>/lessons', methods=['POST'])
@jwt_required()
def create_lesson_plan(curriculum_id):
    """Create a new lesson plan"""
    try:
        educator_id = get_jwt_identity()
        lesson_data = request.get_json()
        
        # Validate required fields
        required_fields = ['lesson_number', 'lesson_title', 'learning_objectives']
        for field in required_fields:
            if field not in lesson_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        lesson_data['curriculum_id'] = curriculum_id
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.create_lesson_plan(lesson_data, educator_id)
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in create_lesson_plan: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@curriculum_planning_bp.route('/<curriculum_id>/lessons', methods=['GET'])
@jwt_required()
def get_lesson_plans(curriculum_id):
    """Get lesson plans for a curriculum"""
    try:
        educator_id = get_jwt_identity()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.get_lesson_plans(curriculum_id, educator_id)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 404
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_lesson_plans: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Assessment Planning Endpoints

@curriculum_planning_bp.route('/<curriculum_id>/assessments', methods=['POST'])
@jwt_required()
def create_assessment_plan(curriculum_id):
    """Create a new assessment plan"""
    try:
        educator_id = get_jwt_identity()
        assessment_data = request.get_json()
        
        # Validate required fields
        required_fields = ['assessment_name', 'assessment_type', 'learning_objectives']
        for field in required_fields:
            if field not in assessment_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        assessment_data['curriculum_id'] = curriculum_id
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.create_assessment_plan(assessment_data, educator_id)
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in create_assessment_plan: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Resource Management Endpoints

@curriculum_planning_bp.route('/resources', methods=['GET'])
@jwt_required()
def get_curriculum_resources():
    """Get curriculum resources with filtering"""
    try:
        # Get query parameters for filtering
        filters = {}
        if request.args.get('subject'):
            filters['subject'] = request.args.get('subject')
        if request.args.get('grade_levels'):
            filters['grade_levels'] = int(request.args.get('grade_levels'))
        if request.args.get('resource_type'):
            filters['resource_type'] = request.args.get('resource_type')
        if request.args.get('topics'):
            filters['topics'] = request.args.get('topics')
        if request.args.get('search'):
            filters['search'] = request.args.get('search')
        if request.args.get('is_free'):
            filters['is_free'] = request.args.get('is_free').lower() == 'true'
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.get_curriculum_resources(filters)
            
            return jsonify(result), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_curriculum_resources: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Pacing Guide Endpoints

@curriculum_planning_bp.route('/<curriculum_id>/pacing', methods=['GET'])
@jwt_required()
def get_pacing_guide(curriculum_id):
    """Get pacing guide for a curriculum"""
    try:
        educator_id = get_jwt_identity()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.get_pacing_guide(curriculum_id, educator_id)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 404
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_pacing_guide: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@curriculum_planning_bp.route('/<curriculum_id>/pacing/<int:week_number>', methods=['PUT'])
@jwt_required()
def update_pacing_guide(curriculum_id, week_number):
    """Update pacing guide for a specific week"""
    try:
        educator_id = get_jwt_identity()
        pacing_data = request.get_json()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            planning_system = CurriculumPlanningSystem(db_connection)
            result = planning_system.update_pacing_guide(curriculum_id, week_number, pacing_data, educator_id)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in update_pacing_guide: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Analytics and Reporting Endpoints

@curriculum_planning_bp.route('/<curriculum_id>/analytics', methods=['GET'])
@jwt_required()
def get_curriculum_analytics(curriculum_id):
    """Get analytics for a curriculum"""
    try:
        educator_id = get_jwt_identity()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            with db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator owns the curriculum
                curriculum_check = """
                    SELECT curriculum_name, subject, grade_level, 
                           total_planned_lessons, completed_lessons,
                           start_date, end_date
                    FROM curricula 
                    WHERE id = %s AND educator_id = %s
                """
                cursor.execute(curriculum_check, [curriculum_id, educator_id])
                curriculum_info = cursor.fetchone()
                
                if not curriculum_info:
                    return jsonify({
                        'success': False,
                        'error': 'Access denied to this curriculum'
                    }), 403
                
                # Get lesson completion statistics
                lesson_stats_query = """
                    SELECT 
                        COUNT(*) as total_lessons,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_lessons,
                        COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_lessons,
                        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_lessons,
                        AVG(CASE WHEN student_engagement_level IS NOT NULL THEN student_engagement_level END) as avg_engagement
                    FROM lesson_plans 
                    WHERE curriculum_id = %s
                """
                cursor.execute(lesson_stats_query, [curriculum_id])
                lesson_stats = cursor.fetchone()
                
                # Get assessment statistics
                assessment_stats_query = """
                    SELECT 
                        COUNT(*) as total_assessments,
                        COUNT(CASE WHEN actual_date IS NOT NULL THEN 1 END) as completed_assessments,
                        COUNT(CASE WHEN is_published = true THEN 1 END) as published_assessments
                    FROM assessment_plans 
                    WHERE curriculum_id = %s
                """
                cursor.execute(assessment_stats_query, [curriculum_id])
                assessment_stats = cursor.fetchone()
                
                # Get pacing statistics
                pacing_stats_query = """
                    SELECT 
                        COUNT(*) as total_weeks,
                        COUNT(CASE WHEN pacing_status = 'on_track' THEN 1 END) as on_track_weeks,
                        COUNT(CASE WHEN pacing_status = 'ahead' THEN 1 END) as ahead_weeks,
                        COUNT(CASE WHEN pacing_status = 'behind' THEN 1 END) as behind_weeks
                    FROM pacing_guides 
                    WHERE curriculum_id = %s
                """
                cursor.execute(pacing_stats_query, [curriculum_id])
                pacing_stats = cursor.fetchone()
                
                # Calculate completion percentage
                completion_percentage = 0
                if curriculum_info['total_planned_lessons'] > 0:
                    completion_percentage = round(
                        (curriculum_info['completed_lessons'] / curriculum_info['total_planned_lessons']) * 100, 1
                    )
                
                return jsonify({
                    'success': True,
                    'curriculum_info': dict(curriculum_info),
                    'completion_percentage': completion_percentage,
                    'lesson_statistics': dict(lesson_stats),
                    'assessment_statistics': dict(assessment_stats),
                    'pacing_statistics': dict(pacing_stats)
                }), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_curriculum_analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Error handlers
@curriculum_planning_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@curriculum_planning_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'error': 'Method not allowed'
    }), 405

@curriculum_planning_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
