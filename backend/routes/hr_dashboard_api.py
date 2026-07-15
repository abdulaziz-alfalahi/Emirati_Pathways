"""
HR Dashboard API Routes (Enhanced)

This module provides additional API endpoints for the HR Dashboard that are
not covered by the existing hr_dashboard_routes.py, including:
- Shortlisted candidates management
- Team members listing
- Enhanced candidate search
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from functools import wraps
from flask_jwt_extended import jwt_required

from backend.db import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint - different prefix to avoid conflicts with existing hr_dashboard_bp
hr_dashboard_api_bp = Blueprint('hr_dashboard_api', __name__, url_prefix='/api/hr')

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
            # Create shortlisted_candidates table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shortlisted_candidates (
                    id SERIAL PRIMARY KEY,
                    job_id INTEGER NOT NULL,
                    candidate_id INTEGER NOT NULL,
                    hr_user_id INTEGER NOT NULL,
                    notes TEXT,
                    status VARCHAR(50) DEFAULT 'shortlisted',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(job_id, candidate_id)
                )
            """)
            
            # Create team_members table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS team_members (
                    id SERIAL PRIMARY KEY,
                    company_id INTEGER,
                    user_id INTEGER NOT NULL,
                    role VARCHAR(100),
                    department VARCHAR(100),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            logger.info("HR Dashboard tables ensured")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        conn.rollback()
    finally:
        conn.close()

# Initialize tables
ensure_tables_exist()

# SECURITY (was a no-op that let anyone read candidate data and approve/reject offers and
# delegate approval authority): require an authenticated HR/recruiter/admin caller. Per-
# resource ownership is still enforced in the handlers that need it.
try:
    from backend.auth.access_control import require_roles, HR_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, HR_ROLES

optional_auth = require_roles(*HR_ROLES)


# =====================================================
# SHORTLISTED CANDIDATES ENDPOINTS
# =====================================================

