"""
Interview Insight Layer — Live transcript analysis and competency matching.

Processes each finalized transcript segment and produces:
  - Competency matches against a configurable HR competency framework
  - Sentiment classification (positive / neutral / negative)
  - Key moment detection (skills, certifications, red flags)
  - Running aggregate scores for the entire interview
"""

import logging
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Competency Framework
# ---------------------------------------------------------------------------
COMPETENCY_KEYWORDS: Dict[str, List[str]] = {
    "leadership": [
        "lead", "leader", "leadership", "managed", "directed",
        "oversaw", "supervised", "mentored", "guided", "strategic",
        "vision", "initiative", "drove", "spearheaded",
    ],
    "communication": [
        "communicated", "presented", "presented", "articulated",
        "explained", "negotiated", "stakeholder", "collaboration",
        "written", "verbal", "public speaking", "reporting",
    ],
    "problem_solving": [
        "solved", "resolved", "debugged", "fix", "analyzed",
        "diagnosed", "troubleshoot", "optimized", "root cause",
        "critical thinking", "innovative", "creative solution",
    ],
    "teamwork": [
        "team", "collaborated", "together", "cross-functional",
        "group", "cooperative", "peer", "partner", "collective",
    ],
    "adaptability": [
        "adapted", "flexible", "pivoted", "adjusted", "agile",
        "resilient", "change management", "dynamic", "versatile",
    ],
    "technical_expertise": [
        "developed", "built", "implemented", "engineered", "coded",
        "designed", "architected", "deployed", "automated",
        "python", "java", "cloud", "ai", "machine learning", "data",
    ],
    "cultural_awareness": [
        "emiratization", "uae", "emirati", "arabic", "cultural",
        "diversity", "inclusion", "national", "tawteen", "nafis",
    ],
    "customer_focus": [
        "customer", "client", "user", "service", "satisfaction",
        "experience", "feedback", "support", "relationship",
    ],
}

# Sentiment markers
POSITIVE_MARKERS = [
    "excellent", "outstanding", "great", "love", "passionate",
    "excited", "achieved", "successful", "proud", "thrilled",
    "improved", "growth", "opportunity", "motivated",
]
NEGATIVE_MARKERS = [
    "struggled", "difficult", "failed", "unfortunately", "problem",
    "concern", "issue", "frustrated", "unable", "challenge",
    "conflict", "mistake", "weakness",
]
HESITATION_MARKERS = [
    "um", "uh", "like", "you know", "sort of", "kind of",
    "basically", "actually", "i mean", "hmm",
]


@dataclass
class InsightScore:
    """Running aggregate score for an interview session."""
    speech_quality: float = 0.0
    confidence: float = 0.0
    relevance: float = 0.0
    sentiment_balance: float = 0.0  # -1 to +1
    total_segments: int = 0
    competency_hits: Dict[str, int] = field(default_factory=dict)
    key_moments: List[Dict[str, Any]] = field(default_factory=list)
    hesitation_count: int = 0


