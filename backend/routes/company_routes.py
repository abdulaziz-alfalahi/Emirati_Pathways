"""
Company Management Routes for Emirati Journey Platform

Persisted against the real `companies` table (issue #97). This blueprint
previously kept every company in a module-level dict (`companies_db = {}`),
so operator registrations from the Growth dashboard looked successful and
vanished on every backend restart — while every read endpoint served from
an always-empty dict.

Column mapping note: the live `companies` table has no name_arabic or
company_size columns, so those request fields are accepted but not stored;
`company_type` is stored as `business_type` and `trade_license_number` as
`trade_license_no`.
"""

from flask import Blueprint, request, jsonify
import logging
import psycopg2
import psycopg2.extras
import uuid as uuid_lib

try:
    from backend.auth.access_control import require_roles, OPERATOR_ROLES
    from backend.company_identity import find_company_id, display_company_name
    from backend.db_utils import get_db, execute_query
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, OPERATOR_ROLES
    from company_identity import find_company_id, display_company_name
    from db_utils import get_db, execute_query

# Create blueprint
company_bp = Blueprint('companies', __name__, url_prefix='/api/companies')

# Initialize logger
logger = logging.getLogger(__name__)


def _company_to_dict(row):
    """Serialize a companies row (RealDictRow) for API responses."""
    return {
        'id': str(row['id']),
        'name': row.get('name') or row.get('company_name'),
        'company_name': row.get('company_name'),
        'description': row.get('description'),
        'industry': row.get('industry'),
        'business_type': row.get('business_type'),
        'trade_license_no': row.get('trade_license_no'),
        'emirate': row.get('emirate'),
        'city': row.get('city'),
        'phone': row.get('phone'),
        'website': row.get('website'),
        'contact_email': row.get('contact_email'),
        'is_verified': bool(row.get('is_verified')),
        'lead_source': row.get('lead_source'),
        'verified_at': row['verified_at'].isoformat() if row.get('verified_at') else None,
    }


_COMPANY_COLUMNS = """
    id, name, company_name, description, industry, business_type,
    trade_license_no, emirate, city, phone, website, contact_email,
    is_verified, lead_source, verified_at
"""


@company_bp.route('/create', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def create_company():
    """
    Register a new company (operator-only).

    Persists to the companies table. Company identity is enforced (#99):
    if the trade licence or normalised name already belongs to a company,
    this returns 409 with the existing id instead of forking a duplicate.
    """
    data = request.get_json(silent=True) or {}

    for field in ('name', 'industry'):
        if not data.get(field):
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400

    name = display_company_name(data['name'])
    trade_license = (data.get('trade_license_number') or data.get('trade_license_no') or '').strip()

    locations = data.get('locations') or []
    headquarters = next(
        (loc for loc in locations if loc.get('is_headquarters')),
        locations[0] if locations else {},
    )
    contact = data.get('contact') or {}

    conn = get_db()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 503

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            existing_id = find_company_id(cur, name, trade_license or None)
            if existing_id:
                return jsonify({
                    'success': False,
                    'message': 'A company with this name or trade licence already exists',
                    'data': {'company_id': str(existing_id)},
                }), 409

            cur.execute(f"""
                INSERT INTO companies (
                    name, company_name, description, industry, business_type,
                    trade_license_no, emirate, city, phone, website,
                    contact_email, is_verified, lead_source
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE, 'operator_manual')
                RETURNING {_COMPANY_COLUMNS}
            """, (
                name, name,
                data.get('description', ''),
                data.get('industry'),
                data.get('company_type') or data.get('business_type'),
                trade_license or None,
                headquarters.get('emirate'),
                headquarters.get('city'),
                contact.get('phone') or data.get('phone'),
                contact.get('website') or data.get('website'),
                contact.get('primary_email') or data.get('contact_email'),
            ))
            company = cur.fetchone()
            conn.commit()
    except psycopg2.errors.UniqueViolation:
        # Race with a concurrent insert — migration 011's unique indexes hold.
        conn.rollback()
        return jsonify({
            'success': False,
            'message': 'A company with this name or trade licence already exists',
        }), 409
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"Error creating company: {e}")
        return jsonify({'success': False, 'message': 'Failed to create company'}), 500

    logger.info(f"Company created: {company['id']} ({name})")
    return jsonify({
        'success': True,
        'message': 'Company created successfully',
        'data': {
            'company_id': str(company['id']),
            'company': _company_to_dict(company),
        }
    }), 201


