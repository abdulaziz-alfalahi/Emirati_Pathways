"""
Application Tracking API Routes
Provides endpoints for comprehensive job application management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from application_tracking import enhanced_application_tracker, ApplicationStatus, InterviewType
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
application_tracking_bp = Blueprint('application_tracking', __name__, url_prefix='/api/applications')

@application_tracking_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_applications():
    """Get all applications for the current user"""
    try:
        user_id = get_jwt_identity()
        status_filter = request.args.get('status')
        
        logger.info(f"Getting applications for user {user_id}, status filter: {status_filter}")
        
        applications = enhanced_application_tracker.get_user_applications(user_id, status_filter)
        
        # Convert to JSON-serializable format
        applications_data = []
        for app in applications:
            applications_data.append({
                'id': app.id,
                'job_id': app.job_id,
                'job_title': app.job_title,
                'company_name': app.company_name,
                'status': app.status.value,
                'applied_date': app.applied_date.isoformat(),
                'last_updated': app.last_updated.isoformat(),
                'cover_letter': app.cover_letter,
                'resume_version': app.resume_version,
                'notes': app.notes,
                'timeline': app.timeline,
                'interviews': app.interviews,
                'documents': app.documents,
                'emiratization_status': app.emiratization_status
            })
        
        return jsonify({
            'success': True,
            'applications': applications_data,
            'total_count': len(applications_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user applications: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get applications',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/', methods=['POST'])
@jwt_required()
def create_application():
    """Create a new job application"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        job_id = data.get('job_id')
        if not job_id:
            return jsonify({
                'success': False,
                'error': 'job_id is required'
            }), 400
        
        logger.info(f"Creating application for user {user_id}, job {job_id}")
        
        application_id = enhanced_application_tracker.create_application(
            user_id=user_id,
            job_id=job_id,
            application_data=data
        )
        
        return jsonify({
            'success': True,
            'application_id': application_id,
            'message': 'Application created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating application: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create application',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/<application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status():
    """Update application status"""
    try:
        user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        new_status = data.get('status')
        notes = data.get('notes', '')
        
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'status is required'
            }), 400
        
        try:
            status_enum = ApplicationStatus(new_status)
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid status: {new_status}'
            }), 400
        
        logger.info(f"Updating application {application_id} status to {new_status}")
        
        success = enhanced_application_tracker.update_application_status(
            application_id, status_enum, notes
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Application status updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update application status'
            }), 404
        
    except Exception as e:
        logger.error(f"Error updating application status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to update application status',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/<application_id>/interviews', methods=['POST'])
@jwt_required()
def schedule_interview():
    """Schedule an interview for an application"""
    try:
        user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        required_fields = ['scheduled_date', 'type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Validate interview type
        try:
            InterviewType(data['type'])
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid interview type: {data["type"]}'
            }), 400
        
        logger.info(f"Scheduling interview for application {application_id}")
        
        interview_id = enhanced_application_tracker.schedule_interview(
            application_id, data
        )
        
        return jsonify({
            'success': True,
            'interview_id': interview_id,
            'message': 'Interview scheduled successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error scheduling interview: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to schedule interview',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_application_metrics():
    """Get application metrics for the current user"""
    try:
        user_id = get_jwt_identity()
        
        logger.info(f"Getting application metrics for user {user_id}")
        
        metrics = enhanced_application_tracker.get_application_metrics(user_id)
        
        return jsonify({
            'success': True,
            'metrics': {
                'total_applications': metrics.total_applications,
                'active_applications': metrics.active_applications,
                'interviews_scheduled': metrics.interviews_scheduled,
                'offers_received': metrics.offers_received,
                'success_rate': metrics.success_rate,
                'avg_response_time': metrics.avg_response_time,
                'top_industries': metrics.top_industries,
                'application_trends': metrics.application_trends
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting application metrics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get application metrics',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/interviews/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_interviews():
    """Get upcoming interviews for the current user"""
    try:
        user_id = get_jwt_identity()
        days_ahead = int(request.args.get('days', 7))
        
        logger.info(f"Getting upcoming interviews for user {user_id}")
        
        interviews = enhanced_application_tracker.get_upcoming_interviews(
            user_id, days_ahead
        )
        
        return jsonify({
            'success': True,
            'interviews': interviews,
            'total_count': len(interviews)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting upcoming interviews: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get upcoming interviews',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/<application_id>/notes', methods=['POST'])
@jwt_required()
def add_application_note():
    """Add a note to an application"""
    try:
        user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        note = data.get('note')
        if not note:
            return jsonify({
                'success': False,
                'error': 'note is required'
            }), 400
        
        logger.info(f"Adding note to application {application_id}")
        
        success = enhanced_application_tracker.add_application_note(
            application_id, note
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Note added successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to add note'
            }), 500
        
    except Exception as e:
        logger.error(f"Error adding application note: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to add note',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/<application_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_application():
    """Withdraw a job application"""
    try:
        user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        reason = data.get('reason', '')
        
        logger.info(f"Withdrawing application {application_id}")
        
        success = enhanced_application_tracker.withdraw_application(
            application_id, reason
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Application withdrawn successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to withdraw application'
            }), 500
        
    except Exception as e:
        logger.error(f"Error withdrawing application: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to withdraw application',
            'message': str(e)
        }), 500

@application_tracking_bp.route('/status-options', methods=['GET'])
def get_status_options():
    """Get available application status options"""
    return jsonify({
        'success': True,
        'status_options': [
            {'value': status.value, 'label': status.value.replace('_', ' ').title()}
            for status in ApplicationStatus
        ]
    }), 200

@application_tracking_bp.route('/interview-types', methods=['GET'])
def get_interview_types():
    """Get available interview type options"""
    return jsonify({
        'success': True,
        'interview_types': [
            {'value': interview_type.value, 'label': interview_type.value.replace('_', ' ').title()}
            for interview_type in InterviewType
        ]
    }), 200

# Health check endpoint
@application_tracking_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for application tracking service"""
    return jsonify({
        'success': True,
        'service': 'Application Tracking API',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200
