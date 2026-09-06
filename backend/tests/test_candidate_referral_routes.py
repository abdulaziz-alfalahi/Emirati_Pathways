"""The operator's one-click invitation from a referral must confer the recruiter role."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.routes.candidate_referral_routes import invitation_record_for  # noqa: E402
from backend.growth_system import GrowthSystem  # noqa: E402


def _ref(**over):
    base = {'id': 5, 'recruiter_email': 'sara@newco.ae', 'company_name': 'NewCo LLC',
            'company_display_name': None}
    base.update(over)
    return base


def test_the_invitation_confers_the_recruiter_role_as_growth_system_reads_it():
    rec = invitation_record_for(_ref())
    # The key growth_system actually reads — not intended_role, which it ignores
    # and degrades to the first-contact role (caught on the first E2E run).
    assert GrowthSystem._validate_role(rec.get('role')) == 'recruiter'
    assert rec['email'] == 'sara@newco.ae'


def test_the_platform_name_wins_over_what_the_candidate_typed():
    rec = invitation_record_for(_ref(company_display_name='NEWCO L.L.C', company_name='newco'))
    assert rec['name'] == 'NEWCO L.L.C'
    assert invitation_record_for(_ref(company_name=None))['name'] == ''
