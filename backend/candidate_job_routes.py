"""
Candidate Job Routes - Job matching and dashboard endpoints
Uses AI-powered matching for accurate CV-to-job matching
Requires Google Gemini AI - no fallback to basic matching
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import psycopg2
import psycopg2.extras
import os
import logging
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
candidate_job_bp = Blueprint('candidate_job_bp', __name__, url_prefix='/api/candidate')

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

# Import AI matching service
try:
    from ai_job_matching_service import ai_matching_service, AIJobMatchingService, AIServiceUnavailableError
    AI_MATCHING_AVAILABLE = True
    logger.info("AI Job Matching Service loaded successfully")
except ImportError as e:
    AI_MATCHING_AVAILABLE = False
    AIServiceUnavailableError = Exception  # Fallback class
    logger.error(f"AI Job Matching Service not available: {e}")


def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None


def get_candidate_cv(user_id):
    """Get the candidate's most recent CV from the database
    
    Checks multiple tables in order of priority:
    1. user_cvs - where CV Builder saves data
    2. cv_profiles - legacy CV storage
    3. cv_data - another legacy table
    """
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            logger.warning("Database connection not available for CV lookup")
            return None
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # First, try user_cvs table (where CV Builder saves data)
        # This is the primary table used by the modern CV Builder
        try:
            cur.execute("""
                SELECT id, title, template_name, personal_info, professional_summary,
                       technical_skills, soft_skills, work_experience, education,
                       cv_score, ats_score, status, created_at, updated_at
                FROM user_cvs 
                WHERE user_id = %s::uuid
                ORDER BY updated_at DESC 
                LIMIT 1
            """, (user_id,))
            
            result = cur.fetchone()
            if result:
                logger.info(f"Found CV in user_cvs table for user {user_id}")
                # Reconstruct CV data in the expected format
                cv_data = {
                    'personalInfo': result.get('personal_info') or {},
                    'professionalSummary': result.get('professional_summary') or '',
                    'technicalSkills': result.get('technical_skills') or [],
                    'softSkills': result.get('soft_skills') or [],
                    'experience': result.get('work_experience') or [],
                    'education': result.get('education') or [],
                    'skills': [],  # Will be populated from technicalSkills
                    '_source': 'user_cvs',
                    '_cv_id': str(result.get('id', '')),
                    '_title': result.get('title', 'My CV')
                }
                
                # Combine technical and soft skills into skills array
                tech_skills = cv_data.get('technicalSkills', [])
                soft_skills = cv_data.get('softSkills', [])
                if isinstance(tech_skills, list):
                    cv_data['skills'].extend(tech_skills)
                if isinstance(soft_skills, list):
                    cv_data['skills'].extend(soft_skills)
                
                return cv_data
        except Exception as e:
            logger.warning(f"Error querying user_cvs table: {e}")
        
        # Try cv_profiles table (legacy)
        try:
            cur.execute("""
                SELECT cv_data, parsed_data, raw_text 
                FROM cv_profiles 
                WHERE user_id = %s 
                ORDER BY updated_at DESC 
                LIMIT 1
            """, (user_id,))
            
            result = cur.fetchone()
            if result:
                cv_data = result.get('cv_data') or result.get('parsed_data')
                if cv_data:
                    logger.info(f"Found CV in cv_profiles table for user {user_id}")
                    if isinstance(cv_data, str):
                        try:
                            return json.loads(cv_data)
                        except json.JSONDecodeError:
                            pass
                    return cv_data
        except Exception as e:
            logger.warning(f"Error querying cv_profiles table: {e}")
        
        # Try cv_data table (legacy fallback)
        try:
            cur.execute("""
                SELECT data 
                FROM cv_data 
                WHERE user_id = %s 
                ORDER BY updated_at DESC 
                LIMIT 1
            """, (user_id,))
            
            result = cur.fetchone()
            if result and result.get('data'):
                logger.info(f"Found CV in cv_data table for user {user_id}")
                data = result['data']
                if isinstance(data, str):
                    try:
                        return json.loads(data)
                    except json.JSONDecodeError:
                        pass
                return data
        except Exception as e:
            logger.warning(f"Error querying cv_data table: {e}")
        
        logger.info(f"No CV found for user {user_id} in any table")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching candidate CV: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_fallback_jobs():
    """Get fallback job listings when database is unavailable"""
    jobs = [
        {
            'id': 1,
            'title': 'Graduate Trainee - Technology',
            'company': 'Emirates NBD',
            'location': 'Dubai, UAE',
            'type': 'full-time',
            'salary': 'AED 8,000 - 12,000',
            'description': 'Join our graduate trainee program to kickstart your career in banking technology. No prior experience required. Training provided.',
            'requirements': ['Bachelor\'s degree', 'Fresh graduate', 'Basic computer skills', 'English proficiency'],
            'benefits': ['Training program', 'Health Insurance', 'Career development'],
            'postedDate': datetime.now().isoformat()
        },
        {
            'id': 2,
            'title': 'Junior Software Developer',
            'company': 'Careem',
            'location': 'Dubai, UAE',
            'type': 'full-time',
            'salary': 'AED 10,000 - 15,000',
            'description': 'Looking for junior developers to join our engineering team. 0-2 years experience. Will work on mobile and web applications.',
            'requirements': ['JavaScript', 'React or React Native', '0-2 years experience', 'CS degree preferred'],
            'benefits': ['Stock Options', 'Flexible Hours', 'Learning budget'],
            'postedDate': datetime.now().isoformat()
        },
        {
            'id': 3,
            'title': 'Intern - Data Analytics',
            'company': 'ADNOC',
            'location': 'Abu Dhabi, UAE',
            'type': 'internship',
            'salary': 'AED 5,000 - 7,000',
            'description': 'Summer internship program for students interested in data analytics. Learn from industry experts in the energy sector.',
            'requirements': ['Currently enrolled in university', 'Interest in data analysis', 'Excel skills', 'No experience required'],
            'benefits': ['Mentorship', 'Certificate', 'Potential full-time offer'],
            'postedDate': datetime.now().isoformat()
        },
        {
            'id': 4,
            'title': 'Senior Software Engineer',
            'company': 'Talabat',
            'location': 'Dubai, UAE',
            'type': 'full-time',
            'salary': 'AED 25,000 - 35,000',
            'description': 'Lead development of our food delivery platform. Requires 5+ years of experience in backend development.',
            'requirements': ['Python', 'Node.js', 'AWS', 'Microservices', '5+ years experience', 'Team leadership'],
            'benefits': ['Performance Bonus', 'Stock options', 'Remote work'],
            'postedDate': datetime.now().isoformat()
        },
        {
            'id': 5,
            'title': 'Marketing Trainee',
            'company': 'Dubai Tourism',
            'location': 'Dubai, UAE',
            'type': 'full-time',
            'salary': 'AED 7,000 - 10,000',
            'description': 'Entry-level marketing position. Perfect for fresh graduates interested in tourism and hospitality marketing.',
            'requirements': ['Marketing degree', 'Fresh graduate', 'Social media skills', 'Creative thinking'],
            'benefits': ['Government benefits', 'Training', 'Travel opportunities'],
            'postedDate': datetime.now().isoformat()
        },
        {
            'id': 6,
            'title': 'DevOps Engineer',
            'company': 'Dubai Airports',
            'location': 'Dubai, UAE',
            'type': 'full-time',
            'salary': 'AED 20,000 - 28,000',
            'description': 'Manage cloud infrastructure for world-class airport operations. Requires 3+ years DevOps experience.',
            'requirements': ['AWS', 'Docker', 'Kubernetes', 'CI/CD', '3+ years experience'],
            'benefits': ['Government Benefits', 'Travel Perks', 'Professional Development'],
            'postedDate': datetime.now().isoformat()
        },
        {
            'id': 7,
            'title': 'Customer Service Representative - Entry Level',
            'company': 'Etisalat',
            'location': 'Abu Dhabi, UAE',
            'type': 'full-time',
            'salary': 'AED 6,000 - 9,000',
            'description': 'Join our customer service team. No prior experience needed. Full training provided.',
            'requirements': ['High school diploma', 'Arabic and English', 'Communication skills', 'No experience required'],
            'benefits': ['Training', 'Health insurance', 'Phone allowance'],
            'postedDate': datetime.now().isoformat()
        },
        {
            'id': 8,
            'title': 'HR Coordinator - Junior',
            'company': 'Majid Al Futtaim',
            'location': 'Dubai, UAE',
            'type': 'full-time',
            'salary': 'AED 9,000 - 13,000',
            'description': 'Support HR operations in one of the region\'s largest retail groups. 1-2 years HR experience preferred.',
            'requirements': ['HR degree', '0-2 years experience', 'MS Office', 'Organization skills'],
            'benefits': ['Employee discounts', 'Career growth', 'Health insurance'],
            'postedDate': datetime.now().isoformat()
        }
    ]
    return jobs


@candidate_job_bp.route('/job-matches', methods=['GET'])
def get_job_matches():
    """Get job matches for the candidate based on their CV data using AI matching
    
    Returns error if AI service is unavailable - no fallback to basic matching.
    """
    conn = None
    try:
        # Check if AI matching service is available
        if not AI_MATCHING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'AI matching service is not available. Please try again later.',
                'service_unavailable': True,
                'retry_after': 60
            }), 503
        
        # Check if the AI service can connect
        is_available, error_msg = ai_matching_service.check_service_available()
        if not is_available:
            return jsonify({
                'success': False,
                'error': f'AI matching service is not available: {error_msg}. Please try again later.',
                'service_unavailable': True,
                'retry_after': 60
            }), 503
        
        # Try to get user ID from JWT
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Get candidate's CV data
        cv_data = None
        if user_id:
            cv_data = get_candidate_cv(user_id)
            logger.info(f"Loaded CV data for user {user_id}: {bool(cv_data)}")
        
        # CV is required for AI matching
        if not cv_data:
            return jsonify({
                'success': False,
                'error': 'Please upload your CV first to get personalized job matches.',
                'cv_required': True
            }), 400
        
        # Get filter parameters
        filter_by_level = request.args.get('filter_by_level', 'true').lower() == 'true'
        
        # Get jobs from database or fallback
        conn = get_db_connection()
        if conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Fetch all published jobs
            query = """
                SELECT 
                    j.jd_id as id,
                    j.title,
                    COALESCE(c.company_name, 'Confidential Company') as company,
                    j.location,
                    j.employment_type as type,
                    CONCAT(j.salary_range_min, ' - ', j.salary_range_max, ' ', j.currency) as salary,
                    j.description,
                    j.requirements,
                    j.benefits,
                    j.created_at as "postedDate"
                FROM job_postings j
                LEFT JOIN companies c ON j.company_id::text = c.id::text
                WHERE j.status = 'published' OR j.status = 'active'
                ORDER BY j.created_at DESC
                LIMIT 50
            """
            
            cur.execute(query)
            db_jobs = cur.fetchall()
            
            # Transform database results to job format
            jobs = []
            for job in db_jobs:
                reqs = job['requirements'] if isinstance(job['requirements'], list) else []
                benefits = job['benefits'] if isinstance(job['benefits'], list) else []
                
                jobs.append({
                    'id': job['id'],
                    'title': job['title'],
                    'company': job['company'] or 'Unknown Company',
                    'location': job['location'] or 'UAE',
                    'type': job['type'] or 'full-time',
                    'salary': job['salary'] if job['salary'] and 'None' not in job['salary'] else 'Competitive Salary',
                    'description': job['description'] or '',
                    'requirements': reqs,
                    'benefits': benefits,
                    'postedDate': job['postedDate'].isoformat() if job['postedDate'] else datetime.now().isoformat()
                })
            
            # If no jobs in database, use fallback
            if not jobs:
                jobs = get_fallback_jobs()
        else:
            # Database unavailable, use fallback jobs
            jobs = get_fallback_jobs()
        
        # Apply AI matching - this will raise AIServiceUnavailableError if it fails
        try:
            matched_jobs = ai_matching_service.match_cv_to_jobs(cv_data, jobs, use_ai=True)
            
            # Extract candidate level for response
            cv_profile = ai_matching_service.extract_cv_profile(cv_data)
            candidate_level = cv_profile.get('experience_level', 'trainee')
            
            # Optionally filter by experience level
            if filter_by_level:
                matched_jobs = ai_matching_service.filter_jobs_by_experience_level(matched_jobs, candidate_level)
            
            return jsonify({
                'success': True, 
                'jobs': matched_jobs,
                'count': len(matched_jobs),
                'cv_loaded': True,
                'ai_matching': True,
                'candidate_level': candidate_level,
                'message': f'Jobs matched for {candidate_level}-level candidate using AI analysis'
            }), 200
            
        except AIServiceUnavailableError as e:
            logger.error(f"AI service unavailable: {e.message}")
            return jsonify({
                'success': False,
                'error': e.message,
                'service_unavailable': True,
                'retry_after': e.retry_after
            }), 503

    except AIServiceUnavailableError as e:
        logger.error(f"AI service unavailable: {e.message}")
        return jsonify({
            'success': False,
            'error': e.message,
            'service_unavailable': True,
            'retry_after': getattr(e, 'retry_after', 30)
        }), 503
    except Exception as e:
        logger.error(f"Error fetching job matches: {e}")
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500
    finally:
        if conn:
            conn.close()


@candidate_job_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get candidate dashboard statistics"""
    conn = None
    try:
        # Try to get user ID from JWT
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': True,
                'data': {
                    'stats': {
                        'profileViews': 0,
                        'jobMatches': 8,  # Fallback job count
                        'applications': 0,
                        'interviews': 0
                    },
                    'profile': {
                        'name': 'Candidate',
                        'completionPercentage': 30,
                        'cvUploaded': False
                    }
                }
            }), 200
            
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Count published jobs
        cur.execute("SELECT COUNT(*) as count FROM job_postings WHERE status = 'published' OR status = 'active'")
        job_count = cur.fetchone()['count']
        
        # Count applications for this user
        app_count = 0
        if user_id:
            try:
                cur.execute("SELECT COUNT(*) as count FROM job_applications WHERE candidate_id = %s", (user_id,))
                app_count = cur.fetchone()['count']
            except Exception:
                pass
        
        # Check if CV exists and get candidate level
        cv_uploaded = False
        candidate_level = 'trainee'
        if user_id:
            cv_data = get_candidate_cv(user_id)
            cv_uploaded = bool(cv_data)
            if cv_data and AI_MATCHING_AVAILABLE:
                cv_profile = ai_matching_service.extract_cv_profile(cv_data)
                candidate_level = cv_profile.get('experience_level', 'trainee')
        
        return jsonify({
            'success': True,
            'data': {
                'stats': {
                    'profileViews': 12,  # Mock for now
                    'jobMatches': max(job_count, 8),  # At least show fallback count
                    'applications': app_count,
                    'interviews': 0
                },
                'profile': {
                    'name': 'Candidate',
                    'completionPercentage': 85 if cv_uploaded else 30,
                    'cvUploaded': cv_uploaded,
                    'experienceLevel': candidate_level
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@candidate_job_bp.route('/match-analysis', methods=['POST'])
def analyze_job_match():
    """Get detailed match analysis for a specific job"""
    try:
        # Check if AI service is available
        if not AI_MATCHING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'AI matching service is not available. Please try again later.',
                'service_unavailable': True,
                'retry_after': 60
            }), 503
        
        is_available, error_msg = ai_matching_service.check_service_available()
        if not is_available:
            return jsonify({
                'success': False,
                'error': f'AI matching service is not available: {error_msg}. Please try again later.',
                'service_unavailable': True,
                'retry_after': 60
            }), 503
        
        data = request.get_json()
        job_id = data.get('job_id')
        
        if not job_id:
            return jsonify({'success': False, 'error': 'job_id required'}), 400
        
        # Get user's CV
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        cv_data = get_candidate_cv(user_id)
        if not cv_data:
            return jsonify({
                'success': False, 
                'error': 'No CV found. Please upload your CV first.'
            }), 400
        
        cv_profile = ai_matching_service.extract_cv_profile(cv_data)
        
        return jsonify({
            'success': True,
            'analysis': {
                'candidate_profile': {
                    'name': cv_profile.get('name'),
                    'experience_level': cv_profile.get('experience_level'),
                    'experience_years': cv_profile.get('experience_years'),
                    'skills_count': len(cv_profile.get('skills', [])),
                    'top_skills': cv_profile.get('skills', [])[:10]
                },
                'recommendation': 'Use the job matches page for detailed AI-powered analysis'
            }
        }), 200
            
    except AIServiceUnavailableError as e:
        return jsonify({
            'success': False,
            'error': e.message,
            'service_unavailable': True,
            'retry_after': e.retry_after
        }), 503
    except Exception as e:
        logger.error(f"Error analyzing job match: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@candidate_job_bp.route('/service-status', methods=['GET'])
def get_service_status():
    """Check if the AI matching service is available"""
    if not AI_MATCHING_AVAILABLE:
        return jsonify({
            'success': True,
            'available': False,
            'message': 'AI matching service module not loaded'
        }), 200
    
    is_available, error_msg = ai_matching_service.check_service_available()
    
    return jsonify({
        'success': True,
        'available': is_available,
        'message': 'AI matching service is ready' if is_available else error_msg,
        'model': ai_matching_service.model if is_available else None
    }), 200
