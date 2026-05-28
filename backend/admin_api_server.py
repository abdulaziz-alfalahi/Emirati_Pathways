#!/usr/bin/env python3
"""
Admin API Keys Management Backend Endpoints
Provides secure API endpoints for platform administrators to manage AI service providers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import hashlib
import secrets
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins="*")

# Mock database - in production, use proper database
admin_providers = {}
admin_configurations = {}
admin_audit_logs = []
admin_health_metrics = {}

# Admin roles that can access this system
ADMIN_ROLES = ['platform_administrator', 'super_user']

# Supported provider categories and their configurations
PROVIDER_TEMPLATES = {
    'groq-llama4': {
        'id': 'groq-llama4',
        'name': 'Groq (Llama 4 Scout)',
        'category': 'LLM',
        'description': 'High-performance LLM inference with Llama 4 Scout model',
        'endpoint': 'https://api.groq.com/openai/v1',
        'models': ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
        'default_model': 'llama-3.1-70b-versatile',
        'config_schema': {
            'api_key': {'type': 'string', 'required': True, 'sensitive': True},
            'endpoint': {'type': 'string', 'required': True},
            'model': {'type': 'string', 'required': True},
            'temperature': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 2.0},
            'max_tokens': {'type': 'integer', 'default': 4096, 'min': 1, 'max': 32768},
            'top_p': {'type': 'float', 'default': 0.9, 'min': 0.0, 'max': 1.0}
        }
    },
    'google-gemini': {
        'id': 'google-gemini',
        'name': 'Google AI Engine',
        'category': 'LLM',
        'description': 'Advanced multimodal AI with superior reasoning capabilities',
        'endpoint': 'https://generativelanguage.googleapis.com/v1beta',
        'models': ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'],
        'default_model': 'gemini-2.5-pro',
        'config_schema': {
            'api_key': {'type': 'string', 'required': True, 'sensitive': True},
            'endpoint': {'type': 'string', 'required': True},
            'model': {'type': 'string', 'required': True},
            'temperature': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 2.0},
            'max_output_tokens': {'type': 'integer', 'default': 8192, 'min': 1, 'max': 32768},
            'safety_settings': {'type': 'string', 'default': 'default', 'options': ['default', 'strict', 'permissive']}
        }
    },
    'openai-gpt4': {
        'id': 'openai-gpt4',
        'name': 'OpenAI GPT-4',
        'category': 'LLM',
        'description': 'Industry-leading language model for complex reasoning tasks',
        'endpoint': 'https://api.openai.com/v1',
        'models': ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
        'default_model': 'gpt-4-turbo-preview',
        'config_schema': {
            'api_key': {'type': 'string', 'required': True, 'sensitive': True},
            'endpoint': {'type': 'string', 'required': True},
            'model': {'type': 'string', 'required': True},
            'temperature': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 2.0},
            'max_tokens': {'type': 'integer', 'default': 4096, 'min': 1, 'max': 32768},
            'frequency_penalty': {'type': 'float', 'default': 0.0, 'min': -2.0, 'max': 2.0},
            'presence_penalty': {'type': 'float', 'default': 0.0, 'min': -2.0, 'max': 2.0}
        }
    },
    'google-vision': {
        'id': 'google-vision',
        'name': 'Google Cloud Vision',
        'category': 'Computer Vision',
        'description': 'Advanced image analysis and object detection',
        'endpoint': 'https://vision.googleapis.com/v1',
        'models': ['vision-v1'],
        'default_model': 'vision-v1',
        'config_schema': {
            'api_key': {'type': 'string', 'required': True, 'sensitive': True},
            'endpoint': {'type': 'string', 'required': True},
            'region': {'type': 'string', 'default': 'us-central1'},
            'features': {'type': 'array', 'default': ['OBJECT_LOCALIZATION', 'TEXT_DETECTION', 'FACE_DETECTION']},
            'max_results': {'type': 'integer', 'default': 10, 'min': 1, 'max': 100}
        }
    },
    'azure-speech': {
        'id': 'azure-speech',
        'name': 'Azure Speech Services',
        'category': 'Speech Processing',
        'description': 'Enterprise-grade speech-to-text and text-to-speech',
        'endpoint': 'https://eastus.api.cognitive.microsoft.com',
        'models': ['speech-v1'],
        'default_model': 'speech-v1',
        'config_schema': {
            'api_key': {'type': 'string', 'required': True, 'sensitive': True},
            'endpoint': {'type': 'string', 'required': True},
            'region': {'type': 'string', 'default': 'eastus'},
            'language': {'type': 'string', 'default': 'en-US'},
            'format': {'type': 'string', 'default': 'detailed', 'options': ['simple', 'detailed']},
            'profanity': {'type': 'string', 'default': 'masked', 'options': ['raw', 'masked', 'removed']}
        }
    }
}

def require_admin_auth(f):
    """Decorator to require admin authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authentication required. Provide a valid Bearer token.'
            }), 401

        # Note: This standalone server does not share the main app's JWT config.
        # In production, use the main app.py server which has full JWT verification.
        # For now, reject requests without explicit admin role header (no default).
        user_email = request.headers.get('X-User-Email')
        user_roles_header = request.headers.get('X-User-Roles')
        
        if not user_email or not user_roles_header:
            return jsonify({
                'success': False,
                'error': 'Missing authentication context.'
            }), 401

        user_roles = [r.strip() for r in user_roles_header.split(',')]
        
        if not any(role in ADMIN_ROLES for role in user_roles):
            return jsonify({
                'success': False,
                'error': 'Insufficient privileges. Admin access required.'
            }), 403
        
        request.admin_user = {
            'email': user_email,
            'roles': user_roles
        }
        
        return f(*args, **kwargs)
    return decorated_function

