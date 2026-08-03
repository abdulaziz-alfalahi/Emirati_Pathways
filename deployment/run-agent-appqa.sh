#!/usr/bin/env bash
# LiveKit interview transcription agent (backend/agent.py) as a container
# from a dedicated image. Direct-join mode: the backend POSTs {room} to
# :8080/join when an interview starts; the agent joins as a hidden participant,
# transcribes each track via the STT server, writes labelled segments to
# interview_transcripts.
set -euo pipefail

cd "$(dirname "$0")/.."

# Dedicated image (deps isolated from the backend's pins). Context MUST be
# backend/ — the repo root has no .dockerignore and fills /var on APPQA.
docker build -f deployment/Dockerfile.agent -t interview-agent:latest \
  --build-arg HTTPS_PROXY=http://10.61.192.2:8080 \
  --build-arg HTTP_PROXY=http://10.61.192.2:8080 backend/

docker rm -f interview-agent 2>/dev/null || true
docker run -d --name interview-agent --restart unless-stopped \
  --network emirati_net \
  --env-file backend/.env \
  -e LIVEKIT_URL="${LIVEKIT_URL:-ws://livekit-server:7880}" \
  -e STT_BASE_URL="${STT_BASE_URL:-http://stt-whisper:8000/v1}" \
  -e STT_MODEL="${STT_MODEL:-Systran/faster-whisper-small}" \
  -e HTTPS_PROXY=http://10.61.192.2:8080 \
  -e NO_PROXY=localhost,127.0.0.1,livekit-server,stt-whisper,10.228.145.0/24 \
  interview-agent:latest

sleep 5
docker logs interview-agent 2>&1 | tail -5
