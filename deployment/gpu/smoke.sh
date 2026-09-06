#!/usr/bin/env bash
# Smoke-test one vLLM replica from the node it runs on:  smoke.sh <port>
# Proves the model answers, returns JSON with thinking off, and measures
# single-stream decode speed. Lives in a script because a JSON body does
# not survive Windows ssh quote-stripping on the command line.
set -euo pipefail
PORT=${1:?port}
MODEL=${MODEL:-Qwen/Qwen3.8-27B-FP8}
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
echo "== /v1/models on :$PORT"
curl -sf "localhost:$PORT/v1/models" | head -c 200; echo
BODY=$(cat <<JSON
{"model":"$MODEL","max_tokens":200,"temperature":0.2,
 "chat_template_kwargs":{"enable_thinking":false},
 "response_format":{"type":"json_object"},
 "messages":[{"role":"user","content":"Return a JSON object with keys city (a UAE emirate), population_estimate (integer) and note (one sentence in Arabic)."}]}
JSON
)
echo "== chat completion (JSON mode, thinking off)"
T0=$(date +%s.%N)
RESP=$(curl -s "localhost:$PORT/v1/chat/completions" -H 'Content-Type: application/json' -d "$BODY")
T1=$(date +%s.%N)
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
c = d['choices'][0]['message']['content']; u = d.get('usage', {})
secs = $T1 - $T0
print(c[:400]); print()
print(f\"prompt_tokens={u.get('prompt_tokens')} completion_tokens={u.get('completion_tokens')} wall={secs:.2f}s -> {u.get('completion_tokens',0)/secs:.1f} tok/s\")
json.loads(c); print('valid JSON: yes')"
