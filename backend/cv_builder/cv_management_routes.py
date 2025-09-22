#!/usr/bin/env python3
"""
CV Management API Routes
Provides comprehensive CV management functionality including CRUD operations,
portfolio management, and advanced CV operations
"""

from flask import Blueprint, request, jsonify
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid
import os

from .cv_builder_engine import CVBuilderEngine
from .cv_export import CVExporter
from .cv_integration import get_cv_analytics_tracker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
cv_management_routes = Blueprint('cv_management_routes', __name__, url_prefix='/api/cv/management')

# Initialize components
cv_builder = CVBuilderEngine()
cv_exporter = CVExporter()
analytics_tracker = get_cv_analytics_tracker()

@cv_management_routes.route('/health', methods=['GET'])
def management_health():
    """CV Management health check"""
    try:
        return jsonify({
            'status': 'healthy',
            'service': 'CV Management',
            'version': '1.0.0',
            'features': {
                'portfolio_management': True,
                'bulk_operations': True,
                'cv_templates': True,
                'version_control': True,
                'sharing_controls': True,
                'backup_restore': True
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"CV management health check failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@cv_management_routes.route('/user/<user_id>/portfolio', methods=['GET'])
def get_user_portfolio(user_id):
    """Get user's complete CV portfolio"""
    try:
        # Get query parameters
        include_analytics = request.args.get('include_analytics', 'false').lower() == 'true'
        sort_by = request.args.get('sort_by', 'last_modified')
        order = request.args.get('order', 'desc')
        
        # Get user CVs
        user_cvs = cv_builder.get_user_cvs(user_id)
        
        portfolio = []
        for cv_metadata in user_cvs:
            cv_info = {
                'cv_id': cv_metadata['cv_id'],
                'title': cv_metadata['title'],
                'template': cv_metadata['template'],
                'language': cv_metadata['language'],
                'completion_score': cv_metadata['completion_score'],
                'is_active': cv_metadata['is_active'],
                'created_at': cv_metadata['created_at'],
                'last_modified': cv_metadata['last_modified'],
                'version': cv_metadata['version']
            }
            
            # Add analytics if requested
            if include_analytics:
                analytics = analytics_tracker.get_cv_analytics(cv_metadata['cv_id'])
                if analytics:
                    cv_info['analytics'] = {
                        'view_count': analytics.view_count,
                        'download_count': analytics.download_count,
                        'match_score_avg': analytics.match_score_avg,
                        'sections_completed': len(analytics.sections_completed)
                    }
            
            portfolio.append(cv_info)
        
        # Sort portfolio
        reverse_order = order.lower() == 'desc'
        if sort_by == 'completion_score':
            portfolio.sort(key=lambda x: x['completion_score'], reverse=reverse_order)
        elif sort_by == 'created_at':
            portfolio.sort(key=lambda x: x['created_at'], reverse=reverse_order)
        elif sort_by == 'title':
            portfolio.sort(key=lambda x: x['title'], reverse=reverse_order)
        else:  # last_modified
            portfolio.sort(key=lambda x: x['last_modified'], reverse=reverse_order)
        
        # Portfolio statistics
        if portfolio:
            completion_scores = [cv['completion_score'] for cv in portfolio]
            stats = {
                'total_cvs': len(portfolio),
                'active_cvs': len([cv for cv in portfolio if cv['is_active']]),
                'average_completion': sum(completion_scores) / len(completion_scores),
                'highest_completion': max(completion_scores),
                'templates_used': list(set([cv['template'] for cv in portfolio])),
                'languages_used': list(set([cv['language'] for cv in portfolio]))
            }
        else:
            stats = {
                'total_cvs': 0,
                'active_cvs': 0,
                'average_completion': 0,
                'highest_completion': 0,
                'templates_used': [],
                'languages_used': []
            }
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'portfolio': portfolio,
            'statistics': stats,
            'sort_by': sort_by,
            'order': order
        })
        
    except Exception as e:
        logger.error(f"Error getting user portfolio for {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/cv/<cv_id>/duplicate', methods=['POST'])
def duplicate_cv(cv_id):
    """Duplicate an existing CV"""
    try:
        data = request.get_json() or {}
        new_title = data.get('title', f'Copy of CV')
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get original CV
        original_cv = cv_builder.get_cv(cv_id)
        if not original_cv:
            return jsonify({'error': 'Original CV not found'}), 404
        
        # Create new CV with same data
        new_cv_id = str(uuid.uuid4())
        
        # Prepare new CV data
        new_cv_data = original_cv['data'].copy()
        new_metadata = {
            'cv_id': new_cv_id,
            'user_id': user_id,
            'title': new_title,
            'template': original_cv['metadata']['template'],
            'language': original_cv['metadata']['language'],
            'version': 1,
            'completion_score': original_cv['metadata']['completion_score'],
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'last_modified': datetime.now().isoformat()
        }
        
        # Save new CV
        success = cv_builder.save_cv(new_cv_id, new_cv_data, new_metadata)
        
        if success:
            # Track creation
            analytics_tracker.track_cv_creation(
                new_cv_id, 
                user_id, 
                new_metadata['template']
            )
            analytics_tracker.track_cv_update(new_cv_id, new_cv_data)
            
            return jsonify({
                'success': True,
                'original_cv_id': cv_id,
                'new_cv_id': new_cv_id,
                'title': new_title,
                'created_at': new_metadata['created_at']
            })
        else:
            return jsonify({'error': 'Failed to duplicate CV'}), 500
            
    except Exception as e:
        logger.error(f"Error duplicating CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/cv/<cv_id>/versions', methods=['GET'])
def get_cv_versions(cv_id):
    """Get version history for a CV"""
    try:
        # This would typically come from a version control system
        # For now, return current version info
        cv = cv_builder.get_cv(cv_id)
        if not cv:
            return jsonify({'error': 'CV not found'}), 404
        
        versions = [
            {
                'version': cv['metadata']['version'],
                'created_at': cv['metadata']['last_modified'],
                'changes': ['Current version'],
                'is_current': True
            }
        ]
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'versions': versions,
            'current_version': cv['metadata']['version']
        })
        
    except Exception as e:
        logger.error(f"Error getting CV versions for {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/cv/<cv_id>/activate', methods=['POST'])
def activate_cv(cv_id):
    """Activate a CV (set as primary)"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get CV
        cv = cv_builder.get_cv(cv_id)
        if not cv:
            return jsonify({'error': 'CV not found'}), 404
        
        # Deactivate other CVs for this user
        user_cvs = cv_builder.get_user_cvs(user_id)
        for cv_meta in user_cvs:
            if cv_meta['cv_id'] != cv_id and cv_meta['is_active']:
                # Update metadata to deactivate
                cv_data = cv_builder.get_cv(cv_meta['cv_id'])
                if cv_data:
                    cv_data['metadata']['is_active'] = False
                    cv_builder.save_cv(cv_meta['cv_id'], cv_data['data'], cv_data['metadata'])
        
        # Activate target CV
        cv['metadata']['is_active'] = True
        cv['metadata']['last_modified'] = datetime.now().isoformat()
        
        success = cv_builder.save_cv(cv_id, cv['data'], cv['metadata'])
        
        if success:
            return jsonify({
                'success': True,
                'cv_id': cv_id,
                'status': 'activated',
                'message': 'CV has been set as your primary CV'
            })
        else:
            return jsonify({'error': 'Failed to activate CV'}), 500
            
    except Exception as e:
        logger.error(f"Error activating CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/cv/<cv_id>/deactivate', methods=['POST'])
def deactivate_cv(cv_id):
    """Deactivate a CV"""
    try:
        # Get CV
        cv = cv_builder.get_cv(cv_id)
        if not cv:
            return jsonify({'error': 'CV not found'}), 404
        
        # Deactivate CV
        cv['metadata']['is_active'] = False
        cv['metadata']['last_modified'] = datetime.now().isoformat()
        
        success = cv_builder.save_cv(cv_id, cv['data'], cv['metadata'])
        
        if success:
            return jsonify({
                'success': True,
                'cv_id': cv_id,
                'status': 'deactivated',
                'message': 'CV has been deactivated'
            })
        else:
            return jsonify({'error': 'Failed to deactivate CV'}), 500
            
    except Exception as e:
        logger.error(f"Error deactivating CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/user/<user_id>/bulk-operations', methods=['POST'])
def bulk_operations(user_id):
    """Perform bulk operations on user's CVs"""
    try:
        data = request.get_json()
        operation = data.get('operation')
        cv_ids = data.get('cv_ids', [])
        
        if not operation or not cv_ids:
            return jsonify({'error': 'operation and cv_ids are required'}), 400
        
        results = []
        
        if operation == 'delete':
            for cv_id in cv_ids:
                try:
                    success = cv_builder.delete_cv(cv_id)
                    results.append({
                        'cv_id': cv_id,
                        'success': success,
                        'operation': 'delete'
                    })
                except Exception as e:
                    results.append({
                        'cv_id': cv_id,
                        'success': False,
                        'error': str(e),
                        'operation': 'delete'
                    })
        
        elif operation == 'export':
            export_format = data.get('format', 'pdf')
            for cv_id in cv_ids:
                try:
                    cv = cv_builder.get_cv(cv_id)
                    if cv:
                        file_path = cv_exporter.export_cv(
                            cv['data'], 
                            cv['metadata'], 
                            export_format
                        )
                        results.append({
                            'cv_id': cv_id,
                            'success': True,
                            'file_path': file_path,
                            'operation': 'export'
                        })
                    else:
                        results.append({
                            'cv_id': cv_id,
                            'success': False,
                            'error': 'CV not found',
                            'operation': 'export'
                        })
                except Exception as e:
                    results.append({
                        'cv_id': cv_id,
                        'success': False,
                        'error': str(e),
                        'operation': 'export'
                    })
        
        elif operation == 'duplicate':
            for cv_id in cv_ids:
                try:
                    # Get original CV
                    original_cv = cv_builder.get_cv(cv_id)
                    if original_cv:
                        # Create new CV
                        new_cv_id = str(uuid.uuid4())
                        new_metadata = original_cv['metadata'].copy()
                        new_metadata['cv_id'] = new_cv_id
                        new_metadata['title'] = f"Copy of {new_metadata['title']}"
                        new_metadata['version'] = 1
                        new_metadata['created_at'] = datetime.now().isoformat()
                        new_metadata['last_modified'] = datetime.now().isoformat()
                        
                        success = cv_builder.save_cv(new_cv_id, original_cv['data'], new_metadata)
                        
                        results.append({
                            'cv_id': cv_id,
                            'new_cv_id': new_cv_id if success else None,
                            'success': success,
                            'operation': 'duplicate'
                        })
                    else:
                        results.append({
                            'cv_id': cv_id,
                            'success': False,
                            'error': 'CV not found',
                            'operation': 'duplicate'
                        })
                except Exception as e:
                    results.append({
                        'cv_id': cv_id,
                        'success': False,
                        'error': str(e),
                        'operation': 'duplicate'
                    })
        
        else:
            return jsonify({'error': f'Unknown operation: {operation}'}), 400
        
        # Calculate success rate
        successful_operations = len([r for r in results if r['success']])
        success_rate = (successful_operations / len(results)) * 100 if results else 0
        
        return jsonify({
            'success': True,
            'operation': operation,
            'total_cvs': len(cv_ids),
            'successful_operations': successful_operations,
            'success_rate': success_rate,
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error performing bulk operations for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/cv/<cv_id>/sharing', methods=['GET', 'POST'])
def manage_cv_sharing(cv_id):
    """Manage CV sharing settings"""
    try:
        if request.method == 'GET':
            # Get current sharing settings
            cv = cv_builder.get_cv(cv_id)
            if not cv:
                return jsonify({'error': 'CV not found'}), 404
            
            # Default sharing settings
            sharing_settings = cv['metadata'].get('sharing_settings', {
                'is_public': False,
                'share_link': None,
                'password_protected': False,
                'expiry_date': None,
                'view_count': 0,
                'download_enabled': True
            })
            
            return jsonify({
                'success': True,
                'cv_id': cv_id,
                'sharing_settings': sharing_settings
            })
        
        else:  # POST
            data = request.get_json()
            
            # Get CV
            cv = cv_builder.get_cv(cv_id)
            if not cv:
                return jsonify({'error': 'CV not found'}), 404
            
            # Update sharing settings
            sharing_settings = cv['metadata'].get('sharing_settings', {})
            
            if 'is_public' in data:
                sharing_settings['is_public'] = data['is_public']
                
                # Generate share link if making public
                if data['is_public'] and not sharing_settings.get('share_link'):
                    sharing_settings['share_link'] = f"https://emiratijourney.com/cv/shared/{cv_id}"
            
            if 'password_protected' in data:
                sharing_settings['password_protected'] = data['password_protected']
            
            if 'expiry_date' in data:
                sharing_settings['expiry_date'] = data['expiry_date']
            
            if 'download_enabled' in data:
                sharing_settings['download_enabled'] = data['download_enabled']
            
            # Save updated settings
            cv['metadata']['sharing_settings'] = sharing_settings
            cv['metadata']['last_modified'] = datetime.now().isoformat()
            
            success = cv_builder.save_cv(cv_id, cv['data'], cv['metadata'])
            
            if success:
                return jsonify({
                    'success': True,
                    'cv_id': cv_id,
                    'sharing_settings': sharing_settings,
                    'message': 'Sharing settings updated successfully'
                })
            else:
                return jsonify({'error': 'Failed to update sharing settings'}), 500
            
    except Exception as e:
        logger.error(f"Error managing CV sharing for {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/cv/<cv_id>/backup', methods=['POST'])
def backup_cv(cv_id):
    """Create a backup of CV"""
    try:
        # Get CV
        cv = cv_builder.get_cv(cv_id)
        if not cv:
            return jsonify({'error': 'CV not found'}), 404
        
        # Create backup
        backup_data = {
            'cv_id': cv_id,
            'backup_date': datetime.now().isoformat(),
            'data': cv['data'],
            'metadata': cv['metadata'],
            'version': cv['metadata']['version']
        }
        
        # Save backup (in a real implementation, this would go to a backup storage)
        backup_id = f"backup_{cv_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # For now, save as JSON file
        backup_dir = '/home/ubuntu/emirati_journey_api/backups'
        os.makedirs(backup_dir, exist_ok=True)
        
        backup_file = os.path.join(backup_dir, f"{backup_id}.json")
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'backup_id': backup_id,
            'backup_file': backup_file,
            'backup_date': backup_data['backup_date']
        })
        
    except Exception as e:
        logger.error(f"Error creating backup for CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/cv/<cv_id>/restore', methods=['POST'])
def restore_cv(cv_id):
    """Restore CV from backup"""
    try:
        data = request.get_json()
        backup_id = data.get('backup_id')
        
        if not backup_id:
            return jsonify({'error': 'backup_id is required'}), 400
        
        # Load backup
        backup_dir = '/home/ubuntu/emirati_journey_api/backups'
        backup_file = os.path.join(backup_dir, f"{backup_id}.json")
        
        if not os.path.exists(backup_file):
            return jsonify({'error': 'Backup not found'}), 404
        
        with open(backup_file, 'r') as f:
            backup_data = json.load(f)
        
        # Restore CV
        restored_metadata = backup_data['metadata'].copy()
        restored_metadata['last_modified'] = datetime.now().isoformat()
        restored_metadata['version'] += 1  # Increment version
        
        success = cv_builder.save_cv(cv_id, backup_data['data'], restored_metadata)
        
        if success:
            return jsonify({
                'success': True,
                'cv_id': cv_id,
                'backup_id': backup_id,
                'restored_version': restored_metadata['version'],
                'restore_date': datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Failed to restore CV'}), 500
            
    except Exception as e:
        logger.error(f"Error restoring CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_management_routes.route('/user/<user_id>/statistics', methods=['GET'])
def get_user_statistics(user_id):
    """Get comprehensive user statistics"""
    try:
        # Get user CVs
        user_cvs = cv_builder.get_user_cvs(user_id)
        
        if not user_cvs:
            return jsonify({
                'success': True,
                'user_id': user_id,
                'statistics': {
                    'total_cvs': 0,
                    'active_cvs': 0,
                    'completion_stats': {},
                    'template_usage': {},
                    'language_usage': {},
                    'activity_stats': {}
                }
            })
        
        # Calculate statistics
        total_cvs = len(user_cvs)
        active_cvs = len([cv for cv in user_cvs if cv['is_active']])
        
        # Completion statistics
        completion_scores = [cv['completion_score'] for cv in user_cvs]
        completion_stats = {
            'average': sum(completion_scores) / len(completion_scores),
            'highest': max(completion_scores),
            'lowest': min(completion_scores),
            'distribution': {
                'excellent': len([s for s in completion_scores if s >= 90]),
                'good': len([s for s in completion_scores if 70 <= s < 90]),
                'fair': len([s for s in completion_scores if 50 <= s < 70]),
                'poor': len([s for s in completion_scores if s < 50])
            }
        }
        
        # Template usage
        templates = [cv['template'] for cv in user_cvs]
        template_usage = {}
        for template in templates:
            template_usage[template] = template_usage.get(template, 0) + 1
        
        # Language usage
        languages = [cv['language'] for cv in user_cvs]
        language_usage = {}
        for language in languages:
            language_usage[language] = language_usage.get(language, 0) + 1
        
        # Activity statistics
        created_dates = [cv['created_at'] for cv in user_cvs]
        modified_dates = [cv['last_modified'] for cv in user_cvs]
        
        activity_stats = {
            'first_cv_created': min(created_dates) if created_dates else None,
            'last_cv_created': max(created_dates) if created_dates else None,
            'last_activity': max(modified_dates) if modified_dates else None,
            'cvs_this_month': len([
                cv for cv in user_cvs 
                if cv['created_at'].startswith(datetime.now().strftime('%Y-%m'))
            ])
        }
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'statistics': {
                'total_cvs': total_cvs,
                'active_cvs': active_cvs,
                'completion_stats': completion_stats,
                'template_usage': template_usage,
                'language_usage': language_usage,
                'activity_stats': activity_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting user statistics for {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@cv_management_routes.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Management endpoint not found'}), 404

@cv_management_routes.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal management error'}), 500

if __name__ == "__main__":
    # Test the management routes
    from flask import Flask
    
    app = Flask(__name__)
    app.register_blueprint(cv_management_routes)
    
    print("CV Management routes registered successfully")
    print("Available endpoints:")
    for rule in app.url_map.iter_rules():
        if rule.endpoint.startswith('cv_management_routes'):
            print(f"  {rule.methods} {rule.rule}")

