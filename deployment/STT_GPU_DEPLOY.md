# GPU STT deployment (GPUAAS node 10.228.145.194)

Target state: `faster-whisper large-v3` on the GPUAAS node serving the
OpenAI-compatible endpoint the agent already points at. The interim CPU
container on APPQA (`run-stt-appqa.sh`, `faster-whisper-small`) verified the
full pipeline; the GPU node adds accuracy (large-v3) and speed.

## Blocked on firewall (as of 2026-08-03)

No reachable host can access the GPUAAS nodes: APPQA (.5) and APPDEV (.4)
both fail to 10.228.145.194/.195 on 22 and 8001 (existing Moro rules cover
only the production app nodes .2–.3). Request rows to send Moro are in
`deployment/firewall-request-gpuaas.md`.

## Once access opens

On the GPU node (needs NVIDIA driver + nvidia-container-toolkit):

```bash
docker run -d --name stt-whisper-gpu --restart unless-stopped \
  --gpus all -p 8001:8000 \
  -e WHISPER__MODEL=Systran/faster-whisper-large-v3 \
  -e HTTPS_PROXY=http://10.61.192.2:8080 \
  -e NO_PROXY=localhost,127.0.0.1,10.228.145.0/24 \
  fedirz/faster-whisper-server:latest-cuda
```

Verify: `curl http://10.228.145.194:8001/health` from APPQA, then a real
transcription round-trip (see the flite test in the agent PR).

Flip the agent (on APPQA):

```bash
STT_BASE_URL=http://10.228.145.194:8001/v1 \
STT_MODEL=Systran/faster-whisper-large-v3 \
./deployment/run-agent-appqa.sh
```

Keep the CPU container as fallback. Arabic/English code-switching quality is
materially better on large-v3; language auto-detect stays on.
