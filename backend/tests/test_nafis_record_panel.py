"""The candidate's NAFIS record, shown to staff read-only (fb_1786426324).

Staff asked to see what NAFIS already knows when they open Edit Details, rather
than only what the manually-maintained CRM sheet carried.

This became possible on 2026-08-20: migration 074 set nafis_job_seekers.user_id
for 2,904 candidates who had a platform record and no link back to their NAFIS
row. Before that the two tables described the same people and could not reach
each other.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FE = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'pages',
                  'operator-dashboards', 'CareerServicesDashboard.tsx')


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def _fn():
    """The handler's code, docstring stripped — asserting against the prose has
    caught me three times."""
    src = _src('candidate_profile_routes.py')
    fn = src.split('def crm_candidate_nafis')[1].split('\n@crm_profile_bp.route')[0]
    parts = fn.split('"""')
    return parts[0] + '"""'.join(parts[2:]) if len(parts) >= 3 else fn


def _fe():
    with open(FE, encoding='utf-8') as fh:
        return fh.read()


# ── The fields that were asked for ──────────────────────────────────────────

def test_every_requested_field_is_returned():
    """Gender, age range, registration date, jobseeker date, person of
    determination and marital status were named in the request."""
    fn = _fn()
    for field in ('gender', 'age_group', 'registered_on', 'job_seeker_date',
                  'is_person_of_determination', 'marital_status'):
        assert field in fn, field


# ── Read-only, and said so ──────────────────────────────────────────────────

def test_it_is_a_GET_only_surface():
    src = _src('candidate_profile_routes.py')
    decorated = src.split("'/crm-candidates/<user_id>/nafis'")[1][:120]
    assert "methods=['GET']" in decorated
    assert 'PUT' not in decorated and 'POST' not in decorated


def test_the_panel_tells_staff_it_cannot_be_edited_here():
    """NAFIS is the source. Anything typed over this would be replaced by the
    next import, so an edit control would be offering to lose their work."""
    assert 'not editable here' in _fe()


# ── Three outcomes, three messages ──────────────────────────────────────────

def test_no_linked_record_is_not_an_error_and_not_an_empty_record():
    """1,066 seekers are in NAFIS with no platform account, and some platform
    candidates came from the CRM sheet and are in no NAFIS batch at all."""
    fn = _fn()
    assert "'data': None" in fn
    assert 'No NAFIS record is linked' in fn


def test_the_panel_separates_missing_from_unavailable():
    """"No NAFIS record" is a fact about the candidate; "could not load" is a
    fact about us."""
    fe = _fe()
    assert 'No NAFIS record is linked to this candidate' in fe
    assert 'could not be loaded' in fe
    for state in ("'none'", "'error'", "'loading'", "'ok'"):
        assert state in fe, state


def test_an_unrecorded_field_shows_an_em_dash():
    """Blank reads as "we forgot to show it"; a zero or "No" would be an answer
    NAFIS never gave."""
    fe = _fe()
    block = fe.split("{t('NAFIS record'")[1][:3000]
    assert '—' in block
    assert "value === null || value === undefined || value === ''" in block


def test_person_of_determination_null_is_not_rendered_as_No():
    """The field is unrecorded for 2 candidates; saying "No" about them would be
    a claim NAFIS did not make."""
    fe = _fe()
    assert 'is_person_of_determination == null ? null' in fe


# ── It is audited ───────────────────────────────────────────────────────────

def test_reading_it_is_audited():
    """It returns a named person's demographic detail — exactly what the read
    trail exists for."""
    fn = _fn()
    assert 'log_pii_read(CRM_CANDIDATE_NAFIS_READ' in fn
    assert 'resource_id=user_id' in fn


def test_the_audit_action_is_registered():
    src = _src('pii_access_log.py')
    assert "CRM_CANDIDATE_NAFIS_READ = 'crm_candidate_nafis_read'" in src
    assert 'CRM_CANDIDATE_NAFIS_READ,' in src.split('READ_ACTIONS')[1][:300]


def test_it_is_gated_to_career_services():
    src = _src('candidate_profile_routes.py')
    decorated = src.split("'/crm-candidates/<user_id>/nafis'")[1][:200]
    assert 'CAREER_SERVICES_ROLES' in decorated
