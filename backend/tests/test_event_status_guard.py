"""A finished recruitment day stops accepting changes — except its outcomes.

WHY THIS FILE EXISTS

The candidate-facing event endpoints checked the event's status from the start.
The ORGANISER-facing ones did not, on the unstated assumption that staff can be
trusted with the state, so a day marked completed still accepted employers being
added and removed, candidates being invited, and people being checked in. The
owner found it by doing exactly that (fb_1787471185, 2026-08-23):

    "After marking the open day completed, I still can add and remove companies."

Trust was never the issue. The funnel on the manage page — invited, confirmed,
attended, placed — is computed from these tables, so a change after the day
closes rewrites a record the board reads with nothing to distinguish a
correction from a slip. add_employer also notifies the company it is on the
bill, which for a finished event is a message about a day that already happened.

THE EXCEPTION IS THE POINT. record_outcome stays open on 'completed' because an
outcome is learned AFTER the day: an employer confirms a placement days or weeks
later, and that is the most valuable thing this feature records. Locking it
would push the CRM team to reopen finished events to enter real results — worse
than the bug the guard exists to fix (owner decision, 2026-08-23). These tests
pin the exception as deliberately as they pin the rule, so nobody "tidies" it
into consistency later.
"""
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES = os.path.join(BACKEND, 'routes', 'recruitment_events_routes.py')
FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')


def _src():
    with open(ROUTES, encoding='utf-8') as fh:
        return fh.read()


def _bodies():
    """{function name: source of that function}, for the whole module."""
    src = _src().split('\n')
    starts = [(i, m.group(1)) for i, l in enumerate(src)
              if (m := re.match(r'def (\w+)\(', l))]
    starts.append((len(src), '__end__'))
    return {name: '\n'.join(src[a:starts[k + 1][0]])
            for k, (a, name) in enumerate(starts[:-1])}


# Every organiser endpoint that writes something the funnel is computed from.
GUARDED = [
    'add_employer',
    'remove_employer',
    'staff_check_in',
    'invite_candidates',
    'update_invitation',
]


def test_every_organiser_write_checks_the_event_status():
    bodies = _bodies()
    missing = [n for n in GUARDED if '_require_mutable' not in bodies.get(n, '')]
    assert not missing, (
        'These endpoints write to a recruitment event without checking whether '
        f'it still accepts changes: {missing}. A completed or cancelled event '
        'would take the write and silently rewrite the funnel.'
    )


def test_record_outcome_stays_open_on_a_completed_event():
    """The exception, pinned. Do not "fix" this into consistency."""
    body = _bodies().get('record_outcome', '')
    assert '_require_mutable' in body, 'record_outcome lost its guard entirely.'
    assert 'OUTCOME_MUTABLE_STATUSES' in body, (
        "record_outcome must use OUTCOME_MUTABLE_STATUSES, not the default. An "
        "employer confirms a placement days after the day; locking it on "
        "'completed' would make the CRM team reopen finished events to record "
        "real results (owner decision, 2026-08-23)."
    )


def test_the_two_status_sets_differ_only_by_completed():
    src = _src()
    assert "MUTABLE_STATUSES = frozenset({'draft', 'published'})" in src
    assert ("OUTCOME_MUTABLE_STATUSES = frozenset({'draft', 'published', 'completed'})"
            in src), (
        'The outcome set must be the base set plus completed — and NOT include '
        'cancelled: a cancelled event did not happen, so it has no outcome.'
    )


def test_cancelled_accepts_nothing_at_all():
    src = _src()
    assert 'cancelled' not in src.split('OUTCOME_MUTABLE_STATUSES = ')[1].split('\n')[0], (
        'cancelled must not appear in OUTCOME_MUTABLE_STATUSES.'
    )


def test_the_guard_refuses_with_409_not_403():
    """The caller is permitted; the event's state is what refuses.

    403 would read as "you lack the role", sending an organiser to ask for
    permissions they already have.
    """
    src = _src()
    guard = src.split('def _require_mutable')[1].split('\ndef ')[0]
    assert '409' in guard, 'The status guard should answer 409, not 403 or 400.'
    assert '404' in guard, 'A missing event should still 404.'


