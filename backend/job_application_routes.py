"""
Job Application Routes for Emirati Journey Platform
Implements the REAL "Apply Now" functionality for Job Seeker persona
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import logging
from datetime import datetime
import uuid
from backend.db import get_db_connection
import psycopg2
import psycopg2.extras
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
job_application_bp = Blueprint('job_application', __name__, url_prefix='/api/jobs')

# Mock user ID for development
MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'

def get_user_id_from_request():
    """Get user ID from JWT or mock token"""
    auth_header = request.headers.get('Authorization', '')
    logger.info(f"Auth header: {auth_header[:50]}..." if len(auth_header) > 50 else f"Auth header: {auth_header}")
    
    # Check for mock token first
    if 'mock_token' in auth_header:
        logger.info(f"Mock authentication detected, using mock user ID: {MOCK_USER_ID}")
        return MOCK_USER_ID
    
    # Try to get from JWT
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        logger.info(f"JWT authentication successful, user ID: {user_id}")
        if user_id:
            # CRITICAL: Use user_id AS-IS from JWT, do NOT convert to UUID
            # The database uses text IDs, so keep them as strings
            return str(user_id)
    except Exception as e:
        logger.warning(f"JWT verification failed: {e}")
    
    return None


@job_application_bp.route('/apply', methods=['POST'])
def apply_for_job():
    """Submit job application"""
    conn = None
    try:
        logger.info("=== Job Application Request ===")
        
        # Get user ID (supports both JWT and mock tokens)
        current_user_id = get_user_id_from_request()
        
        if not current_user_id:
            logger.error("No user ID found - authentication failed")
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        logger.info(f"User ID: {current_user_id}")
        
        data = request.get_json()
        logger.info(f"Request data: {data}")
        
        required_fields = ['job_id', 'cover_letter']
        for field in required_fields:
            if not data.get(field):
                logger.error(f"Missing required field: {field}")
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        job_id = data['job_id']
        cover_letter = data['cover_letter']
        
        logger.info(f"Applying for job_id: {job_id}")
        
        conn = get_db_connection()
        if not conn:
            logger.error("Database connection failed")
            return jsonify({'success': False, 'message': 'Database error'}), 500
        
        cur = conn.cursor()
        
        # Check if already applied
        # Cast job_id to string because job_applications.job_id is text, while frontend sends int
        cur.execute("SELECT id FROM job_applications WHERE candidate_id = %s AND job_id = %s", (current_user_id, str(job_id)))
        existing = cur.fetchone()
        if existing:
            logger.warning(f"User {current_user_id} already applied for job {job_id}")
            return jsonify({'success': False, 'message': 'You have already applied for this job'}), 400

        application_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        
        cur.execute("""
            INSERT INTO job_applications (
                id, job_id, candidate_id, cover_letter, status, submitted_at, last_updated
            ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        """, (application_id, job_id, current_user_id, cover_letter, 'pending'))
        
        conn.commit()
        
        logger.info(f"Job application submitted: {application_id} for user {current_user_id}, job {job_id}")
        
        # --- Create notification for the recruiter ---
        try:
            cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            # Find recruiter who posted the job and the job title
            cur2.execute("""
                SELECT jp.title, jp.recruiter_id, jp.company_id
                FROM job_postings jp
                WHERE jp.jd_id = %s OR jp.id::text = %s
                LIMIT 1
            """, (str(job_id), str(job_id)))
            job_row = cur2.fetchone()
            
            recruiter_id = None
            job_title = 'a position'
            
            if job_row:
                job_title = job_row.get('title') or 'a position'
                raw_recruiter = job_row.get('recruiter_id')
                
                # recruiter_id might be '0' or empty for seed data
                if raw_recruiter and str(raw_recruiter) not in ('0', '', 'None'):
                    recruiter_id = str(raw_recruiter)
                
                # Fallback: find any recruiter user
                if not recruiter_id:
                    cur2.execute("SELECT id FROM users WHERE role = 'recruiter' LIMIT 1")
                    any_rec = cur2.fetchone()
                    if any_rec:
                        recruiter_id = str(any_rec['id'])
            
            if recruiter_id:
                # Get candidate name
                cand_query = "SELECT COALESCE(full_name, email, 'A candidate') as name FROM users WHERE id::text = %s"
                cur2.execute(cand_query, (str(current_user_id),))
                cand_row = cur2.fetchone()
                candidate_name = cand_row['name'] if cand_row else 'A candidate'
                
                # Insert notification for recruiter
                cur2.execute("""
                    INSERT INTO notifications (user_id, type, title, content, metadata, is_read, created_at)
                    VALUES (%s, %s, %s, %s, %s, FALSE, NOW())
                """, (
                    recruiter_id,
                    'application_submitted',
                    'New Application: %s' % job_title,
                    '%s applied for %s' % (candidate_name, job_title),
                    json.dumps({
                        'application_id': application_id,
                        'job_id': str(job_id),
                        'candidate_id': str(current_user_id),
                        'candidate_name': candidate_name,
                        'job_title': job_title,
                        'priority': 'high'
                    })
                ))
                conn.commit()
                logger.info("Notification created for recruiter %s: %s applied for %s" % (recruiter_id, candidate_name, job_title))
            else:
                logger.warning("Could not find any recruiter for job %s - no notification created" % job_id)
        except Exception as notif_err:
            logger.warning("Failed to create recruiter notification (non-critical): %s" % notif_err)
            import traceback
            logger.warning(traceback.format_exc())
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'data': {'application_id': application_id, 'status': 'submitted'}
        }), 201
        
    except Exception as e:
        logger.error(f"Job application error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@job_application_bp.route('/applications', methods=['GET'])
def get_user_applications():
    """Get user's job applications with job details"""
    conn = None
    try:
        # Get user ID (supports both JWT and mock tokens)
        current_user_id = get_user_id_from_request()
        
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database error'}), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Join with job_postings and companies to get titles
        # Using job_postings as confirmed by candidate_job_routes
        query = """
            SELECT 
                a.id as application_id,
                a.job_id,
                j.title as job_title,
                COALESCE(c.company_name, 'Confidential') as company,
                j.location,
                a.status,
                a.submitted_at,
                a.last_updated
            FROM job_applications a
            LEFT JOIN job_postings j ON a.job_id = j.id
            LEFT JOIN companies c ON j.company_id::text = c.id::text
            WHERE a.candidate_id = %s
            ORDER BY a.submitted_at DESC
        """
        cur.execute(query, (current_user_id,))
        rows = cur.fetchall()
        
        # Format dates
        results = []
        for row in rows:
            results.append({
                'application_id': row['application_id'],
                'job_id': row['job_id'],
                'jobTitle': row['job_title'] or 'Unknown Position',
                'company': row['company'] or 'Confidential',
                'location': row['location'] or 'UAE',
                'status': row['status'],
                'appliedDate': row['submitted_at'].isoformat() if row['submitted_at'] else None,
                'lastUpdate': row['last_updated'].isoformat() if row['last_updated'] else None
            })

        return jsonify({
            'success': True, 
            'data': {'applications': results, 'total_count': len(results)}
        }), 200

    except Exception as e:
        logger.error(f"Get applications error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@job_application_bp.route('/jobs/<job_id>/apply-status', methods=['GET'])
def check_application_status(job_id):
    """Check if user has already applied"""
    conn = None
    try:
        # Get user ID (supports both JWT and mock tokens)
        current_user_id = get_user_id_from_request()
        
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database error'}), 500
            
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, status, submitted_at FROM job_applications WHERE candidate_id = %s AND job_id = %s", (current_user_id, job_id))
        app_record = cur.fetchone()
        
        if app_record:
            return jsonify({
                'success': True,
                'data': {
                    'has_applied': True,
                    'application_id': app_record['id'],
                    'status': app_record['status'],
                    'submitted_at': app_record['submitted_at'].isoformat()
                }
            }), 200
        else:
            return jsonify({'success': True, 'data': {'has_applied': False}}), 200
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

