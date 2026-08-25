"""Reading allow-listed pages and proposing directory entries.

Phase 2 of docs/scope_scholarship_scouting.md.

WHAT THIS IS FOR

The directory lists programmes run by KHDA, MoHESR, universities and
foundations. Finding them by hand and keeping their deadlines current is the
kind of task that gets done for two months and then quietly stops. So the scout
reads an allow-list daily and proposes DRAFTS; the Education Operator approves.

FOUR RULES, EACH FROM A DECISION OR A NEAR-MISS

1. ALLOW-LIST ONLY. Searching the open web for "UAE scholarships" surfaces scam
   sites and paid aggregators, and publishing one of those on a government
   platform — even briefly, even flagged — is a reputational event rather than a
   bug (owner decision, 2026-08-23).

2. THE MODEL DOES NOT INVENT ELIGIBILITY. A wrong "minimum GPA 3.0" stops a
   qualified person applying and nobody ever finds out. Structured fields are
   populated only where the source states them; everything else stays null and
   the operator fills it in. Unknown stays unknown, as everywhere else on this
   platform.

3. NOTHING IS PUBLISHED AUTOMATICALLY. The review step is the product. A draft
   is a proposal with its provenance attached, and approval is a human act.

4. A REJECTION STICKS. The scout reads the same pages every day. Without a
   memory of what was turned down, the same item returns every morning until the
   operator stops opening the queue — the tool dying of repetition rather than
   of being wrong. Suppression is by (source_url, fingerprint), so a materially
   changed page is re-raised and an unchanged one is not.
"""
import json
import logging
import re
from datetime import date, datetime

try:
    from backend.link_verification import (
        check_link, content_fingerprint, VERIFIED_OK, LINK_WEB,
    )
    from backend.services.qwen_client import chat_completion
except ImportError:  # pragma: no cover — the app runs under both roots
    from link_verification import (
        check_link, content_fingerprint, VERIFIED_OK, LINK_WEB,
    )
    from services.qwen_client import chat_completion

logger = logging.getLogger(__name__)

#: Fields the model may propose. Deliberately the shape of `scholarships`, so a
#: draft is a proposal for a real row rather than a separate vocabulary that
#: would need translating later.
DRAFT_FIELDS = ('title', 'provider_name', 'description', 'amount',
                'coverage_type', 'deadline', 'min_gpa', 'academic_level',
                'eligible_majors', 'application_link')

_SYSTEM = """You extract scholarship programmes from a government or university web page.

Return JSON: {"scholarships": [ ... ]} — an empty list if the page describes no
specific programme. A page that merely mentions scholarships in passing, or lists
links to other pages, contains NO programme: say so rather than inventing one.

Each item may contain only these keys, and every one is OPTIONAL:
  title, provider_name, description, amount, coverage_type, deadline,
  min_gpa, academic_level, eligible_majors, application_link, eligibility_text

RULES YOU MUST FOLLOW

- NEVER infer a value. If the page does not state the deadline, omit `deadline`.
  If it does not state a minimum GPA, omit `min_gpa`. A wrong eligibility rule
  stops a qualified person from applying and nobody ever finds out, so an
  omission is always better than a guess.
- `eligibility_text` is a QUOTE from the page, not your summary of it.
- `deadline` must be YYYY-MM-DD and must appear on the page. Do not convert
  "closes at the end of June" into a date.
- `amount` is a number only if the page gives one. "Fully funded" is a
  coverage_type, not an amount.
- `application_link` must be a URL that appears on the page.
- Keep Arabic text in Arabic. Do not translate.
"""


def _prompt(url, text):
    return [
        {'role': 'system', 'content': _SYSTEM},
        {'role': 'user', 'content':
            f'Page URL: {url}\n\nPage content:\n\n{text[:24000]}'},
    ]


def _clean_date(value):
    """A date the page actually stated, or None.

    The model is told to return YYYY-MM-DD, and anything else is treated as a
    failure to find one rather than something to coerce. Coercing is how "closes
    end of June" becomes a confident 30 June that nobody checked.
    """
    if not value or not isinstance(value, str):
        return None
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value.strip()):
        return None
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        return None


