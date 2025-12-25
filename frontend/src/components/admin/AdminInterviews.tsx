import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Video, Monitor, User, Filter, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { restClient } from '@/utils/api';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { VideoRoom } from '@/components/common/VideoRoom';

interface Session {
    id: string;
    recruiter_first_name?: string;
    recruiter_last_name?: string;
    candidate_first_name?: string;
    candidate_last_name?: string;
    scheduled_at: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    candidate_id: string;
    recruiter_id: number;
}

const AdminInterviews = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [hideCancelled, setHideCancelled] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await restClient.get('/api/interviews/sessions/admin/all');
            if (res.data.success) {
                setSessions(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Interview Monitoring</h2>
                    <p className="text-muted-foreground">Monitor ongoing interviews and review session history.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="hide-cancelled"
                            checked={hideCancelled}
                            onCheckedChange={setHideCancelled}
                        />
                        <Label htmlFor="hide-cancelled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Hide Cancelled
                        </Label>
                    </div>
                    <Button onClick={fetchSessions} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh List
                    </Button>
                </div>
            </div>

            {activeSession && (
                <Dialog open={!!activeSession} onOpenChange={(open) => !open && setActiveSession(null)}>
                    <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-slate-950 border-slate-800">
                        <VideoRoom
                            sessionId={activeSession.id}
                            userId="admin-observer" // Fixed ID for admin
                            userName="Admin Observer"
                            onEndCall={() => setActiveSession(null)}
                            isObserver={true} // Enable Observer Mode
                        />
                    </DialogContent>
                </Dialog>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions
                    .filter(session => !hideCancelled || session.status !== 'cancelled')
                    .map((session) => (
                        <Card key={session.id} className="overflow-hidden">
                            <CardHeader className="pb-3 bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className={getStatusColor(session.status)}>
                                        {session.status === 'active' ? 'ONGOING' : session.status.toUpperCase()}
                                    </Badge>
                                    {session.status === 'scheduled' || session.status === 'active' ? ( // Admin can monitor scheduled too if they start early
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-7 text-xs"
                                            onClick={() => setActiveSession(session)}
                                        >
                                            <Monitor className="h-3 w-3 mr-1" />
                                            Monitor
                                        </Button>
                                    ) : null}
                                </div>
                                <CardTitle className="text-lg mt-2 flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {session.candidate_first_name || 'Candidate'} {session.candidate_last_name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    with Recruiter: {session.recruiter_first_name || 'Recruiter'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4 opacity-70" />
                                        {new Date(session.scheduled_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <Clock className="mr-2 h-4 w-4 opacity-70" />
                                        {new Date(session.scheduled_at).toLocaleTimeString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                {sessions.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <Video className="mx-auto h-12 w-12 opacity-20 mb-3" />
                        <h3 className="text-lg font-medium">No Interviews Found</h3>
                        <p>There are no ongoing, scheduled, or past interviews in the system.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminInterviews;
