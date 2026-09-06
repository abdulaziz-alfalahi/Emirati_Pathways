"""A candidate invites a recruiter to view their profile (migration 110).

Replaces the public CV share link. The platform is closed: a recruiter sees
a candidate INSIDE the platform, after joining it, and only while the
candidate's consent stands. The referral row is that consent — one named
recruiter, thirty days, revocable, every view recorded.

What happens depends on what the platform already knows:

  * the recruiter already has an account (matched on the email the candidate
    typed) -> 'granted' immediately, the recruiter is notified
  * the company is on the platform -> 'pending'; its workspace admins are
    asked to invite the person through the team-invitation flow they own
  * the company is unknown -> 'pending'; it appears in the growth operators'
    referral queue, where one click issues the company invitation
    (intended_role=recruiter) and links it here

Linking is lazy as well as eager: whenever a recruiter lists their referrals
or an invitation is redeemed, pending referrals whose email matches the
account are granted. Nobody but the candidate can widen or extend a grant;
only the candidate (or expiry) can end one.
"""
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

try:
    from backend.company_identity import find_company_id
    from backend.utils.contact_identity import canonical_email
    from backend.notification_helper import create_notification
except ImportError:  # pragma: no cover — the app runs under both roots
    from company_identity import find_company_id
    from utils.contact_identity import canonical_email
    from notification_helper import create_notification

logger = logging.getLogger(__name__)

GRANT_DAYS = 30
LIVE = ('pending', 'granted')


def _notify(user_id, kind, title, message, metadata=None):
    """Notifications never fail a referral."""
    try:
        create_notification(user_id, kind, title, message, metadata or {})
    except Exception as e:  # pragma: no cover — defensive
        logger.debug(f"referral notification skipped: {e}")


