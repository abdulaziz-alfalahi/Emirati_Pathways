"""The guard that keeps the test suite out of the live database.

This is the one piece of test infrastructure whose failure is silent and
expensive: if it stops recognising dghr_prod, nothing goes red — the suite just
quietly starts writing production data again, which is exactly what happened on
three separate occasions before the guard existed.

So the detector is tested directly, including the forms a connection can take.
"""
import importlib.util
import os

_spec = importlib.util.spec_from_file_location(
    "_conftest_under_test",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "conftest.py"))
_conftest = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_conftest)

is_live = _conftest._is_live_target
LIVE_HOST = "10.228.145.66"
LIVE_NAME = "dghr_prod"


# ── The forms a live connection actually arrives in ──────────────────────────

def test_keyword_host_is_caught():
    assert is_live((), {"host": LIVE_HOST, "dbname": "anything"}) is True


def test_keyword_dbname_is_caught():
    """Host alone is not enough — the live DB is reachable by other names/IPs,
    and the database name is the thing that identifies it."""
    assert is_live((), {"host": "somewhere-else", "dbname": LIVE_NAME}) is True


def test_the_legacy_database_kwarg_is_caught():
    """psycopg2 accepts both `dbname` and `database`. Older modules in this
    codebase use the second one."""
    assert is_live((), {"database": LIVE_NAME}) is True


def test_a_positional_dsn_is_caught():
    assert is_live((f"host={LIVE_HOST} dbname={LIVE_NAME} user=x",), {}) is True


def test_a_url_style_dsn_is_caught():
    assert is_live((f"postgresql://u:p@{LIVE_HOST}:5454/{LIVE_NAME}",), {}) is True


# ── What must NOT be caught, or CI breaks ────────────────────────────────────

def test_the_ci_postgres_service_is_not_live():
    """CI bridges DATABASE_URL to DB_*. If the guard fired there, every run
    would skip its way to a false green."""
    assert is_live((), {"host": "localhost", "dbname": "test_emirati"}) is False


def test_a_throwaway_container_is_not_live():
    assert is_live((), {"host": "127.0.0.1", "dbname": "test"}) is False


def test_an_empty_call_is_not_live():
    """psycopg2.connect() with no arguments reads libpq environment defaults.
    Treating that as live would skip tests for no reason."""
    assert is_live((), {}) is False


# ── The property that makes the guard usable at all ──────────────────────────

def test_skipped_is_not_an_exception():
    """The guard raises via pytest.skip. Half these test modules wrap DB work in
    `except Exception: conn.rollback()` — the pattern that kept this bug silent
    for twelve days. Skipped derives from BaseException precisely so it passes
    through those handlers instead of being swallowed.
    """
    from _pytest.outcomes import Skipped
    assert issubclass(Skipped, BaseException)
    assert not issubclass(Skipped, Exception)


def test_the_override_is_opt_in_not_opt_out():
    """The guard must be on by default. A guard you have to remember to enable
    is not a guard."""
    assert _conftest._ALLOW_LIVE is (os.getenv("ALLOW_LIVE_DB_TESTS") == "1")
