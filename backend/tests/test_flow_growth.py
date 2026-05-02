#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flow 4: Company Growth Operator — API Tests
============================================
Tests vacancy CSV import, dashboard stats (live funnel),
growth candidates, company existence check, magic-link invitations,
and job verification token flow.
"""
import os, sys, io, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api_test_utils import (
    TestResults, api, get_auth_token, assert_success, print_header
)


def _create_vacancy_csv() -> str:
    """Create a small vacancy CSV for testing the growth import."""
    path = os.path.join(tempfile.gettempdir(), 'test_vacancies.csv')
    rows = [
        "CompanyName,CompanyEmail,JobsTitle,JobID,CompanySector,TradeLicenseNo,CompanyPhone,JobEmirate,JobCity",
        "TestCo Alpha,hr@testco-alpha.ae,Senior Python Developer,TESTA-001,Technology,TL-TEST-001,+97141111111,Dubai,Dubai Internet City",
        "TestCo Beta,hr@testco-beta.ae,Data Analyst,TESTB-001,Finance,TL-TEST-002,+97142222222,Dubai,DIFC",
        "TestCo Gamma,hr@testco-gamma.ae,Operations Manager,TESTC-001,Energy,TL-TEST-003,+97143333333,Abu Dhabi,Masdar City",
    ]
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(rows))
    return path


def run_growth_flow_tests():
    print_header("FLOW 4: COMPANY GROWTH OPERATOR")
    results = TestResults("Growth Flow")

    # ── 4.1 Import Vacancy CSV ───────────────────────────────
    csv_path = _create_vacancy_csv()
    import_ok = False
    try:
        with open(csv_path, 'rb') as f:
            r = api('POST', '/api/growth/import', files={'file': ('test_vacancies.csv', f, 'text/csv')})
        if r.status_code < 400:
            body = r.json()
            report = body.get('report', body)
            companies = report.get('companies_created', 0)
            jobs = report.get('jobs_created', 0)
            results.ok("4.1 Import Vacancy CSV", f"Companies: {companies}, Jobs: {jobs}")
            import_ok = True
        else:
            results.fail("4.1 Import Vacancy CSV", f"HTTP {r.status_code}: {r.text[:200]}")
    except Exception as e:
        results.fail("4.1 Import Vacancy CSV", str(e))

    # ── 4.2 Dashboard Stats (Live Funnel) ────────────────────
    r = api('GET', '/api/growth/dashboard-stats')
    if r.status_code < 400:
        body = r.json()
        funnel = body.get('funnel', {})
        kpis = body.get('kpis', {})
        companies_list = body.get('companies', [])
        activity = body.get('recentActivity', [])

        info_parts = []
        if funnel:
            info_parts.append(f"funnel={funnel}")
        if kpis:
            info_parts.append(f"totalCo={kpis.get('totalCompanies', '?')}")
        info_parts.append(f"companies={len(companies_list)}")
        info_parts.append(f"activity={len(activity)}")

        results.ok("4.2 Dashboard Stats", ', '.join(info_parts))

        # Validate funnel keys
        expected_keys = {'lead', 'contacted', 'documentation', 'verification', 'active'}
        if funnel and expected_keys.issubset(set(funnel.keys())):
            results.ok("4.2a Funnel Schema", "All expected stages present")
        elif funnel:
            results.fail("4.2a Funnel Schema", f"Missing keys: {expected_keys - set(funnel.keys())}")
    else:
        results.fail("4.2 Dashboard Stats", f"HTTP {r.status_code}: {r.text[:200]}")

    # ── 4.3 Growth Candidates ────────────────────────────────
    r = api('GET', '/api/growth/candidates?min_vacancies=1')
    if r.status_code < 400:
        body = r.json()
        candidates = body.get('candidates', [])
        results.ok("4.3 Growth Candidates", f"Found: {len(candidates)}")
    else:
        results.fail("4.3 Growth Candidates", f"HTTP {r.status_code}: {r.text[:200]}")

    # ── 4.4 Check Existing Companies ─────────────────────────
    r = api('POST', '/api/growth/check-companies',
            json={'companies': ['TestCo Alpha', 'Nonexistent Corp XYZ']})
    if r.status_code < 400:
        body = r.json()
        existing = body.get('existing', [])
        if 'TestCo Alpha' in existing and 'Nonexistent Corp XYZ' not in existing:
            results.ok("4.4 Check Companies", f"Correctly identified: {existing}")
        elif import_ok:
            # TestCo Alpha should exist if import succeeded
            results.fail("4.4 Check Companies", f"Expected 'TestCo Alpha' in {existing}")
        else:
            results.ok("4.4 Check Companies", f"Existing: {existing} (import may not have run)")
    else:
        results.fail("4.4 Check Companies", f"HTTP {r.status_code}: {r.text[:200]}")

    # ── 4.5 Send Company Invitations ─────────────────────────
    invitation_token = None
    r = api('POST', '/api/growth/invite-companies', json={
        'companies': [{
            'name': 'TestCo Alpha',
            'code': 'TCA-001',
            'email': 'hr@testco-alpha.ae',
            'phone': '+97141111111',
            'sector': 'Technology',
            'tradeLicense': 'TL-TEST-001'
        }]
    })
    if r.status_code < 400:
        body = r.json()
        invitations = body.get('invitations', [])
        if invitations:
            invitation_token = invitations[0].get('token')
        results.ok("4.5 Send Company Invitations", f"Sent: {len(invitations)}")
    else:
        results.fail("4.5 Send Company Invitations", f"HTTP {r.status_code}: {r.text[:200]}")

    # ── 4.6 Validate Company Invitation Token ────────────────
    if invitation_token:
        r = api('GET', f'/api/public/invitation/{invitation_token}')
        if r.status_code < 400:
            body = r.json()
            company_name = body.get('data', {}).get('company_name', 'unknown')
            results.ok("4.6 Validate Invitation", f"Company: {company_name}")
        else:
            results.fail("4.6 Validate Invitation", f"HTTP {r.status_code}")
    else:
        results.skip("4.6 Validate Invitation", "No token available")

    # ── 4.7 Accept Company Invitation ────────────────────────
    if invitation_token:
        r = api('POST', f'/api/public/invitation/{invitation_token}/accept', json={
            'first_name': 'Ali',
            'last_name': 'Al Hashimi Test',
            'phone': '+971509999999',
            'email': 'ali.test@testco-alpha.ae',
            'position_title': 'HR Manager',
            'role': 'recruiter'
        })
        if r.status_code < 400:
            body = r.json()
            has_token = bool(body.get('data', {}).get('access_token'))
            results.ok("4.7 Accept Invitation", f"JWT returned: {has_token}")
        else:
            # May fail if invitation already accepted — that's OK
            if r.status_code == 400 and 'already' in r.text.lower():
                results.ok("4.7 Accept Invitation", "Already accepted (idempotent)")
            else:
                results.fail("4.7 Accept Invitation", f"HTTP {r.status_code}: {r.text[:200]}")
    else:
        results.skip("4.7 Accept Invitation", "No token available")

    # ── 4.8 Invalid Token (Negative) ─────────────────────────
    r = api('GET', '/api/public/invitation/completely_fake_token_abc123')
    if r.status_code in (404, 400):
        results.ok("4.8 Invalid Token Rejected", f"HTTP {r.status_code}")
    else:
        results.fail("4.8 Invalid Token Rejected", f"Expected 404, got {r.status_code}")

    # ── 4.9 Missing Fields (Negative) ────────────────────────
    if invitation_token:
        r = api('POST', f'/api/public/invitation/{invitation_token}/accept', json={
            'first_name': 'Test'
            # Missing: last_name, phone, role
        })
        if r.status_code in (400, 422):
            results.ok("4.9 Missing Fields Rejected", f"HTTP {r.status_code}")
        elif r.status_code == 404:
            results.ok("4.9 Missing Fields Rejected", "Token already consumed (acceptable)")
        else:
            results.fail("4.9 Missing Fields Rejected", f"Expected 400, got {r.status_code}")
    else:
        results.skip("4.9 Missing Fields Rejected", "No token")

    # ── 4.10 Dashboard After Changes ─────────────────────────
    r = api('GET', '/api/growth/dashboard-stats')
    if r.status_code < 400:
        body = r.json()
        activity = body.get('recentActivity', [])
        results.ok("4.10 Dashboard After Changes", f"Activity items: {len(activity)}")
    else:
        results.fail("4.10 Dashboard After Changes", f"HTTP {r.status_code}")

    # Cleanup
    try:
        os.unlink(csv_path)
    except Exception:
        pass

    return results


if __name__ == '__main__':
    results = run_growth_flow_tests()
    all_passed = results.summary()
    sys.exit(0 if all_passed else 1)
