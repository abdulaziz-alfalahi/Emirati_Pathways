# Scope: recruitment open days in the CRM

**Status:** scope for review — not built. §7 ANSWERED by the owner 2026-08-13; see §9 for what those answers changed and what is still open.
**Origin:** owner description of the current EHRDC process, 2026-08-13. Supersedes the "bulk broadcast" reading of `fb_1786359006_38c4a710`.

---

## 1. The process as I understand it

Please correct anything wrong here, because the design follows from it.

1. EHRDC arranges a **recruitment open day** at a community mall in Dubai, in coordination with companies that have posted vacancies.
2. **CRM agents call targeted candidates** and invite them to the event.
3. On the day, candidates **scan a QR code to register** and receive a **queue token number** for interviews.
4. Employers interview at the venue.
5. Afterwards, EHRDC needs the **recruitment outcome** from each employer.

The ask is to manage this in the CRM: who was invited, who confirmed, who actually attended, and what happened afterwards.

## 2. The correction that changes the design

I had this filed as "bulk broadcast" and declined to build it on the grounds that messaging thousands of nationals needs a policy decision. **That was the wrong reading.**

**The invitation is not a message. It is an outcome of a phone call that already happens.** The agent is on the line; the invitation is something they record. That means:

- No messaging infrastructure is required to launch this.
- The invitation belongs in the **existing call workflow**, alongside `call_status` and `counseling_remarks`.
- The **bulk selection just shipped (#375)** is already the mechanism for choosing who to invite: filter the roster (Dubai preference + Working Status + age, say), select, and assign them to an event as a call list.

That last point matters — the filtering and selection work already done is the front half of this feature.

## 3. The constraint that decides check-in

Measured against the live roster, 2026-08-13:

| | |
|---|---|
| CRM candidates | **5,298** |
| …who can log in (UAE Pass) | **12 — 0.2%** |
| …with a phone number | 5,289 — **100%** |
| …with an email address | 5,293 — 100% |

**Check-in cannot require a platform account, an app, or a login.** Any design where the QR leads to a sign-in page fails for 99.8% of the people standing in the queue.

Two further constraints from the current environment:

- **Outbound email is blocked at the firewall** (open with Moro, item 2), so an emailed invitation or ticket cannot be relied on yet.
- **SMS is unproven here.** Twilio settings exist in the old production environment but nothing on this platform sends SMS today.

So the invitation cannot be *delivered* electronically right now — which is fine, because it is delivered **by the agent, on the call**.

## 4. Proposed design

### 4.1 The check-in code — no login, no app, no SMS

At the moment the agent invites the candidate, the system issues a **short code** (e.g. `4821`) for that candidate at that event. The agent reads it out on the call: *"Your code is 4821 — bring it on the day."*

At the venue, the poster QR opens a public check-in page that asks for **the code plus the last four digits of the phone number**. Match → attendance recorded, queue token issued on screen.

Why this shape:

- Works for 100% of the roster with **zero new infrastructure** and no dependency on email or SMS.
- The code proves the candidate actually spoke to an agent, so the page cannot be used to probe whether a given Emirates ID is invited — a page that took an EID and answered would leak exactly that.
- It degrades gracefully: **staff can always check someone in manually** by searching the invited list, for anyone who forgets their code. That path is needed regardless.
- When the candidate app ships (#324), the same code becomes a personal QR in the app for the 
  minority who have it. Nothing is thrown away.

**Connectivity:** a mall is a hostile network. The staff check-in screen should hold the invited list locally and queue check-ins if the connection drops, rather than blocking a queue of people.

### 4.2 Queue tokens

Issued at check-in, displayed immediately, and visible to staff as a live list.

**Open question (§7):** one queue for the event, or one per employer? If six employers have booths, candidates almost certainly queue per employer, which means a token per employer-interest rather than per person.

### 4.3 The lifecycle, and where it converges with an existing request

Per candidate, per event:

```
invited → confirmed | declined | no answer → attended | no-show
        → interviewed by employer X → offered | rejected | hired
```

The tail of that is **exactly** the "Shared Pipeline Views" request in #364:

> Submitted → Shortlisted → Interview Scheduled → Offered → Placed, with a standardised rejection reason

**These are one feature, not two.** An open day is a batch of candidates entering the same employer pipeline on the same day. Building them separately would produce two competing stage models over the same candidates — the drift pattern that has already cost us twice today (route vs navigation roles, list vs export filters).

### 4.4 Post-event outcomes

Two ways employers can report back:

- **EHRDC staff enter what the employer reports** (phone/email follow-up). Works today, no employer onboarding required.
- **Employers record it themselves** in their workspace. Better data, but depends on employer accounts being live and used — and note only 9 rows exist in `job_applications` today, so the employer-facing pipeline is essentially unused so far.

Recommend **staff entry first**, with the same fields the employer view will later write to, so nothing is re-modelled when employers do come on.

### 4.5 The funnel is the actual product

Everything above exists to answer one question EHRDC will be asked:

> *Of the 400 candidates we called for the Al Barsha open day, how many confirmed, how many turned up, how many were interviewed, and how many were hired?*

If the data model records each transition with a timestamp and an actor, that report is a straightforward query and the CRM's work becomes measurable for the first time. That should be a design goal, not an afterthought.

## 5. Data model sketch

- `recruitment_events` — title, venue, starts/ends, status, created_by
- `event_employers` — event ↔ company, booth/queue label, expected roles
- `event_invitations` — event ↔ candidate, invited_by, invited_at, check-in code, response (`confirmed` / `declined` / `no_answer`), responded_at
- `event_attendance` — checked_in_at, method (`code` / `staff`), queue token, checked_in_by
- Outcomes — reuse the application/pipeline structures rather than inventing a parallel one (see §4.3)

## 6. What I would not build

- **Mass messaging.** Not needed: the call is the channel. If SMS confirmations are wanted later, that is a separate decision with its own consent question.
- **A public event listing.** These are targeted invitations, not open registration. Nothing here should create a public sign-up page.
- **Anything requiring candidates to have accounts** — see §3.

## 7. Decisions needed

1. **Queue: one per event, or one per employer?** This changes the token model and the check-in screen.
2. **Check-in identity:** the code + last-four approach in §4.1, or would you prefer staff to check people in from a list without any candidate-side step at all? (Simpler, slower at the door, no code to forget.)
3. **Who records post-event outcomes** — EHRDC staff, or employers themselves?
4. **Should this and "Shared Pipeline Views" (#364) be built as one stage model?** I recommend yes.
5. **Is the event roster drawn from the CRM only**, or can walk-ins be registered on the day? Walk-ins are common at malls and change the check-in design.

## 8. Effort

Moderate, and mostly CRUD plus one careful public endpoint. The front half — filtering, selection, bulk actions — already exists as of #372–#375. The genuinely new pieces are the event entity, the check-in code and its public page, the queue display, and the outcome stages.

The public check-in endpoint is the only part that needs real care: it is unauthenticated by necessity, so it must be rate-limited, must never return personal data, and must confirm nothing about anyone who is not standing in front of staff with a valid code.

---

## 9. Owner decisions, 2026-08-13 — and what they change

| # | Decision |
|---|---|
| 1 | **One queue per event**, not per employer. |
| 2 | **Walk-ins are expected.** Events are announced on social media. A walk-in scans the QR, **signs in via UAE Pass**, registers attendance, receives a token — **or becomes a new platform user in the process**. |
| 3 | **Invited CRM candidates will have the app**, and will receive broadcasts and invitations through it. |
| 4 | **Candidates confirm their interest** on receiving the invitation. |
| 5 | **A calendar of events**, populated by CRM agents and visible to candidates, showing event details, participating companies and vacancies. |

### 9.1 Two things I got wrong

**"No login at check-in."** I argued this from the 0.2% figure. The owner's answer is better: at a mall the candidate is holding their phone and UAE Pass is the national identity, so the sign-in *is* the registration — and for a walk-in it is also the moment they join the platform. The 0.2% is not a ceiling, it is the thing this event is meant to change.

**"I would not build a public event listing."** Decision 5 asks for exactly that, and it is right: an event announced on social media needs a public page to link to, and that page is what produces the walk-ins.

### 9.2 The dependency that decides sequencing

Decisions 3 and 4 route invitations and confirmations **through the app**. The app does not exist yet — `mobile/` has not been scaffolded and the v1 scope only merged today (#324). If open-day management waits for the app, it ships after the app ships.

It does not need to. Proposed split:

**Phase 1 — everything that does not need the app**
- Events, with the CRM agent as author
- **Public events calendar** (details, participating companies, their vacancies) — the link for social media
- Invitation tracking inside the existing call workflow, using the filtering and bulk selection from #372–#375
- **QR check-in via UAE Pass**, which serves walk-ins and any invited candidate who has onboarded
- **Staff manual check-in** — required regardless, for anyone whose phone or signal fails at the door
- Queue tokens, live queue view
- Post-event outcomes

**Phase 2 — once the app is live**
- In-app invitation and broadcast to the invited list
- In-app confirmation
- The check-in code becomes a personal QR in the app

Phase 1 is usable at the next open day. Phase 2 improves reach without redesigning anything.

### 9.3 A walk-in signing in becomes a user — what kind?

This is the most consequential detail in decision 2, and it needs an explicit answer before building.

A walk-in completing UAE Pass at the venue creates a real account bound to a real Emirates ID. Today's onboarding gives a national the `candidate` role. Open questions:

- Does that person also get a **`candidate_profiles` row and enter the CRM roster** (currently 5,298)? If yes, the roster grows from events, which is probably what EHRDC wants — but it changes who agents are calling.
- Is their attendance record **linked to that new account**, so their outcome can be tracked afterwards?
- What do they see immediately after signing in — the event's vacancies, or a profile-completion prompt?

Getting this wrong produces either orphaned attendance records or a roster full of accounts nobody called.

### 9.4 Final answers, 2026-08-13 — PHASE 1 STARTED

| question | answer |
|---|---|
| Calendar visibility | **Platform users only**, not public. Social media announcements drive traffic *to the platform* so people register and complete their details before the event — which also means most attendees arrive already onboarded. |
| Capacity cap | **None for now** — no `max_attendees`. |
| Invitee queue priority | **Dropped.** One queue, first-come-first-served. |
| Agent-read check-in code | **Dropped.** Identity at the door is UAE Pass or staff check-in. |

Consequences carried into the build:
- **Staff check-in is load-bearing**, not a fallback of convenience. With no code and no priority, a candidate whose phone or signal fails at the door has exactly one remaining path.
- The invitation carries **no secret**, so nothing about it needs protecting in transit.
- Because there is no priority and no cap, the queue is a single sequence — enforced by `UNIQUE (event_id, queue_token)` rather than by application code.

**Migration 061 RAN on the live DB 2026-08-13**, verified with eight negative probes (bad status, inverted dates, duplicate token, double check-in, unknown method, unknown user, unknown stage, duplicate invitation — all refused, 0 rows left).

### 9.5 Still open

1. **Should the events calendar be fully public** (no login), so a social-media post can link straight to it? Recommend yes — it is what turns an announcement into a walk-in.
2. **Do invited candidates get queue priority over walk-ins?** They were called and confirmed; a walk-in simply arrived. One queue per event (decision 1) does not by itself say how the two are ordered.
3. **Is there a capacity limit per event?** Malls have them, and confirmations may need to stop at a number.
4. **§9.3 above** — what a walk-in's new account becomes.
5. Do we still want the agent-read check-in code from §4.1 as the **fallback for invited candidates without the app**, or is UAE Pass plus staff lookup enough? The code costs little and covers the gap until Phase 2.
