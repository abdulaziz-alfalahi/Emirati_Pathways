"""Approving a company gives it a workspace.

OWNER, 2026-09-02:

    "The idea is to create a workspace for the company on the platform so the HR
     Manager, recruiters, and their Emirati staff can be in one space... Can we
     have the workspace auto-provisioned once the company joins and creates its
     profile?"

VERIFICATION IS THE TRIGGER, NOT PROFILE CREATION. Verification is the moment a
named operator decides the employer is real — guaranteed to name them since
migration 107 — and it is the same gate that lets the company publish vacancies.
Profile creation is something an unapproved company can do, so provisioning
there would hand a workspace to an employer nobody has approved.

The manual "Provision Workspace" button stays as the repair path, and both paths
now run ONE implementation: two copies of slug generation and admin membership
would drift, and the drift would surface as a workspace an HR manager cannot
open.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import inspect  # noqa: E402

import pytest  # noqa: E402

import workspace_provisioning as wp  # noqa: E402


class FakeCursor:
    def __init__(self, company=None, taken=0, member=None):
        self._company = company
        self._taken = taken
        self._member = member
        self.statements = []
        self._last = None

    def execute(self, sql, params=None):
        self.statements.append((' '.join(sql.split()), params))
        low = sql.lower()
        if 'count(*) as n from companies' in low:
            self._last = {'n': self._taken}
        elif 'from company_team_members' in low and 'select' in low:
            self._last = self._member
        elif 'from companies where id' in low:
            self._last = self._company
        elif 'update companies set' in low:
            self._last = {'id': 'c1', 'company_name': 'ZZ Co',
                          'workspace_slug': params[0], 'workspace_enabled': True,
                          'workspace_admin_id': params[1]}
        else:
            self._last = None

    def fetchone(self):
        return self._last


UNPROVISIONED = {'id': 'c1', 'company_name': 'Al Rostamani Group',
                 'workspace_enabled': False}


# ── the slug ────────────────────────────────────────────────────────────────

def test_a_slug_is_derived_from_the_company_name():
    cur = FakeCursor(taken=0)
    assert wp.slug_for(cur, 'Al Rostamani Group', 'c1') == 'al-rostamani-group'


def test_an_ampersand_becomes_a_word_rather_than_vanishing():
    cur = FakeCursor(taken=0)
    assert wp.slug_for(cur, 'Smith & Sons', 'c1') == 'smith-and-sons'


def test_a_taken_slug_is_made_unique():
    cur = FakeCursor(taken=1)
    slug = wp.slug_for(cur, 'Google', 'abcdef12-3456')
    assert slug.startswith('google-')


def test_an_arabic_company_name_does_not_become_an_arabic_url():
    """`str.isalnum()` is TRUE for Arabic, so the rule inherited from the manual
    route produced the slug "شركة-الإمارات" — non-ASCII in a URL. No company on
    the platform carries an Arabic name today, so it had never shown up, but
    real employers here will."""
    cur = FakeCursor(taken=0)
    slug = wp.slug_for(cur, 'شركة الإمارات', 'abcdef12-3456')
    assert slug.isascii(), slug
    assert slug == 'company-abcdef12'


def test_a_partly_arabic_name_keeps_the_ascii_part():
    cur = FakeCursor(taken=0)
    assert wp.slug_for(cur, 'ADNOC شركة', 'c1') == 'adnoc'


# ── who gets the workspace ──────────────────────────────────────────────────

def test_the_employer_admin_is_preferred_as_workspace_admin():
    cur = FakeCursor(member={'user_id': '784000000000120', 'role': 'employer_admin'})
    assert wp.choose_admin(cur, 'c1') == '784000000000120'
    sql = cur.statements[-1][0].lower()
    assert "invitation_status = 'accepted'" in sql, \
        'the ACL only counts accepted members (#91/#94)'
    assert 'employer_admin' in sql


def test_no_accepted_member_yet_is_not_a_failure():
    """A workspace with no admin is still better than no workspace — and it is
    exactly the state the existing fixtures are in because provisioning was a
    separate step somebody skipped."""
    cur = FakeCursor(member=None)
    assert wp.choose_admin(cur, 'c1') is None


# ── provisioning ────────────────────────────────────────────────────────────

def test_provisioning_enables_the_workspace():
    cur = FakeCursor(company=dict(UNPROVISIONED),
                     member={'user_id': 'u1', 'role': 'employer_admin'})
    row = wp.provision(cur, 'c1', 'operator-1')
    assert row['workspace_enabled'] is True
    assert row['workspace_slug'] == 'al-rostamani-group'


def test_a_company_that_already_has_one_is_a_non_event():
    """Provisioning opportunistically must not error when it has nothing to do."""
    cur = FakeCursor(company=dict(UNPROVISIONED, workspace_enabled=True))
    assert wp.provision(cur, 'c1', 'operator-1') is None


def test_an_unknown_company_returns_none_rather_than_raising():
    cur = FakeCursor(company=None)
    assert wp.provision(cur, 'nope', 'operator-1') is None


def test_the_admin_is_written_into_the_store_the_acl_reads():
    """company_team_members with invitation_status='accepted' is what
    workspace_middleware reads. An admin missing from it cannot open the
    workspace they were just given (#91/#94)."""
    cur = FakeCursor(company=dict(UNPROVISIONED),
                     member={'user_id': 'u1', 'role': 'employer_admin'})
    wp.provision(cur, 'c1', 'operator-1')
    inserts = [s for s, _ in cur.statements if 'insert into company_team_members' in s.lower()]
    assert inserts, 'the workspace admin was never added to the ACL store'
    assert "'accepted'" in inserts[0]


def test_it_does_not_write_the_column_that_broke_every_provision():
    """#92: migration 001 declares users.current_company_id but it was never
    deployed, so writing it raised UndefinedColumn and 500'd every provision
    that named an admin."""
    src = inspect.getsource(wp)
    assert 'current_company_id' not in src.replace('# ', '').split('NOTE (#92)')[0]


# ── it never costs a company its verification ───────────────────────────────

def test_a_provisioning_failure_does_not_raise():
    """Runs after the approval is committed. A workspace problem must never
    cost a company the verification an operator actually decided on."""
    def exploding_connection():
        raise RuntimeError('database on fire')

    assert wp.provision_on_verification(exploding_connection, 'c1', 'op-1') is None


def test_a_missing_connection_is_survived():
    assert wp.provision_on_verification(lambda: None, 'c1', 'op-1') is None


def test_failure_is_logged_loudly():
    """A silently missing workspace is discovered by an HR manager who cannot
    find their own company."""
    src = inspect.getsource(wp.provision_on_verification)
    assert 'logger.error' in src
    assert 'by hand' in src, 'the log should name the repair path'


# ── one implementation, two callers ─────────────────────────────────────────

def test_verification_triggers_provisioning():
    src = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    block = src[src.index('def set_company_verification'):]
    block = block[:block.index('\n    def ', 10)]
    assert 'provision_on_verification' in block
    assert block.index('conn.commit()') < block.index('provision_on_verification'), \
        'provisioning must run after the approval is committed'


def test_revoking_verification_does_not_provision():
    src = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    block = src[src.index('def set_company_verification'):]
    block = block[:block.index('\n    def ', 10)]
    assert 'if verified:' in block


def test_the_manual_route_uses_the_same_implementation():
    """Two copies of slug generation and admin membership would drift, and the
    drift shows up as a workspace an HR manager cannot open."""
    src = open(os.path.join(BACKEND, 'routes', 'workspace_routes.py'),
               encoding='utf-8').read()
    assert 'from workspace_provisioning import provision' in src \
        or 'workspace_provisioning import provision' in src
    assert 'UPDATE companies SET\n                workspace_enabled' not in src, \
        'the route still has its own copy of the provisioning UPDATE'
