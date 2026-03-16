import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Calendar, Clock, Video, Monitor, User, RefreshCw, Search,
    Play, Link2, ChevronDown, ChevronUp, Brain, CheckCircle,
    AlertCircle, XCircle, FileText, ExternalLink, Copy
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { restClient } from '@/utils/api';
import { getPrefixedDisplayName } from '@/utils/nameUtils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VideoRoom } from '@/components/common/VideoRoom';
import { useToast } from '@/components/ui/use-toast';

interface Session {
    id: string;
    recruiter_first_name?: string;
    recruiter_last_name?: string;
    recruiter_name?: string;
    candidate_first_name?: string;
    candidate_last_name?: string;
    candidate_name?: string;
    candidate_email?: string;
    scheduled_at: string;
    ended_at?: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    candidate_id: string;
    recruiter_id: number;
    job_title?: string;
    company_name?: string;
    interview_type?: string;
    duration_minutes?: number;
    ai_analysis?: {
        summary?: string;
        overall_score?: number;
        strengths?: string[];
        areas_for_improvement?: string[];
        recommendation?: string;
        communication_score?: number;
        technical_score?: number;
        cultural_fit_score?: number;
        [key: string]: any;
    };
}

type StatusFilter = 'all' | 'scheduled' | 'active' | 'completed' | 'cancelled';

