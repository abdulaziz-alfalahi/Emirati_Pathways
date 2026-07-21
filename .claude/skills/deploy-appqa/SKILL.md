---
name: deploy-appqa
description: Deploy the backend or frontend to APPQA staging and verify it. Use whenever asked to deploy, redeploy, ship to staging, or verify a deployment landed.
---

# Deploy to APPQA staging

## Topology (do not rediscover)
- Public URL `https://stg-emirati.ehrdc.gov.ae` routes through a WAF to **APPQA = 10.228.145.5**. Single server, no load balancer. (NOT APPDEV.)
- Backend: docker container `backend`, port 5005, image `emirati_backend:latest`. Edge nginx runs in the `emirati_frontend` container.
- Live DB (shared by staging AND production data): `dghr_prod` @ 10.228.145.66:5454 — creds in `backend/.env`.
- Access: `ssh aalfalahi.d@10.228.145.5` — **password prompt, no key installed**. Interactive steps must be run by the user (suggest the `! ssh ...` prefix) or in a terminal; BatchMode fails.

## Backend deploy procedure
1. **Preflight on APPQA**: `df -h` — especially `/var` (Docker lives there; a full /var has broken apt AND dockerd on this host before). Check on EVERY deploy.
2. Build the image on APPQA (it sits behind a forward proxy; pulls may fail — build locally on the host from the repo checkout).
3. Recreate with `./deployment/run-backend-appqa.sh [IMAGE_TAG]`. Never use docker-compose on APPQA (v1.29.2 is broken against that engine — recreate causes an outage). The script already handles:
   - env backup + old container preserved as `backend_old` + backup dir `~/appqa-backups/backend-recreate-<date>/` (this is the rollback: `docker rm -f backend && docker rename backend_old backend && docker start backend`)
   - `--workers 1` (Socket.IO/gevent breaks with more — HTTP 400 "session unknown")
   - the `emirati_pathways_upload_data` volume (without it uploads are destroyed on recreate)
   - restarting edge nginx (it caches the upstream IP; skipping this 502s /api and /socket.io)
4. If the deploy includes a migration, run it BEFORE recreating the container (see the live-db-migration skill).

## Post-deploy verification (all of these, every time)
- `curl -fsS http://127.0.0.1:5005/health` on the host (script does it) AND the public URL through the WAF.
- Socket.IO handshake returns a sid: `curl 'https://stg-emirati.ehrdc.gov.ae/socket.io/?EIO=4&transport=polling'`.
- For changed endpoints: probe via an in-process Flask test client inside the container (`docker exec backend python -c ...`) — this has caught handler-signature 500s that unit tests missed (PR #108).
- Record the new image hash and the backup dir name in the PR or memory.
