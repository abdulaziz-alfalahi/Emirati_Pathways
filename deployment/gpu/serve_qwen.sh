#!/usr/bin/env bash
# Start ONE Qwen3.8-27B replica on ONE GPU. Run on the GPU node as ubuntu.
#
#   serve_qwen.sh <container-name> <gpu-index> <host-port> [extra vllm args...]
#
#   serve_qwen.sh llm-a 1 8010                 # replica A on GPU 1, port 8010
#   MTP=0 serve_qwen.sh llm-bench 1 8010       # same, speculative decoding off (for the A/B)
#
# Env overrides: MODEL (Qwen/Qwen3.8-27B-FP8), HF_HOME (/data/hf), VLLM_IMAGE
# (see below), BIND (0.0.0.0), MAX_LEN (32768), MTP (1).
#
# IMAGE: vllm/vllm-openai:latest is built on CUDA 13 and needs an R580+ driver;
# the GPU nodes run 560.35 (CUDA 12.6) and refuse it at container start
# ("unsatisfied condition: cuda>=13.0", seen 2026-09-05). The same release is
# published on CUDA 12.9 as <version>-cu129, which the R560 driver runs.
#
# Run pull_model.sh ONCE per node before the first start: a container that
# crash-loops restarts the 28 GB download every time.
#
# One model per card, never tensor-parallel: the L40S cards have no NVLink.
# Weights are pulled once per node into HF_HOME through the proxy (~28 GB) and
# shared by every replica on that node. Docker restarts the container at boot.
set -euo pipefail

NAME=${1:?container name}; GPU=${2:?gpu index}; PORT=${3:?host port}; shift 3
MODEL=${MODEL:-Qwen/Qwen3.8-27B-FP8}
HF_HOME=${HF_HOME:-/data/hf}
VLLM_IMAGE=${VLLM_IMAGE:-vllm/vllm-openai:v0.28.0-cu129}
BIND=${BIND:-0.0.0.0}                 # the load balancer on .195 reaches .194's replicas over the LAN
MAX_LEN=${MAX_LEN:-32768}             # observed peak is 4,660 tokens; room for scanned CVs + vision
PROXY=${PROXY:-http://10.61.192.2:8080}

SPEC=()
if [ "${MTP:-1}" = "1" ]; then
  # the model ships its own multi-token-prediction draft head; this is the one
  # lever on single-stream speed (raw decode is ~30 tok/s on an L40S). The
  # vLLM recipe for this model uses 3 draft tokens.
  SPEC=(--speculative-config '{"method":"mtp","num_speculative_tokens":3}')
fi

sudo mkdir -p "$HF_HOME" && sudo chown "$USER" "$HF_HOME"
sudo docker rm -f "$NAME" >/dev/null 2>&1 || true

sudo docker run -d --name "$NAME" --restart unless-stopped \
  --gpus "device=$GPU" --ipc=host \
  -e HTTP_PROXY="$PROXY" -e HTTPS_PROXY="$PROXY" \
  -e NO_PROXY=localhost,127.0.0.1,10.0.0.0/8 \
  -e HF_HUB_ENABLE_HF_TRANSFER=1 \
  -v "$HF_HOME":/root/.cache/huggingface \
  -p "$BIND:$PORT:8000" \
  "$VLLM_IMAGE" \
    --model "$MODEL" --served-model-name "$MODEL" \
    --max-model-len "$MAX_LEN" --max-num-seqs 64 \
    --kv-cache-dtype fp8 --gpu-memory-utilization 0.92 \
    --reasoning-parser qwen3 \
    "${SPEC[@]}" "$@"

echo "started $NAME on GPU $GPU -> :$PORT"
echo "  follow the pull/load:  sudo docker logs -f $NAME"
echo "  ready when:            curl -sf localhost:$PORT/v1/models"