class InterviewInsightLayer:
    """
    Analyzes transcript segments in real-time to produce
    structured interview insights and running scores.
    """

    def __init__(
        self,
        competency_keywords: Optional[Dict[str, List[str]]] = None,
        job_title: Optional[str] = None,
        target_competencies: Optional[List[str]] = None,
    ):
        self.competency_keywords = competency_keywords or COMPETENCY_KEYWORDS
        self.job_title = job_title
        self.target_competencies = target_competencies or list(
            self.competency_keywords.keys()
        )

        # Running scores per session
        self._scores: Dict[str, InsightScore] = {}

    def get_or_create_score(self, session_id: str) -> InsightScore:
        if session_id not in self._scores:
            self._scores[session_id] = InsightScore()
        return self._scores[session_id]

    def analyze_segment(
        self,
        session_id: str,
        text: str,
        speaker: str = "unknown",
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a single transcript segment and return insights.

        Returns:
            {
                "competencies": ["leadership", "teamwork"],
                "sentiment": "positive",
                "confidence": "high",
                "key_skills": ["Python", "AWS"],
                "flags": ["hesitation_detected"],
                "is_key_moment": True,
                "running_scores": {...}
            }
        """
        score = self.get_or_create_score(session_id)
        score.total_segments += 1

        words_lower = text.lower()
        words = words_lower.split()
        word_count = len(words)

        # 1. Competency matching
        detected_competencies = self._match_competencies(words_lower)
        for comp in detected_competencies:
            score.competency_hits[comp] = score.competency_hits.get(comp, 0) + 1

        # 2. Sentiment analysis
        sentiment = self._classify_sentiment(words_lower, words)

        # Update running sentiment balance
        if sentiment == "positive":
            score.sentiment_balance = min(
                1.0, score.sentiment_balance + 0.1
            )
        elif sentiment == "negative":
            score.sentiment_balance = max(
                -1.0, score.sentiment_balance - 0.15
            )

        # 3. Confidence estimation
        confidence = self._estimate_confidence(words_lower, words, word_count)

        # 4. Key skills / certifications
        key_skills = self._extract_skills(text)

        # 5. Hesitation detection
        flags = []
        hesitations = self._count_hesitations(words_lower)
        if hesitations > 2:
            flags.append("frequent_hesitation")
            score.hesitation_count += hesitations

        # 6. Key moment detection
        is_key_moment = (
            len(detected_competencies) >= 2
            or len(key_skills) >= 1
            or sentiment == "negative"
        )

        if is_key_moment:
            score.key_moments.append({
                "text": text[:200],
                "competencies": detected_competencies,
                "speaker": speaker,
                "timestamp": timestamp,
                "type": "highlight" if sentiment != "negative" else "concern",
            })

        # 7. Update running quality scores
        score.speech_quality = self._update_running_avg(
            score.speech_quality,
            self._score_speech_quality(word_count, hesitations),
            score.total_segments,
        )
        score.confidence = self._update_running_avg(
            score.confidence,
            {"high": 0.9, "medium": 0.6, "low": 0.3}.get(confidence, 0.5),
            score.total_segments,
        )
        score.relevance = self._update_running_avg(
            score.relevance,
            min(1.0, len(detected_competencies) * 0.3 + len(key_skills) * 0.2),
            score.total_segments,
        )

        return {
            "competencies": detected_competencies,
            "sentiment": sentiment,
            "confidence": confidence,
            "key_skills": key_skills,
            "flags": flags,
            "is_key_moment": is_key_moment,
            "running_scores": {
                "speech_quality": round(score.speech_quality, 2),
                "confidence": round(score.confidence, 2),
                "relevance": round(score.relevance, 2),
                "sentiment_balance": round(score.sentiment_balance, 2),
                "segments_analyzed": score.total_segments,
                "top_competencies": sorted(
                    score.competency_hits.items(),
                    key=lambda x: x[1], reverse=True,
                )[:5],
            },
        }

    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Return comprehensive summary for end-of-interview report."""
        score = self._scores.get(session_id)
        if not score:
            return {"error": "No data for session"}

        return {
            "total_segments": score.total_segments,
            "speech_quality": round(score.speech_quality, 2),
            "confidence": round(score.confidence, 2),
            "relevance": round(score.relevance, 2),
            "sentiment_balance": round(score.sentiment_balance, 2),
            "competency_profile": dict(score.competency_hits),
            "key_moments": score.key_moments[-20:],  # Last 20 moments
            "hesitation_rate": round(
                score.hesitation_count / max(score.total_segments, 1), 1
            ),
        }

    def clear_session(self, session_id: str) -> None:
        self._scores.pop(session_id, None)

    # ------------------------------------------------------------------
    # Analysis helpers
    # ------------------------------------------------------------------

    def _match_competencies(self, text_lower: str) -> List[str]:
        matched = []
        for comp, keywords in self.competency_keywords.items():
            if comp not in self.target_competencies:
                continue
            if any(kw in text_lower for kw in keywords):
                matched.append(comp)
        return matched

    @staticmethod
    def _classify_sentiment(text_lower: str, words: List[str]) -> str:
        pos = sum(1 for m in POSITIVE_MARKERS if m in text_lower)
        neg = sum(1 for m in NEGATIVE_MARKERS if m in text_lower)
        if pos > neg + 1:
            return "positive"
        elif neg > pos + 1:
            return "negative"
        return "neutral"

    @staticmethod
    def _estimate_confidence(
        text_lower: str, words: List[str], word_count: int
    ) -> str:
        hesitations = sum(1 for m in HESITATION_MARKERS if m in text_lower)
        hesitation_ratio = hesitations / max(word_count, 1)

        if hesitation_ratio > 0.15:
            return "low"
        elif hesitation_ratio > 0.05:
            return "medium"
        return "high"

    @staticmethod
    def _extract_skills(text: str) -> List[str]:
        """Extract potential skill/certification mentions."""
        # Common tech skills and certifications (case-insensitive search)
        skill_patterns = [
            r"\b(python|java|javascript|typescript|react|angular|vue)\b",
            r"\b(aws|azure|gcp|cloud|docker|kubernetes)\b",
            r"\b(sql|postgresql|mongodb|redis|elasticsearch)\b",
            r"\b(pmp|prince2|itil|cissp|cisa|cfa|cpa)\b",
            r"\b(machine learning|deep learning|nlp|computer vision)\b",
            r"\b(scrum|kanban|agile|devops|ci/cd)\b",
            r"\b(mba|phd|masters|bachelor)\b",
        ]
        found = set()
        for pattern in skill_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            found.update(m.lower() if isinstance(m, str) else m[0].lower() for m in matches)
        return list(found)

    @staticmethod
    def _count_hesitations(text_lower: str) -> int:
        return sum(1 for m in HESITATION_MARKERS if m in text_lower)

    @staticmethod
    def _score_speech_quality(word_count: int, hesitations: int) -> float:
        # Longer, less hesitant speech = higher quality
        base = min(1.0, word_count / 50)  # normalize to ~50 words
        penalty = min(0.5, hesitations * 0.1)
        return max(0.0, base - penalty)

    @staticmethod
    def _update_running_avg(
        current: float, new_value: float, count: int
    ) -> float:
        """Incremental running average."""
        if count <= 1:
            return new_value
        return current + (new_value - current) / count
