"""The shared live board for an open day.

WHY THIS FILE EXISTS

Owner, 2026-08-27: a shareable live tracker for open days, like the one the
Ithra exhibition runs at ops.eif.gov.ae. That reference is open to anyone with
the URL, which is the point — it goes on a projector at the venue and into a
group chat.

So this endpoint has NO AUTHENTICATION. The token is the credential, and the
risks that follow are what these tests are about:

  * a link that cannot be withdrawn once it leaks
  * a link that outlives the event nobody remembers to withdraw
  * hiring outcomes reaching an audience they were never meant for
  * a probe of many tokens learning which guesses were once real
"""
import os
import re
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
# The helper lives beside this file; BACKEND alone does not reach it.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest  # noqa: E402

from source_utils import code_only  # noqa: E402

ROUTES = os.path.join(BACKEND, 'routes', 'recruitment_events_routes.py')


def _source():
    return open(ROUTES, encoding='utf-8').read()


def _public_endpoint():
    s = _source()
    return s[s.index('def public_event_live('):]


# ── The share/organiser split ───────────────────────────────────────────────

def test_the_public_board_carries_no_hiring_outcomes():
    """The owner's decision: turnout and demographics are shareable, hiring
    outcomes are not. They are commercially sensitive to the employers standing
    in the room, and a live "hired: 2" beside "340 attended" becomes a published
    statistic the moment the link is forwarded.

    Enforced in the endpoint rather than by hoping the front end asks for the
    right thing — a second consumer of this API would not know the rule.
    """
    block = _public_endpoint()
    assert 'event_outcomes' not in block, 'the public board reads the outcomes table'
    for word in ("'hired'", "'offered'", "'interviewed'"):
        assert word not in block


def test_the_organiser_funnel_is_still_role_gated():
    """The split only means something if the full funnel stays restricted."""
    s = _source()
    idx = s.index('def event_funnel(')
    assert '@require_roles(*EVENT_ORGANISER_ROLES)' in s[max(0, idx - 300):idx]


def test_the_public_endpoint_has_no_auth_decorator():
    """Deliberate: the token IS the credential. Pinned so a later edit does not
    quietly add jwt_required and break every projector at a venue."""
    s = _source()
    idx = s.index('def public_event_live(')
    decorators = s[max(0, idx - 300):idx]
    assert '@require_roles' not in decorators
    assert '@jwt_required' not in decorators


# ── The link itself ─────────────────────────────────────────────────────────

def test_a_revoked_or_expired_link_is_refused():
    block = _public_endpoint()
    assert "link.get('revoked_at')" in block
    assert 'expires_at' in block


def test_every_unusable_link_gets_the_SAME_message():
    """Distinguishing "revoked" from "expired" from "never existed" would tell
    somebody probing tokens which of their guesses was once real."""
    block = _public_endpoint()
    messages = re.findall(r"'message': '([^']+)'", block)
    assert messages, 'no refusal message found'
    assert len(set(messages)) == 1, f'refusals differ: {set(messages)}'


def test_the_token_is_long_enough_that_guessing_is_not_a_strategy():
    match = re.search(r'_SHARE_TOKEN_BYTES\s*=\s*(\d+)', _source())
    assert match, 'token length not defined'
    assert int(match.group(1)) >= 16


def test_the_link_expires_with_the_event_not_on_a_fixed_date():
    """An open-day board has no audience a week later, and a link that outlives
    its event is one nobody remembers to withdraw."""
    s = _source()
    block = s[s.index('def create_event_share_link('):s.index('def list_event_share_links(')]
    assert 'ends_at' in block
    assert '_SHARE_GRACE_HOURS' in block


def test_revocation_records_who_and_when_rather_than_deleting():
    """"Who turned this off and when" is the first question after a link leaks,
    and a deleted row cannot answer it."""
    s = _source()
    block = s[s.index('def revoke_event_share_link('):]
    assert 'revoked_at = now()' in block
    assert 'revoked_by' in block
    assert 'DELETE FROM EVENT_SHARE_LINKS' not in block.upper()


def test_revoking_twice_is_refused_rather_than_silently_succeeding():
    s = _source()
    block = s[s.index('def revoke_event_share_link('):]
    assert 'revoked_at IS NULL' in block
    assert '409' in block


def test_creating_and_revoking_are_organiser_only():
    s = _source()
    for fn in ('def create_event_share_link(', 'def revoke_event_share_link('):
        idx = s.index(fn)
        assert '@require_roles(*EVENT_ORGANISER_ROLES)' in s[max(0, idx - 300):idx]


# ── The figures ─────────────────────────────────────────────────────────────

def test_every_figure_is_counted_not_estimated():
    """This goes on a screen at a venue and gets quoted. A number that turns
    out to have been extrapolated is worse than no number."""
    code = code_only(_public_endpoint()).lower()
    for invented in ('estimate', 'projected', 'forecast', 'extrapolat'):
        assert invented not in code


def test_demographics_ship_with_their_coverage():
    """"67% female" from three of eight attendees reads exactly like "67%
    female" from three hundred unless the coverage is beside it."""
    block = _public_endpoint()
    assert 'coverage_percent' in block
    assert "'known'" in block and "'total'" in block


def test_unknown_values_are_excluded_from_buckets_but_counted_in_the_total():
    """Otherwise "unknown" renders as its own demographic category."""
    block = _public_endpoint()
    assert "r['bucket'] != 'unknown'" in block


def test_vacancies_count_published_postings_only():
    """A vacancy nobody has confirmed is not something to put on a screen in
    front of the people who would apply for it."""
    block = _public_endpoint()
    vac = block[block.index('FROM job_postings j'):]
    vac = vac[:vac.index('"""')]
    assert "status = 'published'" in vac


def test_a_failed_view_count_never_breaks_the_board():
    """It is the least important thing on the page."""
    block = _public_endpoint()
    tail = block[block.index('view_count = view_count + 1'):]
    assert 'except Exception' in tail


def test_walk_ins_are_reported_separately_from_registered():
    """They did not come from an invitation, and folding them in would
    overstate how well the calling worked — the rule the funnel already follows."""
    block = _public_endpoint()
    assert 'walk_ins' in block
    assert 'i.id IS NULL' in block
