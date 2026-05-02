#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flow 3: NAFIS Talent Operator — API Tests
==========================================
Tests CSV import, batch listing, seeker listing with filters,
dashboard stats, magic-link invitation lifecycle, and OTP flow.
"""
import os, sys, io, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api_test_utils import (
    TestResults, api, get_auth_token, assert_success, print_header
)


def _create_nafis_csv() -> str:
    """Create a small NAFIS-format CSV for testing."""
    path = os.path.join(tempfile.gettempdir(), 'test_nafis_import.csv')
    rows = [
        "Emirates ID,Full Name,Full Name Arabic,Gender,Date Of Birth,Age Group,"
        "Education Level,Specialization,Sub Specialization,GPA,Experience Years,"
        "Job Seeker Type,Preferred Work Mode,National Service,Emirate Of Origin,"
        "Emirate Of Residence,City Name,Marital Status,Is Student,"
        "Is Person Of Determination,Determination Type,Email,Phone,"
        "Registered On,Job Seeker Date,Status",

        "784-1234-1234567-1,Fatima Al Maktoum Test,فاطمة المكتوم,Female,1995-03-15,25-30,"
        "Bachelor,Computer Science,Software Engineering,3.8,5,"
        "New Entry,Full Time,Completed,Dubai,"
        "Dubai,Dubai Internet City,Single,No,"
        "No,,fatima.nafistest@test.ae,+971501111111,"
        "2026-01-15,2026-01-20,Registered",

        "784-1234-1234567-2,Ahmed Al Nahyan Test,أحمد النهيان,Male,1990-07-22,30-35,"
        "Master,Data Science,Machine Learning,3.9,8,"
        "Experienced,Full Time,Completed,Abu Dhabi,"
        "Abu Dhabi,Masdar City,Married,No,"
        "No,,ahmed.nafistest@test.ae,+971502222222,"
        "2026-01-10,2026-01-12,Registered",

        "784-1234-1234567-3,Sara Al Ketbi Test,سارة الكتبي,Female,1998-11-01,25-30,"
        "Diploma,Business,Marketing,3.2,2,"
        "New Entry,Part Time,Not Required,Sharjah,"
        "Sharjah,Al Majaz,Single,Yes,"
        "No,,sara.nafistest@test.ae,+971503333333,"
        "2026-02-01,2026-02-05,Registered",
    ]
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(rows))
    return path


def run_nafis_flow_tests():
    print_header("FLOW 3: NAFIS TALENT OPERATOR")
    results = TestResults("NAFIS Flow")

    # ── 3.1 Import CSV ───────────────────────────────────────
    csv_path = _create_nafis_csv()
    batch_ok = False
    try:
        with open(csv_path, 'rb') as f:
            r = api('POST', '/api/nafis-talent/import', files={'file': ('test_nafis.csv', f, 'text/csv')})
        if r.status_code < 400:
            body = r.json()
            successful = body.get('successful', body.get('imported', 0))
            failed = body.get('failed', 0)
            batch_code = body.get('batch_code', 'N/A')
            results.ok("3.1 Import CSV", f"batch={batch_code}, ok={successful}, fail={failed}")
            batch_ok = True
        else:
            results.fail("3.1 Import CSV", f"HTTP {r.status_code}: {r.text[:200]}")
    except Exception as e:
        results.fail("3.1 Import CSV", str(e))

    # ── 3.2 List Batches ─────────────────────────────────────
    r = api('GET', '/api/nafis-talent/batches')
    if r.status_code < 400:
        body = r.json()
        batches = body.get('batches', [])
        results.ok("3.2 List Batches", f"Found {len(batches)} batches")
    else:
        results.fail("3.2 List Batches", f"HTTP {r.status_code}")

    # ── 3.3 List Seekers (Paginated) ─────────────────────────
    r = api('GET', '/api/nafis-talent/seekers?page=1&limit=10')
    seeker_ids = []
    if r.status_code < 400:
        body = r.json()
        seekers = body.get('seekers', [])
        total = body.get('total', len(seekers))
        seeker_ids = [s.get('id') for s in seekers if s.get('id')]
        results.ok("3.3 List Seekers (Page 1)", f"Total: {total}, this page: {len(seekers)}")
    else:
        results.fail("3.3 List Seekers", f"HTTP {r.status_code}")

    # ── 3.4 List Seekers with Filters ────────────────────────
    r = api('GET', '/api/nafis-talent/seekers?gender=Female&education_level=Bachelor')
    if r.status_code < 400:
        body = r.json()
        seekers = body.get('seekers', [])
        results.ok("3.4 Filtered Seekers (Female+Bachelor)", f"Found: {len(seekers)}")
    else:
        results.fail("3.4 Filtered Seekers", f"HTTP {r.status_code}")

    # ── 3.5 Get Filter Options ───────────────────────────────
    r = api('GET', '/api/nafis-talent/filter-options')
    if r.status_code < 400:
        body = r.json()
        keys = list(body.keys())
        results.ok("3.5 Filter Options", f"Fields: {', '.join(keys[:5])}...")
    else:
        results.fail("3.5 Filter Options", f"HTTP {r.status_code}")

    # ── 3.6 Dashboard Stats ──────────────────────────────────
    r = api('GET', '/api/nafis-talent/stats')
    if r.status_code < 400:
        body = r.json()
        total = body.get('total_seekers', 'N/A')
        results.ok("3.6 Dashboard Stats", f"Total seekers: {total}")
    else:
        results.fail("3.6 Dashboard Stats", f"HTTP {r.status_code}")

    # ── 3.7 Send Seeker Invitations ──────────────────────────
    invitation_token = None
    if seeker_ids:
        test_ids = seeker_ids[:2]  # Invite first 2 seekers
        r = api('POST', '/api/nafis-talent/invite', json={'seeker_ids': test_ids})
        if r.status_code < 400:
            body = r.json()
            invitations = body.get('invitations', [])
            if invitations:
                invitation_token = invitations[0].get('token')
            results.ok("3.7 Send Invitations", f"Sent: {len(invitations)}, token: {invitation_token is not None}")
        else:
            results.fail("3.7 Send Invitations", f"HTTP {r.status_code}: {r.text[:200]}")
    else:
        results.skip("3.7 Send Invitations", "No seeker IDs available")

    # ── 3.8 Validate Invitation Token ────────────────────────
    if invitation_token:
        r = api('GET', f'/api/nafis-talent/public/invitation/{invitation_token}')
        if r.status_code < 400:
            body = r.json()
            seeker_name = body.get('data', {}).get('seeker_name', 'unknown')
            results.ok("3.8 Validate Invitation", f"Seeker: {seeker_name}")
        else:
            results.fail("3.8 Validate Invitation", f"HTTP {r.status_code}")
    else:
        results.skip("3.8 Validate Invitation", "No token available")

    # ── 3.9 Send OTP ─────────────────────────────────────────
    if invitation_token:
        r = api('POST', f'/api/nafis-talent/public/invitation/{invitation_token}/send-otp',
                json={'phone': '+971501111111'})
        if r.status_code < 400:
            body = r.json()
            results.ok("3.9 Send OTP", f"Masked phone: {body.get('phone_masked', 'N/A')}")
        else:
            results.fail("3.9 Send OTP", f"HTTP {r.status_code}")
    else:
        results.skip("3.9 Send OTP", "No token available")

    # ── 3.10 Invalid Invitation Token (Negative) ─────────────
    r = api('GET', '/api/nafis-talent/public/invitation/totally_invalid_token_12345')
    if r.status_code in (404, 400):
        results.ok("3.10 Invalid Token Rejected", f"HTTP {r.status_code}")
    else:
        results.fail("3.10 Invalid Token Rejected", f"Expected 404, got {r.status_code}")

    # ── 3.11 Duplicate Import (Upsert Behavior) ─────────────
    if batch_ok:
        try:
            with open(csv_path, 'rb') as f:
                r = api('POST', '/api/nafis-talent/import', files={'file': ('test_nafis.csv', f, 'text/csv')})
            if r.status_code < 400:
                body = r.json()
                dupes = body.get('duplicates', body.get('updated', 0))
                results.ok("3.11 Duplicate Import (Upsert)", f"Duplicates handled: {dupes}")
            else:
                results.fail("3.11 Duplicate Import", f"HTTP {r.status_code}: {r.text[:200]}")
        except Exception as e:
            results.fail("3.11 Duplicate Import", str(e))
    else:
        results.skip("3.11 Duplicate Import", "Initial import failed")

    # Cleanup
    try:
        os.unlink(csv_path)
    except Exception:
        pass

    return results


if __name__ == '__main__':
    results = run_nafis_flow_tests()
    all_passed = results.summary()
    sys.exit(0 if all_passed else 1)
