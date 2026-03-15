"""
HR/Recruiter Profile Management Routes
Emirati Journey Platform - HR/Recruiter Core Functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
import uuid
import json
from backend.db import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
hr_profile_bp = Blueprint('hr_profile', __name__, url_prefix='/api/hr')



@hr_profile_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for HR profile management"""
    return jsonify({
        'success': True,
        'message': 'HR Profile Management API is operational',
        'timestamp': datetime.now().isoformat(),
        'endpoints': [
            'GET /api/hr/profile - Get HR profile',
            'POST /api/hr/profile - Create/Update HR profile',
            'GET /api/hr/company - Get company profile',
            'POST /api/hr/company - Create/Update company profile',
            'GET /api/hr/team - Get team members',
            'POST /api/hr/team/invite - Invite team member'
        ]
    })

@hr_profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_hr_profile():
    """Get HR profile for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get HR profile with company information
            cursor.execute("""
                SELECT 
                    hp.*,
                    c.name as company_name,
                    c.industry as company_industry,
                    c.size as company_size,
                    c.logo as company_logo,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone
                FROM hr_profiles hp
                LEFT JOIN companies c ON hp.company_id = c.id
                LEFT JOIN users u ON hp.user_id = u.id
                WHERE hp.user_id = %s
            """, (current_user_id,))
            
            profile = cursor.fetchone()
            
            if not profile:
                return jsonify({
                    'success': False,
                    'message': 'HR profile not found'
                }), 404
            
            # Convert to dict and handle JSONB fields
            profile_data = dict(profile)
            
            # Parse JSONB fields
            jsonb_fields = ['specializations', 'contact_preferences', 'regions_of_focus', 
                           'industries_of_expertise', 'languages_spoken', 'certifications']
            
            for field in jsonb_fields:
                if profile_data.get(field):
                    try:
                        if isinstance(profile_data[field], str):
                            profile_data[field] = json.loads(profile_data[field])
                    except (json.JSONDecodeError, TypeError):
                        profile_data[field] = []
            
            return jsonify({
                'success': True,
                'data': profile_data
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting HR profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve HR profile'
        }), 500

@hr_profile_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_or_update_hr_profile():
    """Create or update HR profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['position_title', 'department']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Check if profile exists
            cursor.execute("SELECT id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
            existing_profile = cursor.fetchone()
            
            # Prepare data
            profile_data = {
                'position_title': data.get('position_title'),
                'department': data.get('department'),
                'years_of_experience': data.get('years_of_experience', 0),
                'specializations': json.dumps(data.get('specializations', [])),
                'contact_preferences': json.dumps(data.get('contact_preferences', {})),
                'hiring_authority_level': data.get('hiring_authority_level'),
                'regions_of_focus': json.dumps(data.get('regions_of_focus', [])),
                'industries_of_expertise': json.dumps(data.get('industries_of_expertise', [])),
                'languages_spoken': json.dumps(data.get('languages_spoken', [])),
                'certifications': json.dumps(data.get('certifications', [])),
                'linkedin_profile': data.get('linkedin_profile'),
                'professional_summary': data.get('professional_summary'),
                'company_id': data.get('company_id')
            }
            
            if existing_profile:
                # Update existing profile
                update_fields = []
                update_values = []
                
                for key, value in profile_data.items():
                    if value is not None:
                        update_fields.append(f"{key} = %s")
                        update_values.append(value)
                
                update_values.append(current_user_id)
                
                cursor.execute(f"""
                    UPDATE hr_profiles 
                    SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    RETURNING *
                """, update_values)
                
                message = "HR profile updated successfully"
                
            else:
                # Create new profile
                profile_data['user_id'] = current_user_id
                
                columns = list(profile_data.keys())
                placeholders = ['%s'] * len(columns)
                values = list(profile_data.values())
                
                cursor.execute(f"""
                    INSERT INTO hr_profiles ({', '.join(columns)})
                    VALUES ({', '.join(placeholders)})
                    RETURNING *
                """, values)
                
                message = "HR profile created successfully"
            
            updated_profile = cursor.fetchone()
            conn.commit()
            
            # Convert to dict and parse JSONB fields
            profile_result = dict(updated_profile)
            jsonb_fields = ['specializations', 'contact_preferences', 'regions_of_focus', 
                           'industries_of_expertise', 'languages_spoken', 'certifications']
            
            for field in jsonb_fields:
                if profile_result.get(field):
                    try:
                        if isinstance(profile_result[field], str):
                            profile_result[field] = json.loads(profile_result[field])
                    except (json.JSONDecodeError, TypeError):
                        profile_result[field] = []
            
            return jsonify({
                'success': True,
                'message': message,
                'data': profile_result
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating/updating HR profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to save HR profile'
        }), 500

@hr_profile_bp.route('/company', methods=['GET'])
@jwt_required()
def get_company_profile():
    """Get company profile"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company through HR profile
            cursor.execute("""
                SELECT c.*, hp.id as hr_profile_id
                FROM companies c
                INNER JOIN hr_profiles hp ON c.id = hp.company_id
                WHERE hp.user_id = %s
            """, (current_user_id,))
            
            company = cursor.fetchone()
            
            if not company:
                return jsonify({
                    'success': False,
                    'message': 'Company profile not found'
                }), 404
            
            company_data = dict(company)
            
            # Parse JSONB fields
            jsonb_fields = ['verification_documents', 'social_media_links', 'benefits_offered']
            for field in jsonb_fields:
                if company_data.get(field):
                    try:
                        if isinstance(company_data[field], str):
                            company_data[field] = json.loads(company_data[field])
                    except (json.JSONDecodeError, TypeError):
                        company_data[field] = {}
            
            return jsonify({
                'success': True,
                'data': company_data
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting company profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve company profile'
        }), 500

@hr_profile_bp.route('/company', methods=['POST'])
@jwt_required()
def create_or_update_company():
    """Create or update company profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'industry']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Check if user has HR profile and company
            cursor.execute("""
                SELECT hp.company_id, c.id as existing_company_id
                FROM hr_profiles hp
                LEFT JOIN companies c ON hp.company_id = c.id
                WHERE hp.user_id = %s
            """, (current_user_id,))
            
            hr_info = cursor.fetchone()
            
            # Prepare company data
            company_data = {
                'name': data.get('name'),
                'description': data.get('description'),
                'industry': data.get('industry'),
                'size': data.get('size'),
                'website': data.get('website'),
                'logo': data.get('logo'),
                'address': data.get('address'),
                'city': data.get('city')
            }
            
            if hr_info and hr_info['existing_company_id']:
                # Update existing company
                update_fields = []
                update_values = []
                
                for key, value in company_data.items():
                    if value is not None:
                        update_fields.append(f"{key} = %s")
                        update_values.append(value)
                
                update_values.append(hr_info['existing_company_id'])
                
                cursor.execute(f"""
                    UPDATE companies 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING *
                """, update_values)
                
                updated_company = cursor.fetchone()
                message = "Company profile updated successfully"
                
            else:
                # Create new company
                columns = list(company_data.keys())
                placeholders = ['%s'] * len(columns)
                values = list(company_data.values())
                
                cursor.execute(f"""
                    INSERT INTO companies ({', '.join(columns)})
                    VALUES ({', '.join(placeholders)})
                    RETURNING *
                """, values)
                
                company_result = cursor.fetchone()
                company_id = company_result['id']
                
                # Update HR profile with company_id
                if hr_info:
                    cursor.execute("""
                        UPDATE hr_profiles 
                        SET company_id = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = %s
                    """, (company_id, current_user_id))
                
                message = "Company profile created successfully"
                updated_company = company_result
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': message,
                'data': dict(updated_company) if updated_company else {}
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating/updating company: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to save company profile'
        }), 500

