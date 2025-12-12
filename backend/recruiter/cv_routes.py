
from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import os
import json
import uuid
from datetime import datetime
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from cv_parser import CVParser

cv_bp = Blueprint('cv_routes', __name__, url_prefix='/api/cv')


# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def get_current_user_id():
    """Helper to get user ID with mock support"""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity() or 'anonymous_user'
        
        # Development override check from headers
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            return 'mock_user_candidate'
            
        return user_id
    except Exception:
        return 'anonymous_user'

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def get_current_user_id():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer mock_token_'):
        # For mock_token_1, return '1'
        if 'mock_token_1' in auth_header:
            return '1'
        return '1' # Default fallback
    
    try:
        verify_jwt_in_request()
        return get_jwt_identity()
    except Exception:
        # If JWT verification fails but we want to be lenient for dev, maybe return None or raise
        # For now, let it raise so we know it failed
        raise

@cv_bp.route('/upload', methods=['POST'])
def upload_cv():
    try:
        user_id = get_current_user_id()
        
        if 'cv_file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400
            
        file = request.files['cv_file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400
            
        parser = CVParser()
        result = parser.parse_cv_file(file, user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data'],
                'analysis': result['analysis']
            })
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error uploading CV: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@cv_bp.route('/save', methods=['POST'])
def save_cv():
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        # If user_id is '1' (mock), map to a fixed UUID for DB consistency
        if user_id == '1':
             user_id = '00000000-0000-0000-0000-000000000001'

        cv_data = data.get('cvData', {})
        title = data.get('title', 'My CV')
        template_id = data.get('templateId', 'professional')
        cv_score = data.get('cvScore', 0)
        ats_score = data.get('atsScore', 0)
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cv_id = str(uuid.uuid4())
        created_at = datetime.now()
        
        # Insert into user_cvs
        cur.execute("""
            INSERT INTO user_cvs (
                id, user_id, title, template_name, 
                personal_info, professional_summary, technical_skills, soft_skills, 
                work_experience, education, cv_score, ats_score, 
                created_at, updated_at, status, is_visible
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, 'draft', false
            ) RETURNING id
        """, (
            cv_id, user_id, title, template_id,
            json.dumps(cv_data.get('personalInfo', {})),
            cv_data.get('professionalSummary', ''),
            json.dumps(cv_data.get('technicalSkills', [])),
            json.dumps(cv_data.get('softSkills', [])),
            json.dumps(cv_data.get('experience', [])),
            json.dumps(cv_data.get('education', [])),
            cv_score, ats_score,
            created_at, created_at
        ))
        
        new_cv_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'CV saved successfully',
            'data': {'cv_id': new_cv_id}
        }), 201
        
    except Exception as e:
        print(f"Error saving CV: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@cv_bp.route('/list', methods=['GET'])
def list_cvs():
    try:
        # Get user identity
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity() or 'anonymous_user'
        
        # Development override check from headers
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'

        # Convert mock user_id to UUID for development
        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        elif user_id == 'anonymous_user':
             # Return empty list for anonymous users instead of crashing
            return jsonify({
                'success': True,
                'data': []
            }), 200
        else:
            # Validate UUID format
            try:
                # Assuming uuid is imported
                val = uuid.UUID(str(user_id))
                user_uuid = user_id
            except ValueError:
                print(f"Invalid UUID provided for list_cvs: {user_id}")
                return jsonify({
                    'success': True,
                    'data': []
                }), 200

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT id, title, template_name, cv_score, ats_score, created_at, updated_at, status, is_visible
            FROM user_cvs
            WHERE user_id = %s
            ORDER BY updated_at DESC
        """, (user_uuid,))
        
        cvs = cur.fetchall()
        cur.close()
        conn.close()

        # Convert datetimes to isoformat
        result = []
        for cv in cvs:
            cv_dict = dict(cv)
            # handle date serialization... assuming standard json dump might fail on datetime objects if not handled
            # but jsonify usually handles strings better or we need manual conversion
            if cv_dict.get('created_at'):
                cv_dict['created_at'] = cv_dict['created_at'].isoformat()
            if cv_dict.get('updated_at'):
                cv_dict['updated_at'] = cv_dict['updated_at'].isoformat()
            result.append(cv_dict)
            
        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        print(f"Error listing CVs: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500



@cv_bp.route('/<cv_id>', methods=['GET'])
def get_cv(cv_id):
    try:
        user_id = get_current_user_id() # Verify auth
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT * FROM user_cvs WHERE id = %s
        """, (cv_id,))
        
        cv = cur.fetchone()
        cur.close()
        conn.close()
        
        if not cv:
            return jsonify({'success': False, 'message': 'CV not found'}), 404
            
        # Transform to frontend format
        cv_data = {
            'personalInfo': cv['personal_info'],
            'professionalSummary': cv['professional_summary'],
            'technicalSkills': cv['technical_skills'],
            'softSkills': cv['soft_skills'],
            'experience': cv['work_experience'],
            'education': cv['education']
        }
        
        return jsonify({
            'success': True,
            'data': cv_data,
            'metadata': {
                'id': cv['id'],
                'title': cv['title'],
                'template_name': cv['template_name'],
                'cv_score': cv['cv_score'],
                'ats_score': cv['ats_score']
            }
        })
        
    except Exception as e:
        print(f"Error getting CV: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@cv_bp.route('/<cv_id>', methods=['PUT'])
def update_cv(cv_id):
    try:
        user_id = get_current_user_id() # Verify auth
        data = request.get_json()
        
        cv_data = data.get('cvData', {})
        title = data.get('title')
        template_id = data.get('templateId')
        cv_score = data.get('cvScore')
        ats_score = data.get('atsScore')
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if title:
            update_fields.append("title = %s")
            params.append(title)
        if template_id:
            update_fields.append("template_name = %s")
            params.append(template_id)
        if cv_score is not None:
            update_fields.append("cv_score = %s")
            params.append(cv_score)
        if ats_score is not None:
            update_fields.append("ats_score = %s")
            params.append(ats_score)
            
        if cv_data:
            if 'personalInfo' in cv_data:
                update_fields.append("personal_info = %s")
                params.append(json.dumps(cv_data['personalInfo']))
            if 'professionalSummary' in cv_data:
                update_fields.append("professional_summary = %s")
                params.append(cv_data['professionalSummary'])
            if 'technicalSkills' in cv_data:
                update_fields.append("technical_skills = %s")
                params.append(json.dumps(cv_data['technicalSkills']))
            if 'softSkills' in cv_data:
                update_fields.append("soft_skills = %s")
                params.append(json.dumps(cv_data['softSkills']))
            if 'experience' in cv_data:
                update_fields.append("work_experience = %s")
                params.append(json.dumps(cv_data['experience']))
            if 'education' in cv_data:
                update_fields.append("education = %s")
                params.append(json.dumps(cv_data['education']))
                
        update_fields.append("updated_at = %s")
        params.append(datetime.now())
        
        params.append(cv_id)
        
        query = f"UPDATE user_cvs SET {', '.join(update_fields)} WHERE id = %s"
        
        cur.execute(query, tuple(params))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'CV updated successfully'
        })
        
    except Exception as e:
        print(f"Error updating CV: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@cv_bp.route('/<cv_id>', methods=['DELETE'])
def delete_cv(cv_id):
    try:
        user_id = get_current_user_id() # Verify auth
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM user_cvs WHERE id = %s", (cv_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'CV deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting CV: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@cv_bp.route('/<cv_id>/duplicate', methods=['POST'])
def duplicate_cv(cv_id):
    try:
        user_id = get_current_user_id()
        if user_id == '1':
             user_id = '00000000-0000-0000-0000-000000000001'

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get original CV
        cur.execute("SELECT * FROM user_cvs WHERE id = %s", (cv_id,))
        original_cv = cur.fetchone()
        
        if not original_cv:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'CV not found'}), 404
            
        # Create new CV
        new_cv_id = str(uuid.uuid4())
        created_at = datetime.now()
        new_title = f"{original_cv['title']} (Copy)"
        
        cur.execute("""
            INSERT INTO user_cvs (
                id, user_id, title, template_name, 
                personal_info, professional_summary, technical_skills, soft_skills, 
                work_experience, education, cv_score, ats_score, 
                created_at, updated_at, status, is_visible
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, 'draft', false
            ) RETURNING id
        """, (
            new_cv_id, user_id, new_title, original_cv['template_name'],
            json.dumps(original_cv['personal_info']),
            original_cv['professional_summary'],
            json.dumps(original_cv['technical_skills']),
            json.dumps(original_cv['soft_skills']),
            json.dumps(original_cv['work_experience']),
            json.dumps(original_cv['education']),
            original_cv['cv_score'], original_cv['ats_score'],
            created_at, created_at
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'CV duplicated successfully',
            'data': {'cv_id': new_cv_id}
        })
        
    except Exception as e:
        print(f"Error duplicating CV: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@cv_bp.route('/<cv_id>/visible', methods=['PUT'])
def set_visible(cv_id):
    try:
        user_id = get_current_user_id()
        if user_id == '1':
             user_id = '00000000-0000-0000-0000-000000000001'

        conn = get_db_connection()
        cur = conn.cursor()
        
        # Set all user's CVs to not visible
        cur.execute("UPDATE user_cvs SET is_visible = false WHERE user_id = %s", (user_id,))
        
        # Set selected CV to visible
        cur.execute("UPDATE user_cvs SET is_visible = true WHERE id = %s AND user_id = %s", (cv_id, user_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'CV set as visible'
        })
        
    except Exception as e:
        print(f"Error setting CV visible: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
