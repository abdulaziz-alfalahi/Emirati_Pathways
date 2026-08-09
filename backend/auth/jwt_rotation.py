"""Seamless dual-key JWT rotation.

WHY: rotating JWT_SECRET_KEY normally invalidates EVERY live token at once —
both the 1h access tokens and the 30d refresh tokens — forcing every user to
re-authenticate. On staging that is tolerable; against the mobile app's target
of ~150,000 phones it is a simultaneous mass-logout, a support spike, and a UAE
Pass load spike. This makes rotation seamless.

HOW: during an overlap window the backend accepts BOTH the old and the new
signing key.
  - Library path (@jwt_required): a decode_key_loader picks the key by the
    token's `iat` — tokens issued before JWT_ROTATION_AT were signed with the
    old key, tokens issued at/after with the current key.
  - Manual path (raw pyjwt.decode, e.g. Socket.IO auth): try the current key,
    then the old key.
New tokens are always signed with the CURRENT key (JWT_SECRET_KEY) — encoding is
untouched.

SAFETY: this is a NO-OP unless JWT_SECRET_KEY_OLD is set. With it unset the
loader always returns JWT_SECRET_KEY, exactly as the stock library does, so the
capability can be deployed well ahead of any rotation with zero behaviour change.

ROTATION RUNBOOK: see docs/jwt_rotation_runbook.md.

    Env vars:
      JWT_SECRET_KEY       current signing key (new key after rotation)
      JWT_SECRET_KEY_OLD   previous key, accepted during the overlap (unset = off)
      JWT_ROTATION_AT      unix seconds; tokens with iat < this use the old key
"""
import os
import logging

logger = logging.getLogger(__name__)


def _old_key():
    """The previous signing key, or None when no rotation is in progress."""
    return os.getenv('JWT_SECRET_KEY_OLD') or None


def _rotation_at():
    """Unix second at which the current key took over. 0 (default) means every
    token predates the cutover, so with an old key set they all verify against
    it until JWT_ROTATION_AT is stamped."""
    try:
        return int(os.getenv('JWT_ROTATION_AT', '0'))
    except (TypeError, ValueError):
        return 0


def install_key_rotation(jwt, app):
    """Register the dual-key decode loader on a JWTManager. No-op-safe."""

    @jwt.decode_key_loader
    def _pick_decode_key(jwt_header, jwt_data):
        # jwt_data is the UNVERIFIED payload — safe to read iat only to choose
        # which key to verify WITH; the signature check still happens after.
        old = _old_key()
        if old and int(jwt_data.get('iat', 0) or 0) < _rotation_at():
            return old
        return app.config['JWT_SECRET_KEY']

    if _old_key():
        logger.warning(
            "JWT dual-key rotation ACTIVE: accepting the old key for tokens "
            "issued before JWT_ROTATION_AT=%s. Unset JWT_SECRET_KEY_OLD once the "
            "refresh-token lifetime has elapsed.", _rotation_at())


def decode_token_multikey(token, pyjwt, app, **decode_kwargs):
    """Manual-path decode that accepts the current OR the old key.

    Mirrors the loader for code that calls pyjwt.decode directly (it cannot go
    through the library's loader). Only a bad SIGNATURE triggers the retry —
    an expired or malformed token still raises, unchanged.
    """
    decode_kwargs.setdefault('algorithms', ['HS256'])
    keys = [app.config['JWT_SECRET_KEY']]
    old = _old_key()
    if old:
        keys.append(old)
    last_err = None
    for key in keys:
        try:
            return pyjwt.decode(token, key, **decode_kwargs)
        except pyjwt.InvalidSignatureError as e:
            last_err = e
            continue
    raise last_err if last_err else pyjwt.InvalidTokenError('no signing key available')
