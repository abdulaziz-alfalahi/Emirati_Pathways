import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
import { formatDateFromString } from '@/utils/dateFormat';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'interview' | 'offer' | 'rejected' | 'withdrawn' | 'accepted' | 'shortlisted';
  lastUpdate: string;
  notes?: string;
  interviewDate?: string;
  interviewType?: 'phone' | 'video' | 'in-person';
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
  applicationType?: 'job' | 'internship' | 'gig' | 'other';
  // Extra details for internships/gigs
  description?: string;
  duration?: string;
  skills?: string[];
  deadline?: string;
  sector?: string;
  stipend?: string;
  budget?: string;
  category?: string;
}

interface ApplicationTrackerProps {
  candidateId?: string;
}

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ candidateId }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Withdraw dialog state
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsApplication, setDetailsApplication] = useState<Application | null>(null);

  useEffect(() => {
    loadApplications();
  }, [candidateId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      // Fetch job applications
      let jobApps: Application[] = [];
      try {
        const response = await restClient.get('/api/jobs/applications');
        if (response.data.success) {
          jobApps = (response.data.data.applications || []).map((app: any, index: number) => ({
            id: app.application_id || app.id || `job-${index}-${Date.now()}`,
            jobTitle: app.jobTitle || app.job_title || 'Unknown Position',
            company: app.company || 'Confidential',
            location: app.location || 'UAE',
            appliedDate: app.appliedDate || app.applied_date || app.submitted_at || new Date().toISOString(),
            status: app.status || 'pending',
            lastUpdate: app.lastUpdate || app.last_updated || app.updated_at || new Date().toISOString(),
            notes: app.notes,
            interviewDate: app.interviewDate || app.interview_date,
            interviewType: app.interviewType || app.interview_type,
            contactPerson: app.contactPerson || app.contact_person,
            applicationType: 'job',
          }));
        }
      } catch { /* job applications endpoint may fail — continue */ }

      // Fetch internship + gig applications
      let csApps: Application[] = [];
      try {
        const csResp = await restClient.get('/api/career-services/my-applications');
        if (csResp.data.success) {
          csApps = (csResp.data.data.applications || []).map((app: any, index: number) => ({
            id: `${app.application_type}-${app.application_id || index}`,
            jobTitle: app.jobTitle || 'Unknown',
            company: app.company || 'Unknown',
            location: app.location || 'UAE',
            appliedDate: app.appliedDate || new Date().toISOString(),
            status: app.status || 'pending',
            lastUpdate: app.lastUpdate || app.appliedDate || new Date().toISOString(),
            applicationType: app.application_type || 'other',
            // Extra details
            description: app.description || '',
            duration: app.duration || '',
            skills: app.skills || [],
            deadline: app.deadline || '',
            sector: app.sector || '',
            stipend: app.stipend || '',
            budget: app.budget || '',
            category: app.category || '',
          }));
        }
      } catch { /* career-services endpoint may fail — continue */ }

      // Merge all applications
      const all = [...jobApps, ...csApps];
      // Sort by date descending
      all.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
      setApplications(all);
    } catch (error) {
      console.error('Error loading applications:', error);
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
        toast.error(response.data.message || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'under_review':
      case 'reviewed':
      case 'shortlisted':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'offer':
      case 'accepted':
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
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
      case 'reviewed':
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
      case 'accepted':
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
      case 'submitted':
        return t('Pending Review', 'قيد المراجعة');
      case 'under_review':
      case 'reviewed':
        return t('Under Review', 'تحت المراجعة');
      case 'shortlisted':
        return t('Shortlisted', 'في القائمة المختصرة');
      case 'interview':
        return t('Interview Scheduled', 'مقابلة مجدولة');
      case 'offer':
        return t('Offer Received', 'تم استلام عرض');
      case 'accepted':
        return t('Accepted', 'مقبول');
      case 'rejected':
        return t('Not Selected', 'لم يتم الاختيار');
      case 'withdrawn':
        return t('Withdrawn', 'تم السحب');
      default:
        return status;
    }
  };

  const canWithdraw = (status: string) => {
    // Can only withdraw if application is still active (not rejected, withdrawn, or offer accepted)
    return ['pending', 'submitted', 'under_review', 'reviewed', 'shortlisted', 'interview'].includes(status);
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
          <CardTitle>{t('Application Tracker', 'متتبع الطلبات')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('Loading your applications...', 'جاري تحميل طلباتك...')}</p>
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
              {application.applicationType && application.applicationType !== 'job' && (
                <Badge className={application.applicationType === 'internship' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'}>
                  {application.applicationType === 'internship' ? t('Internship', 'تدريب') : t('Gig', 'عمل حر')}
                </Badge>
              )}
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
            <p className="text-sm text-muted-foreground">{t('Applied Date', 'تاريخ التقديم')}</p>
            <p className="font-medium">{formatDateFromString(application.appliedDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Last Update', 'آخر تحديث')}</p>
            <p className="font-medium">{formatDateFromString(application.lastUpdate)}</p>
          </div>
        </div>

        {application.interviewDate && application.status !== 'withdrawn' && (
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-800">{t('Interview Scheduled', 'مقابلة مجدولة')}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>{t('Date:', 'التاريخ:')}</strong> {formatDateFromString(application.interviewDate)}</p>
              <p><strong>{t('Type:', 'النوع:')}</strong> {application.interviewType}</p>
            </div>
          </div>
        )}

        {application.contactPerson && application.status !== 'withdrawn' && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">{t('Contact Person', 'شخص الاتصال')}</h4>
            <div className="space-y-1 text-sm">
              <p><strong>{t('Name:', 'الاسم:')}</strong> {application.contactPerson.name}</p>
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
              <h4 className="font-medium text-gray-800">{t('Notes', 'ملاحظات')}</h4>
            </div>
            <p className="text-sm text-gray-700">{application.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {application.status === 'interview' && (
            <Button size="sm" onClick={() => navigate('/candidate-dashboard?tab=interviews')}>
              <Calendar className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
              {t('View Interview Details', 'عرض تفاصيل المقابلة')}
            </Button>
          )}
          {application.status === 'offer' && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setDetailsApplication(application); setDetailsDialogOpen(true); }}>
              <CheckCircle className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
              {(application.applicationType === 'internship' || application.applicationType === 'gig')
                ? t('View Acceptance Details', 'عرض تفاصيل القبول')
                : t('View Offer', 'عرض العرض')}
            </Button>
          )}
          {application.status !== 'withdrawn' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/candidate-dashboard?tab=messages')}
            >
              <MessageSquare className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
              {t('Contact Employer', 'التواصل مع الموظِّف')}
            </Button>
          )}
          {canWithdraw(application.status) && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleWithdrawClick(application)}
            >
              <XCircle className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
              {t('Withdraw Application', 'سحب الطلب')}
            </Button>
          )}
          {application.status === 'withdrawn' && (
            <span className="text-sm text-gray-500 italic flex items-center">
              <AlertTriangle className="h-4 w-4" style={{ marginInlineEnd: 4 }} />
              {t('Application withdrawn', 'تم سحب الطلب')}
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
          <CardTitle>{t('Application Tracker', 'متتبع الطلبات')}</CardTitle>
          <CardDescription>
            {t('Track the status of your job applications', 'تتبع حالة طلبات التوظيف الخاصة بك')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">{t('All', 'الكل')} ({getTabCount()})</TabsTrigger>
              <TabsTrigger value="pending">{t('Pending', 'قيد الانتظار')} ({getTabCount('pending')})</TabsTrigger>
              <TabsTrigger value="reviewed">{t('Reviewed', 'تمت المراجعة')} ({getTabCount('reviewed')})</TabsTrigger>
              <TabsTrigger value="interview">{t('Interview Stage', 'مرحلة المقابلة')} ({getTabCount('interview')})</TabsTrigger>
              <TabsTrigger value="offer">{t('Offers', 'عروض')} ({getTabCount('offer')})</TabsTrigger>
              <TabsTrigger value="rejected">{t('Rejected', 'مرفوض')} ({getTabCount('rejected')})</TabsTrigger>
              <TabsTrigger value="withdrawn">{t('Withdrawn', 'مسحوب')} ({getTabCount('withdrawn')})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {applications.length > 0 ? (
                applications.map(renderApplicationCard)
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('No Applications Yet', 'لا توجد طلبات بعد')}</h3>
                  <p className="text-muted-foreground">
                    {t('Start applying to jobs to track your applications here.', 'ابدأ بالتقديم على الوظائف لتتبع طلباتك هنا.')}
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
                  <h4 className="font-semibold text-gray-600 mb-1">{t('No Pending Applications', 'لا توجد طلبات قيد الانتظار')}</h4>
                  <p className="text-sm text-muted-foreground">{t('Applications awaiting review will appear here.', 'الطلبات التي تنتظر المراجعة ستظهر هنا.')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviewed" className="mt-6">
              {filterApplications('reviewed').length > 0 ? (
                filterApplications('reviewed').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Eye className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">{t('No Applications Under Review', 'لا توجد طلبات تحت المراجعة')}</h4>
                  <p className="text-sm text-muted-foreground">{t('Applications being reviewed by employers will show here.', 'الطلبات التي يراجعها أصحاب العمل ستظهر هنا.')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="interview" className="mt-6">
              {filterApplications('interview').length > 0 ? (
                filterApplications('interview').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Calendar className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">{t('No Scheduled Interviews', 'لا توجد مقابلات مجدولة')}</h4>
                  <p className="text-sm text-muted-foreground">{t("When employers schedule interviews, they'll appear here.", 'عندما يجدول أصحاب العمل مقابلات، ستظهر هنا.')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="offer" className="mt-6">
              {filterApplications('offer').length > 0 ? (
                filterApplications('offer').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">{t('No Offers Received', 'لم يتم استلام عروض')}</h4>
                  <p className="text-sm text-muted-foreground">{t('Job offers from employers will appear here.', 'عروض العمل من أصحاب العمل ستظهر هنا.')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {filterApplications('rejected').length > 0 ? (
                filterApplications('rejected').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <XCircle className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">{t('No Rejected Applications', 'لا توجد طلبات مرفوضة')}</h4>
                  <p className="text-sm text-muted-foreground">{t('Keep applying — this section will stay empty with the right match!', 'استمر بالتقديم — هذا القسم سيبقى فارغاً مع المطابقة الصحيحة!')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="withdrawn" className="mt-6">
              {filterApplications('withdrawn').length > 0 ? (
                filterApplications('withdrawn').map(renderApplicationCard)
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="h-10 w-10 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-600 mb-1">{t('No Withdrawn Applications', 'لا توجد طلبات مسحوبة')}</h4>
                  <p className="text-sm text-muted-foreground">{t('Applications you withdraw will appear here.', 'الطلبات التي تسحبها ستظهر هنا.')}</p>
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
              {t('Withdraw Application', 'سحب الطلب')}
            </DialogTitle>
            <DialogDescription>
              {t(
                `Are you sure you want to withdraw your application for`,
                `هل أنت متأكد من سحب طلبك لوظيفة`
              )}{' '}
              <strong>{selectedApplication?.jobTitle}</strong> {t('at', 'في')}{' '}
              <strong>{selectedApplication?.company}</strong>{t('?', '؟')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>{t('Note:', 'ملاحظة:')}</strong> {t('This action cannot be undone. You may not be able to reapply for this position.', 'لا يمكن التراجع عن هذا الإجراء. قد لا تتمكن من إعادة التقديم لهذا المنصب.')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-reason">{t('Reason for withdrawal (optional)', 'سبب السحب (اختياري)')}</Label>
              <Textarea
                id="withdraw-reason"
                placeholder={t('e.g., Accepted another offer, Personal reasons, Changed career direction...', 'مثلاً: قبلت عرضاً آخر، أسباب شخصية، تغيير في المسار المهني...')}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('This information helps employers improve their hiring process.', 'هذه المعلومات تساعد أصحاب العمل في تحسين عملية التوظيف.')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialogOpen(false)}
              disabled={withdrawing}
            >
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdrawConfirm}
              disabled={withdrawing}
            >
              {withdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ marginInlineEnd: 8 }} />
                  {t('Withdrawing...', 'جاري السحب...')}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                  {t('Withdraw Application', 'سحب الطلب')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acceptance Details Dialog (for internships/gigs) */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('Acceptance Details', 'تفاصيل القبول')}
            </DialogTitle>
            <DialogDescription>
              {detailsApplication?.applicationType === 'internship'
                ? t('Your internship application has been accepted!', 'تم قبول طلب التدريب الخاص بك!')
                : t('Your gig application has been accepted!', 'تم قبول طلب العمل الحر الخاص بك!')}
            </DialogDescription>
          </DialogHeader>

          {detailsApplication && (
            <div className="space-y-4 py-2">
              {/* Congratulations Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-semibold text-lg">{t('Congratulations!', 'تهانينا!')}</p>
                <p className="text-green-700 text-sm mt-1">
                  {t(`You have been accepted for "${detailsApplication.jobTitle}"`, `تم قبولك في "${detailsApplication.jobTitle}"`)}
                </p>
              </div>

              {/* Position Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-teal-600" />
                  <span className="font-semibold">{detailsApplication.jobTitle}</span>
                  <Badge className={detailsApplication.applicationType === 'internship' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'}>
                    {detailsApplication.applicationType === 'internship' ? t('Internship', 'تدريب') : t('Gig', 'عمل حر')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                    <span><strong>{t('Company:', 'الشركة:')}</strong> {detailsApplication.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span><strong>{t('Location:', 'الموقع:')}</strong> {detailsApplication.location}</span>
                  </div>
                  {detailsApplication.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      <span><strong>{t('Duration:', 'المدة:')}</strong> {detailsApplication.duration}</span>
                    </div>
                  )}
                  {detailsApplication.stipend && (
                    <div className="flex items-center gap-2">
                      <span><strong>{t('Stipend:', 'الراتب:')}</strong> {detailsApplication.stipend}</span>
                    </div>
                  )}
                  {detailsApplication.budget && (
                    <div className="flex items-center gap-2">
                      <span><strong>{t('Budget:', 'الميزانية:')}</strong> {detailsApplication.budget}</span>
                    </div>
                  )}
                  {detailsApplication.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      <span><strong>{t('Deadline:', 'الموعد النهائي:')}</strong> {formatDateFromString(detailsApplication.deadline)}</span>
                    </div>
                  )}
                  {detailsApplication.sector && (
                    <div className="flex items-center gap-2">
                      <span><strong>{t('Sector:', 'القطاع:')}</strong> {detailsApplication.sector}</span>
                    </div>
                  )}
                  {detailsApplication.category && (
                    <div className="flex items-center gap-2">
                      <span><strong>{t('Category:', 'الفئة:')}</strong> {detailsApplication.category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {detailsApplication.description && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">{t('Description', 'الوصف')}</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">{detailsApplication.description}</p>
                </div>
              )}

              {/* Skills */}
              {detailsApplication.skills && detailsApplication.skills.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">{t('Required Skills', 'المهارات المطلوبة')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailsApplication.skills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Map */}
              {detailsApplication.location && (
                <div className="rounded-lg overflow-hidden border">
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="180"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(detailsApplication.location + ', UAE')}&output=embed`}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              {t('Close', 'إغلاق')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApplicationTracker;
