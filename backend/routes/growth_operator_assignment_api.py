"""
Growth Operator Domain Assignment API Routes

This module provides API endpoints for administrators to assign Growth Operators
to specific domains (Candidate, Company, Education, Assessment, Mentorship, Community).
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from functools import wraps

from backend.db import get_db_connection

try:
    from backend.auth.access_control import (role_for_domain, domain_for_role,
                                              GROWTH_OPERATOR_DOMAIN_ROLES)
except ImportError:                          # pragma: no cover — dual root
    from auth.access_control import (role_for_domain, domain_for_role,
                                     GROWTH_OPERATOR_DOMAIN_ROLES)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
growth_operator_assignment_bp = Blueprint('growth_operator_assignment_api', __name__, url_prefix='/api/admin/growth-operators')

# Valid Growth Operator Domains — imported, NOT redefined.
#
# This list and the authorisation role set have to agree, and when they were
# maintained separately they did not: this module granted growth_operator_<domain>
# while access_control had never heard of those names, so the grant worked and
# the guard refused. One definition, in the module that does the authorising.
try:
    from backend.auth.access_control import GROWTH_OPERATOR_DOMAINS
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import GROWTH_OPERATOR_DOMAINS

VALID_DOMAINS = list(GROWTH_OPERATOR_DOMAINS)

# Domain metadata
DOMAIN_METADATA = {
    'candidate': {
        'label': 'Candidate Operations',
        'description': 'Manage candidate acquisition, engagement, and profile quality',
        'icon': 'Users',
        'permissions': ['onboard_candidates', 'manage_candidate_engagement', 'view_analytics']
    },
    'company': {
        'label': 'Company Operations',
        'description': 'Onboard companies and manage employer engagement',
        'icon': 'Building',
        'permissions': ['onboard_companies', 'manage_company_engagement', 'view_analytics']
    },
    'education': {
        'label': 'Education Operations',
        'description': 'Partner with schools, universities, and training institutes',
        'icon': 'GraduationCap',
        'permissions': ['onboard_education', 'manage_education_partnerships', 'view_analytics']
    },
    'assessment': {
        'label': 'Assessment Operations',
        'description': 'Manage assessment centers and certification bodies',
        'icon': 'ClipboardCheck',
        'permissions': ['onboard_assessment', 'manage_assessment_centers', 'view_analytics']
    },
    'mentorship': {
        'label': 'Mentorship Operations',
        'description': 'Onboard mentors and manage coaching programs',
        'icon': 'UserCheck',
        'permissions': ['onboard_mentors', 'manage_mentorship_programs', 'view_analytics']
    },
    'community': {
        'label': 'Community Operations',
        'description': 'Moderate communities and manage events',
        'icon': 'MessageCircle',
        'permissions': ['moderate_communities', 'manage_community_events', 'view_analytics']
    },
    'monitoring': {
        'label': 'Monitoring Operations',
        'description': 'Monitor platform operations and performance metrics',
        'icon': 'Activity',
        'permissions': ['view_monitoring', 'manage_alerts', 'view_analytics']
    }
}

def merge_domain_roles(existing, domains):
    """The person's secondary roles after this screen assigns `domains`.

    THIS SCREEN OWNS THE DOMAIN ROLES AND NOTHING ELSE.

    It used to REPLACE secondary_roles with the domain-derived list, destroying
    every other role the person held — assessor, coach, call_center_agent,
    career_services_operator, anything granted from the Users tab. Measured on
    the live database 2026-08-31: 24 of the 28 people holding secondary roles
    would have lost at least one on the next save here, and one person holding
    twenty-two would have been cut to a single role.

    That is the "duplicate locations for role assignment" report
    (fb_1787816290) in its most damaging form: two screens write one field, and
    this one silently overwrote the other's work — which is exactly what
    "I added Samir to the Company Growth role, but he told me he wasn't granted
    access" looks like from the other side.

    So it reconciles WITHIN the domain namespace: domain roles no longer
    assigned come off, the assigned ones go on, and a role this screen cannot
    grant is never touched. Order is preserved and duplicates collapse, so a
    save is idempotent.
    """
    all_domain_roles = set(GROWTH_OPERATOR_DOMAIN_ROLES.values())
    kept = [r for r in (existing or [])
            if isinstance(r, str) and r not in all_domain_roles]
    granted = [r for r in (role_for_domain(d) for d in (domains or [])) if r]
    return list(dict.fromkeys(kept + granted))


def execute_query(query, params=None, fetch_one=False, fetch_all=True, return_id=False):
    """Execute a database query with error handling"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            if return_id:
                result = cursor.fetchone()
                conn.commit()
                return result.get('id') if result else None
            elif fetch_one:
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

