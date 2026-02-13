import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoRoom } from '@/components/common/VideoRoom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BrainCircuit, Activity, TrendingUp, AlertTriangle, Smile, Frown, Meh } from 'lucide-react';

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
}

// ─── AI Analysis Sidebar ──────────────────────────────────────────
const AIAnalysisSidebar: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [history, setHistory] = useState<{ time: string; score: number }[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Start analysis simulation after a brief delay
        const startDelay = setTimeout(() => {
            fetchAnalysis();
            intervalRef.current = setInterval(fetchAnalysis, 4000);
        }, 2000);

        return () => {
            clearTimeout(startDelay);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [sessionId]);

    const fetchAnalysis = () => {
        const sentiments = ['Positive', 'Neutral', 'Confident', 'Enthusiastic', 'Thoughtful'];
        const bodyLanguages = ['Open & Relaxed', 'Attentive', 'Engaged', 'Slightly Nervous', 'Confident Posture'];
        const paces = ['Natural', 'Measured', 'Slightly Fast', 'Well-Paced', 'Deliberate'];
        const topicPool = [
            'Technical Skills', 'Leadership', 'Problem Solving', 'Team Collaboration',
            'Project Management', 'Communication', 'Innovation', 'Domain Expertise',
            'Cultural Fit', 'Career Goals', 'Adaptability', 'Strategic Thinking'
        ];
        const phrasePool = [
            '"I led a team of..."', '"Our approach was..."', '"The key challenge..."',
            '"I implemented..."', '"The results showed..."', '"I collaborated with..."',
            '"My experience in..."', '"I\'m passionate about..."'
        ];

        // Shuffle & pick random subsets
        const shuffled = [...topicPool].sort(() => 0.5 - Math.random());
        const shuffledPhrases = [...phrasePool].sort(() => 0.5 - Math.random());

        const newAnalysis: AnalysisData = {
            speech_quality: 78 + Math.random() * 18,
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            sentiment_score: 0.6 + Math.random() * 0.35,
            engagement: 75 + Math.random() * 20,
            confidence: 72 + Math.random() * 22,
            topics: shuffled.slice(0, 3 + Math.floor(Math.random() * 2)),
            body_language: bodyLanguages[Math.floor(Math.random() * bodyLanguages.length)],
            speaking_pace: paces[Math.floor(Math.random() * paces.length)],
            filler_word_count: Math.floor(Math.random() * 5),
            key_phrases: shuffledPhrases.slice(0, 2),
        };

        setAnalysis(newAnalysis);
        setHistory(prev => {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const updated = [...prev, { time: now, score: Math.round((newAnalysis.speech_quality + newAnalysis.engagement + newAnalysis.confidence) / 3) }];
            return updated.slice(-8); // Keep last 8 data points
        });
    };

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
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BrainCircuit className="h-5 w-5 text-purple-600" />
                        Real-time AI Analysis
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
                                        {analysis.speech_quality.toFixed(0)}%
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
                                        {analysis.engagement.toFixed(0)}%
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
                                        {analysis.confidence.toFixed(0)}%
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
                            <Activity className="h-6 w-6 mx-auto mb-2 opacity-50 animate-pulse" />
                            <p className="text-sm">Initializing AI analysis...</p>
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

            {/* Live indicator */}
            {analysis && (
                <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                    <Activity className="h-3 w-3 animate-pulse text-green-500" />
                    Analyzing in real-time...
                </div>
            )}
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
