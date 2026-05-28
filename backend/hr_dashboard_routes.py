"""
HR Dashboard API Routes
Provides comprehensive HR dashboard and job management endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from hr_dashboard import hr_dashboard_engine, JobStatus, ApplicationStage
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
hr_dashboard_bp = Blueprint('hr_dashboard', __name__, url_prefix='/api/hr')

@hr_dashboard_bp.route('/dashboard/metrics', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    """Get comprehensive HR dashboard metrics"""
    try:
        hr_user_id = get_jwt_identity()
        company_id = request.args.get('company_id')
        
        logger.info(f"Getting HR dashboard metrics for user {hr_user_id}")
        
        metrics = hr_dashboard_engine.get_hr_dashboard_metrics(hr_user_id, company_id)
        
        return jsonify({
            'success': True,
            'metrics': {
                'overview': {
                    'total_jobs': metrics.total_jobs,
                    'active_jobs': metrics.active_jobs,
                    'total_applications': metrics.total_applications,
                    'new_applications': metrics.new_applications,
                    'interviews_scheduled': metrics.interviews_scheduled,
                    'offers_extended': metrics.offers_extended,
                    'positions_filled': metrics.positions_filled
                },
                'performance': {
                    'emiratization_rate': metrics.emiratization_rate,
                    'avg_time_to_hire': metrics.avg_time_to_hire,
                    'success_rate': round(
                        (metrics.positions_filled / metrics.total_applications * 100) 
                        if metrics.total_applications > 0 else 0, 1
                    )
                },
                'trends': {
                    'application_trends': metrics.application_trends,
                    'candidate_pipeline': metrics.candidate_pipeline
                },
                'top_jobs': metrics.top_performing_jobs
            },
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get dashboard metrics',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/jobs', methods=['GET'])
@jwt_required()
def get_job_postings():
    """Get job postings and educational opportunities for HR user"""
    try:
        hr_user_id = get_jwt_identity()
        company_id = request.args.get('company_id')
        status_filter = request.args.get('status')
        opportunity_type = request.args.get('opportunity_type')  # NEW: Filter by opportunity type
        
        logger.info(f"Getting opportunities for HR user {hr_user_id}")
        
        job_postings = hr_dashboard_engine.get_job_postings(
            hr_user_id, company_id, status_filter, opportunity_type
        )
        
        # Convert to JSON-serializable format
        jobs_data = []
        for job in job_postings:
            jobs_data.append({
                'id': job.id,
                'title': job.title,
                'department': job.department,
                'location': job.location,
                'job_type': job.job_type,
                'salary_range': job.salary_range,
                'status': job.status.value,
                'created_date': job.created_date.isoformat(),
                'application_deadline': job.application_deadline.isoformat() if job.application_deadline else None,
                'description': job.description,
                'requirements': job.requirements,
                'benefits': job.benefits,
                'emiratization_priority': job.emiratization_priority,
                'applications_count': job.applications_count,
                'views_count': job.views_count
            })
        
        return jsonify({
            'success': True,
            'jobs': jobs_data,
            'total_count': len(jobs_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job postings: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get job postings',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/jobs', methods=['POST'])
@jwt_required()
def create_job_posting():
    """Create a new job posting"""
    try:
        hr_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'department', 'location', 'description']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        logger.info(f"Creating job posting for HR user {hr_user_id}")
        
        job_id = hr_dashboard_engine.create_job_posting(hr_user_id, data)
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': 'Job posting created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating job posting: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create job posting',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/jobs/<job_id>/status', methods=['PUT'])
@jwt_required()
def update_job_status():
    """Update job posting status"""
    try:
        hr_user_id = get_jwt_identity()
        job_id = request.view_args['job_id']
        data = request.get_json()
        
        new_status = data.get('status')
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'status is required'
            }), 400
        
        try:
            status_enum = JobStatus(new_status)
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid status: {new_status}'
            }), 400
        
        logger.info(f"Updating job {job_id} status to {new_status}")
        
        success = hr_dashboard_engine.update_job_status(job_id, status_enum, hr_user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Job status updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update job status'
            }), 404
        
    except Exception as e:
        logger.error(f"Error updating job status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to update job status',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/jobs/<job_id>/applications', methods=['GET'])
@jwt_required()
def get_job_applications():
    """Get applications for a specific job"""
    try:
        hr_user_id = get_jwt_identity()
        job_id = request.view_args['job_id']
        stage_filter = request.args.get('stage')
        
        logger.info(f"Getting applications for job {job_id}")
        
        applications = hr_dashboard_engine.get_applications_for_job(job_id, stage_filter)
        
        return jsonify({
            'success': True,
            'applications': applications,
            'total_count': len(applications)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job applications: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get job applications',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/applications/<application_id>/shortlist', methods=['POST'])
@jwt_required()
def shortlist_candidate():
    """Shortlist a candidate application"""
    try:
        hr_user_id = get_jwt_identity()
        application_id = request.view_args['application_id']
        data = request.get_json()
        
        notes = data.get('notes', '')
        
        logger.info(f"Shortlisting application {application_id}")
        
        success = hr_dashboard_engine.shortlist_candidate(application_id, hr_user_id, notes)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Candidate shortlisted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to shortlist candidate'
            }), 500
        
    except Exception as e:
        logger.error(f"Error shortlisting candidate: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to shortlist candidate',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/insights/ai', methods=['GET'])
@jwt_required()
def get_ai_recruitment_insights():
    """Get AI-powered recruitment insights"""
    try:
        hr_user_id = get_jwt_identity()
        company_id = request.args.get('company_id')
        
        logger.info(f"Getting AI recruitment insights for HR user {hr_user_id}")
        
        insights = hr_dashboard_engine.get_ai_recruitment_insights(company_id)
        
        return jsonify({
            'success': True,
            'insights': insights,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting AI recruitment insights: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get AI recruitment insights',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/candidates/search', methods=['POST'])
@jwt_required()
def search_candidates():
    """Search and discover candidates"""
    try:
        hr_user_id = get_jwt_identity()
        data = request.get_json()
        
        # This would implement advanced candidate search
        # For now, return a placeholder response
        search_results = {
            'candidates': [
                {
                    'id': 'candidate_1',
                    'name': 'Ahmed Al-Mansouri',
                    'title': 'Senior Software Engineer',
                    'location': 'Dubai, UAE',
                    'experience_years': 5,
                    'skills': ['Python', 'React', 'AWS'],
                    'match_score': 95,
                    'emiratization_eligible': True,
                    'availability': 'Available'
                },
                {
                    'id': 'candidate_2',
                    'name': 'Fatima Al-Zahra',
                    'title': 'Data Scientist',
                    'location': 'Abu Dhabi, UAE',
                    'experience_years': 3,
                    'skills': ['Machine Learning', 'Python', 'SQL'],
                    'match_score': 88,
                    'emiratization_eligible': True,
                    'availability': 'Available'
                }
            ],
            'total_count': 2,
            'search_criteria': data
        }
        
        return jsonify({
            'success': True,
            'results': search_results
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching candidates: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to search candidates',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/templates/job-descriptions', methods=['GET'])
@jwt_required()
def get_job_description_templates():
    """Get job description templates"""
    try:
        templates = [
            {
                'id': 'software_engineer',
                'title': 'Software Engineer',
                'category': 'Technology',
                'description': 'Template for software engineering positions',
                'template': {
                    'title': 'Software Engineer',
                    'department': 'Technology',
                    'requirements': [
                        'Bachelor\'s degree in Computer Science or related field',
                        '3+ years of software development experience',
                        'Proficiency in modern programming languages',
                        'Experience with cloud platforms'
                    ],
                    'responsibilities': [
                        'Design and develop software applications',
                        'Collaborate with cross-functional teams',
                        'Write clean, maintainable code',
                        'Participate in code reviews'
                    ]
                }
            },
            {
                'id': 'data_scientist',
                'title': 'Data Scientist',
                'category': 'Analytics',
                'description': 'Template for data science positions',
                'template': {
                    'title': 'Data Scientist',
                    'department': 'Analytics',
                    'requirements': [
                        'Master\'s degree in Data Science, Statistics, or related field',
                        '2+ years of data science experience',
                        'Proficiency in Python/R and SQL',
                        'Experience with machine learning frameworks'
                    ],
                    'responsibilities': [
                        'Analyze complex datasets to extract insights',
                        'Build predictive models and algorithms',
                        'Present findings to stakeholders',
                        'Collaborate with engineering teams'
                    ]
                }
            }
        ]
        
        return jsonify({
            'success': True,
            'templates': templates
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job description templates: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get job description templates',
            'message': str(e)
        }), 500

@hr_dashboard_bp.route('/status-options', methods=['GET'])
def get_job_status_options():
    """Get available job status options"""
    return jsonify({
        'success': True,
        'job_statuses': [
            {'value': status.value, 'label': status.value.replace('_', ' ').title()}
            for status in JobStatus
        ],
        'application_stages': [
            {'value': stage.value, 'label': stage.value.replace('_', ' ').title()}
            for stage in ApplicationStage
        ]
    }), 200

# Health check endpoint
@hr_dashboard_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for HR dashboard service"""
    return jsonify({
        'success': True,
        'service': 'HR Dashboard API',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ai_engine': 'AI Engine',
        'version': '1.0.0'
    }), 200