@company_bp.route('/<company_id>', methods=['GET'])
def get_company(company_id):
    """
    Get company details by ID
    Public endpoint for basic info
    """
    try:
        uuid_lib.UUID(company_id)
    except ValueError:
        return jsonify({'success': False, 'message': 'Company not found'}), 404

    row = execute_query(
        f"SELECT {_COMPANY_COLUMNS} FROM companies WHERE id = %s",
        (company_id,), fetch_one=True,
    )
    if not row:
        return jsonify({'success': False, 'message': 'Company not found'}), 404

    return jsonify({'success': True, 'data': {'company': _company_to_dict(row)}}), 200


@company_bp.route('/<company_id>', methods=['PUT'])
def update_company(company_id):
    """
    RETIRED (issue #97). This edited an in-memory dict — updates looked
    successful and vanished on restart. Company records are maintained
    through the operator flows (growth import/registration and
    POST /api/growth/companies/<id>/verify).
    """
    return jsonify({
        'success': False,
        'message': 'Company updates moved to the operator API.',
    }), 410


@company_bp.route('/<company_id>/users', methods=['POST'])
def add_company_user(company_id):
    """
    RETIRED (issue #97). This wrote memberships into an in-memory dict the
    ACL never read. Team membership is managed by the HR team endpoints,
    which write company_team_members — the store the ACL actually reads.
    """
    return jsonify({
        'success': False,
        'message': 'Team membership moved to the HR team API.',
        'team_endpoint': '/api/hr/team',
    }), 410


@company_bp.route('/<company_id>/users/<user_id>', methods=['DELETE'])
def remove_company_user(company_id, user_id):
    """RETIRED (issue #97) — see add_company_user."""
    return jsonify({
        'success': False,
        'message': 'Team membership moved to the HR team API.',
        'team_endpoint': '/api/hr/team',
    }), 410


@company_bp.route('/<company_id>/verify', methods=['POST'])
def verify_company(company_id):
    """
    RETIRED (issue #96). This wrote a "verification" into an in-memory dict —
    it looked successful, checked no privilege (the admin check was a TODO),
    and vanished on restart while the real gate column, companies.is_verified,
    stayed untouched. The real endpoint is operator-gated and persists:
    POST /api/growth/companies/<company_id>/verify.

    (The original handler also took no `company_id` argument, so Flask raised
    TypeError and every authenticated call 500'd — the fake success below it
    was unreachable all along.)
    """
    return jsonify({
        'success': False,
        'message': 'Company verification moved to the operator API.',
        'operator_endpoint': f'/api/growth/companies/{company_id}/verify',
    }), 410


@company_bp.route('/search', methods=['GET'])
def search_companies():
    """
    Search companies with filters
    Public endpoint
    """
    query = request.args.get('q', '').strip()
    emirate = request.args.get('emirate')
    industry = request.args.get('industry')
    business_type = request.args.get('company_type') or request.args.get('business_type')
    is_verified = request.args.get('is_verified')
    page = max(request.args.get('page', 1, type=int), 1)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    where = ["TRUE"]
    params = []
    if query:
        where.append("(company_name ILIKE %s OR description ILIKE %s)")
        params.extend([f"%{query}%", f"%{query}%"])
    if emirate:
        where.append("emirate = %s")
        params.append(emirate)
    if industry:
        where.append("industry = %s")
        params.append(industry)
    if business_type:
        where.append("business_type = %s")
        params.append(business_type)
    if is_verified is not None and is_verified != '':
        where.append("is_verified = %s")
        params.append(is_verified.lower() == 'true')

    where_sql = " AND ".join(where)

    count_row = execute_query(
        f"SELECT COUNT(*) AS total FROM companies WHERE {where_sql}",
        tuple(params), fetch_one=True,
    )
    total = count_row['total'] if count_row else 0

    rows = execute_query(f"""
        SELECT {_COMPANY_COLUMNS} FROM companies
        WHERE {where_sql}
        ORDER BY is_verified DESC, company_name ASC
        LIMIT %s OFFSET %s
    """, tuple(params) + (per_page, (page - 1) * per_page)) or []

    return jsonify({
        'success': True,
        'data': {
            'companies': [_company_to_dict(r) for r in rows],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page,
            },
            'filters_applied': {
                'query': query,
                'emirate': emirate,
                'industry': industry,
                'company_type': business_type,
                'is_verified': is_verified,
            }
        }
    }), 200


