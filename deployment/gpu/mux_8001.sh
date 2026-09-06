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
# The balancer config travels inside this script (deployment/gpu/llm-lb.conf,
# same content): an old copy on the node, or none, is replaced. Twice the old
# 1.4 KB file arrived on the node instead of the new one.
if ! grep -q "upstream whisper" "$CONF" 2>/dev/null; then
  echo "== writing the balancer config to $CONF (embedded copy)"
  cat > "$CONF" <<'NGINXCONF'
# One front door on 10.228.145.195 for both GPU services, as an nginx container
# with --network host. Listens on 8000 (the port requested from Moro for the
# balancer) AND 8001 (the port Moro already opened for Whisper), so the
# platform can reach the LLM today. Whisper itself moves to 127.0.0.1:8002
# (deployment/gpu/mux_8001.sh) and is reached through here on /v1/audio/.
#
#   sudo mkdir -p /opt/llm-lb && sudo cp llm-lb.conf /opt/llm-lb/default.conf
#   sudo docker run -d --name llm-lb --restart unless-stopped --network host \
#       -v /opt/llm-lb/default.conf:/etc/nginx/conf.d/default.conf:ro nginx:stable
#
# Passive health: a replica that fails twice is skipped for 30 s, then retried.
# A request whose replica dies mid-flight is retried once on another.

upstream qwen {
    least_conn;
    server 127.0.0.1:8010        max_fails=2 fail_timeout=30s;   # replica A  .195 GPU 1
    server 10.228.145.194:8010   max_fails=2 fail_timeout=30s;   # replica B  .194 GPU 0
    server 10.228.145.194:8011   max_fails=2 fail_timeout=30s;   # replica C  .194 GPU 1
}

upstream whisper {
    server 127.0.0.1:8002;                                       # stt-whisper  .195 GPU 0
}

server {
    listen 8000;
    listen 8001;
    client_max_body_size 64m;            # scanned CVs as images; interview audio chunks

    # Speech-to-text keeps its path and its port: the interview agent's
    # STT_BASE_URL (http://10.228.145.195:8001/v1) does not change.
    location /v1/audio/ {
        proxy_pass http://whisper;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 300s;
        proxy_request_buffering off;
    }

    location / {
        proxy_pass http://qwen;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_buffering off;             # streaming responses pass through
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 2;
    }
}
NGINXCONF
fi

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
