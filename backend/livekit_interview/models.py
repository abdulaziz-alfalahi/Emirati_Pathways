"""
Database Models — SQLAlchemy ORM for interview recording metadata,
transcripts, and AI-generated decision logs.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, DateTime,
    ForeignKey, Enum as SAEnum, JSON, Index,
    create_engine,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker
import enum


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class RecordingStatus(str, enum.Enum):
    PENDING = "pending"
    RECORDING = "recording"
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"


class AIDecision(str, enum.Enum):
    SHORTLIST = "shortlist"
    REJECT = "reject"
    HOLD = "hold"
    REVIEW = "review"


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------

class InterviewRecording(Base):
    """
    Tracks LiveKit Egress recordings and their S3 storage metadata.
    One row per interview session.
    """
    __tablename__ = "interview_recordings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(String(64), nullable=False, index=True, comment="FK to video_interview_sessions.id or external ID")
    room_name = Column(String(128), nullable=False)

    # Egress metadata
    egress_id = Column(String(64), unique=True, nullable=True, comment="LiveKit Egress ID")
    status = Column(SAEnum(RecordingStatus), default=RecordingStatus.PENDING, nullable=False)

    # S3 storage
    s3_bucket = Column(String(128), nullable=True)
    s3_key = Column(String(512), nullable=True, comment="e.g. {interview_id}_{timestamp}.mp4")
    s3_endpoint = Column(String(256), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    # Encryption
    encrypted = Column(Boolean, default=True)
    encryption_method = Column(String(32), default="AES-256-SSE-S3")

    # Timestamps
    recording_started_at = Column(DateTime, nullable=True)
    recording_ended_at = Column(DateTime, nullable=True)
    upload_completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transcripts = relationship("InterviewTranscript", back_populates="recording", cascade="all, delete-orphan")
    decision_logs = relationship("AIDecisionLog", back_populates="recording", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_recording_interview_status", "interview_id", "status"),
    )

    def __repr__(self):
        return f"<InterviewRecording {self.interview_id} [{self.status.value}]>"


class InterviewTranscript(Base):
    """
    Per-segment transcript with speaker attribution and timestamps.
    Populated in real-time by the Agent Worker.
    """
    __tablename__ = "interview_transcripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recording_id = Column(UUID(as_uuid=True), ForeignKey("interview_recordings.id"), nullable=False, index=True)

    # Transcript content
    segment_index = Column(Integer, nullable=False, comment="0-based order within recording")
    text = Column(Text, nullable=False)
    speaker = Column(String(32), nullable=False, default="unknown", comment="'Interviewer' or 'Interviewee'")
    speaker_id = Column(String(32), nullable=True, comment="A or B speaker label")
    language = Column(String(8), default="en")

    # Timing
    start_time_s = Column(Float, nullable=True, comment="Seconds from interview start")
    end_time_s = Column(Float, nullable=True)
    duration_s = Column(Float, nullable=True)

    # AI analysis on this segment
    competencies_detected = Column(JSON, nullable=True, comment='["leadership", "teamwork"]')
    sentiment = Column(String(16), nullable=True)
    confidence_level = Column(String(16), nullable=True)
    is_key_moment = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    recording = relationship("InterviewRecording", back_populates="transcripts")

    __table_args__ = (
        Index("ix_transcript_recording_segment", "recording_id", "segment_index"),
    )

    def __repr__(self):
        return f"<InterviewTranscript seg={self.segment_index} speaker={self.speaker}>"


class AIDecisionLog(Base):
    """
    AI-generated hiring signal for each interview.
    Stores the model's shortlist/reject recommendation with scores and reasoning.
    """
    __tablename__ = "ai_decision_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recording_id = Column(UUID(as_uuid=True), ForeignKey("interview_recordings.id"), nullable=False, index=True)

    # Decision
    decision = Column(SAEnum(AIDecision), nullable=False)
    overall_score = Column(Float, nullable=False, comment="0.0 – 1.0 aggregate score")

    # Score breakdown
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    cultural_fit_score = Column(Float, nullable=True)
    leadership_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)

    # Details
    reasoning = Column(Text, nullable=True, comment="Model's explanation for the decision")
    competency_profile = Column(JSON, nullable=True, comment='{"leadership": 3, "teamwork": 5}')
    key_moments = Column(JSON, nullable=True, comment="List of flagged transcript moments")
    red_flags = Column(JSON, nullable=True, comment='["long_hesitation", "inconsistent_answers"]')

    # Metadata
    model_id = Column(String(128), nullable=True, default="ibm-granite/granite-4.0-1b-speech")
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_by = Column(String(64), nullable=True, comment="HR user who reviewed the AI decision")
    review_override = Column(SAEnum(AIDecision), nullable=True, comment="HR override of AI decision")
    reviewed_at = Column(DateTime, nullable=True)

    # Relationship
    recording = relationship("InterviewRecording", back_populates="decision_logs")

    def __repr__(self):
        return f"<AIDecisionLog {self.decision.value} score={self.overall_score:.2f}>"


# ---------------------------------------------------------------------------
# Session Factory
# ---------------------------------------------------------------------------

def create_db_engine(database_url: str):
    """Create SQLAlchemy engine with connection pooling."""
    return create_engine(
        database_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=False,
    )


def create_tables(database_url: str):
    """Create all tables (idempotent)."""
    engine = create_db_engine(database_url)
    Base.metadata.create_all(engine)
    return engine


def get_session_factory(database_url: str):
    """Return a sessionmaker bound to the database."""
    engine = create_db_engine(database_url)
    return sessionmaker(bind=engine)
