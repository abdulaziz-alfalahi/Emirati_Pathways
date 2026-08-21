---
name: e2e-staging
description: Run or verify an end-to-end flow on staging through the browser (Playwright MCP). Use when asked to test a user flow, reproduce a bug in the UI, or validate a deploy end to end.
---

# End-to-end verification on staging

## Browser setup
The `playwright` MCP server is pre-configured for this network: headless Chromium through the corporate proxy `10.61.192.2:8080` (bypass for 10.228.145.5/localhost), HTTPS errors ignored (WAF cert), viewport 1440x900, screenshots to `~/Downloads/emirati-crawl`. Just use the `mcp__playwright__*` tools — do not spawn your own browser.

## Signing in as a test user (the ONLY way — do not look for a password)
There is **no password login** on this platform; UAE Pass is the sole real login (owner, 2026-08-21). Verification therefore runs through `dev-login`, which is reachable **only from the host or a loopback tunnel** and only for the 24 accounts flagged `users.is_test_account` (PR #454, migration 073).

Open the tunnel (local port ≠ 8089 — that is taken by the dev box's own Vite):
```bash
ssh -f -N -L 18089:127.0.0.1:8089 appqa      # browse http://localhost:18089
```
Reaching the app through `localhost` is what makes dev-login work: WAF traffic carries the GIN node address and is refused with a 404.

Then, in the page, sign in and hydrate the SPA. Cookies alone are NOT enough — `AuthContext.initializeAuth` gates on `authService.isAuthenticated()`, which reads `localStorage`, so a cookie-only session still bounces to `/auth`:
```js
const r = await fetch('/api/auth/uaepass/dev-login', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  credentials: 'include', body: JSON.stringify({user_id: '784000000000020'}) });
const j = await r.json();
localStorage.setItem('access_token', j.data.access_token);
localStorage.setItem('refresh_token', j.data.refresh_token);
localStorage.setItem('user', JSON.stringify(j.data.user));
```
Then **navigate** (not just re-render) so `initializeAuth` runs. `GET /api/auth/uaepass/dev-login/users` lists all 24 accounts with their roles; there is one per role (`admin@test.ehrdc.ae` = 784000000000020 reaches every route).

Language: set `localStorage['preferred-language'] = 'ar'` and navigate. For RTL checks, **measure** rather than eyeball — compare the first tab's `getBoundingClientRect().right` against the tablist's `right`; they should coincide in Arabic. Note that feedback screenshots (html2canvas) mangle Arabic glyph shaping, so they are evidence of layout only, never of text rendering.

## Environment facts
- Entry: `https://stg-emirati.ehrdc.gov.ae` (WAF → APPQA). The WAF can challenge unusual traffic; a blocked request is not necessarily an app bug.
- UAE Pass runs against the UAE Pass **staging** IdP (`stg-id(s).uaepass.ae`). A real staging UAE Pass account is needed to complete the handoff; short of that, verify the authorization_url redirect and server-side state, as in the 2026-07-20 E2E run.
- The wizard is OTP-free since PR #105: invitation → UAE Pass → callback redeems the invitation (`redeem_invitation_for_user`).
- Operator accounts pass the OPERATOR_ROLES gate; there is no `employer_relations` account on staging — admins are used instead.

## Test-data discipline
- All created data uses the `ZZ-` prefix (`ZZ-E2E ...`, `ZZ-QA-SEED ...`) so it is findable and deletable.
- **Clean up when done** — this DB holds production data. Check `companies`, `users`, `company_invitations`, `company_team_members`, `hr_profiles`, `job_postings` for leftovers.
- Magic-link invitations expire after 7 days; the staging invitation list being empty usually means expiry, not a bug. Operators can reissue and copy links from the pipeline rows.

## Known checkpoints for the employer flow
CSV import → check-companies badges → invitation with intended_role → magic link → UAE Pass handoff → role/membership durable (`users.role` + `company_team_members` 'accepted') → publish blocked 403 `company_not_verified` until operator approve → publish succeeds. Any deviation from this chain is a regression against PRs #101–#109.
