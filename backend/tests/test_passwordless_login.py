#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Passwordless-account login handling (issue #94).

UAE-Pass-native accounts (4k+ rows live) carry NULL/empty password_hash;
the retired onboarding wrote an 'otp_only' sentinel. Password login against
any of these used to raise bcrypt ValueError('Invalid salt'), swallowed
into a generic "invalid credentials" — failing closed but undiagnosable.
Now it fails closed with an explicit pointer to UAE Pass, without ever
calling bcrypt.
"""

import os
import sys
from unittest.mock import patch

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.auth.auth_manager_fixed import AuthenticationManager


def _user(password_hash):
    return {
        'id': '784000012345670', 'email': 'user@example.ae',
        'password_hash': password_hash, 'is_active': True,
        'first_name': 'T', 'last_name': 'U', 'role': 'candidate',
        'phone': '', 'emirate': '', 'nationality': 'UAE',
        'is_verified': True,
    }


@pytest.mark.parametrize("stored", [None, '', 'otp_only'])
def test_passwordless_account_gets_uaepass_pointer(stored):
    mgr = AuthenticationManager()
    with patch.object(mgr, '_get_user_by_email', return_value=_user(stored)), \
         patch('bcrypt.checkpw') as checkpw:
        ok, message, data = mgr.authenticate_user('user@example.ae', 'whatever')
    assert ok is False
    assert 'UAE Pass' in message
    assert data is None
    checkpw.assert_not_called()  # bcrypt never sees the sentinel


def test_real_hash_still_verified():
    mgr = AuthenticationManager()
    with patch.object(mgr, '_get_user_by_email',
                      return_value=_user('$2b$12$abcdefghijklmnopqrstuv')), \
         patch('bcrypt.checkpw', return_value=False) as checkpw:
        ok, message, _ = mgr.authenticate_user('user@example.ae', 'wrong')
    assert ok is False
    assert 'UAE Pass' not in message
    checkpw.assert_called_once()
