# Emirati Pathways — Remediation Handover (Remaining Work)

**Date:** 2026-07-06
**Branch:** `remediation/tier0-tier1`
**Latest commit:** `44b416f` — "cleanup: delete 46 dead route files, fix test failures, and harden UAE Pass & audit logs"
**Repo:** `https://github.com/abdulaziz-alfalahi/Emirati_Pathways.git`
**Workspace:** `/home/aalfalahi.d/Emirati_Pathways`

---

## 1. Project Overview

Emirati Pathways is a Flask + React career platform for UAE nationals. Monolithic Python backend with React 18 / TypeScript / Vite frontend.

### Architecture
- **Backend:** Flask + `flask-socketio` + `flask-jwt-extended`, PostgreSQL via `psycopg2`
- **Frontend:** React 18 + TypeScript + Vite, i18next for EN/AR
- **AI:** Qwen/DashScope via OpenAI-compatible API (`backend/services/qwen_client.py`)
- **Infra:** Gunicorn, MinIO for storage, LiveKit for video, optional Redis
- **DB key type:** `users.id` is `character(15)` (Emirates ID), NOT UUID or INTEGER — documented at top of `backend/DATABASE_SCHEMA.md`

### Key Files
| File | Purpose |
|------|---------|
| `backend/app.py` | Main Flask application, all blueprint registration |
| `backend/blueprint_registry.py` | Core blueprint registration function |
| `backend/services/qwen_client.py` | AI/LLM client (OpenAI-compatible) |
| `backend/config/qwen_config.py` | AI config + per-task token limits |
| `backend/db.py` | Database connection pool |
| `backend/DATABASE_SCHEMA.md` | 2939-line schema reference |
| `backend/routes/inline_routes.py` | Mega-module: ~3,370 lines of inline route handlers |
| `backend/routes/uaepass_routes.py` | UAE Pass OAuth + dev-login |
| `backend/routes/hr_dashboard_api.py` | HR dashboard API routes |
| `deploy.sh` | Deployment script (uses gunicorn) |
| `wsgi.py` | WSGI entry point |
| `frontend/src/i18n/config.ts` | i18n configuration |
| `.env.example` | Environment variable template |

---

## 2. What Has Been Completed (Tiers 0–3 + Partial Tier 4)

All committed on branch `remediation/tier0-tier1`, pushed to GitHub.

### Commit History (oldest → newest)
1. `4c844ef` — **Tier 0+1:** Purge secrets/PII, remove auth backdoors, harden JWT/CORS/headers
2. `efaae67` — **Tier 2-3:** AI fixes, fabricated data removal, Supabase excision, frontend cleanup
3. `44b416f` — **Tier 3-4:** Delete 46 dead route files, fix test failures, harden UAE Pass & audit logs

### Detailed Completion Status

#### Tier 0 — Secrets/PII/Config ✅
- Hardcoded secrets → env vars (LiveKit, MinIO, JWT, DashScope)
- `.env`, `credentials.json` untracked + `.gitignore`
- `.env.example` created

#### Tier 1 — Authentication & Authorization ✅
- `mock_token` bypass removed from JWT verification
- Dev-login gated behind `FLASK_ENV == 'development'`
- JWT issuer + expiry validation
- Role mass-assignment blocked in registration
- HSTS/CSP security headers middleware
- `@jwt_required()` added to candidate search endpoint

#### Tier 2 — AI Correctness & Deployment ✅ (code tasks)
- T2.2: Documented `users.id` as `character(15)` (Emirates ID) in `DATABASE_SCHEMA.md`
- T2.4: Fixed AI double-parse bug in `video_interview_routes.py`
- T2.5: Stubbed 9 files with fabricated `random.*` data → `source: 'not_implemented'`
- T2.5b: Removed `emirates_id` from AI prompt schemas, stopped PII logging
- T2.7: Removed `body_language` from prompts, flagged hire decisions as draft
- T2.8: Prompt injection hardening — `<USER_DATA>` delimiters (9 markers)
- T2.10: `deploy.sh` → gunicorn; `wsgi.py` cleaned (`debug=True` removed)
- T2.11: `max_tokens` parameter added to `chat_completion()` + per-task config

