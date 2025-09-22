"""
Job Management Routes for Emirati Journey Platform
Comprehensive job posting, management, and search functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.job import Job, JobStatus, EmploymentType, ExperienceLevel, JobPriority, JobLocation, SalaryRange, JobRequirement
from models.user_profile import UserProfile
from datetime import datetime, date
import logging
import json
import uuid

# Create blueprint
job_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')

# Initialize logger
logger = logging.getLogger(__name__)

# Mock database storage (to be replaced with actual database integration)
jobs_db = {}
job_search_index = {}

@job_bp.route('/create', methods=['POST'])
@jwt_required()
def create_job():
    """
    Create a new job posting
    Requires: Employer/HR/Admin role
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'company_id', 'employment_type', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create job ID
        job_id = str(uuid.uuid4())
        
        # Parse location data
        location_data = data.get('location', {})
        location = JobLocation(
            emirate=location_data.get('emirate', ''),
            city=location_data.get('city', ''),
            area=location_data.get('area'),
            is_remote=location_data.get('is_remote', False),
            is_hybrid=location_data.get('is_hybrid', False),
            remote_percentage=location_data.get('remote_percentage')
        )
        
        # Parse salary data
        salary_data = data.get('salary', {})
        salary = None
        if salary_data:
            salary = SalaryRange(
                min_salary=salary_data.get('min_salary'),
                max_salary=salary_data.get('max_salary'),
                currency=salary_data.get('currency', 'AED'),
                is_negotiable=salary_data.get('is_negotiable', True),
                includes_benefits=salary_data.get('includes_benefits', False)
            )
        
        # Parse requirements
        requirements = []
        for req_data in data.get('requirements', []):
            if isinstance(req_data, dict):
                requirements.append(JobRequirement(
                    requirement=req_data.get('requirement', ''),
                    is_mandatory=req_data.get('is_mandatory', True),
                    category=req_data.get('category', 'general')
                ))
            else:
                requirements.append(JobRequirement(requirement=str(req_data)))
        
        # Create job object
        job = Job(
            id=job_id,
            title=data.get('title'),
            description=data.get('description'),
            summary=data.get('summary', ''),
            company_id=data.get('company_id'),
            company_name=data.get('company_name', ''),
            department=data.get('department'),
            reporting_to=data.get('reporting_to'),
            employment_type=EmploymentType(data.get('employment_type')),
            experience_level=ExperienceLevel(data.get('experience_level', 'mid_level')),
            experience_years_min=data.get('experience_years_min'),
            experience_years_max=data.get('experience_years_max'),
            location=location,
            salary=salary,
            benefits=data.get('benefits', []),
            requirements=requirements,
            responsibilities=data.get('responsibilities', []),
            required_skills=data.get('required_skills', []),
            preferred_skills=data.get('preferred_skills', []),
            education_requirements=data.get('education_requirements', []),
            language_requirements=data.get('language_requirements', []),
            emiratization_priority=data.get('emiratization_priority', False),
            security_clearance_required=data.get('security_clearance_required', False),
            visa_sponsorship_available=data.get('visa_sponsorship_available', True),
            requires_uae_experience=data.get('requires_uae_experience', False),
            arabic_language_required=data.get('arabic_language_required', False),
            status=JobStatus.DRAFT,
            priority=JobPriority(data.get('priority', 'normal')),
            application_deadline=datetime.fromisoformat(data['application_deadline']) if data.get('application_deadline') else None,
            start_date=date.fromisoformat(data['start_date']) if data.get('start_date') else None,
            posted_by=current_user_id,
            industry=data.get('industry'),
            job_category=data.get('job_category'),
            tags=data.get('tags', [])
        )
        
        # Save to mock database
        jobs_db[job_id] = job
        
        # Update search index
        _update_search_index(job)
        
        logger.info(f"Job created successfully: {job_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Job created successfully',
            'data': {
                'job_id': job_id,
                'job': job.to_dict()
            }
        }), 201
        
    except ValueError as e:
        logger.error(f"Invalid enum value in job creation: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Invalid value provided: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create job'
        }), 500

