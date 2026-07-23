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

  useEffect(() => {
    loadApplications();
  }, []);

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
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Recruiter Application Management</h3>
              <p className="text-gray-600 mb-6">
                This section is for recruiters and HR managers to review and manage job applications.
              </p>
              <p className="text-sm text-gray-500">
                Feature coming soon in the next phase of development.
              </p>
            </div>
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

