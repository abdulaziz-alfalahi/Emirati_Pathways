"""
G26: Demand Signal Routes — Growth→NAFIS Integration

Flask Blueprint for NAFIS demand signal management.
Provides endpoints for querying companies with published jobs,
matching candidate counts, and bulk-invite functionality.
"""

from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import json
import logging

from backend.db import get_db_connection
try:
    from backend.auth.access_control import require_roles, OPERATOR_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, OPERATOR_ROLES

logger = logging.getLogger(__name__)

demand_signal_bp = Blueprint('demand_signal', __name__, url_prefix='/api/nafis')


def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """Execute a database query with proper connection handling."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(query, params)

        result = None
        if fetch_one:
            result = cur.fetchone()
            if result:
                result = dict(result)
        elif fetch_all:
            result = [dict(row) for row in cur.fetchall()]

        if commit:
            conn.commit()

        cur.close()
        return result
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        raise e
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def _ensure_demand_signals_table():
    """Create the demand_signals table if it doesn't exist."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS demand_signals (
                id SERIAL PRIMARY KEY,
                company_id TEXT NOT NULL UNIQUE,
                company_name TEXT,
                job_count INTEGER DEFAULT 1,
                sector TEXT,
                emirate TEXT,
                matching_candidates INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_demand_signals_company ON demand_signals(company_id)")
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.warning(f"G26: Could not ensure demand_signals table: {e}")


# Ensure table exists on module load
try:
    _ensure_demand_signals_table()
except Exception:
    pass


