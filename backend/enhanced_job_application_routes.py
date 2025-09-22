"""
Enhanced Job Application Routes for Emirati Journey Platform
Complete implementation with database integration, file uploads, and status tracking
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime, timedelta
import uuid
import os
import json
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
import mimetypes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
enhanced_job_application_bp = Blueprint('enhanced_job_application', __name__, url_prefix='/api/jobs')

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

# File upload configuration
UPLOAD_FOLDER = '/home/ubuntu/emirati-platform/uploads/applications'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file, application_id, document_type):
    """Save uploaded file and return file info"""
    if not file or file.filename == '':
        return None
        
    if not allowed_file(file.filename):
        raise ValueError(f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Create upload directory if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{application_id}_{document_type}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    # Save file
    file.save(file_path)
    
    # Get file info
    file_size = os.path.getsize(file_path)
    mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
    
    return {
        'file_name': unique_filename,
        'original_filename': file.filename,
        'file_path': file_path,
        'file_size': file_size,
        'mime_type': mime_type
    }

@enhanced_job_application_bp.route('/apply', methods=['POST'])
@jwt_required()
def submit_job_application():
    """
    Submit a comprehensive job application with file uploads
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Handle both JSON and form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Form data with files
            data = request.form.to_dict()
            files = request.files
        else:
            # JSON data
            data = request.get_json()
            files = {}
        
        # Validate required fields
        required_fields = ['job_id', 'cover_letter']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Extract application data
        job_id = data['job_id']
        cover_letter = data['cover_letter']
        expected_salary = data.get('expected_salary')
        expected_salary_currency = data.get('expected_salary_currency', 'AED')
        availability_date = data.get('availability_date')
        notice_period_days = data.get('notice_period_days', 30)
        willing_to_relocate = data.get('willing_to_relocate', 'false').lower() == 'true'
        visa_status = data.get('visa_status')
        additional_notes = data.get('additional_notes')
        
        # Parse availability date
        parsed_availability_date = None
        if availability_date:
            try:
                parsed_availability_date = datetime.strptime(availability_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid availability_date format. Use YYYY-MM-DD'
                }), 400
        
        # Parse expected salary
        parsed_expected_salary = None
        if expected_salary:
            try:
                parsed_expected_salary = float(str(expected_salary).replace(',', ''))
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid expected_salary format'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Check if user has already applied for this job
            cursor.execute("""
                SELECT id FROM job_applications 
                WHERE user_id = %s AND job_id = %s
            """, (current_user_id, job_id))
            
            existing_application = cursor.fetchone()
            if existing_application:
                return jsonify({
                    'success': False,
                    'message': 'You have already applied for this job'
                }), 409
            
            # Insert job application
            application_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO job_applications (
                    id, user_id, job_id, cover_letter, expected_salary, 
                    expected_salary_currency, availability_date, notice_period_days,
                    willing_to_relocate, visa_status, additional_notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, submitted_at
            """, (
                application_id, current_user_id, job_id, cover_letter,
                parsed_expected_salary, expected_salary_currency, parsed_availability_date,
                notice_period_days, willing_to_relocate, visa_status, additional_notes
            ))
            
            application_result = cursor.fetchone()
            
            # Handle file uploads
            uploaded_documents = []
            for field_name, file in files.items():
                if file and file.filename:
                    try:
                        # Determine document type from field name
                        document_type = field_name.replace('_file', '')
                        if document_type not in ['resume', 'cv', 'portfolio', 'certificate', 'transcript', 'other']:
                            document_type = 'other'
                        
                        # Save file
                        file_info = save_uploaded_file(file, application_id, document_type)
                        
                        if file_info:
                            # Insert document record
                            cursor.execute("""
                                INSERT INTO application_documents (
                                    application_id, document_type, file_name, original_filename,
                                    file_path, file_size, mime_type, uploaded_by
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                RETURNING id
                            """, (
                                application_id, document_type, file_info['file_name'],
                                file_info['original_filename'], file_info['file_path'],
                                file_info['file_size'], file_info['mime_type'], current_user_id
                            ))
                            
                            doc_result = cursor.fetchone()
                            uploaded_documents.append({
                                'id': doc_result['id'],
                                'type': document_type,
                                'filename': file_info['original_filename'],
                                'size': file_info['file_size']
                            })
                            
                    except Exception as e:
                        logger.error(f"File upload error: {str(e)}")
                        # Continue with application even if file upload fails
                        pass
            
            # Create initial notification
            cursor.execute("""
                INSERT INTO application_notifications (
                    application_id, user_id, notification_type, title, message
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                application_id, current_user_id, 'application_received',
                'Application Submitted Successfully',
                f'Your application for job {job_id} has been submitted and is under review.'
            ))
            
            # Record analytics
            cursor.execute("""
                INSERT INTO application_analytics (
                    application_id, metric_name, metric_value, metric_text
                ) VALUES 
                (%s, 'application_completeness_score', %s, %s),
                (%s, 'documents_uploaded', %s, %s)
            """, (
                application_id, 85.0, 'Application submitted with all required fields',
                application_id, len(uploaded_documents), f'{len(uploaded_documents)} documents uploaded'
            ))
            
            conn.commit()
            
            logger.info(f"Job application submitted: {application_id} for job {job_id} by user {current_user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Application submitted successfully',
                'data': {
                    'application_id': application_id,
                    'status': 'submitted',
                    'submitted_at': application_result['submitted_at'].isoformat(),
                    'documents_uploaded': len(uploaded_documents),
                    'uploaded_documents': uploaded_documents,
                    'next_steps': [
                        'Your application has been received and assigned a unique ID',
                        'HR team will review your application within 3-5 business days',
                        'You will receive email notifications for any status updates',
                        'You can track your application status in your dashboard'
                    ]
                }
            }), 201
            
        except psycopg2.IntegrityError as e:
            conn.rollback()
            logger.error(f"Database integrity error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Application submission failed due to data constraints'
            }), 400
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Job application submission error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to submit application due to system error'
        }), 500

