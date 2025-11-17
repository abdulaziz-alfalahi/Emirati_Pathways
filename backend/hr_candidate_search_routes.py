"""
HR/Recruiter Candidate Search and Filtering Routes
Emirati Journey Platform - Advanced Candidate Search and Filtering System
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime, timedelta
import uuid
import os
import json
import re
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
hr_candidate_search_bp = Blueprint('hr_candidate_search', __name__, url_prefix='/api/hr/candidates')

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

class CandidateSearchEngine:
    """Advanced candidate search and filtering engine"""
    
    @staticmethod
    def build_search_query(filters: Dict[str, Any]) -> tuple:
        """Build SQL query based on search filters"""
        
        base_query = """
            SELECT DISTINCT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.emirate,
                u.nationality,
                u.education_level,
                u.experience_years,
                u.preferred_salary_min,
                u.preferred_salary_max,
                u.preferred_location,
                u.is_uae_national,
                u.skills,
                u.created_at as registered_at,
                u.last_login,
                COUNT(DISTINCT ja.id) as total_applications,
                MAX(ja.submitted_at) as last_application_date,
                CASE 
                    WHEN u.last_login > NOW() - INTERVAL '7 days' THEN 'active'
                    WHEN u.last_login > NOW() - INTERVAL '30 days' THEN 'recent'
                    ELSE 'inactive'
                END as activity_status
            FROM users u
            LEFT JOIN job_applications ja ON u.id = ja.user_id
        """
        
        where_conditions = ["u.role = 'candidate'"]
        params = []
        joins = []
        
        # Text search in skills only (more relevant for candidate search)
        # Searching in names/emails is too restrictive and returns no results
        if filters.get('search'):
            search_term = f"%{filters['search']}%"
            where_conditions.append(
                "array_to_string(u.skills, ' ') ILIKE %s"
            )
            params.append(search_term)
        
        # Location filters
        if filters.get('emirate'):
            if isinstance(filters['emirate'], list):
                placeholders = ','.join(['%s'] * len(filters['emirate']))
                where_conditions.append(f"u.emirate = ANY(ARRAY[{placeholders}])")
                params.extend(filters['emirate'])
            else:
                where_conditions.append("u.emirate = %s")
                params.append(filters['emirate'])
        
        if filters.get('preferred_location'):
            # Search in both preferred_location and emirate, or allow null (candidate open to any location)
            where_conditions.append(
                "(u.preferred_location ILIKE %s OR u.emirate ILIKE %s OR u.preferred_location IS NULL)"
            )
            location_param = f"%{filters['preferred_location']}%"
            params.extend([location_param, location_param])
        
        # Nationality filters
        if filters.get('nationality'):
            if isinstance(filters['nationality'], list):
                placeholders = ','.join(['%s'] * len(filters['nationality']))
                where_conditions.append(f"u.nationality = ANY(ARRAY[{placeholders}])")
                params.extend(filters['nationality'])
            else:
                where_conditions.append("u.nationality = %s")
                params.append(filters['nationality'])
        
        if filters.get('is_uae_national') is not None:
            where_conditions.append("u.is_uae_national = %s")
            params.append(filters['is_uae_national'])
        
        # Experience filters
        if filters.get('min_experience'):
            where_conditions.append("u.experience_years >= %s")
            params.append(filters['min_experience'])
        
        if filters.get('max_experience'):
            where_conditions.append("u.experience_years <= %s")
            params.append(filters['max_experience'])
        
        # Education filters
        if filters.get('education_level'):
            if isinstance(filters['education_level'], list):
                placeholders = ','.join(['%s'] * len(filters['education_level']))
                where_conditions.append(f"u.education_level = ANY(ARRAY[{placeholders}])")
                params.extend(filters['education_level'])
            else:
                where_conditions.append("u.education_level = %s")
                params.append(filters['education_level'])
        
        # Salary expectations
        if filters.get('max_salary_expectation'):
            where_conditions.append("(u.preferred_salary_min <= %s OR u.preferred_salary_min IS NULL)")
            params.append(filters['max_salary_expectation'])
        
        if filters.get('min_salary_expectation'):
            where_conditions.append("(u.preferred_salary_max >= %s OR u.preferred_salary_max IS NULL)")
            params.append(filters['min_salary_expectation'])
        
        # Skills filter
        if filters.get('skills'):
            skills = filters['skills'] if isinstance(filters['skills'], list) else [filters['skills']]
            skill_conditions = []
            for skill in skills:
                skill_conditions.append("array_to_string(u.skills, ' ') ILIKE %s")
                params.append(f"%{skill}%")
            
            if skill_conditions:
                where_conditions.append(f"({' OR '.join(skill_conditions)})")
        
        # Activity status filter
        if filters.get('activity_status'):
            if filters['activity_status'] == 'active':
                where_conditions.append("u.last_login > NOW() - INTERVAL '7 days'")
            elif filters['activity_status'] == 'recent':
                where_conditions.append("u.last_login > NOW() - INTERVAL '30 days'")
            elif filters['activity_status'] == 'inactive':
                where_conditions.append("(u.last_login <= NOW() - INTERVAL '30 days' OR u.last_login IS NULL)")
        
        # Application activity filters
        if filters.get('has_applied_recently'):
            where_conditions.append("EXISTS (SELECT 1 FROM job_applications ja2 WHERE ja2.user_id = u.id AND ja2.submitted_at > NOW() - INTERVAL '30 days')")
        
        if filters.get('never_applied'):
            where_conditions.append("NOT EXISTS (SELECT 1 FROM job_applications ja2 WHERE ja2.user_id = u.id)")
        
        # Registration date filters
        if filters.get('registered_after'):
            where_conditions.append("u.created_at >= %s")
            params.append(filters['registered_after'])
        
        if filters.get('registered_before'):
            where_conditions.append("u.created_at <= %s")
            params.append(filters['registered_before'])
        
        # Build final query
        where_clause = " AND ".join(where_conditions)
        group_by = """
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.emirate, 
                     u.nationality, u.education_level, u.experience_years, u.preferred_salary_min,
                     u.preferred_salary_max, u.preferred_location, u.is_uae_national, u.skills,
                     u.created_at, u.last_login
        """
        
        # Sorting
        sort_by = filters.get('sort_by', 'registered_at')
        sort_order = filters.get('sort_order', 'desc').upper()
        
        sort_mapping = {
            'name': 'u.first_name',
            'registered_at': 'u.created_at',
            'last_login': 'u.last_login',
            'experience': 'u.experience_years',
            'applications': 'total_applications',
            'last_application': 'last_application_date'
        }
        
        order_by = f"ORDER BY {sort_mapping.get(sort_by, 'u.created_at')} {sort_order}"
        
        # Pagination
        limit = min(int(filters.get('limit', 20)), 100)  # Max 100 results per page
        offset = int(filters.get('offset', 0))
        
        final_query = f"{base_query} WHERE {where_clause} {group_by} {order_by} LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Count query for pagination
        count_query = f"""
            SELECT COUNT(DISTINCT u.id)
            FROM users u
            LEFT JOIN job_applications ja ON u.id = ja.user_id
            WHERE {where_clause}
        """
        
        return final_query, count_query, params[:-2], params  # params[:-2] for count, full params for main query
    
    @staticmethod
    def calculate_match_score(candidate: Dict[str, Any], job_requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate how well a candidate matches job requirements"""
        
        score = 0
        max_score = 0
        match_details = {
            'experience_match': 0,
            'education_match': 0,
            'location_match': 0,
            'skills_match': 0,
            'salary_match': 0,
            'nationality_bonus': 0
        }
        
        # Experience matching (25 points)
        max_score += 25
        required_experience = job_requirements.get('min_experience', 0)
        candidate_experience = candidate.get('experience_years', 0)
        
        if candidate_experience >= required_experience:
            if candidate_experience >= required_experience + 2:
                match_details['experience_match'] = 25  # Exceeds requirements
            else:
                match_details['experience_match'] = 20  # Meets requirements
        elif candidate_experience >= required_experience - 1:
            match_details['experience_match'] = 15  # Close to requirements
        else:
            match_details['experience_match'] = 5   # Below requirements
        
        score += match_details['experience_match']
        
        # Education matching (20 points)
        max_score += 20
        required_education = job_requirements.get('education_level', '')
        candidate_education = candidate.get('education_level', '')
        
        education_hierarchy = {
            'High School': 1,
            'Diploma': 2,
            'Bachelor': 3,
            'Master': 4,
            'PhD': 5
        }
        
        req_level = education_hierarchy.get(required_education, 0)
        cand_level = education_hierarchy.get(candidate_education, 0)
        
        if cand_level >= req_level:
            match_details['education_match'] = 20
        elif cand_level >= req_level - 1:
            match_details['education_match'] = 15
        else:
            match_details['education_match'] = 10
        
        score += match_details['education_match']
        
        # Location matching (15 points)
        max_score += 15
        job_location = job_requirements.get('location', '').lower()
        candidate_location = candidate.get('preferred_location', '').lower()
        candidate_emirate = candidate.get('emirate', '').lower()
        
        if job_location in candidate_location or candidate_emirate in job_location:
            match_details['location_match'] = 15
        elif 'remote' in job_location or 'uae' in job_location:
            match_details['location_match'] = 12
        else:
            match_details['location_match'] = 8
        
        score += match_details['location_match']
        
        # Skills matching (25 points)
        max_score += 25
        required_skills = job_requirements.get('skills', [])
        candidate_skills = candidate.get('skills', [])
        
        if required_skills and candidate_skills:
            # Convert to lowercase for comparison
            req_skills_lower = [skill.lower() for skill in required_skills]
            cand_skills_lower = [skill.lower() for skill in candidate_skills]
            
            matched_skills = 0
            for req_skill in req_skills_lower:
                for cand_skill in cand_skills_lower:
                    if req_skill in cand_skill or cand_skill in req_skill:
                        matched_skills += 1
                        break
            
            if len(required_skills) > 0:
                skills_percentage = matched_skills / len(required_skills)
                match_details['skills_match'] = int(skills_percentage * 25)
            else:
                match_details['skills_match'] = 15
        else:
            match_details['skills_match'] = 10
        
        score += match_details['skills_match']
        
        # Salary expectations matching (10 points)
        max_score += 10
        job_salary_max = job_requirements.get('salary_max', 0)
        candidate_salary_min = candidate.get('preferred_salary_min', 0)
        
        if job_salary_max and candidate_salary_min:
            if candidate_salary_min <= job_salary_max:
                match_details['salary_match'] = 10
            elif candidate_salary_min <= job_salary_max * 1.1:  # 10% tolerance
                match_details['salary_match'] = 7
            else:
                match_details['salary_match'] = 3
        else:
            match_details['salary_match'] = 5  # Neutral if no data
        
        score += match_details['salary_match']
        
        # UAE National bonus (5 points)
        max_score += 5
        if candidate.get('is_uae_national', False):
            match_details['nationality_bonus'] = 5
            score += 5
        
        # Calculate final percentage
        match_percentage = (score / max_score) * 100 if max_score > 0 else 0
        
        return {
            'match_percentage': round(match_percentage, 1),
            'total_score': score,
            'max_score': max_score,
            'match_details': match_details,
            'match_level': CandidateSearchEngine._get_match_level(match_percentage)
        }
    
    @staticmethod
    def _get_match_level(percentage: float) -> str:
        """Get match level based on percentage"""
        if percentage >= 85:
            return 'excellent'
        elif percentage >= 70:
            return 'good'
        elif percentage >= 55:
            return 'fair'
        else:
            return 'poor'

