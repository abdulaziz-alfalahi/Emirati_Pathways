"""
Qwen Client — Unified OpenAI-Compatible Wrapper
Emirati Journey Platform — Qwen Migration

Provides a single, retry-aware client for all Qwen / DashScope API calls.
Uses the `openai` Python package in compatibility mode.
"""

import json
import os
import time
import logging
import re
from typing import Any, Dict, List, Optional

from openai import OpenAI, APIError, APITimeoutError, RateLimitError
import httpx

from backend.config.qwen_config import (
    DASHSCOPE_API_KEY,
    QWEN_BASE_URL,
    REQUEST_TIMEOUT,
    MAX_RETRIES,
    TEMPERATURE,
    COST_PER_MILLION_TOKENS,
    get_model_for_task,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom Exceptions
# ---------------------------------------------------------------------------

class QwenParsingError(Exception):
    """Raised when Qwen returns content that cannot be parsed as valid JSON."""

    def __init__(self, message: str, raw_response: str = "", model: str = ""):
        self.raw_response = raw_response
        self.model = model
        super().__init__(message)


class QwenClientError(Exception):
    """Raised for general Qwen API errors after all retries are exhausted."""
    pass


# ---------------------------------------------------------------------------
# Token / Cost Tracking
# ---------------------------------------------------------------------------

class UsageTracker:
    """Accumulates token usage and estimates cost per model."""

    def __init__(self):
        self._totals: Dict[str, Dict[str, int]] = {}

    def record(self, model: str, prompt_tokens: int, completion_tokens: int):
        if model not in self._totals:
            self._totals[model] = {"prompt_tokens": 0, "completion_tokens": 0, "calls": 0}
        self._totals[model]["prompt_tokens"] += prompt_tokens
        self._totals[model]["completion_tokens"] += completion_tokens
        self._totals[model]["calls"] += 1

    def estimate_cost(self, model: str) -> Dict[str, float]:
        """Return estimated cost (AED) for a specific model."""
        stats = self._totals.get(model, {"prompt_tokens": 0, "completion_tokens": 0})
        pricing = COST_PER_MILLION_TOKENS.get(model, {"input": 0, "output": 0})
        in_cost = (stats["prompt_tokens"] / 1_000_000) * pricing["input"]
        out_cost = (stats["completion_tokens"] / 1_000_000) * pricing["output"]
        return {"input_aed": round(in_cost, 6), "output_aed": round(out_cost, 6), "total_aed": round(in_cost + out_cost, 6)}

    def summary(self) -> Dict[str, Any]:
        return {
            model: {**stats, "cost": self.estimate_cost(model)}
            for model, stats in self._totals.items()
        }


# ---------------------------------------------------------------------------
# Singleton Client
# ---------------------------------------------------------------------------

_client: Optional[OpenAI] = None
_usage_tracker = UsageTracker()


def _get_client() -> OpenAI:
    """Lazily initialise the OpenAI client once."""
    global _client
    if _client is None:
        if not DASHSCOPE_API_KEY:
            raise QwenClientError(
                "DASHSCOPE_API_KEY is not set. Cannot initialise Qwen client."
            )

        # Proxy support for restricted network environments (e.g. MoroHub)
        https_proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
        http_proxy = os.environ.get("HTTP_PROXY") or os.environ.get("http_proxy")
        proxy_url = https_proxy or http_proxy

        client_kwargs = {
            "api_key": DASHSCOPE_API_KEY,
            "base_url": QWEN_BASE_URL,
            "timeout": REQUEST_TIMEOUT,
        }

        if proxy_url:
            logger.info(f"🌐 Configuring Qwen client with proxy: {proxy_url}")
            client_kwargs["http_client"] = httpx.Client(
                proxy=proxy_url,
                timeout=REQUEST_TIMEOUT,
                verify=True,
            )
            # Disable SDK internal retries — we handle retries in chat_completion()
            client_kwargs["max_retries"] = 0

        _client = OpenAI(**client_kwargs)
        logger.info(f"✅ Qwen OpenAI-compatible client initialised (base_url={QWEN_BASE_URL}, proxy={'yes' if proxy_url else 'no'})")
    return _client


def get_usage_summary() -> Dict[str, Any]:
    """Return cumulative token usage and cost estimates."""
    return _usage_tracker.summary()


# ---------------------------------------------------------------------------
# Input Sanitisation
# ---------------------------------------------------------------------------

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def _sanitise(text: str) -> str:
    """Strip control characters and fix encoding artefacts."""
    return _CONTROL_CHARS.sub("", text)


# ---------------------------------------------------------------------------
# Core API Call
# ---------------------------------------------------------------------------

def chat_completion(
    task_type: str,
    messages: List[Dict[str, str]],
    *,
    model_override: Optional[str] = None,
    response_format: Optional[Dict[str, str]] = None,
    max_retries: int = MAX_RETRIES,
    temperature: Optional[float] = None,
    max_tokens: int = 4096,
) -> Dict[str, Any]:
    """Send a chat completion request to Qwen via DashScope.

    Args:
        task_type: Routing key ("parse", "match", "score", "explain").
        messages: Standard OpenAI chat messages list.
        model_override: Force a specific model ID (bypasses routing).
        response_format: e.g. {"type": "json_object"}.
        max_retries: Number of retry attempts on transient failures.
        temperature: Override default temperature for this task type.

    Returns:
        Parsed JSON dict from the assistant response.

    Raises:
        QwenParsingError: If the response cannot be parsed as JSON after retries.
        QwenClientError: If the API call fails after all retries.
    """
    client = _get_client()
    model = get_model_for_task(task_type, model_override)
    temp = temperature if temperature is not None else TEMPERATURE.get(task_type, 0.2)

    if response_format is None:
        response_format = {"type": "json_object"}

    # Sanitise user messages
    messages = [
        {**msg, "content": _sanitise(msg["content"])} if msg.get("content") else msg
        for msg in messages
    ]

    # DashScope compatible-mode (like OpenAI) rejects response_format
    # json_object with 400 InvalidParameter unless the word "json" appears
    # somewhere in the messages. The match/score prompts don't contain it,
    # so every AI scoring call 400'd and the engine silently fell back to
    # heuristics (issue #127). Inject a minimal system nudge when needed.
    if response_format and response_format.get("type") == "json_object":
        if not any("json" in (m.get("content") or "").lower() for m in messages):
            messages = [
                {"role": "system", "content": "Respond only with a valid JSON object."},
                *messages,
            ]

    last_error: Optional[Exception] = None
    raw_text = ""

    for attempt in range(1, max_retries + 1):
        start = time.time()
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temp,
                response_format=response_format,
                max_tokens=max_tokens,
            )
            latency = round(time.time() - start, 3)
            raw_text = response.choices[0].message.content or ""

            # Track usage
            usage = response.usage
            if usage:
                _usage_tracker.record(model, usage.prompt_tokens, usage.completion_tokens)
                logger.info(
                    f"[Qwen] model={model} task={task_type} attempt={attempt} "
                    f"latency={latency}s prompt_tok={usage.prompt_tokens} "
                    f"comp_tok={usage.completion_tokens}"
                )

            # Parse JSON
            parsed = _extract_json(raw_text)
            if parsed is not None:
                logger.info(f"[Qwen] ✅ Valid JSON returned (task={task_type}, model={model})")
                return parsed

            # JSON invalid — retry
            logger.warning(
                f"[Qwen] ⚠️ Invalid JSON on attempt {attempt}/{max_retries} "
                f"(task={task_type}, model={model}). Will retry."
            )
            last_error = QwenParsingError(
                f"Malformed JSON on attempt {attempt}", raw_response=raw_text, model=model
            )

        except (APITimeoutError, RateLimitError) as e:
            latency = round(time.time() - start, 3)
            backoff = 2 ** attempt
            logger.warning(
                f"[Qwen] ⚠️ Transient error on attempt {attempt}/{max_retries}: {e}. "
                f"Backing off {backoff}s."
            )
            last_error = e
            time.sleep(backoff)

        except APIError as e:
            logger.error(f"[Qwen] ❌ API error (attempt {attempt}): {e}")
            last_error = e
            # A 4xx (bad request / auth / invalid param) is deterministic —
            # retrying just burns time and wedged the match path (#127).
            status = getattr(e, "status_code", None)
            if isinstance(status, int) and 400 <= status < 500:
                logger.error(f"[Qwen] Non-retryable {status}; failing fast.")
                break
            if attempt < max_retries:
                time.sleep(2 ** attempt)

    # Exhausted retries
    if isinstance(last_error, QwenParsingError):
        raise last_error
    raise QwenClientError(
        f"Qwen API call failed after {max_retries} retries: {last_error}"
    )


# ---------------------------------------------------------------------------
# JSON Extraction Helpers
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Attempt to parse a JSON dict from raw LLM output.

    Handles common issues: markdown fences, leading/trailing text.
    """
    text = text.strip()

    # Strip markdown code fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # Try direct parse
    try:
        result = json.loads(text)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        pass

    # Try to find first { ... } block
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass

    return None