@job_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    """
    Get job details by ID
    Public endpoint - increments view count
    """
    try:
        job = jobs_db.get(job_id)
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        # Increment view count
        job.increment_views()
        jobs_db[job_id] = job
        
        return jsonify({
            'success': True,
            'data': {
                'job': job.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving job {job_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job'
        }), 500

@job_bp.route('/<job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    """
    Update job details
    Requires: Job owner or company admin
    """
    try:
        current_user_id = get_jwt_identity()
        job = jobs_db.get(job_id)
        
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        # Check permissions (simplified - should check company membership)
        if job.posted_by != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to update this job'
            }), 403
        
        data = request.get_json()
        
        # Update job fields
        updatable_fields = [
            'title', 'description', 'summary', 'department', 'reporting_to',
            'experience_years_min', 'experience_years_max', 'benefits',
            'responsibilities', 'required_skills', 'preferred_skills',
            'education_requirements', 'language_requirements',
            'emiratization_priority', 'security_clearance_required',
            'visa_sponsorship_available', 'requires_uae_experience',
            'arabic_language_required', 'industry', 'job_category', 'tags'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(job, field, data[field])
        
        # Update enums
        if 'employment_type' in data:
            job.employment_type = EmploymentType(data['employment_type'])
        if 'experience_level' in data:
            job.experience_level = ExperienceLevel(data['experience_level'])
        if 'priority' in data:
            job.priority = JobPriority(data['priority'])
        
        # Update location
        if 'location' in data:
            location_data = data['location']
            job.location = JobLocation(
                emirate=location_data.get('emirate', job.location.emirate if job.location else ''),
                city=location_data.get('city', job.location.city if job.location else ''),
                area=location_data.get('area', job.location.area if job.location else None),
                is_remote=location_data.get('is_remote', job.location.is_remote if job.location else False),
                is_hybrid=location_data.get('is_hybrid', job.location.is_hybrid if job.location else False),
                remote_percentage=location_data.get('remote_percentage', job.location.remote_percentage if job.location else None)
            )
        
        # Update salary
        if 'salary' in data:
            salary_data = data['salary']
            job.salary = SalaryRange(
                min_salary=salary_data.get('min_salary'),
                max_salary=salary_data.get('max_salary'),
                currency=salary_data.get('currency', 'AED'),
                is_negotiable=salary_data.get('is_negotiable', True),
                includes_benefits=salary_data.get('includes_benefits', False)
            )
        
        # Update dates
        if 'application_deadline' in data and data['application_deadline']:
            job.application_deadline = datetime.fromisoformat(data['application_deadline'])
        if 'start_date' in data and data['start_date']:
            job.start_date = date.fromisoformat(data['start_date'])
        
        job.updated_at = datetime.utcnow()
        
        # Save to mock database
        jobs_db[job_id] = job
        
        # Update search index
        _update_search_index(job)
        
        logger.info(f"Job updated successfully: {job_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Job updated successfully',
            'data': {
                'job': job.to_dict()
            }
        }), 200
        
    except ValueError as e:
        logger.error(f"Invalid enum value in job update: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Invalid value provided: {str(e)}'
        }), 400
    except Exception as e:
        logger.error(f"Error updating job {job_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update job'
        }), 500

@job_bp.route('/<job_id>/publish', methods=['POST'])
@jwt_required()
def publish_job(job_id):
    """
    Publish a job (make it live)
    Requires: Job owner or company admin
    """
    try:
        current_user_id = get_jwt_identity()
        job = jobs_db.get(job_id)
        
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        # Check permissions
        if job.posted_by != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to publish this job'
            }), 403
        
        # Validate job is ready for publishing
        if not job.title or not job.description:
            return jsonify({
                'success': False,
                'message': 'Job must have title and description to be published'
            }), 400
        
        # Publish the job
        job.publish(current_user_id)
        jobs_db[job_id] = job
        
        # Update search index
        _update_search_index(job)
        
        logger.info(f"Job published successfully: {job_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Job published successfully',
            'data': {
                'job': job.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error publishing job {job_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to publish job'
        }), 500

@job_bp.route('/<job_id>/close', methods=['POST'])
@jwt_required()
def close_job(job_id):
    """
    Close a job (stop accepting applications)
    Requires: Job owner or company admin
    """
    try:
        current_user_id = get_jwt_identity()
        job = jobs_db.get(job_id)
        
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        # Check permissions
        if job.posted_by != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to close this job'
            }), 403
        
        data = request.get_json()
        reason = data.get('reason', 'Closed by employer')
        
        # Close the job
        job.close(current_user_id, reason)
        jobs_db[job_id] = job
        
        # Update search index
        _update_search_index(job)
        
        logger.info(f"Job closed successfully: {job_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Job closed successfully',
            'data': {
                'job': job.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error closing job {job_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to close job'
        }), 500

@job_bp.route('/search', methods=['GET'])
def search_jobs():
    """
    Search jobs with filters
    Public endpoint
    """
    try:
        # Get query parameters
        query = request.args.get('q', '')
        emirate = request.args.get('emirate')
        employment_type = request.args.get('employment_type')
        experience_level = request.args.get('experience_level')
        industry = request.args.get('industry')
        is_remote = request.args.get('is_remote')
        emiratization_priority = request.args.get('emiratization_priority')
        min_salary = request.args.get('min_salary', type=int)
        max_salary = request.args.get('max_salary', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Filter jobs
        filtered_jobs = []
        for job in jobs_db.values():
            # Only show published and active jobs
            if not job.is_active():
                continue
            
            # Apply filters
            if query and query.lower() not in job.title.lower() and query.lower() not in job.description.lower():
                continue
            
            if emirate and job.location and job.location.emirate != emirate:
                continue
            
            if employment_type and job.employment_type.value != employment_type:
                continue
            
            if experience_level and job.experience_level.value != experience_level:
                continue
            
            if industry and job.industry != industry:
                continue
            
            if is_remote and job.location:
                is_remote_bool = is_remote.lower() == 'true'
                if job.location.is_remote != is_remote_bool:
                    continue
            
            if emiratization_priority:
                emiratization_bool = emiratization_priority.lower() == 'true'
                if job.emiratization_priority != emiratization_bool:
                    continue
            
            if min_salary and job.salary and job.salary.min_salary:
                if job.salary.min_salary < min_salary:
                    continue
            
            if max_salary and job.salary and job.salary.max_salary:
                if job.salary.max_salary > max_salary:
                    continue
            
            filtered_jobs.append(job)
        
        # Sort by relevance (simplified - by creation date for now)
        filtered_jobs.sort(key=lambda x: x.created_at, reverse=True)
        
        # Pagination
        total = len(filtered_jobs)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_jobs = filtered_jobs[start:end]
        
        return jsonify({
            'success': True,
            'data': {
                'jobs': [job.to_dict() for job in paginated_jobs],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                },
                'filters_applied': {
                    'query': query,
                    'emirate': emirate,
                    'employment_type': employment_type,
                    'experience_level': experience_level,
                    'industry': industry,
                    'is_remote': is_remote,
                    'emiratization_priority': emiratization_priority,
                    'min_salary': min_salary,
                    'max_salary': max_salary
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching jobs: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to search jobs'
        }), 500

@job_bp.route('/company/<company_id>', methods=['GET'])
@jwt_required()
def get_company_jobs(company_id):
    """
    Get all jobs for a specific company
    Requires: Company member access
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Filter jobs by company
        company_jobs = [job for job in jobs_db.values() if job.company_id == company_id]
        
        # Sort by creation date
        company_jobs.sort(key=lambda x: x.created_at, reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'jobs': [job.to_dict() for job in company_jobs],
                'total': len(company_jobs)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving company jobs: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve company jobs'
        }), 500

@job_bp.route('/stats', methods=['GET'])
def get_job_stats():
    """
    Get platform job statistics
    Public endpoint
    """
    try:
        total_jobs = len(jobs_db)
        active_jobs = len([job for job in jobs_db.values() if job.is_active()])
        total_applications = sum(job.applications_count for job in jobs_db.values())
        
        # Group by emirate
        emirate_stats = {}
        for job in jobs_db.values():
            if job.location and job.is_active():
                emirate = job.location.emirate
                emirate_stats[emirate] = emirate_stats.get(emirate, 0) + 1
        
        # Group by industry
        industry_stats = {}
        for job in jobs_db.values():
            if job.industry and job.is_active():
                industry = job.industry
                industry_stats[industry] = industry_stats.get(industry, 0) + 1
        
        return jsonify({
            'success': True,
            'data': {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_applications': total_applications,
                'emirate_distribution': emirate_stats,
                'industry_distribution': industry_stats
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving job stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job statistics'
        }), 500

@job_bp.route('/<job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    """
    Delete a job
    Requires: Job owner or company admin
    """
    try:
        current_user_id = get_jwt_identity()
        job = jobs_db.get(job_id)
        
        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found'
            }), 404
        
        # Check permissions
        if job.posted_by != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to delete this job'
            }), 403
        
        # Remove from database
        del jobs_db[job_id]
        
        # Remove from search index
        if job_id in job_search_index:
            del job_search_index[job_id]
        
        logger.info(f"Job deleted successfully: {job_id} by user {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Job deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete job'
        }), 500

def _update_search_index(job):
    """Update search index for job (simplified implementation)"""
    search_text = f"{job.title} {job.description} {' '.join(job.required_skills)} {' '.join(job.tags)}"
    job_search_index[job.id] = {
        'text': search_text.lower(),
        'job_id': job.id,
        'updated_at': job.updated_at
    }

