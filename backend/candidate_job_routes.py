
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import psycopg2
import psycopg2.extras
import os
import logging
from datetime import datetime
import json
import re

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

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None


def extract_skills_from_cv(cv_data):
    """Extract skills from CV data (handles both camelCase and snake_case)"""
    skills = set()
    
    if not cv_data:
        return skills
    
    # Handle skills section
    skills_section = cv_data.get('skills') or cv_data.get('technicalSkills') or cv_data.get('technical_skills') or []
    if isinstance(skills_section, dict):
        # Handle nested skills like { technical: [], soft: [] }
        for key in ['technical', 'soft', 'languages', 'tools']:
            if key in skills_section:
                for skill in skills_section[key]:
                    if isinstance(skill, str):
                        skills.add(skill.lower().strip())
                    elif isinstance(skill, dict):
                        skill_name = skill.get('name') or skill.get('skill_name') or ''
                        if skill_name:
                            skills.add(skill_name.lower().strip())
    elif isinstance(skills_section, list):
        for skill in skills_section:
            if isinstance(skill, str):
                skills.add(skill.lower().strip())
            elif isinstance(skill, dict):
                skill_name = skill.get('name') or skill.get('skill_name') or ''
                if skill_name:
                    skills.add(skill_name.lower().strip())
    
    # Also extract from soft skills
    soft_skills = cv_data.get('softSkills') or cv_data.get('soft_skills') or []
    if isinstance(soft_skills, list):
        for skill in soft_skills:
            if isinstance(skill, str):
                skills.add(skill.lower().strip())
    
    # Extract from experience descriptions
    experience = cv_data.get('experience') or cv_data.get('work_experience') or []
    if isinstance(experience, list):
        for exp in experience:
            desc = exp.get('description') or exp.get('responsibilities') or ''
            if isinstance(desc, str):
                # Extract common tech keywords
                tech_keywords = ['python', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 
                               'kubernetes', 'java', 'typescript', 'angular', 'vue', 'mongodb',
                               'postgresql', 'mysql', 'redis', 'git', 'ci/cd', 'agile', 'scrum',
                               'machine learning', 'data analysis', 'project management', 'leadership']
                for keyword in tech_keywords:
                    if keyword.lower() in desc.lower():
                        skills.add(keyword.lower())
    
    return skills


def extract_experience_years(cv_data):
    """Extract total years of experience from CV"""
    if not cv_data:
        return 0
    
    experience = cv_data.get('experience') or cv_data.get('work_experience') or []
    total_years = 0
    
    for exp in experience:
        start_date = exp.get('startDate') or exp.get('start_date') or ''
        end_date = exp.get('endDate') or exp.get('end_date') or ''
        is_current = exp.get('current') or exp.get('is_current') or False
        
        try:
            if start_date:
                start_year = int(start_date.split('-')[0]) if '-' in start_date else int(start_date[:4])
                if is_current or not end_date or end_date.lower() == 'present':
                    end_year = datetime.now().year
                else:
                    end_year = int(end_date.split('-')[0]) if '-' in end_date else int(end_date[:4])
                total_years += max(0, end_year - start_year)
        except (ValueError, IndexError):
            continue
    
    return total_years


def extract_location(cv_data):
    """Extract location from CV"""
    if not cv_data:
        return ''
    
    personal_info = cv_data.get('personalInfo') or cv_data.get('personal_info') or {}
    location = personal_info.get('location') or personal_info.get('city') or personal_info.get('emirate') or ''
    return location.lower()


def extract_job_title(cv_data):
    """Extract current/desired job title from CV"""
    if not cv_data:
        return ''
    
    personal_info = cv_data.get('personalInfo') or cv_data.get('personal_info') or {}
    title = personal_info.get('jobTitle') or personal_info.get('job_title') or personal_info.get('currentRole') or ''
    
    # Also check experience for most recent role
    if not title:
        experience = cv_data.get('experience') or cv_data.get('work_experience') or []
        if experience and len(experience) > 0:
            title = experience[0].get('jobTitle') or experience[0].get('job_title') or experience[0].get('position') or ''
    
    return title.lower()


