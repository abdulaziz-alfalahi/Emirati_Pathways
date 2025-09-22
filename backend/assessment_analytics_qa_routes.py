"""
Assessment Analytics and Quality Assurance Routes for Emirati Journey Platform
API endpoints for comprehensive analytics dashboard and quality assurance features
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
from typing import Dict, Any, Optional
import json

from assessment_analytics_qa_system import (
    assessment_analytics_qa_system,
    AnalyticsTimeframe,
    AlertSeverity,
    QualityMetric
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
assessment_analytics_qa_bp = Blueprint('assessment_analytics_qa', __name__, url_prefix='/api/assessment-analytics-qa')

@assessment_analytics_qa_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Assessment Analytics & QA System',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@assessment_analytics_qa_bp.route('/analytics/comprehensive', methods=['POST'])
def generate_comprehensive_analytics():
    """Generate comprehensive analytics report"""
    try:
        data = request.get_json() or {}
        
        # Parse timeframe
        timeframe_str = data.get('timeframe', 'monthly')
        try:
            timeframe = AnalyticsTimeframe(timeframe_str)
        except ValueError:
            timeframe = AnalyticsTimeframe.MONTHLY
        
        # Parse dates
        start_date = None
        end_date = None
        
        if data.get('start_date'):
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if data.get('end_date'):
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
        # Get assessment data
        assessment_data = data.get('assessment_data')
        
        # Generate analytics report
        report = assessment_analytics_qa_system.generate_comprehensive_analytics(
            timeframe=timeframe,
            start_date=start_date,
            end_date=end_date,
            assessment_data=assessment_data
        )
        
        # Convert to JSON-serializable format
        report_dict = {
            'report_id': report.report_id,
            'report_type': report.report_type,
            'timeframe': report.timeframe.value,
            'start_date': report.start_date.isoformat(),
            'end_date': report.end_date.isoformat(),
            'metrics': report.metrics,
            'insights': report.insights,
            'recommendations': report.recommendations,
            'quality_scores': report.quality_scores,
            'trends': report.trends,
            'generated_at': report.generated_at.isoformat(),
            'generated_by': report.generated_by
        }
        
        return jsonify({
            'success': True,
            'report': report_dict,
            'message': 'Comprehensive analytics report generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error generating comprehensive analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate comprehensive analytics report'
        }), 500

@assessment_analytics_qa_bp.route('/quality/monitor', methods=['POST'])
def monitor_quality_assurance():
    """Monitor assessment quality and generate alerts"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No assessment data provided',
                'message': 'Assessment data is required for quality monitoring'
            }), 400
        
        # Monitor quality and generate alerts
        alerts = assessment_analytics_qa_system.monitor_quality_assurance(data)
        
        # Convert alerts to JSON-serializable format
        alerts_dict = []
        for alert in alerts:
            alerts_dict.append({
                'alert_id': alert.alert_id,
                'alert_type': alert.alert_type,
                'severity': alert.severity.value,
                'title': alert.title,
                'description': alert.description,
                'affected_assessments': alert.affected_assessments,
                'metrics': alert.metrics,
                'recommendations': alert.recommendations,
                'created_at': alert.created_at.isoformat(),
                'resolved': alert.resolved
            })
        
        return jsonify({
            'success': True,
            'alerts': alerts_dict,
            'alert_count': len(alerts),
            'message': f'Quality monitoring completed: {len(alerts)} alerts generated'
        })
        
    except Exception as e:
        logger.error(f"Error monitoring quality assurance: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to monitor quality assurance'
        }), 500

