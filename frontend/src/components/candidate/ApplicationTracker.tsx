import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Clock,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { restClient } from '@/utils/api';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  lastUpdate: string;
  notes?: string;
  interviewDate?: string;
  interviewType?: 'phone' | 'video' | 'in-person';
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface ApplicationTrackerProps {
  candidateId?: string;
}

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ candidateId }) => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Withdraw dialog state
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [candidateId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await restClient.get('/api/jobs/applications');
      if (response.data.success) {
        // Map the backend response to match our Application interface
        // Backend returns application_id, we need id
        const mappedApplications = (response.data.data.applications || []).map((app: any, index: number) => ({
          id: app.application_id || app.id || `app-${index}-${Date.now()}`, // Ensure unique ID
          jobTitle: app.jobTitle || app.job_title || 'Unknown Position',
          company: app.company || 'Confidential',
          location: app.location || 'UAE',
          appliedDate: app.appliedDate || app.applied_date || app.submitted_at || new Date().toISOString(),
          status: app.status || 'pending',
          lastUpdate: app.lastUpdate || app.last_updated || app.updated_at || new Date().toISOString(),
          notes: app.notes,
          interviewDate: app.interviewDate || app.interview_date,
          interviewType: app.interviewType || app.interview_type,
          contactPerson: app.contactPerson || app.contact_person
        }));
        setApplications(mappedApplications);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      // Fallback to empty list or handle error UI
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = (application: Application) => {
    setSelectedApplication(application);
    setWithdrawReason('');
    setWithdrawDialogOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!selectedApplication) return;

    setWithdrawing(true);
    try {
      // Store the ID to withdraw before making the API call
      const applicationIdToWithdraw = String(selectedApplication.id);

      const response = await restClient.post(`/api/candidate/applications/${applicationIdToWithdraw}/withdraw`, {
        reason: withdrawReason
      });

      if (response.data.success) {
        // Update only the specific application by comparing string IDs
        setApplications(prev =>
          prev.map(app => {
            const appIdStr = String(app.id);
            if (appIdStr === applicationIdToWithdraw) {
              return { ...app, status: 'withdrawn' as const, lastUpdate: new Date().toISOString() };
            }
            return app;
          })
        );
        setWithdrawDialogOpen(false);
        setSelectedApplication(null);
        setWithdrawReason('');
      } else {
        alert(response.data.message || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'offer':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'withdrawn':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'reviewed':
        return 'Under Review';
      case 'interview':
        return 'Interview Scheduled';
      case 'offer':
        return 'Offer Received';
      case 'rejected':
        return 'Not Selected';
      case 'withdrawn':
        return 'Withdrawn';
      default:
        return status;
    }
  };

  const canWithdraw = (status: string) => {
    // Can only withdraw if application is still active (not rejected, withdrawn, or offer accepted)
    return ['pending', 'reviewed', 'interview'].includes(status);
  };

  const filterApplications = (status?: string) => {
    if (!status || status === 'all') return applications;
    if (status === 'withdrawn') return applications.filter(app => app.status === 'withdrawn');
    return applications.filter(app => app.status === status);
  };

  const getTabCount = (status?: string) => {
    return filterApplications(status).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderApplicationCard = (application: Application) => (
    <Card key={application.id} className={`mb-4 ${application.status === 'withdrawn' ? 'opacity-60' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold">{application.jobTitle}</h3>
              <Badge className={getStatusColor(application.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(application.status)}
                  <span>{getStatusText(application.status)}</span>
                </div>
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center space-x-1">
                <Briefcase className="h-4 w-4" />
                <span>{application.company}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{application.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Applied Date</p>
            <p className="font-medium">{new Date(application.appliedDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Update</p>
            <p className="font-medium">{new Date(application.lastUpdate).toLocaleDateString()}</p>
          </div>
        </div>

        {application.interviewDate && application.status !== 'withdrawn' && (
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-800">Interview Scheduled</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>Date:</strong> {new Date(application.interviewDate).toLocaleDateString()}</p>
              <p><strong>Type:</strong> {application.interviewType}</p>
            </div>
          </div>
        )}

        {application.contactPerson && application.status !== 'withdrawn' && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Contact Person</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {application.contactPerson.name}</p>
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>{application.contactPerson.email}</span>
              </div>
              {application.contactPerson.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>{application.contactPerson.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {application.notes && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-gray-800">Notes</h4>
            </div>
            <p className="text-sm text-gray-700">{application.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {application.status === 'interview' && (
            <Button size="sm" onClick={() => navigate('/candidate-dashboard?tab=interviews')}>
              <Calendar className="h-4 w-4 mr-2" />
              View Interview Details
            </Button>
          )}
          {application.status === 'offer' && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => navigate('/candidate-dashboard?tab=offers')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Respond to Offer
            </Button>
          )}
          {application.status !== 'withdrawn' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.hash = '#messages'}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Employer
            </Button>
          )}
          {canWithdraw(application.status) && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleWithdrawClick(application)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Withdraw Application
            </Button>
          )}
          {application.status === 'withdrawn' && (
            <span className="text-sm text-gray-500 italic flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Application withdrawn
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Application Tracker</CardTitle>
          <CardDescription>
            Track the status of your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All ({getTabCount()})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({getTabCount('pending')})</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed ({getTabCount('reviewed')})</TabsTrigger>
              <TabsTrigger value="interview">Interview ({getTabCount('interview')})</TabsTrigger>
              <TabsTrigger value="offer">Offers ({getTabCount('offer')})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({getTabCount('rejected')})</TabsTrigger>
              <TabsTrigger value="withdrawn">Withdrawn ({getTabCount('withdrawn')})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {applications.length > 0 ? (
                applications.map(renderApplicationCard)
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground">
                    Start applying to jobs to track your applications here.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              {filterApplications('pending').length > 0 ? (
                filterApplications('pending').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">No Pending Applications</h4>
                  <p className="text-sm text-muted-foreground">Applications awaiting review will appear here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviewed" className="mt-6">
              {filterApplications('reviewed').length > 0 ? (
                filterApplications('reviewed').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Eye className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">No Applications Under Review</h4>
                  <p className="text-sm text-muted-foreground">Applications being reviewed by employers will show here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="interview" className="mt-6">
              {filterApplications('interview').length > 0 ? (
                filterApplications('interview').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Calendar className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">No Scheduled Interviews</h4>
                  <p className="text-sm text-muted-foreground">When employers schedule interviews, they'll appear here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="offer" className="mt-6">
              {filterApplications('offer').length > 0 ? (
                filterApplications('offer').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">No Offers Received</h4>
                  <p className="text-sm text-muted-foreground">Job offers from employers will appear here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {filterApplications('rejected').length > 0 ? (
                filterApplications('rejected').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <XCircle className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">No Rejected Applications</h4>
                  <p className="text-sm text-muted-foreground">Keep applying — this section will stay empty with the right match!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="withdrawn" className="mt-6">
              {filterApplications('withdrawn').length > 0 ? (
                filterApplications('withdrawn').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">No Withdrawn Applications</h4>
                  <p className="text-sm text-muted-foreground">Applications you withdraw will appear here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Withdraw Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application for{' '}
              <strong>{selectedApplication?.jobTitle}</strong> at{' '}
              <strong>{selectedApplication?.company}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This action cannot be undone. You may not be able to reapply for this position.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-reason">Reason for withdrawal (optional)</Label>
              <Textarea
                id="withdraw-reason"
                placeholder="e.g., Accepted another offer, Personal reasons, Changed career direction..."
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This information helps employers improve their hiring process.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialogOpen(false)}
              disabled={withdrawing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdrawConfirm}
              disabled={withdrawing}
            >
              {withdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Withdraw Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApplicationTracker;
