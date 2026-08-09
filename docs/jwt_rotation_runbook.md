# JWT secret rotation — runbook

**What this does:** replaces the JWT signing secret **without logging anyone out.**
**Mechanism:** dual-key overlap — `backend/auth/jwt_rotation.py` (see its header).
**When:** off-peak (owner suggested 10pm). The rotation itself is seconds; the value is in verifying after.

---

## Why we can't just swap the secret

Changing `JWT_SECRET_KEY` invalidates every token signed with the old one — both the 1-hour access tokens and the **30-day** refresh tokens. Everyone is forced to re-authenticate at once. On staging that's a few people; against the app's 150,000-phone target it's a simultaneous mass logout plus a UAE Pass load spike. So we rotate with an **overlap window**: the backend accepts the old key for tokens issued before the cutover, and the new key after, until the old tokens have all expired.

## Preconditions

- The dual-key capability is deployed (this is a no-op until `JWT_SECRET_KEY_OLD` is set). Confirm the code is on the running image: `docker exec backend python -c "import auth.jwt_rotation; print('ok')"`.
- You are on APPQA (`ssh appqa`).
- Someone is available for ~15 min after to verify and, if needed, roll back.

## Rotation (the 10pm run)

```sh
# 1. Generate a new strong secret (48 bytes, url-safe).
NEW=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")

# 2. Read the CURRENT secret straight from the running container.
OLD=$(docker inspect backend --format '{{range .Config.Env}}{{println .}}{{end}}' \
        | sed -n 's/^JWT_SECRET_KEY=//p')
[ -n "$OLD" ] || { echo "could not read current JWT_SECRET_KEY — abort"; }

# 3. Write the one-shot overlay the deploy script will apply.
#    old key -> accepted during overlap; new key -> signs from now; stamp the cutover.
cat > ~/appqa-backups/env-overlay.env <<EOF
JWT_SECRET_KEY=$NEW
JWT_SECRET_KEY_OLD=$OLD
JWT_ROTATION_AT=$(date +%s)
EOF
chmod 600 ~/appqa-backups/env-overlay.env

# 4. Deploy through the normal path (captures env, applies the overlay, keeps
#    backend_old for rollback, restarts edge nginx, health-checks).
cd ~/Emirati_Pathways && ./deployment/run-backend-appqa.sh

# 5. IMPORTANT: remove the overlay so it can't silently re-apply on the next deploy.
#    (The values are now baked into the running container and will be re-captured
#    by future deploys, so removing the file loses nothing.)
rm -f ~/appqa-backups/env-overlay.env
```

## Verify (do all of these before walking away)

```sh
# a) the capability reports active in the logs
docker logs backend 2>&1 | grep -i "dual-key rotation ACTIVE" | tail -1

# b) an EXISTING session still works — a token minted before the cutover.
#    Use a browser already logged in, or a token captured before step 4:
curl -sk https://stg-emirati.ehrdc.gov.ae/api/auth/uaepass/profile \
     -H "Authorization: Bearer <PRE-ROTATION-TOKEN>" -o /dev/null -w "old token -> %{http_code}\n"
#    expect 200 — this is the proof that nobody was logged out.

# c) a NEW login works (signs with the new key)
TOK=$(curl -sk -X POST https://stg-emirati.ehrdc.gov.ae/api/auth/uaepass/dev-login \
        -H 'Content-Type: application/json' -d '{"user_id":"784000000000320"}' \
        | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['access_token'])")
curl -sk https://stg-emirati.ehrdc.gov.ae/api/auth/uaepass/profile \
     -H "Authorization: Bearer $TOK" -o /dev/null -w "new token -> %{http_code}\n"   # expect 200

# d) Socket.IO handshake still authenticates (the manual decode path)
curl -sk 'https://stg-emirati.ehrdc.gov.ae/socket.io/?EIO=4&transport=polling' -o /dev/null -w "socket.io -> %{http_code}\n"

# e) the weak-secret warning is GONE (new secret is strong)
docker logs backend 2>&1 | grep -c "low-entropy/known"   # expect 0
```

If (b) returns 401, the overlap isn't working — **roll back** and investigate before proceeding:

```sh
docker rm -f backend && docker rename backend_old backend && docker start backend
docker restart emirati_frontend
```

## Close the window (schedule for ~31 days later)

Once the longest-lived pre-rotation token (30-day refresh) has expired, retire the old key so a leak of it is worthless. An **empty** `JWT_SECRET_KEY_OLD` turns the overlap off (the code treats `''` as unset), so this is one more overlay + deploy — no need to hand-edit a full env file:

```sh
printf 'JWT_SECRET_KEY_OLD=\n' > ~/appqa-backups/env-overlay.env
cd ~/Emirati_Pathways && ./deployment/run-backend-appqa.sh
rm -f ~/appqa-backups/env-overlay.env
# confirm the overlap is off: the log line from verify (a) should be GONE
docker logs backend 2>&1 | grep -c "dual-key rotation ACTIVE"   # expect 0
```

After this, only the new strong secret verifies; pre-rotation tokens are all expired and rejected.

## Production (emirati.ehrdc.gov.ae / APP02) — separate, later

The old prod deployment is a different host and **must get its own distinct secret**, not a copy of staging's — per-environment secrets was the point. Run this same procedure there when its cutover is planned, generating a fresh `NEW` on that host. Do **not** reuse staging's secret.

## Notes

- New tokens are always signed with `JWT_SECRET_KEY` (the current key); encoding is untouched.
- The overlap is discriminated by the token's `iat` (library path) and by trying both keys (Socket.IO manual path). Both are covered.
- Tested: `backend/tests/test_jwt_rotation.py` (5 cases — overlap accepts both, retirement rejects the old key, no-op when unset, expired tokens still fail, loader picks by `iat`).
