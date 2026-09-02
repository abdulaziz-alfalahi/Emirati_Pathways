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
# The volume compose declares as `upload_data` is created project-prefixed.
VOLUME="${UPLOAD_VOLUME:-emirati_pathways_upload_data}"
BACKUP_DIR="$HOME/appqa-backups/backend-recreate-$(date +%Y-%m-%d-%H%M)"

echo "==> Preflight"
docker image inspect "$IMAGE" >/dev/null || { echo "image $IMAGE not found"; exit 1; }
df -h /var | tail -1   # a full /var has broken dockerd on this host before

mkdir -p "$BACKUP_DIR"

if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "==> Backing up live container state to $BACKUP_DIR"
  # Env: strip image-provided vars, de-duplicate, keep out of the repo.
  # LAST occurrence wins, not first — this must match Docker's own rule.
  #
  # The overlay below APPENDS its values, and `docker run --env-file` uses the
  # last value for a repeated key, so an overlay takes effect correctly at run
  # time. But the container then carries BOTH entries, and de-duplicating
  # first-wins here would re-capture the value the overlay replaced — silently
  # reverting it on the very next deploy.
  #
  # Measured 2026-08-26: MAIL_SENDING_ENABLED was set true by an overlay, the
  # container ran with true, and the next deploy put it back to false with
  # nothing reported. The same would have happened to the JWT secret rotation
  # this mechanism was written for (docs/jwt_rotation_runbook.md).
  #
  # tac/awk/tac keeps the last occurrence while preserving order.
  docker inspect "$NAME" --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | grep -vE '^(PATH|LANG|GPG_KEY|PYTHON_[A-Z_]+)=' \
    | tac | awk '!seen[substr($0,1,index($0,"=")-1)]++' | tac \
    > "$BACKUP_DIR/backend.env"
  chmod 600 "$BACKUP_DIR/backend.env"

  # Optional env overlay: any KEY=VALUE lines in this file win over the captured
  # env (appended last; the container uses the last value for a repeated key).
  # Used to apply a JWT secret rotation — see docs/jwt_rotation_runbook.md.
  # Absent = no effect. Once the new container is running with these values, a
  # later deploy re-captures them from it, so this stays a one-shot; remove it
  # after use so it can't silently re-apply.
  OVERLAY="${ENV_OVERLAY:-$HOME/appqa-backups/env-overlay.env}"
  if [ -f "$OVERLAY" ]; then
    echo "==> Applying env overlay from $OVERLAY"
    grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$OVERLAY" >> "$BACKUP_DIR/backend.env"
  fi

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
docker volume create "$VOLUME" >/dev/null
if [ -d "$BACKUP_DIR/uploads" ]; then
  # Seed with -n so anything already in the volume always wins; the volume is
  # the source of truth once mounted. Uses the app image rather than `alpine`,
  # because APPQA sits behind a forward proxy and may not be able to pull.
  docker run --rm -v "$VOLUME":/dest -v "$BACKUP_DIR/uploads":/src:ro \
    "$IMAGE" sh -c 'cp -an /src/. /dest/ 2>/dev/null || true'
fi

echo "==> Starting $NAME from $IMAGE"
docker run -d \
  --name "$NAME" \
  --network "$NETWORK" \
  --env-file "$BACKUP_DIR/backend.env" \
  -p 5005:5005 \
  -v "$VOLUME":/app/uploads \
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

