# Scope: board minutes upload

**Status:** scope for review — not built. Needs the owner decisions in §6.
**Unblocked by:** Moro's backup confirmation (2026-08-11). The feature was deliberately withheld until the object store had a confirmed backup; that condition is now met.

---

## 1. Why this was on hold, and what changed

The Minutes tab in `BoardSecretaryDashboard` currently shows an honest hold message rather than an upload button:

> *"Board minutes are official governance records, so they will only be accepted once the storage holding them has a confirmed backup."*

That was the right call — an upload button that could lose board minutes is worse than no button. **Moro has now confirmed:**

| requirement | confirmed |
|---|---|
| Backup exists | Rubrik, daily |
| Retention | daily 7 days + weekly 4 weeks + monthly 3 months |
| **Individual-file restore** | **yes** — a single deleted minute can be recovered without a whole-VM restore |
| New disk covered | `/dev/sda` will be included |

The individual-file restore answer is the one that matters most: recovering one deleted document from a whole-VM restore would not have been practical.

## 2. What actually exists today (measured, not assumed)

**Less than the config suggests.** This will be the platform's *first real object-storage integration*, not an extension of an existing one.

| | state |
|---|---|
| `board_meetings` table | exists, 1 row. **No minutes columns at all** |
| MinIO container | running and healthy (`emirati_pathways_minio_1`, ports 9000-9001) |
| `interview-recordings` bucket | exists and is **empty** — volume is 19.5 kB |
| S3 config | declared in `livekit_interview/config.py` (endpoint, bucket, keys) |
| **S3 client code** | **none** — no `Minio(`, `put_object`, or presigned-URL calls anywhere |
| **S3 env on the backend** | **none set** |
| DB columns pointing at object storage | `cms_media.storage_path`, `job_documents.storage_path` — unrelated features |

So the work includes standing up the storage layer itself: credentials into the backend environment, a client helper, and a bucket.

## 3. Proposed design

### 3.1 Storage

A **separate bucket**, `board-minutes` — not shared with `interview-recordings`. Different retention, different audience, and a different sensitivity class; mixing them makes any future lifecycle or access policy harder to reason about.

Object key: `board-minutes/<year>/<meeting_id>/<version>-<filename>`, which matches how the archive already groups meetings by year.

### 3.2 Schema (migration 060)

New table `board_minutes` rather than columns on `board_meetings`, because minutes are **versioned** (see §3.4) and a meeting may accumulate more than one document:

- `id`, `meeting_id` → `board_meetings`
- `object_key`, `filename`, `content_type`, `size_bytes`, `sha256`
- `version` (integer, per meeting)
- `status` — `draft` | `approved` | `superseded`
- `uploaded_by`, `uploaded_at`
- `approved_by`, `approved_at`
- `superseded_by` (self-reference)

**`sha256` is not decoration.** For an official governance record, being able to demonstrate that the file served today is byte-identical to the file uploaded is the difference between an archive and an assertion.

### 3.3 Access control

- **Upload / replace:** board secretary (`board_operator`) only.
- **Read:** board members and the secretary. Enforced through `resolve_roles()` — never a hand-rolled role check (issue #96).
- **Everyone else:** 404, not 403. The existence of a specific meeting's minutes is itself information.

### 3.4 Immutability and correction

**Minutes are never overwritten in place.** Correcting an approved document creates a **new version**; the previous row moves to `superseded` and its object stays in the bucket.

This is the core governance property. If a minute can be silently replaced, the archive cannot answer *"what did the Board approve on that date?"* — which is the only question it exists to answer.

### 3.5 Serving files

Stream through the backend rather than issuing presigned URLs. A presigned URL is a bearer credential that outlives the session and can be forwarded; for board records, every read should pass the role check and be attributable.

## 4. What this does NOT include

- **Approval workflow beyond a status field.** Circulation, comments, and formal sign-off are a separate feature (already on the board backlog).
- **Board packs / agenda papers.** Same storage mechanics, different lifecycle — worth reusing the layer once this is proven.
- **Bilingual document handling.** The metadata is bilingual; the documents are whatever the secretariat produces.
- **Retention/deletion policy.** See §6.

## 5. Verification plan

Live, on APPQA, then cleaned up:

1. Upload as secretary → object lands in MinIO, row created, `sha256` matches the source file.
2. Download → bytes identical to what was uploaded (verify the hash, don't just check HTTP 200).
3. Upload a correction → new version, previous row `superseded`, **both objects still retrievable**.
4. Board member can read; a candidate and a recruiter get 404.
5. Restart the MinIO container → the file is still there (proves the volume, not just the process).

## 6. Decisions needed before building

1. **Retention.** Governance records often carry a statutory retention period. Rubrik keeps 3 months; that is a *backup* window, not a *records* policy. **How long must board minutes be retained, and may they ever be deleted?** This changes whether deletion is even implemented.
2. **Who may read minutes?** Board members and secretary is the assumption. Do observers, the executive, or auditors need access? Getting this wrong in either direction is costly.
3. **Approved-only, or drafts visible?** Whether board members see a document before the secretary marks it approved.
4. **File types and size cap.** PDF only is the safest default for a record that must render identically years from now. Suggest PDF-only, 50 MB.

## 7. Effort

Moderate, and mostly the storage layer rather than the feature: migration, an S3 helper plus backend credentials, three endpoints (upload / list / download), the version-and-supersede logic, and replacing the hold message in the Minutes tab with a real upload control.

The honest hold message stays until every item in §5 passes.
