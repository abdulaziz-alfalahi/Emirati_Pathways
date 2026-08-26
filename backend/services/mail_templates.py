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
    from backend.company_team_system import (
        _team_invitation_body, _team_invitation_html, _team_invitation_subject)
    from backend.staff_invitation_system import (
        _staff_invitation_body, _staff_invitation_html,
        _staff_invitation_subject, _staff_role_label, ALLOWED_STAFF_ROLES)
    from backend.db_utils import execute_query
except ImportError:                          # pragma: no cover — dual root
    import outbound_mail
    from nafis_talent_system import (_invitation_body, _invitation_html,
                                     _invitation_subject)
    from growth_system import (
        _company_invitation_body, _company_invitation_html,
        _company_invitation_subject, _vacancy_verification_body,
        _vacancy_verification_html, _vacancy_verification_subject)
    from company_team_system import (
        _team_invitation_body, _team_invitation_html, _team_invitation_subject)
    from staff_invitation_system import (
        _staff_invitation_body, _staff_invitation_html,
        _staff_invitation_subject, _staff_role_label, ALLOWED_STAFF_ROLES)
    from db_utils import execute_query

_P = outbound_mail.TEMPLATE_PROBE


def _seeker_invitation():
    return (_invitation_subject(),
            _invitation_body(_P['name'], _P['link']),
            _invitation_html(_P['name'], _P['link']))


#: The company invitation's role sentence CHANGES THE WORDING, not just a name,
#: so one rendering does not represent every message this template can send.
#: Both variants are rendered into the sample and the fingerprint: the owner
#: reads what each can say, and editing either one invalidates the approval.
_COMPANY_ROLE_VARIANTS = ('employer_admin', 'recruiter')


def _company_invitation():
    subject = _company_invitation_subject(_P['name'])
    bodies, htmls = [], []
    for role in _COMPANY_ROLE_VARIANTS:
        bodies.append(
            f'[ if invited as: {role} ]\n\n'
            + _company_invitation_body(_P['name'], _P['link'], role))
        htmls.append(_company_invitation_html(_P['name'], _P['link'], role))
    separator = '\n\n' + ('=' * 60) + '\n\n'
    return subject, separator.join(bodies), separator.join(htmls)


def _vacancy_verification():
    return (_vacancy_verification_subject(_P['name'], _P['title']),
            _vacancy_verification_body(_P['name'], _P['title'], _P['link']),
            _vacancy_verification_html(_P['name'], _P['title'], _P['link']))


#: A team invitation's role sentence varies the WORDING, like the company one,
#: so all three variants are sampled and fingerprinted together.
_TEAM_ROLE_VARIANTS = ('recruiter', 'hr_manager', 'hr')


def _team_invitation():
    subject = _team_invitation_subject(_P['name'])
    bodies, htmls = [], []
    for role in _TEAM_ROLE_VARIANTS:
        bodies.append(f'[ if invited as: {role} ]\n\n'
                      + _team_invitation_body(_P['name'], 'ZZ-PROBE-INVITER',
                                              _P['link'], role))
        htmls.append(_team_invitation_html(_P['name'], 'ZZ-PROBE-INVITER',
                                           _P['link'], role))
    separator = '\n\n' + ('=' * 60) + '\n\n'
    return subject, separator.join(bodies), separator.join(htmls)


def _staff_invitation():
    """Sixteen invitable roles, and the role is the only thing that varies.

    Rendering all sixteen messages would give the reviewer sixteen near-identical
    pages. Instead: one full message, then every role label appended. The
    reviewer reads the wording once and checks the labels as a list, and the
    fingerprint still covers all of them — changing any label invalidates the
    approval.
    """
    role = 'career_services_operator'
    subject = _staff_invitation_subject(role)
    body = _staff_invitation_body(_P['name'], role, _P['link'], 'ZZ-PROBE-ORG')
    labels = '\n'.join(
        f'  {r:28} {_staff_role_label(r)}  /  {_staff_role_label(r, arabic=True)}'
        for r in sorted(ALLOWED_STAFF_ROLES))
    body += ('\n\n' + ('=' * 60) + '\n\n'
             'The role above varies. Every invitable role reads as:\n\n' + labels + '\n')
    html = _staff_invitation_html(_P['name'], role, _P['link'], 'ZZ-PROBE-ORG')
    return subject, body, html


#: What changes from one delivered message to the next.
#
# WHY THIS IS NOT PART OF THE SAMPLE OR THE FINGERPRINT: it is documentation
# about the template, not the message. Folding it into render() would change
# every fingerprint and invalidate approvals the owner has already given, for a
# change to the approval screen. It is attached when the templates are listed,
# so it is always current and never causes DB churn.
#
# The list exists because a sample renders ONE set of values, and a plausible
# real value reads as fixed text. Owner, 2026-08-26, reading the staff sample:
# "Will the Career Services Operator change according to the selected role?" —
# ZZ-PROBE-ORG reads as a placeholder; "Career Services Operator" does not.
TEMPLATE_VARIES = {
    'seeker_invitation': [
        ("the candidate's name", 'اسم المرشح'),
        ('the registration link', 'رابط التسجيل'),
    ],
    'company_invitation': [
        ("the company's name", 'اسم المؤسسة'),
        ('the registration link', 'رابط التسجيل'),
        ('the access granted — the two variants are both shown below',
         'الصلاحية الممنوحة — النسختان معروضتان أدناه'),
    ],
    'vacancy_verification': [
        ("the company's name", 'اسم المؤسسة'),
        ('the job title — it appears in the subject line too',
         'المسمى الوظيفي — ويظهر في عنوان الرسالة أيضاً'),
        ('the verification link', 'رابط التأكيد'),
    ],
    'team_invitation': [
        ("the colleague's company", 'اسم مؤسسة الزميل'),
        ('the name of the person inviting them', 'اسم الشخص الذي وجّه الدعوة'),
        ('the invitation link', 'رابط الدعوة'),
        ('the access granted — all three variants are shown below',
         'الصلاحية الممنوحة — النسخ الثلاث معروضة أدناه'),
    ],
    'staff_invitation': [
        ("the invited person's name", 'اسم الشخص المدعو'),
        ('THE ROLE — every one of the sixteen is listed below',
         'الصفة — وجميع الصفات الست عشرة مذكورة أدناه'),
        ('the organisation, which is omitted entirely when none is given',
         'الجهة، وتُحذف العبارة كاملةً إذا لم تُحدَّد'),
        ('the invitation link', 'رابط الدعوة'),
    ],
}


def varies_for(kind):
    """[(english, arabic)] describing what changes per message. May be empty."""
    return TEMPLATE_VARIES.get(kind, [])


#: kind -> (human label, renderer). The kind must match what the flow passes to
#: outbound_mail.queue(), or the message can never be released.
TEMPLATES = {
    'seeker_invitation': ('Candidate invitation (NAFIS seeker)', _seeker_invitation),
    'company_invitation': ('Employer invitation (magic link)', _company_invitation),
    'vacancy_verification': ('Vacancy verification (NAFIS import)', _vacancy_verification),
    'team_invitation': ('Colleague invitation (sent by an employer admin)', _team_invitation),
    'staff_invitation': ('Platform staff invitation', _staff_invitation),
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
