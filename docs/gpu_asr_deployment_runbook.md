# Runbook: deploy GPU ASR on dghraz1gpuvm2 (10.228.145.195)

**Status: DEPLOYED AND VERIFIED 2026-08-11.** Warm inference 0.29 s for a 2 s clip — GPU-fast (the same on CPU takes tens of seconds). Kept as the reference procedure and for `.194`.
**Originally:** ready to run. Must be executed **on the GPU node** — port 22 is filtered from APPDEV and APPQA, so only the Jump Server can reach it.
**Target:** move interview transcription from CPU/`small` on APPQA to GPU/`large-v3` on the GPU node.

---

## 1. Why this runbook exists

The standing note said *"GPU large-v3 waits on the Moro firewall."* Measured 2026-08-11/12, that was wrong on every count:

| assumption | measured reality |
|---|---|
| Blocked by the firewall | **Open.** APPQA→`.195:8001` returns *ConnectionRefused* — packets arrive, nothing answers |
| GPU capacity pending | **Present and idle.** 2× NVIDIA L40S, 46 GB each, 0% utilisation |
| Driver problem | **None.** 560.35.05 loaded, CUDA 12.6, `nvidia-smi` healthy |
| Just repoint the agent | **Nothing to point at.** No ASR service, no listener on 8001, no systemd units |

The only outstanding work is deployment — which nobody was tracking, because it sat behind a firewall item that had already been satisfied.

**Deploy on `.195`, not `.194`.** The original plan targeted `.194`, but that host answers nothing from anywhere and may be powered off. `.195` is the node APPQA can already reach on 8001, so no new firewall request is needed.

## 2. Current vs target

| | now (APPQA) | target (GPU node) |
|---|---|---|
| Image | `fedirz/faster-whisper-server:latest-cpu` | `fedirz/faster-whisper-server:latest-cuda` |
| Model | `Systran/faster-whisper-small` | `Systran/faster-whisper-large-v3` |
| Compute | CPU | 2× L40S |
| Reached at | `http://stt-whisper:8000/v1` (docker network) | `http://10.228.145.195:8001/v1` |

Host resources confirmed: **482 GB free disk, 153 GB RAM** — ample.

## 3. Proxy first — everything else depends on it

The box has **no system-wide proxy**; `curl` only worked with an explicit `-x`. Three separate things each need telling about the proxy, and missing any one causes a confusing failure later:

```bash
# a) apt
sudo tee /etc/apt/apt.conf.d/95proxy >/dev/null <<'EOF'
Acquire::http::Proxy  "http://10.61.192.2:8080";
Acquire::https::Proxy "http://10.61.192.2:8080";
EOF
sudo apt-get update    # must succeed before continuing
```

## 4. Docker

```bash
sudo apt-get install -y docker.io
sudo systemctl enable --now docker

# b) the docker DAEMON needs the proxy to pull images.
#    NO_PROXY keeps internal traffic off the proxy.
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/proxy.conf >/dev/null <<'EOF'
[Service]
Environment="HTTP_PROXY=http://10.61.192.2:8080"
Environment="HTTPS_PROXY=http://10.61.192.2:8080"
Environment="NO_PROXY=localhost,127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.local"
EOF
sudo systemctl daemon-reload && sudo systemctl restart docker

sudo docker run --rm hello-world     # proves the daemon can pull
```

## 5. NVIDIA container toolkit — what lets a container see the GPUs

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
  | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
  | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# MUST print the same two L40S as nvidia-smi on the host:
sudo docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu24.04 nvidia-smi
```

If that last command does not show both GPUs, stop — nothing below will work.

## 6. Run the ASR service

```bash
sudo docker run -d --name stt-whisper \
  --restart unless-stopped \
  --gpus all \
  -p 8001:8000 \
  -e WHISPER__MODEL=Systran/faster-whisper-large-v3 \
  -e WHISPER__INFERENCE_DEVICE=cuda \
  -e HTTP_PROXY=http://10.61.192.2:8080 \
  -e HTTPS_PROXY=http://10.61.192.2:8080 \
  -e NO_PROXY=localhost,127.0.0.1,10.0.0.0/8 \
  -v whisper-models:/root/.cache/huggingface \
  fedirz/faster-whisper-server:latest-cuda
