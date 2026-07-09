#!/usr/bin/env python3
"""
Enhanced CV Upload Routes with Job Matching Integration
Emirati Journey Platform - Qwen-Powered Pipeline
"""

import os
import json
import logging
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import uuid

# DEBUG HELPER
def log_debug_cv(msg):
    try:
        with open("backend_cv_debug.log", "a", encoding="utf-8") as f:
            f.write(f"{datetime.now().isoformat()} - {msg}\n")
    except:
        pass

# --- Qwen Resume Parser (primary) ---
try:
    from backend.services.resume_parser import parse_resume, parse_resume_from_stream
    from backend.services.qwen_client import QwenParsingError, QwenClientError
    QWEN_AVAILABLE = True
    logger_init_msg = "✅ Qwen resume parser loaded"
except ImportError:
    QWEN_AVAILABLE = False
    logger_init_msg = "⚠️ Qwen parser unavailable, falling back to Gemini cv_parser"

# --- Gemini fallback (legacy) ---
try:
    from ..cv_parser import cv_parser
    from ..cv_storage_manager import cv_storage_manager
    from ..cv_job_matching_integration import cv_job_matching_integration
except (ImportError, ValueError):
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from cv_parser import cv_parser
    try:
         from cv_storage_manager import cv_storage_manager
         from cv_job_matching_integration import cv_job_matching_integration
    except ImportError:
         pass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info(logger_init_msg)

# Create blueprint
enhanced_cv_bp = Blueprint('enhanced_cv', __name__, url_prefix='/api/cv')

# Configuration
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Magic byte signatures for content-type validation
_FILE_SIGNATURES = {
    'pdf':  b'%PDF',
    'docx': b'PK\x03\x04',          # DOCX is a ZIP archive
    'doc':  b'\xd0\xcf\x11\xe0',     # OLE2 compound document
    'txt':  None,                     # No specific signature for plain text
}

def validate_file_content(file_obj, filename):
    """Validate that the file content matches its declared extension.

    Reads the first 8 bytes (magic bytes) and compares against known
    signatures.  Rewinds the file pointer after inspection.
    Returns (is_valid: bool, reason: str).
    """
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    sig = _FILE_SIGNATURES.get(ext)

    if sig is None:
        # No signature to check (e.g. .txt), allow it
        return True, 'ok'

    header = file_obj.read(8)
    file_obj.seek(0)  # Always rewind

    if not header:
        return False, 'File is empty'

    if not header.startswith(sig):
        return False, (
            f'File content does not match .{ext} format. '
            f'The file may be corrupted or have the wrong extension.'
        )

    return True, 'ok'


def _wrap_qwen_result(qwen_data: dict, processing_time: float = 0) -> dict:
    """Bridge Qwen flat resume JSON → legacy {success, data, analysis} format.

    The downstream consumers (cv_storage_manager, cv_job_matching_integration,
    profile_v2_service) expect this specific shape from cv_parser.
    """
    # Build scores from NQF and skills data
    skills = qwen_data.get('skills', [])
    experience = qwen_data.get('experience', [])
    education = qwen_data.get('education', [])

    # Simple completeness score
    pi = qwen_data.get('personal_info', {})
    completeness_fields = [
        pi.get('full_name'), pi.get('email'), pi.get('phone'),
        pi.get('location'), qwen_data.get('professional_summary'),
    ]
    completeness = round(sum(1 for f in completeness_fields if f) / max(len(completeness_fields), 1) * 100)

    return {
        'success': True,
        'data': qwen_data,
        'analysis': {
            'scores': {
                'overall': min(completeness + len(skills) + len(experience) * 5, 100),
                'completeness': completeness,
                'detail': min(len(experience) * 15 + len(education) * 10, 100),
                'uae_relevance': 80 if qwen_data.get('highest_nqf_level') else 40,
            },
            'highest_nqf_level': qwen_data.get('highest_nqf_level'),
            'total_experience_years': qwen_data.get('total_experience_years'),
            'skills_count': len(skills),
            'experience_count': len(experience),
            'education_count': len(education),
        },
        'processing_time': processing_time,
    }

