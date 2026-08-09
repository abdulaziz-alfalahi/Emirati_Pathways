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


def _retired(replacement):
    """410 for a handler superseded during the /api/v1 canonicalization.

    The route stays registered on purpose (matching the OTP retirement in
    nafis_talent_routes): a forgotten caller gets an actionable message naming
    the endpoint that replaced this one, rather than an ambiguous 404.
    See docs/api_v1_canonicalization.md.
    """
    return jsonify({
        'success': False,
        'message': f'This endpoint has been retired. Use {replacement} instead.',
        'replacement': replacement,
    }), 410





def _migrate_job_applications_table():
    """
    Migrate job_applications table columns from INTEGER to TEXT.
    
    The table was originally created by jobs_api.py with:
        candidate_id INTEGER, job_id INTEGER, id SERIAL
    But the auth system uses UUID strings for user IDs (e.g. '47dcb02a-...'),
    and application IDs are text ('APP-XXXX'). This migration fixes the mismatch.
    """
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return
        cur = conn.cursor()
        
        # Check current column type for candidate_id
        cur.execute("""
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'job_applications' AND column_name = 'candidate_id'
        """)
        result = cur.fetchone()
        
        if result and result[0] == 'integer':
            logger.info("🔄 Migrating job_applications columns from INTEGER to TEXT...")
            
            # Drop the SERIAL default on id if it exists (SERIAL creates a sequence)
            try:
                cur.execute("ALTER TABLE job_applications ALTER COLUMN id DROP DEFAULT")
            except Exception:
                conn.rollback()
            
            # Convert columns to TEXT
            cur.execute("""
                ALTER TABLE job_applications 
                    ALTER COLUMN id TYPE TEXT USING id::text,
                    ALTER COLUMN candidate_id TYPE TEXT USING candidate_id::text,
                    ALTER COLUMN job_id TYPE TEXT USING job_id::text
            """)
            conn.commit()
            logger.info("✅ job_applications columns migrated to TEXT successfully")
        else:
            logger.debug("job_applications columns already TEXT, no migration needed")
            
    except Exception as e:
        logger.warning(f"job_applications migration check: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass

# Run migration on import
_migrate_job_applications_table()


def get_user_id_from_request():
    """Get user ID from JWT token"""
    auth_header = request.headers.get('Authorization', '')
    logger.info(f"Auth header: {auth_header[:50]}..." if len(auth_header) > 50 else f"Auth header: {auth_header}")
    
    # Get from JWT
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
    """RETIRED — superseded by POST /api/applications/apply (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('POST /api/applications/apply')


@job_application_bp.route('/applications', methods=['GET'])
def get_user_applications():
    """RETIRED — superseded by GET /api/applications/my-applications (see
    docs/api_v1_canonicalization.md). Returns 410."""
    return _retired('GET /api/applications/my-applications')


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

