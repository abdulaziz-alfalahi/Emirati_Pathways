---
name: live-db-migration
description: Author and run a schema migration against the live dghr_prod database. Use whenever a fix needs a schema change, an index, a constraint, or a data repair.
---

# Live DB migrations (dghr_prod)

The live DB (10.228.145.66:5454, creds in `backend/.env`) serves staging AND holds production data. There is no migration runner — migrations are applied by hand, once, and must be written accordingly.

## Authoring rules (house style — see 006–011 for examples)
- File: `backend/migrations/NNN_short_slug.sql`, next sequential NNN (011 is taken).
- Header comment block MUST contain: the issue number, WHY the change is needed (the drift/bug story), the **precondition verified against the live DB with the date**, and what happens if the precondition fails elsewhere.
- Idempotent (`IF NOT EXISTS`, guarded `DO $$` blocks) — safe to run repeatedly.
- Wrapped in `BEGIN; ... COMMIT;`.
- Before any destructive statement: snapshot into a `_backup_<desc>_<NNN>` table.
- Trailing comment: verification queries with expected results.
- Beware dual-DDL drift: the repo's .sql files disagree with the live schema (`trade_license` vs `trade_license_no`, `name` vs `company_name`, `users.role` vs `user_type`). **The live information_schema is the only authority** — always check it first.

## Running (from this dev box)
No `psql` binary here — use psycopg2:

```bash
cd backend && python3 -c "
import os, psycopg2
from dotenv import load_dotenv; load_dotenv()
conn = psycopg2.connect(host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
    dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'), connect_timeout=8)
conn.autocommit = True   # the file's own BEGIN/COMMIT manages the txn
with conn.cursor() as cur:
    cur.execute(open('migrations/NNN_slug.sql').read())
conn.close()"
```

The restricted `postgres-live` MCP server is available for read-only inspection; writes go through psycopg2 as above.

## Discipline
1. Verify the precondition live BEFORE writing the file; put the finding + date in the header.
2. Run, then execute the verification queries and (where safe) a negative probe inside a rolled-back transaction (e.g. migration 011 proved its unique index by attempting a duplicate insert and rolling back).
3. State "migration NNN RAN on live DB <date>" in the PR body and the memory status ledger — deploys must know it is already applied.
4. Test data uses the `ZZ-` prefix (`ZZ-QA-SEED`, `ZZ-E2E`) and MUST be cleaned up afterwards.
