"""
Granite ASR Engine — Core model wrapper for IBM Granite 4.0 1B Speech

Responsibilities:
  - Load model once at startup (bfloat16 on CUDA / float32 on CPU)
  - Single-pass transcription with optional keyword biasing
  - Two-pass analysis: transcribe → extract insights via the same LLM backbone
  - GPU memory management for long sessions
"""

import os
import logging
import time
from typing import List, Optional, Dict, Any, Tuple

import torch
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default keyword dictionary for HR / Emirati context
# ---------------------------------------------------------------------------
DEFAULT_KEYWORDS: List[str] = [
    # Government & Regulatory
    "NAFIS", "MOHRE", "GPSSA", "Tawteen", "Absher", "Hayak",
    "Emiratization", "WPS", "EOS",
    # Major Employers
    "ADNOC", "DEWA", "RTA", "Etisalat", "du", "ENBD", "FAB", "DIB",
    "Mubadala", "ADIA", "Masdar", "Aldar", "Emaar",
    # HR & Competency
    "KPI", "OKR", "agile", "scrum", "probation", "gratuity",
    "stakeholder", "leadership", "teamwork",
    # Cultural
    "mashallah", "inshallah", "alhamdulillah",
]


class GraniteASREngine:
    """
    Wraps `ibm-granite/granite-4.0-1b-speech` for server-side ASR.

    Usage:
        engine = GraniteASREngine()
        engine.load_model()                              # call once
        text = engine.transcribe(audio_tensor)            # per segment
        text, insights = engine.transcribe_with_analysis(audio_tensor)
    """

    MODEL_ID = "ibm-granite/granite-4.0-1b-speech"

    def __init__(
        self,
        device: Optional[str] = None,
        dtype: Optional[torch.dtype] = None,
        max_new_tokens: int = 256,
    ):
        # Device selection
        if device:
            self.device = device
        elif torch.cuda.is_available():
            self.device = "cuda"
        else:
            self.device = "cpu"
            logger.warning("CUDA not available — running on CPU (expect higher latency)")

        # Precision
        if dtype:
            self.torch_dtype = dtype
        elif self.device == "cuda":
            self.torch_dtype = torch.bfloat16
        else:
            self.torch_dtype = torch.float32

        self.max_new_tokens = max_new_tokens
        self.model = None
        self.processor = None
        self.tokenizer = None
        self._loaded = False

        # Counters for memory management
        self._segments_since_gc = 0
        self._gc_interval = 60  # empty CUDA cache every N segments

    # ------------------------------------------------------------------
    # Model lifecycle
    # ------------------------------------------------------------------

    def load_model(self) -> None:
        """Load model + processor into memory. Call once at server startup."""
        if self._loaded:
            logger.info("Model already loaded — skipping")
            return

        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor

        logger.info(
            "Loading %s on %s (%s) …",
            self.MODEL_ID, self.device, self.torch_dtype,
        )
        t0 = time.time()

        self.processor = AutoProcessor.from_pretrained(self.MODEL_ID)
        self.tokenizer = self.processor.tokenizer

        self.model = AutoModelForSpeechSeq2Seq.from_pretrained(
            self.MODEL_ID,
            device_map=self.device,
            torch_dtype=self.torch_dtype,
        )
        self.model.eval()

        elapsed = time.time() - t0
        logger.info("Model loaded in %.1f s", elapsed)
        self._loaded = True

    def unload_model(self) -> None:
        """Release model from GPU memory."""
        if self.model is not None:
            del self.model
            self.model = None
        if self.processor is not None:
            del self.processor
            self.processor = None
        self.tokenizer = None
        self._loaded = False

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("Model unloaded")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    # ------------------------------------------------------------------
    # Transcription (Pass 1)
    # ------------------------------------------------------------------

    def transcribe(
        self,
        audio: torch.Tensor,
        sample_rate: int = 16_000,
        keywords: Optional[List[str]] = None,
    ) -> str:
        """
        Transcribe a single audio segment.

        Args:
            audio: 1-D float tensor of shape (num_samples,) at 16 kHz.
            sample_rate: Must be 16000.
            keywords: Optional keyword list for biased decoding.

        Returns:
            Transcribed text string.
        """
        self._assert_loaded()

        if audio.ndim == 2:
            audio = audio.squeeze(0)  # (1, N) → (N,)

        # Build the user prompt
        prompt_text = "<|audio|>can you transcribe the speech into a written format?"
        if keywords:
            kw_str = ", ".join(keywords)
            prompt_text += f" Keywords: {kw_str}"

        chat = [{"role": "user", "content": prompt_text}]
        prompt = self.tokenizer.apply_chat_template(
            chat, tokenize=False, add_generation_prompt=True
        )

        # Processor expects (1, N) waveform
        audio_input = audio.unsqueeze(0) if audio.ndim == 1 else audio
        model_inputs = self.processor(
            prompt, audio_input, device=self.device, return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            output_ids = self.model.generate(
                **model_inputs,
                max_new_tokens=self.max_new_tokens,
                do_sample=False,
                num_beams=1,  # greedy for lowest latency
            )

        # Strip input tokens to get only generated text
        num_input_tokens = model_inputs["input_ids"].shape[-1]
        new_tokens = output_ids[0, num_input_tokens:].unsqueeze(0)
        text = self.tokenizer.batch_decode(
            new_tokens, add_special_tokens=False, skip_special_tokens=True
        )[0].strip()

        self._maybe_gc()
        return text

    # ------------------------------------------------------------------
    # Two-Pass Analysis (Pass 1: transcribe + Pass 2: extract insights)
    # ------------------------------------------------------------------

    def transcribe_with_analysis(
        self,
        audio: torch.Tensor,
        sample_rate: int = 16_000,
        keywords: Optional[List[str]] = None,
        job_title: Optional[str] = None,
        competencies: Optional[List[str]] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Two-pass pipeline using shared weights:
          Pass 1 — ASR: audio → transcript
          Pass 2 — NLU: transcript → structured insights (no audio reload)

        Returns:
            (transcript_text, insights_dict)
        """
        # --- Pass 1: Transcription ---
        transcript = self.transcribe(audio, sample_rate, keywords)

        if not transcript:
            return "", self._empty_insights()

        # --- Pass 2: Insight extraction via the text-only LLM backbone ---
        insights = self._extract_insights(transcript, job_title, competencies)

        return transcript, insights

    def _extract_insights(
        self,
        transcript: str,
        job_title: Optional[str] = None,
        competencies: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Use the Granite LLM backbone (text-only, no audio) to extract
        structured interview insights from a transcript segment.
        Reuses the already-loaded model weights — no second model.
        """
        self._assert_loaded()

        comp_list = ", ".join(competencies or [
            "leadership", "communication", "problem-solving",
            "teamwork", "adaptability", "technical expertise",
        ])
        role_ctx = f" for the role of {job_title}" if job_title else ""

        analysis_prompt = (
            f"Analyze this interview transcript segment{role_ctx}. "
            f"Identify: (1) key competencies demonstrated from [{comp_list}], "
            f"(2) overall sentiment (positive/neutral/negative), "
            f"(3) confidence level (high/medium/low), "
            f"(4) any key skills or certifications mentioned, "
            f"(5) notable strengths or concerns. "
            f"Respond in JSON.\n\nTRANSCRIPT:\n\"{transcript}\""
        )

        chat = [{"role": "user", "content": analysis_prompt}]
        prompt = self.tokenizer.apply_chat_template(
            chat, tokenize=False, add_generation_prompt=True
        )

        # Text-only — no audio input
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)

        try:
            with torch.no_grad():
                output_ids = self.model.generate(
                    input_ids=inputs["input_ids"],
                    attention_mask=inputs["attention_mask"],
                    max_new_tokens=300,
                    do_sample=False,
                    num_beams=1,
                )

            num_input = inputs["input_ids"].shape[-1]
            new_tokens = output_ids[0, num_input:].unsqueeze(0)
            raw = self.tokenizer.batch_decode(
                new_tokens, skip_special_tokens=True
            )[0].strip()

            # Try to parse JSON from the output
            import json
            # Find JSON block in the output
            json_start = raw.find("{")
            json_end = raw.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(raw[json_start:json_end])
            else:
                return self._fallback_insights(transcript)

        except Exception as e:
            logger.warning("Pass-2 analysis failed: %s — using heuristic fallback", e)
            return self._fallback_insights(transcript)

    # ------------------------------------------------------------------
    # Heuristic Fallback (when model pass-2 fails)
    # ------------------------------------------------------------------

    @staticmethod
    def _fallback_insights(transcript: str) -> Dict[str, Any]:
        """
        Rule-based fallback when the LLM pass-2 doesn't produce valid JSON.
        """
        words = transcript.lower().split()
        word_count = len(words)

        # Simple keyword matching for competencies
        competency_keywords = {
            "leadership": ["lead", "leading", "managed", "directed", "oversaw"],
            "communication": ["communicated", "presented", "explained", "discussed"],
            "problem-solving": ["solved", "resolved", "debugged", "fixed", "analysed"],
            "teamwork": ["team", "collaborated", "together", "group"],
            "technical": ["developed", "built", "implemented", "coded", "engineered"],
            "adaptability": ["adapted", "flexible", "pivoted", "adjusted"],
        }

        detected = []
        for comp, kws in competency_keywords.items():
            if any(kw in words for kw in kws):
                detected.append(comp)

        return {
            "competencies": detected,
            "sentiment": "positive" if word_count > 10 else "neutral",
            "confidence": "medium",
            "skills_mentioned": [],
            "notes": "Heuristic analysis (model pass-2 unavailable)",
        }

    @staticmethod
    def _empty_insights() -> Dict[str, Any]:
        return {
            "competencies": [],
            "sentiment": "neutral",
            "confidence": "low",
            "skills_mentioned": [],
            "notes": "No speech detected",
        }

    # ------------------------------------------------------------------
    # Memory management
    # ------------------------------------------------------------------

    def _maybe_gc(self) -> None:
        """Periodically free unused GPU memory."""
        self._segments_since_gc += 1
        if self._segments_since_gc >= self._gc_interval:
            self._segments_since_gc = 0
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                logger.debug("CUDA cache cleared (every %d segments)", self._gc_interval)

    def _assert_loaded(self) -> None:
        if not self._loaded:
            raise RuntimeError(
                "Model not loaded. Call engine.load_model() first."
            )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def get_status(self) -> Dict[str, Any]:
        """Return engine status for the /health endpoint."""
        gpu_mem = {}
        if torch.cuda.is_available():
            gpu_mem = {
                "allocated_mb": round(torch.cuda.memory_allocated() / 1e6, 1),
                "reserved_mb": round(torch.cuda.memory_reserved() / 1e6, 1),
            }

        return {
            "model_id": self.MODEL_ID,
            "loaded": self._loaded,
            "device": self.device,
            "dtype": str(self.torch_dtype),
            "segments_processed": self._segments_since_gc,
            "gpu_memory": gpu_mem,
        }
