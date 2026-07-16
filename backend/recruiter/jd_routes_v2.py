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


def _resolve_company_uuid(cur, user_id):
    """Return the recruiter's company UUID from hr_profiles (or None).

    job_postings.company_id must align with hr_profiles.company_id (a UUID) for
    the recruiter candidate-match join to work. Preferring the UUID here — over a
    company *name* — is what keeps newly created jobs matchable. Best-effort and
    non-breaking: returns None if there's no hr_profile or on any error, and
    callers keep their existing fallback.
    """
    if not user_id or str(user_id) in ('unknown', ''):
        return None
    try:
        cur.execute(
            "SELECT company_id FROM hr_profiles WHERE user_id = %s AND company_id IS NOT NULL LIMIT 1",
            (str(user_id),),
        )
        row = cur.fetchone()
        if not row:
            return None
        val = row.get('company_id') if hasattr(row, 'get') else row[0]
        return str(val) if val else None
    except Exception:
        return None


def _normalize_company_id_for_storage(cur, company_id, recruiter_id):
    """Return a clean value for job_postings.company_id: keep it if it is already
    a company UUID; otherwise resolve the recruiter's hr_profiles company UUID;
    otherwise None. Never persists placeholder strings ('unknown',
    'company_default') or free-text company names — company_id must stay a clean
    company reference so the recruiter-match ownership join can work.
    """
    v = str(company_id).strip() if company_id else ''
    if len(v) == 36 and v.count('-') == 4:  # already a UUID
        return v
    return _resolve_company_uuid(cur, recruiter_id) or None


from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from backend.db import get_db_connection
from backend.user_helpers import user_display_name

try:
    from backend.auth.access_control import require_roles, require_auth, RECRUITER_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, require_auth, RECRUITER_ROLES

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("!!! DEBUG: LOADING RECRUITER/JD_ROUTES_V2.PY !!!", flush=True)

# Create Blueprint
jd_bp = Blueprint('jd_routes_v2', __name__, url_prefix='/api/recruiter/jd')

# Initialize components
jd_engine = get_jd_builder_engine()
ai_matching = get_ai_matching_engine()


def ensure_jd_tables_exist():
    """Ensure job_postings and demand_signals tables exist at startup."""
    conn = get_db_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            # Create job_postings table
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
            
            # Create demand_signals table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS demand_signals (
                    id SERIAL PRIMARY KEY,
                    company_id TEXT NOT NULL UNIQUE,
                    company_name TEXT,
                    job_count INTEGER DEFAULT 1,
                    sector TEXT,
                    emirate TEXT,
                    matching_candidates INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            conn.commit()
            logger.info("✅ Recruiter JD tables verified/created at startup")
    except Exception as e:
        logger.error(f"Failed to create JD tables: {e}")
        conn.rollback()
    finally:
        conn.close()

# Ensure tables exist on module load
ensure_jd_tables_exist()




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
            'latitude': jd_dict.get('latitude'),
            'longitude': jd_dict.get('longitude'),
            'remote_option': jd_dict.get('remote_option', False),
            'application_deadline': jd_dict.get('application_deadline').isoformat() if jd_dict.get('application_deadline') else None
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
                created_by VARCHAR(100),
                title VARCHAR(500) NOT NULL,
                title_arabic VARCHAR(500),
                department VARCHAR(200),
                job_type VARCHAR(50),
                job_level VARCHAR(50),
                emirate VARCHAR(100),
                city VARCHAR(100),
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                remote_option BOOLEAN DEFAULT FALSE,
                application_deadline DATE,
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
        # Store a clean company UUID (or NULL) — never a placeholder/name string.
        company_id = _normalize_company_id_for_storage(cur, metadata.get('company_id'), recruiter_id)

        # Parse and normalize application_deadline
        deadline_str = basic_info.get('application_deadline')
        deadline_val = None
        if deadline_str and str(deadline_str).strip():
            try:
                deadline_cleaned = str(deadline_str).strip()
                if 'T' in deadline_cleaned:
                    deadline_val = datetime.fromisoformat(deadline_cleaned).date()
                else:
                    deadline_val = datetime.strptime(deadline_cleaned, '%Y-%m-%d').date()
            except ValueError:
                logger.warning(f"Invalid application_deadline format: {deadline_str}")
                deadline_val = None

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
                    latitude = %s,
                    longitude = %s,
                    remote_option = %s,
                    application_deadline = %s,
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
                basic_info.get('latitude'),
                basic_info.get('longitude'),
                basic_info.get('remote_option', False),
                deadline_val,
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
                    emirate, city, latitude, longitude, remote_option,
                    application_deadline,
                    description, description_arabic,
                    requirements, responsibilities, benefits,
                    compensation, application_process, metadata,
                    status, published_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
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
                basic_info.get('latitude'),
                basic_info.get('longitude'),
                basic_info.get('remote_option', False),
                deadline_val,
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


