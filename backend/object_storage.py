"""S3/MinIO object storage.

The platform's first real object-storage integration. MinIO has been running on
APPQA since July with an empty `interview-recordings` bucket; `livekit_interview/
config.py` declared S3 settings but nothing ever instantiated a client. This is
that client.

Deliberately thin: put, get, delete, and a bucket check. No presigned URLs — a
presigned URL is a bearer credential that outlives the session and can be
forwarded, which is wrong for board minutes. Callers stream through the backend
so every read passes the role check and is attributable.

Configuration (backend environment):
    S3_ENDPOINT       default http://minio:9000 (the docker-network name)
    S3_ACCESS_KEY     MinIO root user
    S3_SECRET_KEY     MinIO root password
    S3_REGION         default us-east-1 (MinIO ignores it but boto3 wants one)

`configured()` is the single check for whether storage is usable. Callers must
consult it and fail loudly rather than pretending an upload succeeded — the
failure mode this codebase keeps being cleaned of.
"""
import io
import os
import hashlib
import logging
import ipaddress
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

BOARD_MINUTES_BUCKET = os.getenv('BOARD_MINUTES_BUCKET', 'board-minutes')


def configured():
    """True only when real credentials are present."""
    return bool((os.getenv('S3_ACCESS_KEY') or '').strip()
                and (os.getenv('S3_SECRET_KEY') or '').strip())


def _is_internal(endpoint):
    """True for a docker-network name or a private address.

    APPQA's `~/.docker/config.json` has a `proxies.default` block, so Docker
    injects HTTP_PROXY/NO_PROXY into every container it creates — and `minio`
    is not in its noProxy list. boto3 honours those variables, so a call to
    `http://minio:9000` gets sent to the corporate proxy, which cannot route to
    a docker-network name and answers 503. The service is perfectly healthy;
    the request never reaches it.

    Editing the host's noProxy would fix it only for containers created
    afterwards, and only on this host. Deciding here instead keeps the fix with
    the code.
    """
    host = urlparse(endpoint).hostname or ''
    if '.' not in host:          # bare docker-network name, e.g. "minio"
        return True
    try:
        return ipaddress.ip_address(host).is_private
    except ValueError:
        return False             # a real external hostname — respect the proxy


def _client():
    import boto3
    from botocore.config import Config
    endpoint = os.getenv('S3_ENDPOINT', 'http://minio:9000')
    cfg = {'s3': {'addressing_style': 'path'},   # MinIO needs path-style; virtual-host
                                                 # style assumes DNS per bucket
           'retries': {'max_attempts': 3, 'mode': 'standard'}}
    if _is_internal(endpoint) and os.getenv('S3_USE_PROXY', '').lower() not in ('1', 'true'):
        cfg['proxies'] = {}      # bypass any inherited HTTP_PROXY (see _is_internal)
    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
        aws_secret_access_key=os.getenv('S3_SECRET_KEY'),
        region_name=os.getenv('S3_REGION', 'us-east-1'),
        config=Config(**cfg),
    )


def ensure_bucket(bucket=BOARD_MINUTES_BUCKET):
    """Create the bucket if absent. Idempotent; safe to call on every upload."""
    c = _client()
    try:
        c.head_bucket(Bucket=bucket)
        return True
    except Exception:
        pass
    try:
        c.create_bucket(Bucket=bucket)
        logger.info("created object storage bucket %s", bucket)
        return True
    except Exception as e:
        # A concurrent creator is fine; anything else is not.
        if 'BucketAlreadyOwnedByYou' in str(e) or 'BucketAlreadyExists' in str(e):
            return True
        logger.error("could not create bucket %s: %s", bucket, e)
        return False


def put_object(key, data, content_type='application/octet-stream',
               bucket=BOARD_MINUTES_BUCKET):
    """Store bytes. Returns the sha256 of exactly what was written.

    The hash is computed here, over the same buffer handed to S3, so it cannot
    drift from the stored object.
    """
    digest = hashlib.sha256(data).hexdigest()
    _client().put_object(Bucket=bucket, Key=key, Body=io.BytesIO(data),
                         ContentLength=len(data), ContentType=content_type)
    logger.info("stored %s/%s (%d bytes)", bucket, key, len(data))
    return digest


def get_object(key, bucket=BOARD_MINUTES_BUCKET):
    """Retrieve bytes. Raises if the object is missing — never returns empty
    for a missing key, which would let a caller serve nothing as though it were
    the record."""
    return _client().get_object(Bucket=bucket, Key=key)['Body'].read()


def delete_object(key, bucket=BOARD_MINUTES_BUCKET):
    """Remove an object. Used only by the Administrator purge path, which is not
    currently wired — board minutes use a SOFT delete that retains the object
    (see migration 060). Present so a purge is a deliberate call, not a rewrite."""
    _client().delete_object(Bucket=bucket, Key=key)
    logger.warning("deleted object %s/%s", bucket, key)


def health():
    """Diagnostic: is storage actually usable right now?"""
    if not configured():
        return {'configured': False, 'reachable': False,
                'detail': 'S3_ACCESS_KEY/S3_SECRET_KEY not set'}
    try:
        _client().list_buckets()
        return {'configured': True, 'reachable': True}
    except Exception as e:
        return {'configured': True, 'reachable': False, 'detail': str(e)[:200]}