const AdminInterviews = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await restClient.get('/api/interviews/sessions/admin/all');
            if (res.data.success) {
                setSessions(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setLoading(false);
        }
    };

    // Filtered and searched sessions
    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            // Status filter
            if (statusFilter !== 'all' && session.status !== statusFilter) return false;

            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const candidateName = `${session.candidate_first_name || ''} ${session.candidate_last_name || ''} ${session.candidate_name || ''}`.toLowerCase();
                const recruiterName = `${session.recruiter_first_name || ''} ${session.recruiter_last_name || ''} ${session.recruiter_name || ''}`.toLowerCase();
                const jobTitle = (session.job_title || '').toLowerCase();
                const company = (session.company_name || '').toLowerCase();
                const sessionId = session.id.toLowerCase();

                return candidateName.includes(query) ||
                    recruiterName.includes(query) ||
                    jobTitle.includes(query) ||
                    company.includes(query) ||
                    sessionId.includes(query);
            }
            return true;
        });
    }, [sessions, statusFilter, searchQuery]);

    // Statistics
    const stats = useMemo(() => ({
        total: sessions.length,
        scheduled: sessions.filter(s => s.status === 'scheduled').length,
        active: sessions.filter(s => s.status === 'active').length,
        completed: sessions.filter(s => s.status === 'completed').length,
        cancelled: sessions.filter(s => s.status === 'cancelled').length,
        withAnalysis: sessions.filter(s => s.ai_analysis).length,
    }), [sessions]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Monitor className="h-3 w-3" />;
            case 'scheduled': return <Clock className="h-3 w-3" />;
            case 'completed': return <CheckCircle className="h-3 w-3" />;
            case 'cancelled': return <XCircle className="h-3 w-3" />;
            default: return <AlertCircle className="h-3 w-3" />;
        }
    };

    const getCandidateDisplay = (session: Session) => {
        return getPrefixedDisplayName(session, 'candidate_', 'Unknown Candidate');
    };

    const getRecruiterDisplay = (session: Session) => {
        return getPrefixedDisplayName(session, 'recruiter_', 'Unknown Recruiter');
    };

    const copyShareLink = (session: Session) => {
        const link = `${window.location.origin}/admin-dashboard?tab=interviews&session=${session.id}`;
        navigator.clipboard.writeText(link);
        toast({
            title: "Link Copied",
            description: "Interview link copied to clipboard for sharing.",
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '—';
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: stats.total },
        { key: 'scheduled', label: 'Scheduled', count: stats.scheduled },
        { key: 'active', label: 'Active', count: stats.active },
        { key: 'completed', label: 'Completed', count: stats.completed },
        { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Interview Archive</h2>
                    <p className="text-muted-foreground">Browse, search and review recorded interviews. Share for escalation.</p>
                </div>
                <Button onClick={fetchSessions} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="border-l-4 border-l-slate-400">
                    <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-xs font-medium text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-400">
                    <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-400">
                    <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-xs font-medium text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-gray-400">
                    <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-xs font-medium text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-400">
                    <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-xs font-medium text-muted-foreground">Cancelled</p>
                        <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-400">
                    <CardContent className="pt-4 pb-3 px-4">
                        <p className="text-xs font-medium text-muted-foreground">AI Analyzed</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.withAnalysis}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by candidate, recruiter, job title, or session ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex flex-wrap gap-1">
                    {statusFilters.map(({ key, label, count }) => (
                        <Button
                            key={key}
                            variant={statusFilter === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(key)}
                            className="text-xs"
                        >
                            {label} ({count})
                        </Button>
                    ))}
                </div>
            </div>

            {/* Monitor Dialog */}
            {activeSession && (
                <Dialog open={!!activeSession} onOpenChange={(open) => !open && setActiveSession(null)}>
                    <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-slate-950 border-slate-800">
                        <VideoRoom
                            sessionId={activeSession.id}
                            userId="admin-observer"
                            userName="Admin Observer"
                            onEndCall={() => setActiveSession(null)}
                            isObserver={true}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Interview Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left">
                                    <th className="p-3 font-medium">Candidate</th>
                                    <th className="p-3 font-medium">Recruiter</th>
                                    <th className="p-3 font-medium hidden md:table-cell">Position</th>
                                    <th className="p-3 font-medium">Date / Time</th>
                                    <th className="p-3 font-medium hidden lg:table-cell">Duration</th>
                                    <th className="p-3 font-medium">Status</th>
                                    <th className="p-3 font-medium hidden lg:table-cell">AI Analysis</th>
                                    <th className="p-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
                                            Loading interviews...
                                        </td>
                                    </tr>
                                ) : filteredSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-muted-foreground">
                                            <Video className="mx-auto h-12 w-12 opacity-20 mb-3" />
                                            <h3 className="text-lg font-medium">No Interviews Found</h3>
                                            <p className="text-sm mt-1">
                                                {searchQuery || statusFilter !== 'all'
                                                    ? 'Try adjusting your search or filter criteria.'
                                                    : 'There are no interviews in the system yet.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSessions.map((session) => (
                                        <React.Fragment key={session.id}>
                                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                                {/* Candidate */}
                                                <td className="p-3">
                                                    <div className="font-medium">{getCandidateDisplay(session)}</div>
                                                    {session.candidate_email && (
                                                        <div className="text-xs text-muted-foreground">{session.candidate_email}</div>
                                                    )}
                                                </td>
                                                {/* Recruiter */}
                                                <td className="p-3">
                                                    <div className="text-sm">{getRecruiterDisplay(session)}</div>
                                                </td>
                                                {/* Position */}
                                                <td className="p-3 hidden md:table-cell">
                                                    <div className="text-sm">{session.job_title || '—'}</div>
                                                    {session.company_name && (
                                                        <div className="text-xs text-muted-foreground">{session.company_name}</div>
                                                    )}
                                                </td>
                                                {/* Date/Time */}
                                                <td className="p-3">
                                                    <div className="flex items-center text-sm">
                                                        <Calendar className="mr-1.5 h-3 w-3 opacity-60" />
                                                        {new Date(session.scheduled_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                                        <Clock className="mr-1.5 h-3 w-3 opacity-60" />
                                                        {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                {/* Duration */}
                                                <td className="p-3 hidden lg:table-cell">
                                                    <span className="text-sm">{formatDuration(session.duration_minutes)}</span>
                                                </td>
                                                {/* Status */}
                                                <td className="p-3">
                                                    <Badge variant="outline" className={`${getStatusColor(session.status)} text-xs`}>
                                                        <span className="mr-1">{getStatusIcon(session.status)}</span>
                                                        {session.status === 'active' ? 'LIVE' : session.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                {/* AI Analysis indicator */}
                                                <td className="p-3 hidden lg:table-cell">
                                                    {session.ai_analysis ? (
                                                        <button
                                                            onClick={() => setExpandedAnalysis(
                                                                expandedAnalysis === session.id ? null : session.id
                                                            )}
                                                            className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 transition-colors text-xs font-medium"
                                                        >
                                                            <Brain className="h-3.5 w-3.5" />
                                                            {session.ai_analysis.overall_score
                                                                ? `Score: ${session.ai_analysis.overall_score}/100`
                                                                : 'View Analysis'}
                                                            {expandedAnalysis === session.id
                                                                ? <ChevronUp className="h-3 w-3" />
                                                                : <ChevronDown className="h-3 w-3" />}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                {/* Actions */}
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Watch / Monitor button */}
                                                        {(session.status === 'active' || session.status === 'scheduled') && (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="h-7 text-xs"
                                                                onClick={() => setActiveSession(session)}
                                                                title="Monitor live"
                                                            >
                                                                <Monitor className="h-3 w-3 mr-1" />
                                                                Monitor
                                                            </Button>
                                                        )}
                                                        {session.status === 'completed' && (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="h-7 text-xs"
                                                                onClick={() => setActiveSession(session)}
                                                                title="Watch recording"
                                                            >
                                                                <Play className="h-3 w-3 mr-1" />
                                                                Watch
                                                            </Button>
                                                        )}
                                                        {/* AI Analysis (mobile, where column is hidden) */}
                                                        {session.ai_analysis && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 text-xs lg:hidden"
                                                                onClick={() => setExpandedAnalysis(
                                                                    expandedAnalysis === session.id ? null : session.id
                                                                )}
                                                                title="View AI Analysis"
                                                            >
                                                                <Brain className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        {/* Share link */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 text-xs"
                                                            onClick={() => copyShareLink(session)}
                                                            title="Copy shareable link"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded AI Analysis Row */}
                                            {expandedAnalysis === session.id && session.ai_analysis && (
                                                <tr className="bg-purple-50/50 border-b">
                                                    <td colSpan={8} className="p-4">
                                                        <div className="space-y-4">
                                                            {/* Analysis Header */}
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Brain className="h-5 w-5 text-purple-600" />
                                                                <h4 className="font-semibold text-purple-900">AI Interview Analysis</h4>
                                                                {session.ai_analysis.overall_score && (
                                                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                                                        Overall: {session.ai_analysis.overall_score}/100
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {/* Score Breakdown */}
                                                            {(session.ai_analysis.communication_score || session.ai_analysis.technical_score || session.ai_analysis.cultural_fit_score) && (
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                    {session.ai_analysis.communication_score != null && (
                                                                        <div className="bg-white rounded-lg p-3 border">
                                                                            <p className="text-xs font-medium text-muted-foreground">Communication</p>
                                                                            <p className="text-lg font-bold">{session.ai_analysis.communication_score}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                                                                            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-blue-500 rounded-full"
                                                                                    style={{ width: `${session.ai_analysis.communication_score}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {session.ai_analysis.technical_score != null && (
                                                                        <div className="bg-white rounded-lg p-3 border">
                                                                            <p className="text-xs font-medium text-muted-foreground">Technical</p>
                                                                            <p className="text-lg font-bold">{session.ai_analysis.technical_score}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                                                                            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-green-500 rounded-full"
                                                                                    style={{ width: `${session.ai_analysis.technical_score}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {session.ai_analysis.cultural_fit_score != null && (
                                                                        <div className="bg-white rounded-lg p-3 border">
                                                                            <p className="text-xs font-medium text-muted-foreground">Cultural Fit</p>
                                                                            <p className="text-lg font-bold">{session.ai_analysis.cultural_fit_score}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                                                                            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-amber-500 rounded-full"
                                                                                    style={{ width: `${session.ai_analysis.cultural_fit_score}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Summary */}
                                                            {session.ai_analysis.summary && (
                                                                <div className="bg-white rounded-lg p-3 border">
                                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                                                                    <p className="text-sm">{session.ai_analysis.summary}</p>
                                                                </div>
                                                            )}

                                                            {/* Strengths & Areas for Improvement */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {session.ai_analysis.strengths && session.ai_analysis.strengths.length > 0 && (
                                                                    <div className="bg-white rounded-lg p-3 border">
                                                                        <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                                                                            <CheckCircle className="h-3 w-3" /> Strengths
                                                                        </p>
                                                                        <ul className="space-y-1">
                                                                            {session.ai_analysis.strengths.map((s, i) => (
                                                                                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                                                                    <span className="text-green-500 mt-0.5">•</span> {s}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {session.ai_analysis.areas_for_improvement && session.ai_analysis.areas_for_improvement.length > 0 && (
                                                                    <div className="bg-white rounded-lg p-3 border">
                                                                        <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                                                                            <AlertCircle className="h-3 w-3" /> Areas for Improvement
                                                                        </p>
                                                                        <ul className="space-y-1">
                                                                            {session.ai_analysis.areas_for_improvement.map((s, i) => (
                                                                                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                                                                    <span className="text-amber-500 mt-0.5">•</span> {s}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Recommendation */}
                                                            {session.ai_analysis.recommendation && (
                                                                <div className="bg-white rounded-lg p-3 border border-purple-200">
                                                                    <p className="text-xs font-medium text-purple-700 mb-1 flex items-center gap-1">
                                                                        <FileText className="h-3 w-3" /> AI Recommendation
                                                                    </p>
                                                                    <p className="text-sm font-medium">{session.ai_analysis.recommendation}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Results count */}
                    {!loading && filteredSessions.length > 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                            Showing {filteredSessions.length} of {sessions.length} interviews
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminInterviews;
