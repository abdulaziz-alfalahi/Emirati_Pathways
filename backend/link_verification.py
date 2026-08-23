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
"""
import hashlib
import logging
import os
import re
import ssl
import urllib.error
import urllib.request
from datetime import datetime, timezone

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
        return resp.status, resp.headers.get('Content-Type', ''), body


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
    text = re.sub(r'\s+', ' ', text).strip().lower()
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def check_link(url, link_type=LINK_WEB, previous_fingerprint=None):
    """Classify one link. Returns a dict; never raises.

    A checker that raises is a checker that stops half way through the
    directory, so every failure becomes a state instead.
    """
    now = datetime.now(timezone.utc).isoformat()
    result = {'state': UNREACHABLE, 'detail': None, 'http_status': None,
              'fingerprint': None, 'checked_at': now, 'used_extra_cas': False}

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
            status, ctype, body = _fetch(url, with_extra_cas=attempt_with_cas)
            result['used_extra_cas'] = attempt_with_cas
            result['http_status'] = status
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
