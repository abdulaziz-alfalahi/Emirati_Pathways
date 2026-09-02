"""A company is verified only when somebody stands behind the decision.

FOUND 2026-09-02 while reviewing the company workspace workflow:

    companies ....................................... 278
    holding a real trade licence .................... 269
    VERIFIED ......................................... 9
    verified AND holding a trade licence ............. 0
    verified with verified_by set .................... 0

The nine were Airbus, Amazon, Google, HSBC, JPMorgan, Marriott, Microsoft,
Pfizer and Shell — seeded rows inserted with is_verified = TRUE. Nobody approved
any of them: verified_by and verified_at were NULL throughout, so the approval
gate had never been exercised by a person at all.

WHY THAT MATTERED RATHER THAN BEING UNTIDY

`is_verified` is what `_unverified_company_block` reads before a vacancy may be
published (issue #96). So the only employers on the platform who could reach a
candidate were nine seeded multinationals, while 269 companies holding genuine
UAE trade licences — including the one real company with a provisioned
workspace — could not.

Migration 107 cleared them and added a CHECK constraint. These tests cover the
application side, which exists so an operator gets a sentence they can act on
instead of a constraint violation surfacing as a 500.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import inspect  # noqa: E402
import re  # noqa: E402

import pytest  # noqa: E402


def _growth_system():
    import growth_system
    return growth_system


def test_verifying_without_an_approver_is_refused():
    gs = _growth_system()

    class Probe(gs.GrowthSystem):
        def __init__(self):
            pass

        def _get_db_connection(self):                    # pragma: no cover
            raise AssertionError('the database was reached despite no approver')

    with pytest.raises(ValueError) as exc:
        Probe().set_company_verification('some-company', True, verified_by=None)
    assert 'approved' in str(exc.value).lower()


def test_the_refusal_happens_before_any_database_work():
    """A guard that runs after opening a connection still leaves the door open
    if the connection fails first; and it wastes a connection on a request that
    was never going to succeed."""
    src = inspect.getsource(
        _growth_system().GrowthSystem.set_company_verification)
    guard = src.index('if verified and not verified_by')
    connect = src.index('_get_db_connection')
    assert guard < connect


def test_REVOKING_verification_needs_no_approver():
    """Removing an approval is a safety action. Requiring an id to withdraw one
    would mean a company stayed verified because nobody could be identified —
    exactly backwards."""
    src = inspect.getsource(
        _growth_system().GrowthSystem.set_company_verification)
    assert 'if verified and not verified_by' in src, \
        'the guard must be conditional on verified, not on every call'


def test_the_route_refuses_rather_than_500ing():
    src = open(os.path.join(BACKEND, 'routes', 'growth_routes.py'),
               encoding='utf-8').read()
    block = src[src.index('def verify_company') if 'def verify_company' in src
                else src.index('set_company_verification') - 2000:]
    block = block[:block.index('@growth_bp.route', 10)] if '@growth_bp.route' in block[10:] else block
    assert 'except ValueError' in block, 'the guard surfaces as a 500'
    assert '400' in block


def test_the_route_does_not_verify_with_an_unknown_identity():
    """The identity lookup swallows its own failure, so a JWT problem would
    otherwise send verified_by=None to the database."""
    src = open(os.path.join(BACKEND, 'routes', 'growth_routes.py'),
               encoding='utf-8').read()
    assert 'if verified and not verified_by' in src


# ── the migration states the invariant it enforces ──────────────────────────

MIGRATION = os.path.join(BACKEND, 'migrations',
                         '107_verification_requires_an_approver.sql')


def test_the_constraint_requires_an_approver_not_a_trade_licence():
    """Deliberate: company identity resolves on the trade licence, while
    verification is about who approved. Requiring a licence here would block a
    legitimate approval routed through MOHRE provenance."""
    sql = open(MIGRATION, encoding='utf-8').read()
    check = re.search(r'CHECK \((.+?)\)\s*;', sql, re.S).group(1)
    assert 'verified_by IS NOT NULL' in check
    assert 'trade_license' not in check


def test_the_migration_backs_up_before_it_clears():
    sql = open(MIGRATION, encoding='utf-8').read()
    assert sql.index('CREATE TABLE IF NOT EXISTS _backup_unapproved_verification_107') \
        < sql.index('UPDATE companies')


def test_it_only_clears_rows_nobody_approved():
    """A company an operator genuinely approved must not be swept up with the
    seeds."""
    sql = open(MIGRATION, encoding='utf-8').read()
    update = sql[sql.index('UPDATE companies'):]
    update = update[:update.index(';')]
    assert 'verified_by IS NULL' in update
