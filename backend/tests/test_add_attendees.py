"""Inviting additional people to a meeting that already exists.

"I can't invite additional attendees and i need waiting room to admit them at
their discussion point" (fb_1787129152).

`attendee_ids` was honoured only at creation, and update_meeting had no attendee
handling at all — so a subject expert needed for one agenda item could not be
added without recreating the meeting.

THE WAITING ROOM IS NOT BUILT. It is a different feature: admitting people
individually into a live LiveKit room at the moment their item comes up. Scoped,
not attempted here — see the PR.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src():
    with open(os.path.join(BACKEND, 'routes', 'board_meetings_routes.py'),
              encoding='utf-8') as fh:
        return fh.read()


def _fn():
    """The handler's EXECUTABLE code: docstring and # comments both removed.

    Asserting against raw source has matched prose four times in this codebase —
    a docstring saying "invite_status flips to 'attended'", a comment saying
    "never DO UPDATE". Stripping only the docstring was half a fix, because the
    comments explaining a decision name the thing the decision rejects.
    """
    fn = _src().split('def add_attendees')[1].split('\n@board_meetings_bp.route')[0]
    parts = fn.split('"""')
    fn = parts[0] + '"""'.join(parts[2:]) if len(parts) >= 3 else fn
    return '\n'.join(ln for ln in fn.splitlines()
                     if not ln.lstrip().startswith('#'))


# ── Quorum is the thing that must not move by accident ──────────────────────

def test_a_guest_does_not_count_toward_quorum_by_default():
    """Someone brought in to speak to one item is a guest, not a member. Adding
    them as counted would change the number deciding whether the board could
    lawfully sit."""
    fn = _fn()
    assert "counts = bool(data.get('counts_toward_quorum'))" in fn
    assert "status = 'invited' if counts else 'observer'" in fn


def test_counting_someone_is_an_explicit_request():
    fn = _fn()
    # Defaults to False via bool(None); nothing infers it from the role.
    assert 'counts_toward_quorum' in fn
    assert 'resolve_roles' not in fn, 'must not infer quorum eligibility from a role'


def test_re_adding_an_existing_member_does_not_demote_them():
    """ON CONFLICT DO NOTHING, never DO UPDATE — a counted attendee must not be
    silently turned into an observer by a careless re-invite."""
    fn = _fn()
    assert 'DO NOTHING' in fn
    assert 'DO UPDATE' not in fn


# ── It reports what actually happened ───────────────────────────────────────

def test_already_invited_ids_are_not_reported_as_added():
    """Saying they were added would overstate the change."""
    fn = _fn()
    assert "'already_invited'" in fn
    assert "'added': added" in fn


def test_only_genuinely_added_people_are_notified():
    """Re-notifying someone already on the list is spam about nothing."""
    fn = _fn()
    assert 'if added:' in fn
    assert fn.index('if added:') < fn.index('_notify_invitees')


# ── The same guards as everywhere else ──────────────────────────────────────

def test_a_closed_meeting_is_refused():
    fn = _fn()
    assert "('completed', 'cancelled')" in fn
    assert '409' in fn


def test_it_is_organiser_only():
    src = _src()
    decorated = src.split("'/<meeting_id>/attendees', methods=['POST']")[1][:160]
    assert 'ORGANISER_ROLES' in decorated


def test_an_empty_list_is_a_400_not_a_silent_success():
    fn = _fn()
    assert "'user_ids is required'" in fn


def test_one_bad_id_does_not_lose_the_rest():
    """A per-row failure costs that person, not the whole invitation."""
    fn = _fn()
    loop = fn.split('for uid in user_ids:')[1][:700]
    assert 'try:' in loop and 'except Exception' in loop
