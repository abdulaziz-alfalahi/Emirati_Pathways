"""The board waiting room (GH #466, feedback fb_1787129152).

A guest brought in for one agenda item should not be in the room for the items
before theirs. The board secretary asked for this directly: "i need waiting
room to admit them at their discussion point".

These tests pin the two things that are easy to get wrong:

  * the hold must happen BEFORE a token is minted — the token IS the admission,
    so anything that issues one and hides the video has already put the guest
    in the room;
  * admission must not touch quorum. `invite_status` already carries both
    invitation and presence, and the quorum count reads it. Putting admission
    on that same axis would let letting-someone-in change the number that
    decides whether the board could lawfully sit.
"""
import os

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def _body(src, func):
    """A single endpoint's body, up to the next route decorator."""
    return src.split(f'def {func}')[1].split('\n@board_meetings_bp.route')[0]


def _strip_prose(text):
    """Remove prose, KEEP the SQL.

    Docstrings and comments describe the rule; they must not satisfy it — a
    comment saying "no token is minted" would otherwise pass a test asserting
    that no token is minted.

    The obvious version of this — drop every triple-quoted block — is wrong
    here, because the queries are triple-quoted strings too, so it deleted the
    very SQL these tests exist to check. Only the LEADING docstring goes, plus
    Python `#` and SQL `--` comment lines.
    """
    stripped = text.lstrip()
    for q in ('"""', "'''"):
        if stripped.startswith(q):
            close = stripped.find(q, 3)
            text = stripped[close + 3:] if close != -1 else ''
            break

    out = []
    for line in text.split('\n'):
        for marker in ('#', '--'):
            idx = line.find(marker)
            if idx != -1:
                line = line[:idx]
        out.append(line)
    return '\n'.join(out)


ROUTES = ('routes', 'board_meetings_routes.py')


# ── The hold ────────────────────────────────────────────────────────────────

def test_a_held_guest_is_refused_before_a_token_is_minted():
    """Order matters more than the refusal itself."""
    code = _strip_prose(_body(_src(*ROUTES), 'join_meeting'))
    hold = code.index('awaiting_admission')
    token = code.index('generate_livekit_token')
    assert hold < token, 'the guest is held only AFTER a token is issued'


def test_the_hold_checks_both_flag_and_admission():
    code = _strip_prose(_body(_src(*ROUTES), 'join_meeting'))
    assert "requires_admission" in code
    assert "admitted_at" in code, 'an admitted guest must not be held again'


def test_organisers_are_never_held():
    """They are the ones who admit; holding them deadlocks the meeting."""
    code = _strip_prose(_body(_src(*ROUTES), 'join_meeting'))
    assert 'is_organiser' in code and 'ORGANISER_ROLES' in code


def test_the_knock_is_recorded():
    """The organiser's list shows who is actually at the door, which requires
    knowing that they turned up — not merely that they are a guest."""
    code = _strip_prose(_body(_src(*ROUTES), 'join_meeting'))
    assert 'waiting_since' in code
    assert 'COALESCE(waiting_since, NOW())' in code, 'a re-knock must not reset the wait'


def test_the_organiser_is_told():
    code = _strip_prose(_body(_src(*ROUTES), 'join_meeting'))
    assert '_notify_organisers_of_waiting' in code, \
        'without this the waiting room is a trap: nobody knows to let them in'


# ── Admission ───────────────────────────────────────────────────────────────

def test_admission_is_granted_once_not_per_attempt():
    """A guest whose connection drops must not be returned to the door midway
    through the item they were invited to speak to."""
    code = _strip_prose(_body(_src(*ROUTES), 'admit_attendees'))
    assert 'admitted_at = NOW()' in code
    assert 'admitted_at IS NULL' in code, 'a replayed admit must not rewrite the record'


def test_who_admitted_them_is_recorded():
    code = _strip_prose(_body(_src(*ROUTES), 'admit_attendees'))
    assert 'admitted_by' in code


def test_admit_is_organiser_only():
    src = _src(*ROUTES)
    head = src.split("def admit_attendees")[0].split("@board_meetings_bp.route('/<meeting_id>/admit'")[-1]
    assert 'ORGANISER_ROLES' in head


def test_waiting_list_is_organiser_only():
    src = _src(*ROUTES)
    head = src.split("def list_waiting")[0].split("@board_meetings_bp.route('/<meeting_id>/waiting'")[-1]
    assert 'ORGANISER_ROLES' in head


def test_the_waiting_list_shows_only_people_who_turned_up():
    """A guest marked for admission who has not arrived is not waiting;
    listing them has the organiser admitting an empty chair."""
    code = _strip_prose(_body(_src(*ROUTES), 'list_waiting'))
    assert 'waiting_since IS NOT NULL' in code


def test_admitting_reports_what_actually_happened():
    code = _strip_prose(_body(_src(*ROUTES), 'admit_attendees'))
    assert 'not_waiting' in code


# ── Quorum is not on this axis ──────────────────────────────────────────────

def test_quorum_still_counts_attended_only():
    """The guarantee the whole design rests on: admission lives in its own
    columns, so nothing here can move the number that decides whether the
    board could lawfully sit."""
    src = _src(*ROUTES)
    assert "a.invite_status = 'attended') AS attended" in src


def test_admission_never_writes_invite_status():
    for func in ('admit_attendees', 'list_waiting'):
        code = _strip_prose(_body(_src(*ROUTES), func))
        assert 'invite_status =' not in code, f'{func} moves a quorum input'


def test_guests_wait_by_default_and_members_do_not():
    code = _strip_prose(_body(_src(*ROUTES), 'add_attendees'))
    assert 'requires_admission = not counts' in code


# ── The migration ───────────────────────────────────────────────────────────

def test_the_migration_holds_nobody_retroactively():
    """DEFAULT FALSE is load-bearing: a migration that made the whole board
    queue for admission would be worse than the gap it closes."""
    sql = _src('migrations', '075_board_meeting_waiting_room.sql')
    assert 'requires_admission BOOLEAN NOT NULL DEFAULT FALSE' in sql
    assert 'IF held <> 0 THEN' in sql, 'the migration does not assert its own claim'


def test_the_migration_is_idempotent():
    sql = _src('migrations', '075_board_meeting_waiting_room.sql')
    assert sql.count('ADD COLUMN IF NOT EXISTS') == 4
    assert 'CREATE INDEX IF NOT EXISTS' in sql
    assert 'BEGIN;' in sql and 'COMMIT;' in sql
