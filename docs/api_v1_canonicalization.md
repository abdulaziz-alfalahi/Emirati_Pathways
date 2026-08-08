# /api/v1 — canonical endpoint decisions (step zero)

**Status:** decisions made from live evidence 2026-08-08; implementation pending
**Gates:** `api_versioning_plan.md` §3.1a / step 0 — nothing versioned until this is resolved
**Why this exists:** the candidate operations each have 2–3 backend implementations. You cannot freeze a contract with three implementations of "apply", and it is a live data-integrity risk *today*: the same user action writes different records and enforces different rules depending on which endpoint the client hit.

---

## How these decisions were reached

For each operation: found every implementation in the backend, found which the **web frontend actually calls** (grep of `src/`), read the handlers, and — for write paths — compared what they do to the database. `public.job_applications` is the real table (16 columns, 9 rows); a second `qa.job_applications` exists but the search path (`"$user", public`) never resolves to it, so all handlers write the same physical table. The divergence is in **logic**, not storage.

## The organising finding

**`applications_bp` (`/api/applications/*`) is the modern application-lifecycle blueprint.** Its handlers alone:
- enforce that a job is `published` before accepting an application (409 otherwise — audit hardening M1);
- are **withdrawn-aware** (dedup excludes `status='withdrawn'`, so a candidate may re-apply after withdrawing);
- stamp `submitted_at`;
- notify the job's owner on apply;
- call `_record_status(...)`, the **migration-041 timeline hook**, on status changes (withdraw/status transitions — not the initial insert, which no path records).

The parallel paths in `jobs_api.py` / `job_application_routes.py` do none of these, or only some. So the canonical home for apply / list / get / withdraw / status is **`applications_bp`**, and the reconciliation is mostly "make the other callers converge on it," not "write something new."

---

## Decisions

### 1. Apply to a job

| implementation | live web caller | behaviour |
|---|---|---|
| **`/api/applications/apply`** (`applications_api.py`) | `services/applicationService.ts` | published-check, withdrawn-aware dedup, `submitted_at`, notifies owner |
| `/api/jobs/apply` (`job_application_routes.py`) | `components/candidate/JobMatches.tsx` | blocks **any** re-apply (even after withdraw), no `submitted_at`, no owner notify |
| `/api/jobs/<id>/apply` (`jobs_api.py`) | `components/mobile/MobileJobSearch.tsx` | third variant |

**Canonical: `POST /api/applications/apply`** → `/api/v1/applications/apply`.

Reconciliation:
- Confirm the canonical handler accepts the **superset** of fields the live callers send — `cv_id`, `availability_date`, `additional_documents` — not only `cover_letter` + `expected_salary`. Add the missing ones (all nullable columns already exist).
- Point `JobMatches.tsx` and `MobileJobSearch.tsx` at it.
- Retire the other two, or make them thin delegators, once no caller remains.
- **Behaviour change to note for the owner:** re-apply after withdrawal becomes allowed everywhere (today it depends on the endpoint). This is the correct behaviour but it is a change for the `JobMatches` path.

### 2. List my applications

Live callers already use **`/api/applications/my-applications`** (`ApplicationTracker.tsx`, `JobMatchingPage.tsx`, `applicationService.ts`). `ApplicationTracker.tsx` even carries a comment that `/api/jobs/applications` "never existed." Effectively already settled.

**Canonical: `GET /api/applications/my-applications`** → `/api/v1/applications`. Retire `/api/jobs/applications` and `/api/candidate/applications` (no distinct live use).

### 3. Withdraw an application

| implementation | behaviour |
|---|---|
| **`/api/applications/<id>/withdraw`** (`applications_api.py`) | ownership check (403 if not owner), `_record_status(...,'withdrawn')` — **timeline-aware** |
| `/api/candidate/applications/<id>/withdraw` (`jobs_api.py`, `candidate_jobs_bp`) | separate impl, called today by `ApplicationTracker.tsx` |
| `/api/jobs/applications/<id>/withdraw` (`jobs_api.py`) | third variant |

**Canonical: `POST /api/applications/<id>/withdraw`** → `/api/v1/applications/<id>/withdraw`. Move `ApplicationTracker.tsx` onto it (it currently uses the `candidate` variant, which likely does **not** write the timeline — verify and note if a status-history gap results). Retire the other two.

### 4. Save / unsave / list saved jobs

The tangled one. Three conventions live, including two different DELETE shapes:

| caller | save | unsave | list |
|---|---|---|---|
| `JobMatches.tsx` | `POST /api/jobs/<id>/save` | `DELETE /api/jobs/<id>/unsave` | `GET /api/candidate/saved-jobs` |
| `MobileJobSearch.tsx` | `POST /api/jobs/<id>/save` | `DELETE /api/jobs/<id>/save` | `GET /api/jobs/saved` |
| `JobMatchingPage.tsx` | `POST /api/candidate/saved-jobs/<id>` | `DELETE /api/candidate/saved-jobs/<id>` | `GET /api/candidate/saved-jobs` |