def ensure_tables_exist():
    """Ensure required tables exist"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cursor:
            # Create growth_operator_assignments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS growth_operator_assignments (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(15) NOT NULL,
                    domain VARCHAR(50) NOT NULL,
                    assigned_by VARCHAR(15),
                    is_primary BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, domain)
                )
            """)
            
            # Create index for faster lookups
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_go_assignments_user 
                ON growth_operator_assignments(user_id)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_go_assignments_domain 
                ON growth_operator_assignments(domain)
            """)
            
            # Create growth_operator_activity_log table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS growth_operator_activity_log (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(15) NOT NULL,
                    domain VARCHAR(50),
                    action VARCHAR(100),
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Migrate existing tables from INTEGER to VARCHAR(15) if needed
            try:
                cursor.execute("ALTER TABLE growth_operator_assignments ALTER COLUMN user_id TYPE VARCHAR(15) USING user_id::varchar")
                cursor.execute("ALTER TABLE growth_operator_assignments ALTER COLUMN assigned_by TYPE VARCHAR(15) USING assigned_by::varchar")
                cursor.execute("ALTER TABLE growth_operator_activity_log ALTER COLUMN user_id TYPE VARCHAR(15) USING user_id::varchar")
            except Exception:
                conn.rollback()
                conn = get_db_connection()
                cursor = conn.cursor()
            
            conn.commit()
            logger.info("Growth Operator assignment tables ensured")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        conn.rollback()
    finally:
        conn.close()

# Initialize tables (non-fatal — tables will be created on first request if this fails)
try:
    ensure_tables_exist()
except Exception as _init_err:
    logger.warning(f"Could not ensure growth_operator tables at import time: {_init_err}")

# SECURITY (was a no-op that let anyone rewrite users.role and enumerate operator PII):
# every endpoint here manages Growth-Operator privileges under /api/admin/*, so require
# an authenticated ADMIN caller (role resolved across primary + secondary_roles).
try:
    from backend.auth.access_control import require_roles, ADMIN_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, ADMIN_ROLES

# Named for what it does. It was called `optional_auth`, which reads as
# "signing in is optional" on endpoints that GRANT OPERATOR ROLES — the exact
# misreading that produced the no-op auth findings in the 2026-07-15 audit.
admin_only = require_roles(*ADMIN_ROLES)
optional_auth = admin_only          # retained: the decorator is applied by this
                                    # name in eight places below.


# =====================================================
# DOMAIN CONFIGURATION ENDPOINTS
# =====================================================

@growth_operator_assignment_bp.route('/domains', methods=['GET'])
@optional_auth
def get_available_domains():
    """
    Get list of available Growth Operator domains with metadata
    """
    try:
        domains = []
        for domain_key, metadata in DOMAIN_METADATA.items():
            # Get count of operators assigned to this domain
            count_query = """
                SELECT COUNT(*) as count 
                FROM growth_operator_assignments 
                WHERE domain = %s AND is_active = true
            """
            count_result = execute_query(count_query, (domain_key,), fetch_one=True)
            operator_count = count_result.get('count', 0) if count_result else 0
            
            domains.append({
                'id': domain_key,
                'key': domain_key,
                'label': metadata['label'],
                'description': metadata['description'],
                'icon': metadata['icon'],
                'permissions': metadata['permissions'],
                'operatorCount': operator_count
            })
        
        return jsonify({
            'success': True,
            'data': domains
        })
        
    except Exception as e:
        logger.error(f"Failed to get domains: {e}")
        return jsonify({
            'success': True,
            'data': [
                {'id': k, 'key': k, **v, 'operatorCount': 0} 
                for k, v in DOMAIN_METADATA.items()
            ]
        })


# =====================================================
# GROWTH OPERATOR LISTING ENDPOINTS
# =====================================================

@growth_operator_assignment_bp.route('', methods=['GET'])
@optional_auth
def list_growth_operators():
    """
    Get list of all Growth Operators with their domain assignments
    
    Query params:
        domain: Filter by specific domain
        status: Filter by active/inactive
        page: Page number
        per_page: Items per page
    """
    try:
        domain = request.args.get('domain')
        status = request.args.get('status')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        offset = (page - 1) * per_page
        
        # Get users who hold ANY operator role — primary OR secondary — plus
        # anyone with a domain assignment. The old primary-role-only filter
        # (role LIKE 'growth_operator%') hid every operator granted via
        # secondary_roles, which is how the persona model assigns them
        # (feedback fb_1785728963: "Operators tab does not show the assigned
        # operators" — 1 of 12 real operators was listed).
        query = """
            SELECT DISTINCT
                u.id,
                u.email,
                COALESCE(u.full_name, CONCAT(u.first_name, ' ', u.last_name)) AS full_name,
                u.first_name,
                u.last_name,
                u.role,
                u.secondary_roles,
                u.is_active,
                u.created_at,
                u.last_login
            FROM users u
            LEFT JOIN growth_operator_assignments goa ON u.id::text = goa.user_id::text AND goa.is_active = true
            WHERE u.role ILIKE '%%operator%%'
               OR u.secondary_roles::text ILIKE '%%operator%%'
               OR goa.user_id IS NOT NULL
        """
        params = []
        
        if status == 'active':
            query += " AND u.is_active = true"
        elif status == 'inactive':
            query += " AND u.is_active = false"
        
        query += " ORDER BY full_name LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        operators = execute_query(query, tuple(params))
        
        # Get domain assignments for each operator
        result = []
        for op in (operators or []):
            assignments_query = """
                SELECT domain, is_primary, is_active, created_at
                FROM growth_operator_assignments
                WHERE user_id = %s AND is_active = true
            """
            assignments = execute_query(assignments_query, (op['id'],))
            
            assignment_domains = set(a['domain'] for a in (assignments or []))
            
            # Only fall back to role/secondary_roles derivation if NO assignments exist
            # Once an admin has saved assignments, the table is the source of truth
            if assignment_domains:
                all_domains = list(assignment_domains)
            else:
                # Derive domains from user's primary role and secondary_roles as fallback
                role_domains = set()
                user_role = op.get('role', '')
                # domain_for_role understands both the established role names
                # and the retired growth_operator_<domain> spelling, so nobody
                # drops off this screen mid-sweep.
                derived_domain = domain_for_role(user_role)
                if derived_domain in VALID_DOMAINS:
                    role_domains.add(derived_domain)
                
                # Check secondary_roles for additional growth operator roles
                secondary_roles_query = """
                    SELECT secondary_roles FROM users WHERE id = %s
                """
                sr_result = execute_query(secondary_roles_query, (op['id'],), fetch_one=True)
                if sr_result and sr_result.get('secondary_roles'):
                    for sr in sr_result['secondary_roles']:
                        derived = domain_for_role(sr) if isinstance(sr, str) else None
                        if derived in VALID_DOMAINS:
                            role_domains.add(derived)
                
                all_domains = list(role_domains)
            
            # Filter by domain if specified
            if domain:
                if domain not in all_domains:
                    continue
            
            # Serialize datetime fields to ISO strings for JSON compatibility
            op_data = {}
            for key, value in op.items():
                if isinstance(value, datetime):
                    op_data[key] = value.isoformat()
                else:
                    op_data[key] = value
            
            serialized_assignments = []
            for a in (assignments or []):
                sa = {}
                for key, value in a.items():
                    sa[key] = value.isoformat() if isinstance(value, datetime) else value
                serialized_assignments.append(sa)
            
            # If no table assignments, add synthetic ones from derived domains
            if not assignment_domains:
                user_role = op.get('role', '')
                for rd in all_domains:
                    serialized_assignments.append({
                        'domain': rd,
                        'is_primary': (rd == domain_for_role(user_role)),
                        'is_active': True,
                        'created_at': op_data.get('created_at', '')
                    })
            
            result.append({
                **op_data,
                'domains': all_domains,
                'assignments': serialized_assignments,
                'primaryDomain': next(
                    (a['domain'] for a in (assignments or []) if a.get('is_primary')),
                    # Fallback: derive from primary role
                    domain_for_role(op.get('role', ''))
                )
            })
        
        # Get total count
        count_query = """
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN growth_operator_assignments goa ON u.id::text = goa.user_id::text AND goa.is_active = true
            WHERE u.role ILIKE '%%operator%%'
               OR u.secondary_roles::text ILIKE '%%operator%%'
               OR goa.user_id IS NOT NULL
        """
        total_result = execute_query(count_query, fetch_one=True)
        total = total_result.get('total', 0) if total_result else 0
        
        return jsonify({
            'success': True,
            'data': {
                'operators': result,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to list growth operators: {e}")
        return jsonify({
            'success': True,
            'data': {
                'operators': [],
                'total': 0,
                'page': 1,
                'per_page': 20,
                'total_pages': 0
            }
        })


@growth_operator_assignment_bp.route('/<user_id>', methods=['GET'])
@optional_auth
def get_growth_operator(user_id):
    """Get details of a specific Growth Operator including domain assignments"""
    try:
        # Get user details
        user_query = """
            SELECT id, username, email, full_name, role, is_active, created_at, last_login
            FROM users
            WHERE id = %s AND role LIKE 'growth_operator%%'
        """
        user = execute_query(user_query, (user_id,), fetch_one=True)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Growth Operator not found'
            }), 404
        
        # Get domain assignments
        assignments_query = """
            SELECT 
                goa.id,
                goa.domain,
                goa.is_primary,
                goa.is_active,
                goa.notes,
                goa.created_at,
                u.full_name as assigned_by_name
            FROM growth_operator_assignments goa
            LEFT JOIN users u ON goa.assigned_by = u.id
            WHERE goa.user_id = %s
            ORDER BY goa.is_primary DESC, goa.created_at DESC
        """
        assignments = execute_query(assignments_query, (user_id,))
        
        # Get activity stats
        activity_query = """
            SELECT 
                domain,
                COUNT(*) as action_count,
                MAX(created_at) as last_activity
            FROM growth_operator_activity_log
            WHERE user_id = %s
            GROUP BY domain
        """
        activity_stats = execute_query(activity_query, (user_id,))
        
        return jsonify({
            'success': True,
            'data': {
                **user,
                'assignments': assignments or [],
                'domains': [a['domain'] for a in (assignments or []) if a.get('is_active')],
                'primaryDomain': next((a['domain'] for a in (assignments or []) if a.get('is_primary')), None),
                'activityStats': activity_stats or []
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to get growth operator: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve growth operator details'
        }), 500


# =====================================================
# DOMAIN ASSIGNMENT ENDPOINTS
# =====================================================

@growth_operator_assignment_bp.route('/<user_id>/domains', methods=['POST'])
@optional_auth
def assign_domains(user_id):
    """
    Assign domains to a Growth Operator
    
    Body:
        domains: List of domain keys to assign
        primary_domain: Optional primary domain
        notes: Optional notes
    """
    try:
        data = request.get_json()
        domains = data.get('domains', [])
        primary_domain = data.get('primary_domain', data.get('primaryDomain'))
        notes = data.get('notes', '')
        # Use the verified identity (set by require_roles), not a client-supplied value.
        assigned_by = getattr(g, 'user_id', None) or data.get('assigned_by')
        
        logger.info(f"assign_domains called: user_id={user_id}, domains={domains}, primary={primary_domain}")
        
        # Validate domains
        invalid_domains = [d for d in domains if d not in VALID_DOMAINS]
        if invalid_domains:
            return jsonify({
                'success': False,
                'message': f'Invalid domains: {invalid_domains}. Valid domains are: {VALID_DOMAINS}'
            }), 400
        
        # Verify user exists
        user_query = "SELECT id, role FROM users WHERE id = %s"
        user = execute_query(user_query, (user_id,), fetch_one=True)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        try:
            with conn.cursor() as cursor:
                # Ensure the assignments table exists
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS growth_operator_assignments (
                        id SERIAL PRIMARY KEY,
                        user_id VARCHAR(15) NOT NULL,
                        domain VARCHAR(50) NOT NULL,
                        assigned_by VARCHAR(15),
                        is_primary BOOLEAN DEFAULT FALSE,
                        is_active BOOLEAN DEFAULT TRUE,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, domain)
                    )
                """)
                
                # Also ensure the activity log table exists
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS growth_operator_activity_log (
                        id SERIAL PRIMARY KEY,
                        user_id VARCHAR(15) NOT NULL,
                        domain VARCHAR(50),
                        action VARCHAR(100),
                        details JSONB,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Deactivate all existing assignments
                cursor.execute("""
                    UPDATE growth_operator_assignments 
                    SET is_active = false, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (user_id,))
                
                # Create new assignments
                for domain in domains:
                    is_primary = (domain == primary_domain)
                    
                    cursor.execute("""
                        INSERT INTO growth_operator_assignments 
                        (user_id, domain, assigned_by, is_primary, is_active, notes)
                        VALUES (%s, %s, %s, %s, true, %s)
                        ON CONFLICT (user_id, domain) 
                        DO UPDATE SET 
                            is_primary = EXCLUDED.is_primary,
                            is_active = true,
                            assigned_by = EXCLUDED.assigned_by,
                            notes = EXCLUDED.notes,
                            updated_at = CURRENT_TIMESTAMP
                    """, (user_id, domain, assigned_by, is_primary, notes))
                
                # Update secondary_roles to match the new domain assignments
                # This keeps the users table in sync with the assignments table.
                #
                # Each domain grants the role the platform ALREADY HAS for it —
                # "company" grants employer_relations, the same role the Users
                # tab calls "Company Onboarding Operator". This screen used to
                # grant growth_operator_<domain> instead, so somebody assigned
                # here showed as an operator on this page and as nothing on the
                # Users tab. Owner, 2026-08-27: keep the established names.
                # THIS SCREEN OWNS THE DOMAIN ROLES AND NOTHING ELSE.
                #
                # It used to REPLACE secondary_roles with the domain-derived list,
                # which silently destroyed every other role the person held —
                # assessor, coach, call_center_agent, career_services_operator,
                # anything granted from the Users tab. Measured on the live
                # database 2026-08-31: 24 of the 28 people holding secondary
                # roles would have lost at least one on the next save here, and
                # one person holding twenty-two would have been cut to a single
                # role. That is the "duplicate locations for role assignment"
                # report (fb_1787816290) in its most damaging form: two screens
                # write one field and this one overwrote the other's work.
                #
                # So reconcile WITHIN the domain namespace and leave the rest
                # untouched: drop domain roles no longer assigned, add the ones
                # now assigned, and never touch a role this screen cannot grant.
                import json as _json
                cursor.execute(
                    "SELECT COALESCE(secondary_roles, '[]'::jsonb) FROM users WHERE id = %s",
                    (user_id,))
                _row = cursor.fetchone()
                _existing = _row[0] if _row else []
                if isinstance(_existing, str):
                    try:
                        _existing = _json.loads(_existing)
                    except Exception:
                        _existing = []
                _existing = [r for r in (_existing or []) if isinstance(r, str)]

                new_secondary_roles = merge_domain_roles(_existing, domains)
                try:
                    cursor.execute("SAVEPOINT update_secondary_roles")
                    # users.secondary_roles is jsonb on the live DB — the old
                    # ::text[] cast silently failed inside this savepoint, so
                    # domain assignments never reached the users table (P3/C5).
                    cursor.execute("""
                        UPDATE users SET secondary_roles = %s::jsonb
                        WHERE id = %s
                    """, (_json.dumps(new_secondary_roles), user_id))
                    cursor.execute("RELEASE SAVEPOINT update_secondary_roles")
                    logger.info(f"Updated secondary_roles for user {user_id}: {new_secondary_roles}")
                except Exception as sr_err:
                    logger.warning(f"Could not update secondary_roles: {sr_err}")
                    try:
                        cursor.execute("ROLLBACK TO SAVEPOINT update_secondary_roles")
                    except Exception:
                        pass
                
                # Log the assignment (non-critical)
                try:
                    cursor.execute("SAVEPOINT activity_log")
                    cursor.execute("""
                        INSERT INTO growth_operator_activity_log 
                        (user_id, domain, action, details)
                        VALUES (%s, %s, 'domain_assignment', %s)
                    """, (user_id, primary_domain or (domains[0] if domains else None), 
                          json.dumps({'domains': domains, 'assigned_by': assigned_by})))
                    cursor.execute("RELEASE SAVEPOINT activity_log")
                except Exception as log_err:
                    logger.warning(f"Could not log assignment: {log_err}")
                    try:
                        cursor.execute("ROLLBACK TO SAVEPOINT activity_log")
                    except Exception:
                        pass
                
                conn.commit()
                
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Successfully assigned {len(domains)} domain(s) to Growth Operator',
            'data': {
                'user_id': user_id,
                'domains': domains,
                'primary_domain': primary_domain
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to assign domains: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to assign domains'
        }), 500


def _revoke_domain_role(user_id, domain, role):
    """Drop `role` from secondary_roles — unless another live domain grants it.

    Two domains never share a role today, but the check costs nothing and means
    a future one cannot silently revoke a role somebody still holds.
    """
    others = execute_query(
        "SELECT domain FROM growth_operator_assignments "
        " WHERE user_id = %s AND domain <> %s AND is_active = true",
        (user_id, domain)) or []
    if any(role_for_domain(row.get('domain')) == role for row in others):
        return
    try:
        # secondary_roles is jsonb on the live DB. A ::text[] cast fails here —
        # the mistake that made domain assignments invisible on the Users tab
        # in the first place (P3/C5).
        execute_query("""
            UPDATE users
               SET secondary_roles = COALESCE((
                     SELECT jsonb_agg(r) FROM jsonb_array_elements_text(
                         CASE WHEN jsonb_typeof(secondary_roles) = 'array'
                              THEN secondary_roles ELSE '[]'::jsonb END) AS r
                      WHERE r <> %s), '[]'::jsonb),
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = %s
        """, (role, user_id), fetch_all=False)
    except Exception as exc:
        logger.error(f"Domain {domain} deactivated for {user_id} but role "
                     f"{role} could not be revoked: {exc}")


@growth_operator_assignment_bp.route('/<user_id>/domains/<domain>', methods=['DELETE'])
@optional_auth
def remove_domain(user_id, domain):
    """Remove a specific domain assignment from a Growth Operator"""
    try:
        if domain not in VALID_DOMAINS:
            return jsonify({
                'success': False,
                'message': f'Invalid domain: {domain}'
            }), 400
        
        query = """
            UPDATE growth_operator_assignments 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s AND domain = %s
        """
        execute_query(query, (user_id, domain), fetch_all=False)

        # ...and take back the role that assignment granted.
        #
        # This step did not exist. Deactivating a domain left the role sitting
        # in secondary_roles, so two readers — the profile endpoint and the
        # Users tab — each grew their own code to re-derive roles from this
        # table on EVERY READ and quietly overwrite what they found.
        #
        # That compensation cannot survive the unification: a domain role is now
        # a role the Users tab can grant directly, and a reader cannot tell one
        # granted there from one granted here. Stripping on read would revoke
        # roles nobody asked to revoke. So the revocation happens HERE, once,
        # where the decision is actually made.
        revoked = role_for_domain(domain)
        if revoked:
            _revoke_domain_role(user_id, domain, revoked)

        return jsonify({
            'success': True,
            'message': f'Domain {domain} removed from Growth Operator'
        })
        
    except Exception as e:
        logger.error(f"Failed to remove domain: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to remove domain'
        }), 500


@growth_operator_assignment_bp.route('/<user_id>/primary-domain', methods=['PUT'])
@optional_auth
def set_primary_domain(user_id):
    """Set the primary domain for a Growth Operator"""
    try:
        data = request.get_json()
        domain = data.get('domain')
        
        if domain not in VALID_DOMAINS:
            return jsonify({
                'success': False,
                'message': f'Invalid domain: {domain}'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        try:
            with conn.cursor() as cursor:
                # Remove primary flag from all domains
                cursor.execute("""
                    UPDATE growth_operator_assignments 
                    SET is_primary = false, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (user_id,))
                
                # Set new primary domain
                cursor.execute("""
                    UPDATE growth_operator_assignments 
                    SET is_primary = true, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND domain = %s
                """, (user_id, domain))
                
                # users.role is deliberately NOT written here.
                #
                # It used to be set to growth_operator_<domain>, which OVERWROTE
                # the person's primary role: naming an administrator's primary
                # domain cost them 'admin'. Folding the domain roles into the
                # established names would have made that worse, not better —
                # the clobber would now install a real, checked role.
                #
                # Which domain is primary is a property of the ASSIGNMENT, and
                # growth_operator_assignments.is_primary (set just above) is
                # where this module already reads it from.
                
                conn.commit()
                
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Primary domain set to {domain}'
        })
        
    except Exception as e:
        logger.error(f"Failed to set primary domain: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to set primary domain'
        }), 500


