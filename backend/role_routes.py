from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os
import uuid
import json
import logging
from backend.notification_system import NotificationType, NotificationPriority

# Define Blueprint
role_bp = Blueprint('role_management', __name__, url_prefix='/api/roles')
logger = logging.getLogger(__name__)

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
        port=os.getenv('DB_PORT', 5432)
    )

@role_bp.route('/request', methods=['POST'])
@jwt_required()
def submit_role_request():
    """Submit a request to add a new role"""
    conn = None
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        requested_role = data.get('role')
        documents = data.get('documents', {})
        notes = data.get('notes', '')
        
        if not requested_role:
            return jsonify({'success': False, 'message': 'Role is required'}), 400
            
        # Allowed roles to request
        allowed_roles = ['HR/Recruiter', 'HR Recruiter', 'Recruiter', 'HR Manager', 'Educator', 'Mentor', 'Assessor', 'Job Seeker', 'Student', 'Growth Operator']
        if requested_role not in allowed_roles:
             return jsonify({'success': False, 'message': 'Invalid role requested'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Check if user already has this role (primary or secondary)
        cur.execute("SELECT first_name, last_name, email, role, secondary_roles FROM users WHERE id = %s", (user_id,))
        user_data = cur.fetchone()
        
        if not user_data:
             return jsonify({'success': False, 'message': 'User not found'}), 404
             
        current_roles = [user_data['role']] + (user_data['secondary_roles'] or [])
        if requested_role in current_roles:
             return jsonify({'success': False, 'message': 'You already have this role'}), 400

        # Check for pending request
        cur.execute("""
            SELECT id FROM role_requests 
            WHERE user_id = %s AND requested_role = %s AND status = 'pending'
        """, (user_id, requested_role))
        
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'You already have a pending request for this role'}), 409
            
        # Create Request
        req_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO role_requests (id, user_id, requested_role, status, documents, admin_notes)
            VALUES (%s, %s, %s, 'pending', %s, %s)
            RETURNING id
        """, (req_id, user_id, requested_role, json.dumps(documents), notes))
        
        conn.commit()
        
        # --- Send Notifications to Admins and Operators ---
        try:
            # Find users with administrative privileges
            cur.execute("""
                SELECT id FROM users 
                WHERE role IN ('admin', 'administrator', 'growth_operator')
                   OR 'admin' = ANY(secondary_roles)
                   OR 'administrator' = ANY(secondary_roles)
                   OR 'growth_operator' = ANY(secondary_roles)
            """)
            recipients = cur.fetchall()
            
            requester_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or user_data.get('email')
            
            if hasattr(current_app, 'notification_system') and current_app.notification_system:
                for recipient in recipients:
                    recipient_id = recipient['id']
                    current_app.notification_system.send_notification(
                        user_id=str(recipient_id),
                        notification_type=NotificationType.ROLE_REQUEST,
                        title="New Role Request",
                        message=f"{requester_name} has requested the role: {requested_role}",
                        data={
                            'request_id': req_id,
                            'requester_id': user_id,
                            'role': requested_role,
                            'link': '/admin/roles'  # Deep link if supported
                        },
                        priority=NotificationPriority.HIGH
                    )
                logger.info(f"Role request notifications sent to {len(recipients)} admins/operators")
            else:
                logger.warning("Notification system not initialized, skipping notifications")
                
        except Exception as notify_err:
            logger.error(f"Failed to send notifications: {notify_err}")
            # Don't fail the request if notification fails
            
        return jsonify({
            'success': True, 
            'message': 'Role request submitted successfully',
            'data': {'request_id': req_id}
        }), 201

    except Exception as e:
        logger.error(f"Submit role request failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@role_bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    """Get all role requests for current user"""
    conn = None
    try:
        user_id = get_jwt_identity()
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT id, requested_role, status, created_at, admin_notes
            FROM role_requests
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        
        requests = cur.fetchall()
        
        return jsonify({
            'success': True,
            'data': requests
        }), 200
        
    except Exception as e:
        logger.error(f"Get role requests failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

# --- Admin Endpoints (Protected by Admin Role check in real app) ---

@role_bp.route('/admin/requests', methods=['GET'])
@jwt_required()
def get_all_requests():
    """Admin: Get all pending requests"""
    conn = None
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Check permissions
        cur.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
        # Helper import here to avoid circular dependency if possible, or move helper to common
        from backend.routes.auth_routes import get_role_permissions
        perms = get_role_permissions(user['role'])
        
        if 'roles.approve_requests' not in perms and 'admin' not in perms and 'administrator' not in perms:
             return jsonify({'success': False, 'message': 'Permission denied'}), 403
        
        cur.execute("""
            SELECT r.*, u.first_name, u.last_name, u.email
            FROM role_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        """)
        
        requests = cur.fetchall()
        
        return jsonify({
            'success': True,
            'data': requests
        }), 200
    except Exception as e:
        logger.error(f"Admin get requests failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@role_bp.route('/admin/request/<request_id>/action', methods=['PUT'])
@jwt_required()
def action_request(request_id):
    """Admin: Approve or Reject a request"""
    conn = None
    try:
        data = request.get_json()
        action = data.get('action') # 'approve' or 'reject'
        notes = data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400
            
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Check permissions
        current_user_id = get_jwt_identity()
        cur.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
        user_row = cur.fetchone()
        
        if not user_row:
             return jsonify({'success': False, 'message': 'User not found'}), 404

        # Helper import here to avoid circular dependency
        from backend.routes.auth_routes import get_role_permissions
        perms = get_role_permissions(user_row['role'])
        
        if 'roles.approve_requests' not in perms and 'admin' not in perms and 'administrator' not in perms:
             return jsonify({'success': False, 'message': 'Permission denied'}), 403
        
        
        # Get request details
        cur.execute("SELECT user_id, requested_role, status FROM role_requests WHERE id = %s", (request_id,))
        req = cur.fetchone()
        
        if not req:
            return jsonify({'success': False, 'message': 'Request not found'}), 404
            
        if req['status'] != 'pending':
            return jsonify({'success': False, 'message': 'Request is not pending'}), 400
            
        new_status = 'approved' if action == 'approve' else 'rejected'
        
        # Update Request Status
        cur.execute("""
            UPDATE role_requests 
            SET status = %s, admin_notes = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_status, notes, request_id))
        
        # If Approved, ADD role to user's secondary_roles
        if action == 'approve':
            user_id = req['user_id']
            role_to_add = req['requested_role']
            
            # Use array_append to add to list if not exists, handling NULLs
            cur.execute("""
                UPDATE users 
                SET secondary_roles = array_append(COALESCE(secondary_roles, '{}'), %s)
                WHERE id = %s AND (secondary_roles IS NULL OR NOT (%s = ANY(secondary_roles)))
            """, (role_to_add, user_id, role_to_add))
            
        conn.commit()
        
        # --- Notify Candidate ---
        try:
            if hasattr(current_app, 'notification_system') and current_app.notification_system:
                candidate_id = str(req['user_id'])
                role_name = req['requested_role']
                
                if new_status == 'approved':
                    title = "Role Request Approved"
                    message = f"Congratulations! Your request for the role '{role_name}' has been approved."
                    priority = NotificationPriority.HIGH
                else:
                    title = "Role Request Rejected"
                    message = f"Your request for the role '{role_name}' has been rejected."
                    if notes:
                        message += f" Reason: {notes}"
                    priority = NotificationPriority.MEDIUM
                
                current_app.notification_system.send_notification(
                    user_id=candidate_id,
                    notification_type=NotificationType.ROLE_DECISION,
                    title=title,
                    message=message,
                    data={
                        'request_id': request_id,
                        'role': role_name,
                        'status': new_status,
                        'notes': notes
                    },
                    priority=priority
                )
                logger.info(f"Role decision notification sent to user {candidate_id}")
        except Exception as notify_err:
            logger.error(f"Failed to notify candidate: {notify_err}")

        return jsonify({
            'success': True,
            'message': f'Request {new_status}'
        }), 200
        
    except Exception as e:
        logger.error(f"Action request failed: {e}")
        # conn.rollback() # Context manager handles? No, need manual rollback if creating transaction manually
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()
