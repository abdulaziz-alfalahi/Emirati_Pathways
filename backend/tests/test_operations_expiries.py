"""/api/operations/expiries — the Monitoring Operator's copy of the expiry card.

Same payload as /api/admin/system/expiries, but reachable by platform_operator
(the Operations Center role), which admin_required refuses.
"""
import os
import sys

import pytest
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend import operations_routes  # noqa: E402
from backend.auth import access_control  # noqa: E402

ITEMS = [
    {'key': 'tls', 'label': 'Public TLS certificate', 'expires_on': '2026-11-21', 'days_left': 76, 'status': 'warning', 'source': 'live'},
    {'key': 'mail', 'label': 'Mail app secret', 'expires_on': '2027-08-23', 'days_left': 351, 'status': 'ok', 'source': 'recorded'},
]


@pytest.fixture
def client(monkeypatch):
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = 'test'
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    JWTManager(app)
    app.register_blueprint(operations_routes.operations_bp)
    # no database in this test: roles come from the token alone
    monkeypatch.setattr(access_control, 'execute_query', lambda *a, **k: None)
    import backend.system_expiries as se
    monkeypatch.setattr(se, 'collect', lambda: [dict(i) for i in ITEMS])
    return app


def _hdr(app, role):
    with app.app_context():
        tok = create_access_token(identity='784000000000170', additional_claims={'role': role})
    return {'Authorization': f'Bearer {tok}'}


def test_the_monitoring_operator_gets_the_same_payload_as_the_admin_card(client):
    r = client.test_client().get('/api/operations/expiries', headers=_hdr(client, 'platform_operator'))
    assert r.status_code == 200, r.get_json()
    j = r.get_json()
    assert j['success'] is True
    assert [i['key'] for i in j['items']] == ['tls', 'mail']
    assert j['worst'] == 'warning'          # the first item is the worst
    assert j['checked_at'].endswith('Z')


def test_a_candidate_is_refused_and_nobody_gets_in_without_a_token(client):
    assert client.test_client().get('/api/operations/expiries', headers=_hdr(client, 'candidate')).status_code == 403
    assert client.test_client().get('/api/operations/expiries').status_code == 401


def test_a_probe_failure_is_a_500_not_a_crash(client, monkeypatch):
    import backend.system_expiries as se
    def boom():
        raise RuntimeError('proxy down')
    monkeypatch.setattr(se, 'collect', boom)
    r = client.test_client().get('/api/operations/expiries', headers=_hdr(client, 'platform_operator'))
    assert r.status_code == 500 and r.get_json()['success'] is False
