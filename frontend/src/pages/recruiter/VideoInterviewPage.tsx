import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoRoom } from '@/components/common/VideoRoom';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BrainCircuit, Activity, TrendingUp, AlertTriangle, Smile, Frown, Meh, Mic, MicOff } from 'lucide-react';

// ─── AI Analysis Types ────────────────────────────────────────────
interface AnalysisData {
    speech_quality: number;
    sentiment: string;
    sentiment_score: number;
    engagement: number;
    confidence: number;
    topics: string[];
    body_language: string;
    speaking_pace: string;
    filler_word_count: number;
    key_phrases: string[];
    overall_impression?: string;
}

// ─── AI Analysis Sidebar (Web Speech API + Gemini) ────────────────
const AIAnalysisSidebar: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [history, setHistory] = useState<{ time: string; score: number }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [sttSupported, setSttSupported] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef('');
    const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(Date.now());
    const retryCountRef = useRef(0);
    const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
    const stoppedRef = useRef(false); // true = user/component explicitly stopped

    // Initialize Web Speech API
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Web Speech API not supported in this browser');
            setSttSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('🎙️ Speech recognition started');
            retryCountRef.current = 0; // Reset on successful start
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            // Don't auto-restart if explicitly stopped or unmounted
            if (stoppedRef.current || !recognitionRef.current) return;
            
            // Don't restart if too many consecutive failures
            if (retryCountRef.current >= 5) {
                console.warn('🎙️ Too many speech recognition failures, stopping retries');
                return;
            }

            retryCountRef.current += 1;
            // Delay restart by 3 seconds to avoid rapid loop
            restartTimerRef.current = setTimeout(() => {
                if (!stoppedRef.current && recognitionRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        // Already started or other error
                    }
                }
            }, 3000);
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') {
                console.warn('🎙️ Microphone access denied');
                setSttSupported(false);
                stoppedRef.current = true; // Don't retry
            } else if (event.error === 'aborted') {
                // Silently handle — often caused by component re-mount or mic conflict
            } else if (event.error === 'no-speech') {
                // Normal — no speech detected, recognition will auto-end and restart
            } else {
                console.warn('Speech recognition error:', event.error);
            }
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript + ' ';
                }
            }

            if (finalTranscript) {
                transcriptRef.current += finalTranscript;
                setTranscript(transcriptRef.current);
            }
        };

        recognitionRef.current = recognition;
        stoppedRef.current = false;

        // Start listening after a short delay to let VideoRoom claim the mic first
        const startDelay = setTimeout(() => {
            try {
                recognition.start();
            } catch (e) {
                console.warn('Failed to start speech recognition:', e);
            }
        }, 2000);

        // Set up analysis interval — send transcript to Gemini every 30 seconds
        analysisIntervalRef.current = setInterval(() => {
            if (transcriptRef.current.trim().length > 20) {
                analyzeTranscript();
            }
        }, 30000);

        // Also do an initial analysis after 15 seconds if there's content
        const initialTimeout = setTimeout(() => {
            if (transcriptRef.current.trim().length > 10) {
                analyzeTranscript();
            }
        }, 15000);

        return () => {
            stoppedRef.current = true;
            clearTimeout(startDelay);
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            if (recognitionRef.current) {
                try { recognition.stop(); } catch {}
                recognitionRef.current = null;
            }
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
            }
            clearTimeout(initialTimeout);
        };
    }, [sessionId]);

    const analyzeTranscript = useCallback(async () => {
        const currentTranscript = transcriptRef.current.trim();
        if (!currentTranscript || currentTranscript.length < 10 || isAnalyzing) return;

        setIsAnalyzing(true);
        const elapsedMinutes = Math.round((Date.now() - startTimeRef.current) / 60000);

        try {
            const response = await restClient.post(
                `/api/video-interview/sessions/${sessionId}/analyze-transcript`,
                {
                    transcript: currentTranscript,
                    job_title: 'Interview Position',
                    elapsed_minutes: elapsedMinutes
                }
            );

            if (response.data.success && response.data.analysis) {
                const a = response.data.analysis;
                const newAnalysis: AnalysisData = {
                    speech_quality: a.speech_quality ?? 75,
                    engagement: a.engagement ?? 75,
                    confidence: a.confidence ?? 75,
                    sentiment: a.sentiment ?? 'Neutral',
                    sentiment_score: a.sentiment_score ?? 0.6,
                    speaking_pace: a.speaking_pace ?? 'Natural',
                    body_language: a.body_language ?? 'Attentive',
                    filler_word_count: a.filler_word_count ?? 0,
                    topics: a.topics ?? [],
                    key_phrases: a.key_phrases ?? [],
                    overall_impression: a.overall_impression,
                };
                setAnalysis(newAnalysis);

                // Update score history
                setHistory(prev => {
                    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const avgScore = Math.round((newAnalysis.speech_quality + newAnalysis.engagement + newAnalysis.confidence) / 3);
                    const updated = [...prev, { time: now, score: avgScore }];
                    return updated.slice(-8);
                });
            }
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [sessionId, isAnalyzing]);

    const getSentimentIcon = (sentiment: string) => {
        if (['Positive', 'Enthusiastic', 'Confident'].includes(sentiment)) return <Smile className="h-4 w-4 text-green-500" />;
        if (['Neutral', 'Thoughtful'].includes(sentiment)) return <Meh className="h-4 w-4 text-yellow-500" />;
        return <Frown className="h-4 w-4 text-red-500" />;
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-500';
        if (score >= 70) return 'text-blue-500';
        return 'text-yellow-500';
    };

    const getBarColor = (score: number) => {
        if (score >= 85) return 'bg-green-500';
        if (score >= 70) return 'bg-blue-500';
        return 'bg-yellow-500';
    };

    return (
        <div className="flex flex-col gap-3 h-full overflow-y-auto">
            {/* Main Metrics */}
            <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-purple-600" />
                            Real-time AI Analysis
                        </div>
                        <div className="flex items-center gap-1">
                            {isListening ? (
                                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 animate-pulse">
                                    <Mic className="h-3 w-3 mr-1" /> Live
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">
                                    <MicOff className="h-3 w-3 mr-1" /> Off
                                </Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4">
                    {analysis ? (
                        <>
                            {/* Speech Clarity */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Speech Clarity</span>
                                    <span className={`font-semibold ${getScoreColor(analysis.speech_quality)}`}>
                                        {analysis.speech_quality}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${getBarColor(analysis.speech_quality)} transition-all duration-700 ease-out`}
                                        style={{ width: `${analysis.speech_quality}%` }} />
                                </div>
                            </div>

                            {/* Engagement */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Engagement</span>
                                    <span className={`font-semibold ${getScoreColor(analysis.engagement)}`}>
                                        {analysis.engagement}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${getBarColor(analysis.engagement)} transition-all duration-700 ease-out`}
                                        style={{ width: `${analysis.engagement}%` }} />
                                </div>
                            </div>

                            {/* Confidence */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Confidence</span>
                                    <span className={`font-semibold ${getScoreColor(analysis.confidence)}`}>
                                        {analysis.confidence}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${getBarColor(analysis.confidence)} transition-all duration-700 ease-out`}
                                        style={{ width: `${analysis.confidence}%` }} />
                                </div>
                            </div>

                            {/* Sentiment */}
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    {getSentimentIcon(analysis.sentiment)}
                                    <span className="text-sm font-medium text-slate-700">Sentiment</span>
                                </div>
                                <Badge variant="secondary" className="bg-white border border-slate-200">
                                    {analysis.sentiment}
                                </Badge>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            {!sttSupported ? (
                                <>
                                    <MicOff className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Speech recognition not supported.</p>
                                    <p className="text-xs mt-1">Use Chrome or Edge for live analysis.</p>
                                </>
                            ) : isListening ? (
                                <>
                                    <Mic className="h-6 w-6 mx-auto mb-2 opacity-50 animate-pulse text-green-500" />
                                    <p className="text-sm">Listening for speech...</p>
                                    <p className="text-xs mt-1">Start speaking to see AI analysis</p>
                                </>
                            ) : (
                                <>
                                    <Activity className="h-6 w-6 mx-auto mb-2 opacity-50 animate-pulse" />
                                    <p className="text-sm">Initializing AI analysis...</p>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Speaking Insights */}
            {analysis && (
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-sm">
                    <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-teal-600" />
                            Speaking Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                                <span className="text-slate-500 block">Pace</span>
                                <span className="font-medium text-slate-800">{analysis.speaking_pace}</span>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                                <span className="text-slate-500 block">Body Language</span>
                                <span className="font-medium text-slate-800">{analysis.body_language}</span>
                            </div>
                        </div>

                        {analysis.filler_word_count > 2 && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-100">
                                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{analysis.filler_word_count} filler words detected</span>
                            </div>
                        )}

                        {/* Overall Impression */}
                        {analysis.overall_impression && (
                            <div className="p-2 bg-purple-50 rounded-md border border-purple-100 text-xs text-purple-800">
                                <span className="font-semibold block mb-1">AI Impression</span>
                                {analysis.overall_impression}
                            </div>
                        )}

                        {/* Key Phrases */}
                        {analysis.key_phrases.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Key Phrases</h4>
                                <div className="space-y-1">
                                    {analysis.key_phrases.map((phrase, i) => (
                                        <p key={i} className="text-xs text-slate-600 italic bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                            {phrase}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Detected Topics */}
            {analysis && (
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-sm">
                    <CardContent className="px-4 py-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Detected Topics</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.topics.map((topic, i) => (
                                <Badge key={i} variant="secondary" className="bg-white border-slate-200 text-slate-700 text-xs">
                                    {topic}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Overall Score Trend */}
            {history.length > 1 && (
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-sm">
                    <CardContent className="px-4 py-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Score Trend</h4>
                        <div className="flex items-end gap-1 h-12">
                            {history.map((point, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                    <div
                                        className={`w-full rounded-t ${getBarColor(point.score)} transition-all duration-500`}
                                        style={{ height: `${(point.score / 100) * 40}px` }}
                                    />
                                    <span className="text-[8px] text-slate-400">{point.score}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Live Transcript Mini-View */}
            {transcript && (
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-sm">
                    <CardContent className="px-4 py-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Live Transcript</h4>
                        <div className="max-h-20 overflow-y-auto text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                            {transcript.slice(-300)}
                            {transcript.length > 300 && '...'}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                {isAnalyzing ? (
                    <>
                        <BrainCircuit className="h-3 w-3 animate-spin text-purple-500" />
                        Analyzing with AI...
                    </>
                ) : analysis ? (
                    <>
                        <Activity className="h-3 w-3 animate-pulse text-green-500" />
                        Powered by AI • Updates every 30s
                    </>
                ) : isListening ? (
                    <>
                        <Mic className="h-3 w-3 animate-pulse text-green-500" />
                        Listening for speech...
                    </>
                ) : null}
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────
const VideoInterviewPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleEndSession = () => {
        const role = user?.role || user?.user_type || '';
        if (role === 'hr_manager' || role === 'hr') {
            navigate('/hr-dashboard?tab=interviews');
        } else {
            navigate('/recruiter/interviews');
        }
    };

    const handleBack = () => {
        navigate(-1 as any);
    };

    if (!sessionId) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">Invalid Session ID</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 text-white px-4 py-3 border-b border-slate-800/50">
                <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-lg font-bold">Video Interview Session</h1>
                <span className="text-xs text-slate-500 font-mono ml-auto">
                    Session: {sessionId.slice(0, 16)}...
                </span>
            </div>

            {/* Main content: Video + AI Analysis */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 p-4 min-h-0">
                {/* Video Room - takes 3/4 of the space */}
                <div className="lg:col-span-3 min-h-[500px]">
                    <VideoRoom
                        sessionId={sessionId}
                        userId={user?.id?.toString() || 'anonymous'}
                        userName={user?.username || user?.first_name || 'User'}
                        onEndCall={handleEndSession}
                        isRecruiter={user?.role === 'recruiter'}
                    />
                </div>

                {/* AI Analysis Sidebar - takes 1/4 of the space */}
                <div className="lg:col-span-1 lg:pl-4 mt-4 lg:mt-0">
                    <AIAnalysisSidebar sessionId={sessionId} />
                </div>
            </div>
        </div>
    );
};

export default VideoInterviewPage;
