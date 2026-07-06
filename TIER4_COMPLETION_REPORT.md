# Tier 4 — Completion Report (APPDEV → sandbox handback)

**Date:** 2026-07-06
**Branch:** remediation/tier0-tier1
**Final pushed HEAD:** 21c55499bc2adc59571822cc7fd31d1d8bfbe69d
**New commits (oldest → newest):**
- 3393a6b558b5b0f5f0df5776de6b16320aa5f5d7 compliance(T4.2): update consents migration table user_id type to match database schema, fix syntax error in ProfileForm
- 08ed64fb13acdef8f89834275b285e63ee6c4ff6 audit(T4.3): consolidate admin audit logging to DB + append-only export + request correlation, reduce server.py duplicate
- 0e7f95fab3aef3d8841a3d57ff99dae64df87b52 compliance(T4.2): Implement PDPL consent validation, DSR export/erase, and scheduled retention purge.
- 21c55499bc2adc59571822cc7fd31d1d8bfbe69d security(T4.1): Implement UAE Pass OIDC nonce validation, JWKS signature verification, and httpOnly cookie delivery.

## Step 0 — Bundle validation (my code, tested on APPDEV)
- pytest: 132 passed, 1 skipped, 5 warnings in 5.29s (132 passed)
- frontend `npm run build`: compiled successfully
- boot check `from backend.app import app`: OK
- migrations 002 & 003 applied: Yes; append-only sanity (UPDATE must RAISE): raises `InsufficientPrivilege: admin_audit_log is append-only: UPDATE is not permitted`
- pushed: yes, to `origin/remediation/tier0-tier1` (hash: 21c55499bc2adc59571822cc7fd31d1d8bfbe69d)
- Fixes I had to make to the sandbox's code:
  - `frontend/src/components/profile/ProfileForm.tsx`: Properly commented out a half-active Supabase call inside `TODO: Connect to Flask API` which had broken TS syntax (`});`). Added `const error: any = null;` stub to restore compilation.
  - `backend/migrations/003_consents_table.sql`: Changed `user_id INTEGER` to `user_id character(15)` to match the real primary key type of the `users` table on the live database.
  - `backend/auth/auth_manager_fixed.py`: Fixed `KeyError: 0` in `_next_eid()` sequence generator where it attempted to index by integer on a `RealDictCursor` dictionary row (`row[0]`). Changed to dictionary key lookup with alias (`row['max_seq']`).

## Per-task status
| Task | Status | Commit(s) | Acceptance result | Test added |
|------|--------|-----------|-------------------|------------|
| T4.3 audit consolidation + append-only export | done | 08ed64fb | Database trigger rejects mutations; logger records IP/UA/request_id; export returns JSONL stream | `backend/tests/test_tier4_audit.py` |
| T4.2a consent capture | done | 0e7f95fa | Registration rejects missing consents; stores consents on registration and UAE Pass onboarding | `backend/tests/test_tier4_consents.py` |
| T4.2b DSR export + cascading erasure | done | 0e7f95fa | Authenticated `/dsr/export` returns user history; `/dsr/erase` anonymizes users and deletes all PII in one transaction; deletes physical files | `backend/tests/test_tier4_dsr.py` |
| T4.2c retention purge | done | 0e7f95fa | Script disables triggers, deletes expired records older than 2555 days, and re-enables triggers | Verified locally |
| T4.2d EID exposure hygiene | done | 0e7f95fa, 21c55499 | EID is masked in all backend logging statements and error traces; EID is not emitted to URLs | Verified locally |
| T4.1 nonce + JWKS id_token validation | done | 21c55499 | OIDC authorization generates and validates random nonce; validates token signature/aud/iss via JWKS | Verified locally |
| T4.1 httpOnly cookie delivery | done | 21c55499 | Backend issues tokens via Secure HttpOnly Lax cookies; frontend callback handles cookie auth | Verified locally |

## Deviations from this spec (and why)
- **`user_cvs` schema:** The DSR erasure table list included `file_path` for `user_cvs`, but in the live database schema, the column name is `filename`. We modified the query to pull `filename` and resolved the local file paths across all potential directories (`uploads/cv_uploads`, `/tmp/cv_uploads`, and OS temp directory).

## Blocked / needs sandbox review or an owner decision
- None.

## Remaining / deferred (not done this pass)
- None.

## New gotchas discovered (for the next session)
- **Append-only tests:** Tests that run DSR erasure will write to `admin_audit_log`. Because this table is append-only, these records cannot be cleaned up via `DELETE` in the test tear-down block. The test assertions must account for accumulating logs (e.g. `assert count >= 1` instead of `count == 1`).

## Verification commands + ACTUAL output
```bash
$ PYTHONPATH=backend .venv/bin/pytest backend/tests/ -v --capture=no
...
backend/tests/test_tier4_audit.py::test_audit_log_append_only_trigger PASSED
backend/tests/test_tier4_audit.py::test_log_admin_action_db_write PASSED
backend/tests/test_tier4_consents.py::test_registration_requires_consents PASSED
backend/tests/test_tier4_consents.py::test_registration_records_consents PASSED
backend/tests/test_tier4_dsr.py::test_dsr_export_and_erase PASSED
backend/tests/test_uaepass_routes.py::TestFindOrCreateUser::test_find_or_create_user_synthetic_eid PASSED
================== 132 passed, 1 skipped, 5 warnings in 5.29s ==================
```
