import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, BrainCircuit, Activity, ShieldCheck, Eye } from 'lucide-react';
import { restClient } from '@/utils/api';
import { useSearchParams } from 'react-router-dom';

interface VideoInterviewRoomProps {
    sessionId: string;
    onEnd: () => void;
    isObserver?: boolean;
}

const VideoInterviewRoom: React.FC<VideoInterviewRoomProps> = ({ sessionId, onEnd, isObserver: isObserverProp }) => {
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    // Support observer mode via prop OR via URL query param ?role=observer
    const isObserver = isObserverProp ?? searchParams.get('role') === 'observer';
    const [isJoined, setIsJoined] = useState(false);
    const [micOn, setMicOn] = useState(!isObserver);
    const [cameraOn, setCameraOn] = useState(!isObserver);
    const [analysis, setAnalysis] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Simulate connection
        const startSession = async () => {
            // In a real app, we would connect to WebRTC here
            console.log(`Connecting to session ${sessionId}`);
        };

        startSession();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sessionId]);

    useEffect(() => {
        if (isJoined) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);

                // Simulate real-time analysis updates
                if (elapsedTime % 5 === 0) {
                    fetchAnalysis();
                }
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isJoined, elapsedTime]);

    const fetchAnalysis = async () => {
        // Simulate receiving analysis data
        setAnalysis({
            speech_quality: 85 + Math.random() * 10,
            sentiment: 'Positive',
            engagement: 90 + Math.random() * 5,
            confidence: 88 + Math.random() * 5,
            topics: ['Technical Skills', 'Leadership', 'Problem Solving']
        });
    };

    const handleJoin = () => {
        setIsJoined(true);
        toast({
            title: 'Joined Session',
            description: 'You are now connected to the interview room.',
        });
    };

    const handleEndCall = async () => {
        toast({
            title: 'Interview Ended',
            description: 'Session recording saved and analysis generating.',
        });
        onEnd();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isJoined) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] bg-slate-900 text-white rounded-lg p-8 border border-slate-800">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Ready to join?</h2>
                    <p className="text-slate-400">Session ID: {sessionId}</p>
                    {isObserver && (
                        <Badge variant="outline" className="mt-3 border-amber-500/50 text-amber-400 bg-amber-500/10">
                            <Eye className="h-3 w-3 mr-1" /> Observer Mode — View Only
                        </Badge>
                    )}
                </div>
                {!isObserver && (
                    <div className="flex gap-4 mb-8">
                        <Button variant={micOn ? "secondary" : "destructive"} size="icon" onClick={() => setMicOn(!micOn)} className="rounded-full h-12 w-12">
                            {micOn ? <Mic /> : <MicOff />}
                        </Button>
                        <Button variant={cameraOn ? "secondary" : "destructive"} size="icon" onClick={() => setCameraOn(!cameraOn)} className="rounded-full h-12 w-12">
                            {cameraOn ? <Video /> : <VideoOff />}
                        </Button>
                    </div>
                )}
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleJoin}>
                    {isObserver ? 'Join as Observer' : 'Join Interview'}
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[700px]">
            {/* Main Video Area */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="relative flex-1 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-xl">
                    {/* Remote Video Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <User className="h-24 w-24 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500">Candidate Video Stream</p>
                            <Badge variant="outline" className="mt-2 border-slate-700 text-slate-400">
                                <ShieldCheck className="h-3 w-3 mr-1" /> Encrypted
                            </Badge>
                        </div>
                    </div>

                    {/* Local Video Pip */}
                    <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-lg border border-slate-700 shadow-lg flex items-center justify-center overflow-hidden">
                        {cameraOn ? (
                            <div className="bg-slate-700 w-full h-full flex items-center justify-center">
                                <User className="h-8 w-8 text-slate-500" />
                            </div>
                        ) : (
                            <div className="bg-black w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                Camera Off
                            </div>
                        )}
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 p-3 rounded-full backdrop-blur-sm border border-slate-700">
                        {isObserver ? (
                            <>
                                <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 px-3 py-1">
                                    <Eye className="h-3 w-3 mr-1.5" /> Observer Mode
                                </Badge>
                                <Button variant="destructive" size="icon" onClick={handleEndCall} className="rounded-full">
                                    <PhoneOff />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant={micOn ? "ghost" : "destructive"} size="icon" onClick={() => setMicOn(!micOn)} className="rounded-full text-white hover:bg-slate-700">
                                    {micOn ? <Mic /> : <MicOff />}
                                </Button>
                                <Button variant={cameraOn ? "ghost" : "destructive"} size="icon" onClick={() => setCameraOn(!cameraOn)} className="rounded-full text-white hover:bg-slate-700">
                                    {cameraOn ? <Video /> : <VideoOff />}
                                </Button>
                                <Button variant="destructive" size="icon" onClick={handleEndCall} className="rounded-full">
                                    <PhoneOff />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Timer */}
                    <div className="absolute top-4 left-4 bg-slate-900/80 px-3 py-1 rounded-full text-white font-mono text-sm border border-slate-700">
                        {formatTime(elapsedTime)}
                    </div>
                </div>
            </div>

            {/* AI Analysis Sidebar */}
            <div className="flex flex-col gap-4">
                <Card className="flex-1 bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BrainCircuit className="h-5 w-5 text-purple-600" />
                            Real-time AI Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {analysis ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Speech Clarity</span>
                                        <span className="font-medium text-green-600">{analysis.speech_quality.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${analysis.speech_quality}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Engagement</span>
                                        <span className="font-medium text-blue-600">{analysis.engagement.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${analysis.engagement}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Confidence</span>
                                        <span className="font-medium text-purple-600">{analysis.confidence.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${analysis.confidence}%` }} />
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Detected Topics</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.topics.map((topic: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="bg-white border-slate-200 text-slate-700">
                                                {topic}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
                                    <Activity className="h-3 w-3 animate-pulse text-green-500" />
                                    Analyzing audio stream...
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Waiting for audio stream...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VideoInterviewRoom;
