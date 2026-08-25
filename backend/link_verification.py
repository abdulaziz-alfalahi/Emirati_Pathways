"""Checking that a directory link still goes somewhere.

WHY THIS FILE EXISTS

The scholarship directory points at programmes run by KHDA, MoHESR, universities
and foundations. Its whole value is that the links work: an entry nobody has
checked sends a candidate to a closed application, which is worse than not
listing it at all.

THE RULE THIS MODULE ENFORCES

    "Could not verify" is NEVER "expired."

That is not a nicety. Diagnosing this on 2026-08-23, the very first source we
tried — KHDA, which runs the AED 1.1bn Hamdan bin Mohammed programme — failed
verification from inside the container. A checker written the obvious way would
have marked it broken and invited an operator to archive a live government
programme.

What was actually wrong is worth recording, because it is the shape of problem
this module exists to survive:

  * www.khda.gov.ae is configured correctly and serves a full chain.
  * It 302s to web.khda.gov.ae, which serves ONLY its leaf certificate — no
    intermediate. OpenSSL says "Verify return code: 21 (unable to verify the
    first certificate)".
  * Browsers and curl do not notice, because they follow the certificate's
    Authority Information Access extension and fetch the missing intermediate
    themselves. Python and OpenSSL do not do this.

So the site looks fine to every human who checks it and fails for our fetcher.
A naive checker would report a false death on the most important source we have,
and the operator would have no way to tell that from a real one.

Hence four states, not two:

    verified_ok   fetched, and it still looks like the programme
    changed       fetched, but the page is not what it was
    gone          fetched, and it is a 404 or says the programme has closed
    unreachable   WE could not fetch it — proxy, TLS, timeout, rate limit

Only `changed` and `gone` are the operator's problem. `unreachable` is ours, and
a whole domain going unreachable is an infrastructure alert rather than a pile
of directory tasks.

THE SOFT 404 THAT ANSWERS 200 WITH A HOMEPAGE

Added 2026-08-25, after KHDA turned out to do BOTH halves of this:

  * www.khda.gov.ae/<any-path> 301s to https://web.khda.gov.ae/en — the path is
    thrown away, so every deep link anyone has ever shared lands on the homepage.
  * web.khda.gov.ae answers unknown paths with 200 and the homepage body. A link
    taken from KHDA's OWN homepage extracted byte-for-byte the same 4,915
    characters as the homepage.

Neither says "page not found" anywhere, so `_CLOSED_PATTERNS` does not fire and
the status code is a clean 200. Before this change such a link was `verified_ok`
for ever while sending candidates to a homepage — the exact opposite of the
confidence a pre-verified deep link is supposed to buy.

It is classified `changed`, never `gone`. The programme is very likely still
running at some other URL; what died is our link to it. That is a person's job
to re-find, not a reason to archive a live government programme.
"""
import hashlib
import html
import logging
import os
import re
import ssl
import urllib.error
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

# ── Link states ─────────────────────────────────────────────────────────────
VERIFIED_OK = 'verified_ok'
CHANGED = 'changed'
GONE = 'gone'
UNREACHABLE = 'unreachable'

#: States that belong in the operator's queue. `unreachable` deliberately does
#: not: it is a statement about us, not about the programme.
OPERATOR_ACTIONABLE = (CHANGED, GONE)

# ── Link types ──────────────────────────────────────────────────────────────
#
# Not every application lives at a URL. The Hamdan bin Mohammed programme is
# applied for INSIDE the Dubai Now app: no server can test that link and neither
# can this module. Those entries need a person to confirm them, so they are
# never machine-checked and never silently marked good.
LINK_WEB = 'web'
LINK_APP = 'app'
LINK_IN_PERSON = 'in_person'
MACHINE_CHECKABLE = (LINK_WEB,)

_EXTRA_CA = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         'certs', 'extra_intermediates.pem')

# Phrases that mean the page loaded but the thing is over. Deliberately narrow:
# a false `gone` unpublishes a real programme, so anything ambiguous stays
# `verified_ok` and waits for a human.
_CLOSED_PATTERNS = re.compile(
    r'applications?\s+(are\s+)?closed'
    r'|no\s+longer\s+accepting'
    r'|programme?\s+has\s+ended'
    r'|page\s+not\s+found'
    r'|أُغلق\s+التقديم'
    r'|انتهى\s+البرنامج'
    r'|الصفحة\s+غير\s+موجودة',
    re.I)

