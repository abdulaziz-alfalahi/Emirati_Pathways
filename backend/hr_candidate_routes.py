
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hr_candidate_bp = Blueprint('hr_candidate', __name__, url_prefix='/api/hr/candidates')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

@hr_candidate_bp.route('/search', methods=['GET'])
@jwt_required()
def search_candidates():
    """
    Search candidates by name, email, or skills.
    Url: /api/hr/candidates/search?q=query
    """
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 20, type=int)
        
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            sql = """
                SELECT 
                    u.id, 
                    u.first_name, 
                    u.last_name, 
                    u.email,
                    p.headline,
                    p.bio,
                    -- Try to aggregate skills if table exists, else empty
                    COALESCE(
                        (SELECT json_agg(s.name) FROM candidate_skills s WHERE s.candidate_id = u.id), 
                        '[]'::json
                    ) as skills
                FROM users u
                LEFT JOIN candidate_profiles p ON u.id = p.user_id
                WHERE u.role IN ('candidate', 'job_seeker')
            """
            params = []
            
            if query:
                sql += """ AND (
                    u.first_name ILIKE %s OR 
                    u.last_name ILIKE %s OR 
                    u.email ILIKE %s OR
                    p.headline ILIKE %s
                )"""
                term = f"%{query}%"
                params = [term, term, term, term]
                
            sql += " LIMIT %s"
            params.append(limit)
            
            cursor.execute(sql, params)
            candidates = cursor.fetchall()
            
            # Format
            results = []
            for c in candidates:
                results.append({
                    'id': c['id'],
                    'name': f"{c.get('first_name','')} {c.get('last_name','')}".strip(),
                    'email': c['email'],
                    'headline': c.get('headline'),
                    'skills': c.get('skills', [])
                })
                
            return jsonify({'success': True, 'data': results})
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error searching candidates: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@hr_candidate_bp.route('/<int:candidate_id>', methods=['GET'])
@jwt_required()
def get_candidate_profile_hr(candidate_id):
    """
    Get full candidate profile for HR view
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
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
                WHERE u.id = %s AND u.role IN ('candidate', 'job_seeker')
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
            
            # 2. Get Recent Applications
            cursor.execute("""
                SELECT 
                    ja.id,
                    ja.job_id,
                    ja.status,
                    ja.submitted_at,
                    ja.updated_at,
                    jd.title as job_title,
                    jd.company as company_name
                FROM job_applications ja
                JOIN job_descriptions jd ON ja.job_id = jd.id
                WHERE ja.candidate_id = %s
                ORDER BY ja.submitted_at DESC
                LIMIT 5
            """, (candidate_id,))
            
            recent_applications = cursor.fetchall()
            
            # Format Applications
            apps_formatted = []
            for app in recent_applications:
                apps_formatted.append({
                    'id': app['id'],
                    'job_id': app['job_id'],
                    'job_title': app['job_title'],
                    'company_name': app['company_name'],
                    'status': app['status'],
                    'submitted_at': app['submitted_at'].isoformat() if app['submitted_at'] else None,
                    'updated_at': app['updated_at'].isoformat() if app['updated_at'] else None
                })
            
            # Salary helper
            salary_min = candidate_data.get('preferred_salary_min') or 0
            salary_max = candidate_data.get('preferred_salary_max') or 0
            salary_range = f"{salary_min} - {salary_max} AED" if salary_max > 0 else "Not specified"

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
                    'education_level': candidate_data.get('education_level') or 'Not specified',
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
                    'current_position': candidate_data.get('current_position'),
                    'current_company': candidate_data.get('current_company'),
                    'notice_period': candidate_data.get('notice_period')
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
