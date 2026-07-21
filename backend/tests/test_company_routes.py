#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Company routes — unit & smoke tests (issue #97).

/api/companies/create used to write to a module-level dict, so operator
registrations looked successful and were lost on restart. These tests pin
the new behavior: operator-gated, persisted via the real DB layer (mocked
here — no test ever touches a live database), identity-deduped (409), and
the dict-era endpoints retired with 410.
"""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# ── Path setup ──────────────────────────────────────────────────────
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from app import create_app
from flask_jwt_extended import create_access_token

ROUTES_MODULE = 'backend.routes.company_routes'


@pytest.fixture(scope="module")
def app():
    test_app = create_app()
    test_app.config.update({"TESTING": True})
    return test_app


@pytest.fixture()
def client(app):
    return app.test_client()


def _auth(app, role):
    with app.app_context():
        token = create_access_token(
            identity='784000099999990', additional_claims={'role': role})
    return {'Authorization': f'Bearer {token}'}


_PAYLOAD = {
    'name': '  Test  Manual Co ',
    'industry': 'Technology',
    'company_type': 'private',
    'trade_license_number': 'TL-UNIT-001',
    'locations': [{'emirate': 'Dubai', 'is_headquarters': True}],
    'contact': {'primary_email': 'ops@test-manual.example', 'phone': '0501234567',
                'website': 'https://test-manual.example'},
}

_DB_ROW = {
    'id': '11111111-2222-3333-4444-555555555555',
    'name': 'Test Manual Co', 'company_name': 'Test Manual Co',
    'description': '', 'industry': 'Technology', 'business_type': 'private',
    'trade_license_no': 'TL-UNIT-001', 'emirate': 'Dubai', 'city': None,
    'phone': '0501234567', 'website': 'https://test-manual.example',
    'contact_email': 'ops@test-manual.example', 'is_verified': False,
    'lead_source': 'operator_manual', 'verified_at': None,
}


def _mock_conn(fetchone_result):
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchone.return_value = fetchone_result
    conn.cursor.return_value.__enter__.return_value = cur
    return conn, cur


# ── Access control ──────────────────────────────────────────────────

def test_create_requires_auth(client):
    r = client.post('/api/companies/create', json=_PAYLOAD)
    assert r.status_code == 401


def test_create_forbidden_for_candidate(app, client):
    r = client.post('/api/companies/create', json=_PAYLOAD,
                    headers=_auth(app, 'candidate'))
    assert r.status_code == 403


# ── Persistence (DB layer mocked) ───────────────────────────────────

def test_create_persists_to_companies_table(app, client):
    conn, cur = _mock_conn(_DB_ROW)
    with patch(f'{ROUTES_MODULE}.get_db', return_value=conn), \
         patch(f'{ROUTES_MODULE}.find_company_id', return_value=None):
        r = client.post('/api/companies/create', json=_PAYLOAD,
                        headers=_auth(app, 'growth_operator'))

    assert r.status_code == 201
    body = r.get_json()
    assert body['success'] is True
    assert body['data']['company_id'] == _DB_ROW['id']

    sql, params = cur.execute.call_args[0]
    assert 'INSERT INTO companies' in sql
    assert "lead_source" in sql and "'operator_manual'" in sql
    # Display name is whitespace-collapsed; mapping hits the real columns.
    assert params[0] == 'Test Manual Co'          # name
    assert params[1] == 'Test Manual Co'          # company_name
    assert params[4] == 'private'                 # company_type -> business_type
    assert params[5] == 'TL-UNIT-001'             # -> trade_license_no
    assert params[6] == 'Dubai'                   # HQ location -> emirate
    assert params[10] == 'ops@test-manual.example'
    conn.commit.assert_called_once()


def test_create_deduplicates_against_existing_identity(app, client):
    conn, cur = _mock_conn(None)
    with patch(f'{ROUTES_MODULE}.get_db', return_value=conn), \
         patch(f'{ROUTES_MODULE}.find_company_id',
               return_value='99999999-8888-7777-6666-555555555555'):
        r = client.post('/api/companies/create', json=_PAYLOAD,
                        headers=_auth(app, 'growth_operator'))

    assert r.status_code == 409
    assert r.get_json()['data']['company_id'] == '99999999-8888-7777-6666-555555555555'
    cur.execute.assert_not_called()
    conn.commit.assert_not_called()


def test_create_validates_required_fields(app, client):
    conn, _ = _mock_conn(None)
    with patch(f'{ROUTES_MODULE}.get_db', return_value=conn):
        r = client.post('/api/companies/create', json={'name': 'No Industry Co'},
                        headers=_auth(app, 'growth_operator'))
    assert r.status_code == 400


# ── Reads ───────────────────────────────────────────────────────────

def test_get_company_rejects_non_uuid_without_db(client):
    with patch(f'{ROUTES_MODULE}.execute_query') as eq:
        r = client.get('/api/companies/not-a-uuid')
    assert r.status_code == 404
    eq.assert_not_called()


def test_get_company_found(client):
    with patch(f'{ROUTES_MODULE}.execute_query', return_value=_DB_ROW):
        r = client.get(f"/api/companies/{_DB_ROW['id']}")
    assert r.status_code == 200
    assert r.get_json()['data']['company']['name'] == 'Test Manual Co'


# ── Dict-era endpoints are retired, not silently lying ─────────────

@pytest.mark.parametrize("method,path", [
    ('PUT', '/api/companies/11111111-2222-3333-4444-555555555555'),
    ('POST', '/api/companies/11111111-2222-3333-4444-555555555555/users'),
    ('DELETE', '/api/companies/11111111-2222-3333-4444-555555555555/users/784'),
    ('POST', '/api/companies/11111111-2222-3333-4444-555555555555/verify'),
    ('GET', '/api/companies/user/784000099999990'),
])
def test_dict_era_endpoints_return_410(client, method, path):
    r = client.open(path, method=method, json={})
    assert r.status_code == 410
