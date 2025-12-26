import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Video, Calendar, Clock, Loader2, FileVideo, Sparkles, X } from 'lucide-react';
import { restClient } from '@/utils/api';
import { VideoRoom } from '@/components/common/VideoRoom';
import { toast } from 'sonner';

export default function RecruiterInterviews() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null); // If set, show VideoRoom
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<string | null>(null);

  // Schedule Dialog
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  useEffect(() => {
    fetchSessions();
    fetchJobs();
    fetchTeamMembers();
  }, []);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]); // Team members for attendees
  const [newSessionData, setNewSessionData] = useState({
    candidateName: "",
    candidateId: "",
    scheduledAt: "",
    time: "",
    title: "",
    attendees: [] as string[] // Selected attendees
  });

  const COMPANY_ID = "7e5edea0-ea73-436c-b7ed-f47cfe57423a"; // Mock/Auth derived

  const fetchTeamMembers = async () => {
    try {
      const response = await restClient.get(`/api/company/team/members?company_id=${COMPANY_ID}`);
      if (response.data.success) {
        setTeamMembers(response.data.members);
      }
    } catch (error) {
      console.error("Failed to fetch team members", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await restClient.get('/api/hr/jobs?limit=100&status=active');
      if (response.data.success) {
        setJobs(response.data.data.job_postings || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const fetchShortlist = async (jobId: string) => {
    try {
      setCandidates([]); // Clear previous
      const response = await restClient.get(`/api/recruiter/shortlist/${jobId}?limit=100`);
      if (response.data.success) {
        setCandidates(response.data.shortlist || []);
      }
    } catch (error) {
      console.error("Error fetching shortlist:", error);
    }
  };

  // Removed generic fetchCandidates


  const fetchSessions = async () => {
    try {
      const res = await restClient.get('/api/video-interview/sessions?role=recruiter');
      if (res.data.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = (session: any) => {
    setActiveSession(session);
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

  const handleSchedule = async () => {
    try {
      if (!newSessionData.candidateId) {
        toast.error("Please select a candidate");
        return;
      }
      if (!newSessionData.scheduledAt || !newSessionData.time) {
        toast.error("Please select date and time");
        return;
      }

      // Combine date and time
      const dateTime = new Date(`${newSessionData.scheduledAt}T${newSessionData.time}`);

      // Use the Recruiter API for scheduling (it handles DB inserts)
      await restClient.post('/api/recruiter/interviews/create', {
        shortlist_id: newSessionData.candidateId, // This is shortlist_id from selection
        recruiter_id: "recruiter_001",
        interview_type: "video",
        interview_round: 1,
        interview_title: newSessionData.title,
        scheduled_date: newSessionData.scheduledAt,
        scheduled_time: newSessionData.time + ":00",
        duration_minutes: 60,
        notes: "Scheduled via Dashboard",
        meeting_platform: "built-in", // Suggested field
        interviewers: newSessionData.attendees // Pass attendees as interviewers
      });

      setScheduleOpen(false);
      fetchSessions();
      toast.success("Interview scheduled successfully");
      setNewSessionData({ candidateName: "", candidateId: "", scheduledAt: "", time: "", title: "", attendees: [] });
    } catch (error) {
      toast.error("Failed to schedule interview");
      console.error(error);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/guest/interview/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Guest link copied to clipboard");
  };

  const handleCancel = async (sessionId: string) => {
    if (!confirm("Are you sure you want to cancel this interview?")) return;
    try {
      await restClient.post(`/api/interviews/sessions/${sessionId}/cancel`, { reason: "Cancelled by recruiter" });
      toast.success("Interview cancelled");
      fetchSessions();
    } catch (err) {
      toast.error("Failed to cancel");
    }
  };

  if (activeSession) {
    return (
      <div className="h-[calc(100vh-100px)]">
        <VideoRoom
          sessionId={activeSession.id}
          userId={activeSession.recruiter_id} // Should use actual user ID from context in real app
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
          <div className="flex items-center space-x-2">
            <Switch id="show-cancelled" checked={showCancelled} onCheckedChange={setShowCancelled} />
            <label htmlFor="show-cancelled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Show Cancelled
            </label>
          </div>
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="mr-2 h-4 w-4" /> Schedule Interview
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Video Interview</DialogTitle>
                <CardDescription>Select a candidate and time for the video interview.</CardDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Position</label>
                  <Select
                    onValueChange={(value) => {
                      setSelectedJobId(value);
                      fetchShortlist(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job position..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.jd_id || job.id}>
                          {job.title} ({job.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Candidate (from Shortlist)</label>
                  <Select
                    disabled={!selectedJobId}
                    onValueChange={(value) => {
                      const candidate = candidates.find(c => c.shortlist_id === value);
                      setNewSessionData({
                        ...newSessionData,
                        candidateId: value, // This is now shortlist_id
                        candidateName: candidate ? `${candidate.first_name} ${candidate.last_name}` : ""
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedJobId ? "Select candidate..." : "Select a job first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map(candidate => (
                        <SelectItem key={candidate.shortlist_id} value={candidate.shortlist_id}>
                          {candidate.first_name} {candidate.last_name} (Match: {candidate.match_score}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Interview Title</label>
                  <Input
                    placeholder="e.g. Technical Round 1"
                    value={newSessionData.title}
                    onChange={(e) => setNewSessionData({ ...newSessionData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={newSessionData.scheduledAt}
                      onChange={(e) => setNewSessionData({ ...newSessionData, scheduledAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={newSessionData.time}
                      onChange={(e) => setNewSessionData({ ...newSessionData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Invite Team Members (Optional)</Label>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-slate-500">No team members found.</p>
                    ) : (
                      teamMembers.map(member => (
                        <div key={member.user_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`invite-${member.user_id}`}
                            checked={newSessionData.attendees.includes(member.user_id)}
                            onCheckedChange={(checked) => {
                              setNewSessionData(prev => ({
                                ...prev,
                                attendees: checked
                                  ? [...prev.attendees, member.user_id]
                                  : prev.attendees.filter(id => id !== member.user_id)
                              }));
                            }}
                          />
                          <label
                            htmlFor={`invite-${member.user_id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {member.full_name} <span className="text-xs text-slate-400">({member.role})</span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={handleSchedule}>Confirm Schedule</Button>
              </div>
            </DialogContent>
          </Dialog>
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
            .filter(session => showCancelled || session.status !== 'cancelled')
            .map((session) => (
              <Card key={session.id} className={`hover:shadow-md transition-shadow ${session.status === 'cancelled' ? 'opacity-60 bg-slate-50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{session.title || `Interview with ${session.candidate_first_name} ${session.candidate_last_name}`}</CardTitle>
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
                      45 Minutes
                    </div>

                    {/* Guest Link Display */}
                    {session.status === 'scheduled' && session.guest_token && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded select-all font-mono">
                          Guest Link: .../guest/interview/{session.guest_token.slice(0, 8)}...
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleCopyLink(session.guest_token)}>
                          Copy
                        </Button>
                      </div>
                    )}

                    {session.ai_analysis ? (
                      <div className="bg-slate-50 p-3 rounded-lg text-sm border space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center font-semibold text-purple-600">
                            <Sparkles className="h-3 w-3 mr-1" /> AI Insight
                          </div>
                          <Badge variant="outline" className="text-xs bg-white">
                            Score: {session.ai_analysis.technical_score}/10
                          </Badge>
                        </div>

                        <p className="line-clamp-2 text-slate-600 italic">
                          "{session.ai_analysis.summary || "Analysis ready."}"
                        </p>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="h-auto p-0 text-purple-600">View Full Report</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>AI Interview Analysis</DialogTitle>
                              <CardDescription>Generated by Gemini 1.5 Pro</CardDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-100 rounded-lg text-center">
                                  <div className="text-2xl font-bold text-slate-800">{session.ai_analysis.technical_score}/10</div>
                                  <div className="text-xs text-slate-500 uppercase tracking-wide">Technical Score</div>
                                </div>
                                <div className="p-4 bg-slate-100 rounded-lg text-center">
                                  <div className="text-2xl font-bold text-slate-800">{session.ai_analysis.soft_skills_score}/10</div>
                                  <div className="text-xs text-slate-500 uppercase tracking-wide">Soft Skills</div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Executive Summary</h4>
                                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border">
                                  {session.ai_analysis.summary}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2 text-green-600">Key Strengths</h4>
                                  <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
                                    {session.ai_analysis.key_strengths?.map((s: string, i: number) => (
                                      <li key={i}>{s}</li>
                                    )) || <li>No data available</li>}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2 text-amber-600">Areas for Improvement</h4>
                                  <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
                                    {session.ai_analysis.areas_for_improvement?.map((s: string, i: number) => (
                                      <li key={i}>{s}</li>
                                    )) || <li>No data available</li>}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic text-center p-2 border border-dashed rounded">
                        No analysis available yet.
                      </div>
                    )}

                    <div className="flex gap-2 min-h-[40px]">
                      {session.status === 'scheduled' && (
                        <Button className="flex-1" onClick={() => handleJoin(session)}>
                          <Video className="mr-2 h-4 w-4" /> Join Call
                        </Button>
                      )}

                      {session.status === 'scheduled' && (
                        <Button variant="destructive" size="icon" title="Cancel Interview" onClick={() => handleCancel(session.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {!session.ai_analysis && (
                      <Button variant="outline" size="icon"
                        disabled={!!isAnalysisLoading}
                        title="Generate AI Analysis"
                        onClick={() => handleAnalyze(session.id)}>
                        {isAnalysisLoading === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-purple-600" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

          {sessions.length === 0 && (
            <div className="col-span-full text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No interviews scheduled.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
