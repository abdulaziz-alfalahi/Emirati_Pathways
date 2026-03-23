"""
Compliance — AES-256 encryption helpers and data sovereignty checks.

Ensures:
  - All S3 uploads use SSE-S3 (AES-256) encryption at rest
  - No media data leaves the local network
  - Encryption metadata is logged on every recording
"""

import hashlib
import hmac
import logging
from typing import Dict, Any

import boto3
from botocore.config import Config as BotoConfig

from .config import Settings

logger = logging.getLogger(__name__)


def get_s3_client(settings: Settings):
    """
    Create an S3 client configured for MinIO with server-side encryption.
    Uses path-style addressing for MinIO compatibility.
    """
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=BotoConfig(
            s3={"addressing_style": "path"},
            signature_version="s3v4",
        ),
    )


def upload_encrypted(
    s3_client,
    bucket: str,
    key: str,
    file_path: str,
) -> Dict[str, Any]:
    """
    Upload a file with AES-256 server-side encryption (SSE-S3).

    MinIO is configured with MINIO_KMS_AUTO_ENCRYPTION=on + an AEAD key,
    so all objects are encrypted at rest automatically. This function
    explicitly sets the SSE header for defense-in-depth.
    """
    logger.info("Uploading %s → s3://%s/%s (SSE-S3 AES-256)", file_path, bucket, key)

    extra_args = {
        "ServerSideEncryption": "AES256",
    }

    s3_client.upload_file(
        Filename=file_path,
        Bucket=bucket,
        Key=key,
        ExtraArgs=extra_args,
    )

    # Verify encryption was applied
    head = s3_client.head_object(Bucket=bucket, Key=key)
    sse_header = head.get("ServerSideEncryption", "none")
    size = head.get("ContentLength", 0)

    logger.info(
        "Upload verified: %s (size=%d, SSE=%s)", key, size, sse_header,
    )

    return {
        "bucket": bucket,
        "key": key,
        "size_bytes": size,
        "encryption": sse_header,
        "encrypted": sse_header == "AES256",
    }


def verify_data_locality(endpoint: str) -> bool:
    """
    Assert that the S3 endpoint is a local/private network address.
    Prevents accidental uploads to external cloud storage.
    """
    from urllib.parse import urlparse

    parsed = urlparse(endpoint)
    host = parsed.hostname or ""

    local_prefixes = [
        "localhost", "127.0.0.1", "10.", "172.16.", "172.17.",
        "172.18.", "172.19.", "172.20.", "172.21.", "172.22.",
        "172.23.", "172.24.", "172.25.", "172.26.", "172.27.",
        "172.28.", "172.29.", "172.30.", "172.31.",
        "192.168.", "minio", "egress", "livekit",
    ]

    # Also allow UAE-specific AWS region
    if "me-central-1" in host or "me-south-1" in host:
        return True

    is_local = any(host.startswith(prefix) for prefix in local_prefixes)

    if not is_local:
        logger.error(
            "DATA SOVEREIGNTY VIOLATION: S3 endpoint '%s' is NOT a local address. "
            "Interview media must remain on-premise or in UAE region.",
            endpoint,
        )

    return is_local


def generate_audit_hash(file_path: str) -> str:
    """
    Generate a SHA-256 hash of a recording file for integrity verification.
    Used in audit logs to prove the file hasn't been tampered with.
    """
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            sha256.update(block)
    return sha256.hexdigest()


def validate_webhook_signature(
    body: bytes,
    signature: str,
    api_secret: str,
) -> bool:
    """
    Validate a LiveKit webhook signature.
    LiveKit signs webhooks with HMAC-SHA256 using the API secret.
    """
    expected = hmac.new(
        api_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
