"""
LiveKit Agent Worker — Interview ASR & Compliance Agent

This agent:
  1. Joins each interview room as a HIDDEN participant (no audio/video publish)
  2. Triggers a RoomCompositeEgress to auto-record the interview
  3. Subscribes to the candidate's audio track
  4. Feeds PCM frames to IBM Granite 4.0 1B Speech for real-time transcription
  5. Runs competency analysis on each transcript segment
  6. Stores transcripts and AI decision logs in the database
  7. Emits results via LiveKit data channel for live UI updates

Run:
    python -m backend.livekit_interview.agent
"""

import os
import sys
import uuid
import json
import time
import logging
import asyncio
from datetime import datetime
from typing import Optional, List

import numpy as np

# ---------------------------------------------------------------------------
# LiveKit Agents SDK
# ---------------------------------------------------------------------------
from livekit import api as lk_api
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobRequest,
    WorkerOptions,
    cli,
)
from livekit.protocol import egress as egress_proto
from livekit.protocol import models as lk_models

# ---------------------------------------------------------------------------
# Local imports (Granite ASR + Insights)
# ---------------------------------------------------------------------------
# Defer heavy imports for faster agent startup
_granite_engine = None
_insight_layer = None

from .config import get_settings
from .models import (
    InterviewRecording, InterviewTranscript, AIDecisionLog,
    RecordingStatus, AIDecision,
    create_tables, get_session_factory,
)
from .compliance import verify_data_locality

logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
create_tables(settings.database_url)
SessionFactory = get_session_factory(settings.database_url)

# ---------------------------------------------------------------------------
# Granite ASR (lazy init on first job to avoid loading GPU on import)
# ---------------------------------------------------------------------------

def get_granite_engine():
    """Lazy-load the Granite ASR engine (heavy, needs GPU)."""
    global _granite_engine
    if _granite_engine is None:
        from backend.speech.granite_engine import GraniteASREngine
        _granite_engine = GraniteASREngine()
        _granite_engine.load_model()
    return _granite_engine


def get_insight_layer():
    """Lazy-load the insight analysis layer."""
    global _insight_layer
    if _insight_layer is None:
        from backend.speech.interview_insight_layer import InterviewInsightLayer
        _insight_layer = InterviewInsightLayer()
    return _insight_layer


# ---------------------------------------------------------------------------
# Egress Management
# ---------------------------------------------------------------------------

async def start_room_egress(room_name: str, interview_id: str) -> Optional[str]:
    """
    Trigger a RoomCompositeEgress to record the interview to S3.

    Returns the egress_id or None on failure.
    """
    try:
        # Verify data locality before recording
        if not verify_data_locality(settings.s3_endpoint):
            logger.error("Refusing to start Egress — S3 endpoint is not local")
            return None

        lk = lk_api.LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
        )

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        s3_key = f"{interview_id}_{timestamp}.mp4"

        request = egress_proto.RoomCompositeEgressRequest(
            room_name=room_name,
            layout="grid",
            audio_only=False,
            file_outputs=[
                egress_proto.EncodedFileOutput(
                    file_type=egress_proto.EncodedFileType.MP4,
                    filepath=s3_key,
                    s3=egress_proto.S3Upload(
                        access_key=settings.s3_access_key,
                        secret=settings.s3_secret_key,
                        bucket=settings.s3_bucket,
                        region=settings.s3_region,
                        endpoint=settings.s3_endpoint,
                        force_path_style=True,  # MinIO compatibility
                    ),
                ),
            ],
        )

        result = await lk.egress.start_room_composite_egress(request)
        egress_id = result.egress_id

        logger.info(
            "Egress started: egress_id=%s room=%s → s3://%s/%s",
            egress_id, room_name, settings.s3_bucket, s3_key,
        )

        # Store recording metadata in DB
        db = SessionFactory()
        try:
            recording = InterviewRecording(
                interview_id=interview_id,
                room_name=room_name,
                egress_id=egress_id,
                status=RecordingStatus.RECORDING,
                s3_bucket=settings.s3_bucket,
                s3_key=s3_key,
                s3_endpoint=settings.s3_endpoint,
                encrypted=True,
                encryption_method="AES-256-SSE-S3",
                recording_started_at=datetime.utcnow(),
            )
            db.add(recording)
            db.commit()
        finally:
            db.close()

        await lk.aclose()
        return egress_id

    except Exception as e:
        logger.error("Failed to start Egress: %s", e)
        return None


# ---------------------------------------------------------------------------
# Audio Processing Pipeline
# ---------------------------------------------------------------------------