@company_bp.route('/stats', methods=['GET'])
def get_company_stats():
    """
    Get platform company statistics
    Public endpoint
    """
    totals = execute_query("""
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE is_verified) AS verified
        FROM companies
    """, fetch_one=True) or {'total': 0, 'verified': 0}

    emirate_rows = execute_query("""
        SELECT emirate, COUNT(*) AS n FROM companies
        WHERE emirate IS NOT NULL AND emirate <> ''
        GROUP BY emirate
    """) or []
    industry_rows = execute_query("""
        SELECT industry, COUNT(*) AS n FROM companies
        WHERE industry IS NOT NULL AND industry <> ''
        GROUP BY industry
    """) or []

    return jsonify({
        'success': True,
        'data': {
            'total_companies': totals['total'],
            'verified_companies': totals['verified'],
            'emirate_distribution': {r['emirate']: r['n'] for r in emirate_rows},
            'industry_distribution': {r['industry']: r['n'] for r in industry_rows},
        }
    }), 200


@company_bp.route('/user/<user_id>', methods=['GET'])
def get_user_companies(user_id):
    """
    RETIRED (issue #97). This filtered an in-memory dict that was always
    empty, using membership data nothing ever wrote. The caller's company
    context comes from company_team_members via the workspace middleware.
    """
    return jsonify({
        'success': False,
        'message': 'User-company membership is served by the workspace API.',
    }), 410


@company_bp.route('/progression', methods=['GET'])
def get_company_progression():
    """
    Get career progression details for a company.
    Query parameters:
        name: Name of the company (case-insensitive, e.g. "Google", "Microsoft")
        company_id: UUID of the company
    """
    name = request.args.get('name')
    company_id = request.args.get('company_id')

    if not name and not company_id:
        return jsonify({
            'success': False,
            'message': 'Either company name or company_id is required'
        }), 400

    from backend.db_utils import execute_query

    # Query progression
    row = None
    if company_id:
        row = execute_query("""
            SELECT c.id as company_id, c.name, cp.overview, cp.overview_ar,
                   cp.career_path, cp.promotion_criteria, cp.emiratisation_support
            FROM company_career_progressions cp
            JOIN companies c ON c.id = cp.company_id
            WHERE cp.company_id = %s
        """, (company_id,), fetch_one=True)
    elif name:
        # Normalize name: e.g. "Amazon (AWS)" -> "Amazon"
        normalized_name = name.split('(')[0].strip()
        row = execute_query("""
            SELECT c.id as company_id, c.name, cp.overview, cp.overview_ar,
                   cp.career_path, cp.promotion_criteria, cp.emiratisation_support
            FROM company_career_progressions cp
            JOIN companies c ON c.id = cp.company_id
            WHERE c.name ILIKE %s OR c.company_name ILIKE %s
        """, (normalized_name, normalized_name), fetch_one=True)

        if not row:
            # Try fuzzy/prefix match
            row = execute_query("""
                SELECT c.id as company_id, c.name, cp.overview, cp.overview_ar,
                       cp.career_path, cp.promotion_criteria, cp.emiratisation_support
                FROM company_career_progressions cp
                JOIN companies c ON c.id = cp.company_id
                WHERE c.name ILIKE %s OR c.company_name ILIKE %s
                   OR %s ILIKE CONCAT(c.name, '%%')
            """, (f"%{normalized_name}%", f"%{normalized_name}%", normalized_name), fetch_one=True)

    if not row:
        return jsonify({
            'success': False,
            'message': 'Career progression details not found for this company'
        }), 404

    # Ensure JSON structures are parsed properly
    import json
    for field in ('career_path', 'promotion_criteria', 'emiratisation_support'):
        if isinstance(row.get(field), str):
            try:
                row[field] = json.loads(row[field])
            except:
                pass

    return jsonify({
        'success': True,
        'data': {
            'company_id': row['company_id'],
            'name': row['name'],
            'overview': row['overview'],
            'overview_ar': row['overview_ar'],
            'career_path': row['career_path'],
            'promotion_criteria': row['promotion_criteria'],
            'emiratisation_support': row['emiratisation_support']
        }
    }), 200