def log_admin_action(action: str, provider_id: str, details: str, status: str = 'success'):
    """Log administrative actions for audit trail."""
    log_entry = {
        'id': f"log_{int(time.time())}_{secrets.token_hex(4)}",
        'timestamp': datetime.now().isoformat(),
        'user': getattr(request, 'admin_user', {}).get('email', 'unknown'),
        'action': action,
        'provider_id': provider_id,
        'details': details,
        'status': status,
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', 'unknown')
    }
    
    admin_audit_logs.append(log_entry)
    
    # Keep only last 1000 logs in memory
    if len(admin_audit_logs) > 1000:
        admin_audit_logs.pop(0)
    
    logger.info(f"Admin action logged: {action} on {provider_id} by {log_entry['user']}")

def encrypt_sensitive_data(data: str) -> str:
    """Simple encryption for sensitive data (use proper encryption in production)."""
    # This is a mock implementation - use proper encryption in production
    return hashlib.sha256(data.encode()).hexdigest()[:16] + "..." + data[-4:]

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Mock decryption - implement proper decryption in production."""
    # This is a mock - in production, implement proper decryption
    return encrypted_data

def validate_provider_config(provider_id: str, config: Dict[str, Any]) -> tuple[bool, List[str]]:
    """Validate provider configuration against schema."""
    if provider_id not in PROVIDER_TEMPLATES:
        return False, [f"Unknown provider: {provider_id}"]
    
    schema = PROVIDER_TEMPLATES[provider_id]['config_schema']
    errors = []
    
    for field, rules in schema.items():
        value = config.get(field)
        
        # Check required fields
        if rules.get('required', False) and not value:
            errors.append(f"Field '{field}' is required")
            continue
        
        if value is None:
            continue
        
        # Type validation
        field_type = rules.get('type')
        if field_type == 'string' and not isinstance(value, str):
            errors.append(f"Field '{field}' must be a string")
        elif field_type == 'integer' and not isinstance(value, int):
            errors.append(f"Field '{field}' must be an integer")
        elif field_type == 'float' and not isinstance(value, (int, float)):
            errors.append(f"Field '{field}' must be a number")
        elif field_type == 'array' and not isinstance(value, list):
            errors.append(f"Field '{field}' must be an array")
        
        # Range validation
        if field_type in ['integer', 'float']:
            if 'min' in rules and value < rules['min']:
                errors.append(f"Field '{field}' must be >= {rules['min']}")
            if 'max' in rules and value > rules['max']:
                errors.append(f"Field '{field}' must be <= {rules['max']}")
        
        # Options validation
        if 'options' in rules and value not in rules['options']:
            errors.append(f"Field '{field}' must be one of: {', '.join(rules['options'])}")
    
    return len(errors) == 0, errors

def simulate_provider_health_check(provider_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """Simulate health check for a provider."""
    # Mock health check - implement actual provider testing in production
    import random
    
    base_health = 95
    base_response_time = 150
    base_error_rate = 0.1
    
    # Simulate some variation
    health_score = max(80, min(100, base_health + random.randint(-5, 5)))
    response_time = max(50, base_response_time + random.randint(-50, 100))
    error_rate = max(0, base_error_rate + random.uniform(-0.05, 0.1))
    
    return {
        'health_score': health_score,
        'response_time': response_time,
        'error_rate': round(error_rate, 2),
        'last_checked': datetime.now().isoformat(),
        'status': 'healthy' if health_score > 90 else 'degraded' if health_score > 70 else 'unhealthy'
    }

# Initialize default providers
def initialize_default_providers():
    """Initialize default provider configurations."""
    for provider_id, template in PROVIDER_TEMPLATES.items():
        if provider_id not in admin_providers:
            admin_providers[provider_id] = {
                'id': provider_id,
                'name': template['name'],
                'category': template['category'],
                'description': template['description'],
                'status': 'inactive',
                'is_default': provider_id == 'groq-llama4',  # Set Groq as default
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Initialize empty configuration
            admin_configurations[provider_id] = {
                'provider_id': provider_id,
                'config': {},
                'is_active': False,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Initialize health metrics
            admin_health_metrics[provider_id] = simulate_provider_health_check(provider_id, {})

# API Endpoints

@app.route('/api/admin/health', methods=['GET'])
@require_admin_auth
def admin_health_check():
    """Admin health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'admin_features': {
            'provider_management': True,
            'configuration_management': True,
            'health_monitoring': True,
            'audit_logging': True,
            'role_based_access': True
        },
        'providers_count': len(admin_providers),
        'active_providers': len([p for p in admin_providers.values() if p['status'] == 'active']),
        'version': '1.0.0'
    })

