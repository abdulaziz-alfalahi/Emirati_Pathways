"""Audit trail for READS of other people's personal data.

WHY THIS EXISTS

`admin_audit_log` recorded writes thoroughly — role changes, bulk updates, DSR
erasures — and one read: the CRM CSV export, which is carefully instrumented and
carries a comment reading "a silent unlogged export is exactly what an audit
trail exists to prevent."

That reasoning was right and applied to the wrong action. Bulk export is the
conspicuous, occasional act. Routine reading of the roster is the constant one,
and it left no trace at all — so `GET /api/profile/crm-candidates`, which its own
docstring describes as returning "candidate PII (national_id, phone, counselling
notes)", could be paged through all day invisibly.

That matters more than it used to. The onboarding operation runs through an
outsourced call centre working under NDA, and an NDA you cannot evidence a breach
of is a deterrent rather than a control. Read logging is what makes it
enforceable. It is also far cheaper to capture now than to backfill: a trail you
never wrote cannot be reconstructed.

WHAT IS AUDITED, AND WHAT DELIBERATELY IS NOT

Only reads of ANOTHER person's data by staff. Self-reads are excluded on
purpose — `GET /api/profile/candidate` is keyed on the caller's own JWT
identity, so auditing it would log every candidate looking at their own profile:
enormous volume, no investigative value, and it would bury the reads that matter.

ONE ROW PER REQUEST, NOT PER RECORD

A roster page of 50 candidates writes ONE row recording the count and the filters
used, not 50 rows. Per-record logging would multiply the table by the size of the
roster and answer no question the access event does not already answer.

THE CLIENT IP IS THE POINT, AND IT IS NOT request.remote_addr

Moro confirmed the production path on 2026-08-17: WAF -> load-balancer VIP
10.228.145.7 -> APP01/APP02, and "all traffic reaching the backend servers will
appear to originate from 10.228.145.7". So in production `request.remote_addr` is
the load balancer for every request, and an audit trail recording it would
identify nobody. `client_ip()` therefore reads X-Forwarded-For first.

TRUST BOUNDARY: X-Forwarded-For is client-supplied and forgeable by anything that
can reach the app directly. It is trusted here because the only route to the app
nodes is through the WAF, which sets it. If the app is ever exposed directly,
this assumption breaks and the header must stop being trusted. Whether the WAF
and load balancer set and preserve the header is an open question with Moro as of
2026-08-17 — until it is answered, `ip_source` records which header the value
actually came from, so a log full of load-balancer addresses is visibly
diagnosable rather than quietly useless.
"""

import json
import logging
import os
from typing import Any, Dict, Optional

import psycopg2

logger = logging.getLogger(__name__)

# A slow database must never hold up a read the user is waiting for.
_CONNECT_TIMEOUT = 5

# Action names. The `_read` suffix is load-bearing: it lets the audit viewer and
# any report separate access events from mutations, which are the two things an
# investigator asks about separately.
CRM_ROSTER_READ = 'crm_roster_read'
CRM_CANDIDATE_HISTORY_READ = 'crm_candidate_history_read'
CRM_CANDIDATE_NAFIS_READ = 'crm_candidate_nafis_read'
COACH_CLIENT_LIST_READ = 'coach_client_list_read'
COACH_SKILL_GAP_READ = 'coach_skill_gap_read'

READ_ACTIONS = (
    CRM_ROSTER_READ,
    CRM_CANDIDATE_HISTORY_READ,
    CRM_CANDIDATE_NAFIS_READ,
    COACH_CLIENT_LIST_READ,
    COACH_SKILL_GAP_READ,
)


def _recording_enabled() -> bool:
    """False while the test suite is running.

    The live audit log already holds 172 rows of `Pytest Action` residue, and
    migration 002 makes the table APPEND-ONLY — so test rows written there can
    never be removed. That is a stronger reason to suppress than for ordinary
    telemetry: the cost of a mistake is permanent.

    Tests that need to exercise the real write path monkeypatch this to True.
    """
    return os.getenv('PYTEST_CURRENT_TEST') is None


