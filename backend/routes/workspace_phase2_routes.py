"""
Phase 2 — Workspace Feature Enrichment API Routes
Blueprint prefix: /api/workspace  (extends existing workspace_bp)

New endpoints for:
  Feature Set 1: Emiratisation & Compliance
  Feature Set 2: Document Generation & CSV Import
  Feature Set 3: Engagement Analytics & Mentor Reports
  Feature Set 4: Branding & Resource Vault
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.workspace_middleware import require_workspace_access
import psycopg2
import psycopg2.extras
import os
import json
import csv
import io
import uuid
import logging
from datetime import datetime, date

logger = logging.getLogger(__name__)
workspace_phase2_bp = Blueprint('workspace_phase2', __name__, url_prefix='/api/workspace')

DB_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'workspace')
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    try:
        return psycopg2.connect(DB_URL)
    except Exception as e:
        logger.error(f"Phase2 DB error: {e}")
        return None


def serialize_row(row):
    d = dict(row)
    for k, v in d.items():
        if hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
        elif isinstance(v, (float,)):
            d[k] = float(v)
    return d


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE SET 1: EMIRATISATION & COMPLIANCE
# ═══════════════════════════════════════════════════════════════════════════════

@workspace_phase2_bp.route('/<company_id>/emiratization', methods=['GET'])
@require_workspace_access('workspace.view')
def get_emiratization_dashboard(company_id):
    """Get full Emiratisation compliance dashboard data."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Live headcount breakdown
        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE ce.status = 'active') as total_active,
                COUNT(*) FILTER (WHERE ce.status = 'active' AND (
                    u.nationality ILIKE '%%emirati%%' OR u.nationality ILIKE '%%uae%%'
                    OR u.is_uae_national = true
                )) as emirati_count,
                COUNT(*) FILTER (WHERE ce.status = 'active' AND NOT (
                    COALESCE(u.nationality, '') ILIKE '%%emirati%%'
                    OR COALESCE(u.nationality, '') ILIKE '%%uae%%'
                    OR COALESCE(u.is_uae_national, false) = true
                )) as non_emirati_count
            FROM company_employees ce
            LEFT JOIN users u ON u.id = ce.user_id
            WHERE ce.company_id = %s
        """, (company_id,))
        headcount = cur.fetchone() or {'total_active': 0, 'emirati_count': 0, 'non_emirati_count': 0}

        total = headcount['total_active'] or 0
        emirati = headcount['emirati_count'] or 0
        current_pct = round(emirati / total * 100, 1) if total > 0 else 0

        # 2. Quarterly targets
        cur.execute("""
            SELECT * FROM workspace_emiratization_targets
            WHERE company_id = %s
            ORDER BY year DESC, quarter DESC
            LIMIT 8
        """, (company_id,))
        targets = [serialize_row(r) for r in cur.fetchall()]

        # 3. Get workspace settings for target %
        cur.execute("""
            SELECT workspace_settings FROM companies WHERE id = %s
        """, (company_id,))
        company = cur.fetchone()
        target_pct = 80.0
        if company and company.get('workspace_settings'):
            try:
                settings = company['workspace_settings'] if isinstance(company['workspace_settings'], dict) else json.loads(company['workspace_settings'])
                target_pct = settings.get('emiratization_target', 80.0)
            except Exception:
                pass

        # 4. Hiring trend (last 6 months)
        cur.execute("""
            SELECT
                DATE_TRUNC('month', ce.start_date) as month,
                COUNT(*) as hires,
                COUNT(*) FILTER (WHERE u.is_uae_national = true
                    OR u.nationality ILIKE '%%emirati%%'
                    OR u.nationality ILIKE '%%uae%%') as emirati_hires
            FROM company_employees ce
            LEFT JOIN users u ON u.id = ce.user_id
            WHERE ce.company_id = %s
              AND ce.start_date >= NOW() - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', ce.start_date)
            ORDER BY month
        """, (company_id,))
        hiring_trend = [serialize_row(r) for r in cur.fetchall()]

        # 5. Salary support projection (simplified)
        monthly_support_per_emirati = 5000  # AED baseline NAFIS support
        projected_annual_support = emirati * monthly_support_per_emirati * 12
        gap_to_target = max(0, round(target_pct / 100 * total) - emirati) if total > 0 else 0

        cur.close()
        conn.close()

        return jsonify({
            "headcount": {
                "total": total,
                "emirati": emirati,
                "non_emirati": headcount['non_emirati_count'] or 0,
                "current_percentage": current_pct,
                "target_percentage": target_pct,
                "gap_to_target": gap_to_target,
                "status": "above_target" if current_pct >= target_pct else (
                    "near_target" if current_pct >= target_pct - 10 else "below_target"
                )
            },
            "targets": targets,
            "hiring_trend": hiring_trend,
            "salary_support": {
                "monthly_per_emirati": monthly_support_per_emirati,
                "projected_annual": projected_annual_support,
                "current_monthly_total": emirati * monthly_support_per_emirati,
            }
        }), 200
    except Exception as e:
        conn.close()
        logger.error(f"Emiratization dashboard error: {e}")
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/emiratization/targets', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def set_emiratization_target(company_id):
    """Set or update a quarterly Emiratisation target."""
    data = request.get_json(silent=True) or {}
    year = data.get('year', datetime.now().year)
    quarter = data.get('quarter', (datetime.now().month - 1) // 3 + 1)

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO workspace_emiratization_targets
                (company_id, year, quarter, target_percentage, mohre_deadline,
                 salary_support_amount, grant_projections, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (company_id, year, quarter) DO UPDATE SET
                target_percentage = EXCLUDED.target_percentage,
                mohre_deadline = EXCLUDED.mohre_deadline,
                salary_support_amount = EXCLUDED.salary_support_amount,
                grant_projections = EXCLUDED.grant_projections,
                notes = EXCLUDED.notes,
                updated_at = NOW()
            RETURNING *
        """, (
            company_id, year, quarter,
            data.get('target_percentage', 80.0),
            data.get('mohre_deadline'),
            data.get('salary_support_amount'),
            json.dumps(data.get('grant_projections', {})),
            data.get('notes', '')
        ))
        target = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"target": serialize_row(target)}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/emiratization/targets/<target_id>', methods=['PUT'])
