# Academic Programs — one directory, two pages, and the study journey

Owner, 2026-08-30: *"take graduate programs next. I need you to cover the full
workflow and the involved personas."*

## What was there

Six rows written in one instant on 2026-06-17, attributing invented tuition,
invented enrolment and a rating from a non-existent rating system to six **named
real universities** — AED 95,000 for the MBRSG MBA, AED 78,000 at Khalifa,
"Fully Funded" for a Masdar PhD. Removed by migration 096.

The page's action button ran `window.open()` onto a Google search for
`"<university> <programme> graduate admissions"`. Its *Requirements* tab is
static prose and its *Funding* tab is a paragraph linking to `/scholarships`.

## The constraint that shapes everything

**The platform cannot accept an application on a university's behalf.** Graduate
admissions run through each institution's own system, with its own documents,
fees and deadlines. Anything that looked like "apply here" would be a lie, and
a worse one than the invented tuition, because somebody would rely on it.

So the platform does the two things it honestly can:

1. **Point accurately** — a curated directory where every published programme
   carries a source link that is checked, and figures are attributed to the
   institution rather than asserted by us.
2. **Remember the journey** — what a person is considering, that they applied,
   and how it ended. That is the part no university system will ever tell the
   Council, and it is what Article 4(10) reporting needs: *how many nationals
   progressed to graduate study* is unanswerable unless intent and outcome are
   recorded somewhere.

## Why this reuses scholarships, not Knowledge Camps

Camps are submitted by schools and centres who will genuinely log in and post.
**Nobody at Khalifa University is going to log in and post an MSc.** Copying the
camps workflow here would produce a submission queue nothing ever enters.

`scholarships` already solves the actual problem: a curated directory with
`application_link`, `link_type`, `link_status`, `link_status_detail`,
`link_checked_at` and `link_fingerprint`, fed by a scout the operator reviews and
verified nightly by `emirati-link-check`. Graduate programmes take the same
columns and the same checker.

Institutional submission still exists, because a university that *does* want to
correct its own entry should be able to — but it is the secondary path, not the
one the model is built around.

## The personas

| Persona | What they do here |
|---|---|
| **Education Operator** | Owns the directory. Adds and publishes programmes, reviews anything an institution submits, and acts on links the checker reports dead. |
| **Institution staff** (`institution_staff`) | May submit or correct their own institution's programmes. Bound to the institution, so nobody submits for a university they do not work at. |
| **Candidate / student** | Discovers, saves, records that they are applying, and records how it ended. |
| **Career Services Operator, Career Coach, Academic Advisor** | See what a candidate is considering, so guidance is informed by it rather than asking again. Read-only — the candidate owns their own record. |
| **The nightly link checker** | Re-verifies every published programme link and marks the dead ones. Already runs at 02:15 UTC for scholarships. |

## The workflow

```
  Education Operator ──add──▶ [draft] ─────────────────publish──▶ [published]
  institution staff ─submit─▶ [submitted] ──review──▶ publish / reject-with-reason
                                                                       │
                          nightly link check ◀──────────────────────────┘
                          dead link → flagged for the operator, never silently dropped

  candidate:  browse ──save──▶ interested ──▶ applying ──▶ admitted / declined / withdrawn
                                    │
                                    └── visible to their career services operator and advisor
```

### Publishing rule, and it is enforced

**A programme cannot be published without a working application link and a date
on which its details were checked.** That is the whole answer to what went wrong
here: the removed rows had figures and no source. Tuition is displayed as *"as
published by <institution>, checked <date>"* — attribution, never assertion.

### Statuses

| status | meaning | public? |
|---|---|---|
| `draft` | operator is still entering it | no |
| `submitted` | an institution has proposed it | no |
| `published` | listed | **yes** |
| `rejected` | declined, with a reason the submitter reads | no |
| `archived` | intake closed or programme withdrawn | no |

### Interest, and why it is not called "application"

`graduate_program_interest` holds `interested → applying → admitted / declined /
withdrawn`. The name matters: the platform is recording what a person told us,
not an application it processed. Calling the table `applications` would invite
the next reader to build a submit button that cannot exist.

## University Programs joined this, rather than getting its own (2026-08-30)

University Programs was a **doubly parallel** subsystem — two tables for each
concept the platform already had:

| concept | the real one | the parallel one |
|---|---|---|
| institution | `institutions` (staff, students, camps, programmes) | `universities` |
| programme | `graduate_programs` | `university_programs` |

Both parallel tables were empty, filled only by `seed_education.py`, which the
migrations README documented as the way to populate the page. It would have
inserted a **ranking of real UAE universities** (1st, 2nd, 3rd), their student
counts, and **graduate employment rates of 96–98%** — the exact number a student
uses to choose a degree, invented and attributed to named institutions. That
script is deleted.

An undergraduate degree and a master's are the same object: a programme, at an
institution, with a link and a date its details were checked. So
`graduate_programs` became **`academic_programs` with a `level`**, and serves
both pages — University Programs asks for `undergraduate`, this page for the
rest. `universities` and `university_programs` are dropped.

The **Universities tab is derived**: the institutions that actually have a
published programme here, with a count. That is what can be said honestly. A
ranking, an employment rate or a student count is a claim the platform has no
way to know and no business publishing about a named university.

Also removed: `POST /api/education/programs/<id>/apply`, which answered
*"Application submitted successfully"* while sending nothing to any university.
No page called it. It is the exact claim the constraint above says this platform
cannot make.

## Deliberately not built

**No rating.** There is no rating system on this platform. The removed rows had
4.5–4.9 anyway.

**No capacity or enrolment.** Those are the university's numbers and we have no
way to know them. The invented `60/70` figures are precisely what this replaces.

**No application submission.** See the constraint above.
