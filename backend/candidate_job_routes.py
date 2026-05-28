"""
Candidate Job Routes - Job matching and dashboard endpoints
Uses AI-powered matching for accurate CV-to-job matching
Requires Google Gemini AI - no fallback to basic matching
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
import json
import uuid as uuidlib

from backend.db import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
candidate_job_bp = Blueprint('candidate_job_bp', __name__, url_prefix='/api/candidate')

# Import AI matching service (Legacy)
# Import AI matching service (Legacy)
try:
    from backend.ai_job_matching_service import ai_matching_service, AIJobMatchingService, AIServiceUnavailableError
    AI_MATCHING_AVAILABLE = True
    logger.info("AI Job Matching Service loaded successfully")
except ImportError as e:
    AI_MATCHING_AVAILABLE = False
    AIServiceUnavailableError = Exception  # Fallback class
    logger.error(f"AI Job Matching Service not available: {e}")

# Import Profile V2 and Enhanced Matching Engine
try:
    from backend.services.profile_v2_service import ProfileV2Service
    from backend.services.enhanced_matching_service import enhanced_matching_engine, JobRequirements
    ENHANCED_MATCHING_AVAILABLE = True
    logger.info("✅ Enhanced Matching Engine loaded")
except ImportError as e:
    ENHANCED_MATCHING_AVAILABLE = False
    logger.error(f"❌ Enhanced Matching Engine not available: {e}")


def get_candidate_cv(user_id):
    """Get the candidate's most recent CV from the database
    
    Checks multiple tables in order of priority:
    1. user_cvs - where CV Builder saves data
    2. cv_profiles - legacy CV storage
    3. cv_data - another legacy table
    
    Post-EID migration: user_id is CHAR(15) Emirates ID.
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
        
        # Post-EID migration: user_id is CHAR(15) EID, use as-is
        user_ids_to_try.append(str(user_id))

        logger.info(f"Trying user IDs for CV lookup: {user_ids_to_try}")
        
        # First, try user_cvs table (where CV Builder saves data)
        # This is the primary table used by the modern CV Builder
        for uid in user_ids_to_try:
            try:
                # Removed ::uuid cast to allow integer/varchar IDs to work
                cur.execute("""
                    SELECT id, title, template_name, personal_info, professional_summary,
                           technical_skills, soft_skills, work_experience, education,
                           cv_score, ats_score, status, created_at, updated_at
                    FROM user_cvs 
                    WHERE user_id = %s
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
                # Log usage warnings but continue to next ID/Table
                # This catches 'operator does not exist: integer = uuid' etc.
                logger.debug(f"Skipping user_cvs lookup for uid {uid}: {e}")
        
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
    jobs = []
    # Fallback jobs removed to prevent confusion with real data
    # If the database is down, it is better to show an empty list or error than fake jobs.
    return jobs



# ... imports
try:
    from backend.services.commute_calculator import haversine, estimate_commute_time, estimate_peak_hour_commute
except ImportError:
    # Fallback or pass (if module is missing)
    def haversine(*args): return 0
    def estimate_commute_time(*args): return "N/A"
    def estimate_peak_hour_commute(*args): return None


# ─── UAE City Coordinate Lookup ───────────────────────────────────────────────
# Since job and user locations are text-based ("Dubai", "Abu Dhabi", etc.),
# we geocode them locally using known UAE city coordinates.
UAE_CITY_COORDINATES = {
    'dubai':              (25.2048, 55.2708),
    'abu dhabi':          (24.4539, 54.3773),
    'sharjah':            (25.3463, 55.4209),
    'ajman':              (25.4052, 55.5136),
    'ras al khaimah':     (25.7895, 55.9432),
    'rak':                (25.7895, 55.9432),
    'fujairah':           (25.1288, 56.3264),
    'umm al quwain':      (25.5647, 55.5554),
    'al ain':             (24.1917, 55.7606),
    'jebel ali':          (25.0077, 55.0810),
    'dubai internet city': (25.0975, 55.1571),
    'dic':                (25.0975, 55.1571),
    'dubai media city':   (25.0975, 55.1571),
    'dmc':                (25.0975, 55.1571),
    'difc':               (25.2145, 55.2795),
    'dubai silicon oasis': (25.1214, 55.3780),
    'dso':                (25.1214, 55.3780),
    'knowledge village':  (25.0970, 55.1600),
    'dubai marina':       (25.0805, 55.1403),
    'business bay':       (25.1860, 55.2617),
    'deira':              (25.2719, 55.3175),
    'bur dubai':          (25.2510, 55.3000),
    'downtown dubai':     (25.1972, 55.2744),
    'khalifa city':       (24.4180, 54.5750),
    'masdar city':        (24.4266, 54.6150),
    'mussafah':           (24.3530, 54.4990),
    'uae':                (25.2048, 55.2708),  # default to Dubai
}

def geocode_uae_location(location_text: str):
    """Resolve a UAE location string to (lat, lng) coordinates.
    Returns (lat, lng) tuple or None if unresolvable."""
    if not location_text:
        return None
    text = location_text.strip().lower()
    # Remove common suffixes
    for suffix in [', uae', ', united arab emirates', ' - uae']:
        text = text.replace(suffix, '')
    text = text.strip()
    # Direct lookup
    if text in UAE_CITY_COORDINATES:
        return UAE_CITY_COORDINATES[text]
    # Fuzzy: check if any city name is contained within the text
    for city, coords in UAE_CITY_COORDINATES.items():
        if city in text or text in city:
            return coords
    return None


@candidate_job_bp.route('/job-matches', methods=['GET'])
def get_job_matches():
    """Get job matches for the candidate with AI scoring"""
    try:
        # 1. Authentication & User Identification
        user_id = None
        raw_user_id = None
        normalized_uuid = None
        
        auth_header = request.headers.get('Authorization', '')
        
        # Handle mock authentication
        if 'mock_token' in auth_header:
            user_id = '784000000000010'
            raw_user_id = user_id
            normalized_uuid = user_id
        else:
            try:
                verify_jwt_in_request(optional=True)
                raw_user_id = str(get_jwt_identity())
                user_id = raw_user_id
                # Post-EID migration: identity is CHAR(15) EID, use as-is
                normalized_uuid = user_id
            except Exception as e:
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

        if not user_id:
             return jsonify({
                 'success': False,
                 'cv_required': True,
                 'error': 'Please sign in to view personalized job matches.'
             }), 401

        if user_id:
            # Pass usage ID which will handle both raw and uuid forms
            cv_data = get_candidate_cv(raw_user_id or user_id)
            
            # Enforce CV or Profile requirement.
            # If no legacy CV, check if Profile V2 exists before blocking.
            if not cv_data:
                 profile_exists = False
                 if ENHANCED_MATCHING_AVAILABLE:
                     try:
                         # Try both user ID formats for robust lookup
                         logger.info(f"No CV found. Checking Profile V2 for user {raw_user_id}")
                         p_check = ProfileV2Service.get_matching_profile_data(raw_user_id)
                         
                         if p_check:
                             profile_exists = True
                             logger.info(f"✅ Profile V2 found for user {raw_user_id}")
                         elif normalized_uuid and normalized_uuid != raw_user_id:
                             # Try normalized UUID if different
                             logger.info(f"Trying normalized UUID: {normalized_uuid}")
                             p_check = ProfileV2Service.get_matching_profile_data(normalized_uuid)
                             if p_check:
                                 profile_exists = True
                                 logger.info(f"✅ Profile V2 found for normalized user {normalized_uuid}")
                         
                         if not profile_exists:
                             logger.warning(f"❌ No Profile V2 found for user {raw_user_id} or {normalized_uuid}")
                     except Exception as profile_err:
                         logger.error(f"Error checking Profile V2 for user {raw_user_id}: {profile_err}")
                 
                 if not profile_exists:
                     logger.warning(f"Blocking job matches for user {raw_user_id} - no CV or Profile V2")
                     return jsonify({
                         'success': False,
                         'cv_required': True,
                         'error': 'Please upload your CV or complete your profile to view personalized job matches.'
                     }), 400
                 else:
                     # Profile V2 exists, allow matching to proceed
                     logger.info(f"Allowing job matching for user {raw_user_id} using Profile V2 data")

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
            
            # Fetch applied jobs to mark them (exclude withdrawn/rejected to allow re-application)
            application_statuses = {}  # jobid -> status
            if user_id:
                try:
                    # Try with 'status' column first (most common)
                    # Use raw_user_id to ensure integer IDs work
                    search_id = raw_user_id or user_id
                    
                    cur.execute("""
                        SELECT job_id, status 
                        FROM job_applications 
                        WHERE candidate_id = %s
                    """, (search_id,))
                    applied_rows = cur.fetchall()
                    
                    for row in applied_rows:
                        job_id = row['job_id']
                        status = row['status']
                        
                        # Only mark as "applied" if not withdrawn or rejected
                        if status not in ['withdrawn', 'rejected']:
                            applied_job_ids.add(job_id)
                        
                        # Store all statuses for reference
                        application_statuses[job_id] = status
                        
                    logger.info(f"User {search_id} has {len(applied_job_ids)} active applications (excluding withdrawn/rejected)")
                except Exception as e:
                    # Column might not exist or different schema - don't let this abort the transaction
                    logger.warning(f"Could not fetch applications (will try fallback): {e}")
                    conn.rollback()  # Rollback failed transaction
                    
                    # Try alternate approach: just get all job_ids without status
                    try:
                        search_id = raw_user_id or user_id
                        cur.execute("SELECT job_id FROM job_applications WHERE candidate_id = %s", (search_id,))
                        applied_rows = cur.fetchall()
                        applied_job_ids = {row['job_id'] for row in applied_rows}
                        logger.info(f"User {search_id} has {len(applied_job_ids)} applications (status column not available)")
                    except Exception as e2:
                        logger.warning(f"Could not fetch applications at all: {e2}")
                        conn.rollback()


            # ── Fetch user's pin-drop coordinates ──────────────────────────────
            # Priority 1: candidate_profiles table (where Profile Studio saves pin-drop)
            if (user_lat is None or user_long is None) and user_id:
                try:
                    search_id = raw_user_id or user_id
                    cur.execute(
                        "SELECT latitude, longitude FROM candidate_profiles WHERE user_id = %s AND latitude IS NOT NULL AND longitude IS NOT NULL LIMIT 1",
                        (str(search_id),)
                    )
                    loc_result = cur.fetchone()
                    if loc_result:
                        user_lat = float(loc_result['latitude'])
                        user_long = float(loc_result['longitude'])
                        logger.info(f"User location from candidate_profiles: ({user_lat}, {user_long})")
                except Exception as e:
                    logger.warning(f"Could not fetch user location from candidate_profiles: {e}")
                    conn.rollback()

            # Priority 2: user_cvs table (legacy fallback)
            if (user_lat is None or user_long is None) and user_id:
                 try:
                     search_id = raw_user_id or user_id
                     cur.execute("SELECT latitude, longitude FROM user_cvs WHERE user_id = %s AND latitude IS NOT NULL LIMIT 1", (str(search_id),))
                     loc_result = cur.fetchone()
                     if loc_result and loc_result.get('latitude'):
                         user_lat = float(loc_result['latitude'])
                         user_long = float(loc_result['longitude'])
                         logger.info(f"User location from user_cvs: ({user_lat}, {user_long})")
                 except Exception as e:
                     logger.warning(f"Could not fetch user location from user_cvs: {e}")
                     conn.rollback()

            if user_lat and user_long:
                logger.info(f"✅ User pin-drop location resolved: ({user_lat}, {user_long})")
            else:
                logger.warning(f"⚠️ No pin-drop location found for user {raw_user_id}. Commute data will not be computed.")

            # Fetch published jobs
            # Using j.id (Primary Key) instead of jd_id for consistency
            query = """
                SELECT 
                    j.id,
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
                    j.created_at as "postedDate",
                    j.experience_level
                FROM job_postings j
                LEFT JOIN companies c ON j.company_id::text = c.id::text
                WHERE j.status = 'published' OR j.status = 'active'
                ORDER BY j.created_at DESC
                LIMIT 50
            """
            
            try:
                cur.execute(query)
                db_jobs = cur.fetchall()
                logger.info(f"🔍 DATABASE QUERY RETURNED {len(db_jobs)} JOBS (status='published' OR 'active')")
                
                for job in db_jobs:
                    try:
                        # Safe requirement handling
                        reqs = job['requirements'] if isinstance(job['requirements'], list) else []
                        if isinstance(job['requirements'], str):
                             # Try parsing if string
                             try: reqs = json.loads(job['requirements'])
                             except: reqs = [job['requirements']]

                        benefits = job['benefits'] if isinstance(job['benefits'], list) else []
                        job_id = job['id']
                        
                        # Commute - Include peak hour times
                        commute_info = {}
                        job_lat = job.get('latitude')
                        job_lng = job.get('longitude')
                        # Geocode job location from text if lat/lng missing
                        if (not job_lat or not job_lng) and job.get('location'):
                            geo = geocode_uae_location(job['location'])
                            if geo:
                                job_lat, job_lng = geo
                        if user_lat and user_long and job_lat and job_lng:
                            dist_km = haversine(user_lat, user_long, job_lat, job_lng)
                            peak_time_info = estimate_peak_hour_commute(dist_km)
                            
                            if peak_time_info:
                                commute_info = {
                                    'distance_km': round(dist_km, 1) if dist_km else None,
                                    'time_mins': peak_time_info['normal_mins'],
                                    'peak_time_mins': peak_time_info['peak_mins'],
                                    'peak_difference_mins': peak_time_info['peak_difference']
                                }
                            else:
                                # Fallback to basic calculation
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
                            'hasApplied': job_id in applied_job_ids,
                            'applicationStatus': application_statuses.get(job_id),  # Include status (withdrawn, rejected, etc.)
                            'experienceLevel': job.get('experience_level', 'Mid Level')
                        })
                    except Exception as loop_e:
                        # Log error for this specific job but continue processing others
                        logger.error(f"Error processing job {job.get('id', 'unknown')}: {loop_e}")
                        continue


            except Exception as e:
                logger.error(f"Error querying jobs: {e}")
                jobs = get_fallback_jobs()
            
            conn.close()
            logger.info(f"📊 CHECKPOINT: After DB query, jobs count = {len(jobs)}")
        else:
             jobs = get_fallback_jobs()



        # 5. Enhanced Matching Logic (Profile V2)
        matched_jobs = []
        
        # Try Profile V2 Matching first
        match_done = False
        
        if ENHANCED_MATCHING_AVAILABLE and user_id:
            try:
                # 1. Get Profile V2 Data - Try Raw first, then UUID
                candidate_profile = ProfileV2Service.get_matching_profile_data(raw_user_id)
                if not candidate_profile and raw_user_id != user_id:
                     candidate_profile = ProfileV2Service.get_matching_profile_data(user_id)
                
                if candidate_profile:
                    logger.info(f"matching using Profile V2 for user {user_id}")
                    raw_level = candidate_profile.career_level
                    # Map to frontend values
                    lvl_map = {
                        'Entry_Level': 'junior',
                        'Mid_Level': 'mid', 
                        'Senior_Level': 'senior',
                        'Executive': 'executive',
                        'Director': 'executive',
                        'Manager': 'senior'
                    }
                    # Handle None/empty career_level - default to 'mid' to avoid over-filtering
                    if raw_level and raw_level in lvl_map:
                        candidate_level = lvl_map[raw_level]
                    elif raw_level:
                        candidate_level = str(raw_level).lower()
                    else:
                        candidate_level = 'mid'  # Default for incomplete profiles
                        logger.info(f"No career_level for user {user_id}, defaulting to 'mid'")
            except Exception as e:
                logger.error(f"Error in profile V2 lookup: {e}")
            
            # ---------------------------------------------------------
            # GLOBAL FILTER: Strict Level & Salary Filtering
            # ---------------------------------------------------------

            # 1. Parse User Minimum Salary Preference
            min_salary_pref = 0
            if 'candidate_profile' in locals() and candidate_profile:
                 # Case A: MatchingProfile DTO (from ProfileV2Service) - Dictionary format
                 if hasattr(candidate_profile, 'salary_expectation') and isinstance(candidate_profile.salary_expectation, dict):
                      min_salary_pref = candidate_profile.salary_expectation.get('min_salary', 0)
                 
                 # Case B: SQL Model (fallback) - String format
                 elif hasattr(candidate_profile, 'expected_salary_range'):
                     try:
                         s_txt = str(candidate_profile.expected_salary_range).lower().replace(',', '').replace('aed', '').strip()
                         if '+' in s_txt:
                             min_salary_pref = int(s_txt.replace('+', ''))
                         elif '-' in s_txt:
                             min_salary_pref = int(s_txt.split('-')[0].strip())
                     except: pass
            
            # Removed hardcoded User 73 filter - let profile data drive filtering naturally
            
            # TEMPORARILY DISABLED: Senior filtering was too aggressive and eliminating all jobs
            # is_senior = str(candidate_level).lower() in ['senior', 'executive', 'senior_level', 'manager', 'director']

            # if is_senior:
            #     logger.info(f"Applying Senior Filters. Min Salary Pref detected: {min_salary_pref}")
            #     filtered_jobs = []
            #     for job in jobs:
            #         # 1. Check Title
            #         t_check = job.get('title', '').lower()
            #         title_ban_list = ['intern', 'trainee', 'junior', 'entry level', 'graduate', 'fresh']
            #         if any(banned in t_check for banned in title_ban_list):
            #             continue
            #             
            #         # 2. Check Experience Level Field
            #         lvl_check = str(job.get('experienceLevel', '')).lower()
            #         if lvl_check in ['entry_level', 'entry', 'junior', 'internship', 'trainee']:
            #             continue
            #
            #         # 3. Check Salary Logic (Strict for Senior/Exec)
            #         # Only filter if both user pref exists and job has salary info
            #         if min_salary_pref > 0:
            #              j_sal_raw = str(job.get('salary', '')).lower()
            #              # Skip check if job salary is hidden/competitive
            #              if 'competitive' not in j_sal_raw and 'negotiable' not in j_sal_raw and any(char.isdigit() for char in j_sal_raw):
            #                  try:
            #                      # Advanced Cleaning for parsing robustness
            #                      clean_sal = j_sal_raw.replace(',', '').replace('aed', '').replace('/month', '').replace('per month', '').strip()
            #                      
            #                      # Handle 'k' notation (e.g., 30k -> 30000)
            #                      if 'k' in clean_sal:
            #                          clean_sal = clean_sal.replace('k', '000')
            #                          
            #                      j_max = 0
            #                      
            #                      if '-' in clean_sal:
            #                          parts = clean_sal.split('-')
            #                          # Use the upper bound of the job offer
            #                          j_max = int(float(parts[1].strip())) 
            #                      elif '+' in clean_sal:
            #                          j_max = int(float(clean_sal.replace('+', '').strip()))
            #                      # Check if purely numeric (allowing for dot)
            #                      elif clean_sal.replace('.', '').isdigit():
            #                          j_max = int(float(clean_sal))
            #                      
            #                      # Strict Salary Check: If Job Max < User Min, exclude.
            #                      if j_max > 0 and j_max < min_salary_pref:
            #                          # Log exclusion for debugging if needed (noisy, so maybe skip)
            #                          continue
            #                  except:
            #                      pass # If parsing fails, be permissive
            #
            #         filtered_jobs.append(job)
            #     
            #     # Replace jobs list with filtered version
            #     logger.info(f"Filtered {len(jobs) - len(filtered_jobs)} jobs based on level/salary rules. Min Pref: {min_salary_pref}")
            #     jobs = filtered_jobs

            logger.info(f"📊 CHECKPOINT: After filtering, jobs count = {len(jobs)}")

            # Ensure candidate_profile is bound
            if 'candidate_profile' not in locals():
                candidate_profile = None

            if candidate_profile:
                try:
                    # 2. Convert raw jobs to JobRequirements objects
                    job_requirements_list = []
                    job_map = {str(j['id']): j for j in jobs} # Map ID to raw job for rebuilding result
                    
                    for job in jobs:
                        # Extract skills from requirements list or string
                        reqs = job.get('requirements', [])
                        if isinstance(reqs, str):
                            # Try simple comma split if string
                            req_skills = [r.strip() for r in reqs.split(',')]
                        else:
                            req_skills = [str(r) for r in reqs]
                            
                        # Parse salary
                        sal_range = None
                        if job.get('salary') and '-' in str(job.get('salary')):
                            try:
                                parts = str(job.get('salary')).replace('AED', '').replace(',', '').split('-')
                                sal_range = {'min_salary': int(parts[0]), 'max_salary': int(parts[1])}
                            except:
                                pass
                        
                        # Parse min experience from requirements
                        min_exp_parsed = 0
                        max_exp_parsed = None
                        
                        # Check requirements text for "X years"
                        for r in req_skills:
                             import re
                             # Look for "5+ years", "3 years", "5-7 years"
                             m = re.search(r'(\d+)(\+|\s*-\s*\d+)?\s*years?', str(r).lower())
                             if m:
                                 try:
                                     val = int(m.group(1))
                                     if val > min_exp_parsed and val < 30: # Sanity check
                                         min_exp_parsed = val
                                 except: pass
                        
                        # Fallback/Adjustment based on Title
                        title_lower = job['title'].lower()
                        if min_exp_parsed == 0:
                             if 'senior' in title_lower or 'lead' in title_lower or 'manager' in title_lower or 'head' in title_lower:
                                 min_exp_parsed = 5
                             elif 'executive' in title_lower or 'chief' in title_lower or 'director' in title_lower:
                                 min_exp_parsed = 10
                        
                        # Set Max Experience Logic
                        if 'intern' in title_lower or 'trainee' in title_lower:
                             max_exp_parsed = 2 
                        elif min_exp_parsed > 0:
                             max_exp_parsed = min_exp_parsed + 15 # Wide window for seniors
                        else:
                             max_exp_parsed = None # Default behavior (min+10)

                        # Create JobRequirements object
                        job_req = JobRequirements(
                            id=str(job['id']),
                            required_skills=req_skills,
                            preferred_skills=[], 
                            min_experience=min_exp_parsed,
                            max_experience=max_exp_parsed,
                            education_requirements=[],
                            location={'emirate': job.get('location', '')},
                            salary_range=sal_range,
                            languages=['English'],
                            industry='',  # Industry column doesn't exist in DB, use empty string
                            company_size='',
                            career_level=job.get('experienceLevel', 'Mid_Level'),
                            emiratization_priority=False, # Should fetch from DB if available
                            visa_sponsorship=True
                        )
                        job_requirements_list.append(job_req)
                    
                    
                    # 3. specific matching with EnhancedMatchingEngine
                    matches = enhanced_matching_engine.find_best_matches(candidate_profile, job_requirements_list, limit=50)
                    
                    # 3.5 RELEVANCE FILTER: Remove obviously irrelevant jobs
                    # Filter out jobs with poor skill/industry alignment
                    relevant_matches = []
                    for job_req, score_obj in matches:
                        # DISABLE STRICT FILTERING
                        # We want to show all jobs, just sorted by relevance.
                        # The previous logic was too aggressive in hiding low-score (but valid) jobs.
                        
                        relevant_matches.append((job_req, score_obj))
                        
                        # skills_score = score_obj.criteria_scores.get('skills', 0)
                        # industry_score = score_obj.criteria_scores.get('industry', 100) 
                        # ... (original filtering logic intentionally removed)
                    
                    logger.info(f"Relevance filter: {len(matches)} -> {len(relevant_matches)} jobs (filtered {len(matches) - len(relevant_matches)} irrelevant)")
                    
                    # 4. Reconstruct response with progressive threshold strategy
                    all_matches = []
                    for job_req, score_obj in relevant_matches:  # Use filtered matches
                        raw_job = job_map.get(job_req.id)
                        if raw_job:
                            # Add match details
                            raw_job['matchScore'] = int(score_obj.overall_score)
                            raw_job['matchBreakdown'] = score_obj.criteria_scores
                            raw_job['matchReasons'] = score_obj.match_reasons
                            raw_job['is_perfect_match'] = (score_obj.overall_score > 85)
                            all_matches.append(raw_job)
                    
                    # Sort by score descending
                    all_matches.sort(key=lambda x: x['matchScore'], reverse=True)
                    
                    
                    # DEBUG: Log all match scores
                    logger.info(f"📊 All matches ({len(all_matches)} total):")
                    for idx, job in enumerate(all_matches[:10]):  # Show top 10
                        logger.info(f"  {idx+1}. {job['title']}: {job['matchScore']}%")
                    
                    # Progressive filtering strategy to ensure good UX
                    filtered_matches = []
                    
                    # Simply take top 20 matches regardless of score tiers
                    # A low match score is better than no jobs shown
                    filtered_matches = all_matches[:50]
                    
                    logger.info(f"Returning top {len(filtered_matches)} matches (from {len(all_matches)} candidates)")

                    matched_jobs = filtered_matches
                            
                    match_done = True
                    logger.info(f"✅ Enhanced matching complete. Found {len(matched_jobs)} matches.")
             
                except Exception as e:
                     logger.error(f"Enhanced matching block failed: {e}")
                     import traceback
                     traceback.print_exc()


        # Fallback to Legacy/AI matching if V2 failed or skipped
        if not match_done:
            matched_jobs = jobs
            if AI_MATCHING_AVAILABLE and cv_data and use_ai:
                try:
                    matched_jobs = ai_matching_service.match_cv_to_jobs(cv_data, jobs)
                    if filter_by_level:
                        matched_jobs = ai_matching_service.filter_jobs_by_experience_level(matched_jobs, candidate_level)
                except Exception as e:
                    logger.warning(f"Legacy AI matching failed: {e}")

        # 6. Sorting (if not already sorted by match)
        # Enhanced engine sorts by score, AI service sorts by score.
        # If raw jobs (no match), default order.
        if sort_by == 'distance' and user_lat:
            matched_jobs.sort(key=lambda x: x.get('commute', {}).get('distance_km', 99999) or 99999)
        elif sort_by == 'commute' and user_lat:
            matched_jobs.sort(key=lambda x: x.get('commute', {}).get('peak_time_mins', None) or x.get('commute', {}).get('time_mins', 99999) or 99999)
        
        # Final checkpoint
        logger.info(f"📊 CHECKPOINT: Final matched_jobs count before return = {len(matched_jobs)}")
        
        # Ensure count matches
        return jsonify({
            'success': True, 
            'jobs': matched_jobs,
            'count': len(matched_jobs),
            'cv_loaded': bool(cv_data) or match_done, # match_done implies profile loaded
            'ai_matching': match_done or (AI_MATCHING_AVAILABLE and bool(cv_data)),
            'matching_source': 'profile_v2' if match_done else ('legacy_ai' if AI_MATCHING_AVAILABLE and cv_data else 'basic'),
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
        raw_user_id = None
        auth_header = request.headers.get('Authorization', '')
        
        # Handle mock authentication (for development/testing)
        if 'mock_token' in auth_header:
            user_id = '784000000000010'
            raw_user_id = user_id
            logger.info(f"Dashboard stats: Using mock user ID: {user_id}")
        else:
            try:
                verify_jwt_in_request(optional=True)
                raw_user_id = str(get_jwt_identity())
                user_id = raw_user_id
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
                # Use raw_user_id to support integer IDs
                search_id = raw_user_id or user_id
                cur.execute("SELECT COUNT(*) as count FROM job_applications WHERE candidate_id = %s", (search_id,))
                app_count = cur.fetchone()['count']
            except Exception:
                pass
        
        # Check if CV exists and get candidate level
        cv_uploaded = False
        candidate_level = 'trainee'
        if user_id:
            cv_data = get_candidate_cv(raw_user_id or user_id)
            cv_uploaded = bool(cv_data)
            
            # 1. Try Profile V2 for Level (Most Accurate)
            if ENHANCED_MATCHING_AVAILABLE:
                try:
                    # Try raw_user_id first to catch legacy IDs
                    p_v2 = ProfileV2Service.get_matching_profile_data(raw_user_id)
                    if not p_v2 and raw_user_id != user_id:
                        p_v2 = ProfileV2Service.get_matching_profile_data(user_id)
                    if p_v2:
                        raw_level = p_v2.career_level
                        # Map to frontend values: trainee, junior, mid, senior, executive
                        lvl_map = {
                            'Entry_Level': 'junior',
                            'Mid_Level': 'mid', 
                            'Senior_Level': 'senior',
                            'Executive': 'executive',
                            'Director': 'executive',
                            'Manager': 'senior'
                        }
                        candidate_level = lvl_map.get(raw_level, raw_level.lower())
                except Exception as e:
                    logger.warning(f"Failed to fetch Profile V2 level: {e}")
            
            # Manual Override for known executive user (Fail-safe)
            if str(raw_user_id) == '73' or str(user_id) == '73':
                 candidate_level = 'executive'

            # 2. Fallback to Legacy AI
            if candidate_level == 'trainee' and cv_data and AI_MATCHING_AVAILABLE:
                try:
                    cv_profile = ai_matching_service.extract_cv_profile(cv_data)
                    candidate_level = cv_profile.get('experience_level', 'trainee')
                except Exception:
                    pass
        
        # Get profile data
        profile_name = 'Candidate'
        profile_photo_url = None
        
        if user_id:
            # Get Name from Users table first
            try:
                 # Fetch both split names and full_name
                 # Try using raw_user_id primarily
                 search_id = raw_user_id or user_id
                 
                 # query with string - if ID is int, string '108' matches int 108 in Postgres if cast properly or relying on implicit
                 # BUT users.id is UUID in many schemas, or INT in others. 
                 # Safest is to try generic %s and catch error if type mismatch
                 try:
                     cur.execute("SELECT first_name, last_name, full_name FROM users WHERE id = %s", (search_id,))
                 except (psycopg2.errors.InvalidTextRepresentation, psycopg2.errors.UndefinedFunction):
                     conn.rollback()
                     # If search_id was '108' and id is UUID, it fails.
                     # If search_id was UUID and id is INT, it might fail.
                     pass
                 else:
                     u_row = cur.fetchone()
                     if u_row:
                         if u_row.get('first_name'):
                            profile_name = f"{u_row['first_name']} {u_row['last_name'] or ''}".strip()
                         elif u_row.get('full_name'):
                            profile_name = u_row['full_name']
                         elif u_row.get('email'):
                            profile_name = u_row['email'].split('@')[0]
            except Exception as e:
                logger.error(f"User name lookup failed: {e}")
                if conn: conn.rollback()

            # Get Photo from Candidate Profiles
            try:
                # Try multiple user_id formats for robust lookup
                # ALWAYS include raw_user_id first
                user_ids_to_try = [str(raw_user_id or user_id)]
                
                # Try UUID conversion if available and different
                if user_id and str(user_id) not in user_ids_to_try:
                    user_ids_to_try.append(str(user_id))
                    
                # Post-EID migration: user_id is CHAR(15) EID, no UUID conversion needed
                pass

                # Query with ANY of the potential IDs - using TEXT cast to allow matching both int-as-text and uuid-as-text
                # candidate_profiles.user_id is likely INTEGER based on previous errors.
                # If it is integer, we should NOT cast it to text for comparison if we pass integers?
                # Actually, casting column to text `user_id::text` allows comparison with string '108' AND string 'uuid'.
                # So `WHERE user_id::text = ANY(%s)` is the safest cross-type query.
                cur.execute("""
                    SELECT profile_photo_url 
                    FROM candidate_profiles 
                    WHERE user_id = ANY(%s)
                """, (user_ids_to_try,))
                
                p_row = cur.fetchone()
                
                if p_row and p_row.get('profile_photo_url'):
                    profile_photo_url = p_row.get('profile_photo_url')
                    logger.info(f"Dashboard Stats: Found photo for user {user_id}: {profile_photo_url}")
            except Exception as e:
               logger.error(f"Profile photo lookup failed with IDs {user_ids_to_try}: {e}")
               if conn: conn.rollback()

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
        
        offers = []
        seen_ids = set()
        
        # Primary source: job_offers table (where offers are actually created)
        try:
            job_offers_query = """
                SELECT 
                    jo.offer_id,
                    jo.jd_id,
                    jo.candidate_id,
                    jo.recruiter_id,
                    jo.position_title,
                    jo.salary_amount,
                    jo.salary_currency,
                    jo.salary_period,
                    jo.employment_type,
                    jo.start_date,
                    jo.expiry_date,
                    jo.benefits,
                    jo.status,
                    jo.work_location,
                    jo.notes,
                    jo.probation_period_months,
                    jo.candidate_response,
                    jo.response_notes,
                    jo.response_date,
                    jo.negotiation_notes,
                    jo.negotiation_status,
                    jo.created_at,
                    jo.updated_at,
                    jp.title as job_title,
                    jp.company_id as company_name,
                    r.first_name as recruiter_first_name,
                    r.last_name as recruiter_last_name,
                    r.email as recruiter_email
                FROM job_offers jo
                LEFT JOIN job_postings jp ON jo.jd_id = jp.jd_id
                LEFT JOIN users r ON jo.recruiter_id::text = r.id::text
                WHERE jo.candidate_id::text = %s
                ORDER BY jo.created_at DESC
            """
            cur.execute(job_offers_query, (str(candidate_id),))
            job_offer_rows = cur.fetchall()
            
            for row in job_offer_rows:
                offer_id = row.get('offer_id')
                if offer_id in seen_ids:
                    continue
                seen_ids.add(offer_id)
                
                offers.append({
                    'id': offer_id,
                    'job_posting_id': row.get('jd_id'),
                    'job_title': row.get('job_title') or row.get('position_title', 'Position'),
                    'company_name': row.get('company_name') or 'Company',
                    'job_location': row.get('work_location') or 'UAE',
                    'status': row.get('status'),
                    'salary_amount': float(row.get('salary_amount') or 0),
                    'salary_currency': row.get('salary_currency') or 'AED',
                    'salary_period': row.get('salary_period') or 'monthly',
                    'start_date': str(row.get('start_date')) if row.get('start_date') else None,
                    'employment_type': row.get('employment_type') or 'full-time',
                    'probation_period_months': row.get('probation_period_months'),
                    'benefits': row.get('benefits') or {},
                    'notes': row.get('notes'),
                    'candidate_response': row.get('candidate_response'),
                    'response_notes': row.get('response_notes'),
                    'negotiation_notes': row.get('negotiation_notes'),
                    'negotiation_status': row.get('negotiation_status'),
                    'expiry_date': str(row.get('expiry_date')) if row.get('expiry_date') else None,
                    'recruiter_name': f"{row.get('recruiter_first_name', '')} {row.get('recruiter_last_name', '')}".strip() or 'Recruiter',
                    'recruiter_email': row.get('recruiter_email'),
                    'created_at': row.get('created_at').isoformat() if row.get('created_at') else None,
                    'updated_at': row.get('updated_at').isoformat() if row.get('updated_at') else None
                })
        except Exception as jo_err:
            logger.warning(f"job_offers query failed: {jo_err}")
        
        # Secondary source: offers table (UUID-based, for any offers created there)
        try:
            offers_query = """
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
                ORDER BY o.created_at DESC
            """
            try:
                cur.execute(offers_query, (int(candidate_id),))
            except (ValueError, TypeError):
                cur.execute(offers_query.replace('o.candidate_id = %s', 'o.candidate_id::text = %s'), (str(candidate_id),))
            
            for row in cur.fetchall():
                offer_uuid = str(row.get('id'))
                if offer_uuid in seen_ids:
                    continue
                seen_ids.add(offer_uuid)
                
                offer_data = row.get('offer_data') or {}
                if isinstance(offer_data, str):
                    try:
                        offer_data = json.loads(offer_data)
                    except:
                        offer_data = {}
                
                offers.append({
                    'id': offer_uuid,
                    'job_posting_id': str(row.get('job_posting_id')) if row.get('job_posting_id') else None,
                    'job_title': row.get('job_title') or offer_data.get('position_title', 'Position'),
                    'company_name': row.get('company_name') or offer_data.get('company_name', 'Company'),
                    'job_location': row.get('job_location') or offer_data.get('work_location', 'UAE'),
                    'status': row.get('status'),
                    'salary_amount': offer_data.get('salary_amount', 0),
                    'salary_currency': offer_data.get('salary_currency', 'AED'),
                    'salary_period': offer_data.get('salary_period', 'monthly'),
                    'start_date': offer_data.get('start_date'),
                    'employment_type': offer_data.get('employment_type', 'full-time'),
                    'probation_period_months': offer_data.get('probation_period_months'),
                    'benefits': offer_data.get('benefits', {}),
                    'notes': offer_data.get('notes'),
                    'expiry_date': offer_data.get('expiry_date'),
                    'recruiter_name': f"{row.get('recruiter_first_name', '')} {row.get('recruiter_last_name', '')}".strip() or 'Recruiter',
                    'recruiter_email': row.get('recruiter_email'),
                    'created_at': row.get('created_at').isoformat() if row.get('created_at') else None,
                    'updated_at': row.get('updated_at').isoformat() if row.get('updated_at') else None
                })
        except Exception as o_err:
            logger.warning(f"offers table query failed: {o_err}")
        
        conn.close()
        
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
    """Accept, decline, or negotiate an offer"""
    try:
        data = request.get_json() or {}
        action = data.get('action')  # 'accept', 'decline', or 'negotiate'
        message = data.get('message', '')  # Optional message to recruiter
        
        if action not in ['accept', 'decline', 'negotiate']:
            return jsonify({
                'success': False,
                'message': 'Invalid action. Must be "accept", "decline", or "negotiate"'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        offer = None
        offer_source = None  # 'job_offers' or 'offers'
        
        # Try job_offers table first (OFR-* IDs)
        try:
            cur.execute("""
                SELECT offer_id as id, status, candidate_id, recruiter_id, 
                       position_title, jd_id
                FROM job_offers 
                WHERE offer_id = %s
            """, (offer_id,))
            offer = cur.fetchone()
            if offer:
                offer_source = 'job_offers'
        except Exception as e:
            logger.warning(f"job_offers lookup failed: {e}")
            conn.rollback()
        
        # Fallback to offers table (UUID IDs)
        if not offer:
            try:
                cur.execute("""
                    SELECT id, status, candidate_id, recruiter_id, offer_data
                    FROM offers 
                    WHERE id = %s::uuid
                """, (offer_id,))
                offer = cur.fetchone()
                if offer:
                    offer_source = 'offers'
            except Exception as e:
                logger.warning(f"offers table lookup failed: {e}")
                conn.rollback()
        
        if not offer:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Offer not found'
            }), 404
        
        if offer.get('status') not in ['pending', 'sent', 'negotiating']:
            conn.close()
            return jsonify({
                'success': False,
                'message': f"Cannot respond to offer. Current status is '{offer.get('status')}'"
            }), 400
        
        # Map action to status
        status_map = {'accept': 'accepted', 'decline': 'declined', 'negotiate': 'negotiating'}
        new_status = status_map[action]
        
        # Build response metadata
        response_meta = {
            'candidate_response': action,
            'candidate_message': message,
            'responded_at': datetime.now().isoformat()
        }
        
        # Update the appropriate table
        if offer_source == 'job_offers':
            cur.execute("""
                UPDATE job_offers
                SET candidate_response = %s,
                    response_date = CURRENT_TIMESTAMP,
                    response_notes = %s,
                    status = %s,
                    negotiation_status = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE offer_id = %s
            """, (
                action if action != 'decline' else 'rejected',
                message,
                'rejected' if action == 'decline' else new_status,
                'in_progress' if action == 'negotiate' else 'none',
                offer_id
            ))
        else:
            cur.execute("""
                UPDATE offers
                SET status = %s,
                    updated_at = NOW(),
                    offer_data = offer_data || %s::jsonb
                WHERE id = %s::uuid
                RETURNING id
            """, (
                new_status,
                json.dumps(response_meta),
                offer_id
            ))
            # Also sync the job_offers table if a matching row exists
            cur.execute("""
                UPDATE job_offers
                SET candidate_response = %s,
                    response_date = CURRENT_TIMESTAMP,
                    response_notes = %s,
                    status = %s,
                    negotiation_status = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE offer_id = %s AND status IN ('pending', 'sent', 'viewed', 'negotiating')
            """, (
                action if action != 'decline' else 'rejected',
                message,
                'rejected' if action == 'decline' else new_status,
                'in_progress' if action == 'negotiate' else 'none',
                offer_id
            ))
        
        conn.commit()
        
        logger.info(f"Candidate responded to offer {offer_id}: {action}")
        
        # Determine position title from offer data
        if offer_source == 'job_offers':
            position_title = offer.get('position_title') or 'a position'
        else:
            offer_data = offer.get('offer_data') or {}
            if isinstance(offer_data, str):
                offer_data = json.loads(offer_data)
            position_title = offer_data.get('position_title') or offer_data.get('job_title') or 'a position'
        
        # Send notification to recruiter
        recruiter_id = offer.get('recruiter_id')
        if recruiter_id:
            try:
                if action == 'accept':
                    notif_title = 'Offer Accepted'
                    notif_content = f'Great news! The candidate has accepted your offer for {position_title}.'
                    notif_type = 'offer_accepted'
                elif action == 'decline':
                    notif_title = 'Offer Declined'
                    notif_content = f'The candidate has declined your offer for {position_title}.'
                    if message:
                        notif_content += f' Reason: "{message}"'
                    notif_type = 'offer_declined'
                else:  # negotiate
                    notif_title = 'Offer Negotiation Started'
                    notif_content = f'The candidate wants to negotiate the offer for {position_title}.'
                    if message:
                        notif_content += f' Message: "{message}"'
                    notif_type = 'offer_negotiation'
                
                notif_metadata = json.dumps({
                    'offer_id': offer_id,
                    'position_title': position_title,
                    'candidate_response': action,
                    'candidate_message': message,
                    'link': '/recruiter?tab=offers'
                })
                
                cur.execute("""
                    INSERT INTO notifications (user_id, type, title, content, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                """, (str(recruiter_id), notif_type, notif_title, notif_content, notif_metadata))
                
                conn.commit()
            except Exception as notif_err:
                logger.error(f"Failed to create recruiter notification: {notif_err}")
        
        conn.close()
        
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
        
        total = 0
        pending = 0
        accepted = 0
        declined = 0
        
        # Primary: job_offers table
        try:
            cur.execute("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status IN ('pending', 'sent')) as pending,
                    COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
                    COUNT(*) FILTER (WHERE status IN ('declined', 'rejected')) as declined
                FROM job_offers
                WHERE candidate_id::text = %s
            """, (str(candidate_id),))
            row = cur.fetchone()
            if row:
                total += row.get('total', 0) or 0
                pending += row.get('pending', 0) or 0
                accepted += row.get('accepted', 0) or 0
                declined += row.get('declined', 0) or 0
        except Exception as e:
            logger.warning(f"job_offers stats query failed: {e}")
            conn.rollback()
        
        # Secondary: offers table
        try:
            cur.execute("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status IN ('pending', 'sent')) as pending,
                    COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
                    COUNT(*) FILTER (WHERE status IN ('declined', 'rejected')) as declined
                FROM offers
                WHERE candidate_id = %s
            """, (int(candidate_id),))
            row2 = cur.fetchone()
            if row2:
                total += row2.get('total', 0) or 0
                pending += row2.get('pending', 0) or 0
                accepted += row2.get('accepted', 0) or 0
                declined += row2.get('declined', 0) or 0
        except Exception as e:
            logger.warning(f"offers stats query failed: {e}")
            conn.rollback()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total': total,
                'pending': pending,
                'accepted': accepted,
                'declined': declined
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching offer stats: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch stats: {str(e)}'
        }), 500