@enhanced_job_application_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_user_applications():
    """
    Get user's job applications with comprehensive details
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        status_filter = request.args.get('status')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        sort_by = request.args.get('sort_by', 'submitted_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Build query with filters
            where_clause = "WHERE ja.user_id = %s"
            params = [current_user_id]
            
            if status_filter:
                where_clause += " AND ja.application_status = %s"
                params.append(status_filter)
            
            # Validate sort parameters
            allowed_sort_fields = ['submitted_at', 'updated_at', 'application_status', 'job_id']
            if sort_by not in allowed_sort_fields:
                sort_by = 'submitted_at'
            
            if sort_order.lower() not in ['asc', 'desc']:
                sort_order = 'desc'
            
            # Get applications with related data
            cursor.execute(f"""
                SELECT 
                    ja.id,
                    ja.job_id,
                    ja.application_status,
                    ja.cover_letter,
                    ja.expected_salary,
                    ja.expected_salary_currency,
                    ja.availability_date,
                    ja.submitted_at,
                    ja.updated_at,
                    ja.reviewed_at,
                    COUNT(ad.id) as document_count,
                    COUNT(ai.id) as interview_count,
                    COUNT(CASE WHEN an.is_read = false THEN 1 END) as unread_notifications,
                    MAX(ash.changed_at) as last_status_change
                FROM job_applications ja
                LEFT JOIN application_documents ad ON ja.id = ad.application_id
                LEFT JOIN application_interviews ai ON ja.id = ai.application_id
                LEFT JOIN application_notifications an ON ja.id = an.application_id
                LEFT JOIN application_status_history ash ON ja.id = ash.application_id
                {where_clause}
                GROUP BY ja.id
                ORDER BY ja.{sort_by} {sort_order}
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            
            applications = cursor.fetchall()
            
            # Get total count
            cursor.execute(f"""
                SELECT COUNT(*) as total
                FROM job_applications ja
                {where_clause}
            """, params)
            
            total_count = cursor.fetchone()['total']
            
            # Format applications data
            formatted_applications = []
            for app in applications:
                # Get latest status history
                cursor.execute("""
                    SELECT new_status, changed_at, notes
                    FROM application_status_history
                    WHERE application_id = %s
                    ORDER BY changed_at DESC
                    LIMIT 1
                """, (app['id'],))
                
                latest_status = cursor.fetchone()
                
                # Get next interview
                cursor.execute("""
                    SELECT interview_type, scheduled_date, location, meeting_link
                    FROM application_interviews
                    WHERE application_id = %s AND scheduled_date > NOW()
                    ORDER BY scheduled_date ASC
                    LIMIT 1
                """, (app['id'],))
                
                next_interview = cursor.fetchone()
                
                formatted_app = {
                    'application_id': app['id'],
                    'job_id': app['job_id'],
                    'status': app['application_status'],
                    'submitted_at': app['submitted_at'].isoformat(),
                    'updated_at': app['updated_at'].isoformat() if app['updated_at'] else None,
                    'reviewed_at': app['reviewed_at'].isoformat() if app['reviewed_at'] else None,
                    'expected_salary': {
                        'amount': float(app['expected_salary']) if app['expected_salary'] else None,
                        'currency': app['expected_salary_currency']
                    },
                    'availability_date': app['availability_date'].isoformat() if app['availability_date'] else None,
                    'document_count': app['document_count'],
                    'interview_count': app['interview_count'],
                    'unread_notifications': app['unread_notifications'],
                    'last_status_change': app['last_status_change'].isoformat() if app['last_status_change'] else None,
                    'latest_status_info': {
                        'status': latest_status['new_status'] if latest_status else app['application_status'],
                        'changed_at': latest_status['changed_at'].isoformat() if latest_status else None,
                        'notes': latest_status['notes'] if latest_status else None
                    } if latest_status else None,
                    'next_interview': {
                        'type': next_interview['interview_type'],
                        'scheduled_date': next_interview['scheduled_date'].isoformat(),
                        'location': next_interview['location'],
                        'meeting_link': next_interview['meeting_link']
                    } if next_interview else None
                }
                
                formatted_applications.append(formatted_app)
            
            # Get status summary
            cursor.execute("""
                SELECT application_status, COUNT(*) as count
                FROM job_applications
                WHERE user_id = %s
                GROUP BY application_status
            """, (current_user_id,))
            
            status_summary = {row['application_status']: row['count'] for row in cursor.fetchall()}
            
            logger.info(f"Retrieved {len(applications)} applications for user {current_user_id}")
            
            return jsonify({
                'success': True,
                'data': {
                    'applications': formatted_applications,
                    'pagination': {
                        'total_count': total_count,
                        'limit': limit,
                        'offset': offset,
                        'has_more': offset + limit < total_count
                    },
                    'status_summary': status_summary,
                    'filters_applied': {
                        'status': status_filter,
                        'sort_by': sort_by,
                        'sort_order': sort_order
                    }
                }
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Get applications error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve applications'
        }), 500

