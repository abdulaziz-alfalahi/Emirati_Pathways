#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
P3 / C5 identity-hygiene fixes.

- password login mints a JWT with a role claim (was absent; UAE Pass/refresh had it)
- admin role grant syncs user_type (mirror of role — migration 006 invariant)
- growth-operator domain assignment writes secondary_roles as jsonb, not ::text[]
- UAE Pass user creation sets user_type
"""

import os
import re
import sys
from unittest.mock import MagicMock, patch

import jwt as pyjwt
import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from app import create_app


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config.update({"TESTING": True})
    return a


def _decode(app, token):
    with app.app_context():
        secret = app.config['JWT_SECRET_KEY']
    return pyjwt.decode(token, secret, algorithms=['HS256'])


def test_password_login_jwt_has_role_claim(app):
    from backend.auth.auth_manager_fixed import AuthenticationManager
    mgr = AuthenticationManager()
    user = {
        'id': '784000000000030', 'email': 'op@x.ae',
        'password_hash': '$2b$12$abcdefghijklmnopqrstuv',
        'is_active': True, 'first_name': 'O', 'last_name': 'P',
        'role': 'career_services_operator', 'user_type': 'career_services_operator',
        'phone': '', 'emirate': '', 'nationality': 'UAE', 'is_verified': True,
        'secondary_roles': ['talent_operator'],
    }
    with app.app_context(), \
         patch.object(mgr, '_get_user_by_email', return_value=user), \
         patch('bcrypt.checkpw', return_value=True), \
         patch.object(mgr, '_update_last_login'), \
         patch.object(mgr, '_reset_failed_attempts'):
        ok, _msg, data = mgr.authenticate_user('op@x.ae', 'pw')
    assert ok
    claims = _decode(app, data['access_token'])
    assert claims['role'] == 'career_services_operator'
    assert 'talent_operator' in claims['secondary_roles']


def test_admin_grant_syncs_user_type():
    # Structural: update_user_roles' UPDATE must set user_type alongside role
    # (the DB-connecting constructor makes a behavioural test heavy).
    import inspect
    from backend.administrator_system import AdministratorSystem
    src = inspect.getsource(AdministratorSystem.update_user_roles)
    m = re.search(r'UPDATE users\s+SET role = %s, user_type = %s', src)
    assert m, "admin grant must sync user_type alongside role"
    # the params must pass the primary role twice (role + user_type)
    assert 'primary_role, primary_role' in src.replace('\n', ' ')


def test_growth_operator_assignment_uses_jsonb():
    src = open(os.path.join(_backend_dir, 'routes', 'growth_operator_assignment_api.py'),
               encoding='utf-8').read()
    assert 'secondary_roles = %s::jsonb' in src
    assert 'secondary_roles = %s::text[]' not in src


def test_uaepass_insert_sets_user_type():
    src = open(os.path.join(_backend_dir, 'routes', 'uaepass_routes.py'), encoding='utf-8').read()
    # the candidate-creation INSERT must carry user_type alongside role
    inserts = re.findall(r'INSERT INTO users \(([^)]*)\)', src)
    assert any('user_type' in cols and 'role' in cols for cols in inserts), \
        "the UAE Pass user INSERT must set user_type"
