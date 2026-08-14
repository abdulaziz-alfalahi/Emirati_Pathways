# Switching LiveKit to the dedicated public IP

**Status: prepared, NOT applied.** Do not run this until GIN confirms the firewall
rule is live. Applying it early breaks video that currently works internally.

## What Moro is providing

GIN would not forward ports on the shared address, so Moro allocated a dedicated
public IP for the video service:

| Public IP | Destination | Service | Purpose |
|---|---|---|---|
| 213.42.53.198 | 10.228.145.5 (APPQA) | **TCP 7881** | media — fallback for restrictive networks |
| 213.42.53.198 | 10.228.145.5 (APPQA) | **UDP 7882** | media — primary path |

Signalling is **not** in that list and does not need to be: it already reaches
the platform over HTTPS 443 via `stg-emirati.ehrdc.gov.ae`, and the edge nginx
proxies it internally to `livekit-server:7880`. Only media cannot traverse the
WAF, which is why only media ports were requested.

## Why the firewall rule alone is not enough

LiveKit tells each participant's browser where to send media. It currently
advertises `10.228.145.5` (`rtc.node_ip`), which no browser on the internet can
route to. Until that becomes the public address, calls will still fail after GIN
finishes — with a working firewall rule and no obvious cause.

## The switch

On APPQA, one variable and a restart:

```bash
cd ~/Emirati_Pathways
echo 'LIVEKIT_NODE_IP=213.42.53.198' >> .env
docker restart livekit-server
```

`NODE_IP` is read by `livekit-server --node-ip` and overrides `rtc.node_ip`. It
defaults to the current internal address, so the compose change is inert until
this variable is set.

Confirm it took effect:

```bash
docker exec livekit-server printenv NODE_IP        # 213.42.53.198
docker logs --tail 20 livekit-server               # started, no crash loop
curl -sk -o /dev/null -w '%{http_code}\n' https://stg-emirati.ehrdc.gov.ae/health
```

## Verifying it actually works

The only real test is a call between two participants where **at least one is
off the corporate network** — a phone on mobile data is ideal. A call between
two machines inside 10.228.x.x will succeed even if the public path is broken,
because the browsers reach the internal candidate directly. That is precisely
the test that would give a false pass.

Check in the browser console on the remote side that the selected ICE candidate
pair uses `213.42.53.198`, not `10.228.145.5`.

## Rollback

```bash
sed -i '/^LIVEKIT_NODE_IP=/d' ~/Emirati_Pathways/.env
docker restart livekit-server
```

Back to the internal address, which is where it is today.

## Related, not part of this change

- **TURN is enabled but unreachable.** `livekit.yaml` sets `turn.enabled: true`
  on UDP 3478, but 3478 is not published from the container (only 7880/7881/7882
  are). TURN therefore does nothing today. No firewall rule was requested for it
  — a rule to a port nothing listens on is worse than no rule. If TURN is wanted
  later, publish the port first, then request it.
- **`use_external_ip` stays `false`.** `true` auto-detects the external address
  over STUN, which would discover the shared egress address rather than the
  dedicated inbound one — the wrong answer, arrived at automatically.
