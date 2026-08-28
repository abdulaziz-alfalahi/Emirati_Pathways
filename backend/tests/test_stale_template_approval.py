"""An approval only means something while it still describes what is sent.

WHY THIS FILE EXISTS

Reported 2026-08-27: "staff-invitation shows it is already approved."

It did, and the approval was genuine — given the day before, for wording that
had since changed. Four role names moved that morning, so the rendered message
was different text, and the templates screen still said `approved` because it
reported the table without ever asking the code what it renders today.

The QUEUE was never at risk: release() joins held messages to an approved row
ON THE FINGERPRINT, so a message composed from the new wording finds no approved
row and stays held. Nothing could have gone out under the stale approval.

The failure was the screen, and it is the worse kind: a gate the owner is told
is open when it is shut. They would have issued staff invitations, seen no
error, and found nothing delivered.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import code_only, js_code_only  # noqa: E402


def _routes():
    return code_only(open(os.path.join(BACKEND, 'routes', 'outbound_mail_routes.py'),
                          encoding='utf-8').read())


def _screen():
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'components',
                        'admin', 'OutboundMailTemplates.tsx')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    return js_code_only(open(path, encoding='utf-8').read())


def test_the_listing_compares_against_a_live_rendering():
    """Reporting the table alone is what made changed wording invisible."""
    source = _routes()
    listing = source[source.index('def list_templates'):source.index('def register_templates')]
    assert 'fingerprint_for(' in listing, 'the listing never asks what the code renders'
    assert 'is_current' in listing
    assert 'approved_now' in listing


def test_changed_wording_surfaces_without_anybody_pressing_a_button():
    """register_all was reachable only by POSTing /templates/register. A button
    nobody presses looks exactly like "nothing has changed"."""
    source = _routes()
    listing = source[source.index('def list_templates'):source.index('def register_templates')]
    assert 'register_all()' in listing


def test_registering_during_a_read_cannot_approve_anything():
    """Recording wording and authorising it are separate acts, and a GET must
    never perform the second one — the listing now calls this on every read."""
    import inspect
    from services import mail_templates
    src = inspect.getsource(mail_templates.register_all)
    assert "status = 'approved'" not in src, 'a read would approve wording'
    # It may retire a superseded PENDING version; an approved one stays in force.
    assert "WHERE kind = %s AND status = 'pending'" in src


def test_a_failed_registration_does_not_take_the_screen_down():
    """The owner must still be able to READ approvals when a template cannot
    render — that is exactly when they need to look."""
    source = _routes()
    listing = source[source.index('def list_templates'):source.index('def register_templates')]
    assert 'except Exception' in listing


def test_the_screen_does_not_call_a_stale_approval_in_use():
    """'In use' is the sentence that hid this. An approved row that is no longer
    what the code renders is not in use — it describes text nobody will receive."""
    source = _screen()
    assert 'is_current === false' in source or 'is_current===false' in source
    assert 'staleApproval' in source


def test_the_warning_banner_asks_whether_TODAY_S_wording_is_approved():
    """It asked whether ANY approved row existed for the kind, which stayed true
    after the text changed — so the banner went quiet exactly when it mattered."""
    source = _screen()
    assert 'approved_now' in source, 'the banner still trusts a stored status'
    assert 'has_stale_approval' in source


def test_release_still_refuses_a_message_whose_wording_moved():
    """The safety net that held while the screen was wrong. It must not be
    loosened now that the screen is right."""
    # Read RAW, not code_only: the join lives inside a triple-quoted SQL string,
    # which the comment/docstring stripper removes.
    source = open(os.path.join(BACKEND, 'outbound_mail.py'), encoding='utf-8').read()
    assert 't.fingerprint = m.template_fingerprint' in source
    assert "t.status = 'approved'" in source


def test_no_message_kind_is_shown_as_a_raw_identifier():
    """The screen kept names for three of six kinds. The other three — including
    staff_invitation, the one being read — printed their database value."""
    source = _routes()
    listing = source[source.index('def list_templates'):source.index('def register_templates')]
    assert 'kind_label' in listing, 'the listing does not send the kind its name'

    # The names live in ONE place for both mail screens, as of the queue fix.
    from services import mail_templates
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'config', 'mailKinds.ts')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    registry = open(path, encoding='utf-8').read()
    for kind in mail_templates.TEMPLATES:
        assert kind in registry, f'{kind} has no name in the shared registry'
    assert 'mailKindLabel' in _screen(), 'the wording screen keeps its own copy'


def test_a_stale_kind_is_not_warned_about_twice():
    """One kind with one problem produced two stacked banners saying it."""
    source = _screen()
    assert '.filter(k => !stale.includes(k))' in source
