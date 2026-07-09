import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from "@/components/ui/label";
import { Video, Calendar, Clock, Loader2, FileVideo, Sparkles, X, MoreVertical, Edit, BarChart3, ArrowLeft, ClipboardCopy, Star } from 'lucide-react';
import { restClient } from '@/utils/api';
import { getPrefixedDisplayName } from '@/utils/nameUtils';
import InterviewAnalytics from './interviews/InterviewAnalytics';
import InterviewScorecard from './InterviewScorecard';
import { VideoRoom } from '@/components/common/VideoRoom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScheduleVideoInterviewDialog } from './ScheduleVideoInterviewDialog';

export default function RecruiterInterviews() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null); // If set, show VideoRoom
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<string | null>(null);
  const [analyticsSession, setAnalyticsSession] = useState<any>(null);
  const [scorecardSession, setScorecardSession] = useState<any>(null);

  // Schedule Dialog
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Reschedule Dialog State
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleSession, setRescheduleSession] = useState<any>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });

  const [searchParams] = useSearchParams();
  const candidateIdParam = searchParams.get('candidateId');

  useEffect(() => {
    fetchSessions();
    if (candidateIdParam) {
      setScheduleOpen(true);
    }
  }, [candidateIdParam]);



  const fetchSessions = async () => {
    try {
      // Single endpoint already queries both interview_sessions AND interview_schedules tables
      const userId = user?.id || '';
      const res = await restClient.get(`/api/video-interview/sessions?role=recruiter&recruiter_id=${userId}`);
      if (res.data?.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleJoin = (session: any) => {
    // Navigate to the dedicated video interview page which includes the AI analytics sidebar
    navigate(`/recruiter/video-interview/${session.id}`);
  };

  const handleEndCall = () => {
    setActiveSession(null);
    fetchSessions(); // Refresh status/recordings
  };

  const handleAnalyze = async (sessionId: string) => {
    setIsAnalysisLoading(sessionId);
    try {
      await restClient.post(`/api/interviews/sessions/${sessionId}/analyze`);
      toast.success("AI Analysis started. Check back soon.");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to start analysis");
    } finally {
      setIsAnalysisLoading(null);
    }
  };



  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/guest/interview/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Guest link copied to clipboard");
  };

  // G20: Scorecard view
  if (scorecardSession) {
    return (
      <InterviewScorecard
        interviewId={scorecardSession.id}
        interviewTitle={scorecardSession.title || scorecardSession.job_title || 'Interview'}
        onBack={() => setScorecardSession(null)}
      />
    );
  }

  // Cancel Dialog State
  const [cancelOpen, setCancelOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);

  const confirmCancel = (sessionId: string) => {
    setSessionToCancel(sessionId);
    setCancelOpen(true);
  };

  const handleCancelExecute = async () => {
    if (!sessionToCancel) return;

    // Optimistic Update
    const originalSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== sessionToCancel));
    setCancelOpen(false); // Close immediately

    try {
      await restClient.post(`/api/recruiter/interviews/${sessionToCancel}/cancel`, { cancellation_reason: "Cancelled by recruiter" });
      toast.success("Interview cancelled");

      // Ensure sync
      setTimeout(() => fetchSessions(), 1000);
    } catch (err: any) {
      console.error("Cancel failed:", err);
      // Revert UI on failure
      setSessions(originalSessions);
      const msg = err.response?.data?.error || err.message || "Failed to cancel";
      toast.error(`Failed to cancel: ${msg}`);
    } finally {
      setSessionToCancel(null);
    }
  };

  const openRescheduleDialog = (session: any) => {
    // Parse current date/time to pre-fill
    // Assuming format "YYYY-MM-DD" and "HH:MM:SS" or ISO
    setRescheduleSession(session);
    setRescheduleData({ date: "", time: "" });
    setRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleSession || !rescheduleData.date || !rescheduleData.time) {
      toast.error("Please select new date and time");
      return;
    }

    try {
      await restClient.put(`/api/recruiter/interviews/${rescheduleSession.id}`, {
        scheduled_date: rescheduleData.date,
        scheduled_time: rescheduleData.time
      });

      toast.success("Interview rescheduled successfully");
      setRescheduleOpen(false);
      fetchSessions();
    } catch (err: any) {
      console.error("Reschedule failed:", err);
      toast.error(err.response?.data?.error || "Failed to reschedule");
    }
  };

  if (analyticsSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setAnalyticsSession(null)} className="text-ehrdc-teal hover:text-ehrdc-teal/80">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Interviews
          </Button>
          <h2 className="text-xl font-bold">Interview Analytics</h2>
          <Badge variant="outline">{analyticsSession.title || 'Interview'}</Badge>
        </div>
        <InterviewAnalytics interviewId={analyticsSession.id} />
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="h-[calc(100vh-100px)]">
        <VideoRoom
          sessionId={activeSession.id}
          userId={activeSession.recruiter_id}
          userName="Recruiter"
          isRecruiter={true}
          onEndCall={handleEndCall}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Interviews</h2>
          <p className="text-muted-foreground">Manage and conduct video interviews.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
            <Switch
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
              className="data-[state=checked]:bg-purple-600"
            />
            <label htmlFor="show-completed" className="text-sm font-bold cursor-pointer text-slate-700">
              Show Completed
            </label>
          </div>
          <ScheduleVideoInterviewDialog
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            onSuccess={fetchSessions}
            initialCandidateId={candidateIdParam || undefined}
          />
          <Button onClick={() => setScheduleOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" /> Schedule Interview
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
          Loading interviews...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(sessions || [])
            .filter(session => {
              // Default: Show Scheduled. 
              // Toggle On: Show Scheduled + Completed.
              // Cancelled always hidden.
              if (session.status === 'cancelled') return false;
              if (session.status === 'completed' && !showCompleted) return false;
              return true;
            })
            .map((session) => (
              <Card key={session.id} className={`hover:shadow-md transition-shadow relative ${session.status === 'cancelled' ? 'opacity-60 bg-slate-50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{session.title || `Interview`}</CardTitle>
                      <div className="text-sm font-medium text-slate-700 mb-1">{session.job_title}</div>
                      <div className="text-xs text-slate-500 mb-2">Candidate: {getPrefixedDisplayName(session, 'candidate_')}</div>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(session.scheduled_time || session.scheduled_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={session.status === 'cancelled' ? 'destructive' : session.status === 'completed' ? 'secondary' : 'default'}>
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      {session.duration_minutes || 60} Minutes
                    </div>

                    {/* AI Analysis Section skipped for brevity - assume kept or simplified */}
                    {session.ai_analysis && (
                      <div className="bg-slate-50 p-2 rounded text-xs border">
                        <div className="font-semibold text-purple-600 flex items-center"><Sparkles className="h-3 w-3 mr-1" /> AI Insight</div>
                        <p className="line-clamp-2 mt-1">{session.ai_analysis.summary}</p>
                      </div>
                    )}

                    <div className="flex gap-2 items-center pt-2">
                      {(session.status === 'scheduled' || session.status === 'in_progress') && (
                        <Button className="flex-1" onClick={() => handleJoin(session)}>
                          <Video className="mr-2 h-4 w-4" /> Join Call
                        </Button>
                      )}

                      {/* G20: Copy Guest Link */}
                      {session.guest_token && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          title="Copy Guest Link"
                          onClick={() => handleCopyLink(session.guest_token)}
                        >
                          <ClipboardCopy className="h-4 w-4 text-slate-600" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        title="View Analytics"
                        onClick={() => setAnalyticsSession(session)}
                      >
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </Button>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-10 w-10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setScorecardSession(session)}>
                            <Star className="mr-2 h-4 w-4" /> Scorecard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAnalyticsSession(session)}>
                            <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                          </DropdownMenuItem>
                          {session.guest_token && (
                            <DropdownMenuItem onClick={() => handleCopyLink(session.guest_token)}>
                              <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Guest Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openRescheduleDialog(session)}>
                            <Edit className="mr-2 h-4 w-4" /> Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onSelect={(e) => {
                              e.preventDefault();
                              confirmCancel(session.id);
                            }}
                          >
                            <X className="mr-2 h-4 w-4" /> Cancel Interview
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          {sessions.length === 0 && (
            <div className="col-span-full text-center p-12 bg-slate-50 border-2 border-dashed rounded-lg">
              No interviews scheduled.
            </div>
          )}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <CardDescription>
              Choose a new date and time for {rescheduleSession?.title}.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Date</Label>
                <Input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>New Time</Label>
                <Input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} min="09:00" max="18:00" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleReschedule}>Confirm Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
            <CardDescription>
              Are you sure you want to cancel this interview? This action cannot be undone.
            </CardDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Interview</Button>
            <Button variant="destructive" onClick={handleCancelExecute}>Yes, Cancel Interview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
