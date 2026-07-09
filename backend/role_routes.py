from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import uuid
import json
import logging
from backend.notification_system import NotificationType, NotificationPriority
from backend.db import get_db_connection

# Define Blueprint
role_bp = Blueprint('role_management', __name__, url_prefix='/api/roles')
logger = logging.getLogger(__name__)

# ─── Role → Operator Approval Mapping ──────────────────────────────────
# Maps each requestable role to the operator role(s) that should review it.
# Requests are routed to users with these roles (primary or secondary).
ROLE_OPERATOR_MAP = {
    'Job Seeker':       None,  # Auto-approved
    'Student':          ['education_operator', 'education_operator'],
    'Educator':         ['education_operator', 'education_operator'],
    'HR/Recruiter':     ['employer_relations', 'growth_operator'],
    'HR Recruiter':     ['employer_relations', 'growth_operator'],
    'Recruiter':        ['employer_relations', 'growth_operator'],
    'HR Manager':       ['employer_relations', 'growth_operator'],
    'Mentor':           ['mentorship_operator'],
    'Assessor':         ['assessment_operator'],
    'Guardian':         ['admin', 'admin'],
    'Growth Operator':  ['admin', 'admin'],
    'call_center_agent': ['admin', 'admin'],
    'career_services_operator': ['admin', 'admin'],
}



