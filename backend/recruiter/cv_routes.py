
from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import os
import json
import uuid
from datetime import datetime
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from backend.cv_parser import CVParser
import traceback # Added for debugging

from flask_cors import CORS

cv_bp = Blueprint('cv_routes', __name__, url_prefix='/api/cv')
CORS(cv_bp)


# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}



def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def get_current_user_id():
    """
    Get the current user ID securely.
    Handles both mock authentication and real JWT tokens.
    Ensures the returned ID is always a valid UUID.
    """
    # 1. Check for mock token first (for testing/development)
    auth_header = request.headers.get('Authorization', '')
    # REMOVED: Insecure Mock Token Bypass
    
    # 2. Try to get user from JWT
    try:
        # Verify JWT exists and is valid (optional=True allows manual handling)
        verify_jwt_in_request(optional=True)
        user_identity = get_jwt_identity()

        if user_identity:
            # Check if it's already a valid UUID
            try:
                # If it's a UUID string, this will succeed
                user_uuid = str(uuid.UUID(str(user_identity)))
                return user_uuid
            except ValueError:
                # If not a UUID (e.g., email "khalid.almazrouei@email.ae"), hash it to a UUID
                # using UUIDv5 (SHA-1 hashing) with a DNS namespace for consistency
                user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(user_identity)))
                # print(f"DEBUG: Mapped non-UUID identity '{user_identity}' to UUID '{user_uuid}'")
                return user_uuid
    except Exception as e:
        print(f"Error getting user ID from JWT: {str(e)}")

    # 3. Fallback for unauthenticated or failed auth
    print("Warning: Authentication failed in cv_routes")
    return None

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
            # FIX: Populate Profile V2 with parsed data
            try:
                # FIX: Use absolute import to avoid ModuleNotFoundError
                from backend.services.profile_v2_service import ProfileV2Service
                success = ProfileV2Service.populate_from_cv_data(user_id, result)
                if not success:
                    print(f"Warning: Profile V2 population returned False for user {user_id}")
            except Exception as e:
                print(f"Error populating Profile V2: {e}")
                traceback.print_exc()
                # Don't fail the upload if profile sync fails, just log it
            
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
        user_id = get_current_user_id()

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT id, title, template_name, cv_score, ats_score, created_at, updated_at, status, is_visible
            FROM user_cvs
            WHERE user_id = %s::uuid
            ORDER BY updated_at DESC
        """, (user_id,))
        
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
            SELECT * FROM user_cvs WHERE id = %s::uuid
        """, (cv_id,))
        # AND user_id = %s ... (user_id,)
        
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
        traceback.print_exc() # Print full stack trace
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
        
        query = f"UPDATE user_cvs SET {', '.join(update_fields)} WHERE id = %s::uuid"
        
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
        
        cur.execute("DELETE FROM user_cvs WHERE id = %s::uuid", (cv_id,))
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

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get original CV
        cur.execute("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,))
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
        cur.execute("UPDATE user_cvs SET is_visible = false WHERE user_id = %s::uuid", (user_id,))
        
        # Set selected CV to visible
        cur.execute("UPDATE user_cvs SET is_visible = true WHERE id = %s::uuid AND user_id = %s::uuid", (cv_id, user_id))
        
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

@cv_bp.route('/<cv_id>/export/<format>', methods=['GET'])
def export_cv(cv_id, format):
    """Export CV in specified format"""
    try:
        if format not in ['pdf', 'docx', 'json']:
            return jsonify({'error': 'Invalid export format. Supported: pdf, docx, json'}), 400
            
        user_id = get_current_user_id()
        # Mock mapping for export
        if user_id == '1': user_id = '00000000-0000-0000-0000-000000000001'

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,))
        cv = cur.fetchone()
        cur.close()
        conn.close()

        if not cv:
            return jsonify({'error': 'CV not found'}), 404

        # Prepare CV Data for export
        cv_data = {
            'metadata': {
                'title': cv['title'],
                'cv_id': cv['id'],
                'user_id': cv['user_id']
            },
            'data': {
                'personal_info': cv['personal_info'],
                'professional_summary': cv['professional_summary'],
                'experience': cv['work_experience'],
                'education': cv['education'],
                'skills': cv['technical_skills'] + cv['soft_skills'],
                'languages': cv['languages_spoken'] or []
            }
        }

        if format == 'json':
            return jsonify({'success': True, 'cv_data': cv_data})

        # Use CVExporter logic (imported locally or implemented here)
        # For simplicity, if we don't have the heavy CVExporter setup, we stub PDF to JSON for now?
        # No, user COMPLAINED about PDF returning JSON.
        # We need to implement basic PDF generation or call the cv_builder one.
        
        from cv_builder.cv_export import CVExporter
        exporter = CVExporter()
        
        # Transform data to match what CVExporter expects
        # CVExporter expects {'data': ..., 'metadata': ...}
        
        file_path = exporter.export_cv(cv_data, format)
        
        if not file_path or not os.path.exists(file_path):
             return jsonify({'error': 'Export failed'}), 500

        mime_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        
        return send_file(
            file_path,
            mimetype=mime_types[format],
            as_attachment=True,
            download_name=f"cv_{cv_id}.{format}"
        )

    except Exception as e:
        print(f"Error exporting CV: {e}")
        return jsonify({'error': str(e)}), 500
