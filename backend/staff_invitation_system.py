"""Platform-staff magic-link invitations (migration 045).

The persona model: nationals onboard themselves as candidates; NON-NATIONALS
enter only through an operator-issued magic link that carries the role. The
existing invitation paths are company-bound (employer onboarding, HR team), so
platform staff — EHRDC's CRM/career-services team, call-centre agents,
operators — had no way in. An admin issues an invitation here; the invitee
opens /join-staff/<token>, signs in with UAE Pass, and the OAuth callback
redeems the invitation against the identity UAE Pass proved (issue #90: never
bind an invitation to a phone/email supplied by the redeemer).
"""
import logging
import os
import secrets
from datetime import datetime, timedelta

import psycopg2
from psycopg2.extras import RealDictCursor

try:
    from backend.db import get_db_connection
except ImportError:  # pragma: no cover — the app runs under both roots
    from db import get_db_connection

logger = logging.getLogger(__name__)

# Roles a staff invitation may confer. Deliberately excludes `admin` /
# `administrator` (privilege escalation by link forwarding) and the
# company-side roles, which have their own company-bound invitation flows.
ALLOWED_STAFF_ROLES = (
    'career_services_operator',
    'call_center_agent',
    'talent_operator',
    'platform_operator',
    'education_operator',
    'assessment_operator',
    'mentorship_operator',
    'community_operator',
    'professional_dev_operator',
    'employer_relations',
    'advisor',
    'internship_coordinator',
    'assessor',
    'coach',
    'mentor',
    'compliance_auditor',
)
DEFAULT_EXPIRY_DAYS = 7

try:
    from backend import outbound_mail
    from backend.brand import (PLATFORM_NAME_EN, PLATFORM_NAME_AR,
                               COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE)
except ImportError:  # pragma: no cover — the app runs under both roots
    import outbound_mail
    from brand import (PLATFORM_NAME_EN, PLATFORM_NAME_AR,
                       COUNCIL_NAME_EN, COUNCIL_NAME_AR, BILINGUAL_RULE)

from html import escape as html_escape


#: The role is NAMED in this message, unlike the employer invitation.
#
# That difference is deliberate. An employer invitation goes to a shared mailbox
# from a NAFIS CSV, so the operator was guessing a job title for someone they
# could not identify. Here the operator typed this person's name, address and
# role on purpose — the role is a fact about the invitation, not a guess about
# the reader, and leaving it out would make a government email vaguer than it
# needs to be.
#
# ARABIC BELOW IS A BEST RENDERING and is worth a native check before this
# carries real traffic; the English is authoritative.
_STAFF_ROLE_LABELS = {
    'career_services_operator': ('Career Services Operator', 'مشغّل خدمات المسار المهني'),
    'call_center_agent':        ('Call Centre Agent', 'موظف مركز الاتصال'),
    'talent_operator':          ('Talent Operator', 'مشغّل المواهب'),
    'platform_operator':        ('Platform Operator', 'مشغّل المنصة'),
    'education_operator':       ('Education Operator', 'مشغّل قطاع التعليم'),
    'assessment_operator':      ('Assessment Operator', 'مشغّل التقييم'),
    'mentorship_operator':      ('Mentorship Operator', 'مشغّل الإرشاد'),
    'community_operator':       ('Community Operator', 'مشغّل المجتمعات'),
    'professional_dev_operator':('Professional Development Operator', 'مشغّل التطوير المهني'),
    'employer_relations':       ('Employer Relations', 'علاقات جهات العمل'),
    'advisor':                  ('Academic Advisor', 'المرشد الأكاديمي'),
    'internship_coordinator':   ('Internship Coordinator', 'منسّق التدريب العملي'),
    'assessor':                 ('Assessor', 'المُقيِّم'),
    'coach':                    ('Career Coach', 'المدرّب المهني'),
    'mentor':                   ('Mentor', 'الموجّه'),
    'compliance_auditor':       ('Compliance Auditor', 'مدقّق الامتثال'),
}


def _staff_role_label(role, arabic=False):
    pair = _STAFF_ROLE_LABELS.get((role or '').strip().lower())
    if not pair:
        # Should be unreachable: validate_role rejects anything not invitable.
        # If it ever happens, show nothing rather than a raw identifier.
        return 'المنصة' if arabic else 'the platform'
    return pair[1] if arabic else pair[0]


