"""Two owner rulings from 2026-09-02, which belong together.

    "I need the platform to inform the recruiter when a new candidate matches a
     vacancy, as a 'new match found'."                        (fb_1788343289)

    "For candidates' contact details, the platform should conceal them, as
     communication must take place on the platform for quality and governance
     purposes."                                               (fb_1788341745)

They are one design. The alert tells a recruiter a match exists and names the
vacancy; it does NOT carry contact details. The recruiter opens the profile they
were always entitled to read and messages the candidate on the platform, where
the conversation can be audited and measured. An employer who telephones a
candidate directly leaves no record at all.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import inspect  # noqa: E402

import pytest  # noqa: E402

import candidate_privacy as privacy  # noqa: E402
import scout  # noqa: E402


# ── concealment ─────────────────────────────────────────────────────────────

def test_a_recruiter_does_not_see_contact_details():
    payload = {'id': '784', 'full_name': 'A Candidate',
               'email': 'a@example.ae', 'phone': '971500000000'}
    out = privacy.redact(payload, roles={'recruiter'})
    assert 'email' not in out and 'phone' not in out
    assert out['full_name'] == 'A Candidate', 'the profile itself is not hidden'


def test_an_hr_manager_does_not_see_them_either():
    out = privacy.redact({'email': 'a@example.ae'}, roles={'employer_admin', 'hr_manager'})
    assert 'email' not in out


def test_operators_keep_them():
    """EHRDC and CRM operators call candidates as their job, and already hold
    every candidate's number in the roster. Concealing it from them would stop
    the work without protecting anybody."""
    for role in ('admin', 'career_services_operator', 'call_center_agent'):
        out = privacy.redact({'phone': '971500000000'}, roles={role})
        assert out.get('phone'), f'{role} lost contact details'


def test_unknown_roles_are_treated_as_not_entitled():
    """A viewer whose roles could not be resolved is not evidence of
    entitlement. Defaulting the other way means a bug in role resolution
    silently discloses telephone numbers."""
    assert privacy.may_see_contact(None) is False
    assert privacy.may_see_contact(set()) is False
    assert privacy.may_see_contact({'nonsense'}) is False


def test_it_reaches_nested_and_listed_candidates():
    payload = {'data': {'candidates': [
        {'full_name': 'One', 'email': 'one@example.ae'},
        {'full_name': 'Two', 'phone': '9715'},
    ]}}
    out = privacy.redact(payload, roles={'recruiter'})
    for entry in out['data']['candidates']:
        assert 'email' not in entry and 'phone' not in entry
        assert entry['full_name']


def test_the_input_is_not_mutated():
    """A caller reusing the payload after redaction — for logging, or a second
    response — must not find it silently emptied."""
    payload = {'email': 'a@example.ae'}
    privacy.redact(payload, roles={'recruiter'})
    assert payload == {'email': 'a@example.ae'}


@pytest.mark.parametrize('key', ['email', 'phone', 'mobile', 'candidate_email',
                                 'candidate_phone', 'personal_email', 'whatsapp'])
def test_every_spelling_of_a_way_to_reach_somebody(key):
    assert key in privacy.CONTACT_KEYS


def test_the_recruiter_dashboard_conceals_at_the_boundary():
    """That file selects a candidate email at eight separate places; the next
    endpoint would be the ninth. A hook covers what an edit-per-return would
    miss."""
    src = open(os.path.join(BACKEND, 'routes', 'recruiter_dashboard_api.py'),
               encoding='utf-8').read()
    assert 'after_request' in src
    assert '_strip_candidate_contact' in src


def test_the_hook_leaves_ambiguous_keys_alone():
    """A recruiter's own address and a panellist colleague's are spelled
    `email` too. Stripping those breaks screens without protecting anybody."""
    src = open(os.path.join(BACKEND, 'routes', 'recruiter_dashboard_api.py'),
               encoding='utf-8').read()
    block = src[src.index('_CANDIDATE_CONTACT_KEYS = ('):]
    block = block[:block.index(')')]
    assert 'candidate_email' in block
    assert "'email'" not in block and "'phone'" not in block


# ── scout ───────────────────────────────────────────────────────────────────

def test_the_alert_carries_no_contact_details():
    """The whole point of pairing these two. An alert with a phone number in it
    would undo the concealment through the notification channel."""
    src = inspect.getsource(scout)
    metadata = src[src.index("metadata={"):]
    assert 'email' not in metadata.split('}')[0]
    assert 'phone' not in metadata.split('}')[0]


def test_it_reads_the_table_the_scorer_expects():
    """match_scoring reads technical_skills / soft_skills / work_experience /
    education, which is the shape of user_cvs. Earlier drafts read
    candidate_profiles and then users, and scored every candidate as empty —
    no error, no alert, nothing to notice."""
    assert 'user_cvs' in scout._CANDIDATE_SQL
    for field in ('technical_skills', 'soft_skills', 'work_experience', 'education'):
        assert field in scout._CANDIDATE_SQL


def test_a_candidate_without_a_cv_scores_low_rather_than_vanishing():
    assert 'LEFT JOIN' in scout._CANDIDATE_SQL


def test_the_threshold_is_deliberate_and_named():
    assert scout.SCOUT_THRESHOLD == 75


def test_repeat_alerts_are_suppressed():
    """Without this, every profile edit re-alerts on the same pair, which is how
    a useful signal becomes noise a recruiter learns to ignore."""
    src = inspect.getsource(scout._already_alerted)
    assert "metadata->>'job_id'" in src
    assert "metadata->>'candidate_id'" in src


def test_both_directions_are_capped():
    """A candidate editing their profile must not walk the whole vacancy table
    inside their own save, and a recruiter must not get fifty notifications
    from one person editing their skills."""
    for fn in (scout.scout_for_candidate, scout.scout_for_vacancy):
        src = inspect.getsource(fn)
        assert 'MAX_ALERTS_PER_EVENT' in src


def test_neither_direction_can_raise():
    """Called from a profile save and from publishing a vacancy. A notification
    problem must not cost a candidate their edit or a recruiter their posting."""
    for fn in (scout.scout_for_candidate, scout.scout_for_vacancy):
        src = inspect.getsource(fn)
        assert 'except Exception' in src
        assert 'return 0' in src


def test_the_triggers_are_wired_and_cannot_break_their_callers():
    """Called from a profile save and from publishing a vacancy. Both must be
    inside a try, or a notification failure takes the caller down with it.

    Checked from the AST rather than by scanning a window of text: the guard
    sits further from the call than any window I guessed, and an earlier
    text-window version of this test failed against correctly guarded code.
    """
    import ast

    for path, symbol in (
        (os.path.join(BACKEND, 'candidate_profile_routes.py'), 'scout_for_candidate'),
        (os.path.join(BACKEND, 'recruiter', 'jd_routes_v2.py'), 'scout_for_vacancy'),
    ):
        tree = ast.parse(open(path, encoding='utf-8').read())
        guarded = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Try):
                for sub in ast.walk(node):
                    guarded.add(id(sub))

        calls = [n for n in ast.walk(tree)
                 if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)
                 and n.func.id == symbol]
        assert calls, f'{path} never calls {symbol}'
        for call in calls:
            assert id(call) in guarded, (
                f'{path}:{call.lineno} calls {symbol} outside a try — a '
                f'notification failure would fail the request')
