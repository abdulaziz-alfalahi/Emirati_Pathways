-- 060: board minutes — versioned, immutable governance records
--
-- WHY NOW: the Minutes tab has deliberately shown a hold message instead of an
-- upload button, because board minutes are official governance records and an
-- upload that could lose them is worse than no upload. The stated condition was
-- a confirmed backup of the object store. Moro confirmed it 2026-08-11: Rubrik
-- daily, /dev/sda included, and — the answer that actually mattered —
-- INDIVIDUAL-FILE restore, not whole-VM only. Recovering one deleted minute
-- from a whole-VM restore would never have been practical.
--
-- OWNER DECISIONS (2026-08-11):
--   • Readable by board members, the secretary, and Administrators.
--   • Retained INDEFINITELY. Deletion is an Administrator-only act.
--   • Drafts are visible to those same roles before approval.
--   • PDF only, 50 MB cap (enforced in the route, not here — a CHECK constraint
--     cannot see the bytes).
--
-- THE CORE PROPERTY: minutes are NEVER overwritten in place. Correcting an
-- approved document inserts a NEW version and marks the previous one
-- superseded; the old row and its object both remain. If a minute could be
-- silently replaced, this archive could not answer "what did the Board approve
-- on that date?" — which is the only question it exists to answer.
--
-- Deletion is therefore a SOFT delete: the row survives as a tombstone
-- recording who removed it and when, even though it stops being listed or
-- served. "Retained indefinitely" and "a hard DELETE that erases the evidence"
-- cannot both be true. A true purge is deliberately NOT implemented; if one is
-- ever needed it should be a separate, audited operation.
--
-- PRECONDITION (verified live 2026-08-11): no board_minutes table exists;
-- board_meetings has 8+ columns and 1 row; the MinIO bucket for this is not yet
-- created (interview-recordings exists and is empty).
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS board_minutes (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id    uuid NOT NULL REFERENCES board_meetings(id) ON DELETE RESTRICT,

    -- Object storage. object_key is the authority; the bucket is configuration.
    object_key    text NOT NULL,
    filename      varchar(300) NOT NULL,
    content_type  varchar(120) NOT NULL DEFAULT 'application/pdf',
    size_bytes    bigint NOT NULL,
    -- Lets us PROVE the file served today is byte-identical to the one uploaded.
    -- For a governance record that is the difference between an archive and an
    -- assertion.
    sha256        char(64) NOT NULL,

    -- Monotonic per meeting. Version 1 is the first upload.
    version       integer NOT NULL DEFAULT 1,
    -- draft | approved | superseded
    status        varchar(16) NOT NULL DEFAULT 'draft',

    uploaded_by   char(15) NOT NULL,
    uploaded_at   timestamptz NOT NULL DEFAULT now(),
    approved_by   char(15),
    approved_at   timestamptz,
    -- Set on the OLD row when a correction is uploaded.
    superseded_by uuid REFERENCES board_minutes(id),

    -- Administrator-only soft delete (see header). Tombstone, not erasure.
    deleted_at    timestamptz,
    deleted_by    char(15),
    delete_reason text,

    CONSTRAINT board_minutes_status_check
        CHECK (status IN ('draft', 'approved', 'superseded')),
    CONSTRAINT board_minutes_size_positive
        CHECK (size_bytes > 0)
);

-- One version number per meeting, always. This is what makes "version 3 of the
-- minutes for meeting X" a well-defined thing rather than a race.
CREATE UNIQUE INDEX IF NOT EXISTS idx_board_minutes_meeting_version
    ON board_minutes (meeting_id, version);

-- The listing query: live minutes for a meeting, newest first.
CREATE INDEX IF NOT EXISTS idx_board_minutes_meeting_live
    ON board_minutes (meeting_id, version DESC) WHERE deleted_at IS NULL;

-- An object key must be unique — two rows pointing at one object would let a
-- delete of either orphan or double-free it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_board_minutes_object_key
    ON board_minutes (object_key);

COMMENT ON TABLE board_minutes IS
    'Official board minutes. NEVER overwritten in place — a correction inserts a '
    'new version and supersedes the previous one, which remains retrievable. '
    'Deletion is Administrator-only and SOFT: the row survives as a tombstone '
    'recording who removed it and when.';
COMMENT ON COLUMN board_minutes.sha256 IS
    'SHA-256 of the stored bytes, captured at upload. Verify on download before '
    'treating a served file as the record.';
COMMENT ON COLUMN board_minutes.deleted_at IS
    'Soft delete (Administrator only). The row is retained deliberately — '
    '"retained indefinitely" and a hard delete cannot both be true.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM board_minutes;                       -- 0
--   -- two rows cannot claim the same version of one meeting:
--   BEGIN;
--     INSERT INTO board_minutes (meeting_id, object_key, filename, size_bytes, sha256, version, uploaded_by)
--     SELECT id,'k1','a.pdf',1,repeat('a',64),1,'784000000000240' FROM board_meetings LIMIT 1;
--     INSERT INTO board_minutes (meeting_id, object_key, filename, size_bytes, sha256, version, uploaded_by)
--     SELECT id,'k2','b.pdf',1,repeat('b',64),1,'784000000000240' FROM board_meetings LIMIT 1;
--   ROLLBACK;                                                  -- must fail
--   -- an unknown status is refused:
--   BEGIN;
--     INSERT INTO board_minutes (meeting_id, object_key, filename, size_bytes, sha256, uploaded_by, status)
--     SELECT id,'k3','c.pdf',1,repeat('c',64),'784000000000240','final' FROM board_meetings LIMIT 1;
--   ROLLBACK;                                                  -- must fail