def _staff_invitation_subject(role):
    """English first. Arabic leads only the NAFIS candidate invitation, whose
    audience is specifically Emirati nationals; everything else on this
    platform is professional correspondence."""
    return (f'Your invitation to join the {PLATFORM_NAME_EN} as '
            f'{_staff_role_label(role)} / '
            f'دعوتك للانضمام إلى {PLATFORM_NAME_AR}')


def _staff_invitation_body(full_name, role, link, organization=None):
    """Plain-text staff invitation, English first.

    THIS ONE IS ADDRESSED TO A PERSON. Every other outbound message goes to an
    organisation or a mailbox taken from a spreadsheet; here the operator typed
    a name, so the message uses it.
    """
    who = full_name or 'Colleague'
    org_en = f' on behalf of {organization}' if organization else ''
    org_ar = f' نيابةً عن {organization}' if organization else ''
    return (
        f"Dear {who},\n"
        f"\n"
        f"You have been invited{org_en} to join the {PLATFORM_NAME_EN} as "
        f"{_staff_role_label(role)}.\n"
        f"\n"
        f"To accept, open this link:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"You will be asked to verify your identity with UAE Pass. The link is "
        f"valid for 7 days and can only be used once.\n"
        f"If you were not expecting this invitation, you can ignore this message.\n"
        f"\n"
        f"— {COUNCIL_NAME_EN}\n"
        f"\n"
        f"{BILINGUAL_RULE}\n"
        f"\n"
        f"عزيزي/عزيزتي {who}،\n"
        f"\n"
        f"تمت دعوتك{org_ar} للانضمام إلى {PLATFORM_NAME_AR} بصفة "
        f"{_staff_role_label(role, arabic=True)}.\n"
        f"\n"
        f"لقبول الدعوة، افتح الرابط التالي:\n"
        f"\n"
        f"{link}\n"
        f"\n"
        f"سيُطلب منك إثبات هويتك عبر الهوية الرقمية. الرابط صالح لمدة 7 أيام "
        f"ويُستخدم مرة واحدة فقط.\n"
        f"إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة.\n"
        f"\n"
        f"— {COUNCIL_NAME_AR}\n"
    )


def _staff_invitation_html(full_name, role, link, organization=None):
    """The delivered staff invitation. English block first, Arabic second."""
    who = html_escape(full_name or 'Colleague')
    org = html_escape(organization or '')
    href = html_escape(link, quote=True)
    link_style = 'color:#1E40AF;word-break:break-all'
    p = 'margin:0 0 14px'
    org_en = f' on behalf of <strong>{org}</strong>' if org else ''
    org_ar = f' نيابةً عن <strong>{org}</strong>' if org else ''
    return (
        '<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;'
        'font-size:15px;line-height:1.6;color:#1F2937">'
        f'<div dir="ltr" style="text-align:left">'
        f'<p style="{p}">Dear {who},</p>'
        f'<p style="{p}">You have been invited{org_en} to join the '
        f'{PLATFORM_NAME_EN} as '
        f'<strong>{html_escape(_staff_role_label(role))}</strong>.</p>'
        f'<p style="{p}">To accept, open this link:</p>'
        f'<p style="{p}"><a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">You will be asked to verify your identity with UAE '
        'Pass. The link is valid for 7 days and can only be used once.<br>'
        'If you were not expecting this invitation, you can ignore this '
        'message.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_EN}</p>'
        '</div>'
        '<hr style="border:none;border-top:1px solid #D1D5DB;margin:22px 0">'
        f'<div dir="rtl" style="text-align:right">'
        f'<p style="{p}">عزيزي/عزيزتي {who}،</p>'
        f'<p style="{p}">تمت دعوتك{org_ar} للانضمام إلى {PLATFORM_NAME_AR} بصفة '
        f'<strong>{html_escape(_staff_role_label(role, arabic=True))}</strong>.</p>'
        f'<p style="{p}">لقبول الدعوة، افتح الرابط التالي:</p>'
        f'<p style="{p};text-align:right" dir="ltr">'
        f'<a href="{href}" style="{link_style}">{href}</a></p>'
        f'<p style="{p}">سيُطلب منك إثبات هويتك عبر الهوية الرقمية. الرابط صالح '
        'لمدة 7 أيام ويُستخدم مرة واحدة فقط.<br>إذا لم تكن تتوقع هذه الدعوة، '
        'يمكنك تجاهل هذه الرسالة.</p>'
        f'<p style="{p}">— {COUNCIL_NAME_AR}</p>'
        '</div>'
        '</div>'
    )


