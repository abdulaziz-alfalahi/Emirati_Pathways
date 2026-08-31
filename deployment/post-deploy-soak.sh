#!/bin/bash
# Post-deploy concurrency soak.
#
# A single /health 200 does NOT prove a gevent worker is safe: the psycogreen
# deploy passed health checks and ran for 15 hours before deadlocking at the
# first concurrent traffic. This drives real DB-backed endpoints in parallel —
# including an administrator surface, which is where the shared connection
# lives — then asks whether the worker is still answering.
set -u
B=http://127.0.0.1:5005
TOK=$(curl -s -m 10 -X POST $B/api/auth/uaepass/dev-login \
  -H 'Content-Type: application/json' -d '{"user_id":"784000000000020"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)
[ -z "$TOK" ] && { echo "  could not sign in — aborting soak"; exit 1; }

PATHS=(
  "/api/admin/users?limit=5"
  "/api/admin/feedback?limit=5"
  "/api/video-interview/sessions?role=recruiter"
  "/api/companies"
  "/api/maintenance"
  "/health"
)

fail=0
for round in 1 2 3; do
  for i in $(seq 1 12); do
    for p in "${PATHS[@]}"; do
      curl -s -o /dev/null -m 25 -H "Authorization: Bearer $TOK" "$B$p" &
    done
  done
  wait
  code=$(curl -s -o /dev/null -m 20 -w "%{http_code}" $B/health)
  printf "  round %d — %d concurrent requests, worker afterwards: /health -> %s\n" \
         "$round" "$(( 12 * ${#PATHS[@]} ))" "$code"
  [ "$code" != "200" ] && fail=1
done

echo
if [ "$fail" = "0" ]; then
  echo "  SOAK PASSED — worker still serving after $(( 3 * 12 * ${#PATHS[@]} )) concurrent requests"
else
  echo "  *** SOAK FAILED — the worker stopped answering under concurrency ***"
  exit 1
fi
