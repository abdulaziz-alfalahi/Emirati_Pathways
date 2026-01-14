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
  GraduationCap
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

interface Applicant {
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
  work_experience: any[] | null;
  education: any[] | null;
}

interface JobApplicantsViewProps {
  job: any;
  onBack: () => void;
}

export const JobApplicantsView: React.FC<JobApplicantsViewProps> = ({ job, onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [expandedApplicants, setExpandedApplicants] = useState<Set<string>>(new Set());

  // Interview Dialog State
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [interviewCandidateId, setInterviewCandidateId] = useState<string | null>(null);

  const jdId = job?.jd_id || job?.id;

  // Fetch applicants for this job
  const { data: applicantsData, isLoading, refetch } = useQuery({
    queryKey: ['jobApplicants', jdId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await restClient.get(`/api/recruiter/jobs/${jdId}/applicants?${params.toString()}`);
      if (response.data?.success) {
        return response.data;
      }
      throw new Error('Failed to fetch applicants');
    },
    enabled: !!jdId,
  });

  const applicants = applicantsData?.data || [];
  const pagination = applicantsData?.pagination || { total: 0 };

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
      // This would call the backend to update status
      toast({
        title: 'Status Updated',
        description: `Application status changed to ${newStatus}`,
      });
      refetch();
    } catch (error) {
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
        participants: [applicant.candidate_id]
      });

      if (response.data?.success) {
        const conversationId = response.data.data.id;
        // 2. Navigate to messages tab with conversation ID
        navigate(`/recruiter-dashboard?tab=messages&conversationId=${conversationId}`);
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
              {job?.company} • {job?.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
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
                          <h3 className="font-semibold text-lg">{applicant.candidate_name || 'Unknown Candidate'}</h3>
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessage(applicant)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleInterview(applicant)}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Schedule Interview
                      </Button>
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

                      {/* Skills */}
                      {(applicant.technical_skills?.length || applicant.soft_skills?.length) && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {applicant.technical_skills?.map((skill, idx) => (
                              <Badge key={`tech-${idx}`} variant="secondary">{skill}</Badge>
                            ))}
                            {applicant.soft_skills?.map((skill, idx) => (
                              <Badge key={`soft-${idx}`} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

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

                      {/* Status Update */}
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-sm font-medium">Update Status:</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(applicant.application_id, 'under_review')}>
                            Move to Review
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleScheduleInterview(applicant)}>
                            Schedule Interview
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(applicant.application_id, 'rejected')}>
                            Reject
                          </Button>
                        </div>
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
    </div>
  );
};

export default JobApplicantsView;
