"""
Statistics Routes for Recruiter Dashboard
Provides API endpoints for dashboard statistics and metrics
"""

from flask import Blueprint, jsonify, request
from .statistics_engine import (
    get_dashboard_statistics,
    get_placement_statistics,
    get_pipeline_statistics,
    get_performance_metrics
)

# Create blueprint without url_prefix (will be added in app.py)
try:
    from backend.auth.access_control import require_roles, require_auth, RECRUITER_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, require_auth, RECRUITER_ROLES

statistics_bp = Blueprint('statistics', __name__)

@statistics_bp.route('/dashboard', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_dashboard_stats():
    """
    Get comprehensive dashboard statistics
    
    Query Parameters:
        recruiter_id (optional): Filter statistics by recruiter
        
    Returns:
        JSON with all dashboard metrics
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        
        stats = get_dashboard_statistics(recruiter_id)
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        print(f"Error in get_dashboard_stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/placements', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_placements():
    """
    Get placement statistics
    
    Returns:
        JSON with placement counts by time period
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        
        stats = get_placement_statistics(recruiter_id)
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        print(f"Error in get_placements: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/pipeline', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_pipeline():
    """
    Get pipeline statistics
    
    Returns:
        JSON with pipeline metrics
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        
        stats = get_pipeline_statistics(recruiter_id)
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        print(f"Error in get_pipeline: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/performance', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_performance():
    """
    Get performance metrics
    
    Returns:
        JSON with performance statistics
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        
        stats = get_performance_metrics(recruiter_id)
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        print(f"Error in get_performance: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

