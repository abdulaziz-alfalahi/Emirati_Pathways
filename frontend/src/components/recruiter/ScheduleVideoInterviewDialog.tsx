import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { restClient } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
    Video, Phone, MapPin, Users, ChevronDown, ChevronUp, Calendar, Clock, Loader2, Info
} from 'lucide-react';

interface ScheduleVideoInterviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialJobId?: string;
    initialCandidateId?: string;
    /** When supplied, the candidate dropdown is locked to this shortlist entry */
    initialShortlistId?: string;
    onSuccess?: () => void;
}

export function ScheduleVideoInterviewDialog({
    open,
    onOpenChange,
    initialJobId,
    initialCandidateId,
    initialShortlistId,
    onSuccess
}: ScheduleVideoInterviewDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Data State
    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    // Form State
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [formData, setFormData] = useState({
        candidateName: "",
        candidateId: "",    // This MUST be the shortlist_id
        title: "",
        scheduledAt: "",
        time: "",
        interviewType: "video" as string,
        duration: 60 as number,
        location: "",
        notes: "",
        attendees: [] as string[]
    });

    // Collapsible state
    const [showAdvanced, setShowAdvanced] = useState(false);

    // ─── Data Fetching ─────────────────────────────────────────────

    const fetchJobs = async () => {
        try {
            // Primary: recruiter's own JD list endpoint
            let jobsData: any[] = [];
            try {
                const response = await restClient.get('/api/recruiter/jd/list');
                const raw = response.data?.data || response.data;
                jobsData = raw?.job_descriptions || raw?.jobs || (Array.isArray(raw) ? raw : []);
            } catch (jdError: any) {
                console.warn("Recruiter JD list failed, trying HR endpoint:", jdError.message);
                // Fallback: HR jobs endpoint (works for HR-role recruiters)
                try {
                    const hrResponse = await restClient.get('/api/hr/jobs?limit=100&status=all');
                    if (hrResponse.data.success) {
                        jobsData = hrResponse.data.data?.job_postings || hrResponse.data.data || [];
                    }
                } catch (hrError) {
                    console.error("HR jobs endpoint also failed:", hrError);
                }
            }
            setJobs(Array.isArray(jobsData) ? jobsData : []);
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    };

    const fetchTeamMembers = async () => {
        const companyId = user?.company_id;
        if (!companyId) {
            console.warn("No company ID found for user, cannot fetch team members");
            return;
        }

        try {
            const response = await restClient.get(`/api/company/team/members?company_id=${companyId}`);
            if (response.data.success) {
                setTeamMembers(response.data.members);
            }
        } catch (error) {
            console.error("Failed to fetch team members", error);
        }
    };

    const fetchShortlist = async (jobId: string) => {
        try {
            setCandidates([]);
            const response = await restClient.get(`/api/recruiter/shortlist/${jobId}?limit=100`);
            if (response.data.success) {
                const list = response.data.shortlist || [];
                setCandidates(list);
                return list;
            }
            return [];
        } catch (error) {
            console.error("Error fetching shortlist:", error);
            return [];
        }
    };

    const addToShortlist = async (jobId: string, candidateId: string) => {
        try {
            const response = await restClient.post('/api/recruiter/shortlist/add', {
                jd_id: jobId,
                candidate_id: candidateId,
                recruiter_id: user?.id,
                notes: "Auto-shortlisted for interview"
            });
            if (response.data.success) {
                return response.data.data?.id || response.data.shortlist_id;
            }
            return null;
        } catch (error: any) {
            // 409 = candidate already shortlisted for this job. That is expected/benign when
            // scheduling an interview for an already-shortlisted candidate — not an error.
            // Recover the existing shortlist id from the response, or look it up.
            if (error.response?.status === 409) {
                const existingId = error.response.data?.shortlist_id || error.response.data?.data?.id;
                if (existingId) return existingId;
                try {
                    const list = await fetchShortlist(jobId);
                    const match = list.find((c: any) => String(c.candidate_id) === String(candidateId));
                    if (match?.shortlist_id) return match.shortlist_id;
                } catch { /* lookup failed — fall through */ }
                return null;
            }
            console.error("Error adding to shortlist:", error);
            return null;
        }
    };

    // ─── Initialization ────────────────────────────────────────────

    useEffect(() => {
        const initializeDialog = async () => {
            if (open) {
                fetchJobs();
                fetchTeamMembers();

                // If a shortlistId was passed directly, pre‑set it
                if (initialShortlistId) {
                    setFormData(prev => ({ ...prev, candidateId: initialShortlistId }));
                }

                if (initialJobId) {
                    setSelectedJobId(initialJobId);
                    const shortlist = await fetchShortlist(initialJobId);

                    if (initialShortlistId) {
                        const match = shortlist.find((c: any) => String(c.shortlist_id) === String(initialShortlistId));
                        if (match) {
                            setFormData(prev => ({
                                ...prev,
                                candidateId: String(match.shortlist_id),
                                candidateName: getDisplayName(match, '')
                            }));
                        }
                    } else if (initialCandidateId) {
                        let targetShortlistId = "";
                        const match = shortlist.find((c: any) => String(c.candidate_id) === String(initialCandidateId) || String(c.shortlist_id) === String(initialCandidateId));

                        if (match) {
                            targetShortlistId = match.shortlist_id;
                            setFormData(prev => ({
                                ...prev,
                                candidateId: targetShortlistId,
                                candidateName: getDisplayName(match, '')
                            }));
                        } else {
                            toast.info("Preparing candidate for interview...");
                            const newShortlistId = await addToShortlist(initialJobId, initialCandidateId);
                            if (newShortlistId) {
                                targetShortlistId = newShortlistId;
                                const updatedShortlist = await fetchShortlist(initialJobId);
                                const newMatch = updatedShortlist.find((c: any) => c.shortlist_id === newShortlistId);
                                setFormData(prev => ({
                                    ...prev,
                                    candidateId: targetShortlistId,
                                    candidateName: newMatch ? getDisplayName(newMatch, '') : ""
                                }));
                            } else {
                                toast.error("Could not add candidate to shortlist. Please try manually.");
                            }
                        }
                    }
                } else {
                    if (!selectedJobId) {
                        setFormData(prev => ({ ...prev, candidateId: "", candidateName: "" }));
                    }
                }
            }
        };

        initializeDialog();
    }, [open, initialJobId, initialCandidateId, initialShortlistId]);

    // Update candidate name when manually selecting from dropdown
    useEffect(() => {
        if (candidates.length > 0) {
            if (formData.candidateId) {
                const c = candidates.find(c => String(c.shortlist_id) === String(formData.candidateId));
                if (c) {
                    setFormData(prev => ({ ...prev, candidateName: getDisplayName(c, '') }));
                }
            } else if (initialCandidateId) {
                const match = candidates.find((c: any) => c.candidate_id === initialCandidateId || c.shortlist_id === initialCandidateId);
                if (match) {
                    setFormData(prev => ({
                        ...prev,
                        candidateId: match.shortlist_id,
                        candidateName: getDisplayName(match, '')
                    }));
                    toast.success(`Candidate ${getDisplayName(match)} selected`);
                }
            }
        }
    }, [formData.candidateId, candidates, initialCandidateId]);

    // ─── Handlers ──────────────────────────────────────────────────

    const handleJobChange = async (value: string) => {
        setSelectedJobId(value);
        const list = await fetchShortlist(value);

        if (initialCandidateId) {
            const match = list.find((c: any) => c.candidate_id == initialCandidateId || c.candidate_id === String(initialCandidateId));
            if (match) {
                setFormData(prev => ({
                    ...prev,
                    candidateId: match.shortlist_id,
                    candidateName: getDisplayName(match, '')
                }));
            } else {
                toast.info("Adding candidate to job shortlist...");
                const newShortlistId = await addToShortlist(value, initialCandidateId);
                if (newShortlistId) {
                    const updatedList = await fetchShortlist(value);
                    const newMatch = updatedList.find((c: any) => c.shortlist_id === newShortlistId);
                    if (newMatch) {
                        setFormData(prev => ({
                            ...prev,
                            candidateId: newShortlistId,
                            candidateName: getDisplayName(newMatch, '')
                        }));
                        toast.success("Candidate added and selected");
                    }
                }
            }
        } else {
            setFormData(prev => ({ ...prev, candidateId: "", candidateName: "" }));
        }
    };

    const handleSchedule = async () => {
        try {
            if (!formData.candidateId) {
                toast.error("Please select a candidate");
                return;
            }
            if (!formData.scheduledAt || !formData.time) {
                toast.error("Please select date and time");
                return;
            }
            if (formData.interviewType === 'in_person' && !formData.location) {
                toast.error("Location is required for in-person interviews");
                return;
            }

            setLoading(true);

            // Auto-generate meeting link for built-in video interviews
            let meetingLink = '';
            if (formData.interviewType === 'video') {
                const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                meetingLink = `${window.location.origin}/recruiter/video-interview/${sessionId}`;
            }

            await restClient.post('/api/recruiter/interviews/create', {
                shortlist_id: formData.candidateId,
                recruiter_id: user?.id || "recruiter_001",
                interview_type: formData.interviewType,
                interview_round: 1,
                interview_title: formData.title,
                scheduled_date: formData.scheduledAt,
                scheduled_time: formData.time + ":00",
                duration_minutes: formData.duration,
                notes: formData.notes || "Scheduled via Dashboard",
                meeting_platform: formData.interviewType === 'video' ? 'built-in' : '',
                meeting_link: meetingLink,
                location: formData.interviewType === 'in_person' ? formData.location : '',
                interviewers: formData.attendees
            });

            toast.success("Interview scheduled successfully");
            onOpenChange(false);
            onSuccess?.();

            // Cleanup
            setFormData({
                candidateName: "", candidateId: "", scheduledAt: "", time: "",
                title: "", attendees: [], interviewType: "video", duration: 60,
                location: "", notes: ""
            });
            setSelectedJobId("");
            setShowAdvanced(false);

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to schedule interview";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ─── Interview Type Helpers ────────────────────────────────────

    const interviewTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4" />;
            case 'phone': return <Phone className="h-4 w-4" />;
            case 'in_person': return <MapPin className="h-4 w-4" />;
            case 'panel': return <Users className="h-4 w-4" />;
            default: return <Calendar className="h-4 w-4" />;
        }
    };

    const isCandiatePreselected = !!(initialShortlistId || (initialCandidateId && formData.candidateId));

    // ─── Render ────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                        Schedule Interview
                    </DialogTitle>
                    <DialogDescription>
                        Set up an interview session on the platform's built-in video system.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* ── Job Position ──────────────────────────────── */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Job Position</Label>
                        <Select
                            value={selectedJobId}
                            onValueChange={handleJobChange}
                            disabled={!!initialJobId}
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

                    {/* ── Candidate ─────────────────────────────────── */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Candidate</Label>
                        <Select
                            disabled={!selectedJobId || isCandiatePreselected}
                            value={formData.candidateId}
                            onValueChange={(value) => {
                                setFormData(prev => ({ ...prev, candidateId: value }));
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={selectedJobId ? "Select candidate..." : "Select a job first"} />
                            </SelectTrigger>
                            <SelectContent>
                                {candidates.map(c => (
                                    <SelectItem key={c.shortlist_id} value={String(c.shortlist_id)}>
                                        {getDisplayName(c)} {c.match_score ? `(Match: ${c.match_score}%)` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ── Interview Title ───────────────────────────── */}
                    <div className="space-y-2">
                        <Label>Interview Title</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Technical Round 1"
                        />
                    </div>

                    {/* ── Interview Type ────────────────────────────── */}
                    <div className="space-y-2">
                        <Label>Interview Type</Label>
                        <Select
                            value={formData.interviewType}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, interviewType: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="video">
                                    <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Video Call (Built-in)</span>
                                </SelectItem>
                                <SelectItem value="phone">
                                    <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Call</span>
                                </SelectItem>
                                <SelectItem value="in_person">
                                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> In-Person</span>
                                </SelectItem>
                                <SelectItem value="panel">
                                    <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Panel Interview</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ── Built-in Video Notice ─────────────────────── */}
                    {formData.interviewType === 'video' && (
                        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-3">
                            <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div className="text-xs text-emerald-700 dark:text-emerald-300">
                                <span className="font-semibold">Emirati Pathways Video (Built-in)</span>
                                <br />
                                A secure interview link will be auto-generated and sent to the candidate. The session can be recorded and AI-analyzed.
                            </div>
                        </div>
                    )}

                    {/* ── Location (in-person only) ────────────────── */}
                    {formData.interviewType === 'in_person' && (
                        <div className="space-y-2">
                            <Label>Location *</Label>
                            <Input
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Office address or meeting room"
                            />
                        </div>
                    )}

                    {/* ── Date & Time ───────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date *</Label>
                            <Input
                                type="date"
                                value={formData.scheduledAt}
                                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Time *</Label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* ── Duration ──────────────────────────────────── */}
                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <Select
                            value={String(formData.duration)}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, duration: parseInt(val) }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="90">1.5 hours</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* ── Invite Colleagues / HR Manager ────────────── */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            Invite Colleagues & HR Manager
                        </Label>
                        <div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-900">
                            {teamMembers.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No team members found.</p>
                            ) : (
                                teamMembers.map(member => (
                                    <div key={member.user_id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`invite-${member.user_id}`}
                                            checked={formData.attendees.includes(member.user_id)}
                                            onCheckedChange={(checked) => {
                                                setFormData(prev => ({
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
                                            {member.full_name}
                                            <Badge variant="outline" className="ms-2 text-[10px] py-0 px-1.5">
                                                {member.role}
                                            </Badge>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        {formData.attendees.length > 0 && (
                            <p className="text-xs text-emerald-600 font-medium">
                                {formData.attendees.length} colleague{formData.attendees.length > 1 ? 's' : ''} invited
                            </p>
                        )}
                    </div>

                    {/* ── Notes ─────────────────────────────────────── */}
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Interview agenda, topics to cover, etc."
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSchedule} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                        {loading ? (
                            <><Loader2 className="me-2 h-4 w-4 animate-spin" /> Scheduling...</>
                        ) : (
                            <><Calendar className="me-2 h-4 w-4" /> Schedule Interview</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
