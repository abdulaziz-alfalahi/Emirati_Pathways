"""Error fingerprinting for feedback grouping (migration 048).

Different people describe the same failure in different words — and in two
languages — so prose cannot group reports. The diagnostics the widget captures
can: the failing request plus the page it happened on is a language-independent
signature of "the same problem".

The fingerprint is a SUGGESTION. Reports are only ever grouped when an admin
confirms, because one signature can have several root causes (a 403 from a role
check looks identical to a 403 from company scoping).
"""
import re

# Ids that vary per user/session but not per bug.
_ID_PATTERNS = (
    (re.compile(r'/78\d{13}(?=/|$)'), '/{eid}'),                       # Emirates ID
    (re.compile(r'/[0-9a-fA-F]{8}-[0-9a-fA-F-]{20,}(?=/|$)'), '/{uuid}'),
    (re.compile(r'/(?:APP|JD|fb)[-_][0-9a-zA-Z]{6,}(?=/|$)'), '/{ref}'),
    (re.compile(r'/\d+(?=/|$)'), '/{id}'),
)


def normalize_path(url):
    """Strip origin, query string and volatile ids from a URL path."""
    if not url:
        return ''
    p = re.sub(r'^https?://[^/]+', '', str(url)).split('?')[0].split('#')[0]
    for pattern, repl in _ID_PATTERNS:
        p = pattern.sub(repl, p)
    return p.rstrip('/') or '/'


def _worst_failure(network_logs):
    """The failing request that best characterises the report.

    Server errors outrank client errors (a 500 is the bug; a 401 alongside it
    is usually a symptom), then the most recent entry wins.
    """
    best = None
    for e in (network_logs or []):
        if not isinstance(e, dict):
            continue
        status = e.get('status')
        if not isinstance(status, int) or status < 400:
            continue
        rank = (1 if status >= 500 else 0, e.get('t') or '')
        if best is None or rank > best[0]:
            best = (rank, e)
    return best[1] if best else None


def compute_fingerprint(network_logs=None, page_path=None, console_logs=None):
    """Return a stable signature string, or None when there is nothing to go on.

    Shapes:
      "net:<STATUS> <METHOD> <path>"  — a failing request (strongest)
      "js:<message> @<page>"          — a JS error, when no request failed
    Reports with neither (a bare description) get None and are never
    auto-suggested; text similarity is the fallback for those.

    The page is part of the JS signature but NOT the network one: a failing
    endpoint is the same defect wherever it is called from (including the page
    split /api/intelligence/* into one cluster per caller), whereas a JS crash
    belongs to the screen it happened on.
    """
    page = normalize_path(page_path) if page_path else ''

    ev = _worst_failure(network_logs)
    if ev:
        method = str(ev.get('method') or 'GET').upper()
        return f"net:{ev.get('status')} {method} {normalize_path(ev.get('url'))}"[:200]

    for c in (console_logs or []):
        text = c if isinstance(c, str) else (c or {}).get('message') or (c or {}).get('text') or ''
        if not text:
            continue
        low = str(text).lower()
        if 'error' in low or 'exception' in low or 'cannot read' in low:
            # Collapse quoted values so per-user detail does not split a cluster.
            t = re.sub(r"['\"][^'\"]{0,80}['\"]", "'x'", str(text))
            t = re.sub(r'\d+', 'N', t)[:120]
            return f"js:{t} @{page}"[:200]

    return None
