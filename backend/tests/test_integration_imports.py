"""
Import-integrity test: the core service/route modules must import without error.

Previously this file printed results and swallowed ImportError, so it could
never fail CI (it would not have caught, e.g., the assessor `require_role`
import break). It now asserts. Each module is tried under both import roots
(the app runs as top-level `X` in CI/Docker and as `backend.X` elsewhere —
see CLAUDE.md), failing only if BOTH roots fail.
"""
import importlib


def _import_either(*candidates):
    """Return the first module that imports; raise the last error if all fail."""
    last_err = None
    for name in candidates:
        try:
            return importlib.import_module(name)
        except ImportError as e:  # try the next root
            last_err = e
    raise last_err


def test_profile_v2_service_imports():
    mod = _import_either("services.profile_v2_service", "backend.services.profile_v2_service")
    assert hasattr(mod, "ProfileV2Service")


def test_enhanced_matching_service_imports():
    mod = _import_either(
        "services.enhanced_matching_service", "backend.services.enhanced_matching_service"
    )
    assert hasattr(mod, "enhanced_matching_engine")


def test_candidate_job_routes_imports():
    mod = _import_either("candidate_job_routes", "backend.candidate_job_routes")
    assert mod is not None
