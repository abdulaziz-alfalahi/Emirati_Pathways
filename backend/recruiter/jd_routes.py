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
from .ai_candidate_matching import get_ai_matching_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
jd_routes = Blueprint('jd_routes', __name__, url_prefix='/api/recruiter/jd')

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


@jd_routes.route('/health', methods=['GET'])
def jd_health():
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


@jd_routes.route('/create', methods=['POST'])
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


# Removed old placeholder get_jd - see line 669 for actual implementation


@jd_routes.route('/<jd_id>/basic-info', methods=['PUT'])
def update_basic_info(jd_id):
    """Update basic information (Step 1 of wizard)"""
    try:
        data = request.get_json()
        basic_info = data.get('basic_info', {})
        
        # TODO: Retrieve JD from database
        # For now, create temporary JD data
        jd_data = {'metadata': {'jd_id': jd_id}, 'basic_info': {}}
        
        # Update JD
        updated_jd = jd_engine.update_basic_info(jd_data, basic_info)
        
        # TODO: Save to database
        
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


@jd_routes.route('/<jd_id>/description', methods=['PUT'])
def update_description(jd_id):
    """Update job description (Step 2 of wizard)"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        description_arabic = data.get('description_arabic')
        
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}, 'description': ''}
        
        # Update JD
        updated_jd = jd_engine.update_description(jd_data, description, description_arabic)
        
        # TODO: Save to database
        
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


@jd_routes.route('/<jd_id>/requirements', methods=['POST'])
def add_requirement(jd_id):
    """Add job requirement (Step 3 of wizard)"""
    try:
        data = request.get_json()
        requirement = data.get('requirement', {})
        
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}, 'requirements': []}
        
        # Add requirement
        updated_jd = jd_engine.add_requirement(jd_data, requirement)
        
        # TODO: Save to database
        
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


@jd_routes.route('/<jd_id>/responsibilities', methods=['POST'])
def add_responsibility(jd_id):
    """Add job responsibility (Step 4 of wizard)"""
    try:
        data = request.get_json()
        responsibility = data.get('responsibility', {})
        
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}, 'responsibilities': []}
        
        # Add responsibility
        updated_jd = jd_engine.add_responsibility(jd_data, responsibility)
        
        # TODO: Save to database
        
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


@jd_routes.route('/<jd_id>/benefits', methods=['POST'])
def add_benefit(jd_id):
    """Add job benefit (Step 5 of wizard)"""
    try:
        data = request.get_json()
        benefit = data.get('benefit', {})
        
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}, 'benefits': []}
        
        # Add benefit
        updated_jd = jd_engine.add_benefit(jd_data, benefit)
        
        # TODO: Save to database
        
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


@jd_routes.route('/<jd_id>/compensation', methods=['PUT'])
def update_compensation(jd_id):
    """Update compensation information (Step 6 of wizard)"""
    try:
        data = request.get_json()
        compensation = data.get('compensation', {})
        
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}, 'compensation': {}}
        
        # Update compensation
        updated_jd = jd_engine.update_compensation(jd_data, compensation)
        
        # TODO: Save to database
        
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


@jd_routes.route('/<jd_id>/generate-description', methods=['POST'])
def generate_description(jd_id):
    """Generate AI-powered job description"""
    try:
        data = request.get_json()
        industry = data.get('industry')
        
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}, 'basic_info': {}}
        
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


@jd_routes.route('/<jd_id>/completion-score', methods=['GET'])
def get_completion_score(jd_id):
    """Get JD completion score and recommendations"""
    try:
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}}
        
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


@jd_routes.route('/<jd_id>/match-candidates', methods=['POST'])
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
        
        # TODO: Retrieve JD from database
        # For now, use placeholder
        jd_data = {
            'metadata': {'jd_id': jd_id},
            'basic_info': {'title': 'Software Engineer'},
            'description': '',
            'requirements': [],
            'responsibilities': []
        }
        
        # Get candidates from database
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
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
                current_position,
                current_company,
                employment_status,
                skills,
                preferred_salary_min,
                preferred_salary_max,
                cv_url,
                linkedin_url
            FROM users
            WHERE role = 'candidate'
                AND is_active = true
        """
        
        params = []
        
        # Add employment status filter if specified
        if employment_status_filter:
            if employment_status_filter.lower() == 'employed':
                query += " AND employment_status IN ('employed', 'currently_employed')"
            elif employment_status_filter.lower() == 'job_seeker':
                query += " AND employment_status IN ('job_seeker', 'unemployed', 'actively_looking')"
            elif employment_status_filter.lower() == 'open_to_opportunities':
                query += " AND employment_status IN ('open_to_opportunities', 'passive', 'open')"
        
        query += " LIMIT 1000"  # Limit to reasonable number for matching
        
        cur.execute(query, params)
        candidates = cur.fetchall()
        
        cur.close()
        conn.close()
        
        # Convert to list of dicts
        candidates_list = [dict(c) for c in candidates]
        
        logger.info(f"Matching {len(candidates_list)} candidates for JD {jd_id} with filter: {employment_status_filter}")
        
        # Match candidates
        match_result = ai_matching.match_candidates_for_job(
            jd_data,
            candidates_list,
            employment_status_filter,
            top_n
        )
        
        return jsonify(match_result)
        
    except Exception as e:
        logger.error(f"Error matching candidates for JD {jd_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'top_matches': []
        }), 500