# ─────────────────────────────────────────────
# GET /api/nafis/demand-signals
# ─────────────────────────────────────────────
@demand_signal_bp.route('/demand-signals', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_demand_signals():
    """
    Query companies with published jobs and matching candidate counts.
    Supports pagination and filtering by emirate and sector.

    Query params:
        page (int): Page number, default 1
        limit (int): Results per page, default 25
        emirate (str): Filter by emirate
        sector (str): Filter by sector
        search (str): Search by company name
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 25))
        emirate = request.args.get('emirate', '').strip()
        sector = request.args.get('sector', '').strip()
        search = request.args.get('search', '').strip()
        offset = (page - 1) * limit

        # Build the query dynamically
        where_clauses = ["jp.status = 'published'"]
        params = []

        if emirate:
            where_clauses.append("jp.emirate ILIKE %s")
            params.append(f"%{emirate}%")

        if sector:
            where_clauses.append("(jp.department ILIKE %s OR jp.metadata->>'sector' ILIKE %s)")
            params.append(f"%{sector}%")
            params.append(f"%{sector}%")

        if search:
            # company_id is a uuid FK since migration 015 (#14) — search the
            # company NAME, which is what this always pretended to do.
            where_clauses.append("c.company_name ILIKE %s")
            params.append(f"%{search}%")

        where_sql = " AND ".join(where_clauses)

        # Main query: aggregate published jobs by company
        query = f"""
            SELECT
                jp.company_id,
                COALESCE(c.company_name, 'Unknown Company') AS company_name,
                COUNT(DISTINCT jp.id) AS job_count,
                MAX(jp.department) AS sector,
                MAX(jp.emirate) AS emirate,
                MIN(jp.published_at) AS first_published_at,
                MAX(jp.published_at) AS last_published_at,
                (
                    SELECT COUNT(*)
                    FROM users u
                    WHERE u.role = 'candidate'
                      AND u.is_active = true
                      AND u.is_visible = true
                ) AS matching_candidates_count
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id = c.id
            WHERE {where_sql}
            GROUP BY jp.company_id, c.company_name
            ORDER BY COUNT(DISTINCT jp.id) DESC, MIN(jp.published_at) DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(query, tuple(params))
        signals = [dict(row) for row in cur.fetchall()]

        # Serialize datetime fields
        for s in signals:
            if s.get('first_published_at'):
                s['first_published_at'] = s['first_published_at'].isoformat()
            if s.get('last_published_at'):
                s['last_published_at'] = s['last_published_at'].isoformat()

        # Get total count for pagination
        count_params = []
        count_where_clauses = ["jp.status = 'published'"]

        if emirate:
            count_where_clauses.append("jp.emirate ILIKE %s")
            count_params.append(f"%{emirate}%")
        if sector:
            count_where_clauses.append("(jp.department ILIKE %s OR jp.metadata->>'sector' ILIKE %s)")
            count_params.append(f"%{sector}%")
            count_params.append(f"%{sector}%")
        if search:
            count_where_clauses.append("c.company_name ILIKE %s")
            count_params.append(f"%{search}%")

        count_where_sql = " AND ".join(count_where_clauses)
        count_query = f"""
            SELECT COUNT(DISTINCT jp.company_id) AS total
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id = c.id
            WHERE {count_where_sql}
        """
        cur.execute(count_query, tuple(count_params))
        total_row = cur.fetchone()
        total = total_row['total'] if total_row else 0

        # Summary stats
        cur.execute("""
            SELECT
                COUNT(DISTINCT jp.company_id) AS total_companies,
                COUNT(DISTINCT jp.id) AS total_jobs,
                (SELECT COUNT(*) FROM users WHERE role = 'candidate' AND is_active = true AND is_visible = true) AS total_candidates
            FROM job_postings jp
            WHERE jp.status = 'published'
        """)
        summary_row = cur.fetchone()
        summary = dict(summary_row) if summary_row else {
            'total_companies': 0,
            'total_jobs': 0,
            'total_candidates': 0,
        }

        # Count demand signal entries
        try:
            cur.execute("SELECT COUNT(*) AS cnt FROM demand_signals")
            ds_count = cur.fetchone()
            summary['total_demand_signals'] = ds_count['cnt'] if ds_count else 0
        except Exception:
            summary['total_demand_signals'] = total

        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'signals': signals,
            'total': total,
            'page': page,
            'limit': limit,
            'summary': summary,
        }), 200

    except Exception as e:
        logger.error(f"G26: Error fetching demand signals: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# GET /api/nafis/demand-signals/filter-options
# ─────────────────────────────────────────────
@demand_signal_bp.route('/demand-signals/filter-options', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_filter_options():
    """Return distinct values for emirate and sector filter dropdowns."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
            SELECT DISTINCT emirate FROM job_postings
            WHERE status = 'published' AND emirate IS NOT NULL AND emirate != ''
            ORDER BY emirate
        """)
        emirates = [row['emirate'] for row in cur.fetchall()]

        cur.execute("""
            SELECT DISTINCT department FROM job_postings
            WHERE status = 'published' AND department IS NOT NULL AND department != ''
            ORDER BY department
        """)
        sectors = [row['department'] for row in cur.fetchall()]

        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'emirates': emirates,
            'sectors': sectors,
        }), 200

    except Exception as e:
        logger.error(f"G26: Error fetching filter options: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# POST /api/nafis/demand-signals/<company_id>/bulk-invite
# ─────────────────────────────────────────────
@demand_signal_bp.route('/demand-signals/<company_id>/bulk-invite', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def bulk_invite(company_id):
    """
    Bulk invite matching candidates for a company's open positions.

    Accepts: { "candidate_ids": [...] }
    Creates invitation records for batch invite.
    Returns success count.
    """
    try:
        data = request.get_json()
        candidate_ids = data.get('candidate_ids', [])

        if not candidate_ids:
            return jsonify({'success': False, 'error': 'No candidates selected'}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Ensure the bulk_invitations table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS bulk_invitations (
                id SERIAL PRIMARY KEY,
                company_id TEXT NOT NULL,
                candidate_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                invited_by TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(company_id, candidate_id)
            )
        """)
        conn.commit()

        success_count = 0
        failed_count = 0
        errors = []

        # Get operator identity if available
        invited_by = None
        try:
            from flask_jwt_extended import get_jwt_identity
            invited_by = get_jwt_identity()
        except Exception:
            pass

        for cid in candidate_ids:
            try:
                cur.execute("""
                    INSERT INTO bulk_invitations (company_id, candidate_id, invited_by, status)
                    VALUES (%s, %s, %s, 'pending')
                    ON CONFLICT (company_id, candidate_id)
                    DO UPDATE SET status = 'pending', created_at = NOW()
                """, (company_id, str(cid), invited_by))
                success_count += 1
            except Exception as inv_err:
                failed_count += 1
                errors.append(str(inv_err))

        conn.commit()

        # Also create notifications for each invited candidate
        for cid in candidate_ids:
            try:
                cur.execute("""
                    INSERT INTO notifications (user_id, type, title, content, metadata)
                    VALUES (%s, 'bulk_invite', %s, %s, %s)
                """, (
                    str(cid),
                    f"New opportunity from {company_id}",
                    f"You have been invited to explore job opportunities at {company_id}.",
                    json.dumps({'company_id': company_id, 'source': 'nafis_demand_signal'})
                ))
            except Exception as notif_err:
                logger.warning(f"G26: Notification creation failed for candidate {cid}: {notif_err}")

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f"Invited {success_count} candidates ({failed_count} failed)",
            'success_count': success_count,
            'failed_count': failed_count,
            'errors': errors[:5],  # Limit error details
        }), 200

    except Exception as e:
        logger.error(f"G26: Bulk invite error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# GET /api/nafis/demand-signals/<company_id>/candidates
# ─────────────────────────────────────────────
@demand_signal_bp.route('/demand-signals/<company_id>/candidates', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_matching_candidates(company_id):
    """
    Get matching candidates for a company's job requirements.
    Returns visible job seekers who could match the company's open positions.
    """
    try:
        limit = int(request.args.get('limit', 50))

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get candidates from the job_seeker pool
        cur.execute("""
            SELECT
                u.id,
                COALESCE(u.full_name, CONCAT_WS(' ', u.first_name, u.last_name), u.email) AS display_name,
                u.email,
                u.education_level,
                u.experience_years,
                u.emirate,
                u.skills,
                u.is_uae_national
            FROM users u
            WHERE u.role = 'candidate'
              AND u.is_active = true
              AND u.is_visible = true
            ORDER BY u.experience_years DESC NULLS LAST
            LIMIT %s
        """, (limit,))

        candidates = [dict(row) for row in cur.fetchall()]

        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'candidates': candidates,
            'count': len(candidates),
        }), 200

    except Exception as e:
        logger.error(f"G26: Error fetching matching candidates: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
