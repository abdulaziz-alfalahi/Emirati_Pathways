"""
Boot-integrity guard.

Builds the app and asserts every blueprint registered cleanly. This is the
test that would have caught the two registration defects fixed on 2026-07-24:

  * the legacy ``backend.routes.assessor_routes`` blueprint failed to import
    (``require_role`` — singular — does not exist) and was silently swallowed,
    so ``/api/assessor/operator/stats`` 404'd for the frontend; and
  * ``recruiter_interviews`` was registered twice (blueprint_registry.py AND
    app.py's additional list), logging an ERROR on every boot.

Neither was covered by any existing test because both failure paths are caught
and logged rather than raised.
"""
import os
import logging

import pytest

from app import create_app


@pytest.fixture(scope="module")
def app():
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
    test_app = create_app()
    test_app.config.update({"TESTING": True})
    return test_app


def test_app_builds(app):
    assert app is not None


def test_no_blueprint_registration_errors(caplog):
    """create_app() must not log a duplicate/failed blueprint registration."""
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
    with caplog.at_level(logging.WARNING):
        create_app()
    offenders = [
        r.getMessage()
        for r in caplog.records
        if "already registered" in r.getMessage()
        or "Failed to register" in r.getMessage()
    ]
    assert not offenders, "blueprint registration problems at boot:\n" + "\n".join(offenders)


def test_expected_routes_present(app):
    """Endpoints the frontend depends on must be routable."""
    rules = {r.rule for r in app.url_map.iter_rules()}
    for expected in (
        "/api/assessor/dashboard",
        "/api/assessor/operator/stats",   # ported from the retired assessor_routes
        "/api/recruiter/interviews",      # was double-registered; must remain present
    ):
        assert any(rule == expected or rule.startswith(expected + "/") or rule == expected
                   for rule in rules), f"expected route missing: {expected}"


def test_recruiter_interviews_registered_once(app):
    """The recruiter interview blueprint is present exactly once (a duplicate
    registration would have raised at create_app time)."""
    assert list(app.blueprints).count("recruiter_interviews") == 1
