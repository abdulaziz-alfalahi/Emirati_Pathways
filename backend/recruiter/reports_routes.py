"""
Reports Routes for Recruiter Dashboard
Provides API endpoints for generating and exporting reports
"""

from flask import Blueprint, jsonify, request, Response
from .reports_engine import (
    generate_recruitment_pipeline_report,
    generate_candidate_status_report,
    generate_interview_feedback_report,
    generate_offer_statistics_report,
    generate_performance_metrics_report,
    export_to_csv,
    export_to_json
)

# Create blueprint without url_prefix (will be added in app.py)
try:
    from backend.auth.access_control import require_roles, require_auth, RECRUITER_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, require_auth, RECRUITER_ROLES

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/pipeline', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_pipeline_report():
    """
    Generate recruitment pipeline report
    
    Query Parameters:
        recruiter_id (optional): Filter by recruiter
        start_date (optional): Start date (YYYY-MM-DD)
        end_date (optional): End date (YYYY-MM-DD)
        format (optional): Export format (json, csv) - default: json
        
    Returns:
        Report data in requested format
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        export_format = request.args.get('format', 'json').lower()
        
        data = generate_recruitment_pipeline_report(recruiter_id, start_date, end_date)
        
        if export_format == 'csv':
            csv_data = export_to_csv(data)
            return Response(
                csv_data,
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=pipeline_report.csv'}
            )
        else:
            return jsonify({
                'success': True,
                'data': data,
                'count': len(data)
            }), 200
            
    except Exception as e:
        print(f"Error in get_pipeline_report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reports_bp.route('/candidates', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_candidate_status_report():
    """
    Generate candidate status report
    
    Query Parameters:
        recruiter_id (optional): Filter by recruiter
        jd_id (optional): Filter by job description
        status (optional): Filter by status
        format (optional): Export format (json, csv) - default: json
        
    Returns:
        Report data in requested format
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        jd_id = request.args.get('jd_id')
        status = request.args.get('status')
        export_format = request.args.get('format', 'json').lower()
        
        data = generate_candidate_status_report(recruiter_id, jd_id, status)
        
        if export_format == 'csv':
            csv_data = export_to_csv(data)
            return Response(
                csv_data,
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=candidate_status_report.csv'}
            )
        else:
            return jsonify({
                'success': True,
                'data': data,
                'count': len(data)
            }), 200
            
    except Exception as e:
        print(f"Error in get_candidate_status_report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reports_bp.route('/interviews', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_interview_feedback_report():
    """
    Generate interview feedback report
    
    Query Parameters:
        recruiter_id (optional): Filter by recruiter
        start_date (optional): Start date (YYYY-MM-DD)
        end_date (optional): End date (YYYY-MM-DD)
        format (optional): Export format (json, csv) - default: json
        
    Returns:
        Report data in requested format
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        export_format = request.args.get('format', 'json').lower()
        
        data = generate_interview_feedback_report(recruiter_id, start_date, end_date)
        
        if export_format == 'csv':
            csv_data = export_to_csv(data)
            return Response(
                csv_data,
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=interview_feedback_report.csv'}
            )
        else:
            return jsonify({
                'success': True,
                'data': data,
                'count': len(data)
            }), 200
            
    except Exception as e:
        print(f"Error in get_interview_feedback_report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reports_bp.route('/offers', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_offer_statistics_report():
    """
    Generate offer statistics report
    
    Query Parameters:
        recruiter_id (optional): Filter by recruiter
        start_date (optional): Start date (YYYY-MM-DD)
        end_date (optional): End date (YYYY-MM-DD)
        format (optional): Export format (json, csv) - default: json
        
    Returns:
        Report data in requested format
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        export_format = request.args.get('format', 'json').lower()
        
        data = generate_offer_statistics_report(recruiter_id, start_date, end_date)
        
        if export_format == 'csv':
            # For offers report, export the offers list
            csv_data = export_to_csv(data['offers'])
            return Response(
                csv_data,
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=offer_statistics_report.csv'}
            )
        else:
            return jsonify({
                'success': True,
                'data': data
            }), 200
            
    except Exception as e:
        print(f"Error in get_offer_statistics_report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reports_bp.route('/performance', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def get_performance_metrics_report():
    """
    Generate performance metrics report
    
    Query Parameters:
        recruiter_id (optional): Filter by recruiter
        start_date (optional): Start date (YYYY-MM-DD)
        end_date (optional): End date (YYYY-MM-DD)
        
    Returns:
        Performance metrics data
    """
    try:
        recruiter_id = request.args.get('recruiter_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        data = generate_performance_metrics_report(recruiter_id, start_date, end_date)
        
        return jsonify({
            'success': True,
            'data': data
        }), 200
            
    except Exception as e:
        print(f"Error in get_performance_metrics_report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

