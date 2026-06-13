"""
Profile Management Routes for Enhanced Profile System
Supports HR/Recruiter, Educator, and Assessor profile management
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

profile_bp = Blueprint('profile_management', __name__)

# Mock database for demonstration
profile_data = {}
company_data = {}
institution_data = {}
certification_data = {}

@profile_bp.route('/profile/hr', methods=['POST'])
def create_hr_profile():
    """Create or update HR/Recruiter profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create profile ID
        profile_id = f"hr_{len(profile_data) + 1}"
        
        # Store profile data
        profile_data[profile_id] = {
            'id': profile_id,
            'type': 'recruiter',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            **data
        }
        
        logger.info(f"HR profile created: {profile_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'profile': profile_data[profile_id]
            },
            'message': 'HR profile created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"HR profile creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create HR profile'
        }), 500

@profile_bp.route('/profile/hr/<profile_id>', methods=['GET'])
def get_hr_profile(profile_id):
    """Get HR/Recruiter profile"""
    try:
        if profile_id in profile_data:
            return jsonify({
                'success': True,
                'data': {
                    'profile': profile_data[profile_id]
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Profile not found'
            }), 404
            
    except Exception as e:
        logger.error(f"HR profile retrieval error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve HR profile'
        }), 500

@profile_bp.route('/profile/company', methods=['POST'])
def create_company_profile():
    """Create or update company profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['companyName', 'industry']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create company ID
        company_id = f"company_{len(company_data) + 1}"
        
        # Store company data
        company_data[company_id] = {
            'id': company_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            **data
        }
        
        logger.info(f"Company profile created: {company_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'company': company_data[company_id]
            },
            'message': 'Company profile created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Company profile creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create company profile'
        }), 500

@profile_bp.route('/profile/educator', methods=['POST'])
def create_educator_profile():
    """Create or update Educator profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create profile ID
        profile_id = f"educator_{len(profile_data) + 1}"
        
        # Store profile data
        profile_data[profile_id] = {
            'id': profile_id,
            'type': 'training_provider',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            **data
        }
        
        logger.info(f"Educator profile created: {profile_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'profile': profile_data[profile_id]
            },
            'message': 'Educator profile created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Educator profile creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create educator profile'
        }), 500

@profile_bp.route('/profile/institution', methods=['POST'])
def create_institution_profile():
    """Create or update institution profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['institutionName', 'institutionType']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create institution ID
        institution_id = f"institution_{len(institution_data) + 1}"
        
        # Store institution data
        institution_data[institution_id] = {
            'id': institution_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            **data
        }
        
        logger.info(f"Institution profile created: {institution_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'institution': institution_data[institution_id]
            },
            'message': 'Institution profile created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Institution profile creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create institution profile'
        }), 500

@profile_bp.route('/profile/assessor', methods=['POST'])
def create_assessor_profile():
    """Create or update Assessor profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create profile ID
        profile_id = f"assessor_{len(profile_data) + 1}"
        
        # Store profile data
        profile_data[profile_id] = {
            'id': profile_id,
            'type': 'assessor',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            **data
        }
        
        logger.info(f"Assessor profile created: {profile_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'profile': profile_data[profile_id]
            },
            'message': 'Assessor profile created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Assessor profile creation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create assessor profile'
        }), 500

@profile_bp.route('/certifications/track', methods=['POST'])
def track_certifications():
    """Track certifications and continuing education"""
    try:
        data = request.get_json()
        
        # Create certification tracking ID
        tracking_id = f"cert_track_{len(certification_data) + 1}"
        
        # Store certification data
        certification_data[tracking_id] = {
            'id': tracking_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            **data
        }
        
        logger.info(f"Certification tracking created: {tracking_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'tracking': certification_data[tracking_id]
            },
            'message': 'Certifications tracked successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Certification tracking error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to track certifications'
        }), 500

@profile_bp.route('/profile/switch-role', methods=['POST'])
def switch_role():
    """Switch user's primary role"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['userId', 'newPrimaryRole']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        user_id = data['userId']
        new_role = data['newPrimaryRole']
        
        # Mock role switching logic
        logger.info(f"Role switch: User {user_id} -> {new_role}")
        
        return jsonify({
            'success': True,
            'data': {
                'userId': user_id,
                'newPrimaryRole': new_role,
                'previousRole': data.get('previousRole', 'Unknown'),
                'switchedAt': datetime.now().isoformat()
            },
            'message': 'Role switched successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Role switching error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to switch role'
        }), 500

@profile_bp.route('/profile/completion/<user_id>', methods=['GET'])
def get_profile_completion(user_id):
    """Get profile completion percentage"""
    try:
        # Mock completion calculation
        completion_percentage = 85  # Example completion
        
        return jsonify({
            'success': True,
            'data': {
                'userId': user_id,
                'completion': completion_percentage,
                'lastUpdated': datetime.now().isoformat(),
                'sections': {
                    'personal': 100,
                    'professional': 90,
                    'preferences': 75,
                    'certifications': 80
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Profile completion error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get profile completion'
        }), 500

@profile_bp.route('/profile/stats', methods=['GET'])
def get_profile_stats():
    """Get profile management statistics"""
    try:
        stats = {
            'total_profiles': len(profile_data),
            'total_companies': len(company_data),
            'total_institutions': len(institution_data),
            'total_certifications': len(certification_data),
            'profile_types': {
                'recruiter': len([p for p in profile_data.values() if p.get('type') == 'recruiter']),
                'training_provider': len([p for p in profile_data.values() if p.get('type') == 'training_provider']),
                'assessor': len([p for p in profile_data.values() if p.get('type') == 'assessor'])
            }
        }
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Profile stats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get profile stats'
        }), 500

# Health check for profile management
@profile_bp.route('/profile/health', methods=['GET'])
def profile_health():
    """Profile management health check"""
    return jsonify({
        'success': True,
        'service': 'profile_management',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'features': {
            'hr_profiles': True,
            'educator_profiles': True,
            'assessor_profiles': True,
            'company_profiles': True,
            'institution_profiles': True,
            'certification_tracking': True,
            'role_switching': True,
            'profile_completion': True
        }
    }), 200