_TIMEOUT = 20
_UA = ('EHRDC-Emirati-Pathways-LinkChecker/1.0 '
       '(+https://stg-emirati.ehrdc.gov.ae; link verification for the '
       'scholarship directory)')


def _context(with_extra_cas):
    """Default verification, optionally plus the intermediates we carry.

    See the module docstring: some government hosts serve an incomplete chain
    and rely on the client fetching the intermediate itself. We cannot do that
    mid-handshake, so we carry the ones we have needed and retry with them
    before giving up. That is a workaround for someone else's misconfiguration,
    and it is deliberately visible in the result rather than silent.
    """
    ctx = ssl.create_default_context()
    if with_extra_cas and os.path.exists(_EXTRA_CA):
        try:
            ctx.load_verify_locations(_EXTRA_CA)
        except Exception as exc:            # a broken bundle must not break checking
            logger.warning('extra intermediates not loaded: %s', exc)
    return ctx


def _fetch(url, with_extra_cas=False):
    req = urllib.request.Request(url, headers={'User-Agent': _UA})
    with urllib.request.urlopen(req, timeout=_TIMEOUT,
                                context=_context(with_extra_cas)) as resp:
        body = resp.read(400_000)           # enough to judge a page by
        # geturl() is where we ACTUALLY landed after redirects. Comparing it
        # with what we asked for is what catches a host that drops the path.
        return resp.status, resp.headers.get('Content-Type', ''), body, resp.geturl()


#: Path segments that are navigation, not content. A site's homepage is often
#: served at /en or /ar rather than /, so landing on one of these is landing on
#: the front door.
_LANGUAGE_SEGMENTS = frozenset(('en', 'ar', 'en-us', 'ar-ae', 'index.html',
                                'index.aspx', 'default.aspx', 'home'))


def _is_front_door(url):
    """Is this URL the site's front door rather than a page within it?

    Deliberately strict: a single segment only counts as the front door when it
    is a language or index segment. A real programme can perfectly well live at
    /scholarships, and flagging that would put honest links in the queue.
    """
    segments = [s for s in urlparse(url).path.split('/') if s]
    if not segments:
        return True
    return len(segments) == 1 and segments[0].lower() in _LANGUAGE_SEGMENTS


def _front_door_fingerprint(url, with_extra_cas, cache):
    """Fingerprint of the front door of whatever site `url` lives on.

    Returns None if we cannot get it. That is important: a failure to fetch the
    homepage is OUR problem, and must never be turned into a verdict about
    somebody's programme. No fingerprint simply means no soft-404 check.
    """
    parsed = urlparse(url)
    origin = f'{parsed.scheme}://{parsed.netloc}'
    if origin in cache:
        return cache[origin]

    fingerprint = None
    try:
        _status, _ctype, body, _final = _fetch(urljoin(origin, '/'), with_extra_cas)
        fingerprint = content_fingerprint(body)
    except Exception as exc:                # any failure at all — see docstring
        logger.debug('front door of %s not fetched (%s); '
                     'skipping the soft-404 check', origin, exc)
    cache[origin] = fingerprint
    return fingerprint


