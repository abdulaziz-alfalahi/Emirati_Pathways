"""
Configuration — Environment-driven settings for all LiveKit services.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Loads from environment variables (or .env file)."""

    # ── LiveKit ──────────────────────────────────────────────────────
    livekit_url: str = Field("ws://localhost:7880", alias="LIVEKIT_URL")
    livekit_api_key: str = Field("devkey", alias="LIVEKIT_API_KEY")
    livekit_api_secret: str = Field("secret", alias="LIVEKIT_API_SECRET")

    # ── S3 / MinIO ───────────────────────────────────────────────────
    s3_endpoint: str = Field("http://localhost:9000", alias="S3_ENDPOINT")
    s3_bucket: str = Field("interview-recordings", alias="S3_BUCKET")
    s3_access_key: str = Field("minioadmin", alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field("minioadmin123", alias="S3_SECRET_KEY")
    s3_region: str = Field("us-east-1", alias="S3_REGION")

    # ── Database ─────────────────────────────────────────────────────
    database_url: str = Field(
        "postgresql://emirati_user:emirati_secure_password@localhost:5432/emirati_journey",
        alias="DATABASE_URL",
    )

    # ── Granite Speech Sidecar ───────────────────────────────────────
    granite_speech_url: str = Field(
        "http://localhost:8001", alias="GRANITE_SPEECH_URL"
    )

    # ── Webhook ──────────────────────────────────────────────────────
    webhook_url: str = Field(
        "http://localhost:8003/webhook/egress", alias="WEBHOOK_URL"
    )

    # ── Compliance ───────────────────────────────────────────────────
    encryption_key_alias: str = Field(
        "emirati-key-1", alias="ENCRYPTION_KEY_ALIAS"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True


def get_settings() -> Settings:
    return Settings()