```

**`WHISPER__INFERENCE_DEVICE=cuda` is essential and easy to miss.** APPQA's container sets this to `cpu`. Without overriding it, `--gpus all` grants the container GPU access that the model never uses — inference silently runs on CPU at roughly 100× the latency, and every other signal (container healthy, API responding, correct transcripts) looks like success. Confirm via the warm-request timing in §7, not by assuming.

The proxy variables inside the container matter too: **the model is downloaded from Hugging Face on first start** (~3 GB), and without them the container starts and then hangs on the download.

`-p 8001:8000` matches the port the firewall already permits, and mirrors APPQA's mapping.

```bash
sudo docker logs -f stt-whisper      # watch the model download; Ctrl-C when serving
```

## 6a. The proxy trap that makes a healthy service look unreachable

**This cost the most time during the real deployment and is invisible from the GPU node.**

After the service was up and the port reachable, HTTP calls from APPQA still timed out. TCP connected; HTTP did not. The cause is on **APPQA**, not the GPU node:

`~/.docker/config.json` contains a `proxies.default` block, so **the Docker CLI injects `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` into every `docker run`** — regardless of what the launch script does. `run-agent-appqa.sh` even carries a comment saying "no proxy env at runtime", which is true of the script and false of the resulting container.

Its `noProxy` list did not include the GPU nodes, so internal traffic to `.195` was being sent to the corporate proxy, which cannot route to internal addresses — hence a timeout rather than a refusal.

Fix once on APPQA, and every container created afterwards inherits it:

```bash
# add 10.228.145.194 and 10.228.145.195 to proxies.default.noProxy
cp ~/.docker/config.json ~/.docker/config.json.bak-$(date +%Y%m%d)
# edit noProxy to append: ,10.228.145.194,10.228.145.195
```

**Docker injects these at container CREATION.** Existing containers keep the old list until recreated — which is why the backend still could not reach the GPU node after the fix, while the freshly-relaunched agent could. The backend picks it up on its next deploy; it does not matter for transcription, because the **agent** does that work.

## 7. Verify

```bash
# on the GPU node
curl -s http://localhost:8001/v1/models | head
nvidia-smi        # the container should now hold GPU memory
```

Then **from APPQA**, which is what actually matters:

```bash
docker exec backend python -c "
import socket; s=socket.socket(); s.settimeout(5)
s.connect(('10.228.145.195',8001)); print('reachable'); s.close()"
```

That call returns *ConnectionRefused* before deployment. Once it prints `reachable`, the TCP path is live.

**But TCP reachable is not enough** — see §6a. Also confirm the HTTP API answers, and that inference is genuinely on the GPU:

### DO NOT use `/v1/models` as a health check

It calls **huggingface.co through the corporate proxy** to enumerate available
models (`list_models.py` → `huggingface_hub.list_models()`). It therefore fails
whenever the proxy is unhappy — `requests.exceptions.ProxyError` — **while the
service is perfectly healthy**. This produced a false alarm during the real
deployment: the endpoint returned nothing for 300 s and the container had been
`Up 42 minutes` with zero restarts the whole time.

Transcription uses the **locally cached** model and needs no internet, so probe
the endpoint that matters:

```bash
# from APPQA, in the agent container — synthetic 2s tone, expects {"text":"."}
docker exec interview-agent python3 -c "
import wave, struct, math, io, urllib.request, time
buf=io.BytesIO(); w=wave.open(buf,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
w.writeframes(b''.join(struct.pack('<h', int(3000*math.sin(2*math.pi*440*t/16000))) for t in range(32000))); w.close()
b='----t'
body=(f'--{b}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\nSystran/faster-whisper-large-v3\r\n'
      f'--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.wav\"\r\nContent-Type: audio/wav\r\n\r\n').encode()+buf.getvalue()+f'\r\n--{b}--\r\n'.encode()
req=urllib.request.Request('http://10.228.145.195:8001/v1/audio/transcriptions', data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={b}'})
t0=time.time(); r=urllib.request.urlopen(req, timeout=180).read()
print('%.2fs -> %s' % (time.time()-t0, r[:60].decode()))"
```

**The decisive check is warm-request timing.** Send the same short clip twice:
- **~0.3 s warm** → running on the L40S (measured: 0.29 s, repeatedly)
- **tens of seconds** → silently on CPU; `WHISPER__INFERENCE_DEVICE` did not take

Two latencies that are normal and must not be mistaken for faults:
- **~131 s on the very first request ever** — the ~3 GB model downloading from Hugging Face.
- **~3 s on the first request after an idle period** — the model is evicted when idle and reloads from the local cache into GPU memory (measured: 3.06 s, then 0.29 s). **Expect roughly a 3-second lag on the first utterance of an interview after a quiet spell.** If that matters for user experience, keep the model warm with a periodic synthetic request.

## 8. Point the agent at it

Only after §7 passes:

```
STT_BASE_URL=http://10.228.145.195:8001/v1
STT_MODEL=Systran/faster-whisper-large-v3
```
then re-run `run-agent-appqa.sh`.

**Keep the APPQA CPU container running until the GPU path is proven on a real interview.** It is the rollback: revert the two variables and re-run the script.

## 9. Afterwards

- **`.194` (`dghraz1gpuvm1`) is UP** — SSH from the Jump Server works (confirmed 2026-08-11). It is *not* powered off. But `APPQA → .194:8001` **times out** while `APPQA → .195:8001` was merely *refused*, and a dropped packet on a live host means the path is blocked in transit. **Moro implemented firewall item 1 for `.195` only.** So there is currently **no failover**: if `.195` fails, transcription stops. Deploying on `.194` is pointless until `APPQA → .194:8001` is opened — bundle that request with the next Moro communication, then repeat this runbook there.
- The GPU node's SSH password is a weak default-pattern credential on hardware that will process interview recordings — personal data of nationals. Worth rotating before production, and worth checking whether the same credential is reused on `.194`.
