"""Dual-key JWT rotation — the four cases that make a rotation seamless.

Run inside the backend container (flask_jwt_extended lives there):
  docker exec backend python -m pytest backend/tests/test_jwt_rotation.py -q
"""
import os
import time
import jwt as pyjwt

OLD = 'old-weak-secret-value-000000000000'
NEW = 'new-strong-secret-value-aaaaaaaaaaaaaaaaaaaa'


def _mint(secret, iat):
    return pyjwt.encode({'sub': '784000000000320', 'iat': iat,
                         'type': 'access'}, secret, algorithm='HS256')


class _App:
    def __init__(self, current):
        self.config = {'JWT_SECRET_KEY': current}


def test_manual_path_accepts_both_keys_during_overlap(monkeypatch):
    try:
        from backend.auth.jwt_rotation import decode_token_multikey
    except ImportError:
        from auth.jwt_rotation import decode_token_multikey
    monkeypatch.setenv('JWT_SECRET_KEY_OLD', OLD)
    app = _App(NEW)
    old_tok = _mint(OLD, int(time.time()) - 100)
    new_tok = _mint(NEW, int(time.time()))
    # both verify — no forced logout
    assert decode_token_multikey(old_tok, pyjwt, app)['sub'] == '784000000000320'
    assert decode_token_multikey(new_tok, pyjwt, app)['sub'] == '784000000000320'


def test_manual_path_rejects_old_key_after_overlap_removed(monkeypatch):
    try:
        from backend.auth.jwt_rotation import decode_token_multikey
    except ImportError:
        from auth.jwt_rotation import decode_token_multikey
    monkeypatch.delenv('JWT_SECRET_KEY_OLD', raising=False)
    app = _App(NEW)
    old_tok = _mint(OLD, int(time.time()) - 100)
    # once the old key is retired, tokens signed with it no longer verify
    try:
        decode_token_multikey(old_tok, pyjwt, app)
        assert False, 'old-key token should be rejected after overlap'
    except pyjwt.InvalidSignatureError:
        pass


def test_no_op_when_no_old_key(monkeypatch):
    """With no old key set the manual path is exactly stock single-key decode."""
    try:
        from backend.auth.jwt_rotation import decode_token_multikey
    except ImportError:
        from auth.jwt_rotation import decode_token_multikey
    monkeypatch.delenv('JWT_SECRET_KEY_OLD', raising=False)
    app = _App(NEW)
    assert decode_token_multikey(_mint(NEW, int(time.time())), pyjwt, app)['sub']
    try:
        decode_token_multikey(_mint(OLD, int(time.time())), pyjwt, app)
        assert False
    except pyjwt.InvalidSignatureError:
        pass


def test_expired_token_still_raises_not_retried(monkeypatch):
    """A bad signature triggers the retry; an EXPIRED token must still fail."""
    try:
        from backend.auth.jwt_rotation import decode_token_multikey
    except ImportError:
        from auth.jwt_rotation import decode_token_multikey
    monkeypatch.setenv('JWT_SECRET_KEY_OLD', OLD)
    app = _App(NEW)
    expired = pyjwt.encode({'sub': 'x', 'iat': 1, 'exp': 1}, NEW, algorithm='HS256')
    try:
        decode_token_multikey(expired, pyjwt, app)
        assert False, 'expired token should raise'
    except pyjwt.ExpiredSignatureError:
        pass


def test_library_loader_picks_key_by_iat(monkeypatch):
    """The @jwt_required path: iat < JWT_ROTATION_AT -> old key, else current."""
    try:
        from backend.auth.jwt_rotation import install_key_rotation
    except ImportError:
        from auth.jwt_rotation import install_key_rotation
    from flask import Flask
    from flask_jwt_extended import JWTManager, decode_token, create_access_token

    rotation_at = int(time.time())
    monkeypatch.setenv('JWT_SECRET_KEY_OLD', OLD)
    monkeypatch.setenv('JWT_ROTATION_AT', str(rotation_at))

    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = NEW
    jwt_mgr = JWTManager(app)
    install_key_rotation(jwt_mgr, app)

    old_tok = _mint(OLD, rotation_at - 100)   # issued before cutover
    with app.app_context():
        # old token (iat before cutover) verifies against the old key via loader
        assert decode_token(old_tok)['sub'] == '784000000000320'
        # a freshly minted token (iat after cutover, signed with NEW) verifies too
        new_tok = create_access_token(identity='784000000000320')
        assert decode_token(new_tok)['sub'] == '784000000000320'
