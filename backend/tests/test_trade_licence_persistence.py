#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Trade licence / company_code persistence — unit tests (issue #98).
"""

import os
import sys

import pytest

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_root_dir, _backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.company_identity import clean_trade_license


class TestCleanTradeLicense:
    def test_trims_and_collapses(self):
        assert clean_trade_license('  CN-1234567  ') == 'CN-1234567'
        assert clean_trade_license('CN  1234567') == 'CN 1234567'

    def test_preserves_case(self):
        assert clean_trade_license('cn-123456') == 'cn-123456'

    @pytest.mark.parametrize("junk", [None, '', '   ', '--', '..', 'ab', 'x' * 65])
    def test_junk_rejected(self, junk):
        assert clean_trade_license(junk) is None

    def test_minimum_viable(self):
        assert clean_trade_license('123') == '123'


class TestRedemptionPersistsInviteFields:
    """The existing-company branch of redeem_invitation_for_user must
    COALESCE-update licence/code/sector/phone instead of discarding them."""

    def test_update_statement_present_in_source(self):
        # Structural pin: the branch exists and fills gaps without
        # overwriting (COALESCE), for exactly these columns.
        import inspect
        from backend.growth_system import GrowthSystem
        src = inspect.getsource(GrowthSystem.redeem_invitation_for_user)
        assert 'trade_license_no = COALESCE(trade_license_no' in src
        assert 'company_code = COALESCE(company_code' in src
        assert 'industry = COALESCE(industry' in src
        # and the create branch persists the code too
        assert 'company_code' in src.split('INSERT INTO companies', 1)[1]
