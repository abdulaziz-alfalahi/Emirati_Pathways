"""The /api/v1 contract gate.

A URL prefix is a naming convention; a failing test is a guarantee. This is the
part that makes the published surface real: once an app is in a store, old
versions live on phones for months and the contract cannot be quietly changed.

WHAT THIS PINS
  1. The exact set of published (path, methods). Adding or removing one requires
     editing V1_SURFACE deliberately — you cannot publish a new endpoint, or
     withdraw one phones may be calling, by accident.
  2. Every v1 path resolves to the SAME view function as its unversioned twin,
     so the two can never drift into different behaviour.
  3. Nothing dangerous is on the surface — no dev-login, no debug routes, no CRM,
     no admin/recruiter operations.
  4. /api/v1/client-status answers without auth or a DB.

WHAT THIS DOES NOT PIN (be honest about the gap)
  Response BODY shapes. Asserting field names and types needs a seeded database,
  which CI does not have. Until there is one, a handler could still rename a JSON
  field without this failing. Tracked in docs/api_versioning_plan.md §3.2.
"""
import os
import sys

import pytest

_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
for p in (os.path.dirname(_backend), _backend):
    if p not in sys.path:
        sys.path.insert(0, p)

from app import create_app  # noqa: E402

try:
    from backend.api_v1 import V1_SURFACE, V1_PREFIX, v1_path_for
except ImportError:  # pragma: no cover
    from api_v1 import V1_SURFACE, V1_PREFIX, v1_path_for


@pytest.fixture(scope='module')
def app():
    return create_app()


def _v1_rules(app):
    """{v1_path: {methods}} actually registered."""
    out = {}
    for r in app.url_map.iter_rules():
        p = str(r)
        if p.startswith(V1_PREFIX + '/'):
            out.setdefault(p, set()).update((r.methods or set()) - {'HEAD', 'OPTIONS'})
    return out


def test_every_published_path_is_actually_mounted(app):
    """A path named in V1_SURFACE that isn't mounted means the contract
    references something moved or deleted — clients would get 404s."""
    live = _v1_rules(app)
    for path, methods in V1_SURFACE.items():
        v1_path = v1_path_for(path)
        assert v1_path in live, f'{v1_path} declared in V1_SURFACE but not mounted'
        missing = methods - live[v1_path]
        assert not missing, f'{v1_path} missing published methods {sorted(missing)}'


def test_no_unexpected_paths_on_the_published_surface(app):
    """Nothing may appear under /api/v1 that V1_SURFACE does not name.
    This is what stops an endpoint being published by accident."""
    declared = {v1_path_for(p) for p in V1_SURFACE}
    declared.add(f'{V1_PREFIX}/client-status')
    unexpected = sorted(set(_v1_rules(app)) - declared)
    assert not unexpected, f'undeclared paths published under /api/v1: {unexpected}'


def test_v1_shares_the_view_function_with_its_unversioned_twin(app):
    """The alias must be the SAME code, or the two surfaces will drift."""
    by_path = {}
    for r in app.url_map.iter_rules():
        by_path.setdefault(str(r), []).append(r)

    checked = 0
    for path in V1_SURFACE:
        v1_path = v1_path_for(path)
        if path not in by_path or v1_path not in by_path:
            continue
        base_views = {app.view_functions[r.endpoint] for r in by_path[path]}
        v1_views = {app.view_functions[r.endpoint] for r in by_path[v1_path]}
        assert v1_views <= base_views, (
            f'{v1_path} does not resolve to the same view function as {path}')
        checked += 1
    assert checked > 30, f'expected the whole surface to be checked, only {checked}'


@pytest.mark.parametrize('forbidden', [
    'dev-login',        # auth bypass — mints a session for any Emirates ID
    'debug-',           # /api/cv/debug-* leaked other users' CVs (PR #323)
    'crm-',             # career-services CRM: EIDs, counselling notes, caseloads
    '/admin',           # operator surface
])
def test_dangerous_routes_are_not_published(app, forbidden):
    offenders = [p for p in _v1_rules(app) if forbidden in p]
    assert not offenders, f'{forbidden!r} must never be on the app surface: {offenders}'


def test_retired_handlers_are_not_published(app):
    """The handlers retired in PR #334 answer 410 — publishing them would put a
    permanently-dead endpoint into a phone contract."""
    retired = ('/api/v1/jobs/apply', '/api/v1/jobs/saved', '/api/v1/jobs/matches',
               '/api/v1/jobs/applications', '/api/v1/candidate/applications')
    live = _v1_rules(app)
    for p in retired:
        assert p not in live, f'retired endpoint {p} must not be published'


def test_v2_profile_island_is_published_under_its_natural_name(app):
    """The /api/v2/profile/* island predates any versioning scheme — a "v2" with
    no v1 predecessor. Published mechanically it would become
    /api/v1/v2/profile/..., baking that accident into a contract phones hold for
    months. It must appear as /api/v1/profile/... instead."""
    live = _v1_rules(app)
    assert not [p for p in live if '/v2/' in p], \
        f'the v2 accident leaked into the published surface: {[p for p in live if "/v2/" in p]}'
    for expected in ('/api/v1/profile/', '/api/v1/profile/readiness',
                     '/api/v1/profile/identity', '/api/v1/profile/education'):
        assert expected in live, f'{expected} missing from the published surface'


def test_v2_profile_paths_still_serve_the_web(app):
    """v2 is NOT retired here — the web calls it from five places. Only the
    published NAME changed; the original path must keep working."""
    rules = {str(r) for r in app.url_map.iter_rules()}
    for p in ('/api/v2/profile/', '/api/v2/profile/readiness'):
        assert p in rules, f'{p} must keep serving the web until callers move'


def test_client_status_needs_no_auth_and_no_db(app):
    """A client that cannot authenticate — or hits an outage — must still be able
    to learn whether it is too old. So: public, and no database."""
    resp = app.test_client().get(f'{V1_PREFIX}/client-status')
    assert resp.status_code == 200
    body = resp.get_json()
    for key in ('min_supported_version', 'latest_version', 'message', 'store_urls'):
        assert key in body, f'client-status missing {key}'
    assert {'en', 'ar'} <= set(body['message']), 'upgrade message must be bilingual'


def test_client_status_defaults_block_nobody(app, monkeypatch):
    """With nothing configured no client may be blocked — locking users out must
    be a deliberate operational act, never a missing env var."""
    for var in ('CLIENT_MIN_SUPPORTED_VERSION', 'CLIENT_LATEST_VERSION'):
        monkeypatch.delenv(var, raising=False)
    body = app.test_client().get(f'{V1_PREFIX}/client-status').get_json()
    assert body['min_supported_version'] == '0.0.0'
