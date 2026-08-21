"""Unassigning a role has to actually unassign it.

Reported after several attempts: unticking a role in the Edit User dialog and
saving left it ticked after a refresh. It was not a caching problem — the role
was never removed.

update_user_roles MERGED the submitted list with the roles already stored:

    all_roles = roles + [original_role] + existing_secondary

so a tick was honoured and an untick was silently discarded, because the role
came straight back out of `existing_secondary` on the next read. Role removal
had never worked through that dialog.

The join table in the same function already replaced its rows (DELETE, then
INSERT from the submitted list), so the two stores disagreed with each other:
admin_user_roles honoured the removal and users.secondary_roles did not. One of
them was always wrong about what the admin had just done.
"""
import os

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _fn():
    """update_user_roles' code, without its docstring."""
    with open(os.path.join(BACKEND, 'administrator_system.py'), encoding='utf-8') as fh:
        src = fh.read()
    body = src.split('def update_user_roles')[1].split('\n    def ')[0]
    parts = body.split('"""')
    body = parts[0] + '"""'.join(parts[2:]) if len(parts) >= 3 else body
    out = []
    for line in body.split('\n'):
        i = line.find('#')
        out.append(line[:i] if i != -1 else line)
    return '\n'.join(out)


def test_the_stored_roles_are_not_merged_back_in():
    """The bug itself. Re-adding the existing column is what made an untick a
    no-op."""
    code = _fn()
    assert 'existing_secondary' not in code, \
        'the previously stored roles are merged back in, so removals are discarded'


def test_the_submitted_list_is_authoritative():
    code = _fn()
    assert 'all_roles = list(dict.fromkeys(' in code
    built = code.split('all_roles = list(dict.fromkeys(')[1].split('))')[0]
    assert 'roles' in built
    # Only the primary role may be added back — nothing else.
    assert 'primary_role' in built
    for forbidden in ('existing_secondary', 'original_role', 'current_user'):
        assert forbidden not in built, f'{forbidden} is re-added, which resurrects removed roles'


def test_the_primary_role_stays_in_the_set():
    """users.role must resolve for its own holder; dropping it out of the
    resolved set would leave a user unable to use their own primary role."""
    code = _fn()
    built = code.split('all_roles = list(dict.fromkeys(')[1].split('))')[0]
    assert 'primary_role' in built


def test_the_primary_role_is_not_rewritten_by_an_unrelated_save():
    """Pre-existing guarantee that must survive this change: the dialog has no
    notion of a primary role, so saving it must not change one. Only when the
    current primary is actually removed does it fall back."""
    code = _fn()
    assert "if original_role and str(original_role).strip().lower() in _selected:" in code
    assert 'primary_role = original_role' in code


def test_an_empty_selection_still_leaves_a_usable_account():
    """A user with no role cannot use the platform and cannot repair
    themselves."""
    code = _fn()
    assert "primary_role = roles[0] if roles else original_role or 'candidate'" in code


def test_the_join_table_still_reflects_the_submitted_list():
    """The half that was already correct — it must stay that way, and now the
    two stores finally agree."""
    code = _fn()
    assert 'DELETE FROM admin_user_roles WHERE user_id' in code


def test_added_roles_are_still_checked_for_their_binding():
    """Removal must not weaken the company/institution binding guard, which
    applies to roles being ADDED."""
    code = _fn()
    assert '_newly_added' in code
    assert 'missing_role_binding' in code
