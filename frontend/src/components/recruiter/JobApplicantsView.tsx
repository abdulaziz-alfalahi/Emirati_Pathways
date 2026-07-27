import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
// @ts-ignore
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Video,
  Star,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  ClipboardCheck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { restClient } from '@/utils/api';
import { ScheduleVideoInterviewDialog } from './ScheduleVideoInterviewDialog';

import RecruiterCandidateView from './RecruiterCandidateView';

export interface Applicant {
  application_id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  submitted_at: string;
  last_updated: string;
  cover_letter: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  candidate_summary: string;
  technical_skills: string[] | null;
  soft_skills: string[] | null;
  // Parallel skill lists that retain the verified/source flags for badge rendering
  // (the plain *_skills arrays are flattened to strings for RecruiterCandidateView
  // backward-compat). C2-REC-1.
  technical_skills_detailed?: Array<{ name: string; verified: boolean }>;
  soft_skills_detailed?: Array<{ name: string; verified: boolean }>;
  work_experience: any[] | null;
  education: any[] | null;
  location?: string;
  match_score?: number;
  job_title?: string;
}

interface JobApplicantsViewProps {
  job: any;
  onBack: () => void;
}

// C2-REC-2: never show a raw company UUID (or blank) in the applicant header.
const _isUuid = (v?: string) =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v).trim());
const displayCompany = (job: any) =>
  job?.company_name || (job?.company && !_isUuid(job.company) ? job.company : '') || 'Company';