class InterviewASRPipeline:
    """
    Processes raw audio frames from a LiveKit audio track:
      1. Accumulates PCM samples into segments
      2. Runs Granite ASR on each segment
      3. Runs insight analysis
      4. Stores results in DB + emits via data channel
    """

    SEGMENT_DURATION_S = 5.0  # Transcribe every 5 seconds
    SAMPLE_RATE = 16_000

    def __init__(
        self,
        session_id: str,
        interview_id: str,
        recording_id: Optional[str] = None,
    ):
        self.session_id = session_id
        self.interview_id = interview_id
        self.recording_id = recording_id
        self.segment_index = 0
        self.start_time = time.time()

        # Audio buffer
        self._buffer: List[np.ndarray] = []
        self._buffer_samples = 0
        self._segment_threshold = int(self.SEGMENT_DURATION_S * self.SAMPLE_RATE)

        # Lazy-loaded engines
        self._engine = None
        self._insights = None

    def _ensure_engines(self):
        if self._engine is None:
            self._engine = get_granite_engine()
            self._insights = get_insight_layer()

    async def process_frame(self, frame) -> Optional[dict]:
        """
        Feed a raw audio frame from LiveKit.
        Returns a transcript+insight dict when a segment boundary is reached.
        """
        # Convert LiveKit audio frame to numpy float32
        try:
            pcm = np.frombuffer(frame.data, dtype=np.int16).astype(np.float32)
            pcm /= 32768.0
        except Exception:
            return None

        self._buffer.append(pcm)
        self._buffer_samples += len(pcm)

        # Check if we've accumulated enough for a segment
        if self._buffer_samples >= self._segment_threshold:
            return await self._flush_segment()

        return None

    async def _flush_segment(self) -> Optional[dict]:
        """Transcribe accumulated audio and run analysis."""
        if not self._buffer:
            return None

        self._ensure_engines()

        audio = np.concatenate(self._buffer)
        self._buffer.clear()
        self._buffer_samples = 0

        segment_start = time.time() - self.start_time - self.SEGMENT_DURATION_S
        segment_end = time.time() - self.start_time

        # Run ASR in executor to avoid blocking
        import torch
        audio_tensor = torch.from_numpy(audio).float()

        loop = asyncio.get_event_loop()
        try:
            transcript = await loop.run_in_executor(
                None,
                lambda: self._engine.transcribe(
                    audio_tensor,
                    self.SAMPLE_RATE,
                    keywords=[
                        "NAFIS", "Emiratization", "MOHRE", "Tawteen",
                        "ADNOC", "DEWA", "leadership", "teamwork",
                    ],
                ),
            )
        except Exception as e:
            logger.error("ASR failed on segment %d: %s", self.segment_index, e)
            return None

        if not transcript or not transcript.strip():
            return None

        # Run insight analysis
        insight = self._insights.analyze_segment(
            self.session_id, transcript, speaker="unknown", timestamp=segment_end,
        )

        # Store in database
        self._store_transcript(transcript, segment_start, segment_end, insight)

        result = {
            "type": "transcript",
            "segment_index": self.segment_index,
            "text": transcript,
            "start_time_s": round(segment_start, 2),
            "end_time_s": round(segment_end, 2),
            "insight": insight,
        }

        self.segment_index += 1
        return result

    def _store_transcript(
        self, text: str, start_s: float, end_s: float, insight: dict,
    ):
        """Persist transcript segment to the database."""
        db = SessionFactory()
        try:
            # Find recording
            recording = db.query(InterviewRecording).filter_by(
                interview_id=self.interview_id
            ).first()

            if not recording:
                logger.warning("No recording found for interview %s", self.interview_id)
                return

            segment = InterviewTranscript(
                recording_id=recording.id,
                segment_index=self.segment_index,
                text=text,
                speaker="unknown",
                start_time_s=round(start_s, 2),
                end_time_s=round(end_s, 2),
                duration_s=round(end_s - start_s, 2),
                competencies_detected=insight.get("competencies", []),
                sentiment=insight.get("sentiment"),
                confidence_level=insight.get("confidence"),
                is_key_moment=insight.get("is_key_moment", False),
            )
            db.add(segment)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error("Failed to store transcript: %s", e)
        finally:
            db.close()

    async def flush_and_summarize(self) -> Optional[dict]:
        """Flush remaining audio and generate final AI decision."""
        # Flush any remaining buffer
        if self._buffer:
            await self._flush_segment()

        # Generate AI decision
        return self._generate_decision()

    def _generate_decision(self) -> Optional[dict]:
        """
        Generate a Shortlist/Reject/Hold decision based on
        the aggregate insight scores from the full interview.
        """
        if self._insights is None:
            return None

        summary = self._insights.get_session_summary(self.session_id)
        if not summary or summary.get("total_segments", 0) == 0:
            return None

        overall = (
            summary.get("speech_quality", 0) * 0.2
            + summary.get("confidence", 0) * 0.2
            + summary.get("relevance", 0) * 0.3
            + max(0, (summary.get("sentiment_balance", 0) + 1) / 2) * 0.15
            + min(1.0, len(summary.get("competency_profile", {})) / 5) * 0.15
        )

        if overall >= 0.7:
            decision = AIDecision.SHORTLIST
        elif overall >= 0.4:
            decision = AIDecision.HOLD
        else:
            decision = AIDecision.REJECT

        # Store in DB
        db = SessionFactory()
        try:
            recording = db.query(InterviewRecording).filter_by(
                interview_id=self.interview_id,
            ).first()

            if recording:
                log = AIDecisionLog(
                    recording_id=recording.id,
                    decision=decision,
                    overall_score=round(overall, 3),
                    technical_score=summary.get("relevance"),
                    communication_score=summary.get("speech_quality"),
                    confidence_score=summary.get("confidence"),
                    reasoning=(
                        f"Aggregate analysis over {summary['total_segments']} segments. "
                        f"Sentiment balance: {summary.get('sentiment_balance', 0):.2f}. "
                        f"Competencies detected: {list(summary.get('competency_profile', {}).keys())}."
                    ),
                    competency_profile=summary.get("competency_profile"),
                    key_moments=summary.get("key_moments", [])[:10],
                    model_id="ibm-granite/granite-4.0-1b-speech",
                )
                db.add(log)
                db.commit()

                logger.info(
                    "AI Decision for %s: %s (score=%.3f)",
                    self.interview_id, decision.value, overall,
                )
        except Exception as e:
            db.rollback()
            logger.error("Failed to store AI decision: %s", e)
        finally:
            db.close()

        return {
            "type": "ai_decision",
            "decision": decision.value,
            "overall_score": round(overall, 3),
            "competency_profile": summary.get("competency_profile", {}),
            "total_segments": summary.get("total_segments", 0),
        }


