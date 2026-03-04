"""
Growth Operator Domain Assignment API Routes

This module provides API endpoints for administrators to assign Growth Operators
to specific domains (Candidate, Company, Education, Assessment, Mentorship, Community).
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
growth_operator_assignment_bp = Blueprint('growth_operator_assignment_api', __name__, url_prefix='/api/admin/growth-operators')

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

# Valid Growth Operator Domains
VALID_DOMAINS = ['candidate', 'company', 'education', 'assessment', 'mentorship', 'community']

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
    }
}

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(**DATABASE_CONFIG)
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

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
                    user_id INTEGER NOT NULL,
                    domain VARCHAR(50) NOT NULL,
                    assigned_by INTEGER,
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
                    user_id INTEGER NOT NULL,
                    domain VARCHAR(50),
                    action VARCHAR(100),
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            logger.info("Growth Operator assignment tables ensured")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        conn.rollback()
    finally:
        conn.close()

# Initialize tables
ensure_tables_exist()

def optional_auth(f):
    """Decorator that allows requests with or without authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


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
        
        # Get users who are growth operators (check primary role, secondary_roles, and assignments)
        query = """
            SELECT DISTINCT
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.role,
                u.is_active,
                u.created_at,
                u.last_login
            FROM users u
            LEFT JOIN growth_operator_assignments goa ON u.id = goa.user_id AND goa.is_active = true
            WHERE u.role LIKE 'growth_operator%%'
               OR EXISTS (
                   SELECT 1 FROM unnest(u.secondary_roles) AS sr WHERE sr LIKE 'growth_operator_%%'
               )
               OR goa.user_id IS NOT NULL
        """
        params = []
        
        if status == 'active':
            query += " AND u.is_active = true"
        elif status == 'inactive':
            query += " AND u.is_active = false"
        
        query += " ORDER BY u.full_name LIMIT %s OFFSET %s"
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
            
            # Filter by domain if specified
            if domain:
                has_domain = any(a['domain'] == domain for a in (assignments or []))
                if not has_domain:
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
            
            result.append({
                **op_data,
                'domains': [a['domain'] for a in (assignments or [])],
                'assignments': serialized_assignments,
                'primaryDomain': next((a['domain'] for a in (assignments or []) if a.get('is_primary')), None)
            })
        
        # Get total count
        count_query = """
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN growth_operator_assignments goa ON u.id = goa.user_id AND goa.is_active = true
            WHERE u.role LIKE 'growth_operator%%'
               OR EXISTS (
                   SELECT 1 FROM unnest(u.secondary_roles) AS sr WHERE sr LIKE 'growth_operator_%%'
               )
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


@growth_operator_assignment_bp.route('/<int:user_id>', methods=['GET'])
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

@growth_operator_assignment_bp.route('/<int:user_id>/domains', methods=['POST'])
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
        assigned_by = data.get('assigned_by', 1)  # Should come from auth
        
        # Validate domains
        invalid_domains = [d for d in domains if d not in VALID_DOMAINS]
        if invalid_domains:
            return jsonify({
                'success': False,
                'message': f'Invalid domains: {invalid_domains}. Valid domains are: {VALID_DOMAINS}'
            }), 400
        
        # Verify user exists and is a growth operator
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
                
                # Update user role based on domains
                if len(domains) == 1:
                    new_role = f"growth_operator_{domains[0]}"
                elif len(domains) > 1 and primary_domain:
                    new_role = f"growth_operator_{primary_domain}"
                else:
                    new_role = "growth_operator"
                
                cursor.execute("""
                    UPDATE users SET role = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (new_role, user_id))
                
                # Log the assignment
                cursor.execute("""
                    INSERT INTO growth_operator_activity_log 
                    (user_id, domain, action, details)
                    VALUES (%s, %s, 'domain_assignment', %s)
                """, (user_id, primary_domain or (domains[0] if domains else None), 
                      json.dumps({'domains': domains, 'assigned_by': assigned_by})))
                
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


@growth_operator_assignment_bp.route('/<int:user_id>/domains/<domain>', methods=['DELETE'])
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


@growth_operator_assignment_bp.route('/<int:user_id>/primary-domain', methods=['PUT'])
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
                
                # Update user role
                cursor.execute("""
                    UPDATE users SET role = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (f"growth_operator_{domain}", user_id))
                
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
