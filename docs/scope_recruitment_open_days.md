# Scope: recruitment open days in the CRM

**Status:** scope for review — not built. Needs the decisions in §7.
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
