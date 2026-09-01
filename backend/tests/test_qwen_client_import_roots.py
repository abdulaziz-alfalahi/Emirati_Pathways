"""qwen_client must import under both roots the app actually runs under.

Found 2026-09-01 while verifying the Arabic naming fix on staging. The module
reached its config with a bare

    from backend.config.qwen_config import ...

so importing it as `services.qwen_client` — the form used in the fallback branch
of every caller, including routes/ai_assist_routes.py — raised
ModuleNotFoundError from inside the module rather than from the import itself.
The caller's `except ImportError` then had nothing left to fall back to.

Nothing was broken in production: the image carries a `/backend -> /app`
symlink, so the `backend.*` root resolves there and the first branch always
won. But that made the second branch dead code that looked live, and it is the
branch every caller falls back to.

This asserts behaviour rather than source text — a comment mentioning the
pattern would satisfy a grep, and only an actual import proves the fallback.
"""
import os
import subprocess
import sys

import pytest

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(BACKEND)


def _import_in(cwd, statement):
    """Import in a clean interpreter — sys.modules caching in this process
    would hide exactly the failure being tested."""
    return subprocess.run(
        [sys.executable, '-c', statement],
        cwd=cwd, capture_output=True, text=True, timeout=120,
        # A missing API key must not be mistaken for an import failure.
        env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
    )


@pytest.mark.parametrize('cwd, statement, root', [
    (REPO, 'from backend.services.qwen_client import chat_completion', 'backend.*'),
    (BACKEND, 'from services.qwen_client import chat_completion', 'top-level'),
])
def test_qwen_client_imports_under_both_roots(cwd, statement, root):
    result = _import_in(cwd, statement)
    assert result.returncode == 0, (
        f'qwen_client does not import under the {root} root:\n{result.stderr}')


@pytest.mark.parametrize('cwd, statement, root', [
    (REPO, 'from backend.config.qwen_config import get_model_for_task', 'backend.*'),
    (BACKEND, 'from config.qwen_config import get_model_for_task', 'top-level'),
])
def test_the_config_it_depends_on_imports_under_both_roots(cwd, statement, root):
    """The fallback in qwen_client is only worth anything if what it imports is
    reachable from the other root too."""
    result = _import_in(cwd, statement)
    assert result.returncode == 0, (
        f'qwen_config does not import under the {root} root:\n{result.stderr}')
