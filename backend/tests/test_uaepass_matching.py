#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UAE Pass account matching — unit tests (issue #95).

Covers contact_identity canonicalisation and the _refuse_contact_link /
matching-order behavior of _find_or_create_user with the DB mocked.
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

from backend.utils.contact_identity import (
    canonical_email, canonical_phone, phone_match_variants,
)


class TestCanonicalEmail:
    def test_lowercases_and_trims(self):
        assert canonical_email('  Ali@Company.AE ') == 'ali@company.ae'

    @pytest.mark.parametrize("empty", [None, '', '   '])
    def test_empty(self, empty):
        assert canonical_email(empty) == ''


class TestCanonicalPhone:
    @pytest.mark.parametrize("raw", [
        '+971 50 123 4567', '00971501234567', '0501234567',
        '501234567', '971501234567', '971-50-123-4567',
    ])
    def test_all_spellings_converge(self, raw):
        assert canonical_phone(raw) == '971501234567'

    @pytest.mark.parametrize("junk", ['0', '', None, '12345', '00000000'])
    def test_junk_rejected(self, junk):
        assert canonical_phone(junk) == ''

    def test_variants_cover_legacy_formats(self):
        v = set(phone_match_variants('0501234567'))
        assert {'971501234567', '+971501234567', '0501234567',
                '501234567', '00971501234567'} == v

    def test_variants_empty_for_junk(self):
        assert phone_match_variants('0') == []


# ── _refuse_contact_link ────────────────────────────────────────────

from backend.routes.uaepass_routes import _refuse_contact_link


class FakeCursor:
    def __init__(self, ctm_row=None):
        self.ctm_row = ctm_row
        self.queries = []

    def execute(self, sql, params=None):
        self.queries.append(' '.join(sql.split()))

    def fetchone(self):
        return self.ctm_row


def _row(role='candidate', user_type=None, secondary=None, uid='784000012345670'):
    return {'id': uid, 'role': role, 'user_type': user_type,
            'secondary_roles': secondary}


class TestRefuseContactLink:
    def test_plain_candidate_links(self):
        assert _refuse_contact_link(FakeCursor(None), _row(), 'email') is False

    @pytest.mark.parametrize("role", ['recruiter', 'employer_admin', 'admin',
                                      'growth_operator', 'hr_manager'])
    def test_privileged_primary_role_refused(self, role):
        assert _refuse_contact_link(FakeCursor(None), _row(role=role), 'email') is True

    def test_privileged_legacy_user_type_refused(self):
        assert _refuse_contact_link(
            FakeCursor(None), _row(role='candidate', user_type='recruiter'), 'phone') is True

    def test_privileged_secondary_role_refused(self):
        assert _refuse_contact_link(
            FakeCursor(None), _row(secondary=['recruiter']), 'email') is True

    def test_secondary_roles_as_json_string(self):
        assert _refuse_contact_link(
            FakeCursor(None), _row(secondary='["employer_admin"]'), 'email') is True

    def test_company_membership_refused_even_for_candidate(self):
        cur = FakeCursor(ctm_row={'1': 1})
        assert _refuse_contact_link(cur, _row(), 'email') is True
        assert any('company_team_members' in q for q in cur.queries)
