# Runbook: deploy GPU ASR on dghraz1gpuvm2 (10.228.145.195)

**Status:** ready to run. Must be executed **on the GPU node** — port 22 is filtered from APPDEV and APPQA, so only the Jump Server can reach it.
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
  -e HTTP_PROXY=http://10.61.192.2:8080 \
  -e HTTPS_PROXY=http://10.61.192.2:8080 \
  -e NO_PROXY=localhost,127.0.0.1,10.0.0.0/8 \
  -v whisper-models:/root/.cache/huggingface \
  fedirz/faster-whisper-server:latest-cuda
```

The proxy variables inside the container matter: **the model is downloaded from Hugging Face on first start** (~3 GB), and without them the container starts and then hangs on the download.

`-p 8001:8000` matches the port the firewall already permits, and mirrors APPQA's mapping.

```bash
sudo docker logs -f stt-whisper      # watch the model download; Ctrl-C when serving
```

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

That call currently returns *ConnectionRefused*. Once it prints `reachable`, the path is live end to end.

## 8. Point the agent at it

Only after §7 passes:

```
STT_BASE_URL=http://10.228.145.195:8001/v1
STT_MODEL=Systran/faster-whisper-large-v3
```
then re-run `run-agent-appqa.sh`.

**Keep the APPQA CPU container running until the GPU path is proven on a real interview.** It is the rollback: revert the two variables and re-run the script.

## 9. Afterwards

- `.194` (`dghraz1gpuvm1`) answers nothing from anywhere — establish whether it is powered off. It is the intended HA peer, and a single-node ASR has no failover.
- The GPU node's SSH password is a weak default-pattern credential on hardware that will process interview recordings — personal data of nationals. Worth rotating before production, and worth checking whether the same credential is reused on `.194`.
