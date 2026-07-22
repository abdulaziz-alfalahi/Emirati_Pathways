#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NAFIS seeker onboarding via UAE Pass (retires the OTP flow).

- The OTP endpoints (send-otp / verify-otp / accept) are gone → 410.
- The UAE Pass login accepts invitation_type=seeker and stores it in state.
- redeem_seeker_invitation_for_user links the seeker to a proven identity.
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


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config.update({"TESTING": True})
    return a


@pytest.fixture()
def client(app):
    return app.test_client()


# ── OTP endpoints are retired ──────────────────────────────────────

@pytest.mark.parametrize("path", [
    '/api/nafis-talent/public/invitation/tok123/send-otp',
    '/api/nafis-talent/public/invitation/tok123/verify-otp',
    '/api/nafis-talent/public/invitation/tok123/accept',
])
def test_otp_endpoints_are_gone(client, path):
    r = client.post(path, json={})
    assert r.status_code == 410
    assert 'UAE Pass' in r.get_json()['message']


def test_no_in_memory_otp_store_remains():
    import backend.routes.nafis_talent_routes as m
    assert not hasattr(m, '_otp_store'), "the in-memory OTP dict must be gone"


# ── UAE Pass login carries invitation_type=seeker into state ───────

def test_login_stores_seeker_invitation_type(client):
    import backend.routes.uaepass_routes as u
    captured = {}

    class _FakeOAuth:
        def get_authorization_url(self):
            return ('https://stg-id.uaepass.ae/idshub/authorize?x=1', 'state123', 'nonce1')

    def _cap(state, data):
        captured['state'] = state
        captured['data'] = data

    with patch.object(u, 'UAEPassOAuth', _FakeOAuth), \
         patch.object(u, '_store_state', _cap), \
         patch.object(u, '_cleanup_stale_states', lambda: None):
        r = client.get('/api/auth/uaepass/login'
                       '?invitation_token=seekTok&invitation_type=seeker',
                       headers={'Accept': 'application/json'})
    assert r.status_code == 200
    assert captured['data']['invitation_token'] == 'seekTok'
    assert captured['data']['invitation_type'] == 'seeker'


# ── redeem_seeker_invitation_for_user ──────────────────────────────

def _system_with(fetch_results):
    from backend.nafis_talent_system import NafisTalentSystem
    system = NafisTalentSystem()
    system.ensure_tables = MagicMock()
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchone.side_effect = list(fetch_results)
    conn.cursor.return_value.__enter__.return_value = cur
    system._get_db_connection = MagicMock(return_value=conn)
    return system, conn, cur


def test_redeem_links_seeker_to_proven_user():
    # invitation row (unused), then the users existence check.
    system, conn, cur = _system_with([
        {'id': 5, 'seeker_id': 9, 'is_used': False, 'full_name': 'Sara A', 'emirates_id': '784...'},
        {'id': '784000000000420'},
    ])
    res = system.redeem_seeker_invitation_for_user('tok', '784000000000420', is_new_user=True)
    assert res['role'] == 'candidate' and res['seeker_id'] == '9'
    sqls = ' '.join(c.args[0] for c in cur.execute.call_args_list)
    assert 'UPDATE nafis_job_seekers' in sqls and "status = 'profile_created'" in sqls
    assert 'UPDATE seeker_invitations' in sqls
    conn.commit.assert_called_once()


def test_redeem_invalid_token_raises():
    system, conn, cur = _system_with([None])
    with pytest.raises(ValueError):
        system.redeem_seeker_invitation_for_user('bad', '784000000000420')


def test_redeem_already_used_is_benign():
    system, conn, cur = _system_with([
        {'id': 5, 'seeker_id': 9, 'is_used': True, 'full_name': 'Sara A', 'emirates_id': '784...'},
    ])
    res = system.redeem_seeker_invitation_for_user('tok', '784000000000420')
    assert res.get('already_redeemed') is True
    conn.commit.assert_not_called()
