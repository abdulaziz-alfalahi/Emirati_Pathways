# Admin impersonation — scope

**Status: scoped, not built.** Written 2026-08-19, alongside the change that
made `dev-login` reachable only from the host.

## Why this exists

Verifying the platform requires signing in as different users — a candidate, a
recruiter, a coach, an operator — to check that each surface behaves. Today that
is done with `dev-login`, which mints a session for any Emirates ID with no
credential at all.

Two different needs have been sitting behind that one endpoint, and separating
them is most of the design:

| Need | Answer |
|---|---|
| An **agent** verifying API behaviour headlessly | Mint a JWT inside the container over SSH. **Needs no endpoint** — demonstrated working 2026-08-19. |
| A **person** clicking through the UI as a test user | This document. |

The first is solved and costs nothing: anyone who can `docker exec` into the
backend can already read the database directly, so minting a token grants no
new capability. `dev-login` is not needed for it.

The second is the real requirement, and host-binding only *reduces* its
exposure. It does not make it accountable.

## The problem host-binding does not solve

A session minted by `dev-login` is **indistinguishable from a real login**.
Nothing in `users`, in the JWT, or in `admin_audit_log` records that a staff
member was acting as someone else.

This is not theoretical. On 2026-08-19 a verification call minted a token as the
platform owner's own account and read two candidate records. `admin_audit_log`
now shows the owner performing that read, permanently — the table is append-only
by migration 002. The trail is not wrong by accident; it is wrong by design,
because the mechanism cannot express "this was a test".

Once the NAFIS roster is loaded, "who read this citizen's file" becomes a
question with legal weight. An answer of "an operator did, or possibly someone
testing as them, we cannot tell" is not an answer.

## What to build

### 1. Test-account marking

A boolean or role flag identifying accounts that MAY be impersonated. Real
citizen accounts must never be impersonable, however senior the operator.

That single constraint is what separates this from `dev-login`, which will
happily mint a session for any of the 5,336 users.

- Column on `users` (`is_test_account`, default FALSE), or a marker role.
- Set deliberately by an administrator; never inferred from a name prefix.
- The endpoint refuses any target where the flag is not TRUE — no override.

### 2. The impersonation endpoint

`POST /api/admin/impersonate` — administrators only, via `require_roles`.

- Caller must be **genuinely authenticated** (UAE Pass), not impersonating
  already. No chaining.
- Target must be flagged per §1.
- Returns a short-lived token: **15–30 minutes**, not the standard session
  lifetime. Testing is bounded work.
- The token carries `act_as` claims: the real administrator's id AND the
  impersonated id. Both travel with every request the session makes.
- `POST /api/admin/impersonate/end` to drop it early.

### 3. The audit record

One row at issue, and — this is the part `dev-login` structurally cannot do —
**every action taken during the session carries the real actor**.

- `admin_impersonation_started` / `_ended`, with both identities and a reason.
- `pii_access_log.log_pii_read` gains the impersonator: a read performed while
  impersonating must record who *actually* did it. Without this the trail still
  lies, just with extra ceremony around the lie.
- The existing read auditing (#428) is the natural place; it already records
  actor, resource and client IP.

### 4. Visible in the UI

An unmissable banner: *"You are viewing the platform as X. End session."*

Not decoration. Without it, a staff member forgets, acts on a real record
believing it is theirs, and the mistake looks like the impersonated user's.

## Sizing

| Part | Scope | Size |
|---|---|---|
| Test-account flag | One nullable column + admin toggle in User Manager | **Small** (one migration) |
| Endpoint + claims | Two routes; `act_as` claims; refuse chaining; TTL | **Small–medium** |
| Audit threading | Extend `log_pii_read` and the audit helper to carry the impersonator | **Medium** — touches every audited path |
| UI banner + end-session | One component, mounted app-wide | **Small** |
| Retire `dev-login` | Delete both endpoints and their env flag | **Small** |

One PR for the flag, endpoint and banner; a second for audit threading, which is
the part worth doing carefully.

## Sequencing

1. **Now:** `dev-login` is host-only (done). Agent verification uses container
   token minting. Browser testing uses an SSH tunnel:
   `ssh -L 5005:127.0.0.1:5005 appqa`, then point the client at `localhost:5005`.
2. **Before the NAFIS load:** build §1–§4.
3. **At the load:** delete `dev-login` entirely. Not disable — delete. An
   env-var-gated auth bypass in the codebase is a permanent invitation to a
   misconfiguration, and it has already gone live once by exactly that route
   (an unset `FLASK_ENV` reading as non-production, issue #96).

## Decisions needed

- **Who may impersonate?** Administrators only, or career-services operators
  too? The wider the set, the weaker the control.
- **Is a reason mandatory** at the point of impersonation? Recommended: yes —
  it costs one field and it is the difference between a log you can audit and a
  log you can only count.
- **Should impersonation be possible in production at all**, or only on
  staging? A blanket production ban is cleaner, but it means production defects
  affecting one user cannot be reproduced as that user.
