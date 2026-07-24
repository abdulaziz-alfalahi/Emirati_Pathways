// Recruiter view of the internship 3-way handshake: engagements proposed against
// this recruiter's internships, with approve/decline actions while stage=proposed.
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import internshipEngagementService, { Engagement, stageLabel } from '@/services/internshipEngagementService';
import { GraduationCap, Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

/* ─────────────── Helpers ─────────────── */

const stagePillClass: Record<Engagement['stage'], string> = {
    proposed: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    active: 'bg-teal-50 text-teal-700 border-teal-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    declined: 'bg-red-50 text-red-600 border-red-200',
    withdrawn: 'bg-slate-50 text-slate-500 border-slate-200',
};

type SubStatus = 'pending' | 'approved' | 'declined' | 'accepted' | 'not_required' | 'granted' | 'denied';

const subStatusClass = (s: SubStatus): string => {
    switch (s) {
        case 'approved':
        case 'accepted':
        case 'granted':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'declined':
        case 'denied':
            return 'bg-red-50 text-red-600 border-red-200';
        case 'not_required':
            return 'bg-slate-50 text-slate-500 border-slate-200';
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200';
    }
};

/* ─────────────── Component ─────────────── */

const RecruiterInternshipProposals: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const b = (en: string, ar: string) => isRTL ? ar : en;
    const { toast } = useToast();

    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [actingId, setActingId] = useState<number | null>(null);
    const [decliningId, setDecliningId] = useState<number | null>(null);
    const [declineReason, setDeclineReason] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const data = await internshipEngagementService.recruiterEngagements();
            setEngagements(Array.isArray(data) ? data : []);
        } catch {
            setEngagements([]);
            setLoadError(true);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const decide = async (id: number, decision: 'approve' | 'decline', reason?: string) => {
        setActingId(id);
        try {
            await internshipEngagementService.recruiterDecision(id, decision, reason);
            toast({
                title: decision === 'approve' ? b('Approved', 'تمت الموافقة') : b('Declined', 'تم الرفض'),
                description: decision === 'approve'
                    ? b('The proposal was approved', 'تمت الموافقة على الطلب')
                    : b('The proposal was declined', 'تم رفض الطلب'),
            });
            setDecliningId(null);
            setDeclineReason('');
            await load();
        } catch {
            toast({ title: b('Error', 'خطأ'), description: b('Could not submit your decision. Please try again.', 'تعذّر إرسال قرارك. يرجى المحاولة مرة أخرى.'), variant: 'destructive' });
        }
        setActingId(null);
    };

    const subStatuses = (e: Engagement) => ([
        { label: b('You', 'أنت'), status: e.recruiter_status, text: e.recruiter_status === 'approved' ? b('Approved', 'موافَق') : e.recruiter_status === 'declined' ? b('Declined', 'مرفوض') : b('Pending', 'قيد الانتظار') },
        { label: b('Coordinator', 'المنسق'), status: e.coordinator_status, text: e.coordinator_status === 'approved' ? b('Approved', 'موافَق') : e.coordinator_status === 'declined' ? b('Declined', 'مرفوض') : b('Pending', 'قيد الانتظار') },
        { label: b('Student', 'الطالب'), status: e.student_status, text: e.student_status === 'accepted' ? b('Accepted', 'مقبول') : e.student_status === 'declined' ? b('Declined', 'مرفوض') : b('Pending', 'قيد الانتظار') },
        ...(e.parent_consent_status !== 'not_required' ? [{
            label: b('Parent consent', 'موافقة ولي الأمر'),
            status: e.parent_consent_status,
            text: e.parent_consent_status === 'granted' ? b('Granted', 'ممنوحة') : e.parent_consent_status === 'denied' ? b('Denied', 'مرفوضة') : b('Pending', 'قيد الانتظار'),
        }] : []),
    ]);

    /* ── Render ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                <span className="ms-2 text-sm text-slate-500 font-dubai">{b('Loading internship proposals...', 'جارٍ تحميل طلبات التدريب...')}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <h2 className="text-lg font-dubai-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-teal-600" />
                    {b('Internship Proposals', 'طلبات التدريب')}
                </h2>
                <Button size="sm" variant="outline" className="font-dubai-medium gap-1 text-slate-600" onClick={load}>
                    <RefreshCw className="h-3.5 w-3.5" /> {b('Refresh', 'تحديث')}
                </Button>
            </div>

            {loadError ? (
                <Card className="bg-white border border-red-200">
                    <CardContent className="py-10 text-center">
                        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-dubai-medium">{b('Could not load internship proposals', 'تعذّر تحميل طلبات التدريب')}</p>
                        <Button size="sm" variant="outline" className="mt-3 font-dubai-medium" onClick={load}>
                            {b('Try Again', 'إعادة المحاولة')}
                        </Button>
                    </CardContent>
                </Card>
            ) : engagements.length === 0 ? (
                <Card className="bg-white border-dashed border-2 border-slate-200">
                    <CardContent className="py-12 text-center">
                        <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-dubai-medium">{b('No internship proposals yet', 'لا توجد طلبات تدريب بعد')}</p>
                        <p className="text-xs text-slate-400 font-dubai mt-1">
                            {b('Proposals from students and school coordinators against your internships will appear here.', 'ستظهر هنا الطلبات المقدمة من الطلاب ومنسقي المدارس على برامج التدريب الخاصة بك.')}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {engagements.map((e) => {
                        const stage = stageLabel(e.stage);
                        const needsDecision = e.stage === 'proposed' && e.recruiter_status === 'pending';
                        const busy = actingId === e.id;
                        return (
                            <Card key={e.id} className="bg-white border border-slate-200/80 hover:shadow-md transition-all duration-200">
                                <CardContent className="pt-4 pb-4 px-5" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                                    <div className="flex items-start justify-between flex-wrap gap-3">
                                        <div className="text-start min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-dubai-bold text-slate-800">
                                                    {e.internship_title || b('Internship', 'تدريب')}
                                                </p>
                                                <Badge className={`text-[10px] font-dubai-medium ${stagePillClass[e.stage] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    {isRTL ? stage.ar : stage.label}
                                                </Badge>
                                            </div>
                                            {e.internship_company && (
                                                <p className="text-xs text-slate-400 font-dubai mt-0.5">{e.internship_company}</p>
                                            )}
                                            <p className="text-sm text-slate-600 font-dubai-medium mt-1">
                                                {b('Student', 'الطالب')}: <span className="text-slate-800">{e.student_name || b('Unknown', 'غير معروف')}</span>
                                            </p>
                                            {/* Sub-statuses */}
                                            <div className="flex items-center gap-2 flex-wrap mt-2.5">
                                                {subStatuses(e).map((s, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-dubai-medium text-slate-500">
                                                        {s.label}:
                                                        <Badge className={`text-[10px] font-dubai-medium ${subStatusClass(s.status as SubStatus)}`}>{s.text}</Badge>
                                                    </span>
                                                ))}
                                            </div>
                                            {e.decline_reason && (
                                                <p className="text-xs text-red-500 font-dubai mt-2">{b('Reason', 'السبب')}: {e.decline_reason}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {needsDecision && (
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                {decliningId === e.id ? (
                                                    <div className="flex flex-col gap-2 w-64">
                                                        <input
                                                            type="text"
                                                            value={declineReason}
                                                            onChange={(ev) => setDeclineReason(ev.target.value)}
                                                            placeholder={b('Reason (optional)', 'السبب (اختياري)')}
                                                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs font-dubai focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                                                            dir={isRTL ? 'rtl' : 'ltr'}
                                                        />
                                                        <div className="flex gap-1.5 justify-end">
                                                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs font-dubai-medium"
                                                                onClick={() => { setDecliningId(null); setDeclineReason(''); }} disabled={busy}>
                                                                {b('Cancel', 'إلغاء')}
                                                            </Button>
                                                            <Button size="sm" className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700 text-white font-dubai-medium gap-1"
                                                                onClick={() => decide(e.id, 'decline', declineReason.trim() || undefined)} disabled={busy}>
                                                                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                                                {b('Confirm Decline', 'تأكيد الرفض')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1.5">
                                                        <Button size="sm" className="h-8 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium gap-1"
                                                            onClick={() => decide(e.id, 'approve')} disabled={busy}>
                                                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                                            {b('Approve', 'موافقة')}
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 font-dubai-medium gap-1"
                                                            onClick={() => { setDecliningId(e.id); setDeclineReason(''); }} disabled={busy}>
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            {b('Decline', 'رفض')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RecruiterInternshipProposals;
