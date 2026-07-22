#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Caseload assignment primitive (P1 / C3) — the missing insert path that
populates advisor/coach caseloads. DB mocked; no live database touched.
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

MOD = 'backend.routes.caseload_assignment_routes'


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
    # Only the token claims decide the role in these tests.
    with patch('backend.auth.access_control.execute_query', return_value=None):
        yield


def _auth(app, role):
    with app.app_context():
        tok = create_access_token(identity='784000000000040', additional_claims={'role': role})
    return {'Authorization': f'Bearer {tok}'}


def _conn():
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchall.return_value = []
    cur.rowcount = 1
    conn.cursor.return_value = cur
    return conn, cur


def test_operators_requires_operator_role(app, client):
    assert client.get('/api/caseload/operators?role=advisor').status_code == 401
    r = client.get('/api/caseload/operators?role=advisor', headers=_auth(app, 'candidate'))
    assert r.status_code == 403


def test_operators_lists_by_role(app, client):
    conn, cur = _conn()
    cur.fetchall.return_value = [{'id': '1', 'name': 'A', 'email': 'a@x', 'role': 'advisor'}]
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.get('/api/caseload/operators?role=advisor', headers=_auth(app, 'admin'))
    assert r.status_code == 200
    assert r.get_json()['operators'][0]['id'] == '1'
    # matches the role as primary OR in secondary_roles
    sql = cur.execute.call_args[0][0]
    assert 'jsonb_exists(secondary_roles' in sql


def test_assign_inserts_into_the_right_table(app, client):
    conn, cur = _conn()
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.post('/api/caseload/advisor/assign',
                        json={'staff_id': '784adv', 'member_id': '784stu'},
                        headers=_auth(app, 'admin'))
    assert r.status_code == 200 and r.get_json()['status'] == 'assigned'
    sql, params = cur.execute.call_args[0]
    assert 'INSERT INTO advisor_student_assignments' in sql
    assert 'ON CONFLICT' in sql  # idempotent reactivation
    assert params == ('784adv', '784stu')


def test_assign_coach_uses_coach_table(app, client):
    conn, cur = _conn()
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.post('/api/caseload/coach/assign',
                        json={'staff_id': 'c', 'member_id': 'm'},
                        headers=_auth(app, 'admin'))
    assert r.status_code == 200
    assert 'coach_client_assignments' in cur.execute.call_args[0][0]


def test_unknown_type_404(app, client):
    conn, _ = _conn()
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.post('/api/caseload/bogus/assign',
                        json={'staff_id': 'a', 'member_id': 'b'},
                        headers=_auth(app, 'admin'))
    assert r.status_code == 404


def test_assign_validates_body(app, client):
    r = client.post('/api/caseload/advisor/assign', json={'staff_id': 'a'},
                    headers=_auth(app, 'admin'))
    assert r.status_code == 400


def test_unassign_soft_removes(app, client):
    conn, cur = _conn()
    with patch(f'{MOD}.get_db_connection', return_value=conn):
        r = client.post('/api/caseload/advisor/unassign',
                        json={'staff_id': 'a', 'member_id': 'b'},
                        headers=_auth(app, 'admin'))
    assert r.status_code == 200
    assert "status = 'removed'" in cur.execute.call_args[0][0]
