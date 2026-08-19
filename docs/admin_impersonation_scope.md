# Admin impersonation — considered and NOT built

**Decision: 2026-08-19. Do not build it.** This document previously scoped an
impersonation feature. That was the wrong answer and the scope is deleted rather
than left standing, because a plan sitting in `docs/` reads as agreed.

## What was proposed

An admin endpoint minting a short-lived token to act as another user, with
`act_as` claims, a mandatory reason, an audit record at issue, and the real
actor threaded through every audited action.

## Why it was wrong

The problem with `dev-login` was never that it impersonates. It is that it can
impersonate a **real person** — any of 5,336 accounts, with no credential —
producing an audit row indistinguishable from that person's own login. On
2026-08-19 a verification call minted a token as the platform owner's account
and read two candidate records; `admin_audit_log` shows the owner doing it,
permanently, because migration 002 makes the table append-only.

That is a **scope** defect, not an accountability-mechanism defect. Restrict the
target to accounts that exist purely for testing and the audit row saying
`coach@test.ehrdc.ae did X` is **true** — nobody is misrepresented, because
nobody is behind that account.

So the fix is a flag, not a feature: `users.is_test_account` (migration 073),
which `dev-login` refuses to bypass. Roughly fifteen lines of enforcement.

Three things made the impersonation design the worse trade:

1. **It adds a capability to govern where removing one was sufficient.** Every
   control it needed — TTL, reason, act-as claims, audit threading — exists to
   contain a power that need not be created.
2. **Host access already grants more.** Anyone who can `ssh appqa` can read the
   database directly and mint JWTs — demonstrated 2026-08-19, returning 200 on a
   protected endpoint as a `career_services_operator` with no dev-login in the
   path. Impersonation would not have closed a gap that host access leaves open.
3. **Its one genuine use case is its riskiest.** Reproducing a production bug as
   the affected citizen is the only thing the flag cannot do. There is no
   evidence that need exists: the feedback tool already captures screenshots,
   breadcrumbs and network errors, and operators can view candidate records
   through the CRM.

## What was built instead

| | |
|---|---|
| PR #434 | `dev-login` reachable only from the host — refuses any request carrying a proxy hop |
| Migration 073 | `users.is_test_account`, 24 persona accounts marked, 5,312 real accounts protected |
| PR #435 | `dev-login` refuses any target where the flag is not TRUE; the listing endpoint advertises only test accounts |

**A consequence worth noting: `dev-login` is no longer a cutover blocker.**
Restricted to flagged accounts it structurally cannot touch a citizen's record,
so it can safely survive the NAFIS load rather than needing deletion before it.
The danger was never the bypass — it was the unbounded target list.

## How verification works now

| Need | Mechanism |
|---|---|
| Agent verifying API behaviour | Mint a JWT in the container over SSH — no endpoint involved |
| Person testing the UI as a persona | `ssh -L 5005:127.0.0.1:5005 appqa`, then dev-login against `localhost:5005` as one of the 24 test accounts |

To mark another test account — deliberately, one at a time:

```sql
UPDATE users SET is_test_account = TRUE WHERE id = '7840000000000XX';
```

Never by pattern. Every national's EID is synthetic today (the `784000000000…`
range) until UAE Pass supplies real ones, so an EID-pattern rule would come to
match real citizens as the roster grows.

## When to revisit

If a production support need appears that genuinely requires acting as a real
user — a defect reproducible only as the affected person, where screenshots and
logs are insufficient — build it then, with that case as the evidence. Not
before.