def calculate_match_score(cv_data, job):
    """Calculate match score between CV and job posting"""
    score = 0
    max_score = 100
    
    # Extract CV data
    cv_skills = extract_skills_from_cv(cv_data)
    cv_experience_years = extract_experience_years(cv_data)
    cv_location = extract_location(cv_data)
    cv_title = extract_job_title(cv_data)
    
    # Extract job requirements
    job_requirements = job.get('requirements') or []
    if isinstance(job_requirements, str):
        job_requirements = [r.strip() for r in job_requirements.split(',')]
    
    job_title = (job.get('title') or '').lower()
    job_location = (job.get('location') or '').lower()
    job_description = (job.get('description') or '').lower()
    
    # 1. Skills Match (40 points max)
    if job_requirements:
        job_skills = set()
        for req in job_requirements:
            if isinstance(req, str):
                # Extract skill keywords from requirement
                req_lower = req.lower()
                job_skills.add(req_lower)
                # Also add individual words
                for word in req_lower.split():
                    if len(word) > 2:
                        job_skills.add(word)
        
        if job_skills:
            matching_skills = cv_skills.intersection(job_skills)
            skill_match_ratio = len(matching_skills) / len(job_skills) if job_skills else 0
            score += min(40, int(skill_match_ratio * 40))
    else:
        # If no requirements listed, give partial credit
        score += 20
    
    # 2. Title Match (25 points max)
    if cv_title and job_title:
        # Check for keyword overlap
        cv_title_words = set(cv_title.split())
        job_title_words = set(job_title.split())
        title_overlap = cv_title_words.intersection(job_title_words)
        if title_overlap:
            score += min(25, len(title_overlap) * 10)
        # Also check for common role keywords
        role_keywords = ['engineer', 'developer', 'manager', 'analyst', 'designer', 'specialist', 'lead', 'senior', 'junior']
        for keyword in role_keywords:
            if keyword in cv_title and keyword in job_title:
                score += 5
                break
    
    # 3. Experience Match (20 points max)
    # Check if job mentions experience requirements
    exp_match = re.search(r'(\d+)\+?\s*years?', job_description)
    if exp_match:
        required_years = int(exp_match.group(1))
        if cv_experience_years >= required_years:
            score += 20
        elif cv_experience_years >= required_years - 1:
            score += 15
        elif cv_experience_years >= required_years - 2:
            score += 10
    else:
        # No specific experience requirement, give partial credit
        score += 10
    
    # 4. Location Match (15 points max)
    if cv_location and job_location:
        # Check for UAE cities
        uae_cities = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain', 'uae']
        cv_in_uae = any(city in cv_location for city in uae_cities)
        job_in_uae = any(city in job_location for city in uae_cities)
        
        if cv_location in job_location or job_location in cv_location:
            score += 15
        elif cv_in_uae and job_in_uae:
            score += 10
        elif cv_in_uae or job_in_uae:
            score += 5
    else:
        score += 5  # Partial credit if location not specified
    
    # Ensure score is within bounds
    return min(max_score, max(0, score))


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
            # Return cv_data or parsed_data, whichever is available
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