# REMOVED: create_jd was dead code — shadowed by
# REMOVED: recruiter_dashboard_api.create_jd_enhanced (registered first via blueprint).



# REMOVED: /test_probe_123 debug/test route (deleted — was a leftover liveness probe artifact).

# REMOVED: list_jds was dead code — shadowed by
# REMOVED: recruiter_dashboard_api.get_jd_list_enhanced (registered first via blueprint).


@jd_bp.route('/<jd_id>', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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


@jd_bp.route('/<jd_id>/smart-fill', methods=['POST'])
@require_roles(*RECRUITER_ROLES)
def smart_fill_jd(jd_id):
    """AI-generate a complete JD from a job title (description + requirements + responsibilities + benefits)."""
    try:
        data = request.get_json(silent=True) or {}
        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({'success': False, 'message': 'title is required'}), 400
        result = jd_engine.generate_full_jd_ai(
            title=title,
            department=data.get('department'),
            level=data.get('job_level') or 'mid',
            industry=data.get('industry') or 'General',
            emirate=data.get('emirate') or 'UAE',
        )
        if not result or not result.get('description'):
            return jsonify({'success': False, 'message': 'AI generation unavailable'}), 200
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        logger.error(f"smart_fill error for {jd_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@jd_bp.route('/<jd_id>/generate-description', methods=['POST'])
@require_roles(*RECRUITER_ROLES)
def generate_description(jd_id):
    """Generate AI-powered job description"""
    try:
        data = request.get_json() or {}
        industry = data.get('industry')
        
        # Retrieve JD from database
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Merge basic info from request if provided (ensure latest values used for generation)
        if 'basic_info' in data:
            jd_data['basic_info'].update(data['basic_info'])
        
        # Generate description
        generated_description = jd_engine.generate_description_ai(jd_data, industry)
        
        logger.info(f"Generated AI description for JD {jd_id}")
        
        return jsonify({
            'success': True,
            'jd_id': jd_id,
            'description': generated_description,
            'generated_description': generated_description
        })
        
    except Exception as e:
        logger.error(f"Error generating description for JD {jd_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/completion-score', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
def match_candidates(jd_id):
    """
    Match top 10 candidates to job description with employment status filtering.
    This is called after JD completion to find suitable candidates before publishing.
    """
    try:
        data = request.get_json()
        
        # Get employment status filter
        employment_status_filter = data.get('employment_status_filter')  # 'employed', 'candidate', 'open_to_opportunities', or None
        top_n = data.get('top_n', 10)
        
        debug_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'routes_debug.txt')
        try:
            with open(debug_file, 'a') as f:
                 f.write(f"\n--- Request for JD {jd_id} ---\n")
        except Exception as log_err:
            logger.warning(f"Failed to write to debug file: {log_err}")
        
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
        
        # First, look up the integer job_postings.id for this jd_id
        # (job_applications.job_id is INTEGER referencing job_postings.id)
        cur.execute("SELECT id FROM job_postings WHERE jd_id = %s", (jd_id,))
        jp_row = cur.fetchone()
        job_posting_int_id = dict(jp_row)['id'] if jp_row else None
        
        # 1. Fetch APPLICANTS (People who explicitly applied)
        # We need to map them to the same structure as generic candidates
        applicants = []
        if job_posting_int_id:
            cur.execute("""
                SELECT 
                    u.id as candidate_id,
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.full_name,
                    COALESCE(u.full_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.email) as display_name,
                    u.email,
                    u.phone,
                    COALESCE(NULLIF(u.emirate, ''), CASE WHEN strpos(LOWER(cp.target_roles::text), 'dubai') > 0 THEN 'Dubai' WHEN strpos(LOWER(cp.target_roles::text), 'abu dhabi') > 0 THEN 'Abu Dhabi' WHEN strpos(LOWER(cp.target_roles::text), 'sharjah') > 0 THEN 'Sharjah' ELSE '' END) as emirate,
                    u.nationality,
                    (u.is_uae_national = true OR u.nationality IN ('ARE', 'UAE', 'emirati', 'Emirati') OR cp.nationality IN ('ARE', 'UAE', 'emirati', 'Emirati')) as is_uae_national,
                    COALESCE(u.education_level, (SELECT CASE WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'phd') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'doctor') > 0 THEN 'PhD' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'master') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'emba') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'mba') > 0 THEN 'Master' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'bachelor') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'bsc') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'ba') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'degree') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'eng') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'hnd') > 0 THEN 'Bachelor' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'diploma') > 0 THEN 'Diploma' ELSE 'Bachelor' END FROM candidate_education_entries WHERE user_id = u.id::varchar)) as education_level,
                    COALESCE(u.experience_years, (SELECT COALESCE(SUM(EXTRACT(YEAR FROM AGE(COALESCE(end_date, CURRENT_DATE), start_date))), 0) FROM candidate_experience_entries WHERE user_id = u.id::varchar), 0) as experience_years,
                    u.job_title as current_position,
                    u.company as current_company,
                    'applicant' as employment_status, -- Special status for applicants
                    COALESCE((SELECT array_agg(name) FROM candidate_skills WHERE user_id = u.id::varchar), ARRAY[]::text[]) as skills,
                    u.preferred_salary_min,
                    u.preferred_salary_max,
                    u.latitude,
                    u.longitude,
                    NULL as cv_url,
                    NULL as linkedin_url,
                    a.status as application_status,
                    a.submitted_at,
                    cp.target_roles as compass_target_roles,
                    cp.willing_to_relocate as compass_willing_to_relocate,
                    cp.expected_salary_range as compass_expected_salary_range,
                    cp.notice_period as compass_notice_period,
                    cp.location as compass_preferred_location,
                    cp.english_proficiency
                FROM job_applications a
                JOIN users u ON a.candidate_id = u.id
                LEFT JOIN candidate_profiles cp ON u.id::varchar = cp.user_id
                WHERE a.job_id::text = %s::text
            """, (str(job_posting_int_id),))
            applicants = [dict(c) for c in cur.fetchall()]
        
        # Get applicant IDs to exclude from general search (as integers)
        applicant_ids = [int(a['candidate_id']) for a in applicants]
        
        # 2. Fetch PASSIVE MATCHES (General pool)
        # Build query based on employment status filter
        query = """
            SELECT 
                u.id as candidate_id,
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.full_name,
                COALESCE(u.full_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.email) as display_name,
                u.email,
                u.phone,
                COALESCE(NULLIF(u.emirate, ''), CASE WHEN strpos(LOWER(cp.target_roles::text), 'dubai') > 0 THEN 'Dubai' WHEN strpos(LOWER(cp.target_roles::text), 'abu dhabi') > 0 THEN 'Abu Dhabi' WHEN strpos(LOWER(cp.target_roles::text), 'sharjah') > 0 THEN 'Sharjah' ELSE '' END) as emirate,
                u.nationality,
                (u.is_uae_national = true OR u.nationality IN ('ARE', 'UAE', 'emirati', 'Emirati') OR cp.nationality IN ('ARE', 'UAE', 'emirati', 'Emirati')) as is_uae_national,
                COALESCE(u.education_level, (SELECT CASE WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'phd') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'doctor') > 0 THEN 'PhD' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'master') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'emba') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'mba') > 0 THEN 'Master' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'bachelor') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'bsc') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'ba') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'degree') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'eng') > 0 OR strpos(LOWER(STRING_AGG(degree, ' ')), 'hnd') > 0 THEN 'Bachelor' WHEN strpos(LOWER(STRING_AGG(degree, ' ')), 'diploma') > 0 THEN 'Diploma' ELSE 'Bachelor' END FROM candidate_education_entries WHERE user_id = u.id::varchar)) as education_level,
                COALESCE(u.experience_years, (SELECT COALESCE(SUM(EXTRACT(YEAR FROM AGE(COALESCE(end_date, CURRENT_DATE), start_date))), 0) FROM candidate_experience_entries WHERE user_id = u.id::varchar), 0) as experience_years,
                u.job_title as current_position,
                u.company as current_company,
                u.employment_status,
                COALESCE((SELECT array_agg(name) FROM candidate_skills WHERE user_id = u.id::varchar), ARRAY[]::text[]) as skills,
                u.preferred_salary_min,
                u.preferred_salary_max,
                u.latitude,
                u.longitude,
                NULL as cv_url,
                NULL as linkedin_url,
                cp.target_roles as compass_target_roles,
                cp.willing_to_relocate as compass_willing_to_relocate,
                cp.expected_salary_range as compass_expected_salary_range,
                cp.notice_period as compass_notice_period,
                cp.location as compass_preferred_location,
                cp.english_proficiency
            FROM users u
            LEFT JOIN candidate_profiles cp ON u.id::varchar = cp.user_id
            WHERE u.role IN ('candidate', 'job_seeker')
                AND u.is_active = true
                AND u.is_visible = true
            ORDER BY (CASE WHEN EXISTS (SELECT 1 FROM candidate_skills WHERE user_id = u.id::varchar) THEN 1 ELSE 0 END) DESC, u.id DESC
        """
        
        params = []
        
        # Exclude already applied
        if applicant_ids:
            query += " AND id NOT IN %s"
            params.append(tuple(applicant_ids))
        
        # G22/G23: Employment status filter for Stealth Headhunter
        if employment_status_filter and employment_status_filter.lower() != 'all':
            if employment_status_filter.lower() == 'candidate':
                query += " AND employment_status = 'candidate'"
            elif employment_status_filter.lower() == 'employed_open':
                query += " AND employment_status = 'employed_open'"
                query += " AND available_for_recruitment = true"
            elif employment_status_filter.lower() == 'passive':
                query += " AND employment_status IN ('employed_open', 'freelancer')"
                query += " AND available_for_recruitment = true"
            elif employment_status_filter.lower() == 'freelancer':
                query += " AND employment_status = 'freelancer'"
        
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
        
        try:
            with open(debug_file, 'a') as f:
                 f.write(f"Applicants: {len(applicants)}\n")
                 f.write(f"Passive: {len(passive_candidates)}\n")
                 f.write(f"Total: {len(applicants) + len(passive_candidates)}\n")
        except Exception as log_err:
            logger.warning(f"Failed to write to debug file: {log_err}")
        
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

        # Calculate Distances
        def haversine_distance(lat1, lon1, lat2, lon2):
            import math
            if not lat1 or not lon1 or not lat2 or not lon2:
                return None
            
            R = 6371  # Earth radius in km
            dLat = math.radians(lat2 - lat1)
            dLon = math.radians(lon2 - lon1)
            a = math.sin(dLat/2) * math.sin(dLat/2) + \
                math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
                math.sin(dLon/2) * math.sin(dLon/2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            return round(R * c, 1)

        jd_lat = jd_data.get('basic_info', {}).get('latitude')
        jd_lon = jd_data.get('basic_info', {}).get('longitude')
        
        # Add distance to all matches
        for match in ai_applicants + ai_passive:
            cand = match.get('candidate', {})
            cand_lat = cand.get('latitude')
            cand_lon = cand.get('longitude')
            
            dist = haversine_distance(jd_lat, jd_lon, cand_lat, cand_lon)
            match['distance_km'] = dist
            cand['distance_km'] = dist # Add to candidate object too for frontend convenience

                
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
        try:
            with open(debug_file, 'a') as f:
                 f.write(f"Matches return count: {len(matches)}\n")
                 if matches:
                     try:
                         import json
                         sample = matches[0]
                         f.write(f"Sample Match Payload: {json.dumps(sample, default=str)}\n")
                     except Exception as err:
                         f.write(f"Error logging sample: {err}\n")
        except Exception as log_err:
            logger.warning(f"Failed to write to debug file: {log_err}")

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
@require_roles(*RECRUITER_ROLES)
def add_to_shortlist():
    """Add a candidate to the shortlist for a JD.
    
    Writes to shortlisted_candidates table using integer job_id
    looked up from job_postings.jd_id (UUID).
    """
    try:
        data = request.get_json()
        jd_id = data.get('jd_id')
        candidate_id = data.get('candidate_id')
        recruiter_id = data.get('recruiter_id')
        notes = data.get('notes', '')

        if not jd_id or not candidate_id:
            return jsonify({'error': 'jd_id and candidate_id are required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Migrate shortlisted_candidates columns from INTEGER to TEXT if needed
            # (supports UUID-based IDs from modern auth system)
            try:
                cursor.execute("""
                    SELECT data_type FROM information_schema.columns
                    WHERE table_name = 'shortlisted_candidates' AND column_name = 'candidate_id'
                """)
                col_info = cursor.fetchone()
                if col_info and col_info.get('data_type') == 'integer':
                    logger.info("Migrating shortlisted_candidates columns to TEXT for UUID support")
                    cursor.execute("ALTER TABLE shortlisted_candidates ALTER COLUMN candidate_id TYPE TEXT USING candidate_id::text")
                    cursor.execute("ALTER TABLE shortlisted_candidates ALTER COLUMN hr_user_id TYPE TEXT USING hr_user_id::text")
                    cursor.execute("ALTER TABLE shortlisted_candidates ALTER COLUMN hr_user_id DROP NOT NULL")
                    conn.commit()
                    logger.info("✅ shortlisted_candidates columns migrated to TEXT")
            except Exception as mig_err:
                logger.warning(f"Column migration check: {mig_err}")
                conn.rollback()

            # Ensure unique constraint exists on shortlisted_candidates (job_id, candidate_id)
            try:
                cursor.execute("""
                    SELECT conname FROM pg_constraint 
                    WHERE conrelid = 'shortlisted_candidates'::regclass 
                      AND contype = 'u' 
                      AND pg_get_constraintdef(oid) LIKE '%job_id%' 
                      AND pg_get_constraintdef(oid) LIKE '%candidate_id%'
                """)
                has_uq = cursor.fetchone()
                if not has_uq:
                    logger.info("Adding unique constraint on shortlisted_candidates (job_id, candidate_id)")
                    # Delete any duplicate entries first
                    cursor.execute("""
                        DELETE FROM shortlisted_candidates a USING shortlisted_candidates b
                        WHERE a.id < b.id AND a.job_id = b.job_id AND a.candidate_id = b.candidate_id
                    """)
                    cursor.execute("ALTER TABLE shortlisted_candidates ADD CONSTRAINT uq_shortlisted_candidates UNIQUE (job_id, candidate_id)")
                    conn.commit()
                    logger.info("✅ Unique constraint added to shortlisted_candidates")
            except Exception as uq_err:
                logger.warning(f"Unique constraint check failed: {uq_err}")
                conn.rollback()

            # Look up integer job_postings.id from the UUID jd_id
            cursor.execute(
                "SELECT id FROM job_postings WHERE jd_id = %s",
                (str(jd_id),)
            )
            jp_row = cursor.fetchone()
            if not jp_row:
                return jsonify({'error': f'Job posting not found for jd_id: {jd_id}'}), 404
            job_id_int = jp_row['id']

            # Use string IDs (candidate_id and recruiter_id are UUIDs)
            hr_user_id = str(recruiter_id) if recruiter_id else None

            # Upsert into shortlisted_candidates
            cursor.execute("""
                INSERT INTO shortlisted_candidates (job_id, candidate_id, hr_user_id, notes, status)
                VALUES (%s, %s, %s, %s, 'shortlisted')
                ON CONFLICT (job_id, candidate_id)
                DO UPDATE SET
                    notes = COALESCE(EXCLUDED.notes, shortlisted_candidates.notes),
                    status = 'shortlisted',
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, job_id, candidate_id, status, created_at
            """, (job_id_int, str(candidate_id), hr_user_id, notes))

            row = dict(cursor.fetchone())
            conn.commit()

            # G2: Sync job_applications.status → 'shortlisted'
            try:
                sync_cur = conn.cursor()
                sync_cur.execute("""
                    UPDATE job_applications 
                    SET status = 'shortlisted', updated_at = NOW()
                    WHERE candidate_id::text = %s
                      AND (job_id::text = %s OR job_id::text = %s)
                      AND status NOT IN ('accepted', 'withdrawn', 'offered')
                """, (str(candidate_id), str(jd_id), str(job_id_int)))
                if sync_cur.rowcount > 0:
                    logger.info(f"G2: Synced job_applications status to 'shortlisted' for candidate {candidate_id}, job {jd_id}")
                conn.commit()
                sync_cur.close()
            except Exception as sync_err:
                logger.warning(f"G2: Application status sync failed (non-blocking): {sync_err}")
                try:
                    conn.rollback()
                except:
                    pass

            logger.info(f"Added candidate {candidate_id} to shortlist for JD {jd_id} (job_id={job_id_int})")

            return jsonify({
                'success': True,
                'message': 'Candidate added to shortlist',
                'shortlist_id': str(row['id'])
            }), 201

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        logger.error(f"Error adding to shortlist: {str(e)}")
        import traceback; traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/shortlist/<jd_id>', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_shortlist(jd_id):
    """Get shortlisted candidates for a JD.
    
    Reads from shortlisted_candidates joined with job_postings and users.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT
                    sc.id AS shortlist_id,
                    sc.job_id,
                    sc.candidate_id::text AS candidate_id,
                    sc.status,
                    sc.notes,
                    sc.created_at,
                    sc.updated_at,
                    u.first_name,
                    u.last_name,
                    COALESCE(u.full_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.email) as display_name,
                    u.email
                FROM shortlisted_candidates sc
                JOIN job_postings jp ON sc.job_id = jp.id
                LEFT JOIN users u ON sc.candidate_id = u.id
                WHERE jp.jd_id = %s
                ORDER BY sc.created_at DESC
            """, (str(jd_id),))

            rows = cursor.fetchall()
            shortlist = []
            for row in rows:
                entry = dict(row)
                # Serialise datetime for JSON
                if entry.get('created_at'):
                    entry['created_at'] = entry['created_at'].isoformat()
                if entry.get('updated_at'):
                    entry['updated_at'] = entry['updated_at'].isoformat()
                shortlist.append(entry)

            return jsonify({
                'success': True,
                'shortlist': shortlist,
                'count': len(shortlist)
            })

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        logger.error(f"Error retrieving shortlist: {str(e)}")
        import traceback; traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@jd_bp.route('/<jd_id>/validate', methods=['POST'])
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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
        
        current_user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
        except Exception as e:
            logger.warning(f"JWT verification failed: {e}")

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Extract data for database columns
        basic_info = jd_data.get('basic_info', {})
        metadata = jd_data.get('metadata', {})
        
        app_deadline = basic_info.get('application_deadline')
        if not app_deadline or app_deadline == '':
            app_deadline = None
        
        # Get recruiter_id and company_id from metadata or request data
        recruiter_id = metadata.get('recruiter_id') or data.get('recruiter_id')
        company_id = metadata.get('company_id') or data.get('company_id')
        
        # CRITICAL: Use JWT identity as authoritative recruiter_id
        # This ensures RBAC filter (recruiter_id = user_id) always matches
        if current_user_id:
            recruiter_id = str(current_user_id)
        
        # If company_id is missing or a placeholder, look up from user's profile
        company_id_placeholder = not company_id or company_id in ('company_default', 'unknown', '')
        if company_id_placeholder and current_user_id:
             try:
                # Check multiple sources for company name:
                # 1. users.company (VARCHAR column)
                # 2. users.profile_data->>'companyName' (JSONB from Settings)
                # 3. hr_profiles -> companies (relational)
                cur.execute("""
                    SELECT
                        hp.company_id as hr_company_id,
                        u.company,
                        u.profile_data->>'companyName' as profile_company,
                        COALESCE(c.company_name, c.name) as hr_company
                    FROM users u
                    LEFT JOIN hr_profiles hp ON hp.user_id = u.id
                    LEFT JOIN companies c ON hp.company_id::text = c.id::text
                    WHERE u.id = %s
                """, (current_user_id,))
                row = cur.fetchone()
                if row:
                    # Prefer the company UUID (aligns with hr_profiles.company_id,
                    # which the recruiter match join uses); fall back to a name so
                    # recruiters without an hr_profile keep working unchanged.
                    resolved = (
                        row.get('hr_company_id') or
                        row.get('company') or
                        row.get('profile_company') or
                        row.get('hr_company')
                    )
                    if resolved:
                        company_id = str(resolved)
                        logger.info(f"Auto-detected company '{company_id}' for user {current_user_id}")
             except Exception as e:
                 logger.warning(f"Error looking up company for user {current_user_id}: {e}")
                 try:
                     conn.rollback()
                 except:
                     pass

        # Store a clean company UUID (or NULL) — never a placeholder/name string.
        recruiter_id = recruiter_id or 'unknown'
        company_id = _normalize_company_id_for_storage(cur, company_id, recruiter_id)
        
        logger.info(f"Save JD {jd_id}: recruiter_id={recruiter_id}, company_id={company_id}, jwt_user={current_user_id}")
        
        # Build location string from city + emirate if location not set
        city = basic_info.get('city')
        emirate = basic_info.get('emirate')
        location = basic_info.get('location')
        if not location:
            parts = [p for p in [city, emirate] if p]
            location = ', '.join(parts) if parts else None
        
        # Check if JD already exists
        cur.execute("SELECT id, jd_id FROM job_postings WHERE jd_id = %s", (jd_id,))
        existing = cur.fetchone()
        
        logger.info(f"Checking for existing JD with jd_id: {jd_id}")
        if existing:
            logger.info(f"Found existing JD: id={existing.get('id')}, jd_id={existing.get('jd_id')}")
            # Update existing JD
            # NOTE: Do NOT set created_by — it's INTEGER (FK to users.id) but JWT IDs are UUIDs
            cur.execute("""
                UPDATE job_postings SET
                    title = %s,
                    title_arabic = %s,
                    department = %s,
                    job_type = %s,
                    job_level = %s,
                    emirate = %s,
                    city = %s,
                    location = %s,
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
                    recruiter_id = %s,
                    company_id = %s,
                    application_deadline = %s,
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
                emirate,
                city,
                location,
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
                recruiter_id,
                company_id,
                app_deadline,
                status,
                jd_id
            ))
            logger.info(f"Updated JD {jd_id} with status: {status}, recruiter_id: {recruiter_id}, location: {location}")
        else:
            logger.info(f"No existing JD found with jd_id: {jd_id}, inserting new record")
            # Insert new JD — RBAC uses recruiter_id (VARCHAR), NOT created_by (INTEGER)
            cur.execute("""
                INSERT INTO job_postings (
                    jd_id, recruiter_id, company_id,
                    title, title_arabic, department, job_type, job_level,
                    emirate, city, location, latitude, longitude, remote_option,
                    description, description_arabic,
                    requirements, responsibilities, benefits,
                    compensation, application_process, metadata,
                    status, application_deadline, published_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
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
                emirate,
                city,
                location,
                basic_info.get('latitude'),
                basic_info.get('longitude'),
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
                app_deadline,
                status
            ))
            logger.info(f"Inserted new JD {jd_id} with status: {status}, recruiter_id: {recruiter_id}, location: {location}")
        
        conn.commit()

        # ── G26: Demand Signal on Publish ──────────────────────────
        if status == 'published':
            ds_conn = None
            ds_cur = None
            try:
                ds_conn = get_db_connection()
                ds_cur = ds_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

                # Count published jobs for this company
                ds_cur.execute(
                    "SELECT COUNT(*) AS cnt FROM job_postings WHERE company_id = %s AND status = 'published'",
                    (company_id,)
                )
                job_count_row = ds_cur.fetchone()
                published_count = job_count_row['cnt'] if job_count_row else 1

                # Upsert demand signal
                ds_cur.execute("""
                    INSERT INTO demand_signals (company_id, company_name, job_count, sector, emirate, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (company_id) DO UPDATE SET
                        job_count = %s,
                        sector = COALESCE(EXCLUDED.sector, demand_signals.sector),
                        emirate = COALESCE(EXCLUDED.emirate, demand_signals.emirate),
                        updated_at = NOW()
                """, (
                    company_id, company_id, published_count,
                    basic_info.get('department'), emirate,
                    published_count,
                ))
                ds_conn.commit()

                # Notify NAFIS / Growth Talent operators (first job only)
                if published_count == 1:
                    ds_cur.execute(
                        "SELECT id FROM users WHERE role IN ('nafis_operator', 'growth_operator_talent')"
                    )
                    operator_rows = ds_cur.fetchall()
                    for op in operator_rows:
                        try:
                            from backend.notification_helper import create_notification
                            create_notification(
                                user_id=op['id'],
                                notification_type='demand_signal_new',
                                title=f"New hiring demand: {company_id}",
                                message=f"Company {company_id} published their first job ({basic_info.get('title', 'position')}). Review demand signals.",
                                metadata={'company_id': company_id, 'jd_id': jd_id}
                            )
                        except Exception as notif_err:
                            logger.warning(f"G26: Notification to operator {op['id']} failed: {notif_err}")

                logger.info(f"G26: Demand signal upserted for company {company_id} (jobs={published_count})")
            except Exception as ds_err:
                logger.warning(f"G26: Demand signal creation failed (non-blocking): {ds_err}")
                if ds_conn:
                    ds_conn.rollback()
            finally:
                if ds_cur:
                    ds_cur.close()
                if ds_conn:
                    ds_conn.close()
        # ── End G26 ────────────────────────────────────────────────

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
@require_roles(*RECRUITER_ROLES)
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
@require_roles(*RECRUITER_ROLES)
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
