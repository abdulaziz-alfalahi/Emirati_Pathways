"""The one door everything leaving this platform has to go through.

WHY THIS FILE EXISTS

On 2026-08-25, hours before the first real mail credentials were configured, a
sweep found 46 board-meeting emails and 126 employer invitation links queued and
ready to go to real people — Al Rostamani, Majid Al Futtaim, Gargash Hospital,
personal gmail addresses across 219 domains. Nothing had ever been delivered,
because email had never worked. The moment it worked, all of it would have gone
out, and 42 of the 46 announced test meetings that no longer existed.

That backlog is retired (migrations 086 and 087). This module exists so the next
one cannot happen: the platform holds real candidate and real employer data, and
nothing reaches those people that has not been verified and approved.

THE RULE

    An email is sent only if EVERY gate says yes. Anything unset, empty,
    unparseable or unknown means NO.

Configuration mistakes are the normal case, not the exotic one, so every one of
them has to fail closed. A missing env var is not "no restriction configured",
it is "not switched on". An empty allow-list is not "allow everyone", it is
"nobody approved yet". Getting that backwards is how a staging box mails a
production customer list, and it is exactly the shape of accident this platform
just avoided by luck rather than design.

THE GATES, IN ORDER

  1. MAIL_SENDING_ENABLED must be explicitly true. Absent = blocked.
  2. The recipient must match MAIL_ALLOWED_RECIPIENTS. Empty = nothing matches.
  3. The message must carry an explicit approval. Unapproved = blocked.

Gate 3 is the owner's actual requirement and the reason gates 1 and 2 are not
enough on their own: an approved sender list still lets an unreviewed *message*
out to an approved person.

WHAT THIS MODULE DOES NOT DO

It does not send. `decide()` is pure and has no I/O, so it can be tested
exhaustively; the transport lives in `services/graph_mail.py` and consults it.
The queue functions below are the only supported way to compose a message:
they insert it `held`, and a person moves it out of `held` one message at a
time.
"""
import logging
import os

logger = logging.getLogger(__name__)

try:
    from backend.db_utils import execute_query
except ImportError:                          # the app runs under both roots
    from db_utils import execute_query

# ── Decisions ───────────────────────────────────────────────────────────────
ALLOWED = 'allowed'
BLOCKED_SENDING_OFF = 'blocked_sending_off'
BLOCKED_RECIPIENT_NOT_ALLOWED = 'blocked_recipient_not_allowed'
BLOCKED_NOT_APPROVED = 'blocked_not_approved'
BLOCKED_NO_RECIPIENT = 'blocked_no_recipient'

#: Every decision that is not ALLOWED. Written as "not allowed" rather than as a
#: list of blocks on purpose: a decision added later is blocked until somebody
#: deliberately permits it, instead of silently becoming sendable.
def is_blocked(decision):
    return decision != ALLOWED


_TRUE = ('1', 'true', 'yes', 'on')


def sending_enabled():
    """Gate 1. Absent, empty or anything unrecognised means off.

    Note the asymmetry: only an explicit member of _TRUE enables sending. A
    typo ('ture', 'True '), a quoted empty string, or a variable someone
    commented out all leave it off, which is the safe direction for every one
    of those mistakes.
    """
    return (os.getenv('MAIL_SENDING_ENABLED') or '').strip().lower() in _TRUE


def allowed_recipients():
    """Gate 2's list. Comma-separated exact addresses and/or @domain entries.

    An unset or empty variable yields an EMPTY list, which matches nobody. That
    is the whole point: "no allow-list configured" must never mean "everyone".
    """
    raw = (os.getenv('MAIL_ALLOWED_RECIPIENTS') or '').strip()
    if not raw:
        return []
    return [entry.strip().lower() for entry in raw.split(',') if entry.strip()]


def recipient_allowed(address, allow_list=None):
    """Does this address match the allow-list?

    `@example.gov.ae` allows the whole domain; anything else must match the
    full address exactly. Matching is case-insensitive because real address
    lists arrive in mixed case — the live token sweep found GMAIL.COM and
    MAF.AE alongside lower-case entries in the same column.
    """
    if not address or '@' not in address:
        return False
    entries = allowed_recipients() if allow_list is None else [
        e.strip().lower() for e in allow_list if e and e.strip()]
    if not entries:
        return False

    address = address.strip().lower()
    domain = '@' + address.rsplit('@', 1)[1]
    for entry in entries:
        if entry.startswith('@'):
            if domain == entry:
                return True
        elif entry == address:
            return True
    return False


def decide(address, approved=False, allow_list=None):
    """Should this message be sent? Returns (bool, decision).

    Pure: no database, no network, no clock. The transport calls this and
    honours it; the reason is recorded so a held message can be explained to
    whoever asks why their invitation never arrived.

    Order matters for the explanation, not the outcome — a message with three
    problems reports the most fundamental one, so switching mail on does not
    reveal a second reason it was blocked one at a time.
    """
    if not address or '@' not in (address or ''):
        return False, BLOCKED_NO_RECIPIENT
    if not sending_enabled():
        return False, BLOCKED_SENDING_OFF
    if not recipient_allowed(address, allow_list=allow_list):
        return False, BLOCKED_RECIPIENT_NOT_ALLOWED
    if not approved:
        return False, BLOCKED_NOT_APPROVED
    return True, ALLOWED


def explain(decision):
    """Operator-facing wording. Never blames the recipient for our config."""
    return {
        ALLOWED: 'approved for delivery',
        BLOCKED_SENDING_OFF: 'held — outbound mail is switched off on this '
                             'environment',
        BLOCKED_RECIPIENT_NOT_ALLOWED: 'held — this recipient is not on the '
                                       'approved list yet',
        BLOCKED_NOT_APPROVED: 'held — this message has not been approved for '
                              'sending',
        BLOCKED_NO_RECIPIENT: 'held — no usable email address',
    }.get(decision, f'held — {decision}')


