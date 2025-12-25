"""
Job Application Routes for Emirati Journey Platform
Implements the REAL "Apply Now" functionality for Job Seeker persona
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime
import uuid
import os
import psycopg2
import psycopg2.extras
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
job_application_bp = Blueprint('job_application', __name__, url_prefix='/api/jobs')

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

@job_application_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_for_job():
    """Submit job application"""
    conn = None
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['job_id', 'cover_letter']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        job_id = data['job_id']
        cover_letter = data['cover_letter']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database error'}), 500
        
        cur = conn.cursor()
        
        # Check if already applied
        cur.execute("SELECT id FROM job_applications WHERE candidate_id = %s AND job_id = %s", (current_user_id, job_id))
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'You have already applied for this job'}), 400

        application_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        
        cur.execute("""
            INSERT INTO job_applications (
                id, job_id, candidate_id, cover_letter, status, submitted_at, last_updated
            ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        """, (application_id, job_id, current_user_id, cover_letter, 'pending'))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'data': {'application_id': application_id, 'status': 'submitted'}
        }), 201
        
    except Exception as e:
        logger.error(f"Job application error: {str(e)}")
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@job_application_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_user_applications():
    """Get user's job applications with job details"""
    conn = None
    try:
        current_user_id = get_jwt_identity()
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
            LEFT JOIN job_postings j ON a.job_id = j.jd_id::text
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
@jwt_required()
def check_application_status(job_id):
    """Check if user has already applied"""
    conn = None
    try:
        current_user_id = get_jwt_identity()
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

