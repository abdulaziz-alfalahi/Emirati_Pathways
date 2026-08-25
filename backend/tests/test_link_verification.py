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


# ── HTML entities ───────────────────────────────────────────────────────────

def test_the_fingerprint_decodes_html_entities():
    """Otherwise an Arabic page hashes as its escape sequences, not its text.

    Measured on https://u.ae/ar/... (2026-08-24): without unescaping, the
    extracted text carried 984 entity artifacts and only 138 readable Arabic
    characters; with it, 0 artifacts and 1,122 Arabic characters.

    Two consequences, both bad. The text handed to a model was mostly
    "&#x627;&#x644;" noise, and — worse for this module — the SAME page served
    with different entity encoding hashed differently. A CMS upgrade or a CDN
    can change that on its own, so a programme nobody had touched would be
    reported as changed.
    """
    encoded = b'<html><body><p>&#x627;&#x644;&#x645;&#x646;&#x62D; &amp; scholarships</p></body></html>'
    decoded = '<html><body><p>المنح & scholarships</p></body></html>'
    assert content_fingerprint(encoded) == content_fingerprint(decoded), (
        'the same page in two encodings hashes differently, so entity changes '
        'read as programme changes'
    )


def test_entities_are_decoded_after_tags_are_stripped_not_before():
    """Order matters, and getting it backwards deletes real content.

    A page that DISPLAYS "&lt;script&gt;" as text means the characters
    "<script>", not a script element. Unescaping first would turn it into a real
    tag and the tag-stripping pass would then delete it.
    """
    shown_as_text = b'<html><body><p>Use &lt;script&gt; carefully</p></body></html>'
    fp = content_fingerprint(shown_as_text)
    # The words survive: nothing was mistaken for markup and removed.
    assert fp == content_fingerprint('<p>Use <script> carefully</p>'.replace('<script>', '&lt;script&gt;'))


# ── The soft 404 that answers 200 with a homepage ───────────────────────────
#
# Added 2026-08-25. KHDA does both halves of this, and neither is visible to a
# status-code check:
#
#   * www.khda.gov.ae/<any-path> 301s to https://web.khda.gov.ae/en, discarding
#     the path, so every deep link lands on the homepage.
#   * web.khda.gov.ae answers unknown paths with 200 AND the homepage body. A
#     link taken from KHDA's own homepage extracted byte-for-byte the same 4,915
#     characters as the homepage.
#
# Before this, such a link was verified_ok for ever while sending candidates to
# a homepage. These tests run against a real socket rather than a stubbed
# fetcher, because the bug lived in what the network actually returned.

import threading                                                  # noqa: E402
from http.server import BaseHTTPRequestHandler, HTTPServer         # noqa: E402

import pytest                                                      # noqa: E402

from link_verification import _is_front_door                       # noqa: E402

_HOME = b'<html><body><h1>Authority</h1><p>An exemplary education for all.</p></body></html>'
_REAL = b'<html><body><h1>Scholarship Programme</h1><p>Applications close 2026-10-01.</p></body></html>'


class _KhdaShapedHandler(BaseHTTPRequestHandler):
    """A server that fails the two ways KHDA fails, and works otherwise."""

    def log_message(self, *args):
        pass                                    # keep pytest output readable

    def do_GET(self):
        if self.path.startswith('/discard'):    # the www.khda.gov.ae shape
            self.send_response(301)
            self.send_header('Location', '/en')
            self.end_headers()
            return
        if self.path == '/hard-404':            # a site that fails honestly
            self.send_error(404)
            return
        # Everything else answers 200: the front door, the one real page, and
        # — the bug — any path that does not exist, served as the homepage.
        body = _REAL if self.path == '/en/real-programme' else _HOME
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


