# API versioning plan

**Status:** proposal, not yet implemented
**Author:** drafted 2026-08-08
**Why now:** a mobile app puts your API contract on devices you cannot update. This plan is worth executing regardless of whether the app is approved — an unversioned public API becomes a problem the first time any third party integrates.

---

## 1. Where we are

Measured against the running staging container (`app.url_map`, 2026-08-08):

| | count |
|---|---|
| Total `/api/*` rules | **908** |
| Rules under a version prefix | **10** (`/api/v2/profile/*`) |
| Rules candidate-facing (auth, profile, cv, jobs, matching, applications, communication, career-passport, interviews, video-interview, feedback, public, companies) | **205** |

Two things follow from those numbers.

**The `/api/v2` island is an accident, not a scheme.** Ten profile endpoints sit under `/api/v2/` with no `/api/v1/` anywhere to be a successor to. It predates any versioning decision. Left alone it will be read as "v2 is the current version", which is false for the other 898 routes, and it will confuse whoever implements this plan.

**We are not versioning 908 endpoints.** The vast majority — `/api/recruiter` (111), `/api/hr` (66), `/api/admin` (60), `/api/career-services` (47), `/api/board` (28) — are consumed only by the web frontend, which we deploy in lockstep with the backend. Versioning those costs real effort and buys nothing. The surface that needs a frozen contract is the subset a phone in someone's pocket will call.

## 2. The actual problem

Today, changing a route is a single motion: edit the handler, edit the caller, deploy both. Every client is instantly current because there is only one client and we ship it.

Once an app is in a store that stops being true:

- Apple and Google review adds days to every release.
- A meaningful fraction of users never update. Six months after launch you will have phones calling the contract as it existed at launch.
- You cannot roll back a release that is already installed.

So the day the app ships, every endpoint it touches becomes a published interface with a support obligation attached. The purpose of this plan is to make that obligation **explicit and bounded** rather than implicit and permanent.

## 3. Approach

**URL prefix: `/api/v1/...`.**

Considered and rejected:

- *Header negotiation* (`Accept-Version: 1`). Cleaner URLs, but invisible in logs, WAF rules, nginx config and `curl`, and this team debugs through all four. The cost lands exactly where this platform has historically lost time.
- *No versioning, discipline only.* This is what we have. It works precisely until the first person forgets, and there is no test that catches forgetting.

### 3.1 Dual-mount — additive, zero risk to the web

Flask 3.0.2 (confirmed on the running container) accepts a `name=` argument to `register_blueprint`, so the same blueprint can be mounted twice at different prefixes. The web keeps calling the unversioned paths it calls today; the app calls `/api/v1/...`; both reach the same handler.

Nothing moves. Nothing breaks. The change is purely additive.

In `backend/app.py`, the registration loop gains an allowlist:

```python
# Blueprints that form the published v1 surface (the mobile app's contract).
# Everything not listed here stays unversioned — it is consumed only by the
# web frontend, which is deployed in lockstep with this backend.
V1_BLUEPRINTS = {
    'auth_bp', 'candidate_profile_bp', 'cv_bp', 'jobs_bp', 'matching_bp',
    'applications_bp', 'communication_bp', 'career_passport_bp',
    'interviews_bp', 'video_interview_bp', 'feedback_bp', 'public_stats_bp',
}

for module_path, bp_name, url_prefix, label in _additional_blueprints:
    ...
    base = url_prefix or bp.url_prefix or ''
    if url_prefix:
        app.register_blueprint(bp, url_prefix=url_prefix)
    else:
        app.register_blueprint(bp)

    # Second mount under /api/v1 for the published surface only.
    if bp_name in V1_BLUEPRINTS and base.startswith('/api'):
        app.register_blueprint(
            bp,
            url_prefix='/api/v1' + base[len('/api'):],
            name=f'{bp.name}__v1',
        )
```

Two caveats on that sketch. Several candidate-facing routes are registered inline rather than through `_additional_blueprints` and need the same treatment. More importantly, per §3.1a a blueprint-level allowlist is too coarse for the blueprints that mix candidate and operator routes — those either get enumerated rule by rule, or split first.

### 3.1a Two things that make a blueprint allowlist insufficient

Mapping the live URL map against the app's screens turned up two problems that must be solved before any mount is added. Both mean **the allowlist cannot be purely blueprint-level.**

**Blueprints mix candidate and operator routes.** `candidate_profile_bp` serves `/api/profile/candidate` — and also `/api/profile/crm-candidates`, `/api/profile/crm-candidates/<user_id>`, `/api/profile/crm-stats` and `/api/profile/crm-last-import`, which are the career-services operator's CRM. Dual-mounting that blueprint would publish the CRM — including raw Emirates IDs and counselling notes — onto the app's surface. Role guards would still hold, but a published contract is a statement of intent, and that is not the intent.

