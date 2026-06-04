"""
Company Workspace API Routes
Blueprint prefix: /api/workspace

Multi-tenant workspace endpoints for:
- Workspace provisioning (Growth Operator)
- Employee management (HR/Recruiter)
- Resource assignment (HR/Recruiter)
- Employee company view (Emirati dual-access)
"""

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import psycopg2
import psycopg2.extras
import os
import json
import logging
from functools import wraps
from backend.workspace_middleware import require_workspace_access

# Roles allowed for cross-company admin operations (provision, list)
GROWTH_OPERATOR_ROLES = {'growth_operator_company', 'growth_operator', 'platform_administrator', 'super_user', 'admin'}

logger = logging.getLogger(__name__)
workspace_bp = Blueprint('workspace', __name__, url_prefix='/api/workspace')

DB_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)


def get_db():
    try:
        return psycopg2.connect(DB_URL)
    except Exception as e:
        logger.error(f"Workspace DB error: {e}")
        return None


def serialize_row(row):
    """Convert a RealDictRow to a JSON-safe dict."""
    d = dict(row)
    for k, v in d.items():
        if hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
        elif isinstance(v, str):
            # Try to parse JSON strings
            pass
    return d


# ─── WORKSPACE PROVISIONING ──────────────────────────────────────────────────
# Actor: Growth Operator

@workspace_bp.route('/provision', methods=['POST'])
@jwt_required()
def provision_workspace():
    """Provision a workspace for an existing company.

    Body: { company_id, admin_user_id?, slug? }
    """
    data = request.get_json(silent=True) or {}
    company_id = data.get('company_id')
    if not company_id:
        return jsonify({"error": "company_id is required"}), 400

    provisioner_id = get_jwt_identity()

    # Verify the caller is a growth operator or platform admin
    conn_check = get_db()
    if conn_check:
        try:
            cur_check = conn_check.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur_check.execute("SELECT user_type FROM users WHERE id = %s", (provisioner_id,))
            caller = cur_check.fetchone()
            cur_check.close(); conn_check.close()
            if not caller or caller['user_type'] not in GROWTH_OPERATOR_ROLES:
                return jsonify({"error": "Access denied: requires growth operator or admin role"}), 403
        except Exception:
            conn_check.close()
            return jsonify({"error": "Authorization check failed"}), 500
    else:
        return jsonify({"error": "Database unavailable"}), 503

    admin_user_id = data.get('admin_user_id')
    slug = data.get('slug')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Verify company exists
        cur.execute("SELECT id, company_name, workspace_enabled FROM companies WHERE id = %s", (company_id,))
        company = cur.fetchone()
        if not company:
            cur.close(); conn.close()
            return jsonify({"error": "Company not found"}), 404

        if company.get('workspace_enabled'):
            cur.close(); conn.close()
            return jsonify({"error": "Workspace already provisioned for this company", "company_id": company_id}), 409

        # Generate slug from company name if not provided
        if not slug:
            raw_slug = company['company_name'].lower().replace(' ', '-').replace('&', 'and')
            # Remove non-alphanumeric chars except hyphens
            slug = ''.join(c for c in raw_slug if c.isalnum() or c == '-')[:100]
            # Ensure uniqueness
            cur.execute("SELECT COUNT(*) FROM companies WHERE workspace_slug = %s", (slug,))
            if cur.fetchone()['count'] > 0:
                slug = f"{slug}-{str(company_id)[:8]}"

        # Provision the workspace
        cur.execute("""
            UPDATE companies SET
                workspace_enabled = TRUE,
                workspace_slug = %s,
                workspace_admin_id = %s,
                provisioned_by = %s,
                provisioned_at = NOW()
            WHERE id = %s
            RETURNING id, company_name, workspace_slug, workspace_enabled
        """, (slug, admin_user_id, provisioner_id, company_id))
        updated = cur.fetchone()

        # If admin_user_id given, ensure they're in company_team_members as admin
        if admin_user_id:
            cur.execute("""
                INSERT INTO company_team_members (company_id, user_id, role, invitation_status, permissions)
                VALUES (%s, %s, 'admin', 'accepted', '{"workspace.manage_employees": true, "workspace.assign_resources": true, "workspace.post_jobs": true}'::jsonb)
                ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'admin'
            """, (company_id, admin_user_id))

            # Set their current_company_id
            cur.execute("UPDATE users SET current_company_id = %s WHERE id = %s", (company_id, admin_user_id))

        conn.commit()
        cur.close(); conn.close()
        return jsonify({
            "status": "provisioned",
            "workspace": serialize_row(updated)
        }), 201
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"Provision error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── WORKSPACE DETAILS ───────────────────────────────────────────────────────

