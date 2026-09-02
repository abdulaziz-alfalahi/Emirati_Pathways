"""Give a company its workspace the moment somebody approves the company.

OWNER, 2026-09-02:

    "The idea is to create a workspace for the company on the platform so the HR
     Manager, recruiters, and their Emirati staff can be in one space... Can we
     have the workspace auto-provisioned once the company joins and creates its
     profile?"

WHY VERIFICATION IS THE TRIGGER, NOT PROFILE CREATION

Verification is the moment a named operator decides this employer is real —
and since migration 107 it is guaranteed to name that person. Profile creation
is something an unapproved company can do, so provisioning there would hand a
workspace to an employer nobody has approved yet. Verification is also the gate
that lets a company publish vacancies, so the two capabilities arrive together
rather than a company being able to hire before it has anywhere to work.

WHY THE MANUAL BUTTON STAYS

Automatic provisioning that fails silently is worse than a button, because
nobody discovers the missing workspace until an HR manager cannot find their
own company. Provisioning here is BEST EFFORT and runs after the approval is
committed: a workspace problem must never cost a company its verification, which
is the decision an operator actually made. When it fails it says so loudly, and
the operator's existing "Provision Workspace" button is the repair path.

(There is nothing to back-fill: the owner confirms no company has been onboarded
yet, and the workspace-enabled companies presently in the database are test
fixtures.)
"""
import logging

logger = logging.getLogger(__name__)


def slug_for(cur, company_name, company_id):
    """A URL-safe, unique slug.

    ASCII only. The rule inherited from the manual route filtered on
    `str.isalnum()`, which is TRUE for Arabic — so a company named
    "شركة الإمارات" produced the slug "شركة-الإمارات" and put non-ASCII into a
    URL. No company on the platform carries an Arabic name today, so it had
    never shown up, but real employers here will.

    A name with nothing ASCII in it falls back to the company id, which is
    unique by construction rather than colliding on a shared "company".
    """
    raw = (company_name or '').lower().replace(' ', '-').replace('&', 'and')
    slug = ''.join(c for c in raw
                   if (c.isascii() and c.isalnum()) or c == '-').strip('-')[:100]
    if not slug:
        slug = f'company-{str(company_id)[:8]}'

    cur.execute("SELECT COUNT(*) AS n FROM companies WHERE workspace_slug = %s", (slug,))
    row = cur.fetchone()
    taken = (row['n'] if isinstance(row, dict) else row[0]) if row else 0
    if taken:
        slug = f"{slug}-{str(company_id)[:8]}"
    return slug


def choose_admin(cur, company_id):
    """Who owns this workspace?

    The company's own accepted team members, preferring whoever holds the
    employer-admin role. Falls back to the earliest accepted member, and to
    nobody at all — a workspace with no admin is still better than no workspace,
    and it is exactly the state nine of the ten existing fixtures are in because
    provisioning was a separate step somebody skipped.
    """
    cur.execute("""
        SELECT user_id, role
          FROM company_team_members
         WHERE company_id = %s AND invitation_status = 'accepted'
         ORDER BY CASE WHEN role IN ('admin', 'employer_admin', 'hr_manager')
                       THEN 0 ELSE 1 END,
                  joined_at NULLS LAST
         LIMIT 1
    """, (company_id,))
    row = cur.fetchone()
    if not row:
        return None
    return row['user_id'] if isinstance(row, dict) else row[0]


def provision(cur, company_id, provisioner_id, admin_user_id=None, slug=None):
    """Enable the workspace for one company. Returns the updated row, or None.

    None means "already had one" or "no such company" — both of which are
    non-events for a caller that is provisioning opportunistically.

    Takes a CURSOR rather than opening its own connection so the manual route
    keeps its transaction and the automatic path can run in its own.
    """
    cur.execute("SELECT id, company_name, workspace_enabled FROM companies WHERE id = %s",
                (company_id,))
    company = cur.fetchone()
    if not company:
        return None
    if company['workspace_enabled']:
        return None

    if not slug:
        slug = slug_for(cur, company['company_name'], company_id)
    if admin_user_id is None:
        admin_user_id = choose_admin(cur, company_id)

    cur.execute("""
        UPDATE companies SET
            workspace_enabled = TRUE,
            workspace_slug = %s,
            workspace_admin_id = %s,
            provisioned_by = %s,
            provisioned_at = NOW()
        WHERE id = %s
        RETURNING id, company_name, workspace_slug, workspace_enabled,
                  workspace_admin_id
    """, (slug, admin_user_id, provisioner_id, company_id))
    updated = cur.fetchone()

    if admin_user_id:
        # The ACL reads company_team_members with invitation_status='accepted'
        # (issues #91/#94), so the workspace admin has to exist there or they
        # cannot open the workspace they were just given.
        #
        # NOTE (#92): no users.current_company_id write. Migration 001 declares
        # that column but it was never deployed, so writing it raised
        # UndefinedColumn and 500'd every provision that named an admin — which
        # is why the existing fixtures have provisioned_by NULL.
        cur.execute("""
            INSERT INTO company_team_members
                        (company_id, user_id, role, invitation_status, permissions)
            VALUES (%s, %s, 'admin', 'accepted',
                    '{"workspace.manage_employees": true,
                      "workspace.assign_resources": true,
                      "workspace.post_jobs": true}'::jsonb)
            ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'admin'
        """, (company_id, admin_user_id))

    return updated


def provision_on_verification(get_connection, company_id, verified_by):
    """Best-effort provisioning after a company has been approved.

    Runs in its own transaction, AFTER the approval is committed. A workspace
    problem must never cost a company its verification — that is the decision
    the operator actually made, and it is the one that lets them publish.

    Returns the slug when it provisioned, None otherwise. Never raises.
    """
    conn = None
    try:
        conn = get_connection()
        if not conn:
            logger.error('workspace auto-provision skipped for %s: no connection',
                         company_id)
            return None
        import psycopg2.extras
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            updated = provision(cur, company_id, verified_by)
            if updated is None:
                conn.commit()
                return None
            conn.commit()
            logger.info('workspace auto-provisioned for %s as /%s (admin %s)',
                        company_id, updated['workspace_slug'],
                        updated['workspace_admin_id'] or 'none yet')
            return updated['workspace_slug']
    except Exception as exc:                                   # noqa: BLE001
        # Loudly: a silently missing workspace is discovered by an HR manager
        # who cannot find their own company.
        logger.error('WORKSPACE AUTO-PROVISION FAILED for company %s: %s — '
                     'the operator can still provision it by hand',
                     company_id, exc)
        try:
            if conn:
                conn.rollback()
        except Exception:                                      # noqa: BLE001
            pass
        return None
    finally:
        try:
            if conn:
                conn.close()
        except Exception:                                      # noqa: BLE001
            pass
