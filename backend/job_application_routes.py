"""
Job Application Routes for Emirati Journey Platform
Implements the missing "Apply Now" functionality for Job Seeker persona
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
job_application_bp = Blueprint('job_application', __name__, url_prefix='/api/jobs')

@job_application_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_for_job():
    """
    Submit job application
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
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
        additional_documents = data.get('additional_documents', [])
        expected_salary = data.get('expected_salary')
        availability_date = data.get('availability_date')
        
        # Generate application ID
        application_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        
        # Create application record (simulated - in real implementation, save to database)
        application_data = {
            'application_id': application_id,
            'job_id': job_id,
            'candidate_id': current_user_id,
            'cover_letter': cover_letter,
            'additional_documents': additional_documents,
            'expected_salary': expected_salary,
            'availability_date': availability_date,
            'application_status': 'submitted',
            'submitted_at': datetime.utcnow().isoformat(),
            'last_updated': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Job application submitted: {application_id} for job {job_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'data': {
                'application_id': application_id,
                'status': 'submitted',
                'submitted_at': application_data['submitted_at'],
                'next_steps': [
                    'Your application has been received',
                    'HR team will review your application within 3-5 business days',
                    'You will be notified of the status via email and platform notifications'
                ]
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Job application error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to submit application due to system error'
        }), 500

@job_application_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_user_applications():
    """
    Get user's job applications
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Simulated application data (in real implementation, fetch from database)
        applications = [
            {
                'application_id': 'APP-12345678',
                'job_id': 'JOB-001',
                'job_title': 'Senior Software Engineer',
                'company': 'ADNOC Digital',
                'status': 'under_review',
                'submitted_at': '2024-09-15T10:30:00Z',
                'last_updated': '2024-09-18T14:20:00Z',
                'interview_scheduled': True,
                'interview_date': '2024-09-25T09:00:00Z',
                'interview_type': 'Technical Interview',
                'contact_person': 'Sarah Al Mansouri',
                'contact_email': 'sarah.almansouri@adnoc.ae'
            },
            {
                'application_id': 'APP-87654321',
                'job_id': 'JOB-002',
                'job_title': 'Data Analyst',
                'company': 'Emirates Technology',
                'status': 'submitted',
                'submitted_at': '2024-09-20T08:15:00Z',
                'last_updated': '2024-09-20T08:15:00Z',
                'interview_scheduled': False
            },
            {
                'application_id': 'APP-11223344',
                'job_id': 'JOB-003',
                'job_title': 'AI Engineer',
                'company': 'Dubai Future Foundation',
                'status': 'interview_completed',
                'submitted_at': '2024-09-10T16:45:00Z',
                'last_updated': '2024-09-19T11:30:00Z',
                'interview_scheduled': True,
                'interview_completed': True,
                'interview_feedback': 'Strong technical skills, good cultural fit',
                'next_steps': 'Waiting for final decision'
            },
            {
                'application_id': 'APP-55667788',
                'job_id': 'JOB-004',
                'job_title': 'Product Manager',
                'company': 'Careem',
                'status': 'offer_received',
                'submitted_at': '2024-09-05T12:00:00Z',
                'last_updated': '2024-09-20T09:00:00Z',
                'offer_details': {
                    'salary': 'AED 25,000/month',
                    'benefits': 'Health insurance, Annual bonus, Stock options',
                    'start_date': '2024-10-15',
                    'response_deadline': '2024-09-27'
                }
            },
            {
                'application_id': 'APP-99887766',
                'job_id': 'JOB-005',
                'job_title': 'DevOps Engineer',
                'company': 'Mashreq Bank',
                'status': 'rejected',
                'submitted_at': '2024-08-28T14:30:00Z',
                'last_updated': '2024-09-02T10:15:00Z',
                'rejection_reason': 'Position filled with another candidate',
                'feedback': 'Strong profile, encourage to apply for future openings'
            }
        ]
        
        # Filter applications by status if requested
        status_filter = request.args.get('status')
        if status_filter:
            applications = [app for app in applications if app['status'] == status_filter]
        
        logger.info(f"Retrieved {len(applications)} applications for user {current_user_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'applications': applications,
                'total_count': len(applications),
                'status_summary': {
                    'submitted': len([app for app in applications if app['status'] == 'submitted']),
                    'under_review': len([app for app in applications if app['status'] == 'under_review']),
                    'interview_scheduled': len([app for app in applications if app['status'] == 'interview_scheduled']),
                    'interview_completed': len([app for app in applications if app['status'] == 'interview_completed']),
                    'offer_received': len([app for app in applications if app['status'] == 'offer_received']),
                    'rejected': len([app for app in applications if app['status'] == 'rejected'])
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get applications error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve applications'
        }), 500

@job_application_bp.route('/applications/<application_id>', methods=['GET'])
@jwt_required()
def get_application_details(application_id):
    """
    Get detailed information about a specific application
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Simulated application details (in real implementation, fetch from database)
        application_details = {
            'application_id': application_id,
            'job_id': 'JOB-001',
            'job_details': {
                'title': 'Senior Software Engineer',
                'company': 'ADNOC Digital',
                'location': 'Abu Dhabi, UAE',
                'employment_type': 'Full-time',
                'salary_range': 'AED 20,000 - 30,000',
                'posted_date': '2024-09-10T00:00:00Z'
            },
            'application_details': {
                'status': 'under_review',
                'submitted_at': '2024-09-15T10:30:00Z',
                'last_updated': '2024-09-18T14:20:00Z',
                'cover_letter': 'I am excited to apply for the Senior Software Engineer position...',
                'expected_salary': 'AED 25,000',
                'availability_date': '2024-10-01'
            },
            'timeline': [
                {
                    'date': '2024-09-15T10:30:00Z',
                    'status': 'submitted',
                    'description': 'Application submitted successfully'
                },
                {
                    'date': '2024-09-16T09:15:00Z',
                    'status': 'acknowledged',
                    'description': 'Application received and acknowledged by HR team'
                },
                {
                    'date': '2024-09-18T14:20:00Z',
                    'status': 'under_review',
                    'description': 'Application is being reviewed by hiring manager'
                }
            ],
            'interview_info': {
                'scheduled': True,
                'date': '2024-09-25T09:00:00Z',
                'type': 'Technical Interview',
                'duration': 60,
                'location': 'ADNOC Digital Office, Abu Dhabi',
                'interviewer': 'Ahmed Al Mansouri',
                'contact_email': 'ahmed.almansouri@adnoc.ae',
                'preparation_notes': 'Please prepare to discuss your experience with React, Node.js, and cloud technologies'
            },
            'next_steps': [
                'Prepare for technical interview on September 25th',
                'Review job requirements and company information',
                'Prepare questions about the role and team'
            ]
        }
        
        logger.info(f"Retrieved application details for {application_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'data': application_details
        }), 200
        
    except Exception as e:
        logger.error(f"Get application details error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application details'
        }), 500

