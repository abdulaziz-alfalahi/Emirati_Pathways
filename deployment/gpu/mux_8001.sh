#!/usr/bin/env bash
# Put the LLM balancer on the ONE port Moro has opened from APPQA to this node
# (8001, Whisper's) without losing Whisper: move stt-whisper to 127.0.0.1:8002
# with its exact image, env, mounts and GPU, then (re)start nginx on host
# network listening on 8000 + 8001 with /v1/audio/ routed to Whisper and
# everything else to the three vLLM replicas. Run ON 10.228.145.195 as ubuntu.
# Whisper is down for about a minute while it reloads its model - run it
# when no interview is in progress.
#
#   ~/mux_8001.sh            # expects ~/llm-lb.conf next to it
set -euo pipefail
CONF=${CONF:-$HOME/llm-lb.conf}
[ -f "$CONF" ] || { echo "missing $CONF"; exit 1; }
grep -q "upstream whisper" "$CONF" || { echo "$CONF is the OLD balancer config (no Whisper route) - copy the new llm-lb.conf first"; exit 1; }

echo "== stt-whisper: recreate on 127.0.0.1:8002 (same image/env/mounts/GPU)"
# The definition is captured to /tmp/whisper.json BEFORE the container is
# removed, and reused if the container is already gone (a failed earlier run).
if sudo docker inspect stt-whisper > /tmp/whisper.json.new 2>/dev/null; then
  sudo mv /tmp/whisper.json.new /tmp/whisper.json
elif [ ! -s /tmp/whisper.json ]; then
  echo "stt-whisper does not exist and /tmp/whisper.json is missing - cannot recreate"; exit 1
fi
# Python emits ONE shell line (properly quoted); eval executes it as such.
RUNLINE=$(sudo python3 - <<'PY'
import json, shlex
c = json.load(open('/tmp/whisper.json'))[0]
args = ['sudo', 'docker', 'run', '-d', '--name', 'stt-whisper', '--restart', 'unless-stopped',
        '-p', '127.0.0.1:8002:8000']
for e in c['Config'].get('Env') or []:
    if e.split('=', 1)[0] in ('PATH', 'HOME', 'HOSTNAME'):
        continue
    args += ['-e', e]
for m in c.get('Mounts') or []:
    if m.get('Type') == 'volume':
        args += ['-v', f"{m['Name']}:{m['Destination']}"]
    elif m.get('Type') == 'bind':
        args += ['-v', f"{m['Source']}:{m['Destination']}"]
for d in c['HostConfig'].get('DeviceRequests') or []:
    ids = d.get('DeviceIDs') or []
    args += ['--gpus', ('device=' + ','.join(ids)) if ids else 'all']
    break
args.append(c['Config']['Image'])
cmd = c['Config'].get('Cmd') or []
print(' '.join(shlex.quote(a) for a in args + cmd))
PY
)
echo "   $RUNLINE"
sudo docker rm -f stt-whisper >/dev/null 2>&1 || true
eval "$RUNLINE" >/dev/null
echo "   waiting for Whisper on :8002"
for i in $(seq 1 40); do curl -sf --noproxy '*' localhost:8002/health >/dev/null 2>&1 && break; sleep 5; done
curl -sf --noproxy '*' localhost:8002/health && echo "   whisper ok" || echo "   whisper NOT healthy yet - check: sudo docker logs stt-whisper"

echo "== balancer: nginx on host network, ports 8000 + 8001"
sudo mkdir -p /opt/llm-lb && sudo cp "$CONF" /opt/llm-lb/default.conf
sudo docker rm -f llm-lb >/dev/null 2>&1 || true
sudo docker run -d --name llm-lb --restart unless-stopped --network host \
  -v /opt/llm-lb/default.conf:/etc/nginx/conf.d/default.conf:ro nginx:stable >/dev/null
sleep 3
echo "== checks"
curl -s --noproxy '*' localhost:8001/v1/models | head -c 120; echo
curl -s --noproxy '*' -o /dev/null -w "whisper via 8001 /v1/audio/transcriptions -> HTTP %{http_code} (405/422 = reached Whisper)\n" localhost:8001/v1/audio/transcriptions
sudo docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'llm-|stt-'
