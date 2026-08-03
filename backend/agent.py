"""LiveKit interview transcription agent.

Joins interview rooms as a silent participant, streams EACH participant's
audio track to the on-prem STT server (faster-whisper behind an
OpenAI-compatible /v1/audio/transcriptions endpoint), and persists labelled
transcript segments to interview_transcripts (migration 043).

Per-track transcription gives perfect speaker attribution — no diarization
model needed: LiveKit hands us one audio track per participant, and the
participant identity is the JWT-verified user id.

Audio never leaves the datacenter: STT_BASE_URL points at the local CPU
container on APPQA today and flips to the GPUAAS node (faster-whisper
large-v3) by changing one env var once the firewall opens.

Run:  python agent.py dev|start   (needs LIVEKIT_URL/API key envs; see
deployment/run-agent-appqa.sh)

The previous version of this file was a stub that never routed audio frames
— it logged "started listening" and transcribed nothing.
"""

import asyncio
import json
import logging
import os

from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents import stt as agents_stt
from livekit.plugins import openai as lk_openai
from livekit.plugins import silero

logger = logging.getLogger("interview-transcriber")
logger.setLevel(logging.INFO)

STT_BASE_URL = os.getenv("STT_BASE_URL",
                         os.getenv("GRANITE_SPEECH_URL", "http://127.0.0.1:8001/v1"))
STT_MODEL = os.getenv("STT_MODEL", "Systran/faster-whisper-small")
DATABASE_URL = os.getenv("DATABASE_URL")

_vad = None


def _get_vad():
    global _vad
    if _vad is None:
        _vad = silero.VAD.load()
    return _vad


def _save_segment(room_name: str, identity: str, name: str, text: str, language: str = None):
    """Persist one labelled segment. Direct DB write — the agent runs beside
    the backend with the same .env; best-effort, never kills the stream."""
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


async def _transcribe_track(ctx: JobContext, participant: rtc.RemoteParticipant,
                            track: rtc.Track):
    """Route one participant's audio frames through VAD-chunked STT and
    persist every final segment."""
    identity = participant.identity or "unknown"
    name = participant.name or identity
    logger.info(f"[{ctx.room.name}] transcribing track {track.sid} ({identity})")

    # faster-whisper is request/response, not streaming — StreamAdapter uses
    # VAD to cut speech into utterances and transcribes each one.
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
                    logger.info(f"[{ctx.room.name}] {identity}: {alt.text}")
                    _save_segment(ctx.room.name, identity, name, alt.text,
                                  getattr(alt, 'language', None))
                    # Live captions for anyone in the room who subscribes.
                    try:
                        await ctx.room.local_participant.publish_data(
                            payload=json.dumps({
                                'type': 'transcript_segment',
                                'identity': identity,
                                'name': name,
                                'text': alt.text,
                            }).encode('utf-8'),
                            topic='transcription')
                    except Exception:
                        pass
    finally:
        push_task.cancel()
        await stt_stream.aclose()
        logger.info(f"[{ctx.room.name}] track {track.sid} finished")


async def entrypoint(ctx: JobContext):
    logger.info(f"joining room {ctx.room.name} (STT: {STT_BASE_URL} / {STT_MODEL})")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication,
                            participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(_transcribe_track(ctx, participant, track))

    # Tracks published before the agent joined:
    for participant in ctx.room.remote_participants.values():
        for publication in participant.track_publications.values():
            if publication.track and publication.track.kind == rtc.TrackKind.KIND_AUDIO:
                asyncio.create_task(
                    _transcribe_track(ctx, participant, publication.track))


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