@assessment_analytics_qa_bp.route('/performance/record', methods=['POST'])
def record_performance_metrics():
    """Record assessment performance metrics"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No metrics data provided',
                'message': 'Performance metrics data is required'
            }), 400
        
        # Validate required fields
        required_fields = ['assessment_id', 'candidate_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}',
                    'message': f'Field {field} is required for performance metrics'
                }), 400
        
        # Record performance metrics
        metrics = assessment_analytics_qa_system.record_performance_metrics(data)
        
        # Convert to JSON-serializable format
        metrics_dict = {
            'metric_id': metrics.metric_id,
            'assessment_id': metrics.assessment_id,
            'candidate_id': metrics.candidate_id,
            'completion_time_minutes': metrics.completion_time_minutes,
            'accuracy_score': metrics.accuracy_score,
            'engagement_score': metrics.engagement_score,
            'difficulty_perception': metrics.difficulty_perception,
            'cultural_relevance_score': metrics.cultural_relevance_score,
            'technical_issues': metrics.technical_issues,
            'feedback_rating': metrics.feedback_rating,
            'recorded_at': metrics.recorded_at.isoformat()
        }
        
        return jsonify({
            'success': True,
            'metrics': metrics_dict,
            'message': 'Performance metrics recorded successfully'
        })
        
    except Exception as e:
        logger.error(f"Error recording performance metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to record performance metrics'
        }), 500

@assessment_analytics_qa_bp.route('/dashboard/quality', methods=['GET'])
def get_quality_dashboard():
    """Get comprehensive quality assurance dashboard"""
    try:
        dashboard = assessment_analytics_qa_system.generate_quality_dashboard()
        
        return jsonify({
            'success': True,
            'dashboard': dashboard,
            'message': 'Quality dashboard generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error generating quality dashboard: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate quality dashboard'
        }), 500

@assessment_analytics_qa_bp.route('/analytics/candidate/<candidate_id>', methods=['GET'])
def get_candidate_analytics(candidate_id: str):
    """Get analytics for a specific candidate"""
    try:
        analytics = assessment_analytics_qa_system.generate_candidate_analytics(candidate_id)
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'message': 'Candidate analytics generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error generating candidate analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate candidate analytics'
        }), 500

@assessment_analytics_qa_bp.route('/analytics/assessment/<assessment_id>', methods=['GET'])
def get_assessment_analytics(assessment_id: str):
    """Get analytics for a specific assessment"""
    try:
        analytics = assessment_analytics_qa_system.generate_assessment_analytics(assessment_id)
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'message': 'Assessment analytics generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error generating assessment analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate assessment analytics'
        }), 500

@assessment_analytics_qa_bp.route('/alerts/resolve/<alert_id>', methods=['POST'])
def resolve_quality_alert(alert_id: str):
    """Resolve a quality assurance alert"""
    try:
        data = request.get_json() or {}
        resolved_by = data.get('resolved_by', 'system')
        resolution_notes = data.get('resolution_notes', '')
        
        success = assessment_analytics_qa_system.resolve_quality_alert(
            alert_id=alert_id,
            resolved_by=resolved_by,
            resolution_notes=resolution_notes
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Quality alert resolved successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Alert not found',
                'message': f'Alert with ID {alert_id} not found'
            }), 404
        
    except Exception as e:
        logger.error(f"Error resolving quality alert: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to resolve quality alert'
        }), 500

@assessment_analytics_qa_bp.route('/system/health-metrics', methods=['GET'])
def get_system_health_metrics():
    """Get comprehensive system health metrics"""
    try:
        health_metrics = assessment_analytics_qa_system.get_system_health_metrics()
        
        return jsonify({
            'success': True,
            'health_metrics': health_metrics,
            'message': 'System health metrics retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting system health metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve system health metrics'
        }), 500

@assessment_analytics_qa_bp.route('/analytics/timeframes', methods=['GET'])
def get_analytics_timeframes():
    """Get available analytics timeframes"""
    try:
        timeframes = [
            {
                'value': timeframe.value,
                'label': timeframe.value.replace('_', ' ').title(),
                'description': f'{timeframe.value.replace("_", " ").title()} analytics report'
            }
            for timeframe in AnalyticsTimeframe
        ]
        
        return jsonify({
            'success': True,
            'timeframes': timeframes,
            'message': 'Analytics timeframes retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting analytics timeframes: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve analytics timeframes'
        }), 500

@assessment_analytics_qa_bp.route('/quality/metrics', methods=['GET'])
def get_quality_metrics():
    """Get available quality metrics"""
    try:
        metrics = [
            {
                'value': metric.value,
                'label': metric.value.replace('_', ' ').title(),
                'description': f'{metric.value.replace("_", " ").title()} quality metric'
            }
            for metric in QualityMetric
        ]
        
        return jsonify({
            'success': True,
            'quality_metrics': metrics,
            'message': 'Quality metrics retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting quality metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve quality metrics'
        }), 500

@assessment_analytics_qa_bp.route('/alerts/severities', methods=['GET'])
def get_alert_severities():
    """Get available alert severities"""
    try:
        severities = [
            {
                'value': severity.value,
                'label': severity.value.title(),
                'description': f'{severity.value.title()} severity alert'
            }
            for severity in AlertSeverity
        ]
        
        return jsonify({
            'success': True,
            'alert_severities': severities,
            'message': 'Alert severities retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting alert severities: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve alert severities'
        }), 500

@assessment_analytics_qa_bp.route('/analytics/export/<report_id>', methods=['GET'])
def export_analytics_report(report_id: str):
    """Export analytics report"""
    try:
        # Get the report from the system
        if report_id not in assessment_analytics_qa_system.analytics_reports:
            return jsonify({
                'success': False,
                'error': 'Report not found',
                'message': f'Analytics report with ID {report_id} not found'
            }), 404
        
        report = assessment_analytics_qa_system.analytics_reports[report_id]
        
        # Convert to exportable format
        export_data = {
            'report_id': report.report_id,
            'report_type': report.report_type,
            'timeframe': report.timeframe.value,
            'start_date': report.start_date.isoformat(),
            'end_date': report.end_date.isoformat(),
            'metrics': report.metrics,
            'insights': report.insights,
            'recommendations': report.recommendations,
            'quality_scores': report.quality_scores,
            'trends': report.trends,
            'generated_at': report.generated_at.isoformat(),
            'generated_by': report.generated_by,
            'export_timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'export_data': export_data,
            'message': 'Analytics report exported successfully'
        })
        
    except Exception as e:
        logger.error(f"Error exporting analytics report: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to export analytics report'
        }), 500

@assessment_analytics_qa_bp.route('/performance/batch-record', methods=['POST'])
def batch_record_performance_metrics():
    """Record multiple performance metrics in batch"""
    try:
        data = request.get_json()
        
        if not data or 'metrics' not in data:
            return jsonify({
                'success': False,
                'error': 'No metrics data provided',
                'message': 'Batch metrics data is required'
            }), 400
        
        metrics_list = data['metrics']
        if not isinstance(metrics_list, list):
            return jsonify({
                'success': False,
                'error': 'Invalid metrics format',
                'message': 'Metrics must be provided as a list'
            }), 400
        
        recorded_metrics = []
        errors = []
        
        for i, metrics_data in enumerate(metrics_list):
            try:
                # Validate required fields
                required_fields = ['assessment_id', 'candidate_id']
                for field in required_fields:
                    if field not in metrics_data:
                        errors.append(f'Item {i}: Missing required field: {field}')
                        continue
                
                # Record performance metrics
                metrics = assessment_analytics_qa_system.record_performance_metrics(metrics_data)
                recorded_metrics.append({
                    'metric_id': metrics.metric_id,
                    'assessment_id': metrics.assessment_id,
                    'candidate_id': metrics.candidate_id,
                    'recorded_at': metrics.recorded_at.isoformat()
                })
                
            except Exception as e:
                errors.append(f'Item {i}: {str(e)}')
        
        return jsonify({
            'success': True,
            'recorded_count': len(recorded_metrics),
            'error_count': len(errors),
            'recorded_metrics': recorded_metrics,
            'errors': errors,
            'message': f'Batch recording completed: {len(recorded_metrics)} successful, {len(errors)} errors'
        })
        
    except Exception as e:
        logger.error(f"Error batch recording performance metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to batch record performance metrics'
        }), 500

@assessment_analytics_qa_bp.route('/dashboard/overview', methods=['GET'])
def get_dashboard_overview():
    """Get comprehensive dashboard overview"""
    try:
        # Get quality dashboard
        quality_dashboard = assessment_analytics_qa_system.generate_quality_dashboard()
        
        # Get system health metrics
        health_metrics = assessment_analytics_qa_system.get_system_health_metrics()
        
        # Combine into overview
        overview = {
            'system_status': health_metrics.get('system_status', 'unknown'),
            'total_assessments': quality_dashboard.get('overview', {}).get('total_assessments_monitored', 0),
            'quality_score': quality_dashboard.get('overview', {}).get('average_quality_score', 0),
            'reliability_score': health_metrics.get('system_reliability_percentage', 0),
            'unresolved_alerts': quality_dashboard.get('overview', {}).get('unresolved_alerts', 0),
            'user_satisfaction': health_metrics.get('user_satisfaction_score', 0),
            'recent_alerts': quality_dashboard.get('recent_alerts', [])[:5],  # Top 5 recent alerts
            'quality_trends': quality_dashboard.get('quality_trends', {}),
            'performance_stats': quality_dashboard.get('performance_statistics', {}),
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'overview': overview,
            'message': 'Dashboard overview generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error generating dashboard overview: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate dashboard overview'
        }), 500

# Error handlers
@assessment_analytics_qa_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested analytics endpoint was not found'
    }), 404

@assessment_analytics_qa_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'error': 'Method not allowed',
        'message': 'The HTTP method is not allowed for this endpoint'
    }), 405

@assessment_analytics_qa_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An internal error occurred in the analytics system'
    }), 500

logger.info("✅ Assessment Analytics & QA routes loaded successfully")
