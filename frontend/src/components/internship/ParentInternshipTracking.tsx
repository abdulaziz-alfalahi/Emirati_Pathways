// Parent view of the internship 3-way handshake (recruiter ↔ coordinator ↔ student).
// Read-only tracking of each child's engagements; the only parent action is
// granting/denying consent, which is requested for minors only.
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import internshipEngagementService, { Engagement, ConsentAuditEntry, stageLabel } from '@/services/internshipEngagementService';
import { Briefcase, Building2, ShieldCheck, Loader2, AlertCircle, RefreshCw, History, ChevronDown, ChevronUp } from 'lucide-react';

const stagePillClass: Record<Engagement['stage'], string> = {
    proposed: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    completed: 'bg-teal-100 text-teal-700 border-teal-200',
    declined: 'bg-red-100 text-red-600 border-red-200',
    withdrawn: 'bg-gray-100 text-gray-500 border-gray-200',
};

const ParentInternshipTracking: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => (isRTL ? ar : en);

    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actingId, setActingId] = useState<number | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Phase 3 — lazy-loaded consent audit trail, keyed by engagement id.
    const [openAudit, setOpenAudit] = useState<Record<number, boolean>>({});
    const [auditData, setAuditData] = useState<Record<number, ConsentAuditEntry[]>>({});
    const [auditLoading, setAuditLoading] = useState<Record<number, boolean>>({});
    const [auditError, setAuditError] = useState<Record<number, boolean>>({});

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const items = await internshipEngagementService.childrenEngagements();
            setEngagements(Array.isArray(items) ? items : []);
        } catch {
            setError(t('Could not load your children’s internships. Please try again.', 'تعذّر تحميل تدريبات أبنائك. يرجى المحاولة مرة أخرى.'));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRTL]);

    useEffect(() => { load(); }, [load]);

    const handleConsent = async (id: number, decision: 'grant' | 'deny') => {
        setActingId(id);
        setActionError(null);
        try {
            await internshipEngagementService.parentConsent(id, decision);
            await load();
        } catch {
            setActionError(t('Could not record your decision. Please try again.', 'تعذّر تسجيل قرارك. يرجى المحاولة مرة أخرى.'));
        } finally {
            setActingId(null);
        }
    };

    const toggleAudit = async (id: number) => {
        const willOpen = !openAudit[id];
        setOpenAudit((prev) => ({ ...prev, [id]: willOpen }));
        // Lazy-load once, on first expand.
        if (willOpen && auditData[id] === undefined && !auditLoading[id]) {
            setAuditLoading((prev) => ({ ...prev, [id]: true }));
            setAuditError((prev) => ({ ...prev, [id]: false }));
            try {
                const entries = await internshipEngagementService.consentAudit(id);
                setAuditData((prev) => ({ ...prev, [id]: Array.isArray(entries) ? entries : [] }));
            } catch {
                setAuditError((prev) => ({ ...prev, [id]: true }));
            } finally {
                setAuditLoading((prev) => ({ ...prev, [id]: false }));
            }
        }
    };

    const fmtDate = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString(isRTL ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const subStatusBadge = (status: string) => {
        const cls =
            status === 'approved' || status === 'accepted'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : status === 'declined'
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';
        const label =
            status === 'approved' ? t('Approved', 'موافَق عليه')
                : status === 'accepted' ? t('Accepted', 'مقبول')
                    : status === 'declined' ? t('Declined', 'مرفوض')
                        : t('Pending', 'قيد الانتظار');
        return <Badge variant="outline" className={`text-[11px] font-medium ${cls}`}>{label}</Badge>;
    };

    const consentBadge = (status: Engagement['parent_consent_status']) => {
        switch (status) {
            case 'granted':
                return <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">{t('Consent granted', 'تم منح الموافقة')}</Badge>;
            case 'denied':
                return <Badge variant="outline" className="text-[11px] bg-red-50 text-red-600 border-red-200">{t('Consent denied', 'تم رفض الموافقة')}</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 border-amber-200">{t('Your consent requested', 'موافقتك مطلوبة')}</Badge>;
            default:
                return null;
        }
    };

    // Group engagements by child so parents scan per-student.
    const byStudent = engagements.reduce<Record<string, Engagement[]>>((acc, e) => {
        const key = e.student_name || t('Your child', 'ابنك/ابنتك');
        (acc[key] = acc[key] || []).push(e);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-teal-600" />
                <p className="text-sm font-medium">{t('Loading internships…', 'جارٍ تحميل التدريبات…')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                    <AlertCircle className="h-10 w-10 text-red-300 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={load}>
                        <RefreshCw className="h-4 w-4" /> {t('Retry', 'إعادة المحاولة')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (engagements.length === 0) {
        return (
            <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                    <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">{t('No internships to track yet', 'لا توجد تدريبات لمتابعتها بعد')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t("When your children take part in internships, their progress will appear here", 'عندما يشارك أبناؤك في التدريبات، سيظهر تقدّمهم هنا')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Consent-scope notice */}
            <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3">
                <ShieldCheck className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                    {t('This view is for tracking. Your consent is only requested when a child is a minor; for adult children no action is needed.',
                        'هذه الصفحة للمتابعة فقط. تُطلب موافقتك فقط عندما يكون الابن قاصراً؛ ولا يلزم أي إجراء للأبناء البالغين.')}
                </p>
            </div>

            {actionError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {actionError}
                </div>
            )}

            {Object.entries(byStudent).map(([studentName, items]) => (
                <div key={studentName} className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xs">{studentName.charAt(0).toUpperCase()}</span>
                        </div>
                        {studentName}
                        <Badge variant="outline" className="text-[11px]">{items.length}</Badge>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((e) => {
                            const stage = stageLabel(e.stage);
                            return (
                                <Card key={e.id} className="hover:shadow-md transition-shadow duration-200">
                                    <CardContent className="pt-5 pb-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-foreground truncate">
                                                    {e.internship_title || t('Internship', 'تدريب')}
                                                </h4>
                                                {e.internship_company && (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <Building2 className="h-3.5 w-3.5 shrink-0" /> {e.internship_company}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className={`text-[11px] font-medium shrink-0 ${stagePillClass[e.stage]}`}>
                                                {isRTL ? stage.ar : stage.label}
                                            </Badge>
                                        </div>

                                        {/* Sub-statuses of the 3-way handshake */}
                                        <div className="bg-muted/60 rounded-xl p-3 space-y-2">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {t('Approval progress', 'مراحل الموافقة')}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{t('Employer', 'جهة العمل')}</span>
                                                {subStatusBadge(e.recruiter_status)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{t('Student', 'الطالب')}</span>
                                                {subStatusBadge(e.student_status)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{t('School coordinator', 'منسق المدرسة')}</span>
                                                {subStatusBadge(e.coordinator_status)}
                                            </div>
                                            {e.parent_consent_status !== 'not_required' && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">{t('Parent consent', 'موافقة ولي الأمر')}</span>
                                                    {consentBadge(e.parent_consent_status)}
                                                </div>
                                            )}
                                        </div>

                                        {/* The only parent action: consent for minors */}
                                        {e.parent_consent_status === 'pending' && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                                                <p className="text-xs text-amber-800">
                                                    {t('Because your child is a minor, this internship needs your consent before it can proceed.',
                                                        'نظراً لأن ابنك قاصر، يحتاج هذا التدريب إلى موافقتك قبل المتابعة.')}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                                                        disabled={actingId === e.id}
                                                        onClick={() => handleConsent(e.id, 'grant')}
                                                    >
                                                        {actingId === e.id
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : t('Grant consent', 'منح الموافقة')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                                        disabled={actingId === e.id}
                                                        onClick={() => handleConsent(e.id, 'deny')}
                                                    >
                                                        {t('Deny', 'رفض')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {e.decline_reason && (
                                            <p className="text-xs text-muted-foreground">
                                                {t('Reason', 'السبب')}: {e.decline_reason}
                                            </p>
                                        )}

                                        {/* Phase 3 — consent audit trail, relevant only when consent was/is required */}
                                        {e.parent_consent_status !== 'not_required' && (
                                            <div className="pt-1 border-t border-border/60">
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 pt-2"
                                                    onClick={() => toggleAudit(e.id)}
                                                    aria-expanded={!!openAudit[e.id]}
                                                >
                                                    <History className="h-3.5 w-3.5 shrink-0" />
                                                    {t('Consent history', 'سجل الموافقات')}
                                                    {openAudit[e.id]
                                                        ? <ChevronUp className="h-3.5 w-3.5" />
                                                        : <ChevronDown className="h-3.5 w-3.5" />}
                                                </button>

                                                {openAudit[e.id] && (
                                                    <div className="mt-2">
                                                        {auditLoading[e.id] ? (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                {t('Loading history…', 'جارٍ تحميل السجل…')}
                                                            </div>
                                                        ) : auditError[e.id] ? (
                                                            <div className="flex items-center justify-between gap-2 text-xs text-red-600 py-2">
                                                                <span className="flex items-center gap-1.5">
                                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                                    {t('Could not load consent history.', 'تعذّر تحميل سجل الموافقات.')}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="font-medium underline shrink-0"
                                                                    onClick={() => toggleAudit(e.id)}
                                                                >
                                                                    {t('Retry', 'إعادة المحاولة')}
                                                                </button>
                                                            </div>
                                                        ) : (auditData[e.id]?.length ?? 0) === 0 ? (
                                                            <p className="text-xs text-muted-foreground py-2">
                                                                {t('No consent decisions recorded yet.', 'لا توجد قرارات موافقة مسجّلة بعد.')}
                                                            </p>
                                                        ) : (
                                                            <ul className="space-y-2">
                                                                {auditData[e.id].map((a) => (
                                                                    <li key={a.id} className="rounded-lg bg-muted/60 p-2.5 space-y-1">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            {a.decision === 'granted' ? (
                                                                                <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                                    {t('Granted', 'مُنِحت')}
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge variant="outline" className="text-[11px] bg-red-50 text-red-600 border-red-200">
                                                                                    {t('Denied', 'مرفوضة')}
                                                                                </Badge>
                                                                            )}
                                                                            {fmtDate(a.created_at) && (
                                                                                <span className="text-[11px] text-muted-foreground shrink-0">{fmtDate(a.created_at)}</span>
                                                                            )}
                                                                        </div>
                                                                        {a.reason && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {t('Reason', 'السبب')}: {a.reason}
                                                                            </p>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ParentInternshipTracking;