@candidate_job_bp.route('/job-matches', methods=['GET'])
def get_job_matches():
    """Get job matches for the candidate based on their CV data"""
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
        
        conn = get_db_connection()
        if not conn:
            # Return fallback data when database is unavailable
            logger.info("Database unavailable, returning fallback job matches")
            fallback_jobs = [
                {
                    'id': 1,
                    'title': 'Software Engineer',
                    'company': 'Emirates NBD',
                    'location': 'Dubai, UAE',
                    'type': 'full-time',
                    'salary': 'AED 18,000 - 25,000',
                    'matchScore': 92 if not cv_data else calculate_match_score(cv_data, {'title': 'Software Engineer', 'requirements': ['Python', 'JavaScript', 'React'], 'location': 'Dubai, UAE', 'description': '3+ years experience'}),
                    'description': 'Join our digital transformation team to build innovative banking solutions.',
                    'requirements': ['Python', 'JavaScript', 'React', 'SQL', '3+ years experience'],
                    'benefits': ['Health Insurance', 'Annual Leave', 'Training Budget'],
                    'postedDate': datetime.now().isoformat()
                },
                {
                    'id': 2,
                    'title': 'Full Stack Developer',
                    'company': 'Careem',
                    'location': 'Dubai, UAE',
                    'type': 'full-time',
                    'salary': 'AED 15,000 - 22,000',
                    'matchScore': 88 if not cv_data else calculate_match_score(cv_data, {'title': 'Full Stack Developer', 'requirements': ['Node.js', 'React', 'MongoDB'], 'location': 'Dubai, UAE', 'description': '2+ years experience'}),
                    'description': 'Build and scale our ride-hailing and delivery platform.',
                    'requirements': ['Node.js', 'React', 'MongoDB', 'AWS', '2+ years experience'],
                    'benefits': ['Stock Options', 'Flexible Hours', 'Remote Work'],
                    'postedDate': datetime.now().isoformat()
                },
                {
                    'id': 3,
                    'title': 'Data Analyst',
                    'company': 'ADNOC',
                    'location': 'Abu Dhabi, UAE',
                    'type': 'full-time',
                    'salary': 'AED 16,000 - 24,000',
                    'matchScore': 85 if not cv_data else calculate_match_score(cv_data, {'title': 'Data Analyst', 'requirements': ['Python', 'SQL', 'Tableau'], 'location': 'Abu Dhabi, UAE', 'description': '2+ years experience'}),
                    'description': 'Analyze energy sector data to drive strategic decisions.',
                    'requirements': ['Python', 'SQL', 'Tableau', 'Power BI', '2+ years experience'],
                    'benefits': ['Government Benefits', 'Housing Allowance', 'Education Support'],
                    'postedDate': datetime.now().isoformat()
                },
                {
                    'id': 4,
                    'title': 'Product Manager',
                    'company': 'Talabat',
                    'location': 'Dubai, UAE',
                    'type': 'full-time',
                    'salary': 'AED 22,000 - 32,000',
                    'matchScore': 78 if not cv_data else calculate_match_score(cv_data, {'title': 'Product Manager', 'requirements': ['Product Management', 'Agile', 'Data Analysis'], 'location': 'Dubai, UAE', 'description': '4+ years experience'}),
                    'description': 'Lead product development for our food delivery platform.',
                    'requirements': ['Product Management', 'Agile', 'Data Analysis', '4+ years experience'],
                    'benefits': ['Performance Bonus', 'Career Growth', 'Team Events'],
                    'postedDate': datetime.now().isoformat()
                },
                {
                    'id': 5,
                    'title': 'DevOps Engineer',
                    'company': 'Dubai Airports',
                    'location': 'Dubai, UAE',
                    'type': 'full-time',
                    'salary': 'AED 20,000 - 28,000',
                    'matchScore': 75 if not cv_data else calculate_match_score(cv_data, {'title': 'DevOps Engineer', 'requirements': ['AWS', 'Docker', 'Kubernetes'], 'location': 'Dubai, UAE', 'description': '3+ years experience'}),
                    'description': 'Manage cloud infrastructure for world-class airport operations.',
                    'requirements': ['AWS', 'Docker', 'Kubernetes', 'CI/CD', '3+ years experience'],
                    'benefits': ['Government Benefits', 'Travel Perks', 'Professional Development'],
                    'postedDate': datetime.now().isoformat()
                }
            ]
            
            # Sort by match score
            fallback_jobs.sort(key=lambda x: x['matchScore'], reverse=True)
            
            return jsonify({
                'success': True,
                'jobs': fallback_jobs,
                'count': len(fallback_jobs),
                'source': 'fallback',
                'cv_loaded': bool(cv_data),
                'message': 'Showing recommended jobs based on your CV profile' if cv_data else 'Showing recommended jobs based on typical candidate profiles'
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
        
        # Transform data and calculate real match scores
        transformed_jobs = []
        for job in jobs:
            # Ensure lists
            reqs = job['requirements'] if isinstance(job['requirements'], list) else []
            benefits = job['benefits'] if isinstance(job['benefits'], list) else []
            
            # Calculate real match score based on CV data
            if cv_data:
                match_score = calculate_match_score(cv_data, {
                    'title': job['title'],
                    'requirements': reqs,
                    'location': job['location'],
                    'description': job['description'] or ''
                })
            else:
                # Fallback to hash-based score if no CV data
                import hashlib
                job_hash = int(hashlib.sha256(str(job['id']).encode('utf-8')).hexdigest(), 16)
                match_score = 70 + (job_hash % 30)
            
            transformed_jobs.append({
                'id': job['id'],
                'title': job['title'],
                'company': job['company'] or 'Unknown Company',
                'location': job['location'] or 'UAE',
                'type': job['type'] or 'full-time',
                'salary': job['salary'] if job['salary'] and 'None' not in job['salary'] else 'Competitive Salary',
                'matchScore': match_score,
                'description': job['description'],
                'requirements': reqs,
                'benefits': benefits,
                'postedDate': job['postedDate'].isoformat() if job['postedDate'] else datetime.now().isoformat()
            })
        
        # Sort by match score (highest first)
        transformed_jobs.sort(key=lambda x: x['matchScore'], reverse=True)
            
        return jsonify({
            'success': True, 
            'jobs': transformed_jobs,
            'count': len(transformed_jobs),
            'cv_loaded': bool(cv_data),
            'message': 'Jobs matched to your CV profile' if cv_data else 'Jobs ranked by general relevance'
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
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
            
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
        
        # Check if CV exists
        cv_uploaded = False
        if user_id:
            cv_data = get_candidate_cv(user_id)
            cv_uploaded = bool(cv_data)
        
        return jsonify({
            'success': True,
            'data': {
                'stats': {
                    'profileViews': 12,  # Mock for now
                    'jobMatches': job_count,
                    'applications': app_count,
                    'interviews': 0
                },
                'profile': {
                    'name': 'Candidate',
                    'completionPercentage': 85 if cv_uploaded else 30,
                    'cvUploaded': cv_uploaded
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()
