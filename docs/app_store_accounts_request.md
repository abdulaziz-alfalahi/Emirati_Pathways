# Internal request — Apple & Google developer accounts (EHRDC)

**For:** Procurement and Legal, with IT/Digital
**Raised by:** Emirati Pathways platform team
**Date:** 2026-08-08
**Decision needed by:** before mobile app development completes — this gates release, not build

---

## 1. What this is

The Emirati Pathways platform is adding a **candidate mobile app** (iOS and Android) for Emirati nationals. To publish it to the App Store and Google Play, EHRDC needs **two organization developer accounts in its own name** — the same model other Dubai Government entities use.

This request is **only** for those two accounts. It is not a request to approve the app itself, and it does not depend on the app being finished. It is raised now because the enrolment process — not the app — is the long pole, and it runs entirely in parallel with development.

## 2. What is being requested

| | Programme | Fee | Type |
|---|---|---|---|
| **Apple** | Apple Developer Program | **USD 99 / year** (recurring) | **Organization** (not individual) |
| **Google** | Google Play Console | **USD 25 / one-time** | **Organization** (not individual) |

Both **must** be enrolled as **EHRDC organization accounts**, not under any individual's personal Apple ID or Google account. Reasons this is non-negotiable for a government service:

- **Publisher identity.** The name citizens see when downloading must read as EHRDC / the government entity. The app authenticates with UAE Pass; a personal or third-party publisher name undermines that trust and resembles the impersonation risk the app is meant to remove.
- **Continuity.** An account tied to an individual can be lost if that person leaves. Government apps cannot carry that dependency.
- **Apple policy.** Apple does not permit government apps on individual accounts and requires organization enrolment (see prerequisites).

## 3. Prerequisites — the two that actually cause delay

### 3.1 D-U-N-S number (Apple requirement)

Apple organization enrolment requires a **D-U-N-S number** — a free identifier from Dun & Bradstreet that verifies EHRDC as a legal entity.

- **First action: confirm whether EHRDC already has one.** Most established Dubai Government entities do. If so, this step is closed.
- If not, one must be requested from Dun & Bradstreet. It is free but can take up to ~2 weeks, and Apple's verification against it adds more. **This is the single longest lead item — check it first.**

Google Play does **not** require a D-U-N-S number, but does verify the organization's legal name and a contact.

### 3.2 Authorized signatory

Both Apple's and Google's developer agreements are **contracts**. Someone authorized to bind EHRDC must review and accept them. This needs **Legal** and an identified **authorized signatory** on the entity side before enrolment can complete — Apple will, during verification, contact a person of authority to confirm the enroller is entitled to act for EHRDC.

## 4. Action items

| # | Action | Owner | Depends on |
|---|---|---|---|
| 1 | Confirm whether EHRDC already holds a **D-U-N-S number**; if not, request one from Dun & Bradstreet | IT/Digital + Legal | — |
| 2 | Identify the **authorized signatory** who can accept Apple & Google developer agreements for EHRDC | Legal | — |
| 3 | Route the two fees (USD 99/yr Apple, USD 25 once Google) through **procurement** | Procurement | — |
| 4 | Enrol the **Apple Developer Program** as EHRDC (organization), using the D-U-N-S number | IT/Digital | 1, 2, 3 |
| 5 | Enrol the **Google Play Console** as EHRDC (organization) | IT/Digital | 2, 3 |
| 6 | Nominate the **account holder / admin** on the EHRDC side; developers to be added as *members*, not owners | IT/Digital | 4, 5 |

The fees are small; the **process** around them — procurement cycle, legal review of the agreements, entity verification — is what takes time. That is why this starts before the app is built, not after.

## 5. What this does not cover

- **The app's own compliance review.** A Dubai Government public-facing app is likely subject to government digital-service standards and possibly TDRA requirements. That is a separate track, confirmed with the relevant authority, and it gates release alongside the store accounts. Worth opening in parallel.
- **Data-protection position for users aged 15–17.** The app targets nationals from age 15; the legal position on data collected from minors, including push-notification consent, needs Legal's input. Separate from account enrolment but on the same critical path to launch.
- **Account access administration** (who holds admin, how developers are granted access, key/certificate custody). Handled at step 6 once the accounts exist.

## 6. One question to settle early

EHRDC will hold **its own** accounts (this is confirmed, consistent with other Dubai Government entities). Worth a single confirmation with the Dubai digital-government authority / TDRA that there is **no requirement to publish under a central shared government publisher** instead — if there were, it would change who holds the account. Expected answer is "own account is fine," but confirming now avoids a late reversal.

---

**Bottom line:** two low-cost organization accounts, but with a procurement + legal + entity-verification lead time measured in weeks. Starting items 1 and 2 today keeps the accounts off the app's critical path.
