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
import { Calendar, Video, Clock, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

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

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await restClient.get('/api/interviews/sessions/my?role=recruiter');
            if (response.data.success) {
                setSessions(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch interviews", err);
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
                                <TableHead className="text-right">Action</TableHead>
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
