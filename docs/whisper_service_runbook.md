# Whisper (ASR) on the GPU node — how it is actually run

**Status: nothing to do.** Verified end to end on 2026-08-16. This file previously
told you to install a systemd unit; that was wrong, and the correction is below.

## The setup

Interview transcription is served by a **Docker container** on `10.228.145.195`:

| | |
|---|---|
| Container | `stt-whisper` (`f159f21c4583`) |
| Image | `fedirz/faster-whisper-server:latest-cuda` |
| Ports | `0.0.0.0:8001->8000/tcp` — published **8001**, binds **8000** inside |
| Restart policy | **`unless-stopped`** |
| `docker.service` | **`enabled`** at boot |
| Model | `WHISPER__MODEL=Systran/faster-whisper-large-v3` |
| Device | `WHISPER__INFERENCE_DEVICE=cuda` — GPU **0**, ~434 MiB (a CUDA context; the model loads on demand) |
| Proxy | `HTTP(S)_PROXY=http://10.61.192.2:8080`, `NO_PROXY=localhost,127.0.0.1,10.228.145.0/24` |

**It survives a reboot.** The machine boots, Docker starts because the unit is
enabled, the container restarts because of `unless-stopped`, transcription
resumes. No human involved and no systemd unit of our own required — Docker is
the supervisor.

Reachable from APPQA on `10.228.145.195:8001` (firewall rule already granted);
`/health` returns 200.

## The correction, and the mistake worth not repeating

This document previously asserted that Whisper was *"a hand-started root process
with no systemd unit"* and that *"a reboot of that node silently ends
transcription."* **Both were wrong.**

The reasoning that produced it:

1. `pgrep -af uvicorn` showed `uv run uvicorn …` running as root, up 4 days.
2. `systemctl list-units | grep -i whisper` returned nothing, and no unit file
   existed in `/etc/systemd/system/`.
3. An earlier `docker ps` had failed with *"permission denied while trying to
   connect to the docker API"* — because `ubuntu` is not in the `docker` group.

Step 3 is the error: **a permission failure was treated as evidence of absence.**
The container was there all along; the command simply could not see it. Root
shares the host PID view, so `pgrep` showed the containerised process and it
looked like a bare host process. `systemctl` correctly had no unit because Docker
manages it.

The tell that was available and missed: `HOSTNAME=f159f21c4583` in the process
environment. Container IDs look exactly like that.

**The general lesson:** when a diagnostic command fails for an unrelated reason,
re-run it properly before concluding anything from its silence. `sudo docker ps`
would have settled this in one step.

## What this means for vLLM

If inference is self-hosted on this node, **follow this pattern rather than
inventing another**: a container with `--restart unless-stopped`, published on a
host port, with the proxy variables set so the model can be pulled.

Do not write a systemd unit for it. Docker is already the supervisor on this
host, it is already enabled at boot, and a second supervision mechanism beside it
is how you end up with two copies of a service competing for the same GPU.

Note the port: Whisper publishes **8001** and binds 8000 internally. vLLM's
default is 8000 — publish it on a different host port, and remember
`APPQA → .195:<port>` is a firewall rule that must be requested (see the pending
Moro request).

## Useful commands

```bash
ssh ubuntu@10.228.145.195 'sudo docker ps'
ssh ubuntu@10.228.145.195 'sudo docker inspect -f {{.HostConfig.RestartPolicy.Name}} stt-whisper'
ssh ubuntu@10.228.145.195 'sudo docker logs --tail 50 stt-whisper'
ssh ubuntu@10.228.145.195 'nvidia-smi'
```

`ubuntu` has **passwordless sudo** on this host. RDP paste mangles multi-line
commands, `%`, and nested quotes — keep each command to one line in single
quotes.

## Still genuinely open on this node

- **Running as root inside the container** — worth reviewing, unrelated to
  supervision.
- **No alerting if the container stops** for a reason Docker will not retry.
  `dcgm-exporter.service` is already installed, so metrics plumbing exists.
- `/health` answers whether or not the model is loaded, so it proves the process
  is up and nothing more. A real check is one transcription end to end.
