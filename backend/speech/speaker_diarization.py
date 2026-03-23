"""
Speaker Diarization — Lightweight energy-based speaker separation.

Strategy:
  - Turn-taking detection via silence gaps (>500 ms gap = potential speaker change)
  - Labels 2 speakers: A (Interviewer) and B (Interviewee)
  - Heuristic: first speaker after session start is the Interviewer
  - No heavy ML model — purely signal-energy based for real-time use
"""

import logging
from typing import Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SILENCE_THRESHOLD_RMS = 0.015      # RMS below this = "silence"
SPEAKER_CHANGE_GAP_S = 0.5        # 500 ms silence = potential speaker switch
MIN_SPEECH_DURATION_S = 0.3        # Ignore speech segments shorter than this
SAMPLE_RATE = 16_000


class SpeakerDiarizer:
    """
    Lightweight energy-based speaker diarization for 2-party interviews.

    Tracks silence gaps between speech segments and labels alternating
    speakers as Interviewer (A) / Interviewee (B).
    """

    def __init__(
        self,
        silence_threshold: float = SILENCE_THRESHOLD_RMS,
        gap_threshold_s: float = SPEAKER_CHANGE_GAP_S,
        sample_rate: int = SAMPLE_RATE,
    ):
        self.silence_threshold = silence_threshold
        self.gap_threshold_samples = int(gap_threshold_s * sample_rate)
        self.min_speech_samples = int(MIN_SPEECH_DURATION_S * sample_rate)
        self.sample_rate = sample_rate

        # State
        self._current_speaker: str = "A"  # A = Interviewer (speaks first)
        self._silence_counter: int = 0
        self._speech_counter: int = 0
        self._initialized: bool = False
        self._total_switches: int = 0

    def reset(self) -> None:
        """Reset diarizer state for a new session."""
        self._current_speaker = "A"
        self._silence_counter = 0
        self._speech_counter = 0
        self._initialized = False
        self._total_switches = 0

    def process_chunk(self, pcm_chunk: np.ndarray) -> str:
        """
        Process a PCM audio chunk and return the current speaker label.

        Args:
            pcm_chunk: 1-D float32 array of audio samples (16 kHz)

        Returns:
            "A" (Interviewer) or "B" (Interviewee)
        """
        rms = self._compute_rms(pcm_chunk)
        is_speech = rms > self.silence_threshold
        chunk_len = len(pcm_chunk)

        if is_speech:
            self._speech_counter += chunk_len
            # If we had a long silence gap and now speech resumes → switch speaker
            if self._silence_counter >= self.gap_threshold_samples:
                if self._initialized and self._speech_counter >= self.min_speech_samples:
                    self._switch_speaker()
                elif not self._initialized:
                    self._initialized = True

            self._silence_counter = 0
        else:
            self._silence_counter += chunk_len
            if self._speech_counter > 0 and not self._initialized:
                self._initialized = True

        return self._current_speaker

    def get_speaker_label(self) -> str:
        """Get human-readable label for current speaker."""
        return "Interviewer" if self._current_speaker == "A" else "Interviewee"

    def get_stats(self) -> dict:
        return {
            "current_speaker": self._current_speaker,
            "label": self.get_speaker_label(),
            "total_switches": self._total_switches,
            "silence_counter_ms": round(self._silence_counter / self.sample_rate * 1000),
            "speech_counter_ms": round(self._speech_counter / self.sample_rate * 1000),
        }

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _switch_speaker(self) -> None:
        prev = self._current_speaker
        self._current_speaker = "B" if self._current_speaker == "A" else "A"
        self._total_switches += 1
        self._speech_counter = 0
        logger.debug(
            "Speaker switch #%d: %s → %s",
            self._total_switches, prev, self._current_speaker,
        )

    @staticmethod
    def _compute_rms(audio: np.ndarray) -> float:
        """Compute root-mean-square energy of an audio chunk."""
        if len(audio) == 0:
            return 0.0
        return float(np.sqrt(np.mean(audio.astype(np.float64) ** 2)))


class VoiceActivityDetector:
    """
    Simple energy-based VAD for determining speech boundaries.
    Used by the streaming ASR to decide when to trigger transcription.
    """

    def __init__(
        self,
        energy_threshold: float = SILENCE_THRESHOLD_RMS,
        min_speech_s: float = 0.5,
        max_speech_s: float = 15.0,
        silence_timeout_s: float = 1.0,
        sample_rate: int = SAMPLE_RATE,
    ):
        self.energy_threshold = energy_threshold
        self.min_speech_samples = int(min_speech_s * sample_rate)
        self.max_speech_samples = int(max_speech_s * sample_rate)
        self.silence_timeout_samples = int(silence_timeout_s * sample_rate)
        self.sample_rate = sample_rate

        # State
        self._is_speaking = False
        self._speech_samples = 0
        self._silence_samples = 0

    def reset(self) -> None:
        self._is_speaking = False
        self._speech_samples = 0
        self._silence_samples = 0

    def process(self, pcm_chunk: np.ndarray) -> Optional[str]:
        """
        Feed a PCM chunk and return a boundary event if detected.

        Returns:
            "speech_start"  — speech just began
            "speech_end"    — speech segment ended (trigger transcription)
            "force_flush"   — max duration reached (trigger transcription)
            None            — no boundary change
        """
        rms = SpeakerDiarizer._compute_rms(pcm_chunk)
        is_speech = rms > self.energy_threshold
        chunk_len = len(pcm_chunk)

        if is_speech:
            self._silence_samples = 0
            self._speech_samples += chunk_len
            if not self._is_speaking:
                self._is_speaking = True
                return "speech_start"

            # Force flush if segment is too long
            if self._speech_samples >= self.max_speech_samples:
                self._speech_samples = 0
                return "force_flush"

        else:
            self._silence_samples += chunk_len
            if self._is_speaking:
                # Check if silence indicates end of speech
                if self._silence_samples >= self.silence_timeout_samples:
                    if self._speech_samples >= self.min_speech_samples:
                        self._is_speaking = False
                        self._speech_samples = 0
                        self._silence_samples = 0
                        return "speech_end"
                    else:
                        # Too short — discard
                        self._is_speaking = False
                        self._speech_samples = 0
                        self._silence_samples = 0

        return None
