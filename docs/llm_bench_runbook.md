# LLM benchmark — self-hosted Qwen vs DashScope, on our own prompts

Decides, on evidence, which self-hosted model (if any) takes over which
`task_type` from DashScope. Harness: `backend/scripts/llm_bench/`.

The decision it informs: **Qwen3.8-27B (dense, FP8) vs Qwen3.6-35B-A3B (MoE,
FP8) on one L40S**, scored per task against the DashScope models the platform
uses today (`qwen-plus` / `qwen-turbo` / `qwen-max`).

## Why it is three stages

The GPU node (`10.228.145.195`, `dghraz1gpuvm2`) is not reachable over SSH from
APPDEV or APPQA — only Whisper's port 8001 is open — and `APPQA → .195:<vLLM port>`
is a firewall rule still with Moro. So the harness is split at the network gap:

| stage | where | needs | produces |
|---|---|---|---|
| `collect.py` | APPDEV | live DB, DashScope | `cases.jsonl` (exact wire requests) + `results.dashscope.jsonl` (baseline) |
| `run.py` | **anywhere** — stdlib only | the bundle, an OpenAI-compatible URL | `results.<label>.jsonl` |
| `score.py` | anywhere — stdlib only | bundle + results | `report.md`, `summary.json` |

`collect.py` intercepts at `qwen_client._client`, so every caller's prompt is
captured exactly as production sends it — after sanitising, after the
"respond with JSON" nudge, with production temperature and routing. Nothing is
re-implemented. It silences `ai_usage_log` and writes nothing to the database.

**The bundle contains personal data** (CV text is redacted by the parser, but
match prompts carry names and interview transcripts are verbatim). It lives in
`~/llm_bench/` on APPDEV, moves only to hosts inside the Moro tenancy, and is
never committed (`.gitignore` covers an in-repo `bundle/` too).

## What is in a bundle

About 140 wire requests, mirroring the last 18 days of real traffic
(`ai_usage_log`: match 103 · parse 33 · interview 33 · explain 5 · generate 4):

- **parse** — 11 real CVs through `CVParser.parse_cv_text`, 16 real job
  postings through `matching_engine.parse_jd`, plus 3 CVs and 2 JDs in Arabic
- **jd_parse** — 4 JDs through the section parser (4 calls each)
- **match** — candidate-side `AIJobMatchingService` (11 CVs × 4 jobs) and
  recruiter-side `matching_engine.score_match` (parsed CV × parsed JD)
- **interview** — the 2 real transcripts long enough to analyse
- **generate** — 4 JD-builder descriptions (`qwen-max`)
- **explain** — 2 career-outcome predictions, one with an Arabic profile

Arabic caveat, stated plainly: the platform holds **zero** Arabic job
descriptions and its CVs are English, so real Arabic AI input barely exists
today. The Arabic fixtures are hand-written, flagged `synthetic: true`, and
reported in their own rows. They show whether the JSON path survives Arabic
input; they do not measure Arabic prose quality — for that, read the
worst-case list in the report by hand.

## Stage 1 — collect (APPDEV)

```sh
cd ~/Emirati_Pathways
.venv/bin/python backend/scripts/llm_bench/collect.py --out ~/llm_bench      # ~10 min, < AED 1
.venv/bin/python backend/scripts/llm_bench/collect.py --dry-run --limit 2    # prompts only, no API
```

Copy `~/llm_bench/cases.jsonl` and `backend/scripts/llm_bench/run.py` to the
GPU node (via the jump host `.98`; both are plain files).

## Stage 2 — serve the candidates on the GPU node

Docker and the NVIDIA container toolkit are already there (Whisper runs as a
container on GPU 0, port 8001). Put the LLM on **GPU 1**; the cards have no
NVLink, so never tensor-parallel across them. Pull once through the proxy;
the FP8 weights are ~28 GB and ~35 GB.

```sh
# on dghraz1gpuvm2 as ubuntu (passwordless sudo)
export HF_HOME=/data/hf   # 482 GB free on the data disk
sudo mkdir -p $HF_HOME && sudo chown ubuntu $HF_HOME

serve () {   # $1 model  $2 host port  $3 name
  sudo docker run -d --name "$3" --restart unless-stopped --gpus '"device=1"' \
    -e HTTP_PROXY -e HTTPS_PROXY -e NO_PROXY=localhost,127.0.0.1 \
    -e HF_HUB_ENABLE_HF_TRANSFER=1 \
    -v $HF_HOME:/root/.cache/huggingface -p 127.0.0.1:$2:8000 --ipc=host \
    vllm/vllm-openai:latest \
      --model "$1" --served-model-name "$1" \
      --max-model-len 16384 --gpu-memory-utilization 0.92
}
```