class StaffInvitationSystem:
    """Create / list / revoke / redeem platform-staff invitations."""

    @staticmethod
    def _conn():
        return get_db_connection()

    @classmethod
    def validate_role(cls, role):
        """Return the role if invitable, else None. Never widens privileges:
        an unknown or admin-ish value is rejected rather than downgraded, so a
        typo surfaces as an error instead of silently granting something else.
        """
        r = (role or '').strip().lower()
        return r if r in ALLOWED_STAFF_ROLES else None

    def create_invitation(self, *, full_name, email, intended_role, invited_by,
                          phone=None, organization=None, notes=None,
                          expiry_days=DEFAULT_EXPIRY_DAYS):
        role = self.validate_role(intended_role)
        if not role:
            raise ValueError(f"'{intended_role}' is not an invitable staff role")

        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=int(expiry_days or DEFAULT_EXPIRY_DAYS))

        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO staff_invitations
                        (token, full_name, email, phone, intended_role, organization,
                         notes, expires_at, invited_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                """, (token, full_name, email, phone, role, organization, notes,
                      expires_at, str(invited_by)[:15] if invited_by else None))
                row = dict(cur.fetchone())

                # Queue the invitation email on THIS cursor, so the message
                # commits or rolls back with the token it carries. An address
                # is mandatory for a staff invitation, unlike a colleague
                # invitation, so there is no no-email branch here.
                link = self.build_link(token)
                row['message_id'] = outbound_mail.queue(
                    to_email=email,
                    to_name=full_name,
                    subject=_staff_invitation_subject(role),
                    body_text=_staff_invitation_body(
                        full_name, role, link, organization),
                    body_html=_staff_invitation_html(
                        full_name, role, link, organization),
                    kind='staff_invitation',
                    related_type='staff_invitation',
                    related_id=str(row.get('id')),
                    created_by=str(invited_by)[:15] if invited_by else None,
                    cursor=cur)
            conn.commit()
        finally:
            conn.close()

        # The link is still returned. An administrator may need to pass it on
        # by hand — the message waits for approval, and somebody starting on
        # Sunday should not be blocked on a review queue.
        row['magic_link'] = self.build_link(token)
        row['message_status'] = ('awaiting_approval' if row.get('message_id')
                                 else 'not_queued')
        return row

    @staticmethod
    def build_link(token):
        """Absolute magic link.

        Prefer the public host the admin is actually browsing (the request's
        Host header through the WAF) — FRONTEND_URL on the servers points at
        the internal origin (10.228.145.5:8089), which the invitee cannot
        reach. Falls back to explicit config, then the staging domain.
        """
        base = ''
        try:
            from flask import request as _rq
            if _rq:
                origin = _rq.headers.get('Origin') or ''
                if origin.startswith('http'):
                    base = origin
                elif _rq.host_url:
                    base = _rq.host_url
        except Exception:
            pass
        if not base or '10.228.' in base or 'localhost' in base or '127.0.0.1' in base:
            base = (os.environ.get('PUBLIC_BASE_URL')
                    or os.environ.get('FRONTEND_URL')
                    or 'https://stg-emirati.ehrdc.gov.ae')
            if '10.228.' in base or 'localhost' in base or '127.0.0.1' in base:
                base = 'https://stg-emirati.ehrdc.gov.ae'
        return f"{base.rstrip('/')}/join-staff/{token}"

    def list_invitations(self, include_used=True):
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"""
                    SELECT si.*,
                           COALESCE(u.full_name, u.email) AS invited_by_name,
                           COALESCE(cu.full_name, cu.email) AS accepted_by_name
                    FROM staff_invitations si
                    LEFT JOIN users u  ON u.id = si.invited_by
                    LEFT JOIN users cu ON cu.id = si.created_user_id
                    {'' if include_used else "WHERE si.status = 'pending'"}
                    ORDER BY si.created_at DESC
                    LIMIT 500
                """)
                rows = [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

        now = datetime.now()
        for r in rows:
            exp = r.get('expires_at')
            if r.get('status') == 'pending' and exp and exp.replace(tzinfo=None) <= now:
                r['status'] = 'expired'
            r['magic_link'] = self.build_link(r['token'])
            for k in ('expires_at', 'accepted_at', 'created_at', 'updated_at', 'revoked_at'):
                if r.get(k):
                    r[k] = r[k].isoformat()
        return rows

    def revoke_invitation(self, invitation_id):
        conn = self._conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE staff_invitations
                    SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
                    WHERE id = %s AND is_used = false
                """, (invitation_id,))
                n = cur.rowcount
            conn.commit()
        finally:
            conn.close()
        if not n:
            raise ValueError("Invitation not found, or already redeemed")
        return True

    def preview(self, token):
        """Public, unauthenticated: what the landing page shows before sign-in.
        Returns no PII beyond the invitee's own name and the offered role."""
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT full_name, intended_role, organization, status, is_used, expires_at
                    FROM staff_invitations WHERE token = %s
                """, (token,))
                row = cur.fetchone()
        finally:
            conn.close()
        if not row:
            return {'valid': False}
        expired = row['expires_at'] and row['expires_at'].replace(tzinfo=None) <= datetime.now()
        return {
            'valid': bool(not row['is_used'] and row['status'] == 'pending' and not expired),
            'full_name': row['full_name'],
            'role': row['intended_role'],
            'organization': row['organization'],
        }

    def redeem_staff_invitation_for_user(self, token, user_id, is_new_user=False):
        """Grant the invited role to the UAE-Pass-proven identity.

        Mirrors the company/team redeemers: a brand-new account takes the
        invited role as PRIMARY (this person joined as staff); an existing
        account keeps its primary role and gains the invited role as a
        SECONDARY role — resolve_roles() unions both columns. Roles are stored
        as lowercase slugs (a Title-Case grant once failed every guard).
        """
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM staff_invitations
                    WHERE token = %s AND is_used = false AND status = 'pending'
                      AND expires_at > NOW()
                    FOR UPDATE
                """, (token,))
                inv = cur.fetchone()
                if not inv:
                    raise ValueError("Invalid, expired, or already used invitation link")

                role = self.validate_role(inv['intended_role'])
                if not role:
                    raise ValueError("This invitation carries an unsupported role")

                cur.execute("SELECT id, role FROM users WHERE id = %s FOR UPDATE", (user_id,))
                user = cur.fetchone()
                if not user:
                    raise ValueError("User account not found for invitation redemption")

                if is_new_user:
                    cur.execute("""
                        UPDATE users SET role = %s, user_type = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (role, role, user_id))
                    primary_role = role
                else:
                    cur.execute("""
                        UPDATE users
                        SET secondary_roles = COALESCE((
                                SELECT jsonb_agg(DISTINCT r)
                                FROM jsonb_array_elements_text(
                                    COALESCE(secondary_roles, '[]'::jsonb) || to_jsonb(%s::text)
                                ) AS t(r)
                            ), '[]'::jsonb),
                            updated_at = NOW()
                        WHERE id = %s
                    """, (role, user_id))
                    primary_role = user.get('role')

                # Fill contact gaps from the invitation — never overwrite what
                # UAE Pass already provided.
                cur.execute("""
                    UPDATE users
                    SET full_name = COALESCE(NULLIF(full_name, ''), %s),
                        email     = COALESCE(NULLIF(email, ''), %s),
                        phone     = COALESCE(NULLIF(phone, ''), %s)
                    WHERE id = %s
                """, (inv.get('full_name'), inv.get('email'), inv.get('phone'), user_id))

                cur.execute("""
                    UPDATE staff_invitations
                    SET is_used = true, status = 'accepted', accepted_at = NOW(),
                        created_user_id = %s, updated_at = NOW()
                    WHERE id = %s
                """, (str(user_id)[:15], inv['id']))
            conn.commit()
        finally:
            conn.close()

        logger.info(f"Staff invitation {inv['id']} redeemed -> role {role}")
        return {'success': True, 'user_id': user_id, 'role': role,
                'primary_role': primary_role, 'invitation_id': inv['id']}
