# Youth Programmes — listing, review and registration

One directory behind two pages: **Knowledge Camps** (`stream=camp`) and **Youth
Development** (`stream=development`).

Owner request, 2026-08-29: *"Which operator should have control over what gets
posted? Does the operator post, or do the different stakeholders post, and does
the operator review and approve? I want it to be a one-stop shop where listing
and registration take place."*

## What was there before this

A demo, and it is worth being precise about that because it shaped every
decision below.

**The six camps were seed rows written on 2026-05-04**, inside
`ensure_camps_table()`, inserted whenever the table was found empty. Their
ratings (4.5–4.9), enrolment counts (`45/60`, `52/60`) and prices (AED 1,500 –
2,500) were all invented by whoever wrote that function. The page summed the
fabricated enrolment counts into a public "Students Enrolled" figure.

**There was no registration.** The button read "Find how to register" and ran:

```js
window.open(`https://www.google.com/search?q=${camp.title.en} Dubai registration`)
```

It searched Google for the camp's name. The "My Registrations" tab beneath it
could never populate, because no registrations table existed.

**There was no way to post a camp.** One endpoint existed, `GET
/api/education/camps`. No POST, no operator screen, no submission form. Those
six rows were only ever changeable with SQL.

**And a parent-facing view had been failing silently.** `career_services_routes`
selects `start_date, end_date, location_ar, age_range, spots_remaining` from
this table — five columns that did not exist — inside a bare `except:`. It has
returned an empty list to every parent since it was written.

## The decisions

### Stakeholders post. The operator approves.

Not the operator posting. An operator typing other organisations' camps in by
hand becomes the bottleneck for every date change, and the listing goes stale
the moment a provider changes anything — which is precisely how six rows came to
sit unchanged for four months. A camp is submitted by the organisation running
it, and is invisible to the public until an operator publishes it.

### The Education Operator owns the queue

It already partners with schools, universities and institutes, already
provisions institutions and binds their staff, and its dashboard already carries
the shape: *Institutions & Staff*, *Programs*, *Scholarships*, *Scout Review*,
*Enrollment*. Reviewing a camp is the same act as *Scout Review* on a
scholarship, so the queue sits beside it.

The Professional Development Operator keeps adult training. **The split is by
audience, not by mechanism** — camps are for school-age youth, training
programmes are for working adults.

### This reuses the training-programme model rather than inventing one

`training_programs` already carries `status` (`submitted` → `published`),
`created_by`, `approved_by` and `provider_id`, with `training_program_enrollments`
beside it: providers submit, the Professional Development Operator vets,
candidates enrol. That is the same workflow this request describes, already
running in this codebase.

Knowledge Camps is therefore the education-sector twin of that model, deliberately
using the same status vocabulary and the same shape. The week of 2026-08-27 was
spent removing a parallel role family, seven competing label registries and two
stores for one fact; adding a differently-shaped approval workflow next to an
existing one would have been the same mistake in a new place.

### A submitter must be bound to the organisation they submit for

Reuses `BOUND_ROLE_REQUIREMENTS` and the binding tables it already checks —
`institution_staff` and `training_center_staff`. Somebody may submit a camp for
an institution only if they are actually staff of it. Without this, "stakeholders
post" means "anybody posts".

### Enrolment becomes a count, not a decoration

`knowledge_camps.enrolled` and `.rating` are dropped. Enrolment is derived from
rows in `camp_registrations`, and capacity is enforced in the transaction that
writes one rather than displayed as a progress bar over an invented number.
There is no rating system on this platform, so there is no rating column.

## The model

```
        provider staff                education operator            candidate
        (institution_staff /          (education_operator)          / guardian
         training_center_staff)
              │                              │                          │
   POST /camps│ draft ──submit──▶ submitted  │                          │
              │                    │  ├──approve──▶ published ──────────┤
              │                    │  └──reject───▶ rejected            │
              │                                     (with a reason)     │
              │                                                         │
              └──── edits return a published camp to `submitted` ───────┘
                                                                        │
                                              POST /camps/<id>/register ┘
                                              capacity checked in-transaction
```

### Statuses

| status | meaning | public? |
|---|---|---|
| `draft` | provider is still writing it | no |
| `submitted` | awaiting operator review | no |
| `published` | live and open for registration | **yes** |
| `rejected` | operator declined, with a reason the provider can read | no |
| `archived` | ran, or withdrawn; kept for the record | no |

A published camp that the provider edits returns to `submitted`. Approval
applies to what was reviewed, not to the row forever — the same principle as the
outbound-mail template fingerprint, where an approval stops applying when the
wording changes.

### Registration

`camp_registrations` mirrors `training_program_enrollments`:
`camp_id, user_id, status, registered_at`, with `UNIQUE (camp_id, user_id)` so a
double-click cannot register somebody twice.

Capacity is checked and the row written in one transaction, so two people racing
for the last place cannot both get it. When a camp is full the registration is
recorded as `waitlisted` rather than refused, which keeps demand visible to the
operator instead of discarding it.

## Deliberately not decided here

**Consent for minors.** These camps are for teenagers, and the platform's users
are job seekers. Whether a parent registers the child, or the child registers and
a parent confirms, is a policy question that was raised with the owner and not
answered, so it is not invented here. `camp_registrations.guardian_user_id` and
`minor_consent_at` exist so the policy can be applied without a migration, and
`student_guardians` (currently empty) is the link the internship feature already
uses for the same problem.

Until that is decided, registration is for the signed-in user only.

**Payment.** Camps carry a price as free text and always have. Nothing on this
platform takes money, and this change does not start.


## Youth Development joined this (2026-08-30)

`youth_programs` was a parallel table to this one: a single read endpoint doing
`SELECT * ... ORDER BY enrolled DESC` — sorting by the invented enrolment column
migration 096 removed — with no workflow, no review and no registration.

Its rows make the point. "Youth Innovation Bootcamp" (Dubai Future Foundation)
and "STEM Excellence Academy" (Ministry of Education) are camps in all but name,
and one of them credited **1200/1200 participants to the Ministry of Defence**.

A youth programme and a knowledge camp are the same object: a youth-oriented
programme, run by an organisation, with an age range, dates, a capacity and
people who want a place. Keeping both would have given the platform a **third**
programme table with its own workflow, review queue and registration — after
folding university programmes into `academic_programs` the same morning for
exactly that reason.

So migration 100 dropped the vestigial table, renamed this one to
`youth_programs`, and added `stream`. One directory, one review queue, one
registration mechanism, two pages.

### Two things that migration got right because an earlier one got them wrong

**Constraint names were renamed in the same migration.** Migration 098 renamed a
table and left seventeen constraints, three indexes and two sequences carrying
the old name, needing 099 to repair it. Postgres renames the table and nothing
else.

**The response key was `camps` and the new page read `programs`.** The page
would have rendered silently empty — HTTP 200, no error, no listings. It was
caught by a verification script raising `KeyError`, not by any test, and is the
same shape as the outbound-mail defects: the backend returns one name, the
frontend reads another, and nothing fails loudly enough to notice. There is now
a test asserting the key matches what both pages read.