#### Tier 3 — Structure & Frontend ✅ (code tasks)
- T3.1/T3.2: Blueprint audit + 46 dead route files deleted
- T3.3: Supabase excision — 135 files cleaned, `frontend/src/integrations/supabase/` deleted
- T3.5: 4 debug HTML files deleted
- T3.6: 27 hardcoded `localhost:50xx` URLs → env-var-backed
- T3.7: i18next `LanguageDetector` activated
- T3.8: Deps: deduped `python-docx`, pinned `Werkzeug>=3.0.6`, bumped `requests`/`Pillow`/`Jinja2`
- T3.9: Root debris cleaned, 5 scripts moved to `scripts/`

#### Tier 4 — Government Readiness (PARTIAL)
- **T4.1 PARTIAL:** UAE Pass EID key hardened — `UAEPASS_EID_KEY` mandatory in production, AES-256-GCM encryption, base64 fallback removed
- **T4.3 PARTIAL:** In-memory `admin_audit_logs` in `inline_routes.py` replaced with DB writes to `admin_audit_log` table

#### Test Suite ✅
- All 127 tests pass (100% green)
- Command: `.venv/bin/pytest backend/tests/ -v -s --tb=short`

---

## 3. What Remains — Prioritized Task List

### 3.1 Tier 4 — Government Readiness (HIGH PRIORITY)

#### T4.1 — UAE Pass Hardening (Remaining Sub-items)
**Files:** `backend/routes/uaepass_routes.py`, `backend/uaepass_oauth.py`, `frontend/src/pages/UAEPassCallback.tsx`

**DONE:**
- ✅ `UAEPASS_EID_KEY` mandatory in production (raises RuntimeError if missing)
- ✅ AES-256-GCM authenticated encryption implemented
- ✅ Base64 fallback removed

**TODO:**
- [ ] Add OIDC nonce + `id_token` signature/issuer/audience validation via JWKS
- [ ] Move token delivery from URL fragment/localStorage to httpOnly cookies
- [ ] Shorten access token TTL to ≤1h

#### T4.2 — PDPL (Personal Data Protection Law)
**TODO:**
- [ ] Create `consents` table captured at registration/UAE-Pass onboarding
- [ ] Data-subject-rights workflow: export + cascading erasure across `user_cvs`, `candidate_*`, `nafis_job_seekers`, AI outputs
- [ ] Scheduled retention purge honoring `AUDIT_RETENTION_DAYS`
- [ ] Replace EID-as-PK with opaque surrogate (or stop emitting EID in JWTs/URLs/logs)

#### T4.3 — Audit Integrity (Remaining Sub-items)
**Files:** `backend/admin_api_endpoints.py`, `backend/admin_api_server.py`, `backend/routes/inline_routes.py`

**DONE:**
- ✅ `log_admin_action` in `inline_routes.py` now writes to `admin_audit_log` DB table

**TODO:**
- [ ] Audit `admin_api_endpoints.py` and `admin_api_server.py` — these are near-identical duplicates that may also have in-memory audit logging; consolidate and fix
- [ ] `REVOKE UPDATE/DELETE` on audit table from app DB role
- [ ] Append-only export capability

#### T4.4 — Observability
**Files:** `backend/security_config.py` (declares controls but is **never imported**)

**TODO:**
- [ ] Initialize Sentry (or Moro-approved APM) — `sentry-sdk` is in requirements but never `init()`
- [ ] JSON structured logging with request-ID correlation
- [ ] Wire `security_config.py` into `app.config` or delete it
- [ ] Prometheus metrics if applicable

#### T4.5 — Accessibility
**Files:** `frontend/src/components/SkipNavigation.tsx` (currently returns `null` — WCAG 2.4.1 fail)

**TODO:**
- [ ] Restore `SkipNavigation` from `frontend/backups/skip-links-removal/` into root layout
- [ ] Add axe-core to Playwright + CI
- [ ] Commission EN+AR WCAG 2.1 AA audit for TDRA

#### T4.6 — Integrations Honesty
**TODO:**
- [ ] NAFIS: Currently CSV import only — scope real API or relabel UI
- [ ] MOHRE: Currently just a date column + UI tile falsely reading "Integration: Enabled" — remove the lie or implement

---

### 3.2 Deferred Infrastructure Tasks

These require live DB access, policy decisions, or infrastructure changes:

