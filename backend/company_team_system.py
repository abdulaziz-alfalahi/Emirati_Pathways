import os
import json
import logging
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

# Roles an HR manager may hand out through a team invite link (never admin/owner).
_INVITABLE_TEAM_ROLES = {'recruiter', 'hr_manager', 'hr'}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompanyTeamSystem:
    def __init__(self):
        """Initialize the Company Team System"""
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': os.getenv('DB_PORT', '5432')
        }

    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)

    def get_team_members(self, company_id: str, exclude_user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all team members for a company, optionally excluding a specific user"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                        SELECT 
                            ctm.id,
                            ctm.user_id,
                            ctm.role,
                            ctm.permissions,
                            ctm.invitation_status,
                            ctm.joined_at,
                            u.full_name,
                            u.email,
                            u.job_title
                        FROM company_team_members ctm
                        JOIN users u ON ctm.user_id = u.id
                        WHERE ctm.company_id = %s
                          AND ctm.invitation_status <> 'removed'
                    """
                    params = [company_id]

                    if exclude_user_id is not None:
                        query += " AND ctm.user_id != %s"
                        params.append(str(exclude_user_id))

                    query += " ORDER BY ctm.created_at DESC"
                    
                    cur.execute(query, tuple(params))
                    
                    return [dict(row) for row in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error getting team members: {e}")
            return []

    def create_team_invitation(self, company_id: str, role: str, invited_by_user_id) -> Dict[str, Any]:
        """Create a copyable magic-link invitation to join this workspace as a
        teammate. The link works for a brand-new user (they register via UAE Pass
        and are added on redemption) or an existing one. Carries company_id — never
        a name."""
        role = (role or 'recruiter').strip()
        if role not in _INVITABLE_TEAM_ROLES:
            return {'success': False, 'message': f'Role must be one of {sorted(_INVITABLE_TEAM_ROLES)}'}
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT id, COALESCE(name, company_name) AS name FROM companies WHERE id = %s",
                                (company_id,))
                    company = cur.fetchone()
                    if not company:
                        return {'success': False, 'message': 'Company not found'}
                    token = secrets.token_urlsafe(32)
                    cur.execute(
                        "INSERT INTO team_invitations (token, company_id, role, invited_by) "
                        "VALUES (%s, %s, %s, %s) RETURNING id",
                        (token, company_id, role, str(invited_by_user_id)))
                    conn.commit()
                    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8089')
                    return {'success': True, 'token': token, 'role': role,
                            'company_name': company['name'],
                            'invite_link': f"{frontend_url}/join-team/{token}"}
        except Exception as e:
            logger.error(f"create_team_invitation failed: {e}")
            return {'success': False, 'message': str(e)}

    def get_team_invitation(self, token: str) -> Optional[Dict[str, Any]]:
        """Public preview of a team invite (company name + role), or None."""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT ti.role, ti.status, ti.is_used, ti.expires_at, "
                        "COALESCE(c.name, c.company_name) AS company_name "
                        "FROM team_invitations ti JOIN companies c ON c.id = ti.company_id "
                        "WHERE ti.token = %s", (token,))
                    row = cur.fetchone()
                    if not row:
                        return None
                    valid = (not row['is_used']) and row['status'] == 'pending' and \
                        (row['expires_at'] is None or row['expires_at'] > datetime.now(row['expires_at'].tzinfo))
                    return {'company_name': row['company_name'], 'role': row['role'], 'valid': valid}
        except Exception as e:
            logger.error(f"get_team_invitation failed: {e}")
            return None

    def redeem_team_invitation_for_user(self, token: str, user_id: str, is_new_user: bool = False) -> Dict[str, Any]:
        """Add the (UAE-Pass-proven or logged-in) user to the invited workspace.
        Mirrors the company-invitation redemption: team membership + the role as a
        secondary role; a brand-new account takes the role as primary."""
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id, company_id, role, is_used, status, expires_at "
                            "FROM team_invitations WHERE token = %s", (token,))
                inv = cur.fetchone()
                if not inv or inv['is_used'] or inv['status'] != 'pending' or \
                        (inv['expires_at'] is not None and inv['expires_at'] <= datetime.now(inv['expires_at'].tzinfo)):
                    raise ValueError("Invalid, expired, or already used invitation link")
                company_id, role = inv['company_id'], inv['role']
                # Team membership (the row the ACL reads) — reactivate a soft-removed row.
                cur.execute("SELECT id, invitation_status FROM company_team_members "
                            "WHERE company_id = %s AND user_id = %s", (company_id, user_id))
                existing = cur.fetchone()
                if existing:
                    cur.execute("UPDATE company_team_members SET role = %s, invitation_status = 'accepted', "
                                "invited_by = %s, joined_at = NOW(), updated_at = NOW() WHERE id = %s",
                                (role, str(inv.get('invited_by') or ''), existing['id']))
                else:
                    cur.execute(
                        "INSERT INTO company_team_members (company_id, user_id, role, invitation_status, "
                        "joined_at, created_at, updated_at) VALUES (%s, %s, %s, 'accepted', NOW(), NOW(), NOW())",
                        (company_id, user_id, role))
                # Role on the user: new accounts take it as primary; existing keep
                # their primary and gain it as a secondary role.
                if is_new_user:
                    cur.execute("UPDATE users SET role = %s, user_type = %s WHERE id = %s", (role, role, user_id))
                else:
                    cur.execute(
                        "UPDATE users SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) "
                        "|| jsonb_build_array(%s) WHERE id = %s "
                        "AND NOT (COALESCE(secondary_roles, '[]'::jsonb) ? %s)", (role, user_id, role))
                cur.execute("UPDATE team_invitations SET is_used = TRUE, status = 'accepted', "
                            "created_user_id = %s, accepted_at = NOW() WHERE token = %s", (user_id, token))
                conn.commit()
                return {'success': True, 'company_id': str(company_id), 'role': role,
                        'primary_role': role if is_new_user else None}

    def invite_member(self, company_id: str, email: str, role: str, invited_by_user_id: int) -> Dict[str, Any]:
        """
        Invite a member to the team.
        If user exists, add them directly (or pending). 
        If not, we might need to handle 'invitation only' users? 
        For now, assume user MUST exist in system to be invited (or we create a placeholder).
        Simple MVP: Check if user exists by email.
        """
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # 1. Find user by email
                    cur.execute("SELECT id, full_name FROM users WHERE email = %s", (email,))
                    user = cur.fetchone()
                    
                    if not user:
                        return {'success': False, 'message': 'User not found. They must register first.'}
                    
                    user_id = user[0]
                    
                    # 2. Check if already in team. A soft-removed row (#100)
                    #    must NOT block re-adding — removal would otherwise be
                    #    permanent. Reactivate it instead of inserting.
                    cur.execute("""
                        SELECT id, invitation_status FROM company_team_members
                        WHERE company_id = %s AND user_id = %s
                    """, (company_id, user_id))
                    existing = cur.fetchone()

                    if existing and existing[1] != 'removed':
                        return {'success': False, 'message': 'User already in team.'}

                    if existing:
                        record_id = existing[0]
                        cur.execute("""
                            UPDATE company_team_members
                            SET role = %s, invited_by = %s,
                                invitation_status = 'accepted', joined_at = NOW()
                            WHERE id = %s
                        """, (role, invited_by_user_id, record_id))
                        conn.commit()
                        return {
                            'success': True,
                            'message': f'User {user[1]} re-added to team as {role}',
                            'member': {
                                'id': record_id,
                                'user_id': user_id,
                                'full_name': user[1],
                                'email': email,
                                'role': role,
                                'status': 'active'
                            }
                        }

                    # 3. Add to team
                    # Generate UUID for the record ID
                    record_id = str(uuid.uuid4())

                    cur.execute("""
                        INSERT INTO company_team_members
                        (id, company_id, user_id, role, invited_by, invitation_status, joined_at)
                        -- 'accepted' is the ONLY value the permission layer honours:
                        -- workspace_middleware.py:83 and assessor_routes.py:745 both
                        -- filter on it. This previously wrote 'active', so every
                        -- member added here was granted nothing while the UI showed
                        -- a green "Active" badge. The DDL default stays 'pending'
                        -- (= no access), which is correct for a genuine unaccepted
                        -- invite; this path attaches an existing user directly, so
                        -- the membership is effective immediately.
                        VALUES (%s, %s, %s, %s, %s, 'accepted', NOW())
                        RETURNING id
                    """, (record_id, company_id, user_id, role, invited_by_user_id))
                    
                    conn.commit()
                    return {
                        'success': True, 
                        'message': f'User {user[1]} added to team as {role}',
                        'member': {
                            'id': record_id,
                            'user_id': user_id,
                            'full_name': user[1],
                            'email': email,
                            'role': role,
                            'status': 'active'
                        }
                    }
                    
        except Exception as e:
            logger.error(f"Error inviting member: {e}")
            return {'success': False, 'message': str(e)}

    # Roles whose ROLE_PERMISSIONS grant workspace.manage_employees — the
    # last-admin guard counts these (workspace_middleware.py vocabulary).
    ADMIN_TIER_ROLES = ('admin', 'employer_admin')
    # Roles assignable through the team API. Deliberately excludes anything
    # outside the workspace_middleware.ROLE_PERMISSIONS vocabulary.
    ASSIGNABLE_ROLES = ('admin', 'employer_admin', 'recruiter', 'member')

    def _other_admin_exists(self, cur, company_id: str, user_id) -> bool:
        cur.execute("""
            SELECT 1 FROM company_team_members
            WHERE company_id = %s AND user_id <> %s
              AND invitation_status = 'accepted' AND role IN %s
            LIMIT 1
        """, (company_id, str(user_id), self.ADMIN_TIER_ROLES))
        return cur.fetchone() is not None

    def _pick_reassign_owner(self, cur, company_id: str, exclude_user_id, fallback) -> str:
        """Choose a durable owner for a departing member's job postings: an
        accepted admin-tier member of the SAME company (never the one being
        removed); otherwise the actor performing the removal (who holds
        manage_employees). Never returns None, so a published job is never
        orphaned when its recruiter is removed (C1 UAT [C1-HRM-6])."""
        cur.execute("""
            SELECT user_id FROM company_team_members
            WHERE company_id = %s AND user_id <> %s
              AND invitation_status = 'accepted' AND role IN %s
            ORDER BY joined_at ASC NULLS LAST
            LIMIT 1
        """, (company_id, str(exclude_user_id), self.ADMIN_TIER_ROLES))
        row = cur.fetchone()
        if row and row.get('user_id'):
            return str(row['user_id'])
        return str(fallback)

    def _audit(self, cur, actor_id, action: str, company_id: str, details: dict):
        """Append to admin_audit_log (append-only, migration 002). Best-effort:
        a missing audit table must not turn revocation into a 500 — but log loudly."""
        try:
            cur.execute("SAVEPOINT sp_audit")
            cur.execute("""
                INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, details, created_at)
                VALUES (%s, %s, 'company', %s, %s, NOW())
            """, (str(actor_id), action, str(company_id), json.dumps(details)))
            cur.execute("RELEASE SAVEPOINT sp_audit")
        except Exception as e:
            cur.execute("ROLLBACK TO SAVEPOINT sp_audit")
            logger.error(f"AUDIT WRITE FAILED for {action} on {company_id}: {e}")

    def remove_member(self, company_id: str, user_id, removed_by) -> Dict[str, Any]:
        """Revoke a member's access to a company (issue #100).

        This used to hard-DELETE the membership row and nothing else, so the
        user vanished from the Team tab while keeping working access through
        hr_profiles (recruiter dashboard joins) and job_postings.recruiter_id
        (_resolve_job owner check). Now, in one transaction:
          1. soft-remove the membership (status 'removed' — the ACL honours
             only 'accepted'), preserving role/joined_at history;
          2. sever hr_profiles.company_id for this company;
          3. REASSIGN the company's job postings from the user to a durable
             company owner (recruiter_id only — created_by is provenance);
             never NULL, so a published job is never orphaned ([C1-HRM-6]);
          4. append an audit record.
        Refuses to remove the last admin-tier member (stranded company).
        """
        user_id = str(user_id)
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, role, invitation_status FROM company_team_members
                        WHERE company_id = %s AND user_id = %s
                        FOR UPDATE
                    """, (company_id, user_id))
                    member = cur.fetchone()
                    if not member:
                        return {'success': False, 'status': 404, 'message': 'Not a team member of this company'}
                    if member['invitation_status'] == 'removed':
                        return {'success': False, 'status': 409, 'message': 'Member already removed'}

                    if member['role'] in self.ADMIN_TIER_ROLES and \
                            not self._other_admin_exists(cur, company_id, user_id):
                        return {'success': False, 'status': 409,
                                'message': 'Cannot remove the last admin of this company'}

                    cur.execute("""
                        UPDATE company_team_members
                        SET invitation_status = 'removed'
                        WHERE id = %s
                    """, (member['id'],))

                    cur.execute("""
                        UPDATE hr_profiles SET company_id = NULL
                        WHERE user_id = %s AND company_id = %s
                    """, (user_id, company_id))
                    profiles_severed = cur.rowcount

                    # Reassign — never orphan — the departing member's job
                    # postings to a durable company owner (C1 UAT [C1-HRM-6]).
                    # Setting recruiter_id = NULL previously left published jobs
                    # ownerless and unrecoverable on re-add.
                    new_owner = self._pick_reassign_owner(cur, company_id, user_id, removed_by)
                    cur.execute("""
                        UPDATE job_postings SET recruiter_id = %s
                        WHERE company_id::text = %s AND recruiter_id = %s
                    """, (new_owner, str(company_id), user_id))
                    jobs_reassigned = cur.rowcount

                    self._audit(cur, removed_by, 'team.remove_member', company_id, {
                        'target_user_id': user_id,
                        'previous_role': member['role'],
                        'hr_profiles_severed': profiles_severed,
                        'jobs_reassigned': jobs_reassigned,
                        'reassigned_to': new_owner,
                    })
                    conn.commit()
                    return {'success': True, 'status': 200,
                            'message': 'Member removed and access revoked',
                            'hr_profiles_severed': profiles_severed,
                            'jobs_reassigned': jobs_reassigned,
                            'reassigned_to': new_owner}
        except Exception as e:
            logger.error(f"Error removing member: {e}")
            return {'success': False, 'status': 500, 'message': 'Failed to remove member'}

    def change_member_role(self, company_id: str, user_id, new_role: str, changed_by) -> Dict[str, Any]:
        """Change a member's team role in place (issue #100 — previously the
        only way was remove + re-add, losing joined_at). Guards the last
        admin against demotion."""
        user_id = str(user_id)
        if new_role not in self.ASSIGNABLE_ROLES:
            return {'success': False, 'status': 400,
                    'message': f"Invalid role. Must be one of: {', '.join(self.ASSIGNABLE_ROLES)}"}
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, role, invitation_status FROM company_team_members
                        WHERE company_id = %s AND user_id = %s
                        FOR UPDATE
                    """, (company_id, user_id))
                    member = cur.fetchone()
                    if not member or member['invitation_status'] != 'accepted':
                        return {'success': False, 'status': 404, 'message': 'Not an active team member'}
                    if member['role'] == new_role:
                        return {'success': True, 'status': 200, 'message': 'Role unchanged'}

                    demoting_admin = member['role'] in self.ADMIN_TIER_ROLES \
                        and new_role not in self.ADMIN_TIER_ROLES
                    if demoting_admin and not self._other_admin_exists(cur, company_id, user_id):
                        return {'success': False, 'status': 409,
                                'message': 'Cannot demote the last admin of this company'}

                    cur.execute("UPDATE company_team_members SET role = %s WHERE id = %s",
                                (new_role, member['id']))
                    self._audit(cur, changed_by, 'team.change_role', company_id, {
                        'target_user_id': user_id,
                        'old_role': member['role'],
                        'new_role': new_role,
                    })
                    conn.commit()
                    return {'success': True, 'status': 200,
                            'message': f'Role changed to {new_role}'}
        except Exception as e:
            logger.error(f"Error changing member role: {e}")
            return {'success': False, 'status': 500, 'message': 'Failed to change role'}
