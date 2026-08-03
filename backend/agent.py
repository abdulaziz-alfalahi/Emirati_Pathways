"""LiveKit interview transcription agent — direct-join mode.

Transcribes interview rooms fully on-prem: each participant's audio track is
streamed through silero VAD to the faster-whisper STT server (OpenAI-
compatible /v1/audio/transcriptions), and every final utterance is persisted
as a labelled segment in interview_transcripts (migration 043). Per-track
transcription gives perfect speaker attribution — the participant identity
is the JWT-verified user id.

Why direct-join: the OSS livekit-server on staging (1.13.x) answers 501 on
the agents dispatch endpoint (/agent), so instead of the worker protocol the
agent runs a tiny internal HTTP service; the backend POSTs {room} to
/join when an interview session starts, and the agent connects to that room
as a hidden participant. It leaves when the room empties.

Run: python agent.py   (see deployment/run-agent-appqa.sh; env: LIVEKIT_URL,
LIVEKIT_API_KEY/SECRET or LIVEKIT_KEYS, STT_BASE_URL, STT_MODEL, DB_*)
"""

import asyncio
import json
import logging
import os

from aiohttp import web
from livekit import api as lk_api
from livekit import rtc
from livekit.agents import stt as agents_stt
from livekit.plugins import openai as lk_openai
from livekit.plugins import silero

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("interview-transcriber")

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://livekit-server:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")
STT_BASE_URL = os.getenv("STT_BASE_URL",
                         os.getenv("GRANITE_SPEECH_URL", "http://127.0.0.1:8001/v1"))
STT_MODEL = os.getenv("STT_MODEL", "Systran/faster-whisper-small")
EMPTY_ROOM_LINGER_S = int(os.getenv("EMPTY_ROOM_LINGER_S", "60"))

# Same DATABASE_URL composition as backend/app.py — the shared .env carries
# DB_* parts, not a URL.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    import urllib.parse
    DATABASE_URL = (
        f"postgresql://{urllib.parse.quote_plus(os.getenv('DB_USER', ''))}:"
        f"{urllib.parse.quote_plus(os.getenv('DB_PASSWORD', ''))}@"
        f"{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/"
        f"{os.getenv('DB_NAME', '')}")

_active_rooms: dict[str, asyncio.Task] = {}
_vad = None


def _get_vad():
    global _vad
    if _vad is None:
        _vad = silero.VAD.load()
    return _vad


def _save_segment(room_name: str, identity: str, name: str, text: str, language: str = None):
    """Persist one labelled segment — best-effort, never kills the stream."""
    if not text or not text.strip():
        return
    try:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO interview_transcripts
                       (room_name, participant_identity, participant_name, text, language)
                   VALUES (%s, %s, %s, %s, %s)""",
                (room_name, identity, name, text.strip(), language))
        conn.commit()
        conn.close()
    except Exception as e:  # pragma: no cover
        logger.warning(f"segment save failed: {e}")


async def _transcribe_track(room: rtc.Room, room_name: str,
                            participant: rtc.RemoteParticipant, track: rtc.Track):
    """Route one participant's audio frames through VAD-chunked STT and
    persist every final segment."""
    identity = participant.identity or "unknown"
    name = participant.name or identity
    logger.info(f"[{room_name}] transcribing {track.sid} ({identity})")

    # faster-whisper is request/response — StreamAdapter VAD-chunks utterances.
    stt_impl = agents_stt.StreamAdapter(
        stt=lk_openai.STT(model=STT_MODEL, base_url=STT_BASE_URL,
                          api_key=os.getenv("STT_API_KEY", "local-gpu-key")),
        vad=_get_vad(),
    )
    stt_stream = stt_impl.stream()
    audio_stream = rtc.AudioStream(track)

    async def _push_frames():
        async for ev in audio_stream:
            stt_stream.push_frame(ev.frame)
        stt_stream.end_input()

    push_task = asyncio.create_task(_push_frames())
    try:
        async for ev in stt_stream:
            if ev.type == agents_stt.SpeechEventType.FINAL_TRANSCRIPT:
                alt = ev.alternatives[0] if ev.alternatives else None
                if alt and alt.text.strip():
                    logger.info(f"[{room_name}] {identity}: {alt.text}")
                    _save_segment(room_name, identity, name, alt.text,
                                  getattr(alt, 'language', None))
                    try:  # live captions for room subscribers
                        await room.local_participant.publish_data(
                            payload=json.dumps({
                                'type': 'transcript_segment',
                                'identity': identity, 'name': name,
                                'text': alt.text,
                            }).encode('utf-8'),
                            topic='transcription')
                    except Exception:
                        pass
    finally:
        push_task.cancel()
        await stt_stream.aclose()
        logger.info(f"[{room_name}] {track.sid} finished")


async def _run_room(room_name: str):
    """Join one room as a hidden participant, transcribe until it empties."""
    token = (lk_api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
             .with_identity("transcription-agent")
             .with_name("Transcription")
             .with_grants(lk_api.VideoGrants(room_join=True, room=room_name,
                                             can_publish=False, can_subscribe=True,
                                             can_publish_data=True, hidden=True))
             .to_jwt())
    room = rtc.Room()
    empty_since = {'t': None}

    @room.on("track_subscribed")
    def on_track(track: rtc.Track, publication, participant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(_transcribe_track(room, room_name, participant, track))

    try:
        await room.connect(LIVEKIT_URL, token,
                           options=rtc.RoomOptions(auto_subscribe=True))
        logger.info(f"joined room {room_name} (STT: {STT_BASE_URL} / {STT_MODEL})")

        loop = asyncio.get_event_loop()
        while True:
            await asyncio.sleep(5)
            if len(room.remote_participants) == 0:
                if empty_since['t'] is None:
                    empty_since['t'] = loop.time()
                elif loop.time() - empty_since['t'] > EMPTY_ROOM_LINGER_S:
                    logger.info(f"room {room_name} empty — leaving")
                    break
            else:
                empty_since['t'] = None
    except Exception as e:
        logger.error(f"room {room_name} failed: {e}")
    finally:
        try:
            await room.disconnect()
        except Exception:
            pass
        _active_rooms.pop(room_name, None)


async def handle_join(request: web.Request):
    """POST /join {room} — called by the backend when an interview starts."""
    try:
        data = await request.json()
    except Exception:
        data = {}
    room_name = str(data.get('room') or '').strip()
    if not room_name:
        return web.json_response({'success': False, 'message': 'room is required'}, status=400)
    if room_name in _active_rooms and not _active_rooms[room_name].done():
        return web.json_response({'success': True, 'message': 'already transcribing'})
    _active_rooms[room_name] = asyncio.create_task(_run_room(room_name))
    return web.json_response({'success': True, 'message': f'joining {room_name}'})


async def handle_health(request: web.Request):
    return web.json_response({'status': 'ok',
                              'active_rooms': [r for r, t in _active_rooms.items() if not t.done()],
                              'stt': STT_BASE_URL, 'model': STT_MODEL})


def main():
    app = web.Application()
    app.router.add_post('/join', handle_join)
    app.router.add_get('/health', handle_health)
    logger.info(f"transcription agent listening on :8080 (LiveKit: {LIVEKIT_URL})")
    web.run_app(app, host='0.0.0.0', port=8080, print=None)


if __name__ == "__main__":
    main()