def test_the_ui_does_not_offer_a_control_the_api_will_refuse():
    """The owner's complaint was being ABLE to click, not getting an error."""
    with open(os.path.join(FRONTEND, 'pages', 'events', 'EventManagePage.tsx'),
              encoding='utf-8') as fh:
        page = fh.read()
    assert 'eventIsEditable' in page, (
        'EventManagePage does not gate its employer controls on the event '
        'status, so a completed event still invites a click that the API will '
        'refuse.'
    )
    assert "['draft', 'published']" in page, (
        'The page must mirror MUTABLE_STATUSES; if the backend set changes this '
        'is the other half to change.'
    )


# ── The public page ─────────────────────────────────────────────────────────

def _calendar_page():
    with open(os.path.join(FRONTEND, 'pages', 'events', 'EventsCalendarPage.tsx'),
              encoding='utf-8') as fh:
        return fh.read()


def test_the_public_page_says_when_an_event_is_over():
    """It had no finished state at all, and read as broken.

    The page silently dropped the register-interest card and said nothing else,
    so a reader could not tell whether the day was over or the page had failed.
    The owner read it as failed, which is the correct inference from what was
    shown (fb_1787480900, 2026-08-23).
    """
    page = _calendar_page()
    assert 'isOver' in page, 'The detail page has no notion of a finished event.'
    assert 'This open day has finished' in page, (
        'The page never states that the event is over. Dropping controls '
        'without saying why is what produced the bug report.'
    )


def test_completed_is_recognised_even_when_the_date_has_not_passed():
    """The event that prompted this was marked completed while dated in future.

    Keying "is it over" on the date alone would have missed it, which is exactly
    the case the reporter hit.
    """
    page = _calendar_page()
    assert "ev.status === 'completed'" in page, (
        'isOver must consider the completed STATUS, not only whether the date '
        'has passed.'
    )


def test_the_day_of_qr_instruction_is_not_shown_on_a_finished_event():
    """It excluded only 'cancelled', so a completed day still said "on the day"."""
    page = _calendar_page()
    assert "ev.status !== 'cancelled' && !isOver" in page, (
        'The "scan the QR code at the venue on the day" line is still shown for '
        'a finished event, telling the reader to attend something that has '
        'already happened.'
    )


def test_a_future_event_is_not_described_as_finished():
    """"Finished" is a claim about TIME, not about record state.

    The first version derived it from status: an event marked completed before
    its date rendered "This open day has finished" directly above a date four
    days away — a contradiction the reader can see (fb_1787483507, 2026-08-23,
    a regression from the fix for fb_1787480900).

    Gating on isOver stays right — a closed record should not accept a
    registration either way. Only the wording has to know the difference.
    """
    page = _calendar_page()
    assert 'closedEarly' in page, (
        'The page cannot tell "closed before its date" from "already happened", '
        'so it will describe a future event as finished.'
    )
    assert 'Registration for this open day is closed' in page, (
        'A future event marked completed must say registration is closed, not '
        'that the day has finished.'
    )


def test_the_took_part_line_is_not_said_about_a_future_event():
    """Past tense about a day that has not happened."""
    page = _calendar_page()
    took_part = page.index('The employers below took part')
    window = page[max(0, took_part - 400):took_part]
    assert 'closedEarly' in window, (
        '"The employers below took part" is not conditioned on the day having '
        'actually passed.'
    )


# ── Map stacking ────────────────────────────────────────────────────────────

def test_the_leaflet_map_is_its_own_stacking_context():
    """Otherwise the map paints over the site chrome.

    Leaflet gives its panes z-index 400 and its controls 800-1000. The container
    is position:relative with z-index:auto, so it forms no stacking context and
    those numbers compete in the root one against a sticky header at z-50 — the
    map won, and a nav dropdown opened over an event's venue map was drawn
    underneath it (owner screenshot, 2026-08-23).

    Asserted here rather than left to a comment because the rule looks like dead
    CSS to anyone tidying the file: nothing on the page obviously depends on it
    until a dropdown happens to overlap a map.
    """
    css_path = os.path.join(FRONTEND, 'index.css')
    with open(css_path, encoding='utf-8') as fh:
        css = fh.read()
    block = css.split('.leaflet-container')
    assert len(block) > 1, 'No .leaflet-container rule in index.css.'
    rule = block[-1].split('}')[0]
    assert 'isolation' in rule and 'isolate' in rule, (
        '.leaflet-container must isolate its stacking context, or Leaflet\'s '
        'z-index 400 panes will paint over the header and any dropdown, modal '
        'or toast that overlaps the map.'
    )