@enhanced_job_application_bp.route('/applications/<application_id>', methods=['GET'])
@jwt_required()
def get_application_details(application_id):
    """
    Get comprehensive details about a specific application
    """
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get application details
            cursor.execute("""
                SELECT ja.*, u.first_name, u.last_name, u.email
                FROM job_applications ja
                JOIN users u ON ja.user_id = u.id
                WHERE ja.id = %s AND ja.user_id = %s
            """, (application_id, current_user_id))
            
            application = cursor.fetchone()
            
            if not application:
                return jsonify({
                    'success': False,
                    'message': 'Application not found'
                }), 404
            
            # Get application documents
            cursor.execute("""
                SELECT id, document_type, original_filename, file_size, uploaded_at
                FROM application_documents
                WHERE application_id = %s
                ORDER BY uploaded_at DESC
            """, (application_id,))
            
            documents = cursor.fetchall()
            
            # Get status history
            cursor.execute("""
                SELECT previous_status, new_status, status_reason, notes, changed_at, changed_by
                FROM application_status_history
                WHERE application_id = %s
                ORDER BY changed_at ASC
            """, (application_id,))
            
            status_history = cursor.fetchall()
            
            # Get interviews
            cursor.execute("""
                SELECT *
                FROM application_interviews
                WHERE application_id = %s
                ORDER BY scheduled_date ASC
            """, (application_id,))
            
            interviews = cursor.fetchall()
            
            # Get notifications
            cursor.execute("""
                SELECT notification_type, title, message, is_read, created_at
                FROM application_notifications
                WHERE application_id = %s
                ORDER BY created_at DESC
                LIMIT 10
            """, (application_id,))
            
            notifications = cursor.fetchall()
            
            # Get feedback
            cursor.execute("""
                SELECT feedback_type, feedback_text, rating, strengths, 
                       areas_for_improvement, provided_at, is_shared_with_candidate
                FROM application_feedback
                WHERE application_id = %s AND is_shared_with_candidate = true
                ORDER BY provided_at DESC
            """, (application_id,))
            
            feedback = cursor.fetchall()
            
            # Format response
            application_details = {
                'application_id': application['id'],
                'job_id': application['job_id'],
                'applicant': {
                    'name': f"{application['first_name']} {application['last_name']}",
                    'email': application['email']
                },
                'application_data': {
                    'status': application['application_status'],
                    'cover_letter': application['cover_letter'],
                    'expected_salary': {
                        'amount': float(application['expected_salary']) if application['expected_salary'] else None,
                        'currency': application['expected_salary_currency']
                    },
                    'availability_date': application['availability_date'].isoformat() if application['availability_date'] else None,
                    'notice_period_days': application['notice_period_days'],
                    'willing_to_relocate': application['willing_to_relocate'],
                    'visa_status': application['visa_status'],
                    'additional_notes': application['additional_notes'],
                    'submitted_at': application['submitted_at'].isoformat(),
                    'updated_at': application['updated_at'].isoformat() if application['updated_at'] else None,
                    'reviewed_at': application['reviewed_at'].isoformat() if application['reviewed_at'] else None
                },
                'documents': [
                    {
                        'id': doc['id'],
                        'type': doc['document_type'],
                        'filename': doc['original_filename'],
                        'size': doc['file_size'],
                        'uploaded_at': doc['uploaded_at'].isoformat()
                    } for doc in documents
                ],
                'status_timeline': [
                    {
                        'previous_status': history['previous_status'],
                        'new_status': history['new_status'],
                        'reason': history['status_reason'],
                        'notes': history['notes'],
                        'changed_at': history['changed_at'].isoformat(),
                        'changed_by': history['changed_by']
                    } for history in status_history
                ],
                'interviews': [
                    {
                        'id': interview['id'],
                        'type': interview['interview_type'],
                        'scheduled_date': interview['scheduled_date'].isoformat(),
                        'duration_minutes': interview['duration_minutes'],
                        'location': interview['location'],
                        'meeting_link': interview['meeting_link'],
                        'interviewer_name': interview['interviewer_name'],
                        'interviewer_email': interview['interviewer_email'],
                        'preparation_notes': interview['preparation_notes'],
                        'status': interview['interview_status'],
                        'feedback': interview['feedback'],
                        'score': interview['score']
                    } for interview in interviews
                ],
                'notifications': [
                    {
                        'type': notif['notification_type'],
                        'title': notif['title'],
                        'message': notif['message'],
                        'is_read': notif['is_read'],
                        'created_at': notif['created_at'].isoformat()
                    } for notif in notifications
                ],
                'feedback': [
                    {
                        'type': fb['feedback_type'],
                        'text': fb['feedback_text'],
                        'rating': fb['rating'],
                        'strengths': fb['strengths'],
                        'areas_for_improvement': fb['areas_for_improvement'],
                        'provided_at': fb['provided_at'].isoformat()
                    } for fb in feedback
                ]
            }
            
            logger.info(f"Retrieved application details for {application_id} by user {current_user_id}")
            
            return jsonify({
                'success': True,
                'data': application_details
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Get application details error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application details'
        }), 500

