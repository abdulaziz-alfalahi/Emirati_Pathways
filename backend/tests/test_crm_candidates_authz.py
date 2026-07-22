#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CRM candidates authorization (P0 security fix).

GET/PUT /api/profile/crm-candidates exposes candidate PII (national_id,
phone, counselling notes). It was @jwt_required() with no role check, so
any authenticated user could enumerate/overwrite the whole roster. These
tests pin that it is now career-services-staff only, and that the guard
resolves secondary_roles.
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

MOD = 'backend.candidate_profile_routes'


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config.update({"TESTING": True})
    return a


@pytest.fixture(autouse=True)
def _no_db_roles():
    # resolve_roles() merges JWT claims with a DB lookup of users.role. Stub
    # that lookup to None so these tests exercise ONLY the token's claims
    # (hermetic; otherwise a test identity that happens to be a real admin in
    # the connected DB would resolve to admin and mask the gate).
    with patch('backend.auth.access_control.execute_query', return_value=None):
        yield


@pytest.fixture()
def client(app):
    return app.test_client()


def _token(app, role=None, secondary=None):
    claims = {}
    if role is not None:
        claims['role'] = role
    if secondary is not None:
        claims['secondary_roles'] = secondary
    with app.app_context():
        return create_access_token(identity='784000000000020', additional_claims=claims)


def _auth(app, **kw):
    return {'Authorization': f'Bearer {_token(app, **kw)}'}


def test_get_requires_auth(client):
    assert client.get('/api/profile/crm-candidates').status_code == 401


def test_candidate_is_forbidden(app, client):
    # The core BOLA fix: a plain candidate must NOT read the roster.
    r = client.get('/api/profile/crm-candidates', headers=_auth(app, role='candidate'))
    assert r.status_code == 403


def test_candidate_cannot_update(app, client):
    r = client.put('/api/profile/crm-candidates/784000000000999',
                   json={'call_status': 'contacted'},
                   headers=_auth(app, role='candidate'))
    assert r.status_code == 403


def test_career_services_operator_allowed(app, client):
    # Role passes the gate; DB mocked so we only assert it got past authz.
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchall.return_value = []
    conn.cursor.return_value = cur
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.get('/api/profile/crm-candidates',
                       headers=_auth(app, role='career_services_operator'))
    assert r.status_code == 200


def test_secondary_role_is_honored(app, client):
    # require_roles resolves secondary_roles — a candidate primary with the
    # operator role as secondary must be allowed (fixes the C1 pattern here).
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchall.return_value = []
    conn.cursor.return_value = cur
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.get('/api/profile/crm-candidates',
                       headers=_auth(app, role='candidate',
                                     secondary=['career_services_operator']))
    assert r.status_code == 200