def content_fingerprint(body):
    """A hash for 'has this page changed', not a checksum of the bytes.

    Whitespace and script/style blocks change on every deploy of somebody's CMS
    without the programme changing at all, so they are stripped first. This will
    still be noisy — what counts as a MATERIAL change is a tuning question the
    scope leaves open — but it is not noisy for trivial reasons.
    """
    text = body.decode('utf-8', errors='replace') if isinstance(body, bytes) else body
    text = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', text)
    text = re.sub(r'(?s)<[^>]+>', ' ', text)
    # UNESCAPE AFTER STRIPPING TAGS, never before. Measured on u.ae 2026-08-24:
    # without this, Arabic pages hash as "&#x627;&#x644;..." rather than as
    # their text, so the same page served with different entity encoding — which
    # a CMS upgrade or a CDN can change on its own — reads as a changed
    # programme. It also meant the extracted text was useless to a model.
    #
    # Order matters: unescaping first would turn a literal "&lt;div&gt;" that
    # the page DISPLAYS into a real tag, and the next line would delete it.
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip().lower()
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def check_link(url, link_type=LINK_WEB, previous_fingerprint=None,
               front_door_cache=None):
    """Classify one link. Returns a dict; never raises.

    A checker that raises is a checker that stops half way through the
    directory, so every failure becomes a state instead.

    `front_door_cache` is a dict the caller can pass across a whole run so a
    site's homepage is fetched once rather than once per link. Without it the
    check still works, just without the sharing.
    """
    now = datetime.now(timezone.utc).isoformat()
    result = {'state': UNREACHABLE, 'detail': None, 'http_status': None,
              'fingerprint': None, 'checked_at': now, 'used_extra_cas': False,
              'final_url': None}
    if front_door_cache is None:
        front_door_cache = {}

    if link_type != LINK_WEB:
        # An app deep link or an in-person process. Saying "unreachable" would
        # be true and useless; saying "ok" would be a lie. It is simply not ours
        # to check, and the operator confirms it by hand.
        result['detail'] = f'{link_type} link — only a person can confirm this'
        return result

    if not url:
        result['detail'] = 'no link recorded'
        return result

    for attempt_with_cas in (False, True):
        try:
            status, ctype, body, final_url = _fetch(url, with_extra_cas=attempt_with_cas)
            result['used_extra_cas'] = attempt_with_cas
            result['http_status'] = status
            result['final_url'] = final_url
            break
        except urllib.error.HTTPError as exc:
            # The server answered, so this is about the PAGE, not about us.
            result['http_status'] = exc.code
            if exc.code in (404, 410):
                result['state'] = GONE
                result['detail'] = f'HTTP {exc.code}'
            else:
                result['detail'] = f'HTTP {exc.code}'
            return result
        except ssl.SSLError as exc:
            if not attempt_with_cas:
                continue                    # retry once with our intermediates
            result['detail'] = f'TLS verification failed: {str(exc)[:120]}'
            return result
        except urllib.error.URLError as exc:
            reason = getattr(exc, 'reason', exc)
            if isinstance(reason, ssl.SSLError) and not attempt_with_cas:
                continue
            result['detail'] = f'could not connect: {str(reason)[:120]}'
            return result
        except Exception as exc:            # timeouts, malformed responses, DNS
            result['detail'] = f'{type(exc).__name__}: {str(exc)[:120]}'
            return result
    else:
        return result

    # A SOFT 404: government sites commonly answer 200 with a "page not found"
    # body, and a status-code check sails straight past it.
    text = body.decode('utf-8', errors='replace')[:200_000]
    if _CLOSED_PATTERNS.search(text):
        result['state'] = GONE
        result['detail'] = 'the page says it is closed or missing'
        return result

    result['fingerprint'] = content_fingerprint(body)

    # THE SOFT 404 THAT ANSWERS 200 WITH A HOMEPAGE (see the module docstring).
    #
    # This runs BEFORE the previous_fingerprint comparison on purpose. A link
    # that has been soft-404ing since the day it was added has a previous
    # fingerprint equal to its current one, so the "changed?" test below passes
    # it cheerfully — which is exactly how such a link stayed green for ever.
    # Only a link that ASKED for a page within a site can land on the front door
    # of one; a link to the front door is meant to be there.
    if not _is_front_door(url):
        landed_on_front_door = _is_front_door(result['final_url'] or url)
        front_door = _front_door_fingerprint(
            result['final_url'] or url, result['used_extra_cas'], front_door_cache)
        looks_like_front_door = (front_door is not None
                                 and front_door == result['fingerprint'])
        if landed_on_front_door or looks_like_front_door:
            result['state'] = CHANGED
            if landed_on_front_door and result['final_url'] != url:
                result['detail'] = (
                    f'this link now lands on the site homepage '
                    f'({result["final_url"]}) — the deep link no longer resolves')
            else:
                result['detail'] = ('this link answers 200 but serves the site '
                                    'homepage — the page it pointed at is gone')
            return result

    if previous_fingerprint and previous_fingerprint != result['fingerprint']:
        result['state'] = CHANGED
        result['detail'] = 'the page changed since the last check'
        return result

    result['state'] = VERIFIED_OK
    if result['used_extra_cas']:
        # Worth surfacing: it means the site is relying on the client to fetch
        # its missing intermediate, and any stricter client will fail on it.
        result['detail'] = ('verified, but the site served an incomplete '
                            'certificate chain')
    return result
