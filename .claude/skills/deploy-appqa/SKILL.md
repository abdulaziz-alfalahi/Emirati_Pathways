---
name: deploy-appqa
description: Deploy the backend or frontend to APPQA staging and verify it. Use whenever asked to deploy, redeploy, ship to staging, or verify a deployment landed.
---

# Deploy to APPQA staging

## Topology (do not rediscover)
- Public URL `https://stg-emirati.ehrdc.gov.ae` routes through a WAF to **APPQA = 10.228.145.5**. Single server, no load balancer. (NOT APPDEV.)
- Backend: docker container `backend`, port 5005, image `emirati_backend:latest`. Edge nginx runs in the `emirati_frontend` container.
- Live DB (shared by staging AND production data): `dghr_prod` @ 10.228.145.66:5454 — creds in `backend/.env`.
- Access: `ssh appqa` (alias in ~/.ssh/config → aalfalahi.d@10.228.145.5, ed25519 key installed 2026-07-21) — fully non-interactive, safe for BatchMode.

## Backend deploy procedure
1. **Preflight on APPQA**: `df -h` — especially `/var` (Docker lives there; a full /var has broken apt AND dockerd on this host before). Check on EVERY deploy.
2. Build the image on APPQA (it sits behind a forward proxy; pulls may fail — build locally on the host from the repo checkout). The build context is `backend/`, not the repo root. Takes ~10–15 min when the pip layer is cached, longer when it is not. Three traps (all hit 2026-08-23):
   - **Do not use `docker build -q`.** It suppresses all step output, so a build that is stalled and one that is progressing look identical — and you cannot tell which without guessing.
   - **`--progress` does not exist** on this Docker CLI. Plain `docker build` already prints step-by-step.
   - The build **outlives the ssh session that started it** (the harness kills a foreground ssh at its timeout; the remote build keeps running). Launch it detached with its own log and poll that, rather than restarting a build that is already halfway done: `setsid nohup ~/build-backend.sh > ~/backend-build.log 2>&1 < /dev/null &`, then wait on `grep -qE "Successfully tagged|^Error|returned a non-zero" ~/backend-build.log`. Waiting on the success marker alone will hang forever on a failed build.
   - If `/var` is tight, `docker image prune -f` (dangling only) is safe and reclaimed ~660MB. It cannot remove an image a stopped container still references — remove the dead container first.
3. Recreate with `./deployment/run-backend-appqa.sh [IMAGE_TAG]`. Never use docker-compose on APPQA (v1.29.2 is broken against that engine — recreate causes an outage). The script already handles:
   - env backup + old container preserved as `backend_old` + backup dir `~/appqa-backups/backend-recreate-<date>/` (this is the rollback: `docker rm -f backend && docker rename backend_old backend && docker start backend`)
   - `--workers 1` (Socket.IO/gevent breaks with more — HTTP 400 "session unknown")
   - the `emirati_pathways_upload_data` volume (without it uploads are destroyed on recreate)
   - restarting edge nginx (it caches the upstream IP; skipping this 502s /api and /socket.io)
4. If the deploy includes a migration, run it BEFORE recreating the container (see the live-db-migration skill).

## Node on APPQA, and who owns the Vite process (corrected 2026-08-23)
APPQA has **two** Node installs, and which one you get depends on how you connect:

| how you run it | node | can run Vite? |
|---|---|---|
| `ssh appqa '<cmd>'` (non-interactive — what agents do) | `/usr/bin/node` **v12.22.9** | **NO** |
| `ssh appqa 'bash -lc "<cmd>"'` (login shell → sources nvm) | `~/.nvm/versions/node/v20.20.2/bin/node` | yes |

A non-interactive ssh command skips `~/.bashrc`, so nvm is never sourced and `node`/`npm` resolve to the system v12, which cannot parse Vite's top-level await (`SyntaxError: Unexpected reserved word`). **Wrap any manual npm/node command on APPQA in `bash -lc`.**

