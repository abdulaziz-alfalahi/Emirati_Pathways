#!/usr/bin/env bash
# Provision a throwaway Postgres for the backend test suite.
#
# WHY THIS EXISTS
#
# The DB in backend/.env is dghr_prod — the LIVE database. Running the suite on
# a dev box therefore wrote production data, and stranded users had to be
# cleared by hand three times. conftest.py now refuses those connections, but a
# guard on its own only makes the suite skip 21 modules locally, which is a
# standing incentive to set ALLOW_LIVE_DB_TESTS=1 and go back to polluting.
#
# So this gives the safe path parity with CI: a disposable container, schema
# provisioned exactly the way .github/workflows/backend-ci.yml does it, and the
# full suite collected instead of a subset.
#
# USAGE
#   backend/scripts/local_test_db.sh          # create + provision, print the export
#   backend/scripts/local_test_db.sh --down   # destroy it
#
# Then:
#   export DATABASE_URL=postgresql://test:test@127.0.0.1:55432/test
#   .venv/bin/python -m pytest backend/tests/
#
# DATABASE_URL is what conftest bridges to DB_*, and it is not the live host, so
# the guard stays dormant. Unset it and the guard engages again.

set -euo pipefail

NAME=emirati-test-db
PORT=55432
IMAGE=postgres:15-alpine     # matches the CI service image
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # backend/

if [[ "${1:-}" == "--down" ]]; then
    docker rm -f "$NAME" >/dev/null 2>&1 && echo "removed $NAME" || echo "$NAME not running"
    exit 0
fi

if docker inspect "$NAME" >/dev/null 2>&1; then
    echo "==> $NAME already exists; recreating for a clean schema"
    docker rm -f "$NAME" >/dev/null
fi

echo "==> Starting $IMAGE as $NAME on :$PORT"
docker run -d --name "$NAME" \
    -e POSTGRES_DB=test -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
    -p "$PORT":5432 "$IMAGE" >/dev/null

echo "==> Waiting for readiness"
until docker exec "$NAME" pg_isready -U test >/dev/null 2>&1; do sleep 1; done

export DB_HOST=127.0.0.1 DB_PORT="$PORT" DB_NAME=test DB_USER=test DB_PASSWORD=test

echo "==> Provisioning schema (same sequence as backend-ci.yml)"
cd "$HERE"
python3 - <<'PY'
import os, psycopg2
c = psycopg2.connect(host=os.environ["DB_HOST"], port=os.environ["DB_PORT"],
                     dbname=os.environ["DB_NAME"], user=os.environ["DB_USER"],
                     password=os.environ["DB_PASSWORD"])
c.autocommit = True
with c.cursor() as cur:
    cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
c.close()
print("    uuid-ossp ready")
PY

python3 migrate.py >/dev/null && echo "    migrate.py: ~130 tables from DATABASE_SCHEMA.md"

# DATABASE_SCHEMA.md is the PRE-EID schema, so CI layers the additive files on
# top, in this order. Kept in step with the workflow — if CI gains one, add it
# here too or the local run diverges from the one that gates merges.
python3 - <<'PY'
import os, psycopg2
c = psycopg2.connect(host=os.environ["DB_HOST"], port=os.environ["DB_PORT"],
                     dbname=os.environ["DB_NAME"], user=os.environ["DB_USER"],
                     password=os.environ["DB_PASSWORD"])
c.autocommit = True
for f in ("migrations/ci_provision.sql",
          "migrations/003_consents_table.sql",
          "migrations/002_audit_log_append_only.sql"):
    with open(f, encoding="utf-8") as fh:
        with c.cursor() as cur:
            cur.execute(fh.read())
    print(f"    applied {f}")
c.close()
PY

cat <<EOF

==> Ready. Run the suite against it with:

    export DATABASE_URL=postgresql://test:test@127.0.0.1:$PORT/test
    .venv/bin/python -m pytest backend/tests/

    Tear down with: backend/scripts/local_test_db.sh --down
EOF
