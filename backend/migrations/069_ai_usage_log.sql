-- 069: durable record of every AI model call
--
-- WHY: nobody can currently say what the platform spends on AI, or on what.
--
-- `backend/services/qwen_client.py` has kept an in-memory UsageTracker since the
-- Qwen migration. It is lost on every restart, and `get_usage_summary()` — the
-- only function that reads it — is called from NOWHERE in the codebase. So the
-- data has never once been looked at.
--
-- That matters now because the open question is whether to self-host inference
-- on the GPU node (2x L40S, idle) instead of, or alongside, the DashScope API.
-- Every argument for or against rests on volume, task mix and cost, and we have
-- measured none of them. This table is what turns that decision from a
-- preference into an evidenced one.
--
-- WHAT IS RECORDED: one row per API RESPONSE, not per logical call. Retries
-- produce a row each, because each retry is separately billed — retry burn is
-- invisible today and is exactly the kind of waste worth seeing. `attempt`
-- carries the attempt number so a retry storm is distinguishable from volume.
--
-- Failed calls are recorded too, with zero tokens and a non-'ok' outcome. How
-- often the external API fails is a direct input to the self-hosting question.
--
-- estimated_cost_aed is STORED rather than derived. Prices change; the honest
-- record is what we believed a call cost at the time it was made. It is an
-- estimate from COST_PER_MILLION_TOKENS in backend/config/qwen_config.py, not
-- an invoice, and is named accordingly.
--
-- NOT AN AUDIT LOG. It holds no prompt or response content — only counts. It
-- carries no personal data and is safe to purge; admin_audit_log is the
-- append-only artefact and is unaffected by this.
--
-- PRECONDITION (verified live 2026-08-16): no table for AI/token usage exists.
-- The similarly named `cv_usage_logs` (59 rows) records CV document view and
-- download events and is unrelated.

BEGIN;

CREATE TABLE IF NOT EXISTS ai_usage_log (
    id                  BIGSERIAL PRIMARY KEY,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- Which model actually served the request, after task routing and any
    -- override. This is the column that will show a migration to a local model.
    model               VARCHAR(100) NOT NULL,

    -- Routing key from MODEL_ROUTING: parse, match, score, explain, jd_parse,
    -- interview, generate. The hybrid question is decided per task type, so
    -- this is the most important dimension in the table.
    task_type           VARCHAR(50),

    prompt_tokens       INTEGER      NOT NULL DEFAULT 0,
    completion_tokens   INTEGER      NOT NULL DEFAULT 0,

    latency_ms          INTEGER,
    attempt             SMALLINT     NOT NULL DEFAULT 1,

    -- ok | invalid_json | error. 'invalid_json' means the API answered and was
    -- billed but returned unparseable content — a cost with no value delivered.
    outcome             VARCHAR(20)  NOT NULL DEFAULT 'ok',

    estimated_cost_aed  NUMERIC(12, 6),

    CONSTRAINT ai_usage_log_outcome_check
        CHECK (outcome IN ('ok', 'invalid_json', 'error')),
    CONSTRAINT ai_usage_log_tokens_check
        CHECK (prompt_tokens >= 0 AND completion_tokens >= 0)
);

-- The three questions this table exists to answer: how much over time, broken
-- down by task, broken down by model.
CREATE INDEX IF NOT EXISTS idx_ai_usage_created      ON ai_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_task_created ON ai_usage_log (task_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model_created ON ai_usage_log (model, created_at DESC);

COMMENT ON TABLE ai_usage_log IS
    'One row per AI API response (retries included). Counts only — no prompt or '
    'response content, no personal data. Written by backend/services/ai_usage_log.py; '
    'read by GET /api/admin/ai-usage. Safe to purge: this is telemetry, not audit.';

COMMENT ON COLUMN ai_usage_log.estimated_cost_aed IS
    'Estimate at time of call from COST_PER_MILLION_TOKENS. Not an invoice.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM ai_usage_log;                      -- expect 0 immediately after
--   \d ai_usage_log                                          -- 3 indexes, 2 CHECKs
--   -- the outcome CHECK refuses an undefined value:
--   BEGIN;
--     INSERT INTO ai_usage_log (model, outcome) VALUES ('x', 'maybe');
--   ROLLBACK;                                                -- must fail
--   -- once traffic has flowed, the question this was built to answer:
--   SELECT task_type, model, count(*) AS calls,
--          sum(prompt_tokens + completion_tokens) AS tokens,
--          round(sum(estimated_cost_aed), 4) AS aed
--     FROM ai_usage_log
--    WHERE created_at > now() - interval '7 days'
--    GROUP BY 1, 2 ORDER BY aed DESC NULLS LAST;
