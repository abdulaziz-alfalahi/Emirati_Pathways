"""
End-to-end test for Intelligence API endpoints.
Tests all routes against the running backend.
Run: python tests/test_intelligence_api.py
"""

import os
import sys
import json
import requests
import time

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5005")
API_URL = f"{BASE_URL}/api/intelligence"

# For testing without real auth, we create a simple test token
TEST_HEADERS = {"Content-Type": "application/json"}

# Track results
results = []


def test(name, method, url, expected_status=200, data=None, headers=None):
    """Run a single test."""
    h = {**(headers or {}), **TEST_HEADERS}
    try:
        if method == "GET":
            resp = requests.get(url, headers=h, timeout=10)
        else:
            resp = requests.post(url, json=data, headers=h, timeout=10)

        status = "✅ PASS" if resp.status_code == expected_status else f"❌ FAIL (got {resp.status_code})"
        body = resp.json() if resp.headers.get('content-type', '').startswith('application/json') else resp.text[:200]

        results.append({"name": name, "status": resp.status_code, "pass": resp.status_code == expected_status})
        print(f"\n{status} — {name}")
        print(f"  URL: {method} {url}")
        print(f"  Status: {resp.status_code}")
        if isinstance(body, dict):
            # Print a summary, not the entire body
            keys = list(body.keys())
            print(f"  Response keys: {keys}")
            for k in keys:
                v = body[k]
                if isinstance(v, list):
                    print(f"    {k}: [{len(v)} items]")
                elif isinstance(v, dict):
                    print(f"    {k}: {{...{len(v)} keys}}")
                else:
                    print(f"    {k}: {v}")
        return body
    except requests.ConnectionError:
        results.append({"name": name, "status": 0, "pass": False})
        print(f"\n❌ FAIL — {name} — CONNECTION REFUSED (is the backend running?)")
        return None
    except Exception as e:
        results.append({"name": name, "status": -1, "pass": False})
        print(f"\n❌ FAIL — {name} — {e}")
        return None


def main():
    print("=" * 60)
    print("INTELLIGENCE API — END-TO-END TESTS")
    print("=" * 60)
    print(f"Target: {API_URL}")

    # ── 1. PUBLIC ENDPOINTS (no auth needed) ──
    print("\n\n── SKILL TAXONOMY ──")

    taxonomy = test("GET /taxonomy", "GET", f"{API_URL}/taxonomy")

    test("GET /taxonomy?domain=Technology", "GET", f"{API_URL}/taxonomy?domain=Technology")

    print("\n\n── MARKET DEMAND ──")

    demand = test("GET /market-demand", "GET", f"{API_URL}/market-demand")

    test("GET /market-demand?domain=Technology&limit=5", "GET",
         f"{API_URL}/market-demand?domain=Technology&limit=5")

    # ── 2. AUTH-REQUIRED ENDPOINTS ──
    # Since we don't have a real token, these should return 401
    print("\n\n── AUTH-REQUIRED ENDPOINTS (expect 401 without token) ──")

    test("GET /skills (no auth)", "GET", f"{API_URL}/skills", expected_status=401)

    test("POST /skills (no auth)", "POST", f"{API_URL}/skills",
         expected_status=401, data={"skill_id": "python", "proficiency": "advanced"})

    test("POST /skill-gap-analysis (no auth)", "POST", f"{API_URL}/skill-gap-analysis",
         expected_status=401, data={"target_role_id": "software_engineer"})

    test("GET /recommendations (no auth)", "GET", f"{API_URL}/recommendations", expected_status=401)

    test("GET /career-stage (no auth)", "GET", f"{API_URL}/career-stage", expected_status=401)

    # ── SUMMARY ──
    print("\n\n" + "=" * 60)
    passed = sum(1 for r in results if r["pass"])
    total = len(results)
    print(f"RESULTS: {passed}/{total} passed")
    for r in results:
        icon = "✅" if r["pass"] else "❌"
        print(f"  {icon} {r['name']} (HTTP {r['status']})")
    print("=" * 60)

    return all(r["pass"] for r in results)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
