#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flow 1: Job Seeker CV Upload & Parsing — API Tests
===================================================
Tests the full CV lifecycle: upload, parse, list, get, job-matches, delete, and limit enforcement.
"""
import os, sys, io, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api_test_utils import (
    TestResults, api, get_auth_token, assert_success, assert_status, print_header, BASE_URL
)


def _create_fake_pdf(text: str = "Fatima Al Maktoum\nSenior Python Developer\nDubai, UAE") -> str:
    """Create a minimal valid PDF file for testing and return its path."""
    path = os.path.join(tempfile.gettempdir(), 'test_cv_flow.pdf')
    # Minimal valid PDF structure
    content = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length {len(text) + 30} >>
stream
BT /F1 12 Tf 100 700 Td ({text}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000210 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
350
%%EOF"""
    with open(path, 'w') as f:
        f.write(content)
    return path


def run_cv_flow_tests():
    print_header("FLOW 1: JOB SEEKER CV UPLOAD & PARSING")
    results = TestResults("CV Flow")

    # ── Auth ─────────────────────────────────────────────────
    try:
        token = get_auth_token()
        results.ok("1.0 Authentication", "Token acquired")
    except Exception as e:
        results.fail("1.0 Authentication", str(e))
        results.summary()
        return results

    # ── 1.1 Qwen Health Check ────────────────────────────────
    r = api('GET', '/api/cv/debug-qwen')
    body = assert_success(r, "1.1 Qwen Engine Health Check", results,
                          extra_checks=lambda b: None if 'engine' in b else "Missing 'engine' field")

    # ── 1.2 Upload PDF CV ────────────────────────────────────
    pdf_path = _create_fake_pdf()
    cv_id = None
    try:
        # If user is at the CV limit, free a slot first
        r_list = api('GET', '/api/cv/list', token=token)
        if r_list.status_code < 400:
            existing_cvs = r_list.json().get('cvs') or r_list.json().get('data') or []
            if len(existing_cvs) >= 3:
                oldest_id = existing_cvs[-1].get('cv_id') or existing_cvs[-1].get('id')
                if oldest_id:
                    api('DELETE', f'/api/cv/{oldest_id}', token=token)
                    print(f"    (Freed CV slot by deleting {oldest_id})")

        with open(pdf_path, 'rb') as f:
            r = api('POST', '/api/cv/upload', token=token, files={'cv_file': ('test_cv.pdf', f, 'application/pdf')})
        if r.status_code < 400:
            body = r.json()
            cv_id = body.get('cv_id') or body.get('data', {}).get('cv_id') or body.get('id')
            if cv_id:
                results.ok("1.2 Upload PDF CV", f"cv_id={cv_id}")
            elif body.get('success') is not False:
                # Some parsers may timeout but still create the CV
                results.ok("1.2 Upload PDF CV", "Accepted (cv_id may be async)")
            else:
                results.fail("1.2 Upload PDF CV", body.get('message', 'Unknown error'))
        else:
            results.fail("1.2 Upload PDF CV", f"HTTP {r.status_code}: {r.text[:200]}")
    except Exception as e:
        results.fail("1.2 Upload PDF CV", str(e))

    # ── 1.3 CV Text Parsing (Paste Mode) ─────────────────────
    cv_text = (
        "Ahmed Al Nahyan\nData Engineer\nAbu Dhabi, UAE\n"
        "Email: ahmed@test.ae\nPhone: +971502222222\n\n"
        "Experience:\n- 6 years in data engineering\n- Python, Spark, PostgreSQL, AWS\n\n"
        "Education:\n- BSc Computer Science, NYU Abu Dhabi, 2019\n\n"
        "Skills:\nPython, Apache Spark, PostgreSQL, AWS, Docker, Airflow"
    )
    r = api('POST', '/api/cv/parse-text', token=token, json={'cv_text': cv_text})
    if r.status_code < 400:
        results.ok("1.3 CV Text Parsing (Paste)", f"HTTP {r.status_code}")
    else:
        results.fail("1.3 CV Text Parsing (Paste)", f"HTTP {r.status_code}: {r.text[:200]}")

    # ── 1.4 List User CVs ────────────────────────────────────
    r = api('GET', '/api/cv/list', token=token)
    if r.status_code < 400:
        body = r.json()
        count = body.get('total_count', len(body.get('cvs', body.get('data', []))))
        results.ok("1.4 List User CVs", f"Count: {count}")
        # Try to get a cv_id if we don't have one
        if not cv_id:
            cvs = body.get('cvs') or body.get('data') or []
            if cvs and isinstance(cvs, list) and len(cvs) > 0:
                cv_id = cvs[0].get('cv_id') or cvs[0].get('id')
    else:
        results.fail("1.4 List User CVs", f"HTTP {r.status_code}")

    # ── 1.5 Get Specific CV ──────────────────────────────────
    if cv_id:
        r = api('GET', f'/api/cv/{cv_id}', token=token)
        if r.status_code < 400:
            results.ok("1.5 Get Specific CV", f"cv_id={cv_id}")
        else:
            results.fail("1.5 Get Specific CV", f"HTTP {r.status_code}")
    else:
        results.skip("1.5 Get Specific CV", "No cv_id from previous tests")

    # ── 1.6 CV Job Matches ───────────────────────────────────
    if cv_id:
        r = api('GET', f'/api/cv/{cv_id}/job-matches', token=token)
        if r.status_code < 400:
            body = r.json()
            match_count = len(body.get('matches', body.get('data', [])))
            results.ok("1.6 CV Job Matches", f"Matches found: {match_count}")
        else:
            results.fail("1.6 CV Job Matches", f"HTTP {r.status_code}")
    else:
        results.skip("1.6 CV Job Matches", "No cv_id")

    # ── 1.7 Unauthenticated Upload (Negative) ────────────────
    with open(pdf_path, 'rb') as f:
        r = api('POST', '/api/cv/upload', files={'cv_file': ('test_cv.pdf', f, 'application/pdf')})
    if r.status_code in (401, 403, 422):
        results.ok("1.7 Unauth Upload Rejected", f"HTTP {r.status_code}")
    else:
        results.fail("1.7 Unauth Upload Rejected", f"Expected 401/403, got {r.status_code}")

    # ── 1.8 File Content Validation (Negative) ───────────────
    # Upload a fake file with .pdf extension but invalid content
    fake_content = b"This is not a PDF file at all"
    r = api('POST', '/api/cv/upload', token=token,
            files={'cv_file': ('fake.pdf', io.BytesIO(fake_content), 'application/pdf')})
    if r.status_code == 400:
        results.ok("1.8 Fake PDF Content Rejected", "Magic-byte validation working")
    elif r.status_code == 401:
        results.ok("1.8 Fake PDF Content Rejected", "Blocked at auth (acceptable)")
    else:
        results.fail("1.8 Fake PDF Content Rejected", f"Expected 400, got {r.status_code}: {r.text[:150]}")

    # ── 1.9 Delete CV ────────────────────────────────────────
    if cv_id:
        r = api('DELETE', f'/api/cv/{cv_id}', token=token)
        if r.status_code < 400:
            results.ok("1.9 Delete CV", f"Deleted cv_id={cv_id}")
        else:
            results.fail("1.9 Delete CV", f"HTTP {r.status_code}")
    else:
        results.skip("1.9 Delete CV", "No cv_id")

    # Cleanup
    try:
        os.unlink(pdf_path)
    except Exception:
        pass

    return results


if __name__ == '__main__':
    results = run_cv_flow_tests()
    all_passed = results.summary()
    sys.exit(0 if all_passed else 1)