export const JobApplicantsView: React.FC<JobApplicantsViewProps> = ({ job, onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [expandedApplicants, setExpandedApplicants] = useState<Set<string>>(new Set());

  // Interview Dialog State
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [interviewCandidateId, setInterviewCandidateId] = useState<string | null>(null);

  // Prioritize the numeric ID (job.id) for the API call if available
  // The API expects the numeric job_id (e.g., 756), NOT the string jd_id (e.g. JD108...)
  const jobId = job?.id || job?.jd_id;
  const jdId = job?.jd_id || job?.id; // Keep strict jd_id for dialogs if they depend on it

  // Fetch applicants for this job
  const { data: applicantsData, isLoading, refetch } = useQuery({
    queryKey: ['jobApplicants', jobId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await restClient.get(`/api/recruiter/jobs/${jobId}/applicants?${params.toString()}`);
      if (response.data?.success) {
        // Normalize backend keys → the Applicant shape the card reads (C1-REC-5).
        // The API returns email/professional_summary/application_status and skills
        // that may be objects ({name,proficiency,...}) from the user_skills backfill;
        // without this the recruiter saw blank fields. candidate_id (the functional
        // users.id) is kept for actions but never rendered as a visible ID.
        const skillName = (s: any) =>
          typeof s === 'string' ? s : (s?.name || s?.skill || s?.skill_name || '');
        // Keep the verified/source flags for the badge (C2-REC-1): a skill is
        // "verified" when it came from an assessment. The backend applicant payload
        // marks each skill object {name, proficiency, source, verified}.
        const skillMeta = (s: any) => ({
          name: skillName(s),
          verified: typeof s === 'object' && s !== null && !!(s.verified || s.source === 'assessment'),
        });
        const detailed = (arr: any) =>
          Array.isArray(arr) ? arr.map(skillMeta).filter((x: any) => x.name) : [];
        const norm = (c: any) => ({
          ...c,
          candidate_email: c.candidate_email || c.email,
          candidate_phone: c.candidate_phone || c.phone || c.personal_info?.phone,
          candidate_summary: c.candidate_summary || c.professional_summary,
          status: c.status || c.application_status,
          technical_skills_detailed: detailed(c.technical_skills),
          soft_skills_detailed: detailed(c.soft_skills),
          technical_skills: Array.isArray(c.technical_skills)
            ? c.technical_skills.map(skillName).filter(Boolean) : c.technical_skills,
          soft_skills: Array.isArray(c.soft_skills)
            ? c.soft_skills.map(skillName).filter(Boolean) : c.soft_skills,
        });
        return {
          ...response.data,
          candidates: (response.data.candidates || []).map(norm),
          top_matches: (response.data.top_matches || []).map(norm),
        };
      }
      throw new Error('Failed to fetch applicants');
    },
    enabled: !!jobId,
  });

  const applicants = applicantsData?.candidates || [];
  const pagination = { total: applicantsData?.count || applicants.length || 0 };

  // Toggle expanded state for an applicant
  const toggleExpanded = (applicationId: string) => {
    setExpandedApplicants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
      'pending': { variant: 'secondary', label: 'New', icon: <Clock className="h-3 w-3" /> },
      'submitted': { variant: 'secondary', label: 'New', icon: <Clock className="h-3 w-3" /> },
      'under_review': { variant: 'default', label: 'In Review', icon: <FileText className="h-3 w-3" /> },
      'screening': { variant: 'default', label: 'Screening', icon: <FileText className="h-3 w-3" /> },
      'interview_scheduled': { variant: 'outline', label: 'Interview', icon: <Video className="h-3 w-3" /> },
      'interview': { variant: 'outline', label: 'Interview', icon: <Video className="h-3 w-3" /> },
      'offer_extended': { variant: 'default', label: 'Offer Sent', icon: <Star className="h-3 w-3" /> },
      'offer': { variant: 'default', label: 'Offer Sent', icon: <Star className="h-3 w-3" /> },
      'hired': { variant: 'default', label: 'Hired', icon: <CheckCircle className="h-3 w-3" /> },
      'rejected': { variant: 'destructive', label: 'Rejected', icon: <XCircle className="h-3 w-3" /> },
    };
    return statusConfig[status] || { variant: 'secondary', label: status, icon: null };
  };

  // Update applicant status
  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      // When shortlisting, also add to the shortlisted_candidates table
      if (newStatus === 'shortlisted') {
        const applicant = applicants.find(
          (a: Applicant) => a.application_id === applicationId
        );
        if (applicant) {
          // Get current user from localStorage  
          let recruiterId = '';
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const u = JSON.parse(userStr);
              recruiterId = String(u.id || '');
            }
          } catch (e) { /* ignore */ }

          await restClient.post('/api/recruiter/jd/shortlist/add', {
            jd_id: jdId,
            candidate_id: applicant.candidate_id,
            recruiter_id: recruiterId,
            notes: `Shortlisted from applicant review`,
          });
        }
      }

      toast({
        title: 'Status Updated',
        description: `Application status changed to ${newStatus}`,
      });
      refetch();
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update application status',
      });
    }
  };

  // Handle Message Action
  const handleMessage = async (applicant: Applicant) => {
    try {
      // 1. Create or find conversation
      const response = await restClient.post('/api/communication/conversations', {
        participants: [applicant.candidate_id],
        sender_role: 'recruiter',
        job_id: jobId,
        application_id: applicant.application_id,
        title: job?.title || 'Job Application'
      });

      if (response.data?.success) {
        const conversationId = response.data.data.id;
        // 2. Navigate to messages tab with conversation ID
        // Check role for correct dashboard redirection
        let role = '';
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            role = user.role || user.user_type || '';
          }
        } catch (e) {
          console.error('Error parsing user role', e);
        }

        if (role === 'employer_admin' || role === 'employer_admin') {
          navigate(`/hr-dashboard?tab=messages&conversationId=${conversationId}`);
        } else {
          navigate(`/recruiter?tab=messages&conversationId=${conversationId}`);
        }
      } else {
        throw new Error('Failed to start conversation');
      }
    } catch (error) {
      console.error('Message error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open conversation. Please try again.',
      });
    }
  };

  // Handle Schedule Interview Action
  const handleScheduleInterview = (applicant: Applicant) => {
    setInterviewCandidateId(applicant.candidate_id);
    setIsInterviewDialogOpen(true);
  };

  // Request a skills assessment of this candidate (Rework B). The candidate must
  // consent before it proceeds to an assessor; results are shared back on consent+completion.
  const [assessingId, setAssessingId] = useState<string | null>(null);
  const requestAssessment = async (applicant: Applicant) => {
    if (assessingId) return;
    setAssessingId(applicant.application_id);
    try {
      await restClient.post('/api/assessor/recruiter/request', {
        candidate_id: applicant.candidate_id,
        title: `${job?.title || 'Role'} — Skills Assessment`,
      });
      toast({ title: 'Assessment requested', description: 'The candidate will be asked to consent before it proceeds.' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Please try again.';
      toast({ title: 'Could not request assessment', description: msg, variant: 'destructive' });
    } finally {
      setAssessingId(null);
    }
  };

  // Add a certified assessor to a candidate's interview panel by Emirates ID
  // (C2-REC-5). The recruiter couldn't invite an external assessor before — the
  // colleague picker only listed internal team. This finds the candidate's
  // interview for the job and appends the assessor to its interviewers list.
  const [panelApplicant, setPanelApplicant] = useState<Applicant | null>(null);
  const [panelEid, setPanelEid] = useState('');
  const [panelName, setPanelName] = useState('');
  const [panelSubmitting, setPanelSubmitting] = useState(false);
  const submitAddPanelist = async () => {
    if (!panelApplicant || !panelEid.trim()) return;
    setPanelSubmitting(true);
    try {
      const res = await restClient.get(`/api/recruiter/interviews/jd/${jdId}`);
      const list = res.data?.interviews || res.data?.data || [];
      const iv = list.find((i: any) => String(i.candidate_id) === String(panelApplicant.candidate_id));
      if (!iv) {
        toast({
          variant: 'destructive',
          title: 'No interview scheduled yet',
          description: 'Schedule an interview for this candidate first, then add the assessor to its panel.',
        });
        return;
      }
      const interviewId = iv.interview_id || iv.id;
      let existing: any = iv.interviewers;
      if (typeof existing === 'string') { try { existing = JSON.parse(existing); } catch { existing = []; } }
      if (!Array.isArray(existing)) existing = [];
      await restClient.put(`/api/recruiter/interviews/${interviewId}`, {
        interviewers: [...existing, { id: panelEid.trim(), name: panelName.trim() || panelEid.trim() }],
      });
      toast({ title: 'Assessor added to panel', description: 'They can now open the interview scorecard.' });
      setPanelApplicant(null); setPanelEid(''); setPanelName('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Please try again.';
      toast({ variant: 'destructive', title: 'Could not add assessor', description: msg });
    } finally {
      setPanelSubmitting(false);
    }
  };

  // No closing brace here!

  // If viewing a specific candidate detailed profile
  if (selectedApplicant) {
    return (
      <>
        <RecruiterCandidateView
          applicant={selectedApplicant}
          onBack={() => setSelectedApplicant(null)}
          onMessage={handleMessage}
          onScheduleInterview={handleScheduleInterview}
          onUpdateStatus={updateStatus}
        />
        {/* Dialog must render here too — otherwise the early return hides it */}
        <ScheduleVideoInterviewDialog
          open={isInterviewDialogOpen}
          onOpenChange={setIsInterviewDialogOpen}
          initialJobId={jdId}
          initialCandidateId={interviewCandidateId || undefined}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              Applicants for: {job?.title || 'Job'}
              <Badge variant="outline" className="text-base">
                {pagination.total} Total
              </Badge>
            </h2>
            <p className="text-muted-foreground">
              {displayCompany(job)} • {job?.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Status:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">New / Pending</SelectItem>
                <SelectItem value="under_review">In Review</SelectItem>
                <SelectItem value="interview_scheduled">Interview</SelectItem>
                <SelectItem value="offer_extended">Offer Extended</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applicants List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : applicants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No applicants yet</h3>
            <p className="text-muted-foreground">
              {statusFilter !== 'all'
                ? 'No applicants match the selected filter. Try changing the filter.'
                : 'When candidates apply for this job, they will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applicants.map((applicant: Applicant) => {
            const statusInfo = getStatusBadge(applicant.status);
            const isExpanded = expandedApplicants.has(applicant.application_id);

            return (
              <Card key={applicant.application_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Main Info Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-700 font-semibold">
                            {applicant.candidate_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3
                              className="font-semibold text-lg cursor-pointer hover:text-blue-600 hover:underline"
                              onClick={() => setSelectedApplicant({
                                ...applicant,
                                job_id: applicant.job_id || jobId, // Ensure job_id is present
                                job_title: job?.title, // Pass job title for modal context
                              })}
                            >
                              {applicant.candidate_name || 'Unknown Candidate'}
                            </h3>
                            {applicant.match_score !== undefined && (
                              <Badge
                                variant={applicant.match_score >= 80 ? 'default' : applicant.match_score >= 60 ? 'secondary' : 'outline'}
                                className={`font-bold ${applicant.match_score >= 80 ? 'bg-emerald-500 hover:bg-emerald-600' :
                                  applicant.match_score >= 60 ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                                  }`}
                              >
                                {applicant.match_score}% Match
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {applicant.candidate_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {applicant.candidate_email}
                              </div>
                            )}
                            {applicant.candidate_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {applicant.candidate_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Application Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied: {formatDate(applicant.submitted_at)}
                        </div>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Expand/Collapse Toggle */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(applicant.application_id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Cover Letter */}
                      {applicant.cover_letter && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Cover Letter
                          </h4>
                          <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                            {applicant.cover_letter}
                          </p>
                        </div>
                      )}

                      {/* Summary */}
                      {applicant.candidate_summary && (
                        <div>
                          <h4 className="font-medium mb-2">Professional Summary</h4>
                          <p className="text-sm text-muted-foreground">
                            {applicant.candidate_summary}
                          </p>
                        </div>
                      )}

                      {/* Skills — assessment-verified skills get a distinct badge (C2-REC-1) */}
                      {(applicant.technical_skills_detailed?.length || applicant.soft_skills_detailed?.length ||
                        applicant.technical_skills?.length || applicant.soft_skills?.length) ? (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(applicant.technical_skills_detailed?.length
                              ? applicant.technical_skills_detailed
                              : (applicant.technical_skills || []).map((s) => ({ name: s, verified: false }))
                            ).map((skill, idx) => (
                              skill.verified ? (
                                <Badge
                                  key={`tech-${idx}`}
                                  className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Verified by an accredited assessment"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  {skill.name} · Verified
                                </Badge>
                              ) : (
                                <Badge key={`tech-${idx}`} variant="secondary">{skill.name}</Badge>
                              )
                            ))}
                            {(applicant.soft_skills_detailed?.length
                              ? applicant.soft_skills_detailed
                              : (applicant.soft_skills || []).map((s) => ({ name: s, verified: false }))
                            ).map((skill, idx) => (
                              <Badge key={`soft-${idx}`} variant="outline">{skill.name}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Experience */}
                      {applicant.work_experience && applicant.work_experience.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Experience
                          </h4>
                          <div className="space-y-2">
                            {applicant.work_experience.slice(0, 2).map((exp: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{exp.title || exp.position}</span>
                                {exp.company && <span className="text-muted-foreground"> at {exp.company}</span>}
                                {exp.duration && <span className="text-muted-foreground"> • {exp.duration}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {applicant.education && applicant.education.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Education
                          </h4>
                          <div className="space-y-2">
                            {applicant.education.slice(0, 2).map((edu: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{edu.degree}</span>
                                {edu.institution && <span className="text-muted-foreground"> - {edu.institution}</span>}
                                {edu.year && <span className="text-muted-foreground"> ({edu.year})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => requestAssessment(applicant)} disabled={assessingId === applicant.application_id}>
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          {assessingId === applicant.application_id ? 'Requesting…' : 'Request assessment'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setPanelApplicant(applicant); setPanelEid(''); setPanelName(''); }}>
                          <Users className="h-4 w-4 mr-1" />
                          Add assessor to panel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Dialog */}
      <ScheduleVideoInterviewDialog
        open={isInterviewDialogOpen}
        onOpenChange={setIsInterviewDialogOpen}
        initialJobId={jdId}
        initialCandidateId={interviewCandidateId || undefined}
      />

      {/* Add assessor to interview panel (C2-REC-5) */}
      <Dialog open={!!panelApplicant} onOpenChange={(o) => { if (!o) setPanelApplicant(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add assessor to interview panel</DialogTitle>
            <DialogDescription>
              Add a certified assessor by Emirates ID to{' '}
              {panelApplicant?.candidate_name || 'this candidate'}'s scheduled interview so they can complete the scorecard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Assessor Emirates ID"
              value={panelEid}
              onChange={(e) => setPanelEid(e.target.value)}
            />
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Assessor name (optional)"
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPanelApplicant(null)}>Cancel</Button>
              <Button onClick={submitAddPanelist} disabled={!panelEid.trim() || panelSubmitting}>
                {panelSubmitting ? 'Adding…' : 'Add to panel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default JobApplicantsView;
