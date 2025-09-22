"""
Mentor Analytics Dashboard Routes
API endpoints for advanced analytics, insights, and performance measurement
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional
import json

# Import analytics dashboard
from mentor_analytics_dashboard import (
    analytics_dashboard,
    AnalyticsTimeframe,
    PerformanceMetric,
    TrendDirection
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
analytics_bp = Blueprint('mentor_analytics', __name__, url_prefix='/api/mentor-analytics')

@analytics_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with system status"""
    try:
        summary = analytics_dashboard.get_dashboard_summary()
        
        return jsonify({
            'status': 'healthy',
            'service': 'Mentor Analytics Dashboard',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'features': [
                'Advanced Performance Analytics',
                'AI-Powered Insights Generation',
                'Predictive Success Modeling',
                'Cultural Intelligence Tracking',
                'Real-time Dashboard Metrics',
                'UAE-Specific Analytics'
            ],
            'dashboard_summary': summary,
            'analytics_capabilities': {
                'mentor_performance_profiling': True,
                'predictive_analytics': True,
                'system_wide_analytics': True,
                'cultural_intelligence_metrics': True,
                'ai_insights_generation': True,
                'real_time_monitoring': True
            }
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/mentor/<mentor_id>/performance-profile', methods=['GET'])
def get_mentor_performance_profile(mentor_id: str):
    """Get comprehensive mentor performance profile"""
    try:
        # Get existing profile or generate new one
        profile = analytics_dashboard.get_mentor_performance_profile(mentor_id)
        
        if not profile:
            # Sample programs data for demonstration
            sample_programs = [
                {
                    'program_id': 'prog_001',
                    'status': 'completed',
                    'overall_progress': 85.0,
                    'start_date': '2024-01-15T00:00:00',
                    'end_date': '2024-06-15T00:00:00',
                    'sessions': [
                        {
                            'session_id': 'sess_001',
                            'status': 'completed',
                            'attendance_mentor': True,
                            'attendance_mentee': True,
                            'rating_mentor': 4.8,
                            'mentor_feedback': 'Excellent progress on technical skills'
                        },
                        {
                            'session_id': 'sess_002',
                            'status': 'completed',
                            'attendance_mentor': True,
                            'attendance_mentee': True,
                            'rating_mentor': 4.6,
                            'mentor_feedback': 'Good engagement, needs work on presentation skills'
                        }
                    ]
                },
                {
                    'program_id': 'prog_002',
                    'status': 'active',
                    'overall_progress': 65.0,
                    'start_date': '2024-03-01T00:00:00',
                    'end_date': '2024-09-01T00:00:00',
                    'sessions': [
                        {
                            'session_id': 'sess_003',
                            'status': 'completed',
                            'attendance_mentor': True,
                            'attendance_mentee': True,
                            'rating_mentor': 4.7,
                            'mentor_feedback': 'Strong analytical thinking, great potential'
                        }
                    ]
                }
            ]
            
            profile = analytics_dashboard.generate_mentor_performance_profile(mentor_id, sample_programs)
        
        return jsonify({
            'success': True,
            'mentor_id': mentor_id,
            'performance_profile': profile.to_dict(),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting mentor performance profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/mentor/<mentor_id>/performance-profile', methods=['POST'])
def generate_mentor_performance_profile(mentor_id: str):
    """Generate new mentor performance profile with provided data"""
    try:
        data = request.get_json()
        programs_data = data.get('programs_data', [])
        
        if not programs_data:
            return jsonify({
                'success': False,
                'error': 'Programs data is required',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        
        profile = analytics_dashboard.generate_mentor_performance_profile(mentor_id, programs_data)
        
        return jsonify({
            'success': True,
            'mentor_id': mentor_id,
            'performance_profile': profile.to_dict(),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error generating mentor performance profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/system/analytics', methods=['GET'])
def get_system_analytics():
    """Get comprehensive system analytics"""
    try:
        # Get existing analytics or generate new ones
        analytics = analytics_dashboard.system_analytics
        
        if not analytics:
            # Sample data for demonstration
            sample_programs = [
                {
                    'program_id': 'prog_001',
                    'status': 'completed',
                    'overall_progress': 85.0,
                    'mentee_id': 'mentee_001',
                    'mentee_nationality': 'UAE',
                    'start_date': '2024-01-15T00:00:00',
                    'end_date': '2024-06-15T00:00:00',
                    'sessions': [{'status': 'completed', 'rating_mentor': 4.8}]
                },
                {
                    'program_id': 'prog_002',
                    'status': 'active',
                    'overall_progress': 65.0,
                    'mentee_id': 'mentee_002',
                    'mentee_nationality': 'Egypt',
                    'start_date': '2024-03-01T00:00:00',
                    'end_date': '2024-09-01T00:00:00',
                    'sessions': [{'status': 'completed', 'rating_mentor': 4.6}]
                }
            ]
            
            sample_mentors = [
                {
                    'mentor_id': 'mentor_001',
                    'nationality': 'UAE',
                    'expertise_areas': ['technology', 'ai_ml', 'leadership']
                },
                {
                    'mentor_id': 'mentor_002',
                    'nationality': 'UAE',
                    'expertise_areas': ['finance', 'banking', 'consulting']
                }
            ]
            
            analytics = analytics_dashboard.generate_system_analytics(sample_programs, sample_mentors)
        
        return jsonify({
            'success': True,
            'system_analytics': analytics.to_dict(),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting system analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/system/analytics', methods=['POST'])
def generate_system_analytics():
    """Generate new system analytics with provided data"""
    try:
        data = request.get_json()
        programs_data = data.get('programs_data', [])
        mentors_data = data.get('mentors_data', [])
        
        if not programs_data or not mentors_data:
            return jsonify({
                'success': False,
                'error': 'Both programs_data and mentors_data are required',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        
        analytics = analytics_dashboard.generate_system_analytics(programs_data, mentors_data)
        
        return jsonify({
            'success': True,
            'system_analytics': analytics.to_dict(),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error generating system analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/program/<program_id>/predictive-analytics', methods=['GET'])
def get_predictive_analytics(program_id: str):
    """Get predictive analytics for a specific program"""
    try:
        # Get existing prediction or generate new one
        prediction = analytics_dashboard.get_prediction_by_program(program_id)
        
        if not prediction:
            # Sample program data for demonstration
            sample_program = {
                'program_id': program_id,
                'mentor_experience_years': 8,
                'goals': [
                    {'goal_id': 'goal_001', 'title': 'Technical Skills Development'},
                    {'goal_id': 'goal_002', 'title': 'Leadership Capabilities'}
                ],
                'meeting_frequency': 'bi-weekly',
                'cultural_intelligence_score': 87,
                'overall_progress': 45.0,
                'start_date': '2024-01-15T00:00:00',
                'end_date': '2024-07-15T00:00:00'
            }
            
            prediction = analytics_dashboard.generate_predictive_analytics(program_id, sample_program)
        
        return jsonify({
            'success': True,
            'program_id': program_id,
            'predictive_analytics': prediction.to_dict(),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting predictive analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/program/<program_id>/predictive-analytics', methods=['POST'])
def generate_predictive_analytics(program_id: str):
    """Generate predictive analytics for a program with provided data"""
    try:
        data = request.get_json()
        program_data = data.get('program_data', {})
        
        if not program_data:
            return jsonify({
                'success': False,
                'error': 'Program data is required',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        
        program_data['program_id'] = program_id  # Ensure program_id is set
        prediction = analytics_dashboard.generate_predictive_analytics(program_id, program_data)
        
        return jsonify({
            'success': True,
            'program_id': program_id,
            'predictive_analytics': prediction.to_dict(),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error generating predictive analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/insights', methods=['GET'])
def get_performance_insights():
    """Get all performance insights"""
    try:
        timeframe_param = request.args.get('timeframe', 'monthly')
        
        # Validate timeframe
        try:
            timeframe = AnalyticsTimeframe(timeframe_param)
        except ValueError:
            timeframe = AnalyticsTimeframe.MONTHLY
        
        # Get existing insights or generate new ones
        insights = analytics_dashboard.get_all_insights()
        
        if not insights:
            insights = analytics_dashboard.generate_performance_insights(timeframe)
        
        return jsonify({
            'success': True,
            'timeframe': timeframe.value,
            'total_insights': len(insights),
            'insights': [insight.to_dict() for insight in insights],
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting performance insights: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/insights/generate', methods=['POST'])
def generate_performance_insights():
    """Generate new performance insights"""
    try:
        data = request.get_json()
        timeframe_param = data.get('timeframe', 'monthly')
        
        # Validate timeframe
        try:
            timeframe = AnalyticsTimeframe(timeframe_param)
        except ValueError:
            timeframe = AnalyticsTimeframe.MONTHLY
        
        insights = analytics_dashboard.generate_performance_insights(timeframe)
        
        return jsonify({
            'success': True,
            'timeframe': timeframe.value,
            'insights_generated': len(insights),
            'insights': [insight.to_dict() for insight in insights],
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error generating performance insights: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/dashboard/overview', methods=['GET'])
def get_dashboard_overview():
    """Get comprehensive dashboard overview"""
    try:
        summary = analytics_dashboard.get_dashboard_summary()
        
        # Get sample data for overview
        sample_metrics = {
            'total_mentors': 45,
            'active_programs': 23,
            'success_rate': 87.3,
            'average_satisfaction': 4.6,
            'cultural_intelligence_avg': 88.2,
            'emiratization_rate': 34.7
        }
        
        # Recent insights
        recent_insights = analytics_dashboard.get_all_insights()[-3:] if analytics_dashboard.get_all_insights() else []
        
        # Performance trends (sample data)
        performance_trends = {
            'success_rate_trend': [82.1, 84.5, 86.2, 87.3],
            'satisfaction_trend': [4.3, 4.4, 4.5, 4.6],
            'program_growth': [15, 18, 21, 23]
        }
        
        return jsonify({
            'success': True,
            'dashboard_overview': {
                'summary': summary,
                'key_metrics': sample_metrics,
                'recent_insights': [insight.to_dict() for insight in recent_insights],
                'performance_trends': performance_trends,
                'system_health': 'excellent',
                'last_updated': datetime.utcnow().isoformat()
            },
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting dashboard overview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/metrics/performance', methods=['GET'])
def get_performance_metrics():
    """Get detailed performance metrics"""
    try:
        metric_type = request.args.get('type', 'all')
        timeframe = request.args.get('timeframe', 'monthly')
        
        # Sample performance metrics
        metrics = {
            'success_rate': {
                'current': 87.3,
                'previous': 84.5,
                'trend': 'increasing',
                'target': 90.0
            },
            'engagement_score': {
                'current': 4.6,
                'previous': 4.4,
                'trend': 'increasing',
                'target': 4.8
            },
            'satisfaction_rating': {
                'current': 4.6,
                'previous': 4.5,
                'trend': 'stable',
                'target': 4.7
            },
            'goal_completion': {
                'current': 78.3,
                'previous': 75.1,
                'trend': 'increasing',
                'target': 85.0
            },
            'session_attendance': {
                'current': 94.2,
                'previous': 92.8,
                'trend': 'increasing',
                'target': 95.0
            },
            'cultural_intelligence': {
                'current': 88.2,
                'previous': 86.7,
                'trend': 'increasing',
                'target': 90.0
            }
        }
        
        # Filter by metric type if specified
        if metric_type != 'all' and metric_type in metrics:
            metrics = {metric_type: metrics[metric_type]}
        
        return jsonify({
            'success': True,
            'metric_type': metric_type,
            'timeframe': timeframe,
            'metrics': metrics,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting performance metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@analytics_bp.route('/export/analytics', methods=['POST'])
def export_analytics():
    """Export analytics data in various formats"""
    try:
        data = request.get_json()
        export_format = data.get('format', 'json')  # json, csv, pdf
        include_sections = data.get('sections', ['all'])
        
        # Prepare export data
        export_data = {
            'export_metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'format': export_format,
                'sections': include_sections
            },
            'system_analytics': analytics_dashboard.system_analytics.to_dict() if analytics_dashboard.system_analytics else None,
            'performance_profiles': [profile.to_dict() for profile in analytics_dashboard.performance_profiles.values()],
            'insights': [insight.to_dict() for insight in analytics_dashboard.get_all_insights()],
            'predictions': [prediction.to_dict() for prediction in analytics_dashboard.predictions.values()]
        }
        
        # Filter sections if specified
        if 'all' not in include_sections:
            filtered_data = {'export_metadata': export_data['export_metadata']}
            for section in include_sections:
                if section in export_data:
                    filtered_data[section] = export_data[section]
            export_data = filtered_data
        
        return jsonify({
            'success': True,
            'export_format': export_format,
            'data_size': len(str(export_data)),
            'export_data': export_data,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error exporting analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Error handlers
@analytics_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'timestamp': datetime.utcnow().isoformat()
    }), 404

@analytics_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'timestamp': datetime.utcnow().isoformat()
    }), 500

logger.info("✅ Mentor Analytics routes loaded successfully")