# ── The queue ───────────────────────────────────────────────────────────────
#
# Composing a message and sending one are deliberately separate acts, with a
# person in between. Everything the platform wants to email goes through
# `queue()`, which can only ever produce a `held` row — migration 088 puts a
# trigger behind that, so a call site cannot opt out by passing a status.

HELD = 'held'
APPROVED = 'approved'
SENDING = 'sending'
SENT = 'sent'
FAILED = 'failed'
REJECTED = 'rejected'


_QUEUE_SQL = """INSERT INTO outbound_mail
                       (to_email, to_name, subject, body_text, body_html, kind,
                        related_type, related_id, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id"""


def queue(to_email, subject, body_text, kind, body_html=None, to_name=None,
          related_type=None, related_id=None, created_by=None, cursor=None):
    """Compose a message and hold it for approval. Returns the new row id.

    This never sends, and it never checks the gate: a message is worth holding
    for review even when the gate would refuse it today, because the gate can
    be opened later and the message is then still there to approve. The gate is
    consulted at SEND time, against the configuration in force at that moment.

    PASS `cursor` WHEN THE MESSAGE BELONGS TO A WIDER TRANSACTION.

    A message that outlives the thing it describes is not a hypothetical: 42 of
    the 46 board emails retired by migration 086 survived because their meeting
    was deleted and the notification was not, leaving a fully-formed email about
    a meeting that no longer existed. An invitation email carrying a token has
    exactly that shape — if the token insert rolls back and the email does not,
    the queue holds a message with a link to nothing.

    So when the caller owns a transaction, it owns this row too: pass the
    cursor and the message commits, or vanishes, with everything else.
    Otherwise the shared connection is used, which commits on its own.
    """
    params = (to_email, to_name, subject, body_text, body_html, kind,
              related_type, related_id, created_by)
    if cursor is not None:
        cursor.execute(_QUEUE_SQL, params)
        row = cursor.fetchone()
        # RealDictCursor gives a mapping, a plain cursor gives a tuple.
        return row['id'] if isinstance(row, dict) else (row[0] if row else None)
    row = execute_query(_QUEUE_SQL, params, fetch_one=True)
    return row['id'] if row else None


def approve(message_id, approver_id, note=None):
    """Approve exactly one message. Returns True if this call did it.

    Guarded on `status = 'held'` in the WHERE clause rather than by reading the
    row first: two reviewers clicking at the same moment must not produce two
    approvals, and a rejected message must not be revivable by approving it.
    """
    row = execute_query(
        """UPDATE outbound_mail
              SET status = 'approved', approved_by = %s, approved_at = now(),
                  decision_note = COALESCE(%s, decision_note)
            WHERE id = %s AND status = 'held'
        RETURNING id""",
        (approver_id, note, message_id), fetch_one=True)
    return bool(row)


def reject(message_id, rejecter_id, note=None):
    """Decline a message. It is never sent, and it stays as evidence."""
    row = execute_query(
        """UPDATE outbound_mail
              SET status = 'rejected', rejected_by = %s, rejected_at = now(),
                  decision_note = COALESCE(%s, decision_note)
            WHERE id = %s AND status = 'held'
        RETURNING id""",
        (rejecter_id, note, message_id), fetch_one=True)
    return bool(row)


def claim_next_approved():
    """Take one approved message for sending, atomically. None if there is none.

    `FOR UPDATE SKIP LOCKED` plus the status flip in a single statement is what
    stops two sender runs delivering the same message twice — a duplicate
    invitation to a real employer is exactly the kind of thing this whole
    mechanism exists to prevent.
    """
    return execute_query(
        """UPDATE outbound_mail
              SET status = 'sending', attempts = attempts + 1
            WHERE id = (SELECT id FROM outbound_mail
                         WHERE status = 'approved'
                         ORDER BY created_at
                         FOR UPDATE SKIP LOCKED
                         LIMIT 1)
        RETURNING id, to_email, to_name, subject, body_text, body_html, kind,
                  attempts, approved_by""",
        fetch_one=True)


def mark_sent(message_id, provider_id=None, gate_decision=ALLOWED):
    execute_query(
        """UPDATE outbound_mail
              SET status = 'sent', sent_at = now(), provider_id = %s,
                  gate_decision = %s, last_error = NULL
            WHERE id = %s""",
        (provider_id, gate_decision, message_id), fetch_all=False)


def mark_failed(message_id, error, gate_decision=None):
    """Record a failure and put the message back where a person can see it.

    It returns to `approved`, not to `held`: a human already approved this
    content, and making them approve it again because our proxy was down would
    train people to click approve without reading. A gate refusal is different
    — that means the configuration says this must not go out, so it goes back
    to `held` for a fresh decision.
    """
    back_to = HELD if (gate_decision and gate_decision != ALLOWED) else APPROVED
    execute_query(
        """UPDATE outbound_mail
              SET status = %s, last_error = %s, gate_decision = %s
            WHERE id = %s""",
        (back_to, str(error)[:500], gate_decision, message_id), fetch_all=False)


def held_messages(limit=100):
    return execute_query(
        """SELECT id, to_email, to_name, subject, body_text, body_html, kind,
                  related_type, related_id, created_at, created_by, attempts,
                  last_error
             FROM outbound_mail
            WHERE status = 'held'
            ORDER BY created_at
            LIMIT %s""", (limit,)) or []


def queue_summary():
    """Counts by state — what the operator's badge and the ops view need."""
    rows = execute_query(
        "SELECT status, count(*) AS n FROM outbound_mail GROUP BY status") or []
    return {r['status']: r['n'] for r in rows}
