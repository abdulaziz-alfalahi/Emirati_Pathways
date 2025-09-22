"""
AI-Monitored Video Interview System
Advanced AI-powered video interview monitoring with real-time analysis and gap assessment
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import base64
import hashlib

# Configure logging
logger = logging.getLogger(__name__)

class InterviewAnalysisType(Enum):
    """Types of AI analysis performed during interviews"""
    SPEECH_ANALYSIS = "speech_analysis"
    FACIAL_EXPRESSION = "facial_expression"
    ENGAGEMENT_LEVEL = "engagement_level"
    CONFIDENCE_ASSESSMENT = "confidence_assessment"
    COMMUNICATION_SKILLS = "communication_skills"
    TECHNICAL_COMPETENCY = "technical_competency"
    CULTURAL_FIT = "cultural_fit"
    LANGUAGE_PROFICIENCY = "language_proficiency"
    BODY_LANGUAGE = "body_language"
    RESPONSE_QUALITY = "response_quality"

class AnalysisMetric(Enum):
    """Specific metrics tracked during analysis"""
    SPEECH_CLARITY = "speech_clarity"
    SPEECH_PACE = "speech_pace"
    VOCAL_CONFIDENCE = "vocal_confidence"
    EYE_CONTACT = "eye_contact"
    FACIAL_ENGAGEMENT = "facial_engagement"
    POSTURE_CONFIDENCE = "posture_confidence"
    GESTURE_APPROPRIATENESS = "gesture_appropriateness"
    RESPONSE_RELEVANCE = "response_relevance"
    TECHNICAL_ACCURACY = "technical_accuracy"
    PROBLEM_SOLVING = "problem_solving"
    CULTURAL_AWARENESS = "cultural_awareness"
    ENGLISH_FLUENCY = "english_fluency"
    ARABIC_USAGE = "arabic_usage"
    PROFESSIONAL_DEMEANOR = "professional_demeanor"

@dataclass
class AnalysisResult:
    """Individual analysis result for a specific metric"""
    metric: AnalysisMetric
    score: float  # 0-100 scale
    confidence: float  # 0-1 scale
    details: str
    timestamp: datetime
    evidence: Dict[str, Any] = None

@dataclass
class InterviewSegment:
    """Represents a segment of the interview for analysis"""
    id: str
    start_time: float  # seconds from interview start
    end_time: float
    question: str
    response: str
    analysis_results: List[AnalysisResult]
    overall_score: float
    key_insights: List[str]
    red_flags: List[str]
    positive_indicators: List[str]

@dataclass
class GapAnalysis:
    """Analysis of gaps between job requirements and candidate performance"""
    skill_gaps: List[Dict[str, Any]]
    experience_gaps: List[Dict[str, Any]]
    cultural_gaps: List[Dict[str, Any]]
    communication_gaps: List[Dict[str, Any]]
    overall_fit_score: float
    development_recommendations: List[str]
    hiring_risk_level: str  # 'low', 'medium', 'high'
    mitigation_strategies: List[str]

@dataclass
class InterviewAssessment:
    """Complete interview assessment with AI analysis"""
    interview_id: str
    candidate_id: str
    job_id: str
    recruiter_id: str
    interview_date: datetime
    duration_minutes: int
    segments: List[InterviewSegment]
    gap_analysis: GapAnalysis
    overall_scores: Dict[InterviewAnalysisType, float]
    final_recommendation: str  # 'strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire'
    confidence_level: float
    key_strengths: List[str]
    key_concerns: List[str]
    next_steps: List[str]
    ai_summary: str
    human_review_required: bool
    metadata: Dict[str, Any]

class AIInterviewMonitor:
    """AI-powered interview monitoring and analysis system"""
    
    def __init__(self):
        self.active_interviews: Dict[str, Dict[str, Any]] = {}
        self.completed_assessments: Dict[str, InterviewAssessment] = {}
        self.analysis_models = self._init_analysis_models()
        self.job_requirements_cache: Dict[str, Dict[str, Any]] = {}
        
    def _init_analysis_models(self) -> Dict[str, Any]:
        """Initialize AI analysis models and configurations"""
        return {
            'speech_analysis': {
                'clarity_threshold': 0.7,
                'pace_optimal_range': (120, 180),  # words per minute
                'confidence_indicators': ['steady_pace', 'clear_articulation', 'appropriate_pauses']
            },
            'facial_expression': {
                'engagement_indicators': ['eye_contact', 'facial_expressions', 'head_movements'],
                'confidence_indicators': ['steady_gaze', 'appropriate_smiling', 'alert_posture']
            },
            'communication_skills': {
                'structure_indicators': ['clear_introduction', 'logical_flow', 'strong_conclusion'],
                'clarity_indicators': ['specific_examples', 'relevant_details', 'concise_responses']
            },
            'technical_competency': {
                'depth_indicators': ['detailed_explanations', 'accurate_terminology', 'practical_examples'],
                'problem_solving': ['systematic_approach', 'alternative_solutions', 'trade_off_analysis']
            },
            'cultural_fit': {
                'uae_awareness': ['local_market_knowledge', 'cultural_sensitivity', 'business_etiquette'],
                'adaptability': ['multicultural_experience', 'flexibility', 'learning_mindset']
            },
            'language_proficiency': {
                'english_fluency': ['grammar_accuracy', 'vocabulary_range', 'pronunciation_clarity'],
                'arabic_usage': ['basic_phrases', 'cultural_context', 'professional_terms']
            }
        }
    
    def start_interview_monitoring(
        self,
        interview_id: str,
        candidate_id: str,
        job_id: str,
        recruiter_id: str,
        job_requirements: Dict[str, Any] = None
    ) -> bool:
        """Start monitoring an interview session"""
        try:
            # Cache job requirements for analysis
            if job_requirements:
                self.job_requirements_cache[job_id] = job_requirements
            
            # Initialize interview monitoring session
            self.active_interviews[interview_id] = {
                'candidate_id': candidate_id,
                'job_id': job_id,
                'recruiter_id': recruiter_id,
                'start_time': datetime.now(),
                'segments': [],
                'real_time_metrics': {},
                'analysis_buffer': [],
                'status': 'active'
            }
            
            logger.info(f"🎥 Started AI monitoring for interview {interview_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error starting interview monitoring: {e}")
            return False
    
    def analyze_interview_segment(
        self,
        interview_id: str,
        segment_data: Dict[str, Any]
    ) -> InterviewSegment:
        """Analyze a specific segment of the interview"""
        try:
            segment_id = f"seg_{uuid.uuid4().hex[:8]}"
            
            # Extract segment information
            start_time = segment_data.get('start_time', 0)
            end_time = segment_data.get('end_time', 0)
            question = segment_data.get('question', '')
            response = segment_data.get('response', '')
            audio_data = segment_data.get('audio_data')
            video_data = segment_data.get('video_data')
            
            # Perform various AI analyses
            analysis_results = []
            
            # Speech Analysis
            if audio_data:
                speech_results = self._analyze_speech(audio_data, response)
                analysis_results.extend(speech_results)
            
            # Facial Expression Analysis
            if video_data:
                facial_results = self._analyze_facial_expressions(video_data)
                analysis_results.extend(facial_results)
            
            # Communication Skills Analysis
            comm_results = self._analyze_communication_skills(question, response)
            analysis_results.extend(comm_results)
            
            # Technical Competency Analysis
            if self._is_technical_question(question):
                tech_results = self._analyze_technical_competency(question, response)
                analysis_results.extend(tech_results)
            
            # Cultural Fit Analysis
            cultural_results = self._analyze_cultural_fit(question, response)
            analysis_results.extend(cultural_results)
            
            # Calculate overall segment score
            overall_score = self._calculate_segment_score(analysis_results)
            
            # Generate insights
            key_insights = self._generate_segment_insights(analysis_results)
            red_flags = self._identify_red_flags(analysis_results)
            positive_indicators = self._identify_positive_indicators(analysis_results)
            
            segment = InterviewSegment(
                id=segment_id,
                start_time=start_time,
                end_time=end_time,
                question=question,
                response=response,
                analysis_results=analysis_results,
                overall_score=overall_score,
                key_insights=key_insights,
                red_flags=red_flags,
                positive_indicators=positive_indicators
            )
            
            # Add to active interview
            if interview_id in self.active_interviews:
                self.active_interviews[interview_id]['segments'].append(segment)
            
            logger.info(f"✅ Analyzed segment {segment_id} - Score: {overall_score:.1f}")
            return segment
            
        except Exception as e:
            logger.error(f"❌ Error analyzing interview segment: {e}")
            raise
    
    def _analyze_speech(self, audio_data: bytes, transcript: str) -> List[AnalysisResult]:
        """Analyze speech patterns and vocal characteristics"""
        results = []
        
        # Simulate speech analysis (in production, use actual speech recognition APIs)
        # Speech Clarity Analysis
        clarity_score = self._calculate_speech_clarity(transcript)
        results.append(AnalysisResult(
            metric=AnalysisMetric.SPEECH_CLARITY,
            score=clarity_score,
            confidence=0.85,
            details=f"Speech clarity assessed based on articulation and pronunciation patterns",
            timestamp=datetime.now(),
            evidence={'transcript_length': len(transcript), 'clarity_indicators': ['clear_articulation']}
        ))
        
        # Speech Pace Analysis
        word_count = len(transcript.split())
        estimated_duration = 30  # seconds (would be calculated from audio)
        words_per_minute = (word_count / estimated_duration) * 60
        pace_score = self._evaluate_speech_pace(words_per_minute)
        
        results.append(AnalysisResult(
            metric=AnalysisMetric.SPEECH_PACE,
            score=pace_score,
            confidence=0.90,
            details=f"Speech pace: {words_per_minute:.1f} WPM (optimal: 120-180 WPM)",
            timestamp=datetime.now(),
            evidence={'words_per_minute': words_per_minute, 'word_count': word_count}
        ))
        
        # Vocal Confidence Analysis
        confidence_score = self._assess_vocal_confidence(transcript)
        results.append(AnalysisResult(
            metric=AnalysisMetric.VOCAL_CONFIDENCE,
            score=confidence_score,
            confidence=0.75,
            details="Vocal confidence assessed based on speech patterns and hesitation markers",
            timestamp=datetime.now(),
            evidence={'hesitation_markers': self._count_hesitations(transcript)}
        ))
        
        return results
    
    def _analyze_facial_expressions(self, video_data: bytes) -> List[AnalysisResult]:
        """Analyze facial expressions and engagement"""
        results = []
        
        # Simulate facial expression analysis (in production, use computer vision APIs)
        # Eye Contact Analysis
        eye_contact_score = 75.0  # Simulated score
        results.append(AnalysisResult(
            metric=AnalysisMetric.EYE_CONTACT,
            score=eye_contact_score,
            confidence=0.80,
            details="Eye contact maintained for majority of responses",
            timestamp=datetime.now(),
            evidence={'eye_contact_percentage': 75, 'gaze_direction': 'camera'}
        ))
        
        # Facial Engagement Analysis
        engagement_score = 82.0  # Simulated score
        results.append(AnalysisResult(
            metric=AnalysisMetric.FACIAL_ENGAGEMENT,
            score=engagement_score,
            confidence=0.85,
            details="High facial engagement with appropriate expressions",
            timestamp=datetime.now(),
            evidence={'smile_frequency': 'appropriate', 'expression_variety': 'good'}
        ))
        
        # Professional Demeanor Analysis
        demeanor_score = 88.0  # Simulated score
        results.append(AnalysisResult(
            metric=AnalysisMetric.PROFESSIONAL_DEMEANOR,
            score=demeanor_score,
            confidence=0.90,
            details="Professional appearance and demeanor maintained throughout",
            timestamp=datetime.now(),
            evidence={'posture': 'upright', 'attire': 'professional', 'background': 'appropriate'}
        ))
        
        return results
    
    def _analyze_communication_skills(self, question: str, response: str) -> List[AnalysisResult]:
        """Analyze communication effectiveness"""
        results = []
        
        # Response Relevance Analysis
        relevance_score = self._assess_response_relevance(question, response)
        results.append(AnalysisResult(
            metric=AnalysisMetric.RESPONSE_RELEVANCE,
            score=relevance_score,
            confidence=0.85,
            details="Response directly addresses the question with relevant examples",
            timestamp=datetime.now(),
            evidence={'question_keywords': self._extract_keywords(question), 'response_keywords': self._extract_keywords(response)}
        ))
        
        # English Fluency Analysis
        fluency_score = self._assess_english_fluency(response)
        results.append(AnalysisResult(
            metric=AnalysisMetric.ENGLISH_FLUENCY,
            score=fluency_score,
            confidence=0.80,
            details="Strong English fluency with good grammar and vocabulary",
            timestamp=datetime.now(),
            evidence={'grammar_errors': 0, 'vocabulary_level': 'advanced', 'sentence_structure': 'complex'}
        ))
        
        return results
    
    def _analyze_technical_competency(self, question: str, response: str) -> List[AnalysisResult]:
        """Analyze technical knowledge and problem-solving"""
        results = []
        
        # Technical Accuracy Analysis
        accuracy_score = self._assess_technical_accuracy(question, response)
        results.append(AnalysisResult(
            metric=AnalysisMetric.TECHNICAL_ACCURACY,
            score=accuracy_score,
            confidence=0.75,
            details="Technical response demonstrates solid understanding of concepts",
            timestamp=datetime.now(),
            evidence={'technical_terms': self._extract_technical_terms(response), 'accuracy_indicators': ['correct_terminology']}
        ))
        
        # Problem Solving Analysis
        problem_solving_score = self._assess_problem_solving(question, response)
        results.append(AnalysisResult(
            metric=AnalysisMetric.PROBLEM_SOLVING,
            score=problem_solving_score,
            confidence=0.80,
            details="Systematic approach to problem-solving with consideration of alternatives",
            timestamp=datetime.now(),
            evidence={'approach_structure': 'systematic', 'alternatives_considered': True}
        ))
        
        return results
    
    def _analyze_cultural_fit(self, question: str, response: str) -> List[AnalysisResult]:
        """Analyze cultural awareness and fit for UAE market"""
        results = []
        
        # Cultural Awareness Analysis
        cultural_score = self._assess_cultural_awareness(response)
        results.append(AnalysisResult(
            metric=AnalysisMetric.CULTURAL_AWARENESS,
            score=cultural_score,
            confidence=0.70,
            details="Demonstrates awareness of multicultural work environment",
            timestamp=datetime.now(),
            evidence={'cultural_references': self._identify_cultural_references(response), 'sensitivity_indicators': ['respectful_language']}
        ))
        
        return results
    
    def complete_interview_analysis(self, interview_id: str) -> InterviewAssessment:
        """Complete the full interview analysis and generate assessment"""
        try:
            if interview_id not in self.active_interviews:
                raise ValueError(f"Interview {interview_id} not found in active interviews")
            
            interview_data = self.active_interviews[interview_id]
            segments = interview_data['segments']
            
            # Calculate overall scores by analysis type
            overall_scores = self._calculate_overall_scores(segments)
            
            # Perform gap analysis
            job_requirements = self.job_requirements_cache.get(interview_data['job_id'], {})
            gap_analysis = self._perform_gap_analysis(segments, job_requirements)
            
            # Generate final recommendation
            final_recommendation = self._generate_final_recommendation(overall_scores, gap_analysis)
            
            # Calculate confidence level
            confidence_level = self._calculate_confidence_level(segments)
            
            # Extract key insights
            key_strengths = self._extract_key_strengths(segments)
            key_concerns = self._extract_key_concerns(segments)
            
            # Generate next steps
            next_steps = self._generate_next_steps(final_recommendation, gap_analysis)
            
            # Generate AI summary
            ai_summary = self._generate_ai_summary(segments, overall_scores, gap_analysis)
            
            # Determine if human review is required
            human_review_required = self._requires_human_review(overall_scores, gap_analysis)
            
            # Create assessment
            assessment = InterviewAssessment(
                interview_id=interview_id,
                candidate_id=interview_data['candidate_id'],
                job_id=interview_data['job_id'],
                recruiter_id=interview_data['recruiter_id'],
                interview_date=interview_data['start_time'],
                duration_minutes=int((datetime.now() - interview_data['start_time']).total_seconds() / 60),
                segments=segments,
                gap_analysis=gap_analysis,
                overall_scores=overall_scores,
                final_recommendation=final_recommendation,
                confidence_level=confidence_level,
                key_strengths=key_strengths,
                key_concerns=key_concerns,
                next_steps=next_steps,
                ai_summary=ai_summary,
                human_review_required=human_review_required,
                metadata={
                    'analysis_version': '1.0',
                    'total_segments': len(segments),
                    'analysis_completion_time': datetime.now().isoformat()
                }
            )
            
            # Store completed assessment
            self.completed_assessments[interview_id] = assessment
            
            # Remove from active interviews
            del self.active_interviews[interview_id]
            
            logger.info(f"✅ Completed interview analysis for {interview_id} - Recommendation: {final_recommendation}")
            return assessment
            
        except Exception as e:
            logger.error(f"❌ Error completing interview analysis: {e}")
            raise
    
    def get_real_time_metrics(self, interview_id: str) -> Dict[str, Any]:
        """Get real-time metrics during an active interview"""
        if interview_id not in self.active_interviews:
            return {}
        
        interview_data = self.active_interviews[interview_id]
        segments = interview_data['segments']
        
        if not segments:
            return {'status': 'no_data', 'segments_analyzed': 0}
        
        # Calculate current metrics
        latest_segment = segments[-1]
        avg_score = sum(seg.overall_score for seg in segments) / len(segments)
        
        # Identify current trends
        recent_scores = [seg.overall_score for seg in segments[-3:]]  # Last 3 segments
        trend = 'stable'
        if len(recent_scores) >= 2:
            if recent_scores[-1] > recent_scores[0] + 5:
                trend = 'improving'
            elif recent_scores[-1] < recent_scores[0] - 5:
                trend = 'declining'
        
        # Count red flags and positive indicators
        total_red_flags = sum(len(seg.red_flags) for seg in segments)
        total_positive_indicators = sum(len(seg.positive_indicators) for seg in segments)
        
        return {
            'status': 'active',
            'segments_analyzed': len(segments),
            'current_average_score': round(avg_score, 1),
            'latest_segment_score': round(latest_segment.overall_score, 1),
            'trend': trend,
            'total_red_flags': total_red_flags,
            'total_positive_indicators': total_positive_indicators,
            'duration_minutes': int((datetime.now() - interview_data['start_time']).total_seconds() / 60),
            'last_updated': datetime.now().isoformat()
        }
    
    # Helper methods for analysis calculations
    def _calculate_speech_clarity(self, transcript: str) -> float:
        """Calculate speech clarity score"""
        # Simulate clarity calculation based on transcript quality
        word_count = len(transcript.split())
        if word_count < 10:
            return 60.0
        
        # Check for clarity indicators
        clarity_score = 70.0
        if len(transcript) > 50:  # Sufficient content
            clarity_score += 10.0
        if '...' not in transcript and 'um' not in transcript.lower():  # No hesitations
            clarity_score += 15.0
        
        return min(100.0, clarity_score)
    
    def _evaluate_speech_pace(self, words_per_minute: float) -> float:
        """Evaluate speech pace score"""
        optimal_min, optimal_max = 120, 180
        
        if optimal_min <= words_per_minute <= optimal_max:
            return 90.0
        elif words_per_minute < optimal_min:
            # Too slow
            return max(50.0, 90.0 - (optimal_min - words_per_minute) * 2)
        else:
            # Too fast
            return max(50.0, 90.0 - (words_per_minute - optimal_max) * 1.5)
    
    def _assess_vocal_confidence(self, transcript: str) -> float:
        """Assess vocal confidence from transcript"""
        confidence_score = 75.0
        
        # Check for confidence indicators
        hesitation_words = ['um', 'uh', 'er', 'like', 'you know']
        hesitation_count = sum(transcript.lower().count(word) for word in hesitation_words)
        
        if hesitation_count == 0:
            confidence_score += 15.0
        elif hesitation_count <= 2:
            confidence_score += 5.0
        else:
            confidence_score -= hesitation_count * 3
        
        # Check for assertive language
        assertive_phrases = ['I believe', 'I am confident', 'I have experience', 'I can']
        assertive_count = sum(transcript.lower().count(phrase) for phrase in assertive_phrases)
        confidence_score += min(10.0, assertive_count * 2)
        
        return max(0.0, min(100.0, confidence_score))
    
    def _count_hesitations(self, transcript: str) -> int:
        """Count hesitation markers in transcript"""
        hesitation_words = ['um', 'uh', 'er', 'like', 'you know', '...']
        return sum(transcript.lower().count(word) for word in hesitation_words)
    
    def _assess_response_relevance(self, question: str, response: str) -> float:
        """Assess how relevant the response is to the question"""
        question_keywords = self._extract_keywords(question)
        response_keywords = self._extract_keywords(response)
        
        if not question_keywords:
            return 70.0
        
        # Calculate keyword overlap
        overlap = len(set(question_keywords) & set(response_keywords))
        relevance_score = (overlap / len(question_keywords)) * 100
        
        # Bonus for response length (indicates thoroughness)
        if len(response.split()) > 20:
            relevance_score += 10.0
        
        return min(100.0, relevance_score)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text"""
        # Simple keyword extraction (in production, use NLP libraries)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'}
        words = [word.lower().strip('.,!?') for word in text.split()]
        return [word for word in words if word not in stop_words and len(word) > 2]
    
    def _assess_english_fluency(self, response: str) -> float:
        """Assess English language fluency"""
        fluency_score = 70.0
        
        # Check sentence structure
        sentences = response.split('.')
        if len(sentences) > 1:  # Multiple sentences
            fluency_score += 10.0
        
        # Check vocabulary diversity
        words = response.split()
        unique_words = set(words)
        if len(unique_words) / len(words) > 0.7:  # Good vocabulary diversity
            fluency_score += 15.0
        
        # Check for complex structures
        complex_indicators = ['because', 'although', 'however', 'therefore', 'moreover']
        if any(indicator in response.lower() for indicator in complex_indicators):
            fluency_score += 10.0
        
        return min(100.0, fluency_score)
    
    def _is_technical_question(self, question: str) -> bool:
        """Determine if a question is technical in nature"""
        technical_keywords = ['code', 'programming', 'algorithm', 'database', 'system', 'architecture', 'technology', 'technical', 'software', 'development']
        return any(keyword in question.lower() for keyword in technical_keywords)
    
    def _assess_technical_accuracy(self, question: str, response: str) -> float:
        """Assess technical accuracy of response"""
        # Simulate technical accuracy assessment
        technical_terms = self._extract_technical_terms(response)
        
        accuracy_score = 70.0
        if len(technical_terms) > 2:  # Uses technical terminology
            accuracy_score += 15.0
        
        if len(response.split()) > 30:  # Detailed response
            accuracy_score += 10.0
        
        return min(100.0, accuracy_score)
    
    def _extract_technical_terms(self, text: str) -> List[str]:
        """Extract technical terms from text"""
        technical_terms = ['api', 'database', 'algorithm', 'framework', 'architecture', 'scalability', 'performance', 'security', 'cloud', 'microservices']
        found_terms = []
        text_lower = text.lower()
        for term in technical_terms:
            if term in text_lower:
                found_terms.append(term)
        return found_terms
    
    def _assess_problem_solving(self, question: str, response: str) -> float:
        """Assess problem-solving approach"""
        problem_solving_score = 70.0
        
        # Check for structured approach
        structure_indicators = ['first', 'second', 'then', 'next', 'finally', 'step']
        if any(indicator in response.lower() for indicator in structure_indicators):
            problem_solving_score += 15.0
        
        # Check for consideration of alternatives
        alternative_indicators = ['alternatively', 'another approach', 'could also', 'option']
        if any(indicator in response.lower() for indicator in alternative_indicators):
            problem_solving_score += 10.0
        
        return min(100.0, problem_solving_score)
    
    def _assess_cultural_awareness(self, response: str) -> float:
        """Assess cultural awareness and sensitivity"""
        cultural_score = 70.0
        
        # Check for multicultural awareness
        multicultural_indicators = ['diverse', 'multicultural', 'international', 'different cultures', 'cultural']
        if any(indicator in response.lower() for indicator in multicultural_indicators):
            cultural_score += 15.0
        
        # Check for respectful language
        respectful_indicators = ['respect', 'understand', 'appreciate', 'value']
        if any(indicator in response.lower() for indicator in respectful_indicators):
            cultural_score += 10.0
        
        return min(100.0, cultural_score)
    
    def _identify_cultural_references(self, response: str) -> List[str]:
        """Identify cultural references in response"""
        cultural_terms = ['culture', 'tradition', 'diversity', 'international', 'multicultural', 'respect', 'understanding']
        found_references = []
        response_lower = response.lower()
        for term in cultural_terms:
            if term in response_lower:
                found_references.append(term)
        return found_references
    
    def _calculate_segment_score(self, analysis_results: List[AnalysisResult]) -> float:
        """Calculate overall score for a segment"""
        if not analysis_results:
            return 0.0
        
        # Weight different metrics
        metric_weights = {
            AnalysisMetric.RESPONSE_RELEVANCE: 0.25,
            AnalysisMetric.TECHNICAL_ACCURACY: 0.20,
            AnalysisMetric.ENGLISH_FLUENCY: 0.15,
            AnalysisMetric.VOCAL_CONFIDENCE: 0.15,
            AnalysisMetric.PROFESSIONAL_DEMEANOR: 0.10,
            AnalysisMetric.CULTURAL_AWARENESS: 0.10,
            AnalysisMetric.PROBLEM_SOLVING: 0.05
        }
        
        weighted_score = 0.0
        total_weight = 0.0
        
        for result in analysis_results:
            weight = metric_weights.get(result.metric, 0.05)  # Default weight
            weighted_score += result.score * weight * result.confidence
            total_weight += weight
        
        return weighted_score / total_weight if total_weight > 0 else 0.0
    
    def _generate_segment_insights(self, analysis_results: List[AnalysisResult]) -> List[str]:
        """Generate insights for a segment"""
        insights = []
        
        for result in analysis_results:
            if result.score >= 85:
                insights.append(f"Strong {result.metric.value.replace('_', ' ')}: {result.details}")
            elif result.score <= 60:
                insights.append(f"Area for improvement in {result.metric.value.replace('_', ' ')}: {result.details}")
        
        return insights
    
    def _identify_red_flags(self, analysis_results: List[AnalysisResult]) -> List[str]:
        """Identify red flags from analysis results"""
        red_flags = []
        
        for result in analysis_results:
            if result.score < 50:
                red_flags.append(f"Low {result.metric.value.replace('_', ' ')} score ({result.score:.1f})")
            elif result.confidence < 0.5:
                red_flags.append(f"Uncertain assessment of {result.metric.value.replace('_', ' ')}")
        
        return red_flags
    
    def _identify_positive_indicators(self, analysis_results: List[AnalysisResult]) -> List[str]:
        """Identify positive indicators from analysis results"""
        positive_indicators = []
        
        for result in analysis_results:
            if result.score >= 85 and result.confidence >= 0.8:
                positive_indicators.append(f"Excellent {result.metric.value.replace('_', ' ')} ({result.score:.1f})")
        
        return positive_indicators
    
    def _calculate_overall_scores(self, segments: List[InterviewSegment]) -> Dict[InterviewAnalysisType, float]:
        """Calculate overall scores by analysis type"""
        overall_scores = {}
        
        # Group results by analysis type
        type_results = {analysis_type: [] for analysis_type in InterviewAnalysisType}
        
        for segment in segments:
            for result in segment.analysis_results:
                # Map metrics to analysis types
                if result.metric in [AnalysisMetric.SPEECH_CLARITY, AnalysisMetric.SPEECH_PACE, AnalysisMetric.VOCAL_CONFIDENCE]:
                    type_results[InterviewAnalysisType.SPEECH_ANALYSIS].append(result.score)
                elif result.metric in [AnalysisMetric.EYE_CONTACT, AnalysisMetric.FACIAL_ENGAGEMENT]:
                    type_results[InterviewAnalysisType.FACIAL_EXPRESSION].append(result.score)
                elif result.metric in [AnalysisMetric.RESPONSE_RELEVANCE, AnalysisMetric.ENGLISH_FLUENCY]:
                    type_results[InterviewAnalysisType.COMMUNICATION_SKILLS].append(result.score)
                elif result.metric in [AnalysisMetric.TECHNICAL_ACCURACY, AnalysisMetric.PROBLEM_SOLVING]:
                    type_results[InterviewAnalysisType.TECHNICAL_COMPETENCY].append(result.score)
                elif result.metric in [AnalysisMetric.CULTURAL_AWARENESS]:
                    type_results[InterviewAnalysisType.CULTURAL_FIT].append(result.score)
        
        # Calculate averages
        for analysis_type, scores in type_results.items():
            if scores:
                overall_scores[analysis_type] = sum(scores) / len(scores)
            else:
                overall_scores[analysis_type] = 0.0
        
        return overall_scores
    
    def _perform_gap_analysis(self, segments: List[InterviewSegment], job_requirements: Dict[str, Any]) -> GapAnalysis:
        """Perform comprehensive gap analysis"""
        # Extract candidate performance data
        candidate_skills = self._extract_demonstrated_skills(segments)
        candidate_experience = self._extract_demonstrated_experience(segments)
        
        # Compare with job requirements
        required_skills = job_requirements.get('skills', [])
        required_experience = job_requirements.get('experience', [])
        
        # Identify gaps
        skill_gaps = []
        for skill in required_skills:
            if skill.lower() not in [s.lower() for s in candidate_skills]:
                skill_gaps.append({
                    'skill': skill,
                    'severity': 'high',
                    'evidence': 'Not demonstrated during interview'
                })
        
        experience_gaps = []
        for exp in required_experience:
            # Simplified experience gap analysis
            experience_gaps.append({
                'requirement': exp,
                'gap_level': 'medium',
                'evidence': 'Limited discussion of relevant experience'
            })
        
        # Cultural and communication gaps
        cultural_gaps = self._assess_cultural_gaps(segments)
        communication_gaps = self._assess_communication_gaps(segments)
        
        # Calculate overall fit score
        overall_fit_score = self._calculate_fit_score(skill_gaps, experience_gaps, cultural_gaps, communication_gaps)
        
        # Generate recommendations
        development_recommendations = self._generate_development_recommendations(skill_gaps, experience_gaps)
        
        # Assess hiring risk
        hiring_risk_level = self._assess_hiring_risk(overall_fit_score, skill_gaps)
        
        # Generate mitigation strategies
        mitigation_strategies = self._generate_mitigation_strategies(skill_gaps, hiring_risk_level)
        
        return GapAnalysis(
            skill_gaps=skill_gaps,
            experience_gaps=experience_gaps,
            cultural_gaps=cultural_gaps,
            communication_gaps=communication_gaps,
            overall_fit_score=overall_fit_score,
            development_recommendations=development_recommendations,
            hiring_risk_level=hiring_risk_level,
            mitigation_strategies=mitigation_strategies
        )
    
    def _extract_demonstrated_skills(self, segments: List[InterviewSegment]) -> List[str]:
        """Extract skills demonstrated during the interview"""
        skills = []
        for segment in segments:
            # Extract technical terms and skills mentioned
            skills.extend(self._extract_technical_terms(segment.response))
        return list(set(skills))  # Remove duplicates
    
    def _extract_demonstrated_experience(self, segments: List[InterviewSegment]) -> List[str]:
        """Extract experience demonstrated during the interview"""
        experience = []
        for segment in segments:
            # Look for experience indicators
            if 'experience' in segment.response.lower() or 'worked' in segment.response.lower():
                experience.append(f"Experience mentioned in response to: {segment.question[:50]}...")
        return experience
    
    def _assess_cultural_gaps(self, segments: List[InterviewSegment]) -> List[Dict[str, Any]]:
        """Assess cultural fit gaps"""
        cultural_gaps = []
        
        # Check for cultural awareness demonstration
        cultural_mentions = 0
        for segment in segments:
            if any(term in segment.response.lower() for term in ['culture', 'multicultural', 'diverse']):
                cultural_mentions += 1
        
        if cultural_mentions == 0:
            cultural_gaps.append({
                'gap': 'Limited cultural awareness demonstration',
                'severity': 'medium',
                'recommendation': 'Assess cultural fit through additional questions'
            })
        
        return cultural_gaps
    
    def _assess_communication_gaps(self, segments: List[InterviewSegment]) -> List[Dict[str, Any]]:
        """Assess communication skill gaps"""
        communication_gaps = []
        
        # Analyze communication patterns across segments
        avg_response_length = sum(len(seg.response.split()) for seg in segments) / len(segments) if segments else 0
        
        if avg_response_length < 15:
            communication_gaps.append({
                'gap': 'Brief responses may indicate limited communication depth',
                'severity': 'medium',
                'recommendation': 'Encourage more detailed responses in future interactions'
            })
        
        return communication_gaps
    
    def _calculate_fit_score(self, skill_gaps: List, experience_gaps: List, cultural_gaps: List, communication_gaps: List) -> float:
        """Calculate overall candidate fit score"""
        base_score = 100.0
        
        # Deduct points for gaps
        base_score -= len(skill_gaps) * 10  # 10 points per skill gap
        base_score -= len(experience_gaps) * 5  # 5 points per experience gap
        base_score -= len(cultural_gaps) * 8  # 8 points per cultural gap
        base_score -= len(communication_gaps) * 6  # 6 points per communication gap
        
        return max(0.0, base_score)
    
    def _generate_development_recommendations(self, skill_gaps: List, experience_gaps: List) -> List[str]:
        """Generate development recommendations"""
        recommendations = []
        
        if skill_gaps:
            recommendations.append(f"Consider training in {len(skill_gaps)} identified skill areas")
        
        if experience_gaps:
            recommendations.append("Provide mentoring and guidance in areas with limited experience")
        
        recommendations.append("Regular performance reviews to track development progress")
        
        return recommendations
    
    def _assess_hiring_risk(self, fit_score: float, skill_gaps: List) -> str:
        """Assess hiring risk level"""
        if fit_score >= 80 and len(skill_gaps) <= 1:
            return 'low'
        elif fit_score >= 65 and len(skill_gaps) <= 3:
            return 'medium'
        else:
            return 'high'
    
    def _generate_mitigation_strategies(self, skill_gaps: List, risk_level: str) -> List[str]:
        """Generate risk mitigation strategies"""
        strategies = []
        
        if risk_level == 'high':
            strategies.append("Implement comprehensive onboarding program")
            strategies.append("Assign experienced mentor for first 6 months")
            strategies.append("Provide additional training in identified gap areas")
        elif risk_level == 'medium':
            strategies.append("Standard onboarding with focus on gap areas")
            strategies.append("Regular check-ins during probation period")
        else:
            strategies.append("Standard onboarding process")
        
        return strategies
    
    def _generate_final_recommendation(self, overall_scores: Dict, gap_analysis: GapAnalysis) -> str:
        """Generate final hiring recommendation"""
        avg_score = sum(overall_scores.values()) / len(overall_scores) if overall_scores else 0
        fit_score = gap_analysis.overall_fit_score
        
        if avg_score >= 85 and fit_score >= 80:
            return 'strong_hire'
        elif avg_score >= 75 and fit_score >= 70:
            return 'hire'
        elif avg_score >= 65 and fit_score >= 60:
            return 'maybe'
        elif avg_score >= 50 and fit_score >= 50:
            return 'no_hire'
        else:
            return 'strong_no_hire'
    
    def _calculate_confidence_level(self, segments: List[InterviewSegment]) -> float:
        """Calculate confidence level of the assessment"""
        if not segments:
            return 0.0
        
        # Base confidence on number of segments and analysis quality
        segment_count_factor = min(1.0, len(segments) / 5)  # Optimal: 5+ segments
        
        # Average confidence from individual results
        all_confidences = []
        for segment in segments:
            for result in segment.analysis_results:
                all_confidences.append(result.confidence)
        
        avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0.5
        
        return (segment_count_factor * 0.4 + avg_confidence * 0.6)
    
    def _extract_key_strengths(self, segments: List[InterviewSegment]) -> List[str]:
        """Extract key strengths from interview"""
        strengths = []
        
        for segment in segments:
            strengths.extend(segment.positive_indicators)
        
        # Remove duplicates and return top strengths
        unique_strengths = list(set(strengths))
        return unique_strengths[:5]  # Top 5 strengths
    
    def _extract_key_concerns(self, segments: List[InterviewSegment]) -> List[str]:
        """Extract key concerns from interview"""
        concerns = []
        
        for segment in segments:
            concerns.extend(segment.red_flags)
        
        # Remove duplicates and return top concerns
        unique_concerns = list(set(concerns))
        return unique_concerns[:5]  # Top 5 concerns
    
    def _generate_next_steps(self, recommendation: str, gap_analysis: GapAnalysis) -> List[str]:
        """Generate next steps based on recommendation"""
        next_steps = []
        
        if recommendation in ['strong_hire', 'hire']:
            next_steps.append("Proceed with reference checks")
            next_steps.append("Prepare job offer")
            if gap_analysis.development_recommendations:
                next_steps.append("Plan onboarding to address identified development areas")
        elif recommendation == 'maybe':
            next_steps.append("Conduct additional technical assessment")
            next_steps.append("Schedule follow-up interview with team lead")
            next_steps.append("Check references before final decision")
        else:
            next_steps.append("Send polite rejection email")
            next_steps.append("Keep candidate in talent pool for future opportunities")
        
        return next_steps
    
    def _generate_ai_summary(self, segments: List[InterviewSegment], overall_scores: Dict, gap_analysis: GapAnalysis) -> str:
        """Generate AI-powered interview summary"""
        avg_score = sum(overall_scores.values()) / len(overall_scores) if overall_scores else 0
        
        summary = f"Interview Analysis Summary:\n\n"
        summary += f"Overall Performance: {avg_score:.1f}/100\n"
        summary += f"Candidate Fit Score: {gap_analysis.overall_fit_score:.1f}/100\n"
        summary += f"Hiring Risk Level: {gap_analysis.hiring_risk_level.title()}\n\n"
        
        if gap_analysis.skill_gaps:
            summary += f"Key Skill Gaps: {len(gap_analysis.skill_gaps)} identified\n"
        
        summary += f"Segments Analyzed: {len(segments)}\n"
        summary += f"Development Recommendations: {len(gap_analysis.development_recommendations)} provided\n\n"
        
        summary += "This assessment is based on AI analysis of interview performance across multiple dimensions including communication skills, technical competency, cultural fit, and overall candidate suitability."
        
        return summary
    
    def _requires_human_review(self, overall_scores: Dict, gap_analysis: GapAnalysis) -> bool:
        """Determine if human review is required"""
        avg_score = sum(overall_scores.values()) / len(overall_scores) if overall_scores else 0
        
        # Require human review for edge cases
        if 60 <= avg_score <= 75:  # Borderline cases
            return True
        
        if gap_analysis.hiring_risk_level == 'high':
            return True
        
        if len(gap_analysis.skill_gaps) > 3:  # Many skill gaps
            return True
        
        return False

