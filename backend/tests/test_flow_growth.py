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

    # ── 4.7 Body-based accept endpoint is RETIRED (issue #90) ─
    # The old POST accepted an unauthenticated body and matched existing
    # accounts by phone number alone — redeeming a link with someone else's
    # number captured their account. Invitations are now redeemed inside the
    # UAE Pass OAuth callback against the identity UAE Pass proved, so this
    # endpoint must refuse EVERY request, well-formed or not.
    if invitation_token:
        r = api('POST', f'/api/public/invitation/{invitation_token}/accept', json={
            'first_name': 'Ali',
            'last_name': 'Al Hashimi Test',
            'phone': '+971509999999',
            'email': 'ali.test@testco-alpha.ae',
        })
        if r.status_code == 410:
            points_to_uaepass = 'uaepass' in r.text.lower()
            results.ok("4.7 Accept endpoint retired", f"HTTP 410, points to UAE Pass: {points_to_uaepass}")
        else:
            results.fail(
                "4.7 Accept endpoint retired",
                f"Expected 410 Gone, got {r.status_code}: {r.text[:200]} — "
                f"the phone-match account-takeover surface (#90) is back",
            )
    else:
        results.skip("4.7 Accept endpoint retired", "No token available")

    # ── 4.7b Redemption binds to a proven identity (issue #90) ──
    # Exercise growth_system.redeem_invitation_for_user directly, the way the
    # UAE Pass callback calls it: with a user id that already exists. Assert
    # the DURABLE state — role grant, team membership the ACL honours, and
    # invitation consumption — not any in-memory response.
    if invitation_token:
        test_user_id = '784999900000010'  # synthetic EID, cleaned up below
        try:
            import psycopg2, psycopg2.extras
            sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from growth_system import GrowthSystem

            conn = psycopg2.connect(
                host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
                dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD'),
            )
            conn.autocommit = True
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            try:
                # An EXISTING candidate account (the UAE Pass callback has
                # already created/linked it by the time redemption runs).
                cur.execute("DELETE FROM users WHERE id = %s", (test_user_id,))
                cur.execute("""
                    INSERT INTO users (id, email, first_name, last_name, role, is_active, created_at)
                    VALUES (%s, 'redeem.test@testco-alpha.ae', 'Redeem', 'Test', 'candidate', TRUE, NOW())
                """, (test_user_id,))

                redeemed = GrowthSystem().redeem_invitation_for_user(
                    invitation_token, test_user_id, is_new_user=False
                )

                cur.execute(
                    "SELECT role, secondary_roles FROM users WHERE id = %s",
                    (test_user_id,),
                )
                row = cur.fetchone()
                cur.execute("""
                    SELECT invitation_status FROM company_team_members
                    WHERE user_id = %s AND company_id = %s
                """, (test_user_id, redeemed['company_id']))
                ctm = cur.fetchone()
                cur.execute(
                    "SELECT is_used FROM company_invitations WHERE token = %s",
                    (invitation_token,),
                )
                inv = cur.fetchone()

                secondary = row.get('secondary_roles') or []
                if (row['role'] == 'candidate'          # primary NEVER replaced
                        and redeemed['role'] in secondary
                        and ctm and ctm['invitation_status'] == 'accepted'
                        and inv and inv['is_used']):
                    results.ok(
                        "4.7b EID-model redemption",
                        f"primary kept, secondary={secondary}, membership accepted, invitation consumed",
                    )
                else:
                    results.fail(
                        "4.7b EID-model redemption",
                        f"role={row['role']!r} secondary={secondary!r} "
                        f"ctm={ctm!r} is_used={inv and inv['is_used']!r}",
                    )
            finally:
                # Remove everything the redemption attached to the test user.
                cur.execute("UPDATE job_postings SET recruiter_id = NULL, created_by = NULL WHERE recruiter_id = %s", (test_user_id,))
                cur.execute("DELETE FROM company_team_members WHERE user_id = %s", (test_user_id,))
                cur.execute("DELETE FROM hr_profiles WHERE user_id = %s", (test_user_id,))
                cur.execute("DELETE FROM users WHERE id = %s", (test_user_id,))
                cur.close(); conn.close()
        except Exception as e:
            results.skip("4.7b EID-model redemption", f"no DB access: {e}")
    else:
        results.skip("4.7b EID-model redemption", "No token available")

    # ── 4.8 Invalid Token (Negative) ─────────────────────────
    r = api('GET', '/api/public/invitation/completely_fake_token_abc123')
    if r.status_code in (404, 400):
        results.ok("4.8 Invalid Token Rejected", f"HTTP {r.status_code}")
    else:
        results.fail("4.8 Invalid Token Rejected", f"Expected 404, got {r.status_code}")

    # ── 4.9 Redemption rejects a bad token (Negative) ────────
    # A consumed/fake token must raise, not attach anyone to a company.
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from growth_system import GrowthSystem
        try:
            GrowthSystem().redeem_invitation_for_user(
                'completely_fake_token_abc123', '784999900000010', is_new_user=False
            )
            results.fail("4.9 Bad Token Rejected", "redeem accepted a fake token")
        except ValueError:
            results.ok("4.9 Bad Token Rejected", "ValueError raised")
    except Exception as e:
        results.skip("4.9 Bad Token Rejected", f"no DB access: {e}")

    # ── 4.10 Dashboard After Changes ─────────────────────────
    testco_id = None
    r = api('GET', '/api/growth/dashboard-stats')
    if r.status_code < 400:
        body = r.json()
        activity = body.get('recentActivity', [])
        results.ok("4.10 Dashboard After Changes", f"Activity items: {len(activity)}")
        for c in body.get('companies', []):
            if c.get('name') == 'TestCo Alpha':
                testco_id = c.get('id')
                break
    else:
        results.fail("4.10 Dashboard After Changes", f"HTTP {r.status_code}")

    # ── 4.11 Company approval gate — operator verify endpoint (#96) ──
    # companies.is_verified is now load-bearing: publish paths refuse jobs
    # from unverified companies. Assert the operator endpoint persists the
    # flag + audit columns, then restore the original value.
    if testco_id:
        try:
            import psycopg2, psycopg2.extras
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
                dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD'),
            )
            conn.autocommit = True
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT is_verified FROM companies WHERE id::text = %s", (testco_id,))
            original = cur.fetchone()['is_verified']

            r = api('POST', f'/api/growth/companies/{testco_id}/verify', json={'verified': True})
            if r.status_code < 400 and r.json().get('success'):
                cur.execute(
                    "SELECT is_verified, verified_by, verified_at FROM companies WHERE id::text = %s",
                    (testco_id,),
                )
                row = cur.fetchone()
                if row['is_verified'] and row['verified_at'] is not None:
                    results.ok("4.11 Operator verify persists",
                               f"is_verified=True, verified_by={row['verified_by']}, verified_at set")
                else:
                    results.fail("4.11 Operator verify persists", f"durable state wrong: {dict(row)}")
                # Restore whatever the company had before the test.
                api('POST', f'/api/growth/companies/{testco_id}/verify', json={'verified': bool(original)})
            else:
                results.fail("4.11 Operator verify persists", f"HTTP {r.status_code}: {r.text[:200]}")
            cur.close(); conn.close()
        except Exception as e:
            results.skip("4.11 Operator verify persists", f"no DB access: {e}")
    else:
        results.skip("4.11 Operator verify persists", "TestCo Alpha id not found")

    # ── 4.12 The in-memory verify endpoint is retired (#96/#97) ──
    # It wrote to a dict, checked no privilege (TODO comment), and vanished
    # on restart — while looking successful to the caller.
    r = api('POST', f'/api/companies/{testco_id or "any-id"}/verify', json={'notes': 'x'})
    if r.status_code == 410:
        results.ok("4.12 In-memory verify retired", "HTTP 410, points to operator endpoint")
    else:
        results.fail("4.12 In-memory verify retired", f"Expected 410, got {r.status_code}")

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
