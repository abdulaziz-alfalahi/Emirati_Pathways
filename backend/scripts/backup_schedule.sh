#!/usr/bin/env bash
# Install a nightly database dump as a container.
#
# WHY A CONTAINER AND NOT CRON
#
# cron is unavailable: `/etc/cron.allow` blocks this user on APPQA and on the
# dev box alike, and systemd user units would stop at logout because lingering
# is disabled (Linger=no) and enabling it needs root. Asking IT for cron access
# is the better long-term answer and is worth requesting — but a backup that
# waits on a ticket is not a backup, and real citizen data is arriving now
# (nafis_job_seekers went from 3 rows to 3,969 on 2026-08-20).
#
# So the schedule lives in a container with `--restart unless-stopped`, which
# survives both logout and reboot — the same mechanism already relied on for
# stt-whisper.
#
# WHAT THIS DOES *NOT* DO, deliberately
#
# It dumps; it does NOT verify the restore. Verification needs a second Postgres
# instance, which from inside a container would mean mounting the Docker socket
# — handing root on the host to a backup job. That trade is not worth it.
#
# So the nightly job produces dumps, and `backup_db.sh` remains the thing that
# PROVES they restore. Run it by hand periodically, and always before a
# migration or a bulk import. An unverified nightly dump is a reasonable safety
# net; it is not evidence of recoverability.
#
# USAGE
#   backend/scripts/backup_schedule.sh            # install / reinstall
#   backend/scripts/backup_schedule.sh --status   # is it running, what has it made
#   backend/scripts/backup_schedule.sh --remove

set -euo pipefail

NAME="emirati-db-backup"
BACKUP_DIR="${BACKUP_DIR:-$HOME/appqa-backups/db}"
PG_IMAGE="${PG_IMAGE:-postgres:18-alpine}"
# 01:30 UTC = 05:30 Gulf time: the container runs UTC, not host-local, and
# verifying that was worth doing rather than assuming. Still a low-traffic
# window; override HOUR/MINUTE (UTC) if a different one is wanted.
HOUR="${HOUR:-1}"
MINUTE="${MINUTE:-30}"
KEEP="${KEEP:-14}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "${1:-}" in
  --remove)
      docker rm -f "$NAME" >/dev/null 2>&1 && echo "removed $NAME" || echo "$NAME not running"
      exit 0 ;;
  --status)
      docker ps -a --filter "name=^${NAME}$" --format '  {{.Names}}: {{.Status}}'
      echo "  dumps held:"
      ls -1t "$BACKUP_DIR"/*.dump 2>/dev/null | head -5 | while read -r f; do
          echo "    $(basename "$f")  $(du -h "$f" | cut -f1)"
      done
      echo "  last log lines:"
      docker logs --tail 5 "$NAME" 2>&1 | sed 's/^/    /'
      exit 0 ;;
esac

env_get() {
    sed -n "s/^[[:space:]]*${1}[[:space:]]*=[[:space:]]*//p" "$HERE/.env" \
        | head -1 | sed 's/^"//; s/"$//'
}
DB_HOST="$(env_get DB_HOST)"; DB_PORT="$(env_get DB_PORT)"
DB_NAME="$(env_get DB_NAME)"; DB_USER="$(env_get DB_USER)"
DB_PASSWORD="$(env_get DB_PASSWORD)"
: "${DB_HOST:?}"; : "${DB_NAME:?}"; : "${DB_USER:?}"; : "${DB_PASSWORD:?}"

mkdir -p "$BACKUP_DIR"; chmod 700 "$BACKUP_DIR"

docker rm -f "$NAME" >/dev/null 2>&1 || true

# --user: files land owned by the invoking account, not root, so they can be
# read, pruned and copied without privilege.
docker run -d --name "$NAME" \
    --restart unless-stopped \
    --user "$(id -u):$(id -g)" \
    -e PGPASSWORD="$DB_PASSWORD" \
    -e DB_HOST="$DB_HOST" -e DB_PORT="${DB_PORT:-5432}" \
    -e DB_NAME="$DB_NAME" -e DB_USER="$DB_USER" \
    -e HOUR="$HOUR" -e MINUTE="$MINUTE" -e KEEP="$KEEP" \
    -v "$BACKUP_DIR":/backup \
    "$PG_IMAGE" sh -c '
        echo "backup scheduler started; target ${HOUR}:${MINUTE} daily"
        while true; do
            # Seconds until the next HOUR:MINUTE, by pure arithmetic.
            #
            # NOT `date -d "tomorrow 1:30"`: this image is alpine, whose busybox
            # date has no -d parsing. It returned an error, the subtraction gave
            # a NEGATIVE sleep, and the loop dumped the production database
            # continuously — caught within seconds of installing it on
            # 2026-08-20, having already written two dumps.
            #
            # 10# forces base-10: `date +%H` yields 08 and 09, which the shell
            # would otherwise read as invalid octal.
            h=$(date +%H); m=$(date +%M); sec=$(date +%S)
            now_secs=$(( 10#$h * 3600 + 10#$m * 60 + 10#$sec ))
            target_secs=$(( HOUR * 3600 + MINUTE * 60 ))
            delta=$(( target_secs - now_secs ))
            [ "$delta" -le 0 ] && delta=$(( delta + 86400 ))
            # A guard, because the cost of getting this wrong is a loop against
            # the live database rather than a missed backup.
            [ "$delta" -lt 60 ] && delta=60
            echo "$(date -Iseconds) sleeping ${delta}s until next run"
            sleep "$delta"

            f="/backup/${DB_NAME}-$(date +%Y-%m-%d-%H%M).dump"
            if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                       --format=custom --no-owner --no-acl -f "$f"; then
                chmod 600 "$f" 2>/dev/null || true
                echo "$(date -Iseconds) wrote $f ($(du -h "$f" | cut -f1))"
                # Prune only after a SUCCESSFUL dump, so a run of failures can
                # never delete the last good backup.
                ls -1t /backup/${DB_NAME}-*.dump 2>/dev/null | tail -n +$((KEEP + 1)) \
                    | while read -r old; do echo "$(date -Iseconds) pruning $old"; rm -f "$old"; done
            else
                echo "$(date -Iseconds) DUMP FAILED — keeping all existing dumps"
            fi
        done'

sleep 2
docker ps --filter "name=^${NAME}$" --format '  {{.Names}}: {{.Status}}'
echo "  nightly dump at ${HOUR}:${MINUTE}, keeping ${KEEP}, into ${BACKUP_DIR}"
echo "  NOTE: this does not verify restores — run backup_db.sh for that,"
echo "        and always before a migration or bulk import."
