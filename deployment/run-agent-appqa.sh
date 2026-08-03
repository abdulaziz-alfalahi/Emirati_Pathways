#!/usr/bin/env bash
# LiveKit interview transcription agent (backend/agent.py) as a container
# from the backend image. Joins every LiveKit room via agent dispatch,
# transcribes each participant's track via the STT server, writes labelled
# segments to interview_transcripts.
set -euo pipefail

cd "$(dirname "$0")/.."

docker rm -f interview-agent 2>/dev/null || true
docker run -d --name interview-agent --restart unless-stopped \
  --network emirati_net \
  --env-file backend/.env \
  -e LIVEKIT_URL="${LIVEKIT_URL:-ws://livekit-server:7880}" \
  -e STT_BASE_URL="${STT_BASE_URL:-http://stt-whisper:8000/v1}" \
  -e STT_MODEL="${STT_MODEL:-Systran/faster-whisper-small}" \
  -e HTTPS_PROXY=http://10.61.192.2:8080 \
  -e NO_PROXY=localhost,127.0.0.1,livekit-server,stt-whisper,10.228.145.0/24 \
  emirati_backend:latest \
  python agent.py start

sleep 5
docker logs interview-agent 2>&1 | tail -5