Run the two candidates **one at a time** — each wants most of the card:

```sh
serve Qwen/Qwen3.8-27B-FP8      8010 llm-q38-27b
# wait for  curl -s localhost:8010/v1/models  to answer, then bench (below), then:
sudo docker rm -f llm-q38-27b

serve Qwen/Qwen3.6-35B-A3B-FP8  8011 llm-q36-35b-a3b
# ... bench, then rm -f
```

If the 35B MoE does not fit with 16k context (expect ~35 GB weights + KV), drop
`--max-model-len` to 8192 first — our observed peak is 4,660 tokens — and
only then fall back to `Qwen/Qwen3-30B-A3B-Instruct-2507-FP8` on port 8012.

`vllm/vllm-openai:latest` is written for reproducibility of *this* note only:
pin the tag you actually pulled in the results (`sudo docker inspect --format
'{{index .RepoDigests 0}}' vllm/vllm-openai`).

## Stage 3 — replay (GPU node, no venv)

```sh
B=~/llm_bench
# latency, one request at a time, thinking off  — the primary run
python3 run.py --cases $B/cases.jsonl --base-url http://127.0.0.1:8010/v1 \
    --model Qwen/Qwen3.8-27B-FP8 --label q38-27b --no-think
# throughput: the same cases eight at a time
python3 run.py --cases $B/cases.jsonl --base-url http://127.0.0.1:8010/v1 \
    --model Qwen/Qwen3.8-27B-FP8 --label q38-27b-c8 --no-think --concurrency 8
# thinking ON, a few cases: shows what happens if the flag is ever dropped
python3 run.py --cases $B/cases.jsonl --base-url http://127.0.0.1:8010/v1 \
    --model Qwen/Qwen3.8-27B-FP8 --label q38-27b-think --limit 12
```

Same three for the MoE with `--label q36-35b-a3b…` against port 8011.
`run.py` clears proxy variables by default (the target is local); pass
`--keep-proxy` only when the target is DashScope.

## Stage 4 — score (anywhere)

Copy the `results.*.jsonl` files back next to the bundle, then:

```sh
python3 backend/scripts/llm_bench/score.py --bundle ~/llm_bench
```

`report.md` has one table per `task/real|synthetic` with the columns:

| column | meaning | gate |
|---|---|---|
| `ok` / `invalid_json` | JSON the platform could parse | **ok must match DashScope** — production retries invalid JSON three times, so 5% invalid is 15% wasted calls |
| `p50_ms` / `p95_ms` | one request at a time | at or below DashScope's (proxy round-trip included) |
| `tokens_per_s` | completion tokens / latency | informational; MoE should be ~3× dense |
| `key_jaccard` | top-level keys vs the baseline answer | ≥ 0.9 — the caller reads named keys; a missing key is a silent `None` downstream |
| `numeric_mad` | mean abs. diff on shared numeric fields | match scores are out of 100: < 10 is noise between two runs of the *same* model, > 20 changes rankings |
| `arabic_out_rate` | Arabic-input cases answered with Arabic | should equal the baseline's |

Then read the **largest numeric disagreements** list by hand — those case ids
map back to `cases.jsonl` (`input_ref` names the row) and `results.*.jsonl`.

## Moving a task type

`config/qwen_config.py` routes per task from env, so a lane moves with two
variables and no code: `QWEN_PARSE_MODEL=Qwen/Qwen3.8-27B-FP8` and a base URL
for that lane. The client currently has a **single** `QWEN_BASE_URL`; the
per-task base URL plus automatic DashScope fallback is the small change to
make once a winner exists — not before. Order of migration stays: `parse` and
`jd_parse` first (checkable JSON), then `match`/`score`, `explain` last.
`ai_usage_log` records the model per row, so the two lanes stay comparable
in production after the switch.

Two traps carried over from the Whisper deployment: the backend container
gets `HTTP_PROXY` injected by Docker and must bypass it for an internal
endpoint (same fix as `object_storage._is_internal()`), and vLLM's guided
JSON is stricter than DashScope's — the bench's `invalid_json` column is
exactly that difference measured.
