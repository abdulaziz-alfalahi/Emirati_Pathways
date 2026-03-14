import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { restClient } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Calendar,
  MapPin,
  Building,
  User,
  Gift,
  FileText,
  Send,
  AlertTriangle,
  PartyPopper,
  Coins,
  MessageCircle,
  Mail
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { formatDateFromString } from '@/utils/dateFormat';

interface Offer {
  id: string;
  job_posting_id: string | null;
  job_title: string;
  company_name: string;
  job_location: string;
  status: string;
  salary_amount: number;
  salary_currency: string;
  salary_period: string;
  start_date: string | null;
  employment_type: string;
  probation_period_months: number | null;
  benefits: any;
  notes: string | null;
  expiry_date: string | null;
  recruiter_name: string;
  recruiter_email: string | null;
  candidate_response: string | null;
  response_notes: string | null;
  negotiation_notes: string | null;
  negotiation_status: string | null;
  created_at: string;
  updated_at: string | null;
}

interface OfferStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
}

export const CandidateOffers: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [csOffers, setCsOffers] = useState<any[]>([]);
  const [stats, setStats] = useState<OfferStats>({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseAction, setResponseAction] = useState<'accept' | 'decline' | 'negotiate' | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();

  // Expiry helper
  const getExpiryInfo = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: t('Expired', 'منتهي'), className: 'bg-red-100 text-red-800 border-red-200', urgent: true, days: diffDays };
    if (diffDays <= 3) return { label: `${diffDays}${t('d left', 'ي متبقي')}`, className: 'bg-red-100 text-red-800 border-red-200 animate-pulse', urgent: true, days: diffDays };
    if (diffDays <= 7) return { label: `${diffDays}${t('d left', 'ي متبقي')}`, className: 'bg-amber-100 text-amber-800 border-amber-200', urgent: false, days: diffDays };
    return { label: `${diffDays}${t('d left', 'ي متبقي')}`, className: 'bg-green-100 text-green-800 border-green-200', urgent: false, days: diffDays };
  };
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get candidate_id from localStorage or auth context
      const userData = localStorage.getItem('user');
      let candidateId = null;
      if (userData) {
        try {
          const user = JSON.parse(userData);
          candidateId = user.id || user.user_id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      const [offersRes, statsRes, csRes] = await Promise.allSettled([
        restClient.get(`/api/candidate/offers${candidateId ? `?candidate_id=${candidateId}` : ''}`),
        restClient.get(`/api/candidate/offers/stats${candidateId ? `?candidate_id=${candidateId}` : ''}`),
        restClient.get('/api/career-services/my-applications')
      ]);

      if (offersRes.status === 'fulfilled' && offersRes.value.data?.success) {
        setOffers(offersRes.value.data.data || []);
      }

      // Career services accepted offers (internships/gigs)
      let csAccepted: any[] = [];
      if (csRes.status === 'fulfilled' && csRes.value.data?.success) {
        csAccepted = (csRes.value.data.data.applications || []).filter(
          (a: any) => a.status === 'offer' || a.status === 'accepted'
        );
        setCsOffers(csAccepted);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        const s = statsRes.value.data.data;
        // Add CS offers to the stats
        setStats({
          total: s.total + csAccepted.length,
          pending: s.pending,
          accepted: s.accepted + csAccepted.length,
          declined: s.declined
        });
      } else {
        // If stats endpoint fails, compute from CS offers alone
        setStats(prev => ({
          ...prev,
          total: prev.total + csAccepted.length,
          accepted: prev.accepted + csAccepted.length
        }));
      }
    } catch (err) {
      setError(t('Failed to load offers', 'فشل تحميل العروض'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowOfferDialog(true);
  };

  const handleRespondClick = (action: 'accept' | 'decline' | 'negotiate') => {
    setResponseAction(action);
    setResponseMessage('');
    setShowOfferDialog(false);
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedOffer || !responseAction) return;

    try {
      setProcessing(true);
      const res = await restClient.post(`/api/candidate/offers/${selectedOffer.id}/respond`, {
        action: responseAction === 'negotiate' ? 'negotiate' : responseAction,
        message: responseMessage
      });

      if (res.data?.success) {
        const toastMessages: Record<string, { title: string; description: string }> = {
          accept: { title: t('Offer Accepted!', 'تم قبول العرض!'), description: t('Congratulations! The recruiter will be notified.', 'تهانينا! سيتم إخطار مسؤول التوظيف.') },
          decline: { title: t('Offer Declined', 'تم رفض العرض'), description: t('The recruiter will be notified of your decision.', 'سيتم إخطار مسؤول التوظيف بقرارك.') },
          negotiate: { title: t('Negotiation Started', 'بدأت المفاوضات'), description: t('The recruiter will be notified and can respond to your proposal.', 'سيتم إخطار مسؤول التوظيف ويمكنه الرد على مقترحك.') }
        };
        const msg = toastMessages[responseAction || 'accept'];
        toast({ title: msg.title, description: msg.description });
        setShowResponseDialog(false);
        setSelectedOffer(null);
        setResponseAction(null);
        setResponseMessage('');
        fetchOffers();
      } else {
        throw new Error(res.data?.message || 'Failed to respond to offer');
      }
    } catch (err: any) {
      toast({
        title: t('Error', 'خطأ'),
        description: err.message || t('Failed to respond to offer', 'فشل الرد على العرض'),
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };



  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" />, label: t('Pending Response', 'بانتظار الرد') },
      sent: { color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" />, label: t('Pending Response', 'بانتظار الرد') },
      accepted: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" />, label: t('Accepted', 'مقبول') },
      declined: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" />, label: t('Declined', 'مرفوض') },
      negotiating: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" />, label: t('Negotiating', 'جاري التفاوض') }
    };
    const { color, icon, label } = config[status] || config.pending;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>
    );
  };

  const formatBenefits = (benefits: any) => {
    if (!benefits || typeof benefits !== 'object') return null;

    const benefitsList: string[] = [];

    if (benefits.health_insurance) benefitsList.push(t('Health Insurance', 'تأمين صحي'));
    if (benefits.housing_allowance) benefitsList.push(`${t('Housing Allowance:', 'بدل سكن:')} ${benefits.housing_allowance} ${t('AED', 'د.إ')}`);
    if (benefits.transportation_allowance) benefitsList.push(`${t('Transportation:', 'النقل:')} ${benefits.transportation_allowance} ${t('AED', 'د.إ')}`);
    if (benefits.annual_leave_days) benefitsList.push(`${benefits.annual_leave_days} ${t('Days Annual Leave', 'يوم إجازة سنوية')}`);
    if (benefits.flight_tickets) benefitsList.push(`${benefits.flight_tickets} ${t('Flight Tickets/Year', 'تذاكر طيران/سنة')}`);
    if (benefits.additional_benefits && Array.isArray(benefits.additional_benefits)) {
      benefitsList.push(...benefits.additional_benefits);
    }

    return benefitsList;
  };

  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'pending') return offer.status === 'pending' || offer.status === 'sent' || offer.status === 'negotiating';
    if (activeTab === 'accepted') return offer.status === 'accepted';
    if (activeTab === 'declined') return offer.status === 'declined';
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">{t('Total Offers', 'إجمالي العروض')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-500">{t('Awaiting Response', 'بانتظار الرد')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                <p className="text-sm text-gray-500">{t('Accepted', 'مقبول')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
                <p className="text-sm text-gray-500">{t('Declined', 'مرفوض')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Offers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-teal-600" />
            {t('Job Offers', 'عروض العمل')}
          </CardTitle>
          <CardDescription>
            {t('Review and respond to job offers from recruiters', 'راجع واستجب لعروض العمل من مسؤولي التوظيف')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('Pending', 'قيد الانتظار')} ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {t('Accepted', 'مقبول')} ({stats.accepted})
              </TabsTrigger>
              <TabsTrigger value="declined" className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {t('Declined', 'مرفوض')} ({stats.declined})
              </TabsTrigger>
              <TabsTrigger value="all">{t('All', 'الكل')} ({stats.total})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gift className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">{t('No offers yet', 'لا توجد عروض بعد')}</h3>
                  <p className="text-gray-500 mt-1">
                    {activeTab === 'pending'
                      ? t('You have no pending offers to review', 'لا توجد عروض قيد الانتظار للمراجعة')
                      : activeTab === 'accepted'
                        ? t("You haven't accepted any offers yet", 'لم تقبل أي عروض بعد')
                        : activeTab === 'declined'
                          ? t("You haven't declined any offers", 'لم ترفض أي عروض')
                          : t('Keep applying to jobs and offers will appear here', 'استمر بالتقديم وستظهر العروض هنا')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOffers.map((offer) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{offer.job_title}</h3>
                              {getStatusBadge(offer.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {offer.company_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {offer.job_location}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-green-600 font-semibold">
                                <Coins className="h-4 w-4" />
                                {formatCurrency(offer.salary_amount, offer.salary_currency)}
                                <span className="text-gray-500 font-normal">/ {offer.salary_period}</span>
                              </span>
                              {offer.start_date && (
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  {t('Start:', 'البداية:')} {offer.start_date}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {t('Received:', 'استُلم في:')} {formatDateFromString(offer.created_at)}
                              {offer.recruiter_name && ` • ${t('From:', 'من:')} ${offer.recruiter_name}`}
                            </p>
                            {offer.expiry_date && offer.status === 'sent' && (() => {
                              const expiry = getExpiryInfo(offer.expiry_date);
                              return expiry ? (
                                <Badge variant="outline" className={`mt-1 text-xs ${expiry.className}`}>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {expiry.urgent ? '⚡ ' : ''}{expiry.label}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          <Button onClick={() => handleViewOffer(offer)}>
                            {t('View Details', 'عرض التفاصيل')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Internship & Gig Offers */}
      {csOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('Internship & Gig Offers', 'عروض التدريب والعمل الحر')}
            </CardTitle>
            <CardDescription>
              {t('Accepted internship and gig applications', 'طلبات التدريب والعمل الحر المقبولة')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {csOffers.map((app: any, idx: number) => (
                <Card key={`cs-${idx}`} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{app.jobTitle}</h3>
                          <Badge className={app.application_type === 'internship' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'}>
                            {app.application_type === 'internship' ? t('Internship', 'تدريب') : t('Gig', 'عمل حر')}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {t('Accepted', 'مقبول')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {app.company || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {app.location || 'UAE'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('Applied:', 'تم التقديم:')} {formatDateFromString(app.appliedDate)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offer Details Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-teal-600" />
              {t('Job Offer Details', 'تفاصيل عرض العمل')}
            </DialogTitle>
            <DialogDescription>
              {t('Review the offer details carefully before responding', 'راجع تفاصيل العرض بعناية قبل الرد')}
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 py-4">
                {/* Status Banner */}
                {(selectedOffer.status === 'pending' || selectedOffer.status === 'sent') && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      {t('This offer is awaiting your response. Please review and accept or decline.', 'هذا العرض بانتظار ردك. يرجى المراجعة والقبول أو الرفض.')}
                    </AlertDescription>
                  </Alert>
                )}
                {/* Expiry Warning */}
                {selectedOffer.expiry_date && (selectedOffer.status === 'pending' || selectedOffer.status === 'sent' || selectedOffer.status === 'negotiating') && (() => {
                  const expiry = getExpiryInfo(selectedOffer.expiry_date);
                  if (!expiry) return null;
                  return expiry.urgent ? (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 font-medium">
                        {expiry.days < 0
                          ? t('This offer has expired. Contact the recruiter if you are still interested.', 'انتهت صلاحية هذا العرض. تواصل مع مسؤول التوظيف إذا كنت لا تزال مهتماً.')
                          : t(`⚡ This offer expires in ${expiry.days} day${expiry.days !== 1 ? 's' : ''}. Respond soon!`, `⚡ ينتهي هذا العرض خلال ${expiry.days} يوم. استجب قريباً!`)}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-amber-50 border-amber-200">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        {t(`This offer expires in ${expiry.days} days`, `ينتهي هذا العرض خلال ${expiry.days} يوم`)} ({formatDateFromString(selectedOffer.expiry_date)}).
                      </AlertDescription>
                    </Alert>
                  );
                })()}
                {selectedOffer.status === 'accepted' && (
                  <Alert className="bg-green-50 border-green-200">
                    <PartyPopper className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {t('Congratulations! You have accepted this offer.', 'تهانينا! لقد قبلت هذا العرض.')}
                    </AlertDescription>
                  </Alert>
                )}
                {/* Counter Offer from Recruiter */}
                {selectedOffer.status === 'negotiating' && (selectedOffer.negotiation_status === 'counter_offered' || selectedOffer.negotiation_notes) && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <span className="font-semibold block mb-1">{t('Counter Offer Received from Recruiter', 'تم استلام عرض مضاد من مسؤول التوظيف')}</span>
                      {selectedOffer.negotiation_notes && (
                        <p className="italic mt-1">"{selectedOffer.negotiation_notes}"</p>
                      )}
                      <p className="mt-2 text-sm">{t('Review the updated offer details below and respond.', 'راجع تفاصيل العرض المحدثة أدناه وقم بالرد.')}</p>
                    </AlertDescription>
                  </Alert>
                )}
                {/* Negotiating status (no counter offer yet) */}
                {selectedOffer.status === 'negotiating' && !selectedOffer.negotiation_notes && selectedOffer.negotiation_status !== 'counter_offered' && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      {t('You have started negotiations for this offer. Awaiting the recruiter\'s response.', 'لقد بدأت المفاوضات بشأن هذا العرض. في انتظار رد مسؤول التوظيف.')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Position & Company */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-teal-600" />
                    {t('Position Details', 'تفاصيل المنصب')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">{t('Position', 'المنصب')}</Label>
                      <p className="font-semibold text-lg">{selectedOffer.job_title}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">{t('Company', 'الشركة')}</Label>
                      <p className="font-medium">{selectedOffer.company_name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">{t('Location', 'الموقع')}</Label>
                      <p className="font-medium">{selectedOffer.job_location}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">{t('Employment Type', 'نوع التوظيف')}</Label>
                      <p className="font-medium capitalize">{selectedOffer.employment_type}</p>
                    </div>
                  </div>
                </div>

                {/* Compensation */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    {t('Compensation Package', 'حزمة التعويضات')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">{t('Salary', 'الراتب')}</Label>
                      <p className="font-bold text-2xl text-green-600">
                        {formatCurrency(selectedOffer.salary_amount, selectedOffer.salary_currency)}
                      </p>
                      <p className="text-sm text-gray-500">{(() => {
                        const periodMap: Record<string, string> = {
                          monthly: t('Monthly', 'شهرياً'),
                          yearly: t('Yearly', 'سنوياً'),
                          weekly: t('Weekly', 'أسبوعياً'),
                          hourly: t('Hourly', 'بالساعة'),
                        };
                        return periodMap[selectedOffer.salary_period] || selectedOffer.salary_period;
                      })()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">{t('Benefits', 'المزايا')}</Label>
                      {selectedOffer.benefits && formatBenefits(selectedOffer.benefits) ? (
                        <ul className="mt-1 space-y-1">
                          {formatBenefits(selectedOffer.benefits)?.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-1 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">{t('No additional benefits specified', 'لم يتم تحديد مزايا إضافية')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    {t('Employment Details', 'تفاصيل التوظيف')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedOffer.start_date && (
                      <div>
                        <Label className="text-gray-500 text-sm">{t('Start Date', 'تاريخ البداية')}</Label>
                        <p className="font-medium">{selectedOffer.start_date}</p>
                      </div>
                    )}
                    {selectedOffer.probation_period_months && (
                      <div>
                        <Label className="text-gray-500 text-sm">{t('Probation Period', 'فترة التجربة')}</Label>
                        <p className="font-medium">{selectedOffer.probation_period_months} {t('months', 'أشهر')}</p>
                      </div>
                    )}
                    {selectedOffer.expiry_date && (
                      <div>
                        <Label className="text-gray-500 text-sm">{t('Offer Valid Until', 'العرض صالح حتى')}</Label>
                        <p className="font-medium">{selectedOffer.expiry_date}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recruiter Info */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    {t('Contact Information', 'معلومات الاتصال')}
                  </h3>
                  <div>
                    <Label className="text-gray-500 text-sm">{t('Recruiter', 'مسؤول التوظيف')}</Label>
                    <p className="font-medium">{selectedOffer.recruiter_name}</p>
                    {selectedOffer.recruiter_email && (
                      <p className="text-sm text-gray-600">{selectedOffer.recruiter_email}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedOffer.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{t('Additional Notes', 'ملاحظات إضافية')}</h3>
                    <p className="text-gray-700">{selectedOffer.notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>
              {t('Close', 'إغلاق')}
            </Button>
            {selectedOffer?.recruiter_email && (
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => navigate('/candidate-dashboard?tab=messages')}
              >
                <Mail className="h-4 w-4" style={{ marginInlineEnd: 4 }} />
                {t('Message Recruiter', 'مراسلة مسؤول التوظيف')}
              </Button>
            )}
            {(selectedOffer?.status === 'pending' || selectedOffer?.status === 'sent' || selectedOffer?.status === 'negotiating') && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleRespondClick('decline')}
                >
                  <XCircle className="h-4 w-4" style={{ marginInlineEnd: 4 }} />
                  {t('Decline Offer', 'رفض العرض')}
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => handleRespondClick('negotiate')}
                >
                  <MessageCircle className="h-4 w-4" style={{ marginInlineEnd: 4 }} />
                  {t('Negotiate', 'تفاوض')}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleRespondClick('accept')}
                >
                  <CheckCircle className="h-4 w-4" style={{ marginInlineEnd: 4 }} />
                  {t('Accept Offer', 'قبول العرض')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Confirmation Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'accept' ? t('Accept Offer', 'قبول العرض') : responseAction === 'negotiate' ? t('Negotiate Offer', 'تفاوض العرض') : t('Decline Offer', 'رفض العرض')}
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'accept'
                ? t('Are you sure you want to accept this offer? The recruiter will be notified.', 'هل أنت متأكد من قبول هذا العرض؟ سيتم إخطار مسؤول التوظيف.')
                : responseAction === 'negotiate'
                  ? t("Describe what you'd like to negotiate. The recruiter will be notified and can respond.", 'صف ما تريد التفاوض بشأنه. سيتم إخطار مسؤول التوظيف ويمكنه الرد.')
                  : t('Are you sure you want to decline this offer? You can optionally provide a reason.', 'هل أنت متأكد من رفض هذا العرض؟ يمكنك تقديم سبب اختيارياً.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="responseMessage">
                {t('Message to Recruiter', 'رسالة إلى مسؤول التوظيف')} {responseAction === 'accept' ? t('(Optional)', '(اختياري)') : responseAction === 'negotiate' ? t('(Describe your counter-proposal)', '(صف مقترحك المضاد)') : t('(Optional - reason for declining)', '(اختياري - سبب الرفض)')}
              </Label>
              <Textarea
                id="responseMessage"
                placeholder={responseAction === 'accept'
                  ? t('Thank you for this opportunity...', 'شكراً لكم على هذه الفرصة...')
                  : responseAction === 'negotiate'
                    ? t('I appreciate the offer. I would like to discuss...', 'أقدر العرض. أود مناقشة...')
                    : t('Thank you for the offer, but...', 'شكراً على العرض، لكن...')}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button
              className={responseAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : responseAction === 'negotiate' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
              variant={responseAction === 'decline' ? 'destructive' : 'default'}
              onClick={handleSubmitResponse}
              disabled={processing || (responseAction === 'negotiate' && !responseMessage.trim())}
            >
              {processing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : responseAction === 'accept' ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : responseAction === 'negotiate' ? (
                <MessageCircle className="h-4 w-4 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              {responseAction === 'accept' ? t('Confirm Accept', 'تأكيد القبول') : responseAction === 'negotiate' ? t('Send Proposal', 'إرسال المقترح') : t('Confirm Decline', 'تأكيد الرفض')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateOffers;
