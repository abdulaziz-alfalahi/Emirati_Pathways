"""
Granite Speech Server — FastAPI application entry point.

Run:
    uvicorn backend.speech.server:app --host 0.0.0.0 --port 8001 --workers 1

A single-worker process is required because the Granite model
is loaded into GPU memory at startup and shared across requests.
"""

import os
import logging
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .granite_engine import GraniteASREngine, DEFAULT_KEYWORDS
from .memory_manager import MemoryManager
from .streaming_asr import StreamingASRHandler
from .interview_insight_layer import InterviewInsightLayer

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()

LOG_LEVEL = os.getenv("SPEECH_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = os.getenv(
    "SPEECH_CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:5000",
).split(",")

# GPU / Model config
DEVICE = os.getenv("SPEECH_DEVICE", None)  # None = auto-detect
MAX_SESSIONS = int(os.getenv("SPEECH_MAX_SESSIONS", "50"))
BUFFER_SECONDS = int(os.getenv("SPEECH_BUFFER_SECONDS", "30"))

# ---------------------------------------------------------------------------
# Shared instances (initialized at startup)
# ---------------------------------------------------------------------------
engine: Optional[GraniteASREngine] = None
memory: Optional[MemoryManager] = None
insights: Optional[InterviewInsightLayer] = None
handler: Optional[StreamingASRHandler] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model at startup, release at shutdown."""
    global engine, memory, insights, handler

    logger.info("=== Granite Speech Server starting ===")

    # Initialize components
    engine = GraniteASREngine(device=DEVICE)
    engine.load_model()

    memory = MemoryManager(
        buffer_seconds=BUFFER_SECONDS,
        max_sessions=MAX_SESSIONS,
    )

    insights = InterviewInsightLayer()
    handler = StreamingASRHandler(engine, memory, insights)

    # Background task: periodic session cleanup
    cleanup_task = asyncio.create_task(_cleanup_loop())

    logger.info("=== Granite Speech Server ready ===")
    yield

    # Shutdown
    cleanup_task.cancel()
    engine.unload_model()
    logger.info("=== Granite Speech Server stopped ===")


async def _cleanup_loop():
    """Periodically clean up expired sessions."""
    while True:
        await asyncio.sleep(60)
        if memory:
            expired = memory.cleanup_expired()
            if expired:
                for sid in expired:
                    if insights:
                        insights.clear_session(sid)


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Granite Speech Server",
    description="Real-time Interview Analysis powered by IBM Granite 4.0 1B Speech",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Health check with model and memory status."""
    return {
        "status": "ok",
        "engine": engine.get_status() if engine else {"loaded": False},
        "memory": memory.get_stats() if memory else {},
    }


@app.get("/config")
async def get_config():
    """Return server configuration."""
    return {
        "model_id": GraniteASREngine.MODEL_ID,
        "sample_rate": 16_000,
        "audio_format": "pcm_s16le",
        "max_sessions": MAX_SESSIONS,
        "buffer_seconds": BUFFER_SECONDS,
        "default_keywords": DEFAULT_KEYWORDS,
        "websocket_endpoint": "/ws/transcribe/{session_id}",
    }


class KeywordsUpdate(BaseModel):
    keywords: List[str]
    job_title: Optional[str] = None
    competencies: Optional[List[str]] = None


@app.post("/sessions/{session_id}/keywords")
async def update_session_keywords(session_id: str, body: KeywordsUpdate):
    """Update keyword biasing list for an active session."""
    if not memory:
        raise HTTPException(status_code=503, detail="Server not ready")

    session = memory.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.keywords = body.keywords
    if body.job_title:
        session.job_title = body.job_title
    if body.competencies:
        session.competencies = body.competencies

    return {
        "status": "ok",
        "session_id": session_id,
        "keywords_count": len(session.keywords),
    }


@app.get("/sessions/{session_id}/transcript")
async def get_session_transcript(session_id: str):
    """Get the full transcript for a session."""
    if not memory:
        raise HTTPException(status_code=503, detail="Server not ready")

    transcript = memory.get_full_transcript(session_id)
    if not transcript and not memory.get_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "segments": transcript,
        "total_segments": len(transcript),
    }


@app.get("/sessions/{session_id}/insights")
async def get_session_insights(session_id: str):
    """Get the insight summary for a session."""
    if not insights:
        raise HTTPException(status_code=503, detail="Server not ready")

    summary = insights.get_session_summary(session_id)
    return {
        "session_id": session_id,
        **summary,
    }


# ---------------------------------------------------------------------------
# WebSocket Endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/transcribe/{session_id}")
async def websocket_transcribe(websocket: WebSocket, session_id: str):
    """
    Real-time streaming ASR via WebSocket.

    Client sends binary frames of 16kHz 16-bit PCM audio.
    Server responds with JSON text frames containing transcripts and insights.

    See streaming_asr.py for full protocol documentation.
    """
    if not handler:
        await websocket.close(code=1013, reason="Server not ready")
        return

    await handler.handle_connection(websocket, session_id)
