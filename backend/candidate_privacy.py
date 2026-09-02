"""Candidate contact details do not leave the platform.

OWNER RULING, 2026-09-02, answering a recruiter who raised it against their own
access (fb_1788341745, "The contact details should not be shown to recruiters"):

    "For candidates' contact details, the platform should conceal them, as
     communication must take place on the platform for quality and governance
     purposes."

So this is not only a privacy measure. An employer who telephones a candidate
directly leaves no record: nothing to audit, nothing to measure, and no way to
tell whether the candidate was ever contacted at all. Keeping the conversation
on the platform is what makes the rest of the governance possible.

WHO STILL SEES CONTACT DETAILS

EHRDC and CRM operators keep them, unchanged. They already hold every
candidate's name, Emirates ID and telephone number in the CRM roster, they call
candidates as their job, and the existing EID visibility ruling turns on exactly
that distinction. What changes is the EMPLOYER side: recruiters, HR managers and
employer admins see a candidate's name and profile, and reach them through the
platform's own messaging.

There is a channel to reach them by: RECRUITER_ROLES are in
`communication_routes._staff_msg_roles()`, so a recruiter may already open a
conversation with any candidate. Concealing an address without that would just
be a dead end.

HOW IT IS APPLIED

`redact()` walks a response payload and removes contact keys. It is applied at
the point a candidate is serialised rather than by editing fifteen SELECT
statements, because a SELECT is easy to add and easy to forget — and the failure
mode of forgetting is a citizen's telephone number on an employer's screen.
"""
import logging

logger = logging.getLogger(__name__)

try:
    from backend.auth.access_control import ADMIN_ROLES, OPERATOR_ROLES
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import ADMIN_ROLES, OPERATOR_ROLES

#: Keys that carry a way to reach somebody off-platform.
#:
#: `candidate_email` and `candidate_phone` are unambiguous. Bare `email` and
#: `phone` are included because that is how the candidate search and the HR
#: candidate profile spell them — the redaction is applied to candidate payloads
#: specifically, never to a whole response, so a recruiter's own address is not
#: caught by it.
CONTACT_KEYS = frozenset({
    'email', 'phone', 'mobile', 'mobile_number', 'phone_number',
    'candidate_email', 'candidate_phone', 'contact_email', 'contact_phone',
    'personal_email', 'whatsapp',
})

#: Roles that keep contact details. EHRDC and CRM operators call candidates as
#: their job; an operator who cannot see a telephone number cannot do it.
MAY_SEE_CONTACT = ADMIN_ROLES | OPERATOR_ROLES | {'career_services_operator',
                                                  'call_center_agent'}


def may_see_contact(roles):
    """Does this viewer keep candidate contact details?

    Unknown or empty roles get the RESTRICTED answer. A viewer whose roles could
    not be resolved is not evidence of entitlement, and defaulting the other way
    would mean a bug in role resolution silently discloses telephone numbers.
    """
    return bool(set(roles or []) & MAY_SEE_CONTACT)


def redact(payload, roles=None, _viewer_may_see=None):
    """Strip candidate contact keys from a payload unless the viewer may see them.

    Walks dicts and lists so a list of candidates, or a candidate nested inside
    an application, is covered without the caller knowing the shape. Returns a
    new structure; the input is not modified.
    """
    allowed = _viewer_may_see if _viewer_may_see is not None else may_see_contact(roles)
    if allowed:
        return payload
    return _strip(payload)


def _strip(value):
    if isinstance(value, dict):
        return {k: _strip(v) for k, v in value.items() if k not in CONTACT_KEYS}
    if isinstance(value, list):
        return [_strip(v) for v in value]
    return value


def redact_for_current_user(payload):
    """Convenience for a request context: resolve the caller's roles and redact.

    Never raises. A failure to resolve roles redacts — see may_see_contact.
    """
    roles = set()
    try:
        try:
            from backend.auth.access_control import resolve_roles
        except ImportError:  # pragma: no cover
            from auth.access_control import resolve_roles
        roles = resolve_roles() or set()
    except Exception:                                          # noqa: BLE001
        logger.warning('candidate_privacy: could not resolve roles; redacting')
    return redact(payload, roles)