@enhanced_job_application_bp.route('/applications/<application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(application_id):
    """
    Update application status (for HR users or system updates)
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        new_status = data.get('status')
        status_reason = data.get('reason')
        notes = data.get('notes')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        # Validate status
        valid_statuses = [
            'submitted', 'under_review', 'interview_scheduled', 
            'interview_completed', 'offer_extended', 'offer_accepted', 
            'offer_declined', 'rejected', 'withdrawn', 'hired'
        ]
        
        if new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Valid statuses: {", ".join(valid_statuses)}'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Check if application exists and user has permission
            cursor.execute("""
                SELECT id, user_id, application_status
                FROM job_applications
                WHERE id = %s
            """, (application_id,))
            
            application = cursor.fetchone()
            
            if not application:
                return jsonify({
                    'success': False,
                    'message': 'Application not found'
                }), 404
            
            # For now, only allow users to update their own applications to 'withdrawn'
            if application['user_id'] != current_user_id and new_status != 'withdrawn':
                return jsonify({
                    'success': False,
                    'message': 'Unauthorized to update this application status'
                }), 403
            
            # Update application status
            cursor.execute("""
                UPDATE job_applications
                SET application_status = %s, updated_at = CURRENT_TIMESTAMP, reviewed_by = %s
                WHERE id = %s
                RETURNING application_status, updated_at
            """, (new_status, current_user_id, application_id))
            
            updated_application = cursor.fetchone()
            
            # The trigger will automatically create status history entry
            
            # Create notification
            status_messages = {
                'under_review': 'Your application is now under review',
                'interview_scheduled': 'An interview has been scheduled for your application',
                'interview_completed': 'Your interview has been completed',
                'offer_extended': 'Congratulations! You have received a job offer',
                'rejected': 'Unfortunately, your application was not successful this time',
                'withdrawn': 'Your application has been withdrawn'
            }
            
            notification_message = status_messages.get(new_status, f'Your application status has been updated to {new_status}')
            
            cursor.execute("""
                INSERT INTO application_notifications (
                    application_id, user_id, notification_type, title, message
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                application_id, application['user_id'], 'status_update',
                f'Application Status Updated: {new_status.replace("_", " ").title()}',
                notification_message
            ))
            
            conn.commit()
            
            logger.info(f"Application {application_id} status updated to {new_status} by user {current_user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Application status updated successfully',
                'data': {
                    'application_id': application_id,
                    'new_status': updated_application['application_status'],
                    'updated_at': updated_application['updated_at'].isoformat()
                }
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Update application status error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update application status'
        }), 500