def get_normalized_user_id(identity):
    """Normalize user identity — EID CHAR(15) pass-through."""
    try:
        from utils.user_id import get_normalized_user_id as _normalize
        return _normalize(identity)
    except ImportError:
        # Inline fallback: JWT identity is now EID CHAR(15), no UUID conversion
        if not identity:
            return None
        if isinstance(identity, dict):
            identity = identity.get('id')
        return str(identity).strip()

def get_user_id_from_token():
    """Extract user ID from JWT token (simplified)"""
    # In production, this would properly decode and validate JWT
    auth_header = request.headers.get('Authorization')
    # Header-based (Bearer) auth
    try:
        if auth_header and auth_header.startswith('Bearer '):
            from flask_jwt_extended import decode_token
            token = auth_header.split(" ")[1]
            decoded = decode_token(token)
            return str(decoded['sub'])
    except Exception as e:
        logger.error(f"Token validation error (header): {e}")
    # Cookie-based session (UAE Pass): verify the JWT cookie
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(locations=['cookies'])
        uid = get_jwt_identity()
        if uid:
            return str(uid)
    except Exception:
        pass
    return None

@enhanced_cv_bp.route('/debug-qwen', methods=['GET'])
def debug_qwen_status():
    """Check if Qwen pipeline is active (no auth required)."""
    return jsonify({
        'qwen_available': QWEN_AVAILABLE,
        'engine': 'Qwen' if QWEN_AVAILABLE else 'Gemini (fallback)',
    }), 200

