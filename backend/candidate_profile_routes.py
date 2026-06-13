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

@candidate_profile_bp.route('/crm-candidates', methods=['GET'])
@jwt_required()
def get_crm_candidates():
    """Get all candidates for Career Services CRM"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT 
                    u.id,
                    u.emirates_id_enc as national_id,
                    u.full_name,
                    u.phone,
                    cp.call_status,
                    cp.work_status,
                    cp.job_seeker_type,
                    cp.counseling_remarks,
                    cp.assigned_to,
                    cp.preferred_locations,
                    cp.preferred_sector,
                    cp.preferred_work_setup,
                    cp.preferred_schedule,
                    cp.alternative_phone,
                    cp.unavailability_reason,
                    cp.role_preferences
                FROM users u
                LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
                WHERE u.role = 'candidate' OR u.user_type = 'candidate'
                ORDER BY u.created_at DESC
                LIMIT 500
            """)
            
            candidates = cursor.fetchall()
            
            # Format the output for the frontend
            formatted = []
            for c in candidates:
                formatted.append({
                    'id': c['id'],
                    'national_id': c['national_id'],
                    'full_name': c['full_name'],
                    'phone': c['phone'],
                    'profile': {
                        'call_status': c['call_status'],
                        'work_status': c['work_status'],
                        'job_seeker_type': c['job_seeker_type'],
                        'counseling_remarks': c['counseling_remarks'],
                        'assigned_to': c['assigned_to'],
                        'preferred_locations': c['preferred_locations'],
                        'preferred_sector': c['preferred_sector'],
                        'preferred_work_setup': c['preferred_work_setup'],
                        'preferred_schedule': c['preferred_schedule'],
                        'alternative_phone': c['alternative_phone'],
                        'unavailability_reason': c['unavailability_reason'],
                        'role_preferences': c['role_preferences']
                    }
                })
                
            return jsonify({
                'success': True,
                'data': formatted
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

@candidate_profile_bp.route('/crm-candidates/<user_id>', methods=['PUT'])
@jwt_required()
def update_crm_candidate(user_id):
    """Update CRM specific fields for a candidate"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            cursor.execute("SELECT id FROM candidate_profiles WHERE user_id = %s", (user_id,))
            exists = cursor.fetchone()
            
            import json
            preferred_locations = data.get('preferredLocations')
            if preferred_locations is not None:
                preferred_locations = json.dumps(preferred_locations)

            if exists:
                cursor.execute("""
                    UPDATE candidate_profiles SET
                        call_status = %s,
                        work_status = %s,
                        counseling_remarks = %s,
                        assigned_to = %s,
                        preferred_locations = %s,
                        preferred_sector = %s,
                        preferred_work_setup = %s,
                        preferred_schedule = %s,
                        alternative_phone = %s,
                        unavailability_reason = %s,
                        role_preferences = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('callStatus'),
                    data.get('workStatus'),
                    data.get('remarks'),
                    data.get('assignedTo'),
                    preferred_locations,
                    data.get('preferredSector'),
                    data.get('preferredWorkSetup'),
                    data.get('preferredSchedule'),
                    data.get('alternativePhone'),
                    data.get('unavailabilityReason'),
                    data.get('rolePreferences'),
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
                    data.get('assignedTo'),
                    preferred_locations,
                    data.get('preferredSector'),
                    data.get('preferredWorkSetup'),
                    data.get('preferredSchedule'),
                    data.get('alternativePhone'),
                    data.get('unavailabilityReason'),
                    data.get('rolePreferences')
                ))
                
            conn.commit()
            
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

