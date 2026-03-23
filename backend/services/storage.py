"""
Storage Service — Unified file storage abstraction.

Supports local filesystem (development) and S3-compatible object storage (production).
Configure via environment variables:
  - STORAGE_TYPE=local (default) or s3
  - STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_ENDPOINT

Usage:
    from backend.services.storage import storage

    # Save a Flask FileStorage object
    path = storage.save_upload(file, 'cv_uploads', 'user123_cv.pdf')

    # Get a URL to serve the file
    url = storage.get_url('cv_uploads/user123_cv.pdf')

    # Download raw bytes
    data = storage.download('cv_uploads/user123_cv.pdf')
"""

import os
import io
import logging
import mimetypes

logger = logging.getLogger(__name__)


class StorageService:
    """Unified interface for local filesystem and S3-compatible object storage."""

    def __init__(self):
        self.storage_type = os.getenv('STORAGE_TYPE', 'local')
        self._s3_client = None

        if self.storage_type == 's3':
            self._init_s3()
        else:
            self.local_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
            os.makedirs(self.local_dir, exist_ok=True)
            logger.info(f"Storage: local filesystem at {self.local_dir}")

    def _init_s3(self):
        """Initialize S3-compatible client (works with AWS S3, Minio, DigitalOcean Spaces, etc.)."""
        try:
            import boto3
            self._s3_client = boto3.client(
                's3',
                endpoint_url=os.getenv('STORAGE_ENDPOINT'),
                aws_access_key_id=os.getenv('STORAGE_ACCESS_KEY'),
                aws_secret_access_key=os.getenv('STORAGE_SECRET_KEY'),
                region_name=os.getenv('STORAGE_REGION', 'me-south-1'),
            )
            self.bucket = os.getenv('STORAGE_BUCKET')
            logger.info(f"Storage: S3 bucket={self.bucket}")
        except ImportError:
            logger.error("boto3 not installed — falling back to local storage")
            self.storage_type = 'local'
            self.local_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
            os.makedirs(self.local_dir, exist_ok=True)

    # -----------------------------------------------------------------
    # High-level helpers (for Flask route handlers)
    # -----------------------------------------------------------------

    def save_upload(self, file_obj, subfolder: str, filename: str) -> str:
        """Save a Flask FileStorage (or file-like) object.

        Args:
            file_obj: A Flask ``FileStorage`` or any file-like with ``.read()``
            subfolder: Logical subfolder, e.g. 'cv_uploads', 'jd_uploads'
            filename: The target filename (already sanitized)

        Returns:
            The storage key/path (relative to the storage root).
        """
        key = f"{subfolder}/{filename}" if subfolder else filename
        content_type = mimetypes.guess_type(filename)[0]

        # Read the raw bytes — handle both FileStorage and plain file objects
        if hasattr(file_obj, 'read'):
            data = file_obj.read()
            # Reset stream position so callers can still use it
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
        elif isinstance(file_obj, bytes):
            data = file_obj
        else:
            data = bytes(file_obj)

        self.upload(data, key, content_type=content_type)
        return key

    def serve(self, key: str):
        """Return a Flask response that serves the file.

        For local storage, uses ``send_file``.
        For S3, redirects to a presigned URL (or proxies the content).
        """
        from flask import send_file, redirect

        if self.storage_type == 's3':
            url = self.get_url(key, expires_in=3600)
            return redirect(url)
        else:
            full_path = os.path.join(self.local_dir, key)
            if not os.path.isfile(full_path):
                from flask import abort
                abort(404)
            content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
            return send_file(full_path, mimetype=content_type)

    def local_path(self, key: str) -> str:
        """Get the absolute local filesystem path for a key.

        Only works when STORAGE_TYPE=local.
        Useful for libraries that need a file path (e.g. PDF parsers).
        """
        if self.storage_type != 'local':
            raise RuntimeError("local_path() only available with STORAGE_TYPE=local")
        return os.path.join(self.local_dir, key)

    # -----------------------------------------------------------------
    # Low-level primitives
    # -----------------------------------------------------------------

    def upload(self, file_data: bytes, path: str, content_type: str = None) -> str:
        """Upload raw bytes. Returns the storage path/URI."""
        if self.storage_type == 's3':
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            self._s3_client.put_object(
                Bucket=self.bucket, Key=path, Body=file_data, **extra_args
            )
            logger.info(f"Uploaded to S3: {path}")
            return f"s3://{self.bucket}/{path}"
        else:
            full_path = os.path.join(self.local_dir, path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'wb') as f:
                if isinstance(file_data, bytes):
                    f.write(file_data)
                else:
                    f.write(file_data.read() if hasattr(file_data, 'read') else bytes(file_data))
            logger.info(f"Saved locally: {full_path}")
            return full_path

    def download(self, path: str) -> bytes:
        """Download a file's contents as bytes."""
        if self.storage_type == 's3':
            obj = self._s3_client.get_object(Bucket=self.bucket, Key=path)
            return obj['Body'].read()
        else:
            with open(os.path.join(self.local_dir, path), 'rb') as f:
                return f.read()

    def get_url(self, path: str, expires_in: int = 3600) -> str:
        """Get a URL to access the file (presigned URL for S3, local path for filesystem)."""
        if self.storage_type == 's3':
            return self._s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': path},
                ExpiresIn=expires_in,
            )
        else:
            return f"/uploads/{path}"

    def exists(self, path: str) -> bool:
        """Check if a file exists at the given path."""
        if self.storage_type == 's3':
            try:
                self._s3_client.head_object(Bucket=self.bucket, Key=path)
                return True
            except Exception:
                return False
        else:
            return os.path.isfile(os.path.join(self.local_dir, path))

    def delete(self, path: str) -> bool:
        """Delete a file at the given path."""
        if self.storage_type == 's3':
            try:
                self._s3_client.delete_object(Bucket=self.bucket, Key=path)
                return True
            except Exception as e:
                logger.error(f"S3 delete failed: {e}")
                return False
        else:
            full_path = os.path.join(self.local_dir, path)
            if os.path.isfile(full_path):
                os.remove(full_path)
                return True
            return False


# Module-level singleton — import this from other modules
storage = StorageService()
