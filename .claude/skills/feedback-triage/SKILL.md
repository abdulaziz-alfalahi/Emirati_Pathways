---
name: feedback-triage
description: Triage a pasted in-app feedback report (session, network errors, breadcrumbs, screenshot). Use whenever the user pastes a feedback report or asks to investigate one.
---

# Triaging in-app feedback reports

Feedback reports pasted into the chat are structured — read every section before touching code:

1. **Session/Auth** — who, which role, which JWT claims. Cross-check against the role model: `users.role` is primary, `secondary_roles` additive; `user_type` is a legacy mirror. A "wrong dashboard" complaint is usually a role-resolution issue, not a routing bug.
2. **Network Errors** — failed requests with status codes. Map 403s to the ACL (`access_control.py` role sets, `workspace_middleware.get_company_context` which reads `company_team_members` with status 'accepted' only). 410s are retired endpoints and expected.
3. **Breadcrumbs** — the click path; reproduce it with the e2e-staging skill if the cause is not obvious from the errors.
4. **Screenshot path** — the file lives **on APPQA**, not this box. Fetch with `scp appqa:<path> .` (key-based, non-interactive) and read it; the screenshot often contradicts the verbal description.

Diagnosis order: network errors first (objective), then session/auth (explains most 403/redirect issues), then breadcrumbs, then screenshot. File a GitHub issue with the evidence before fixing; link the feedback report content into the issue body.
