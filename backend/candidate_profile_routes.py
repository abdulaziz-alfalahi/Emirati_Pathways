"""
Candidate Profile Management Routes
Emirati Journey Platform - Candidate Profile System
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
import uuid
import os
import json
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
candidate_profile_bp = Blueprint('candidate_profile', __name__, url_prefix='/api/profile')

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

@candidate_profile_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for candidate profile functionality"""
    return jsonify({
        'success': True,
        'message': 'Candidate Profile API is operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Profile creation and management',
            'CV upload and parsing',
            'Skills and experience tracking',
            'Education and certification management',
            'Job preferences and availability',
            'Profile completion tracking'
        ]
    })

@candidate_profile_bp.route('/candidate', methods=['POST'])
@jwt_required()
def create_candidate_profile():
    """Create or update candidate profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Check if profile already exists
            cursor.execute("SELECT id FROM candidate_profiles WHERE user_id = %s", (current_user_id,))
            existing_profile = cursor.fetchone()
            
            # Extract data from request
            personal_info = data.get('personal_info', {})
            education = data.get('education', [])
            skills = data.get('skills', [])
            languages = data.get('languages', [])
            certifications = data.get('certifications', [])
            
            if existing_profile:
                # Update existing profile
                cursor.execute("""
                    UPDATE candidate_profiles SET
                        professional_summary = %s,
                        experience_years = %s,
                        current_position = %s,
                        current_company = %s,
                        salary_expectation = %s,
                        notice_period = %s,
                        preferred_locations = %s,
                        remote_work_preference = %s,
                        personal_info = %s,
                        education = %s,
                        skills = %s,
                        languages = %s,
                        certifications = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    RETURNING id
                """, (
                    data.get('professional_summary', ''),
                    data.get('experience_years', 0),
                    data.get('current_position', ''),
                    data.get('current_company', ''),
                    data.get('salary_expectation', 0),
                    data.get('notice_period', ''),
                    json.dumps(data.get('preferred_locations', [])),
                    data.get('remote_work_preference', False),
                    json.dumps(personal_info),
                    json.dumps(education),
                    json.dumps(skills),
                    json.dumps(languages),
                    json.dumps(certifications),
                    current_user_id
                ))
                
                profile_id = cursor.fetchone()['id']
                action = "updated"
            else:
                # Create new profile - let database generate UUID
                cursor.execute("""
                    INSERT INTO candidate_profiles (
                        user_id, professional_summary, experience_years,
                        current_position, current_company, salary_expectation,
                        notice_period, preferred_locations, remote_work_preference,
                        personal_info, education, skills, languages, certifications
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    current_user_id,
                    data.get('professional_summary', ''),
                    data.get('experience_years', 0),
                    data.get('current_position', ''),
                    data.get('current_company', ''),
                    data.get('salary_expectation', 0),
                    data.get('notice_period', ''),
                    json.dumps(data.get('preferred_locations', [])),
                    data.get('remote_work_preference', False),
                    json.dumps(personal_info),
                    json.dumps(education),
                    json.dumps(skills),
                    json.dumps(languages),
                    json.dumps(certifications)
                ))
                
                profile_id = cursor.fetchone()['id']
                action = "created"
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': f'Candidate profile {action} successfully',
                'data': {
                    'profile_id': profile_id,
                    'user_id': current_user_id
                }
            }), 201 if action == "created" else 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating/updating candidate profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create/update candidate profile'
        }), 500

