#!/usr/bin/env bash
# Back up dghr_prod — and prove the backup restores.
#
# WHY THIS EXISTS
#
# There was no database backup of any kind. Checked 2026-08-19: no pg_dump on
# APPQA, no backup cron, and ~/appqa-backups held only container env files. The
# database holding 5,336 people's records — soon to hold the NAFIS roster — had
# no recovery path at all.
#
# The trigger is the cutover plan: real citizen data is about to be loaded into
# this database, and NAFIS's file is a snapshot in time. A bad import with no
# backup is not a setback, it is unrecoverable.
#
# IT RESTORES, OR IT IS NOT A BACKUP
#
# The dump is restored into a throwaway container and row counts are compared
# against the source on every run. A dump nobody has restored is a file with
# comforting size, and the failure mode of an unverified backup is that you
# discover it during the incident it was meant to cover.
#
# NO POSTGRES CLIENT IS INSTALLED ANYWHERE, and this deliberately does not
# install one: pg_dump runs from the official postgres image, which is already
# pulled for the test database. Version-matched to the server, because pg_dump
# older than the server refuses to run.
#
# THE DUMP IS SENSITIVE. It contains every Emirates ID in plaintext (users.id IS
# the EID by design). Files are written 600 in a 700 directory. Encryption at
# rest and an off-host copy are decisions still open — see docs.
#
# USAGE
#   backend/scripts/backup_db.sh              # dump + verify restore
#   backend/scripts/backup_db.sh --no-verify  # dump only (faster, weaker)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/appqa-backups/db}"
KEEP="${KEEP:-14}"
# MUST be >= the server major version: pg_dump refuses to dump a newer server.
# The live server is EDB Postgres Extended 18.4 (checked 2026-08-20), so 15 —
# the version the test-database script uses — would fail on the first run.
PG_IMAGE="${PG_IMAGE:-postgres:18-alpine}"
VERIFY_PORT="${VERIFY_PORT:-55433}"
VERIFY_NAME="emirati-restore-check"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # backend/

# Readiness must be checked FROM THE HOST, on the published port, with a real
# query. `docker exec pg_isready` returns true against the temporary
# socket-only server the postgres entrypoint runs during initdb — before the
# real server is listening on the mapped port. That race is why this restore
# failed on its first run, and it is the same race that silently produced an
# unprovisioned test database twice on 2026-08-19.
wait_for_pg() {
    local port="$1" user="$2" db="$3" pw="$4"
    for _ in $(seq 1 60); do
        if PGPASSWORD="$pw" python3 - "$port" "$user" "$db" "$pw" <<'WAITEOF' 2>/dev/null
import sys, psycopg2
port, user, db, pw = sys.argv[1:5]
psycopg2.connect(host='127.0.0.1', port=port, dbname=db, user=user,
                 password=pw, connect_timeout=2).close()
WAITEOF
        then return 0; fi
        sleep 1
    done
    echo "    postgres on :$port never became ready" >&2
    return 1
}

VERIFY=1
[[ "${1:-}" == "--no-verify" ]] && VERIFY=0

# Credentials come from backend/.env, the same file the app reads.
#
# READ, not sourced. Sourcing executes the file: a value containing `$1` (there
# is one — a hash) aborts under `set -u`, and more generally an env file should
# not be able to run commands just because a backup script read it.
env_get() {
    local key="$1"
    sed -n "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//p" "$HERE/.env" \
        | head -1 | sed 's/^"//; s/"$//; s/^'"'"'//; s/'"'"'$//'
}

DB_HOST="$(env_get DB_HOST)"
DB_PORT="$(env_get DB_PORT)"
DB_NAME="$(env_get DB_NAME)"
DB_USER="$(env_get DB_USER)"
DB_PASSWORD="$(env_get DB_PASSWORD)"
export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
: "${DB_HOST:?DB_HOST missing from backend/.env}"
: "${DB_NAME:?DB_NAME missing}"
: "${DB_USER:?DB_USER missing}"
: "${DB_PASSWORD:?DB_PASSWORD missing}"
DB_PORT="${DB_PORT:-5432}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date +%Y-%m-%d-%H%M)"
DUMP="$BACKUP_DIR/${DB_NAME}-${STAMP}.dump"

