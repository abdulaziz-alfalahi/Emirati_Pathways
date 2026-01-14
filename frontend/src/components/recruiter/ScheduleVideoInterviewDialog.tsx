import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ScheduleVideoInterviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialJobId?: string;
    initialCandidateId?: string;
    onSuccess?: () => void;
}

export function ScheduleVideoInterviewDialog({
    open,
    onOpenChange,
    initialJobId,
    initialCandidateId,
    onSuccess
}: ScheduleVideoInterviewDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Data State
    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]); // This stores the shortlist
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    // Form State
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [formData, setFormData] = useState({
        candidateName: "",
        candidateId: "", // This MUST be the shortlist_id
        title: "",
        scheduledAt: "",
        time: "",
        attendees: [] as string[]
    });

    const COMPANY_ID = "7e5edea0-ea73-436c-b7ed-f47cfe57423a"; // Mock ID as used in Interviews.tsx

    const fetchJobs = async () => {
        try {
            const response = await restClient.get('/api/hr/jobs?limit=100&status=all');
            if (response.data.success) {
                const jobsData = response.data.data?.job_postings || response.data.data || [];
                setJobs(Array.isArray(jobsData) ? jobsData : []);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    };

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
                return response.data.data?.id || response.data.shortlist_id; // Check both possibilities
            }
            return null;
        } catch (error) {
            console.error("Error adding to shortlist:", error);
            return null;
        }
    };

    // Initialize Dialog
    useEffect(() => {
        const initializeDialog = async () => {
            if (open) {
                fetchJobs();
                fetchTeamMembers();

                if (initialJobId) {
                    setSelectedJobId(initialJobId);

                    // Fetch shortlist
                    const shortlist = await fetchShortlist(initialJobId);

                    if (initialCandidateId) {
                        // Check if candidate is already in shortlist
                        let targetShortlistId = "";
                        const match = shortlist.find((c: any) => c.candidate_id === initialCandidateId || c.shortlist_id === initialCandidateId);

                        if (match) {
                            targetShortlistId = match.shortlist_id;
                            setFormData(prev => ({
                                ...prev,
                                candidateId: targetShortlistId,
                                candidateName: `${match.first_name} ${match.last_name}`
                            }));
                        } else {
                            // Link applicant if not shortlisted
                            toast.info("Preparing candidate for interview...");
                            const newShortlistId = await addToShortlist(initialJobId, initialCandidateId);

                            if (newShortlistId) {
                                targetShortlistId = newShortlistId;
                                // Refresh to show in list
                                const updatedShortlist = await fetchShortlist(initialJobId);
                                const newMatch = updatedShortlist.find((c: any) => c.shortlist_id === newShortlistId);

                                setFormData(prev => ({
                                    ...prev,
                                    candidateId: targetShortlistId,
                                    candidateName: newMatch ? `${newMatch.first_name} ${newMatch.last_name}` : ""
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
    }, [open, initialJobId, initialCandidateId]);

    // Update name when manually selecting from dropdown
    useEffect(() => {
        if (candidates.length > 0 && formData.candidateId) {
            const c = candidates.find(c => c.shortlist_id === formData.candidateId);
            if (c) {
                setFormData(prev => ({ ...prev, candidateName: `${c.first_name} ${c.last_name}` }));
            }
        }
    }, [formData.candidateId, candidates]);


    const handleJobChange = (value: string) => {
        setSelectedJobId(value);
        fetchShortlist(value);
        setFormData({ ...formData, candidateId: "", candidateName: "" });
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

            setLoading(true);

            // Payload expects shortlist_id
            await restClient.post('/api/recruiter/interviews/create', {
                shortlist_id: formData.candidateId,
                recruiter_id: user?.id || "recruiter_001",
                interview_type: "video",
                interview_round: 1,
                interview_title: formData.title,
                scheduled_date: formData.scheduledAt,
                scheduled_time: formData.time + ":00",
                duration_minutes: 60,
                notes: "Scheduled via Dashboard",
                meeting_platform: "built-in",
                interviewers: formData.attendees
            });

            toast.success("Interview scheduled successfully");
            onOpenChange(false);
            onSuccess?.();

            // Cleanup
            setFormData({ candidateName: "", candidateId: "", scheduledAt: "", time: "", title: "", attendees: [] });
            setSelectedJobId("");

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to schedule interview";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule Video Interview</DialogTitle>
                    <DialogDescription>Select a candidate and time for the video interview.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Job Position</label>
                        <Select
                            value={selectedJobId}
                            onValueChange={handleJobChange}
                            disabled={!!initialJobId}
                        >
                            <SelectTrigger><SelectValue placeholder="Select job position..." /></SelectTrigger>
                            <SelectContent>
                                {jobs.map(job => (
                                    <SelectItem key={job.id} value={job.jd_id || job.id}>{job.title} ({job.status})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Candidate</label>
                        <Select
                            disabled={!selectedJobId || (!!initialCandidateId && !!formData.candidateId)}
                            value={formData.candidateId}
                            onValueChange={(value) => {
                                setFormData(prev => ({ ...prev, candidateId: value }));
                            }}
                        >
                            <SelectTrigger><SelectValue placeholder={selectedJobId ? "Select candidate..." : "Select a job first"} /></SelectTrigger>
                            <SelectContent>
                                {candidates.map(c => (
                                    <SelectItem key={c.shortlist_id} value={c.shortlist_id}>
                                        {c.first_name} {c.last_name} (Match: {c.match_score}%)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Interview Title</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Technical Round 1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.scheduledAt}
                                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
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
                                            {member.full_name} <span className="text-xs text-slate-400">({member.role})</span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <Button className="w-full" onClick={handleSchedule} disabled={loading}>
                        {loading ? "Scheduling..." : "Confirm Schedule"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
