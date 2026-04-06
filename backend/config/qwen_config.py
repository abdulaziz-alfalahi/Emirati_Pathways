"""
Qwen / DashScope Configuration
Emirati Journey Platform — Qwen Migration

Centralizes all configuration for Alibaba Cloud's Qwen API via DashScope.
Loads secrets from environment variables; never hardcodes API keys.
"""

import os
import logging
from typing import Dict, Optional

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

if not DASHSCOPE_API_KEY:
    logger.warning(
        "⚠️  DASHSCOPE_API_KEY not set. Qwen AI features will be disabled. "
        "Set it in your .env file or environment variables."
    )

# ---------------------------------------------------------------------------
# Model Routing — Hybrid Flash / Plus Strategy
# ---------------------------------------------------------------------------
# "parse"  tasks (CV / JD extraction) → fast, cost-efficient model
# "match"  tasks (scoring, gap analysis) → high-accuracy reasoning model
MODEL_ROUTING: Dict[str, str] = {
    "parse": os.getenv("QWEN_PARSE_MODEL", "qwen-turbo"),
    "match": os.getenv("QWEN_MATCH_MODEL", "qwen-plus"),
    "score": os.getenv("QWEN_MATCH_MODEL", "qwen-plus"),
    "explain": os.getenv("QWEN_MATCH_MODEL", "qwen-plus"),
    # Batch 1 migration
    "jd_parse": os.getenv("QWEN_JD_PARSE_MODEL", "qwen-plus"),
    "interview": os.getenv("QWEN_INTERVIEW_MODEL", "qwen-plus"),
    # Batch 2 (reserved)
    "generate": os.getenv("QWEN_GENERATE_MODEL", "qwen-max"),
}

# Fallback model used when a specific task type is not mapped
DEFAULT_MODEL: str = os.getenv("QWEN_DEFAULT_MODEL", "qwen-turbo")

# ---------------------------------------------------------------------------
# Request Defaults
# ---------------------------------------------------------------------------
REQUEST_TIMEOUT: int = int(os.getenv("QWEN_TIMEOUT", "30"))
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
    "qwen-turbo": {"input": 0.80, "output": 2.00},
    "qwen-plus": {"input": 1.60, "output": 4.40},
    "qwen-max": {"input": 8.00, "output": 24.00},
    "qwen-vl-max": {"input": 12.00, "output": 36.00},
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
