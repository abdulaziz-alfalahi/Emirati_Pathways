
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

try:
    from backend.auth.access_control import require_roles, HR_ROLES
except ImportError:
    from auth.access_control import require_roles, HR_ROLES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hr_candidate_bp = Blueprint('hr_candidate', __name__, url_prefix='/api/hr/candidates')

# REMOVED: search_candidates was dead code — shadowed by
# REMOVED: hr_dashboard_api.search_candidates (registered first via blueprint).


@hr_candidate_bp.route('/<candidate_id>', methods=['GET'])
@require_roles(*HR_ROLES)
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
                    COALESCE(NULLIF(u.emirate, ''), CASE WHEN strpos(LOWER(p.target_roles::text), 'dubai') > 0 THEN 'Dubai' WHEN strpos(LOWER(p.target_roles::text), 'abu dhabi') > 0 THEN 'Abu Dhabi' WHEN strpos(LOWER(p.target_roles::text), 'sharjah') > 0 THEN 'Sharjah' ELSE '' END) as emirate,
                    u.nationality,
                    u.created_at as registered_at,
                    u.last_login,
                    u.job_title as current_position,
                    u.company as current_company,
                    u.preferred_salary_min,
                    u.preferred_salary_max,
                    COALESCE(NULLIF(u.preferred_location, ''), CASE WHEN strpos(LOWER(p.target_roles::text), 'dubai') > 0 THEN 'Dubai' WHEN strpos(LOWER(p.target_roles::text), 'abu dhabi') > 0 THEN 'Abu Dhabi' WHEN strpos(LOWER(p.target_roles::text), 'sharjah') > 0 THEN 'Sharjah' ELSE '' END, 'Flexible') as preferred_location,
                    COALESCE(u.experience_years, (SELECT COALESCE(SUM(EXTRACT(YEAR FROM AGE(COALESCE(end_date, CURRENT_DATE), start_date))), 0) FROM candidate_experience_entries WHERE user_id = u.id::varchar), 0) as experience_years,
                    COALESCE(u.education_level, (SELECT CASE WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'phd') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'doctor') > 0 THEN 'PhD' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'master') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'emba') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'mba') > 0 THEN 'Master' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'bachelor') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'bsc') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'ba') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'degree') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'eng') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'hnd') > 0 THEN 'Bachelor' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'diploma') > 0 THEN 'Diploma' ELSE 'Bachelor' END FROM candidate_education_entries WHERE user_id = u.id::varchar)) as education_level,
                    u.skills as user_skills,
                    (SELECT array_agg(name) FROM candidate_skills WHERE user_id = u.id::varchar) as skills_array,
                    p.bio,
                    p.headline,
                    p.notice_period,
                    p.profile_photo_url,
                    p.expected_salary_range,
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
            
            # Resolve skills array safely from JSONB user_skills or subquery skills_array
            skills_list = []
            if candidate_data.get('skills_array'):
                skills_list = candidate_data['skills_array']
            elif candidate_data.get('user_skills'):
                us = candidate_data['user_skills']
                if isinstance(us, list):
                    skills_list = us
                elif isinstance(us, str):
                    try:
                        skills_list = json.loads(us)
                    except: pass
            candidate_data['skills'] = skills_list
            
            # Parse expected salary from expected_salary_range (Career Compass)
            expected_salary = candidate_data.get('expected_salary_range')
            salary_min = candidate_data.get('preferred_salary_min') or 0
            salary_max = candidate_data.get('preferred_salary_max') or 0
            
            if expected_salary and (not salary_min or not salary_max):
                try:
                    s_txt = str(expected_salary).lower().replace('aed', '').replace(',', '').replace('+', '').strip()
                    if '-' in s_txt:
                        parts = s_txt.split('-')
                        salary_min = int(float(parts[0].strip()))
                        salary_max = int(float(parts[1].strip()))
                    elif s_txt.isdigit():
                        val = int(s_txt)
                        salary_min = val
                        salary_max = val + 20000 if val < 200000 else val + 50000
                    elif '100000' in s_txt or '100k' in s_txt:
                        salary_min = 100000
                        salary_max = 150000
                except Exception as ex:
                    logger.warning(f"Error parsing expected salary range {expected_salary}: {ex}")
            
            candidate_data['preferred_salary_min'] = salary_min
            candidate_data['preferred_salary_max'] = salary_max
            salary_range = expected_salary or (f"{salary_min} - {salary_max} AED" if salary_max > 0 else "Not specified")
            
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

            # 2b. Fallback to direct Career Compass entry tables if CV tables are empty
            if not work_experience:
                try:
                    cursor.execute("""
                        SELECT job_title as title, company, location, description, start_date, end_date, is_current
                        FROM candidate_experience_entries
                        WHERE user_id = %s
                        ORDER BY start_date DESC NULLS LAST
                    """, (str(candidate_id),))
                    work_experience = [dict(r) for r in cursor.fetchall()]
                    for exp in work_experience:
                        if exp.get('start_date'):
                            exp['start_date'] = exp['start_date'].isoformat()
                        if exp.get('end_date'):
                            exp['end_date'] = exp['end_date'].isoformat()
                except Exception as e:
                    logger.warning(f"Error fetching candidate_experience_entries: {e}")

            if not education:
                try:
                    cursor.execute("""
                        SELECT degree, institution, field_of_study, start_date, end_date, grade
                        FROM candidate_education_entries
                        WHERE user_id = %s
                        ORDER BY end_date DESC NULLS LAST
                    """, (str(candidate_id),))
                    education = [dict(r) for r in cursor.fetchall()]
                    for edu in education:
                        if edu.get('start_date'):
                            edu['start_date'] = edu['start_date'].isoformat()
                        if edu.get('end_date'):
                            edu['end_date'] = edu['end_date'].isoformat()
                except Exception as e:
                    logger.warning(f"Error fetching candidate_education_entries: {e}")

            if not certifications:
                try:
                    cursor.execute("""
                        SELECT name, issuing_organization as issuer, issue_date
                        FROM candidate_certifications
                        WHERE user_id = %s
                        ORDER BY issue_date DESC NULLS LAST
                    """, (str(candidate_id),))
                    certifications = [dict(r) for r in cursor.fetchall()]
                    for cert in certifications:
                        if cert.get('issue_date'):
                            cert['issue_date'] = cert['issue_date'].isoformat()
                except Exception as e:
                    logger.warning(f"Error fetching candidate_certifications: {e}")

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
            
            # Use CV/Compass-derived data as fallback for missing user fields
            current_position = candidate_data.get('current_position') or cv_current_position
            if not current_position and work_experience:
                latest = work_experience[0]
                current_position = latest.get('title') or latest.get('job_title') or latest.get('position')
            
            current_company = candidate_data.get('current_company') or cv_current_company
            if not current_company and work_experience:
                latest = work_experience[0]
                current_company = latest.get('company') or latest.get('organization')
            
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
                    'is_uae_national': str(candidate_data.get('nationality', '')).lower() in ['uae', 'emiratis', 'united arab emirates', 'are'],
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
