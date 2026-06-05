#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Test Runner — Emirati Human Development Platform
=====================================================

Shared utilities and configuration for all flow test scripts.
Handles authentication, assertions, and colored output.

Usage:
    # Run all tests:
    cd backend
    python tests/run_all_api_tests.py

    # Run a specific flow:
    python tests/test_flow_cv.py
    python tests/test_flow_matching.py
    python tests/test_flow_nafis.py
    python tests/test_flow_growth.py

Environment variables:
    API_BASE_URL   — Backend URL (default: http://localhost:5005)
    TEST_PHONE     — Phone number for OTP login (default: +971511234567)
    MAGIC_OTP      — OTP code (default: 123456)
"""

import os
import sys
import json
import time
import traceback
from datetime import datetime

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not installed. Run: pip install requests")
    sys.exit(1)

# ─── Configuration ──────────────────────────────────────────────────
BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5005')
TEST_PHONE = os.getenv('TEST_PHONE', '+971511234567')
MAGIC_OTP = os.getenv('MAGIC_OTP', '123456')

# ─── Test Result Tracking ───────────────────────────────────────────

class TestResults:
    """Collects pass/fail counts and details for a test suite."""

    def __init__(self, suite_name: str):
        self.suite_name = suite_name
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.details: list = []
        self._start = time.time()

    def ok(self, name: str, info: str = ''):
        self.passed += 1
        self.details.append(('PASS', name, info))
        print(f"  ✅ PASS — {name}" + (f"  ({info})" if info else ''))

    def fail(self, name: str, reason: str):
        self.failed += 1
        self.details.append(('FAIL', name, reason))
        print(f"  ❌ FAIL — {name}")
        print(f"           Reason: {reason}")

    def skip(self, name: str, reason: str):
        self.skipped += 1
        self.details.append(('SKIP', name, reason))
        print(f"  ⏭️  SKIP — {name}: {reason}")

    def summary(self) -> bool:
        elapsed = time.time() - self._start
        total = self.passed + self.failed + self.skipped
        print()
        print("=" * 60)
        print(f"  {self.suite_name} — {total} tests in {elapsed:.1f}s")
        print(f"  ✅ {self.passed} passed  |  ❌ {self.failed} failed  |  ⏭️  {self.skipped} skipped")
        if self.failed:
            print("  ──────────────────────────────")
            for status, name, info in self.details:
                if status == 'FAIL':
                    print(f"  ❌ {name}: {info}")
        print("=" * 60)
        return self.failed == 0


# ─── HTTP Helpers ───────────────────────────────────────────────────

def api(method: str, path: str, token: str = None, **kwargs) -> requests.Response:
    """Make an API call and return the response."""
    url = f"{BASE_URL}{path}"
    headers = kwargs.pop('headers', {})
    if token:
        headers['Authorization'] = f'Bearer {token}'
    timeout = kwargs.pop('timeout', 30)
    return requests.request(method, url, headers=headers, timeout=timeout, **kwargs)


def get_auth_token(phone: str = None, otp: str = None) -> str:
    """Authenticate via UAE Pass Dev-Login and return the access token."""
    phone = phone or TEST_PHONE

    # Step 1: Fetch available dev users to find the correct EID
    r = api('GET', '/api/auth/uaepass/dev-login/users')
    if r.status_code != 200:
        raise RuntimeError(f"Failed to fetch dev users ({r.status_code}): {r.text[:200]}")
    
    users = r.json().get('users', [])
    target_user = next((u for u in users if u.get('phone') == phone), None)
    
    if not target_user and users:
        target_user = users[0]  # Fallback to first user
        
    if not target_user:
        raise RuntimeError("No dev users available in the database for testing")
        
    user_id = target_user['id']

    # Step 2: Login via dev-login bypass
    r = api('POST', '/api/auth/uaepass/dev-login', json={'user_id': user_id})
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Dev login failed ({r.status_code}): {r.text[:200]}")

    data = r.json()
    token = (
        data.get('access_token')
        or data.get('data', {}).get('access_token')
        or data.get('token')
    )
    if not token:
        raise RuntimeError(f"No token in response: {json.dumps(data)[:300]}")

    return token


def assert_success(r: requests.Response, test_name: str, results: TestResults, extra_checks=None):
    """Common assertion: 2xx status + success=true in JSON body."""
    try:
        if r.status_code >= 400:
            results.fail(test_name, f"HTTP {r.status_code}: {r.text[:200]}")
            return None
        body = r.json()
        if body.get('success') is False:
            results.fail(test_name, f"success=false: {body.get('error') or body.get('message', '')}")
            return None
        if extra_checks:
            msg = extra_checks(body)
            if msg:
                results.fail(test_name, msg)
                return None
        results.ok(test_name)
        return body
    except Exception as e:
        results.fail(test_name, str(e))
        return None


def assert_status(r: requests.Response, expected: int, test_name: str, results: TestResults):
    """Assert a specific HTTP status code."""
    if r.status_code == expected:
        results.ok(test_name, f"HTTP {r.status_code}")
    else:
        results.fail(test_name, f"Expected HTTP {expected}, got {r.status_code}: {r.text[:200]}")


def print_header(title: str):
    print()
    print("─" * 60)
    print(f"  {title}")
    print("─" * 60)
