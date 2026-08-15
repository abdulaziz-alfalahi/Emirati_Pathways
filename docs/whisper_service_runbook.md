# Whisper (ASR) — put it under systemd on the GPU node

**Status: not applied.** Commands to run on `10.228.145.195` as `ubuntu`.

## The problem

Interview transcription depends on `faster-whisper-server`, and on 2026-08-16 it
was found running like this:

```
PID     PPID    USER  ELAPSED       COMMAND
235144  235120  root  3-23:09:55    uv run uvicorn --factory faster_whisper_server.main:create_app
235389  235144  root  3-23:09:54    /root/faster-whisper-server/.venv/bin/python .../uvicorn --factory ...
```

Started **by hand** around 12 August, running as **root** out of
`/root/faster-whisper-server`, with **no systemd unit** — `systemctl
list-units | grep -i whisper` returns nothing, and `/etc/systemd/system/`
contains no unit file for it.

So: **a reboot of that node silently ends transcription.** Nothing restarts it,
nothing alerts, and the failure is invisible until someone runs an interview and
gets no transcript. The service also answers `/health` whether or not the model
is loaded, so a health check alone would not have caught it either.

This is worth fixing on its own merits, and it must be fixed before a second
inference service is added beside it — otherwise we would have two unmanaged
processes instead of one.

## What we know about the node

Verified 2026-08-16:

| | |
|---|---|
| Host | `dghraz1gpuvm2`, Ubuntu, 2× NVIDIA L40S 46 GB |
| Disk | 495 G, 472 G free |
| RAM | 153 G, 135 G free |
| Access | `ssh ubuntu@10.228.145.195` — `ubuntu` is in `sudo` |
| GPU tooling | `nvidia-ctk`, `nvidia-container-runtime`, `dcgm-exporter.service` all present |
| Whisper | GPU **0**, ~434 MiB — a bare CUDA context, model **not resident** (it loads on demand) |
| Listens | `:8001`, reachable from APPQA (firewall rule already granted) |

## Before you start

Confirm the working directory and the exact command, rather than trusting this
document:

```
ssh ubuntu@10.228.145.195 'sudo ls -la /root/faster-whisper-server'
```

```
ssh ubuntu@10.228.145.195 'sudo cat /proc/235144/cmdline | tr "\0" " "; echo'
```

```
ssh ubuntu@10.228.145.195 'sudo cat /proc/235144/environ | tr "\0" "\n" | grep -iE "whisper|model|host|port|proxy"'
```

The third matters most: **the running process may carry environment variables
that are not written down anywhere** (model name, bind address, proxy). If it
does, they must go into the unit file or the service will come back configured
differently from the one that has been working for four days.

> RDP paste mangles anything with `%`, nested quotes, or multiple lines. Run one
> short single-quoted command at a time.

## The unit

Written to run as **root** from the existing directory, because that is what is
running today and this change should alter *only* who supervises it. Moving it
to a service account is a separate, later change — worth doing, but not while
also introducing systemd.

Create `/etc/systemd/system/faster-whisper.service`:

```ini
[Unit]
Description=faster-whisper-server (ASR for interview transcription)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/faster-whisper-server
# Match the environment captured from /proc/<pid>/environ above.
# Environment="WHISPER__MODEL=Systran/faster-whisper-large-v3"
# Environment="UVICORN_HOST=0.0.0.0"
# Environment="UVICORN_PORT=8001"
ExecStart=/root/.local/bin/uv run uvicorn --factory faster_whisper_server.main:create_app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5
# The model loads on demand and can take a while on a cold start; do not let
# systemd give up on a slow first request.
TimeoutStartSec=300
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

`ExecStart` must be an **absolute path** — systemd does not use a login shell,
so a bare `uv` will fail with status 203/EXEC. Confirm the real path first:

```
ssh ubuntu@10.228.145.195 'sudo which uv || sudo ls /root/.local/bin/uv'
```

## Cutover

There will be a short gap between stopping the manual process and systemd
starting its own. Do this when no interview is in progress.

```
ssh ubuntu@10.228.145.195 'sudo systemctl daemon-reload'
```

Stop the hand-started process — the parent, so the child goes with it:

```
ssh ubuntu@10.228.145.195 'sudo kill 235144'
```

```
ssh ubuntu@10.228.145.195 'sudo systemctl enable --now faster-whisper'
```

## Verify — all four

```
ssh ubuntu@10.228.145.195 'systemctl is-enabled faster-whisper; systemctl is-active faster-whisper'
```

```
ssh ubuntu@10.228.145.195 'curl -sS -m 10 -o /dev/null -w "health %{http_code}\n" http://127.0.0.1:8001/health'
```

From **APPQA**, which is what actually calls it:

```
ssh appqa 'curl -sS --noproxy "*" -m 10 -o /dev/null -w "from appqa: %{http_code}\n" http://10.228.145.195:8001/health'
```

And the point of the whole exercise — that it comes back on its own:

```
ssh ubuntu@10.228.145.195 'sudo systemctl kill -s KILL faster-whisper; sleep 8; systemctl is-active faster-whisper'
```

Expect `enabled`, `active`, `200`, `200`, and `active` again after the kill. If
the last one reports `failed`, read `journalctl -u faster-whisper -n 50` before
retrying — a 203/EXEC there means the `ExecStart` path is wrong.

## Rollback

The old process is gone once killed, so rollback is to restart it the way it was:

```
ssh ubuntu@10.228.145.195 'sudo systemctl disable --now faster-whisper'
```

```
ssh ubuntu@10.228.145.195 'cd /root/faster-whisper-server && sudo nohup /root/.local/bin/uv run uvicorn --factory faster_whisper_server.main:create_app --host 0.0.0.0 --port 8001 > /tmp/whisper.log 2>&1 &'
```

## Afterwards

- **A transcript is the real check.** `/health` answers whether or not the model
  is loaded, so it proves the process is up and nothing more. Run one interview
  transcription end to end.
- **Do the same for vLLM** if inference is self-hosted later — a unit file from
  day one, not a second hand-started process.
- **Two follow-ups deliberately left out of this change**, so that it does only
  one thing: running as a service account rather than root, and an alert when
  the unit is down. `dcgm-exporter.service` is already on the node, so metrics
  plumbing exists to hang that off.
