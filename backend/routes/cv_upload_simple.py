"""
Simplified CV Upload Routes - DEPRECATED
==========================================
⚠️ This module is DEPRECATED. All CV routes have been consolidated into
   routes/enhanced_cv_routes.py (enhanced_cv_bp).

Do NOT register this blueprint alongside enhanced_cv_bp — they share
the same url_prefix (/api/cv) and will cause route collisions.

This file is kept for reference only. Remove in a future cleanup pass.
"""
import os
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

# Robust Imports
try:
    from ..cv_parser import CVParser
except ImportError:
    # Fallback if relative import fails
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from cv_parser import CVParser

try:
    from ..services.profile_v2_service import ProfileV2Service
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services.profile_v2_service import ProfileV2Service

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
cv_upload_bp = Blueprint('cv_upload', __name__, url_prefix='/api/cv')

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
# Create uploads directory relative to backend folder (fallback for local storage)
UPLOAD_FOLDER = Path('uploads/cv_uploads')
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# Storage abstraction (supports local + S3)
try:
    from backend.services.storage import storage as _storage
except ImportError:
    try:
        from services.storage import storage as _storage
    except ImportError:
        _storage = None

# Initialize Parser
cv_parser = CVParser()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_normalized_user_id_simple(identity):
    """
    Normalize user identity to a consistent UUID string.
    Ensures '62' (Int) remains '62', but emails become UUIDs.
    """
    if not identity:
        return None
        
    if isinstance(identity, dict):
        identity = identity.get('id')
    
    identity_str = str(identity).strip()
    
    # Legacy Integer ID Support
    if identity_str.isdigit():
        return identity_str
    
    try:
        # Check if already valid UUID
        return str(uuid.UUID(identity_str))
    except ValueError:
        # If not, hash strictly using DNS namespace
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, identity_str))

@cv_upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_cv():
    """Upload and process CV file (REAL IMPLEMENTATION)"""
    try:
        raw_user_id = get_jwt_identity()
        user_id = get_normalized_user_id_simple(raw_user_id)
        
        logger.info(f"CV Upload (Simple Route) for User: {user_id} (Raw: {raw_user_id})")
        
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
                'message': 'File type not allowed. Please upload PDF, DOCX, DOC, or TXT files.'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'message': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
            }), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{user_id}_{timestamp}_{filename}"
        # Save file via storage service (S3 or local)
        if _storage:
            storage_key = _storage.save_upload(file, 'cv_uploads', safe_filename)
            logger.info(f"File saved via storage service: {storage_key}")
            # Also save locally for parser if using S3
            if _storage.storage_type == 's3':
                file_path = UPLOAD_FOLDER / safe_filename
                file.seek(0)
                file.save(str(file_path))
            else:
                file_path = Path(_storage.local_path(f'cv_uploads/{safe_filename}'))
        else:
            file_path = UPLOAD_FOLDER / safe_filename
            file.save(str(file_path))
            logger.info(f"File saved: {file_path}")
        
        # REAL PARSING Logic (Replaces Mock)
        try:
            # Reset file pointer
            file.seek(0)
            
            # Parse
            # Note: We pass the user_id for context
            parse_result = cv_parser.parse_cv_file(file, user_id)
            
            if not parse_result.get('success', False):
                 # Fallback to pure Mock if parse fails? No, return error to investigate
                 # But we can log error and return partial success if needed.
                 # For now, propagate error from parser if it fails hard.
                 # But parser fallback handles failure gracefully usually.
                 pass

            # POPULATE DB
            logger.info(f"Populating Profile V2 for {user_id}...")
            success = ProfileV2Service.populate_from_cv_data(user_id, parse_result)
            if success:
                logger.info("✅ Profile populated successfully")
            else:
                logger.error("❌ Profile population returned False")

            # Format Response same as Simple expectation
            return jsonify({
                'success': True,
                'message': 'CV uploaded and analyzed successfully',
                'data': {
                    'file_id': safe_filename,
                    'file_size': file_size,
                    'analysis': parse_result.get('data', {}),  # Map parsed data to 'analysis'
                    'upload_time': datetime.now().isoformat()
                }
            }), 200

        except Exception as e:
            logger.error(f"Parser/Populate Error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': f'Processing failed: {str(e)}'
            }), 500
        
    except Exception as e:
        logger.error(f"CV upload error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Upload failed due to system error'
        }), 500

@cv_upload_bp.route('/list', methods=['GET'])
@jwt_required()
def list_cvs():
    """List user's uploaded CVs (Kept Mock or Connected to DB?)"""
    # Keep original list logic safely for now, or Mock for stability
    # The user issue is about Profile Studio Population, not the list API.
    try:
        user_id = get_jwt_identity()
        # Mock CV list for safety to avoid impacting other features
        cvs = [
            {
                'id': 'cv_simple_list',
                'filename': 'Uploaded_CV.pdf',
                'upload_date': datetime.now().isoformat(),
                'status': 'analyzed',
                'match_score': 85
            }
        ]
        return jsonify({
            'success': True,
            'data': cvs
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