@workspace_bp.route('/<company_id>', methods=['GET'])
@require_workspace_access('workspace.view', jwt_optional=True)
def get_workspace(company_id):
    """Get workspace details for a company."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
            SELECT c.id, c.company_name, c.industry,
                   c.workspace_enabled, c.workspace_slug,
                   c.workspace_admin_id, c.workspace_settings,
                   c.provisioned_at,
                   u.full_name as admin_name, u.email as admin_email,
                   (SELECT COUNT(*) FROM company_employees ce WHERE ce.company_id = c.id AND ce.status = 'active') as employee_count,
                   (SELECT COUNT(*) FROM company_resource_assignments cra WHERE cra.company_id = c.id) as resource_count,
                   (SELECT COUNT(*) FROM job_postings jp WHERE jp.company_id::text = c.id::text AND jp.status = 'published') as active_jobs
            FROM companies c
            LEFT JOIN users u ON u.id = c.workspace_admin_id
            WHERE c.id = %s
        """, (company_id,))
        workspace = cur.fetchone()
        cur.close(); conn.close()

        if not workspace:
            return jsonify({"error": "Company not found"}), 404

        return jsonify({"workspace": serialize_row(workspace)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── EMPLOYEE MANAGEMENT ─────────────────────────────────────────────────────
# Actors: HR Manager, Recruiter

@workspace_bp.route('/<company_id>/employees', methods=['GET'])
@require_workspace_access('workspace.view', jwt_optional=True)
def list_employees(company_id):
    """List employees of a company workspace."""
    status_filter = request.args.get('status', 'active')
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        sql = """
            SELECT ce.id, ce.user_id, ce.status, ce.job_title, ce.department,
                   ce.start_date, ce.employment_type, ce.hired_via, ce.created_at,
                   u.full_name, u.email, u.phone,
                   (SELECT COUNT(*) FROM company_resource_assignments cra 
                    WHERE cra.employee_id = ce.id) as assigned_resources
            FROM company_employees ce
            LEFT JOIN users u ON u.id = ce.user_id
            WHERE ce.company_id = %s
        """
        params = [company_id]

        if status_filter and status_filter != 'all':
            sql += " AND ce.status = %s"
            params.append(status_filter)

        sql += " ORDER BY u.full_name"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close(); conn.close()

        return jsonify({
            "employees": [serialize_row(r) for r in rows],
            "total": len(rows)
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_bp.route('/<company_id>/employees', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def add_employee(company_id):
    """Link an Emirati user to a company as an employee.

    Body: { user_id, job_title?, department?, employment_type?, hired_via? }
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Verify user exists
        cur.execute("SELECT id, full_name FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            cur.close(); conn.close()
            return jsonify({"error": "User not found"}), 404

        cur.execute("""
            INSERT INTO company_employees (company_id, user_id, job_title, department, 
                employment_type, hired_via, start_date)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE)
            ON CONFLICT (company_id, user_id) DO UPDATE SET
                job_title = COALESCE(EXCLUDED.job_title, company_employees.job_title),
                department = COALESCE(EXCLUDED.department, company_employees.department),
                status = 'active',
                updated_at = NOW()
            RETURNING id, user_id, job_title, department, status
        """, (
            company_id, user_id,
            data.get('job_title'), data.get('department'),
            data.get('employment_type', 'full_time'),
            data.get('hired_via', 'platform')
        ))
        employee = cur.fetchone()

        # Set user's current_company_id
        cur.execute("UPDATE users SET current_company_id = %s WHERE id = %s", (company_id, user_id))

        conn.commit()
        cur.close(); conn.close()

        return jsonify({
            "status": "added",
            "employee": serialize_row(employee),
            "user_name": user['full_name']
        }), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_bp.route('/<company_id>/employees/<int:user_id>', methods=['DELETE'])
@require_workspace_access('workspace.manage_employees')
def remove_employee(company_id, user_id):
    """Remove (terminate) an employee from a company workspace.

    Cascades side-effects (non-blocking):
      1. Cancel active resource assignments
      2. Remove team membership
      3. Reset Career Dial visibility for NAFIS
      4. Write admin audit log entry
      5. Send notification to the terminated employee
    """
    caller_user_id = None
    try:
        caller_user_id = get_jwt_identity()
    except Exception:
        pass

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ── Core termination ──────────────────────────────────────────────
        cur.execute("""
            UPDATE company_employees SET status = 'terminated', end_date = CURRENT_DATE, updated_at = NOW()
            WHERE company_id = %s AND user_id = %s AND status = 'active'
        """, (company_id, user_id))

        if cur.rowcount == 0:
            cur.close(); conn.close()
            return jsonify({"error": "Employee not found or already terminated"}), 404

        # Clear user's current_company_id
        cur.execute("UPDATE users SET current_company_id = NULL WHERE id = %s AND current_company_id::text = %s", (user_id, company_id))

        # Fetch company name for notification text
        company_name = None
        try:
            cur.execute("SELECT company_name FROM companies WHERE id = %s", (company_id,))
            row = cur.fetchone()
            if row:
                company_name = row['company_name']
        except Exception as e:
            logger.warning(f"Cascade: could not fetch company name for {company_id}: {e}")

        conn.commit()

        # ── Cascade side-effects (each is non-blocking) ──────────────────

        # 1. Cancel active / in-progress resource assignments
        try:
            cur.execute("""
                UPDATE company_resource_assignments
                SET status = 'cancelled', updated_at = NOW()
                WHERE employee_id = %s::text
                  AND company_id = %s::text
                  AND status IN ('assigned', 'in_progress')
            """, (str(user_id), str(company_id)))
            cancelled_count = cur.rowcount
            conn.commit()
            logger.info(f"Cascade[remove_employee]: cancelled {cancelled_count} resource assignments for user {user_id} at company {company_id}")
        except Exception as e:
            conn.rollback()
            logger.warning(f"Cascade[remove_employee]: failed to cancel resource assignments for user {user_id}: {e}")

        # 2. Remove team membership
        try:
            cur.execute("""
                DELETE FROM company_team_members
                WHERE user_id = %s::text AND company_id = %s::text
            """, (str(user_id), str(company_id)))
            removed_memberships = cur.rowcount
            conn.commit()
            logger.info(f"Cascade[remove_employee]: removed {removed_memberships} team memberships for user {user_id} at company {company_id}")
        except Exception as e:
            conn.rollback()
            logger.warning(f"Cascade[remove_employee]: failed to remove team membership for user {user_id}: {e}")

        # 3. Reset Career Dial visibility (columns from P0 migration, may not exist yet)
        try:
            cur.execute("""
                UPDATE users
                SET is_visible = true, available_for_recruitment = true
                WHERE id = %s
            """, (user_id,))
            conn.commit()
            logger.info(f"Cascade[remove_employee]: reset career dial visibility for user {user_id}")
        except Exception as e:
            conn.rollback()
            logger.warning(f"Cascade[remove_employee]: failed to reset career dial for user {user_id} (columns may not exist yet): {e}")

        # 4. Write audit log entry
        try:
            audit_details = json.dumps({
                "company_id": str(company_id),
                "terminated_user_id": user_id,
                "company_name": company_name,
                "action_by": str(caller_user_id) if caller_user_id else None
            })
            cur.execute("""
                INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, details)
                VALUES (%s, 'employee_terminated', 'company_employee', %s, %s)
            """, (str(caller_user_id) if caller_user_id else str(user_id), str(user_id), audit_details))
            conn.commit()
            logger.info(f"Cascade[remove_employee]: audit log written for termination of user {user_id} by {caller_user_id}")
        except Exception as e:
            conn.rollback()
            logger.warning(f"Cascade[remove_employee]: failed to write audit log for user {user_id}: {e}")

        # 5. Send notification to terminated employee
        try:
            notification_title = 'Employment Status Updated'
            notification_content = f"Your employment at {company_name or 'your company'} has ended."
            cur.execute("""
                INSERT INTO notifications (user_id, type, title, content)
                VALUES (%s, 'employment_ended', %s, %s)
            """, (user_id, notification_title, notification_content))
            conn.commit()
            logger.info(f"Cascade[remove_employee]: notification sent to user {user_id} about termination from company {company_id}")
        except Exception as e:
            conn.rollback()
            logger.warning(f"Cascade[remove_employee]: failed to send notification to user {user_id}: {e}")

        cur.close(); conn.close()
        return jsonify({"status": "terminated"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        logger.error(f"remove_employee error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── RESOURCE ASSIGNMENT ─────────────────────────────────────────────────────
# Actors: HR Manager, Recruiter

@workspace_bp.route('/<company_id>/resources', methods=['GET'])
@require_workspace_access('workspace.view', jwt_optional=True)
def list_resources(company_id):
    """List all resource assignments for a company workspace."""
    resource_type = request.args.get('type')
    status_filter = request.args.get('status')
    employee_id = request.args.get('employee_id')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        sql = """
            SELECT cra.*, u.full_name as employee_name, au.full_name as assigned_by_name
            FROM company_resource_assignments cra
            LEFT JOIN company_employees ce ON ce.id = cra.employee_id
            LEFT JOIN users u ON u.id = ce.user_id
            LEFT JOIN users au ON au.id = cra.assigned_by
            WHERE cra.company_id = %s
        """
        params = [company_id]

        if resource_type:
            sql += " AND cra.resource_type = %s"
            params.append(resource_type)
        if status_filter:
            sql += " AND cra.status = %s"
            params.append(status_filter)
        if employee_id:
            sql += " AND cra.employee_id = %s"
            params.append(employee_id)

        sql += " ORDER BY cra.created_at DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close(); conn.close()

        return jsonify({
            "resources": [serialize_row(r) for r in rows],
            "total": len(rows)
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_bp.route('/<company_id>/resources', methods=['POST'])
@require_workspace_access('workspace.assign_resources')
def assign_resource(company_id):
    """Assign a resource (training, cert, mentor, coach) to an employee.

    Body: { employee_id, resource_type, resource_name, resource_id?, due_date?, priority?, notes? }
    """
    data = request.get_json(silent=True) or {}
    employee_id = data.get('employee_id')
    resource_type = data.get('resource_type')
    resource_name = data.get('resource_name')

    if not all([employee_id, resource_type, resource_name]):
        return jsonify({"error": "employee_id, resource_type, and resource_name are required"}), 400

    if resource_type not in ('training', 'certification', 'mentor', 'coach'):
        return jsonify({"error": "resource_type must be one of: training, certification, mentor, coach"}), 400

    assigner_id = None
    try:
        assigner_id = get_jwt_identity()
    except Exception:
        pass
    if not assigner_id:
        assigner_id = data.get('assigned_by')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
            INSERT INTO company_resource_assignments 
                (company_id, employee_id, assigned_by, resource_type, resource_id,
                 resource_name, resource_description, status, priority, due_date, notes, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'assigned', %s, %s, %s, %s)
            RETURNING id, resource_type, resource_name, status, priority
        """, (
            company_id, employee_id, assigner_id, resource_type,
            data.get('resource_id'), resource_name,
            data.get('resource_description', ''),
            data.get('priority', 'normal'),
            data.get('due_date'),
            data.get('notes', ''),
            json.dumps(data.get('metadata', {}))
        ))
        assignment = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        return jsonify({
            "status": "assigned",
            "assignment": serialize_row(assignment)
        }), 201
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_bp.route('/<company_id>/resources/<resource_id>', methods=['PUT'])
@require_workspace_access('workspace.assign_resources')
def update_resource(company_id, resource_id):
    """Update status or details of a resource assignment.

    Body: { status?, progress_percentage?, notes?, due_date? }
    """
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields, params = [], []
        for f in ['status', 'notes', 'priority']:
            if f in data:
                fields.append(f"{f} = %s")
                params.append(data[f])
        if 'progress_percentage' in data:
            fields.append("progress_percentage = %s")
            params.append(data['progress_percentage'])
        if 'due_date' in data:
            fields.append("due_date = %s")
            params.append(data['due_date'])
        if data.get('status') == 'in_progress' and 'started_at' not in data:
            fields.append("started_at = NOW()")
        if data.get('status') == 'completed':
            fields.append("completed_at = NOW()")
            fields.append("progress_percentage = 100")

        if not fields:
            return jsonify({"error": "No fields to update"}), 400

        fields.append("updated_at = NOW()")
        params.extend([resource_id, company_id])
        cur.execute(
            f"UPDATE company_resource_assignments SET {', '.join(fields)} WHERE id = %s AND company_id = %s",
            params
        )

        if cur.rowcount == 0:
            cur.close(); conn.close()
            return jsonify({"error": "Resource assignment not found"}), 404

        conn.commit()
        cur.close(); conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback(); conn.close()
        return jsonify({"error": str(e)}), 500


# ─── EMIRATI EMPLOYEE: MY COMPANY VIEW ───────────────────────────────────────
# Actor: Recruited Emirati (dual access)

@workspace_bp.route('/me/company-view', methods=['GET'])
@jwt_required(optional=True)
def my_company_view():
    """Get the logged-in Emirati's company workspace data —
    their assigned resources, company info, and team contacts.
    """
    user_id = None
    try:
        user_id = get_jwt_identity()
    except Exception:
        pass
    if not user_id:
        user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get employee record(s) — could be employed at multiple companies
        cur.execute("""
            SELECT ce.id as employee_id, ce.company_id, ce.job_title, ce.department,
                   ce.employment_type, ce.start_date, ce.status,
                   c.company_name, c.industry, c.workspace_slug, c.workspace_settings
            FROM company_employees ce
            JOIN companies c ON c.id = ce.company_id
            WHERE ce.user_id = %s AND ce.status = 'active'
            ORDER BY ce.start_date DESC
        """, (user_id,))
        employments = cur.fetchall()

        if not employments:
            cur.close(); conn.close()
            return jsonify({
                "employed": False,
                "companies": [],
                "resources": []
            }), 200

        # Get assigned resources across all companies
        employee_ids = [e['employee_id'] for e in employments]
        placeholders = ','.join(['%s'] * len(employee_ids))
        cur.execute(f"""
            SELECT cra.*, c.company_name,
                   au.full_name as assigned_by_name
            FROM company_resource_assignments cra
            JOIN companies c ON c.id = cra.company_id
            LEFT JOIN users au ON au.id = cra.assigned_by
            WHERE cra.employee_id IN ({placeholders})
            ORDER BY cra.created_at DESC
        """, employee_ids)
        resources = cur.fetchall()

        cur.close(); conn.close()

        return jsonify({
            "employed": True,
            "companies": [serialize_row(e) for e in employments],
            "resources": [serialize_row(r) for r in resources],
            "summary": {
                "total_companies": len(employments),
                "total_resources": len(resources),
                "by_type": {
                    "training": len([r for r in resources if r['resource_type'] == 'training']),
                    "certification": len([r for r in resources if r['resource_type'] == 'certification']),
                    "mentor": len([r for r in resources if r['resource_type'] == 'mentor']),
                    "coach": len([r for r in resources if r['resource_type'] == 'coach']),
                },
                "by_status": {
                    "assigned": len([r for r in resources if r['status'] == 'assigned']),
                    "in_progress": len([r for r in resources if r['status'] == 'in_progress']),
                    "completed": len([r for r in resources if r['status'] == 'completed']),
                }
            }
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── WORKSPACE DASHBOARD STATS ───────────────────────────────────────────────

@workspace_bp.route('/<company_id>/stats', methods=['GET'])
@require_workspace_access('workspace.view', jwt_optional=True)
def workspace_stats(company_id):
    """Get dashboard statistics for a company workspace."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Employee counts
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'active') as active_employees,
                COUNT(*) FILTER (WHERE status = 'on_leave') as on_leave,
                COUNT(*) FILTER (WHERE status = 'terminated') as terminated,
                COUNT(*) as total_employees
            FROM company_employees WHERE company_id = %s
        """, (company_id,))
        emp_stats = cur.fetchone()

        # Resource counts by type and status
        cur.execute("""
            SELECT 
                resource_type,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'assigned') as assigned
            FROM company_resource_assignments WHERE company_id = %s
            GROUP BY resource_type
        """, (company_id,))
        resource_stats = {r['resource_type']: serialize_row(r) for r in cur.fetchall()}

        # Job stats
        cur.execute("""
            SELECT COUNT(*) as total,
                   COUNT(*) FILTER (WHERE status = 'published') as published,
                   COUNT(*) FILTER (WHERE status = 'draft') as draft
            FROM job_postings WHERE company_id::text = %s::text
        """, (company_id,))
        job_stats = cur.fetchone()

        # Emiratization %
        emiratization = 0
        if emp_stats and emp_stats['active_employees'] > 0:
            cur.execute("""
                SELECT COUNT(*) as nationals FROM company_employees ce
                JOIN users u ON u.id = ce.user_id
                WHERE ce.company_id = %s AND ce.status = 'active'
                AND (u.nationality ILIKE '%%emirati%%' OR u.nationality ILIKE '%%uae%%'
                     OR u.is_uae_national = true)
            """, (company_id,))
            nationals = cur.fetchone()
            if nationals:
                emiratization = round(nationals['nationals'] / emp_stats['active_employees'] * 100, 1)

        cur.close(); conn.close()

        return jsonify({
            "employees": serialize_row(emp_stats) if emp_stats else {},
            "resources": resource_stats,
            "jobs": serialize_row(job_stats) if job_stats else {},
            "emiratization_percentage": emiratization
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── LIST ALL WORKSPACES (for Growth Operator) ───────────────────────────────

@workspace_bp.route('/list', methods=['GET'])
@jwt_required()
def list_workspaces():
    """List all provisioned workspaces (for Growth Operators)."""
    caller_id = get_jwt_identity()
    # Verify the caller is a growth operator or platform admin
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur_check = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur_check.execute("SELECT user_type FROM users WHERE id = %s", (caller_id,))
        caller = cur_check.fetchone()
        cur_check.close()
        if not caller or caller['user_type'] not in GROWTH_OPERATOR_ROLES:
            conn.close()
            return jsonify({"error": "Access denied: requires growth operator or admin role"}), 403
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT c.id, c.company_name, c.industry, c.workspace_slug,
                   c.workspace_enabled, c.provisioned_at,
                   u.full_name as admin_name,
                   (SELECT COUNT(*) FROM company_employees ce WHERE ce.company_id = c.id AND ce.status = 'active') as employee_count
            FROM companies c
            LEFT JOIN users u ON u.id = c.workspace_admin_id
            WHERE c.workspace_enabled = TRUE
            ORDER BY c.provisioned_at DESC
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()

        return jsonify({
            "workspaces": [serialize_row(r) for r in rows],
            "total": len(rows)
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── SEARCH EMIRATIS TO ADD AS EMPLOYEES ─────────────────────────────────────

@workspace_bp.route('/<company_id>/search-candidates', methods=['GET'])
@require_workspace_access('workspace.view', jwt_optional=True)
def search_candidates(company_id):
    """Search for Emirati candidates that can be added as employees."""
    q = request.args.get('q', '')
    if len(q) < 2:
        return jsonify({"candidates": []}), 200

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT u.id, u.full_name, u.email, u.phone, u.user_type,
                   CASE WHEN ce.id IS NOT NULL THEN true ELSE false END as already_employee
            FROM users u
            LEFT JOIN company_employees ce ON ce.user_id = u.id 
                AND ce.company_id = %s AND ce.status = 'active'
            WHERE (u.full_name ILIKE %s OR u.email ILIKE %s)
            AND u.user_type IN ('job_seeker', 'candidate')
            ORDER BY u.full_name
            LIMIT 20
        """, (company_id, f"%{q}%", f"%{q}%"))
        rows = cur.fetchall()
        cur.close(); conn.close()

        return jsonify({
            "candidates": [serialize_row(r) for r in rows],
            "total": len(rows)
        }), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500
