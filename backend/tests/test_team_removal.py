#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Team removal revocation — unit tests (issue #100).

remove_member used to hard-DELETE the membership row only, leaving the
removed user with working access via hr_profiles and
job_postings.recruiter_id. These tests pin the new behavior with the DB
layer mocked — no live database is touched.
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

from backend.company_team_system import CompanyTeamSystem

COMPANY = '11111111-2222-3333-4444-555555555555'
TARGET = '784000012345670'
ACTOR = '784000099999990'


class ScriptedCursor:
    """fetchone() returns queued results in order; records every execute."""

    def __init__(self, fetchone_results):
        self.results = list(fetchone_results)
        self.queries = []
        self.rowcount = 1

    def execute(self, sql, params=None):
        self.queries.append((' '.join(sql.split()), params))

    def fetchone(self):
        return self.results.pop(0) if self.results else None

    def executed(self, fragment):
        return [q for q, _ in self.queries if fragment in q]


def _system_with(cursor):
    system = CompanyTeamSystem()
    conn = MagicMock()
    conn.__enter__ = MagicMock(return_value=conn)
    conn.__exit__ = MagicMock(return_value=False)
    conn.cursor.return_value.__enter__.return_value = cursor
    system.get_db_connection = MagicMock(return_value=conn)
    return system, conn


class TestRemoveMember:
    def test_not_a_member_404(self):
        cur = ScriptedCursor([None])
        system, conn = _system_with(cur)
        r = system.remove_member(COMPANY, TARGET, ACTOR)
        assert r['status'] == 404 and not r['success']
        conn.commit.assert_not_called()

    def test_already_removed_409(self):
        cur = ScriptedCursor([{'id': 'm1', 'role': 'recruiter', 'invitation_status': 'removed'}])
        system, conn = _system_with(cur)
        r = system.remove_member(COMPANY, TARGET, ACTOR)
        assert r['status'] == 409
        conn.commit.assert_not_called()

    def test_last_admin_blocked(self):
        cur = ScriptedCursor([
            {'id': 'm1', 'role': 'admin', 'invitation_status': 'accepted'},
            None,  # _other_admin_exists finds nobody
        ])
        system, conn = _system_with(cur)
        r = system.remove_member(COMPANY, TARGET, ACTOR)
        assert r['status'] == 409 and 'last admin' in r['message']
        conn.commit.assert_not_called()

    def test_full_revocation_path(self):
        cur = ScriptedCursor([
            {'id': 'm1', 'role': 'admin', 'invitation_status': 'accepted'},
            {'1': 1},  # another admin exists
        ])
        system, conn = _system_with(cur)
        r = system.remove_member(COMPANY, TARGET, ACTOR)

        assert r['success'] and r['status'] == 200
        # 1. soft-remove, not DELETE
        assert cur.executed("SET invitation_status = 'removed'")
        assert not cur.executed('DELETE FROM company_team_members')
        # 2. hr_profiles severed
        assert cur.executed('UPDATE hr_profiles SET company_id = NULL')
        # 3. jobs unassigned
        assert cur.executed('UPDATE job_postings SET recruiter_id = NULL')
        # 4. audited
        assert cur.executed('INSERT INTO admin_audit_log')
        conn.commit.assert_called_once()

    def test_recruiter_removal_needs_no_admin_check(self):
        cur = ScriptedCursor([
            {'id': 'm1', 'role': 'recruiter', 'invitation_status': 'accepted'},
        ])
        system, conn = _system_with(cur)
        r = system.remove_member(COMPANY, TARGET, ACTOR)
        assert r['success']
        conn.commit.assert_called_once()


class TestChangeMemberRole:
    def test_invalid_role_400(self):
        system, _ = _system_with(ScriptedCursor([]))
        r = system.change_member_role(COMPANY, TARGET, 'super_admin', ACTOR)
        assert r['status'] == 400

    def test_last_admin_demotion_blocked(self):
        cur = ScriptedCursor([
            {'id': 'm1', 'role': 'admin', 'invitation_status': 'accepted'},
            None,  # no other admin
        ])
        system, conn = _system_with(cur)
        r = system.change_member_role(COMPANY, TARGET, 'recruiter', ACTOR)
        assert r['status'] == 409 and 'last admin' in r['message']
        conn.commit.assert_not_called()

    def test_promotion_and_audit(self):
        cur = ScriptedCursor([
            {'id': 'm1', 'role': 'recruiter', 'invitation_status': 'accepted'},
        ])
        system, conn = _system_with(cur)
        r = system.change_member_role(COMPANY, TARGET, 'admin', ACTOR)
        assert r['success']
        assert cur.executed('UPDATE company_team_members SET role')
        assert cur.executed('INSERT INTO admin_audit_log')
        conn.commit.assert_called_once()

    def test_inactive_member_404(self):
        cur = ScriptedCursor([
            {'id': 'm1', 'role': 'recruiter', 'invitation_status': 'removed'},
        ])
        system, _ = _system_with(cur)
        r = system.change_member_role(COMPANY, TARGET, 'admin', ACTOR)
        assert r['status'] == 404


class TestReinviteAfterRemoval:
    def test_removed_row_is_reactivated_not_blocked(self):
        cur = ScriptedCursor([
            ('784000012345670', 'Test User'),   # user lookup by email
            ('m1', 'removed'),                  # existing membership, removed
        ])
        system, conn = _system_with(cur)
        r = system.invite_member(COMPANY, 'user@example.ae', 'recruiter', ACTOR)
        assert r['success'] and 're-added' in r['message']
        assert cur.executed("invitation_status = 'accepted'")
        conn.commit.assert_called_once()

    def test_active_row_still_blocks(self):
        cur = ScriptedCursor([
            ('784000012345670', 'Test User'),
            ('m1', 'accepted'),
        ])
        system, conn = _system_with(cur)
        r = system.invite_member(COMPANY, 'user@example.ae', 'recruiter', ACTOR)
        assert not r['success'] and 'already in team' in r['message'].lower()
