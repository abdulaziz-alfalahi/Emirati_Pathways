"""
Application Management Routes for Emirati Journey Platform
Comprehensive job application tracking and management functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.application import Application, ApplicationStatus, InterviewType, ApplicationSource, InterviewDetails, OfferDetails
from models.job import Job
from datetime import datetime, date
import logging
import uuid

# Create blueprint
application_bp = Blueprint('applications', __name__, url_prefix='/api/applications')

# Initialize logger
logger = logging.getLogger(__name__)

# Mock database storage (to be replaced with actual database integration)
applications_db = {}
# Reference to jobs database (would be imported from job_routes in real implementation)
from routes.job_routes import jobs_db

@application_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_to_job():
    """
    Submit a job application
    Requires: Candidate role
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['job_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        job_id = data.get('job_id')
        
        # Check if job exists and is active
        job = jobs_db.get(job_id)
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        if not job.is_active():
            return jsonify({
                'success': False,
                'message': 'Job is no longer accepting applications'
            }), 400
        
        # Check if user already applied
        existing_application = None
        for app in applications_db.values():
            if app.job_id == job_id and app.candidate_id == current_user_id:
                existing_application = app
                break
        
        if existing_application:
            return jsonify({
                'success': False,
                'message': 'You have already applied to this job'
            }), 400
        
        # Create application ID
        application_id = str(uuid.uuid4())
        
        # Create application object
        application = Application(
            id=application_id,
            job_id=job_id,
            candidate_id=current_user_id,
            cover_letter=data.get('cover_letter'),
            expected_salary=data.get('expected_salary'),
            salary_currency=data.get('salary_currency', 'AED'),
            available_from=date.fromisoformat(data['available_from']) if data.get('available_from') else None,
            notice_period=data.get('notice_period'),
            source=ApplicationSource(data.get('source', 'direct')),
            referral_source=data.get('referral_source'),
            referrer_id=data.get('referrer_id'),
            candidate_notes=data.get('candidate_notes')
        )
        
        # Save to mock database
        applications_db[application_id] = application
        
        # Update job application count
        job.increment_applications()
        jobs_db[job_id] = job
        
        logger.info(f"Application submitted successfully: {application_id} for job {job_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'data': {
                'application_id': application_id,
                'application': application.to_dict()
            }
        }), 201
        
    except ValueError as e:
        logger.error(f"Invalid enum value in application: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Invalid value provided: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f"Error submitting application: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to submit application'
        }), 500

