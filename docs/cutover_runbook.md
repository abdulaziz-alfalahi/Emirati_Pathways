# Cutover runbook — data import gates

**Status: the import half, written 2026-08-21.** The serving cutover (rebuilding
APP01/APP02 from APPQA, DNS) is deliberately not covered yet — the decisions
below are settled, that half still has open questions with Moro.

Everything here is a **gate**: a check that must pass before the next import
runs. They exist because each one, once wrong, is expensive or impossible to
undo — NAFIS and MOHRE supply snapshots in time, and a bad import cannot be
re-requested for the day it described.

---

## Gate 0 — a verified backup, every time

```bash
backend/scripts/backup_db.sh        # dumps AND restores into a throwaway container
```

Not the nightly job. `backup_schedule.sh` produces dumps; **only `backup_db.sh`
proves one restores**, and it is the difference between a file and a backup.

Run it immediately before every import and every migration. It was run before
migration 074 and that is the standard to hold.

---

## Gate 1 — source-file encoding

**Check the file AS DELIVERED, before it is parsed.** This gate exists because
by the time bad text is in the database the information is already gone.

Evidence for why (2026-08-21): one company is stored as
`????? ??????? ???????? ...` — Arabic replaced by question marks. That was
**not** our import: `server_encoding` and `client_encoding` are UTF8, and all
**3,969** NAFIS seeker names hold perfect Arabic through the same pipeline
(`نوح محمد عبدالله بوحميد التميمى`). The substitution happened upstream, almost
certainly an Excel export saved to a non-Unicode encoding.

So the platform cannot fix it and must instead **refuse it**:

```python
# Before parsing a delivered CSV/XLSX, on the RAW bytes:
raw = open(path, 'rb').read()

# 1. Does it decode as UTF-8 at all?
try:
    text = raw.decode('utf-8')
except UnicodeDecodeError:
    REJECT — "not UTF-8; ask for a UTF-8 export"

# 2. Substitution markers. U+FFFD is a decode failure; a literal '?' run of
#    three or more where Arabic is expected is an ENCODE failure upstream.
bad = text.count('�') + len(re.findall(r'\?{3,}', text))

# 3. Arabic actually present, as a control: a file with no Arabic at all may be
#    legitimate (NAFIS vacancy CSVs are English) — the failure signal is
#    substitution markers, NOT absence.
arabic = len(re.findall(r'[؀-ۿ]', text))
```

**Decision rule**

| Finding | Action |
|---|---|
| Does not decode as UTF-8 | **Reject.** Ask the supplier for a UTF-8 export. |
| Any `U+FFFD` | **Reject.** Characters already lost. |
| `?{3,}` runs present AND Arabic present elsewhere | **Reject.** Partial substitution — the worst case, because it looks importable. |
| `?{3,}` runs, no Arabic anywhere | **Flag, ask.** May be a legitimately English file, may be wholly substituted. A human decides. |
| Clean | Proceed to Gate 2. |

**Report the counts either way**, in the import summary. A file that passed
should say so with numbers, so a later argument about what arrived can be
settled from the record.

MOHRE company data is the first import where this matters at scale — Arabic
trade names are the norm there, and 189 companies today is not a sample.

---

## Gate 2 — dry run before write

Report what an import **would** change, without writing:

- rows created / updated / unchanged;
- **values it would overwrite**, and **values it would clear**;
- a sample of each.

The CRM master importer assigns fields directly (`SET col = %s`, not `COALESCE`)
because for remarks-derived fields a `None` deliberately clears a stale value.
**1,630 candidate profiles have already been edited on-platform.** A sheet
arriving without those edits would silently wipe the CRM team's work — this is
the specific hazard the dry run exists to surface, and it is live now, during
the transition where the sheet and the platform are both being edited.

Operator-maintained fields should additionally be **write-only-when-present**,
as `job_seeker_date` already is (migration 074 + importer change).

---

## Gate 3 — delta awareness

NAFIS marks a vacancy filled once the candidate is registered in **GPSSA**. So a
person **disappearing from the seeker feed is information** — it means placed.

- An importer that upserts only what is present will keep placed people in the
  active queue for ever.
- **Absence must trigger a status change, never a deletion.** By then a person
  may have an account, applications, coaching history. They move from seeking to
  employed — `currently_employed` and `availability_status` already model this.
  Deleting on absence is unrecoverable and a bulk importer does it efficiently.

---

## Gate 4 — attribution, before the numbers are believed

GPSSA says someone became employed. It does **not** say the platform caused it.
Keep three cases distinguishable — placed through a platform application;
placed while on the platform via another channel; placed with no platform
engagement. This can only be built forward: it cannot be reconstructed from a
filled flag afterwards, and it is what makes an Art 4(10) report survive
scrutiny.

---

## Order of loading

1. **Companies before vacancies.** Vacancies reference employers; company
   identity resolves on **trade licence first** (`backend/company_identity.py`),
   never on name.
2. **People before vacancies**, with one identity pass across all feeds. All
   three carry a real Emirates ID (owner, 2026-08-17), so `users.id` dedupes
   them.
3. **Load everything; invite in waves.** Magic links expire after **7 days**, so
   a bulk send burns the contact list. Wave order comes from `job_seeker_date`
   — the queue is visible since migration 074: 2021: 16 · 2022: 93 · 2023: 217 ·
   2024: 322 · 2025: 660 · 2026: 1,596.

## Preconditions still open

- **The DGHR mailbox** (`emirati@ehrdc.gov.ae`). It gates BOTH halves: seeker
  invitations and employer onboarding. Nothing in the onboarding plan can start
  without it. Reply drafted; awaiting IT.
- **`FLASK_ENV=development`**, an ephemeral `UAEPASS_EID_KEY`, and the public
  frontend served by a **Vite dev server** rather than the built bundle.
- **Two nodes behind a load balancer** need sticky sessions or a shared queue
  before Socket.IO works in production (open with Moro).
- **`X-Forwarded-For` arrives as a WAF node address** (`10.62.132.52`), so the
  read-audit trail currently identifies the WAF, not the person.

## Settled, so they are not re-litigated

- `dev-login` is **no longer a blocker**: restricted to 24 flagged test accounts,
  it cannot touch a citizen record (migration 073).
- Companies are loaded but **not active until magic-link onboarding**; MOHRE
  provenance is recorded via `verified_by`, distinct from operator verification.
- Anomalies in seeded data are **questions, not defects** — the platform has not
  launched, so employer-side data has no real source yet.
