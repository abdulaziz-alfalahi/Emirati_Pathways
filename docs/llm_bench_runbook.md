# Self-hosted Qwen3.8-27B — benchmark and production runbook

Two things in one place, because they share the files and the hosts:

1. **The benchmark** — `backend/scripts/llm_bench/`: decides, on our own
   prompts, which `task_type` moves from DashScope to the GPU node.
2. **The production layout** — three replicas of `Qwen/Qwen3.8-27B-FP8` across
   both GPU VMs behind one load balancer (`deployment/gpu/`).

Owner's direction (2026-09-04): all four L40S stay; the goal is quality of
service, not cost. Replicas are for peak-hour latency and availability — one
card already carries the throughput of a campaign day.

## The hosts, and why nothing here runs from APPDEV

| host | role | GPUs | reachable from |
|---|---|---|---|
| `10.228.145.195` (`dghraz1gpuvm2`) | Whisper today; replica A + the load balancer | 2 × L40S 46 GB | jump `.98` only (ssh as `ubuntu`, passwordless sudo). APPQA reaches ports 8001 (Whisper) and, once Moro grants it, **8000** |
| `10.228.145.194` | replicas B and C | 2 × L40S 46 GB | jump `.98` only. Docker + NVIDIA toolkit **still to be installed** — same steps as `docs/gpu_asr_deployment_runbook.md` |
| APPDEV (this box) | `collect.py` — needs the DB | – | cannot open port 22 on either GPU node or on the jump |

So: the bundle is collected here, everything else runs from the jump server.
`run.py` and `score.py` are standard-library only for that reason.

Proxy on the nodes: `http://10.61.192.2:8080`, with `NO_PROXY=localhost,127.0.0.1,10.0.0.0/8`.
**Curl from a node to another node or to localhost needs `--noproxy '*'`.**

## Production layout — 3 replicas

| card | runs | port | why |
|---|---|---|---|
| `.195` GPU 1 | **replica A** | 8010 | primary; the firewall request names this host |
| `.194` GPU 0 | **replica B** | 8010 | second VM: a reboot or patch on one VM never takes the service down |
| `.194` GPU 1 | **replica C** | 8011 | peak-hour latency headroom (per-stream speed falls past ~8–16 concurrent sequences on an L40S) |
| `.195` GPU 0 | Whisper (3 GB) + embedding/reranker later | 8001 | ASR already lives here; semantic matching needs 2–8 GB; keeps serving cards clean |
| `.195` host | **nginx load balancer** | **8000** | one base URL for the backend; `least_conn`, passive health, one retry on another replica |

Per replica (`deployment/gpu/serve_qwen.sh`): FP8 weights (~28 GB), FP8 KV
cache, `--max-model-len 32768`, `--max-num-seqs 64`, MTP speculative decoding
on. Qwen3.8-27B is hybrid-attention (16 of 64 layers full attention, 4 KV
heads) so the cache is ~64 KB/token — one card holds ~180k tokens of context
in flight, i.e. 30+ concurrent requests at our 5k size. A fourth replica fits
next to Whisper on `.195` GPU 0 if ever needed.

What the backend needs afterwards: `QWEN_BASE_URL=http://10.228.145.195:8000/v1`
for the moved task types, DashScope kept as the **automatic** fallback lane,
and the container's injected `HTTP_PROXY` bypassed for `10.0.0.0/8` (same fix as
`object_storage._is_internal()`). That is a small code change made once the
bench has named the winner per task — not before.

## Jump-server command sequence

Run these from the jump server (`.98`) in order. `ssh`/`scp` work from
PowerShell or Git Bash. Everything on the nodes runs as `ubuntu`.

### 0. Get the files onto the jump server

From APPDEV, if the jump can ssh to it (`aalfalahi.d@10.228.145.4`):

```sh
scp aalfalahi.d@10.228.145.4:~/llm_bench/cases.jsonl .
scp aalfalahi.d@10.228.145.4:~/Emirati_Pathways/backend/scripts/llm_bench/run.py .
scp aalfalahi.d@10.228.145.4:~/Emirati_Pathways/deployment/gpu/serve_qwen.sh .
scp aalfalahi.d@10.228.145.4:~/Emirati_Pathways/deployment/gpu/llm-lb.conf .
```

Otherwise copy the same four files over the RDP session (drive redirection or
clipboard — `cases.jsonl` is 1.1 MB and holds CV text: it stays inside the
tenancy, nowhere else).

### 1. Prepare both nodes

