# Shared Pipeline Views & One-Click Feedback — scope

**Status: scoped, not built.** From `fb_1786434633`. Owner decisions recorded
2026-08-20; two of them change the design materially and are the reason this was
not started blind.

## The request

> Employers can view/mark candidates in structured stages: Submitted →
> Shortlisted → Interview Scheduled → Offered → Placed. Additionally, employers
> can mark candidates as Hired, Rejected (with standardized rejection reason), or
> Request Secondary Interview, automatically updating the CRM agent's dashboard
> in real-time.

## What already exists — check before building

`job_applications.status` is live and in use: `shortlisted`,
`interview_scheduled`, `under_review`, `withdrawn`. There is a status-update
endpoint (`PUT /api/hr/jobs/<job_id>/shortlist/<candidate_id>/status`) and
shortlist listing endpoints.

So the stages are not the gap. The gaps are:

- **no `rejection_reason` column** on `job_applications` (verified 2026-08-20);
- **no `stage` column** — status carries it, which may be sufficient;
- **no employer-facing board** that presents the pipeline as columns;
- **no "request secondary interview" action**.

## Owner decision 1 — who owns the rejection reasons

**The CRM team owns the list, aided by AI for analysis and recommendations.**

This is the decision that changes the feature. A rejection reason is not only a
label for reporting — it is the input to a remediation recommendation. "Rejected:
insufficient experience in X" should surface what the platform can actually do
about it: a **training programme** from the catalogue, a **mentor**, a **coach**.

Consequences for the design:

- The reason vocabulary is **editable by the CRM team**, not hardcoded in a
  frontend enum. It needs a table and an admin surface, or it will be a
  developer ticket every time the team learns something.
- Each reason should be able to carry a **recommended remediation** — and the
  platform already has the three things to point at: `training_programs`
  (canonical catalogue, migrations 032/033), the mentor system, and coaching
  (`coach_client_assignments`, now operator-assignable).
- The AI half is **recommendation, not classification**: it proposes which
  training/mentor/coach fits a reason, and a human keeps the list. Do not let it
  invent reasons — that is how a controlled vocabulary stops being controlled.

## Owner decision 2 — no notifications, live refresh

**"No need for a notification as it could be overwhelming with the increase of
candidates. I would prefer a live-refreshing."**

So the CRM dashboard **polls or subscribes**; it does not fire a notification per
pipeline event. That is the right call at the volumes coming: 3,969 seekers
already loaded, 150k the eventual target. One notification per stage change per
candidate would bury the notifications that matter.

Implementation note: the platform already runs Socket.IO, but the backend is
pinned to **one gunicorn worker** for that reason, and production will have
**two nodes behind a load balancer** — which needs sticky sessions or a shared
message queue before Socket.IO can be relied on there (open question with Moro).
**Polling is the safer default** until that is resolved, and it is what
`BoardMeetingRoom` already does for participants and quorum.

## Sizing

| Part | Scope | Size |
|---|---|---|
| Rejection-reason vocabulary | Table + CRM-team admin surface + seed list | **Medium** (one migration) |
| `rejection_reason` on applications | Column + write path on the status endpoint | **Small** |
| Request secondary interview | New action + status | **Small** |
| Employer pipeline board | Columns by stage, drag or menu to move | **Medium** |
| Live-refreshing CRM view | Poll the existing roster/application endpoints | **Small** |
| AI remediation suggestions | Map a reason to training/mentor/coach | **Medium** — needs the reason table first |

Do the vocabulary first. Every other part depends on what a reason *is*, and
building the board against a hardcoded enum would mean rewriting it when the CRM
team takes ownership.

## Open questions

- Should a rejection reason be **visible to the candidate**, or internal only?
  That decides whether the vocabulary needs a second, candidate-facing phrasing.
- Does "Placed" here mean the same as the GPSSA-backed placement signal used for
  the seeker queue? If so it should read from the same source rather than
  becoming a second definition of placed.
