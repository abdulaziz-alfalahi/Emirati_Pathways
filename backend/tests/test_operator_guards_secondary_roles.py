#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Operator guards honor secondary_roles (P1 / C1).

The nafis, career-services, advisor and coach guards read only the primary
`role` JWT claim, so an operator holding the role as a SECONDARY role was
403'd on its own tooling. They now route through resolve_roles(). These
tests pin the fix behaviorally and structurally.
"""

import os
import re
import sys
from unittest.mock import patch

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from app import create_app
from flask_jwt_extended import create_access_token


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config.update({"TESTING": True})
    return a


@pytest.fixture()
def client(app):
    return app.test_client()


def _auth(app):
    with app.app_context():
        # Primary role candidate; the operator role lives ONLY in secondary_roles.
        tok = create_access_token(identity='784000000000021',
                                  additional_claims={'role': 'candidate'})
    return {'Authorization': f'Bearer {tok}'}


@pytest.mark.parametrize("module,resolved,path", [
    ('backend.advisor_routes', {'candidate', 'advisor'}, '/api/advisor/students'),
    ('backend.career_services_routes', {'candidate', 'career_services_operator'},
     '/api/career-services/internships'),
])
def test_secondary_role_holder_passes_guard(app, client, module, resolved, path):
    # Patch resolve_roles as imported into the module; assert we get past the
    # 403 gate (any non-403 status means authz passed — DB errors are fine).
    with patch(f'{module}.resolve_roles', return_value=resolved):
        r = client.get(path, headers=_auth(app))
    assert r.status_code != 403, r.get_data(as_text=True)


@pytest.mark.parametrize("module,path", [
    ('backend.advisor_routes', '/api/advisor/students'),
    ('backend.career_services_routes', '/api/career-services/applications/pending-approval'),
])
def test_non_privileged_still_forbidden(app, client, module, path):
    with patch(f'{module}.resolve_roles', return_value={'candidate'}):
        r = client.get(path, headers=_auth(app))
    assert r.status_code == 403


def test_guards_no_longer_gate_on_bare_primary_claim():
    """Structural: the four guards must not decide access from
    get_jwt()['role'] alone (that reintroduces the C1 lockout)."""
    files = {
        'routes/nafis_talent_routes.py': '_operator_required',
        'career_services_routes.py': '_require_manager',
        'advisor_routes.py': '_require_advisor_role',
        'coach_routes.py': '_require_coach_role',
    }
    offenders = []
    bare = re.compile(r"role\s*=\s*\(get_jwt\(\)\s*or\s*\{\}\)\.get\('role'")
    for rel in files:
        src = open(os.path.join(_backend_dir, rel), encoding='utf-8').read()
        # each must import + use resolve_roles
        if 'resolve_roles' not in src:
            offenders.append(f"{rel}: no resolve_roles")
        if bare.search(src):
            offenders.append(f"{rel}: still gates on bare get_jwt()['role']")
    assert offenders == [], offenders
