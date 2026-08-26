import os
import json
import logging
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

try:
    from backend.user_helpers import user_display_name
except ImportError:  # pragma: no cover
    from user_helpers import user_display_name

# Roles an HR manager may hand out through a team invite link (never admin/owner).
_INVITABLE_TEAM_ROLES = {'recruiter', 'hr_manager', 'hr'}

try:
    from backend import outbound_mail
    from backend.brand import (PLATFORM_NAME_EN, PLATFORM_NAME_AR,
                               COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE)
except ImportError:  # pragma: no cover — the app runs under both roots
    import outbound_mail
    from brand import (PLATFORM_NAME_EN, PLATFORM_NAME_AR,
                       COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE)

from html import escape as html_escape


#: What a colleague is being invited to do. Note hr_manager IS here, unlike the
#: operator's outreach invitation which can only confer recruiter or
#: employer_admin — the employer knows who their HR manager is and the operator
#: does not, which is the whole reason a first contact becomes an administrator.
_TEAM_ROLE_LABELS = {
    'recruiter': ('publish vacancies and review candidates',
                  'نشر الشواغر والاطلاع على المرشحين'),
    'hr_manager': ('manage hiring and review candidates for your organisation',
                   'إدارة التوظيف والاطلاع على المرشحين لمؤسستكم'),
    'hr': ('review candidates for your organisation',
           'الاطلاع على المرشحين لمؤسستكم'),
}


def _team_role_label(role, arabic=False):
    en, ar = _TEAM_ROLE_LABELS.get((role or '').strip().lower(),
                                   _TEAM_ROLE_LABELS['recruiter'])
    return ar if arabic else en


def _team_invitation_subject(company_name):
    """English first — this reaches a colleague at an employer."""
    return (f'You have been invited to join {company_name} on the '
            f'{PLATFORM_NAME_EN} / '
            f'دعوة للانضمام إلى {company_name} على {PLATFORM_NAME_AR}')


def _team_invitation_body(company_name, inviter_name, link, role=None):
    """Plain-text team invitation, English first.

    THE INVITER IS NAMED, and that is the point. Every other message from this
    platform arrives unbidden from a government body; this one arrives because
    a named colleague at the recipient's own employer asked for it. Saying who
    is the difference between a credible invitation and one that reads as
    phishing — and this is the only message where we actually know.
    """
    by = f'{inviter_name} at {company_name}' if inviter_name else company_name
    by_ar = f'{inviter_name} من {company_name}' if inviter_name else company_name
    return (
        f"Hello,\n"
        f"\n"
        f"{by} has invited you to join their team on the {PLATFORM_NAME_EN}.\n"
        f"\n"
        f"You will be able to {_team_role_label(role)}.\n"
        f"\n"
        f"To accept, open this link:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"You will be asked to verify your identity with UAE Pass.\n"
        f"If you were not expecting this, you can ignore this message.\n"
        f"\n"
        f"— {COUNCIL_NAME_EN}\n"
        f"\n"
        f"{BILINGUAL_RULE}\n"
        f"\n"
        f"مرحباً،\n"
        f"\n"
        f"دعاك {by_ar} للانضمام إلى فريق مؤسستكم على {PLATFORM_NAME_AR}.\n"
        f"\n"
        f"ستتمكّن من {_team_role_label(role, arabic=True)}.\n"
        f"\n"
        f"لقبول الدعوة، افتح الرابط التالي:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"سيُطلب منك إثبات هويتك عبر الهوية الرقمية.\n"
        f"إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها.\n"
        f"\n"
        f"— {COUNCIL_NAME_AR}\n"
    )


