"""
Egress Webhook Receiver — Handles LiveKit Egress lifecycle events.

FastAPI endpoint that receives webhook POSTs from LiveKit when:
  - An Egress recording starts
  - An Egress recording updates (progress)
  - An Egress recording ends (upload complete or failed)

Run standalone:
    uvicorn backend.livekit_interview.egress_webhook:app --host 0.0.0.0 --port 8003
"""

import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .models import (
    InterviewRecording,
    RecordingStatus,
    create_tables,
    get_session_factory,
)
from .compliance import validate_webhook_signature

logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
create_tables(settings.database_url)
SessionFactory = get_session_factory(settings.database_url)

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="LiveKit Egress Webhook Receiver",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Webhook Endpoint
# ---------------------------------------------------------------------------

@app.post("/webhook/egress")
async def handle_egress_webhook(
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """
    Receive and process LiveKit Egress webhook events.

    LiveKit sends:
      - egress_started:  Recording has begun
      - egress_updated:  Progress update (bytes written, duration)
      - egress_ended:    Recording complete — file uploaded to S3
      - egress_failed:   Recording failed

    Each event contains the full EgressInfo protobuf as JSON.
    """
    body = await request.body()

    # --- Signature Validation ---
    if authorization:
        # LiveKit sends: "Bearer <token>" but webhooks use API secret for HMAC
        token = authorization.replace("Bearer ", "")
        if not validate_webhook_signature(body, token, settings.livekit_api_secret):
            logger.warning("Webhook signature validation failed")
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = payload.get("event", "")
    egress_info = payload.get("egressInfo", {})
    egress_id = egress_info.get("egressId", "")

    logger.info(
        "Egress webhook: event=%s egress_id=%s room=%s",
        event_type,
        egress_id,
        egress_info.get("roomName", ""),
    )

    # --- Route to handler ---
    if event_type == "egress_started":
        await _handle_egress_started(egress_id, egress_info)
    elif event_type == "egress_updated":
        await _handle_egress_updated(egress_id, egress_info)
    elif event_type == "egress_ended":
        await _handle_egress_ended(egress_id, egress_info)
    else:
        logger.info("Ignoring event: %s", event_type)

    return {"status": "ok", "event": event_type}


# ---------------------------------------------------------------------------
# Event Handlers
# ---------------------------------------------------------------------------

async def _handle_egress_started(egress_id: str, info: dict):
    """Mark the recording as actively recording."""
    _update_recording_status(
        egress_id=egress_id,
        status=RecordingStatus.RECORDING,
        update_fields={"recording_started_at": datetime.utcnow()},
    )
    logger.info("Recording confirmed started: %s", egress_id)


async def _handle_egress_updated(egress_id: str, info: dict):
    """
    Progress update — Egress sends these periodically.
    We can extract bytes_written and duration for monitoring.
    """
    file_results = info.get("fileResults", [])
    if file_results:
        fr = file_results[0]
        duration = fr.get("duration", 0)
        size = fr.get("size", 0)
        logger.debug(
            "Egress progress: %s — %.1fs, %d bytes",
            egress_id, duration / 1e9, size,  # duration is in nanoseconds
        )


async def _handle_egress_ended(egress_id: str, info: dict):
    """
    Recording complete — the file has been uploaded to S3.
    Mark as completed in the database and store final metadata.
    """
    status_code = info.get("status", 0)

    # LiveKit Egress status codes:
    #   2 = EGRESS_ENDING
    #   3 = EGRESS_COMPLETE
    #   4 = EGRESS_FAILED
    if status_code == 4 or info.get("error"):
        error_msg = info.get("error", "Unknown error")
        logger.error("Egress FAILED: %s — %s", egress_id, error_msg)
        _update_recording_status(
            egress_id=egress_id,
            status=RecordingStatus.FAILED,
        )
        return

    # Extract file result metadata
    file_results = info.get("fileResults", [])
    update_fields = {
        "status": RecordingStatus.COMPLETED,
        "recording_ended_at": datetime.utcnow(),
        "upload_completed_at": datetime.utcnow(),
    }

    if file_results:
        fr = file_results[0]
        update_fields["file_size_bytes"] = fr.get("size", 0)
        # Duration is in nanoseconds → convert to seconds
        duration_ns = fr.get("duration", 0)
        update_fields["duration_seconds"] = round(duration_ns / 1e9, 1)

        # Update S3 key if available (Egress may modify the filename)
        filename = fr.get("filename", "")
        if filename:
            update_fields["s3_key"] = filename

    _update_recording_status(
        egress_id=egress_id,
        status=RecordingStatus.COMPLETED,
        update_fields=update_fields,
    )

    logger.info(
        "✅ Recording COMPLETED: %s (size=%s bytes, duration=%ss)",
        egress_id,
        update_fields.get("file_size_bytes", "?"),
        update_fields.get("duration_seconds", "?"),
    )


# ---------------------------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------------------------

def _update_recording_status(
    egress_id: str,
    status: RecordingStatus,
    update_fields: Optional[dict] = None,
):
    """Update the InterviewRecording row by egress_id."""
    db = SessionFactory()
    try:
        recording = db.query(InterviewRecording).filter_by(
            egress_id=egress_id,
        ).first()

        if not recording:
            logger.warning(
                "No recording found for egress_id=%s — creating placeholder", egress_id,
            )
            return

        recording.status = status
        recording.updated_at = datetime.utcnow()

        if update_fields:
            for key, value in update_fields.items():
                if hasattr(recording, key):
                    setattr(recording, key, value)

        db.commit()
        logger.debug("Recording %s updated: status=%s", egress_id, status.value)

    except Exception as e:
        db.rollback()
        logger.error("Failed to update recording %s: %s", egress_id, e)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "Egress Webhook Receiver",
        "timestamp": datetime.utcnow().isoformat(),
    }
