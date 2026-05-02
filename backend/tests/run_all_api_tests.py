#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Emirati Platform — Run All API Flow Tests
==========================================

Executes all 4 flow test suites and produces a combined summary.

Usage:
    cd backend
    python tests/run_all_api_tests.py

    # Override the backend URL:
    API_BASE_URL=http://10.61.192.35:5005 python tests/run_all_api_tests.py

    # Run a specific flow only:
    python tests/test_flow_cv.py
    python tests/test_flow_matching.py
    python tests/test_flow_nafis.py
    python tests/test_flow_growth.py
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api_test_utils import BASE_URL

# Import all flow test runners
from test_flow_cv import run_cv_flow_tests
from test_flow_matching import run_matching_flow_tests
from test_flow_nafis import run_nafis_flow_tests
from test_flow_growth import run_growth_flow_tests


def main():
    print()
    print("=" * 60)
    print("  EMIRATI PLATFORM — FULL API TEST SUITE")
    print(f"  Target: {BASE_URL}")
    print(f"  Time:   {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    all_results = []

    # Check if server is reachable
    try:
        import requests
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"\n  Server health: HTTP {r.status_code}")
        if r.status_code >= 500:
            print("  WARNING: Server returned 5xx — tests may fail")
    except Exception as e:
        print(f"\n  ⚠️  Cannot reach server at {BASE_URL}: {e}")
        print("  Make sure the backend is running: cd backend && python app.py")
        sys.exit(1)

    # Run all flows
    flows = [
        ("Flow 1: CV Upload & Parsing", run_cv_flow_tests),
        ("Flow 2: JD Matching", run_matching_flow_tests),
        ("Flow 3: NAFIS Talent", run_nafis_flow_tests),
        ("Flow 4: Growth Operator", run_growth_flow_tests),
    ]

    for name, runner in flows:
        try:
            result = runner()
            all_results.append((name, result))
        except Exception as e:
            print(f"\n  💥 CRASH in {name}: {e}")
            # Create a dummy result
            from api_test_utils import TestResults
            crash_result = TestResults(name)
            crash_result.fail("Suite Execution", str(e))
            all_results.append((name, crash_result))

    # ── Grand Summary ────────────────────────────────────────
    print()
    print()
    print("=" * 60)
    print("  GRAND SUMMARY")
    print("=" * 60)

    total_passed = 0
    total_failed = 0
    total_skipped = 0

    for name, result in all_results:
        status = "✅" if result.failed == 0 else "❌"
        print(f"  {status} {name}: {result.passed}P / {result.failed}F / {result.skipped}S")
        total_passed += result.passed
        total_failed += result.failed
        total_skipped += result.skipped

    print()
    print(f"  TOTAL: {total_passed} passed | {total_failed} failed | {total_skipped} skipped")

    if total_failed == 0:
        print("\n  🎉 ALL TESTS PASSED!")
    else:
        print(f"\n  ⚠️  {total_failed} test(s) FAILED — review output above")

    print("=" * 60)
    print()

    return total_failed == 0


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
