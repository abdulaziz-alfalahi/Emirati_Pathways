# Tier 4 — Remaining Work Spec (implement + test on APPDEV)

These items require the **live DB** and/or the **real UAE Pass** endpoint to implement safely, so
they are specified here rather than authored blind. Implement on APPDEV, keep `.venv/bin/pytest
backend/tests/` green, and push per task.

**Gotchas that apply throughout:** `users.id` is `INTEGER` (not UUID); EID in JWT is a 15-digit
**string**; `/api/x/` with a trailing slash 405s (use no slash); patch
`backend.services.resume_parser.chat_completion` (not the qwen_client one).

Two migrations are already written and ready to apply:
`backend/migrations/002_audit_log_append_only.sql`, `backend/migrations/003_consents_table.sql`.

---

## T4.1 — UAE Pass hardening (remaining)

**Files:** `backend/routes/uaepass_routes.py`, `backend/uaepass_oauth.py`,
`frontend/src/pages/auth/UAEPassCallback.tsx` (note: actual path is under `pages/auth/`).
Access-token TTL is already 1h (done in `app.py`).

1. **OIDC nonce**
   - In the authorize step, generate a random `nonce`, store it in the same server-side/Redis map
     already used for CSRF `state`, and add `nonce` to the authorization URL params.
   - On callback, after token exchange, decode the `id_token` and assert `claims['nonce']` equals the
     stored value for that `state`; reject on mismatch.
2. **`id_token` signature/issuer/audience validation via JWKS**
   - Fetch UAE Pass JWKS (`.../.well-known/openid-configuration` → `jwks_uri`); cache keys.
   - Use `PyJWKClient(jwks_uri).get_signing_key_from_jwt(id_token)` then `jwt.decode(id_token, key,
     algorithms=[...], audience=<client_id>, issuer=<expected_iss>)`. Reject on any failure.
   - Do **not** rely on the `/userinfo` call alone for identity (current behavior).
3. **httpOnly cookie token delivery** (replaces URL-fragment → localStorage)
   - Backend: on successful callback, set access + refresh JWTs as `Secure`, `HttpOnly`,
     `SameSite=Strict`/`Lax` cookies (flask-jwt-extended cookie mode, or `response.set_cookie`), then
     redirect to a clean SPA URL with **no token in the fragment**.
   - Frontend `UAEPassCallback.tsx`: stop reading tokens from `window.location.hash` and stop writing
     to `localStorage`; rely on the cookie. Update the API client to send credentials
     (`withCredentials`/`credentials: 'include'`) and add CSRF protection for cookie-based auth
     (double-submit token) since `SameSite` alone is not sufficient for all flows.
- **Acceptance:** a tampered `id_token` is rejected; no token appears in the redirect URL or
  `localStorage`; authenticated API calls succeed via cookie; replay with a stale `nonce` fails.

---

## T4.2 — PDPL (remaining)

### a) Consent capture (uses `consents` table from migration 003)
- On registration (`routes/auth_routes.py` register path) and UAE Pass first-onboarding, insert a
  `consents` row per accepted policy: `(user_id, consent_type, granted=true, policy_version, source,
  ip_address, user_agent)`. Require `terms` + `privacy` + `data_processing` before creating the user.
- Add `POST /api/consents` (grant/withdraw) and `GET /api/consents/me`.
- **Acceptance:** registering without required consents is rejected; consent rows are written; a
  withdrawal sets `withdrawn_at`.

### b) Data-subject-rights: export + cascading erasure
Add authenticated self-service endpoints (and admin-invoked variants):
- `GET /api/dsr/export` → machine-readable bundle of everything held about the caller.
- `POST /api/dsr/erase` → anonymize/delete across the PII surface, in FK-safe order, in one
  transaction. **PII tables (verified against DATABASE_SCHEMA.md):**
  `user_cvs, cv_profiles, cv_versions, cv_usage_logs, cv_analytics,
   candidate_profiles, candidate_assessments, candidate_certifications,
   candidate_education_entries, candidate_experience_entries, candidate_skills, candidate_shortlist,
   interview_sessions, interview_participants, interview_recordings, interview_reports,
   interview_schedules, notifications, messages, conversations, user_activity_log,
   user_sessions, user_journey_analytics, nafis_job_seekers`, plus AI-output rows.
  - Prefer **anonymization** where a record must survive for integrity (e.g. audit references):
    null/replace name, email, phone, EID, free-text; keep the surrogate `users.id`.
  - Write an `admin_audit_log` row for the erasure (INSERT only — the table is now append-only).
  - Uploaded files: delete the caller's objects from MinIO/uploads too.
- **Acceptance:** after erase, none of the above tables return the subject's direct identifiers; the
  export contains them beforehand; the operation is one transaction (all-or-nothing).

### c) Scheduled retention purge (honor `AUDIT_RETENTION_DAYS = 2555`)
- Add `backend/scripts/retention_purge.py` (cron/APScheduler) that deletes/anonymizes records past
  their retention window. `admin_audit_log` is append-only — for it, **archive then** purge via a
  privileged maintenance role, or keep for the full 7-year window and only purge derived analytics.
- **Acceptance:** dry-run reports counts per table; a dated test row beyond the window is purged.

### d) EID exposure (surrogate already in place)
`users.id` is already an INTEGER surrogate (the EID-as-PK refactor was **not** applied — do not
apply it). Remaining hygiene: stop emitting the raw EID in JWT `sub`, URLs, and logs where a record
id suffices; keep EID only in the encrypted `emirates_id_enc` column. Audit `uaepass_routes.py` and
any `create_access_token(identity=<eid>)` calls.

---

## T4.3 — Audit integrity (remaining)

1. **Apply** `backend/migrations/002_audit_log_append_only.sql`.
2. **Consolidate the duplicates.** `backend/admin_api_endpoints.py` and
   `backend/admin_api_server.py` are near-identical. Check both for any remaining **in-memory**
   audit lists / mutable log structures and route all admin actions through the same DB writer used
   by `inline_routes.log_admin_action` (INSERT into `admin_audit_log`). Then delete the redundant
   file (confirm zero importers first) or reduce it to a thin re-export.
3. **Append-only export endpoint.** `GET /api/admin/audit/export` (admin-only) streaming the audit
   log as newline-delimited JSON or signed CSV for archival; read-only, paginated.
- **Acceptance:** an `UPDATE`/`DELETE` on `admin_audit_log` raises (trigger); admin actions appear as
  INSERTed rows with `request_id`; export returns the rows read-only.

---

## Suggested order on APPDEV
`002` + `003` migrations → T4.3 consolidation/export → T4.2 consent capture → T4.2 DSR export/erase →
T4.2 retention purge → T4.1 nonce/JWKS → T4.1 httpOnly cookies (frontend + backend together).
Run `.venv/bin/pytest backend/tests/ -v` after each; add an exploit/at-rest test per item.
