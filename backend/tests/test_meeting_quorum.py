"""Live quorum — "can the chairman begin?"

Requested as "Pop-up to show quorum met for the chairman to begin the meeting"
(fb_1787129509). Quorum was previously computed only when a meeting ENDED, which
is the one moment the chair does not need it.

The distinctions below are the whole feature. A quorum indicator that is
confidently wrong is worse than none: it either holds up a meeting that could
lawfully sit, or opens one that could not.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOM = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'pages', 'board',
                    'BoardMeetingRoom.tsx')


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def _fn():
    """The handler's CODE, with its docstring removed.

    Asserting against the whole function repeatedly caught the prose explaining
    why something is NOT done — "invite_status flips to 'attended'" tripped a
    test asserting 'attended' is never counted. A test that fails on its own
    explanation teaches people to delete the explanation.
    """
    # The RULE lives in _compute_quorum, not in the handler.
    #
    # It was extracted so the chair's declaration of a meeting open computes
    # quorum with exactly this code rather than a second copy — the number
    # written into the governance record has to be the number the chair was
    # shown. These assertions follow the rule to where it lives; not one of
    # them changed, because the logic moved verbatim.
    src = _src('routes', 'board_meetings_routes.py')
    fn = src.split('def _compute_quorum')[1].split('\n@board_meetings_bp.route')[0]
    parts = fn.split('"""')
    return parts[0] + '"""'.join(parts[2:]) if len(parts) >= 3 else fn


def _response():
    """Just the payload — what the endpoint actually discloses.

    _compute_quorum returns a plain dict which the handler jsonifies verbatim,
    so this is still exactly what goes over the wire; only the shape of the
    literal changed when the rule was extracted.
    """
    return _fn().split('return {')[1]


def _room():
    with open(ROOM, encoding='utf-8') as fh:
        return fh.read()


# ── Present means present NOW ───────────────────────────────────────────────

def test_presence_comes_from_the_live_room_not_the_register():
    """invite_status flips to 'attended' on first join and never reverts, so
    counting it would keep a member in the tally after they left — and the chair
    would open a meeting that had quietly lost quorum."""
    fn = _fn()
    assert 'ListParticipants' in fn, 'must read live state'
    assert "'attended'" not in fn, 'must not count the register'


def test_observers_do_not_count():
    """The secretary attends as rapporteur to record the meeting, not to be
    counted in it — the same rule end_meeting applies."""
    fn = _fn()
    assert "<> 'observer'" in fn


def test_someone_in_the_room_who_was_never_invited_does_not_count():
    """Presence is intersected with the attendee list, so a guest in the room
    cannot make a meeting quorate."""
    fn = _fn()
    assert 'present_ids & counting' in fn


# ── Unknown is not "no" ─────────────────────────────────────────────────────

def test_no_configured_quorum_returns_None_not_False():
    """"We do not know" and "not enough people" are different answers. A chair
    told False would wait for a threshold nobody set."""
    fn = _fn()
    assert "'met': (present >= required) if required else None" in fn


def test_the_badge_says_so_rather_than_claiming_not_met():
    room = _room()
    assert 'no quorum configured' in room
    assert 'quorum.required == null' in room


def test_a_failed_read_does_not_read_as_not_quorate():
    """A network failure must not hold up a meeting that is perfectly quorate."""
    room = _room()
    block = room.split('const read = async')[1][:600]
    assert 'setQuorum(null)' in block


def test_an_empty_room_is_not_an_error():
    """LiveKit does not create a room until someone joins; that is zero present,
    not a failure to show the chair."""
    fn = _fn()
    assert 'live = []' in fn


# ── What it discloses ───────────────────────────────────────────────────────

def test_it_returns_counts_only():
    """Quorum is a fact about the meeting, not about individuals. This is why
    every board member may read it while /participants stays organiser-only."""
    # The RESPONSE, not the handler: reading p.get('identity') to intersect the
    # live room with the attendee list is exactly how the count is produced.
    body = _response()
    for leaked in ("'name'", "'identity'", 'mic_muted', 'sharing_screen'):
        assert leaked not in body, f'must not disclose {leaked}'


def test_any_board_member_may_read_it():
    src = _src('routes', 'board_meetings_routes.py')
    decorated = src.split("'/<meeting_id>/quorum'")[1][:200]
    assert 'BOARD_ROLES' in decorated


def test_participants_stays_organiser_only():
    """Widening quorum access must not have widened that too."""
    src = _src('routes', 'board_meetings_routes.py')
    decorated = src.split("'/<meeting_id>/participants', methods=['GET']")[1][:200]
    assert 'ORGANISER_ROLES' in decorated


# ── The announcement ────────────────────────────────────────────────────────

def test_quorum_is_announced_once_not_on_every_poll():
    """Re-announcing every 10 seconds would nag through the meeting."""
    room = _room()
    assert 'quorumAnnounced' in room
    block = room.split('if (quorum?.met && !quorumAnnounced)')[1][:300]
    assert 'setQuorumAnnounced(true)' in block
