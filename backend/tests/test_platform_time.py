"""Scheduled times, and the clock they are compared against.

A coach could not start a session that had already begun: it was scheduled for
14:25, stored naive, and compared against `datetime.now()` — UTC in the
container. At 14:22 Gulf the server saw 10:22 and answered "This session opens
at 14:10". Twelve minutes late, told to wait four hours (feedback
fb_1787135002, issue #438).

The line responsible was written five times:

    now = datetime.now(start.tzinfo) if start.tzinfo else datetime.now()

It is CORRECT for timezone-aware values, which is why it survived five reviews.
It fails only for naive columns — and every scheduled time the UI writes is
naive.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import platform_time as pt  # noqa: E402

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


# ── The reported failure, reproduced ────────────────────────────────────────

def test_the_reported_session_is_joinable_when_it_should_be():
    """Session 5: scheduled 14:25 Gulf, coach arrives 14:22 Gulf, window opens
    15 minutes early at 14:10. It must be OPEN."""
    stored = datetime(2026, 8, 19, 14, 25)          # naive, as the column holds it
    start = pt.aware(stored)
    arrival = datetime(2026, 8, 19, 14, 22, tzinfo=pt.PLATFORM_TZ)
    assert arrival >= start - timedelta(minutes=15), \
        'the coach was 12 minutes late and was told to wait four hours'


def test_the_old_comparison_would_have_failed_here():
    """Pins the bug itself, so nobody reintroduces the shortcut."""
    stored = datetime(2026, 8, 19, 14, 25)
    utc_now = datetime(2026, 8, 19, 10, 22)         # what datetime.now() gave
    assert utc_now < stored - timedelta(minutes=15)  # i.e. refused


# ── The rule ────────────────────────────────────────────────────────────────

def test_a_naive_timestamp_is_gulf_wall_clock():
    """What the person scheduling it meant — not UTC, and not the container's
    accidental locale."""
    got = pt.aware(datetime(2026, 8, 19, 14, 25))
    assert got.utcoffset() == timedelta(hours=4)
    assert got.hour == 14 and got.minute == 25, 'must not be shifted, only labelled'


def test_an_aware_timestamp_is_converted_not_relabelled():
    """A column that already carries a zone keeps its meaning. Relabelling 10:22
    UTC as 10:22 Gulf would move the appointment by four hours."""
    utc = datetime(2026, 8, 19, 10, 22, tzinfo=timezone.utc)
    got = pt.aware(utc)
    assert got.hour == 14 and got.minute == 22
    assert got == utc


def test_none_passes_through():
    """A missing time is not a time at midnight."""
    assert pt.aware(None) is None


def test_now_is_aware():
    assert pt.now().tzinfo is not None


def test_the_offset_is_four_hours_with_no_dst():
    """The UAE has observed UTC+04 with no daylight saving since 1972, so a
    fixed offset is exactly correct here rather than an approximation."""
    assert pt.PLATFORM_UTC_OFFSET_HOURS == 4
    for month in (1, 6, 12):
        assert pt.aware(datetime(2026, month, 15, 12, 0)).utcoffset() == timedelta(hours=4)


def test_compare_pair_returns_both_on_the_same_clock():
    """The whole bug was converting one side and not the other."""
    stored, now = pt.compare_pair(datetime(2026, 8, 19, 14, 25))
    assert stored.tzinfo is not None and now.tzinfo is not None
    assert stored.utcoffset() == now.utcoffset()


# ── No site may keep the old shortcut ───────────────────────────────────────

def test_no_naive_now_comparison_survives():
    """All five sites. A sixth would be added otherwise — that is how this got
    written five times in the first place."""
    for path in (('coach_routes.py',), ('routes', 'board_meetings_routes.py')):
        src = _src(*path)
        assert 'if start.tzinfo else datetime.now()' not in src, path
        assert 'if when.tzinfo else datetime.now()' not in src, path


def test_both_ends_of_the_join_window_are_converted():
    """`end` is derived from the naive start, so converting only `start` leaves
    a mixed comparison — which raises TypeError rather than guessing."""
    for path in (('coach_routes.py',), ('routes', 'board_meetings_routes.py')):
        src = _src(*path)
        assert 'end = platform_time.aware(end)' in src, path


def test_the_reschedule_comparison_converts_the_stored_side():
    """`when` became aware; the stored column is still naive. Comparing them
    directly is a 500, not a wrong answer."""
    src = _src('routes', 'board_meetings_routes.py')
    assert "platform_time.aware(meeting['scheduled_at'])" in src


# ── The rapporteur (issue #439) ─────────────────────────────────────────────

def test_the_organiser_is_added_as_an_attendee():
    """The board secretary scheduled meetings they could not then enter: joining
    requires a row in board_meeting_attendees and creation added none."""
    src = _src('routes', 'board_meetings_routes.py')
    body = src.split('def create_meeting')[1].split('\n@board_bp.route')[0]
    assert 'INSERT INTO board_meeting_attendees' in body
    assert 'organiser' in body


def test_the_organiser_is_an_observer_not_an_attendee():
    """The secretary is the RAPPORTEUR (owner, 2026-08-20): present to record
    the meeting, not counted in it. Quorum counts invite_status='attended'
    only, so admitting them as 'attended' would inflate the number that decides
    whether the board could lawfully sit.
    """
    src = _src('routes', 'board_meetings_routes.py')
    body = src.split('def create_meeting')[1].split('\n@board_bp.route')[0]
    insert = body.split('INSERT INTO board_meeting_attendees')[-1][:300]
    assert "'observer'" in insert
    assert "'attended'" not in insert


def test_quorum_still_counts_attended_only():
    """The guarantee the observer status rests on."""
    src = _src('routes', 'board_meetings_routes.py')
    assert "a.invite_status = 'attended') AS attended" in src


def test_an_existing_invitation_is_not_downgraded():
    """A secretary who is also a board member keeps their real invitation —
    ON CONFLICT DO NOTHING, not DO UPDATE."""
    src = _src('routes', 'board_meetings_routes.py')
    body = src.split('def create_meeting')[1].split('\n@board_bp.route')[0]
    insert = body.split('INSERT INTO board_meeting_attendees')[-1][:300]
    assert 'DO NOTHING' in insert
