"""
Streaming ASR — FastAPI WebSocket handler for real-time audio processing.

Receives 16kHz 16-bit PCM chunks over WebSocket, accumulates them in a ring
buffer, and triggers transcription at speech boundaries detected by the VAD.

Protocol (JSON frames between client ↔ server):
  Client → Server:
    Binary frame: raw PCM bytes (16-bit signed LE, 16 kHz mono)
    Text frame:   {"type": "config", "keywords": [...], "job_title": "...",
                   "competencies": [...]}
    Text frame:   {"type": "end"}

  Server → Client:
    {"type": "transcript", "text": "...", "speaker": "Interviewer",
     "timestamp": 1710... , "is_final": true}
    {"type": "insight",    ...insight fields...}
    {"type": "status",     "message": "..."}
    {"type": "error",      "message": "..."}
"""

import json
import time
import struct
import asyncio
import logging
from typing import Optional

import numpy as np
from fastapi import WebSocket, WebSocketDisconnect

from .granite_engine import GraniteASREngine, DEFAULT_KEYWORDS
from .memory_manager import MemoryManager
from .speaker_diarization import SpeakerDiarizer, VoiceActivityDetector
from .interview_insight_layer import InterviewInsightLayer

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SAMPLE_RATE = 16_000
BYTES_PER_SAMPLE = 2  # 16-bit PCM