| Task | What | Blocker |
|------|-------|---------|
| **T0.4** | Rotate every leaked credential | Owner action, requires Moro secret store updates |
| **T0.5** | Purge git history + force-push | Must happen after T0.4, from APPDEV |
| **T0.6** | PDPL breach review | Owner + DPO decision |
| **T2.1** | Alembic migration baseline | Needs live DB schema dump |
| **T2.3** | Schema standardization (INTEGER vs UUID) | Depends on T2.1 |
| **T2.6** | AI data residency (DPA/Moro firewall) | Policy decision by DPO |
| **T2.9** | Two-node Redis architecture | Infrastructure change |
| **T3.4** | TypeScript strict mode | Surfaces thousands of errors; incremental |

---

### 3.3 Verification & CI (Part C from Original Plan)

These tests should be built as you go:

1. **AuthZ matrix** — for each route module, assert candidate/recruiter/assessor/educator/admin JWTs get expected 200/403
2. **Blueprint registration** — assert the full expected URL-rule set is present
3. **AI degradation** — mock the Qwen client returning malformed JSON/timeout; assert graceful handling
4. **Schema drift** — CI diffs live `information_schema` vs committed expected schema
5. **i18n parity** — EN/AR key completeness; every `t()` key resolves
6. **E2E** — fix `playwright.config.ts` testMatch + add a `webServer`; cover recruiter pipeline and UAE Pass login

---

## 4. Critical Knowledge & Warnings

> **CAUTION: Do NOT change `users.id` type.** It is `character(15)` (Emirates ID) in production. Some SQL files reference it as UUID or INTEGER — those are stale. See note at top of `backend/DATABASE_SCHEMA.md`.

> **WARNING: `CREATE TABLE IF NOT EXISTS` is widespread** (~450+ occurrences in backend Python files). These execute DDL at import time. Do NOT remove them until Alembic migrations (T2.1) are set up.

> **WARNING: `admin_api_endpoints.py` and `admin_api_server.py` are near-identical duplicates.** Both were partially fixed but consolidation is needed.

> **IMPORTANT: The Supabase excision left `// TODO: Connect to Flask API` comments** in 135 frontend files. These mark places where the frontend previously called the mock Supabase client. They now call nothing — the data will be empty. Each needs to be connected to the real Flask backend API over time.

### Technical Gotchas Discovered During This Session
- **EID as String:** User IDs are `character(15)` strings representing the Emirates ID. Mocking with integer `1` causes PostgreSQL type-operator mismatches.
- **Flask Trailing Slashes:** Requesting `/api/hr/jobs/` (with trailing slash) triggers a `405 Method Not Allowed` because Flask routes it to the POST endpoint. The GET endpoint is at the blueprint root (`''`).
- **Mock Patching Namespaces:** `resume_parser.py` and `matching_engine.py` import `chat_completion` directly. You must patch `backend.services.resume_parser.chat_completion` and `backend.services.matching_engine.chat_completion`, NOT `backend.services.qwen_client.chat_completion`.
- **Dev-Login returns 404 in production** (not 403) to prevent route fingerprinting.

### User Decisions Already Made
| Question | Decision |
|----------|----------|
| Branching | One branch: `remediation/tier0-tier1` |
| `.env.example` | Created |
| Fabricated analytics | Stub with "not implemented" (NOT delete endpoints) |
| Supabase excision | Executed |
| Runtime CREATE TABLE | Defer full cleanup until after Alembic (T2.1) |

---

## 5. How to Verify Current State

```bash
cd /home/aalfalahi.d/Emirati_Pathways
git checkout remediation/tier0-tier1

# Confirm latest commit
git log -3 --oneline
# Expected: 44b416f, efaae67, 4c844ef

# Run tests (all 127 should pass)
.venv/bin/pytest backend/tests/ -v -s --tb=short

# Confirm app boots
python3 -c "from backend.app import app; print('OK')"

# Confirm no fabricated random calls in production code
git grep -cn 'random\.\(randint\|choice\|uniform\)' -- \
  backend/routes/strategic_metrics_api.py \
  backend/admin_api_endpoints.py \
  backend/admin_api_server.py \
  backend/video_interview_routes.py
# Expected: no output (exit code 1)

# Confirm Supabase excised
git grep -c '@/integrations/supabase' -- frontend/src 2>/dev/null
# Expected: 0 or only commented-out mocks

# Confirm no hardcoded localhost
git grep -c 'localhost:50' -- frontend/src 2>/dev/null
# Expected: no output
```
