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
   - If `/var` is tight, `docker image prune -f` (dangling only) is safe. `run-backend-appqa.sh` now does this itself after a successful deploy (2026-08-29) — every deploy retags `:latest` and orphans a ~2GB image, and ten of them took `/var` from comfortable to 92%. Never `-a` (it would take the rollback tags and the python/nginx base images, and this host is behind a proxy where a re-pull may fail); never `volume prune` (uploads live in a volume).
   - **A `<none>` image that prune refuses to reclaim is a diagnosis, not an obstacle.** Read `docker system df -v` and look at its CONTAINERS column:
     - **stopped** container holding it → a dead container; remove it, then prune.
     - **running** container holding it → **a scheduler pinned to an old build.** The space is the symptom; the bug is that it has been running stale code, possibly for months. Do not chase the megabytes — reinstall it (see *Repin the scheduled containers* below), which releases the image as a side effect. On 2026-08-29 this was 1.93GB held by `emirati-link-scout` and `emirati-link-check`, both still on the 25 August build.
3. Recreate with `./deployment/run-backend-appqa.sh [IMAGE_TAG]`. Never use docker-compose on APPQA (v1.29.2 is broken against that engine — recreate causes an outage).

   **RUN IT ONCE. Check whether a deploy is already in flight first** (hit 2026-08-23): the script has no locking, and running it twice in quick succession makes `backend_old` a copy of the NEW build instead of the previous one. The printed rollback then restores the exact code you were trying to escape — a safety net that looks present and does nothing. Nothing warns you; both runs report `/health -> 200` and look successful.

   It happened because a backgrounded deploy looked stalled and was re-run by hand. It was not stalled, only slow — the same trap as the build in step 2. Before starting one, check: `pgrep -f run-backend-appqa` on APPQA, and whether a background task of your own is still running.

   To confirm the rollback is real rather than assume it: `docker inspect backend backend_old --format '{{.Image}}'` — **if the two image IDs match, you have no rollback.** Recover by tagging the genuine previous image (find it in `docker images -f dangling=true`, newest below the current one, and verify its contents before trusting the timestamp) — e.g. `docker tag <id> emirati_backend:rollback-<what-it-predates>`.

   The script already handles:
   - env backup + old container preserved as `backend_old` + backup dir `~/appqa-backups/backend-recreate-<date>/` (this is the rollback: `docker rm -f backend && docker rename backend_old backend && docker start backend` — **subject to the single-run caveat above**)
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
- **Confirm the rollback is real**: `docker inspect backend backend_old --format '{{.Image}}'` — two DIFFERENT image IDs. Identical IDs mean the deploy ran twice and there is no rollback (see step 3). This is the one check that fails silently: everything else still reports healthy.
- **Repin the scheduled containers.** `run-backend-appqa.sh` recreates `backend` and nothing else. The schedulers — `emirati-link-check` (02:15 UTC) and `emirati-link-scout` (03:00 UTC) — were each created from whatever `emirati_backend:latest` pointed at on their install day, and Docker pins them to that image ID for ever. They keep reporting `Up (healthy)` while running code months old. Caught on 2026-08-25: `backend` had the new soft-404 fix and `emirati-link-check` was still two images behind, so the nightly run would have used the old logic.

  Their installers are idempotent and default to `emirati_backend:latest`, so a reinstall is the fix:
  ```bash
  bash backend/scripts/verify_links_schedule.sh   # emirati-link-check
  bash backend/scripts/scout_schedule.sh          # emirati-link-scout
  ```
  Then prove it, because "healthy" does not:
  ```bash
  for c in backend emirati-link-check emirati-link-scout; do
      docker inspect $c --format "$c {{.Image}}"; done   # all three identical
  ```
  Watch them for a few seconds after: both run a shell loop from `-c`, and a quoting mistake crash-loops them while `--once` still works.

  **Run the installer. Do not rebuild these by hand from `docker inspect`.** Reconstructing the container from the running one — copying its env, CMD and flags into a fresh `docker run` — produces something that starts, reports healthy, connects to the DB and passes every check you can think to make. It is still wrong: it copies the RUNNING config FORWARD, so it faithfully reproduces whatever was there, including any drift the installer has since fixed. The whole reason you are touching these containers is that they are stale; hand-copying preserves exactly what you set out to replace. Done on 2026-08-29 and caught only afterwards, by a search that happened to surface this file.

  The same reasoning applies to *finding* them: these two are easy to meet from a direction that has nothing to do with deploying — disk pressure, an odd `<none>` image, a container list. Whatever brought you here, the fix is the installer.
- Record the new image hash and the backup dir name in the PR or memory.
