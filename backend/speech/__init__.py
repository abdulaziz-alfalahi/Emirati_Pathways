"""
IBM Granite 4.0 1B Speech — Real-Time Interview Analysis Server

A standalone FastAPI sidecar that provides:
  - Streaming ASR via WebSocket (16kHz 16-bit PCM)
  - Keyword-biased transcription for HR/Emirati terms
  - Two-pass analysis (transcribe + insight extraction)
  - Lightweight energy-based speaker diarization
  - Memory management for 60+ minute interviews
"""

__version__ = "1.0.0"
