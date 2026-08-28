"""One way to write an entry to `admin_audit_log`.

WHY THIS EXISTS

Asked on 2026-08-27 who had issued an invitation to a real employer, the answer
had to be reconstructed from timestamps in the data, and could not be reached:
the row named an operator who truthfully denied the action, and the act of
creating the invitation was recorded nowhere at all.

`admin_audit_log` was written from about ten places, each with its own INSERT,
its own column list, and its own idea of whether a failure should propagate.
Adding five more of those would have made the next investigation harder rather
than easier, so there is now one writer.

WHAT BELONGS HERE

Actions where the question "who did this, and when" has a real answer that
somebody will one day need — issuing a credential, importing data about real
companies, changing what a person can do. Not page views, and not reads: reads
of personal data have their own trail in `pii_access_log`, which records
different things for different reasons and should stay separate.

IT NEVER RAISES

An audit row is worth a great deal and never worth losing the action it
describes. A failure here is logged at ERROR and swallowed. That is deliberate,
and it is the reason `record_admin_action` returns a bool rather than nothing:
tests can assert a row was written without depending on an exception that will
never come.
"""
import json
import logging
from typing import Any, Dict, Optional

try:
    from backend.db_utils import execute_query
except ImportError:                          # pragma: no cover — dual root
    from db_utils import execute_query

logger = logging.getLogger(__name__)


#: Actions this module knows about. An unrecognised action is still written —
#: silently discarding an audit record is the one thing this must never do —
#: but it is logged, because a typo'd action name is invisible in a query.
KNOWN_ACTIONS = frozenset({
    'company_invitation_created',
    'staff_invitation_created',
    'seeker_invitation_created',
    'team_invitation_created',
    'nafis_vacancy_import',
})


def _client_ip() -> Optional[str]:
    """The caller's address, or None outside a request.

    Reuses pii_access_log.client_ip, which already works out that
    request.remote_addr is the load balancer in production and reads the
    forwarded header instead. Two different answers to "where did this come
    from" in one audit table would be worse than none.
    """
    try:
        try:
            from backend.pii_access_log import client_ip
        except ImportError:                  # pragma: no cover — dual root
            from pii_access_log import client_ip
        return (client_ip() or {}).get('ip')
    except Exception:
        return None


def record_admin_action(action: str,
                        actor_id: Optional[str],
                        resource_type: Optional[str] = None,
                        resource_id: Optional[str] = None,
                        details: Optional[Dict[str, Any]] = None) -> bool:
    """Record one action. Returns True if a row was written.

    actor_id may be None — an action nobody can be named for is exactly the
    thing worth recording, and dropping the row because the actor is unknown
    would hide it. The NULL is the finding.
    """
    if action not in KNOWN_ACTIONS:
        logger.warning('admin_audit: unrecognised action %r, recording anyway', action)

    payload: Dict[str, Any] = dict(details or {})
    ip = _client_ip()
    if ip:
        payload.setdefault('ip', ip)

    try:
        execute_query(
            """INSERT INTO admin_audit_log
                   (user_id, action, resource_type, resource_id, details, created_at)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            (actor_id, action, resource_type,
             str(resource_id) if resource_id is not None else None,
             json.dumps(payload, default=str)),
            fetch_all=False)
        return True
    except Exception as exc:
        # ERROR, not warning: a missing audit row is a real loss even though it
        # must not stop the caller.
        logger.error('admin_audit: could not record %s by %s: %s',
                     action, actor_id, exc)
        return False


def record_invitation(kind: str,
                      actor_id: Optional[str],
                      invitation_id: Optional[str],
                      recipient: Optional[str],
                      intended_role: Optional[str] = None,
                      extra: Optional[Dict[str, Any]] = None) -> bool:
    """Record that an invitation was issued.

    `kind` is the invitation family — company / staff / seeker / team — and
    matches the outbound-mail kind that carries it, so a message in the queue
    and the act that produced it can be lined up.

    The RECIPIENT is recorded and the TOKEN is not. Who was written to is the
    question an audit answers; the token is a live credential and belongs in an
    audit trail even less than it belongs in a log line.
    """
    return record_admin_action(
        action=f'{kind}_invitation_created',
        actor_id=actor_id,
        resource_type=f'{kind}_invitation',
        resource_id=invitation_id,
        details={'recipient': recipient,
                 'intended_role': intended_role,
                 **(extra or {})})
