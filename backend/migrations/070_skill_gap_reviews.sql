-- 070: a coach's judgement on whether a client holds a required skill
--
-- WHY (docs/skill_gap_comparison_scope.md, Phase 1)
--
-- The coach dashboard could show what a client HAS but not what they are
-- MISSING for a target role, because the two vocabularies barely intersect.
-- Measured on the live database 2026-08-16:
--
--   required skills found in skill_taxonomy   8 / 135   (6%)
--   held skills found in skill_taxonomy      10 /  76  (13%)
--   required skills held, by string match    15 / 135  (11%)
--
-- All three are free text. `career_paths.nodes[].required_skills` says
-- "Accounting Principles"; `user_skills.skill_name` says "Microsoft Excel".
-- A string comparison would report ~120 of 135 required skills as gaps,
-- including ones the client demonstrably has under another name. Shown to a
-- client in a coaching session that is not merely wrong, it is visibly wrong.
--
-- So Phase 1 does not guess. It asserts only what an exact match proves,
-- leaves everything else UNCLEAR, and records what the coach decides. This
-- table is that record.
--
-- IT IS ALSO THE TRAINING DATA. Choosing between LLM normalisation and
-- embeddings (Phase 2) requires labelled pairs of "this required skill and
-- this held skill are the same thing". Nothing else in the platform produces
-- them, and the same resolver is what scorer parity needs (PR #331), so this
-- is collected once and used twice.
--
-- DELIBERATELY NOT user_skills. A coach confirming a skill for one target role
-- in one conversation is not the same claim as the client asserting it on their
-- profile, and it must not silently become one — matching, scoring and
-- recommendations all read that profile.
--
-- PRECONDITION (verified live 2026-08-16): no table for skill confirmations
-- exists. career_paths.id is uuid with 7 rows and 36 role nodes carrying
-- required_skills; users.id is character(15).

BEGIN;

CREATE TABLE IF NOT EXISTS skill_gap_reviews (
    id              BIGSERIAL PRIMARY KEY,

    -- Who the judgement is about, and who made it. Both are Emirates IDs.
    client_id       VARCHAR(20)  NOT NULL,
    coach_id        VARCHAR(20)  NOT NULL,

    -- The target the judgement is relative to. A skill is not missing in the
    -- abstract; it is missing FOR something. `role_key` is
    -- '<career_path_id>:<node_index>' — the node array has no stable id of its
    -- own, so position is the only handle it has.
    role_key        VARCHAR(80)  NOT NULL,

    -- Free text, exactly as it appears in required_skills. Not normalised on
    -- the way in: the raw pair is the training signal, and normalising here
    -- would destroy the evidence Phase 2 needs.
    skill_name      TEXT         NOT NULL,

    -- held | missing. 'unclear' is NEVER stored: it is the absence of a review,
    -- and storing it would make "not looked at yet" indistinguishable from
    -- "looked at and could not tell".
    status          VARCHAR(10)  NOT NULL,

    -- When the coach resolved it to a specific held skill, which one. This is
    -- the labelled pair.
    matched_skill   TEXT,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT skill_gap_reviews_status_check CHECK (status IN ('held', 'missing')),
    -- One judgement per client, role and skill. A coach changing their mind
    -- updates rather than accumulating contradictory rows.
    CONSTRAINT skill_gap_reviews_unique UNIQUE (client_id, role_key, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_gap_reviews_client_role
    ON skill_gap_reviews (client_id, role_key);
CREATE INDEX IF NOT EXISTS idx_skill_gap_reviews_training
    ON skill_gap_reviews (status, created_at DESC)
    WHERE matched_skill IS NOT NULL;

COMMENT ON TABLE skill_gap_reviews IS
    'A coach judgement that a client does or does not hold a required skill for '
    'a target role. Written by /api/coach/clients/<id>/skill-gap/review. Also '
    'the labelled training data for a free-text skill resolver — see '
    'docs/skill_gap_comparison_scope.md.';

COMMENT ON COLUMN skill_gap_reviews.matched_skill IS
    'The held skill the coach resolved this required skill to. A labelled pair: '
    'these two free-text names mean the same thing.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM skill_gap_reviews;              -- expect 0
--   \d skill_gap_reviews                                  -- 2 indexes, 2 constraints
--   -- 'unclear' is refused, because it is the absence of a row:
--   BEGIN;
--     INSERT INTO skill_gap_reviews (client_id, coach_id, role_key, skill_name, status)
--     VALUES ('x', 'y', 'p:0', 'SQL', 'unclear');
--   ROLLBACK;                                             -- must fail
--   -- the labelled pairs Phase 2 will train on:
--   SELECT skill_name, matched_skill, count(*) FROM skill_gap_reviews
--    WHERE matched_skill IS NOT NULL GROUP BY 1,2 ORDER BY 3 DESC;
