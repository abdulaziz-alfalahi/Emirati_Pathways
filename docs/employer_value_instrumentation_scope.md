# Employer-value instrumentation — scope

**Status: scope only, nothing built.** For review before any implementation.

## Why

Pricing employers requires knowing what an employer actually receives. Today the
platform cannot state, for any company: how many people it hired through us, how
long that took, or where its pipeline leaks. Without those, a rate card is a
guess and a renewal conversation is an assertion.

This is deliberately **measurement, not billing**. It is useful whether or not
pricing ever ships — the same numbers answer "what is this employer getting",
"where is the pipeline failing", and "what does the Council report as impact".

**The design test for every metric below: would we be willing to show this
number to the employer it describes?** If not, it should not exist. That rules
out vanity metrics and it rules out anything we could not defend in a meeting.

## What we can compute today

Verified against the live schema 2026-08-16. The join chain is complete:

```
job_postings.company_id  →  job_applications.job_id  →  application_status_history.application_id
```

| Source | Gives us |
|---|---|
| `job_applications` (`status`, `applied_at`, `job_id`, `candidate_id`) | Pipeline position per application |
| `application_status_history` (`new_status`, `previous_status`, `changed_at`, `changed_by`) | Time in each stage, and therefore time-to-hire |
| `application_stages.py` + migration 068 CHECK | One canonical vocabulary. `placed` is a single state, so a hire is countable |
| `rejection_reasons.py` (`employer_side` flag) | Why candidates were rejected, and by whose decision |
| `companies`, `company_team_members` | Which employer, which recruiters |
| `interviews`, assessment tables | What was delivered beyond matching |

Migration 068 matters more than it looks: before it, `hired`, `accepted` and
`placed` were three names for one thing, and any placement count would have been
wrong. Outcome-based pricing is only possible because that was settled.

## The metric set

### Outcomes — what justifies a fee

- **Placements** — applications reaching `placed`, by company, by period.
- **Time-to-hire** — application submitted → `placed`. **Median, not mean**: one
  six-month req would otherwise define the whole cohort.
- **Time-to-first-shortlist** — submitted → `shortlisted`. This is *our*
  performance, separable from how fast the employer then moves, and it is the
  number that defends the platform when an employer complains about speed.

### Funnel — where value is created or lost

- Stage counts and stage-to-stage conversion across the seven canonical stages.
- **Rejection reasons, aggregated** — now possible because the vocabulary is
  standardised.
- **Employer-side rejections reported separately.** `role_filled`,
  `role_withdrawn`, `budget_changed`, `requirements_changed` say nothing about
  candidate quality. Folding them into a rejection rate would misrepresent both
  the candidates and the employer.

### Engagement — the active/inactive question, answered with data

- Active postings; recruiter seats in use.
- **Response latency** — how long applications sit unreviewed. This is the
  strongest single signal of an engaged employer, it is a candidate-experience
  measure in its own right, and it is a fair basis for ranking employers in
  search. Note it is a *ranking* input, not a billing input.
- Days since last recruiter action.

### Supply — what the platform gave them

Candidates surfaced, applications received, interviews conducted, assessments
delivered. This is the "you received X" side of any value conversation.

## Decisions to make before building

These are judgement calls, not technical ones, and they should be settled
explicitly rather than emerging from whoever writes the first query.

1. **Attribution.** When is a hire "ours"? Proposal: **an application record
   exists** — the candidate applied through the platform. Simple, auditable, and
   it does not require adjudicating whether the employer already knew them. Any
   richer rule invites disputes we cannot win.

2. **Which timestamp is authoritative.** `job_applications` carries both
   `applied_at` *and* `submitted_at`, and both `updated_at` *and* `last_updated`.
   Duplicated columns are how two dashboards end up disagreeing. Pick one of each,
   write it down, and have the metric layer use only that.

3. **Attribution window.** If a candidate applies in March and is placed in
   September, which period owns the placement? Proposal: **the period of the
   placement**, since that is when value was delivered.

4. **Honest nulls.** An employer with no placements shows "no placements yet",
   not `0%`. A conversion rate on three applications is not a rate. Suppress
   percentages below a minimum denominator and say why — the same discipline the
   AI usage panel already follows.

5. **One definition layer.** These numbers will appear in an employer view, an
   operator view, and eventually a Council report. They must come from one
   module, not three queries that drift. This is the `hired`/`placed` lesson
   applied before the fact rather than after.

## Hazards found while scoping

- **Duplicate timestamp columns** on `job_applications` (above). Cheap to
  resolve now, expensive once three consumers depend on different ones.
- **`ai_usage_log` has no company dimension.** So cost-to-serve *per employer*
  is not computable today. Deliberately not proposing to add one yet: it would
  mean threading company identity into every AI call, and the aggregate spend we
  now collect answers the platform-level question without it. Revisit only if
  per-employer margin becomes a real requirement.
- **`changed_by` is populated by six code paths.** Before using it to separate
  employer action from system action, confirm it is set consistently.

## Surfaces

1. **Employer view** — their own numbers only. Doubles as the renewal argument.
2. **Operator/admin view** — across employers: who is active, who is stalled,
   where placements concentrate. This is the view that informs pricing.
3. **Council reporting** — aggregate placements and time-to-hire as impact
   evidence. Aggregate only.

## Phasing

**Phase 1 — the definition layer and outcomes.** One module computing
placements, time-to-hire, time-to-first-shortlist per company, with the
decisions above settled. No UI. This alone answers "what is an employer getting".

**Phase 2 — funnel and rejection analytics**, on the same layer.

**Phase 3 — surfaces**, employer view first.

**Phase 4 — engagement and ranking inputs.**

Phase 1 is worth doing regardless of the pricing outcome, which is why it is
first.

## Explicitly out of scope

Billing, invoicing, payment collection, rate cards, and per-employer cost
attribution. This scope measures value delivered. What is charged for it is a
separate decision, and building the measurement first means that decision can be
made on evidence.
