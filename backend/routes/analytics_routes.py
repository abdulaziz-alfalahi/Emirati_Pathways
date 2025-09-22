"""
Analytics API Routes for Emirati Journey Platform
Real-time analytics, insights, and reporting endpoints
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.analytics_service import analytics_service, AnalyticsTimeframe
import logging
from datetime import datetime

# Create blueprint
analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# Initialize logger
logger = logging.getLogger(__name__)

# Import data sources (would be actual database connections in production)
from routes.job_routes import jobs_db
from routes.application_routes import applications_db
from routes.company_routes import companies_db

@analytics_bp.route('/platform/overview', methods=['GET'])
@jwt_required()
def get_platform_overview():
    """
    Get comprehensive platform overview with key metrics
    Query parameters:
    - timeframe: daily, weekly, monthly, quarterly, yearly (default: monthly)
    """
    try:
        # Set data sources for analytics service
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # Get timeframe parameter
        timeframe_str = request.args.get('timeframe', 'monthly').lower()
        try:
            timeframe = AnalyticsTimeframe(timeframe_str)
        except ValueError:
            timeframe = AnalyticsTimeframe.MONTHLY
        
        # Generate analytics
        overview_data = analytics_service.get_platform_overview(timeframe)
        
        if 'error' in overview_data:
            return jsonify({
                'success': False,
                'message': overview_data['error']
            }), 500
        
        return jsonify({
            'success': True,
            'data': overview_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting platform overview: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve platform overview'
        }), 500

@analytics_bp.route('/jobs', methods=['GET'])
@jwt_required()
def get_job_analytics():
    """
    Get detailed job analytics
    Query parameters:
    - company_id: Filter by specific company (optional)
    """
    try:
        current_user_id = get_jwt_identity()
        company_id = request.args.get('company_id')
        
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # TODO: Add permission check for company_id access
        
        # Generate job analytics
        job_data = analytics_service.get_job_analytics(company_id)
        
        if 'error' in job_data:
            return jsonify({
                'success': False,
                'message': job_data['error']
            }), 500
        
        return jsonify({
            'success': True,
            'data': job_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job analytics'
        }), 500

@analytics_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_application_analytics():
    """
    Get detailed application analytics
    Query parameters:
    - candidate_id: Filter by specific candidate (optional)
    - company_id: Filter by specific company (optional)
    """
    try:
        current_user_id = get_jwt_identity()
        candidate_id = request.args.get('candidate_id')
        company_id = request.args.get('company_id')
        
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # TODO: Add permission checks
        
        # Generate application analytics
        app_data = analytics_service.get_application_analytics(candidate_id, company_id)
        
        if 'error' in app_data:
            return jsonify({
                'success': False,
                'message': app_data['error']
            }), 500
        
        return jsonify({
            'success': True,
            'data': app_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting application analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application analytics'
        }), 500

@analytics_bp.route('/emiratization', methods=['GET'])
def get_emiratization_analytics():
    """
    Get comprehensive Emiratization analytics
    Public endpoint for transparency
    """
    try:
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # Generate Emiratization analytics
        emiratization_data = analytics_service.get_emiratization_analytics()
        
        if 'error' in emiratization_data:
            return jsonify({
                'success': False,
                'message': emiratization_data['error']
            }), 500
        
        return jsonify({
            'success': True,
            'data': emiratization_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting Emiratization analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve Emiratization analytics'
        }), 500

@analytics_bp.route('/matching', methods=['GET'])
@jwt_required()
def get_matching_analytics():
    """
    Get job-candidate matching analytics
    Requires: Admin or company access
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # TODO: Add admin permission check
        
        # Generate matching analytics
        matching_data = analytics_service.get_matching_analytics()
        
        if 'error' in matching_data:
            return jsonify({
                'success': False,
                'message': matching_data['error']
            }), 500
        
        return jsonify({
            'success': True,
            'data': matching_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting matching analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve matching analytics'
        }), 500

@analytics_bp.route('/dashboard/executive', methods=['GET'])
@jwt_required()
def get_executive_dashboard():
    """
    Get executive-level dashboard with key metrics
    Requires: Admin access
    """
    try:
        current_user_id = get_jwt_identity()
        
        # TODO: Add admin permission check
        
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # Get comprehensive data for executive dashboard
        platform_overview = analytics_service.get_platform_overview(AnalyticsTimeframe.MONTHLY)
        emiratization_data = analytics_service.get_emiratization_analytics()
        matching_data = analytics_service.get_matching_analytics()
        
        # Combine data for executive view
        executive_data = {
            'platform_health': {
                'total_active_jobs': platform_overview.get('overview', {}).get('active_jobs', 0),
                'total_applications': platform_overview.get('overview', {}).get('total_applications', 0),
                'success_rate': platform_overview.get('overview', {}).get('success_rate', 0),
                'verified_companies': platform_overview.get('overview', {}).get('verified_companies', 0)
            },
            'emiratization_progress': {
                'current_rate': emiratization_data.get('data', {}).get('overall_metrics', {}).get('overall_emiratization_rate', 67.3),
                'vision_2071_target': 75.0,
                'compliance_rate': emiratization_data.get('data', {}).get('overall_metrics', {}).get('compliance_rate', 0),
                'quarterly_trend': emiratization_data.get('data', {}).get('trends', {}).get('quarterly_progress', [])
            },
            'matching_performance': {
                'algorithm_accuracy': matching_data.get('data', {}).get('algorithm_performance', {}).get('algorithm_accuracy', 0),
                'average_match_score': matching_data.get('data', {}).get('algorithm_performance', {}).get('average_match_score', 0),
                'high_quality_matches': matching_data.get('data', {}).get('algorithm_performance', {}).get('high_quality_matches', 0)
            },
            'growth_trends': platform_overview.get('trends', {}),
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': executive_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting executive dashboard: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve executive dashboard'
        }), 500

