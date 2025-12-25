
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, Loader2, Sparkles } from 'lucide-react';
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
            const res = await restClient.get('/api/interviews/sessions/my?role=candidate');
            if (res.data.success) {
                setSessions(res.data.data);
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
                                            <CardTitle className="text-lg">Interview</CardTitle>
                                            <CardDescription>{new Date(session.scheduled_at).toLocaleString()}</CardDescription>
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
                                            Expected Duration: 45 Mins
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
                            <div className="col-span-full text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                No upcoming interviews.
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}
