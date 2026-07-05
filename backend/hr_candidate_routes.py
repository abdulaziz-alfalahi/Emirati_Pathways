
"""
HR Candidate Routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import logging
import os
import json
from backend.db import get_db_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hr_candidate_bp = Blueprint('hr_candidate', __name__, url_prefix='/api/hr/candidates')

# REMOVED: search_candidates was dead code — shadowed by
# REMOVED: hr_dashboard_api.search_candidates (registered first via blueprint).


@hr_candidate_bp.route('/<candidate_id>', methods=['GET'])
@jwt_required()
def get_candidate_profile_hr(candidate_id):
    """
    Get full candidate profile for HR view
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # 1. Get Candidate Basic Info & Profile
            # We join users with candidate_profiles to get everything
            # Corrected to pull fields from users table where they actually exist
            cursor.execute("""
                SELECT 
                    u.id, 
                    u.first_name, 
                    u.last_name, 
                    u.email, 
                    u.phone,
                    u.emirate,
                    u.nationality,
                    u.created_at as registered_at,
                    u.last_login,
                    u.job_title as current_position,
                    u.company as current_company,
                    u.preferred_salary_min,
                    u.preferred_salary_max,
                    u.preferred_location,
                    u.experience_years,
                    u.education_level,
                    u.skills,
                    p.bio,
                    p.headline,
                    p.notice_period,
                    p.profile_photo_url,
                    (SELECT COUNT(*) FROM job_applications ja WHERE ja.candidate_id = u.id) as total_applications,
                    (SELECT MAX(submitted_at) FROM job_applications ja WHERE ja.candidate_id = u.id) as last_application_date
                FROM users u
                LEFT JOIN candidate_profiles p ON u.id = p.user_id
                WHERE u.id::text = %s AND u.role IN ('candidate', 'job_seeker')
            """, (candidate_id,))
            
            candidate = cursor.fetchone()
            
            if not candidate:
                return jsonify({
                    'success': False,
                    'message': 'Candidate not found'
                }), 404
            
            # Format Candidate Data
            candidate_data = dict(candidate)
            
            # Skills might be an array or None
            if candidate_data.get('skills') is None:
                candidate_data['skills'] = []
            
            # 2. Get CV data (work experience, education, etc.) from user_cvs
            work_experience = []
            education = []
            certifications = []
            cv_current_position = None
            cv_current_company = None
            cv_education_level = None
            try:
                cursor.execute("""
                    SELECT parsed_data, work_experience, education
                    FROM user_cvs
                    WHERE user_id::text = %s
                    ORDER BY updated_at DESC NULLS LAST, created_at DESC
                    LIMIT 1
                """, (candidate_id,))
                cv_row = cursor.fetchone()
                if cv_row:
                    # Try parsed_data first (richest source), fall back to direct columns
                    pd = cv_row.get('parsed_data')
                    if pd:
                        if isinstance(pd, str):
                            pd = json.loads(pd)
                        work_experience = pd.get('work_experience') or pd.get('experience') or []
                        education = pd.get('education') or []
                        certifications = pd.get('certifications') or []
                        # Derive current position from latest work experience
                        if work_experience and isinstance(work_experience, list) and len(work_experience) > 0:
                            latest = work_experience[0]
                            cv_current_position = latest.get('title') or latest.get('job_title') or latest.get('position')
                            cv_current_company = latest.get('company') or latest.get('organization')
                        # Derive education level from education entries
                        if education and isinstance(education, list) and len(education) > 0:
                            cv_education_level = education[0].get('degree') or education[0].get('level')
                    else:
                        # Fall back to direct columns
                        we_raw = cv_row.get('work_experience')
                        ed_raw = cv_row.get('education')
                        if we_raw:
                            work_experience = json.loads(we_raw) if isinstance(we_raw, str) else we_raw
                        if ed_raw:
                            education = json.loads(ed_raw) if isinstance(ed_raw, str) else ed_raw
            except Exception as e:
                logger.warning(f"Failed to fetch CV data for candidate {candidate_id}: {e}")

            # 3. Get Recent Applications (try job_postings first, then legacy job_descriptions)
            apps_formatted = []
            try:
                cursor.execute("""
                    SELECT 
                        ja.id,
                        ja.job_id,
                        ja.status,
                        ja.submitted_at,
                        COALESCE(jp.title, jd.title) as job_title,
                        COALESCE(jp.company_id::text, jd.company) as company_name
                    FROM job_applications ja
                    LEFT JOIN job_postings jp ON ja.job_id = jp.id::text
                    LEFT JOIN job_descriptions jd ON ja.job_id = jd.id::text
                    WHERE ja.candidate_id::text = %s
                    ORDER BY ja.submitted_at DESC
                    LIMIT 5
                """, (candidate_id,))
                
                recent_applications = cursor.fetchall()
                
                for app in recent_applications:
                    apps_formatted.append({
                        'id': app['id'],
                        'job_id': app['job_id'],
                        'job_title': app['job_title'],
                        'company_name': app['company_name'],
                        'status': app['status'],
                        'submitted_at': app['submitted_at'].isoformat() if app['submitted_at'] else None,
                        'updated_at': app['submitted_at'].isoformat() if app['submitted_at'] else None
                    })
            except Exception as e:
                logger.warning(f"Failed to fetch applications for candidate {candidate_id}: {e}")
            
            # Salary helper
            salary_min = candidate_data.get('preferred_salary_min') or 0
            salary_max = candidate_data.get('preferred_salary_max') or 0
            salary_range = f"{salary_min} - {salary_max} AED" if salary_max > 0 else "Not specified"
            
            # Use CV-derived data as fallback for missing user fields
            current_position = candidate_data.get('current_position') or cv_current_position
            current_company = candidate_data.get('current_company') or cv_current_company
            education_level = candidate_data.get('education_level') or cv_education_level or 'Not specified'

            # Final Response Structure
            response_data = {
                'candidate': {
                    'id': candidate_data['id'],
                    'first_name': candidate_data['first_name'],
                    'last_name': candidate_data['last_name'],
                    'email': candidate_data['email'],
                    'phone': candidate_data['phone'],
                    'emirate': candidate_data['emirate'],
                    'nationality': candidate_data['nationality'],
                    'education_level': education_level,
                    'experience_years': candidate_data.get('experience_years') or 0,
                    'preferred_salary_min': candidate_data.get('preferred_salary_min'),
                    'preferred_salary_max': candidate_data.get('preferred_salary_max'),
                    'salary_expectation': salary_range,
                    'preferred_location': candidate_data.get('preferred_location') or 'Flexible',
                    'is_uae_national': str(candidate_data.get('nationality', '')).lower() in ['uae', 'emiratis', 'united arab emirates'],
                    'skills': candidate_data.get('skills', []),
                    'registered_at': candidate_data['registered_at'].isoformat() if candidate_data['registered_at'] else None,
                    'last_login': candidate_data['last_login'].isoformat() if candidate_data['last_login'] else None,
                    'total_applications': candidate_data['total_applications'],
                    'last_application_date': candidate_data['last_application_date'].isoformat() if candidate_data['last_application_date'] else None,
                    'activity_status': 'active', 
                    'profile_photo_url': candidate_data.get('profile_photo_url'),
                    'bio': candidate_data.get('bio'),
                    'headline': candidate_data.get('headline'),
                    'current_position': current_position,
                    'current_company': current_company,
                    'notice_period': candidate_data.get('notice_period'),
                    'work_experience': work_experience,
                    'education': education,
                    'certifications': certifications
                },
                'recent_applications': apps_formatted
            }
            
            return jsonify({
                'success': True,
                'data': response_data
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting candidate profile: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
