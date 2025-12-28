"""
Candidate Job Routes - Job matching and dashboard endpoints
Uses AI-powered matching for accurate CV-to-job matching
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
    from ai_job_matching_service import ai_matching_service, AIJobMatchingService
    AI_MATCHING_AVAILABLE = True
    logger.info("AI Job Matching Service loaded successfully")
except ImportError as e:
    AI_MATCHING_AVAILABLE = False
    logger.warning(f"AI Job Matching Service not available: {e}")


def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None


def get_candidate_cv(user_id):
    """Get the candidate's most recent CV from the database"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Try to get from cv_profiles table first
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
                if isinstance(cv_data, str):
                    try:
                        return json.loads(cv_data)
                    except json.JSONDecodeError:
                        pass
                return cv_data
        
        # Try cv_data table as fallback
        cur.execute("""
            SELECT data 
            FROM cv_data 
            WHERE user_id = %s 
            ORDER BY updated_at DESC 
            LIMIT 1
        """, (user_id,))
        
        result = cur.fetchone()
        if result and result.get('data'):
            data = result['data']
            if isinstance(data, str):
                try:
                    return json.loads(data)
                except json.JSONDecodeError:
                    pass
            return data
        
        return None
        
    except Exception as e:
        logger.error(f"Error fetching candidate CV: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_fallback_jobs(cv_data=None):
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
    """Get job matches for the candidate based on their CV data using AI matching"""
    conn = None
    try:
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
        
        # Get filter parameters
        use_ai = request.args.get('use_ai', 'true').lower() == 'true'
        filter_by_level = request.args.get('filter_by_level', 'true').lower() == 'true'
        
        conn = get_db_connection()
        if not conn:
            # Return fallback data when database is unavailable
            logger.info("Database unavailable, returning fallback job matches")
            fallback_jobs = get_fallback_jobs(cv_data)
            
            # Apply AI matching if CV data available
            if cv_data and AI_MATCHING_AVAILABLE:
                matched_jobs = ai_matching_service.match_cv_to_jobs(cv_data, fallback_jobs, use_ai=use_ai)
                
                # Optionally filter by experience level
                if filter_by_level:
                    cv_profile = ai_matching_service.extract_cv_profile(cv_data)
                    matched_jobs = ai_matching_service.filter_jobs_by_experience_level(
                        matched_jobs, 
                        cv_profile.get('experience_level', 'trainee')
                    )
                
                return jsonify({
                    'success': True,
                    'jobs': matched_jobs,
                    'count': len(matched_jobs),
                    'source': 'fallback',
                    'cv_loaded': True,
                    'ai_matching': use_ai and AI_MATCHING_AVAILABLE,
                    'candidate_level': cv_profile.get('experience_level', 'trainee'),
                    'message': 'Jobs matched to your CV profile using AI analysis'
                }), 200
            else:
                # No CV data - return jobs with default scores
                for job in fallback_jobs:
                    job['matchScore'] = 50  # Neutral score
                    job['matchBreakdown'] = {'note': 'Upload CV for personalized matching'}
                
                return jsonify({
                    'success': True,
                    'jobs': fallback_jobs,
                    'count': len(fallback_jobs),
                    'source': 'fallback',
                    'cv_loaded': False,
                    'ai_matching': False,
                    'message': 'Upload your CV for personalized job matching'
                }), 200
            
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
        jobs = cur.fetchall()
        
        # Transform database results to job format
        transformed_jobs = []
        for job in jobs:
            reqs = job['requirements'] if isinstance(job['requirements'], list) else []
            benefits = job['benefits'] if isinstance(job['benefits'], list) else []
            
            transformed_jobs.append({
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
        if not transformed_jobs:
            transformed_jobs = get_fallback_jobs(cv_data)
        
        # Apply AI matching if CV data available
        if cv_data and AI_MATCHING_AVAILABLE:
            matched_jobs = ai_matching_service.match_cv_to_jobs(transformed_jobs, transformed_jobs, use_ai=use_ai)
            
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
                'ai_matching': use_ai and AI_MATCHING_AVAILABLE,
                'candidate_level': candidate_level,
                'message': f'Jobs matched for {candidate_level}-level candidate using AI analysis'
            }), 200
        else:
            # No CV data - return jobs with default scores
            for job in transformed_jobs:
                job['matchScore'] = 50
                job['matchBreakdown'] = {'note': 'Upload CV for personalized matching'}
            
            return jsonify({
                'success': True, 
                'jobs': transformed_jobs,
                'count': len(transformed_jobs),
                'cv_loaded': False,
                'ai_matching': False,
                'message': 'Upload your CV for personalized job matching'
            }), 200

    except Exception as e:
        logger.error(f"Error fetching job matches: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
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
        
        # Get job details (would fetch from database in production)
        # For now, return analysis based on CV profile
        if AI_MATCHING_AVAILABLE:
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
                    'recommendation': 'Upload complete CV for detailed job-specific analysis'
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'AI matching service not available'
            }), 503
            
    except Exception as e:
        logger.error(f"Error analyzing job match: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