@require_workspace_access('workspace.manage_employees')
def update_emiratization_target(company_id, target_id):
    """Update actuals for a quarterly target."""
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        fields, params = [], []
        for f in ['actual_percentage', 'total_headcount', 'emirati_headcount',
                   'salary_support_amount', 'compliance_status', 'notes']:
            if f in data:
                fields.append(f"{f} = %s")
                params.append(data[f])
        if 'grant_projections' in data:
            fields.append("grant_projections = %s")
            params.append(json.dumps(data['grant_projections']))

        if not fields:
            return jsonify({"error": "No fields to update"}), 400

        fields.append("updated_at = NOW()")
        params.extend([target_id, company_id])
        cur.execute(
            f"UPDATE workspace_emiratization_targets SET {', '.join(fields)} WHERE id = %s AND company_id = %s",
            params
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE SET 2: DOCUMENT GENERATION & CSV IMPORT
# ═══════════════════════════════════════════════════════════════════════════════

@workspace_phase2_bp.route('/<company_id>/documents/templates', methods=['GET'])
@require_workspace_access('workspace.view')
def list_document_templates(company_id):
    """List available document templates (global defaults + company custom)."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT * FROM workspace_document_templates
            WHERE company_id = %s OR (is_default = TRUE AND company_id IS NULL)
            ORDER BY is_default DESC, template_name
        """, (company_id,))
        templates = [serialize_row(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"templates": templates}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/documents/templates', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def create_document_template(company_id):
    """Create a custom document template for the company."""
    data = request.get_json(silent=True) or {}
    if not data.get('template_name') or not data.get('html_template'):
        return jsonify({"error": "template_name and html_template are required"}), 400

    creator_id = None
    try:
        creator_id = get_jwt_identity()
    except Exception:
        pass

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO workspace_document_templates
                (company_id, template_name, template_type, html_template, metadata, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            company_id, data['template_name'],
            data.get('template_type', 'custom'),
            data['html_template'],
            json.dumps(data.get('metadata', {})),
            creator_id
        ))
        template = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"template": serialize_row(template)}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/documents/generate', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def generate_document(company_id):
    """Generate a document from a template + employee data.

    Body: { template_id, employee_id, extra_data?: {...} }
    Returns the merged HTML (PDF generation done client-side or via follow-up).
    """
    data = request.get_json(silent=True) or {}
    template_id = data.get('template_id')
    employee_id = data.get('employee_id')

    if not template_id or not employee_id:
        return jsonify({"error": "template_id and employee_id are required"}), 400

    generator_id = None
    try:
        generator_id = get_jwt_identity()
    except Exception:
        pass

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get template
        cur.execute("SELECT * FROM workspace_document_templates WHERE id = %s", (template_id,))
        template = cur.fetchone()
        if not template:
            cur.close()
            conn.close()
            return jsonify({"error": "Template not found"}), 404

        # Get employee + company data
        cur.execute("""
            SELECT ce.*, u.full_name as employee_name, u.email, u.phone, u.nationality,
                   c.company_name, c.industry as company_industry
            FROM company_employees ce
            JOIN users u ON u.id = ce.user_id
            JOIN companies c ON c.id = ce.company_id
            WHERE ce.id = %s AND ce.company_id = %s
        """, (employee_id, company_id))
        employee = cur.fetchone()
        if not employee:
            # Try by user_id
            cur.execute("""
                SELECT ce.*, u.full_name as employee_name, u.email, u.phone, u.nationality,
                       c.company_name, c.industry as company_industry
                FROM company_employees ce
                JOIN users u ON u.id = ce.user_id
                JOIN companies c ON c.id = ce.company_id
                WHERE ce.user_id = %s AND ce.company_id = %s AND ce.status = 'active'
                LIMIT 1
            """, (employee_id, company_id))
            employee = cur.fetchone()

        if not employee:
            cur.close()
            conn.close()
            return jsonify({"error": "Employee not found"}), 404

        # Build template variables
        emp = serialize_row(employee)
        extra = data.get('extra_data', {})
        template_vars = {
            'company_name': emp.get('company_name', ''),
            'company_industry': emp.get('company_industry', ''),
            'employee_name': emp.get('employee_name', ''),
            'employee_id': str(emp.get('id', '')),
            'job_title': emp.get('job_title', 'Employee'),
            'department': emp.get('department', 'General'),
            'start_date': emp.get('start_date', ''),
            'email': emp.get('email', ''),
            'phone': emp.get('phone', ''),
            'nationality': emp.get('nationality', ''),
            'issue_date': date.today().strftime('%B %d, %Y'),
            **extra
        }

        # Merge template
        html = template['html_template']
        for key, value in template_vars.items():
            html = html.replace('{{' + key + '}}', str(value or ''))

        # Log generation
        cur.execute("""
            INSERT INTO workspace_generated_documents
                (company_id, template_id, employee_id, document_type, document_data, generated_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            company_id, template_id, employee.get('user_id') or employee_id,
            template['template_type'], json.dumps(template_vars), generator_id
        ))
        doc_record = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "document_id": str(doc_record['id']),
            "html": html,
            "template_vars": template_vars,
            "template_name": template['template_name']
        }), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"Document generation error: {e}")
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/documents/history', methods=['GET'])
@require_workspace_access('workspace.view')
def document_history(company_id):
    """List previously generated documents."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT gd.*, dt.template_name, u.full_name as generated_by_name,
                   eu.full_name as employee_name
            FROM workspace_generated_documents gd
            LEFT JOIN workspace_document_templates dt ON dt.id = gd.template_id
            LEFT JOIN users u ON u.id = gd.generated_by
            LEFT JOIN users eu ON eu.id = gd.employee_id
            WHERE gd.company_id = %s
            ORDER BY gd.created_at DESC
            LIMIT 50
        """, (company_id,))
        docs = [serialize_row(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"documents": docs}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── CSV IMPORT ──────────────────────────────────────────────────────────────

# Column auto-detect heuristics
CSV_FIELD_MAPPINGS = {
    'vacancies': {
        'title': ['title', 'job_title', 'position', 'role', 'vacancy_title', 'job name'],
        'department': ['department', 'dept', 'division', 'team'],
        'location': ['location', 'city', 'office', 'workplace'],
        'salary_min': ['salary_min', 'min_salary', 'salary_from', 'starting_salary'],
        'salary_max': ['salary_max', 'max_salary', 'salary_to', 'ending_salary'],
        'description': ['description', 'job_description', 'details', 'summary'],
        'requirements': ['requirements', 'qualifications', 'skills', 'experience'],
        'employment_type': ['employment_type', 'type', 'contract_type', 'job_type'],
    },
    'employees': {
        'full_name': ['full_name', 'name', 'employee_name', 'first_name'],
        'email': ['email', 'email_address', 'e-mail'],
        'phone': ['phone', 'phone_number', 'mobile', 'contact'],
        'job_title': ['job_title', 'title', 'position', 'role'],
        'department': ['department', 'dept', 'division'],
        'start_date': ['start_date', 'join_date', 'hire_date', 'joining_date'],
    }
}


def auto_detect_columns(headers, upload_type):
    """Auto-detect column mappings based on header name matching."""
    mapping = {}
    field_map = CSV_FIELD_MAPPINGS.get(upload_type, {})
    normalized_headers = [h.strip().lower().replace(' ', '_') for h in headers]

    for db_field, possible_names in field_map.items():
        for i, header in enumerate(normalized_headers):
            if header in possible_names:
                mapping[headers[i]] = db_field
                break
    return mapping


@workspace_phase2_bp.route('/<company_id>/csv/upload', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def csv_upload(company_id):
    """Upload a CSV file and auto-detect column mappings.

    Form data: file (CSV), upload_type ('vacancies' or 'employees')
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    upload_type = request.form.get('upload_type', 'vacancies')

    if upload_type not in ('vacancies', 'employees', 'team_structure'):
        return jsonify({"error": "upload_type must be: vacancies, employees, or team_structure"}), 400

    uploader_id = None
    try:
        uploader_id = get_jwt_identity()
    except Exception:
        pass

    try:
        # Read CSV content
        content = file.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(content))
        headers = reader.fieldnames or []
        rows = list(reader)

        if not headers:
            return jsonify({"error": "CSV file has no headers"}), 400

        # Auto-detect mappings
        suggested_mapping = auto_detect_columns(headers, upload_type)

        # Save file
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)

        # Create upload record
        conn = get_db()
        if not conn:
            return jsonify({"error": "Database unavailable"}), 503
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO workspace_csv_uploads
                (company_id, upload_type, original_filename, file_path, column_mapping,
                 row_count, status, uploaded_by)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s)
            RETURNING id, upload_type, original_filename, row_count, status
        """, (
            company_id, upload_type, file.filename, file_path,
            json.dumps(suggested_mapping), len(rows), uploader_id
        ))
        upload = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        # Return preview
        preview_rows = rows[:5] if len(rows) >= 5 else rows

        return jsonify({
            "upload": serialize_row(upload),
            "headers": headers,
            "suggested_mapping": suggested_mapping,
            "preview_rows": preview_rows,
            "total_rows": len(rows)
        }), 200
    except Exception as e:
        logger.error(f"CSV upload error: {e}")
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/csv/map', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def csv_process(company_id):
    """Accept column mapping and process the CSV import.

    Body: { upload_id, column_mapping: { csv_col: db_field, ... } }
    """
    data = request.get_json(silent=True) or {}
    upload_id = data.get('upload_id')
    mapping = data.get('column_mapping', {})

    if not upload_id:
        return jsonify({"error": "upload_id is required"}), 400

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get upload record
        cur.execute("SELECT * FROM workspace_csv_uploads WHERE id = %s AND company_id = %s", (upload_id, company_id))
        upload = cur.fetchone()
        if not upload:
            cur.close()
            conn.close()
            return jsonify({"error": "Upload not found"}), 404

        # Update mapping
        cur.execute("""
            UPDATE workspace_csv_uploads SET column_mapping = %s, status = 'processing'
            WHERE id = %s
        """, (json.dumps(mapping), upload_id))
        conn.commit()

        # Read the CSV
        with open(upload['file_path'], 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        success = 0
        errors = []
        reverse_mapping = {v: k for k, v in mapping.items()}

        for i, row in enumerate(rows):
            try:
                if upload['upload_type'] == 'vacancies':
                    title = row.get(reverse_mapping.get('title', ''), '').strip()
                    if not title:
                        errors.append({"row": i + 2, "error": "Missing job title"})
                        continue

                    cur.execute("""
                        INSERT INTO job_postings
                            (company_id, title, department, location, description,
                             requirements, employment_type, status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft', NOW())
                    """, (
                        company_id,
                        title,
                        row.get(reverse_mapping.get('department', ''), ''),
                        row.get(reverse_mapping.get('location', ''), ''),
                        row.get(reverse_mapping.get('description', ''), ''),
                        row.get(reverse_mapping.get('requirements', ''), ''),
                        row.get(reverse_mapping.get('employment_type', ''), 'full_time'),
                    ))
                    success += 1

                elif upload['upload_type'] == 'employees':
                    name = row.get(reverse_mapping.get('full_name', ''), '').strip()
                    email = row.get(reverse_mapping.get('email', ''), '').strip()
                    if not name:
                        errors.append({"row": i + 2, "error": "Missing employee name"})
                        continue

                    # Find or create user
                    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                    user = cur.fetchone()
                    if not user and email:
                        cur.execute("SELECT pg_advisory_xact_lock(784000)")  # Lock ID for EID generation
                        cur.execute("""
                            SELECT MAX(CAST(SUBSTRING(id FROM 8 FOR 7) AS INTEGER)) AS max_seq
                            FROM users WHERE id LIKE '7840000%'
                        """)
                        max_row = cur.fetchone()
                        max_seq = max_row['max_seq'] if max_row and max_row.get('max_seq') is not None else 0
                        synthetic_id = f"7840000{max_seq + 1:07d}0"

                        cur.execute("""
                            INSERT INTO users (id, full_name, email, phone, user_type, created_at)
                            VALUES (%s, %s, %s, %s, 'candidate', NOW())
                            RETURNING id
                        """, (synthetic_id, name, email, row.get(reverse_mapping.get('phone', ''), '')))
                        user = cur.fetchone()

                    if user:
                        cur.execute("""
                            INSERT INTO company_employees
                                (company_id, user_id, job_title, department, start_date, status)
                            VALUES (%s, %s, %s, %s, COALESCE(%s::date, CURRENT_DATE), 'active')
                            ON CONFLICT (company_id, user_id) DO UPDATE SET
                                job_title = COALESCE(EXCLUDED.job_title, company_employees.job_title),
                                department = COALESCE(EXCLUDED.department, company_employees.department),
                                status = 'active'
                        """, (
                            company_id, user['id'],
                            row.get(reverse_mapping.get('job_title', ''), ''),
                            row.get(reverse_mapping.get('department', ''), ''),
                            row.get(reverse_mapping.get('start_date', ''), None) or None,
                        ))
                        success += 1
                    else:
                        errors.append({"row": i + 2, "error": "Could not create user (missing email)"})

            except Exception as row_err:
                errors.append({"row": i + 2, "error": str(row_err)[:100]})

        # Update upload record
        cur.execute("""
            UPDATE workspace_csv_uploads SET
                success_count = %s, error_count = %s, error_log = %s,
                status = 'completed', completed_at = NOW()
            WHERE id = %s
        """, (success, len(errors), json.dumps(errors[:100]), upload_id))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "status": "completed",
            "success_count": success,
            "error_count": len(errors),
            "errors": errors[:20]  # Return first 20 errors
        }), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"CSV process error: {e}")
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/csv/history', methods=['GET'])
@require_workspace_access('workspace.view')
def csv_history(company_id):
    """List past CSV upload sessions."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT cu.*, u.full_name as uploaded_by_name
            FROM workspace_csv_uploads cu
            LEFT JOIN users u ON u.id = cu.uploaded_by
            WHERE cu.company_id = %s
            ORDER BY cu.created_at DESC LIMIT 30
        """, (company_id,))
        uploads = [serialize_row(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"uploads": uploads}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE SET 3: ENGAGEMENT ANALYTICS & MENTOR REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

@workspace_phase2_bp.route('/<company_id>/analytics/engagement', methods=['GET'])
@require_workspace_access('workspace.view')
def engagement_analytics(company_id):
    """Get aggregated engagement analytics for the workspace."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Overall employee engagement summary
        cur.execute("""
            SELECT
                ce.id as employee_record_id,
                ce.user_id,
                u.full_name,
                ce.job_title,
                ce.department,
                ce.start_date,
                COUNT(DISTINCT cra.id) FILTER (WHERE cra.status = 'completed') as completed_resources,
                COUNT(DISTINCT cra.id) FILTER (WHERE cra.status = 'in_progress') as in_progress_resources,
                COUNT(DISTINCT cra.id) as total_resources,
                COUNT(DISTINCT ee.id) as engagement_events,
                MAX(ee.created_at) as last_activity
            FROM company_employees ce
            LEFT JOIN users u ON u.id = ce.user_id
            LEFT JOIN company_resource_assignments cra ON cra.employee_id = ce.id
            LEFT JOIN workspace_engagement_events ee ON ee.employee_id = ce.user_id AND ee.company_id = ce.company_id
            WHERE ce.company_id = %s AND ce.status = 'active'
            GROUP BY ce.id, ce.user_id, u.full_name, ce.job_title, ce.department, ce.start_date
            ORDER BY u.full_name
        """, (company_id,))
        employees = [serialize_row(r) for r in cur.fetchall()]

        # Compute engagement scores
        for emp in employees:
            total_r = emp.get('total_resources', 0) or 0
            completed = emp.get('completed_resources', 0) or 0
            in_progress = emp.get('in_progress_resources', 0) or 0
            events = emp.get('engagement_events', 0) or 0

            # Score formula: weighted combination
            resource_score = (completed * 3 + in_progress * 1) / max(total_r * 3, 1) * 60
            activity_score = min(events / 10.0, 1.0) * 40
            emp['engagement_score'] = round(resource_score + activity_score, 1)

            # Determine risk level
            last = emp.get('last_activity')
            if emp['engagement_score'] < 30 and (not last):
                emp['risk_level'] = 'high'
            elif emp['engagement_score'] < 50:
                emp['risk_level'] = 'medium'
            else:
                emp['risk_level'] = 'low'

        # Aggregated stats
        scores = [e['engagement_score'] for e in employees]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        high_risk = [e for e in employees if e.get('risk_level') == 'high']
        top_performers = sorted(employees, key=lambda x: x['engagement_score'], reverse=True)[:5]

        # Daily activity trend (last 30 days)
        cur.execute("""
            SELECT DATE(created_at) as day, COUNT(*) as events
            FROM workspace_engagement_events
            WHERE company_id = %s AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY day
        """, (company_id,))
        daily_trend = [serialize_row(r) for r in cur.fetchall()]

        cur.close()
        conn.close()

        return jsonify({
            "summary": {
                "total_employees": len(employees),
                "average_engagement_score": avg_score,
                "high_risk_count": len(high_risk),
                "top_performer_score": top_performers[0]['engagement_score'] if top_performers else 0,
            },
            "employees": employees,
            "top_performers": top_performers,
            "flight_risks": high_risk,
            "daily_trend": daily_trend
        }), 200
    except Exception as e:
        conn.close()
        logger.error(f"Engagement analytics error: {e}")
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/analytics/retention-risks', methods=['GET'])
@require_workspace_access('workspace.view')
def retention_risks(company_id):
    """Get employees flagged as flight risks."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT ce.user_id, u.full_name, ce.job_title, ce.department, ce.start_date,
                   COUNT(cra.id) FILTER (WHERE cra.status = 'completed') as completed,
                   COUNT(cra.id) as total_assigned,
                   MAX(ee.created_at) as last_engagement
            FROM company_employees ce
            LEFT JOIN users u ON u.id = ce.user_id
            LEFT JOIN company_resource_assignments cra ON cra.employee_id = ce.id
            LEFT JOIN workspace_engagement_events ee ON ee.employee_id = ce.user_id AND ee.company_id = %s
            WHERE ce.company_id = %s AND ce.status = 'active'
            GROUP BY ce.user_id, u.full_name, ce.job_title, ce.department, ce.start_date
            HAVING COUNT(cra.id) FILTER (WHERE cra.status = 'completed') * 1.0 / GREATEST(COUNT(cra.id), 1) < 0.3
                OR MAX(ee.created_at) < NOW() - INTERVAL '14 days'
                OR MAX(ee.created_at) IS NULL
            ORDER BY u.full_name
        """, (company_id, company_id))
        risks = [serialize_row(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"risks": risks, "total": len(risks)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── Mentor Reports ─────────────────────────────────────────────────────────

@workspace_phase2_bp.route('/<company_id>/mentor-reports', methods=['GET'])
@require_workspace_access('workspace.view')
def list_mentor_reports(company_id):
    """List mentor/coach progress reports."""
    employee_id = request.args.get('employee_id')
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = """
            SELECT mr.*, u.full_name as mentor_name, eu.full_name as employee_name
            FROM workspace_mentor_reports mr
            LEFT JOIN users u ON u.id = mr.mentor_id
            LEFT JOIN users eu ON eu.id = mr.employee_id
            WHERE mr.company_id = %s
        """
        params = [company_id]
        if employee_id:
            sql += " AND mr.employee_id = %s"
            params.append(employee_id)
        sql += " ORDER BY mr.created_at DESC LIMIT 50"
        cur.execute(sql, params)
        reports = [serialize_row(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"reports": reports}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/mentor-reports', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def submit_mentor_report(company_id):
    """Submit a mentor/coach progress report."""
    data = request.get_json(silent=True) or {}
    if not data.get('employee_id') or not data.get('summary'):
        return jsonify({"error": "employee_id and summary are required"}), 400

    mentor_id = None
    try:
        mentor_id = get_jwt_identity()
    except Exception:
        pass
    if not mentor_id:
        mentor_id = data.get('mentor_id')

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO workspace_mentor_reports
                (company_id, resource_assignment_id, employee_id, mentor_id,
                 report_type, summary, rating, strengths, areas_for_improvement,
                 recommendations, is_visible_to_employee)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            company_id,
            data.get('resource_assignment_id'),
            data['employee_id'],
            mentor_id,
            data.get('report_type', 'progress'),
            data['summary'],
            data.get('rating'),
            json.dumps(data.get('strengths', [])),
            json.dumps(data.get('areas_for_improvement', [])),
            data.get('recommendations', ''),
            data.get('is_visible_to_employee', False)
        ))
        report = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"report": serialize_row(report)}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE SET 4: BRANDING & RESOURCE VAULT
