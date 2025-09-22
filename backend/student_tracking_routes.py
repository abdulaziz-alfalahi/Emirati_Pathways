"""
Student Tracking API Routes
Emirati Journey Platform - Educator Persona
RESTful API endpoints for student management and tracking
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date
import json
import logging

from student_tracking_system import StudentTrackingSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
student_tracking_bp = Blueprint('student_tracking', __name__, url_prefix='/api/students')

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

@student_tracking_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Student Tracking System',
        'timestamp': datetime.now().isoformat()
    })

# Student Management Endpoints

@student_tracking_bp.route('', methods=['POST'])
@jwt_required()
def create_student():
    """Create a new student record"""
    try:
        educator_id = get_jwt_identity()
        student_data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'date_of_birth']
        for field in required_fields:
            if field not in student_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Convert date string to date object
        if isinstance(student_data['date_of_birth'], str):
            student_data['date_of_birth'] = datetime.strptime(
                student_data['date_of_birth'], '%Y-%m-%d'
            ).date()
        
        # Set default values
        student_data.setdefault('nationality', 'UAE')
        student_data.setdefault('status', 'active')
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            tracking_system = StudentTrackingSystem(db_connection)
            result = tracking_system.create_student(student_data, educator_id)
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in create_student: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@student_tracking_bp.route('', methods=['GET'])
@jwt_required()
def get_students():
    """Get list of students with optional filtering"""
    try:
        educator_id = get_jwt_identity()
        
        # Get query parameters for filtering
        filters = {}
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('grade_level'):
            filters['grade_level'] = int(request.args.get('grade_level'))
        if request.args.get('class_id'):
            filters['class_id'] = request.args.get('class_id')
        if request.args.get('search'):
            filters['search'] = request.args.get('search')
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            tracking_system = StudentTrackingSystem(db_connection)
            result = tracking_system.get_students(educator_id, filters)
            
            return jsonify(result), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_students: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@student_tracking_bp.route('/<student_id>', methods=['GET'])
@jwt_required()
def get_student_details(student_id):
    """Get detailed information about a specific student"""
    try:
        educator_id = get_jwt_identity()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            tracking_system = StudentTrackingSystem(db_connection)
            result = tracking_system.get_student_details(student_id, educator_id)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 404
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_student_details: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@student_tracking_bp.route('/<student_id>', methods=['PUT'])
@jwt_required()
def update_student(student_id):
    """Update student information"""
    try:
        educator_id = get_jwt_identity()
        update_data = request.get_json()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            with db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Verify educator has access to this student
                access_check_query = """
                    SELECT COUNT(*) as access_count FROM students s
                    JOIN enrollments e ON s.id = e.student_id
                    JOIN classes c ON e.class_id = c.id
                    WHERE s.id = %s AND c.educator_id = %s
                """
                cursor.execute(access_check_query, [student_id, educator_id])
                access_result = cursor.fetchone()
                
                if access_result['access_count'] == 0:
                    return jsonify({
                        'success': False,
                        'error': 'Access denied to this student'
                    }), 403
                
                # Build update query dynamically
                allowed_fields = [
                    'first_name', 'last_name', 'arabic_name', 'email', 'phone',
                    'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
                    'medical_conditions', 'special_needs', 'status'
                ]
                
                update_fields = []
                update_values = []
                
                for field in allowed_fields:
                    if field in update_data:
                        update_fields.append(f"{field} = %s")
                        update_values.append(update_data[field])
                
                if not update_fields:
                    return jsonify({
                        'success': False,
                        'error': 'No valid fields to update'
                    }), 400
                
                update_values.append(student_id)
                update_query = f"""
                    UPDATE students 
                    SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, updated_at
                """
                
                cursor.execute(update_query, update_values)
                result = cursor.fetchone()
                db_connection.commit()
                
                return jsonify({
                    'success': True,
                    'student_id': result['id'],
                    'updated_at': result['updated_at'].isoformat(),
                    'message': 'Student updated successfully'
                }), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in update_student: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Attendance Management Endpoints

@student_tracking_bp.route('/attendance', methods=['POST'])
@jwt_required()
def record_attendance():
    """Record attendance for students"""
    try:
        educator_id = get_jwt_identity()
        attendance_data = request.get_json()
        
        # Validate required fields
        required_fields = ['class_id', 'attendance_records']
        for field in required_fields:
            if field not in attendance_data:
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
            tracking_system = StudentTrackingSystem(db_connection)
            result = tracking_system.record_attendance(attendance_data, educator_id)
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in record_attendance: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@student_tracking_bp.route('/attendance/<class_id>', methods=['GET'])
@jwt_required()
def get_attendance_report(class_id):
    """Get attendance report for a class"""
    try:
        educator_id = get_jwt_identity()
        
        # Get date range from query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            tracking_system = StudentTrackingSystem(db_connection)
            result = tracking_system.get_attendance_report(class_id, educator_id, start_date, end_date)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 404
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_attendance_report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Progress Tracking Endpoints

@student_tracking_bp.route('/progress', methods=['POST'])
@jwt_required()
def update_student_progress():
    """Update student progress in specific subject/skill areas"""
    try:
        educator_id = get_jwt_identity()
        progress_data = request.get_json()
        
        # Validate required fields
        required_fields = ['student_id', 'class_id', 'subject', 'skill_area', 'current_level']
        for field in required_fields:
            if field not in progress_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Convert date strings to date objects if present
        date_fields = ['last_assessment_date', 'next_assessment_date']
        for field in date_fields:
            if field in progress_data and isinstance(progress_data[field], str):
                progress_data[field] = datetime.strptime(
                    progress_data[field], '%Y-%m-%d'
                ).date()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            tracking_system = StudentTrackingSystem(db_connection)
            result = tracking_system.update_student_progress(progress_data, educator_id)
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in update_student_progress: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@student_tracking_bp.route('/progress/<class_id>', methods=['GET'])
@jwt_required()
def get_class_progress_overview(class_id):
    """Get progress overview for all students in a class"""
    try:
        educator_id = get_jwt_identity()
        
        db_connection = get_db_connection()
        if not db_connection:
            return jsonify({
                'success': False,
                'error': 'Database connection failed'
            }), 500
        
        try:
            tracking_system = StudentTrackingSystem(db_connection)
            result = tracking_system.get_class_progress_overview(class_id, educator_id)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 404
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_class_progress_overview: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Class Management Endpoints

@student_tracking_bp.route('/classes', methods=['GET'])
@jwt_required()
def get_educator_classes():
    """Get list of classes for the current educator"""
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
                classes_query = """
                    SELECT c.*, 
                           COUNT(DISTINCT e.student_id) as enrolled_students,
                           i.name as institution_name
                    FROM classes c
                    LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'enrolled'
                    LEFT JOIN institutions i ON c.institution_id = i.id
                    WHERE c.educator_id = %s AND c.is_active = true
                    GROUP BY c.id, i.name
                    ORDER BY c.grade_level, c.class_name
                """
                
                cursor.execute(classes_query, [educator_id])
                classes = cursor.fetchall()
                
                return jsonify({
                    'success': True,
                    'classes': [dict(class_info) for class_info in classes],
                    'total_count': len(classes)
                }), 200
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in get_educator_classes: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@student_tracking_bp.route('/classes', methods=['POST'])
@jwt_required()
def create_class():
    """Create a new class"""
    try:
        educator_id = get_jwt_identity()
        class_data = request.get_json()
        
        # Validate required fields
        required_fields = ['class_name', 'grade_level', 'academic_year']
        for field in required_fields:
            if field not in class_data:
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
            with db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Insert new class
                insert_query = """
                    INSERT INTO classes (
                        class_name, grade_level, section, subject, academic_year,
                        educator_id, institution_id, classroom, max_capacity,
                        schedule_days, schedule_times, description
                    ) VALUES (
                        %(class_name)s, %(grade_level)s, %(section)s, %(subject)s, %(academic_year)s,
                        %(educator_id)s, %(institution_id)s, %(classroom)s, %(max_capacity)s,
                        %(schedule_days)s, %(schedule_times)s, %(description)s
                    ) RETURNING id, created_at
                """
                
                class_data['educator_id'] = educator_id
                class_data.setdefault('max_capacity', 30)
                
                cursor.execute(insert_query, class_data)
                result = cursor.fetchone()
                db_connection.commit()
                
                return jsonify({
                    'success': True,
                    'class_id': result['id'],
                    'created_at': result['created_at'].isoformat(),
                    'message': 'Class created successfully'
                }), 201
                
        finally:
            db_connection.close()
            
    except Exception as e:
        logger.error(f"Error in create_class: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

# Error handlers
@student_tracking_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@student_tracking_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'error': 'Method not allowed'
    }), 405

@student_tracking_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