@hr_profile_bp.route('/team', methods=['GET'])
@jwt_required()
def get_team_members():
    """Get team members for the company"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get team members through company
            cursor.execute("""
                SELECT 
                    ctm.*,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    hp.position_title,
                    hp.department
                FROM company_team_members ctm
                INNER JOIN hr_profiles hp_current ON ctm.company_id = hp_current.company_id
                INNER JOIN users u ON ctm.user_id = u.id
                LEFT JOIN hr_profiles hp ON ctm.user_id = hp.user_id
                WHERE hp_current.user_id = %s
                ORDER BY ctm.created_at DESC
            """, (current_user_id,))
            
            team_members = cursor.fetchall()
            
            # Convert to list of dicts and parse JSONB fields
            team_data = []
            for member in team_members:
                member_data = dict(member)
                if member_data.get('permissions'):
                    try:
                        if isinstance(member_data['permissions'], str):
                            member_data['permissions'] = json.loads(member_data['permissions'])
                    except (json.JSONDecodeError, TypeError):
                        member_data['permissions'] = {}
                team_data.append(member_data)
            
            return jsonify({
                'success': True,
                'data': {
                    'team_members': team_data,
                    'total_count': len(team_data)
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting team members: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve team members'
        }), 500

@hr_profile_bp.route('/team/invite', methods=['POST'])
@jwt_required()
def invite_team_member():
    """Invite a team member to the company"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get current user's company
            cursor.execute("""
                SELECT company_id FROM hr_profiles WHERE user_id = %s
            """, (current_user_id,))
            
            hr_profile = cursor.fetchone()
            if not hr_profile or not hr_profile['company_id']:
                return jsonify({
                    'success': False,
                    'message': 'No company associated with your profile'
                }), 400
            
            company_id = hr_profile['company_id']
            
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User with this email does not exist'
                }), 404
            
            user_id = user['id']
            
            # Check if already a team member
            cursor.execute("""
                SELECT id FROM company_team_members 
                WHERE company_id = %s AND user_id = %s
            """, (company_id, user_id))
            
            existing_member = cursor.fetchone()
            if existing_member:
                return jsonify({
                    'success': False,
                    'message': 'User is already a team member'
                }), 409
            
            # Create team member invitation
            permissions = data.get('permissions', {
                'can_post_jobs': False,
                'can_schedule_interviews': False,
                'can_manage_team': False
            })
            
            cursor.execute("""
                INSERT INTO company_team_members (
                    company_id, user_id, role, permissions, invited_by, invitation_status
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                company_id, user_id, data['role'], 
                json.dumps(permissions), current_user_id, 'pending'
            ))
            
            new_member = cursor.fetchone()
            conn.commit()
            
            # TODO: Send invitation email
            
            return jsonify({
                'success': True,
                'message': 'Team member invitation sent successfully',
                'data': dict(new_member)
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error inviting team member: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to invite team member'
        }), 500

@hr_profile_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get HR dashboard statistics"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company stats
            cursor.execute("""
                SELECT * FROM hr_dashboard_stats hds
                INNER JOIN hr_profiles hp ON hds.company_id = hp.company_id
                WHERE hp.user_id = %s
            """, (current_user_id,))
            
            stats = cursor.fetchone()
            
            if not stats:
                # Return empty stats if no data
                stats = {
                    'total_job_postings': 0,
                    'active_job_postings': 0,
                    'total_applications': 0,
                    'new_applications': 0,
                    'total_interviews': 0,
                    'upcoming_interviews': 0
                }
            else:
                stats = dict(stats)
            
            return jsonify({
                'success': True,
                'data': stats
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve dashboard statistics'
        }), 500
