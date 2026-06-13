#!/usr/bin/env python3
"""
Advanced Analytics API Routes for Emirati Journey Platform
Provides REST endpoints for AI-powered analytics and insights
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

# Import analytics engine
from backend.advanced_analytics_engine import create_analytics_engine, AnalyticsType

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint
advanced_analytics_bp = Blueprint('advanced_analytics', __name__, url_prefix='/api/advanced-analytics')

def get_analytics_engine():
    """Get analytics engine from app context or create new one"""
    if not hasattr(current_app, 'analytics_engine'):
        current_app.analytics_engine = create_analytics_engine()
    return current_app.analytics_engine

@advanced_analytics_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for advanced analytics service"""
    try:
        analytics_engine = get_analytics_engine()
        
        # Test database connection
        test_data = analytics_engine.get_user_engagement_analysis(time_period=1)
        
        return jsonify({
            'status': 'healthy',
            'service': 'advanced_analytics',
            'database_status': 'connected' if 'error' not in test_data else 'error',
            'features': [
                'employment_trends',
                'emiratization_progress', 
                'user_engagement',
                'predictive_insights'
            ],
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Advanced analytics health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    """Get comprehensive dashboard data with all analytics"""
    try:
        # Check user permissions
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        # Allow access for admin, hr_recruiter, and educator personas
        if user_type not in ['admin', 'recruiter', 'training_provider']:
            return jsonify({'error': 'Insufficient privileges for analytics access'}), 403
        
        analytics_engine = get_analytics_engine()
        dashboard_data = analytics_engine.get_comprehensive_dashboard_data()
        
        if 'error' in dashboard_data:
            return jsonify({'error': dashboard_data['error']}), 500
        
        return jsonify({
            'success': True,
            'data': dashboard_data,
            'generated_at': datetime.now().isoformat(),
            'user_type': user_type
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard data retrieval failed: {e}")
        return jsonify({'error': 'Failed to retrieve dashboard data'}), 500

@advanced_analytics_bp.route('/employment-trends', methods=['GET'])
@jwt_required()
def get_employment_trends():
    """Get employment trends analysis"""
    try:
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type not in ['admin', 'recruiter', 'training_provider']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        # Get query parameters
        time_period = request.args.get('time_period', 90, type=int)
        
        # Validate time period
        if time_period < 1 or time_period > 365:
            return jsonify({'error': 'Time period must be between 1 and 365 days'}), 400
        
        analytics_engine = get_analytics_engine()
        trends_data = analytics_engine.get_employment_trends_analysis(time_period)
        
        if 'error' in trends_data:
            return jsonify({'error': trends_data['error']}), 500
        
        return jsonify({
            'success': True,
            'data': trends_data,
            'parameters': {'time_period': time_period},
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Employment trends analysis failed: {e}")
        return jsonify({'error': 'Failed to retrieve employment trends'}), 500

@advanced_analytics_bp.route('/emiratization-progress', methods=['GET'])
@jwt_required()
def get_emiratization_progress():
    """Get Emiratization progress analysis"""
    try:
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type not in ['admin', 'recruiter', 'training_provider']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        analytics_engine = get_analytics_engine()
        emiratization_data = analytics_engine.get_emiratization_progress_analysis()
        
        if 'error' in emiratization_data:
            return jsonify({'error': emiratization_data['error']}), 500
        
        return jsonify({
            'success': True,
            'data': emiratization_data,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Emiratization progress analysis failed: {e}")
        return jsonify({'error': 'Failed to retrieve Emiratization progress'}), 500

@advanced_analytics_bp.route('/user-engagement', methods=['GET'])
@jwt_required()
def get_user_engagement():
    """Get user engagement analysis"""
    try:
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type not in ['admin', 'recruiter', 'training_provider']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        # Get query parameters
        time_period = request.args.get('time_period', 30, type=int)
        
        # Validate time period
        if time_period < 1 or time_period > 180:
            return jsonify({'error': 'Time period must be between 1 and 180 days'}), 400
        
        analytics_engine = get_analytics_engine()
        engagement_data = analytics_engine.get_user_engagement_analysis(time_period)
        
        if 'error' in engagement_data:
            return jsonify({'error': engagement_data['error']}), 500
        
        return jsonify({
            'success': True,
            'data': engagement_data,
            'parameters': {'time_period': time_period},
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"User engagement analysis failed: {e}")
        return jsonify({'error': 'Failed to retrieve user engagement data'}), 500

@advanced_analytics_bp.route('/predictive-insights', methods=['GET'])
@jwt_required()
def get_predictive_insights():
    """Get AI-powered predictive insights"""
    try:
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type not in ['admin', 'recruiter', 'training_provider']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        analytics_engine = get_analytics_engine()
        insights_data = analytics_engine.get_predictive_insights()
        
        if 'error' in insights_data:
            return jsonify({'error': insights_data['error']}), 500
        
        return jsonify({
            'success': True,
            'data': insights_data,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Predictive insights generation failed: {e}")
        return jsonify({'error': 'Failed to generate predictive insights'}), 500

@advanced_analytics_bp.route('/insights/summary', methods=['GET'])
@jwt_required()
def get_insights_summary():
    """Get summary of key insights across all analytics"""
    try:
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type not in ['admin', 'recruiter', 'training_provider']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        analytics_engine = get_analytics_engine()
        
        # Get insights from all analytics modules
        employment_trends = analytics_engine.get_employment_trends_analysis(30)
        emiratization_progress = analytics_engine.get_emiratization_progress_analysis()
        user_engagement = analytics_engine.get_user_engagement_analysis(30)
        
        # Collect all insights
        all_insights = []
        for analysis in [employment_trends, emiratization_progress, user_engagement]:
            if 'insights' in analysis and analysis['insights']:
                all_insights.extend(analysis['insights'])
        
        # Sort by priority and confidence
        priority_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        all_insights.sort(
            key=lambda x: (priority_order.get(x['priority'], 0), x['confidence_score']), 
            reverse=True
        )
        
        # Get top insights by category
        critical_insights = [i for i in all_insights if i['priority'] == 'critical']
        high_priority_insights = [i for i in all_insights if i['priority'] == 'high']
        
        return jsonify({
            'success': True,
            'data': {
                'top_insights': all_insights[:10],
                'critical_insights': critical_insights,
                'high_priority_insights': high_priority_insights[:5],
                'total_insights': len(all_insights),
                'insights_by_priority': {
                    'critical': len(critical_insights),
                    'high': len([i for i in all_insights if i['priority'] == 'high']),
                    'medium': len([i for i in all_insights if i['priority'] == 'medium']),
                    'low': len([i for i in all_insights if i['priority'] == 'low'])
                }
            },
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Insights summary generation failed: {e}")
        return jsonify({'error': 'Failed to generate insights summary'}), 500

@advanced_analytics_bp.route('/benchmarks/uae-vision-2071', methods=['GET'])
@jwt_required()
def get_uae_vision_benchmarks():
    """Get UAE Vision 2071 benchmarks and progress"""
    try:
        claims = get_jwt()
        user_type = claims.get('user_type', '')
        
        if user_type not in ['admin', 'recruiter', 'training_provider']:
            return jsonify({'error': 'Insufficient privileges'}), 403
        
        analytics_engine = get_analytics_engine()
        emiratization_data = analytics_engine.get_emiratization_progress_analysis()
        
        # UAE Vision 2071 specific benchmarks
        vision_2071_targets = {
            'emiratization_overall_target': 75,  # 75% Emiratization by 2071
            'private_sector_target': 50,         # 50% in private sector
            'government_sector_target': 100,     # 100% in government
            'key_sectors': {
                'Banking': 70,
                'Oil & Gas': 75,
                'Telecommunications': 65,
                'Healthcare': 60,
                'Technology': 40
            }
        }
        
        # Calculate progress towards Vision 2071
        progress_data = emiratization_data.get('progress_towards_targets', [])
        
        vision_progress = {
            'overall_progress': 0,
            'sectors_on_track': 0,
            'sectors_needing_attention': 0,
            'projected_completion_year': 2071
        }
        
        if progress_data:
            avg_progress = sum(p['progress_percentage'] for p in progress_data) / len(progress_data)
            vision_progress['overall_progress'] = avg_progress
            vision_progress['sectors_on_track'] = len([p for p in progress_data if p['progress_percentage'] >= 80])
            vision_progress['sectors_needing_attention'] = len([p for p in progress_data if p['progress_percentage'] < 50])
        
        return jsonify({
            'success': True,
            'data': {
                'vision_2071_targets': vision_2071_targets,
                'current_progress': vision_progress,
                'sector_progress': progress_data,
                'emiratization_data': emiratization_data
            },
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"UAE Vision 2071 benchmarks retrieval failed: {e}")
        return jsonify({'error': 'Failed to retrieve UAE Vision 2071 benchmarks'}), 500

# Error handlers
@advanced_analytics_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request', 'message': 'Invalid request parameters'}), 400

@advanced_analytics_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401

@advanced_analytics_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden', 'message': 'Insufficient privileges'}), 403

@advanced_analytics_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found', 'message': 'Analytics endpoint not found'}), 404

@advanced_analytics_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Advanced analytics API internal error: {error}")
    return jsonify({'error': 'Internal server error', 'message': 'Advanced analytics service temporarily unavailable'}), 500
