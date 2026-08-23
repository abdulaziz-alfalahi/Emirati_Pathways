# Scope: AI-assisted scouting for the scholarship directory

**Status:** scope for review — not built. Owner decisions recorded in §2.
**Follows:** the directory itself (PR #512) and the authorisation fix (PR #511).
**Origin:** owner, 2026-08-23, after establishing that this platform does not award
scholarships and instead curates a directory of programmes run elsewhere.

---

## 1. What this is

The directory is only worth having if it is **current**. Deadlines move every
cycle, links rot, and programmes open and close on their own calendars. Keeping
~50 entries accurate by hand is the kind of task that gets done for two months
and then quietly stops.

So: an AI tool in the Education Operator's dashboard that

1. **scouts** an allow-list of sources and pre-fills draft entries for review,
2. **re-verifies** every published link daily,
3. **flags** entries that look expired or changed, for the operator to act on.

**The operator approves everything.** Nothing the AI produces reaches a candidate
without a person having looked at it. That is not a safety blanket, it is the
product: a government directory's value is that someone is accountable for what
is in it.

## 2. Owner decisions, 2026-08-23

| # | Decision |
|---|---|
| 1 | **Allow-list only.** No open-web crawling. |
| 2 | **Daily** link re-verification and **daily** re-scout of sources; notify the operator to act. |
| 3 | **The Education Operator alone** owns the queue. No second approver. |
| 4 | An approach to KHDA will be drafted **later, after further verification and testing**. |
| 5 | **The Education Operator may add domains** to the allow-list themselves. No further approval. |
| 6 | Notification is **in-app AND email**. Email is expected to be available soon. |

### 2.1 What decision 1 rules out, and why it matters

Searching the open web for "UAE scholarships" surfaces scam sites and paid
aggregators alongside the real thing. On a government platform, publishing one
of those — even briefly, even flagged — is a reputational event, not a bug.
An allow-list makes the failure mode "we missed a programme" rather than "we
advertised a fraud", which is the right way round.

Adding a domain is therefore an operator action with a name against it, and by
decision 5 the operator makes that call alone. That is the right trade: a second
approver on domain additions would slow the common case (adding a university
that has just published an award) to guard against a rare one, and the operator
is already trusted to publish the listings themselves. It does mean the domain
list needs the same audit trail as everything else — who added it, when — so the
decision is attributable rather than merely fast.

### 2.2 Decision 6, and the order it has to be built in

**Outbound email is still blocked at the firewall** (open with Moro, item 2).
Nothing on this platform sends mail today.

So the in-app queue must work standalone and email is added when the path opens
— not the other way round. A daily notification that depends on a channel that
does not exist yet is a feature that silently never fires, which is the exact
failure §7 warns about: the operator would see no alerts and reasonably conclude
there was nothing to act on.

Concretely: build the queue and its in-app badge first, put the email behind a
capability check, and make the absence of the email path visible to the operator
("email notifications are not enabled yet") rather than silent.

## 3. The constraint that has already bitten

**The backend can reach the internet** through the Moro proxy at
`10.61.192.2:8080` — `u.ae` and `mohesr.gov.ae` both return 200 from inside the
container.

**`khda.gov.ae` does not**, and it is the most important source of the lot: KHDA
runs the Hamdan bin Mohammed Scholarship Programme (AED 1.1bn, 100 fully funded
places a year, applications through Dubai Now).

Diagnosed 2026-08-23, and the conclusion changed twice on the way:

| step | finding |
|---|---|
| container `urlopen` | `CERTIFICATE_VERIFY_FAILED` |
| this dev box, same proxy | **HTTP 302 — works** |
| certificate presented | genuine: `CN=*.khda.gov.ae`, `O=Knowledge and Human Development Authority`, issued by GlobalSign RSA OV SSL CA 2018, valid to **18 Dec 2026**. Not a proxy interception. |
| chain from the dev box | **3 certs, `Verify return code: 0 (ok)`** — leaf, intermediate, root |
| container clock | correct |
| GlobalSign Root CA - R3 in container store | **present** |
| exact error | `unable to get local issuer certificate` |
| container, system roots **+** the GlobalSign intermediate supplied | **HTTP 200** |

So the container is not obtaining the intermediate, while every other party on
the same network path does. **This is ours to fix, not KHDA's** — their TLS is
correctly configured and there is nothing to raise with them on these grounds.
An earlier draft of this analysis suggested otherwise and was wrong.

**Fix before building anything**: ship the chain the container needs (a
maintained CA bundle, or the intermediate pinned in the image) and add a startup
check that fetches one URL per allow-listed domain, so a source we cannot read
is loud at deploy rather than silent at 03:00.

### 3.1 The rule this produces

> **"Could not verify" is never "expired."**

Had the verifier run before this was diagnosed, it would have reported KHDA's
link as broken and invited an operator to archive a live government programme.
The two states must stay distinct in the data, in the queue, and on screen:

- `verified_ok` — fetched, and the page still looks like the programme
- `unreachable` — we could not fetch it (proxy, TLS, timeout, rate limit)
- `changed` — fetched, but the page is not what it was
- `gone` — fetched, and it is a 404 or says the programme is closed

Only `changed` and `gone` are the operator's problem. `unreachable` is **ours**,
and repeated `unreachable` on a whole domain is an infrastructure alert, not a
directory task.

## 4. What the AI produces, and what it must not

### 4.1 Provenance on every field

Each scouted entry carries: source URL, fetched-at, model and version, the raw
extracted text, and a per-field record of what the operator changed. Without it,
an approved listing is indistinguishable from a hallucinated one six months
later — and "where did this number come from" is a question a government
directory will be asked.

### 4.2 The AI does not invent eligibility

Getting "minimum GPA 3.0" wrong stops a qualified person applying, and nobody
ever finds out. So: quote eligibility from the source into a text field, and
populate structured fields (`min_gpa`, `academic_level`, `deadline`) **only**
where the source states them unambiguously. Unknown stays unknown — the same
honest-null discipline the population figures and the demographics coverage
notes already follow.

### 4.3 Arabic from the Arabic page, not from a translator

KHDA and u.ae publish Arabic versions. Translating an amount, a deadline or an
eligibility rule is a needless risk when the authoritative Arabic text exists.
Scout both, or leave Arabic empty for the operator.

### 4.4 Change detection is the valuable half

Expiry is the easy signal. The one that keeps a directory *accurate* is **"this
page changed since we last read it"** — the deadline moved from 30 June to 15
July, the amount changed, eligibility narrowed. Store a content hash and the
extracted fields; on re-scout, diff and show the operator **what** changed, not
merely that something did.

### 4.5 Soft-404s

Government sites commonly return **200** with a "page not found" body. A status
-code check sails straight past it. The verifier needs a content check, and a
redirect to a site's homepage should be treated as suspicious rather than fine.

## 5. The link is not always a URL

The Hamdan bin Mohammed application happens **inside the Dubai Now app**. A
server cannot test an app deep link, and neither can a link checker — only a
person on a phone can. So an entry's link needs a **type**:

| type | who can verify it |
|---|---|
| `web` | the daily checker |
| `app` | the operator, by hand, on a device |
| `in_person` | the operator, by asking |

This is why the owner's instinct that the operator should test the link is not a
nicety: for one whole class of entry it is the only verification that exists.
Entries whose link cannot be machine-checked need a **"last confirmed by"** date
and a periodic nudge, not a green tick.

## 6. What the candidate sees

**"Link checked on <date>"** on the listing.

Verification the candidate cannot see does nothing for the confidence it was
built to protect. This is the smallest piece of the whole feature and probably
the highest-value one.

## 7. Failure modes to design against

- **Silence is not success.** If scouting returns nothing because a site was
  redesigned or the proxy changed, the directory stops updating and looks fine.
  "No new candidates found in N days" must raise a flag.
- **Never auto-archive.** Someone may be mid-application against an entry the AI
  thinks is dead — and §3 shows the AI will sometimes be wrong about exactly
  that. Flag, never act.
- **Queue prioritisation.** Link broken → changed → expiring soon → new finds.
  An undifferentiated list is how the tool stops being used.
- **Be a good citizen.** Respect `robots.txt` and rate limits, and use an
  identifiable User-Agent. This platform crawling other UAE government sites
  should be recognisable as EHRDC.
- **Duplicates.** The same programme appears on KHDA, u.ae and a news site with
  different numbers. Dedupe on programme identity, and rank sources: official >
  aggregator > news.

## 8. Cost

`ai_usage_log` (migration 069) already records AI spend by task type. The metric
that decides whether this is worth running is **cost per accepted listing**, not
cost per scout — a scout that produces forty drafts the operator rejects is a
cost, not an achievement.

## 9. Rejections have to stick

A scouted entry the operator turns down — not a scholarship, a duplicate of one
already listed, out of scope, or simply wrong — is a **decision**, and decision 2
makes remembering it a requirement rather than a preference.

The scout reads the same allow-listed pages **every day**. If it does not
remember what was already rejected, the same item returns to the queue every
morning and the operator rejects it again. Within a fortnight the queue is mostly
things they have already dismissed, and they stop opening it. That is how this
tool dies — not by being wrong, but by being repetitive.

So each rejection stores what was found, the source URL, when, and why, with
enough identity — source URL plus a content fingerprint — to recognise the same
thing tomorrow. The scout then suppresses it silently, and re-raises it **only if
the page materially changes**, which is the same change-detection signal as §4.4.

Three smaller reasons it earns its storage:

- **"Why isn't X listed?"** A directory that omits a well-known programme will be
  asked about it. *"Rejected 3 June, duplicate of the KHDA entry"* is a better
  answer than a shrug.
- **Measuring the tool.** Cost per accepted listing (§8) needs the denominator.
  Forty drafts a day that are all rejected is a signal that the sources or the
  prompts are wrong, and it is only visible if rejections are counted.
- **Tuning.** The rejection reasons are the signal for making the scout quieter.

**Superseded versions of a live entry** — the deadline and amount before an
update — are kept for the same reason as provenance (§4.1). When a candidate says
"it said 30 June last week", we should be able to check rather than guess.

**Retention:** rejections indefinitely (a URL, a hash, a reason and a date are
small, and they get more useful with age); superseded versions for about two
years. Neither is personal data, so there is no privacy argument for deleting
them.

## 10. What I would not build

- **Auto-publishing on high confidence.** The review step is the product.
- **A confidence percentage.** It looks precise and is not.
- **Anything behind a login.**
- **Open-web search** — ruled out by decision 1.

## 11. Open questions

All three questions this document opened with were answered on 2026-08-23 —
decisions 5 and 6 in §2, and retention in §9. What remains is not a decision so
much as a dependency:

1. **When does outbound email actually open?** Decision 6 assumes it will. Until
   Moro item 2 clears, half of the notification requirement cannot be delivered,
   and §2.2 is the design that keeps that from being invisible.
2. **What counts as "materially changed"** for re-raising a rejected item (§9)
   and for flagging a live one (§4.4)? A deadline moving matters; a marketing
   paragraph being reworded does not. This needs a first pass in code and then
   the operator's judgement on how noisy it turns out to be — it is a tuning
   question, not one to settle on paper.

## 12. Sequencing

**Phase 0 — before any AI.** Fix the container's certificate chain (§3), add the
per-domain startup reachability check, and add the four link states plus
`link_type` to the schema. None of this needs a model, and the daily link
checker alone already delivers most of the candidate-facing confidence.

**Phase 1 — verification.** Daily link checking, change detection by content
hash, the operator queue with its in-app badge, and "Link checked on <date>" on
the listing. Email notification behind a capability check (§2.2), visibly
disabled until the firewall path opens.

**Phase 2 — scouting.** Allow-listed extraction into drafts, with provenance and
the field-level review UI — and the rejection store from §9 in the SAME phase,
not after it. A daily scout that cannot remember a rejection is worse than no
scout: it generates the same work every morning until the operator stops
looking. The allow-list editor (decision 5) belongs here too.

Phase 1 is useful on its own and is the half that cannot produce a wrong claim
about a scholarship. Phase 2 without Phase 1 would be a machine for generating
listings nobody is checking.
