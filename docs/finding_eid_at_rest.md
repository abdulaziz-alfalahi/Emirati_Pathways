# Finding: `users.emirates_id_enc` holds plaintext, and encryption will break the CRM importer

**Status:** finding only — needs an owner decision. Nothing changed.
**Found:** 2026-08-10, while checking whether APPQA needed a stable `UAEPASS_EID_KEY`.
**Severity:** *not* a data breach (see §2). The operational consequence in §3 is the part that matters, and it lands exactly when real onboarding starts.

---

## 1. What was found

A column named `emirates_id_enc` contains plaintext Emirates IDs.

Measured live on `dghr_prod`:

| | count |
|---|---|
| users with a non-NULL `emirates_id_enc` | **5,285** |
| …that are plaintext 15-digit Emirates IDs | **5,271** |
| …that are empty strings `''` | 14 |
| …that contained actual ciphertext | **1** (corrected 2026-08-10 — see below) |
| rows where `users.id == users.emirates_id_enc` | **5,271** |

The encryption function exists and works — `_encrypt_eid()` in `routes/uaepass_routes.py`, AES-256-GCM, called on the UAE Pass callback path (lines 628, 923). The **bulk CRM import scripts bypass it entirely** and write the raw EID:

- `scripts/import_crm_master.py:226` — `INSERT INTO users (id, emirates_id_enc, …) VALUES (%s, %s, …)` with `(eid, eid, …)`
- `scripts/update_candidates_master.py:190`, `scripts/migrate_crm_candidates.py:78` — same pattern

So the `_enc` suffix describes an intention, not the data.

**Correction (2026-08-10):** an earlier version of this document said *zero* rows
contained ciphertext. That was wrong — there was **one** (user `784200243971312`,
written 2026-07-20, a 60-char AES-GCM value). It matters, because it proves the
mixed-format problem in §3 is **not hypothetical: it had already happened once**,
and that user was consequently invisible to the CRM importer's plaintext lookup —
silently receiving no master-file updates.

That row has been restored to plaintext (`emirates_id_enc = users.id`; the
ciphertext was written under an ephemeral key and was undecryptable anyway, and
`users.id` already held the same real EID). The column is now 100% single-format,
and P2 is fixed in code so it stays that way.

## 2. Why this is not a breach — and what the real risk is

**The Emirates ID was already in plaintext by design.** `users.id` *is* the 15-digit Emirates ID (CLAUDE.md), and `id == emirates_id_enc` for all 5,271 rows. This column is a plaintext **duplicate of the primary key** for those rows, not protected data that leaked. Nothing is exposed here that the primary key does not already expose.

**One correction to an earlier draft:** the column is *not* purely redundant, so do not simply drop it. It differs from `users.id` on 1 row, and 41 users have synthetic `7840000…` ids — which is exactly the case the column was designed for: the id is a placeholder until UAE Pass supplies the real Emirates ID, which this column is meant to hold.

The genuine risk is **a false assurance**. Anyone reading the schema — an auditor, a new engineer, whoever answers a data-protection questionnaire — will reasonably conclude that Emirates IDs are encrypted at rest. They are not. A compliance answer built on that reading would be wrong, and this platform has been bitten repeatedly by things that claim to work and quietly don't.

## 3. The operational consequence — this is the part with teeth

The column is about to become **mixed-format**, and the CRM importer looks it up as plaintext.

Both importers match candidates by plaintext EID against this column:

```python
# scripts/import_crm_master.py:217
cur.execute("SELECT emirates_id_enc, id FROM users WHERE emirates_id_enc IS NOT NULL")
existing = {r[0].strip(): r[1] for r in cur.fetchall() if r[0]}
...
if eid not in existing:   # eid is plaintext
```
```python
# scripts/update_candidates_master.py:174
cur.execute("SELECT id FROM users WHERE emirates_id_enc = %s", (eid,))
```

Meanwhile the UAE Pass callback **overwrites** that column with ciphertext:

```python
# routes/uaepass_routes.py:657 (and 714, 788, 865)
emirates_id_enc = COALESCE(NULLIF(%s, ''), emirates_id_enc)
```

So, as soon as a national completes UAE Pass onboarding:

