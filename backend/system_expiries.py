"""Things that expire — one list, one place (fb_1788410870_12ae53c3).

The admin System tab showed CPU/memory/disk at 0% (psutil was not in the
image) and nothing about the dates that can take the service down on a
Monday morning. This module knows those dates:

  * the public TLS certificate — checked LIVE against the public host through
    the corporate proxy (HTTP CONNECT), with an env fallback for when the
    proxy is unreachable from the container
  * the DGHR mail app secret — a fact from the app registration
  * the UAE Pass client secret — whatever the owner records in env
  * anything else, as EXPIRY_ITEMS='[{"key":..,"label":..,"expires_on":"YYYY-MM-DD"}]'

Each item carries days_left and a status: ok (> 90 days), warning (<= 90 —
a certificate renewal through Moro and GlobalSign takes weeks), critical
(<= 14), expired, or unknown (no date recorded). No item is ever invented: a
date nobody recorded shows as unknown, not as a number.
"""
import json
import logging
import os
import socket
import ssl
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

WARNING_DAYS = 90
CRITICAL_DAYS = 14


def status_for(days_left: Optional[int]) -> str:
    if days_left is None:
        return 'unknown'
    if days_left < 0:
        return 'expired'
    if days_left <= CRITICAL_DAYS:
        return 'critical'
    if days_left <= WARNING_DAYS:
        return 'warning'
    return 'ok'


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.strptime(str(value).strip()[:10], '%Y-%m-%d').date()
    except ValueError:
        logger.warning("expiries: unparseable date %r", value)
        return None


def item(key: str, label: str, label_ar: str, expires_on: Optional[date],
         source: str, today: Optional[date] = None, detail: str = '') -> Dict[str, Any]:
    today = today or date.today()
    days = (expires_on - today).days if expires_on else None
    return {
        'key': key, 'label': label, 'label_ar': label_ar,
        'expires_on': expires_on.isoformat() if expires_on else None,
        'days_left': days, 'status': status_for(days), 'source': source, 'detail': detail,
    }


# ---------------------------------------------------------------------------
# Live TLS check. The container's outbound traffic goes through the corporate
# proxy; a plain ssl.create_connection to the public host is refused, so speak
# HTTP CONNECT to the proxy first, then wrap the tunnel in TLS. The handshake
# is enough — nothing is requested.
# ---------------------------------------------------------------------------

def fetch_tls_expiry(host: str, port: int = 443, timeout: float = 6.0) -> Dict[str, Any]:
    """Returns {'not_after': date, 'issuer': str, 'via': 'proxy'|'direct'} or raises."""
    proxy = os.getenv('HTTPS_PROXY') or os.getenv('https_proxy') or os.getenv('HTTP_PROXY') or os.getenv('http_proxy')
    ctx = ssl.create_default_context()
    if proxy:
        p = urlparse(proxy if '://' in proxy else 'http://' + proxy)
        raw = socket.create_connection((p.hostname, p.port or 8080), timeout=timeout)
        raw.sendall(f"CONNECT {host}:{port} HTTP/1.1\r\nHost: {host}:{port}\r\n\r\n".encode())
        reply = b''
        while b'\r\n\r\n' not in reply:
            chunk = raw.recv(4096)
            if not chunk:
                break
            reply += chunk
        if b' 200' not in reply.split(b'\r\n', 1)[0]:
            raw.close()
            raise ConnectionError(f"proxy refused CONNECT: {reply[:80]!r}")
        via = 'proxy'
    else:
        raw = socket.create_connection((host, port), timeout=timeout)
        via = 'direct'
    with ctx.wrap_socket(raw, server_hostname=host) as tls:
        cert = tls.getpeercert()
    not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc).date()
    issuer = ', '.join(v for rdn in cert.get('issuer', ()) for k, v in rdn if k in ('organizationName', 'commonName'))
    return {'not_after': not_after, 'issuer': issuer, 'via': via}


def collect(today: Optional[date] = None, env: Optional[Dict[str, str]] = None,
            tls_probe=fetch_tls_expiry) -> List[Dict[str, Any]]:
    env = os.environ if env is None else env
    today = today or date.today()
    items: List[Dict[str, Any]] = []

    # 1. Public TLS certificate — live, with a recorded fallback.
    host = env.get('PUBLIC_HOST') or urlparse(env.get('FRONTEND_URL', '')).hostname or ''
    tls_date, source, detail = None, 'not recorded', ''
    if host and not host.startswith(('localhost', '127.')):
        try:
            got = tls_probe(host)
            tls_date, source, detail = got['not_after'], f"live ({got['via']})", got['issuer']
        except Exception as e:  # proxy down, DNS, handshake — all mean "use the recorded date"
            logger.warning("expiries: live TLS check for %s failed: %s", host, e)
            tls_date, source = _parse_date(env.get('TLS_CERT_EXPIRES_ON')), 'recorded (live check failed)'
    else:
        tls_date, source = _parse_date(env.get('TLS_CERT_EXPIRES_ON')), 'recorded'
    items.append(item('tls_certificate', f'TLS certificate ({host or "public host"})',
                      f'شهادة TLS ({host or "المضيف العام"})', tls_date, source, today, detail))

    # 2. DGHR mail app secret — from the app registration (expires 23 Aug 2027).
    items.append(item('mail_app_secret', 'DGHR mail app secret (Microsoft Graph)',
                      'سر تطبيق البريد (DGHR)', _parse_date(env.get('MAIL_SECRET_EXPIRES_ON', '2027-08-23')),
                      'recorded', today))

    # 3. UAE Pass client secret — unknown until the owner records it.
    items.append(item('uaepass_client_secret', 'UAE Pass client secret', 'سر عميل الهوية الرقمية',
                      _parse_date(env.get('UAEPASS_SECRET_EXPIRES_ON')),
                      'recorded' if env.get('UAEPASS_SECRET_EXPIRES_ON') else 'not recorded', today))

    # 4. Anything else the operator lists.
    try:
        extra = json.loads(env.get('EXPIRY_ITEMS') or '[]')
    except ValueError:
        logger.warning("expiries: EXPIRY_ITEMS is not valid JSON")
        extra = []
    for x in extra if isinstance(extra, list) else []:
        if isinstance(x, dict) and x.get('key') and x.get('label'):
            items.append(item(str(x['key']), str(x['label']), str(x.get('label_ar') or x['label']),
                              _parse_date(x.get('expires_on')), 'recorded', today))

    order = {'expired': 0, 'critical': 1, 'warning': 2, 'unknown': 3, 'ok': 4}
    items.sort(key=lambda i: (order[i['status']], i['days_left'] if i['days_left'] is not None else 10**6))
    return items
