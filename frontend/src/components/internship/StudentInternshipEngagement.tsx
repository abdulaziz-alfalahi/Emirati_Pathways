import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Coins,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import internshipEngagementService, {
  Engagement,
  Internship,
  stageLabel,
} from '@/services/internshipEngagementService';

/* Stage → pill colour. Labels come from the shared stageLabel() helper. */
const STAGE_PILL: Record<Engagement['stage'], string> = {
  proposed: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-accent text-primary border-teal-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-slate-50 text-slate-600 border-slate-200',
};

const StudentInternshipEngagement: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);
  const { toast } = useToast();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [decidingId, setDecidingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [internshipsRes, engagementsRes] = await Promise.allSettled([
      internshipEngagementService.relevantInternships(),
      internshipEngagementService.myEngagements(),
    ]);
    if (internshipsRes.status === 'fulfilled') {
      setInternships(internshipsRes.value || []);
    }
    if (engagementsRes.status === 'fulfilled') {
      setEngagements(engagementsRes.value || []);
    }
    if (internshipsRes.status === 'rejected' && engagementsRes.status === 'rejected') {
      setError(t(
        'Could not load internships. Please try again.',
        'تعذّر تحميل فرص التدريب. يرجى المحاولة مرة أخرى.'
      ));
    }
    setLoading(false);
    // t is derived from i18n.language; re-running load on language change is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async (internship: Internship) => {
    setApplyingId(internship.id);
    try {
      await internshipEngagementService.apply(internship.id);
      toast({
        title: t('Application submitted', 'تم إرسال الطلب'),
        description: t(
          'Your application is now awaiting the recruiter and coordinator approvals.',
          'طلبك الآن بانتظار موافقة مسؤول التوظيف والمنسق.'
        ),
      });
      await load();
    } catch (err: any) {
      toast({
        title: t('Application failed', 'فشل إرسال الطلب'),
        description: err?.response?.data?.error || t('Please try again.', 'يرجى المحاولة مرة أخرى.'),
        variant: 'destructive',
      });
    } finally {
      setApplyingId(null);
    }
  };

  const handleDecision = async (engagement: Engagement, decision: 'accept' | 'decline') => {
    setDecidingId(engagement.id);
    try {
      await internshipEngagementService.studentDecision(engagement.id, decision);
      toast({
        title: decision === 'accept'
          ? t('Offer accepted', 'تم قبول العرض')
          : t('Offer declined', 'تم رفض العرض'),
        description: decision === 'accept'
          ? t(
            'Your acceptance was recorded. Remaining approvals will follow.',
            'تم تسجيل قبولك. ستتبع الموافقات المتبقية.'
          )
          : t('The coordinator will be notified.', 'سيتم إشعار المنسق.'),
      });
      await load();
    } catch (err: any) {
      toast({
        title: t('Action failed', 'فشل الإجراء'),
        description: err?.response?.data?.error || t('Please try again.', 'يرجى المحاولة مرة أخرى.'),
        variant: 'destructive',
      });
    } finally {
      setDecidingId(null);
    }
  };

  const partyStatusBadge = (status: string) => {
    if (status === 'approved' || status === 'accepted' || status === 'granted') {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (status === 'declined' || status === 'denied') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const partyStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('Pending', 'قيد الانتظار');
      case 'approved': return t('Approved', 'تمت الموافقة');
      case 'accepted': return t('Accepted', 'مقبول');
      case 'declined': return t('Declined', 'مرفوض');
      case 'granted': return t('Granted', 'ممنوحة');
      case 'denied': return t('Denied', 'مرفوضة');
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">
            {t('Loading internships...', 'جاري تحميل فرص التدريب...')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {error && (
        <Alert className="border-red-200 bg-red-50/80">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => { setLoading(true); load(); }}
            >
              {t('Retry', 'إعادة المحاولة')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Recommended internships ─── */}
      <Card className="bg-card border border-slate-200/80">
        <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('Recommended Internships', 'فرص التدريب الموصى بها')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('Matched to your field of study', 'مطابقة لمجال دراستك')}
          </p>
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          {internships.length > 0 ? internships.map((internship) => (
            <div
              key={internship.id}
              className="p-4 rounded-lg border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                    {(internship.company || '?').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {isRTL && internship.title_ar ? internship.title_ar : internship.title}
                    </p>
                    {internship.company && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {internship.company}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {internship.sector && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />{internship.sector}
                        </span>
                      )}
                      {internship.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{internship.location}
                        </span>
                      )}
                      {internship.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{internship.duration}
                        </span>
                      )}
                      {internship.stipend && (
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />{internship.stipend}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary text-white text-xs h-8 px-4 flex-shrink-0"
                  disabled={applyingId === internship.id}
                  onClick={() => handleApply(internship)}
                >
                  {applyingId === internship.id
                    ? t('Applying...', 'جاري التقديم...')
                    : t('Apply', 'قدّم')}
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">
                {t(
                  'No internships match your field of study right now. Check back soon.',
                  'لا توجد حالياً فرص تدريب مطابقة لمجال دراستك. عاود التحقق قريباً.'
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── My internships ─── */}
      <Card className="bg-card border border-slate-200/80">
        <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <GraduationCap className="h-4 w-4 text-primary" />
            {t('My Internships', 'تدريباتي')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          {engagements.length > 0 ? engagements.map((engagement) => {
            const stage = stageLabel(engagement.stage);
            const isOffer =
              engagement.stage === 'proposed' &&
              engagement.initiated_by === 'coordinator' &&
              engagement.student_status === 'pending';
            return (
              <div
                key={engagement.id}
                className="p-4 rounded-lg border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {engagement.internship_title || t('Internship', 'تدريب')}
                    </p>
                    {engagement.internship_company && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {engagement.internship_company}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {t('Recruiter', 'مسؤول التوظيف')}:
                        <Badge className={`text-[10px] ${partyStatusBadge(engagement.recruiter_status)}`}>
                          {partyStatusLabel(engagement.recruiter_status)}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-1">
                        {t('Coordinator', 'المنسق')}:
                        <Badge className={`text-[10px] ${partyStatusBadge(engagement.coordinator_status)}`}>
                          {partyStatusLabel(engagement.coordinator_status)}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-1">
                        {t('You', 'أنت')}:
                        <Badge className={`text-[10px] ${partyStatusBadge(engagement.student_status)}`}>
                          {partyStatusLabel(engagement.student_status)}
                        </Badge>
                      </span>
                    </div>
                    {engagement.parent_consent_status === 'pending' && (
                      <div className="mt-2">
                        <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex w-fit items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('Awaiting parent consent', 'بانتظار موافقة ولي الأمر')}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge className={`text-[11px] border ${STAGE_PILL[engagement.stage]}`}>
                      {isRTL ? stage.ar : stage.label}
                    </Badge>
                    {isOffer && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary text-white text-xs h-8 px-3"
                          disabled={decidingId === engagement.id}
                          onClick={() => handleDecision(engagement, 'accept')}
                        >
                          <CheckCircle className="h-3.5 w-3.5" style={{ marginInlineEnd: 4 }} />
                          {t('Accept', 'قبول')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          disabled={decidingId === engagement.id}
                          onClick={() => handleDecision(engagement, 'decline')}
                        >
                          <XCircle className="h-3.5 w-3.5" style={{ marginInlineEnd: 4 }} />
                          {t('Decline', 'رفض')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {isOffer && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {t(
                      'Your career coordinator proposed this internship for you.',
                      'اقترح منسقك المهني هذا التدريب لك.'
                    )}
                  </p>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">
                {t(
                  'You have no internship applications or offers yet. Apply to a recommended internship above to get started.',
                  'ليس لديك طلبات أو عروض تدريب بعد. قدّم على أحد فرص التدريب الموصى بها أعلاه للبدء.'
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentInternshipEngagement;