@jd_routes.route('/<jd_id>/validate', methods=['POST'])
def validate_jd(jd_id):
    """Validate JD before publishing"""
    try:
        # TODO: Retrieve JD from database
        jd_data = {'metadata': {'jd_id': jd_id}}
        
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
@jd_routes.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@jd_routes.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500




@jd_routes.route('/<jd_id>/save', methods=['POST'])
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
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if recruiter_job_descriptions table exists, create if not
        cur.execute("""
            CREATE TABLE IF NOT EXISTS recruiter_job_descriptions (
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
        recruiter_id = metadata.get('recruiter_id') or data.get('recruiter_id') or 'unknown'
        company_id = metadata.get('company_id') or data.get('company_id') or 'unknown'
        
        # Check if JD already exists
        cur.execute("SELECT id FROM recruiter_job_descriptions WHERE jd_id = %s", (jd_id,))
        existing = cur.fetchone()
        
        if existing:
            # Update existing JD
            cur.execute("""
                UPDATE recruiter_job_descriptions SET
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
            # Insert new JD
            cur.execute("""
                INSERT INTO recruiter_job_descriptions (
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


@jd_routes.route('/<jd_id>/publish', methods=['POST'])
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


@jd_routes.route('/<jd_id>', methods=['GET'])
def get_jd(jd_id):
    """
    Retrieve a job description by ID
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT * FROM recruiter_job_descriptions WHERE jd_id = %s
        """, (jd_id,))
        
        jd = cur.fetchone()
        cur.close()
        conn.close()
        
        if not jd:
            return jsonify({'error': 'Job description not found'}), 404
        
        # Convert to dict and parse JSON fields
        jd_dict = dict(jd)
        jd_dict['requirements'] = json.loads(jd_dict['requirements']) if jd_dict.get('requirements') else []
        jd_dict['responsibilities'] = json.loads(jd_dict['responsibilities']) if jd_dict.get('responsibilities') else []
        jd_dict['benefits'] = json.loads(jd_dict['benefits']) if jd_dict.get('benefits') else []
        jd_dict['compensation'] = json.loads(jd_dict['compensation']) if jd_dict.get('compensation') else {}
        jd_dict['application_process'] = json.loads(jd_dict['application_process']) if jd_dict.get('application_process') else {}
        jd_dict['metadata'] = json.loads(jd_dict['metadata']) if jd_dict.get('metadata') else {}
        
        return jsonify(jd_dict), 200
        
    except Exception as e:
        logger.error(f"Error retrieving JD: {e}")
        return jsonify({'error': str(e)}), 500


@jd_routes.route('/list', methods=['GET'])
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
        recruiter_id = request.args.get('recruiter_id')
        company_id = request.args.get('company_id')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Build query with filters
        query = "SELECT * FROM recruiter_job_descriptions WHERE 1=1"
        params = []
        
        if recruiter_id:
            query += " AND recruiter_id = %s"
            params.append(recruiter_id)
        
        if company_id:
            query += " AND company_id = %s"
            params.append(company_id)
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cur.execute(query, params)
        jds = cur.fetchall()
        
        # Convert to list of dicts
        jd_list = [dict(jd) for jd in jds]
        
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