def _connect():
    """A dedicated short-lived connection.

    Deliberately not `db_utils.execute_query`: that reuses the request-scoped
    connection from `g` and commits it, so an audit write through it would commit
    whatever else the request had in flight. An audit record must never be able
    to change the outcome of the action it is recording.
    """
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', ''),
        connect_timeout=_CONNECT_TIMEOUT,
    )


def client_ip() -> Dict[str, Optional[str]]:
    """The real client address, and which header it came from.

    Returns {'ip': str|None, 'ip_source': str}. The source is recorded because
    'this came from remote_addr in production' means 'this is the load balancer
    and the trail is not identifying anyone' — a fact worth being able to see in
    the data rather than having to infer.
    """
    try:
        from flask import has_request_context, request
    except ImportError:  # pragma: no cover
        return {'ip': None, 'ip_source': 'no_flask'}

    if not has_request_context():
        return {'ip': None, 'ip_source': 'no_request'}

    # X-Forwarded-For is a comma-separated chain; the leftmost entry is the
    # original client, the rest are intermediate proxies.
    xff = request.headers.get('X-Forwarded-For')
    if xff:
        first = xff.split(',')[0].strip()
        if first:
            return {'ip': first, 'ip_source': 'x_forwarded_for'}

    real = request.headers.get('X-Real-IP')
    if real:
        return {'ip': real.strip(), 'ip_source': 'x_real_ip'}

    return {'ip': request.remote_addr, 'ip_source': 'remote_addr'}


def _user_agent() -> Optional[str]:
    try:
        from flask import has_request_context, request
        if not has_request_context():
            return None
        return request.headers.get('User-Agent')
    except Exception:  # pragma: no cover
        return None


def _request_filters() -> Dict[str, str]:
    """The query parameters that shaped the read, minus cache-busting noise.

    Recorded because 'who read the roster' is much less useful than 'who read
    the roster filtered to this cohort' — the filter IS the question the reader
    was asking, and it is what an investigation would want.
    """
    try:
        from flask import has_request_context, request
        if not has_request_context():
            return {}
        return {k: v for k, v in request.args.items()
                if k not in ('_cb', '_', 'cache') and v}
    except Exception:  # pragma: no cover
        return {}


def log_pii_read(action: str,
                 resource_type: str,
                 actor_id: Optional[str],
                 resource_id: Optional[str] = None,
                 subject_count: Optional[int] = None,
                 extra: Optional[Dict[str, Any]] = None) -> bool:
    """Record one access event. Never raises, never fails the caller's read.

    Returns True if a row was written, so tests can assert on it without
    depending on exceptions.

    subject_count is how many people's data the response carried — 1 for a
    single-subject read, the page size for a roster page. It is the number that
    turns the log into something you can reason about at volume.
    """
    if not _recording_enabled():
        return False

    if action not in READ_ACTIONS:
        # Not fatal: an unrecognised action still gets logged rather than
        # dropped. Silently discarding an audit record is the one behaviour this
        # module must never have.
        logger.warning("pii_access_log: unrecognised action %r, recording anyway", action)

    net = client_ip()
    details: Dict[str, Any] = {
        'subject_count': subject_count,
        'filters': _request_filters(),
        'ip_source': net['ip_source'],
    }
    if extra:
        details.update(extra)

    conn = None
    try:
        conn = _connect()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO admin_audit_log
                    (user_id, action, resource_type, resource_id,
                     details, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (actor_id, action, resource_type,
                 str(resource_id) if resource_id is not None else None,
                 json.dumps(details, default=str), net['ip'], _user_agent()),
            )
        conn.commit()
        return True
    except Exception as e:
        # An unaudited read is a real failure — log it loudly enough to be
        # noticed — but breaking the read would be worse, and would create
        # pressure to remove the auditing.
        logger.error("PII READ NOT AUDITED action=%s actor=%s: %s", action, actor_id, e)
        return False
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:  # pragma: no cover
                pass