@enhanced_cv_bp.route('/upload', methods=['POST'])
def upload_cv():
    """Upload and parse CV file"""
    try:
        # Check authentication
        raw_user_id = get_user_id_from_token()
        if not raw_user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
            
        # NORMALIZE USER ID (Crucial for V2 Compatibility)
        user_id = get_normalized_user_id(raw_user_id)
        logger.info(f"Processing Upload for User: {user_id} (Raw: {raw_user_id})")
        log_debug_cv(f"UPLOAD START: Raw ID='{raw_user_id}', Normalized ID='{user_id}'")
        
        # Check CV limit (Max 3)
        current_cvs = cv_storage_manager.get_user_cvs(user_id)
        if current_cvs.get('total_count', 0) >= 3:
            return jsonify({
                'success': False,
                'message': 'CV limit reached. You can only upload up to 3 CVs. Please delete an old CV to upload a new one.'
            }), 400

        # Check if file is present
        if 'cv_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['cv_file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': f'File type not allowed. Supported: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'message': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'
            }), 400
        
        # Validate file content (magic bytes) matches extension
        content_valid, content_reason = validate_file_content(file, file.filename)
        if not content_valid:
            logger.warning(f"File content validation failed for {file.filename}: {content_reason}")
            return jsonify({
                'success': False,
                'message': content_reason
            }), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Save file temporarily
        import tempfile
        upload_folder = os.path.join(tempfile.gettempdir(), 'cv_uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        try:
            # Parse CV — use Qwen pipeline (primary) or Gemini fallback
            engine = 'Qwen' if QWEN_AVAILABLE else 'Gemini'
            logger.info(f"Parsing CV: {filename} (engine={engine})")
            log_debug_cv(f"PARSE START: engine={engine}, file={file_path}")
            start_time = time.time()

            if QWEN_AVAILABLE:
                # ── Qwen Pipeline ──
                try:
                    qwen_data = parse_resume(file_path, is_file_path=True)
                    processing_time = round(time.time() - start_time, 2)

                    # Wrap Qwen flat dict into legacy {success, data} format
                    parse_result = _wrap_qwen_result(qwen_data, processing_time)
                    log_debug_cv(f"PARSE OK: {processing_time}s, name={qwen_data.get('personal_info', {}).get('full_name', 'N/A')}")
                    logger.info(f"✅ Qwen parsed in {processing_time}s: {qwen_data.get('personal_info', {}).get('full_name', 'N/A')}")

                except (QwenParsingError, QwenClientError) as qe:
                    logger.error(f"❌ Qwen parsing failed: {qe}")
                    log_debug_cv(f"PARSE FAIL (Qwen): {qe}")
                    return jsonify({
                        'success': False,
                        'message': f'CV parsing failed: {str(qe)}'
                    }), 400
                except ValueError as ve:
                    logger.error(f"❌ Extraction error: {ve}")
                    log_debug_cv(f"PARSE FAIL (ValueError): {ve}")
                    return jsonify({
                        'success': False,
                        'message': str(ve)
                    }), 400
            else:
                # ── Gemini Fallback ──
                parse_result = cv_parser.parse_cv(file_path)
                log_debug_cv(f"GEMINI result: success={parse_result.get('success')}, msg={parse_result.get('message', 'n/a')}")
                if not parse_result.get('success'):
                    log_debug_cv(f"PARSE FAIL (Gemini): {parse_result.get('message', '?')}")
                    return jsonify({
                        'success': False,
                        'message': f'CV parsing failed: {parse_result.get("message", "Unknown error")}'
                    }), 400
            
            # Add file metadata
            parse_result['file_info'] = {
                'original_filename': filename,
                'file_size': file_size,
                'file_type': filename.rsplit('.', 1)[1].lower(),
                'mime_type': file.content_type,
                'upload_timestamp': datetime.utcnow().isoformat()
            }
            
            # Store CV data
            storage_result = cv_storage_manager.store_cv(parse_result, user_id)
            
            if not storage_result.get('success'):
                return jsonify({
                    'success': False,
                    'message': f'CV storage failed: {storage_result.get("message", "Unknown error")}'
                }), 500
            
            # Process for job matching
            matching_result = cv_job_matching_integration.process_cv_for_job_matching(parse_result, user_id)
            
            # Find initial job matches
            job_matches = {}
            if matching_result.get('success'):
                job_matches = cv_job_matching_integration.find_job_matches(
                    matching_result['matching_criteria'], 
                    limit=10
                )
            
            # Complete user profile
            profile_result = cv_job_matching_integration.complete_profile_from_cv(parse_result)
            
            # --- PROFILE V2 INTEGRATION ---
            try:
                from backend.services.profile_v2_service import ProfileV2Service
                ProfileV2Service.populate_from_cv_data(user_id, parse_result)
                logger.info(f"✅ Auto-populated Profile V2 for user {user_id}")
            except Exception as v2_err:
                logger.error(f"⚠️ Failed to populate Profile V2: {v2_err}")
            
            # Prepare response
            response_data = {
                'success': True,
                'message': 'CV uploaded and processed successfully',
                'cv_id': storage_result.get('cv_id'),
                'data': parse_result.get('data', {}),
                'analysis': parse_result.get('analysis', {}),
                'file_info': parse_result['file_info'],
                'job_matches': job_matches.get('matches', [])[:5],
                'profile_completion': profile_result.get('completion_percentage', 0),
                'processing_time': parse_result.get('processing_time', 0)
            }
            
            return jsonify(response_data), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
    
    except Exception as e:
        logger.error(f"CV upload error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/parse-text', methods=['POST'])
def parse_cv_text():
    """Parse CV from text input"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get request data
        data = request.get_json()
        if not data or 'cv_text' not in data:
            return jsonify({
                'success': False,
                'message': 'CV text is required'
            }), 400
        
        cv_text = data['cv_text'].strip()
        
        # Validate text length
        if len(cv_text) < 50:
            return jsonify({
                'success': False,
                'message': 'CV text too short (minimum 50 characters)'
            }), 400
        
        if len(cv_text) > 50000:
            return jsonify({
                'success': False,
                'message': 'CV text too long (maximum 50,000 characters)'
            }), 400
        
        # Parse CV text — Qwen primary, Gemini fallback
        logger.info(f"Parsing CV from text input (engine={'Qwen' if QWEN_AVAILABLE else 'Gemini'})")
        start_time = time.time()

        if QWEN_AVAILABLE:
            try:
                qwen_data = parse_resume(cv_text, is_file_path=False)
                processing_time = round(time.time() - start_time, 2)
                parse_result = _wrap_qwen_result(qwen_data, processing_time)
            except (QwenParsingError, QwenClientError, ValueError) as e:
                logger.error(f"❌ Qwen text parsing failed: {e}")
                return jsonify({
                    'success': False,
                    'message': f'CV parsing failed: {str(e)}'
                }), 400
        else:
            parse_result = cv_parser.parse_cv_text(cv_text)
            if not parse_result.get('success'):
                return jsonify({
                    'success': False,
                    'message': f'CV parsing failed: {parse_result.get("message", "Unknown error")}'
                }), 400
        
        # Add metadata
        parse_result['file_info'] = {
            'source': 'text_input',
            'text_length': len(cv_text),
            'upload_timestamp': datetime.utcnow().isoformat()
        }
        
        # Store CV data
        storage_result = cv_storage_manager.store_cv(parse_result, user_id)
        
        if not storage_result.get('success'):
            return jsonify({
                'success': False,
                'message': f'CV storage failed: {storage_result.get("message", "Unknown error")}'
            }), 500
        
        # Process for job matching
        matching_result = cv_job_matching_integration.process_cv_for_job_matching(parse_result, user_id)
        
        # Find initial job matches
        job_matches = {}
        if matching_result.get('success'):
            job_matches = cv_job_matching_integration.find_job_matches(
                matching_result['matching_criteria'], 
                limit=10
            )
        
        # Complete user profile
        profile_result = cv_job_matching_integration.complete_profile_from_cv(parse_result)
        
        # Prepare response
        response_data = {
            'success': True,
            'message': 'CV text processed successfully',
            'cv_id': storage_result.get('cv_id'),
            'data': parse_result.get('data', {}),
            'analysis': parse_result.get('analysis', {}),
            'file_info': parse_result['file_info'],
            'job_matches': job_matches.get('matches', [])[:5],  # Top 5 matches
            'profile_completion': profile_result.get('completion_percentage', 0),
            'processing_time': parse_result.get('processing_time', 0)
        }
        
        return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"CV text parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Text parsing failed: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/save', methods=['POST'])
def save_cv():
    """Save or update CV data"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
            
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
            
        # Store metadata
        # Ensure we have minimum required structure
        if 'data' not in data and 'personal_info' in data:
            # Handle flattened format if sent by frontend
            data = {'data': data}
            
        # Store CV (store_cv handles updates if cv_id is present)
        result = cv_storage_manager.store_cv(data, user_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        logger.error(f"CV save error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to save CV: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/data', methods=['GET'])
def get_latest_cv_data():
    """Get latest CV data for the user"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get user CVs (limit 1)
        result = cv_storage_manager.get_user_cvs(user_id, limit=1)
        
        if not result.get('success'):
             return jsonify({
                'success': False,
                'message': f'Failed to retrieve CVs: {result.get("message")}'
            }), 500

        cvs = result.get('cvs', [])
        if not cvs:
            return jsonify({
                'success': False,
                'message': 'No CV found found for this user'
            }), 404
            
        # Get the full details of the most recent CV
        latest_cv_id = cvs[0]['cv_id']
        cv_result = cv_storage_manager.get_cv(latest_cv_id, user_id)
        
        return jsonify(cv_result), 200 if cv_result.get('success') else 404
        
    except Exception as e:
        logger.error(f"Latest CV retrieval error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve latest CV: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/list', methods=['GET'])
def list_user_cvs():
    """List user's CVs"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get pagination parameters
        limit = min(int(request.args.get('limit', 20)), 100)
        offset = int(request.args.get('offset', 0))
        
        # Get user CVs
        logger.info(f"Listing CVs for user_id: {user_id} (type: {type(user_id)})")
        result = cv_storage_manager.get_user_cvs(user_id, limit, offset)
        logger.info(f"Found {len(result.get('cvs', []))} CVs for user {user_id}")
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"CV list error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve CVs: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>/visible', methods=['PUT'])
def update_cv_visibility(cv_id):
    """Update CV visibility — when making a CV visible, re-sync profile data."""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        data = request.get_json()
        if not data or 'visible' not in data:
            return jsonify({
                'success': False,
                'message': 'Visibility status required'
            }), 400
            
        is_visible = bool(data['visible'])
        
        # Update visibility
        result = cv_storage_manager.set_cv_visibility(cv_id, user_id, is_visible)
        
        if not result.get('success'):
            return jsonify(result), 500

        # ── Re-sync Profile V2 from the newly-visible CV ──
        if is_visible:
            try:
                import psycopg2, psycopg2.extras, json as _json
                db_config = cv_storage_manager.db_config
                conn = psycopg2.connect(**db_config)
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute(
                    "SELECT parsed_data, analysis_results FROM user_cvs WHERE id = %s AND user_id = %s",
                    (cv_id, user_id)
                )
                row = cur.fetchone()
                cur.close()
                conn.close()

                if row and row.get('parsed_data'):
                    parsed = row['parsed_data']
                    if isinstance(parsed, str):
                        parsed = _json.loads(parsed)
                    analysis = row.get('analysis_results', {})
                    if isinstance(analysis, str):
                        analysis = _json.loads(analysis)

                    cv_result = {
                        'success': True,
                        'data': parsed,
                        'analysis': analysis or {},
                    }

                    from backend.services.profile_v2_service import ProfileV2Service
                    ProfileV2Service.populate_from_cv_data(user_id, cv_result)
                    logger.info(f"✅ Profile V2 re-synced from CV {cv_id} for user {user_id}")
                    result['profile_synced'] = True
                else:
                    logger.warning(f"⚠️ CV {cv_id} has no parsed_data to sync")
                    result['profile_synced'] = False
            except Exception as sync_err:
                logger.error(f"⚠️ Profile re-sync failed (non-blocking): {sync_err}")
                result['profile_synced'] = False

        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"CV visibility update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to update visibility: {str(e)}'
        }), 500


@enhanced_cv_bp.route('/debug-stats', methods=['GET'])
def get_debug_stats():
    """Get storage stats with debug records (admin only)"""
    try:
        # Gate behind admin role
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        stats = cv_storage_manager.get_storage_stats()
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Debug stats error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@enhanced_cv_bp.route('/debug-list/<user_id>', methods=['GET'])
def debug_list_cvs(user_id):
    """Debug: List CVs for specific user ID (admin only)"""
    try:
        auth_user = get_user_id_from_token()
        if not auth_user:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        result = cv_storage_manager.get_user_cvs(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@enhanced_cv_bp.route('/debug-auth', methods=['GET'])
def debug_auth_check():
    """Debug: Check what user ID is extracted from token (admin only)"""
    try:
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return jsonify({
            'success': True,
            'user_id': user_id,
            'user_id_type': str(type(user_id)),
            'raw_header': request.headers.get('Authorization', 'Missing')[:20] + '...' if request.headers.get('Authorization') else 'Missing'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@enhanced_cv_bp.route('/<cv_id>', methods=['GET'])
def get_cv(cv_id):
    """Get specific CV data"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get CV data
        result = cv_storage_manager.get_cv(cv_id, user_id)
        
        return jsonify(result), 200 if result.get('success') else 404
    
    except Exception as e:
        logger.error(f"CV retrieval error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve CV: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>', methods=['PUT'])
def update_cv(cv_id):
    """Update specific CV"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
            
        # Ensure ID in data matches URL
        data['cv_id'] = cv_id
        
        # Store metadata wrapper if needed (frontend sends flat or wrapped)
        # store_cv expects 'data' key for CV fields usually, or handles it.
        # Let's ensure consistency with save_cv
        if 'data' not in data and 'personalInfo' in data: # CamelCase check from frontend
             # Frontend (cvStorageService) sends the raw payload which matches SaveCVRequest
             # SaveCVRequest has cvData, title etc.
             # But the backend parser often produces snake_case.
             # store_cv handles persistence. Let's pass it through.
             pass

        # Update CV
        result = cv_storage_manager.store_cv(data, user_id)
        
        return jsonify(result), 200 if result.get('success') else 500
    
    except Exception as e:
        logger.error(f"CV update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to update CV: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>', methods=['DELETE'])
def delete_cv(cv_id):
    """Delete CV"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Delete CV
        result = cv_storage_manager.delete_cv(cv_id, user_id)
        
        return jsonify(result), 200 if result.get('success') else 404
    
    except Exception as e:
        logger.error(f"CV deletion error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to delete CV: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>/job-matches', methods=['GET'])
def get_cv_job_matches(cv_id):
    """Get job matches for specific CV"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get CV data
        cv_result = cv_storage_manager.get_cv(cv_id, user_id)
        
        if not cv_result.get('success'):
            return jsonify({
                'success': False,
                'message': 'CV not found'
            }), 404
        
        # Process for job matching
        matching_result = cv_job_matching_integration.process_cv_for_job_matching(cv_result, user_id)
        
        if not matching_result.get('success'):
            return jsonify({
                'success': False,
                'message': 'Failed to process CV for job matching'
            }), 500
        
        # Get pagination parameters
        limit = min(int(request.args.get('limit', 20)), 100)
        
        # Find job matches
        job_matches = cv_job_matching_integration.find_job_matches(
            matching_result['matching_criteria'], 
            limit=limit
        )
        
        return jsonify(job_matches), 200
    
    except Exception as e:
        logger.error(f"Job matching error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to find job matches: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>/job-application-insights', methods=['POST'])
def get_job_application_insights(cv_id):
    """Get insights for job application"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get request data
        data = request.get_json()
        if not data or 'job_description' not in data:
            return jsonify({
                'success': False,
                'message': 'Job description is required'
            }), 400
        
        job_description = data['job_description']
        
        # Get CV data
        cv_result = cv_storage_manager.get_cv(cv_id, user_id)
        
        if not cv_result.get('success'):
            return jsonify({
                'success': False,
                'message': 'CV not found'
            }), 404
        
        # Generate insights
        insights = cv_job_matching_integration.generate_job_application_insights(
            cv_result, 
            job_description
        )
        
        return jsonify(insights), 200
    
    except Exception as e:
        logger.error(f"Job application insights error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to generate insights: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/<cv_id>/analytics', methods=['GET'])
def get_cv_analytics(cv_id):
    """Get CV analytics"""
    try:
        # Check authentication
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get analytics
        result = cv_storage_manager.get_cv_analytics(cv_id, user_id)
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"CV analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve analytics: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/storage-stats', methods=['GET'])
def get_storage_stats():
    """Get storage statistics (admin only)"""
    try:
        # In production, check admin permissions
        result = cv_storage_manager.get_storage_stats()
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Storage stats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve stats: {str(e)}'
        }), 500

@enhanced_cv_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test basic functionality
        test_result = {
            'cv_parser': hasattr(cv_parser, 'parse_cv'),
            'storage_manager': hasattr(cv_storage_manager, 'store_cv'),
            'job_matching': hasattr(cv_job_matching_integration, 'process_cv_for_job_matching'),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        all_healthy = all(test_result.values())
        
        return jsonify({
            'success': True,
            'status': 'healthy' if all_healthy else 'degraded',
            'components': test_result
        }), 200 if all_healthy else 503
    
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'message': str(e)
        }), 503

# Error handlers
@enhanced_cv_bp.errorhandler(413)
def file_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'message': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'
    }), 413

@enhanced_cv_bp.errorhandler(400)
def bad_request(error):
    """Handle bad request error"""
    return jsonify({
        'success': False,
        'message': 'Bad request'
    }), 400

@enhanced_cv_bp.errorhandler(500)
def internal_error(error):
    """Handle internal server error"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500