class StreamingASRHandler:
    """
    Manages WebSocket sessions for real-time speech-to-text.

    One handler instance is shared across all connections.
    Per-connection state is tracked in MemoryManager.
    """

    def __init__(
        self,
        engine: GraniteASREngine,
        memory_manager: MemoryManager,
        insight_layer: InterviewInsightLayer,
    ):
        self.engine = engine
        self.memory = memory_manager
        self.insights = insight_layer

        # Per-connection diarizers and VADs (keyed by session_id)
        self._diarizers: dict[str, SpeakerDiarizer] = {}
        self._vads: dict[str, VoiceActivityDetector] = {}

    async def handle_connection(
        self,
        websocket: WebSocket,
        session_id: str,
    ) -> None:
        """
        Main WebSocket handler. Runs for the lifetime of a single connection.
        """
        await websocket.accept()
        logger.info("WebSocket connected: session=%s", session_id)

        # Initialize per-session state
        session = self.memory.create_session(session_id, keywords=list(DEFAULT_KEYWORDS))
        diarizer = SpeakerDiarizer()
        vad = VoiceActivityDetector()
        self._diarizers[session_id] = diarizer
        self._vads[session_id] = vad

        await self._send_json(websocket, {
            "type": "status",
            "message": "Connected. Streaming ASR ready.",
            "session_id": session_id,
        })

        try:
            await self._receive_loop(websocket, session_id, diarizer, vad)
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected: session=%s", session_id)
        except Exception as e:
            logger.error("WebSocket error (session=%s): %s", session_id, e)
            await self._send_json(websocket, {
                "type": "error",
                "message": f"Server error: {str(e)}",
            })
        finally:
            await self._cleanup_session(websocket, session_id)

    async def _receive_loop(
        self,
        websocket: WebSocket,
        session_id: str,
        diarizer: SpeakerDiarizer,
        vad: VoiceActivityDetector,
    ) -> None:
        """Main receive loop — handles binary (audio) and text (config) frames."""
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                # Binary frame — raw PCM audio
                await self._process_audio_chunk(
                    websocket, session_id, message["bytes"], diarizer, vad
                )

            elif "text" in message and message["text"]:
                # Text frame — JSON control message
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    await self._send_json(websocket, {
                        "type": "error",
                        "message": "Invalid JSON",
                    })
                    continue

                msg_type = data.get("type", "")

                if msg_type == "config":
                    await self._handle_config(websocket, session_id, data)
                elif msg_type == "end":
                    # Client requested end — flush remaining audio
                    await self._flush_remaining(websocket, session_id, diarizer)
                    break
                else:
                    await self._send_json(websocket, {
                        "type": "error",
                        "message": f"Unknown message type: {msg_type}",
                    })

    async def _process_audio_chunk(
        self,
        websocket: WebSocket,
        session_id: str,
        pcm_bytes: bytes,
        diarizer: SpeakerDiarizer,
        vad: VoiceActivityDetector,
    ) -> None:
        """Convert PCM bytes → float32 numpy, feed VAD + diarizer, trigger ASR."""
        # Convert 16-bit signed little-endian PCM to float32
        try:
            pcm_array = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32)
            pcm_array /= 32768.0  # Normalize to [-1, 1]
        except Exception as e:
            logger.warning("Bad audio chunk (session=%s): %s", session_id, e)
            return

        if len(pcm_array) == 0:
            return

        # Feed into memory buffer
        self.memory.push_audio(session_id, pcm_array)

        # Update diarizer
        speaker = diarizer.process_chunk(pcm_array)

        # Check VAD for speech boundaries
        event = vad.process(pcm_array)

        if event in ("speech_end", "force_flush"):
            # Drain the buffer and transcribe
            await self._transcribe_segment(
                websocket, session_id, diarizer, is_final=(event == "speech_end")
            )

    async def _transcribe_segment(
        self,
        websocket: WebSocket,
        session_id: str,
        diarizer: SpeakerDiarizer,
        is_final: bool = True,
    ) -> None:
        """Drain buffered audio, run Granite ASR, send results."""
        audio = self.memory.drain_buffer(session_id)
        if audio is None or len(audio) < SAMPLE_RATE * 0.3:
            # Less than 300ms — skip
            return

        session = self.memory.get_session(session_id)
        keywords = session.keywords if session else []
        speaker_label = diarizer.get_speaker_label()

        timestamp = time.time()

        # Run transcription in thread pool to avoid blocking the event loop
        import torch

        audio_tensor = torch.from_numpy(audio).float()

        loop = asyncio.get_event_loop()

        try:
            # Pass 1: Transcribe
            transcript = await loop.run_in_executor(
                None,
                lambda: self.engine.transcribe(
                    audio_tensor, SAMPLE_RATE, keywords
                ),
            )
        except Exception as e:
            logger.error("Transcription failed (session=%s): %s", session_id, e)
            await self._send_json(websocket, {
                "type": "error",
                "message": f"Transcription error: {str(e)}",
            })
            return

        if not transcript or not transcript.strip():
            return

        # Send transcript frame
        await self._send_json(websocket, {
            "type": "transcript",
            "text": transcript,
            "speaker": speaker_label,
            "speaker_id": diarizer._current_speaker,
            "timestamp": timestamp,
            "is_final": is_final,
            "audio_duration_s": round(len(audio) / SAMPLE_RATE, 2),
        })

        # Store in session transcript
        self.memory.add_transcript_segment(
            session_id, transcript, speaker_label, timestamp
        )

        # Run insight analysis (lightweight, can run inline)
        try:
            insight = self.insights.analyze_segment(
                session_id, transcript, speaker_label, timestamp
            )
            await self._send_json(websocket, {
                "type": "insight",
                **insight,
            })
        except Exception as e:
            logger.warning("Insight analysis failed: %s", e)

    async def _flush_remaining(
        self,
        websocket: WebSocket,
        session_id: str,
        diarizer: SpeakerDiarizer,
    ) -> None:
        """Flush any remaining audio in the buffer at end of session."""
        await self._transcribe_segment(websocket, session_id, diarizer, is_final=True)

        # Send session summary
        summary = self.insights.get_session_summary(session_id)
        await self._send_json(websocket, {
            "type": "session_summary",
            **summary,
        })

        # Send session close confirmation
        session_summary = self.memory.close_session(session_id)
        await self._send_json(websocket, {
            "type": "session_closed",
            "total_segments": session_summary.get("total_segments", 0) if session_summary else 0,
            "duration_seconds": session_summary.get("duration_seconds", 0) if session_summary else 0,
        })

    async def _handle_config(
        self,
        websocket: WebSocket,
        session_id: str,
        data: dict,
    ) -> None:
        """Handle runtime configuration updates (e.g., keyword list changes)."""
        session = self.memory.get_session(session_id)
        if not session:
            return

        if "keywords" in data:
            session.keywords = data["keywords"]
            logger.info("Updated keywords for session %s: %d items", session_id, len(session.keywords))

        if "job_title" in data:
            session.job_title = data["job_title"]

        if "competencies" in data:
            session.competencies = data["competencies"]

        await self._send_json(websocket, {
            "type": "status",
            "message": "Configuration updated",
        })

    async def _cleanup_session(
        self,
        websocket: WebSocket,
        session_id: str,
    ) -> None:
        """Clean up per-connection resources."""
        self._diarizers.pop(session_id, None)
        self._vads.pop(session_id, None)
        self.insights.clear_session(session_id)

        # Close session in memory manager if still open
        if self.memory.get_session(session_id):
            self.memory.close_session(session_id)

        logger.info("Session cleanup complete: %s", session_id)

    @staticmethod
    async def _send_json(websocket: WebSocket, data: dict) -> None:
        """Send a JSON text frame, handling closed connections gracefully."""
        try:
            await websocket.send_json(data)
        except Exception:
            pass  # Connection already closed
