# Scope: identity gate on NAFIS profile seeding

**Status:** scope for review — not built. Needs two owner inputs (§6).
**Trigger:** the first real seeker onboarding (2026-08-11) linked NAFIS seeker 2 to a UAE Pass identity belonging to a different person, and copied that seeker's personal data onto them.
**Related:** PR #332 (the seeding), `seeker-onboarding-first-real-run` finding.

---

## 1. The problem in one paragraph

Invitation redemption binds by **token alone**. Nothing checks that the person completing UAE Pass is the person the invitation was issued to — that is deliberate (issue #90: bind to the proven identity, never phone or email). What was not considered is what happens *after* binding: the seeding then copies the invitee's government-supplied profile onto whoever redeemed the link. A forwarded or intercepted invitation therefore hands over a stranger's education, GPA, marital status and person-of-determination status — not merely an account.

Demonstrated live: `dhabya alfalahi` now carries `full_name='Ahmed Al Nahyan Test'`, GPA 3.90, Master's, Married, PoD false.

## 2. Precedence model (owner directive, 2026-08-11)

> "Keep what we receive from UAE Pass as superseding information."

| rank | source | authority |
|---|---|---|
| 1 | **UAE Pass** | government-verified identity — always wins |
| 2 | **The candidate's own entry** | their profile, their corrections |
| 3 | **NAFIS import** | fills blanks only, never overwrites |

**This is already the implemented behaviour** and needs no change. Seeding runs inside the redemption transaction — after the callback has written the UAE Pass fields — and every column is written `COALESCE(existing, imported)`. As UAE Pass begins returning richer attributes, they will win automatically.

The gate below sits *on top of* this, and only ever restricts rank 3.

## 3. What UAE Pass returns today

Scope requested: `openid urn:uae:digitalid:profile:general`. Observed on the real 2026-08-11 login:

| returned | not returned |
|---|---|
| `first_name`, `last_name`, `full_name` | **`emirates_id`** |
| `email`, `phone` | `fullname_ar` |
| `nationality`, `uaepass_uuid` | `nationality_ar` |

**The absent Emirates ID is the crux.** Of 14 UAE Pass users to date, 13 have synthetic `7840000…` ids — meaning no EID came back. Verification is impossible for those. If the pending attributes request changes this, the gate below starts working automatically.

## 4. Proposed design — two tiers, gated on EID match

Seeding splits NAFIS fields by sensitivity. The gate is `verified` = UAE Pass returned an Emirates ID **and** it matches `nafis_job_seekers.emirates_id`.

### Tier 1 — always seeded (unverified is acceptable)

Occupational data. Useful, low harm if mis-attributed, and the whole point of the import:

`education_level`, `specialization`, `sub_specialization`, `gpa`, `experience_duration`,
`job_seeker_type`, `job_seeker_date`, `is_student`, `preferred_work_setup`,
`emirate_of_residence`, `emirate_of_origin`, `location`, `age_group`, `gender`,
`candidates_source`

### Tier 2 — seeded ONLY when verified

Personal-status and identity fields. Mis-attribution here is a genuine personal-data disclosure:

| field | why gated |
|---|---|
| `is_person_of_determination` | disability status — the most sensitive field held, and a GH #12 inclusion signal |
| `determination_type` | as above |
| `marital_status` | personal status |
| `military_status` | national-service status |
| `full_name` | copying the invitee's **name** onto another person is the most visible conflation, and UAE Pass supplies this anyway (rank 1) |
| `phone` | a third party's contact detail; UAE Pass supplies it (rank 1) |

When unverified, Tier 2 is skipped and a warning logged naming the seeker and user. Nothing silently half-happens.

### Why not simply refuse to redeem when unverified

Because today that blocks onboarding **entirely** — 13 of 14 identities return no EID. Refusing would be safe and useless. The tiering keeps the platform usable while removing the disclosure that actually matters.

## 5. Backfill

Existing rows seeded before the gate (currently one: user `784000000000550`) are **left alone** — the owner has retained that account deliberately as a test user. No migration.

## 6. Two decisions needed before building

1. **Is the Tier 1 / Tier 2 split right?** Specifically: should `gender` and `age_group` be Tier 2? They are demographic rather than occupational. I have placed them in Tier 1 because matching and reporting use them and mis-attribution is low-harm, but that is a judgement call.
2. **Behaviour when UAE Pass returns an EID that does NOT match** the NAFIS record — this is a genuine mismatch rather than missing data. Options: (a) refuse redemption outright, (b) link the account but seed nothing, (c) link and seed Tier 1 only. **Recommendation: (a) refuse** — a positive mismatch is evidence the wrong person holds the link, which is different from simply not knowing.

## 7. Effort

Small. One helper computing `verified`, a tier split in `_seed_profile_from_nafis`, a log line, and tests covering: unverified → Tier 1 only; verified → both; mismatch → per decision (2); UAE Pass values never overwritten in any case.