@pytest.fixture(scope='module')
def khda_shaped_site():
    server = HTTPServer(('127.0.0.1', 0), _KhdaShapedHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f'http://127.0.0.1:{server.server_port}'
    server.shutdown()


def test_a_deep_link_served_the_homepage_is_flagged(khda_shaped_site):
    """The core case: 200, no error text, and not the page it claims to be."""
    result = check_link(f'{khda_shaped_site}/en/gone-programme')
    assert result['http_status'] == 200
    assert result['state'] == CHANGED, (
        'a link that answers 200 with the site homepage was reported as '
        'verified — this is how a dead deep link stays green for ever'
    )
    assert result['state'] in OPERATOR_ACTIONABLE


def test_a_redirect_that_discards_the_path_is_flagged(khda_shaped_site):
    result = check_link(f'{khda_shaped_site}/discard/en/programme')
    assert result['state'] == CHANGED
    assert 'homepage' in result['detail']
    assert result['final_url'].endswith('/en'), (
        'the URL we actually landed on is what makes this diagnosable'
    )


def test_a_soft_404_is_changed_and_never_gone(khda_shaped_site):
    """The programme is almost certainly still running somewhere else.

    `gone` invites the operator to archive it. What died is our link, not the
    scholarship, so this must land in the review queue rather than the bin.
    """
    for path in ('/en/gone-programme', '/discard/en/programme'):
        assert check_link(f'{khda_shaped_site}{path}')['state'] != GONE


def test_a_real_page_on_a_soft_404ing_site_still_verifies(khda_shaped_site):
    """The false positive that would matter most.

    The same site soft-404s unknown paths, so the check must distinguish a live
    programme page from the homepage rather than condemning the whole domain.
    """
    result = check_link(f'{khda_shaped_site}/en/real-programme')
    assert result['state'] == VERIFIED_OK


def test_a_link_to_the_front_door_is_not_flagged(khda_shaped_site):
    """A source page IS the homepage. It has not 'become' one."""
    for path in ('/', '/en'):
        assert check_link(f'{khda_shaped_site}{path}')['state'] == VERIFIED_OK


def test_the_soft_404_check_runs_even_when_the_page_has_not_changed(khda_shaped_site):
    """The reason this bug survived: previous == current on a link that has
    been soft-404ing since the day it was added, so a 'changed?' test passes it.
    """
    first = check_link(f'{khda_shaped_site}/en/gone-programme')
    again = check_link(f'{khda_shaped_site}/en/gone-programme',
                       previous_fingerprint=first['fingerprint'])
    assert again['state'] == CHANGED, (
        'an unchanged soft-404 was waved through — the check must not be '
        'gated on the fingerprint differing'
    )


def test_an_honest_404_is_still_gone_not_changed(khda_shaped_site):
    assert check_link(f'{khda_shaped_site}/hard-404')['state'] == GONE


def test_the_front_door_is_fetched_once_per_site(khda_shaped_site):
    """A cache the caller owns, so a run of 200 links is not 400 requests."""
    cache = {}
    for path in ('/en/one', '/en/two', '/en/three'):
        check_link(f'{khda_shaped_site}{path}', front_door_cache=cache)
    assert len(cache) == 1


def test_an_unfetchable_front_door_never_downgrades_a_link():
    """Our failure must not become a verdict about somebody's programme.

    If the homepage cannot be fetched there is nothing to compare against, and
    the honest answer is to leave the link alone — not to guess.
    """
    from link_verification import _front_door_fingerprint
    assert _front_door_fingerprint('http://127.0.0.1:1/x', False, {}) is None


def test_only_language_and_index_segments_count_as_the_front_door():
    """Strictness here is what keeps honest links out of the queue.

    A real programme can live at /scholarships; treating any one-segment path
    as the homepage would flag it.
    """
    assert _is_front_door('https://example.gov.ae/')
    assert _is_front_door('https://example.gov.ae')
    assert _is_front_door('https://example.gov.ae/en')
    assert _is_front_door('https://example.gov.ae/AR')
    assert not _is_front_door('https://example.gov.ae/scholarships')
    assert not _is_front_door('https://example.gov.ae/en/scholarships')
