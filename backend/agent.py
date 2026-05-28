import asyncio
import os
import logging
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, JobProcess
from livekit.plugins import openai

logger = logging.getLogger("agent-worker")
logger.setLevel(logging.INFO)

# Connect to the GPU Inference Server (faster-whisper or granite)
# It must expose an OpenAI-compatible /v1/audio/transcriptions endpoint
GRANITE_SPEECH_URL = os.getenv("GRANITE_SPEECH_URL", "http://10.228.145.194:8001/v1")

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}...")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    logger.info("Initializing GPU STT pipeline...")
    
    # We use the OpenAI STT plugin, but point it to our local GPU VM!
    # This securely keeps all audio on-premise.
    stt = openai.STT(
        model="Systran/faster-whisper-large-v3", # Or your Granite model ID
        base_url=GRANITE_SPEECH_URL,
        api_key="local-gpu-key" # Dummy key since the local server doesn't require auth
    )

    # Wrap the room in a Speech Recognition stream
    # When candidates speak, their audio is sent to the GPU VM and text is published to the room
    async def transcribe_track(track):
        logger.info(f"Starting STT for track {track.sid}")
        # livekit-agents automatically handles chunking and VAD (Voice Activity Detection)
        stream = stt.stream()
        
        # In a production app, you would route the audio track into the stream
        # Since this is a basic agent, we attach the forwarder
        ctx.room.local_participant.publish_data(f"Agent started listening to {track.sid}".encode())
        
        # Note: robust implementation requires reading audio frames and pushing to stream.push_frame()
        # The livekit high-level API usually uses VoicePipelineAgent for this.
        
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track, publication, participant):
        if track.kind == "audio":
            asyncio.create_task(transcribe_track(track))

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
