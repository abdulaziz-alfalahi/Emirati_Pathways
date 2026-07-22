#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Operator/team POST endpoints must not 500 on a missing Content-Type (#121).

`request.json` raises 415 when the header isn't application/json, and the
catch-all wraps that into a 500 — misleading triage. `get_json(silent=True)`
returns None instead, so a bodyless/headerless POST degrades to a clean
auth/validation response, never a 500.
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
    test_app = create_app()
    test_app.config.update({"TESTING": True})
    return test_app


@pytest.fixture()
def client(app):
    return app.test_client()


def _auth(app, role='growth_operator'):
    with app.app_context():
        token = create_access_token(identity='784000099999990',
                                    additional_claims={'role': role})
    return {'Authorization': f'Bearer {token}'}


def test_verify_company_no_content_type_not_415(app, client):
    # POST with NO Content-Type and NO body used to raise 415 (wrapped 500).
    # Mock the DB-backed verification so the ONLY thing under test is that
    # the handler parses past the missing Content-Type and reaches its
    # normal logic (here: a clean 200), never a 415/500 from request.json.
    with patch('backend.routes.growth_routes.growth_sys.set_company_verification',
               return_value={'id': '11111111-2222-3333-4444-555555555555',
                             'is_verified': True}):
        r = client.post(
            '/api/growth/companies/11111111-2222-3333-4444-555555555555/verify',
            headers=_auth(app), data='')
    assert r.status_code == 200, r.get_data(as_text=True)


def test_no_bare_request_json_in_operator_routes():
    """Guard: bare `request.json` reintroduces the 415→500 bug."""
    offenders = []
    for rel in ('routes/growth_routes.py', 'routes/company_team_routes.py'):
        src = open(os.path.join(_backend_dir, rel), encoding='utf-8').read()
        for i, line in enumerate(src.splitlines(), 1):
            if re.search(r'request\.json\b(?! ?\()', line) and not line.strip().startswith('#'):
                offenders.append(f"{rel}:{i}")
    assert offenders == [], f"bare request.json (use get_json(silent=True)): {offenders}"
