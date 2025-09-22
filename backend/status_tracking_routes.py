"""
Status Tracking API Routes
Emirati Journey Platform - Real-time Application Status Tracking

Provides REST API endpoints for real-time status tracking, timeline views,
and analytics for job applications.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime, timedelta
from typing import List, Dict
from application_status_tracker import get_status_tracker, ApplicationStatus, NotificationType

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
status_tracking_bp = Blueprint('status_tracking', __name__, url_prefix='/api/applications')

@status_tracking_bp.route('/<application_id>/status', methods=['GET'])
@jwt_required()
def get_application_status(application_id):
    """
    Get current status and recent updates for an application
    """
    try:
        current_user_id = get_jwt_identity()
        tracker = get_status_tracker()
        
        # Get application timeline
        timeline = tracker.get_application_timeline(application_id)
        
        if not timeline:
            return jsonify({
                'success': False,
                'message': 'Application not found or no status history available'
            }), 404
        
        # Get current status (latest timeline entry)
        current_status_entry = None
        for entry in reversed(timeline):
            if entry['type'] == 'status_change':
                current_status_entry = entry
                break
        
        # Get next expected actions
        next_actions = _get_next_expected_actions(current_status_entry['status'] if current_status_entry else 'submitted')
        
        # Get recent notifications
        recent_notifications = [entry for entry in timeline if entry['type'] == 'notification'][-5:]
        
        return jsonify({
            'success': True,
            'data': {
                'application_id': application_id,
                'current_status': {
                    'status': current_status_entry['status'] if current_status_entry else 'unknown',
                    'title': current_status_entry['title'] if current_status_entry else 'Status Unknown',
                    'description': current_status_entry['description'] if current_status_entry else '',
                    'updated_at': current_status_entry['timestamp'] if current_status_entry else None,
                    'changed_by': current_status_entry.get('changed_by', 'System')
                },
                'timeline_summary': {
                    'total_events': len(timeline),
                    'status_changes': len([e for e in timeline if e['type'] == 'status_change']),
                    'interviews': len([e for e in timeline if e['type'] == 'interview']),
                    'notifications': len([e for e in timeline if e['type'] == 'notification'])
                },
                'next_actions': next_actions,
                'recent_notifications': recent_notifications,
                'progress_percentage': _calculate_progress_percentage(current_status_entry['status'] if current_status_entry else 'submitted')
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get application status error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application status'
        }), 500

@status_tracking_bp.route('/<application_id>/timeline', methods=['GET'])
@jwt_required()
def get_application_timeline(application_id):
    """
    Get comprehensive timeline for an application
    """
    try:
        current_user_id = get_jwt_identity()
        tracker = get_status_tracker()
        
        # Get query parameters
        include_notifications = request.args.get('include_notifications', 'true').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        # Get timeline
        timeline = tracker.get_application_timeline(application_id)
        
        if not timeline:
            return jsonify({
                'success': False,
                'message': 'Application timeline not found'
            }), 404
        
        # Filter notifications if requested
        if not include_notifications:
            timeline = [entry for entry in timeline if entry['type'] != 'notification']
        
        # Limit results
        timeline = timeline[-limit:] if len(timeline) > limit else timeline
        
        # Add progress indicators
        for i, entry in enumerate(timeline):
            entry['sequence_number'] = i + 1
            entry['is_latest'] = i == len(timeline) - 1
            
            # Add estimated next steps for status changes
            if entry['type'] == 'status_change':
                entry['next_expected_actions'] = _get_next_expected_actions(entry['status'])
        
        return jsonify({
            'success': True,
            'data': {
                'application_id': application_id,
                'timeline': timeline,
                'summary': {
                    'total_events': len(timeline),
                    'date_range': {
                        'start': timeline[0]['timestamp'] if timeline else None,
                        'end': timeline[-1]['timestamp'] if timeline else None
                    },
                    'current_status': timeline[-1]['status'] if timeline and timeline[-1]['type'] == 'status_change' else 'unknown'
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get application timeline error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve application timeline'
        }), 500

@status_tracking_bp.route('/<application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(application_id):
    """
    Update application status (for authorized users)
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        new_status = data.get('status')
        reason = data.get('reason')
        notes = data.get('notes')
        send_notification = data.get('send_notification', True)
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        tracker = get_status_tracker()
        
        # Update status
        success, message = tracker.update_application_status(
            application_id,
            new_status,
            changed_by=current_user_id,
            reason=reason,
            notes=notes,
            send_notification=send_notification
        )
        
        if success:
            # Get updated timeline
            timeline = tracker.get_application_timeline(application_id)
            latest_entry = timeline[-1] if timeline else None
            
            return jsonify({
                'success': True,
                'message': message,
                'data': {
                    'application_id': application_id,
                    'new_status': new_status,
                    'updated_at': latest_entry['timestamp'] if latest_entry else datetime.now().isoformat(),
                    'next_actions': _get_next_expected_actions(new_status)
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        logger.error(f"Update application status error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update application status'
        }), 500

@status_tracking_bp.route('/analytics/status', methods=['GET'])
@jwt_required()
def get_status_analytics():
    """
    Get status analytics for user's applications
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        date_range = int(request.args.get('date_range', 30))
        include_global = request.args.get('include_global', 'false').lower() == 'true'
        
        tracker = get_status_tracker()
        
        # Get user analytics
        user_analytics = tracker.get_status_analytics(user_id=current_user_id, date_range=date_range)
        
        result = {
            'success': True,
            'data': {
                'user_analytics': user_analytics,
                'date_range_days': date_range,
                'generated_at': datetime.now().isoformat()
            }
        }
        
        # Include global analytics if requested (for comparison)
        if include_global:
            global_analytics = tracker.get_status_analytics(date_range=date_range)
            result['data']['global_analytics'] = global_analytics
            result['data']['comparison'] = _compare_analytics(user_analytics, global_analytics)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Get status analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve status analytics'
        }), 500

@status_tracking_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """
    Get notifications for the current user
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        import psycopg2
        import psycopg2.extras
        import os
        
        # Database connection
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
        }
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Build query
            where_clause = "WHERE an.user_id = %s"
            params = [current_user_id]
            
            if unread_only:
                where_clause += " AND an.is_read = false"
            
            # Get notifications
            cursor.execute(f"""
                SELECT 
                    an.*,
                    ja.job_id
                FROM application_notifications an
                JOIN job_applications ja ON an.application_id = ja.id
                {where_clause}
                ORDER BY an.created_at DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            
            notifications = cursor.fetchall()
            
            # Get total count
            cursor.execute(f"""
                SELECT COUNT(*) as total
                FROM application_notifications an
                JOIN job_applications ja ON an.application_id = ja.id
                {where_clause}
            """, params)
            
            total_count = cursor.fetchone()['total']
            
            # Get unread count
            cursor.execute("""
                SELECT COUNT(*) as unread_count
                FROM application_notifications an
                JOIN job_applications ja ON an.application_id = ja.id
                WHERE an.user_id = %s AND an.is_read = false
            """, (current_user_id,))
            
            unread_count = cursor.fetchone()['unread_count']
            
            # Format notifications
            formatted_notifications = []
            for notif in notifications:
                formatted_notifications.append({
                    'id': notif['id'],
                    'application_id': notif['application_id'],
                    'job_id': notif['job_id'],
                    'type': notif['notification_type'],
                    'title': notif['title'],
                    'message': notif['message'],
                    'is_read': notif['is_read'],
                    'created_at': notif['created_at'].isoformat(),
                    'read_at': notif['read_at'].isoformat() if notif['read_at'] else None
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'notifications': formatted_notifications,
                    'pagination': {
                        'total_count': total_count,
                        'unread_count': unread_count,
                        'limit': limit,
                        'offset': offset,
                        'has_more': offset + limit < total_count
                    }
                }
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Get notifications error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve notifications'
        }), 500

@status_tracking_bp.route('/notifications/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """
    Mark a notification as read
    """
    try:
        current_user_id = get_jwt_identity()
        
        import psycopg2
        import psycopg2.extras
        import os
        
        # Database connection
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
        }
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Update notification
            cursor.execute("""
                UPDATE application_notifications
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
                RETURNING id, is_read, read_at
            """, (notification_id, current_user_id))
            
            result = cursor.fetchone()
            
            if not result:
                return jsonify({
                    'success': False,
                    'message': 'Notification not found'
                }), 404
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Notification marked as read',
                'data': {
                    'notification_id': result['id'],
                    'is_read': result['is_read'],
                    'read_at': result['read_at'].isoformat()
                }
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Mark notification read error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark notification as read'
        }), 500

@status_tracking_bp.route('/status-options', methods=['GET'])
def get_status_options():
    """
    Get available status options and their descriptions
    """
    try:
        status_info = {
            'submitted': {
                'title': 'Application Submitted',
                'description': 'Your application has been received and is in the queue for review',
                'color': '#3B82F6',
                'icon': 'document-check',
                'next_possible': ['under_review', 'withdrawn']
            },
            'under_review': {
                'title': 'Under Review',
                'description': 'HR team is currently reviewing your application and qualifications',
                'color': '#F59E0B',
                'icon': 'eye',
                'next_possible': ['interview_scheduled', 'rejected', 'withdrawn']
            },
            'interview_scheduled': {
                'title': 'Interview Scheduled',
                'description': 'An interview has been scheduled - check your email for details',
                'color': '#8B5CF6',
                'icon': 'calendar',
                'next_possible': ['interview_completed', 'withdrawn']
            },
            'interview_completed': {
                'title': 'Interview Completed',
                'description': 'Interview completed - waiting for final decision',
                'color': '#06B6D4',
                'icon': 'check-circle',
                'next_possible': ['offer_extended', 'rejected']
            },
            'offer_extended': {
                'title': 'Offer Extended',
                'description': 'Congratulations! A job offer has been extended to you',
                'color': '#10B981',
                'icon': 'gift',
                'next_possible': ['offer_accepted', 'offer_declined']
            },
            'offer_accepted': {
                'title': 'Offer Accepted',
                'description': 'You have accepted the job offer - welcome to the team!',
                'color': '#059669',
                'icon': 'check-badge',
                'next_possible': ['hired']
            },
            'offer_declined': {
                'title': 'Offer Declined',
                'description': 'You have declined the job offer',
                'color': '#6B7280',
                'icon': 'x-circle',
                'next_possible': []
            },
            'rejected': {
                'title': 'Application Not Successful',
                'description': 'Unfortunately, we have decided to move forward with other candidates',
                'color': '#EF4444',
                'icon': 'x-circle',
                'next_possible': []
            },
            'withdrawn': {
                'title': 'Application Withdrawn',
                'description': 'Application has been withdrawn by the candidate',
                'color': '#6B7280',
                'icon': 'arrow-left-circle',
                'next_possible': []
            },
            'hired': {
                'title': 'Hired',
                'description': 'Welcome to your new position! Check your email for onboarding details',
                'color': '#059669',
                'icon': 'star',
                'next_possible': []
            }
        }
        
        return jsonify({
            'success': True,
            'data': {
                'status_options': status_info,
                'workflow_stages': [
                    'submitted',
                    'under_review', 
                    'interview_scheduled',
                    'interview_completed',
                    'offer_extended',
                    'offer_accepted',
                    'hired'
                ],
                'terminal_statuses': ['rejected', 'withdrawn', 'offer_declined', 'hired']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get status options error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve status options'
        }), 500

# Helper functions
def _get_next_expected_actions(current_status: str) -> List[Dict]:
    """Get next expected actions based on current status"""
    actions_map = {
        'submitted': [
            {'action': 'wait', 'description': 'Wait for HR team to review your application', 'estimated_time': '3-5 business days'},
            {'action': 'prepare', 'description': 'Prepare for potential interview by researching the company', 'estimated_time': 'Ongoing'}
        ],
        'under_review': [
            {'action': 'wait', 'description': 'HR team is reviewing your qualifications', 'estimated_time': '2-3 business days'},
            {'action': 'prepare', 'description': 'Prepare for potential interview questions', 'estimated_time': 'Ongoing'}
        ],
        'interview_scheduled': [
            {'action': 'prepare', 'description': 'Prepare for your upcoming interview', 'estimated_time': 'Before interview'},
            {'action': 'confirm', 'description': 'Confirm interview attendance via email', 'estimated_time': '24 hours before'},
            {'action': 'research', 'description': 'Research the company and role thoroughly', 'estimated_time': 'Before interview'}
        ],
        'interview_completed': [
            {'action': 'wait', 'description': 'Wait for interview feedback and decision', 'estimated_time': '1-2 weeks'},
            {'action': 'follow_up', 'description': 'Send thank you email to interviewer', 'estimated_time': 'Within 24 hours'}
        ],
        'offer_extended': [
            {'action': 'review', 'description': 'Review the job offer details carefully', 'estimated_time': 'Within 3 days'},
            {'action': 'negotiate', 'description': 'Negotiate terms if needed', 'estimated_time': 'Within 5 days'},
            {'action': 'respond', 'description': 'Accept or decline the offer', 'estimated_time': 'Within 7 days'}
        ],
        'offer_accepted': [
            {'action': 'prepare', 'description': 'Prepare for onboarding process', 'estimated_time': 'Before start date'},
            {'action': 'documentation', 'description': 'Complete required documentation', 'estimated_time': 'Before start date'}
        ]
    }
    
    return actions_map.get(current_status, [])

def _calculate_progress_percentage(status: str) -> int:
    """Calculate progress percentage based on status"""
    progress_map = {
        'submitted': 10,
        'under_review': 25,
        'interview_scheduled': 50,
        'interview_completed': 75,
        'offer_extended': 90,
        'offer_accepted': 95,
        'hired': 100,
        'rejected': 0,
        'withdrawn': 0,
        'offer_declined': 0
    }
    
    return progress_map.get(status, 0)

def _compare_analytics(user_analytics: Dict, global_analytics: Dict) -> Dict:
    """Compare user analytics with global analytics"""
    try:
        user_success_rate = user_analytics.get('success_rates', {}).get('success_percentage', 0)
        global_success_rate = global_analytics.get('success_rates', {}).get('success_percentage', 0)
        
        user_avg_time = user_analytics.get('processing_times', {}).get('average_hours', 0)
        global_avg_time = global_analytics.get('processing_times', {}).get('average_hours', 0)
        
        return {
            'success_rate_comparison': {
                'user_rate': user_success_rate,
                'global_rate': global_success_rate,
                'difference': user_success_rate - global_success_rate,
                'performance': 'above_average' if user_success_rate > global_success_rate else 'below_average' if user_success_rate < global_success_rate else 'average'
            },
            'processing_time_comparison': {
                'user_hours': user_avg_time,
                'global_hours': global_avg_time,
                'difference_hours': user_avg_time - global_avg_time,
                'performance': 'faster' if user_avg_time < global_avg_time else 'slower' if user_avg_time > global_avg_time else 'average'
            }
        }
    except Exception:
        return {}