@app.route('/api/admin/providers', methods=['GET'])
@require_admin_auth
def list_providers():
    """List all available providers with their configurations."""
    try:
        providers_list = []
        
        for provider_id, provider in admin_providers.items():
            config = admin_configurations.get(provider_id, {}).get('config', {})
            health = admin_health_metrics.get(provider_id, {})
            template = PROVIDER_TEMPLATES.get(provider_id, {})
            
            # Mask sensitive data
            masked_config = {}
            for key, value in config.items():
                schema = template.get('config_schema', {}).get(key, {})
                if schema.get('sensitive', False) and value:
                    masked_config[key] = encrypt_sensitive_data(value)
                else:
                    masked_config[key] = value
            
            provider_data = {
                **provider,
                'config': masked_config,
                'health_metrics': health,
                'available_models': template.get('models', []),
                'default_model': template.get('default_model'),
                'config_schema': template.get('config_schema', {})
            }
            
            providers_list.append(provider_data)
        
        # Sort by category and name
        providers_list.sort(key=lambda x: (x['category'], x['name']))
        
        log_admin_action('List Providers', 'all', f"Retrieved {len(providers_list)} providers")
        
        return jsonify({
            'success': True,
            'providers': providers_list,
            'total_count': len(providers_list),
            'categories': list(set(p['category'] for p in providers_list)),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing providers: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to list providers: {str(e)}'
        }), 500

