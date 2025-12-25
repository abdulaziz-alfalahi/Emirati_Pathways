
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os
import logging
from datetime import datetime

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

@candidate_job_bp.route('/job-matches', methods=['GET'])
# @jwt_required() # Optional: Re-enable if you want to force auth, but for debugging keeping it open or using optional
def get_job_matches():
    """Get job matches for the candidate (currently returns all published jobs)"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
            
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
        
        # Transform data to match frontend expectations
        transformed_jobs = []
        for job in jobs:
            # Calculate a mock match score for now (random or based on simple logic)
            # In a real app, this would use the AI matching engine
            # Calculate a deterministic mock score based on Job ID
            # This ensures the score is stable (doesn't change on refresh) but looks varied
            import hashlib
            job_hash = int(hashlib.sha256(str(job['id']).encode('utf-8')).hexdigest(), 16)
            match_score = 70 + (job_hash % 30) # Score between 70 and 99
            
            # Ensure lists
            reqs = job['requirements'] if isinstance(job['requirements'], list) else []
            benefits = job['benefits'] if isinstance(job['benefits'], list) else []
            
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
            
        return jsonify({
            'success': True, 
            'jobs': transformed_jobs,
            'count': len(transformed_jobs)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching job matches: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
@candidate_job_bp.route('/dashboard/stats', methods=['GET'])
# @jwt_required()
def get_dashboard_stats():
    """Get candidate dashboard statistics"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
            
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Count published jobs
        cur.execute("SELECT COUNT(*) as count FROM job_postings WHERE status = 'published' OR status = 'active'")
        job_count = cur.fetchone()['count']
        
        # Count applications (mock or real if table exists)
        # For now, simplistic count
        # cur.execute("SELECT COUNT(*) as count FROM job_applications WHERE candidate_id = %s", (get_jwt_identity(),))
        app_count = 0 # Placeholder
        
        return jsonify({
            'success': True,
            'data': {
                'stats': {
                    'profileViews': 12, # Mock
                    'jobMatches': job_count,
                    'applications': app_count,
                    'interviews': 0
                },
                'profile': {
                    'name': 'Khalid Al-Mazrouei', # Mock or fetch
                    'completionPercentage': 85,
                    'cvUploaded': True
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()
