"""Every wording the platform can send, in one list.

WHY THIS FILE EXISTS

The owner approves a template once and operators release messages that render
from it (migration 090). That only works if "every template" is an enumerable
thing rather than whatever happens to be reachable from three modules — a
wording nobody registered is a wording nobody approved, and its messages would
sit held for ever with no obvious cause.

So this is the register. Adding a new outbound message means adding it here,
and a test fails if a `kind` is queued anywhere that this list does not know.

WHAT A FINGERPRINT IS FOR

Each entry renders with fixed probe values and is hashed. The hash identifies
the WORDING, not the recipient. Change the template function and the hash
moves, the owner's approval stops matching, and those messages fall back to
per-message approval — the safe direction, reached without anyone remembering
to re-approve.
"""
import logging

logger = logging.getLogger(__name__)

try:
    from backend import outbound_mail
    from backend.nafis_talent_system import (_invitation_body, _invitation_html,
                                             _invitation_subject)
    from backend.growth_system import (
        _company_invitation_body, _company_invitation_html,
        _company_invitation_subject, _vacancy_verification_body,
        _vacancy_verification_html, _vacancy_verification_subject)
    from backend.db_utils import execute_query
except ImportError:                          # pragma: no cover — dual root
    import outbound_mail
    from nafis_talent_system import (_invitation_body, _invitation_html,
                                     _invitation_subject)
    from growth_system import (
        _company_invitation_body, _company_invitation_html,
        _company_invitation_subject, _vacancy_verification_body,
        _vacancy_verification_html, _vacancy_verification_subject)
    from db_utils import execute_query

_P = outbound_mail.TEMPLATE_PROBE


def _seeker_invitation():
    return (_invitation_subject(),
            _invitation_body(_P['name'], _P['link']),
            _invitation_html(_P['name'], _P['link']))


def _company_invitation():
    return (_company_invitation_subject(_P['name']),
            _company_invitation_body(_P['name'], _P['link'], _P['role']),
            _company_invitation_html(_P['name'], _P['link'], _P['role']))


def _vacancy_verification():
    return (_vacancy_verification_subject(_P['name'], _P['title']),
            _vacancy_verification_body(_P['name'], _P['title'], _P['link']),
            _vacancy_verification_html(_P['name'], _P['title'], _P['link']))


#: kind -> (human label, renderer). The kind must match what the flow passes to
#: outbound_mail.queue(), or the message can never be released.
TEMPLATES = {
    'seeker_invitation': ('Candidate invitation (NAFIS seeker)', _seeker_invitation),
    'company_invitation': ('Employer invitation (magic link)', _company_invitation),
    'vacancy_verification': ('Vacancy verification (NAFIS import)', _vacancy_verification),
}


def render(kind):
    """(subject, body_text, body_html) for one kind, using the probe values."""
    label_and_fn = TEMPLATES.get(kind)
    if not label_and_fn:
        raise KeyError(f'no registered template for kind "{kind}"')
    return label_and_fn[1]()


def fingerprint_for(kind):
    subject, text, html = render(kind)
    return outbound_mail.template_fingerprint(subject, text, html)


def register_all():
    """Record any wording that is not already on file. Approves nothing.

    A new version appears whenever the rendered wording changes, so the record
    shows the history of what was sent rather than only what is current. This
    is safe to call repeatedly — unchanged wording produces nothing.
    """
    added, unchanged = [], []
    for kind, (label, _fn) in sorted(TEMPLATES.items()):
        try:
            subject, text, html = render(kind)
        except Exception as exc:
            logger.error('template %s failed to render: %s', kind, exc)
            continue
        fingerprint = outbound_mail.template_fingerprint(subject, text, html)

        existing = execute_query(
            """SELECT id, status FROM outbound_mail_templates
                WHERE kind = %s AND fingerprint = %s""",
            (kind, fingerprint), fetch_one=True)
        if existing:
            unchanged.append({'kind': kind, 'label': label,
                              'status': existing['status']})
            continue

        # Retire any PENDING version of this kind first. It was never approved
        # and is now superseded, and leaving it on the approval screen invites
        # the worst outcome available here: an owner approving the OLD wording,
        # which then matches nothing that renders, so operators find they can
        # release nothing and no error says why.
        #
        # An APPROVED version is deliberately left alone — it stays in force
        # until someone approves the replacement, so a wording change does not
        # silently halt an operation that is mid-flight.
        superseded = execute_query(
            """UPDATE outbound_mail_templates
                  SET status = 'retired', retired_at = now()
                WHERE kind = %s AND status = 'pending'
            RETURNING id""", (kind,)) or []
        if superseded:
            logger.info('retired %s superseded pending version(s) of %s',
                        len(superseded), kind)

        nxt = execute_query(
            """SELECT COALESCE(max(version), 0) + 1 AS v
                 FROM outbound_mail_templates WHERE kind = %s""",
            (kind,), fetch_one=True)
        row = execute_query(
            """INSERT INTO outbound_mail_templates
                      (kind, version, fingerprint, sample_subject, sample_body)
               VALUES (%s, %s, %s, %s, %s) RETURNING id, version""",
            (kind, int(nxt['v']), fingerprint, subject, text), fetch_one=True)
        added.append({'kind': kind, 'label': label, 'id': row['id'],
                      'version': row['version']})
        logger.info('registered mail template %s v%s', kind, row['version'])

    return {'added': added, 'unchanged': unchanged,
            'note': ('New wording is recorded, not approved. An administrator '
                     'reads it and approves it before operators can release '
                     'anything that uses it.')}
