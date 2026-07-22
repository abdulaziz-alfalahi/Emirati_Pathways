#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
National Priority weights admin API (#33) — access control + validation.

DB-backed; mocked so no live database is touched.
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

MOD = 'backend.national_priority_admin_routes'


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config.update({"TESTING": True})
    return a


@pytest.fixture()
def client(app):
    return app.test_client()


def _auth(app, role):
    with app.app_context():
        tok = create_access_token(identity='784000000000040', additional_claims={'role': role})
    return {'Authorization': f'Bearer {tok}'}


def _mock_conn():
    conn = MagicMock()
    cur = MagicMock()
    conn.cursor.return_value = cur
    return conn, cur


def test_get_requires_auth(client):
    assert client.get('/api/admin/national-priority-weights').status_code == 401


def test_get_forbidden_for_candidate(app, client):
    r = client.get('/api/admin/national-priority-weights', headers=_auth(app, 'candidate'))
    assert r.status_code == 403


def test_put_forbidden_for_recruiter(app, client):
    r = client.put('/api/admin/national-priority-weights',
                   json={'weights': [{'code': 'x', 'points': 5}]},
                   headers=_auth(app, 'recruiter'))
    assert r.status_code == 403


def test_put_rejects_negative_points(app, client):
    conn, cur = _mock_conn()
    with patch(f'{MOD}.get_db_connection', return_value=conn), \
         patch(f'{MOD}.ensure_weights_table'):
        r = client.put('/api/admin/national-priority-weights',
                       json={'weights': [{'code': 'dev_certification', 'points': -3}]},
                       headers=_auth(app, 'admin'))
    assert r.status_code == 400
    assert 'non-negative' in r.get_json()['error']


def test_put_rejects_non_list_body(app, client):
    conn, _ = _mock_conn()
    with patch(f'{MOD}.get_db_connection', return_value=conn), \
         patch(f'{MOD}.ensure_weights_table'):
        r = client.put('/api/admin/national-priority-weights',
                       json={'weights': 'nope'}, headers=_auth(app, 'admin'))
    assert r.status_code == 400


def test_put_bumps_version_and_audits(app, client):
    conn, cur = _mock_conn()
    cur.rowcount = 1
    with patch(f'{MOD}.get_db_connection', return_value=conn), \
         patch(f'{MOD}.ensure_weights_table'):
        r = client.put('/api/admin/national-priority-weights',
                       json={'weights': [{'code': 'dev_certification', 'points': 30, 'active': True}]},
                       headers=_auth(app, 'admin'))
    assert r.status_code == 200
    assert r.get_json()['changed'] == ['dev_certification']
    sqls = ' '.join(c.args[0] for c in cur.execute.call_args_list)
    assert 'version = version + 1' in sqls
    assert 'admin_audit_log' in sqls