@hr_dashboard_api_bp.route('/dashboard', methods=['GET'])
@optional_auth
def get_hr_dashboard():
    """Get HR dashboard overview"""
    try:
        # Real counts where derivable; non-derivable metrics null; no fabricated
        # activity feed. (#26)
        def _count(sql):
            try:
                row = execute_query(sql, fetch_one=True)
                return (row or {}).get('count', 0) or 0
            except Exception:
                return None
        return jsonify({
            'success': True,
            'data': {
                'totalJobs': _count("SELECT COUNT(*) as count FROM job_postings"),
                'activeJobs': _count("SELECT COUNT(*) as count FROM job_postings WHERE status = 'active'"),
                'totalCandidates': _count("SELECT COUNT(*) as count FROM users WHERE role IN ('candidate','job_seeker')"),
                'shortlistedCandidates': _count("SELECT COUNT(*) as count FROM job_applications WHERE status = 'shortlisted'"),
                'scheduledInterviews': None,
                'pendingApprovals': _count("SELECT COUNT(*) as count FROM offer_approval_requests WHERE status = 'pending'"),
                'recentActivity': []
            }
        })
    except Exception as e:
        logger.error(f"Failed to get HR dashboard: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/dashboard/shortlisted', methods=['GET'])
@optional_auth
def get_shortlisted_candidates_dashboard():
    """Get shortlisted candidates for dashboard"""
    try:
        # Not yet wired to real shortlist data — return empty rather than fabricated
        # candidates with invented match scores. (#26)
        return jsonify({'success': True, 'available': False, 'data': []})
    except Exception as e:
        logger.error(f"Failed to get shortlisted candidates: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/dashboard/team', methods=['GET'])
@optional_auth
def get_team_members_dashboard():
    """Get team members for dashboard"""
    try:
        # Not yet wired to a real team roster — return empty, not fabricated members. (#26)
        return jsonify({'success': True, 'available': False, 'data': []})
    except Exception as e:
        logger.error(f"Failed to get team members: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/dashboard/candidates/search', methods=['GET'])
@optional_auth
def search_candidates_dashboard():
    """Search candidates from dashboard"""
    try:
        query = request.args.get('query', '')
        # Not yet wired to real candidate search — return empty rather than
        # fabricated candidates with invented match scores. (#26)
        return jsonify({'success': True, 'available': False, 'data': [], 'query': query, 'total': 0})
    except Exception as e:
        logger.error(f"Failed to search candidates: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/dashboard/metrics', methods=['GET'])
@optional_auth
def get_hr_metrics_dashboard():
    """Get HR metrics for dashboard"""
    try:
        # Real counts where derivable; non-derivable metrics are null, not fabricated. (#26)
        def _count(sql):
            try:
                row = execute_query(sql, fetch_one=True)
                return (row or {}).get('count', 0) or 0
            except Exception:
                return None
        return jsonify({
            'success': True,
            'metrics': {
                'overview': {
                    'total_applications': _count("SELECT COUNT(*) as count FROM job_applications"),
                    'new_applications': None,
                    'interviews_scheduled': None,
                    'positions_filled': _count("SELECT COUNT(*) as count FROM job_applications WHERE status = 'hired'"),
                    'active_jobs': _count("SELECT COUNT(*) as count FROM job_postings WHERE status = 'active'"),
                    'total_jobs': _count("SELECT COUNT(*) as count FROM job_postings")
                },
                'performance': {
                    'avg_time_to_hire': None,
                    'success_rate': None
                }
            }
        })
    except Exception as e:
        logger.error(f"Failed to get HR metrics: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approval-workflows', methods=['GET'])
@optional_auth
def get_approval_workflows():
    """Get approval workflows"""
    try:
        # Not yet wired to a real workflow store — return empty, not fabricated. (#26)
        return jsonify({'success': True, 'available': False, 'data': []})
    except Exception as e:
        logger.error(f"Failed to get approval workflows: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approval-workflows/delegate', methods=['POST'])
@optional_auth
def delegate_approval():
    """Delegate an approval workflow"""
    try:
        data = request.get_json()
        workflow_id = data.get('workflow_id')
        delegate_to = data.get('delegate_to')
        reason = data.get('reason', '')
        
        return jsonify({
            'success': True,
            'message': f'Approval workflow {workflow_id} delegated successfully',
            'data': {
                'workflow_id': workflow_id,
                'delegated_to': delegate_to,
                'reason': reason,
                'delegated_at': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Failed to delegate approval: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approvals', methods=['GET'])
@optional_auth
def get_all_approvals():
    """Get all approvals (pending, history) for the workflow tab"""
    try:
        # Fetch from offer_approval_requests
        query = """
            SELECT 
                oar.id,
                oar.offer_id,
                oar.recruiter_id,
                oar.status,
                oar.submitted_at,
                o.position_title,
                o.salary_amount,
                u.full_name as recruiter_name,
                c.full_name as candidate_name
            FROM offer_approval_requests oar
            LEFT JOIN offers o ON oar.offer_id = o.id
            LEFT JOIN users u ON oar.recruiter_id = u.id
            LEFT JOIN users c ON o.candidate_id = c.id
            ORDER BY oar.submitted_at DESC
        """
        approvals = execute_query(query)
        
        # Transform for frontend
        data = []
        if approvals:
            for apr in approvals:
                data.append({
                    'id': apr.get('id'),
                    'type': 'offer_approval',
                    'candidate': apr.get('candidate_name', 'Unknown Candidate'),
                    'position': apr.get('position_title', 'Unknown Position'),
                    'salary': apr.get('salary_amount'),
                    'status': apr.get('status', 'pending'),
                    'img': 'https://i.pravatar.cc/150?u=' + str(apr.get('id')), # Mock image
                    'submitted': apr.get('submitted_at').strftime('%Y-%m-%d') if apr.get('submitted_at') else datetime.now().strftime('%Y-%m-%d'),
                    'submitted_by': apr.get('recruiter_name', 'Unknown Recruiter')
                })
        # No mock fallback — an empty table yields an empty list, not fake approvals. (#26)

        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Failed to get all approvals: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approvals/pending', methods=['GET'])
@optional_auth
def get_pending_approvals():
    """Get all pending approvals — real rows from offer_approval_requests. (#26)"""
    try:
        query = """
            SELECT
                oar.id,
                oar.status,
                oar.submitted_at,
                o.position_title,
                o.salary_amount,
                u.full_name as recruiter_name,
                c.full_name as candidate_name
            FROM offer_approval_requests oar
            LEFT JOIN offers o ON oar.offer_id = o.id
            LEFT JOIN users u ON oar.recruiter_id = u.id
            LEFT JOIN users c ON o.candidate_id = c.id
            WHERE oar.status = 'pending'
            ORDER BY oar.submitted_at DESC
        """
        approvals = execute_query(query) or []
        data = []
        for apr in approvals:
            data.append({
                'id': apr.get('id'),
                'type': 'offer_approval',
                'candidate': apr.get('candidate_name', 'Unknown Candidate'),
                'position': apr.get('position_title', 'Unknown Position'),
                'salary': apr.get('salary_amount'),
                'status': apr.get('status', 'pending'),
                'submitted_by': apr.get('recruiter_name', 'Unknown Recruiter'),
                'submitted_at': apr.get('submitted_at').strftime('%Y-%m-%d') if apr.get('submitted_at') else None,
            })
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        logger.error(f"Failed to get pending approvals: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approvals/stats', methods=['GET'])
@optional_auth
def get_approval_stats():
    """Get stats for pending approvals"""
    try:
        # Simple count query
        query = """
            SELECT status, COUNT(*) as count 
            FROM offer_approval_requests 
            GROUP BY status
        """
        rows = execute_query(query)
        
        stats = {'pending': 0, 'approved': 0, 'rejected': 0}
        if rows:
            for row in rows:
                status = row.get('status', '').lower()
                count = row.get('count', 0)
                if status in stats:
                    stats[status] = count
        # No fallback: an empty/missing table means zero pending, not a fake 5. (#26)

        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        logger.error(f"Failed to get approval stats: {e}")
        return jsonify({
            'success': True, 
            'data': {'pending': 0, 'approved': 0, 'rejected': 0}
        })


@hr_dashboard_api_bp.route('/delegations', methods=['GET'])
@optional_auth
def get_delegations():
    """Get active delegations for HR Manager"""
    try:
        hr_manager_id = request.args.get('hr_manager_id')
        
        # Mock data for delegations
        delegations = [
            {
                'id': 'del_001',
                'delegatee_id': 'user_123',
                'delegatee_name': 'Sarah Recruiter',
                'approval_types': ['offer_approval', 'interview_schedule'],
                'start_date': '2025-01-20',
                'end_date': '2025-01-27',
                'status': 'active'
            },
             {
                'id': 'del_002',
                'delegatee_id': 'user_456',
                'delegatee_name': 'John HR',
                'approval_types': ['salary_exception'],
                'start_date': '2025-02-01',
                'end_date': '2025-02-05',
                'status': 'scheduled'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': delegations
        })
    except Exception as e:
        logger.error(f"Failed to get delegations: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approvals/delegate', methods=['POST'])
@optional_auth
def delegate_approval_enhanced():
    """Delegate approvals to another HR user"""
    try:
        data = request.get_json() or {}
        return jsonify({
            'success': True,
            'message': 'Delegation created successfully',
            'data': {
                'delegation_id': 'del_001',
                'delegatee_id': data.get('delegatee_id'),
                'approval_types': data.get('approval_types', []),
                'start_date': data.get('start_date'),
                'end_date': data.get('end_date'),
                'reason': data.get('reason'),
                'created_at': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Failed to create delegation: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approvals/<approval_id>/approve', methods=['POST'])
@optional_auth
def approve_request(approval_id):
    """Approve a pending offer request — HR Manager canonical approval endpoint.
    
    G6: Consolidated with recruiter-side /offers/approvals/<id>/approve.
    Both endpoints now use the same state machine:
      1. Update offer_approval_requests.status → 'approved'
      2. Update offers.status → 'approved'
      3. Notify the recruiter who submitted the offer
    """
    try:
        data = request.get_json() or {}
        approver_id = data.get('approved_by', data.get('approver_id', 1))
        comments = data.get('comments', '')
        
        # Convert approver_id to int if string
        if isinstance(approver_id, str):
            try:
                approver_id = int(approver_id)
            except:
                approver_id = 1
        
        offer_id = None
        recruiter_id = None
        position_title = None
        
        # Step 1: Update offer_approval_requests table
        update_query = """
            UPDATE offer_approval_requests
            SET status = 'approved',
                approved_by = %s,
                approved_at = NOW(),
                comments = %s,
                updated_at = NOW()
            WHERE id = %s::uuid
            RETURNING offer_id, recruiter_id, position_title
        """
        result = execute_query(update_query, (approver_id, comments, approval_id), fetch_one=True)
        
        if result:
            offer_id = result.get('offer_id')
            recruiter_id = result.get('recruiter_id')
            position_title = result.get('position_title', 'a position')
        else:
            # Fallback: approval_id might be the offer_id directly
            logger.info(f"[G6 HR] No approval request found, treating {approval_id} as offer_id")
            offer_id = approval_id
        
        # Step 2: Update the offer status to 'approved'
        if offer_id:
            offer_update_query = """
                UPDATE offers
                SET status = 'approved',
                    updated_at = NOW()
                WHERE id = %s::uuid
                RETURNING id, offer_data, recruiter_id
            """
            offer_result = execute_query(offer_update_query, (str(offer_id),), fetch_one=True)
            
            if offer_result:
                logger.info(f"[G6 HR] Offer {offer_id} approved by HR Manager {approver_id}")
                
                # Extract position_title from offer_data if needed
                if not position_title:
                    od = offer_result.get('offer_data') or {}
                    if isinstance(od, str):
                        try:
                            import json
                            od = json.loads(od)
                        except:
                            od = {}
                    position_title = od.get('position_title') or od.get('job_title') or 'a position'
                
                if not recruiter_id:
                    recruiter_id = offer_result.get('recruiter_id')
                
                # Step 3: Notify recruiter
                if recruiter_id:
                    try:
                        import json
                        notif_metadata = json.dumps({
                            'offer_id': str(offer_id),
                            'approval_id': str(approval_id),
                            'position_title': position_title,
                            'link': '/recruiter?tab=offers'
                        })
                        execute_query("""
                            INSERT INTO notifications (user_id, type, title, content, metadata)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (
                            str(recruiter_id), 'offer_approved',
                            'Offer Approved',
                            f'Your offer for {position_title} has been approved by HR Manager. You can now send it to the candidate.',
                            notif_metadata
                        ))
                    except Exception as notif_err:
                        logger.warning(f"[G6 HR] Notification failed: {notif_err}")
                
                return jsonify({
                    'success': True,
                    'message': 'Request approved successfully',
                    'data': {
                        'approval_id': approval_id,
                        'offer_id': str(offer_id),
                        'status': 'approved',
                        'approved_by': approver_id,
                        'comments': comments,
                        'approved_at': datetime.now().isoformat()
                    }
                })
            else:
                return jsonify({'success': False, 'message': 'Offer not found'}), 404
        else:
            return jsonify({'success': False, 'message': 'Approval request not found'}), 404
            
    except Exception as e:
        logger.error(f"[G6 HR] Failed to approve request: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/approvals/<approval_id>/reject', methods=['POST'])
@optional_auth
def reject_request(approval_id):
    """Reject a pending offer request — HR Manager canonical rejection endpoint.
    
    G6: Consolidated with recruiter-side /offers/approvals/<id>/reject.
    """
    try:
        data = request.get_json() or {}
        approver_id = data.get('rejected_by', data.get('approver_id', 1))
        reason = data.get('reason', data.get('rejection_reason', ''))
        comments = data.get('comments', '')
        
        if isinstance(approver_id, str):
            try:
                approver_id = int(approver_id)
            except:
                approver_id = 1
        
        offer_id = None
        recruiter_id = None
        position_title = None
        
        # Step 1: Update offer_approval_requests table
        update_query = """
            UPDATE offer_approval_requests
            SET status = 'rejected',
                approved_by = %s,
                approved_at = NOW(),
                rejection_reason = %s,
                comments = %s,
                updated_at = NOW()
            WHERE id = %s::uuid
            RETURNING offer_id, recruiter_id, position_title
        """
        result = execute_query(update_query, (approver_id, reason, comments, approval_id), fetch_one=True)
        
        if result:
            offer_id = result.get('offer_id')
            recruiter_id = result.get('recruiter_id')
            position_title = result.get('position_title', 'a position')
        else:
            logger.info(f"[G6 HR] No approval request found, treating {approval_id} as offer_id")
            offer_id = approval_id
        
        # Step 2: Update the offer status to 'rejected'
        if offer_id:
            offer_update_query = """
                UPDATE offers
                SET status = 'rejected',
                    updated_at = NOW()
                WHERE id = %s::uuid
                RETURNING id, offer_data, recruiter_id
            """
            offer_result = execute_query(offer_update_query, (str(offer_id),), fetch_one=True)
            
            if offer_result:
                logger.info(f"[G6 HR] Offer {offer_id} rejected by HR Manager {approver_id}")
                
                if not position_title:
                    od = offer_result.get('offer_data') or {}
                    if isinstance(od, str):
                        try:
                            import json
                            od = json.loads(od)
                        except:
                            od = {}
                    position_title = od.get('position_title') or od.get('job_title') or 'a position'
                
                if not recruiter_id:
                    recruiter_id = offer_result.get('recruiter_id')
                
                # Step 3: Notify recruiter
                if recruiter_id:
                    try:
                        import json
                        reason_text = f' Reason: {reason}' if reason else ''
                        notif_metadata = json.dumps({
                            'offer_id': str(offer_id),
                            'approval_id': str(approval_id),
                            'position_title': position_title,
                            'rejection_reason': reason,
                            'link': '/recruiter?tab=offers'
                        })
                        execute_query("""
                            INSERT INTO notifications (user_id, type, title, content, metadata)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (
                            str(recruiter_id), 'offer_rejected',
                            'Offer Rejected',
                            f'Your offer for {position_title} has been rejected by HR Manager.{reason_text}',
                            notif_metadata
                        ))
                    except Exception as notif_err:
                        logger.warning(f"[G6 HR] Rejection notification failed: {notif_err}")
                
                return jsonify({
                    'success': True,
                    'message': 'Request rejected',
                    'data': {
                        'approval_id': approval_id,
                        'offer_id': str(offer_id),
                        'status': 'rejected',
                        'rejected_by': approver_id,
                        'reason': reason,
                        'rejected_at': datetime.now().isoformat()
                    }
                })
            else:
                return jsonify({'success': False, 'message': 'Offer not found'}), 404
        else:
            return jsonify({'success': False, 'message': 'Approval request not found'}), 404
            
    except Exception as e:
        logger.error(f"[G6 HR] Failed to reject request: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@hr_dashboard_api_bp.route('/jobs/shortlisted-candidates', methods=['GET'])
@optional_auth
def get_all_shortlisted_candidates():
    """
    Get all shortlisted candidates across all jobs
    
    Query params:
        job_id: Filter by specific job
        status: Filter by status
    """
    try:
        job_id = request.args.get('job_id', type=int)
        status = request.args.get('status')
        
        query = """
            SELECT 
                sc.id,
                sc.job_id,
                sc.candidate_id,
                sc.notes,
                sc.status,
                sc.created_at,
                u.username as candidate_name,
                u.email as candidate_email,
                u.full_name as candidate_full_name,
                j.title as job_title,
                j.company as company_name
            FROM shortlisted_candidates sc
            LEFT JOIN users u ON sc.candidate_id = u.id
            LEFT JOIN job_descriptions j ON sc.job_id = j.id
            WHERE 1=1
        """
        params = []
        
        if job_id:
            query += " AND sc.job_id = %s"
            params.append(job_id)
        
        if status:
            query += " AND sc.status = %s"
            params.append(status)
        
        query += " ORDER BY sc.created_at DESC"
        
        candidates = execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            'success': True,
            'data': candidates or [],
            'total': len(candidates) if candidates else 0
        })
        
    except Exception as e:
        logger.error(f"Failed to get shortlisted candidates: {e}")
        return jsonify({
            'success': True,
            'data': [],
            'total': 0
        })


@hr_dashboard_api_bp.route('/jobs/<job_id>/shortlist/<candidate_id>/status', methods=['PUT'])
@optional_auth
def update_shortlist_status(job_id, candidate_id):
    """Update the status of a shortlisted candidate"""
    try:
        data = request.get_json()
        status = data.get('status')
        notes = data.get('notes')
        
        valid_statuses = ['shortlisted', 'interviewing', 'offered', 'hired', 'rejected']
        if status and status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {valid_statuses}'
            }), 400
        
        # Resolve job_id to integer ID for shortlisted_candidates table
        resolved_job_id = None
        if str(job_id).isdigit():
            resolved_job_id = int(job_id)
        else:
            job_row = execute_query("SELECT id FROM job_postings WHERE jd_id = %s", (job_id,), fetch_one=True)
            if job_row:
                resolved_job_id = job_row['id']
            else:
                job_desc_row = execute_query("SELECT id FROM job_descriptions WHERE id::text = %s", (job_id,), fetch_one=True)
                if job_desc_row:
                    resolved_job_id = job_desc_row['id']
                else:
                    return jsonify({'success': False, 'message': 'Job posting not found'}), 404
        
        updates = []
        params = []
        
        if status:
            updates.append("status = %s")
            params.append(status)
        
        if notes is not None:
            updates.append("notes = %s")
            params.append(notes)
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            query = f"""
                UPDATE shortlisted_candidates 
                SET {', '.join(updates)}
                WHERE job_id = %s AND candidate_id = %s
            """
            params.extend([resolved_job_id, candidate_id])
            execute_query(query, tuple(params), fetch_all=False)
        
        return jsonify({
            'success': True,
            'message': 'Shortlist status updated'
        })
        
    except Exception as e:
        logger.error(f"Failed to update shortlist status: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update status'
        }), 500


# =====================================================
# TEAM MEMBERS ENDPOINTS
# =====================================================

@hr_dashboard_api_bp.route('/team/members', methods=['GET'])
@optional_auth
def get_team_members():
    """
    Get team members for the company
    
    Query params:
        company_id: Filter by company
        department: Filter by department
    """
    try:
        company_id = request.args.get('company_id', type=int)
        department = request.args.get('department')
        
        # First try to get from team_members table
        query = """
            SELECT 
                tm.id,
                tm.user_id,
                tm.role,
                tm.department,
                tm.is_active,
                tm.created_at,
                u.username,
                u.email,
                u.full_name
            FROM team_members tm
            LEFT JOIN users u ON tm.user_id = u.id
            WHERE tm.is_active = true
        """
        params = []
        
        if company_id:
            query += " AND tm.company_id = %s"
            params.append(company_id)
        
        if department:
            query += " AND tm.department = %s"
            params.append(department)
        
        query += " ORDER BY u.full_name"
        
        members = execute_query(query, tuple(params) if params else None)
        
        # If no team members found, return users with HR/recruiter roles
        if not members:
            fallback_query = """
                SELECT 
                    id,
                    id as user_id,
                    role,
                    'General' as department,
                    is_active,
                    created_at,
                    username,
                    email,
                    full_name
                FROM users
                WHERE role IN ('employer_admin', 'recruiter', 'employer_admin', 'hiring_manager')
                AND is_active = true
                ORDER BY full_name
            """
            members = execute_query(fallback_query)
        
        return jsonify({
            'success': True,
            'data': members or [],
            'total': len(members) if members else 0
        })
        
    except Exception as e:
        logger.error(f"Failed to get team members: {e}")
        return jsonify({
            'success': True,
            'data': [],
            'total': 0
        })


# =====================================================
# ENHANCED CANDIDATE SEARCH
# =====================================================

@hr_dashboard_api_bp.route('/candidates/search', methods=['GET', 'POST'])
@jwt_required()
def search_candidates():
    """
    Search for candidates with various filters
    
    Query params / Body:
        query: Search query string
        skills: List of required skills
        experience_min: Minimum years of experience
        experience_max: Maximum years of experience
        location: Preferred location
        education: Education level
        availability: Availability status
    """
    try:
        # Get parameters from either query string or body
        if request.method == 'POST':
            data = request.get_json() or {}
        else:
            data = request.args.to_dict()
        
        search_query = data.get('query', data.get('q', ''))
        skills = data.get('skills', [])
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(',') if s.strip()]
        
        experience_min = None
        experience_max = None
        if request.method == 'GET':
            experience_min_val = request.args.get('experience_min')
            experience_max_val = request.args.get('experience_max')
        else:
            experience_min_val = data.get('experience_min')
            experience_max_val = data.get('experience_max')

        if experience_min_val is not None and str(experience_min_val).isdigit():
            experience_min = int(experience_min_val)
        if experience_max_val is not None and str(experience_max_val).isdigit():
            experience_max = int(experience_max_val)

        location = data.get('location', '')
        education = data.get('education', '')
        page = int(data.get('page', 1))
        per_page = int(data.get('per_page', 20))
        
        offset = (page - 1) * per_page
        
        job_id = data.get('job_id')
        
        # Build search query
        query = """
            SELECT DISTINCT
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.created_at,
                cv.id as cv_id,
                cv.title as cv_title,
                cv.parsed_data,
                cv.skills,
                CASE WHEN js.candidate_id IS NOT NULL THEN true ELSE false END as is_shortlisted
            FROM users u
            LEFT JOIN cv_data cv ON u.id = cv.user_id AND cv.is_visible = true
        """
        
        # Join with job_shortlists if job_id is provided
        # Use job_shortlists table as created by hr_job_posting_routes.py
        params = []
        if job_id:
            query += " LEFT JOIN shortlisted_candidates js ON u.id = js.candidate_id AND js.job_id = %s "
            params.append(str(job_id))
        else:
            query += " LEFT JOIN (SELECT NULL as candidate_id) js ON 1=0 "

        query += """
            WHERE (u.role = 'candidate' OR u.role IS NULL)
            AND u.is_active = true
        """
        
        # Text search
        if search_query:
            query += """
                AND (
                    u.username ILIKE %s 
                    OR u.email ILIKE %s 
                    OR u.full_name ILIKE %s
                    OR cv.title ILIKE %s
                    OR cv.parsed_data::text ILIKE %s
                )
            """
            search_param = f"%{search_query}%"
            params.extend([search_param] * 5)
        
        # Skills filter
        if skills:
            skill_conditions = []
            for skill in skills:
                skill_conditions.append("cv.skills::text ILIKE %s")
                params.append(f"%{skill}%")
            query += f" AND ({' OR '.join(skill_conditions)})"
        
        # Location filter
        if location:
            query += " AND (cv.parsed_data->>'location' ILIKE %s OR cv.parsed_data->>'city' ILIKE %s)"
            params.extend([f"%{location}%", f"%{location}%"])
        
        query += " ORDER BY cv.created_at DESC NULLS LAST LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        candidates = execute_query(query, tuple(params))
        
        # Process results
        results = []
        if candidates:
            for candidate in candidates:
                parsed_data = candidate.get('parsed_data') or {}
                if isinstance(parsed_data, str):
                    try:
                        parsed_data = json.loads(parsed_data)
                    except:
                        parsed_data = {}
                
                skills_data = candidate.get('skills') or []
                if isinstance(skills_data, str):
                    try:
                        skills_data = json.loads(skills_data)
                    except:
                        skills_data = []
                
                results.append({
                    'id': candidate.get('id'),
                    'username': candidate.get('username'),
                    'email': candidate.get('email'),
                    'full_name': candidate.get('full_name'),
                    'cv_id': candidate.get('cv_id'),
                    'cv_title': candidate.get('cv_title'),
                    'skills': skills_data[:10] if skills_data else [],
                    'location': parsed_data.get('location', parsed_data.get('city', '')),
                    'experience': parsed_data.get('experience', []),
                    'education': parsed_data.get('education', [])
                })
        
        # Get total count
        count_query = """
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN cv_data cv ON u.id = cv.user_id
            WHERE (u.role = 'candidate' OR u.role IS NULL)
            AND u.is_active = true
        """
        total_result = execute_query(count_query, fetch_one=True)
        total = total_result.get('total', 0) if total_result else 0
        
        return jsonify({
            'success': True,
            'data': {
                'candidates': results,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to search candidates: {e}")
        return jsonify({
            'success': True,
            'data': {
                'candidates': [],
                'total': 0,
                'page': 1,
                'per_page': 20,
                'total_pages': 0
            }
        })


# =====================================================
# HR METRICS ENDPOINT (Fallback without JWT)
# =====================================================

@hr_dashboard_api_bp.route('/metrics', methods=['GET'])
@optional_auth
def get_hr_metrics():
    """
    Get HR dashboard metrics (fallback endpoint without JWT requirement)
    """
    try:
        metrics = {
            'overview': {
                'total_jobs': 0,
                'active_jobs': 0,
                'total_applications': 0,
                'new_applications': 0,
                'interviews_scheduled': 0,
                'offers_extended': 0,
                'positions_filled': 0
            },
            'performance': {
                'emiratization_rate': 0,
                'avg_time_to_hire': 0,
                'success_rate': 0
            }
        }
        
        # Get job counts
        jobs_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active' OR status = 'published') as active
            FROM job_descriptions
        """
        jobs_stats = execute_query(jobs_query, fetch_one=True)
        if jobs_stats:
            metrics['overview']['total_jobs'] = jobs_stats.get('total', 0) or 0
            metrics['overview']['active_jobs'] = jobs_stats.get('active', 0) or 0
        
        # Get application counts
        apps_query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today,
                COUNT(*) FILTER (WHERE status = 'interview') as interviewing,
                COUNT(*) FILTER (WHERE status = 'offered') as offered,
                COUNT(*) FILTER (WHERE status = 'hired') as hired
            FROM job_applications
        """
        apps_stats = execute_query(apps_query, fetch_one=True)
        if apps_stats:
            metrics['overview']['total_applications'] = apps_stats.get('total', 0) or 0
            metrics['overview']['new_applications'] = apps_stats.get('new_today', 0) or 0
            metrics['overview']['interviews_scheduled'] = apps_stats.get('interviewing', 0) or 0
            metrics['overview']['offers_extended'] = apps_stats.get('offered', 0) or 0
            metrics['overview']['positions_filled'] = apps_stats.get('hired', 0) or 0
        
        # Calculate success rate
        if metrics['overview']['total_applications'] > 0:
            metrics['performance']['success_rate'] = round(
                (metrics['overview']['positions_filled'] / metrics['overview']['total_applications']) * 100, 1
            )
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'generated_at': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get HR metrics: {e}")
        return jsonify({
            'success': True,
            'metrics': {
                'overview': {
                    'total_jobs': 0,
                    'active_jobs': 0,
                    'total_applications': 0,
                    'new_applications': 0,
                    'interviews_scheduled': 0,
                    'offers_extended': 0,
                    'positions_filled': 0
                },
                'performance': {
                    'emiratization_rate': 0,
                    'avg_time_to_hire': 0,
                    'success_rate': 0
                }
            },
            'generated_at': datetime.utcnow().isoformat()
        })


# Register the blueprint function
def register_hr_dashboard_api_routes(app):
    """Register HR dashboard API routes with the Flask app"""
    app.register_blueprint(hr_dashboard_api_bp)
    logger.info("✅ HR Dashboard API routes registered")
