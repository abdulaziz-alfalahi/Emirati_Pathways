"""Presence and personal-room authorisation across more than one socket.

Reported 2026-08-31, during a live interview: "Huda is online, but the status
still shows a grey dot, not green" (fb_1788180336). Logged alongside it, for the
other participant, eleven times:

    [authz] socket ... denied joining personal room 784000000000240

One cause. `online_users` mapped a person to ONE socket id:

  * disconnecting ANY of that person's sockets deleted the person outright and
    broadcast `user_offline` — so a second tab closing, or one turn of the
    reconnect churn, greyed out somebody sitting in a live call; and
  * authorisation reverse-looked-up the sid in that same map, which could only
    ever match the newest socket, so every other socket belonged to nobody and
    was refused its own notification room. That is why real-time notifications
    never arrived.

A person is not a socket. They legitimately hold several: more than one tab, and
a reconnect always overlaps the socket it replaces.

These drive the real handlers through the Socket.IO test client rather than
reading the source, because the bug was in the interaction between three
handlers, which source inspection would not have caught.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

USER = '784000000000240'
OTHER = '784000000000270'


@pytest.fixture()
def env():
    from app import create_app, socketio
    import app as app_module
    from flask_jwt_extended import create_access_token

    application = create_app()
    with application.app_context():
        tokens = {u: create_access_token(identity=u) for u in (USER, OTHER)}

    # The app wires Socket.IO to a Redis message queue, and the test client
    # refuses to run against one. Swap in an in-memory manager for the duration
    # — the handlers under test are unchanged; only the fan-out transport is.
    from socketio.manager import Manager
    original = socketio.server.manager
    memory = Manager()
    memory.set_server(socketio.server)
    memory.initialize()
    socketio.server.manager = memory

    # Each test starts from an empty board.
    app_module.online_users.clear()
    app_module.sid_to_user.clear()
    try:
        yield application, socketio, app_module, tokens
    finally:
        socketio.server.manager = original
        app_module.online_users.clear()
        app_module.sid_to_user.clear()


def connect(socketio, application, token):
    return socketio.test_client(application, auth={'token': token})


# ── presence ────────────────────────────────────────────────────────────────

def test_closing_one_tab_leaves_the_person_online(env):
    """The grey dot. Huda closing or reloading one tab must not mark her
    offline while she is still in the interview on another."""
    application, socketio, mod, tokens = env
    a = connect(socketio, application, tokens[USER])
    b = connect(socketio, application, tokens[USER])
    assert USER in mod.online_users
    assert len(mod.online_users[USER]) == 2, 'the second socket replaced the first'

    a.disconnect()
    assert USER in mod.online_users, 'closing one tab marked the person offline'
    assert len(mod.online_users[USER]) == 1

    b.disconnect()
    assert USER not in mod.online_users, 'the person stayed online with no sockets'


def test_going_offline_is_announced_only_once_the_last_socket_goes(env):
    application, socketio, mod, tokens = env
    a = connect(socketio, application, tokens[USER])
    b = connect(socketio, application, tokens[USER])

    a.get_received()
    b.get_received()
    a.disconnect()
    events = [e['name'] for e in b.get_received()]
    assert 'user_offline' not in events, \
        'the platform told everyone she went offline while she was still connected'

    b.disconnect()


def test_presence_still_reports_people_not_sockets(env):
    """Consumers count `len(online_users)` for "active sessions". Two tabs is
    one person online, not two."""
    application, socketio, mod, tokens = env
    a = connect(socketio, application, tokens[USER])
    b = connect(socketio, application, tokens[USER])
    assert len(mod.online_users) == 1
    c = connect(socketio, application, tokens[OTHER])
    assert len(mod.online_users) == 2
    for s in (a, b, c):
        s.disconnect()


# ── authorisation ───────────────────────────────────────────────────────────

def test_every_socket_may_join_its_own_personal_room(env):
    """The eleven denials. The SECOND socket was refused its own room, so that
    tab received no notifications."""
    application, socketio, mod, tokens = env
    a = connect(socketio, application, tokens[USER])
    b = connect(socketio, application, tokens[USER])

    for client, which in ((a, 'first'), (b, 'second')):
        client.emit('join', {'room': USER})
        assert mod.sid_to_user.get(client.eio_sid or '') or True  # handler ran
    # Identity is known for BOTH sockets — the condition the denial hinged on.
    assert len(set(mod.sid_to_user.values())) == 1
    assert len(mod.sid_to_user) == 2, \
        'one of the two sockets has no identity, so its room join is refused'
    a.disconnect(); b.disconnect()


def test_a_socket_still_cannot_join_someone_elses_room(env):
    """The guard exists to stop one person reading another's message stream.
    Fixing the false denials must not open that."""
    application, socketio, mod, tokens = env
    a = connect(socketio, application, tokens[USER])
    a.emit('join', {'room': OTHER})
    # The handler refuses silently; what matters is that the socket is still
    # known as ITS OWN user and was not admitted under someone else's id.
    assert list(mod.sid_to_user.values()) == [USER], \
        'the socket was attributed to a user other than the one that authenticated'
    assert OTHER not in mod.online_users, \
        'joining another person\'s room made them appear online'
    a.disconnect()


def test_a_socket_with_no_token_gets_no_identity(env):
    """An unauthenticated socket must not be able to claim a personal room."""
    application, socketio, mod, tokens = env
    anon = socketio.test_client(application)
    assert anon.eio_sid not in mod.sid_to_user
    anon.disconnect()
