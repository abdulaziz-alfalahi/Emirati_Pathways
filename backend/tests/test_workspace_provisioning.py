#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Workspace provisioning reachability — tests (issue #92).

Three breakages made provisioning unreachable: the picker's data source
(/api/growth-operator/companies) never existed; every handler that wrote
users.current_company_id 500'd on UndefinedColumn (the migration-001
column was never deployed); and the frontend swallowed both failures.
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


class TestCompaniesPickerEndpoint:
    def test_requires_auth(self, client):
        assert client.get('/api/growth/companies').status_code == 401

    def test_candidate_forbidden(self, app, client):
        r = client.get('/api/growth/companies', headers=_auth(app, 'candidate'))
        assert r.status_code == 403

    def test_operator_gets_slim_list(self, app, client):
        cur = MagicMock()
        cur.fetchall.return_value = [
            ('11111111-2222-3333-4444-555555555555', 'Acme LLC', True, False),
        ]
        conn = MagicMock()
        conn.cursor.return_value.__enter__.return_value = cur
        with patch('backend.routes.growth_routes.growth_sys') as gs:
            gs._get_db_connection.return_value = conn
            r = client.get('/api/growth/companies', headers=_auth(app, 'growth_operator'))
        assert r.status_code == 200
        body = r.get_json()
        assert body['companies'] == [{
            'id': '11111111-2222-3333-4444-555555555555',
            'company_name': 'Acme LLC',
            'is_verified': True,
            'workspace_enabled': False,
        }]
        conn.close.assert_called_once()


class TestNoCurrentCompanyIdWrites:
    def test_workspace_routes_never_touch_the_undeployed_column(self):
        # users.current_company_id is declared by migration 001 but absent
        # from the live DB; any statement touching it raises UndefinedColumn
        # and 500s the whole handler. Guard against regression.
        import inspect
        import backend.routes.workspace_routes as wr
        src = inspect.getsource(wr)
        statements = [l for l in src.splitlines()
                      if 'current_company_id' in l and not l.strip().startswith('#')]
        sql_statements = [l for l in statements if 'UPDATE' in l or 'SELECT' in l or 'INSERT' in l]
        assert sql_statements == [], f"SQL still references current_company_id: {sql_statements}"

    def test_provision_checks_role_and_user_type(self):
        import inspect
        from backend.routes.workspace_routes import provision_workspace
        src = inspect.getsource(provision_workspace)
        assert "SELECT role, user_type" in src