# ---------------------------------------------------------------------------
# LiveKit Agent Entrypoint
# ---------------------------------------------------------------------------

class InterviewAgent(Agent):
    """
    LiveKit Agent that joins interview rooms as a hidden observer.
    Handles ASR and auto-recording.
    """

    def __init__(self) -> None:
        super().__init__(
            instructions="You are an interview compliance observer. Do not speak or interact.",
        )


async def entrypoint(ctx: JobContext):
    """
    Agent entrypoint — called by the LiveKit Agents framework when a new
    room is created.

    Steps:
      1. Connect to the room as a hidden participant
      2. Start Egress recording
      3. Wait for a participant to publish audio
      4. Feed audio to Granite ASR pipeline
      5. On room close, flush and generate AI decision
    """
    room = ctx.room
    room_name = room.name

    # Derive interview_id from room metadata or room name
    interview_id = room_name  # Convention: room_name == interview_id

    logger.info("Agent joining room: %s (interview=%s)", room_name, interview_id)

    # 1. Connect as hidden participant (no audio/video published)
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 2. Start auto-recording via Egress
    egress_id = await start_room_egress(room_name, interview_id)
    if egress_id:
        logger.info("Recording started: egress=%s", egress_id)
    else:
        logger.warning("Egress failed — interview will NOT be recorded")

    # 3. Create ASR pipeline
    pipeline = InterviewASRPipeline(
        session_id=f"agent_{room_name}",
        interview_id=interview_id,
    )

    # 4. Process audio from first non-agent participant
    @room.on("track_subscribed")
    def on_track_subscribed(track, publication, participant):
        if track.kind == lk_models.TrackType.AUDIO:
            logger.info(
                "Subscribed to audio: participant=%s track=%s",
                participant.identity, track.sid,
            )
            asyncio.create_task(
                _process_audio_track(track, pipeline, ctx)
            )

    # 5. Wait for room to close
    @room.on("disconnected")
    async def on_disconnected():
        logger.info("Room disconnected: %s — flushing pipeline", room_name)
        decision = await pipeline.flush_and_summarize()
        if decision:
            logger.info("Final decision: %s", decision)


async def _process_audio_track(track, pipeline: InterviewASRPipeline, ctx: JobContext):
    """Read frames from a LiveKit audio track and feed them to the ASR pipeline."""
    try:
        async for frame in track:
            result = await pipeline.process_frame(frame)
            if result:
                # Emit transcript via data channel for live UI
                try:
                    await ctx.room.local_participant.publish_data(
                        json.dumps(result).encode("utf-8"),
                        reliable=True,
                    )
                except Exception:
                    pass  # Data channel send is best-effort

    except Exception as e:
        logger.error("Audio track processing error: %s", e)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
            ws_url=settings.livekit_url,
        ),
    )