The same applies to `/api/cv/*`, which carries `debug-auth`, `debug-list/<user_id>` and `debug-stats`, and to `/api/auth/*`, which carries the legacy password login, `setup-mfa`, and `uaepass/dev-login`.

So the allowlist is a **route-level** allowlist. Either enumerate the exact rules to mount, or split the mixed blueprints first — splitting `candidate_profile_bp` into candidate and CRM blueprints is worth doing on its own merits.

**The same operation exists two or three times.** Applying to a job, listing applications, withdrawing, saving a job, and fetching matches each have two or three independent implementations across `/api/jobs`, `/api/applications` and `/api/candidate` (enumerated in `mobile_app_v1_scope.md` §7.1).

You cannot freeze a contract that has three competing implementations of the same operation — you would be enshrining the ambiguity on 150,000 devices, and whichever duplicate the app happens to call becomes the one nobody remembers to maintain.

**Deciding the canonical implementation for each operation is therefore step zero**, ahead of everything in §4. It is also worth doing independently: today, whether an application is recorded correctly can depend on which endpoint the caller chose.

### 3.2 Freeze the contract with tests, not intentions

**This is the part that makes versioning real.** A URL prefix is a naming convention; a failing test is a guarantee.

Add `backend/tests/test_v1_contract.py`, which for every `/api/v1/*` route asserts the response *shape* — key names and types, not values — against a checked-in snapshot. Any change to a field name, a nesting level or a type fails CI with a message saying which app versions would break.

Adding a new optional field passes. Renaming or removing one does not. That is exactly the boundary we want, because it is exactly the boundary the phones care about.

CI already runs `lint-and-test` on PRs to `main`, so this needs no new pipeline.

### 3.3 Forced upgrade — the escape hatch

Without a way to retire old versions you accumulate them forever. Add one endpoint:

```
GET /api/v1/client-status
→ { "min_supported_version": "1.4.0", "latest_version": "1.7.2", "message": {...} }
```

The app calls it on launch. Below `min_supported_version` it shows a blocking "update required" screen. This is what eventually lets you delete `/api/v1` — you raise the floor, wait, then retire.

Build it in v1. Retrofitting a forced-upgrade mechanism is impossible: the phones that need it are running the version that lacks it.

### 3.4 Deprecation policy

- A published version is supported for **12 months** from the date its successor ships.
- Deprecated responses carry a `Sunset:` header with the retirement date.
- Retirement requires `min_supported_version` to have excluded the affected clients for at least one release cycle first.

## 4. Sequence

0. **Resolve the duplicate operations** (§3.1a) — pick one canonical implementation per operation, confirm the others are equivalent, point the web at the winner. Nothing below is meaningful until this is done.
1. Decide the exact endpoint list with the app scope (see `mobile_app_v1_scope.md`) — route-level, covering what the app calls and nothing more. Split `candidate_profile_bp` so the CRM routes cannot be swept in.
2. Retire the accidental `/api/v2/profile/*` island: dual-mount those ten rules under `/api/v1/profile/*`, point the web at whichever it currently uses, delete the `v2` mount once nothing calls it.
3. Add the dual-mount allowlist. No behaviour change; deployable on its own.
4. Add `test_v1_contract.py` with the snapshot. This is the gate.
5. Add `/api/v1/client-status`.
6. Document the frozen surface in `docs/API_DOCUMENTATION.md`.

Steps 3–5 are each independently shippable and none of them touch the web frontend.

## 5. Two findings that belong with this work

**The JWT signing secret is flagged as weak by your own application.** The container logs `CRITICAL: JWT_SECRET_KEY appears low-entropy/known — rotate to a random >=32-byte per-env secret` on every boot. Today that is a staging-shaped problem. The day tokens are issued to 150,000 phones with a 30-day refresh lifetime, a guessable signing key becomes an authentication bypass against the whole population, and rotating it invalidates every session on every device at once. **Rotate before the app ships, not after** — and use a different secret per environment.

**`ENABLE_DEV_LOGIN=true` on staging.** Correct there. It must be impossible in any environment a published app points at: `POST /api/auth/uaepass/dev-login` mints a valid session for any Emirates ID with no proof of identity. Worth an explicit startup assertion that refuses to boot with dev-login enabled when `FLASK_ENV=production`.

## 6. What this does not cover

Rate limiting and abuse. A public store listing means anyone can download the app, extract the base URL and call the API directly. That is a separate piece of work, but it becomes urgent on the same day.