```sh
# .195 already has Docker + the NVIDIA toolkit (Whisper runs there). Confirm:
ssh ubuntu@10.228.145.195 'sudo docker ps --format "{{.Names}} {{.Status}}"; nvidia-smi --query-gpu=index,memory.used,memory.total --format=csv'

# .194: install Docker + toolkit first — docs/gpu_asr_deployment_runbook.md steps 1-3 — then confirm the same way:
ssh ubuntu@10.228.145.194 'sudo docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu24.04 nvidia-smi'

# node-to-node path the load balancer depends on (from .195 to .194's replica ports):
ssh ubuntu@10.228.145.195 'for p in 8010 8011; do timeout 3 bash -c "echo > /dev/tcp/10.228.145.194/$p" 2>/dev/null && echo ".194:$p open" || echo ".194:$p closed (fine until B/C are up; if still closed then, it is a firewall rule)"; done'

# copy the scripts
for h in 195 194; do scp serve_qwen.sh run.py ubuntu@10.228.145.$h:~/; done
scp cases.jsonl llm-lb.conf ubuntu@10.228.145.195:~/
ssh ubuntu@10.228.145.195 'chmod +x ~/serve_qwen.sh'; ssh ubuntu@10.228.145.194 'chmod +x ~/serve_qwen.sh'
```

### 2. Bench on `.195` first (one replica, GPU 1)

The first start pulls ~28 GB through the proxy: 15–40 minutes. Follow the log.

```sh
ssh ubuntu@10.228.145.195 '~/serve_qwen.sh llm-a 1 8010'
ssh ubuntu@10.228.145.195 'sudo docker logs -f llm-a'          # Ctrl-C once it says "Application startup complete"
ssh ubuntu@10.228.145.195 'curl -s --noproxy "*" localhost:8010/v1/models | head -c 300'

# A/B the one lever on single-stream speed. Latency runs are one request at a time.
ssh ubuntu@10.228.145.195 'python3 ~/run.py --cases ~/cases.jsonl --base-url http://127.0.0.1:8010/v1 --model Qwen/Qwen3.8-27B-FP8 --label q38-mtp --no-think'
ssh ubuntu@10.228.145.195 'python3 ~/run.py --cases ~/cases.jsonl --base-url http://127.0.0.1:8010/v1 --model Qwen/Qwen3.8-27B-FP8 --label q38-mtp-c8 --no-think --concurrency 8'

ssh ubuntu@10.228.145.195 'MTP=0 ~/serve_qwen.sh llm-a 1 8010'   # restart without speculative decoding
ssh ubuntu@10.228.145.195 'until curl -sf --noproxy "*" localhost:8010/v1/models >/dev/null; do sleep 15; done; echo ready'
ssh ubuntu@10.228.145.195 'python3 ~/run.py --cases ~/cases.jsonl --base-url http://127.0.0.1:8010/v1 --model Qwen/Qwen3.8-27B-FP8 --label q38-nomtp --no-think'

# what happens if the thinking flag is ever dropped (12 cases is enough to see it)
ssh ubuntu@10.228.145.195 'python3 ~/run.py --cases ~/cases.jsonl --base-url http://127.0.0.1:8010/v1 --model Qwen/Qwen3.8-27B-FP8 --label q38-think --limit 12'

# bring back the production configuration and record what was actually pulled
ssh ubuntu@10.228.145.195 '~/serve_qwen.sh llm-a 1 8010'
ssh ubuntu@10.228.145.195 'sudo docker inspect --format "{{index .RepoDigests 0}}" vllm/vllm-openai'
```

Optional, the MoE alternative for the parse lane: `MODEL=Qwen/Qwen3.6-35B-A3B-FP8 ~/serve_qwen.sh llm-moe 0 8012`
on GPU 0 next to Whisper (fits: ~35 GB + 3 GB), `--label q36-moe`, then `sudo docker rm -f llm-moe`.

### 3. Bring up replicas B and C on `.194`, then the load balancer

```sh
ssh ubuntu@10.228.145.194 '~/serve_qwen.sh llm-b 0 8010 && ~/serve_qwen.sh llm-c 1 8011'
ssh ubuntu@10.228.145.194 'sudo docker logs -f llm-b'          # one pull serves both (shared HF cache)
ssh ubuntu@10.228.145.194 'for p in 8010 8011; do until curl -sf --noproxy "*" localhost:$p/v1/models >/dev/null; do sleep 15; done; echo ":$p ready"; done'

ssh ubuntu@10.228.145.195 'sudo mkdir -p /opt/llm-lb && sudo cp ~/llm-lb.conf /opt/llm-lb/default.conf && sudo docker run -d --name llm-lb --restart unless-stopped --network host -v /opt/llm-lb/default.conf:/etc/nginx/conf.d/default.conf:ro nginx:stable'

# through the balancer: three answers, and each replica's own log line
ssh ubuntu@10.228.145.195 'for i in 1 2 3; do curl -s --noproxy "*" localhost:8000/v1/chat/completions -H "Content-Type: application/json" -d "{\"model\":\"Qwen/Qwen3.8-27B-FP8\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with the JSON {\\\"ok\\\":true}\"}],\"max_tokens\":16,\"chat_template_kwargs\":{\"enable_thinking\":false}}" | head -c 200; echo; done'
# failover: stop one replica, the loop above must still answer three times
ssh ubuntu@10.228.145.194 'sudo docker stop llm-c'   # ... repeat the loop ...   then:  sudo docker start llm-c
```

### 4. Bring the results back and score

