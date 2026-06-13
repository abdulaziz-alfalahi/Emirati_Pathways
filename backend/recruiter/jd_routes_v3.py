#!/usr/bin/env python3
"""
Job Description Builder API Routes V3 (Debug Version)
"""

from flask import Blueprint, request, jsonify
import json
import logging
from typing import Dict, List, Optional, Any
from backend.db import get_db_connection
import psycopg2
import psycopg2.extras

# Import engines
from .jd_builder_engine import get_jd_builder_engine
from .ai_candidate_matching import get_ai_matching_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("!!! PRINT: LOADING JD_ROUTES_V3 MODULE !!!")

# Create Blueprint
jd_bp = Blueprint('jd_routes_v3', __name__, url_prefix='/api/recruiter/jd_v3')

@jd_bp.before_request
def log_request_info():
    print(f"!!! PRINT: BEFORE REQUEST: {request.url} !!!")
    logger.info(f"!!! LOGGER: BEFORE REQUEST: {request.url} !!!")

# Initialize components
jd_engine = get_jd_builder_engine()
ai_matching = get_ai_matching_engine()



def _get_jd_from_db(jd_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve JD from database and convert to JD engine format"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("SELECT * FROM job_postings WHERE jd_id = %s", (jd_id,))
        jd = cur.fetchone()
        cur.close()
        conn.close()
        
        if not jd:
            return None
        
        jd_dict = dict(jd)
        
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
        
        return {
            'basic_info': basic_info,
            'description': jd_dict.get('description', ''),
            'description_arabic': jd_dict.get('description_arabic'),
            'requirements': requirements,
            'responsibilities': responsibilities,
            'benefits': benefits,
            'compensation': compensation,
            'application_process': application_process,
            'metadata': metadata
        }
        
    except Exception as e:
        logger.error(f"Error retrieving JD {jd_id}: {e}")
        return None

@jd_bp.route('/health', methods=['GET'])
def jd_health():
    print("!!! PRINT: V3 HEALTH CHECK HIT !!!")
    return jsonify({'status': 'healthy_v3'})

@jd_bp.route('/<jd_id>/match-candidates', methods=['POST'])
def match_candidates(jd_id):
    """Match candidates debug route"""
    try:
        print(f"!!! PRINT: MATCH CANDIDATES V3 HIT for {jd_id} !!!")
        logger.info(f"!!! LOGGER: MATCH CANDIDATES V3 HIT for {jd_id} !!!")
        
        data = request.get_json() or {}
        top_n = data.get('top_n', 10)
        employment_status_filter = data.get('employment_status_filter')

        # Get JD
        jd_data = _get_jd_from_db(jd_id)
        if not jd_data:
            logger.error(f"JD not found: {jd_id}")
            return jsonify({'error': 'Job description not found'}), 404
            
        logger.info(f"JD Data Keys: {jd_data.keys()}")
        if 'requirements' in jd_data:
             logger.info(f"JD Requirements Count: {len(jd_data['requirements'])}")

        # Get Candidates
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
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
            LIMIT 100
        """
        cur.execute(query)
        candidates = [dict(c) for c in cur.fetchall()]
        cur.close()
        conn.close()
        
        logger.info(f"Found {len(candidates)} candidates")
        if candidates:
            logger.info(f"First candidate sample: {candidates[0].keys()}")
            logger.info(f"First candidate skills: {candidates[0].get('skills')}")

        # Match
        logger.info("Calling ai_matching.match_candidates_for_job...")
        match_result = ai_matching.match_candidates_for_job(
            jd_data,
            candidates,
            employment_status_filter,
            top_n
        )
        
        logger.info(f"Match Result Keys: {match_result.keys()}")
        if 'top_matches' in match_result:
            matches = match_result['top_matches']
            logger.info(f"Number of matches: {len(matches)}")
            if matches:
                logger.info(f"Top match keys: {matches[0].keys()}")
                logger.info(f"Top match score: {matches[0].get('match_score')}")
                logger.info(f"Top match details: {matches[0]}")
        
        return jsonify(match_result)

    except Exception as e:
        logger.error(f"Error in match_candidates_v3: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
