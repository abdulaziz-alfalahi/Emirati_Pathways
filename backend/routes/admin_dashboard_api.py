"""
Admin Dashboard API Routes

This module provides the missing API endpoints for the Admin Dashboard frontend,
including dashboard stats, alerts, and activity tracking.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from backend.db import get_db_connection
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
admin_dashboard_bp = Blueprint('admin_dashboard_api', __name__, url_prefix='/api/admin')
feedback_bp = Blueprint('feedback_api', __name__, url_prefix='/api/feedback')



def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute a database query with error handling"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            if fetch_one:
                result = cursor.fetchone()
                return dict(result) if result else None
            elif fetch_all:
                return [dict(row) for row in cursor.fetchall()]
            else:
                conn.commit()
                return True
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def optional_auth(f):
    """Decorator that allows requests with or without authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For development, we allow requests without strict auth
        # In production, this should verify JWT tokens
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            # Token present - could verify here
            pass
        return f(*args, **kwargs)
    return decorated_function


# =====================================================
# DASHBOARD STATS ENDPOINT
# =====================================================

@admin_dashboard_bp.route('/dashboard', methods=['GET'])
@admin_dashboard_bp.route('/dashboard/stats', methods=['GET'])
@optional_auth
def get_dashboard_stats():
    """
    Get dashboard statistics for admin overview
    
    Query params:
        timeRange: '24h', '7d', '30d', '90d'
    
    Returns:
        DashboardStats object with user, content, and system metrics
    """
    try:
        time_range = request.args.get('timeRange', '24h')
        
        # Calculate time filter
        time_filters = {
            '24h': timedelta(hours=24),
            '7d': timedelta(days=7),
            '30d': timedelta(days=30),
            '90d': timedelta(days=90)
        }
        time_delta = time_filters.get(time_range, timedelta(hours=24))
        cutoff_date = datetime.utcnow() - time_delta
        
        # Get user statistics
        total_users = 0
        active_users = 0
        new_users_today = 0
        
        user_stats_query = """
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE is_active = true) as active_users,
                COUNT(*) FILTER (WHERE created_at >= %s) as new_users
            FROM users
        """
        user_stats = execute_query(user_stats_query, (cutoff_date,), fetch_one=True)
        
        if user_stats:
            total_users = user_stats.get('total_users', 0)
            active_users = user_stats.get('active_users', 0)
            new_users_today = user_stats.get('new_users', 0)
        
        # Get content statistics (CVs, JDs, etc.)
        total_content = 0
        published_content = 0
        new_content_today = 0
        
        # Count CVs
        cv_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE created_at >= %s) as new_today
            FROM cv_data
        """
        cv_stats = execute_query(cv_query, (cutoff_date,), fetch_one=True)
        if cv_stats:
            total_content += cv_stats.get('total', 0) or 0
            new_content_today += cv_stats.get('new_today', 0) or 0
        
        # Count Job Descriptions
        jd_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'published') as published,
                COUNT(*) FILTER (WHERE created_at >= %s) as new_today
            FROM job_descriptions
        """
        jd_stats = execute_query(jd_query, (cutoff_date,), fetch_one=True)
        if jd_stats:
            total_content += jd_stats.get('total', 0) or 0
            published_content = jd_stats.get('published', 0) or 0
            new_content_today += jd_stats.get('new_today', 0) or 0
        
        # Get media count (if applicable)
        total_media = 0
        media_query = "SELECT COUNT(*) as count FROM cv_data WHERE file_path IS NOT NULL"
        media_stats = execute_query(media_query, fetch_one=True)
        if media_stats:
            total_media = media_stats.get('count', 0) or 0
        
        # Determine system health
        system_health = 'healthy'
        # Check for any critical issues (placeholder logic)
        if total_users == 0:
            system_health = 'warning'
        
        stats = {
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalContent': total_content,
            'publishedContent': published_content,
            'totalMedia': total_media,
            'systemHealth': system_health,
            'newUsersToday': new_users_today,
            'newContentToday': new_content_today
        }
        
        return jsonify({
            'status': 'success',
            'data': stats,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}")
        # Return default stats on error
        return jsonify({
            'status': 'success',
            'data': {
                'totalUsers': 0,
                'activeUsers': 0,
                'totalContent': 0,
                'publishedContent': 0,
                'totalMedia': 0,
                'systemHealth': 'healthy',
                'newUsersToday': 0,
                'newContentToday': 0
            },
            'timestamp': datetime.utcnow().isoformat()
        })


# =====================================================
# ALERTS ENDPOINT
# =====================================================

@admin_dashboard_bp.route('/alerts', methods=['GET'])
@optional_auth
def get_alerts():
    """
    Get system alerts for admin dashboard
    
    Returns:
        List of SystemAlert objects
    """
    try:
        alerts = []
        
        # Check for system alerts from notifications table if exists
        alerts_query = """
            SELECT 
                id::text,
                notification_type as type,
                title,
                message,
                created_at as timestamp,
                COALESCE(is_read, false) as "isRead"
            FROM system_notifications
            WHERE target_user_id IS NULL OR target_user_id = 0
            ORDER BY created_at DESC
            LIMIT 20
        """
        
        db_alerts = execute_query(alerts_query)
        
        if db_alerts:
            for alert in db_alerts:
                # Map notification_type to frontend expected types
                alert_type = 'info'
                if alert.get('type') in ['error', 'critical']:
                    alert_type = 'error'
                elif alert.get('type') in ['warning', 'warn']:
                    alert_type = 'warning'
                elif alert.get('type') in ['success', 'completed']:
                    alert_type = 'success'
                
                alerts.append({
                    'id': str(alert.get('id', '')),
                    'type': alert_type,
                    'title': alert.get('title', 'System Alert'),
                    'message': alert.get('message', ''),
                    'timestamp': alert.get('timestamp').isoformat() if alert.get('timestamp') else datetime.utcnow().isoformat(),
                    'isRead': alert.get('isRead', False)
                })
        
        # If no alerts in DB, generate some based on system state
        if not alerts:
            # Check for potential issues
            user_count = execute_query("SELECT COUNT(*) as count FROM users", fetch_one=True)
            
            if user_count and user_count.get('count', 0) > 0:
                alerts.append({
                    'id': 'system-status-1',
                    'type': 'success',
                    'title': 'System Operational',
                    'message': f'All systems running normally. {user_count.get("count", 0)} users registered.',
                    'timestamp': datetime.utcnow().isoformat(),
                    'isRead': False
                })
            else:
                alerts.append({
                    'id': 'system-status-1',
                    'type': 'info',
                    'title': 'System Ready',
                    'message': 'Platform is ready for users.',
                    'timestamp': datetime.utcnow().isoformat(),
                    'isRead': False
                })
        
        return jsonify({
            'status': 'success',
            'data': alerts,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get alerts: {e}")
        return jsonify({
            'status': 'success',
            'data': [],
            'timestamp': datetime.utcnow().isoformat()
        })


# =====================================================
# ACTIVITY ENDPOINT
# =====================================================

@admin_dashboard_bp.route('/activity/recent', methods=['GET'])
@optional_auth
def get_recent_activity():
    """
    Get recent activity for admin dashboard
    
    Returns:
        List of RecentActivity objects
    """
    try:
        activities = []
        
        # Try to get from audit log
        audit_query = """
            SELECT 
                l.id::text,
                l.action,
                l.resource_type,
                l.created_at as timestamp,
                COALESCE(u.username, 'System') as username
            FROM admin_audit_log l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT 20
        """
        
        audit_logs = execute_query(audit_query)
        
        if audit_logs:
            for log in audit_logs:
                # Map action to activity type
                activity_type = 'system_update'
                action = log.get('action', '').lower()
                resource = log.get('resource_type', '').lower()
                
                if 'user' in resource or 'create' in action:
                    activity_type = 'user_created'
                elif 'content' in resource or 'publish' in action:
                    activity_type = 'content_published'
                elif 'media' in resource or 'upload' in action:
                    activity_type = 'media_uploaded'
                
                description = f"{log.get('action', 'Action')} on {log.get('resource_type', 'resource')}"
                
                activities.append({
                    'id': str(log.get('id', '')),
                    'type': activity_type,
                    'description': description,
                    'user': log.get('username', 'System'),
                    'timestamp': log.get('timestamp').isoformat() if log.get('timestamp') else datetime.utcnow().isoformat()
                })
        
        # If no audit logs, get recent user registrations as activity
        if not activities:
            users_query = """
                SELECT 
                    id::text,
                    username,
                    created_at as timestamp
                FROM users
                ORDER BY created_at DESC
                LIMIT 10
            """
            recent_users = execute_query(users_query)
            
            if recent_users:
                for user in recent_users:
                    activities.append({
                        'id': f"user-{user.get('id', '')}",
                        'type': 'user_created',
                        'description': f"New user registered: {user.get('username', 'Unknown')}",
                        'user': user.get('username', 'System'),
                        'timestamp': user.get('timestamp').isoformat() if user.get('timestamp') else datetime.utcnow().isoformat()
                    })
            
            # Get recent CVs
            cv_query = """
                SELECT 
                    cv.id::text,
                    cv.title,
                    cv.created_at as timestamp,
                    COALESCE(u.username, 'Anonymous') as username
                FROM cv_data cv
                LEFT JOIN users u ON cv.user_id = u.id
                ORDER BY cv.created_at DESC
                LIMIT 10
            """
            recent_cvs = execute_query(cv_query)
            
            if recent_cvs:
                for cv in recent_cvs:
                    activities.append({
                        'id': f"cv-{cv.get('id', '')}",
                        'type': 'content_published',
                        'description': f"CV uploaded: {cv.get('title', 'Untitled')}",
                        'user': cv.get('username', 'Anonymous'),
                        'timestamp': cv.get('timestamp').isoformat() if cv.get('timestamp') else datetime.utcnow().isoformat()
                    })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return jsonify({
            'status': 'success',
            'data': activities[:20],  # Limit to 20 most recent
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get recent activity: {e}")
        return jsonify({
            'status': 'success',
            'data': [],
            'timestamp': datetime.utcnow().isoformat()
        })


# =====================================================
# GROWTH OPERATOR METRICS ENDPOINT
# =====================================================

# Growth Operator metrics endpoint moved to separate blueprint
# See growth_operator_api.py for the implementation


# =====================================================
# INTERVIEWS ADMIN ENDPOINT
# =====================================================

@admin_dashboard_bp.route('/interviews/sessions/admin/all', methods=['GET'])
@optional_auth
def get_all_interview_sessions():
    """
    Get all interview sessions for admin view
    
    Returns:
        List of interview sessions with details
    """
    try:
        sessions = []
        
        # Query interview sessions
        sessions_query = """
            SELECT 
                s.id::text,
                s.candidate_id,
                s.job_id,
                s.scheduled_at,
                s.status,
                s.interview_type,
                s.notes,
                s.created_at,
                COALESCE(u.username, 'Unknown') as candidate_name,
                COALESCE(j.title, 'Unknown Position') as job_title
            FROM interview_sessions s
            LEFT JOIN users u ON s.candidate_id = u.id
            LEFT JOIN job_descriptions j ON s.job_id = j.id
            ORDER BY s.scheduled_at DESC
            LIMIT 100
        """
        
        db_sessions = execute_query(sessions_query)
        
        if db_sessions:
            for session in db_sessions:
                sessions.append({
                    'id': session.get('id'),
                    'candidateId': session.get('candidate_id'),
                    'candidateName': session.get('candidate_name'),
                    'jobId': session.get('job_id'),
                    'jobTitle': session.get('job_title'),
                    'scheduledAt': session.get('scheduled_at').isoformat() if session.get('scheduled_at') else None,
                    'status': session.get('status', 'scheduled'),
                    'interviewType': session.get('interview_type', 'video'),
                    'notes': session.get('notes'),
                    'createdAt': session.get('created_at').isoformat() if session.get('created_at') else None
                })
        
        return jsonify({
            'success': True,
            'data': sessions,
            'total': len(sessions)
        })
        
    except Exception as e:
        logger.error(f"Failed to get interview sessions: {e}")
        return jsonify({
            'success': True,
            'data': [],
            'total': 0
        })


# =====================================================
# FEEDBACK ENDPOINT (STUB)
# =====================================================

# Mock Feedback Store (In-memory for development) with Sample Data

# =====================================================
# FEEDBACK TABLE INITIALIZATION
# =====================================================

def ensure_feedback_table_exist():
    """Create feedback table and seed with initial data."""
    try:
        # Create table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                role TEXT,
                type TEXT,
                status TEXT DEFAULT 'open',
                message TEXT,
                metadata JSONB,
                console_logs JSONB,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
            """,
            fetch_all=False
        )
        
        execute_query(
            """
            CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback (created_at DESC);
            """,
            fetch_all=False
        )
        
        # Check if table is empty to seed
        count_res = execute_query("SELECT COUNT(*) AS cnt FROM feedback", fetch_one=True)
        # Handle dict or tuple return depending on cursor
        if count_res:
             count = count_res.get('cnt', 0) if isinstance(count_res, dict) else count_res[0]
        else:
             count = 0

        if int(count) == 0:
            logger.info("Seeding feedback table with initial data...")
            
        # Check for missing columns (Schema Migration)
        conn = get_db_connection()
        if conn:
            with conn.cursor() as cursor:
                # Check resolution_notes
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='feedback' AND column_name='resolution_notes'
                """)
                if not cursor.fetchone():
                    logger.info("Adding missing column 'resolution_notes' to feedback table")
                    cursor.execute("ALTER TABLE feedback ADD COLUMN resolution_notes TEXT;")
                    conn.commit()
            conn.close()

        if int(count) == 0:
            logger.info("Seeding feedback table with initial data...")
            
            # Seed data
            seed_items = [
                {
                    'id': '101',
                    'user_id': 'student_01',
                    'role': 'candidate',
                    'type': 'bug',
                    'status': 'open',
                    'message': 'Cannot upload PDF resume in CV builder. It says "Invalid format" even for .pdf files.',
                    'metadata': {'path': '/cv-builder', 'browser': 'Chrome'},
                    'console_logs': ['Error: File type validation failed'],
                    'time_offset': timedelta(hours=2)
                },
                {
                    'id': '102',
                    'user_id': 'mentor_05',
                    'role': 'mentor',
                    'type': 'feature',
                    'status': 'reviewed',
                    'message': 'It would be great to have a calendar view for upcoming sessions.',
                    'metadata': {'path': '/sessions', 'browser': 'Firefox'},
                    'console_logs': [],
                    'time_offset': timedelta(days=1)
                },
                {
                    'id': '103',
                    'user_id': 'student_22',
                    'role': 'candidate',
                    'type': 'general',
                    'status': 'resolved',
                    'message': 'The new dashboard layout is much cleaner and easier to use. Thanks!',
                    'metadata': {'path': '/dashboard', 'browser': 'Safari'},
                    'console_logs': [],
                    'time_offset': timedelta(days=2)
                },
                {
                    'id': '104',
                    'user_id': 'guest_01',
                    'role': 'guest',
                    'type': 'bug',
                    'status': 'open',
                    'message': 'The landing page images load very slowly on mobile data.',
                    'metadata': {'path': '/', 'device': 'iPhone 13'},
                    'console_logs': [],
                    'time_offset': timedelta(hours=5)
                },
                {
                    'id': '105',
                    'user_id': 'admin_02',
                    'role': 'admin',
                    'type': 'feature',
                    'status': 'in_progress',
                    'message': 'Need an export button for the user analytics report.',
                    'metadata': {'path': '/admin/analytics'},
                    'console_logs': [],
                    'time_offset': timedelta(days=3)
                },
                {
                    'id': '106',
                    'user_id': 'student_88',
                    'role': 'candidate',
                    'type': 'general',
                    'status': 'open',
                    'message': 'Found a typo in the Arabic translation of the "Career Path" section.',
                    'metadata': {'path': '/career-path', 'language': 'ar'},
                    'console_logs': [],
                    'time_offset': timedelta(minutes=45)
                },
                {
                    'id': '107',
                    'user_id': 'u971545515515.359acd61@emirati-pathway.temp',
                    'role': 'candidate',
                    'type': 'bug',
                    'status': 'open',
                    'message': 'Unable to save profile changes when internet connection is unstable.',
                    'metadata': {'path': '/profile/edit', 'connection': '4g'},
                    'console_logs': [],
                    'time_offset': timedelta(hours=3)
                },
                {
                    'id': '108',
                    'user_id': 'u971545515515.359acd61@emirati-pathway.temp',
                    'role': 'candidate',
                    'type': 'feature',
                    'status': 'pending',
                    'message': 'Requesting dark mode support for the mobile view.',
                    'metadata': {'path': '/settings'},
                    'console_logs': [],
                    'time_offset': timedelta(hours=3, minutes=15)
                }
            ]
            
            for item in seed_items:
                created_at = datetime.utcnow() - item['time_offset']
                execute_query(
                    """
                    INSERT INTO feedback (id, user_id, role, type, status, message, metadata, console_logs, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
                    """,
                    (
                        item['id'], item['user_id'], item['role'], item['type'], item['status'],
                        item['message'], json.dumps(item.get('metadata', {})), 
                        json.dumps(item.get('console_logs', [])), created_at
                    ),
                    fetch_all=False
                )
            logger.info(f"✅ Feedback table seeded with {len(seed_items)} items")
        else:
            logger.info("✅ Feedback table exists and is not empty")
            
    except Exception as e:
        logger.error(f"Error ensuring feedback table: {e}")


@feedback_bp.route('/', methods=['GET'])
@optional_auth
def get_all_feedback():
    """Get all feedback submissions"""
    try:
        feedback_list = execute_query(
            "SELECT * FROM feedback ORDER BY created_at DESC"
        )
        
        # Convert datetime objects to ISO strings for JSON
        if feedback_list:
            for item in feedback_list:
                if isinstance(item.get('created_at'), datetime):
                    item['created_at'] = item['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'data': feedback_list or []
        })
    except Exception as e:
        logger.error(f"Error fetching feedback: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@feedback_bp.route('/my-feedback', methods=['GET'])
@jwt_required(optional=True)
def get_my_feedback():
    """Get feedback submitted by current user"""
    try:
        # Get user ID from JWT if available
        user_id = get_jwt_identity()
        
        if not user_id:
             return jsonify({'success': True, 'data': []})

        feedback_list = execute_query(
            "SELECT * FROM feedback WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        
        # Serialize datetime
        if feedback_list:
            for item in feedback_list:
                if isinstance(item.get('created_at'), datetime):
                    item['created_at'] = item['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'data': feedback_list or []
        })
    except Exception as e:
        logger.error(f"Error fetching my feedback: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@feedback_bp.route('/stats', methods=['GET'])
@optional_auth
def get_feedback_stats():
    """Get feedback statistics"""
    try:
        # Get basic counts
        stats = execute_query(
            """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status != 'resolved' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN type = 'bug' THEN 1 ELSE 0 END) as bugs,
                SUM(CASE WHEN type = 'feature' THEN 1 ELSE 0 END) as features,
                SUM(CASE WHEN created_at::date = CURRENT_DATE THEN 1 ELSE 0 END) as today
            FROM feedback
            """,
            fetch_one=True
        )
        
        return jsonify({
            'success': True,
            'stats': {
                'total': int(stats.get('total', 0)),
                'open': int(stats.get('open', 0)),
                'bugs': int(stats.get('bugs', 0)),
                'features': int(stats.get('features', 0)),
                'today': int(stats.get('today', 0))
            }
        })
    except Exception as e:
        logger.error(f"Error getting feedback stats: {e}")
        return jsonify({
            'success': False,
            'stats': {'total': 0, 'open': 0, 'bugs': 0, 'features': 0, 'today': 0}
        })

@feedback_bp.route('/submit', methods=['POST'])
@jwt_required(optional=True)
def submit_feedback():
    """Submit feedback"""
    try:
        data = request.json
        import time
        import uuid
        
        feedback_id = f"fb_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        
        # Priority: JWT Identity > Body userId > None
        user_id = get_jwt_identity()
        if not user_id:
            user_id = data.get('userId')
            
        role = data.get('role', 'user')
        
        # If still no user_id, it is truly anonymous or issue with auth
        # We proceed but user_id might be NULL in DB
        
        execute_query(
            """
            INSERT INTO feedback (id, user_id, role, type, status, message, metadata, console_logs, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, CURRENT_TIMESTAMP)
            """,
            (
                feedback_id,
                user_id,
                role,
                data.get('type', 'general'),
                'open',
                data.get('message'),
                json.dumps(data.get('metadata', {})),
                json.dumps(data.get('consoleLogs', []))
            ),
            fetch_all=False
        )
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully',
            'id': feedback_id
        })
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Failed to submit feedback'}), 500

@feedback_bp.route('/<feedback_id>/status', methods=['PUT'])
@optional_auth
def update_feedback_status(feedback_id):
    """Update feedback status"""
    try:
        data = request.json
        new_status = data.get('status')
        resolution_notes = data.get('resolution_notes')
        
        if not new_status:
            return jsonify({'success': False, 'message': 'Status is required'}), 400
            
        # 1. Fetch Feedback Details (for notification)
        # We need user_id and message.
        # execute_query wrapper might not imply how to fetchone easily if not designed well, 
        # so using get_db_connection directly for this specific logic to be safe and robust.
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT user_id, message, role FROM feedback WHERE id = %s", (feedback_id,))
        feedback_item = cursor.fetchone()
        
        # 2. Update Status
        cursor.execute(
            "UPDATE feedback SET status = %s, resolution_notes = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (new_status, resolution_notes, feedback_id)
        )
        conn.commit()
        
        # 3. Send Notification
        notification_status = 'skipped'
        notification_error = None
        target_user_id = feedback_item.get('user_id') if feedback_item else None
        
        logger.info(f"Checking notification trigger: status='{new_status}', user_id='{target_user_id}'")
        
        if new_status and new_status.lower() == 'resolved' and feedback_item and target_user_id:
            try:
                # Skip guest
                if str(target_user_id).lower() != 'guest':
                    from backend.services.communication_service import communication_service, NotificationType
                    
                    original_msg = feedback_item['message'] or ''
                    msg_preview = (original_msg[:50] + '...') if len(original_msg) > 50 else original_msg
                    
                    logger.info(f"Sending resolution notification to user {target_user_id}")
                    
                    # Determine role-based link
                    user_role = feedback_item.get('role', 'candidate')
                    base_url = '/candidate-dashboard'
                    if user_role in ['recruiter', 'recruiter', 'employer_admin']:
                        base_url = '/recruiter-dashboard'
                    elif user_role in ['admin', 'admin']:
                        base_url = '/admin-dashboard'
                        
                    target_link = f"{base_url}?action=feedback_history"
                    
                    communication_service.create_notification(
                        user_id=str(target_user_id),
                        notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
                        metadata={
                            'title': 'Issue Resolved',
                            'message': f"We have resolved your reported issue: '{msg_preview}'. Thank you for your feedback!",
                            'feedback_id': feedback_id,
                            'priority': 'high',
                            'link': target_link,
                            'type': 'feedback_resolution' 
                        }
                    )
                    logger.info("Notification sent successfully")
                    notification_status = 'sent'
                else:
                    logger.info("Skipping notification for guest user")
                    notification_status = 'skipped_guest'
            except Exception as notif_err:
                logger.error(f"Failed to send resolution notification: {notif_err}")
                import traceback
                traceback.print_exc()
                notification_status = 'failed'
                notification_error = str(notif_err)

        cursor.close()
        conn.close()
                
        return jsonify({
            'success': True, 
            'message': f'Feedback status updated to {new_status}',
            'debug_info': {
                'notification_status': notification_status,
                'notification_error': notification_error,
                'target_user_id': target_user_id
            }
        })
    except Exception as e:
        logger.error(f"Failed to update feedback status: {e}")
        return jsonify({'success': False, 'message': 'Failed to update feedback status'}), 500


# =====================================================
# INVITATION STATS ENDPOINT (NAFIS pipeline)
# =====================================================

@admin_dashboard_bp.route('/invitations/stats', methods=['GET'])
@optional_auth
def get_invitation_stats():
    """Return invitation pipeline stats for the admin dashboard."""
    try:
        from nafis_talent_system import NafisTalentSystem
        nts = NafisTalentSystem()
        stats = nts.get_invitation_stats()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        logger.error(f"Failed to get invitation stats: {e}")
        return jsonify({
            'success': True,
            'data': {
                'total': 0, 'accepted': 0, 'pending': 0, 'expired': 0,
                'recent': []
            }
        })


# =====================================================
# SECURITY STATS ENDPOINT (live data)
# =====================================================

@admin_dashboard_bp.route('/security/stats', methods=['GET'])
@optional_auth
def get_security_stats():
    """Return real security metrics for the admin dashboard Security tab."""
    try:
        # Active sessions: users who logged in within the last 24 h
        active_query = """
            SELECT COUNT(*) as active_sessions
            FROM users
            WHERE last_login >= NOW() - INTERVAL '24 hours'
        """
        active = execute_query(active_query, fetch_one=True)

        # Failed OTP attempts in last 24 h
        failed_query = """
            SELECT COUNT(*) as failed
            FROM otp_interactions
            WHERE verified = FALSE AND created_at >= NOW() - INTERVAL '24 hours'
        """
        failed = execute_query(failed_query, fetch_one=True)

        # User verification %: users with a verified phone or email
        verified_query = """
            SELECT
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '') as verified
            FROM users
        """
        verified = execute_query(verified_query, fetch_one=True)

        total_users = (verified or {}).get('total_users', 1) or 1
        verified_count = (verified or {}).get('verified', 0)
        verification_pct = round((verified_count / total_users) * 100)

        # Compute simple security score: combination of verification % and low failed-login rate
        failed_count = (failed or {}).get('failed', 0)
        score = max(0, min(100, verification_pct - (failed_count * 2)))

        return jsonify({
            'success': True,
            'data': {
                'security_score': score,
                'failed_logins_24h': failed_count,
                'active_sessions': (active or {}).get('active_sessions', 0),
                'verified_users_pct': verification_pct,
            }
        })
    except Exception as e:
        logger.error(f"Failed to get security stats: {e}")
        return jsonify({
            'success': True,
            'data': {
                'security_score': 0,
                'failed_logins_24h': 0,
                'active_sessions': 0,
                'verified_users_pct': 0,
            }
        })


# =====================================================
# AUDIT LOG ENDPOINTS
# =====================================================

@admin_dashboard_bp.route('/audit-log', methods=['GET'])
@optional_auth
def get_audit_log():
    """
    Get paginated, filterable audit log entries.

    Query params:
        page (int): Page number, default 1
        per_page (int): Items per page, default 50
        action (str): Filter by action type
        user_id (str): Filter by user id
        start_date (str): ISO date lower bound
        end_date (str): ISO date upper bound
    """
    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('per_page', 50))))
        action_filter = request.args.get('action')
        user_id_filter = request.args.get('user_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Build dynamic WHERE clause
        conditions = []
        params: list = []

        if action_filter:
            conditions.append("l.action = %s")
            params.append(action_filter)
        if user_id_filter:
            conditions.append("l.user_id = %s")
            params.append(user_id_filter)
        if start_date:
            conditions.append("l.created_at >= %s")
            params.append(start_date)
        if end_date:
            conditions.append("l.created_at <= %s")
            params.append(end_date)

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        # Total count
        count_query = f"SELECT COUNT(*) as total FROM admin_audit_log l {where_clause}"
        count_result = execute_query(count_query, tuple(params) if params else None, fetch_one=True)
        total = (count_result or {}).get('total', 0) or 0

        # Paginated rows
        offset = (page - 1) * per_page
        data_query = f"""
            SELECT
                l.id,
                l.user_id,
                COALESCE(u.username, 'System') as username,
                l.action,
                l.resource_type,
                l.resource_id,
                l.details,
                l.ip_address,
                l.created_at
            FROM admin_audit_log l
            LEFT JOIN users u ON l.user_id = u.id
            {where_clause}
            ORDER BY l.created_at DESC
            LIMIT %s OFFSET %s
        """
        data_params = list(params) + [per_page, offset]
        rows = execute_query(data_query, tuple(data_params))

        # Serialise datetime objects
        entries = []
        if rows:
            for row in rows:
                entry = dict(row)
                if isinstance(entry.get('created_at'), datetime):
                    entry['created_at'] = entry['created_at'].isoformat()
                entries.append(entry)

        return jsonify({
            'success': True,
            'data': entries,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': max(1, -(-total // per_page))  # ceil division
            },
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Failed to get audit log: {e}")
        return jsonify({
            'success': True,
            'data': [],
            'pagination': {'page': 1, 'per_page': 50, 'total': 0, 'total_pages': 1},
            'timestamp': datetime.utcnow().isoformat()
        })


@admin_dashboard_bp.route('/audit-log/stats', methods=['GET'])
@optional_auth
def get_audit_log_stats():
    """
    Return summary statistics for the audit log.

    Returns counts grouped by action type, total events,
    events today, and unauthorized-attempt count.
    """
    try:
        # Total events
        total_result = execute_query(
            "SELECT COUNT(*) as total FROM admin_audit_log",
            fetch_one=True
        )
        total_events = (total_result or {}).get('total', 0) or 0

        # Events today
        today_result = execute_query(
            "SELECT COUNT(*) as today FROM admin_audit_log WHERE created_at::date = CURRENT_DATE",
            fetch_one=True
        )
        events_today = (today_result or {}).get('today', 0) or 0

        # Unauthorized attempts (action contains 'unauthorized' or 'denied')
        unauth_result = execute_query(
            """
            SELECT COUNT(*) as unauth
            FROM admin_audit_log
            WHERE LOWER(action) LIKE '%%unauthorized%%'
               OR LOWER(action) LIKE '%%denied%%'
               OR LOWER(action) LIKE '%%forbidden%%'
            """,
            fetch_one=True
        )
        unauthorized_attempts = (unauth_result or {}).get('unauth', 0) or 0

        # Role-change events
        role_change_result = execute_query(
            """
            SELECT COUNT(*) as role_changes
            FROM admin_audit_log
            WHERE LOWER(action) LIKE '%%role%%'
            """,
            fetch_one=True
        )
        role_changes = (role_change_result or {}).get('role_changes', 0) or 0

        # Counts grouped by action
        action_counts = execute_query(
            """
            SELECT action, COUNT(*) as count
            FROM admin_audit_log
            GROUP BY action
            ORDER BY count DESC
            """
        )

        return jsonify({
            'success': True,
            'data': {
                'total_events': total_events,
                'events_today': events_today,
                'unauthorized_attempts': unauthorized_attempts,
                'role_changes': role_changes,
                'actions_breakdown': action_counts or []
            },
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Failed to get audit log stats: {e}")
        return jsonify({
            'success': True,
            'data': {
                'total_events': 0,
                'events_today': 0,
                'unauthorized_attempts': 0,
                'role_changes': 0,
                'actions_breakdown': []
            },
            'timestamp': datetime.utcnow().isoformat()
        })


# Register the blueprint function
def register_admin_dashboard_routes(app):
    """Register admin dashboard routes with the Flask app"""
    app.register_blueprint(admin_dashboard_bp)
    app.register_blueprint(feedback_bp)
    
    # Ensure feedback table exists and has correct schema
    ensure_feedback_table_exist()
    
    logger.info("✅ Admin Dashboard & Feedback API routes registered")
