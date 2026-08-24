#!/usr/bin/env bash
# Run the scholarship link check once a day.
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
#   backend/scripts/verify_links_schedule.sh            # install / reinstall
#   backend/scripts/verify_links_schedule.sh --status   # is it running, what did it find
#   backend/scripts/verify_links_schedule.sh --remove
#   backend/scripts/verify_links_schedule.sh --once     # run it now, in the foreground

set -euo pipefail

NAME="emirati-link-check"
IMAGE="${IMAGE:-emirati_backend:latest}"
# 02:15 UTC = 06:15 Gulf. After the 01:30 backup so the two are not competing,
# and early enough that the operator finds the queue already populated.
HOUR="${HOUR:-2}"
MINUTE="${MINUTE:-15}"

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
      exec docker run --rm --name "${NAME}-once" \
          --network host \
          -e HTTP_PROXY -e HTTPS_PROXY -e NO_PROXY \
          -e http_proxy -e https_proxy -e no_proxy \
          "$IMAGE" python /app/scripts/verify_links.py ;;
esac

docker rm -f "$NAME" >/dev/null 2>&1 || true

# --network host: the checker talks to the live DB and out through the Moro
# proxy, both of which the backend container already reaches this way.
docker run -d --name "$NAME" \
    --restart unless-stopped \
    --network host \
    -e HOUR="$HOUR" -e MINUTE="$MINUTE" \
    -e HTTP_PROXY -e HTTPS_PROXY -e NO_PROXY \
    -e http_proxy -e https_proxy -e no_proxy \
    --entrypoint /bin/sh \
    "$IMAGE" -c '
      echo "link check scheduled daily at ${HOUR}:${MINUTE} UTC"
      while true; do
        now_h=$(date -u +%H); now_m=$(date -u +%M)
        target=$(( 10#$HOUR * 60 + 10#$MINUTE ))
        current=$(( 10#$now_h * 60 + 10#$now_m ))
        wait_min=$(( target - current ))
        [ $wait_min -le 0 ] && wait_min=$(( wait_min + 1440 ))
        sleep $(( wait_min * 60 ))
        echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) running link check ==="
        python /app/scripts/verify_links.py || echo "link check exited non-zero"
      done'

echo "installed $NAME — daily at ${HOUR}:${MINUTE} UTC"
echo "check it with: $0 --status"
