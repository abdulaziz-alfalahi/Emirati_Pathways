#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flow 2: Recruiter JD Matching — API Tests
==========================================
Tests JD upload, candidate matching, employment status filtering,
and the offline matching accuracy script.
"""
import os, sys, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api_test_utils import (
    TestResults, api, get_auth_token, assert_success, print_header, BASE_URL
)

# Recruiter test phone — uses Zara Saeed's magic number
RECRUITER_PHONE = os.getenv('RECRUITER_PHONE', '+971512345678')


def run_matching_flow_tests():
    print_header("FLOW 2: RECRUITER JD MATCHING")
    results = TestResults("JD Matching Flow")

    # ── Auth as Recruiter ────────────────────────────────────
    try:
        token = get_auth_token(phone=RECRUITER_PHONE)
        results.ok("2.0 Recruiter Authentication", "Token acquired")
    except Exception as e:
        results.fail("2.0 Recruiter Authentication", str(e))
        results.summary()
        return results

    # ── 2.1 List Published JDs ───────────────────────────────
    jd_id = None
    r = api('GET', '/api/recruiter/jd/list', token=token)
    if r.status_code < 400:
        body = r.json()
        jds = body.get('jds') or body.get('job_descriptions') or body.get('data') or []
        results.ok("2.1 List JDs", f"Found {len(jds)} JDs")
        # Pick the first published JD for matching
        for jd in jds:
            if jd.get('status') == 'published':
                jd_id = jd.get('jd_id') or jd.get('id')
                break
        if not jd_id and jds:
            jd_id = jds[0].get('jd_id') or jds[0].get('id')
    else:
        results.fail("2.1 List JDs", f"HTTP {r.status_code}: {r.text[:200]}")

    # ── 2.2 Upload / Create a JD ─────────────────────────────
    test_jd_payload = {
        "title": "Senior Python Developer (API Test)",
        "description": "Looking for a senior Python developer with cloud experience for our Dubai team.",
        "requirements": {
            "skills": ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
            "experience": ["5 years backend development"],
            "education": ["Bachelor in Computer Science"]
        },
        "responsibilities": ["Design scalable APIs", "Manage cloud infrastructure"],
        "basic_info": {
            "title": "Senior Python Developer (API Test)",
            "emirate": "Dubai",
            "job_type": "full_time",
            "job_level": "senior"
        }
    }

    # Try different known endpoints for JD creation
    created_jd_id = None
    for endpoint in ['/api/recruiter/jd/upload', '/api/recruiter/jd/create', '/api/recruiter/jd']:
        r = api('POST', endpoint, token=token, json=test_jd_payload)
        if r.status_code < 400:
            body = r.json()
            created_jd_id = body.get('jd_id') or body.get('id') or body.get('data', {}).get('jd_id')
            results.ok("2.2 Create JD", f"Endpoint: {endpoint}, jd_id={created_jd_id}")
            break
    else:
        results.skip("2.2 Create JD", f"No working create endpoint found (last: {r.status_code})")

    # Use created JD or fallback to listed JD
    test_jd_id = created_jd_id or jd_id

    # ── 2.3 Match Candidates (No Filter) ─────────────────────
    if test_jd_id:
        r = api('POST', f'/api/recruiter/jd/{test_jd_id}/match-candidates', token=token,
                json={'employment_status_filter': None})
        if r.status_code < 400:
            body = r.json()
            matches = body.get('top_matches') or body.get('matches') or []
            # Validate ordering
            scores = [m.get('match_score', 0) for m in matches]
            is_sorted = all(scores[i] >= scores[i+1] for i in range(len(scores)-1))

            info = f"{len(matches)} candidates"
            if scores:
                info += f", top={scores[0]:.0f}, sorted={'yes' if is_sorted else 'NO'}"
            results.ok("2.3 Match Candidates (No Filter)", info)

            if not is_sorted and len(scores) > 1:
                results.fail("2.3a Score Ordering", f"Scores not descending: {scores[:5]}")
            elif len(scores) > 1:
                results.ok("2.3a Score Ordering", "Descending order confirmed")
        else:
            results.fail("2.3 Match Candidates (No Filter)", f"HTTP {r.status_code}: {r.text[:200]}")
    else:
        results.skip("2.3 Match Candidates", "No JD available")

    # ── 2.4 Match with Employment Filter ─────────────────────
    if test_jd_id:
        r = api('POST', f'/api/recruiter/jd/{test_jd_id}/match-candidates', token=token,
                json={'employment_status_filter': 'job_seeker'})
        if r.status_code < 400:
            body = r.json()
            matches = body.get('top_matches') or body.get('matches') or []
            results.ok("2.4 Match with Filter (job_seeker)", f"{len(matches)} candidates")
        else:
            results.fail("2.4 Match with Filter", f"HTTP {r.status_code}: {r.text[:200]}")
    else:
        results.skip("2.4 Match with Filter", "No JD available")

    # ── 2.5 Matching Accuracy (Offline Test) ─────────────────
    print()
    print("  Running offline matching accuracy test...")
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    accuracy_script = os.path.join(backend_dir, 'tests', 'test_matching_accuracy.py')

    if os.path.exists(accuracy_script):
        try:
            proc = subprocess.run(
                [sys.executable, accuracy_script],
                capture_output=True, text=True, timeout=60,
                cwd=backend_dir
            )
            if proc.returncode == 0:
                results.ok("2.5 Matching Accuracy (Offline)", "ALL TESTS PASSED")
            else:
                # Extract last few lines for the error
                last_lines = proc.stdout.strip().split('\n')[-5:]
                results.fail("2.5 Matching Accuracy (Offline)", '\n'.join(last_lines))
        except subprocess.TimeoutExpired:
            results.fail("2.5 Matching Accuracy (Offline)", "Timeout after 60s")
        except Exception as e:
            results.fail("2.5 Matching Accuracy (Offline)", str(e))
    else:
        results.skip("2.5 Matching Accuracy (Offline)", f"Script not found: {accuracy_script}")

    return results


if __name__ == '__main__':
    results = run_matching_flow_tests()
    all_passed = results.summary()
    sys.exit(0 if all_passed else 1)