@application_bp.route('/<application_id>', methods=['GET'])
@jwt_required()
def get_application(application_id):
    """
    Get application details by ID
    Requires: Application owner or company member
    """
    try:
        current_user_id = get_jwt_identity()
        application = applications_db.get(application_id)
        
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
        # Check permissions (simplified - should check company membership for recruiters)
        if application.candidate_id != current_user_id:
            # TODO: Add company membership check for recruiters/HR
            pass
        
        return jsonify({
            'success': True,
            'data': {
                'application': application.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving application {application_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application'
        }), 500

@application_bp.route('/<application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status():
    """
    Update application status
    Requires: Company member (HR/Recruiter)
    """
    try:
        current_user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        application = applications_db.get(application_id)
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
        # Validate required fields
        if not data.get('status'):
            return jsonify({
                'success': False,
                'message': 'Missing required field: status'
            }), 400
        
        new_status = ApplicationStatus(data.get('status'))
        notes = data.get('notes')
        reason = data.get('reason')
        
        # Update application status
        application.update_status(new_status, current_user_id, notes, reason)
        
        # Handle specific status updates
        if new_status == ApplicationStatus.REJECTED:
            application.rejection_reason = reason or data.get('rejection_reason', 'Not specified')
        
        # Update recruiter notes if provided
        if data.get('recruiter_notes'):
            application.recruiter_notes = data.get('recruiter_notes')
        
        # Update rating if provided
        if data.get('recruiter_rating'):
            application.recruiter_rating = data.get('recruiter_rating')
        
        # Save to mock database
        applications_db[application_id] = application
        
        logger.info(f"Application status updated: {application_id} to {new_status.value} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Application status updated successfully',
            'data': {
                'application': application.to_dict()
            }
        }), 200
        
    except ValueError as e:
        logger.error(f"Invalid status value: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Invalid status value: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f"Error updating application status: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update application status'
        }), 500

@application_bp.route('/<application_id>/interview', methods=['POST'])
@jwt_required()
def schedule_interview():
    """
    Schedule an interview for an application
    Requires: Company member (HR/Recruiter)
    """
    try:
        current_user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        application = applications_db.get(application_id)
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
        # Validate required fields
        required_fields = ['interview_type', 'scheduled_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create interview details
        interview = InterviewDetails(
            interview_type=InterviewType(data.get('interview_type')),
            scheduled_date=datetime.fromisoformat(data.get('scheduled_date')),
            duration_minutes=data.get('duration_minutes', 60),
            location=data.get('location'),
            meeting_link=data.get('meeting_link'),
            interviewer_name=data.get('interviewer_name'),
            interviewer_email=data.get('interviewer_email'),
            notes=data.get('notes')
        )
        
        # Schedule the interview
        application.schedule_interview(interview)
        
        # Save to mock database
        applications_db[application_id] = application
        
        logger.info(f"Interview scheduled for application {application_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Interview scheduled successfully',
            'data': {
                'application': application.to_dict()
            }
        }), 200
        
    except ValueError as e:
        logger.error(f"Invalid interview data: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Invalid interview data: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f"Error scheduling interview: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to schedule interview'
        }), 500

@application_bp.route('/<application_id>/interview/<int:interview_index>/complete', methods=['POST'])
@jwt_required()
def complete_interview():
    """
    Mark interview as completed with feedback
    Requires: Company member (HR/Recruiter)
    """
    try:
        current_user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        interview_index = request.view_args['interview_index']
        data = request.get_json()
        
        application = applications_db.get(application_id)
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
        # Validate interview index
        if interview_index >= len(application.interviews):
            return jsonify({
                'success': False,
                'message': 'Interview not found'
            }), 404
        
        # Validate required fields
        required_fields = ['feedback', 'rating']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        feedback = data.get('feedback')
        rating = data.get('rating')
        
        # Validate rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({
                'success': False,
                'message': 'Rating must be an integer between 1 and 5'
            }), 400
        
        # Complete the interview
        application.complete_interview(interview_index, feedback, rating)
        
        # Save to mock database
        applications_db[application_id] = application
        
        logger.info(f"Interview completed for application {application_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Interview completed successfully',
            'data': {
                'application': application.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error completing interview: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to complete interview'
        }), 500

@application_bp.route('/<application_id>/offer', methods=['POST'])
@jwt_required()
def make_offer():
    """
    Make a job offer to candidate
    Requires: Company member (HR/Manager)
    """
    try:
        current_user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        application = applications_db.get(application_id)
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
        # Validate required fields
        required_fields = ['salary_offered']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create offer details
        offer = OfferDetails(
            salary_offered=data.get('salary_offered'),
            currency=data.get('currency', 'AED'),
            benefits=data.get('benefits', []),
            start_date=date.fromisoformat(data['start_date']) if data.get('start_date') else None,
            offer_expiry_date=date.fromisoformat(data['offer_expiry_date']) if data.get('offer_expiry_date') else None,
            contract_type=data.get('contract_type', 'permanent'),
            probation_period_months=data.get('probation_period_months'),
            notice_period=data.get('notice_period'),
            additional_terms=data.get('additional_terms')
        )
        
        # Make the offer
        application.make_offer(offer, current_user_id)
        
        # Save to mock database
        applications_db[application_id] = application
        
        logger.info(f"Offer made for application {application_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Offer made successfully',
            'data': {
                'application': application.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error making offer: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to make offer'
        }), 500

