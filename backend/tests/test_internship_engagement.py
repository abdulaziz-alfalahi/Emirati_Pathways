"""
Internship engagement — the 3-way handshake blueprint.

Covers: route registration, auth gating (401 unauthenticated), and the
pure confirm-condition logic mirrored from _maybe_confirm.
"""
import os

import pytest

from app import create_app


@pytest.fixture(scope="module")
def app():
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
    test_app = create_app()
    test_app.config.update({"TESTING": True})
    return test_app


@pytest.fixture()
def client(app):
    return app.test_client()


def test_engagement_routes_registered(app):
    rules = {r.rule for r in app.url_map.iter_rules()}
    for expected in (
        "/api/internship-engagement/opportunities",
        "/api/internship-engagement/propose",
        "/api/internship-engagement/coordinator",
        "/api/internship-engagement/recruiter",
        "/api/internship-engagement/relevant",
        "/api/internship-engagement/apply",
        "/api/internship-engagement/mine",
        "/api/internship-engagement/children",
        "/api/internship-engagement/<int:eng_id>/recruiter-decision",
        "/api/internship-engagement/<int:eng_id>/student-decision",
        "/api/internship-engagement/<int:eng_id>/coordinator-decision",
        "/api/internship-engagement/<int:eng_id>/parent-consent",
        "/api/internship-engagement/<int:eng_id>/begin",
        "/api/internship-engagement/<int:eng_id>/complete",
    ):
        assert expected in rules, f"route missing: {expected}"


@pytest.mark.parametrize("method,path", [
    ("GET", "/api/internship-engagement/opportunities"),
    ("POST", "/api/internship-engagement/propose"),
    ("GET", "/api/internship-engagement/recruiter"),
    ("GET", "/api/internship-engagement/relevant"),
    ("POST", "/api/internship-engagement/apply"),
    ("GET", "/api/internship-engagement/children"),
    ("POST", "/api/internship-engagement/1/recruiter-decision"),
    ("POST", "/api/internship-engagement/1/student-decision"),
    ("POST", "/api/internship-engagement/1/parent-consent"),
    ("POST", "/api/internship-engagement/1/begin"),
])
def test_endpoints_require_auth(client, method, path):
    resp = client.open(path, method=method, json={})
    assert resp.status_code == 401, f"{method} {path} -> {resp.status_code} (want 401)"


def _ready(e):
    """Mirror of _maybe_confirm's readiness condition."""
    return (
        e["recruiter_status"] == "approved"
        and e["student_status"] == "accepted"
        and e["coordinator_status"] == "approved"
        and e["parent_consent_status"] in ("not_required", "granted")
    )


def test_confirm_conditions():
    base = dict(recruiter_status="approved", student_status="accepted",
                coordinator_status="approved", parent_consent_status="not_required")
    assert _ready(base)                                                    # adult, all in
    assert _ready({**base, "parent_consent_status": "granted"})            # minor, consented
    assert not _ready({**base, "parent_consent_status": "pending"})        # minor, waiting
    assert not _ready({**base, "parent_consent_status": "denied"})         # minor, denied
    assert not _ready({**base, "recruiter_status": "pending"})             # recruiter outstanding
    assert not _ready({**base, "student_status": "pending"})               # student outstanding
    assert not _ready({**base, "coordinator_status": "pending"})           # coordinator outstanding