@hr_candidate_search_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for candidate search functionality"""
    return jsonify({
        'success': True,
        'message': 'HR Candidate Search API is operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Advanced candidate search',
            'Multi-criteria filtering',
            'Skills matching',
            'Experience-based filtering',
            'Location-based search',
            'Salary expectation matching',
            'UAE national preference',
            'Activity status tracking'
        ]
    })

@hr_candidate_search_bp.route('/search', methods=['GET'])
@jwt_required()
def search_candidates():
    """Advanced candidate search with multiple filters"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role', '') if claims else ''
        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({'success': False, 'message': f'Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}'}), 403
        
        # User already verified by JWT role check above
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Role check already done by JWT claims, no need for hr_profiles table check
            
            # Get search filters from query parameters
            filters = {
                'search': request.args.get('search'),
                'emirate': request.args.getlist('emirate') or request.args.get('emirate'),
                'nationality': request.args.getlist('nationality') or request.args.get('nationality'),
                'is_uae_national': request.args.get('is_uae_national'),
                'min_experience': request.args.get('min_experience', type=int),
                'max_experience': request.args.get('max_experience', type=int),
                'education_level': request.args.getlist('education_level') or request.args.get('education_level'),
                'skills': request.args.getlist('skills') or request.args.get('skills'),
                'preferred_location': request.args.get('preferred_location'),
                'max_salary_expectation': request.args.get('max_salary_expectation', type=int),
                'min_salary_expectation': request.args.get('min_salary_expectation', type=int),
                'activity_status': request.args.get('activity_status'),
                'has_applied_recently': request.args.get('has_applied_recently', type=bool),
                'never_applied': request.args.get('never_applied', type=bool),
                'registered_after': request.args.get('registered_after'),
                'registered_before': request.args.get('registered_before'),
                'sort_by': request.args.get('sort_by', 'registered_at'),
                'sort_order': request.args.get('sort_order', 'desc'),
                'limit': request.args.get('limit', 20, type=int),
                'offset': request.args.get('offset', 0, type=int)
            }
            
            # Remove None values
            filters = {k: v for k, v in filters.items() if v is not None}
            
            # Convert string booleans
            if 'is_uae_national' in filters:
                filters['is_uae_national'] = filters['is_uae_national'].lower() == 'true'
            
            # Build and execute search query
            search_query, count_query, count_params, search_params = CandidateSearchEngine.build_search_query(filters)
            
            # DEBUG: Log the query and parameters
            logger.info(f"DEBUG Search filters: {filters}")
            logger.info(f"DEBUG Search query: {search_query}")
            logger.info(f"DEBUG Search params: {search_params}")
            
            # Get total count
            cursor.execute(count_query, count_params)
            total_count = cursor.fetchone()['count']
            logger.info(f"DEBUG Total count: {total_count}")
            
            # Get candidates
            cursor.execute(search_query, search_params)
            candidates = cursor.fetchall()
            logger.info(f"DEBUG Candidates found: {len(candidates)}")
            
            # Convert to list of dicts
            candidates_data = []
            for candidate in candidates:
                candidate_data = dict(candidate)
                
                # Convert skills array to list if it's a string
                if candidate_data.get('skills'):
                    if isinstance(candidate_data['skills'], str):
                        # Handle PostgreSQL array format
                        skills_str = candidate_data['skills'].strip('{}')
                        candidate_data['skills'] = [skill.strip('"') for skill in skills_str.split(',') if skill.strip()]
                
                # Format dates
                if candidate_data.get('registered_at'):
                    candidate_data['registered_at'] = candidate_data['registered_at'].isoformat()
                if candidate_data.get('last_login'):
                    candidate_data['last_login'] = candidate_data['last_login'].isoformat()
                if candidate_data.get('last_application_date'):
                    candidate_data['last_application_date'] = candidate_data['last_application_date'].isoformat()
                
                candidates_data.append(candidate_data)
            
            # Calculate pagination info
            limit = filters.get('limit', 20)
            current_page = (filters.get('offset', 0) // limit) + 1
            total_pages = (total_count + limit - 1) // limit
            
            return jsonify({
                'success': True,
                'data': {
                    'candidates': candidates_data,
                    'total_count': total_count,
                    'current_page': current_page,
                    'total_pages': total_pages,
                    'filters_applied': {k: v for k, v in filters.items() if k not in ['limit', 'offset']},
                    'search_metadata': {
                        'search_time': datetime.now().isoformat(),
                        'results_found': len(candidates_data),
                        'has_more': current_page < total_pages
                    }
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error searching candidates: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to search candidates'
        }), 500

@hr_candidate_search_bp.route('/<candidate_id>', methods=['GET'])
@jwt_required()
def get_candidate_details(candidate_id):
    """Get detailed candidate profile"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role', '') if claims else ''
        
        # Accept multiple role names for HR/Recruiter access
        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({
                'success': False, 
                'message': f'Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}'
            }), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get candidate details
            cursor.execute("""
                SELECT 
                    u.*,
                    COUNT(DISTINCT ja.id) as total_applications,
                    COUNT(DISTINCT CASE WHEN ja.application_status = 'submitted' THEN ja.id END) as pending_applications,
                    MAX(ja.submitted_at) as last_application_date,
                    MAX(u.last_login) as last_activity
                FROM users u
                LEFT JOIN job_applications ja ON u.id = ja.user_id
                WHERE u.id = %s AND u.role = 'candidate'
                GROUP BY u.id
            """, (candidate_id,))
            
            candidate = cursor.fetchone()
            
            if not candidate:
                return jsonify({
                    'success': False,
                    'message': 'Candidate not found'
                }), 404
            
            candidate_data = dict(candidate)
            
            # Parse skills array
            if candidate_data.get('skills'):
                if isinstance(candidate_data['skills'], str):
                    skills_str = candidate_data['skills'].strip('{}')
                    candidate_data['skills'] = [skill.strip('"') for skill in skills_str.split(',') if skill.strip()]
            
            # Get recent applications
            cursor.execute("""
                SELECT 
                    ja.*,
                    jp.title as job_title,
                    c.name as company_name
                FROM job_applications ja
                LEFT JOIN job_postings jp ON ja.job_id = jp.id::text
                LEFT JOIN companies c ON jp.company_id::uuid = c.id
                WHERE ja.user_id = %s
                ORDER BY ja.submitted_at DESC
                LIMIT 5
            """, (candidate_id,))
            
            recent_applications = [dict(app) for app in cursor.fetchall()]
            
            # Format dates
            for app in recent_applications:
                if app.get('submitted_at'):
                    app['submitted_at'] = app['submitted_at'].isoformat()
            
            # Interview history not available (interviews table doesn't exist yet)
            interview_history = []
            
            # Format main candidate dates
            if candidate_data.get('created_at'):
                candidate_data['created_at'] = candidate_data['created_at'].isoformat()
            if candidate_data.get('last_login'):
                candidate_data['last_login'] = candidate_data['last_login'].isoformat()
            if candidate_data.get('last_application_date'):
                candidate_data['last_application_date'] = candidate_data['last_application_date'].isoformat()
            
            # Remove sensitive information
            sensitive_fields = ['password_hash']
            for field in sensitive_fields:
                candidate_data.pop(field, None)
            
            return jsonify({
                'success': True,
                'data': {
                    'candidate': candidate_data,
                    'recent_applications': recent_applications,
                    'interview_history': interview_history,
                    'profile_summary': {
                        'total_applications': candidate_data['total_applications'],
                        'pending_applications': candidate_data['pending_applications'],
                        'total_interviews': 0,
                        'response_rate': 0,
                        'activity_level': 'active' if candidate_data.get('last_login') and 
                                        datetime.fromisoformat(candidate_data['last_login'].replace('Z', '+00:00')) > datetime.now().replace(tzinfo=None) - timedelta(days=7) 
                                        else 'inactive'
                    }
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting candidate details: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve candidate details'
        }), 500

@hr_candidate_search_bp.route('/match/<job_id>', methods=['GET'])
@jwt_required()
def match_candidates_to_job(job_id):
    """Find candidates that match a specific job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role', '') if claims else ''
        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({'success': False, 'message': f'Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify HR access and job ownership
            cursor.execute("""
                SELECT jp.*, hp.id as hr_profile_id
                FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            
            job = cursor.fetchone()
            if not job:
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            job_data = dict(job)
            
            # Parse job requirements
            requirements = {}
            if job_data.get('requirements'):
                try:
                    if isinstance(job_data['requirements'], str):
                        requirements = json.loads(job_data['requirements'])
                    else:
                        requirements = job_data['requirements']
                except (json.JSONDecodeError, TypeError):
                    requirements = {}
            
            # Build job requirements for matching
            job_requirements = {
                'min_experience': requirements.get('min_experience', 0),
                'education_level': requirements.get('education_level', ''),
                'skills': requirements.get('skills', []),
                'location': job_data.get('location', ''),
                'salary_max': job_data.get('salary_range_max', 0)
            }
            
            # Get all candidates
            cursor.execute("""
                SELECT 
                    u.id, u.first_name, u.last_name, u.email, u.phone,
                    u.emirate, u.nationality, u.education_level, u.experience_years,
                    u.preferred_salary_min, u.preferred_salary_max, u.preferred_location,
                    u.is_uae_national, u.skills, u.created_at, u.last_login,
                    COUNT(DISTINCT ja.id) as total_applications
                FROM users u
                LEFT JOIN job_applications ja ON u.id = ja.user_id
                WHERE u.role = 'candidate' AND u.is_active = true
                GROUP BY u.id
                ORDER BY u.last_login DESC NULLS LAST
                LIMIT 100
            """)
            
            candidates = cursor.fetchall()
            
            # Calculate match scores for each candidate
            matched_candidates = []
            for candidate in candidates:
                candidate_data = dict(candidate)
                
                # Parse skills
                if candidate_data.get('skills'):
                    if isinstance(candidate_data['skills'], str):
                        skills_str = candidate_data['skills'].strip('{}')
                        candidate_data['skills'] = [skill.strip('"') for skill in skills_str.split(',') if skill.strip()]
                
                # Calculate match score
                match_result = CandidateSearchEngine.calculate_match_score(candidate_data, job_requirements)
                
                # Only include candidates with reasonable match (>30%)
                if match_result['match_percentage'] >= 30:
                    candidate_data['match_score'] = match_result
                    
                    # Format dates
                    if candidate_data.get('created_at'):
                        candidate_data['created_at'] = candidate_data['created_at'].isoformat()
                    if candidate_data.get('last_login'):
                        candidate_data['last_login'] = candidate_data['last_login'].isoformat()
                    
                    # Remove sensitive data
                    candidate_data.pop('email', None)  # Remove email for privacy in bulk results
                    
                    matched_candidates.append(candidate_data)
            
            # Sort by match score
            matched_candidates.sort(key=lambda x: x['match_score']['match_percentage'], reverse=True)
            
            # Limit results
            limit = min(int(request.args.get('limit', 20)), 50)
            matched_candidates = matched_candidates[:limit]
            
            return jsonify({
                'success': True,
                'data': {
                    'job_posting': {
                        'id': job_data['id'],
                        'title': job_data['title'],
                        'location': job_data['location'],
                        'experience_level': job_data['experience_level']
                    },
                    'matched_candidates': matched_candidates,
                    'total_matches': len(matched_candidates),
                    'match_summary': {
                        'excellent_matches': len([c for c in matched_candidates if c['match_score']['match_level'] == 'excellent']),
                        'good_matches': len([c for c in matched_candidates if c['match_score']['match_level'] == 'good']),
                        'fair_matches': len([c for c in matched_candidates if c['match_score']['match_level'] == 'fair']),
                        'average_match_score': round(sum([c['match_score']['match_percentage'] for c in matched_candidates]) / len(matched_candidates), 1) if matched_candidates else 0
                    }
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error matching candidates to job: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to match candidates to job'
        }), 500

@hr_candidate_search_bp.route('/filters/options', methods=['GET'])
@jwt_required()
def get_filter_options():
    """Get available filter options for candidate search"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role', '') if claims else ''
        
        # Accept multiple role names for HR/Recruiter access
        allowed_roles = ['hr', 'recruiter', 'hr_recruiter', 'admin', 'hr_manager']
        if user_role not in allowed_roles:
            return jsonify({
                'success': False, 
                'message': f'Insufficient permissions. Required role: HR/Recruiter. Your role: {user_role}'
            }), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get unique values for filter options
            filter_options = {}
            
            # Emirates
            cursor.execute("SELECT DISTINCT emirate FROM users WHERE role = 'candidate' AND emirate IS NOT NULL ORDER BY emirate")
            filter_options['emirates'] = [row['emirate'] for row in cursor.fetchall()]
            
            # Nationalities
            cursor.execute("SELECT DISTINCT nationality FROM users WHERE role = 'candidate' AND nationality IS NOT NULL ORDER BY nationality")
            filter_options['nationalities'] = [row['nationality'] for row in cursor.fetchall()]
            
            # Education levels
            cursor.execute("SELECT DISTINCT education_level FROM users WHERE role = 'candidate' AND education_level IS NOT NULL ORDER BY education_level")
            filter_options['education_levels'] = [row['education_level'] for row in cursor.fetchall()]
            
            # Experience ranges
            cursor.execute("SELECT MIN(experience_years) as min_exp, MAX(experience_years) as max_exp FROM users WHERE role = 'candidate'")
            exp_range = cursor.fetchone()
            filter_options['experience_range'] = {
                'min': exp_range['min_exp'] or 0,
                'max': exp_range['max_exp'] or 20
            }
            
            # Popular skills (top 20)
            cursor.execute("""
                SELECT unnest(skills) as skill, COUNT(*) as skill_count
                FROM users 
                WHERE role = 'candidate' AND skills IS NOT NULL
                GROUP BY skill
                ORDER BY skill_count DESC
                LIMIT 20
            """)
            filter_options['popular_skills'] = [row['skill'] for row in cursor.fetchall()]
            
            # Salary ranges
            cursor.execute("""
                SELECT 
                    MIN(preferred_salary_min) as min_salary,
                    MAX(preferred_salary_max) as max_salary,
                    AVG(preferred_salary_min) as avg_min_salary,
                    AVG(preferred_salary_max) as avg_max_salary
                FROM users 
                WHERE role = 'candidate' AND preferred_salary_min IS NOT NULL
            """)
            salary_stats = cursor.fetchone()
            filter_options['salary_ranges'] = {
                'min': int(salary_stats['min_salary'] or 0),
                'max': int(salary_stats['max_salary'] or 100000),
                'average_min': int(salary_stats['avg_min_salary'] or 0),
                'average_max': int(salary_stats['avg_max_salary'] or 0)
            }
            
            # Activity status options
            filter_options['activity_status_options'] = [
                {'value': 'active', 'label': 'Active (last 7 days)'},
                {'value': 'recent', 'label': 'Recent (last 30 days)'},
                {'value': 'inactive', 'label': 'Inactive (30+ days)'}
            ]
            
            # Sort options
            filter_options['sort_options'] = [
                {'value': 'registered_at', 'label': 'Registration Date'},
                {'value': 'last_login', 'label': 'Last Activity'},
                {'value': 'experience', 'label': 'Experience Level'},
                {'value': 'applications', 'label': 'Application Count'},
                {'value': 'name', 'label': 'Name'}
            ]
            
            return jsonify({
                'success': True,
                'data': filter_options
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting filter options: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve filter options'
        }), 500