@application_bp.route('/<application_id>/offer/respond', methods=['POST'])
@jwt_required()
def respond_to_offer():
    """
    Respond to job offer (accept/decline)
    Requires: Application owner (candidate)
    """
    try:
        current_user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        application = applications_db.get(application_id)
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
        # Check permissions
        if application.candidate_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to respond to this offer'
            }), 403
        
        # Validate required fields
        if 'accepted' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing required field: accepted'
            }), 400
        
        accepted = data.get('accepted')
        notes = data.get('notes')
        
        # Respond to offer
        application.respond_to_offer(accepted, current_user_id, notes)
        
        # Save to mock database
        applications_db[application_id] = application
        
        action = "accepted" if accepted else "declined"
        logger.info(f"Offer {action} for application {application_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': f'Offer {action} successfully',
            'data': {
                'application': application.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error responding to offer: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to respond to offer'
        }), 500

@application_bp.route('/candidate/<candidate_id>', methods=['GET'])
@jwt_required()
def get_candidate_applications(candidate_id):
    """
    Get all applications by a candidate
    Requires: Application owner or admin
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check permissions (simplified)
        if candidate_id != current_user_id:
            # TODO: Add admin check
            pass
        
        # Filter applications by candidate
        candidate_applications = [app for app in applications_db.values() if app.candidate_id == candidate_id]
        
        # Sort by creation date
        candidate_applications.sort(key=lambda x: x.created_at, reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'applications': [app.to_dict() for app in candidate_applications],
                'total': len(candidate_applications)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving candidate applications: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve candidate applications'
        }), 500

@application_bp.route('/job/<job_id>', methods=['GET'])
@jwt_required()
def get_job_applications(job_id):
    """
    Get all applications for a specific job
    Requires: Company member
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check if job exists
        job = jobs_db.get(job_id)
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        # TODO: Check if user has access to this job's company
        
        # Filter applications by job
        job_applications = [app for app in applications_db.values() if app.job_id == job_id]
        
        # Sort by creation date
        job_applications.sort(key=lambda x: x.created_at, reverse=True)
        
        # Get status statistics
        status_stats = {}
        for app in job_applications:
            status = app.status.value
            status_stats[status] = status_stats.get(status, 0) + 1
        
        return jsonify({
            'success': True,
            'data': {
                'applications': [app.to_dict() for app in job_applications],
                'total': len(job_applications),
                'status_statistics': status_stats
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving job applications: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job applications'
        }), 500

@application_bp.route('/<application_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_application():
    """
    Withdraw an application
    Requires: Application owner (candidate)
    """
    try:
        current_user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        application = applications_db.get(application_id)
        if not application:
            return jsonify({
                'success': False,
                'message': 'Application not found'
            }), 404
        
        # Check permissions
        if application.candidate_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to withdraw this application'
            }), 403
        
        reason = data.get('reason', 'Withdrawn by candidate')
        
        # Withdraw the application
        application.withdraw(current_user_id, reason)
        
        # Save to mock database
        applications_db[application_id] = application
        
        logger.info(f"Application withdrawn: {application_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Application withdrawn successfully',
            'data': {
                'application': application.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error withdrawing application: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to withdraw application'
        }), 500

@application_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_application_stats():
    """
    Get application statistics
    Requires: Admin or company member
    """
    try:
        current_user_id = get_jwt_identity()
        
        total_applications = len(applications_db)
        
        # Status distribution
        status_stats = {}
        for app in applications_db.values():
            status = app.status.value
            status_stats[status] = status_stats.get(status, 0) + 1
        
        # Source distribution
        source_stats = {}
        for app in applications_db.values():
            source = app.source.value
            source_stats[source] = source_stats.get(source, 0) + 1
        
        # Average match scores
        match_scores = [app.match_score for app in applications_db.values() if app.match_score is not None]
        avg_match_score = sum(match_scores) / len(match_scores) if match_scores else 0
        
        return jsonify({
            'success': True,
            'data': {
                'total_applications': total_applications,
                'status_distribution': status_stats,
                'source_distribution': source_stats,
                'average_match_score': round(avg_match_score, 2)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving application stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application statistics'
        }), 500

