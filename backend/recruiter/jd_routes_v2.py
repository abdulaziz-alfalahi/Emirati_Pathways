#!/usr/bin/env python3
"""
Job Description Builder API Routes
Emirati Journey Platform - Recruiter Services

Provides wizard-based JD creation with AI candidate matching.
"""

from flask import Blueprint, request, jsonify
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
import psycopg2
import psycopg2.extras

from .jd_builder_engine import get_jd_builder_engine
from .ai_candidate_matching_final import get_ai_matching_engine_final as get_ai_matching_engine
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("!!! DEBUG: LOADING RECRUITER/JD_ROUTES_V2.PY !!!", flush=True)

# Create Blueprint
jd_bp = Blueprint('jd_routes_v2', __name__, url_prefix='/api/recruiter/jd')

# Initialize components
jd_engine = get_jd_builder_engine()
ai_matching = get_ai_matching_engine()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)


def _get_jd_from_db(jd_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve JD from database and convert to JD engine format
    
    Returns:
        JD data in engine format, or None if not found
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT * FROM job_postings WHERE jd_id = %s
        """, (jd_id,))
        
        jd = cur.fetchone()
        cur.close()
        conn.close()
        
        if not jd:
            return None
        
        # Convert database record to JD engine format
        jd_dict = dict(jd)
        
        # Parse JSON fields (handle both string and object formats)
        def parse_json_field(field_value, default_value):
            if not field_value:
                return default_value
            if isinstance(field_value, str):
                try:
                    return json.loads(field_value)
                except json.JSONDecodeError:
                    return default_value
            return field_value

        requirements = parse_json_field(jd_dict.get('requirements'), [])
        responsibilities = parse_json_field(jd_dict.get('responsibilities'), [])
        benefits = parse_json_field(jd_dict.get('benefits'), [])
        compensation = parse_json_field(jd_dict.get('compensation'), {})
        application_process = parse_json_field(jd_dict.get('application_process'), {})
        metadata = parse_json_field(jd_dict.get('metadata'), {})
        
        # Build basic_info from database columns
        basic_info = {
            'title': jd_dict.get('title', ''),
            'title_arabic': jd_dict.get('title_arabic'),
            'department': jd_dict.get('department', ''),
            'job_type': jd_dict.get('job_type', 'full_time'),
            'job_level': jd_dict.get('job_level', 'mid'),
            'emirate': jd_dict.get('emirate', ''),
            'city': jd_dict.get('city', ''),
            'remote_option': jd_dict.get('remote_option', False)
        }
        
        # Build JD data structure expected by engine
        jd_data = {
            'metadata': {
                'jd_id': jd_id,
                'recruiter_id': jd_dict.get('recruiter_id', ''),
                'company_id': jd_dict.get('company_id', ''),
                'status': jd_dict.get('status', 'draft'),
                'completion_score': metadata.get('completion_score', 0),
                'created_at': jd_dict.get('created_at').isoformat() if jd_dict.get('created_at') else datetime.now().isoformat(),
                'last_modified': jd_dict.get('updated_at').isoformat() if jd_dict.get('updated_at') else datetime.now().isoformat(),
                'current_step': metadata.get('current_step', 'basic_info'),
                **metadata  # Include any other metadata fields
            },
            'basic_info': basic_info,
            'description': jd_dict.get('description', ''),
            'description_arabic': jd_dict.get('description_arabic', ''),
            'requirements': requirements,
            'responsibilities': responsibilities,
            'benefits': benefits,
            'compensation': compensation,
            'application_process': application_process
        }
        
        return jd_data
        
    except Exception as e:
        logger.error(f"Error retrieving JD {jd_id} from database: {str(e)}")
        return None


def _save_jd_to_db(jd_id: str, jd_data: Dict[str, Any], status: str = 'draft') -> bool:
    """
    Save JD data to database
    
    Args:
        jd_id: Job description ID
        jd_data: JD data in engine format
        status: Status (draft, published, etc.)
    
    Returns:
        True if successful, False otherwise
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Ensure table exists (only create if it doesn't exist, don't drop)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS job_postings (
                id SERIAL PRIMARY KEY,
                jd_id VARCHAR(100) UNIQUE NOT NULL,
                recruiter_id VARCHAR(100) NOT NULL,
                company_id VARCHAR(100) NOT NULL,
                title VARCHAR(500) NOT NULL,
                title_arabic VARCHAR(500),
                department VARCHAR(200),
                job_type VARCHAR(50),
                job_level VARCHAR(50),
                emirate VARCHAR(100),
                city VARCHAR(100),
                remote_option BOOLEAN DEFAULT FALSE,
                description TEXT,
                description_arabic TEXT,
                requirements JSONB,
                responsibilities JSONB,
                benefits JSONB,
                compensation JSONB,
                application_process JSONB,
                metadata JSONB,
                status VARCHAR(50) DEFAULT 'draft',
                views_count INTEGER DEFAULT 0,
                applications_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                published_at TIMESTAMP,
                closed_at TIMESTAMP
            )
        """)
        conn.commit()  # Commit table creation before using it
        
        # Extract data for database columns
        basic_info = jd_data.get('basic_info', {})
        metadata = jd_data.get('metadata', {})
        
        # Get recruiter_id and company_id from metadata
        recruiter_id = metadata.get('recruiter_id', 'unknown')
        company_id = metadata.get('company_id', 'unknown')
        
        # Check if JD already exists
        cur.execute("SELECT id FROM job_postings WHERE jd_id = %s", (jd_id,))
        existing = cur.fetchone()
        
        if existing:
            # Update existing JD
            cur.execute("""
                UPDATE job_postings SET
                    title = %s,
                    title_arabic = %s,
                    department = %s,
                    job_type = %s,
                    job_level = %s,
                    emirate = %s,
                    city = %s,
                    remote_option = %s,
                    description = %s,
                    description_arabic = %s,
                    requirements = %s,
                    responsibilities = %s,
                    benefits = %s,
                    compensation = %s,
                    application_process = %s,
                    metadata = %s,
                    status = %s,
                    created_by = %s,
                    updated_at = CURRENT_TIMESTAMP,
                    published_at = CASE WHEN %s = 'published' AND published_at IS NULL 
                                       THEN CURRENT_TIMESTAMP 
                                       ELSE published_at END
                WHERE jd_id = %s
            """, (
                basic_info.get('title') or 'Untitled',
                basic_info.get('title_arabic', ''),
                basic_info.get('department', ''),
                basic_info.get('job_type', 'full_time'),
                basic_info.get('job_level', 'mid'),
                basic_info.get('emirate', ''),
                basic_info.get('city', ''),
                basic_info.get('remote_option', False),
                jd_data.get('description', ''),
                jd_data.get('description_arabic', ''),
                json.dumps(jd_data.get('requirements', [])),
                json.dumps(jd_data.get('responsibilities', [])),
                json.dumps(jd_data.get('benefits', [])),
                json.dumps(jd_data.get('compensation', {})),
                json.dumps(jd_data.get('application_process', {})),
                json.dumps(metadata),
                status,
                recruiter_id, # Ensure created_by is set/updated
                status,
                jd_id
            ))
            logger.info(f"Updated JD {jd_id} in database with status: {status}")
        else:
            # Insert new JD
            cur.execute("""
                INSERT INTO job_postings (
                    jd_id, recruiter_id, company_id, created_by,
                    title, title_arabic, department, job_type, job_level,
                    emirate, city, remote_option,
                    description, description_arabic,
                    requirements, responsibilities, benefits,
                    compensation, application_process, metadata,
                    status, published_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    CASE WHEN %s = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END
                )
            """, (
                jd_id,
                recruiter_id,
                company_id,
                recruiter_id,  # Use recruiter_id as created_by
                basic_info.get('title') or 'Untitled',
                basic_info.get('title_arabic', ''),
                basic_info.get('department', ''),
                basic_info.get('job_type', 'full_time'),
                basic_info.get('job_level', 'mid'),
                basic_info.get('emirate', ''),
                basic_info.get('city', ''),
                basic_info.get('remote_option', False),
                jd_data.get('description', ''),
                jd_data.get('description_arabic', ''),
                json.dumps(jd_data.get('requirements', [])),
                json.dumps(jd_data.get('responsibilities', [])),
                json.dumps(jd_data.get('benefits', [])),
                json.dumps(jd_data.get('compensation', {})),
                json.dumps(jd_data.get('application_process', {})),
                json.dumps(metadata),
                status,
                status
            ))
            logger.info(f"Inserted new JD {jd_id} into database with status: {status}")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Error saving JD {jd_id} to database: {str(e)}")
        if conn:
            conn.rollback()
        return False


@jd_bp.route('/health', methods=['GET'])
def jd_health():
    raise Exception("!!! EXCEPTION: HEALTH CHECK HIT !!!")
    """JD Builder health check"""
    try:
        return jsonify({
            'status': 'healthy',
            'service': 'JD Builder',
            'version': '1.0.0',
            'features': {
                'wizard_creation': True,
                'ai_description_generation': True,
                'ai_candidate_matching': True,
                'completion_scoring': True,
                'employment_status_filtering': True,
                'bilingual_support': True
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"JD health check failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@jd_bp.route('/create', methods=['POST'])
def create_jd():
    """Create a new job description"""
    try:
        data = request.get_json()
        
        # Validate required fields
        recruiter_id = data.get('recruiter_id')
        company_id = data.get('company_id')
        
        if not recruiter_id or not company_id:
            return jsonify({'error': 'recruiter_id and company_id are required'}), 400
        
        # Get optional parameters
        template = data.get('template', 'standard')
        
        # Create JD
        jd_data = jd_engine.create_jd(recruiter_id, company_id, template)
        
        # Store in database (placeholder - implement actual DB storage)
        jd_id = jd_data['metadata']['jd_id']
        
        logger.info(f"Created JD {jd_id} for recruiter {recruiter_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'metadata': jd_data['metadata'],
            'current_step': jd_data['metadata']['current_step']
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating JD: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/list', methods=['GET'])
def list_jds():
    """
    List all job descriptions with optional filters
    
    Query parameters:
    - recruiter_id: Filter by recruiter
    - company_id: Filter by company
    - status: Filter by status (draft, published, closed)
    - limit: Number of results (default 50)
    - offset: Pagination offset (default 0)
    """
    try:
        # Check for mock token (development mode)
        auth_header = request.headers.get('Authorization', '')
        is_mock_token = auth_header and 'mock_token' in auth_header
        
        current_user_id = None
        if is_mock_token:
            mock_token = auth_header.replace('Bearer ', '').strip()
            user_id = mock_token.replace('mock_token_', '')
            logger.info(f"Mock token detected - User ID: {user_id}, Allowing access for development")
            current_user_id = user_id
        else:
            # Fallback to real JWT if configured and valid
            try:
                from flask_jwt_extended import verify_jwt_in_request
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
            except Exception as e:
                logger.warning(f"JWT verification failed: {e}")
                pass

        recruiter_id = request.args.get('recruiter_id')
        company_id = request.args.get('company_id')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # If authenticated but no filters provided, try to filter by current user's company
        if current_user_id and not recruiter_id and not company_id:
             try:
                # Get company ID for the user
                cur.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
                row = cur.fetchone()
                
                if not row or not row.get('company_id'):
                    # Try to find company via job_postings if no profile (fallback)
                    cur.execute("SELECT company_id FROM job_postings WHERE recruiter_id = %s LIMIT 1", (current_user_id,))
                    row = cur.fetchone()
                    
                if row and row.get('company_id'):
                     company_id = row['company_id']
                     logger.info(f"Auto-detected company_id {company_id} for user {current_user_id}")
                     
                with open("debug_list_jds.log", "a") as f:
                    f.write(f"User: {current_user_id}, Detected Company: {company_id}\n")
             except Exception as e:
                 logger.error(f"Error looking up company for user {current_user_id}: {e}")
                 with open("debug_list_jds.log", "a") as f:
                    f.write(f"Error looking up company: {e}\n")

        # Build query with filters
        query = "SELECT * FROM job_postings WHERE 1=1"
        params = []
        
        if recruiter_id:
            query += " AND recruiter_id = %s"
            params.append(recruiter_id)
        
        if company_id:
            if current_user_id:
                query += " AND (company_id = %s OR created_by = %s)"
                params.extend([company_id, current_user_id])
            else:
                query += " AND company_id = %s"
                params.append(company_id)
        elif current_user_id:
            # Fallback if no company ID found
            query += " AND created_by = %s"
            params.append(current_user_id)
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cur.execute(query, params)
        jds = cur.fetchall()
        
        # Convert to list of dicts
        jd_list = []
        for jd in jds:
            jd_dict = dict(jd)
            # Ensure JSON fields are parsed
            for field in ['requirements', 'responsibilities', 'benefits', 'compensation', 'application_process', 'metadata']:
                 if isinstance(jd_dict.get(field), str):
                      try:
                          jd_dict[field] = json.loads(jd_dict[field])
                      except:
                          pass # Keep as string or whatever it is
            
            jd_list.append(jd_dict)
        
        cur.close()
        conn.close()
        
        return jsonify({
            'job_descriptions': jd_list,
            'count': len(jd_list),
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing JDs: {e}")
        return jsonify({'error': str(e)}), 500

@jd_bp.route('/<jd_id>', methods=['GET'])
def get_jd(jd_id):
    """Get full job description details"""
    try:
        jd_data = _get_jd_from_db(jd_id)
        
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
            
        return jsonify({
            'success': True,
            'jd': jd_data
        })
        
    except Exception as e:
        logger.error(f"Error retrieving JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500




            
@jd_bp.route('/<jd_id>/basic-info', methods=['PUT'])
def update_basic_info(jd_id):
    """Update basic information (Step 1 of wizard)"""
    try:
        data = request.get_json()
        basic_info = data.get('basic_info', {})
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            # If JD doesn't exist, create a new one with basic structure
            jd_data = {
                'metadata': {
                    'jd_id': jd_id,
                    'recruiter_id': data.get('recruiter_id', 'unknown'),
                    'company_id': data.get('company_id', 'unknown'),
                    'status': 'draft',
                    'completion_score': 0,
                    'created_at': datetime.now().isoformat(),
                    'last_modified': datetime.now().isoformat(),
                    'current_step': 'basic_info'
                },
                'basic_info': {},
                'description': '',
                'description_arabic': '',
                'requirements': [],
                'responsibilities': [],
                'benefits': [],
                'compensation': {},
                'application_process': {}
            }
        
        # Update JD
        updated_jd = jd_engine.update_basic_info(jd_data, basic_info)
        
        # Save to database
        status = updated_jd['metadata'].get('status', 'draft')
        if not _save_jd_to_db(jd_id, updated_jd, status):
            return jsonify({'error': 'Failed to save JD to database'}), 500
        
        logger.info(f"Updated basic info for JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'completion_score': updated_jd['metadata']['completion_score'],
            'current_step': updated_jd['metadata']['current_step'],
            'last_modified': updated_jd['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error updating basic info for JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/description', methods=['PUT'])
def update_description(jd_id):
    """Update job description (Step 2 of wizard)"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        description_arabic = data.get('description_arabic')
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Update JD
        updated_jd = jd_engine.update_description(jd_data, description, description_arabic)
        
        # Save to database
        status = updated_jd['metadata'].get('status', 'draft')
        if not _save_jd_to_db(jd_id, updated_jd, status):
            return jsonify({'error': 'Failed to save JD to database'}), 500
        
        logger.info(f"Updated description for JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'completion_score': updated_jd['metadata']['completion_score'],
            'current_step': updated_jd['metadata']['current_step'],
            'last_modified': updated_jd['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error updating description for JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/requirements', methods=['POST'])
def add_requirement(jd_id):
    """Add job requirement (Step 3 of wizard)"""
    try:
        data = request.get_json()
        requirement = data.get('requirement', {})
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Add requirement
        updated_jd = jd_engine.add_requirement(jd_data, requirement)
        
        # Save to database
        status = updated_jd['metadata'].get('status', 'draft')
        if not _save_jd_to_db(jd_id, updated_jd, status):
            return jsonify({'error': 'Failed to save JD to database'}), 500
        
        logger.info(f"Added requirement to JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'completion_score': updated_jd['metadata']['completion_score'],
            'last_modified': updated_jd['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error adding requirement to JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/responsibilities', methods=['POST'])
def add_responsibility(jd_id):
    """Add job responsibility (Step 4 of wizard)"""
    try:
        data = request.get_json()
        responsibility = data.get('responsibility', {})
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Add responsibility
        updated_jd = jd_engine.add_responsibility(jd_data, responsibility)
        
        # Save to database
        status = updated_jd['metadata'].get('status', 'draft')
        if not _save_jd_to_db(jd_id, updated_jd, status):
            return jsonify({'error': 'Failed to save JD to database'}), 500
        
        logger.info(f"Added responsibility to JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'completion_score': updated_jd['metadata']['completion_score'],
            'last_modified': updated_jd['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error adding responsibility to JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/benefits', methods=['POST'])
def add_benefit(jd_id):
    """Add job benefit (Step 5 of wizard)"""
    try:
        data = request.get_json()
        benefit = data.get('benefit', {})
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Add benefit
        updated_jd = jd_engine.add_benefit(jd_data, benefit)
        
        # Save to database
        status = updated_jd['metadata'].get('status', 'draft')
        if not _save_jd_to_db(jd_id, updated_jd, status):
            return jsonify({'error': 'Failed to save JD to database'}), 500
        
        logger.info(f"Added benefit to JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'completion_score': updated_jd['metadata']['completion_score'],
            'last_modified': updated_jd['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error adding benefit to JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/compensation', methods=['PUT'])
def update_compensation(jd_id):
    """Update compensation information (Step 6 of wizard)"""
    try:
        data = request.get_json()
        compensation = data.get('compensation', {})
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Update compensation
        updated_jd = jd_engine.update_compensation(jd_data, compensation)
        
        # Save to database
        status = updated_jd['metadata'].get('status', 'draft')
        if not _save_jd_to_db(jd_id, updated_jd, status):
            return jsonify({'error': 'Failed to save JD to database'}), 500
        
        logger.info(f"Updated compensation for JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'completion_score': updated_jd['metadata']['completion_score'],
            'last_modified': updated_jd['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error updating compensation for JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/generate-description', methods=['POST'])
def generate_description(jd_id):
    """Generate AI-powered job description"""
    try:
        data = request.get_json()
        industry = data.get('industry')
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Generate description
        generated_description = jd_engine.generate_description_ai(jd_data, industry)
        
        logger.info(f"Generated AI description for JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'generated_description': generated_description
        })
        
    except Exception as e:
        logger.error(f"Error generating description for JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/completion-score', methods=['GET'])
def get_completion_score(jd_id):
    """Get JD completion score and recommendations"""
    try:
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        score = jd_engine._calculate_completion_score(jd_data)
        recommendations = jd_engine.get_completion_recommendations(jd_data)
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'completion_score': score,
            'recommendations': recommendations
        })
        
    except Exception as e:
        logger.error(f"Error getting completion score for JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/match-candidates', methods=['POST'])
def match_candidates(jd_id):
    """
    Match top 10 candidates to job description with employment status filtering.
    This is called after JD completion to find suitable candidates before publishing.
    """
    try:
        data = request.get_json()
        
        # Get employment status filter
        employment_status_filter = data.get('employment_status_filter')  # 'employed', 'job_seeker', 'open_to_opportunities', or None
        top_n = data.get('top_n', 10)
        
        with open(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\routes_debug.txt', 'a') as f:
             f.write(f"\n--- Request for JD {jd_id} ---\n")
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({
                'success': False,
                'error': 'Job description not found',
                'top_matches': []
            }), 404
        
        # Get candidates from database
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 1. Fetch APPLICANTS (People who explicitly applied)
        # We need to map them to the same structure as generic candidates
        cur.execute("""
            SELECT 
                u.id as candidate_id,
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.emirate,
                u.nationality,
                u.is_uae_national,
                u.education_level,
                u.experience_years,
                u.job_title as current_position,
                u.company as current_company,
                'applicant' as employment_status, -- Special status for applicants
                u.skills,
                u.preferred_salary_min,
                u.preferred_salary_max,
                NULL as cv_url,
                NULL as linkedin_url,
                a.status as application_status,
                a.submitted_at
            FROM job_applications a
            JOIN users u ON a.candidate_id = u.id::text
            WHERE a.job_id = %s
        """, (jd_id,))
        applicants = [dict(c) for c in cur.fetchall()]
        
        # Get applicant IDs to exclude from general search
        applicant_ids = [str(a['candidate_id']) for a in applicants]
        
        # 2. Fetch PASSIVE MATCHES (General pool)
        # Build query based on employment status filter
        query = """
            SELECT 
                id as candidate_id,
                id as user_id,
                first_name,
                last_name,
                email,
                phone,
                emirate,
                nationality,
                is_uae_national,
                education_level,
                experience_years,
                job_title as current_position,
                company as current_company,
                'open_to_opportunities' as employment_status,
                skills,
                preferred_salary_min,
                preferred_salary_max,
                NULL as cv_url,
                NULL as linkedin_url
            FROM users
            WHERE role = 'candidate'
                AND is_active = true
        """
        
        params = []
        
        # Exclude already applied
        if applicant_ids:
            query += " AND id NOT IN %s"
            params.append(tuple(applicant_ids))
        
        # Add employment status filter if specified
        if employment_status_filter:
            if employment_status_filter.lower() == 'employed':
                query += " AND employment_status IN ('employed', 'currently_employed')"
            elif employment_status_filter.lower() == 'job_seeker':
                query += " AND employment_status IN ('job_seeker', 'unemployed', 'actively_looking')"
            elif employment_status_filter.lower() == 'open_to_opportunities':
                query += " AND employment_status IN ('open_to_opportunities', 'passive', 'open')"
        
        query += " LIMIT 1000"  # Limit to reasonable number for matching
        
        cur.execute(query, tuple(params))
        passive_candidates = [dict(c) for c in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        # Combine lists (Applicants First)
        # Clean skills for both lists
        for c in applicants + passive_candidates:
             if isinstance(c.get('skills'), str):
                  c['skills'] = [s.strip().strip('"') for s in c['skills'].replace('{','').replace('}','').split(',') if s.strip()]
        
        print(f"DEBUG_PRINT: Matching request for JD {jd_id}", flush=True)
        
        with open(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\routes_debug.txt', 'a') as f:
             f.write(f"Applicants: {len(applicants)}\n")
             f.write(f"Passive: {len(passive_candidates)}\n")
             f.write(f"Total: {len(applicants) + len(passive_candidates)}\n")
        
        print(f"DEBUG_PRINT: Found {len(applicants)} applicants", flush=True)
        
        logger.info(f"DEBUG: Found {len(applicants)} applicants")
        logger.info(f"DEBUG: Found {len(passive_candidates)} passive candidates")
        logger.info(f"DEBUG: Total candidates to match: {len(applicants + passive_candidates)}")
        
        logger.info(f"Matching {len(applicants)} applicants + {len(passive_candidates)} passive candidates for JD {jd_id}")
        
        # Match candidates (Both groups)
        # We increase top_n to ensure we capture applicants even if they have lower scores
        # We will filter manually after matching
        match_search_limit = max(50, len(applicants) + top_n)
        
        match_result = ai_matching.match_candidates_for_job(
            jd_data,
            applicants + passive_candidates, # Pass combined list
            employment_status_filter,
            match_search_limit # Pass larger limit to AI
        )
        
        # Post-process: Ensure applicants are INCLUDED and prioritized
        final_matches = []
        matches_from_ai = match_result.get('top_matches', [])
        
        # 1. Separate AI results into Applicants and Passive
        ai_applicants = []
        ai_passive = []
        
        applicant_ids_set = set(str(a['candidate_id']) for a in applicants)
        
        for match in matches_from_ai:
            cand_id = str(match['candidate'].get('candidate_id') or match['candidate'].get('user_id'))
            
            if cand_id in applicant_ids_set:
                # Enrich with application status
                applicant_data = next((a for a in applicants if str(a['candidate_id']) == cand_id), None)
                if applicant_data:
                    match['candidate']['status'] = applicant_data['application_status']
                    match['candidate']['is_applicant'] = True
                    match['candidate']['application_date'] = applicant_data.get('submitted_at')
                ai_applicants.append(match)
            else:
                ai_passive.append(match)
                
        # 2. Check for any applicants that were missed by AI (because of limit)
        # If any applicants are missing from ai_applicants, we should ideally score them now.
        # But for now, we'll assume the increased limit caught them. 
        # If not, we could force-add them with 0 score, but that's edge case.
        
        # 3. Construct Final List: All Applicants + Top Passive
        final_matches.extend(ai_applicants)
        
        # Fill remaining slots with passive candidates up to top_n (or just include them all if user wants)
        # We'll allow returning more than top_n if they are applicants
        remaining_slots = max(0, top_n - len(final_matches))
        final_matches.extend(ai_passive[:remaining_slots]) # Add top passive candidates to fill quota
        
        # If we have fewer than top_n total, and more passive available, add them
        if len(final_matches) < top_n and len(ai_passive) > remaining_slots:
             extra_needed = top_n - len(final_matches)
             final_matches.extend(ai_passive[remaining_slots:remaining_slots+extra_needed])

        logger.info(f"DEBUG: returning {len(final_matches)} matches ({len(ai_applicants)} applicants)")
        
        matches = final_matches
        
        # Log payload
        with open(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\routes_debug.txt', 'a') as f:
             f.write(f"Matches return count: {len(matches)}\n")
             if matches:
                 try:
                     import json
                     sample = matches[0]
                     f.write(f"Sample Match Payload: {json.dumps(sample, default=str)}\n")
                 except Exception as err:
                     f.write(f"Error logging sample: {err}\n")

        return jsonify({
            'success': True,
            'top_matches': matches
        })
        
    except Exception as e:
        logger.error(f"Error matching candidates for JD {jd_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'top_matches': []
        }), 500


@jd_bp.route('/shortlist/add', methods=['POST'])
def add_to_shortlist():
    """Add a candidate to the shortlist for a JD"""
    try:
        data = request.get_json()
        jd_id = data.get('jd_id')
        candidate_id = data.get('candidate_id')
        recruiter_id = data.get('recruiter_id')
        match_score = data.get('match_score')
        match_details = data.get('match_details')
        notes = data.get('notes')

        if not jd_id or not candidate_id:
            return jsonify({'error': 'jd_id and candidate_id are required'}), 400

        # TODO: Implement actual database storage for shortlist
        # For now, we'll return success to unblock the frontend
        
        logger.info(f"Added candidate {candidate_id} to shortlist for JD {jd_id}")
        
        return jsonify({
            'success': True,
            'message': 'Candidate added to shortlist',
            'shortlist_id': f"sl_{jd_id}_{candidate_id}" 
        })

    except Exception as e:
        logger.error(f"Error adding to shortlist: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/shortlist/<jd_id>', methods=['GET'])
def get_shortlist(jd_id):
    """Get shortlisted candidates for a JD"""
    try:
        # TODO: Implement actual database retrieval
        # For now, return empty list or mock data
        
        return jsonify({
            'success': True,
            'shortlist': [] # Return empty list so frontend doesn't error
        })

    except Exception as e:
        logger.error(f"Error retrieving shortlist: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/validate', methods=['POST'])
def validate_jd(jd_id):
    """Validate JD before publishing"""
    try:
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({
                'success': False,
                'jd_id': jd_id,
                'is_valid': False,
                'errors': ['Job description not found']
            }), 404
        
        is_valid, errors = jd_engine.validate_jd(jd_data)
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'is_valid': is_valid,
            'errors': errors
        })
        
    except Exception as e:
        logger.error(f"Error validating JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Error handlers
@jd_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@jd_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500




@jd_bp.route('/<jd_id>/save', methods=['POST'])
def save_jd(jd_id):
    """
    Save job description (as draft or published)
    
    Request body:
    {
        "jd_data": {...},  # Complete JD data structure
        "status": "draft" | "published"
    }
    """
    try:
        data = request.get_json()
        jd_data = data.get('jd_data')
        status = data.get('status', 'draft')
        
        if not jd_data:
            return jsonify({'error': 'jd_data is required'}), 400
        
        # Check for mock token (development mode)
        auth_header = request.headers.get('Authorization', '')
        is_mock_token = auth_header and 'mock_token' in auth_header
        
        current_user_id = None
        if is_mock_token:
            mock_token = auth_header.replace('Bearer ', '').strip()
            user_id = mock_token.replace('mock_token_', '')
            current_user_id = user_id
        else:
            # Fallback to real JWT if configured and valid
            try:
                from flask_jwt_extended import verify_jwt_in_request
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
            except Exception as e:
                logger.warning(f"JWT verification failed: {e}")

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Check if job_postings table exists, create if not (don't drop existing table!)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS job_postings (
                id SERIAL PRIMARY KEY,
                jd_id VARCHAR(100) UNIQUE NOT NULL,
                recruiter_id VARCHAR(100) NOT NULL,
                company_id VARCHAR(100) NOT NULL,
                title VARCHAR(500) NOT NULL,
                title_arabic VARCHAR(500),
                department VARCHAR(200),
                job_type VARCHAR(50),
                job_level VARCHAR(50),
                emirate VARCHAR(100),
                city VARCHAR(100),
                remote_option BOOLEAN DEFAULT FALSE,
                description TEXT,
                description_arabic TEXT,
                requirements JSONB,
                responsibilities JSONB,
                benefits JSONB,
                compensation JSONB,
                application_process JSONB,
                metadata JSONB,
                status VARCHAR(50) DEFAULT 'draft',
                views_count INTEGER DEFAULT 0,
                applications_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                published_at TIMESTAMP,
                closed_at TIMESTAMP
            )
        """)
        conn.commit()  # Commit table creation before using it
        
        # Extract data for database columns
        basic_info = jd_data.get('basic_info', {})
        metadata = jd_data.get('metadata', {})
        
        # Get recruiter_id and company_id from metadata or request data
        recruiter_id = metadata.get('recruiter_id') or data.get('recruiter_id')
        company_id = metadata.get('company_id') or data.get('company_id')
        
        # If missing, try to lookup from user profile
        if (not recruiter_id or not company_id) and current_user_id:
             try:
                # Get company ID for the user
                cur.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
                row = cur.fetchone()
                
                if not row or not row.get('company_id'):
                    # Try to find company via job_postings if no profile (fallback)
                    cur.execute("SELECT company_id FROM job_postings WHERE recruiter_id = %s LIMIT 1", (current_user_id,))
                    row = cur.fetchone()
                    
                if row and row.get('company_id'):
                     if not company_id:
                         company_id = row['company_id']
                     if not recruiter_id:
                         recruiter_id = current_user_id
                     logger.info(f"Auto-detected company_id {company_id} for user {current_user_id}")
             except Exception as e:
                 logger.error(f"Error looking up company for user {current_user_id}: {e}")

        # Fallback to unknown if still missing
        recruiter_id = recruiter_id or 'unknown'
        company_id = company_id or 'unknown'
        
        # Check if JD already exists
        cur.execute("SELECT id, jd_id FROM job_postings WHERE jd_id = %s", (jd_id,))
        existing = cur.fetchone()
        
        logger.info(f"Checking for existing JD with jd_id: {jd_id}")
        if existing:
            logger.info(f"Found existing JD: id={existing.get('id')}, jd_id={existing.get('jd_id')}")
            # Update existing JD
            cur.execute("""
                UPDATE job_postings SET
                    title = %s,
                    title_arabic = %s,
                    department = %s,
                    job_type = %s,
                    job_level = %s,
                    emirate = %s,
                    city = %s,
                    remote_option = %s,
                    description = %s,
                    description_arabic = %s,
                    requirements = %s,
                    responsibilities = %s,
                    benefits = %s,
                    compensation = %s,
                    application_process = %s,
                    metadata = %s,
                    status = %s,
                    updated_at = CURRENT_TIMESTAMP,
                    published_at = CASE WHEN %s = 'published' AND published_at IS NULL 
                                       THEN CURRENT_TIMESTAMP 
                                       ELSE published_at END
                WHERE jd_id = %s
            """, (
                basic_info.get('title'),
                basic_info.get('title_arabic'),
                basic_info.get('department'),
                basic_info.get('job_type'),
                basic_info.get('job_level'),
                basic_info.get('emirate'),
                basic_info.get('city'),
                basic_info.get('remote_option', False),
                jd_data.get('description'),
                jd_data.get('description_arabic'),
                json.dumps(jd_data.get('requirements', [])),
                json.dumps(jd_data.get('responsibilities', [])),
                json.dumps(jd_data.get('benefits', [])),
                json.dumps(jd_data.get('compensation', {})),
                json.dumps(jd_data.get('application_process', {})),
                json.dumps(metadata),
                status,
                status,
                jd_id
            ))
            logger.info(f"Updated JD {jd_id} with status: {status}")
        else:
            logger.info(f"No existing JD found with jd_id: {jd_id}, inserting new record")
            # Insert new JD
            cur.execute("""
                INSERT INTO job_postings (
                    jd_id, recruiter_id, company_id,
                    title, title_arabic, department, job_type, job_level,
                    emirate, city, remote_option,
                    description, description_arabic,
                    requirements, responsibilities, benefits,
                    compensation, application_process, metadata,
                    status, published_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    CASE WHEN %s = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END
                )
            """, (
                jd_id,
                recruiter_id,
                company_id,
                basic_info.get('title'),
                basic_info.get('title_arabic'),
                basic_info.get('department'),
                basic_info.get('job_type'),
                basic_info.get('job_level'),
                basic_info.get('emirate'),
                basic_info.get('city'),
                basic_info.get('remote_option', False),
                jd_data.get('description'),
                jd_data.get('description_arabic'),
                json.dumps(jd_data.get('requirements', [])),
                json.dumps(jd_data.get('responsibilities', [])),
                json.dumps(jd_data.get('benefits', [])),
                json.dumps(jd_data.get('compensation', {})),
                json.dumps(jd_data.get('application_process', {})),
                json.dumps(metadata),
                status,
                status
            ))
            logger.info(f"Inserted new JD {jd_id} with status: {status}")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'status': status,
            'message': f'Job description {"published" if status == "published" else "saved as draft"} successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error saving JD: {e}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/publish', methods=['POST'])
def publish_jd(jd_id):
    """
    Publish a job description (change status from draft to published)
    """
    try:
        data = request.get_json()
        jd_data = data.get('jd_data')
        
        if not jd_data:
            return jsonify({'error': 'jd_data is required'}), 400
        
        # Save with published status
        return save_jd(jd_id)
        
    except Exception as e:
        logger.error(f"Error publishing JD: {e}")
        return jsonify({'error': str(e)}), 500







@jd_bp.route('/<jd_id>', methods=['DELETE'])
def delete_jd(jd_id):
    """
    Delete a job description
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if JD exists
        cur.execute("SELECT id FROM job_postings WHERE jd_id = %s", (jd_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'error': 'Job description not found'}), 404
            
        # Delete JD
        cur.execute("DELETE FROM job_postings WHERE jd_id = %s", (jd_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        logger.info(f"Deleted JD: {jd_id}")
        return jsonify({'success': True, 'message': 'Job description deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting JD {jd_id}: {e}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
