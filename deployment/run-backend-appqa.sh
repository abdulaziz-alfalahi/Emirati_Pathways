#!/usr/bin/env bash
# =============================================================================
# Recreate the APPQA backend container — the CORRECT invocation.
#
# WHY THIS FILE EXISTS
# APPQA cannot use docker-compose: the installed v1.29.2 is broken against that
# host's Docker Engine (KeyError: 'ContainerConfig' on recreate — it stops and
# renames the old container, then fails, causing an outage). So the backend runs
# via plain `docker run`, which means every compose-level guarantee has to be
# repeated by hand here. Two have been silently dropped before:
#
#   1. --workers 1   Socket.IO/gevent keeps session state per worker. With >1,
#                    polling handshakes land on the wrong worker -> HTTP 400
#                    "session unknown" -> video interviews and notifications
#                    break. (Dockerfile now also defaults to 1, belt and braces.)
#   2. -v upload_data:/app/uploads
#                    Without this, CVs / interview artefacts / workspace files
#                    are written INSIDE the container and are destroyed by the
#                    next recreate. This was the live state until 2026-07-19.
#
# Also sets --restart unless-stopped: the container previously had RestartPolicy
# "no", so it did not come back after a host reboot.
#
# USAGE
#   ./deployment/run-backend-appqa.sh [IMAGE_TAG]
# The env file is extracted from the currently running container, so secrets are
# never stored in the repo.
# =============================================================================
set -euo pipefail

IMAGE="${1:-emirati_backend:latest}"
NAME=backend
NETWORK=emirati_net
BACKUP_DIR="$HOME/appqa-backups/backend-recreate-$(date +%Y-%m-%d-%H%M)"

echo "==> Preflight"
docker image inspect "$IMAGE" >/dev/null || { echo "image $IMAGE not found"; exit 1; }
df -h /var | tail -1   # a full /var has broken dockerd on this host before

mkdir -p "$BACKUP_DIR"

if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "==> Backing up live container state to $BACKUP_DIR"
  # Env: strip image-provided vars, de-duplicate, keep out of the repo.
  docker inspect "$NAME" --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | grep -vE '^(PATH|LANG|GPG_KEY|PYTHON_[A-Z_]+)=' \
    | awk '!seen[substr($0,1,index($0,"=")-1)]++' > "$BACKUP_DIR/backend.env"
  chmod 600 "$BACKUP_DIR/backend.env"

  # Rescue anything written inside the container (pre-volume containers only).
  docker cp "$NAME:/app/uploads" "$BACKUP_DIR/uploads" 2>/dev/null || true
  docker cp "$NAME:/app/data"    "$BACKUP_DIR/data"    2>/dev/null || true

  echo "==> Preserving old container as ${NAME}_old (rollback)"
  docker rm -f "${NAME}_old" 2>/dev/null || true
  docker stop "$NAME"
  docker rename "$NAME" "${NAME}_old"
else
  echo "!! no running $NAME container — supply an env file at $BACKUP_DIR/backend.env"
  exit 1
fi

echo "==> Ensuring the uploads volume exists and is seeded"
docker volume create upload_data >/dev/null
if [ -d "$BACKUP_DIR/uploads" ]; then
  # -n: never overwrite files already in the volume.
  docker run --rm -v upload_data:/dest -v "$BACKUP_DIR/uploads":/src:ro \
    alpine sh -c 'cp -an /src/. /dest/ 2>/dev/null || true'
fi

echo "==> Starting $NAME from $IMAGE"
docker run -d \
  --name "$NAME" \
  --network "$NETWORK" \
  --env-file "$BACKUP_DIR/backend.env" \
  -p 5005:5005 \
  -v upload_data:/app/uploads \
  --restart unless-stopped \
  "$IMAGE" \
  gunicorn \
    --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
    --workers 1 \
    --bind 0.0.0.0:5005 \
    --timeout 120 --keep-alive 5 \
    --max-requests 1000 --max-requests-jitter 100 \
    --access-logfile - --error-logfile - \
    wsgi:app

echo "==> Waiting for health"
for i in $(seq 1 30); do
  s=$(docker inspect "$NAME" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}')
  [ "$s" = "healthy" ] && break
  sleep 2
done
docker inspect "$NAME" --format 'status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{end}} restart={{.HostConfig.RestartPolicy.Name}}'

# nginx caches upstream IPs; without this /api and /socket.io 502 against the
# old container's address.
echo "==> Restarting edge nginx so it re-resolves the backend IP"
docker restart emirati_frontend >/dev/null

echo "==> Verify"
curl -fsS -o /dev/null -w '  /health -> %{http_code}\n' http://127.0.0.1:5005/health || echo "  HEALTH CHECK FAILED"
echo "  rollback: docker rm -f $NAME && docker rename ${NAME}_old $NAME && docker start $NAME"