# ═══════════════════════════════════════════════════════════════════════════════

@workspace_phase2_bp.route('/<company_id>/branding', methods=['GET'])
@require_workspace_access('workspace.view')
def get_branding(company_id):
    """Get workspace branding configuration."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT workspace_branding FROM companies WHERE id = %s", (company_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        branding = row.get('workspace_branding') or {} if row else {}
        return jsonify({"branding": branding}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/branding', methods=['PUT'])
@require_workspace_access('workspace.manage_employees')
def update_branding(company_id):
    """Update workspace branding (logo, colors, tagline)."""
    data = request.get_json(silent=True) or {}
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE companies SET workspace_branding = %s WHERE id = %s
        """, (json.dumps(data), company_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "updated", "branding": data}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


# ─── Resource Vault ──────────────────────────────────────────────────────────

@workspace_phase2_bp.route('/<company_id>/vault', methods=['GET'])
@require_workspace_access('workspace.view')
def list_vault_files(company_id):
    """List files in the workspace resource vault."""
    category = request.args.get('category')
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = """
            SELECT rv.*, u.full_name as uploaded_by_name
            FROM workspace_resource_vault rv
            LEFT JOIN users u ON u.id = rv.uploaded_by
            WHERE rv.company_id = %s
        """
        params = [company_id]
        if category:
            sql += " AND rv.category = %s"
            params.append(category)
        sql += " ORDER BY rv.created_at DESC"
        cur.execute(sql, params)
        files = [serialize_row(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"files": files, "total": len(files)}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/vault', methods=['POST'])
@require_workspace_access('workspace.manage_employees')
def upload_vault_file(company_id):
    """Upload a file to the workspace resource vault."""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    category = request.form.get('category', 'general')
    description = request.form.get('description', '')
    is_public = request.form.get('is_public', 'false').lower() == 'true'
    tags = request.form.get('tags', '[]')

    uploader_id = None
    try:
        uploader_id = get_jwt_identity()
    except Exception:
        pass

    try:
        # Save file
        vault_dir = os.path.join(UPLOAD_DIR, 'vault', str(company_id))
        os.makedirs(vault_dir, exist_ok=True)
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1] if file.filename else ''
        file_path = os.path.join(vault_dir, f"{file_id}{ext}")
        file.save(file_path)
        file_size = os.path.getsize(file_path)

        conn = get_db()
        if not conn:
            return jsonify({"error": "Database unavailable"}), 503
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO workspace_resource_vault
                (company_id, file_name, file_type, file_size_bytes, file_path,
                 category, description, is_public, tags, uploaded_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            company_id, file.filename, file.content_type, file_size,
            file_path, category, description, is_public,
            tags if isinstance(tags, str) else json.dumps(tags),
            uploader_id
        ))
        vault_file = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"file": serialize_row(vault_file)}), 201
    except Exception as e:
        logger.error(f"Vault upload error: {e}")
        return jsonify({"error": str(e)}), 500


@workspace_phase2_bp.route('/<company_id>/vault/<file_id>', methods=['DELETE'])
@require_workspace_access('workspace.manage_employees')
def delete_vault_file(company_id, file_id):
    """Delete a file from the resource vault."""
    conn = get_db()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            DELETE FROM workspace_resource_vault WHERE id = %s AND company_id = %s
            RETURNING file_path
        """, (file_id, company_id))
        deleted = cur.fetchone()
        if not deleted:
            cur.close()
            conn.close()
            return jsonify({"error": "File not found"}), 404

        # Remove physical file
        if deleted['file_path'] and os.path.exists(deleted['file_path']):
            try:
                os.remove(deleted['file_path'])
            except Exception:
                pass

        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "deleted"}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500