# =====================================================
# OPERATORS BY DOMAIN ENDPOINT
# =====================================================

@growth_operator_assignment_bp.route('/by-domain/<domain>', methods=['GET'])
@optional_auth
def get_operators_by_domain(domain):
    """Get all Growth Operators assigned to a specific domain"""
    try:
        if domain not in VALID_DOMAINS:
            return jsonify({
                'success': False,
                'message': f'Invalid domain: {domain}'
            }), 400
        
        query = """
            SELECT 
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.is_active,
                goa.is_primary,
                goa.created_at as assigned_at
            FROM growth_operator_assignments goa
            JOIN users u ON goa.user_id = u.id
            WHERE goa.domain = %s AND goa.is_active = true
            ORDER BY goa.is_primary DESC, u.full_name
        """
        
        operators = execute_query(query, (domain,))
        
        return jsonify({
            'success': True,
            'data': {
                'domain': domain,
                'metadata': DOMAIN_METADATA.get(domain, {}),
                'operators': operators or []
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to get operators by domain: {e}")
        return jsonify({
            'success': True,
            'data': {
                'domain': domain,
                'metadata': DOMAIN_METADATA.get(domain, {}),
                'operators': []
            }
        })


# =====================================================
# DOMAIN STATISTICS ENDPOINT
# =====================================================

@growth_operator_assignment_bp.route('/statistics', methods=['GET'])
@optional_auth
def get_domain_statistics():
    """Get statistics for all Growth Operator domains"""
    try:
        stats = []
        
        for domain_key, metadata in DOMAIN_METADATA.items():
            # Get operator count
            count_query = """
                SELECT COUNT(*) as count 
                FROM growth_operator_assignments 
                WHERE domain = %s AND is_active = true
            """
            count_result = execute_query(count_query, (domain_key,), fetch_one=True)
            operator_count = count_result.get('count', 0) if count_result else 0
            
            # Get activity count (last 30 days)
            activity_query = """
                SELECT COUNT(*) as count 
                FROM growth_operator_activity_log 
                WHERE domain = %s AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            """
            activity_result = execute_query(activity_query, (domain_key,), fetch_one=True)
            activity_count = activity_result.get('count', 0) if activity_result else 0
            
            stats.append({
                'domain': domain_key,
                'label': metadata['label'],
                'operatorCount': operator_count,
                'activityCount': activity_count,
                'icon': metadata['icon']
            })
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Failed to get domain statistics: {e}")
        return jsonify({
            'success': True,
            'data': []
        })


# Register the blueprint function
def register_growth_operator_assignment_routes(app):
    """Register growth operator assignment routes with the Flask app"""
    app.register_blueprint(growth_operator_assignment_bp)
    logger.info("✅ Growth Operator Assignment API routes registered")
