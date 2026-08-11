"""UAE Pass demographic claims must be stored, and must supersede NAFIS.

The OAuth layer parsed `gender` and nothing wrote it, so the NAFIS import filled
the column instead. The first real seeker onboarding therefore recorded a woman
as 'Male' with the invited seeker's date of birth.

Owner directive 2026-08-11: what UAE Pass returns supersedes.
"""
import os
import sys

_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
for p in (os.path.dirname(_backend), _backend):
    if p not in sys.path:
        sys.path.insert(0, p)


def _mapping(raw):
    from backend.auth.uaepass_oauth import UAEPassOAuth
    return UAEPassOAuth._normalize_profile(None, raw) if hasattr(
        UAEPassOAuth, '_normalize_profile') else None


def test_gender_claim_is_mapped():
    """It was always parsed — this pins that it stays mapped."""
    src = open(os.path.join(_backend, 'auth', 'uaepass_oauth.py'), encoding='utf-8').read()
    assert "'gender': raw_profile.get('gender')" in src


def test_pending_claims_are_mapped_ahead_of_grant():
    """Items 5 and 8 of the attributes request: mapped now so they land on grant
    with no code change. Several spellings accepted pending confirmation."""
    src = open(os.path.join(_backend, 'auth', 'uaepass_oauth.py'), encoding='utf-8').read()
    assert "'date_of_birth'" in src
    assert "'emirate_of_issuance'" in src
    for spelling in ('dateOfBirth', 'dob', 'birthDate'):
        assert spelling in src, f'{spelling} not accepted'


def test_demographics_are_persisted_not_dropped():
    """The regression: parsed and then thrown away."""
    src = open(os.path.join(_backend, 'routes', 'uaepass_routes.py'), encoding='utf-8').read()
    assert 'def _persist_uaepass_demographics' in src
    assert '_persist_uaepass_demographics(user_data.get(\'id\'), profile)' in src, \
        'helper defined but never called'


def test_uaepass_overwrites_rather_than_coalesces():
    """UAE Pass supersedes, so these must OVERWRITE — a COALESCE here would let
    the NAFIS import keep winning, which is the bug being fixed."""
    src = open(os.path.join(_backend, 'routes', 'uaepass_routes.py'), encoding='utf-8').read()
    block = src.split('def _persist_uaepass_demographics')[1].split('\ndef ')[0]
    # strip the docstring — it *explains* COALESCE, which is not the same as using it
    body = block.split('"""', 2)[-1]
    sql_lines = [l for l in body.splitlines() if 'UPDATE candidate_profiles' in l or ' SET ' in l or 'sets =' in l]
    assert sql_lines, 'no UPDATE statement found'
    assert not any('COALESCE' in l for l in sql_lines), \
        f'must overwrite, not COALESCE — UAE Pass outranks NAFIS: {sql_lines}'
    assert any('= %s' in l for l in sql_lines)


def test_runs_before_invitation_redemption():
    """Ordering matters: written first, so the NAFIS seeding's COALESCE then
    leaves the verified values alone."""
    src = open(os.path.join(_backend, 'routes', 'uaepass_routes.py'), encoding='utf-8').read()
    assert src.index('_persist_uaepass_demographics(user_data') < src.index('Step 4b')


def test_non_candidates_get_no_candidate_profile():
    """Employers and operators must not be given a candidate_profiles row."""
    src = open(os.path.join(_backend, 'routes', 'uaepass_routes.py'), encoding='utf-8').read()
    block = src.split('def _persist_uaepass_demographics')[1].split('\ndef ')[0]
    assert "'candidate' not in" in block
