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
from flask_jwt_extended import jwt_required, get_jwt_identity

from .cv_builder_engine import get_cv_builder_engine, CVTemplate, CVLanguage
from .cv_export import CVExporter
from .cv_templates import CVTemplateManager
from ..cv_storage_manager import cv_storage_manager  # Import from parent package

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
cv_routes = Blueprint('cv_routes', __name__, url_prefix='/api/cv')

# Initialize components
cv_engine = get_cv_builder_engine()
cv_exporter = CVExporter()
template_manager = CVTemplateManager()

@cv_routes.route('/health', methods=['GET'])
def cv_health():
    """CV Builder health check"""
    try:
        storage_stats = cv_storage_manager.get_storage_stats()
        return jsonify({
            'status': 'healthy',
            'service': 'CV Builder',
            'version': '1.0.0',
            'features': {
                'cv_creation': True,
                'template_system': True,
                'uae_optimization': True,
                'export_formats': ['pdf', 'docx', 'json'],
                'languages': ['english', 'arabic', 'bilingual'],
                'persistent_storage': True
            },
            'storage_stats': storage_stats.get('stats', {}),
            'templates_available': len(template_manager.get_available_templates()),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"CV health check failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@cv_routes.route('/create', methods=['POST'])
@jwt_required()
def create_cv():
    """Create a new CV"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Enforce user_id match if provided, otherwise use token identity
        requested_user_id = data.get('user_id')
        if requested_user_id and str(requested_user_id) != str(current_user_id):
             return jsonify({'error': 'Unauthorized: Cannot create CV for another user'}), 403
             
        user_id = str(current_user_id)
        
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
        
        # Create CV Data Structure
        cv_data = cv_engine.create_cv(user_id, template_enum, language_enum)
        cv_data['metadata']['title'] = title
        
        # Store CV Persistent
        store_result = cv_storage_manager.store_cv(cv_data, user_id)
        if not store_result['success']:
             raise Exception(store_result['message'])
        
        cv_id = store_result['cv_id']
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
@jwt_required()
def get_cv(cv_id):
    """Get CV data"""
    try:
        current_user_id = get_jwt_identity()
        
        # Retrieve from Persistent Storage
        result = cv_storage_manager.get_cv(cv_id)
        
        if not result['success']:
            return jsonify({'error': result['message']}), 404
            
        cv_data = result
        
        # Authorization Check
        if str(cv_data.get('user_id')) != str(current_user_id):
             # Allow admins in future, but for now strict ownership
             return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'metadata': cv_data['metadata'],
            'data': cv_data.get('data', {}),
            'template_config': cv_engine._get_template_config(
                CVTemplate(cv_data['metadata'].get('template', 'professional')),
                CVLanguage(cv_data['metadata'].get('language', 'english'))
            )
        })
        
    except Exception as e:
        logger.error(f"Error retrieving CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/personal-info', methods=['PUT'])
@jwt_required()
def update_personal_info(cv_id):
    """Update personal information"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get existing CV
        existing_result = cv_storage_manager.get_cv(cv_id)
        if not existing_result['success']:
             return jsonify({'error': 'CV not found'}), 404
             
        if str(existing_result['user_id']) != str(current_user_id):
             return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        personal_info = data.get('personal_info', {})
        
        # Reconstruct CVData structure for engine
        cv_structure = {
             'metadata': existing_result['metadata'],
             'data': existing_result['data']
        }
        
        # Update logic
        updated_cv = cv_engine.update_personal_info(cv_structure, personal_info)
        
        # Save back to storage
        cv_storage_manager.store_cv(updated_cv, str(current_user_id))
        
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
@jwt_required()
def add_experience(cv_id):
    """Add work experience"""
    try:
        current_user_id = get_jwt_identity()
        
        existing_result = cv_storage_manager.get_cv(cv_id)
        if not existing_result['success']: return jsonify({'error': 'CV not found'}), 404
        if str(existing_result['user_id']) != str(current_user_id): return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        experience = data.get('experience', {})
        
        cv_structure = {'metadata': existing_result['metadata'], 'data': existing_result['data']}
        updated_cv = cv_engine.add_experience(cv_structure, experience)
        
        cv_storage_manager.store_cv(updated_cv, str(current_user_id))
        
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
@jwt_required()
def add_education(cv_id):
    """Add education"""
    try:
        current_user_id = get_jwt_identity()
        existing_result = cv_storage_manager.get_cv(cv_id)
        if not existing_result['success']: return jsonify({'error': 'CV not found'}), 404
        if str(existing_result['user_id']) != str(current_user_id): return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        education = data.get('education', {})
        
        cv_structure = {'metadata': existing_result['metadata'], 'data': existing_result['data']}
        updated_cv = cv_engine.add_education(cv_structure, education)
        
        cv_storage_manager.store_cv(updated_cv, str(current_user_id))
        
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
@jwt_required()
def add_skill(cv_id):
    """Add skill"""
    try:
        current_user_id = get_jwt_identity()
        existing_result = cv_storage_manager.get_cv(cv_id)
        if not existing_result['success']: return jsonify({'error': 'CV not found'}), 404
        if str(existing_result['user_id']) != str(current_user_id): return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        skill = data.get('skill', {})
        
        cv_structure = {'metadata': existing_result['metadata'], 'data': existing_result['data']}
        updated_cv = cv_engine.add_skill(cv_structure, skill)
        
        cv_storage_manager.store_cv(updated_cv, str(current_user_id))
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'completion_score': updated_cv['metadata']['completion_score'],
            'last_modified': updated_cv['metadata']['last_modified']
        })
        
    except Exception as e:
        logger.error(f"Error adding skill to CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>/generate-summary', methods=['POST'])
@jwt_required()
def generate_professional_summary(cv_id):
    """Generate AI-powered professional summary"""
    try:
        current_user_id = get_jwt_identity()
        existing_result = cv_storage_manager.get_cv(cv_id)
        if not existing_result['success']: return jsonify({'error': 'CV not found'}), 404
        if str(existing_result['user_id']) != str(current_user_id): return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        industry = data.get('industry')
        
        cv_structure = {'metadata': existing_result['metadata'], 'data': existing_result['data']}
        summary = cv_engine.generate_professional_summary(cv_structure, industry)
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'generated_summary': summary
        })
        
    except Exception as e:
        logger.error(f"Error generating professional summary for CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/user/<user_id>/cvs', methods=['GET'])
@jwt_required()
def get_user_cvs(user_id):
    """Get all CVs for a user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Strict security check: requester must be the owner
        if str(user_id) != str(current_user_id):
            return jsonify({'error': 'Unauthorized: Cannot view CVs of another user'}), 403
            
        result = cv_storage_manager.get_user_cvs(user_id)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error getting CVs for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_routes.route('/<cv_id>', methods=['DELETE'])
@jwt_required()
def delete_cv(cv_id):
    """Delete a CV"""
    try:
        current_user_id = get_jwt_identity()
        result = cv_storage_manager.delete_cv(cv_id, str(current_user_id))
        
        if not result['success']:
            return jsonify({'error': result['message']}), 400
            
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error deleting CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@cv_routes.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@cv_routes.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