def _serialise(row: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(row)
    for k in ('grant_expires_at', 'last_viewed_at', 'revoked_at', 'created_at', 'updated_at'):
        if isinstance(out.get(k), datetime):
            out[k] = out[k].isoformat()
    for k in ('company_id', 'company_invitation_id'):
        if out.get(k) is not None:
            out[k] = str(out[k])
    return out


class CandidateReferralSystem:

    def __init__(self, db_connection=None):
        self._db = db_connection

    def _conn(self):
        if self._db is not None:
            return self._db
        return psycopg2.connect(
            host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'), dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'), password=os.getenv('DB_PASSWORD'), connect_timeout=10)

    # ------------------------------------------------------------------ candidate
    def create(self, candidate_id: str, recruiter_name: str, recruiter_email: str,
               company_name: Optional[str] = None, note: Optional[str] = None) -> Dict[str, Any]:
        email = canonical_email(recruiter_email or '')
        name = (recruiter_name or '').strip()
        company = (company_name or '').strip() or None
        if not name:
            raise ValueError("The recruiter's name is required")
        if not email or '@' not in email:
            raise ValueError("A valid work email for the recruiter is required")
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id, full_name FROM users WHERE lower(btrim(email)) = %s LIMIT 1", (email,))
                recruiter = cur.fetchone()
                company_id = find_company_id(cur, company) if company else None
                status = 'granted' if recruiter else 'pending'
                cur.execute("""
                    INSERT INTO candidate_recruiter_referrals
                        (candidate_id, recruiter_name, recruiter_email, company_name, company_id,
                         recruiter_user_id, note, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (candidate_id, recruiter_email) WHERE status IN ('pending', 'granted')
                    DO UPDATE SET recruiter_name = EXCLUDED.recruiter_name,
                                  company_name = COALESCE(EXCLUDED.company_name, candidate_recruiter_referrals.company_name),
                                  company_id = COALESCE(EXCLUDED.company_id, candidate_recruiter_referrals.company_id),
                                  note = COALESCE(EXCLUDED.note, candidate_recruiter_referrals.note),
                                  grant_expires_at = now() + interval '30 days',
                                  updated_at = now()
                    RETURNING *
                """, (candidate_id, name, email, company, company_id,
                      recruiter['id'] if recruiter else None, (note or '').strip() or None, status))
                row = dict(cur.fetchone())
                cur.execute("SELECT full_name FROM users WHERE id = %s", (candidate_id,))
                cand = cur.fetchone() or {}
                candidate_name = cand.get('full_name') or 'A candidate'
                row['route'] = self._route(cur, row, recruiter, company_id, candidate_name)
            conn.commit()
        finally:
            if self._db is None:
                conn.close()
        return _serialise(row)

    def _route(self, cur, row, recruiter, company_id, candidate_name) -> str:
        """Tell the right people, and say which path the referral took."""
        if recruiter:
            _notify(recruiter['id'], 'referral_received',
                    f"{candidate_name} invited you to view their profile",
                    "Open Candidates → Invited by candidates on your dashboard.",
                    {'referral_id': row['id'], 'candidate_id': row['candidate_id']})
            return 'granted'
        if company_id:
            cur.execute("""
                SELECT DISTINCT user_id FROM company_team_members
                WHERE company_id = %s AND invitation_status = 'accepted'
                  AND role = 'admin'
                UNION SELECT workspace_admin_id FROM companies WHERE id = %s AND workspace_admin_id IS NOT NULL
            """, (company_id, company_id))
            admins = [r['user_id'] for r in cur.fetchall() if r.get('user_id')]
            for admin_id in admins:
                _notify(admin_id, 'referral_pending_company',
                        f"{candidate_name} invited {row['recruiter_name']} to the platform",
                        f"Invite {row['recruiter_name']} ({row['recruiter_email']}) to your team so they can view the candidate.",
                        {'referral_id': row['id'], 'recruiter_email': row['recruiter_email']})
            return 'company_admins' if admins else 'operators'
        return 'operators'

    def list_for_candidate(self, candidate_id: str) -> List[Dict[str, Any]]:
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                self._expire(cur)
                cur.execute("""
                    SELECT r.*, u.full_name AS recruiter_account_name,
                           c.company_name AS company_display_name
                    FROM candidate_recruiter_referrals r
                    LEFT JOIN users u ON u.id = r.recruiter_user_id
                    LEFT JOIN companies c ON c.id = r.company_id
                    WHERE r.candidate_id = %s ORDER BY r.created_at DESC
                """, (candidate_id,))
                rows = [_serialise(r) for r in cur.fetchall()]
            conn.commit()
        finally:
            if self._db is None:
                conn.close()
        return rows

    def revoke(self, candidate_id: str, referral_id: int) -> bool:
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    UPDATE candidate_recruiter_referrals
                    SET status = 'revoked', revoked_at = now(), updated_at = now()
                    WHERE id = %s AND candidate_id = %s AND status IN ('pending', 'granted')
                    RETURNING recruiter_user_id
                """, (referral_id, candidate_id))
                row = cur.fetchone()
            conn.commit()
        finally:
            if self._db is None:
                conn.close()
        return row is not None

    # ------------------------------------------------------------------ recruiter
    @staticmethod
    def link_for_user(cur, user_id: str, email: Optional[str]) -> int:
        """Grant every pending referral addressed to this account's email.
        Called when a recruiter lists their referrals and when an invitation
        is redeemed, so a recruiter who joined by ANY path is linked."""
        email = canonical_email(email or '')
        if not email:
            return 0
        cur.execute("""
            UPDATE candidate_recruiter_referrals
            SET recruiter_user_id = %s, status = 'granted', updated_at = now()
            WHERE recruiter_email = %s AND status = 'pending'
              AND grant_expires_at > now()
            RETURNING id, candidate_id, recruiter_name
        """, (user_id, email))
        linked = cur.fetchall() or []
        for r in linked:
            row = dict(r) if not isinstance(r, dict) else r
            _notify(row['candidate_id'], 'referral_granted',
                    f"{row['recruiter_name']} has joined the platform",
                    "They can now view your profile for 30 days. You can withdraw this from CV Preview at any time.",
                    {'referral_id': row['id']})
        return len(linked)

    def list_for_recruiter(self, user_id: str, email: Optional[str]) -> List[Dict[str, Any]]:
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                self._expire(cur)
                self.link_for_user(cur, user_id, email)
                cur.execute("""
                    SELECT r.id, r.candidate_id, r.note, r.created_at, r.grant_expires_at,
                           r.view_count, r.last_viewed_at,
                           u.full_name AS candidate_name, cp.headline, cp.location
                    FROM candidate_recruiter_referrals r
                    JOIN users u ON u.id = r.candidate_id
                    LEFT JOIN candidate_profiles cp ON cp.user_id = r.candidate_id
                    WHERE r.recruiter_user_id = %s AND r.status = 'granted'
                      AND r.grant_expires_at > now()
                    ORDER BY r.created_at DESC
                """, (user_id,))
                rows = [_serialise(r) for r in cur.fetchall()]
            conn.commit()
        finally:
            if self._db is None:
                conn.close()
        return rows

    def has_grant(self, recruiter_user_id: str, candidate_id: str) -> bool:
        conn = self._conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 1 FROM candidate_recruiter_referrals
                    WHERE recruiter_user_id = %s AND candidate_id = %s
                      AND status = 'granted' AND grant_expires_at > now() LIMIT 1
                """, (recruiter_user_id, candidate_id))
                ok = cur.fetchone() is not None
        finally:
            if self._db is None:
                conn.close()
        return ok

    def record_view(self, recruiter_user_id: str, candidate_id: str) -> bool:
        """The candidate sees who looked and when."""
        conn = self._conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE candidate_recruiter_referrals
                    SET view_count = view_count + 1, last_viewed_at = now(), updated_at = now()
                    WHERE recruiter_user_id = %s AND candidate_id = %s
                      AND status = 'granted' AND grant_expires_at > now()
                """, (recruiter_user_id, candidate_id))
                n = cur.rowcount
            conn.commit()
        finally:
            if self._db is None:
                conn.close()
        return n > 0

    # ------------------------------------------------------------------ operators
    def list_pending_for_operators(self) -> List[Dict[str, Any]]:
        """Referrals nobody on the platform can act on yet: an unknown company,
        or a known one with no admin to ask."""
        conn = self._conn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                self._expire(cur)
                cur.execute("""
                    SELECT r.*, u.full_name AS candidate_name,
                           c.company_name AS company_display_name, c.is_verified,
                           COALESCE(c.workspace_enabled, FALSE) AS workspace_enabled,
                           ci.status AS invitation_status
                    FROM candidate_recruiter_referrals r
                    JOIN users u ON u.id = r.candidate_id
                    LEFT JOIN companies c ON c.id = r.company_id
                    LEFT JOIN company_invitations ci ON ci.id = r.company_invitation_id
                    WHERE r.status = 'pending'
                    ORDER BY r.created_at DESC
                """)
                rows = [_serialise(r) for r in cur.fetchall()]
            conn.commit()
        finally:
            if self._db is None:
                conn.close()
        return rows

    def attach_company_invitation(self, referral_id: int, invitation_id) -> bool:
        conn = self._conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE candidate_recruiter_referrals
                    SET company_invitation_id = %s, updated_at = now()
                    WHERE id = %s AND status = 'pending'
                """, (str(invitation_id), referral_id))
                n = cur.rowcount
            conn.commit()
        finally:
            if self._db is None:
                conn.close()
        return n > 0

    @staticmethod
    def _expire(cur) -> None:
        cur.execute("""
            UPDATE candidate_recruiter_referrals SET status = 'expired', updated_at = now()
            WHERE status IN ('pending', 'granted') AND grant_expires_at <= now()
        """)
