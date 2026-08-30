"""Microsoft Graph transport — the only thing in the platform that sends email.

WHY GRAPH AND NOT SMTP

Outbound SMTP to the relay at 10.61.192.7:25 is blocked at the Moro firewall
(re-verified 2026-08-07), which is why this platform has never sent an email.
Graph is HTTPS through the corporate proxy, so it sidesteps that block rather
than needing another firewall request.

DGHR issued the app registration on 2026-08-25. It is a client-credentials
application: no user signs in, the daemon holds a secret and sends as one
configured mailbox.

    Tenant and App ID live in the environment. The SECRET is a secret: it is
    read from the environment, never logged, and never included in an error
    message. `describe_config()` exists so an operator can check what is set
    without any value being printed.

WHAT THIS MODULE WILL NOT DO

It will not send a message that `outbound_mail.decide()` has not allowed. That
check happens here, immediately before the request, against the configuration
in force at that moment — not at compose time, and not once per batch. On
2026-08-25 a sweep found 46 board emails and 131 invitation links queued to
real employers and board offices; the point of this module is that such a thing
cannot be delivered without a named person having approved that exact message.

THE SECRET EXPIRES 23 AUGUST 2027. When it does, sending fails with an
authentication error and nothing else changes — no user sees anything. That is
why `send_one` records the error on the message rather than discarding it, and
why the message goes back to a state a person can see.
"""
import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)

try:
    from backend import outbound_mail
except ImportError:                          # the app runs under both roots
    import outbound_mail

_LOGIN_HOST = 'https://login.microsoftonline.com'
_GRAPH = 'https://graph.microsoft.com/v1.0'
_TIMEOUT = 30

#: Refresh this long before the token actually expires, so a request never
#: leaves with a token that dies mid-flight.
_EXPIRY_MARGIN_SECONDS = 120

_token_cache = {'value': None, 'expires_at': 0.0}


class MailNotConfigured(RuntimeError):
    """Raised when required settings are missing. Never contains the secret."""


class MailSendFailed(RuntimeError):
    """Graph refused the message. The message text is safe to store."""


def _setting(name):
    return (os.getenv(name) or '').strip()


def describe_config():
    """What is configured, WITHOUT revealing any value.

    An operator needs to answer "is mail set up?" without being shown a client
    secret, and without one appearing in a screenshot, a log, or a feedback
    report. So this reports presence only.
    """
    return {
        'tenant_id': bool(_setting('GRAPH_TENANT_ID')),
        'client_id': bool(_setting('GRAPH_CLIENT_ID')),
        'client_secret': bool(_setting('GRAPH_CLIENT_SECRET')),
        'sender_address': _setting('GRAPH_SENDER_ADDRESS') or None,
        'sending_enabled': outbound_mail.sending_enabled(),
        'allowed_recipients': outbound_mail.allowed_recipients(),
    }


def configured():
    c = describe_config()
    return all((c['tenant_id'], c['client_id'], c['client_secret'],
                c['sender_address']))


def _require_config():
    missing = [name for name in ('GRAPH_TENANT_ID', 'GRAPH_CLIENT_ID',
                                 'GRAPH_CLIENT_SECRET', 'GRAPH_SENDER_ADDRESS')
               if not _setting(name)]
    if missing:
        # Names only. A message that echoed values would put the secret into
        # last_error, which is rendered in the operator UI.
        raise MailNotConfigured('not configured: ' + ', '.join(missing))


def _post(url, data, headers, is_form):
    body = (urllib.parse.urlencode(data).encode() if is_form
            else json.dumps(data).encode('utf-8'))
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
        raw = resp.read()
        return resp.status, (json.loads(raw) if raw else {})


def get_token(force_refresh=False):
    """A client-credentials access token, cached until shortly before expiry."""
    _require_config()
    now = time.time()
    if not force_refresh and _token_cache['value'] and _token_cache['expires_at'] > now:
        return _token_cache['value']

    tenant = _setting('GRAPH_TENANT_ID')
    try:
        _status, payload = _post(
            f'{_LOGIN_HOST}/{tenant}/oauth2/v2.0/token',
            {'client_id': _setting('GRAPH_CLIENT_ID'),
             'client_secret': _setting('GRAPH_CLIENT_SECRET'),
             'scope': 'https://graph.microsoft.com/.default',
             'grant_type': 'client_credentials'},
            {'Content-Type': 'application/x-www-form-urlencoded'},
            is_form=True)
    except urllib.error.HTTPError as exc:
        detail = _safe_error(exc)
        # The commonest cause after August 2027 is an expired secret, and the
        # raw AADSTS text is not obvious about it.
        raise MailNotConfigured(
            f'could not authenticate to Microsoft Graph ({detail}). If this '
            f'started suddenly, check whether the client secret has expired — '
            f'the one issued on 2026-08-24 is valid until 2027-08-23.') from None
    except Exception as exc:
        raise MailNotConfigured(
            f'could not reach Microsoft Graph: {type(exc).__name__}') from None

    token = payload.get('access_token')
    if not token:
        raise MailNotConfigured('Graph returned no access token')
    _token_cache['value'] = token
    _token_cache['expires_at'] = now + max(
        60, int(payload.get('expires_in', 3600)) - _EXPIRY_MARGIN_SECONDS)
    return token


