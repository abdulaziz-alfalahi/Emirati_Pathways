from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from company_team_system import CompanyTeamSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
company_team_bp = Blueprint('company_team', __name__, url_prefix='/api/company/team')

team_system = CompanyTeamSystem()

@company_team_bp.route('/members', methods=['GET'])
@jwt_required()
def get_team_members():
    try:
        current_user_id = get_jwt_identity()
        # In a real app, we'd fetch the user's company_id from their profile/token
        # For MVP/Demo, we might accept it as a query param or infer it.
        # Let's assume we pass company_id as query param for flexibility in dev
        company_id = request.args.get('company_id')
        
        if not company_id:
             return jsonify({'success': False, 'error': 'Company ID is required'}), 400

        members = team_system.get_team_members(company_id)
        return jsonify({'success': True, 'members': members}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@company_team_bp.route('/invite', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def invite_member():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        company_id = data.get('company_id')
        email = data.get('email')
        role = data.get('role', 'recruiter')
        
        if not company_id or not email:
            return jsonify({'success': False, 'error': 'Company ID and Email are required'}), 400
            
        result = team_system.invite_member(company_id, email, role, current_user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@company_team_bp.route('/remove', methods=['POST'])
@jwt_required()
def remove_member():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        company_id = data.get('company_id')
        user_id = data.get('user_id')
        
        if not company_id or not user_id:
             return jsonify({'success': False, 'error': 'Missing params'}), 400

        success = team_system.remove_member(company_id, user_id)
        if success:
             return jsonify({'success': True, 'message': 'Member removed'}), 200
        else:
             return jsonify({'success': False, 'message': 'Failed to remove'}), 400
             
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
