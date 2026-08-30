-- 101_guardian_consent_for_minors.sql
--
-- Owner decision, 2026-08-30: "go with option 2" — the young person registers,
-- a parent confirms, with a guardian email collected at registration where no
-- guardian is already linked.
--
-- WHY THE PROGRAMME'S AGE RANGE DECIDES, NOT THE REGISTRANT'S BIRTHDAY
--
-- The obvious design is to compute the registrant's age. The platform usually
-- cannot:
--
--     candidate_profiles.dob      4,247 of 38,301 populated  (11%)
--     nafis_job_seekers.dob       3,969 of 4,067             (but that is the
--                                                             NAFIS register,
--                                                             not every user)
--
-- So for nine registrants in ten there is no birthday to check, and guessing
-- "adult" for an unknown is the wrong way to be wrong about a fifteen-year-old.
--
-- What the platform DOES reliably have is the age range the provider declared
-- on the programme — "10-16", "14-18", "18-25". That is a fact somebody stated
-- on purpose, and it answers the question directly:
--
--     max age below 18   every attendee is a minor      -> consent required
--     min age below 18   an attendee MAY be a minor     -> consent required,
--                                                          unless the person's
--                                                          own DOB proves 18+
--     min age 18 or over no minors                      -> no consent
--     unparseable/absent cannot rule it out             -> consent required
--
-- Failing towards asking for consent is the safe direction: the cost of asking
-- an adult for a guardian is an annoyance, the cost of not asking a minor is
-- the thing this exists to prevent.
--
-- WHY A GUARDIAN EMAIL AND NOT A LINKED GUARDIAN
--
-- student_guardians is the link the internship feature uses for the same
-- problem, and it holds ZERO rows — it is populated by school enrolment, so
-- only enrolled students would ever have one. A sixteen-year-old who signed up
-- directly would have no guardian to ask. The linked guardian is used when it
-- exists; otherwise the registrant supplies an address at registration.
--
-- A PENDING REGISTRATION HOLDS THE PLACE
--
-- It counts towards capacity. The alternative — confirm your consent and then
-- be told the camp filled up while you waited — is worse than a seat held by
-- somebody who never confirms.
--
-- PRECONDITION, verified on dghr_prod 2026-08-30:
--   * youth_program_registrations: 0 rows, so no row needs backfilling
--   * its status CHECK is youth_program_registrations_status_check
--     (renamed by migration 100)
--   * guardian_user_id and minor_consent_at already exist (migration 095)
--   * student_guardians: 0 rows

BEGIN;

ALTER TABLE youth_program_registrations
    ADD COLUMN IF NOT EXISTS guardian_email        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS consent_token         TEXT,
    ADD COLUMN IF NOT EXISTS consent_requested_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS consent_expires_at    TIMESTAMPTZ;

-- One token, one registration. A token that could match two rows would let a
-- guardian confirm a place they were never asked about.
CREATE UNIQUE INDEX IF NOT EXISTS idx_youth_reg_consent_token
    ON youth_program_registrations(consent_token)
    WHERE consent_token IS NOT NULL;

-- `pending_consent` joins the statuses. Named for what it is waiting on, so a
-- row in this state cannot be mistaken for a confirmed place.
DO $$
DECLARE
    ck TEXT;
BEGIN
    SELECT conname INTO ck FROM pg_constraint
     WHERE conrelid = 'youth_program_registrations'::regclass
       AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%status%';
    IF ck IS NOT NULL THEN
        EXECUTE format('ALTER TABLE youth_program_registrations DROP CONSTRAINT %I', ck);
    END IF;
    ALTER TABLE youth_program_registrations
        ADD CONSTRAINT youth_program_registrations_status_check
        CHECK (status IN ('registered','waitlisted','cancelled','attended','pending_consent'));

    -- A pending row must say who was asked and carry a token, or nothing can
    -- ever confirm it and the seat is held for ever.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conname = 'youth_program_registrations_consent_ck') THEN
        ALTER TABLE youth_program_registrations
            ADD CONSTRAINT youth_program_registrations_consent_ck
            CHECK (status <> 'pending_consent'
                   OR (consent_token IS NOT NULL
                       AND (guardian_email IS NOT NULL OR guardian_user_id IS NOT NULL)));
    END IF;
END $$;

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect the new columns and both constraints:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'youth_program_registrations' ORDER BY ordinal_position;
--   SELECT conname FROM pg_constraint
--    WHERE conrelid = 'youth_program_registrations'::regclass AND contype = 'c';
--
-- Expect ACCEPTED:
--   INSERT INTO youth_program_registrations (camp_id, user_id, status,
--          consent_token, guardian_email)
--   VALUES (<id>, '7840...', 'pending_consent', 'tok', 'parent@example.ae');
--
-- Expect REJECTED — pending with nobody to ask and no way to confirm:
--   INSERT INTO youth_program_registrations (camp_id, user_id, status)
--   VALUES (<id>, '7840...', 'pending_consent');