def _safe_error(exc):
    """A short, storable description of an HTTP failure with no secret in it."""
    try:
        body = exc.read().decode('utf-8', errors='replace')[:300]
    except Exception:
        body = ''
    secret = _setting('GRAPH_CLIENT_SECRET')
    if secret and secret in body:            # belt and braces; Graph never echoes it
        body = body.replace(secret, '[redacted]')
    return f'HTTP {exc.code} {body}'.strip()


def _message_payload(to_email, subject, body_text, body_html=None, to_name=None):
    recipient = {'emailAddress': {'address': to_email}}
    if to_name:
        recipient['emailAddress']['name'] = to_name
    return {
        'message': {
            'subject': subject,
            'body': ({'contentType': 'HTML', 'content': body_html} if body_html
                     else {'contentType': 'Text', 'content': body_text}),
            'toRecipients': [recipient],
        },
        # The sent copy is the platform's own record that a message really left,
        # independent of our database.
        'saveToSentItems': True,
    }


def send_one(message):
    """Send one already-approved message. Returns (ok, decision, detail).

    `message` is a row from `outbound_mail.claim_next_approved()`. The approval
    is taken from the row — a caller cannot assert it — so a message that was
    never approved cannot be sent by passing a flag.
    """
    approved = bool(message.get('approved_by'))
    # The kind is taken off the ROW, like the approval — a caller cannot assert
    # a kind to win an allow-list exemption it was not queued with.
    ok, decision = outbound_mail.decide(message.get('to_email'), approved=approved,
                                        kind=message.get('kind'))
    if not ok:
        return False, decision, outbound_mail.explain(decision)

    _require_config()
    sender = _setting('GRAPH_SENDER_ADDRESS')
    payload = _message_payload(
        message['to_email'], message['subject'], message['body_text'],
        body_html=message.get('body_html'), to_name=message.get('to_name'))

    try:
        status, _ = _post(
            f'{_GRAPH}/users/{urllib.parse.quote(sender)}/sendMail',
            payload,
            {'Authorization': f'Bearer {get_token()}',
             'Content-Type': 'application/json'},
            is_form=False)
    except urllib.error.HTTPError as exc:
        if exc.code == 401:                  # token rejected — refresh once
            try:
                status, _ = _post(
                    f'{_GRAPH}/users/{urllib.parse.quote(sender)}/sendMail',
                    payload,
                    {'Authorization': f'Bearer {get_token(force_refresh=True)}',
                     'Content-Type': 'application/json'},
                    is_form=False)
            except Exception as retry_exc:
                raise MailSendFailed(_describe(retry_exc)) from None
        else:
            raise MailSendFailed(_safe_error(exc)) from None
    except Exception as exc:
        raise MailSendFailed(_describe(exc)) from None

    # sendMail answers 202 Accepted with an empty body: there is no message id
    # to record, so the accepted status is the receipt.
    return True, outbound_mail.ALLOWED, f'accepted by Graph (HTTP {status})'


def _describe(exc):
    if isinstance(exc, urllib.error.HTTPError):
        return _safe_error(exc)
    return f'{type(exc).__name__}: {str(exc)[:200]}'


def send_approved_batch(limit=25):
    """Deliver approved messages, one at a time, newest approval last.

    Every outcome is written to the message before the next one is claimed, so
    a crash midway leaves an accurate record rather than a batch of unknowns.
    """
    sent = failed = blocked = 0
    for _ in range(max(1, limit)):
        message = outbound_mail.claim_next_approved()
        if not message:
            break
        try:
            ok, decision, detail = send_one(message)
        except (MailNotConfigured, MailSendFailed) as exc:
            outbound_mail.mark_failed(message['id'], str(exc))
            failed += 1
            continue
        if ok:
            outbound_mail.mark_sent(message['id'], gate_decision=decision)
            sent += 1
        else:
            outbound_mail.mark_failed(message['id'], detail, gate_decision=decision)
            blocked += 1
    return {'sent': sent, 'failed': failed, 'blocked': blocked}
