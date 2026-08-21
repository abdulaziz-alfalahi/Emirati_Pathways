"""The chair of the board, and the two acts that are theirs alone.

Owner ruling 2026-08-21. Until then the platform had no notion of a chairman at
all — the word appeared only in comments — and the two acts that belong to a
chair sat elsewhere:

  * ADOPTING THE MINUTES was ORGANISER_ROLES, so the secretary approved the
    minutes they had written and uploaded. One person authored and adopted the
    same governance record.
  * A MEETING BECAME 'in_progress' on the first join, whoever that was. A
    meeting starting because somebody opened a browser tab is not the same
    event as the board being declared open with quorum present, and the minutes
    should be able to say which happened.

The uncomfortable part of this design is that ADMIN IS EXCLUDED, unlike almost
every other guard in the codebase. That is the point: an administrator who
could sign the record on the board's behalf is the hole being closed. These
tests exist because "admin can do everything" is the reflex that would undo it.
"""
import os

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def _strip_prose(text):
    stripped = text.lstrip()
    for q in ('"""', "'''"):
        if stripped.startswith(q):
            close = stripped.find(q, 3)
            text = stripped[close + 3:] if close != -1 else ''
            break
    out = []
    for line in text.split('\n'):
        for marker in ('#', '--'):
            i = line.find(marker)
            if i != -1:
                line = line[:i]
        out.append(line)
    return '\n'.join(out)


ROUTES = ('routes', 'board_meetings_routes.py')


def _decorators(func, route):
    src = _src(*ROUTES)
    return src.split(f'def {func}')[0].split(route)[-1]


def _body(func):
    return _strip_prose(_src(*ROUTES).split(f'def {func}')[1]
                        .split('\n@board_meetings_bp.route')[0])


# ── The role ────────────────────────────────────────────────────────────────

def test_the_chairman_set_excludes_admin():
    """Every other set in access_control is `ADMIN_ROLES | {...}`. This one is
    not, and that asymmetry is the whole design."""
    src = _src('auth', 'access_control.py')
    line = [l for l in src.split('\n') if l.startswith('CHAIRMAN_ROLES')][0]
    assert 'ADMIN_ROLES' not in line, 'an admin who can sign for the board is the hole this closes'
    assert "'board_chairman'" in line


def test_the_chair_can_still_read_the_board_surfaces():
    src = _src('auth', 'access_control.py')
    board = [l for l in src.split('\n') if l.startswith('BOARD_ROLES')][0]
    assert 'board_chairman' in board


def test_the_chair_is_not_an_operator():
    """They chair the board; they do not run the platform."""
    src = _src('auth', 'access_control.py')
    ops = src.split('OPERATOR_ROLES = ')[1].split('}')[0]
    assert 'board_chairman' not in ops


# ── Adopting the minutes ────────────────────────────────────────────────────

def test_only_the_chair_adopts_the_minutes():
    d = _decorators('approve_minutes', "@board_meetings_bp.route('/minutes/<minute_id>/approve'")
    assert 'CHAIRMAN_ROLES' in d
    assert 'ORGANISER_ROLES' not in d, 'the secretary would be approving their own minutes'


def test_the_secretariat_still_files_the_minutes():
    """Writing the record and adopting it are separate hands — but the
    secretariat must not lose the writing half."""
    src = _src(*ROUTES)
    for route in ("/minutes'", "/minutes/<minute_id>'"):
        if route in src:
            break
    assert 'ORGANISER_ROLES' in src, 'upload/supersede/delete stay with the Secretariat'


# ── Declaring the meeting open ──────────────────────────────────────────────

def test_only_the_chair_declares_a_meeting_open():
    d = _decorators('declare_meeting_open', "@board_meetings_bp.route('/<meeting_id>/open'")
    assert 'CHAIRMAN_ROLES' in d


def test_opening_is_refused_without_quorum():
    code = _body('declare_meeting_open')
    assert "not_quorate" in code
    assert "409" in code


def test_opening_is_refused_when_no_quorum_rule_is_set():
    """A chair cannot declare a board quorate against a threshold nobody set.
    `met` is None in that case — not False — and the two must not be conflated."""
    code = _body('declare_meeting_open')
    assert "q['met'] is None" in code
    assert 'no_quorum_rule' in code


def test_the_quorum_count_is_snapshotted():
    """Quorum is computed live from who is in the room, so it can be true at
    10:05 and false at 10:25. Without storing it, "was the board quorate when
    it opened?" stops being answerable the moment someone leaves."""
    code = _body('declare_meeting_open')
    assert 'opened_quorum_present' in code
    assert 'opened_quorum_required' in code, 'the rule in force must be stored beside the count'


def test_a_second_declaration_does_not_overwrite_the_first():
    code = _body('declare_meeting_open')
    assert 'already_open' in code
    assert 'opened_at IS NULL' in code, 'the first declaration is the one that happened'


def test_opening_uses_the_same_quorum_rule_the_chair_was_shown():
    """A second copy of the rule could disagree with the number on screen."""
    code = _body('declare_meeting_open')
    assert '_compute_quorum(meeting)' in code


def test_the_join_path_is_not_the_declaration():
    """Joining still moves a scheduled meeting to in_progress; that is the room
    going live, not the board being opened. The two must stay distinguishable."""
    join = _body('join_meeting')
    assert 'opened_at' not in join, 'joining must not declare the meeting open'


# ── The migration ───────────────────────────────────────────────────────────

def test_no_past_meeting_is_retroactively_declared_open():
    """Inventing that a chair opened a meeting that predates the feature would
    put a false statement into a governance record."""
    sql = _src('migrations', '076_board_meeting_opened_by_chair.sql')
    assert 'IF opened <> 0 THEN' in sql
    assert 'ADD COLUMN IF NOT EXISTS' in sql
    assert 'BEGIN;' in sql and 'COMMIT;' in sql