def _team_invitation_html(company_name, inviter_name, link, role=None):
    """The delivered team invitation. English block first, Arabic second.

    Company name, inviter name and role label are all escaped: the inviter's
    name comes from a user record and the company name from a NAFIS CSV.
    """
    company = html_escape(company_name or '')
    inviter = html_escape(inviter_name or '')
    href = html_escape(link, quote=True)
    link_style = 'color:#1E40AF;word-break:break-all'
    p = 'margin:0 0 14px'
    by = f'<strong>{inviter}</strong> at <strong>{company}</strong>' if inviter else f'<strong>{company}</strong>'
    by_ar = f'<strong>{inviter}</strong> من <strong>{company}</strong>' if inviter else f'<strong>{company}</strong>'
    return (
        '<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;'
        'font-size:15px;line-height:1.6;color:#1F2937">'
        f'<div dir="ltr" style="text-align:left">'
        f'<p style="{p}">Hello,</p>'
        f'<p style="{p}">{by} has invited you to join their team on the '
        f'{PLATFORM_NAME_EN}.</p>'
        f'<p style="{p}">You will be able to '
        f'<strong>{html_escape(_team_role_label(role))}</strong>.</p>'
        f'<p style="{p}">To accept, open this link:</p>'
        f'<p style="{p}"><a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">You will be asked to verify your identity with UAE '
        'Pass.<br>If you were not expecting this, you can ignore this message.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_EN}</p>'
        '</div>'
        '<hr style="border:none;border-top:1px solid #D1D5DB;margin:22px 0">'
        f'<div dir="rtl" style="text-align:right">'
        f'<p style="{p}">مرحباً،</p>'
        f'<p style="{p}">دعاك {by_ar} للانضمام إلى فريق مؤسستكم على '
        f'{PLATFORM_NAME_AR}.</p>'
        f'<p style="{p}">ستتمكّن من '
        f'<strong>{html_escape(_team_role_label(role, arabic=True))}</strong>.</p>'
        f'<p style="{p}">لقبول الدعوة، افتح الرابط التالي:</p>'
        f'<p style="{p};text-align:right" dir="ltr">'
        f'<a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">سيُطلب منك إثبات هويتك عبر الهوية الرقمية.<br>'
        'إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_AR}</p>'
        '</div>'
        '</div>'
    )

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
                    # full_name via user_display_name so a null full_name column
                    # falls back to first||last then email (C1 UAT [C1-HRM-6]/[C1-REC-1]
                    # roster showed null names).
                    query = f"""
                        SELECT
                            ctm.id,
                            ctm.user_id,
                            ctm.role,
                            ctm.permissions,
                            ctm.invitation_status,
                            ctm.joined_at,
                            {user_display_name('full_name', 'u')},
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

    def create_team_invitation(self, company_id: str, role: str, invited_by_user_id,
                               email: str = None) -> Dict[str, Any]:
        """Create a magic-link invitation to join this workspace as a teammate.

        The link works for a brand-new user (they register via UAE Pass and are
        added on redemption) or an existing one. Carries company_id — never a
        name.

        EMAIL IS OPTIONAL, and deliberately so. Passing an address queues a
        message for the colleague; omitting it returns the link exactly as
        before, for an administrator who would rather hand it over in person or
        by whatever channel their organisation actually uses. Forcing the email
        path would have removed a working option to add a new one.

        This flow became load-bearing on 2026-08-26, when a first contact
        started conferring employer_admin — an administrator whose entire
        purpose is to invite their own colleagues. Until now it ended in a
        printed link.
        """
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
                    invitation_id = cur.fetchone()['id']
                    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:8089')
                    link = f"{frontend_url}/join-team/{token}"

                    message_id = None
                    address = (email or '').strip()
                    if address:
                        # Who is doing the inviting. Named in the message
                        # because this is the ONE outbound message where we
                        # actually know — every other arrives unbidden from a
                        # government body, and a colleague's name is the
                        # difference between credible and phishing.
                        cur.execute(
                            "SELECT COALESCE(full_name, first_name) AS n FROM users WHERE id = %s",
                            (str(invited_by_user_id),))
                        inviter = cur.fetchone()
                        inviter_name = (inviter or {}).get('n')

                        # On THIS cursor, so the message commits or rolls back
                        # with the token it carries.
                        message_id = outbound_mail.queue(
                            to_email=address,
                            subject=_team_invitation_subject(company['name']),
                            body_text=_team_invitation_body(
                                company['name'], inviter_name, link, role),
                            body_html=_team_invitation_html(
                                company['name'], inviter_name, link, role),
                            kind='team_invitation',
                            related_type='team_invitation',
                            related_id=str(invitation_id),
                            created_by=str(invited_by_user_id),
                            cursor=cur)

                    conn.commit()
                    return {'success': True, 'token': token, 'role': role,
                            'company_name': company['name'],
                            'invite_link': link,
                            'message_id': message_id,
                            'message_status': ('awaiting_approval' if message_id
                                               else 'no_email_given')}
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
    # Roles assignable through the team API. Includes the same team vocabulary
    # the invite/link flow issues (_INVITABLE_TEAM_ROLES: recruiter/hr_manager/hr)
    # so a role granted by invite can also be set via change-role — the C1 UAT
    # [C1-HRM-6] mismatch where 'hr' was rejected by change_member_role.
    ASSIGNABLE_ROLES = ('admin', 'employer_admin', 'recruiter', 'hr_manager', 'hr', 'member')

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
