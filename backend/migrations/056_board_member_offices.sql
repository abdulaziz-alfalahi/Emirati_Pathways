-- 056: Board members' offices, and a queue of what they should be told
--
-- WHY: the board asked to be notified at their OFFICES whenever meeting
-- invitations go out, with the meeting details, so the offices can coordinate
-- in advance (feedback fb_1786009312). The owner confirmed those offices are
-- EXTERNAL EMAIL ADDRESSES, not people with platform accounts — so they cannot
-- be reached by the in-app notification system at all.
--
-- AND WE CANNOT EMAIL THEM YET. Outbound SMTP to the relay (10.61.192.7:25) is
-- blocked at the firewall — verified again 2026-08-07: the connection from the
-- backend container times out. It is item 2 of the outstanding infrastructure
-- request. No SMTP host is even configured in the environment.
--
-- So this migration builds the half that is durable and useful today:
--   board_member_offices      — who should be told, recorded now
--   board_office_notifications— exactly WHAT should be sent, and when it was
--                               queued, so nothing is lost while delivery is
--                               unavailable
--
-- The queue is deliberately explicit rather than silent. A notification sitting
-- at status='pending' is visible to the secretary as "not yet delivered", which
-- lets them forward it by hand in the meantime. The alternative — pretending an
-- office was notified because we wrote a row — is the failure mode this
-- platform has been repeatedly cleaned of.
--
-- When SMTP opens, a sender drains status='pending' and nothing has to be
-- re-entered.
--
-- PRECONDITION (verified live 2026-08-07): neither table exists; 7 users hold
-- board_member. No email outbox of any kind exists in the schema.
--
-- Purely additive.

BEGIN;

CREATE TABLE IF NOT EXISTS board_member_offices (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The board member whose office this is (users.id = Emirates ID).
    user_id     char(15) NOT NULL,
    office_name varchar(200),
    email       varchar(320) NOT NULL,
    phone       varchar(40),
    is_active   boolean NOT NULL DEFAULT true,
    created_by  char(15),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One board member may have more than one office contact, but not the same
-- address twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_board_offices_member_email
    ON board_member_offices (user_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_board_offices_member
    ON board_member_offices (user_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS board_office_notifications (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id    uuid NOT NULL,
    -- Denormalised on purpose: this is a record of what was sent to whom at the
    -- time. If an office address is later corrected, the history must still
    -- show where the message actually went.
    board_member_id char(15) NOT NULL,
    office_email  varchar(320) NOT NULL,
    office_name   varchar(200),
    -- scheduled | rescheduled | cancelled
    kind          varchar(20) NOT NULL,
    subject       text NOT NULL,
    body          text NOT NULL,
    -- pending | sent | failed
    status        varchar(20) NOT NULL DEFAULT 'pending',
    attempts      integer NOT NULL DEFAULT 0,
    last_error    text,
    queued_at     timestamptz NOT NULL DEFAULT now(),
    sent_at       timestamptz,
    CONSTRAINT board_office_notifications_status_check
        CHECK (status IN ('pending', 'sent', 'failed')),
    CONSTRAINT board_office_notifications_kind_check
        CHECK (kind IN ('scheduled', 'rescheduled', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_board_office_notif_pending
    ON board_office_notifications (queued_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_board_office_notif_meeting
    ON board_office_notifications (meeting_id);

COMMENT ON TABLE board_office_notifications IS
    'Queue of meeting notifications for board members'' external offices. '
    'status=pending means NOT DELIVERED — outbound SMTP is blocked at the '
    'firewall. Never present a pending row to a user as though the office has '
    'been informed.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM board_member_offices;          -- 0
--   SELECT count(*) FROM board_office_notifications;    -- 0
--   -- the same office address cannot be recorded twice for one member:
--   BEGIN;
--     INSERT INTO board_member_offices (user_id, email) VALUES
--       ('000000000000001','Office@Example.ae'),
--       ('000000000000001','office@example.ae');        -- must fail (case-insensitive)
--   ROLLBACK;
--   -- and an unknown status is refused:
--   BEGIN;
--     INSERT INTO board_office_notifications
--       (meeting_id, board_member_id, office_email, kind, subject, body, status)
--     VALUES (gen_random_uuid(),'000000000000001','o@e.ae','scheduled','s','b','delivered');
--   ROLLBACK;                                            -- must fail