@job_application_bp.route('/applications/<application_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_application(application_id):
    """
    Withdraw a job application
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        withdrawal_reason = data.get('reason', 'No reason provided')
        
        # Update application status (simulated)
        logger.info(f"Application {application_id} withdrawn by user {current_user_id}. Reason: {withdrawal_reason}")
        
        return jsonify({
            'success': True,
            'message': 'Application withdrawn successfully',
            'data': {
                'application_id': application_id,
                'status': 'withdrawn',
                'withdrawn_at': datetime.utcnow().isoformat(),
                'reason': withdrawal_reason
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Withdraw application error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to withdraw application'
        }), 500

@job_application_bp.route('/jobs/<job_id>/apply-status', methods=['GET'])
@jwt_required()
def check_application_status(job_id):
    """
    Check if user has already applied for a specific job
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Simulated check (in real implementation, query database)
        has_applied = job_id in ['JOB-001', 'JOB-002', 'JOB-003', 'JOB-004', 'JOB-005']
        
        if has_applied:
            application_status = {
                'has_applied': True,
                'application_id': f'APP-{job_id[-3:]}12345',
                'status': 'under_review',
                'submitted_at': '2024-09-15T10:30:00Z'
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
        
    except Exception as e:
        logger.error(f"Check application status error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to check application status'
        }), 500

# Health check endpoint
@job_application_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for job application service"""
    return jsonify({
        'service': 'job_application',
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200
