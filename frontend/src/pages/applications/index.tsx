import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Phone,
  Video,
  User,
  Mail,
  Edit,
  Trash2,
  Download,
  Filter
} from 'lucide-react';
import { applicationService, Application } from '@/services/applicationService';
import QuickMessageDialog from '@/components/messaging/QuickMessageDialog';
import { useToast } from '@/hooks/use-toast';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import { restClient } from '@/utils/api';

// Frontend mirror of backend RECRUITER_ROLES (backend/auth/access_control.py):
// ADMIN_ROLES | {recruiter, employer_admin, talent_operator, employer_relations}.
// The backend remains the authority — this only decides which UI to render.
const RECRUITER_CAPABLE_ROLES = [
  'recruiter', 'employer_admin', 'talent_operator', 'employer_relations',
  'admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator',
];

// Read roles the way the rest of the app does: localStorage 'user' (role,
// user_type mirror, secondary_roles, roles[]) plus the RoleSwitcher's 'activeRole'.
const getStoredUserRoles = (): string[] => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roles: unknown[] = [
      user.role,
      user.user_type,
      ...(Array.isArray(user.roles) ? user.roles : []),
      ...(Array.isArray(user.secondary_roles) ? user.secondary_roles : []),
      localStorage.getItem('activeRole'),
    ];
    return roles.filter((r): r is string => typeof r === 'string' && r.length > 0)
      .map(r => r.toLowerCase());
  } catch {
    return [];
  }
};

interface RecruiterJob {
  id: string;
  title: string;
  company?: string;
  applications?: number;
  status?: string;
}

// Statuses a recruiter may set via PUT /api/applications/<id>/status.
const RECRUITER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