@role_bp.route('/institutions/search', methods=['GET'])
def search_institutions():
    """Search schools and universities for the Guardian role request form."""
    conn = None
    try:
        level = request.args.get('level', '')  # 'school' or 'university'
        query_str = request.args.get('q', '').strip()

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        results = []

        if level != 'university':
            # Search schools table
            sql = "SELECT id, name_en AS name, name_ar, location, 'school' AS type FROM schools WHERE is_active = true"
            params = []
            if query_str:
                sql += " AND (name_en ILIKE %s OR name_ar ILIKE %s)"
                params.extend([f'%{query_str}%', f'%{query_str}%'])
            sql += " ORDER BY name_en LIMIT 50"
            cur.execute(sql, params)
            results.extend(cur.fetchall())

        if level != 'school':
            # Search universities table
            sql = "SELECT id, name, name_ar, location, 'university' AS type FROM universities WHERE is_active = true"
            params = []
            if query_str:
                sql += " AND (name ILIKE %s OR name_ar ILIKE %s)"
                params.extend([f'%{query_str}%', f'%{query_str}%'])
            sql += " ORDER BY name LIMIT 50"
            cur.execute(sql, params)
            results.extend(cur.fetchall())

        return jsonify({'success': True, 'data': results}), 200

    except Exception as e:
        logger.error(f"Institution search failed: {e}")
        return jsonify({'success': True, 'data': []}), 200  # Graceful fallback
    finally:
        if conn: conn.close()


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
        role_fields = data.get('role_fields', {})
        
        if not requested_role:
            return jsonify({'success': False, 'message': 'Role is required'}), 400
            
        # Allowed roles to request
        allowed_roles = list(ROLE_OPERATOR_MAP.keys())
        if requested_role not in allowed_roles:
             return jsonify({'success': False, 'message': 'Invalid role requested'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Check if user already has this role (primary or secondary)
        cur.execute("SELECT full_name, email, role, secondary_roles FROM users WHERE id = %s", (user_id,))
        user_data = cur.fetchone()
        
        if not user_data:
             return jsonify({'success': False, 'message': 'User not found'}), 404
             
        current_roles = [user_data['role']] + (user_data['secondary_roles'] or [])
        if requested_role in current_roles:
             return jsonify({'success': False, 'message': 'You already have this role'}), 400

        # ─── Auto-approve Job Seeker ───
        if ROLE_OPERATOR_MAP.get(requested_role) is None:
            # Directly add to secondary_roles without creating a request
            cur.execute("""
                UPDATE users 
                SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) || jsonb_build_array(%s)
                WHERE id = %s AND (secondary_roles IS NULL OR NOT jsonb_exists(secondary_roles, %s))
            """, (requested_role, user_id, requested_role))
            conn.commit()
            
            logger.info(f"Auto-approved role '{requested_role}' for user {user_id}")
            return jsonify({
                'success': True, 
                'message': f'{requested_role} role has been added to your account.',
                'data': {'auto_approved': True}
            }), 200

        # Check for pending request
        cur.execute("""
            SELECT id FROM role_requests 
            WHERE user_id = %s AND requested_role = %s AND status = 'pending'
        """, (user_id, requested_role))
        
        if cur.fetchone():
            return jsonify({'success': False, 'message': 'You already have a pending request for this role'}), 409

        # Merge role_fields into documents JSON for storage
        combined_documents = {**documents}
        if role_fields:
            combined_documents['role_fields'] = role_fields
            
        # Create Request
        req_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO role_requests (id, user_id, requested_role, status, documents, admin_notes)
            VALUES (%s, %s, %s, 'pending', %s, %s)
            RETURNING id
        """, (req_id, user_id, requested_role, json.dumps(combined_documents), notes))
        
        conn.commit()
        
        # ─── Send Notifications to the Correct Operator ───
        try:
            operator_roles = ROLE_OPERATOR_MAP.get(requested_role, ['admin', 'admin'])
            
            # Build a dynamic WHERE clause to find the right operator users
            role_conditions = []
            params = []
            for op_role in operator_roles:
                role_conditions.append("role = %s")
                role_conditions.append("jsonb_exists(COALESCE(secondary_roles, '[]'::jsonb), %s)")
                params.extend([op_role, op_role])
            
            # Always include admin as fallback
            if 'admin' not in operator_roles:
                role_conditions.append("role = 'admin'")
                role_conditions.append("jsonb_exists(COALESCE(secondary_roles, '[]'::jsonb), 'admin')")
            
            where_clause = " OR ".join(role_conditions)
            cur.execute(f"SELECT id FROM users WHERE {where_clause}", params)
            recipients = cur.fetchall()
            
            requester_name = user_data.get('full_name', '') or user_data.get('email')
            
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
                            'operator_targets': operator_roles,
                            'link': '/admin-dashboard?tab=requests'
                        },
                        priority=NotificationPriority.HIGH
                    )
                logger.info(f"Role request notifications sent to {len(recipients)} operators (targets: {operator_roles})")
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
        cur.execute("SELECT role, secondary_roles FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
        # Helper import here to avoid circular dependency if possible, or move helper to common
        from backend.routes.auth_routes import get_role_permissions
        
        all_roles = [user['role']] + (user['secondary_roles'] or [])
        perms = []
        for r in all_roles:
            if r:
                perms.extend(get_role_permissions(r))
        
        if 'roles.approve_requests' not in perms and 'admin' not in perms and 'admin' not in perms:
             return jsonify({'success': False, 'message': 'Permission denied'}), 403
        
        cur.execute("""
            SELECT r.*, u.full_name, u.email
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
        cur.execute("SELECT role, secondary_roles FROM users WHERE id = %s", (current_user_id,))
        user_row = cur.fetchone()
        
        if not user_row:
             return jsonify({'success': False, 'message': 'User not found'}), 404

        # Helper import here to avoid circular dependency
        from backend.routes.auth_routes import get_role_permissions
        
        all_roles = [user_row['role']] + (user_row['secondary_roles'] or [])
        perms = []
        for r in all_roles:
            if r:
                perms.extend(get_role_permissions(r))
        
        if 'roles.approve_requests' not in perms and 'admin' not in perms and 'admin' not in perms:
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
                SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) || jsonb_build_array(%s)
                WHERE id = %s AND (secondary_roles IS NULL OR NOT jsonb_exists(secondary_roles, %s))
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
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()


# ─── Operator Endpoints ────────────────────────────────────────────────
# These endpoints allow operators (not just admins) to see and act on
# role requests that are routed to their domain.

def _get_operator_managed_roles(operator_role):
    """Return the set of requested roles this operator can manage."""
    managed = set()
    for requested_role, targets in ROLE_OPERATOR_MAP.items():
        if targets is None:
            continue  # Auto-approved
        if operator_role in targets:
            managed.add(requested_role)
    return managed


@role_bp.route('/operator/requests', methods=['GET'])
@jwt_required()
def get_operator_requests():
    """Operator: Get pending requests routed to this operator's domain."""
    conn = None
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get operator's role
        cur.execute("SELECT role, secondary_roles FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Collect all operator roles (primary + secondary)
        all_roles = [user['role']] + (user['secondary_roles'] or [])
        
        # Find which requested roles this operator can manage
        managed_roles = set()
        for r in all_roles:
            managed_roles |= _get_operator_managed_roles(r)
        
        # Admin/administrator can see ALL requests
        if 'admin' in all_roles or 'admin' in all_roles:
            cur.execute("""
                SELECT r.*, u.full_name, u.email
                FROM role_requests r
                JOIN users u ON r.user_id = u.id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
            """)
        elif managed_roles:
            placeholders = ','.join(['%s'] * len(managed_roles))
            cur.execute(f"""
                SELECT r.*, u.full_name, u.email
                FROM role_requests r
                JOIN users u ON r.user_id = u.id
                WHERE r.status = 'pending' AND r.requested_role IN ({placeholders})
                ORDER BY r.created_at DESC
            """, list(managed_roles))
        else:
            return jsonify({'success': True, 'data': []}), 200
        
        requests = cur.fetchall()
        
        # Serialize timestamps
        for req in requests:
            if req.get('created_at'):
                req['created_at'] = str(req['created_at'])
            if req.get('updated_at'):
                req['updated_at'] = str(req['updated_at'])
        
        return jsonify({'success': True, 'data': requests}), 200
        
    except Exception as e:
        logger.error(f"Operator get requests failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()


@role_bp.route('/operator/request/<request_id>/action', methods=['PUT'])
@jwt_required()
def operator_action_request(request_id):
    """Operator: Approve or Reject a request in their domain."""
    conn = None
    try:
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        notes = data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400
        
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Verify operator identity and permissions
        cur.execute("SELECT role, secondary_roles FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        all_roles = [user['role']] + (user['secondary_roles'] or [])
        managed_roles = set()
        for r in all_roles:
            managed_roles |= _get_operator_managed_roles(r)
        
        # Admin can manage anything
        is_admin = 'admin' in all_roles or 'admin' in all_roles
        
        # Get request details
        cur.execute("SELECT user_id, requested_role, status FROM role_requests WHERE id = %s", (request_id,))
        req = cur.fetchone()
        if not req:
            return jsonify({'success': False, 'message': 'Request not found'}), 404
        if req['status'] != 'pending':
            return jsonify({'success': False, 'message': 'Request is not pending'}), 400
        
        # Verify this operator can manage this role type
        if not is_admin and req['requested_role'] not in managed_roles:
            return jsonify({'success': False, 'message': 'You are not authorized to manage this role type'}), 403
        
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
            cur.execute("""
                UPDATE users 
                SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) || jsonb_build_array(%s)
                WHERE id = %s AND (secondary_roles IS NULL OR NOT jsonb_exists(secondary_roles, %s))
            """, (role_to_add, user_id, role_to_add))
        
        conn.commit()
        
        # Notify candidate
        try:
            if hasattr(current_app, 'notification_system') and current_app.notification_system:
                candidate_id = str(req['user_id'])
                role_name = req['requested_role']
                if new_status == 'approved':
                    title, message = "Role Request Approved", f"Your request for '{role_name}' has been approved."
                    priority = NotificationPriority.HIGH
                else:
                    title = "Role Request Rejected"
                    message = f"Your request for '{role_name}' has been rejected."
                    if notes: message += f" Reason: {notes}"
                    priority = NotificationPriority.MEDIUM
                
                current_app.notification_system.send_notification(
                    user_id=candidate_id,
                    notification_type=NotificationType.ROLE_DECISION,
                    title=title, message=message,
                    data={'request_id': request_id, 'role': role_name, 'status': new_status},
                    priority=priority
                )
        except Exception as notify_err:
            logger.error(f"Failed to notify candidate: {notify_err}")
        
        return jsonify({'success': True, 'message': f'Request {new_status}'}), 200
        
    except Exception as e:
        logger.error(f"Operator action request failed: {e}")
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

