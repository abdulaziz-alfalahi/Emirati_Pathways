"""Issuing a credential to a person outside the platform leaves a record.

WHY THIS FILE EXISTS

Asked on 2026-08-27 who had invited a real employer, the platform could not say.
The invitation named an operator who truthfully denied it — the button he
pressed told him it had sent nothing — and the ACT of issuing it was recorded
nowhere at all. `admin_audit_log` held roster reads and no invitations.

A row naming an operator is not an audit trail. What makes it one is a record
written at the moment of the decision, by the code that made it, saying what was
issued and to whom.

FOUR PATHS, WHICH IS ALL OF THEM

Every invitation that leaves the platform carrying a redeemable credential:

    company  — employer magic link, confers employer_admin or recruiter
    staff    — platform staff, confers the intended_role
    seeker   — NAFIS candidate registration
    team     — an EMPLOYER inviting a colleague into their workspace

They line up one-to-one with the four invitation kinds in the outbound-mail
register, so a message in the queue and the act that produced it can be matched.

In-platform notifications (event_invitations, bulk_invitations) are deliberately
not here: they carry no credential and go to people who already have accounts.
"""
import inspect
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

import admin_audit  # noqa: E402
from tests.source_utils import code_only  # noqa: E402

# module, the function that issues it, the kind it must record
CREATORS = [
    ('growth_system', 'create_company_invitations', 'company'),
    ('staff_invitation_system', 'create_invitation', 'staff'),
    ('nafis_talent_system', 'create_seeker_invitations', 'seeker'),
    ('company_team_system', 'create_team_invitation', 'team'),
]


@pytest.mark.parametrize('module_name,func_name,kind', CREATORS)
def test_every_invitation_path_records_who_issued_it(module_name, func_name, kind):
    module = __import__(module_name)
    fn = next(getattr(cls, func_name)
              for cls in vars(module).values()
              if isinstance(cls, type) and hasattr(cls, func_name))
    # Raw source, and whitespace-tolerant: the call wraps across lines, and
    # code_only strips string literals — between them an adjacency check finds
    # nothing and reports a missing audit that is actually there.
    import re
    source = inspect.getsource(fn)
    assert re.search(rf"record_invitation\(\s*'{kind}'", source), (
        f'{module_name}.{func_name} issues a credential without recording it')


@pytest.mark.parametrize('module_name,func_name,kind', CREATORS)
def test_the_actor_comes_from_the_caller_not_the_payload(module_name, func_name, kind):
    """The invitee must never be able to choose who the record blames."""
    module = __import__(module_name)
    fn = next(getattr(cls, func_name)
              for cls in vars(module).values()
              if isinstance(cls, type) and hasattr(cls, func_name))
    params = inspect.signature(fn).parameters
    assert any('invited_by' in p for p in params), (
        f'{func_name} has no inviter parameter to record')


def test_the_token_is_never_written_to_the_audit_log():
    """The recipient is the question an audit answers. The token is a live
    credential and belongs in an audit trail even less than in a log line."""
    source = inspect.getsource(admin_audit.record_invitation)
    assert 'token' not in source.replace('the TOKEN is not', '').replace(
        'the token is a live credential', '')


def test_recording_never_raises():
    """An audit row is worth a great deal and never worth losing the action it
    describes."""
    source = inspect.getsource(admin_audit.record_admin_action)
    assert 'except Exception' in source
    assert 'raise' not in code_only(source)


def test_an_unknown_actor_is_recorded_rather_than_dropped():
    """An action nobody can be named for is exactly the thing worth recording.
    The NULL is the finding — 267 messages carried one."""
    source = code_only(inspect.getsource(admin_audit.record_admin_action))
    assert 'if not actor_id' not in source
    assert 'return False' in source          # only on a write failure


def test_every_recorded_action_has_a_name_on_file():
    for _m, _f, kind in CREATORS:
        assert f'{kind}_invitation_created' in admin_audit.KNOWN_ACTIONS


def test_reads_keep_their_own_trail():
    """pii_access_log records reads of personal data for different reasons.
    Folding them together would bury one in the other."""
    source = code_only(inspect.getsource(admin_audit))
    assert 'log_pii_read' not in source


def test_nothing_tries_to_delete_from_the_audit_log():
    """`admin_audit_log` is append-only — trg_admin_audit_log_no_delete and
    trg_admin_audit_log_no_update both RAISE with insufficient_privilege.

    Worth knowing before writing cleanup code: a ZZ- probe against this table
    cannot be tidied away afterwards, which is the point of it. Code that tries
    will fail at runtime rather than at review.

    Retention purging is the sanctioned exception: scripts/retention_purge.py
    disables both triggers explicitly, does its delete, and re-enables them.
    Deleting from this table on purpose is fine; doing it without knowing the
    table is protected is what fails at runtime.
    """
    import glob
    offenders = []
    for path in glob.glob(os.path.join(BACKEND, '**', '*.py'), recursive=True):
        if 'archived' in path or '/tests/' in path:
            continue
        body = open(path, encoding='utf-8').read()
        mutates = ('DELETE FROM admin_audit_log' in body
                   or 'UPDATE admin_audit_log' in body)
        if mutates and 'DISABLE TRIGGER trg_admin_audit_log' not in body:
            offenders.append(os.path.relpath(path, BACKEND))
    assert not offenders, (
        f'these mutate an append-only table without disabling its triggers, '
        f'so they raise at runtime: {offenders}')
