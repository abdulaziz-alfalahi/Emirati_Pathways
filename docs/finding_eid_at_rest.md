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
| …that contain actual ciphertext | **0** |
| rows where `users.id == users.emirates_id_enc` | **5,271** |

The encryption function exists and works — `_encrypt_eid()` in `routes/uaepass_routes.py`, AES-256-GCM, called on the UAE Pass callback path (lines 628, 923). The **bulk CRM import scripts bypass it entirely** and write the raw EID:

- `scripts/import_crm_master.py:226` — `INSERT INTO users (id, emirates_id_enc, …) VALUES (%s, %s, …)` with `(eid, eid, …)`
- `scripts/update_candidates_master.py:190`, `scripts/migrate_crm_candidates.py:78` — same pattern

So the `_enc` suffix describes an intention, not the data.

## 2. Why this is not a breach — and what the real risk is

**The Emirates ID was already in plaintext by design.** `users.id` *is* the 15-digit Emirates ID (CLAUDE.md), and `id == emirates_id_enc` for all 5,271 rows. This column is a redundant plaintext **copy of the primary key**, not protected data that leaked. Nothing is exposed here that the primary key does not already expose.

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

## 4. Options

**A. Rename the column to match reality** (e.g. `emirates_id`), leave the data plaintext.
Honest, cheap, and removes the false assurance. Keeps the importers working unchanged. Concedes that the EID is plaintext at rest — which is already true of `users.id`, so it concedes nothing new. Requires a migration plus updating the ~6 code sites that reference it.

**B. Actually encrypt, and fix the importers to match on ciphertext.**
Makes the name true. But it buys very little while `users.id` remains the raw EID — an attacker or a careless query reads the primary key instead. It also means the importers must encrypt-then-compare (AES-GCM uses a random nonce, so ciphertext is not deterministic — they would have to decrypt every row to match, or keep a separate deterministic index). **This is the expensive option and it does not deliver the protection its name implies.**

**C. Stop writing the column from the callback** (leave it plaintext everywhere), and revisit under the opaque-id work.
Smallest change that removes the §3 breakage. Keeps one consistent format so the importer keeps working. Defers the real question.

**D. Do nothing.**
Acceptable only until the first real UAE Pass onboarding. After that, §3 is live and silent.

## 5. Recommendation

**A or C now; the real fix is the deferred opaque-id layer.**

Encrypting a column while the same value sits in the primary key is security theatre — it costs importer complexity and delivers no meaningful protection. The genuine control is the opaque-identifier layer already deferred to production (see the EID-visibility ruling: EHRDC and CRM operators keep the raw EID; other roles should not). Until that exists, the correct move is to make the schema **honest** rather than to make it look protected.

Whichever is chosen, **§3 must be resolved before the first real UAE Pass onboarding**, or the CRM will quietly stop updating exactly the candidates who have successfully onboarded.

## 6. On `UAEPASS_EID_KEY` specifically

The question that started this: APPQA has no `UAEPASS_EID_KEY`, so the app generates an **ephemeral key at every boot** and warns that ciphertext will not survive a restart.

That warning is real but currently **harmless — there is no ciphertext to lose** (0 rows). Setting a stable key on APPQA is therefore safe but also solves nothing today, and it is *not* a prerequisite for onboarding testing as previously suggested. It becomes necessary only if option B is chosen.

The key is not issued by UAE Pass. It is our own AES-256-GCM key — `base64(32 random bytes)` from a CSPRNG, generated on the host so it never transits a log or a transcript. Production must keep its own distinct key (it already fails fast at boot without one).

**Also worth noting:** `_encrypt_eid()` silently null-pads a short key to 32 bytes (`routes/uaepass_routes.py:151`), so a weak value like `secret` would be accepted as an AES-256 key rather than rejected. Same class as the low-entropy `JWT_SECRET_KEY` warning. Only relevant under option B.