def _clean_number(value):
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        digits = re.sub(r'[^\d.]', '', value)
        if digits.count('.') <= 1 and digits.strip('.'):
            try:
                return float(digits)
            except ValueError:
                return None
    return None


def normalise(item, source_url):
    """One model item -> the fields a draft row carries.

    Anything the model returned that is not a known field is dropped rather than
    stored: a draft is a proposal for a real `scholarships` row, and a key that
    cannot become a column would silently vanish at approval time anyway.
    """
    out = {k: None for k in DRAFT_FIELDS}
    for k in DRAFT_FIELDS:
        v = item.get(k)
        if isinstance(v, str):
            v = v.strip() or None
        out[k] = v
    out['deadline'] = _clean_date(item.get('deadline'))
    out['amount'] = _clean_number(item.get('amount'))
    out['min_gpa'] = _clean_number(item.get('min_gpa'))

    if isinstance(out['eligible_majors'], (list, tuple)):
        out['eligible_majors'] = json.dumps(list(out['eligible_majors']))

    # The quoted eligibility joins the description rather than becoming a
    # structured claim. It is evidence for the operator, not a filter.
    quote = item.get('eligibility_text')
    if isinstance(quote, str) and quote.strip():
        prefix = (out['description'] + '\n\n') if out['description'] else ''
        out['description'] = f'{prefix}Eligibility (from the source): {quote.strip()}'

    # A link the page did not give is worse than none: the directory refuses to
    # publish without one, so a fabricated link would fail at approval anyway.
    if out['application_link'] and not str(out['application_link']).startswith('http'):
        out['application_link'] = None
    return out


def scout_page(url, link_type=LINK_WEB):
    """Read one allow-listed page. Returns (proposals, fingerprint, error).

    A page we cannot READ is not a page with no scholarships — the distinction
    that Phase 0 exists to preserve. An unreadable source returns an error so the
    caller can report it as an infrastructure problem rather than as silence.
    """
    outcome = check_link(url, link_type=link_type)
    if outcome['state'] != VERIFIED_OK:
        return [], None, f"could not read the page: {outcome['detail'] or outcome['state']}"

    # check_link does not hand back the body, so fetch once more for the text.
    # Deliberately not merged into check_link: that function's job is to judge a
    # link, and giving it a second responsibility would make the daily checker
    # download every page in full.
    try:
        from urllib.request import Request, urlopen
        import ssl, os
        ctx = ssl.create_default_context()
        ca = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          'certs', 'extra_intermediates.pem')
        if os.path.exists(ca):
            ctx.load_verify_locations(ca)
        req = Request(url, headers={'User-Agent':
                                    'EHRDC-Emirati-Pathways-Scout/1.0 '
                                    '(+https://stg-emirati.ehrdc.gov.ae)'})
        with urlopen(req, timeout=25, context=ctx) as resp:
            body = resp.read(400_000)
    except Exception as exc:
        return [], None, f'could not fetch the page: {type(exc).__name__}'

    fingerprint = content_fingerprint(body)
    text = _readable(body)
    if len(text) < 200:
        return [], fingerprint, 'the page had almost no readable text'

    try:
        result = chat_completion('parse', _prompt(url, text),
                                 response_format={'type': 'json_object'})
    except Exception as exc:
        logger.error('scout: model call failed for %s: %s', url, exc)
        return [], fingerprint, f'the model call failed: {type(exc).__name__}'

    items = result.get('scholarships') if isinstance(result, dict) else None
    if not isinstance(items, list):
        return [], fingerprint, 'the model did not return a list'

    proposals = [normalise(i, url) for i in items if isinstance(i, dict)]
    # A proposal with no title is not a programme anyone can review.
    return [p for p in proposals if p.get('title')], fingerprint, None


def _readable(body):
    """Page text, with entities decoded — see link_verification for the why."""
    import html
    t = body.decode('utf-8', errors='replace') if isinstance(body, bytes) else body
    t = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', t)
    t = re.sub(r'(?s)<[^>]+>', ' ', t)
    t = html.unescape(t)
    return re.sub(r'\s+', ' ', t).strip()