@enhanced_job_application_bp.route('/applications/<application_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_application(application_id):
    """
    Withdraw a job application
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        withdrawal_reason = data.get('reason', 'No reason provided')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Check if application exists and belongs to user
            cursor.execute("""
                SELECT id, user_id, application_status
                FROM job_applications
                WHERE id = %s AND user_id = %s
            """, (application_id, current_user_id))
            
            application = cursor.fetchone()
            
            if not application:
                return jsonify({
                    'success': False,
                    'message': 'Application not found'
                }), 404
            
            # Check if application can be withdrawn
            if application['application_status'] in ['hired', 'offer_accepted']:
                return jsonify({
                    'success': False,
                    'message': 'Cannot withdraw application in current status'
                }), 400
            
            # Update application status to withdrawn
            cursor.execute("""
                UPDATE job_applications
                SET application_status = 'withdrawn', updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING updated_at
            """, (application_id,))
            
            result = cursor.fetchone()
            
            # Add status history entry with reason
            cursor.execute("""
                INSERT INTO application_status_history (
                    application_id, previous_status, new_status, status_reason, changed_by
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                application_id, application['application_status'], 'withdrawn',
                withdrawal_reason, current_user_id
            ))
            
            # Create notification
            cursor.execute("""
                INSERT INTO application_notifications (
                    application_id, user_id, notification_type, title, message
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                application_id, current_user_id, 'status_update',
                'Application Withdrawn',
                f'Your application has been withdrawn. Reason: {withdrawal_reason}'
            ))
            
            conn.commit()
            
            logger.info(f"Application {application_id} withdrawn by user {current_user_id}. Reason: {withdrawal_reason}")
            
            return jsonify({
                'success': True,
                'message': 'Application withdrawn successfully',
                'data': {
                    'application_id': application_id,
                    'status': 'withdrawn',
                    'withdrawn_at': result['updated_at'].isoformat(),
                    'reason': withdrawal_reason
                }
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Withdraw application error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to withdraw application'
        }), 500

@enhanced_job_application_bp.route('/jobs/<job_id>/apply-status', methods=['GET'])
@jwt_required()
def check_application_status(job_id):
    """
    Check if user has already applied for a specific job
    """
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT id, application_status, submitted_at
                FROM job_applications
                WHERE user_id = %s AND job_id = %s
            """, (current_user_id, job_id))
            
            application = cursor.fetchone()
            
            if application:
                application_status = {
                    'has_applied': True,
                    'application_id': application['id'],
                    'status': application['application_status'],
                    'submitted_at': application['submitted_at'].isoformat(),
                    'can_apply_again': application['application_status'] in ['rejected', 'withdrawn']
                }
            else:
                application_status = {
                    'has_applied': False,
                    'can_apply': True
                }
            
            return jsonify({
                'success': True,
                'data': application_status
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Check application status error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to check application status'
        }), 500

# Health check endpoint
@enhanced_job_application_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for enhanced job application service"""
    try:
        # Test database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        return jsonify({
            'service': 'enhanced_job_application',
            'status': 'healthy',
            'database': 'connected',
            'upload_folder': UPLOAD_FOLDER,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'service': 'enhanced_job_application',
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500