1. Their `emirates_id_enc` changes from plaintext to ciphertext.
2. The next CRM master import searches for their **plaintext** EID and does not find it.
3. They are treated as a **new** user. The insert is `ON CONFLICT (id) DO NOTHING`, and `users.id` already exists — so **no duplicate row is created** (the one saving grace), but the `else` branch that refreshes their CRM data is skipped entirely.
4. The import report still counts them under `created`.

**Net effect: every candidate who onboards through UAE Pass silently stops receiving CRM master-file updates, and the import report over-reports creations.** This is currently invisible because *nobody has completed UAE Pass onboarding yet* — it triggers on the first real one, i.e. precisely at the milestone we are working toward.

## 4. Two separate problems

An earlier draft of this document listed four "options" as if they were alternatives. They are not, and presenting them that way made the decision harder than it is. There are **two independent problems**, with different fixes and different urgency:

| | Problem | Fix | Urgency |
|---|---|---|---|
| **P1** | The column **name** promises encryption that does not exist | Rename it | Whenever convenient |
| **P2** | The column is about to hold **two formats**, and the importer only understands one | Stop the callback writing ciphertext | **Before the first real UAE Pass onboarding** |

Doing one does not fix the other. You most likely want both.

---

### P1 — the name is untrue

**What:** `emirates_id_enc` contains plaintext (§1).

**Why it matters:** false assurance. Someone answering "do you encrypt Emirates IDs at rest?" reads the schema, sees `_enc`, and says yes. That answer is wrong.

**Fix — concretely, two changes and nothing else:**

```sql
ALTER TABLE users RENAME COLUMN emirates_id_enc TO emirates_id;
```
plus updating the ~6 code sites that use the old name.

**No data changes. No security change.** The Emirates IDs remain exactly as readable as they are today. This does not protect anything — it stops the schema asserting something untrue.

**Cost:** one migration, ~6 call sites. **Risk:** low; the rename is mechanical and the contract test suite will catch a missed reference.

---

### P2 — the mixed-format break (this is the one with a deadline)

**What:** §3. The importers match on plaintext; the callback overwrites with ciphertext; the first onboarded candidate silently stops receiving CRM updates.

**Fix — stop the UAE Pass callback writing ciphertext into this column** (`routes/uaepass_routes.py` lines 657, 714, 788, 865), so the column stays one consistent format and the importers keep matching.

**Why this is the right direction rather than "teach the importers to handle ciphertext":** AES-GCM uses a random nonce, so the same Emirates ID encrypts to a different value every time. There is no way to look a candidate up by ciphertext — the importer would have to **decrypt every row on every run** to find one person, or maintain a second deterministic index. That is a large amount of machinery to protect a value that is sitting in plaintext in the primary key two columns away.

**Cost:** small — remove or guard four assignments. **Risk:** low. **Deadline:** the first successful UAE Pass onboarding.

---

## 5. What this does *not* fix, and the real control

Neither P1 nor P2 hides an Emirates ID from anyone. They cannot: **`users.id` is the Emirates ID by design.** Anything with read access to the users table has it regardless of what this column is called or contains.

The genuine control is the **opaque-identifier layer already deferred to production** — the EID-visibility ruling (EHRDC and CRM operators keep the raw EID; other roles do not). Until that exists, the honest position is a schema that does not overstate its protections, not a column that looks encrypted.

**Recommendation:** do **P2 before onboarding** (it prevents a silent data-integrity failure), and **P1 whenever convenient** (it prevents a wrong compliance answer). Treat the opaque-id layer as the actual remediation, tracked separately.

## 6. On `UAEPASS_EID_KEY` specifically

The question that started this: APPQA has no `UAEPASS_EID_KEY`, so the app generates an **ephemeral key at every boot** and warns that ciphertext will not survive a restart.

That warning is real but currently **harmless — there is no ciphertext to lose** (0 rows). Setting a stable key on APPQA is therefore safe but also solves nothing today, and it is *not* a prerequisite for onboarding testing as previously suggested. It becomes necessary only if option B is chosen.

The key is not issued by UAE Pass. It is our own AES-256-GCM key — `base64(32 random bytes)` from a CSPRNG, generated on the host so it never transits a log or a transcript. Production must keep its own distinct key (it already fails fast at boot without one).

**Also worth noting:** `_encrypt_eid()` silently null-pads a short key to 32 bytes (`routes/uaepass_routes.py:151`), so a weak value like `secret` would be accepted as an AES-256 key rather than rejected. Same class as the low-entropy `JWT_SECRET_KEY` warning. Only relevant under option B.
