"""
Workspace ACL Middleware
Enforces company-scoped access control for workspace endpoints.

Usage:
    @workspace_bp.route('/<company_id>/employees', methods=['GET'])
    @require_workspace_access('workspace.view')
    def list_employees(company_id):
        # company_context is available in g.company_context
        ...
"""

from flask import request, jsonify, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from functools import wraps
import psycopg2
import psycopg2.extras
import os
import logging

logger = logging.getLogger(__name__)

DB_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)


# Permission definitions per role
ROLE_PERMISSIONS = {
    'admin': {
        'workspace.view', 'workspace.manage_employees', 'workspace.assign_resources',
        'workspace.post_jobs', 'workspace.settings',
    },
    'hr_manager': {
        'workspace.view', 'workspace.manage_employees', 'workspace.assign_resources',
        'workspace.post_jobs',
    },
    'recruiter': {
        'workspace.view', 'workspace.assign_resources', 'workspace.post_jobs',
    },
    'member': {
        'workspace.view',
    },
    'employee': {
        'workspace.view',
    },
}

# Growth Operators have cross-company access
GROWTH_OPERATOR_ROLES = {'growth_operator_company', 'growth_operator', 'platform_administrator', 'super_user'}


def get_company_context(user_id, company_id):
    """Determine a user's relationship to a company and their permissions.
    
    Returns dict with: role, permissions, is_member, company_name
    Or None if no relationship exists.
    """
    conn = None
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Check if user is a growth operator (cross-company access)
        cur.execute("SELECT user_type FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if user and user['user_type'] in GROWTH_OPERATOR_ROLES:
            cur.close(); conn.close()
            return {
                'role': 'growth_operator',
                'permissions': set(ROLE_PERMISSIONS['admin']),  # Full access
                'is_member': False,
                'is_growth_operator': True,
            }

        # Check company_team_members
        cur.execute("""
            SELECT ctm.role, ctm.permissions, c.company_name
            FROM company_team_members ctm
            JOIN companies c ON c.id = ctm.company_id
            WHERE ctm.company_id = %s AND ctm.user_id = %s AND ctm.invitation_status = 'accepted'
        """, (company_id, user_id))
        membership = cur.fetchone()

        if membership:
            role = membership['role']
            custom_perms = membership.get('permissions') or {}
            base_perms = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS['member'])
            cur.close(); conn.close()
            return {
                'role': role,
                'permissions': base_perms,
                'is_member': True,
                'company_name': membership['company_name'],
                'is_growth_operator': False,
            }

        # Check if user is an employee of this company
        cur.execute("""
            SELECT ce.id FROM company_employees ce
            WHERE ce.company_id = %s AND ce.user_id = %s AND ce.status = 'active'
        """, (company_id, user_id))
        if cur.fetchone():
            cur.close(); conn.close()
            return {
                'role': 'employee',
                'permissions': ROLE_PERMISSIONS['employee'],
                'is_member': False,
                'is_growth_operator': False,
            }

        # Check if user is workspace admin
        cur.execute("""
            SELECT workspace_admin_id FROM companies 
            WHERE id = %s AND workspace_admin_id = %s
        """, (company_id, user_id))
        if cur.fetchone():
            cur.close(); conn.close()
            return {
                'role': 'admin',
                'permissions': ROLE_PERMISSIONS['admin'],
                'is_member': True,
                'is_growth_operator': False,
            }

        cur.close(); conn.close()
        return None

    except Exception as e:
        logger.error(f"ACL check error: {e}")
        if conn:
            conn.close()
        return None


def require_workspace_access(permission=None):
    """Decorator to enforce workspace-scoped access control.
    
    Extracts company_id from URL params, verifies user membership,
    and checks specific permission if provided.
    
    Sets g.company_context with user's role and permissions.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Extract company_id from kwargs (URL param)
            company_id = kwargs.get('company_id')
            if not company_id:
                return jsonify({"error": "company_id is required"}), 400

            # Get authenticated user
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
            except Exception:
                user_id = request.args.get('user_id')

            if not user_id:
                return jsonify({"error": "Authentication required"}), 401

            # Get company context
            context = get_company_context(user_id, company_id)
            if not context:
                return jsonify({
                    "error": "Access denied: you are not a member of this workspace"
                }), 403

            # Check specific permission
            if permission and permission not in context['permissions']:
                return jsonify({
                    "error": f"Access denied: requires '{permission}' permission"
                }), 403

            # Inject context for downstream use
            g.company_context = context
            g.company_context['user_id'] = user_id
            g.company_context['company_id'] = company_id

            return f(*args, **kwargs)
        return wrapped
    return decorator
