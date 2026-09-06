#!/usr/bin/env bash
# Download the model weights ONCE into the shared HF cache, resumable, through
# the proxy — so vLLM starts from a full cache and a restart never re-downloads.
# Run on each GPU node as ubuntu before the first serve_qwen.sh:
#
#   pull_model.sh                          # Qwen/Qwen3.8-27B-FP8, ~28 GB
#   MODEL=Qwen/Qwen3.6-35B-A3B-FP8 pull_model.sh
#
# Same image and env as serve_qwen.sh so nothing differs at serve time.
set -euo pipefail
MODEL=${MODEL:-Qwen/Qwen3.8-27B-FP8}
HF_HOME=${HF_HOME:-/data/hf}
VLLM_IMAGE=${VLLM_IMAGE:-vllm/vllm-openai:v0.28.0-cu129}
PROXY=${PROXY:-http://10.61.192.2:8080}
sudo mkdir -p "$HF_HOME" && sudo chown "$USER" "$HF_HOME"
sudo docker run --rm --name "pull-$(echo "$MODEL" | tr '/' '-')" \
  -e HTTP_PROXY="$PROXY" -e HTTPS_PROXY="$PROXY" -e NO_PROXY=localhost,127.0.0.1,10.0.0.0/8 \
  -v "$HF_HOME":/root/.cache/huggingface --entrypoint python3 "$VLLM_IMAGE" -c "
from huggingface_hub import snapshot_download
p = snapshot_download('$MODEL', max_workers=4)
import os
total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(p) for f in fs)
print('complete:', p, round(total / 2**30, 1), 'GB')"
