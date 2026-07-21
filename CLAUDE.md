# Emirati Pathways — agent guide

Employment platform for Emirati nationals (EHRDC): candidates, recruiters/employers, and growth operators who onboard companies from NAFIS vacancy CSVs. Arabic/English, RTL-aware.

## Stack & layout
- **Backend**: Flask monolith. `backend/app.py` `create_app()` registers ~90 blueprints from a declarative list (module path, blueprint name, url_prefix, label). Raw SQL via psycopg2 — **no ORM**. Socket.IO on gevent (this is why production runs exactly 1 gunicorn worker). LiveKit for video interviews.
- **Frontend**: `frontend/` — React 18 + TypeScript + Vite. `npm run dev / build / lint`, tests with `vitest`.
- **DB**: PostgreSQL. `backend/db_utils.py` (`get_db`/`execute_query`, commits per call) is the shared access layer; older modules open their own psycopg2 connections.
- `archived_development_files/` and `archives/` are dead code — never search or edit there.

## Critical truths (violating these has caused real outages)
1. **The DB in `backend/.env` is the live database** (`dghr_prod` @ 10.228.145.66:5454) — it serves staging AND holds production data. Read freely; write only deliberately. All test data takes a `ZZ-` name prefix and must be cleaned up.
2. **The repo's .sql DDL files disagree with the live schema** (three conflicting `companies` DDLs, `users.role` vs `user_type`, …). The live `information_schema` is the only authority — check it before writing any INSERT/migration.
3. **Roles**: `users.role` is authoritative; `user_type` is a legacy mirror kept in sync on write (issue #93). `secondary_roles` (jsonb) is additive. Role sets and `require_roles` live in `backend/auth/access_control.py`. Never hand-roll a guard like `claims and role in ...` — that pattern failed open 12 times (issue #96).
4. **Team membership**: the ACL (`workspace_middleware.get_company_context`) reads `company_team_members` with `invitation_status='accepted'` only. `hr_profiles` is legacy display data. Writing one without the other recreates issues #91/#94.
5. **Company identity**: never match companies by raw name string. Resolve through `backend/company_identity.py` (trade licence first, then normalised name). Unique indexes from migration 011 will reject bypassing inserts (issue #99).
6. **Auth identity**: users.id is a CHAR(15) Emirates ID (synthetic `7840000…` until UAE Pass provides real ones). UAE Pass is the intended sole login; invitation redemption binds to the UAE-Pass-proven user id, never phone/email (issue #90).
7. **Imports**: modules use `try: from backend.X import … except ImportError: from X import …`. Follow it — the app runs under both roots.

## Running things
- Tests: `.venv/bin/python -m pytest backend/tests/` (system python3 has no flask). CI runs `lint-and-test` + `docker-build` on PRs targeting `main` only.
- No `psql` on this box — use psycopg2 one-liners with `backend/.env` (see the live-db-migration skill).
- `gh` CLI is at `~/.local/bin/gh` (authenticated). SSH to staging: `ssh appqa` (10.228.145.5).

## Procedures (project skills — invoke rather than improvise)
- **deploy-appqa** — deploying/verifying on staging (single server behind WAF at https://stg-emirati.ehrdc.gov.ae).
- **live-db-migration** — authoring + running `backend/migrations/NNN_*.sql` by hand against the live DB.
- **pr-workflow** — branch/commit/PR/CI conventions.
- **e2e-staging** — browser E2E via the preconfigured Playwright MCP; test-data discipline.
- **feedback-triage** — reading pasted in-app feedback reports.

## Design decisions that are settled (don't relitigate)
- Match scoring: no geography factor, no flat nationality bonus; commute is informational; national-priority is a separate disclosed axis (GH #12).
- UI: Direction B, light-only, Standard density, Readex Pro (PR #82).
- Persona model: nationals onboard as Candidate and gain roles by operator grant; non-nationals enter only via operator-issued magic-link invitations, which carry the role (`intended_role`).