@app.route('/api/admin/providers/<provider_id>', methods=['GET'])
@require_admin_auth
def get_provider(provider_id: str):
    """Get detailed information about a specific provider."""
    try:
        if provider_id not in admin_providers:
            return jsonify({
                'success': False,
                'error': 'Provider not found'
            }), 404
        
        provider = admin_providers[provider_id]
        config = admin_configurations.get(provider_id, {}).get('config', {})
        health = admin_health_metrics.get(provider_id, {})
        template = PROVIDER_TEMPLATES.get(provider_id, {})
        
        # Include full configuration for detailed view
        provider_data = {
            **provider,
            'config': config,
            'health_metrics': health,
            'available_models': template.get('models', []),
            'default_model': template.get('default_model'),
            'config_schema': template.get('config_schema', {}),
            'endpoint': template.get('endpoint')
        }
        
        log_admin_action('Get Provider', provider_id, f"Retrieved provider details")
        
        return jsonify({
            'success': True,
            'provider': provider_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting provider {provider_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get provider: {str(e)}'
        }), 500

@app.route('/api/admin/providers/<provider_id>/config', methods=['PUT'])
@require_admin_auth
def update_provider_config(provider_id: str):
    """Update provider configuration."""
    try:
        if provider_id not in admin_providers:
            return jsonify({
                'success': False,
                'error': 'Provider not found'
            }), 404
        
        data = request.get_json()
        new_config = data.get('config', {})
        
        # Validate configuration
        is_valid, errors = validate_provider_config(provider_id, new_config)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'Configuration validation failed',
                'validation_errors': errors
            }), 400
        
        # Store old config for audit
        old_config = admin_configurations.get(provider_id, {}).get('config', {})
        
        # Update configuration
        admin_configurations[provider_id] = {
            'provider_id': provider_id,
            'config': new_config,
            'is_active': True,
            'created_at': admin_configurations.get(provider_id, {}).get('created_at', datetime.now().isoformat()),
            'updated_at': datetime.now().isoformat()
        }
        
        # Update provider status
        admin_providers[provider_id]['status'] = 'active' if new_config.get('api_key') else 'inactive'
        admin_providers[provider_id]['updated_at'] = datetime.now().isoformat()
        
        # Update health metrics
        admin_health_metrics[provider_id] = simulate_provider_health_check(provider_id, new_config)
        
        log_admin_action(
            'Update Configuration', 
            provider_id, 
            f"Updated configuration for {admin_providers[provider_id]['name']}"
        )
        
        return jsonify({
            'success': True,
            'message': 'Provider configuration updated successfully',
            'provider_id': provider_id,
            'status': admin_providers[provider_id]['status'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error updating provider config {provider_id}: {str(e)}")
        log_admin_action('Update Configuration', provider_id, f"Failed to update: {str(e)}", 'error')
        return jsonify({
            'success': False,
            'error': f'Failed to update configuration: {str(e)}'
        }), 500

@app.route('/api/admin/providers/<provider_id>/test', methods=['POST'])
@require_admin_auth
def test_provider(provider_id: str):
    """Test provider connection and functionality."""
    try:
        if provider_id not in admin_providers:
            return jsonify({
                'success': False,
                'error': 'Provider not found'
            }), 404
        
        config = admin_configurations.get(provider_id, {}).get('config', {})
        
        if not config.get('api_key'):
            return jsonify({
                'success': False,
                'error': 'API key not configured'
            }), 400
        
        # Simulate provider test
        start_time = time.time()
        
        # Mock test - implement actual provider testing in production
        time.sleep(1)  # Simulate network delay
        
        test_duration = time.time() - start_time
        
        # Update health metrics with test results
        health_metrics = simulate_provider_health_check(provider_id, config)
        health_metrics['last_test'] = datetime.now().isoformat()
        health_metrics['test_duration'] = round(test_duration, 3)
        
        admin_health_metrics[provider_id] = health_metrics
        
        log_admin_action(
            'Test Provider', 
            provider_id, 
            f"Connection test successful - {health_metrics['response_time']}ms response time"
        )
        
        return jsonify({
            'success': True,
            'message': 'Provider test completed successfully',
            'test_results': {
                'provider_id': provider_id,
                'provider_name': admin_providers[provider_id]['name'],
                'test_duration': test_duration,
                'health_metrics': health_metrics,
                'status': 'healthy'
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error testing provider {provider_id}: {str(e)}")
        log_admin_action('Test Provider', provider_id, f"Test failed: {str(e)}", 'error')
        return jsonify({
            'success': False,
            'error': f'Provider test failed: {str(e)}'
        }), 500

@app.route('/api/admin/providers/<provider_id>/set-default', methods=['POST'])
@require_admin_auth
def set_default_provider(provider_id: str):
    """Set a provider as the default for its category."""
    try:
        if provider_id not in admin_providers:
            return jsonify({
                'success': False,
                'error': 'Provider not found'
            }), 404
        
        provider = admin_providers[provider_id]
        category = provider['category']
        
        # Check if provider is properly configured
        config = admin_configurations.get(provider_id, {}).get('config', {})
        if not config.get('api_key'):
            return jsonify({
                'success': False,
                'error': 'Cannot set unconfigured provider as default'
            }), 400
        
        # Remove default status from other providers in the same category
        for pid, p in admin_providers.items():
            if p['category'] == category:
                p['is_default'] = False
        
        # Set this provider as default
        admin_providers[provider_id]['is_default'] = True
        admin_providers[provider_id]['status'] = 'active'
        admin_providers[provider_id]['updated_at'] = datetime.now().isoformat()
        
        log_admin_action(
            'Set Default Provider', 
            provider_id, 
            f"Set {provider['name']} as default {category} provider"
        )
        
        return jsonify({
            'success': True,
            'message': f'{provider["name"]} is now the default {category} provider',
            'provider_id': provider_id,
            'category': category,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error setting default provider {provider_id}: {str(e)}")
        log_admin_action('Set Default Provider', provider_id, f"Failed to set default: {str(e)}", 'error')
        return jsonify({
            'success': False,
            'error': f'Failed to set default provider: {str(e)}'
        }), 500

@app.route('/api/admin/health-metrics', methods=['GET'])
@require_admin_auth
def get_health_metrics():
    """Get health metrics for all providers."""
    try:
        metrics_summary = {
            'timestamp': datetime.now().isoformat(),
            'providers': admin_health_metrics,
            'summary': {
                'total_providers': len(admin_health_metrics),
                'healthy_providers': len([m for m in admin_health_metrics.values() if m.get('health_score', 0) > 90]),
                'average_health_score': sum(m.get('health_score', 0) for m in admin_health_metrics.values()) / len(admin_health_metrics) if admin_health_metrics else 0,
                'average_response_time': sum(m.get('response_time', 0) for m in admin_health_metrics.values()) / len(admin_health_metrics) if admin_health_metrics else 0,
                'total_error_rate': sum(m.get('error_rate', 0) for m in admin_health_metrics.values()) / len(admin_health_metrics) if admin_health_metrics else 0
            }
        }
        
        log_admin_action('Get Health Metrics', 'all', "Retrieved health metrics for all providers")
        
        return jsonify({
            'success': True,
            'metrics': metrics_summary
        })
        
    except Exception as e:
        logger.error(f"Error getting health metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get health metrics: {str(e)}'
        }), 500

@app.route('/api/admin/audit-logs', methods=['GET'])
@require_admin_auth
def get_audit_logs():
    """Get audit logs with optional filtering."""
    try:
        # Get query parameters
        limit = min(int(request.args.get('limit', 50)), 500)  # Max 500 logs
        offset = int(request.args.get('offset', 0))
        action_filter = request.args.get('action')
        provider_filter = request.args.get('provider')
        user_filter = request.args.get('user')
        
        # Filter logs
        filtered_logs = admin_audit_logs
        
        if action_filter:
            filtered_logs = [log for log in filtered_logs if action_filter.lower() in log['action'].lower()]
        
        if provider_filter:
            filtered_logs = [log for log in filtered_logs if provider_filter.lower() in log['provider_id'].lower()]
        
        if user_filter:
            filtered_logs = [log for log in filtered_logs if user_filter.lower() in log['user'].lower()]
        
        # Sort by timestamp (newest first)
        filtered_logs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Apply pagination
        total_count = len(filtered_logs)
        paginated_logs = filtered_logs[offset:offset + limit]
        
        return jsonify({
            'success': True,
            'logs': paginated_logs,
            'pagination': {
                'total_count': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_count
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting audit logs: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get audit logs: {str(e)}'
        }), 500

@app.route('/api/admin/statistics', methods=['GET'])
@require_admin_auth
def get_admin_statistics():
    """Get comprehensive admin statistics."""
    try:
        # Calculate statistics
        total_providers = len(admin_providers)
        active_providers = len([p for p in admin_providers.values() if p['status'] == 'active'])
        configured_providers = len([p for p in admin_configurations.values() if p.get('config', {}).get('api_key')])
        
        # Category breakdown
        categories = {}
        for provider in admin_providers.values():
            category = provider['category']
            if category not in categories:
                categories[category] = {'total': 0, 'active': 0, 'default': None}
            categories[category]['total'] += 1
            if provider['status'] == 'active':
                categories[category]['active'] += 1
            if provider.get('is_default'):
                categories[category]['default'] = provider['name']
        
        # Recent activity
        recent_logs = sorted(admin_audit_logs, key=lambda x: x['timestamp'], reverse=True)[:10]
        
        # Health summary
        health_scores = [m.get('health_score', 0) for m in admin_health_metrics.values()]
        avg_health = sum(health_scores) / len(health_scores) if health_scores else 0
        
        statistics = {
            'overview': {
                'total_providers': total_providers,
                'active_providers': active_providers,
                'configured_providers': configured_providers,
                'configuration_rate': (configured_providers / total_providers * 100) if total_providers > 0 else 0,
                'average_health_score': round(avg_health, 1)
            },
            'categories': categories,
            'recent_activity': recent_logs,
            'health_summary': {
                'healthy_providers': len([s for s in health_scores if s > 90]),
                'degraded_providers': len([s for s in health_scores if 70 <= s <= 90]),
                'unhealthy_providers': len([s for s in health_scores if s < 70])
            },
            'timestamp': datetime.now().isoformat()
        }
        
        log_admin_action('Get Statistics', 'all', "Retrieved admin statistics")
        
        return jsonify({
            'success': True,
            'statistics': statistics
        })
        
    except Exception as e:
        logger.error(f"Error getting admin statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get statistics: {str(e)}'
        }), 500

# Initialize the system
initialize_default_providers()

if __name__ == '__main__':
    logger.info("🚀 Starting Admin API Keys Management Backend")
    logger.info("🔐 Features: Provider Management + Configuration + Health Monitoring + Audit Logging")
    logger.info("🌐 Server: http://0.0.0.0:5001")
    
    logger.info("\n📋 Available Admin Endpoints:")
    logger.info("  GET  /api/admin/health - Admin health check")
    logger.info("  GET  /api/admin/providers - List all providers")
    logger.info("  GET  /api/admin/providers/<id> - Get provider details")
    logger.info("  PUT  /api/admin/providers/<id>/config - Update provider config")
    logger.info("  POST /api/admin/providers/<id>/test - Test provider connection")
    logger.info("  POST /api/admin/providers/<id>/set-default - Set as default provider")
    logger.info("  GET  /api/admin/health-metrics - Get health metrics")
    logger.info("  GET  /api/admin/audit-logs - Get audit logs")
    logger.info("  GET  /api/admin/statistics - Get admin statistics")
    
    logger.info(f"\n🔑 Supported Providers: {', '.join(PROVIDER_TEMPLATES.keys())}")
    logger.info(f"👥 Admin Roles: {', '.join(ADMIN_ROLES)}")
    
    app.run(host='0.0.0.0', port=5001, debug=os.getenv('FLASK_ENV', 'production') != 'production')

