"""
Test Token Routes
Quick endpoints to test JWT tokens and generate new ones
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

test_token_bp = Blueprint('test_token', __name__, url_prefix='/api/test')

@test_token_bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    """Test if JWT token is valid"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        return jsonify({
            'success': True,
            'message': 'Token is valid!',
            'user_id': current_user_id,
            'role': claims.get('role'),
            'claims': claims
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Token validation failed: {str(e)}'
        }), 401


@test_token_bp.route('/generate-recruiter-token', methods=['POST'])
def generate_recruiter_token():
    """Generate a new token for recruiter (for testing only)"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', 15)  # Default to user 15 (Omar Al Rashid)
        
        # Create access token with hr_recruiter role
        additional_claims = {'role': 'hr_recruiter'}
        access_token = create_access_token(
            identity=user_id,
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'success': True,
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': 86400,  # 24 hours in seconds
            'user_id': user_id,
            'role': 'hr_recruiter',
            'instructions': 'Copy this token and save it as "accessToken" in localStorage'
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to generate token: {str(e)}'
        }), 500


@test_token_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'Test Token Service'
    }), 200