```sh
scp 'ubuntu@10.228.145.195:~/results.*.jsonl' .
# then onto APPDEV next to the bundle (reverse of step 0), and there:
#   python3 backend/scripts/llm_bench/score.py --bundle ~/llm_bench
```

## The benchmark — what a bundle is

About 145 wire requests, mirroring the last 18 days of real traffic
(`ai_usage_log`: match 103 · parse 33 · interview 33 · explain 5 · generate 4):

- **parse** — 11 real CVs through `CVParser.parse_cv_text`, 16 real job
  postings through `matching_engine.parse_jd`, plus 3 CVs and 2 JDs in Arabic
- **jd_parse** — 4 JDs through the section parser (4 calls each)
- **match** — candidate-side `AIJobMatchingService` (11 CVs × 4 jobs) and
  recruiter-side `matching_engine.score_match` (parsed CV × parsed JD)
- **interview** — the 2 real transcripts long enough to analyse
- **generate** — 4 JD-builder descriptions (`qwen-max`)
- **explain** — 2 career-outcome predictions, one with an Arabic profile

`collect.py` intercepts at `qwen_client._client`, so every caller's prompt is
captured exactly as production sends it — after sanitising, after the
"respond with JSON" nudge, with production temperature and routing. Nothing is
re-implemented. It silences `ai_usage_log` and writes nothing to the database.

**The bundle contains personal data** (CV text is redacted by the parser, but
match prompts carry names and interview transcripts are verbatim). It lives in
`~/llm_bench/` on APPDEV, moves only to hosts inside the Moro tenancy, and is
never committed (`.gitignore` covers an in-repo `bundle/` too).

Arabic caveat, stated plainly: the platform holds **zero** Arabic job
descriptions and its CVs are English, so real Arabic AI input barely exists
today. The Arabic fixtures are hand-written, flagged `synthetic: true`, and
reported in their own rows. They show whether the JSON path survives Arabic
input; they do not measure Arabic prose quality — for that, read the
worst-case list in the report by hand.

Collect (APPDEV): `.venv/bin/python backend/scripts/llm_bench/collect.py --out ~/llm_bench`
(~12 min, < AED 1). `--dry-run --limit 2` captures prompts without calling anyone.

## Reading the report

`report.md` has one table per `task/real|synthetic` with the columns:

| column | meaning | gate |
|---|---|---|
| `ok` / `invalid_json` | JSON the platform could parse | **ok must match DashScope** — production retries invalid JSON three times, so 5% invalid is 15% wasted calls |
| `p50_ms` / `p95_ms` | one request at a time | at or below DashScope's (proxy round-trip included). Baseline: CV parse 16.1 s, recruiter match 9.8 s, candidate match 6.2 s |
| `tokens_per_s` | completion tokens / latency | the MTP A/B lives here; DashScope delivered ~100 tok/s on CV parse |
| `key_jaccard` | top-level keys vs the baseline answer | ≥ 0.9 — the caller reads named keys; a missing key is a silent `None` downstream |
| `numeric_mad` | mean abs. diff on shared numeric fields | **measured noise floor 1.39** (qwen-plus vs itself on 40 match cases, 2026-09-03: `total_score` identical in 27/40, ±5 in 5, ±10 in 5). Below ~3 is indistinguishable from DashScope's own variance; > 10 changes rankings |
| `arabic_out_rate` | Arabic-input cases answered with Arabic | should equal the baseline's |

Then read the **largest numeric disagreements** list by hand — those case ids
map back to `cases.jsonl` (`input_ref` names the row) and `results.*.jsonl`.

Also in the baseline: **DashScope timed out at 120 s on 3 of 89 match calls**
(the client retried and succeeded). A two-minute stall on ~2% of match calls is
part of what self-hosting removes.

## Moving a task type

`config/qwen_config.py` routes per task from env, so a lane moves with two
variables and no code: `QWEN_PARSE_MODEL=Qwen/Qwen3.8-27B-FP8` and a base URL
for that lane. The client currently has a **single** `QWEN_BASE_URL`; the
per-task base URL plus automatic DashScope fallback is the small change to
make once a winner exists — not before. Order of migration stays: `parse` and
`jd_parse` first (checkable JSON), then `match`/`score`, `explain` last.
`ai_usage_log` records the model per row, so the two lanes stay comparable
in production after the switch.

The matching flow itself is the real scale question: today it is ~20 LLM calls
per candidate (one per vacancy). The embedding + reranker stage on `.195`
GPU 0 — retrieve the top 20 across *all* vacancies, then let the 27B score
those — is what makes matching both better and 95% cheaper in calls. That is
the next design piece after the bench.

Two traps carried over from the Whisper deployment: the backend container
gets `HTTP_PROXY` injected by Docker and must bypass it for an internal
endpoint, and vLLM's guided JSON is stricter than DashScope's — the bench's
`invalid_json` column is exactly that difference measured. Two more specific
to this model: Gated DeltaNet needs a recent vLLM, and prefix caching for
hybrid-attention models is newer — if vLLM logs that it disabled it, the
shared system prompts are re-processed per request (prefill is fast; it is a
latency footnote, not a blocker).
