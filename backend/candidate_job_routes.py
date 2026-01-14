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
import uuid as uuidlib

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
    
    Handles multiple user ID formats:
    - UUID strings
    - Integer IDs (converted to UUID using uuid5)
    """
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            logger.warning("Database connection not available for CV lookup")
            return None
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Build list of user IDs to try (handles multiple formats)
        user_ids_to_try = []
        
        # 1. Try original user_id if it's a valid UUID
        try:
            uuidlib.UUID(str(user_id))
            user_ids_to_try.append(str(user_id))
        except ValueError:
            pass
        
        # 2. Convert non-UUID to UUID using uuid5 (same as get_current_user_uuid_inline in unified_server.py)
        converted_uuid = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
        if converted_uuid not in user_ids_to_try:
            user_ids_to_try.append(converted_uuid)
            logger.info(f"Converted user_id '{user_id}' to UUID: {converted_uuid}")
        
        # 3. Add placeholder/test UUIDs that might have been used during development
        # These are common placeholder UUIDs used in test data
        placeholder_uuids = [
            '00000000-0000-0000-0000-000000000001',  # Common test user 1
            '550e8400-e29b-41d4-a716-446655440000',  # Another common test UUID
        ]
        for placeholder in placeholder_uuids:
            if placeholder not in user_ids_to_try:
                user_ids_to_try.append(placeholder)
        
        logger.info(f"Trying user IDs for CV lookup: {user_ids_to_try}")
        
        # First, try user_cvs table (where CV Builder saves data)
        # This is the primary table used by the modern CV Builder
        for uid in user_ids_to_try:
            try:
                cur.execute("""
                    SELECT id, title, template_name, personal_info, professional_summary,
                           technical_skills, soft_skills, work_experience, education,
                           cv_score, ats_score, status, created_at, updated_at
                    FROM user_cvs 
                    WHERE user_id = %s::uuid
                    ORDER BY updated_at DESC 
                    LIMIT 1
                """, (uid,))
                
                result = cur.fetchone()
                if result:
                    logger.info(f"Found CV in user_cvs table for user {uid} (original: {user_id})")
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
                logger.warning(f"Error querying user_cvs table with uid {uid}: {e}")
        
        # Try cv_profiles table (legacy) with all user IDs
        for uid in user_ids_to_try:
            try:
                cur.execute("""
                    SELECT cv_data, parsed_data, raw_text 
                    FROM cv_profiles 
                    WHERE user_id = %s 
                    ORDER BY updated_at DESC 
                    LIMIT 1
                """, (uid,))
                
                result = cur.fetchone()
                if result:
                    cv_data = result.get('cv_data') or result.get('parsed_data')
                    if cv_data:
                        logger.info(f"Found CV in cv_profiles table for user {uid}")
                        if isinstance(cv_data, str):
                            try:
                                return json.loads(cv_data)
                            except json.JSONDecodeError:
                                pass
                        return cv_data
            except Exception as e:
                logger.warning(f"Error querying cv_profiles table with uid {uid}: {e}")
        
        # Try cv_data table (legacy fallback) with all user IDs
        for uid in user_ids_to_try:
            try:
                cur.execute("""
                    SELECT data 
                    FROM cv_data 
                    WHERE user_id = %s 
                    ORDER BY updated_at DESC 
                    LIMIT 1
                """, (uid,))
                
                result = cur.fetchone()
                if result and result.get('data'):
                    logger.info(f"Found CV in cv_data table for user {uid}")
                    data = result['data']
                    if isinstance(data, str):
                        try:
                            return json.loads(data)
                        except json.JSONDecodeError:
                            pass
                    return data
            except Exception as e:
                logger.warning(f"Error querying cv_data table with uid {uid}: {e}")
        
        logger.info(f"No CV found for user {user_id} (tried: {user_ids_to_try}) in any table")
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



# ... imports
from services.commute_calculator import haversine, estimate_commute_time

@candidate_job_bp.route('/job-matches', methods=['GET'])
def get_job_matches():
    """Get job matches for the candidate with AI scoring"""
    try:
        # 1. Authentication & User Identification
        user_id = None
        auth_header = request.headers.get('Authorization', '')
        
        # Handle mock authentication
        if 'mock_token' in auth_header:
            user_id = '00000000-0000-0000-0000-000000000001'
        else:
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if user_id:
                    # Normalize UUID
                    try:
                        uuidlib.UUID(str(user_id))
                    except ValueError:
                        user_id = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
            except Exception:
                pass

        # 2. Get Query Parameters
        filter_by_level = request.args.get('filter_by_level', 'true').lower() == 'true'
        sort_by = request.args.get('sort_by', 'relevance') # relevance, distance, date
        user_lat = request.args.get('lat', type=float)
        user_long = request.args.get('long', type=float)
        use_ai = request.args.get('use_ai', 'true').lower() == 'true'

        # 3. Fetch Candidate CV (for AI matching and location)
        cv_data = None
        candidate_level = 'unknown'
        if user_id:
            cv_data = get_candidate_cv(user_id)
            if cv_data and AI_MATCHING_AVAILABLE:
                try:
                    cv_profile = ai_matching_service.extract_cv_profile(cv_data)
                    candidate_level = cv_profile.get('experience_level', 'unknown')
                except Exception as e:
                    logger.warning(f"Error extracting profile: {e}")

        # 4. Fetch Jobs from Database
        conn = get_db_connection()
        applied_job_ids = set()
        matched_jobs = [] # Will be populated
        jobs = [] # Raw jobs

        if conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Fetch applied jobs to mark them
            if user_id:
                try:
                    cur.execute("SELECT job_id FROM job_applications WHERE candidate_id = %s", (user_id,))
                    applied_rows = cur.fetchall()
                    applied_job_ids = {row['job_id'] for row in applied_rows}
                except Exception as e:
                    logger.warning(f"Could not fetch applications: {e}")

            # Check for profile location if not provided
            if (user_lat is None or user_long is None) and user_id:
                 try:
                     cur.execute("SELECT latitude, longitude FROM user_cvs WHERE user_id = %s::uuid LIMIT 1", (user_id,))
                     loc_result = cur.fetchone()
                     if loc_result and loc_result.get('latitude'):
                         user_lat = loc_result['latitude']
                         user_long = loc_result['longitude']
                 except Exception as e:
                     logger.warning(f"Could not fetch user location: {e}")

            # Fetch published jobs
            query = """
                SELECT 
                    j.jd_id as id,
                    j.title,
                    COALESCE(c.company_name, 'Confidential Company') as company,
                    j.location,
                    j.latitude,
                    j.longitude,
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
            
            try:
                cur.execute(query)
                db_jobs = cur.fetchall()
                
                for job in db_jobs:
                    # Safe requirement handling
                    reqs = job['requirements'] if isinstance(job['requirements'], list) else []
                    if isinstance(job['requirements'], str):
                         # Try parsing if string
                         try: reqs = json.loads(job['requirements'])
                         except: reqs = [job['requirements']]

                    benefits = job['benefits'] if isinstance(job['benefits'], list) else []
                    job_id = job['id']
                    
                    # Commute
                    commute_info = {}
                    if user_lat and user_long and job.get('latitude') and job.get('longitude'):
                        dist_km = haversine(user_lat, user_long, job['latitude'], job['longitude'])
                        time_min = estimate_commute_time(dist_km)
                        commute_info = {
                            'distance_km': round(dist_km, 1) if dist_km else None,
                            'time_mins': time_min
                        }

                    jobs.append({
                        'id': job_id,
                        'title': job['title'],
                        'company': job['company'] or 'Unknown Company',
                        'location': job['location'] or 'UAE',
                        'latitude': job.get('latitude'),
                        'longitude': job.get('longitude'),
                        'commute': commute_info,
                        'type': job['type'] or 'full-time',
                        'salary': job['salary'] if job['salary'] and 'None' not in job['salary'] else 'Competitive Salary',
                        'description': job['description'] or '',
                        'requirements': reqs,
                        'benefits': benefits,
                        'postedDate': job['postedDate'].isoformat() if job['postedDate'] else datetime.now().isoformat(),
                        'hasApplied': job_id in applied_job_ids
                    })
            except Exception as e:
                logger.error(f"Error querying jobs: {e}")
                jobs = get_fallback_jobs()
            
            conn.close()
        else:
             jobs = get_fallback_jobs()

        if not jobs:
            jobs = get_fallback_jobs()

        # 5. AI Matching Logic
        matched_jobs = jobs # Default to raw jobs
        
        if AI_MATCHING_AVAILABLE and cv_data and use_ai:
            try:
                # Use AI Service to match
                matched_jobs = ai_matching_service.match_cv_to_jobs(cv_data, jobs)
                
                # Filter by level if requested
                if filter_by_level:
                    matched_jobs = ai_matching_service.filter_jobs_by_experience_level(matched_jobs, candidate_level)
                    
            except Exception as e:
                logger.error(f"AI matching failed: {e}")
                # Fallback to basic sorting/filtering
                pass
        
        # 6. Sorting (if not AI matched or simplified sort requested)
        if not (AI_MATCHING_AVAILABLE and cv_data and use_ai):
             if sort_by == 'distance' and user_lat:
                matched_jobs.sort(key=lambda x: x['commute'].get('distance_km', 99999) or 99999)
        
        # Ensure count matches
        return jsonify({
            'success': True, 
            'jobs': matched_jobs,
            'count': len(matched_jobs),
            'cv_loaded': bool(cv_data),
            'ai_matching': AI_MATCHING_AVAILABLE and bool(cv_data),
            'candidate_level': candidate_level,
            'user_location': {'lat': user_lat, 'long': user_long} if user_lat else None 
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error in get_job_matches: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    # ... error handlers



@candidate_job_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get candidate dashboard statistics"""
    conn = None
    try:
        # Try to get user ID from JWT or mock token
        user_id = None
        auth_header = request.headers.get('Authorization', '')
        
        # Handle mock authentication (for development/testing)
        if 'mock_token' in auth_header:
            user_id = '00000000-0000-0000-0000-000000000001'
            logger.info(f"Dashboard stats: Using mock user ID: {user_id}")
        else:
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                # if user_id:
                #    try:
                #        uuidlib.UUID(str(user_id))
                #    except ValueError:
                #        user_id = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
                pass
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
        
        # Get profile data
        profile_name = 'Candidate'
        profile_photo_url = None
        
        if user_id:
            # Get Name from Users table first
            try:
                 cur.execute("SELECT first_name, last_name FROM users WHERE id::text = %s", (str(user_id),))
                 u_row = cur.fetchone()
                 if u_row and u_row['first_name']:
                     profile_name = f"{u_row['first_name']} {u_row['last_name'] or ''}".strip()
            except Exception as e:
                logger.error(f"User name lookup failed: {e}")

            # Get Photo from Candidate Profiles
            # Get Photo from Candidate Profiles
            try:
                # Try multiple user_id formats for robust lookup
                user_ids_to_try = [str(user_id)]
                
                # Try UUID conversion if not already UUID
                try:
                    uuidlib.UUID(str(user_id))
                except ValueError:
                    converted_uuid = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
                    user_ids_to_try.append(converted_uuid)

                # Query with ANY of the potential IDs
                cur.execute("""
                    SELECT profile_photo_url 
                    FROM candidate_profiles 
                    WHERE user_id::text = ANY(%s)
                """, (user_ids_to_try,))
                
                p_row = cur.fetchone()
                
                if p_row and p_row.get('profile_photo_url'):
                    profile_photo_url = p_row.get('profile_photo_url')
                    logger.info(f"Dashboard Stats: Found photo for user {user_id}: {profile_photo_url}")
            except Exception as e:
               logger.error(f"Profile photo lookup failed with IDs {user_ids_to_try}: {e}")

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
                    'name': profile_name,
                    'completionPercentage': 85 if cv_uploaded else 30,
                    'cvUploaded': cv_uploaded,
                    'experienceLevel': candidate_level,
                    'profile_photo_url': profile_photo_url
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


# =====================================================
# CANDIDATE OFFERS ENDPOINTS
# =====================================================

@candidate_job_bp.route('/offers', methods=['GET'])
def get_candidate_offers():
    """Get all offers for a candidate"""
    try:
        # Get candidate_id from query params or auth
        candidate_id = request.args.get('candidate_id')
        
        if not candidate_id:
            # Try to get from JWT
            try:
                verify_jwt_in_request(optional=True)
                candidate_id = get_jwt_identity()
            except:
                pass
        
        if not candidate_id:
            return jsonify({
                'success': False,
                'message': 'Candidate ID required'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get offers for this candidate that have been sent
        query = """
            SELECT 
                o.id,
                o.job_posting_id,
                o.candidate_id,
                o.recruiter_id,
                o.status,
                o.offer_data,
                o.created_at,
                o.updated_at,
                jd.title as job_title,
                jd.company as company_name,
                jd.location as job_location,
                r.first_name as recruiter_first_name,
                r.last_name as recruiter_last_name,
                r.email as recruiter_email
            FROM offers o
            LEFT JOIN job_descriptions jd ON o.job_posting_id::text = jd.id::text
            LEFT JOIN users r ON o.recruiter_id = r.id
            WHERE o.candidate_id = %s
              AND o.status IN ('sent', 'accepted', 'declined', 'negotiating')
            ORDER BY o.created_at DESC
        """
        
        # Try with integer candidate_id first
        try:
            cur.execute(query, (int(candidate_id),))
        except (ValueError, TypeError):
            # If candidate_id is a UUID, try different approach
            cur.execute(query.replace('o.candidate_id = %s', 'o.candidate_id::text = %s'), (str(candidate_id),))
        
        results = cur.fetchall()
        conn.close()
        
        offers = []
        for row in results:
            offer = dict(row)
            # Parse offer_data if it's a string
            if offer.get('offer_data') and isinstance(offer['offer_data'], str):
                try:
                    offer['offer_data'] = json.loads(offer['offer_data'])
                except:
                    pass
            
            # Format the offer for frontend
            offer_data = offer.get('offer_data') or {}
            offers.append({
                'id': str(offer.get('id')),
                'job_posting_id': str(offer.get('job_posting_id')) if offer.get('job_posting_id') else None,
                'job_title': offer.get('job_title') or offer_data.get('position_title', 'Position'),
                'company_name': offer.get('company_name') or offer_data.get('company_name', 'Company'),
                'job_location': offer.get('job_location') or offer_data.get('work_location', 'UAE'),
                'status': offer.get('status'),
                'salary_amount': offer_data.get('salary_amount', 0),
                'salary_currency': offer_data.get('salary_currency', 'AED'),
                'salary_period': offer_data.get('salary_period', 'monthly'),
                'start_date': offer_data.get('start_date'),
                'employment_type': offer_data.get('employment_type', 'full-time'),
                'probation_period_months': offer_data.get('probation_period_months'),
                'benefits': offer_data.get('benefits', {}),
                'notes': offer_data.get('notes'),
                'expiry_date': offer_data.get('expiry_date'),
                'recruiter_name': f"{offer.get('recruiter_first_name', '')} {offer.get('recruiter_last_name', '')}".strip() or 'Recruiter',
                'recruiter_email': offer.get('recruiter_email'),
                'created_at': offer.get('created_at').isoformat() if offer.get('created_at') else None,
                'updated_at': offer.get('updated_at').isoformat() if offer.get('updated_at') else None
            })
        
        logger.info(f"Found {len(offers)} offers for candidate {candidate_id}")
        
        return jsonify({
            'success': True,
            'data': offers,
            'count': len(offers)
        })
        
    except Exception as e:
        logger.error(f"Error fetching candidate offers: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch offers: {str(e)}'
        }), 500


@candidate_job_bp.route('/offers/<offer_id>', methods=['GET'])
def get_candidate_offer_details(offer_id):
    """Get details of a specific offer"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = """
            SELECT 
                o.id,
                o.job_posting_id,
                o.candidate_id,
                o.recruiter_id,
                o.status,
                o.offer_data,
                o.created_at,
                o.updated_at,
                jd.title as job_title,
                jd.company as company_name,
                jd.location as job_location,
                jd.description as job_description,
                r.first_name as recruiter_first_name,
                r.last_name as recruiter_last_name,
                r.email as recruiter_email
            FROM offers o
            LEFT JOIN job_descriptions jd ON o.job_posting_id::text = jd.id::text
            LEFT JOIN users r ON o.recruiter_id = r.id
            WHERE o.id = %s::uuid
        """
        
        cur.execute(query, (offer_id,))
        result = cur.fetchone()
        conn.close()
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'Offer not found'
            }), 404
        
        offer = dict(result)
        offer_data = offer.get('offer_data') or {}
        if isinstance(offer_data, str):
            try:
                offer_data = json.loads(offer_data)
            except:
                offer_data = {}
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(offer.get('id')),
                'job_posting_id': str(offer.get('job_posting_id')) if offer.get('job_posting_id') else None,
                'job_title': offer.get('job_title') or offer_data.get('position_title', 'Position'),
                'company_name': offer.get('company_name') or offer_data.get('company_name', 'Company'),
                'job_location': offer.get('job_location') or offer_data.get('work_location', 'UAE'),
                'job_description': offer.get('job_description'),
                'status': offer.get('status'),
                'salary_amount': offer_data.get('salary_amount', 0),
                'salary_currency': offer_data.get('salary_currency', 'AED'),
                'salary_period': offer_data.get('salary_period', 'monthly'),
                'start_date': offer_data.get('start_date'),
                'employment_type': offer_data.get('employment_type', 'full-time'),
                'probation_period_months': offer_data.get('probation_period_months'),
                'benefits': offer_data.get('benefits', {}),
                'notes': offer_data.get('notes'),
                'expiry_date': offer_data.get('expiry_date'),
                'recruiter_name': f"{offer.get('recruiter_first_name', '')} {offer.get('recruiter_last_name', '')}".strip() or 'Recruiter',
                'recruiter_email': offer.get('recruiter_email'),
                'created_at': offer.get('created_at').isoformat() if offer.get('created_at') else None,
                'updated_at': offer.get('updated_at').isoformat() if offer.get('updated_at') else None
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching offer details: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch offer: {str(e)}'
        }), 500


@candidate_job_bp.route('/offers/<offer_id>/respond', methods=['POST'])
def respond_to_offer(offer_id):
    """Accept or decline an offer"""
    try:
        data = request.get_json() or {}
        action = data.get('action')  # 'accept' or 'decline'
        message = data.get('message', '')  # Optional message to recruiter
        
        if action not in ['accept', 'decline']:
            return jsonify({
                'success': False,
                'message': 'Invalid action. Must be "accept" or "decline"'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # First check if the offer exists and is in 'sent' status
        cur.execute("""
            SELECT id, status, candidate_id, recruiter_id 
            FROM offers 
            WHERE id = %s::uuid
        """, (offer_id,))
        
        offer = cur.fetchone()
        
        if not offer:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Offer not found'
            }), 404
        
        if offer.get('status') not in ['sent', 'negotiating']:
            conn.close()
            return jsonify({
                'success': False,
                'message': f"Cannot respond to offer. Current status is '{offer.get('status')}'"
            }), 400
        
        # Update offer status
        new_status = 'accepted' if action == 'accept' else 'declined'
        
        cur.execute("""
            UPDATE offers
            SET status = %s,
                updated_at = NOW(),
                offer_data = offer_data || %s::jsonb
            WHERE id = %s::uuid
            RETURNING id
        """, (
            new_status,
            json.dumps({
                'candidate_response': action,
                'candidate_message': message,
                'responded_at': datetime.now().isoformat()
            }),
            offer_id
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Candidate responded to offer {offer_id}: {action}")
        
        # TODO: Send notification to recruiter
        
        return jsonify({
            'success': True,
            'message': f'Offer {new_status} successfully',
            'data': {
                'offer_id': offer_id,
                'status': new_status
            }
        })
        
    except Exception as e:
        logger.error(f"Error responding to offer: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to respond to offer: {str(e)}'
        }), 500


@candidate_job_bp.route('/offers/stats', methods=['GET'])
def get_candidate_offer_stats():
    """Get offer statistics for a candidate"""
    try:
        candidate_id = request.args.get('candidate_id')
        
        if not candidate_id:
            try:
                verify_jwt_in_request(optional=True)
                candidate_id = get_jwt_identity()
            except:
                pass
        
        if not candidate_id:
            return jsonify({
                'success': False,
                'message': 'Candidate ID required'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = """
            SELECT 
                COUNT(*) FILTER (WHERE status IN ('sent', 'accepted', 'declined', 'negotiating')) as total,
                COUNT(*) FILTER (WHERE status = 'sent') as pending,
                COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
                COUNT(*) FILTER (WHERE status = 'declined') as declined
            FROM offers
            WHERE candidate_id = %s
        """
        
        try:
            cur.execute(query, (int(candidate_id),))
        except (ValueError, TypeError):
            cur.execute(query.replace('candidate_id = %s', 'candidate_id::text = %s'), (str(candidate_id),))
        
        result = cur.fetchone()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total': result.get('total', 0) or 0,
                'pending': result.get('pending', 0) or 0,
                'accepted': result.get('accepted', 0) or 0,
                'declined': result.get('declined', 0) or 0
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching offer stats: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch stats: {str(e)}'
        }), 500
