""""Could not verify" must never become "expired".

WHY THIS FILE EXISTS

The scholarship directory's value is that its links work. The obvious way to
check that — fetch it, mark it dead if the fetch fails — would have destroyed
the directory on its first run.

Measured on 2026-08-23, the first source tried was KHDA, which runs the AED
1.1bn Hamdan bin Mohammed programme. It failed verification from inside the
container:

    www.khda.gov.ae serves a full chain, but 302s to web.khda.gov.ae, which
    serves ONLY its leaf certificate. OpenSSL: "Verify return code: 21 (unable
    to verify the first certificate)". Browsers and curl do not notice, because
    they follow the certificate's Authority Information Access extension and
    fetch the missing intermediate; Python and OpenSSL do not.

So the site is fine for every human who checks it and fails for our fetcher. A
two-state checker would have reported a false death on the most important
programme in the directory, and an operator would have had no way to tell that
from a real one.

These tests pin the distinction, and the cases that are easy to "simplify" away.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from link_verification import (  # noqa: E402
    check_link, content_fingerprint,
    VERIFIED_OK, CHANGED, GONE, UNREACHABLE,
    OPERATOR_ACTIONABLE, LINK_WEB, LINK_APP, LINK_IN_PERSON,
)


# ── The rule ────────────────────────────────────────────────────────────────

def test_unreachable_is_not_actionable_by_the_operator():
    """It is a statement about US, not about the programme.

    If unreachable reached the queue, a proxy outage would present as every
    scholarship in the directory having died at once, and the sane response —
    archiving them — would be catastrophic and irreversible by hand.
    """
    assert UNREACHABLE not in OPERATOR_ACTIONABLE
    assert set(OPERATOR_ACTIONABLE) == {CHANGED, GONE}


def test_the_four_states_are_distinct():
    assert len({VERIFIED_OK, CHANGED, GONE, UNREACHABLE}) == 4


# ── Links no machine can check ──────────────────────────────────────────────

def test_an_app_link_is_never_reported_as_verified():
    """The Hamdan bin Mohammed application lives inside the Dubai Now app.

    No server can follow that link. Reporting it verified would be a lie the
    candidate relies on; reporting it gone would delete a real programme. It is
    simply not ours to judge.
    """
    r = check_link('dubainow://scholarships', link_type=LINK_APP)
    assert r['state'] != VERIFIED_OK
    assert r['state'] not in OPERATOR_ACTIONABLE
    assert 'person' in (r['detail'] or '')


def test_an_in_person_process_is_never_reported_as_gone():
    r = check_link('', link_type=LINK_IN_PERSON)
    assert r['state'] not in OPERATOR_ACTIONABLE


def test_a_missing_link_is_unreachable_not_gone():
    """An entry with no link is a gap in OUR data, not a closed programme."""
    r = check_link('', link_type=LINK_WEB)
    assert r['state'] == UNREACHABLE


# ── Failure handling ────────────────────────────────────────────────────────

def test_a_broken_host_is_unreachable_and_does_not_raise():
    """A checker that raises stops half way through the directory.

    Everything after the first bad link would keep whatever status it had, and
    look freshly checked.
    """
    r = check_link('https://this-host-does-not-exist.invalid/', link_type=LINK_WEB)
    assert r['state'] == UNREACHABLE
    assert r['detail']
    assert r['checked_at']


# ── Change detection ────────────────────────────────────────────────────────

def test_the_fingerprint_ignores_markup_and_whitespace():
    """A CMS redeploy must not read as the programme changing.

    Otherwise every entry is flagged every week, the operator learns the flag
    means nothing, and a real deadline change goes past unread.
    """
    a = b'<html> <body><h1>Scholarship</h1>  <p>Closes 30 June</p></body></html>'
    b_ = b'<html>\n  <body>\n    <h1>Scholarship</h1>\n<p>Closes 30 June</p>\n</body>\n</html>'
    assert content_fingerprint(a) == content_fingerprint(b_)


def test_the_fingerprint_ignores_scripts_and_styles():
    a = b'<html><script>var t=1</script><body>Closes 30 June</body></html>'
    b_ = b'<html><script>var t=99999</script><body>Closes 30 June</body></html>'
    assert content_fingerprint(a) == content_fingerprint(b_)


def test_the_fingerprint_notices_a_changed_deadline():
    a = b'<html><body><p>Closes 30 June</p></body></html>'
    b_ = b'<html><body><p>Closes 15 July</p></body></html>'
    assert content_fingerprint(a) != content_fingerprint(b_)


# ── The workaround stays visible ────────────────────────────────────────────

def test_the_extra_intermediates_bundle_is_shipped():
    """We carry an intermediate KHDA's server should be sending itself.

    If this file goes missing the checker starts reporting the most important
    source in the directory as unreachable, and the reason will not be obvious.
    """
    pem = os.path.join(BACKEND, 'certs', 'extra_intermediates.pem')
    assert os.path.exists(pem), 'backend/certs/extra_intermediates.pem is missing'
    with open(pem, encoding='utf-8') as fh:
        body = fh.read()
    assert 'BEGIN CERTIFICATE' in body


def test_a_site_needing_our_intermediate_says_so():
    """Verified-with-a-workaround is not the same as verified.

    It means the site relies on the client fetching its missing intermediate,
    and any stricter client — including a candidate's — may fail on it. That is
    worth telling somebody rather than papering over.
    """
    src = open(os.path.join(BACKEND, 'link_verification.py'), encoding='utf-8').read()
    assert 'incomplete' in src and 'used_extra_cas' in src
