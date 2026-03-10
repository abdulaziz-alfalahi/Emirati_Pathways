import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { restClient } from '@/utils/api';
import {
    CheckCircle, XCircle, Clock, Loader2, GraduationCap, Briefcase, Award,
    Building, User, FileText, AlertCircle
} from 'lucide-react';

interface PendingApplication {
    id: number;
    user_id: number;
    opportunity_id: number;
    status: string;
    educator_status: string | null;
    applied_at: string;
    applicant_name: string | null;
    applicant_email: string | null;
    title: string;
    title_ar?: string;
    company: string;
    company_ar?: string;
    sector?: string;
    opportunity_type: 'internship' | 'gig' | 'scholarship';
}

const EducatorApprovals: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const { toast } = useToast();

    const [applications, setApplications] = useState<PendingApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [notesMap, setNotesMap] = useState<Record<number, string>>({});
    const [filter, setFilter] = useState<'all' | 'internship' | 'gig' | 'scholarship'>('all');

    useEffect(() => { loadPending(); }, []);

    const loadPending = async () => {
        setLoading(true);
        try {
            const resp = await restClient.get('/api/career-services/applications/pending-approval');
            setApplications(resp.data?.applications || []);
        } catch {
            setApplications([]);
        }
        setLoading(false);
    };

    const handleAction = async (appId: number, action: 'approve' | 'reject', type: string) => {
        setActionLoading(appId);
        try {
            await restClient.put(`/api/career-services/applications/${appId}/${action}`, {
                type, notes: notesMap[appId] || ''
            });
            toast({
                title: action === 'approve' ? t('Approved', 'تمت الموافقة') : t('Rejected', 'تم الرفض'),
                description: t(`Application ${action}d successfully`, `تم ${action === 'approve' ? 'قبول' : 'رفض'} الطلب بنجاح`),
            });
            setApplications(prev => prev.filter(a => a.id !== appId));
        } catch {
            toast({ title: t('Error', 'خطأ'), variant: 'destructive' });
        }
        setActionLoading(null);
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case 'internship': return <GraduationCap className="h-4 w-4" />;
            case 'gig': return <Briefcase className="h-4 w-4" />;
            case 'scholarship': return <Award className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const typeColor = (type: string) => {
        switch (type) {
            case 'internship': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'gig': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'scholarship': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-50 text-slate-700';
        }
    };

    const filtered = filter === 'all' ? applications : applications.filter(a => a.opportunity_type === filter);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: t('Total Pending', 'إجمالي المعلقة'), count: applications.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: t('Internships', 'التدريب'), count: applications.filter(a => a.opportunity_type === 'internship').length, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: t('Gigs', 'العمل الحر'), count: applications.filter(a => a.opportunity_type === 'gig').length, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: t('Scholarships', 'المنح'), count: applications.filter(a => a.opportunity_type === 'scholarship').length, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-white border border-slate-200/80">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium">{stat.label}</p>
                                    <p className="text-2xl font-dubai-bold text-slate-900 mt-1">{stat.count}</p>
                                </div>
                                <div className={`p-2.5 ${stat.bg} rounded-xl`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Type Filter */}
            <div className="flex gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {(['all', 'internship', 'gig', 'scholarship'] as const).map(f => (
                    <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'}
                        className={`font-dubai-medium text-xs ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                        onClick={() => setFilter(f)}>
                        {f === 'all' ? t('All', 'الكل') : f === 'internship' ? t('Internships', 'التدريب') : f === 'gig' ? t('Gigs', 'العمل الحر') : t('Scholarships', 'المنح')}
                    </Button>
                ))}
            </div>

            {/* Applications List */}
            {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
            ) : filtered.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200">
                    <CardContent className="py-12 text-center">
                        <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                        <p className="text-slate-500 font-dubai-medium">{t('All caught up!', 'لا توجد طلبات معلقة!')}</p>
                        <p className="text-xs text-slate-400 font-dubai mt-1">{t('No pending student applications', 'لا توجد طلبات طلاب في الانتظار')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map(app => (
                        <Card key={`${app.opportunity_type}-${app.id}`} className="bg-white border border-slate-200/80 hover:shadow-md transition-shadow">
                            <CardContent className="pt-4 pb-4 px-5">
                                <div className="flex items-start justify-between gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                                    {/* Left: Application Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <Badge className={`text-[10px] font-dubai-medium gap-1 ${typeColor(app.opportunity_type)}`}>
                                                {typeIcon(app.opportunity_type)}
                                                {app.opportunity_type === 'internship' ? t('Internship', 'تدريب') : app.opportunity_type === 'gig' ? t('Gig', 'عمل حر') : t('Scholarship', 'منحة')}
                                            </Badge>
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-dubai-medium gap-1">
                                                <AlertCircle className="h-3 w-3" /> {t('Pending Review', 'في انتظار المراجعة')}
                                            </Badge>
                                        </div>

                                        <h3 className="text-base font-dubai-bold text-slate-800 mt-1.5">
                                            {isRTL ? (app.title_ar || app.title) : app.title}
                                        </h3>

                                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 font-dubai flex-wrap">
                                            <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {app.company}</span>
                                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {app.applicant_name || `User #${app.user_id}`}</span>
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}</span>
                                        </div>

                                        {/* Notes */}
                                        <div className="mt-3">
                                            <Textarea
                                                placeholder={t('Add notes (optional)...', 'أضف ملاحظات (اختياري)...')}
                                                value={notesMap[app.id] || ''}
                                                onChange={e => setNotesMap(prev => ({ ...prev, [app.id]: e.target.value }))}
                                                rows={2}
                                                className="text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col gap-2 shrink-0 mt-6">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-dubai-medium gap-1 text-xs"
                                            disabled={actionLoading === app.id}
                                            onClick={() => handleAction(app.id, 'approve', app.opportunity_type)}>
                                            {actionLoading === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                            {t('Approve', 'موافقة')}
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 font-dubai-medium gap-1 text-xs"
                                            disabled={actionLoading === app.id}
                                            onClick={() => handleAction(app.id, 'reject', app.opportunity_type)}>
                                            <XCircle className="h-3.5 w-3.5" /> {t('Reject', 'رفض')}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EducatorApprovals;
