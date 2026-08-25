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

It does not send. There is deliberately no transport here yet. `decide()` is
pure and has no I/O, so it can be tested exhaustively and reused by whatever
transport arrives — the Microsoft Graph client, once DGHR's secret is in place.
Wiring a transport means calling `decide()` first and honouring it, and
`record()` writing down what happened either way.
"""
import logging
import os

logger = logging.getLogger(__name__)

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
