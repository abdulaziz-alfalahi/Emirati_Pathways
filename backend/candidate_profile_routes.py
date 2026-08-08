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
from werkzeug.utils import secure_filename
from typing import Dict, List, Any, Optional

from backend.db import get_db_connection
try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query
try:
    from backend.auth.access_control import require_roles, resolve_roles, CAREER_SERVICES_ROLES, ADMIN_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, resolve_roles, CAREER_SERVICES_ROLES, ADMIN_ROLES

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
candidate_profile_bp = Blueprint('candidate_profile', __name__, url_prefix='/api/profile')

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
            
            # Extract location coordinates
            latitude = data.get('latitude') or personal_info.get('latitude')
            longitude = data.get('longitude') or personal_info.get('longitude')
            
            # Update generic location string if not present but coordinates are
            if (not personal_info.get('location')) and latitude and longitude:
                 personal_info['location'] = f"{latitude}, {longitude}"

            # Update user_cvs with location for matching service
            if latitude is not None and longitude is not None:
                try:
                    cursor.execute("SAVEPOINT loc_update")
                    
                    # Check if user_cv exists
                    cursor.execute("SELECT id FROM user_cvs WHERE user_id = %s", (current_user_id,))
                    cv_exists = cursor.fetchone()
                    
                    if cv_exists:
                        cursor.execute("""
                            UPDATE user_cvs 
                            SET latitude = %s, longitude = %s, updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = %s
                        """, (latitude, longitude, current_user_id))
                    else:
                        # Create empty CV entry with just location/user_id if it doesn't exist
                        # This ensures the matching service has a record to look up
                        cursor.execute("""
                            INSERT INTO user_cvs (
                                id, user_id, latitude, longitude, 
                                title, status, is_visible, created_at, updated_at
                            )
                            VALUES (
                                %s, %s, %s, %s, 
                                'Profile Location Placeholder', 'draft', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                            )
                        """, (str(uuid.uuid4()), current_user_id, latitude, longitude))
                    
                    cursor.execute("RELEASE SAVEPOINT loc_update")
                    logger.info(f"Updated location for user {current_user_id}: {latitude}, {longitude}")
                except Exception as loc_error:
                    cursor.execute("ROLLBACK TO SAVEPOINT loc_update")
                    logger.error(f"Failed to update location in user_cvs: {loc_error}")
                    # Don't fail the whole request, but log error
            
            if existing_profile:
                # Update existing profile
                cursor.execute("""
                    UPDATE candidate_profiles SET
                        bio = COALESCE(NULLIF(%s, ''), bio),
                        experience_years = %s,
                        current_position = %s,
                        current_company = %s,
                        salary_expectation = %s,
                        notice_period = %s,
                        preferred_locations = %s,
                        remote_work_preference = %s,
                        personal_info = %s,
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
                    current_user_id
                ))
                
                profile_id = cursor.fetchone()['id']
                action = "updated"
            else:
                # Create new profile
                cursor.execute("""
                    INSERT INTO candidate_profiles (
                        user_id, bio, experience_years,
                        current_position, current_company, salary_expectation,
                        notice_period, preferred_locations, remote_work_preference,
                        personal_info
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                    json.dumps(personal_info)
                ))
                
                profile_id = cursor.fetchone()['id']
                action = "created"
            
            # Update user_cvs with skills/education/etc (Main Table)
            cursor.execute("SELECT id FROM user_cvs WHERE user_id = %s", (current_user_id,))
            existing_cv = cursor.fetchone()
            
            # Map fields to user_cvs columns
            tech_skills = data.get('skills', [])
            work_exp = [] # Form typically relies on parsed CV for this, but could be passed
            if data.get('experience'):
                work_exp = data.get('experience')
            
            edu_json = json.dumps(education) if education else '[]'
            skills_json = json.dumps(tech_skills) if tech_skills else '[]'
            langs_json = json.dumps(languages) if languages else '[]'
            certs_json = json.dumps(certifications) if certifications else '[]'
            
            if existing_cv:
                cursor.execute("""
                    UPDATE user_cvs SET
                        technical_skills = CASE WHEN %s::jsonb != '[]'::jsonb THEN %s::jsonb ELSE technical_skills END,
                        education = CASE WHEN %s::jsonb != '[]'::jsonb THEN %s::jsonb ELSE education END,
                        languages_spoken = CASE WHEN %s::jsonb != '[]'::jsonb THEN %s::jsonb ELSE languages_spoken END,
                        certifications = CASE WHEN %s::jsonb != '[]'::jsonb THEN %s::jsonb ELSE certifications END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (
                    skills_json, skills_json,
                    edu_json, edu_json,
                    langs_json, langs_json,
                    certs_json, certs_json,
                    existing_cv['id']
                ))
            else:
                 # Create user_cv if not exists (e.g. manual profile creation without CV upload)
                 cursor.execute("""
                    INSERT INTO user_cvs (
                        id, user_id, 
                        technical_skills, education, languages_spoken, certifications,
                        status, is_visible, created_at, updated_at,
                        title
                    ) VALUES (
                        %s, %s, 
                        %s, %s, %s, %s,
                        'active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                        'Candidate Profile'
                    )
                 """, (
                     str(uuid.uuid4()), current_user_id,
                     skills_json, edu_json, langs_json, certs_json
                 ))

            # Sync basic info to users table
            # Extract names from personal_info which ProfileForm sends split or as whole
            # ProfileForm logic sends first_name/last_name inside personal_info structure
            u_first_name = personal_info.get('first_name')
            u_last_name = personal_info.get('last_name')
            u_phone = personal_info.get('phone')
            
            if u_first_name or u_last_name:
                cursor.execute("""
                    UPDATE users 
                    SET first_name = COALESCE(%s, first_name),
                        last_name = COALESCE(%s, last_name),
                        phone = COALESCE(%s, phone),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (u_first_name, u_last_name, u_phone, current_user_id))            
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
        # Include the error message in the response for debugging purposes
        return jsonify({
            'success': False,
            'message': f'Failed to create/update candidate profile: {str(e)}'
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

            # Ensure profile photo URL is absolute
            if profile_data.get('profile_photo_url'):
                photo_url = profile_data['profile_photo_url']
                if photo_url.startswith('/'):
                    # Prepend host URL to make it absolute (bypassing frontend proxy requirement)
                    base_url = request.url_root.rstrip('/')
                    profile_data['profile_photo_url'] = f"{base_url}{photo_url}"
            
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
                # Also store in centralized CV Storage (for Dashboard/Stats visibility)
                try:
                    from cv_storage_manager import cv_storage_manager
                    
                    # Prepare data for storage manager
                    storage_data = {
                        'data': cv_data,
                        'analysis': parsed_data.get('analysis', {}),
                        'file_info': {
                            'original_filename': cv_file.filename,
                            'file_size': os.path.getsize(temp_file_path),
                            'file_type': cv_file.content_type or 'application/pdf',
                            'mime_type': cv_file.content_type or 'application/pdf',
                            'upload_timestamp': datetime.utcnow().isoformat()
                        }
                    }
                    
                    # Store and log
                    cv_storage_manager.store_cv(storage_data, str(current_user_id))
                    logger.info(f"✅ CV stored in centralized system for user {current_user_id}")
                    
                except Exception as e:
                    logger.error(f"⚠️ Failed to store CV in centralized system: {str(e)}")
                    # Continue - do not block the main update
                
                try:
                    conn = get_db_connection()
                    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

                    # Extract relevant data from CV
                    professional_summary = cv_data.get('summary', '')
                    skills = cv_data.get('skills', [])
                    experience_years = cv_data.get('experience_years', 0)
                    education = cv_data.get('education', [])
                    languages = cv_data.get('languages', [])
                    
                    # 1. Update candidate_profiles (Basic Info)
                    # Map summary to bio since professional_summary column is missing
                    # Use headline from CV if available, or generate from summary
                    headline = cv_data.get('title') or (professional_summary[:100] + '...' if len(professional_summary) > 100 else professional_summary)
                    
                    # Check if profile exists
                    cursor.execute("SELECT id FROM candidate_profiles WHERE user_id = %s", (current_user_id,))
                    existing_profile = cursor.fetchone()

                    if existing_profile:
                        cursor.execute("""
                            UPDATE candidate_profiles SET
                                bio = COALESCE(NULLIF(%s, ''), bio),
                                headline = COALESCE(NULLIF(%s, ''), headline),
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = %s
                        """, (professional_summary, headline, current_user_id))
                    else:
                        cursor.execute("""
                            INSERT INTO candidate_profiles (user_id, bio, headline)
                            VALUES (%s, %s, %s)
                        """, (current_user_id, professional_summary, headline))

                    # 2. Update user_cvs (Detailed CV Data - The "Main Table")
                    # Check if user_cv entry exists
                    cursor.execute("SELECT id FROM user_cvs WHERE user_id = %s", (current_user_id,))
                    existing_cv = cursor.fetchone()
                    
                    cv_id = existing_cv['id'] if existing_cv else str(uuid.uuid4())
                    
                    if existing_cv:
                        cursor.execute("""
                            UPDATE user_cvs SET
                                professional_summary = %s,
                                technical_skills = %s,
                                work_experience = %s,
                                education = %s,
                                languages_spoken = %s,
                                status = 'active',
                                is_visible = true,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = %s
                        """, (
                            professional_summary,
                            json.dumps(skills),
                            json.dumps(cv_data.get('experience', [])),
                            json.dumps(education),
                            json.dumps(languages),
                            cv_id
                        ))
                    else:
                        cursor.execute("""
                            INSERT INTO user_cvs (
                                id, user_id, 
                                professional_summary, technical_skills, work_experience, 
                                education, languages_spoken,
                                status, is_visible, 
                                created_at, updated_at
                            ) VALUES (
                                %s, %s, 
                                %s, %s, %s, 
                                %s, %s, 
                                'active', true, 
                                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                            )
                        """, (
                            cv_id, current_user_id,
                            professional_summary,
                            json.dumps(skills),
                            json.dumps(cv_data.get('experience', [])),
                            json.dumps(education),
                            json.dumps(languages)
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
                    if 'cursor' in locals(): cursor.close()
                    if 'conn' in locals(): conn.close()
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

@candidate_profile_bp.route('/candidate/photo', methods=['POST'])
@jwt_required()
def upload_photo():
    """Upload candidate profile photo"""
    try:
        current_user_id = str(get_jwt_identity())
        
        if 'photo' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No photo file provided'
            }), 400
            
        file = request.files['photo']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
            
        # Secure filename and create unique name
        filename = secure_filename(file.filename)
        filename = f"profile_{current_user_id}_{uuid.uuid4().hex[:8]}_{filename}"

        # Save via storage service
        try:
            from backend.services.storage import storage as _storage
        except ImportError:
            try:
                from services.storage import storage as _storage
            except ImportError:
                _storage = None

        if _storage:
            storage_key = _storage.save_upload(file, 'profile_photos', filename)
            photo_url = _storage.get_url(f'profile_photos/{filename}')
            logger.info(f"Photo saved via storage service: {storage_key}")
        else:
            # Fallback to direct filesystem
            current_dir = os.path.dirname(os.path.abspath(__file__))
            upload_dir = os.path.join(current_dir, 'uploads', 'profile_photos')
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            photo_url = f"/uploads/profile_photos/{filename}"
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            cursor.execute("""
                UPDATE candidate_profiles 
                SET profile_photo_url = %s, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
                RETURNING profile_photo_url
            """, (photo_url, current_user_id))
            
            result = cursor.fetchone()
            if not result:
                # Auto-create profile if missing to allow photo upload
                cursor.execute("""
                    INSERT INTO candidate_profiles (user_id, profile_photo_url, created_at, updated_at)
                    VALUES (%s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING profile_photo_url
                """, (current_user_id, photo_url))
                result = cursor.fetchone()
            
            conn.commit()
            
            conn.commit()
            
            # Construct absolute URL for response
            base_url = request.url_root.rstrip('/')
            full_photo_url = f"{base_url}{photo_url}"

            return jsonify({
                'success': True,
                'message': 'Photo uploaded successfully',
                'data': {
                    'photo_url': full_photo_url
                }
            })
            
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        logger.error(f"Error uploading photo: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload photo'
        }), 500

# A record an agent can actually work: some phone or email, and not an
# anonymised (deleted) account retained for referential integrity.
UNCONTACTABLE_SQL = (
    "(\n"
    "    (COALESCE(NULLIF(TRIM(u.phone), ''), NULLIF(TRIM(cp.alternative_phone), '')) IS NOT NULL\n"
    "     OR NULLIF(TRIM(u.email), '') IS NOT NULL)\n"
    "    AND COALESCE(u.email, '') NOT ILIKE '%%@anonymized.local'\n"
    ")"
)


@candidate_profile_bp.route('/crm-last-import', methods=['GET'])
@require_roles(*CAREER_SERVICES_ROLES)
def get_crm_last_import():
    """When candidate data genuinely last came from NAFIS.

    The CRM's refresh button re-reads this database; it does not contact NAFIS.
    Operators asked to see a "last synced" time next to it, which would have
    described the refresh and implied data had just arrived from NAFIS. What
    they actually need to know is when the roster was last IMPORTED, which is
    what this returns — from nafis_import_batches, the record of real imports.
    Returns null when no import has ever run, rather than a comforting default.
    """
    try:
        row = execute_query("""
            SELECT batch_code, filename, total_records, successful, failed,
                   duplicates, status, created_at
            FROM nafis_import_batches
            WHERE status = 'completed'
            ORDER BY created_at DESC
            LIMIT 1
        """, fetch_one=True)
        if not row:
            return jsonify({'success': True, 'data': None})
        return jsonify({'success': True, 'data': {
            'batch_code': row.get('batch_code'),
            'filename': row.get('filename'),
            'total_records': row.get('total_records'),
            'successful': row.get('successful'),
            'failed': row.get('failed'),
            'duplicates': row.get('duplicates'),
            'imported_at': row['created_at'].isoformat() if row.get('created_at') else None,
        }})
    except Exception as e:
        logger.error(f"crm last import failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to read the import history'}), 500


@candidate_profile_bp.route('/crm-candidates', methods=['GET'])
@require_roles(*CAREER_SERVICES_ROLES)
def get_crm_candidates():
    """Get all candidates for Career Services CRM.

    Career-services staff only. This returns candidate PII (national_id,
    phone, counselling notes); it was previously @jwt_required() with no
    role check, so any authenticated user could enumerate the whole roster
    (security fix, P0). require_roles resolves secondary_roles too.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Caseload scoping (horizontal-BOLA fix): supervisors (admin + the
        # career-services/operator roles that assign caseloads) see the whole
        # roster; a front-line agent (e.g. call_center_agent) sees ONLY the
        # candidates assigned to them — otherwise every agent could read every
        # candidate's national ID / phone / counselling notes.
        me = str(get_jwt_identity())
        supervisor = bool(resolve_roles() & (ADMIN_ROLES | {'career_services_operator', 'operator'}))
        try:
            base = """
                SELECT
                    u.id,
                    u.emirates_id_enc as national_id,
                    u.full_name,
                    u.first_name,
                    u.last_name,
                    u.phone,
                    cp.call_status,
                    cp.work_status,
                    cp.job_seeker_type,
                    cp.counseling_remarks,
                    cp.assigned_to,
                    cp.crm_segments,
                    cp.crm_reference,
                    cp.cv_status,
                    cp.looking_status,
                    cp.date_of_call,
                    cp.education_level,
                    cp.age_group,
                    cp.emirate_of_residence,
                    cp.preferred_locations,
                    cp.preferred_sector,
                    cp.preferred_work_setup,
                    cp.preferred_schedule,
                    cp.alternative_phone,
                    cp.unavailability_reason,
                    cp.role_preferences,
                    -- Counselling fields the team records on a call. Several
                    -- already existed but were never returned, so the form
                    -- could not show what a previous agent had established.
                    cp.is_student,
                    cp.specialization,
                    cp.english_proficiency,
                    cp.salary_expectations,
                    cp.candidates_source,
                    cp.previous_work_location,
                    cp.gpa,
                    cp.graduation_date,
                    cp.sub_specialization,
                    cp.experience_duration,
                    cp.military_status,
                    cp.field_preference,
                    cp.job_search_duration,
                    COALESCE(au.full_name,
                             NULLIF(TRIM(CONCAT_WS(' ', au.first_name, au.last_name)), ''),
                             au.email) AS assigned_to_name
                FROM users u
                LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
                LEFT JOIN users au ON au.id = cp.assigned_to
                WHERE (u.role = 'candidate' OR u.user_type = 'candidate')
            """
            # -- Filtering and pagination, in SQL ------------------------
            # This used to select the whole roster (LIMIT 100000) and let the
            # browser search, filter and paginate it. At 5,310 candidates that
            # was already a 5.5 MB, 3.7-second response carrying every
            # candidate's Emirates ID, phone and counselling notes. The platform
            # targets all Dubai nationals aged 15+ -- of the order of 150,000
            # people -- where the same approach is roughly 155 MB per page load.
            # It also shipped the entire roster's PII to a browser in order to
            # display twenty rows of it.
            where, params = [], []
            if not supervisor:
                where.append("cp.assigned_to = %s")
                params.append(me)

            q = (request.args.get('q') or '').strip()
            if q:
                # Name, Emirates ID or phone -- the team routinely has only the
                # number. Digits are compared with separators and the local or
                # country prefix stripped, so 0501234567, +971501234567 and
                # 971501234567 all find the same person.
                digits = ''.join(ch for ch in q if ch.isdigit())
                clauses = ["COALESCE(u.full_name, CONCAT_WS(' ', u.first_name, u.last_name)) ILIKE %s"]
                params.append('%' + q + '%')
                if digits:
                    clauses.append("CAST(u.id AS TEXT) LIKE %s")
                    params.append('%' + digits + '%')
                    clauses.append("COALESCE(u.emirates_id_enc, '') LIKE %s")
                    params.append('%' + digits + '%')
                    stripped = digits.lstrip('0')
                    stripped = stripped[3:] if stripped.startswith('971') else stripped
                    clauses.append("REGEXP_REPLACE(COALESCE(u.phone,''),'[^0-9]','','g') LIKE %s")
                    params.append('%' + (stripped or digits) + '%')
                where.append("(" + " OR ".join(clauses) + ")")

            for _param, _col in (('call_status', 'cp.call_status'),
                                 ('work_status', 'cp.work_status')):
                val = (request.args.get(_param) or '').strip()
                if val and val.lower() != 'all':
                    where.append("COALESCE(" + _col + ", 'Unknown') = %s")
                    params.append(val)

            segment = (request.args.get('segment') or '').strip()
            if segment and segment.lower() != 'all':
                where.append("cp.crm_segments::jsonb ? %s")
                params.append(segment)

            # The "hide" clause is kept OUT of `where` so the checkbox's own
            # count can be measured against the other filters only. Folding it
            # in would make the label read "hide 0 records" the moment it was
            # ticked, which reads as though the toggle had found nothing.
            hide_uncontactable = (request.args.get('hide_uncontactable') or '').lower() \
                in ('1', 'true', 'yes')

            where_sql = (" AND " + " AND ".join(where)) if where else ""
            # No phone and no email means an agent cannot work the record.
            # Anonymised rows are deleted accounts kept for referential
            # integrity; they are not people anyone can ring.
            page_where_sql = where_sql + (" AND " + UNCONTACTABLE_SQL if hide_uncontactable else "")

            try:
                page = max(int(request.args.get('page', 1)), 1)
            except (TypeError, ValueError):
                page = 1
            try:
                per_page = min(max(int(request.args.get('per_page', 20)), 1), 100)
            except (TypeError, ValueError):
                per_page = 20

            _from = ("FROM users u LEFT JOIN candidate_profiles cp ON u.id = cp.user_id "
                     "WHERE (u.role = 'candidate' OR u.user_type = 'candidate')")
            scope_sql = _from + page_where_sql          # exactly what the page shows
            filter_scope_sql = _from + where_sql        # same, minus the hide toggle

            cursor.execute("SELECT COUNT(*) AS n " + scope_sql, tuple(params))
            total = int((cursor.fetchone() or {}).get('n') or 0)

            # Summary for the cards, computed over the SAME filter set as the
            # page -- so the headline figures always describe what the agent is
            # looking at, not a different population.
            cursor.execute(
                "SELECT "
                " COUNT(*) FILTER (WHERE cp.call_status = 'Answered') AS contacted,"
                " COUNT(*) FILTER (WHERE cp.call_status IN "
                "   ('No Answer','Invalid Number','Not Reachable','Switched Off')) AS no_answer,"
                " COUNT(*) FILTER (WHERE cp.assigned_to IS NULL) AS unassigned "
                + scope_sql, tuple(params))
            summary_row = cursor.fetchone() or {}

            # How many the "hide" toggle would remove, so the checkbox can show
            # a count without the client holding the roster to count it. Measured
            # against the other filters but NOT against the toggle itself, so the
            # number stays steady whether it is ticked or not.
            cursor.execute(
                "SELECT COUNT(*) AS n " + filter_scope_sql + " AND NOT " + UNCONTACTABLE_SQL,
                tuple(params))
            uncontactable_total = int((cursor.fetchone() or {}).get('n') or 0)

            cursor.execute(base + page_where_sql + " ORDER BY u.created_at DESC LIMIT %s OFFSET %s",
                           tuple(params) + (per_page, (page - 1) * per_page))
            candidates = cursor.fetchall()
            
            # Format the output for the frontend
            formatted = []
            for c in candidates:
                full_name = c['full_name']
                if not full_name:
                    first = c['first_name'] or ''
                    last = c['last_name'] or ''
                    full_name = f"{first} {last}".strip() or 'Unnamed Candidate'
                    
                formatted.append({
                    'id': c['id'],
                    'national_id': c['national_id'],
                    'full_name': full_name,
                    'first_name': c['first_name'],
                    'last_name': c['last_name'],
                    'phone': c['phone'],
                    'profile': {
                        'call_status': c['call_status'],
                        'work_status': c['work_status'],
                        'job_seeker_type': c['job_seeker_type'],
                        'counseling_remarks': c['counseling_remarks'],
                        'assigned_to': c['assigned_to'],
                        'crm_segments': c['crm_segments'] or [],
                        'crm_reference': c['crm_reference'],
                        'cv_status': c['cv_status'],
                        'looking_status': c['looking_status'],
                        'date_of_call': str(c['date_of_call']) if c['date_of_call'] else None,
                        'education_level': c['education_level'],
                        'age_group': c['age_group'],
                        'emirate_of_residence': c['emirate_of_residence'],
                        # Display name for id-valued assignments; null for legacy
                        # name-valued rows (the raw value is then already a name).
                        'assigned_to_name': c['assigned_to_name'],
                        'preferred_locations': c['preferred_locations'],
                        'preferred_sector': c['preferred_sector'],
                        'preferred_work_setup': c['preferred_work_setup'],
                        'preferred_schedule': c['preferred_schedule'],
                        'alternative_phone': c['alternative_phone'],
                        'unavailability_reason': c['unavailability_reason'],
                        'role_preferences': c['role_preferences'],
                        'is_student': c['is_student'],
                        'specialization': c['specialization'],
                        'english_proficiency': c['english_proficiency'],
                        'salary_expectations': c['salary_expectations'],
                        'candidates_source': c['candidates_source'],
                        'previous_work_location': c['previous_work_location'],
                        'gpa': c['gpa'],
                        'graduation_date': c['graduation_date'],
                        'sub_specialization': c['sub_specialization'],
                        'experience_duration': c['experience_duration'],
                        'military_status': c['military_status'],
                        'field_preference': c['field_preference'],
                        'job_search_duration': c['job_search_duration']
                    }
                })
                
            return jsonify({
                'success': True,
                'data': formatted,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'total_pages': (total + per_page - 1) // per_page if per_page else 1,
                },
                # Headline figures for the CRM cards. Counted in SQL over
                # the same filters as the page, because the client no
                # longer holds the roster and must not infer totals from
                # the twenty rows it can see.
                'summary': {
                    'total': total,
                    'contacted': int(summary_row.get('contacted') or 0),
                    'no_answer': int(summary_row.get('no_answer') or 0),
                    'unassigned': int(summary_row.get('unassigned') or 0),
                    'uncontactable': uncontactable_total,
                },
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting CRM candidates: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get CRM candidates'
        }), 500

@candidate_profile_bp.route('/crm-stats', methods=['GET'])
@require_roles(*CAREER_SERVICES_ROLES)
def get_crm_stats():
    """Aggregates + roster-movement series for the Career Services dashboard.

    Mirrors the CRM team's "Main Master File" workbook dashboards (segments,
    call/work/looking status, education, age, emirate, weekly added/removed)
    so the team can work on-platform instead of Excel. Roster = profiles with
    a crm_reference (imported via scripts/import_crm_master.py) — live edits
    on the platform update these same rows.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            def breakdown(col):
                cursor.execute(f"""
                    SELECT COALESCE(NULLIF(TRIM({col}), ''), 'Unknown') AS label, COUNT(*) AS count
                    FROM candidate_profiles WHERE crm_reference IS NOT NULL
                    GROUP BY 1 ORDER BY 2 DESC
                """)
                return [dict(r) for r in cursor.fetchall()]

            cursor.execute("SELECT COUNT(*) AS n FROM candidate_profiles WHERE crm_reference IS NOT NULL")
            total = cursor.fetchone()['n']

            cursor.execute("""
                SELECT seg AS label, COUNT(*) AS count
                FROM candidate_profiles, jsonb_array_elements_text(crm_segments) seg
                WHERE crm_reference IS NOT NULL
                GROUP BY 1 ORDER BY 2 DESC
            """)
            segments = [dict(r) for r in cursor.fetchall()]

            cursor.execute("""
                SELECT period_label AS label, period_date, added, removed
                FROM crm_roster_history WHERE period_type = 'week'
                ORDER BY period_date DESC LIMIT 26
            """)
            weeks = [dict(r, period_date=str(r['period_date'])) for r in cursor.fetchall()][::-1]

            cursor.execute("""
                SELECT period_label AS label, period_date, added, removed
                FROM crm_roster_history WHERE period_type = 'month'
                ORDER BY period_date
            """)
            months = [dict(r, period_date=str(r['period_date'])) for r in cursor.fetchall()]

            # Roster vintage = the newest period in the movement history, which
            # tracks the master-file drop date (auto-updates on every import).
            cursor.execute("SELECT MAX(period_date) AS d FROM crm_roster_history")
            _as_of = cursor.fetchone()['d']

            return jsonify({'success': True, 'data': {
                'total_roster': total,
                'roster_as_of': str(_as_of) if _as_of else None,
                'segments': segments,
                'call_status': breakdown('call_status'),
                'work_status': breakdown('work_status'),
                'looking_status': breakdown('looking_status'),
                'job_seeker_type': breakdown('job_seeker_type'),
                'cv_status': breakdown('cv_status'),
                'education_level': breakdown('education_level'),
                'age_group': breakdown('age_group'),
                'gender': breakdown('gender'),
                'emirate_of_residence': breakdown('emirate_of_residence'),
                'roster_history': {'weeks': weeks, 'months': months},
            }})
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error getting CRM stats: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get CRM stats'}), 500


def _blank_to_none(v):
    """'' and the dropdown's 'none' sentinel mean "not recorded", not a value.

    Without this every COALESCE above would happily store an empty string, and
    "no answer yet" would become indistinguishable from a recorded blank.
    """
    if v is None:
        return None
    v = str(v).strip()
    return None if v == '' or v.lower() == 'none' else v


@candidate_profile_bp.route('/crm-candidates/<user_id>', methods=['PUT'])
@require_roles(*CAREER_SERVICES_ROLES)
def update_crm_candidate(user_id):
    """Update CRM specific fields for a candidate.

    Career-services staff only (P0 security fix — was @jwt_required() with
    no role check, so any user could overwrite any candidate's counselling
    record). require_roles resolves secondary_roles too.
    """
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        try:
            cursor.execute("SELECT id, assigned_to FROM candidate_profiles WHERE user_id = %s", (user_id,))
            exists = cursor.fetchone()
            # Caseload scoping (BOLA fix): a front-line agent may only edit a
            # candidate assigned to them; supervisors/admin may edit any.
            me = str(get_jwt_identity())
            supervisor = bool(resolve_roles() & (ADMIN_ROLES | {'career_services_operator', 'operator'}))
            if not supervisor and exists and str(exists.get('assigned_to') or '') != me:
                cursor.close(); conn.close()
                return jsonify({'success': False,
                                'message': 'This candidate is not on your caseload'}), 403
            
            import json
            preferred_locations = data.get('preferredLocations')
            if preferred_locations is not None:
                preferred_locations = json.dumps(preferred_locations)

            # Normalise the assignee: the CRM's "Unassigned" dropdown value (and
            # blanks) must persist as NULL, not the literal string 'Unassigned',
            # so the caseload column stays a clean user-id-or-NULL (C4 [C4-CSO-2]).
            _assigned_raw = data.get('assignedTo')
            assigned_to_val = None if str(_assigned_raw or '').strip().lower() in (
                '', 'unassigned', 'none', 'null') else _assigned_raw

            if exists:
                # COALESCE on every counselling field the form may omit: a
                # counselling record is built over several calls, and a partial
                # save must not blank what an earlier call established.
                # date_of_call is stamped by the server on each save — the team
                # asked for it to be automatic, and a client-supplied date would
                # be a claim about when a call happened rather than a record.
                cursor.execute("""
                    UPDATE candidate_profiles SET
                        call_status = %s,
                        work_status = %s,
                        cv_status = COALESCE(%s, cv_status),
                        looking_status = COALESCE(%s, looking_status),
                        counseling_remarks = %s,
                        assigned_to = %s,
                        preferred_locations = %s,
                        preferred_sector = %s,
                        preferred_work_setup = %s,
                        preferred_schedule = %s,
                        alternative_phone = %s,
                        unavailability_reason = %s,
                        role_preferences = %s,
                        education_level        = COALESCE(%s, education_level),
                        is_student             = COALESCE(%s, is_student),
                        specialization         = COALESCE(%s, specialization),
                        english_proficiency    = COALESCE(%s, english_proficiency),
                        salary_expectations    = COALESCE(%s, salary_expectations),
                        candidates_source      = COALESCE(%s, candidates_source),
                        previous_work_location = COALESCE(%s, previous_work_location),
                        gpa                    = COALESCE(%s, gpa),
                        graduation_date        = COALESCE(%s, graduation_date),
                        sub_specialization     = COALESCE(%s, sub_specialization),
                        experience_duration    = COALESCE(%s, experience_duration),
                        military_status        = COALESCE(%s, military_status),
                        field_preference       = COALESCE(%s, field_preference),
                        job_search_duration    = COALESCE(%s, job_search_duration),
                        date_of_call           = CURRENT_TIMESTAMP,
                        updated_at             = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('callStatus'),
                    data.get('workStatus'),
                    data.get('cvStatus'),
                    data.get('lookingStatus'),
                    data.get('remarks'),
                    assigned_to_val,
                    preferred_locations,
                    data.get('preferredSector'),
                    data.get('preferredWorkSetup'),
                    data.get('preferredSchedule'),
                    data.get('alternativePhone'),
                    data.get('unavailabilityReason'),
                    data.get('rolePreferences'),
                    _blank_to_none(data.get('educationLevel')),
                    data.get('isStudent'),
                    _blank_to_none(data.get('specialization')),
                    _blank_to_none(data.get('englishLevel')),
                    _blank_to_none(data.get('salaryExpectations')),
                    _blank_to_none(data.get('candidatesSource')),
                    _blank_to_none(data.get('previousWorkLocation')),
                    _blank_to_none(data.get('gpa')),
                    _blank_to_none(data.get('graduationDate')),
                    _blank_to_none(data.get('subSpecialization')),
                    _blank_to_none(data.get('experienceDuration')),
                    _blank_to_none(data.get('militaryStatus')),
                    _blank_to_none(data.get('fieldPreference')),
                    _blank_to_none(data.get('jobSearchDuration')),
                    user_id
                ))
            else:
                cursor.execute("""
                    INSERT INTO candidate_profiles (
                        user_id, call_status, work_status, counseling_remarks, assigned_to,
                        preferred_locations, preferred_sector, preferred_work_setup, preferred_schedule, alternative_phone, unavailability_reason, role_preferences
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    data.get('callStatus'),
                    data.get('workStatus'),
                    data.get('remarks'),
                    assigned_to_val,
                    preferred_locations,
                    data.get('preferredSector'),
                    data.get('preferredWorkSetup'),
                    data.get('preferredSchedule'),
                    data.get('alternativePhone'),
                    data.get('unavailabilityReason'),
                    data.get('rolePreferences')
                ))
                
            conn.commit()

            # New assignee gets told their caseload grew (C4 gap: assignment
            # changed hands with zero signal). Only for id-valued assignees
            # that actually changed, and never for self-assignment.
            try:
                prev_assigned = str((exists or {}).get('assigned_to') or '')
                if (assigned_to_val and str(assigned_to_val) != prev_assigned
                        and str(assigned_to_val) != me and len(str(assigned_to_val)) == 15):
                    try:
                        from backend.notification_helper import create_notification as _notify
                    except ImportError:
                        from notification_helper import create_notification as _notify
                    _notify(user_id=str(assigned_to_val),
                            notification_type='caseload_assigned',
                            title='Candidate assigned to you',
                            message='A candidate was assigned to your CRM caseload.',
                            metadata={'candidate_user_id': str(user_id),
                                      'link': '/career-services-dashboard'})
            except Exception as notify_err:
                logger.warning(f"crm assign notify failed: {notify_err}")

            return jsonify({
                'success': True,
                'message': 'Candidate updated successfully'
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error updating CRM candidate: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update CRM candidate'
        }), 500



# ── Candidate availability (Phase A of the identity-model rework) ─────────────
# `availability_status` is the single authoritative driver of recruiter
# visibility (job_seeking | open_to_opportunities | not_visible); `currently_employed`
# is an orthogonal fact ("employed but open"). We keep the legacy is_visible /
# available_for_recruitment flags in sync so existing recruiter-facing queries
# that still filter on them automatically respect the new status.

_AVAILABILITY_VALUES = ('job_seeking', 'open_to_opportunities', 'not_visible')


def _sync_availability(user_id, status=None, currently_employed=None):
    """Set availability_status / currently_employed (whichever are provided) and
    mirror them onto the legacy visibility flags. Returns the resulting row."""
    sets, params = [], []
    if status is not None:
        sets.append("availability_status = %s")
        params.append(status)
        sets.append("is_visible = %s")
        params.append(status != 'not_visible')
        sets.append("available_for_recruitment = %s")
        params.append(status in ('job_seeking', 'open_to_opportunities'))
    if currently_employed is not None:
        sets.append("currently_employed = %s")
        params.append(bool(currently_employed))
    if sets:
        params.append(str(user_id))
        execute_query(f"UPDATE users SET {', '.join(sets)} WHERE id = %s",
                      tuple(params), fetch_all=False)
    return execute_query(
        "SELECT availability_status, currently_employed FROM users WHERE id = %s",
        (str(user_id),), fetch_one=True)


@candidate_profile_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    me = str(get_jwt_identity())
    row = execute_query(
        "SELECT availability_status, currently_employed FROM users WHERE id = %s",
        (me,), fetch_one=True) or {}
    return jsonify({'success': True, 'data': {
        'availability_status': row.get('availability_status') or 'job_seeking',
        'currently_employed': bool(row.get('currently_employed')),
        'options': list(_AVAILABILITY_VALUES),
    }})


@candidate_profile_bp.route('/availability', methods=['PUT'])
@jwt_required()
def set_availability():
    """A candidate sets their own availability. Recruiter visibility follows it."""
    data = request.get_json() or {}
    status = data.get('availability_status')
    employed = data.get('currently_employed')
    if status is not None and status not in _AVAILABILITY_VALUES:
        return jsonify({'success': False,
                        'message': f"availability_status must be one of {_AVAILABILITY_VALUES}"}), 400
    if status is None and employed is None:
        return jsonify({'success': False, 'message': 'Nothing to update'}), 400
    row = _sync_availability(get_jwt_identity(), status=status,
                             currently_employed=(None if employed is None else bool(employed)))
    return jsonify({'success': True, 'data': {
        'availability_status': (row or {}).get('availability_status'),
        'currently_employed': bool((row or {}).get('currently_employed')),
    }})