**Store investigation (2026-08-08, live) changed this decision.** The `/api/jobs/*` and `candidate_jobs_bp` handlers read/write the **legacy `saved_jobs`** table; migration 037 created **`candidate_saved_jobs`** (EID-keyed, JWT-scoped) as its intended replacement, served by `candidate_job_bp` at `/api/candidate/saved-jobs`. Both tables are empty (0 rows), so there is nothing to migrate — but they are genuinely different stores, and on staging **`POST /api/jobs/<id>/save` returns 500** while the clean path works. Saving from `JobMatches` and `MobileJobSearch` was silently broken; only `JobMatchingPage` (already on the clean endpoints) worked.

So the earlier "canonicalise to `/api/jobs/*`" pick was wrong — those handlers point at the wrong (broken, empty) store.

**Canonical: the migration-037 store, via `candidate_job_bp`:**
- `GET /api/candidate/saved-jobs`
- `POST /api/candidate/saved-jobs/<id>`
- `DELETE /api/candidate/saved-jobs/<id>`

→ `/api/v1/candidate/saved-jobs`. Response shape `{ success, data: [{ job_id, ... }] }`.

Reconciliation (**DONE — this PR**): pointed `JobMatches` and `MobileJobSearch` at the clean endpoints (and fixed `MobileJobSearch`'s parse, which expected the legacy `{ saved_jobs: [{ id }] }` shape). Retire the legacy `/api/jobs/saved`, `/api/jobs/<id>/save`, `/api/jobs/<id>/unsave` and the shadowed duplicate `candidate_jobs_bp` `GET /saved-jobs` in the cleanup follow-up.

### 5. Job matches

| implementation | live web caller | keep? |
|---|---|---|
| **`/api/candidate/job-matches`** | `JobMatches.tsx`, `JobMatchingPage.tsx` | **canonical** → `/api/v1/candidate/job-matches` |
| `/api/jobs/matches` | *none* | retire (dead) |
| `/api/matching/visible/top-vacancies` | `services/cvStorageService.ts` | **keep, distinct** — CV-scoped top vacancies, a different operation; include in v1 as-is |

All must call the **one canonical scorer** (`backend/match_scoring.py`); confirm `/api/candidate/job-matches` does, so the number is identical to the web's.

### 6. Availability

Every live caller uses **`/api/profile/availability`** (`CandidateAvailabilityControl.tsx`, `careerServicesAPI.ts`). `/api/candidate/profile/availability` has no live caller.

**Canonical: `GET|PUT /api/profile/availability`** → `/api/v1/profile/availability`. Retire the `candidate` alias.

---

## Summary

| operation | canonical (→ v1) | retire |
|---|---|---|
| apply | `POST /api/applications/apply` | `/api/jobs/apply`, `/api/jobs/<id>/apply` |
| list applications | `GET /api/applications/my-applications` | `/api/jobs/applications`, `/api/candidate/applications` |
| get application | `GET /api/applications/<id>` | — |
| withdraw | `POST /api/applications/<id>/withdraw` | `/api/candidate/applications/<id>/withdraw`, `/api/jobs/applications/<id>/withdraw` |
| save job | `POST /api/candidate/saved-jobs/<id>` | `/api/jobs/<id>/save` (500s, wrong store) |
| unsave job | `DELETE /api/candidate/saved-jobs/<id>` | `/api/jobs/<id>/unsave`, `/api/jobs/<id>/save` |
| list saved | `GET /api/candidate/saved-jobs` | `/api/jobs/saved`, dup `candidate_jobs_bp` |
| job matches | `GET /api/candidate/job-matches` | `/api/jobs/matches` (dead) |
| CV top vacancies | `GET /api/matching/visible/top-vacancies` | — (distinct) |
| availability | `GET\|PUT /api/profile/availability` | `/api/candidate/profile/availability` |

## Implementation sequence (one verified PR each)

1. **Apply** — highest value (live data-integrity fix). **DONE (PR pending):** both web callers (`JobMatches.tsx`, `MobileJobSearch.tsx`) moved to `/api/applications/apply`; the canonical handler already covers the fields they send, so no widening was needed. Verified live: published job → 201 + owner notified; duplicate → 409; draft → 409 (test row cleaned up). The two legacy handlers are now unused; retire them in a follow-up once traffic confirms zero use.
2. **Withdraw** — move `ApplicationTracker` onto the timeline-aware handler; confirm the status history now records the withdrawal.
3. **Saved jobs** — collapse to the single RESTful shape after confirming one shared store.
4. **Matches + availability** — retire the two dead aliases; confirm the scorer parity.
5. Then, and only then, the `/api/v1` dual-mount (`api_versioning_plan.md` §3) over a surface with one implementation per operation.

Each of steps 1–4 is a live-behaviour change verified through the WAF before merge, exactly like the CRM and BOLA fixes. None needs a migration — the columns and stores already exist.
