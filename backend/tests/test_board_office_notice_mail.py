"""Board office notices move onto the shared outbound queue.

WHY THIS FILE EXISTS

This flow had a queue of its own, board_office_notifications, written because
outbound SMTP was blocked at the firewall and nothing could be delivered. That
premise stopped being true when the platform started sending through Microsoft
Graph over HTTPS, which never needed the SMTP port.

A second queue with its own rules is a blind spot in the one view the owner uses
to check what left the platform — and it WAS one. Migration 086 found 46 rows
sitting in it, 42 of them announcing test meetings that had already been
deleted, none of it visible in any audit.
"""
import os
import sys
from datetime import datetime

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from brand import COUNCIL_NAME_EN, COUNCIL_NAME_AR  # noqa: E402
from routes.board_meetings_routes import _board_notice_parts  # noqa: E402

MEETING = {
    'id': 'abc-123',
    'title': 'Q3 Board Meeting',
    'scheduled_at': datetime(2026, 9, 15, 10, 30),
    'duration_minutes': 90,
    'location': 'EHRDC Headquarters',
    'agenda': 'Review of Q3 performance',
}


def test_cancelled_does_not_read_like_scheduled():
    """These are three different messages to an office diary. "has been
    updated" for a cancellation would have somebody keep the slot."""
    _s, scheduled, _h = _board_notice_parts(MEETING, 'scheduled')
    _s, cancelled, _h = _board_notice_parts(MEETING, 'cancelled')
    _s, rescheduled, _h = _board_notice_parts(MEETING, 'rescheduled')

    assert 'has been scheduled' in scheduled
    assert 'has been cancelled' in cancelled
    assert 'has been rescheduled' in rescheduled
    assert 'has been cancelled' not in scheduled
    # And in Arabic, where a wrong verb is just as costly.
    assert 'تم إلغاء' in cancelled
    assert 'تم إلغاء' not in scheduled


def test_the_kind_is_in_the_subject_line():
    """An office diary is scanned, not read. A cancellation that only reveals
    itself in the body gets missed."""
    subject, _t, _h = _board_notice_parts(MEETING, 'cancelled')
    assert 'has been cancelled' in subject
    assert MEETING['title'] in subject


def test_the_details_an_office_needs_are_all_present():
    _s, text, _h = _board_notice_parts(MEETING, 'scheduled')
    assert '15 September 2026 at 10:30' in text
    assert '90 minutes' in text
    assert 'EHRDC Headquarters' in text
    assert '90 دقيقة' in text


def test_a_meeting_with_no_date_says_so_rather_than_guessing():
    meeting = dict(MEETING, scheduled_at=None)
    _s, text, _h = _board_notice_parts(meeting, 'scheduled')
    assert 'a date to be confirmed' in text
    assert 'موعد يُحدَّد لاحقاً' in text
    assert 'None' not in text


def test_an_empty_agenda_is_omitted_not_left_blank():
    """A heading with nothing under it reads as a message that failed to
    render."""
    for empty in (None, '', '   '):
        _s, text, _h = _board_notice_parts(dict(MEETING, agenda=empty), 'scheduled')
        assert 'None' not in text
        assert '\n\n\n\n' not in text


def test_the_title_and_agenda_cannot_inject_markup():
    meeting = dict(MEETING, title='<script>a</script>', agenda='<b>x</b>')
    _s, _t, html = _board_notice_parts(meeting, 'scheduled')
    assert '<script>' not in html
    assert '<b>x</b>' not in html
    assert '&lt;script&gt;' in html


def test_english_leads_and_both_halves_are_present():
    _s, text, html = _board_notice_parts(MEETING, 'scheduled')
    assert text.index('Dear Office') < text.index('إلى مكتب')
    assert html.index('dir="ltr"') < html.index('dir="rtl"')
    assert COUNCIL_NAME_EN in text and COUNCIL_NAME_AR in text


# ── The migration ───────────────────────────────────────────────────────────

def test_notices_are_queued_to_outbound_mail_not_the_old_table():
    source = open(os.path.join(BACKEND, 'routes', 'board_meetings_routes.py'),
                  encoding='utf-8').read()
    block = source[source.index('def _queue_office_notifications('):]
    block = block[:block.index('@board_meetings_bp.route')]
    assert 'outbound_mail.queue(' in block
    assert 'INSERT INTO board_office_notifications' not in block


def test_nothing_writes_to_the_retired_table_any_more():
    source = open(os.path.join(BACKEND, 'routes', 'board_meetings_routes.py'),
                  encoding='utf-8').read()
    assert 'INSERT INTO board_office_notifications' not in source


def test_the_queue_view_reads_the_shared_queue():
    """Otherwise board mail is invisible in the audit and the old rows look
    like a live backlog."""
    source = open(os.path.join(BACKEND, 'routes', 'board_meetings_routes.py'),
                  encoding='utf-8').read()
    assert "n.kind = 'board_office_notice'" in source
    assert 'FROM outbound_mail n' in source


def test_a_notice_is_linked_back_to_its_meeting():
    source = open(os.path.join(BACKEND, 'routes', 'board_meetings_routes.py'),
                  encoding='utf-8').read()
    assert "related_type='board_meeting'" in source


def test_an_office_with_no_address_is_skipped_not_queued():
    """board_member_offices.email is nullable. A message addressed to nobody
    would sit unsendable in the reviewer's queue for ever."""
    source = open(os.path.join(BACKEND, 'routes', 'board_meetings_routes.py'),
                  encoding='utf-8').read()
    assert "if not (r.get('email') or '').strip():" in source


def test_the_probe_date_is_fixed_so_approvals_do_not_expire_overnight():
    """A probe built from now() would move the fingerprint every day and
    silently retire the owner's approval."""
    source = open(os.path.join(BACKEND, 'services', 'mail_templates.py'),
                  encoding='utf-8').read()
    block = source[source.index('def _board_office_notice('):]
    block = block[:block.index('#: kind -> (human label, renderer)')]
    assert 'datetime(2026, 1, 1' in block
    # Match CALLS, not prose. The comment above the probe explains why now() is
    # not used, and a bare substring search finds that explanation instead.
    for call in ('datetime.now(', '.utcnow(', 'date.today('):
        assert call not in block, f'{call} would move the fingerprint daily'


def test_all_three_kinds_are_sampled_for_approval():
    from services.mail_templates import render, TEMPLATES
    assert 'board_office_notice' in TEMPLATES
    _subject, text, _html = render('board_office_notice')
    for kind in ('scheduled', 'rescheduled', 'cancelled'):
        assert f'[ if the meeting is {kind} ]' in text