echo "==> Dumping $DB_NAME from $DB_HOST:$DB_PORT"
# --format=custom: compressed, and restorable selectively (a single table can be
# recovered without replaying the whole database).
# --user: without it the container writes the dump as root and the chmod below
# fails, leaving a root-owned file with default permissions in a directory of
# citizen data. pg_dump needs no privileges beyond writing its output.
docker run --rm --user "$(id -u):$(id -g)" \
    -e PGPASSWORD="$DB_PASSWORD" -v "$BACKUP_DIR":/backup \
    "$PG_IMAGE" pg_dump \
    -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=custom --no-owner --no-acl \
    -f "/backup/$(basename "$DUMP")"

chmod 600 "$DUMP"
SIZE="$(du -h "$DUMP" | cut -f1)"
echo "    wrote $DUMP ($SIZE)"

if [[ "$VERIFY" == "0" ]]; then
    echo "==> Skipping restore verification (--no-verify). This is a dump, not yet a backup."
    exit 0
fi

echo "==> Restoring into a throwaway container to prove it works"
docker rm -f "$VERIFY_NAME" >/dev/null 2>&1 || true
docker run -d --name "$VERIFY_NAME" \
    -e POSTGRES_DB=verify -e POSTGRES_USER=verify -e POSTGRES_PASSWORD=verify \
    -p "$VERIFY_PORT":5432 "$PG_IMAGE" >/dev/null
wait_for_pg "$VERIFY_PORT" verify verify verify

docker run --rm --network host -e PGPASSWORD=verify -v "$BACKUP_DIR":/backup \
    "$PG_IMAGE" pg_restore \
    -h 127.0.0.1 -p "$VERIFY_PORT" -U verify -d verify \
    --no-owner --no-acl "/backup/$(basename "$DUMP")" 2>&1 \
    | grep -vE "^$" | tail -5 || true

echo "==> Comparing row counts, source vs restored"
export VERIFY_PORT
# set +e around the check: under `set -e` a failed verification would abort right
# here, skipping both the container cleanup and the explicit failure message —
# leaving a stray container and a silent exit, which is the worst way for a
# backup check to fail.
set +e
python3 - "$DUMP" <<'PYEOF'
import os, sys
import psycopg2

# The tables whose loss would actually hurt. Not every table — a count check
# that lists 130 tables is one nobody reads.
TABLES = ['users', 'companies', 'job_postings', 'job_applications',
          'candidate_profiles', 'user_cvs', 'consents', 'admin_audit_log',
          'nafis_job_seekers', 'coach_client_assignments']

def counts(**kw):
    out = {}
    with psycopg2.connect(connect_timeout=10, **kw) as c:
        with c.cursor() as cur:
            for t in TABLES:
                try:
                    cur.execute('SELECT count(*) FROM %s' % t)
                    out[t] = cur.fetchone()[0]
                except Exception:
                    c.rollback()
                    out[t] = None
    return out

src = counts(host=os.environ['DB_HOST'], port=os.environ.get('DB_PORT', 5432),
             dbname=os.environ['DB_NAME'], user=os.environ['DB_USER'],
             password=os.environ['DB_PASSWORD'])
dst = counts(host='127.0.0.1', port=os.environ.get('VERIFY_PORT', '55433'),
             dbname='verify', user='verify', password='verify')

bad = []
for t in TABLES:
    s, d = src.get(t), dst.get(t)
    mark = 'ok' if s == d else 'MISMATCH'
    if s != d:
        bad.append(t)
    print('    %-26s source=%-8s restored=%-8s %s' % (t, s, d, mark))

if bad:
    # Loud, and a non-zero exit: a backup that restores differently is worse
    # than none, because it will be trusted.
    print('\n    RESTORE VERIFICATION FAILED for: %s' % ', '.join(bad))
    sys.exit(1)
print('\n    restore verified — every checked table matches')
PYEOF
RESULT=$?
set -e

docker rm -f "$VERIFY_NAME" >/dev/null 2>&1 || true

if [[ $RESULT -ne 0 ]]; then
    echo "==> FAILED. The dump is kept at $DUMP for inspection."
    exit 1
fi

# Prune old dumps only AFTER a successful verification, so a run that cannot
# prove itself never deletes the last known-good backup.
echo "==> Pruning to the newest $KEEP dumps"
ls -1t "$BACKUP_DIR"/${DB_NAME}-*.dump 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    echo "    removing $(basename "$old")"
    rm -f "$old"
done

echo "==> Done. $(ls -1 "$BACKUP_DIR"/${DB_NAME}-*.dump 2>/dev/null | wc -l) dump(s) held in $BACKUP_DIR"
