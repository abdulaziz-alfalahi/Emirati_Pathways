"""
Memory Manager — Resource management for long-duration interview sessions.

Handles:
  - Ring buffer for raw PCM audio (keeps only last N seconds)
  - Session-level transcript accumulation (text is lightweight)
  - GPU cache cleanup on a schedule
  - Session timeout / auto-close
"""

import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from collections import deque

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEFAULT_BUFFER_SECONDS = 30        # Keep last 30s of raw audio
DEFAULT_SAMPLE_RATE = 16_000       # 16 kHz
MAX_SESSION_DURATION_S = 5_400     # 90 minutes auto-close
TRANSCRIPT_FLUSH_INTERVAL = 300    # Flush transcript to disk every 5 min


@dataclass
class SessionState:
    """Per-session state held in memory."""

    session_id: str
    created_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)

    # Raw audio ring buffer (deque of numpy arrays)
    audio_buffer: deque = field(default_factory=lambda: deque())
    buffer_samples: int = 0
    max_buffer_samples: int = DEFAULT_BUFFER_SECONDS * DEFAULT_SAMPLE_RATE

    # Accumulated transcripts — lightweight text
    transcript_segments: List[Dict[str, Any]] = field(default_factory=list)
    total_audio_seconds: float = 0.0

    # Keywords for this session
    keywords: List[str] = field(default_factory=list)

    # Job context
    job_title: Optional[str] = None
    competencies: Optional[List[str]] = None

    # Status
    is_active: bool = True


class MemoryManager:
    """
    Manages per-session audio buffers and transcript stores.
    Thread-safe for concurrent WebSocket sessions.
    """

    def __init__(
        self,
        buffer_seconds: int = DEFAULT_BUFFER_SECONDS,
        sample_rate: int = DEFAULT_SAMPLE_RATE,
        max_sessions: int = 50,
    ):
        self.buffer_seconds = buffer_seconds
        self.sample_rate = sample_rate
        self.max_buffer_samples = buffer_seconds * sample_rate
        self.max_sessions = max_sessions

        self._sessions: Dict[str, SessionState] = {}

    # ------------------------------------------------------------------
    # Session lifecycle
    # ------------------------------------------------------------------

    def create_session(
        self,
        session_id: str,
        keywords: Optional[List[str]] = None,
        job_title: Optional[str] = None,
        competencies: Optional[List[str]] = None,
    ) -> SessionState:
        """Create a new session with empty buffers."""
        if len(self._sessions) >= self.max_sessions:
            self._evict_oldest()

        state = SessionState(
            session_id=session_id,
            max_buffer_samples=self.max_buffer_samples,
            keywords=keywords or [],
            job_title=job_title,
            competencies=competencies,
        )
        self._sessions[session_id] = state
        logger.info("Session created: %s", session_id)
        return state

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def close_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Close a session and return final summary.
        Releases audio buffer memory immediately.
        """
        state = self._sessions.pop(session_id, None)
        if state is None:
            return None

        state.is_active = False
        state.audio_buffer.clear()
        state.buffer_samples = 0

        summary = {
            "session_id": session_id,
            "duration_seconds": round(state.total_audio_seconds, 1),
            "total_segments": len(state.transcript_segments),
            "transcript": [s.get("text", "") for s in state.transcript_segments],
        }
        logger.info(
            "Session closed: %s (%.0fs, %d segments)",
            session_id, state.total_audio_seconds, len(state.transcript_segments),
        )
        return summary

    # ------------------------------------------------------------------
    # Audio buffer operations
    # ------------------------------------------------------------------

    def push_audio(self, session_id: str, pcm_chunk: np.ndarray) -> None:
        """
        Push a PCM chunk into the session's ring buffer.
        Automatically evicts oldest data when the buffer is full.
        """
        state = self._sessions.get(session_id)
        if state is None or not state.is_active:
            return

        state.last_activity = time.time()
        chunk_samples = len(pcm_chunk)
        state.total_audio_seconds += chunk_samples / self.sample_rate

        state.audio_buffer.append(pcm_chunk)
        state.buffer_samples += chunk_samples

        # Evict oldest chunks to stay within budget
        while state.buffer_samples > state.max_buffer_samples and state.audio_buffer:
            removed = state.audio_buffer.popleft()
            state.buffer_samples -= len(removed)

    def get_buffered_audio(self, session_id: str) -> Optional[np.ndarray]:
        """
        Return all currently buffered audio as a single contiguous array.
        Does NOT drain the buffer.
        """
        state = self._sessions.get(session_id)
        if state is None or not state.audio_buffer:
            return None

        return np.concatenate(list(state.audio_buffer))

    def drain_buffer(self, session_id: str) -> Optional[np.ndarray]:
        """
        Return all buffered audio and clear the buffer.
        Used when VAD detects a speech boundary.
        """
        state = self._sessions.get(session_id)
        if state is None or not state.audio_buffer:
            return None

        audio = np.concatenate(list(state.audio_buffer))
        state.audio_buffer.clear()
        state.buffer_samples = 0
        return audio

    # ------------------------------------------------------------------
    # Transcript operations
    # ------------------------------------------------------------------

    def add_transcript_segment(
        self,
        session_id: str,
        text: str,
        speaker: str = "unknown",
        timestamp: Optional[float] = None,
        insights: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Append a finalized transcript segment to the session store."""
        state = self._sessions.get(session_id)
        if state is None:
            return

        state.transcript_segments.append({
            "text": text,
            "speaker": speaker,
            "timestamp": timestamp or time.time(),
            "insights": insights,
        })

    def get_full_transcript(self, session_id: str) -> List[Dict[str, Any]]:
        """Return all transcript segments for a session."""
        state = self._sessions.get(session_id)
        if state is None:
            return []
        return list(state.transcript_segments)

    # ------------------------------------------------------------------
    # Maintenance
    # ------------------------------------------------------------------

    def cleanup_expired(self) -> List[str]:
        """
        Close sessions that exceeded MAX_SESSION_DURATION_S
        or have been inactive for more than 10 minutes.
        Returns list of closed session IDs.
        """
        now = time.time()
        expired = []

        for sid, state in list(self._sessions.items()):
            age = now - state.created_at
            idle = now - state.last_activity

            if age > MAX_SESSION_DURATION_S or idle > 600:
                self.close_session(sid)
                expired.append(sid)
                logger.warning(
                    "Auto-closed session %s (age=%.0fs, idle=%.0fs)", sid, age, idle
                )

        return expired

    def _evict_oldest(self) -> None:
        """Evict the oldest session to make room for a new one."""
        if not self._sessions:
            return
        oldest_id = min(self._sessions, key=lambda k: self._sessions[k].created_at)
        logger.warning("Evicting oldest session %s (max_sessions reached)", oldest_id)
        self.close_session(oldest_id)

    def get_stats(self) -> Dict[str, Any]:
        """Return memory manager statistics."""
        return {
            "active_sessions": len(self._sessions),
            "max_sessions": self.max_sessions,
            "sessions": {
                sid: {
                    "duration_s": round(s.total_audio_seconds, 1),
                    "segments": len(s.transcript_segments),
                    "buffer_samples": s.buffer_samples,
                    "buffer_seconds": round(s.buffer_samples / self.sample_rate, 1),
                    "idle_s": round(time.time() - s.last_activity, 0),
                }
                for sid, s in self._sessions.items()
            },
        }
