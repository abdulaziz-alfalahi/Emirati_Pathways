#!/usr/bin/env bash
# Run the scholarship scout once a day.
#
# WHY A CONTAINER AND NOT CRON
#
# The same reason backup_schedule.sh uses one: /etc/cron.allow blocks this user
# on APPQA and on the dev box alike, and a systemd user unit would stop at
# logout because lingering is disabled and enabling it needs root. A container
# with --restart unless-stopped survives both logout and reboot.
#
# It reuses the backend image rather than installing Python somewhere new, so
# the checker runs against exactly the code and certificate bundle that ships —
# including backend/certs/extra_intermediates.pem, without which KHDA is
# unreachable from inside the container.
#
# WHAT IT DOES NOT DO
#
# It never unpublishes anything. The checker records a state; a person decides.
# The first real test run showed why: KHDA, which runs the AED 1.1bn Hamdan bin
# Mohammed programme, fails TLS verification from our container because their
# web host serves an incomplete chain. A job that acted on its own findings
# would have removed the most important programme in the directory.
#
# USAGE
#   backend/scripts/scout_schedule.sh            # install / reinstall
#   backend/scripts/scout_schedule.sh --status   # is it running, what did it find
#   backend/scripts/scout_schedule.sh --remove
#   backend/scripts/scout_schedule.sh --once     # run it now, in the foreground
#
# NOTE the scout needs DASHSCOPE_API_KEY as well as the DB credentials — it
# calls Qwen. Without it the run reports a model error per source rather than
# silently finding nothing, which is the distinction Phase 0 exists to keep.

set -euo pipefail

# WHY PYTHONPATH=/
#
# services/qwen_client.py imports `backend.config.qwen_config` unconditionally —
# no try/except fallback, unlike most modules here. Inside the image /app is the
# code root and /backend is a symlink to it, so `backend.*` resolves only when /
# is on sys.path. WORKDIR is /app, so a plain `python /app/scripts/...` fails
# with ModuleNotFoundError: No module named 'backend'. Setting PYTHONPATH=/ is
# the smallest fix that does not require editing an import path shared with the
# running application.
NAME="emirati-link-scout"
IMAGE="${IMAGE:-emirati_backend:latest}"
# 03:00 UTC = 07:00 Gulf. AFTER the 02:15 link check, deliberately: a link
# the checker has just marked gone should not be proposed again minutes
# later, and the operator wants one queue in the morning, not two.
HOUR="$(( 10#${HOUR:-3} ))"
MINUTE="$(( 10#${MINUTE:-0} ))"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# The image deliberately contains no .env — secrets are injected at run time, and
# the running backend gets DB_* from its environment. The first --once run failed
# because load_dotenv() found no file and psycopg2 fell back to a local unix
# socket that does not exist in the container. So the credentials are read here,
# in the installing shell, and passed in. Same approach as backup_schedule.sh.
env_get() {
    sed -n "s/^[[:space:]]*${1}[[:space:]]*=[[:space:]]*//p" "$HERE/.env" \
        | head -1 | sed 's/^"//; s/"$//'
}
# EXPORTED, not just assigned: `docker run -e VAR` forwards a variable only if
# it is in the environment, and a plain shell assignment is not. Without this the
# flags are silently no-ops and the container falls back to a local unix socket —
# which is exactly how the first two --once runs failed.
export DB_HOST="$(env_get DB_HOST)"
export DB_PORT="$(env_get DB_PORT)"
export DB_NAME="$(env_get DB_NAME)"
export DB_USER="$(env_get DB_USER)"
export DB_PASSWORD="$(env_get DB_PASSWORD)"
export DASHSCOPE_API_KEY="$(env_get DASHSCOPE_API_KEY)"

case "${1:-}" in
  --remove)
      docker rm -f "$NAME" >/dev/null 2>&1 && echo "removed $NAME" || echo "$NAME not running"
      exit 0 ;;
  --status)
      docker ps -a --filter "name=^${NAME}$" --format '  {{.Names}}: {{.Status}}'
      echo "  last run:"
      docker logs --tail 25 "$NAME" 2>&1 | sed 's/^/    /'
      exit 0 ;;
  --once)
      : "${DB_HOST:?DB_HOST missing from backend/.env}"
      exec docker run --rm --name "${NAME}-once" \
          --network host \
          -e PYTHONPATH=/ \
          -e DB_HOST -e DB_PORT -e DB_NAME -e DB_USER -e DB_PASSWORD \
          -e DASHSCOPE_API_KEY \
    -e DASHSCOPE_API_KEY \
          -e HTTP_PROXY -e HTTPS_PROXY -e NO_PROXY \
          -e http_proxy -e https_proxy -e no_proxy \
          "$IMAGE" python /app/scripts/scout_scholarships.py ;;
esac

: "${DB_HOST:?DB_HOST missing from backend/.env}"

docker rm -f "$NAME" >/dev/null 2>&1 || true

# --network host: the checker talks to the live DB and out through the Moro
# proxy, both of which the backend container already reaches this way.
docker run -d --name "$NAME" \
    --restart unless-stopped \
    --network host \
    -e HOUR="$HOUR" -e MINUTE="$MINUTE" \
    -e PYTHONPATH=/ \
    -e DB_HOST -e DB_PORT -e DB_NAME -e DB_USER -e DB_PASSWORD \
    -e DASHSCOPE_API_KEY \
    -e HTTP_PROXY -e HTTPS_PROXY -e NO_PROXY \
    -e http_proxy -e https_proxy -e no_proxy \
    --entrypoint /bin/sh \
    "$IMAGE" -c '
      printf 'scholarship scout scheduled daily at %02d:%02d UTC\n' "$HOUR" "$MINUTE"
      while true; do
        # The image ships dash as /bin/sh, which has no bash "10#" base prefix —
        # the first install crash-looped on it. date is asked for a non-padded
        # hour and minute instead, so nothing needs a base hint and nothing is
        # ever read as octal.
        now_h=$(date -u +%-H); now_m=$(date -u +%-M)
        target=$(( HOUR * 60 + MINUTE ))
        current=$(( now_h * 60 + now_m ))
        wait_min=$(( target - current ))
        [ $wait_min -le 0 ] && wait_min=$(( wait_min + 1440 ))
        sleep $(( wait_min * 60 ))
        echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) running scholarship scout ==="
        python /app/scripts/scout_scholarships.py || echo "scout exited non-zero"
      done'

printf 'installed %s — daily at %02d:%02d UTC\n' "$NAME" "$HOUR" "$MINUTE"
echo "check it with: $0 --status"