@candidate_profile_bp.route('/candidate', methods=['GET'])
@jwt_required()
def get_candidate_profile():
    """Get candidate profile"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get candidate profile with user information
            cursor.execute("""
                SELECT 
                    cp.*,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.emirate,
                    u.nationality
                FROM candidate_profiles cp
                INNER JOIN users u ON cp.user_id = u.id
                WHERE cp.user_id = %s
            """, (current_user_id,))
            
            profile = cursor.fetchone()
            
            if not profile:
                return jsonify({
                    'success': False,
                    'message': 'Candidate profile not found'
                }), 404
            
            # Format the profile data
            profile_data = dict(profile)
            
            # Parse JSON fields
            json_fields = ['preferred_locations', 'personal_info', 'education', 'skills', 'languages', 'certifications']
            for field in json_fields:
                if profile_data.get(field):
                    try:
                        if isinstance(profile_data[field], str):
                            profile_data[field] = json.loads(profile_data[field])
                    except (json.JSONDecodeError, TypeError):
                        profile_data[field] = [] if field in ['preferred_locations', 'education', 'skills', 'languages', 'certifications'] else {}
            
            # Format dates
            if profile_data.get('created_at'):
                profile_data['created_at'] = profile_data['created_at'].isoformat()
            if profile_data.get('updated_at'):
                profile_data['updated_at'] = profile_data['updated_at'].isoformat()
            
            return jsonify({
                'success': True,
                'data': profile_data
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting candidate profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve candidate profile'
        }), 500

@candidate_profile_bp.route('/candidate/completion', methods=['GET'])
@jwt_required()
def get_profile_completion():
    """Get candidate profile completion status"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            cursor.execute("SELECT * FROM candidate_profiles WHERE user_id = %s", (current_user_id,))
            profile = cursor.fetchone()
            
            if not profile:
                return jsonify({
                    'success': True,
                    'data': {
                        'completion_percentage': 0,
                        'missing_sections': ['All sections need to be completed'],
                        'completed_sections': [],
                        'recommendations': ['Create your candidate profile to get started']
                    }
                })
            
            # Calculate completion percentage
            completion_score = 0
            total_sections = 8
            completed_sections = []
            missing_sections = []
            
            # Check each section
            if profile.get('professional_summary'):
                completion_score += 1
                completed_sections.append('Professional Summary')
            else:
                missing_sections.append('Professional Summary')
            
            if profile.get('experience_years', 0) > 0:
                completion_score += 1
                completed_sections.append('Experience')
            else:
                missing_sections.append('Experience')
            
            if profile.get('current_position'):
                completion_score += 1
                completed_sections.append('Current Position')
            else:
                missing_sections.append('Current Position')
            
            # Check education
            education = profile.get('education')
            if education:
                try:
                    education_data = json.loads(education) if isinstance(education, str) else education
                    if education_data and len(education_data) > 0:
                        completion_score += 1
                        completed_sections.append('Education')
                    else:
                        missing_sections.append('Education')
                except:
                    missing_sections.append('Education')
            else:
                missing_sections.append('Education')
            
            # Check skills
            skills = profile.get('skills')
            if skills:
                try:
                    skills_data = json.loads(skills) if isinstance(skills, str) else skills
                    if skills_data and len(skills_data) > 0:
                        completion_score += 1
                        completed_sections.append('Skills')
                    else:
                        missing_sections.append('Skills')
                except:
                    missing_sections.append('Skills')
            else:
                missing_sections.append('Skills')
            
            # Check languages
            languages = profile.get('languages')
            if languages:
                try:
                    languages_data = json.loads(languages) if isinstance(languages, str) else languages
                    if languages_data and len(languages_data) > 0:
                        completion_score += 1
                        completed_sections.append('Languages')
                    else:
                        missing_sections.append('Languages')
                except:
                    missing_sections.append('Languages')
            else:
                missing_sections.append('Languages')
            
            if profile.get('salary_expectation', 0) > 0:
                completion_score += 1
                completed_sections.append('Salary Expectations')
            else:
                missing_sections.append('Salary Expectations')
            
            # Check preferred locations
            preferred_locations = profile.get('preferred_locations')
            if preferred_locations:
                try:
                    locations_data = json.loads(preferred_locations) if isinstance(preferred_locations, str) else preferred_locations
                    if locations_data and len(locations_data) > 0:
                        completion_score += 1
                        completed_sections.append('Preferred Locations')
                    else:
                        missing_sections.append('Preferred Locations')
                except:
                    missing_sections.append('Preferred Locations')
            else:
                missing_sections.append('Preferred Locations')
            
            completion_percentage = (completion_score / total_sections) * 100
            
            # Generate recommendations
            recommendations = []
            if completion_percentage < 50:
                recommendations.append("Complete your basic profile information to improve visibility")
            if 'Skills' in missing_sections:
                recommendations.append("Add your technical and soft skills to match with relevant jobs")
            if 'Education' in missing_sections:
                recommendations.append("Add your educational background to strengthen your profile")
            if completion_percentage >= 80:
                recommendations.append("Your profile is almost complete! Consider adding certifications or additional experience details")
            
            return jsonify({
                'success': True,
                'data': {
                    'completion_percentage': round(completion_percentage, 1),
                    'completed_sections': completed_sections,
                    'missing_sections': missing_sections,
                    'recommendations': recommendations,
                    'total_sections': total_sections,
                    'completed_count': completion_score
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting profile completion: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get profile completion status'
        }), 500

@candidate_profile_bp.route('/candidate/cv', methods=['POST'])
@jwt_required()
def upload_cv():
    """Upload and parse CV for candidate profile"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if file is provided
        if 'cv_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No CV file provided'
            }), 400
        
        cv_file = request.files['cv_file']
        if cv_file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Save file temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            cv_file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        try:
            # Parse CV using existing CV parser
            from cv_parser import CVParser
            cv_parser = CVParser()
            
            # Parse the CV
            parsed_data = cv_parser.parse_cv_file(temp_file_path)
            
            if parsed_data.get('success'):
                cv_data = parsed_data.get('data', {})
                
                # Update candidate profile with parsed CV data
                conn = get_db_connection()
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                
                try:
                    # Check if profile exists
                    cursor.execute("SELECT id FROM candidate_profiles WHERE user_id = %s", (current_user_id,))
                    existing_profile = cursor.fetchone()
                    
                    # Extract relevant data from CV
                    professional_summary = cv_data.get('summary', '')
                    skills = cv_data.get('skills', [])
                    experience_years = cv_data.get('experience_years', 0)
                    education = cv_data.get('education', [])
                    languages = cv_data.get('languages', [])
                    
                    if existing_profile:
                        # Update existing profile with CV data
                        cursor.execute("""
                            UPDATE candidate_profiles SET
                                professional_summary = COALESCE(NULLIF(%s, ''), professional_summary),
                                experience_years = GREATEST(%s, experience_years),
                                skills = %s,
                                education = %s,
                                languages = %s,
                                cv_parsed_data = %s,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = %s
                        """, (
                            professional_summary,
                            experience_years,
                            json.dumps(skills),
                            json.dumps(education),
                            json.dumps(languages),
                            json.dumps(cv_data),
                            current_user_id
                        ))
                    else:
                        # Create new profile with CV data
                        cursor.execute("""
                            INSERT INTO candidate_profiles (
                                user_id, professional_summary, experience_years,
                                skills, education, languages, cv_parsed_data
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (
                            current_user_id,
                            professional_summary,
                            experience_years,
                            json.dumps(skills),
                            json.dumps(education),
                            json.dumps(languages),
                            json.dumps(cv_data)
                        ))
                    
                    conn.commit()
                    
                    return jsonify({
                        'success': True,
                        'message': 'CV uploaded and parsed successfully',
                        'data': {
                            'parsed_data': cv_data,
                            'profile_updated': True
                        }
                    })
                    
                finally:
                    cursor.close()
                    conn.close()
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to parse CV',
                    'details': parsed_data.get('message', 'Unknown error')
                }), 400
                
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        logger.error(f"Error uploading CV: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload and parse CV'
        }), 500

@candidate_profile_bp.route('/candidate/preferences', methods=['POST'])
@jwt_required()
def update_job_preferences():
    """Update candidate job preferences"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No preferences data provided'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Update job preferences
            cursor.execute("""
                UPDATE candidate_profiles SET
                    salary_expectation = COALESCE(%s, salary_expectation),
                    notice_period = COALESCE(%s, notice_period),
                    preferred_locations = COALESCE(%s, preferred_locations),
                    remote_work_preference = COALESCE(%s, remote_work_preference),
                    job_preferences = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
                RETURNING id
            """, (
                data.get('salary_expectation'),
                data.get('notice_period'),
                json.dumps(data.get('preferred_locations')) if data.get('preferred_locations') else None,
                data.get('remote_work_preference'),
                json.dumps(data),
                current_user_id
            ))
            
            result = cursor.fetchone()
            if not result:
                return jsonify({
                    'success': False,
                    'message': 'Candidate profile not found. Please create a profile first.'
                }), 404
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Job preferences updated successfully'
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error updating job preferences: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update job preferences'
        }), 500
