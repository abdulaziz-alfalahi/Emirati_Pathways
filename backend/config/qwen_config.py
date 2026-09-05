"""
Qwen / DashScope Configuration
Emirati Journey Platform — Qwen Migration

Centralizes all configuration for Alibaba Cloud's Qwen API via DashScope.
Loads secrets from environment variables; never hardcodes API keys.
"""

import os
import logging
from typing import Dict, Optional
from urllib.parse import urlparse

from dotenv import load_dotenv

# Load .env at import time so every downstream module inherits values
load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# API Configuration
# ---------------------------------------------------------------------------
DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")
QWEN_BASE_URL: str = os.getenv(
    "QWEN_BASE_URL",
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)


def is_internal_url(url: str) -> bool:
    """True when the endpoint is inside the tenancy (the vLLM balancer on the
    GPU nodes), so the corporate proxy must be bypassed and no vendor API key
    is needed. Mirrors object_storage._is_internal(): private ranges, loopback,
    and anything listed in NO_PROXY."""
    try:
        host = (urlparse(url).hostname or "").lower()
    except ValueError:
        return False
    if not host:
        return False
    if host in ("localhost",) or host.startswith(("127.", "10.", "192.168.")):
        return True
    if host.startswith("172.") and host.split(".")[1].isdigit() and 16 <= int(host.split(".")[1]) <= 31:
        return True
    no_proxy = (os.getenv("NO_PROXY") or os.getenv("no_proxy") or "")
    return any(entry.strip() and (host == entry.strip() or host.endswith(entry.strip().lstrip("."))
                                  or (entry.strip().endswith("/8") and host.startswith(entry.strip()[:entry.find(".")])))
               for entry in no_proxy.split(","))


QWEN_IS_LOCAL: bool = is_internal_url(QWEN_BASE_URL)

# The API key the client presents. DashScope needs the vendor key; the local
# vLLM balancer accepts anything (it has no auth — reachability is the
# control), so a placeholder keeps the OpenAI SDK happy.
QWEN_API_KEY: str = os.getenv("QWEN_API_KEY") or DASHSCOPE_API_KEY or ("local" if QWEN_IS_LOCAL else "")

# Owner direction 2026-09-06: everything runs on the balancer, nothing goes
# to DashScope. Setting QWEN_LOCAL_MODEL routes EVERY task type to that one
# model unless a per-task override is given. Qwen3.8-27B has native vision,
# so OCR moves too (QWEN_VISION_MODEL defaults to it).
QWEN_LOCAL_MODEL: str = os.getenv("QWEN_LOCAL_MODEL", "")

if not QWEN_API_KEY:
    logger.warning(
        "⚠️  No API key and no local endpoint: Qwen AI features will be disabled. "
        "Set DASHSCOPE_API_KEY, or QWEN_BASE_URL to the on-premises balancer."
    )


def _route(env_name: str, dashscope_default: str) -> str:
    return os.getenv(env_name) or QWEN_LOCAL_MODEL or dashscope_default


# ---------------------------------------------------------------------------
# Model Routing — per task type, env-driven
# ---------------------------------------------------------------------------
# With QWEN_LOCAL_MODEL set, every task resolves to the local model; the
# DashScope defaults below only apply when it is not.
MODEL_ROUTING: Dict[str, str] = {
    "parse": _route("QWEN_PARSE_MODEL", "qwen-turbo"),
    "match": _route("QWEN_MATCH_MODEL", "qwen-plus"),
    "score": _route("QWEN_MATCH_MODEL", "qwen-plus"),
    "explain": _route("QWEN_MATCH_MODEL", "qwen-plus"),
    "jd_parse": _route("QWEN_JD_PARSE_MODEL", "qwen-plus"),
    "interview": _route("QWEN_INTERVIEW_MODEL", "qwen-plus"),
    "generate": _route("QWEN_GENERATE_MODEL", "qwen-max"),
    "ai_assist": _route("QWEN_ASSIST_MODEL", "qwen-turbo"),
}

# Fallback model used when a specific task type is not mapped
DEFAULT_MODEL: str = os.getenv("QWEN_DEFAULT_MODEL") or QWEN_LOCAL_MODEL or "qwen-turbo"

# Vision (OCR of scanned CVs, certificates, trade licences)
QWEN_VISION_MODEL: str = os.getenv("QWEN_VISION_MODEL") or QWEN_LOCAL_MODEL or "qwen-vl-ocr"

# Qwen3 thinking mode. Off for every task by default: it spends the whole
# max_tokens budget reasoning and returns no JSON, and the bench measured
# 100% valid JSON with it off. Enable per task only if a quality case is made
# (QWEN_THINKING_TASKS=explain,generate). DashScope models ignore the flag;
# it is only sent to the local endpoint.
QWEN_THINKING_TASKS = frozenset(
    t.strip() for t in os.getenv("QWEN_THINKING_TASKS", "").split(",") if t.strip())

# ---------------------------------------------------------------------------
# Request Defaults
# ---------------------------------------------------------------------------
REQUEST_TIMEOUT: int = int(os.getenv("QWEN_TIMEOUT", "120"))
MAX_RETRIES: int = int(os.getenv("QWEN_MAX_RETRIES", "3"))
MAX_INPUT_CHARS: int = int(os.getenv("QWEN_MAX_INPUT_CHARS", "20000"))

# Temperature per task type (lower = more deterministic for parsing)
TEMPERATURE: Dict[str, float] = {
    "parse": 0.1,
    "match": 0.3,
    "score": 0.2,
    "explain": 0.4,
    # Batch 1 migration
    "jd_parse": 0.1,
    "interview": 0.3,
    # Batch 2 (reserved)
    "generate": 0.5,
}

# ---------------------------------------------------------------------------
# Cost Tracking (approximate AED per 1 M tokens — update as pricing changes)
# ---------------------------------------------------------------------------
COST_PER_MILLION_TOKENS: Dict[str, Dict[str, float]] = {
    # Self-hosted on the GPU nodes already on the Moro invoice: no per-token cost.
    **({QWEN_LOCAL_MODEL: {"input": 0.0, "output": 0.0}} if QWEN_LOCAL_MODEL else {}),
    "qwen-turbo": {"input": 0.80, "output": 2.00},
    "qwen-plus": {"input": 1.60, "output": 4.40},
    "qwen-max": {"input": 8.00, "output": 24.00},
    "qwen-vl-max": {"input": 12.00, "output": 36.00},
}

# ---------------------------------------------------------------------------
# Per-task max token limits
# ---------------------------------------------------------------------------
MAX_TOKENS_PER_TASK: Dict[str, int] = {
    'cv_parse': 4096,
    'interview': 2048,
    'matching': 1024,
    'jd_analysis': 2048,
    'general': 4096,
}

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def get_model_for_task(task_type: str, override: Optional[str] = None) -> str:
    """Return the appropriate model ID for a given task type.

    Args:
        task_type: One of "parse", "match", "score", "explain".
        override: If provided, bypass routing and use this model directly.

    Returns:
        A DashScope model identifier string.
    """
    if override:
        return override
    model = MODEL_ROUTING.get(task_type, DEFAULT_MODEL)
    logger.debug(f"Routing task '{task_type}' → model '{model}'")
    return model