# Every deploy retags emirati_backend:latest and orphans the image it replaced.
# Each one is ~2GB on a 20GB /var, so three days of deploying took the partition
# from comfortable to 92% full — and a full /var has previously broken apt AND
# dockerd on this host.
#
# `image prune` removes only DANGLING (untagged) images. It cannot touch:
#   * the image backend_old is holding for the rollback — in use by a container
#   * emirati_backend:main and :rollback-pre-phase0 — deliberately tagged
#   * the python/nginx base images — tagged, and this host is behind a forward
#     proxy where a re-pull is not guaranteed to succeed
# Never `-a`, and never `volume prune`: uploads live in a volume.
# DANGLING IS NOT ENOUGH, which is what the comment above missed in practice.
#
# Every deploy leaves the superseded build TAGGED — emirati_backend:analytics,
# :roles-presence, :transcript-fix and so on, one per build, ~2GB each. Because
# they carry a tag they are not dangling, so `image prune` reported "0B
# reclaimed" while /var climbed to 92% (2026-09-01). The tags accumulate
# silently and nothing ever removes them.
#
# So: drop superseded emirati_backend images, and NOTHING else. Kept, in order
# of how badly it would hurt to lose them:
#
#   the running image      resolved from the container, not from a tag, because
#                          a tag can be moved and the container is the truth
#   the rollback image      whatever ${NAME}_old holds — this is the one that
#                          gets you back, and a blanket clean-up removed it
#                          once already
#   main, rollback-pre-*    deliberately named safety nets, somebody's decision
#   everything non-backend  base images especially: this host is behind a
#                          forward proxy and a re-pull is not guaranteed
# ── Move :latest onto what is actually running ─────────────────────────────
#
# :latest is protected from the clean-up below (it is the tag this script
# defaults to with no argument), but nothing ever MOVED it. So it went on
# pointing at whatever was deployed the day it was last set, keeping a ~2GB
# image alive that no container used, while the running image carried a
# build-specific tag. /var hit 90% repeatedly because of it, and the workaround
# was to retag by hand before each build.
#
# Retagging by hand is also how the guard goes wrong: on 2026-09-02 an ad-hoc
# version of this compared an image ID against `docker ps --format {{.Image}}`,
# which prints image NAMES, so the comparison never matched and the rmi went
# ahead against the rollback image. Docker refused it — "image is being used by
# a stopped container" — which is the only reason nothing was lost.
#
# Doing it here instead means :latest always names the running build, the
# previous image becomes untagged, and the ID-comparing clean-up below reclaims
# it on the next deploy. No hand retagging, and no second guard to get wrong.
#
# Only after health passed: tagging a build that did not come up would point
# the default at something broken.
if [ "$IMAGE" != "emirati_backend:latest" ]; then
  if docker tag "$IMAGE" emirati_backend:latest 2>/dev/null; then
    echo "  :latest now points at $IMAGE"
  else
    echo "  WARNING: could not move :latest to $IMAGE"
  fi
fi

echo "==> Reclaiming space from images this deploy orphaned"

KEEP_RUNNING="$(docker inspect "$NAME" --format '{{.Image}}' 2>/dev/null || true)"
KEEP_ROLLBACK="$(docker inspect "${NAME}_old" --format '{{.Image}}' 2>/dev/null || true)"

removed=0
while read -r tag id; do
  [ -n "$tag" ] || continue
  case "$tag" in
    *:latest|*:main|*:rollback-*) continue ;;   # named on purpose
  esac
  [ "sha256:$id" = "$KEEP_RUNNING"  ] && continue
  [ "sha256:$id" = "$KEEP_ROLLBACK" ] && continue
  # Long-form ids differ from the 12-char listing; compare on the prefix too.
  case "$KEEP_RUNNING"  in *"$id"*) continue ;; esac
  case "$KEEP_ROLLBACK" in *"$id"*) continue ;; esac
  if docker rmi "$tag" >/dev/null 2>&1; then
    echo "  removed superseded image $tag"
    removed=$((removed + 1))
  fi
done <<EOF
$(docker images emirati_backend --format '{{.Repository}}:{{.Tag}} {{.ID}}' 2>/dev/null)
EOF
[ "$removed" -eq 0 ] && echo "  no superseded images to remove"

docker image prune -f 2>/dev/null | tail -1 || echo "  prune skipped"
df -h /var | awk 'NR==2 {print "  /var now " $5 " used, " $4 " free"}'

# A partition that fills has broken apt AND dockerd on this host before, so say
# so loudly while there is still room to act rather than at the next deploy.
USEDPCT="$(df --output=pcent /var | tail -1 | tr -dc '0-9')"
if [ "${USEDPCT:-0}" -ge 85 ]; then
  echo "  WARNING: /var is ${USEDPCT}% full. Extension requested from Moro"
  echo "           (ubuntu_vg/ubuntu_var, 20GB -> 60GB). Until that lands, an"
  echo "           image build needs ~2GB free and a full /var breaks dockerd."
fi