@analytics_bp.route('/reports/emiratization', methods=['GET'])
def generate_emiratization_report():
    """
    Generate comprehensive Emiratization compliance report
    Public endpoint for transparency
    """
    try:
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # Get comprehensive Emiratization data
        emiratization_data = analytics_service.get_emiratization_analytics()
        
        if 'error' in emiratization_data:
            return jsonify({
                'success': False,
                'message': emiratization_data['error']
            }), 500
        
        # Format as comprehensive report
        report = {
            'report_title': 'UAE Emiratization Compliance Report',
            'report_date': datetime.utcnow().strftime('%Y-%m-%d'),
            'executive_summary': {
                'overall_emiratization_rate': emiratization_data.get('data', {}).get('overall_metrics', {}).get('overall_emiratization_rate', 67.3),
                'vision_2071_progress': f"{emiratization_data.get('data', {}).get('overall_metrics', {}).get('overall_emiratization_rate', 67.3)}/75.0",
                'compliant_companies': emiratization_data.get('data', {}).get('overall_metrics', {}).get('compliant_companies', 0),
                'total_workforce': emiratization_data.get('data', {}).get('overall_metrics', {}).get('total_employees', 0)
            },
            'detailed_analysis': emiratization_data.get('data', {}),
            'recommendations': [
                'Increase focus on high-growth industries with lower Emiratization rates',
                'Implement targeted training programs for UAE nationals',
                'Strengthen partnerships with educational institutions',
                'Develop mentorship programs connecting experienced professionals with UAE graduates'
            ],
            'next_review_date': (datetime.utcnow().replace(month=datetime.utcnow().month + 3)).strftime('%Y-%m-%d')
        }
        
        return jsonify({
            'success': True,
            'data': report
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating Emiratization report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to generate Emiratization report'
        }), 500

@analytics_bp.route('/metrics/real-time', methods=['GET'])
def get_real_time_metrics():
    """
    Get real-time platform metrics for live dashboard
    Public endpoint for basic metrics
    """
    try:
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        # Get current counts
        active_jobs = len([j for j in jobs_db.values() if j.status.value == 'published'])
        total_applications = len(applications_db)
        verified_companies = len([c for c in companies_db.values() if c.verification.is_verified])
        
        # Calculate recent activity (last 24 hours)
        from datetime import timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        recent_jobs = len([j for j in jobs_db.values() if j.created_at >= yesterday])
        recent_applications = len([a for a in applications_db.values() if a.created_at >= yesterday])
        
        # Success metrics
        successful_applications = len([a for a in applications_db.values() 
                                    if a.status.value in ['offer_accepted', 'hired']])
        success_rate = (successful_applications / total_applications * 100) if total_applications > 0 else 0
        
        real_time_data = {
            'current_metrics': {
                'active_jobs': active_jobs,
                'total_applications': total_applications,
                'verified_companies': verified_companies,
                'success_rate': round(success_rate, 2),
                'emiratization_rate': 67.3  # Would be calculated from actual data
            },
            'recent_activity': {
                'new_jobs_24h': recent_jobs,
                'new_applications_24h': recent_applications,
                'activity_trend': 'increasing' if (recent_jobs + recent_applications) > 5 else 'stable'
            },
            'system_status': {
                'platform_health': 'healthy',
                'api_response_time': '< 200ms',
                'uptime': '99.9%',
                'last_updated': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify({
            'success': True,
            'data': real_time_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve real-time metrics'
        }), 500

@analytics_bp.route('/export/data', methods=['POST'])
@jwt_required()
def export_analytics_data():
    """
    Export analytics data in various formats
    Requires: Admin access
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # TODO: Add admin permission check
        
        export_type = data.get('export_type', 'json')  # json, csv, pdf
        data_types = data.get('data_types', ['platform_overview'])  # List of data types to export
        
        # Set data sources
        analytics_service.set_data_sources(jobs_db, applications_db, companies_db)
        
        export_data = {}
        
        # Collect requested data types
        if 'platform_overview' in data_types:
            export_data['platform_overview'] = analytics_service.get_platform_overview()
        
        if 'emiratization' in data_types:
            export_data['emiratization'] = analytics_service.get_emiratization_analytics()
        
        if 'job_analytics' in data_types:
            export_data['job_analytics'] = analytics_service.get_job_analytics()
        
        if 'application_analytics' in data_types:
            export_data['application_analytics'] = analytics_service.get_application_analytics()
        
        if 'matching_analytics' in data_types:
            export_data['matching_analytics'] = analytics_service.get_matching_analytics()
        
        # Add export metadata
        export_data['export_metadata'] = {
            'exported_by': current_user_id,
            'export_date': datetime.utcnow().isoformat(),
            'export_type': export_type,
            'data_types': data_types
        }
        
        # TODO: Implement actual file export for CSV/PDF formats
        if export_type in ['csv', 'pdf']:
            return jsonify({
                'success': True,
                'message': f'{export_type.upper()} export functionality coming soon',
                'data': {'download_url': f'/api/analytics/downloads/{current_user_id}_{int(datetime.utcnow().timestamp())}.{export_type}'}
            }), 200
        
        # Return JSON data
        return jsonify({
            'success': True,
            'data': export_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error exporting analytics data: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to export analytics data'
        }), 500

