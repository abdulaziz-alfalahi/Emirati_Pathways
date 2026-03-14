import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Calendar, Video, Clock, Users, BarChart3, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import InterviewAnalytics from '@/components/recruiter/interviews/InterviewAnalytics';

interface InterviewSession {
    id: string;
    title: string;
    scheduled_at: string;
    status: string;
    candidate_first_name: string;
    candidate_last_name: string;
    candidate_email: string;
    guest_token: string;
    attendees?: string[]; // stored as JSON string or list depending on backend specific return
}

export const InterviewsTab: React.FC = () => {
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyticsSession, setAnalyticsSession] = useState<InterviewSession | null>(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            // Use the recruiter interviews endpoint which queries interview_schedules table
            // This includes interviews where the user is recruiter OR an invited attendee
            const response = await restClient.get('/api/recruiter/interviews/all');
            if (response.data.success) {
                const interviews = response.data.interviews || response.data.data || [];
                // Map fields to match InterviewSession interface
                const mapped: InterviewSession[] = interviews.map((i: any) => ({
                    id: i.meeting_link?.split('/').pop() || i.interview_id || i.id,
                    title: i.interview_title || i.title || 'Interview',
                    scheduled_at: i.scheduled_date && i.scheduled_time
                        ? `${i.scheduled_date}T${i.scheduled_time}`
                        : i.scheduled_at || '',
                    status: i.status || 'scheduled',
                    candidate_first_name: i.candidate_first_name || '',
                    candidate_last_name: i.candidate_last_name || '',
                    candidate_email: i.candidate_email || '',
                    guest_token: i.guest_token || '',
                    attendees: i.interviewers || i.attendees || [],
                }));
                setSessions(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch interviews", err);
            // Fallback: try the video-interview endpoint
            try {
                const fallbackRes = await restClient.get('/api/video-interview/sessions?role=recruiter');
                if (fallbackRes.data?.success) {
                    setSessions(fallbackRes.data.sessions || fallbackRes.data.data || []);
                }
            } catch { /* ignore fallback error */ }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const navigate = useNavigate();

    const joinInterview = (sessionId: string) => {
        navigate(`/recruiter/video-interview/${sessionId}`);
    };

    // Show analytics view inline
    if (analyticsSession) {
        return (
            <Card className="bg-white shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="sm" onClick={() => setAnalyticsSession(null)} className="text-ehrdc-teal hover:text-ehrdc-teal/80">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Interviews
                        </Button>
                        <h2 className="text-xl font-bold">Interview Analytics</h2>
                        <Badge variant="outline">{analyticsSession.title || 'Interview'}</Badge>
                        {analyticsSession.candidate_first_name && (
                            <Badge variant="secondary">
                                {analyticsSession.candidate_first_name} {analyticsSession.candidate_last_name}
                            </Badge>
                        )}
                    </div>
                    <InterviewAnalytics interviewId={analyticsSession.id} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="font-dubai-bold text-slate-900">Interview Schedule</CardTitle>
                <CardDescription className="font-dubai-medium text-slate-600">
                    Upcoming and past interviews
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-slate-500">Loading schedule...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No Interviews Scheduled</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            Schedule interviews from the "Candidates" tab.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Attendees</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">
                                        {session.title || 'Interview'}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-dubai-bold">{session.candidate_first_name} {session.candidate_last_name}</div>
                                            <div className="text-xs text-slate-500">{session.candidate_email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-slate-600">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {format(new Date(session.scheduled_at), 'MMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center text-slate-500 text-xs mt-1">
                                            <Clock className="h-3 w-3 mr-2" />
                                            {format(new Date(session.scheduled_at), 'h:mm a')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`capitalize ${getStatusColor(session.status)} shadow-none`}>
                                            {session.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {session.attendees && session.attendees.length > 0 ? (
                                            <div className="flex -space-x-2">
                                                {/* Mock avatars or count */}
                                                <Badge variant="outline" className="bg-slate-50">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {Array.isArray(session.attendees) ? session.attendees.length : JSON.parse(String(session.attendees)).length}
                                                </Badge>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {session.status === 'scheduled' && (
                                                <Button
                                                    size="sm"
                                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                                    onClick={() => joinInterview(session.id)}
                                                >
                                                    <Video className="h-4 w-4 mr-1" />
                                                    Join
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setAnalyticsSession(session)}
                                                title="View Analytics"
                                            >
                                                <BarChart3 className="h-4 w-4 mr-1 text-purple-600" />
                                                Analytics
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};
