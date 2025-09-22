#!/usr/bin/env python3
"""
CV Builder API Routes
Emirati Journey Platform - Step 6 Implementation
"""

from flask import Blueprint, request, jsonify, send_file
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
from pathlib import Path

from .cv_builder_engine import get_cv_builder_engine, CVTemplate, CVLanguage
from .cv_export import CVExporter
from .cv_templates import CVTemplateManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
cv_routes = Blueprint('cv_routes', __name__, url_prefix='/api/cv')

# Initialize components
cv_engine = get_cv_builder_engine()
cv_exporter = CVExporter()
template_manager = CVTemplateManager()

# In-memory storage (replace with database in production)
cv_storage = {}

@cv_routes.route('/health', methods=['GET'])
def cv_health():
    """CV Builder health check"""
    try:
        return jsonify({
            'status': 'healthy',
            'service': 'CV Builder',
            'version': '1.0.0',
            'features': {
                'cv_creation': True,
                'template_system': True,
                'uae_optimization': True,
                'export_formats': ['pdf', 'docx', 'json'],
                'languages': ['english', 'arabic', 'bilingual']
            },
            'templates_available': len(template_manager.get_available_templates()),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"CV health check failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@cv_routes.route('/create', methods=['POST'])
def create_cv():
    """Create a new CV"""
    try:
        data = request.get_json()
        
        # Validate required fields
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get optional parameters
        template = data.get('template', 'professional')
        language = data.get('language', 'english')
        title = data.get('title', 'My CV')
        
        # Convert string values to enums
        try:
            template_enum = CVTemplate(template.lower())
            language_enum = CVLanguage(language.lower())
        except ValueError as e:
            return jsonify({'error': f'Invalid template or language: {str(e)}'}), 400
        
        # Create CV
        cv_data = cv_engine.create_cv(user_id, template_enum, language_enum)
        cv_data['metadata']['title'] = title
        
        # Store CV
        cv_id = cv_data['metadata']['cv_id']
        cv_storage[cv_id] = cv_data
        
        logger.info(f"Created CV {cv_id} for user {user_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'metadata': cv_data['metadata'],
            'template_config': cv_data['template_config']
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating CV: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>', methods=['GET'])
def get_cv(cv_id):
    """Get CV data"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        cv_data = cv_storage[cv_id]
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'metadata': cv_data['metadata'],
            'data': cv_data['data'],
            'template_config': cv_data['template_config']
        })
        
    except Exception as e:
        logger.error(f"Error retrieving CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/personal-info', methods=['PUT'])
def update_personal_info(cv_id):
    """Update personal information"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        data = request.get_json()
        personal_info = data.get('personal_info', {})
        
        # Update CV
        cv_data = cv_storage[cv_id]
        updated_cv = cv_engine.update_personal_info(cv_data, personal_info)
        cv_storage[cv_id] = updated_cv
        
        logger.info(f"Updated personal info for CV {cv_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'completion_score': updated_cv['metadata']['completion_score'],
            'last_modified': updated_cv['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error updating personal info for CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/experience', methods=['POST'])
def add_experience(cv_id):
    """Add work experience"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        data = request.get_json()
        experience = data.get('experience', {})
        
        # Update CV
        cv_data = cv_storage[cv_id]
        updated_cv = cv_engine.add_experience(cv_data, experience)
        cv_storage[cv_id] = updated_cv
        
        logger.info(f"Added experience to CV {cv_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'completion_score': updated_cv['metadata']['completion_score'],
            'last_modified': updated_cv['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error adding experience to CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/education', methods=['POST'])
def add_education(cv_id):
    """Add education"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        data = request.get_json()
        education = data.get('education', {})
        
        # Update CV
        cv_data = cv_storage[cv_id]
        updated_cv = cv_engine.add_education(cv_data, education)
        cv_storage[cv_id] = updated_cv
        
        logger.info(f"Added education to CV {cv_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'completion_score': updated_cv['metadata']['completion_score'],
            'last_modified': updated_cv['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error adding education to CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/skills', methods=['POST'])
def add_skill(cv_id):
    """Add skill"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        data = request.get_json()
        skill = data.get('skill', {})
        
        # Update CV
        cv_data = cv_storage[cv_id]
        updated_cv = cv_engine.add_skill(cv_data, skill)
        cv_storage[cv_id] = updated_cv
        
        logger.info(f"Added skill to CV {cv_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'completion_score': updated_cv['metadata']['completion_score'],
            'last_modified': updated_cv['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error adding skill to CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/professional-summary', methods=['PUT'])
def update_professional_summary(cv_id):
    """Update professional summary"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        data = request.get_json()
        summary = data.get('summary', '')
        
        # Update CV
        cv_data = cv_storage[cv_id]
        cv_data['data']['professional_summary'] = summary
        cv_data['metadata']['last_modified'] = datetime.now().isoformat()
        cv_data['metadata']['completion_score'] = cv_engine._calculate_completion_score(cv_data['data'])
        
        cv_storage[cv_id] = cv_data
        
        logger.info(f"Updated professional summary for CV {cv_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'completion_score': cv_data['metadata']['completion_score'],
            'last_modified': cv_data['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error updating professional summary for CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/generate-summary', methods=['POST'])
def generate_professional_summary(cv_id):
    """Generate AI-powered professional summary"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        data = request.get_json()
        industry = data.get('industry')
        
        cv_data = cv_storage[cv_id]
        summary = cv_engine.generate_professional_summary(cv_data, industry)
        
        logger.info(f"Generated professional summary for CV {cv_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'generated_summary': summary
        })
        
    except Exception as e:
        logger.error(f"Error generating professional summary for CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/completion-score', methods=['GET'])
def get_completion_score(cv_id):
    """Get CV completion score and recommendations"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        cv_data = cv_storage[cv_id]
        score = cv_engine._calculate_completion_score(cv_data['data'])
        
        # Generate recommendations based on missing sections
        recommendations = []
        data = cv_data['data']
        
        if not data.get('professional_summary'):
            recommendations.append("Add a professional summary")
        if not data.get('experience'):
            recommendations.append("Add work experience")
        if not data.get('education'):
            recommendations.append("Add education background")
        if not data.get('skills') or len(data.get('skills', [])) < 5:
            recommendations.append("Add more skills")
        if not data.get('languages'):
            recommendations.append("Add language proficiencies")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'completion_score': score,
            'recommendations': recommendations,
            'sections_status': {
                'personal_info': bool(data.get('personal_info', {}).get('full_name')),
                'professional_summary': bool(data.get('professional_summary')),
                'experience': bool(data.get('experience')),
                'education': bool(data.get('education')),
                'skills': bool(data.get('skills')),
                'languages': bool(data.get('languages'))
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting completion score for CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/export/<format>', methods=['GET'])
def export_cv(cv_id, format):
    """Export CV in specified format"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        if format not in ['pdf', 'docx', 'json']:
            return jsonify({'error': 'Invalid export format. Supported: pdf, docx, json'}), 400
        
        cv_data = cv_storage[cv_id]
        
        if format == 'json':
            # Return JSON data directly
            return jsonify({
                'success': True,
                'cv_data': cv_data
            })
        
        # Export to file
        file_path = cv_exporter.export_cv(cv_data, format)
        
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'Export failed'}), 500
        
        # Determine MIME type
        mime_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        
        filename = f"cv_{cv_id}.{format}"
        
        return send_file(
            file_path,
            mimetype=mime_types[format],
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error(f"Error exporting CV {cv_id} as {format}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/templates', methods=['GET'])
def get_templates():
    """Get available CV templates"""
    try:
        templates = template_manager.get_available_templates()
        
        return jsonify({
            'success': True,
            'templates': templates
        })
        
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/templates/<template_id>/preview', methods=['GET'])
def get_template_preview(template_id):
    """Get template preview"""
    try:
        preview = template_manager.get_template_preview(template_id)
        
        if not preview:
            return jsonify({'error': 'Template not found'}), 404
        
        return jsonify({
            'success': True,
            'template_id': template_id,
            'preview': preview
        })
        
    except Exception as e:
        logger.error(f"Error getting template preview for {template_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/user/<user_id>/cvs', methods=['GET'])
def get_user_cvs(user_id):
    """Get all CVs for a user"""
    try:
        user_cvs = []
        
        for cv_id, cv_data in cv_storage.items():
            if cv_data['metadata']['user_id'] == user_id:
                user_cvs.append({
                    'cv_id': cv_id,
                    'title': cv_data['metadata'].get('title', 'Untitled CV'),
                    'template': cv_data['metadata']['template'],
                    'language': cv_data['metadata']['language'],
                    'completion_score': cv_data['metadata']['completion_score'],
                    'created_at': cv_data['metadata']['created_at'],
                    'last_modified': cv_data['metadata']['last_modified'],
                    'is_active': cv_data['metadata']['is_active']
                })
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'cvs': user_cvs,
            'total_count': len(user_cvs)
        })
        
    except Exception as e:
        logger.error(f"Error getting CVs for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>', methods=['DELETE'])
def delete_cv(cv_id):
    """Delete a CV"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        # Mark as inactive instead of deleting
        cv_storage[cv_id]['metadata']['is_active'] = False
        cv_storage[cv_id]['metadata']['last_modified'] = datetime.now().isoformat()
        
        logger.info(f"Deleted CV {cv_id}")
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'message': 'CV deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/duplicate', methods=['POST'])
def duplicate_cv(cv_id):
    """Duplicate an existing CV"""
    try:
        if cv_id not in cv_storage:
            return jsonify({'error': 'CV not found'}), 404
        
        data = request.get_json()
        new_title = data.get('title', f"Copy of {cv_storage[cv_id]['metadata'].get('title', 'CV')}")
        
        # Create a copy of the CV
        original_cv = cv_storage[cv_id]
        new_cv = json.loads(json.dumps(original_cv))  # Deep copy
        
        # Update metadata
        new_cv_id = f"cv_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_id}"
        new_cv['metadata']['cv_id'] = new_cv_id
        new_cv['metadata']['title'] = new_title
        new_cv['metadata']['version'] = 1
        new_cv['metadata']['created_at'] = datetime.now().isoformat()
        new_cv['metadata']['last_modified'] = datetime.now().isoformat()
        
        # Store the new CV
        cv_storage[new_cv_id] = new_cv
        
        logger.info(f"Duplicated CV {cv_id} to {new_cv_id}")
        
        return jsonify({
            'success': True,
            'original_cv_id': cv_id,
            'new_cv_id': new_cv_id,
            'metadata': new_cv['metadata']
        }), 201
        
    except Exception as e:
        logger.error(f"Error duplicating CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@cv_routes.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@cv_routes.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    # Test the routes
    from flask import Flask
    
    app = Flask(__name__)
    app.register_blueprint(cv_routes)
    
    print("CV Builder routes registered successfully")
    print("Available endpoints:")
    for rule in app.url_map.iter_rules():
        if rule.endpoint.startswith('cv_routes'):
            print(f"  {rule.methods} {rule.rule}")

