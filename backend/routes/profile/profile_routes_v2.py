from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.models.profile.candidate_profile_models import CandidateProfile, CandidateExperience, CandidateEducation, CandidateSkill, CandidateCertification, CandidateAssessment
from backend.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import uuid

profile_v2_bp = Blueprint('profile_v2', __name__, url_prefix='/api/v2/profile') # New V2 Prefix
logger = logging.getLogger(__name__)

def get_normalized_user_id(identity):
    """
    Normalize user identity to a consistent EID string (CHAR(15)).
    Post-migration: JWT identity is the EID, no UUID conversion needed.
    """
    if isinstance(identity, dict):
        identity = identity.get('id')
    return str(identity).strip()

@profile_v2_bp.route('/', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Get the full Unified Profile for the current user."""
    try:
        raw_identity = get_jwt_identity()
        user_id = get_normalized_user_id(raw_identity)
        logger.info(f"Fetching Profile V2 for user {user_id} (raw: {raw_identity})")
        # Helper function handles normalization

        
        # 1. Try to fetch existing profile
        profile = CandidateProfile.query.filter_by(user_id=user_id).first()
        
        # 2. If not found, create (Handle Race Conditions)
        if not profile:
            try:
                # Auto-create empty profile if it doesn't exist (Onboarding simplifier)
                new_profile = CandidateProfile(user_id=user_id)
                db.session.add(new_profile)
                db.session.commit()
                profile = new_profile
                logger.info(f"Created new Profile V2 for user {user_id}")
            except Exception as e:
                db.session.rollback()
                # Check race condition: maybe created by parallel request?
                profile = CandidateProfile.query.filter_by(user_id=user_id).first()
                if not profile:
                    # If still not found and creation failed, it's a real error (e.g. FK violation)
                    logger.error(f"Failed to auto-create profile for {user_id}: {e}")
                    # Return 200 with empty data structure to allow frontend to render empty state instead of crashing
                    return jsonify({
                        'success': True,
                        'data': {
                            'user_id': user_id,
                            'headline': '',
                            'bio': '',
                            'contact': {'email': '', 'phone': '', 'location': ''},
                            'media': {'avatar': None, 'video_intro': None},
                            'career_compass': {'target_roles': [], 'salary': None}
                        }
                    }), 200

        # 3. Return Data
        return jsonify({
            'success': True,
            'data': profile.to_dict()
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Profile fetch CRITICAL error: {str(e)}")
        # Return 200 with error info to allow frontend to handle gracefully
        return jsonify({
            'success': False, 
            'message': f"Server Error: {str(e)}",
            'error_type': type(e).__name__
        }), 500

@profile_v2_bp.route('/identity', methods=['PUT'])
@jwt_required()
def update_identity():
    """Update core identity (Bio, Contact, etc)"""
    try:
        user_id = get_normalized_user_id(get_jwt_identity())
        
        profile = CandidateProfile.query.filter_by(user_id=user_id).first()
        if not profile: return jsonify({'success': False, 'message': 'Profile not found'}), 404
        
        data = request.json
        if 'headline' in data: profile.headline = data['headline']
        if 'bio' in data: profile.bio = data['bio']
        
        # Handle Contact Fields (support both flat and nested 'contact' key)
        contact_data = data.get('contact', {})
        
        if 'phone' in data: profile.phone = data['phone']
        elif 'phone' in contact_data: profile.phone = contact_data['phone']
        
        if 'location' in data: profile.location = data['location']
        elif 'location' in contact_data: profile.location = contact_data['location']
        
        if 'latitude' in data: profile.latitude = data['latitude']
        elif 'latitude' in contact_data: profile.latitude = contact_data['latitude']
        
        if 'longitude' in data: profile.longitude = data['longitude']
        elif 'longitude' in contact_data: profile.longitude = contact_data['longitude']
        # Custom Logic for Preferred City (stored in target_roles as metadata tag)
        # 1. Get incoming data
        new_roles = data.get('target_roles') # List of role names
        preferred_city = data.get('preferred_city')

        # 2. Get existing data to preserve if needed
        existing_roles = profile.target_roles or []
        existing_city_tag = next((r for r in existing_roles if isinstance(r, str) and r.startswith('__CITY__:')), None)
        
        # 3. Handle Target Roles Update
        if new_roles is not None:
            # User is updating roles. We must preserve city if not provided in this update, or update it if provided.
            final_roles = [r for r in new_roles if isinstance(r, str) and not r.startswith('__CITY__:')]
            
            # Determine city to save
            city_to_save = None
            if preferred_city is not None:
                city_to_save = preferred_city
            elif existing_city_tag:
                 city_to_save = existing_city_tag.split(':', 1)[1]
            
            # Append tag
            if city_to_save:
                final_roles.append(f"__CITY__:{city_to_save}")
            
            profile.target_roles = final_roles
        
        # 4. Handle City Update only (if roles not sent)
        elif preferred_city is not None:
            # We are just updating the city, preserve existing roles
            clean_roles = [r for r in existing_roles if isinstance(r, str) and not r.startswith('__CITY__:')]
            if preferred_city:
                clean_roles.append(f"__CITY__:{preferred_city}")
            profile.target_roles = clean_roles

        if 'expected_salary' in data: profile.expected_salary_range = data['expected_salary']
        if 'relocation' in data: profile.willing_to_relocate = data['relocation']
        if 'notice_period' in data: profile.notice_period = data['notice_period']
        if 'english_proficiency' in data: profile.english_proficiency = data['english_proficiency']
        
        db.session.commit()
        return jsonify({'success': True, 'data': profile.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@profile_v2_bp.route('/experience', methods=['POST'])
@jwt_required()
def add_experience():
    """Add new work experience"""
    try:
        user_id = get_normalized_user_id(get_jwt_identity())
        
        profile = CandidateProfile.query.filter_by(user_id=user_id).first()
        if not profile: return jsonify({'success': False, 'message': 'Profile not found'}), 404
        
        data = request.json
        exp = CandidateExperience(
            user_id=user_id,
            job_title=data['job_title'],
            company=data['company'],
            location=data.get('location'),
            # Robust Date Parsing
            start_date=parse_date_safe(data.get('start_date')),
            end_date=parse_date_safe(data.get('end_date')),
            is_current=data.get('is_current', False),
            description=data.get('description')
        )
        
        db.session.add(exp)
        db.session.commit()
        return jsonify({'success': True, 'id': exp.id}), 201
        
    except Exception as e:
        logger.error(f"Error adding experience: {e}")
        db.session.rollback() # Ensure rollback
        return jsonify({'success': False, 'message': str(e)}), 500

def parse_date_safe(date_str):
    if not date_str: return None
    try:
        return datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
    except:
        return None

@profile_v2_bp.route('/education', methods=['POST'])
@jwt_required()
def add_education():
    """Add new education"""
    try:
        user_id = get_normalized_user_id(get_jwt_identity())
        
        profile = CandidateProfile.query.filter_by(user_id=user_id).first()
        if not profile: return jsonify({'success': False, 'message': 'Profile not found'}), 404
        
        data = request.json
        edu = CandidateEducation(
            user_id=user_id,
            institution=data['institution'],
            degree=data['degree'],
            field_of_study=data.get('field'),
            start_date=datetime.fromisoformat(data['start_date'].replace('Z', '+00:00')) if data.get('start_date') else None,
            end_date=datetime.fromisoformat(data['end_date'].replace('Z', '+00:00')) if data.get('end_date') else None,
            grade=data.get('grade')
        )
        
        db.session.add(edu)
        db.session.commit()
        return jsonify({'success': True, 'id': edu.id}), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@profile_v2_bp.route('/experience/<int:exp_id>', methods=['DELETE'])
@jwt_required()
def delete_experience(exp_id):
    """Delete a work experience entry"""
    try:
        user_id = get_normalized_user_id(get_jwt_identity())
        
        # Make sure experience belongs to the current user
        exp = CandidateExperience.query.filter_by(id=exp_id, user_id=user_id).first()
        if not exp:
            return jsonify({'success': False, 'message': 'Experience entry not found or access denied'}), 404
        
        db.session.delete(exp)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Experience deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting experience: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