**The Vite dev server is a systemd service — do NOT hand-roll `nohup npm run dev`.** `/etc/systemd/system/emirati-frontend.service` runs it as `aalfalahi.d`, already pins node 20 on `PATH` (systemd has no nvm), has `Restart=always` / `RestartSec=5`, and logs to `~/Emirati_Pathways/logs/frontend.log`. It exists because the old unsupervised `nohup npm run dev &` died on 2026-07-17 and left staging publicly down for ~2 days. An earlier version of this skill said "PPID 1, no supervisor" — that is out of date; a `pkill` loop fights the supervisor and teaches you nothing.

Restarting it:
- **Preferred:** `sudo systemctl restart emirati-frontend`. `sudo` is **password-prompted**, so an agent cannot do this — ask the user to run `! sudo systemctl restart emirati-frontend` in the session.
- **Agent-usable:** kill the main PID and let systemd bring it back (~5s) with the correct node:
  `cd ~/Emirati_Pathways/frontend && rm -rf node_modules/.vite && kill $(systemctl show -p MainPID --value emirati-frontend)`
  Then confirm `systemctl is-active emirati-frontend`, and that the new `MainPID` actually changed.

**Never treat port 8089 listening, or the site returning 200, as proof a restart worked** — `Restart=always` means a failed start is replaced by a working old-config process within seconds, so both signals stay green while your change never landed. Check the changed `MainPID` and the served content.

## Frontend deploy (discovered 2026-07-21 — read before touching containers)
- **The public frontend on staging is a Vite DEV server**, not the static container: a host `vite` process serves `~/Emirati_Pathways/frontend` (WAF routes `/` to it; Vite's proxy forwards `/api`/`/socket.io` to :5005). So a staging frontend deploy is usually just **`git pull` on APPQA**. Verify with `curl -sk https://stg-emirati.ehrdc.gov.ae/src/pages/<File>.tsx | grep <marker>`.
- **`git pull` alone is NOT always enough — Vite serves stale transforms** (hit 2026-08-23). After a pull, an *edited* module can keep being served from Vite's transform cache: the file on disk had the fix, the browser did not, for as long as you cared to reload. New files were fine; the edit was not. If a `curl` of the served module does not show your change, `rm -rf node_modules/.vite` and restart Vite. Note the served file is **compiled** — grep the JSX-transformed form (`width: 110`, not `width={110}`), or you will "confirm" a false negative.
- To restart Vite, use the systemd path in the section above — not `pkill` + `nohup`. (If you ever do need `pkill -f` on this host, **use the `[x]` bracket trick**: a plain `pkill -f "npm run dev"` over ssh matches its own command line and kills your own session mid-command.)
- **New frontend npm dependency**: the Vite dev server must resolve the package from `node_modules`. Run `npm install` only under `bash -lc` (on the system v12 it fails with unsupported-engine on transitive deps). For a static package (e.g. a @fontsource font: CSS + woff2, no build step), copy just that package dir into `~/Emirati_Pathways/frontend/node_modules/<pkg>` (tar+scp from your local node_modules), then restart Vite as above so it re-optimizes deps.
- The `emirati_frontend` container (nginx, owns :80) serves the static `dist/` build AND is the API edge proxy the backend script restarts. To rebuild it: `dist/` in the repo checkout is root-owned (docker is userns-remapped — container root cannot delete it, and sudo needs a password). Build locally (`npm run build`, node 20), tar+scp to APPQA, assemble a fresh context in `~/frontend-build/` (dist + frontend/Dockerfile + frontend/nginx.conf), `docker build -t emirati_frontend:latest .`, then stop/rename old as `emirati_frontend_old` and `docker run -d --name emirati_frontend --network emirati_net -p 80:80 --restart always emirati_frontend:latest`.
  - Leftover `*_old` containers keep `restart: always` with no network and no claimable port, so they crash-loop forever (one hit 228 restarts after a reboot). Remove them once the new one is healthy.

## Post-deploy verification (all of these, every time)
- `curl -fsS http://127.0.0.1:5005/health` on the host (script does it) AND the public URL through the WAF.
- Socket.IO handshake returns a sid: `curl 'https://stg-emirati.ehrdc.gov.ae/socket.io/?EIO=4&transport=polling'`.
- For changed endpoints: probe via an in-process Flask test client inside the container (`docker exec backend python -c ...`) — this has caught handler-signature 500s that unit tests missed (PR #108).
- Record the new image hash and the backup dir name in the PR or memory.
