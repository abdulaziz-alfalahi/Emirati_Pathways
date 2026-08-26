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
                        related_type, related_id, created_by, template_fingerprint)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id"""


def _fingerprint_for_kind(kind):
    """Which registered wording produced this kind, or None if unregistered.

    Imported late and on purpose: services.mail_templates imports the flows,
    and the flows import this module. A late import keeps the cycle from
    forming while letting call sites stay ignorant of fingerprints entirely —
    a flow that had to remember to pass one would eventually forget, and its
    messages would silently become unreleasable.
    """
    try:
        try:
            from backend.services import mail_templates
        except ImportError:              # pragma: no cover — dual root
            from services import mail_templates
        return mail_templates.fingerprint_for(kind)
    except Exception:
        # An unregistered kind is not an error: it means per-message approval,
        # which is the stricter path.
        return None


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
              related_type, related_id, created_by, _fingerprint_for_kind(kind))
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


# ── Delegated release: templates, caps and a pause ──────────────────────────
#
# Per-message approval was right for the first five sends and wrong for four
# hundred. An owner clicking approve on four hundred renderings of one template
# is not reviewing them; it is rubber-stamping, which is worse than no review
# because it produces a signature.
#
# Owner's decision, 2026-08-26: approve the TEMPLATE once, let operators
# release messages that render from it, and give the owner an audit rather than
# a queue. See migration 090.

import hashlib as _hashlib

RELEASE_PER_MESSAGE = 'per_message'
RELEASE_TEMPLATE = 'template'

#: Values fed to a template to produce its fingerprint. Fixed, so the hash
#: reflects the WORDING and not whose invitation happened to be rendered.
TEMPLATE_PROBE = {
    'name': 'ZZ-PROBE',
    'link': 'https://example.invalid/probe',
    'title': 'ZZ-PROBE-TITLE',
    'role': 'recruiter',
}


def template_fingerprint(subject, body_text, body_html=None):
    """Identify a template by what it RENDERS, not by where it lives.

    An approval of wording only means something if editing the wording
    invalidates it. Hashing a probe rendering gets that for free: change the
    template function and the fingerprint moves, the approval stops matching,
    and those messages fall back to needing the owner. That is the safe
    direction, and it needs nobody to remember anything.

    The HTML is included. It is what is actually delivered, so a change there
    that leaves the plain text alone is still a change to what a recipient
    reads.
    """
    blob = '\x1f'.join([subject or '', body_text or '', body_html or ''])
    return _hashlib.sha256(blob.encode('utf-8')).hexdigest()


def controls():
    row = execute_query(
        """SELECT daily_release_cap, paused, pause_reason, paused_at,
                  resumed_by, resumed_at
             FROM outbound_mail_controls WHERE id = 1""", fetch_one=True)
    return dict(row) if row else {'daily_release_cap': 500, 'paused': False,
                                  'pause_reason': None}


def pause(reason, by=None):
    """Stop all releasing. Requires a reason — the constraint enforces it.

    "Paused" with no reason is a dead end for whoever finds it, and they are
    the person deciding whether it is safe to resume.
    """
    execute_query(
        """UPDATE outbound_mail_controls
              SET paused = TRUE, pause_reason = %s, paused_at = now(),
                  resumed_by = NULL, resumed_at = NULL, updated_at = now()
            WHERE id = 1""", (str(reason)[:500],), fetch_all=False)
    logger.warning('outbound mail PAUSED: %s', reason)


def resume(by):
    execute_query(
        """UPDATE outbound_mail_controls
              SET paused = FALSE, pause_reason = NULL, resumed_by = %s,
                  resumed_at = now(), updated_at = now()
            WHERE id = 1""", (by,), fetch_all=False)


def approved_template(kind):
    return execute_query(
        """SELECT id, kind, version, fingerprint, approved_by, approved_at
             FROM outbound_mail_templates
            WHERE kind = %s AND status = 'approved'""", (kind,), fetch_one=True)


def released_today(operator_id):
    """DISTINCT RECIPIENTS released today, not messages.

    The owner set the cap as "10 companies per operator per day" (2026-08-26),
    and the two are not the same number. A vacancy-verification run sends one
    message PER VACANCY, so a single employer with twelve open roles would
    consume twelve of a ten-message allowance — far more restrictive than
    anyone intended, and restrictive in a way that punishes exactly the large
    employers the onboarding plan targets.

    Counting distinct addresses makes the cap mean what it says: how many
    organisations one operator may reach out to in a day, however many
    vacancies each of them has.
    """
    row = execute_query(
        """SELECT count(DISTINCT to_email) AS n FROM outbound_mail
            WHERE released_by = %s AND released_at >= date_trunc('day', now())""",
        (operator_id,), fetch_one=True)
    return int(row['n']) if row else 0


def recipients_released_today(operator_id):
    """The addresses this operator has already reached today, lower-cased.

    Needed as a SET rather than a count: an employer already contacted must not
    consume a second slot when their remaining vacancies go out.
    """
    rows = execute_query(
        """SELECT DISTINCT lower(to_email) AS a FROM outbound_mail
            WHERE released_by = %s AND released_at >= date_trunc('day', now())""",
        (operator_id,)) or []
    return {r['a'] for r in rows}


def releasable(kind):
    """Messages of this kind whose body matches the approved template.

    The fingerprint comparison is done in SQL against the approved row, so a
    message composed before the wording changed is simply not returned — it
    stays held for the owner rather than going out under an approval that no
    longer describes it.
    """
    return execute_query(
        """SELECT m.id, m.to_email, m.to_name, m.subject, m.kind
             FROM outbound_mail m
             JOIN outbound_mail_templates t
               ON t.kind = m.kind AND t.status = 'approved'
              AND t.fingerprint = m.template_fingerprint
            WHERE m.status = 'held' AND m.kind = %s
            ORDER BY m.created_at""", (kind,)) or []


def release(kind, operator_id, limit=None):
    """Release messages of one kind on the authority of an approved template.

    Returns a dict describing what happened, including why it stopped. Every
    refusal is a state the operator can act on rather than an exception:
    they are running a bulk operation, and a traceback mid-run tells them
    nothing about what already went.
    """
    state = controls()
    if state.get('paused'):
        return {'released': 0, 'blocked': 'paused',
                'detail': state.get('pause_reason')}

    template = approved_template(kind)
    if not template:
        return {'released': 0, 'blocked': 'no_approved_template',
                'detail': f'no approved wording for "{kind}" — an administrator '
                          f'approves the template once, then operators release'}

    cap = int(state.get('daily_release_cap') or 500)
    already = released_today(operator_id)
    remaining = max(0, cap - already)

    # NOT an early return when remaining is 0. An operator at their limit may
    # still have queued vacancies belonging to an employer they ALREADY reached
    # today, and those cost no further allowance — refusing them would hold a
    # company's remaining roles until tomorrow for no benefit to anyone.
    # Whether anything can go is decided by the trim below.
    candidates = releasable(kind)
    if limit is not None:
        candidates = candidates[:max(0, int(limit))]

    # Trim by DISTINCT RECIPIENT, not by message count — see released_today.
    # An employer already reached today costs nothing further, so their
    # remaining vacancies go out together rather than being split across days,
    # which would have them receive the same request on three mornings running.
    already_today = recipients_released_today(operator_id)
    selected, reached = [], set(already_today)
    for candidate in candidates:
        address = (candidate.get('to_email') or '').strip().lower()
        if address not in reached:
            if len(reached) - len(already_today) >= remaining:
                break
            reached.add(address)
        selected.append(candidate)
    candidates = selected
    if not candidates:
        if remaining <= 0:
            return {'released': 0, 'blocked': 'daily_cap',
                    'detail': f'{already} of {cap} organisation(s) reached today'}
        return {'released': 0, 'blocked': None, 'detail': 'nothing to release'}

    anomaly = detect_anomaly([c['to_email'] for c in candidates])
    if anomaly:
        pause(anomaly, by=operator_id)
        return {'released': 0, 'blocked': 'anomaly', 'detail': anomaly}

    ids = [c['id'] for c in candidates]
    execute_query(
        """UPDATE outbound_mail
              SET status = 'approved', approved_by = %s, approved_at = now(),
                  released_by = %s, released_at = now(),
                  release_basis = %s
            WHERE id = ANY(%s) AND status = 'held'""",
        (operator_id, operator_id, RELEASE_TEMPLATE, ids), fetch_all=False)

    new_recipients = len(reached) - len(already_today)
    logger.info('outbound mail: %s released %s "%s" message(s) to %s new '
                'recipient(s) on template v%s',
                operator_id, len(ids), kind, new_recipients, template['version'])
    return {'released': len(ids), 'blocked': None,
            'recipients': new_recipients,
            'template_version': template['version'],
            'remaining_today': remaining - new_recipients}


#: A run that reaches this many recipient domains never seen before is more
#: likely a wrong list than a good week. Deliberately generous — the cost of a
#: false pause is one admin click; the cost of a miss is real people.
NEW_DOMAIN_LIMIT = 25
#: Recent failures above this share mean the transport or the data is wrong,
#: and continuing just multiplies it.
FAILURE_RATE_LIMIT = 0.5
FAILURE_SAMPLE = 20


def detect_anomaly(recipients):
    """Return a reason to stop, or None. Never raises.

    Checked BEFORE a release, not after: the point is to stop a bad run rather
    than to explain one.
    """
    try:
        domains = {(a or '').rsplit('@', 1)[-1].lower() for a in recipients if a and '@' in a}
        if domains:
            known = execute_query(
                """SELECT DISTINCT lower(split_part(to_email, '@', 2)) AS d
                     FROM outbound_mail WHERE status = 'sent'""") or []
            unseen = domains - {r['d'] for r in known}
            if len(unseen) > NEW_DOMAIN_LIMIT:
                return (f'{len(unseen)} recipient domains never sent to before '
                        f'in a single release (limit {NEW_DOMAIN_LIMIT}) — '
                        f'check the recipient list before resuming')

        recent = execute_query(
            """SELECT status FROM outbound_mail
                WHERE status IN ('sent', 'failed')
                ORDER BY COALESCE(sent_at, created_at) DESC LIMIT %s""",
            (FAILURE_SAMPLE,)) or []
        if len(recent) >= FAILURE_SAMPLE:
            failed = sum(1 for r in recent if r['status'] == 'failed')
            if failed / len(recent) > FAILURE_RATE_LIMIT:
                return (f'{failed} of the last {len(recent)} sends failed — '
                        f'delivery is not working, so releasing more would only '
                        f'multiply it')
    except Exception as exc:            # a broken check must not block sending
        logger.warning('anomaly check skipped: %s', exc)
    return None


# ── The audit ───────────────────────────────────────────────────────────────
#
# The owner stepped out of the per-message queue, so this is what replaces it.
# The question being answered is not "how many did we send" — a count reassures
# without informing. It is "what did real people actually receive, on whose
# authority, and is anything drifting".

def audit_summary(days=7):
    """Volume, authority and failures over a window. The shape of the operation."""
    rows = execute_query(
        """SELECT kind, status, release_basis, count(*) AS n
             FROM outbound_mail
            WHERE created_at >= now() - make_interval(days => %s)
            GROUP BY kind, status, release_basis""", (days,)) or []

    by_operator = execute_query(
        """SELECT m.released_by AS operator_id,
                  COALESCE(u.full_name, u.first_name, m.released_by) AS operator_name,
                  count(*) AS released,
                  count(*) FILTER (WHERE m.status = 'sent')   AS sent,
                  count(*) FILTER (WHERE m.status = 'failed') AS failed,
                  max(m.released_at) AS last_release
             FROM outbound_mail m
             LEFT JOIN users u ON u.id = m.released_by
            WHERE m.released_by IS NOT NULL
              AND m.released_at >= now() - make_interval(days => %s)
            GROUP BY m.released_by, u.full_name, u.first_name
            ORDER BY released DESC""", (days,)) or []

    failures = execute_query(
        """SELECT id, kind, to_email, attempts, last_error, gate_decision
             FROM outbound_mail
            WHERE status = 'failed'
              AND created_at >= now() - make_interval(days => %s)
            ORDER BY id DESC LIMIT 20""", (days,)) or []

    totals = {'sent': 0, 'held': 0, 'failed': 0, 'rejected': 0,
              'approved': 0, 'sending': 0}
    for r in rows:
        totals[r['status']] = totals.get(r['status'], 0) + int(r['n'])

    # On whose authority. This is the number that tells the owner whether
    # delegation is being used as intended or routed around.
    authority = {'template': 0, 'per_message': 0, 'unauthorised': 0}
    for r in rows:
        if r['status'] in ('sent', 'sending', 'approved'):
            key = r['release_basis'] or 'unauthorised'
            authority[key] = authority.get(key, 0) + int(r['n'])

    return {
        'days': days,
        'totals': totals,
        'by_kind': [dict(r) for r in rows],
        'by_authority': authority,
        'by_operator': [dict(r) for r in by_operator],
        'recent_failures': [dict(r) for r in failures],
        'controls': controls(),
    }


def audit_sample(days=7, size=5, kind=None):
    """A random sample of what was ACTUALLY delivered, bodies included.

    Random, not the most recent: the newest messages are the ones an operator
    was watching, and those are the least likely to be wrong. Sampling is the
    part that verifies quality rather than volume — a summary can look healthy
    while every message in it says the wrong thing.
    """
    params = [days]
    where = "status = 'sent' AND sent_at >= now() - make_interval(days => %s)"
    if kind:
        where += " AND kind = %s"
        params.append(kind)
    params.append(max(1, min(int(size), 25)))
    return execute_query(
        f"""SELECT id, kind, to_email, to_name, subject, body_text, sent_at,
                   release_basis, released_by, approved_by
              FROM outbound_mail
             WHERE {where}
             ORDER BY random()
             LIMIT %s""", tuple(params)) or []


def audit_drift():
    """Things that are true now and should not be. Each needs a person.

    Not a health score. A number that goes green hides the one row that matters,
    and every item here is meant to be read and then acted on or dismissed.
    """
    findings = []

    orphan = execute_query(
        """SELECT count(*) AS n FROM outbound_mail
            WHERE status IN ('sent', 'sending', 'approved')
              AND release_basis IS NULL""", fetch_one=True)
    if orphan and int(orphan['n']):
        findings.append({
            'severity': 'high',
            'finding': f"{orphan['n']} message(s) left or are leaving with no "
                       f"recorded authority — neither a per-message approval "
                       f"nor a template release",
        })

    stale = execute_query(
        """SELECT m.kind, count(*) AS n
             FROM outbound_mail m
             LEFT JOIN outbound_mail_templates t
               ON t.kind = m.kind AND t.status = 'approved'
              AND t.fingerprint = m.template_fingerprint
            WHERE m.status = 'held' AND m.template_fingerprint IS NOT NULL
              AND t.id IS NULL
            GROUP BY m.kind""") or []
    for r in stale:
        findings.append({
            'severity': 'medium',
            'finding': f"{r['n']} held \"{r['kind']}\" message(s) do not match "
                       f"any approved wording — the template changed after they "
                       f"were composed, so they need an administrator",
        })

    unapproved = execute_query(
        """SELECT DISTINCT kind FROM outbound_mail
            WHERE status = 'held'
              AND kind NOT IN (SELECT kind FROM outbound_mail_templates
                                WHERE status = 'approved')""") or []
    for r in unapproved:
        findings.append({
            'severity': 'low',
            'finding': f'"{r["kind"]}" has messages waiting but no approved '
                       f'template — operators cannot release them',
        })

    state = controls()
    if state.get('paused'):
        findings.append({
            'severity': 'high',
            'finding': f"Sending is PAUSED: {state.get('pause_reason')}",
        })

    return findings