// Never show a full Emirates ID on screen — last 4 digits only.
const maskCandidateId = (candidateId?: string): string => {
  if (!candidateId) return '—';
  return `•••• ${candidateId.slice(-4)}`;
};

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-applications');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedApplicationForMessage, setSelectedApplicationForMessage] = useState<Application | null>(null);
  const { toast } = useToast();

  // Recruiter-side "Manage Applications" state (catalog EJ-02).
  const isRecruiterView = getStoredUserRoles().some(r => RECRUITER_CAPABLE_ROLES.includes(r));
  const [recruiterJobs, setRecruiterJobs] = useState<RecruiterJob[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobApplications, setJobApplications] = useState<Application[]>([]);
  const [isJobAppsLoading, setIsJobAppsLoading] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  // Lazily load the recruiter's job postings the first time the manage tab opens.
  useEffect(() => {
    if (activeTab === 'manage-applications' && isRecruiterView && !jobsLoaded) {
      loadRecruiterJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isRecruiterView, jobsLoaded]);

  const loadRecruiterJobs = async () => {
    setIsJobsLoading(true);
    try {
      // Same endpoint the recruiter dashboard uses for its job list.
      const response = await restClient.get('/api/recruiter/jd/list');
      const jobs: RecruiterJob[] = (response.data?.job_descriptions || [])
        .filter((j: any) => j && j.id)
        .map((j: any) => ({
          id: String(j.id),
          title: j.title || 'Untitled posting',
          company: j.company,
          applications: typeof j.applications === 'number' ? j.applications : undefined,
          status: j.status,
        }));
      setRecruiterJobs(jobs);
    } catch (error) {
      console.error('Error loading recruiter job postings:', error);
      setRecruiterJobs([]);
      toast({
        title: "Error",
        description: "Failed to load your job postings",
        variant: "destructive",
      });
    } finally {
      setIsJobsLoading(false);
      setJobsLoaded(true);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    setIsJobAppsLoading(true);
    try {
      const response = await applicationService.getJobApplications(jobId);
      if (response.success) {
        setJobApplications(Array.isArray(response.data) ? response.data : []);
      } else {
        setJobApplications([]);
        toast({
          title: "Error",
          description: response.error || "Failed to load applications for this job",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading job applications:', error);
      setJobApplications([]);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading applications",
        variant: "destructive",
      });
    } finally {
      setIsJobAppsLoading(false);
    }
  };

  const handleRecruiterStatusChange = async (applicationId: string, newStatus: string) => {
    const previous = jobApplications;
    setUpdatingApplicationId(applicationId);
    // Optimistic update; rolled back on failure.
    setJobApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: newStatus, updated_at: new Date().toISOString() }
          : app
      )
    );
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus);
      if (response.success) {
        const label = RECRUITER_STATUS_OPTIONS.find(o => o.value === newStatus)?.label || newStatus;
        toast({
          title: "Status updated",
          description: `Application moved to ${label}.`,
        });
      } else {
        setJobApplications(previous);
        toast({
          title: "Error",
          description: response.error || "Failed to update application status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      setJobApplications(previous);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const response = await applicationService.getMyApplications();

      if (response.success) {
        setApplications(response.data || []);
      } else {
        // API failed: show honest empty state rather than fabricated data
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      // On error: show honest empty state rather than fabricated data
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    setIsUpdating(true);
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus, notes);

      if (response.success) {
        toast({
          title: "Success",
          description: "Application status updated successfully!",
        });

        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: newStatus, updated_at: new Date().toISOString() }
              : app
          )
        );
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update application status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWithdrawApplication = async (applicationId: string, reason?: string) => {
    setIsUpdating(true);
    try {
      const response = await applicationService.withdrawApplication(applicationId, reason);

      if (response.success) {
        toast({
          title: "Success",
          description: "Application withdrawn successfully!",
        });

        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: 'withdrawn', updated_at: new Date().toISOString() }
              : app
          )
        );
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to withdraw application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenMessageDialog = (application: Application) => {
    setSelectedApplicationForMessage(application);
    setIsMessageDialogOpen(true);
  };

  const handleMessageSent = () => {
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the recruiter.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-orange-100 text-orange-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-green-200 text-green-900';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'interview_scheduled': return 'bg-orange-100 text-orange-800';
      case 'interview_completed': return 'bg-indigo-100 text-indigo-800';
      case 'offer_made': return 'bg-green-100 text-green-800';
      case 'offer_accepted': return 'bg-green-200 text-green-900';
      case 'offer_declined': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <FileText className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      case 'interview': return <Calendar className="h-4 w-4" />;
      case 'offer': return <TrendingUp className="h-4 w-4" />;
      case 'hired': return <CheckCircle className="h-4 w-4" />;
      case 'shortlisted': return <Star className="h-4 w-4" />;
      case 'interview_scheduled': return <Calendar className="h-4 w-4" />;
      case 'interview_completed': return <CheckCircle className="h-4 w-4" />;
      case 'offer_made': return <TrendingUp className="h-4 w-4" />;
      case 'offer_accepted': return <CheckCircle className="h-4 w-4" />;
      case 'offer_declined': return <XCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'withdrawn': return <XCircle className="h-4 w-4" />;
      case 'on_hold': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = (status: string) => {
    const statusOrder = [
      'submitted', 'reviewed', 'shortlisted', 'interview_scheduled',
      'interview_completed', 'offer_made', 'offer_accepted'
    ];
    const index = statusOrder.indexOf(status);
    return index >= 0 ? ((index + 1) / statusOrder.length) * 100 : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredApplications = applications.filter(app =>
    filterStatus === 'all' || app.status === filterStatus
  );

  const stats = [
    {
      value: applications.length.toString(),
      label: 'Total Applications',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      value: applications.filter(a => a.status === 'interview_scheduled' || a.status === 'interview_completed').length.toString(),
      label: 'Interviews',
      icon: Calendar,
      color: 'text-orange-600'
    },
    {
      value: applications.filter(a => a.status === 'offer_made' || a.status === 'offer_accepted').length.toString(),
      label: 'Offers',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      value: applications.filter(a => a.status === 'shortlisted').length.toString(),
      label: 'Shortlisted',
      icon: Star,
      color: 'text-purple-600'
    },
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">📋 Application Management</h1>
              <p className="text-xl opacity-90">Track your job applications and manage recruitment processes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <AiAssistPanel
          feature="application_insights"
          title="AI application insights"
          titleAr="رؤى الطلبات بالذكاء الاصطناعي"
          getContext={() => {
            const byStatus: Record<string, number> = {};
            applications.forEach(app => {
              byStatus[app.status] = (byStatus[app.status] || 0) + 1;
            });
            return {
              applications_summary: { total: applications.length, by_status: byStatus },
              target_roles: Array.from(new Set(applications.map(a => a.job_title).filter(Boolean))).slice(0, 30),
              statuses: Object.keys(byStatus).slice(0, 30),
            };
          }}
          className="mb-6"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Applications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="interview_completed">Interview Completed</SelectItem>
                  <SelectItem value="offer_made">Offer Made</SelectItem>
                  <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setFilterStatus('all')}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-applications">My Applications</TabsTrigger>
            <TabsTrigger value="manage-applications">Manage Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="my-applications" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No applications found</h3>
                <p className="text-gray-600 mb-6">You haven't applied to any jobs yet or no applications match your filters.</p>
                <Button onClick={() => window.location.href = '/jobs'}>
                  <Briefcase className="h-4 w-4 me-2" />
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{application.job_title}</h3>
                            <Badge className={getStatusColor(application.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(application.status)}
                                <span className="capitalize">{application.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {application.company_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              Expected: {application.salary_currency} {application.expected_salary?.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Applied: {formatDate(application.created_at)}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Application Progress</span>
                              <span>{Math.round(getProgressPercentage(application.status))}%</span>
                            </div>
                            <Progress value={getProgressPercentage(application.status)} className="h-2" />
                          </div>

                          {/* Match Score */}
                          {application.match_score && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>Match Score: {application.match_score}%</span>
                                {application.skills_match_percentage && (
                                  <span className="text-gray-500">
                                    (Skills: {application.skills_match_percentage}%, Experience: {application.experience_match_percentage}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Cover Letter Preview */}
                          {application.cover_letter && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-700 line-clamp-2">
                                <strong>Cover Letter:</strong> {application.cover_letter}
                              </p>
                            </div>
                          )}

                          {/* Timeline */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {application.reviewed_at && (
                              <span>Reviewed: {formatDate(application.reviewed_at)}</span>
                            )}
                            {application.shortlisted_at && (
                              <span>Shortlisted: {formatDate(application.shortlisted_at)}</span>
                            )}
                            {application.offer_made_at && (
                              <span>Offer Made: {formatDate(application.offer_made_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="h-4 w-4 me-2" />
                          View Details
                        </Button>

                        {application.status === 'offer_made' && (
                          <>
                            <Button
                              onClick={() => handleStatusUpdate(application.id, 'offer_accepted')}
                              disabled={isUpdating}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 me-2" />
                              Accept Offer
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleStatusUpdate(application.id, 'offer_declined')}
                              disabled={isUpdating}
                            >
                              <XCircle className="h-4 w-4 me-2" />
                              Decline Offer
                            </Button>
                          </>
                        )}

                        {['submitted', 'reviewed', 'shortlisted'].includes(application.status) && (
                          <Button
                            variant="outline"
                            onClick={() => handleWithdrawApplication(application.id)}
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            Withdraw
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => handleOpenMessageDialog(application)}
                        >
                          <MessageSquare className="h-4 w-4 me-2" />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage-applications" className="space-y-6">
            {!isRecruiterView ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Recruiter Application Management</h3>
                <p className="text-gray-600 mb-2">This view is for recruiters and HR managers.</p>
                <p className="text-gray-600" dir="rtl">هذه الواجهة لمسؤولي التوظيف</p>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5" />
                      <span>Your Job Postings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isJobsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-3 text-gray-600">Loading your job postings...</p>
                      </div>
                    ) : recruiterJobs.length === 0 ? (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-semibold mb-1">No job postings found</h3>
                        <p className="text-gray-600">
                          You don't have any job postings yet. Create one from the recruiter dashboard to manage applications.
                        </p>
                      </div>
                    ) : (
                      <Select value={selectedJobId} onValueChange={handleSelectJob}>
                        <SelectTrigger className="w-full md:w-96">
                          <SelectValue placeholder="Select a job posting" />
                        </SelectTrigger>
                        <SelectContent>
                          {recruiterJobs.map(job => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title}
                              {typeof job.applications === 'number'
                                ? ` (${job.applications} application${job.applications === 1 ? '' : 's'})`
                                : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>

                {selectedJobId && (
                  isJobAppsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading applications...</p>
                    </div>
                  ) : jobApplications.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                      <p className="text-gray-600">No one has applied to this job posting yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobApplications.map(application => (
                        <Card key={application.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <User className="h-5 w-5 text-gray-500" />
                                  <span className="font-semibold">
                                    Candidate {maskCandidateId(application.candidate_id)}
                                  </span>
                                  <Badge className={getStatusColor(application.status)}>
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(application.status)}
                                      <span className="capitalize">{application.status.replace(/_/g, ' ')}</span>
                                    </div>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Applied: {application.created_at ? formatDate(application.created_at) : 'Unknown'}
                                  </div>
                                  {application.expected_salary && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-4 w-4" />
                                      Expected: {application.salary_currency} {application.expected_salary}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {application.status === 'withdrawn' ? (
                                  <span className="text-sm text-gray-500">Withdrawn by candidate</span>
                                ) : (
                                  <>
                                    <Label className="text-sm text-gray-600 whitespace-nowrap">Set status:</Label>
                                    <Select
                                      value=""
                                      onValueChange={(value) => handleRecruiterStatusChange(application.id, value)}
                                      disabled={updatingApplicationId === application.id}
                                    >
                                      <SelectTrigger className="w-44">
                                        <SelectValue placeholder="Change status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {RECRUITER_STATUS_OPTIONS.map(option => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            disabled={option.value === application.status}
                                          >
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div >

      {/* Application Details Modal */}
      {
        selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedApplication.job_title}</h2>
                    <p className="text-gray-600">{selectedApplication.company_name}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Application Status</h3>
                    <Badge className={getStatusColor(selectedApplication.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(selectedApplication.status)}
                        <span className="capitalize">{selectedApplication.status.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Application Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Expected Salary:</span>
                        <p>{selectedApplication.salary_currency} {selectedApplication.expected_salary?.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Available From:</span>
                        <p>{selectedApplication.available_from}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Notice Period:</span>
                        <p>{selectedApplication.notice_period}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Application Source:</span>
                        <p className="capitalize">{selectedApplication.source.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {selectedApplication.cover_letter && (
                    <div>
                      <h3 className="font-semibold mb-2">Cover Letter</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm">{selectedApplication.cover_letter}</p>
                      </div>
                    </div>
                  )}

                  {selectedApplication.match_score && (
                    <div>
                      <h3 className="font-semibold mb-2">Match Analysis</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Overall Match:</span>
                          <span className="font-semibold">{selectedApplication.match_score}%</span>
                        </div>
                        <Progress value={selectedApplication.match_score} className="h-2" />

                        {selectedApplication.skills_match_percentage && (
                          <>
                            <div className="flex justify-between">
                              <span>Skills Match:</span>
                              <span>{selectedApplication.skills_match_percentage}%</span>
                            </div>
                            <Progress value={selectedApplication.skills_match_percentage} className="h-2" />
                          </>
                        )}

                        {selectedApplication.experience_match_percentage && (
                          <>
                            <div className="flex justify-between">
                              <span>Experience Match:</span>
                              <span>{selectedApplication.experience_match_percentage}%</span>
                            </div>
                            <Progress value={selectedApplication.experience_match_percentage} className="h-2" />
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Applied:</span>
                        <span>{formatDate(selectedApplication.created_at)}</span>
                      </div>
                      {selectedApplication.reviewed_at && (
                        <div className="flex justify-between">
                          <span>Reviewed:</span>
                          <span>{formatDate(selectedApplication.reviewed_at)}</span>
                        </div>
                      )}
                      {selectedApplication.shortlisted_at && (
                        <div className="flex justify-between">
                          <span>Shortlisted:</span>
                          <span>{formatDate(selectedApplication.shortlisted_at)}</span>
                        </div>
                      )}
                      {selectedApplication.offer_made_at && (
                        <div className="flex justify-between">
                          <span>Offer Made:</span>
                          <span>{formatDate(selectedApplication.offer_made_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Quick Message Dialog */}
      {
        selectedApplicationForMessage && (
          <QuickMessageDialog
            isOpen={isMessageDialogOpen}
            onOpenChange={setIsMessageDialogOpen}
            recipientId="recruiter-id" // This should be dynamically set based on the application
            recipientName="Recruiter Name" // This should be dynamically set
            recipientRole="recruiter"
            context={{
              type: 'job_application',
              jobId: selectedApplicationForMessage.job_id,
              jobTitle: selectedApplicationForMessage.job_title,
              applicationId: selectedApplicationForMessage.id,
              companyName: selectedApplicationForMessage.company_name
            }}
            onMessageSent={handleMessageSent}
          />
        )
      }
    </div >
  );
};

export default ApplicationsPage;

