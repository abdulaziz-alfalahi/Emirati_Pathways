#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
career_services_operator scope reconciliation.

Decision: the role is the candidate COUNSELLING caseworker (owns the
counselling CRM), not a marketplace manager. So it must NOT be able to
create/manage internships/gigs/salary benchmarks — those belong to
internship_coordinator and recruiters — while marketplace roles keep that
access. DB mocked.
"""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from app import create_app
from flask_jwt_extended import create_access_token
import backend.career_services_routes as csr


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config.update({"TESTING": True})
    return a


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def _no_db_roles():
    with patch('backend.auth.access_control.execute_query', return_value=None):
        yield


def _auth(app, role):
    with app.app_context():
        tok = create_access_token(identity='784000000000040', additional_claims={'role': role})
    return {'Authorization': f'Bearer {tok}'}


def test_career_services_operator_excluded_from_marketplace_role_set():
    assert 'career_services_operator' not in csr._MANAGER_ROLES
    # the marketplace still belongs to these
    assert 'internship_coordinator' in csr._MANAGER_ROLES
    assert 'recruiter' in csr._MANAGER_ROLES


def test_counsellor_cannot_create_internships(app, client):
    r = client.post('/api/career-services/internships',
                    json={'title': 'x'}, headers=_auth(app, 'career_services_operator'))
    assert r.status_code == 403


def test_ungated_create_gap_closed(app, client):
    # create_internship / create_gig were @jwt_required only (any user could
    # create). Now manager-gated: a plain candidate is refused.
    for path in ('/api/career-services/internships', '/api/career-services/gigs'):
        r = client.post(path, json={'title': 'x'}, headers=_auth(app, 'candidate'))
        assert r.status_code == 403, path


def test_coordinator_can_reach_marketplace(app, client):
    # internship_coordinator passes the manager gate (past 403); DB mocked so
    # any non-403 status proves authorization succeeded.
    conn = MagicMock(); cur = MagicMock()
    cur.fetchone.return_value = None
    conn.cursor.return_value = cur
    with patch.object(csr, 'get_db', return_value=conn):
        r = client.post('/api/career-services/internships',
                        json={'title': 'x', 'company': 'c'},
                        headers=_auth(app, 'internship_coordinator'))
    assert r.status_code != 403