# Factory function
def get_ai_interview_monitor() -> AIInterviewMonitor:
    """Get AI interview monitor instance"""
    return AIInterviewMonitor()

# Example usage
if __name__ == "__main__":
    monitor = AIInterviewMonitor()
    
    # Start monitoring an interview
    interview_id = "int_12345"
    monitor.start_interview_monitoring(
        interview_id=interview_id,
        candidate_id="cand_001",
        job_id="job_001",
        recruiter_id="rec_001",
        job_requirements={
            'skills': ['Python', 'React', 'AWS'],
            'experience': ['3+ years software development', 'Team leadership']
        }
    )
    
    # Analyze a segment
    segment_data = {
        'start_time': 0,
        'end_time': 30,
        'question': 'Tell me about your experience with Python development',
        'response': 'I have been working with Python for over 4 years, primarily in web development using Django and Flask frameworks. I have built several REST APIs and worked with databases like PostgreSQL.',
        'audio_data': b'simulated_audio_data',
        'video_data': b'simulated_video_data'
    }
    
    segment = monitor.analyze_interview_segment(interview_id, segment_data)
    print(f"Segment analyzed - Score: {segment.overall_score:.1f}")
    
    # Get real-time metrics
    metrics = monitor.get_real_time_metrics(interview_id)
    print(f"Real-time metrics: {metrics}")
    
    # Complete the interview analysis
    assessment = monitor.complete_interview_analysis(interview_id)
    print(f"Final recommendation: {assessment.final_recommendation}")
    print(f"Confidence level: {assessment.confidence_level:.2f}")
    print(f"Key strengths: {assessment.key_strengths}")
    print(f"Key concerns: {assessment.key_concerns}")

