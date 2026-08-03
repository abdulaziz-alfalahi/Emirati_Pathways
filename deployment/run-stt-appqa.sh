#!/usr/bin/env bash
# Interim CPU STT server on APPQA (faster-whisper-small) — OpenAI-compatible
# /v1/audio/transcriptions on :8001. Swap to the GPUAAS node (large-v3) by
# pointing STT_BASE_URL at it once the firewall opens (see STT_GPU_DEPLOY.md);
# this container then becomes the fallback.
set -euo pipefail

docker rm -f stt-whisper 2>/dev/null || true
docker run -d --name stt-whisper --restart unless-stopped \
  --network emirati_net -p 8001:8000 \
  -e WHISPER__MODEL=Systran/faster-whisper-small \
  -e HTTPS_PROXY=http://10.61.192.2:8080 \
  -e HTTP_PROXY=http://10.61.192.2:8080 \
  -e NO_PROXY=localhost,127.0.0.1,10.228.145.0/24 \
  fedirz/faster-whisper-server:latest-cpu

echo "waiting for health..."
for i in $(seq 1 30); do
  sleep 2
  if curl -fsS -m 3 http://127.0.0.1:8001/health >/dev/null 2>&1; then
    echo "stt-whisper healthy on :8001"
    exit 0
  fi
done
echo "stt-whisper did not become healthy" >&2
exit 1
