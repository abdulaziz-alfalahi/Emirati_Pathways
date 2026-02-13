
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, Loader2, Sparkles, Building } from 'lucide-react';
import { restClient } from '@/utils/api';
import { VideoRoom } from '@/components/common/VideoRoom';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';

export default function CandidateInterviews() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [showCancelled, setShowCancelled] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await restClient.get('/api/video-interview/sessions?role=candidate');
            // Normalize response (backend returns { success: true, sessions: [...] })
            if (res.data.success) {
                setSessions(res.data.sessions || []);
            } else if (Array.isArray(res.data)) {
                // Fallback if backend structure differs
                setSessions(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = (session: any) => {
        // TODO: Check if scheduled time is valid (allow 10 min early)
        setActiveSession(session);
    };

    const handleEndCall = () => {
        setActiveSession(null);
    };

    if (activeSession) {
        return (
            <div className="h-[calc(100vh-100px)]">
                <VideoRoom
                    sessionId={activeSession.id}
                    userId="candidate-me"
                    userName="Candidate"
                    onEndCall={handleEndCall}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Interviews</h2>
                    <p className="text-muted-foreground">Join your scheduled video sessions.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="show-cancelled" checked={showCancelled} onCheckedChange={setShowCancelled} />
                    <label htmlFor="show-cancelled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Show Cancelled
                    </label>
                </div>
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sessions
                        .filter(session => showCancelled || session.status !== 'cancelled')
                        .map((session) => (
                            <Card key={session.id} className={`hover:shadow-md transition-shadow ${session.status === 'cancelled' ? 'opacity-60 bg-slate-50' : ''}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{session.title || session.job_title || 'Interview'}</CardTitle>
                                            <div className="text-sm font-medium text-slate-700 mb-1">{session.job_title}</div>
                                            {(session.company_name || session.recruiter_name) && (
                                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {session.company_name || session.recruiter_name}
                                                </div>
                                            )}
                                            <CardDescription>{new Date(session.scheduled_time || session.scheduled_at).toLocaleString()}</CardDescription>
                                        </div>
                                        <Badge variant={
                                            session.status === 'cancelled' ? 'destructive' :
                                                session.status === 'completed' ? 'secondary' :
                                                    'default'
                                        }>
                                            {session.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Expected Duration: {session.duration_minutes || 45} Mins
                                        </div>

                                        {session.ai_analysis && (
                                            <div className="bg-slate-50 p-3 rounded-lg text-sm border">
                                                <div className="flex items-center font-semibold text-purple-600 mb-1">
                                                    <Sparkles className="h-3 w-3 mr-1" /> Feedback
                                                </div>
                                                <p className="line-clamp-2 text-slate-600">
                                                    {session.ai_analysis.summary || "Feedback available."}
                                                </p>
                                            </div>
                                        )}

                                        {session.status !== 'cancelled' && (
                                            <Button className="w-full" onClick={() => handleJoin(session)} disabled={session.status === 'completed'}>
                                                <Video className="mr-2 h-4 w-4" />
                                                {session.status === 'completed' ? 'Completed' : 'Join Call'}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                    {sessions
                        .filter(session => showCancelled || session.status !== 'cancelled')
                        .length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
                                <Video className="h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-1">No Upcoming Interviews</h3>
                                <p className="text-sm text-muted-foreground">
                                    When a recruiter schedules an interview, it will appear here.
                                </p>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}
