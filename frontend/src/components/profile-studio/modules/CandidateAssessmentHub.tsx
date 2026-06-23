import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, ShieldAlert, Award, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';

export const CandidateAssessmentHub = () => {
    const { language, isRTL } = useLanguage();
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);
    const ChevronIcon = isRTL ? ChevronRight : ChevronRight; // Keep Chevron standard or flip depending on design

    const [centers, setCenters] = useState<any[]>([]);
    const [myApps, setMyApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'centers' | 'my-applications'>('centers');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [centersRes, appsRes] = await Promise.allSettled([
                restClient.get('/api/assessment-centers'),
                restClient.get('/api/assessment-centers/my-applications')
            ]);
            
            if (centersRes.status === 'fulfilled' && centersRes.value.data?.success) {
                setCenters(centersRes.value.data.centers || []);
            }
            if (appsRes.status === 'fulfilled' && appsRes.value.data?.success) {
                setMyApps(appsRes.value.data.applications || []);
            }
        } catch (error) {
            console.error("Failed to load assessment centers data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (templateId: number, companyId: string) => {
        setApplyingId(templateId);
        setMessage(null);
        try {
            const res = await restClient.post('/api/assessment-centers/apply', {
                template_id: templateId,
                company_id: companyId
            });
            if (res.data?.success) {
                setMessage({
                    type: 'success',
                    text: t("Application submitted successfully! Track it in the 'My Applications' tab.", "تم تقديم طلبك بنجاح! يمكنك تتبعه في علامة تبويب 'طلباتي'.")
                });
                // Reload applications
                const appsRes = await restClient.get('/api/assessment-centers/my-applications');
                if (appsRes.data?.success) {
                    setMyApps(appsRes.data.applications || []);
                }
            } else {
                setMessage({ type: 'error', text: res.data?.message || t("Application failed", "فشل تقديم الطلب") });
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || t("An error occurred during submission", "حدث خطأ أثناء تقديم الطلب")
            });
        } finally {
            setApplyingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                        <CheckCircle size={12} /> {t('Completed', 'مكتمل')}
                    </span>
                );
            case 'scheduled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse">
                        <Clock size={12} /> {t('Scheduled', 'مجدول')}
                    </span>
                );
            case 'applied':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Clock size={12} /> {t('Applied', 'تم التقديم')}
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Accredited Assessment Centers', 'مراكز التقييم المعتمدة')}</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {t('Book professional examinations, verify credentials, and boost your public profile readiness score.', 'احجز الامتحانات المهنية، وتحقق من مؤهلاتك، وقم بزيادة درجة جاهزية ملفك العام.')}
                    </p>
                </div>
            </div>

            {/* Notification messages */}
            {message && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900 dark:text-green-300' 
                        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300'
                }`}>
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('centers')}
                    className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === 'centers' 
                            ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {t('Assessment Centers & Exams', 'مراكز التقييم والاختبارات')}
                </button>
                <button
                    onClick={() => setActiveTab('my-applications')}
                    className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === 'my-applications' 
                            ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {t('My Applications', 'طلباتي')} ({myApps.length})
                </button>
            </div>

            {/* Tab: Centers */}
            {activeTab === 'centers' && (
                <div className="space-y-8">
                    {centers.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 dark:bg-slate-900 dark:border-slate-800">
                            <Target size={48} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500 font-medium">{t('No Assessment Centers registered yet.', 'لم يتم تسجيل أي مراكز تقييم بعد.')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {centers.map(center => (
                                <div key={center.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-800 space-y-6">
                                    <div className="flex justify-between items-start flex-wrap gap-4">
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2.5 py-1 rounded">
                                                {center.industry || t('General Assessment', 'تقييم عام')}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">{center.company_name || center.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{center.description}</p>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-slate-400 text-right">
                                            <div className="font-semibold">{center.emirate}</div>
                                            <div>{center.website}</div>
                                        </div>
                                    </div>

                                    {/* Active Assessments list */}
                                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                                            {t('Available Evaluations', 'التقييمات المتاحة')}
                                        </h4>
                                        
                                        {(!center.templates || center.templates.length === 0) ? (
                                            <p className="text-xs text-gray-400 italic">{t('No assessments listed by this center currently.', 'لا توجد تقييمات مدرجة من هذا المركز حالياً.')}</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {center.templates.map((tItem: any) => (
                                                    <div key={tItem.id} className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex flex-col justify-between space-y-4">
                                                        <div>
                                                            <div className="flex justify-between items-center">
                                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">{tItem.name}</h5>
                                                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                                                    NQF {tItem.nqf_level}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{tItem.description}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-900">
                                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                                {tItem.duration_minutes} {t('mins', 'دقيقة')} · {t('Pass score:', 'درجة النجاح:')} {tItem.passing_score}%
                                                            </span>
                                                            <button
                                                                onClick={() => handleApply(tItem.id, center.id)}
                                                                disabled={applyingId === tItem.id}
                                                                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                                                            >
                                                                {applyingId === tItem.id ? <Loader2 size={12} className="animate-spin" /> : t('Apply', 'تقديم')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: My Applications */}
            {activeTab === 'my-applications' && (
                <div className="space-y-6">
                    {myApps.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 dark:bg-slate-900 dark:border-slate-800">
                            <Clock size={48} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500 font-medium">{t('No assessment applications found.', 'لا توجد طلبات تقييم.')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myApps.map(app => (
                                <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4 transition-all hover:border-teal-200">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{app.assessment_name}</h3>
                                            {getStatusBadge(app.status)}
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500">
                                            {t('Applied to:', 'مقدم لـ:')} <span className="font-semibold text-gray-600 dark:text-slate-300">{app.center_full_name || app.center_name}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500">
                                            {t('Submitted on:', 'تاريخ التقديم:')} {new Date(app.applied_at).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US')}
                                        </p>
                                        {app.scheduled_at && (
                                            <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/20 px-2 py-1 rounded inline-block">
                                                {t('Scheduled date:', 'تاريخ الموعد:')} {new Date(app.scheduled_at).toLocaleString(isRTL ? 'ar-AE' : 'en-US')}
                                            </p>
                                        )}
                                        {app.notes && (
                                            <div className="p-3 bg-gray-50 dark:bg-slate-950/40 rounded-lg border border-gray-100 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-400 mt-2">
                                                <span className="font-bold block mb-1">{t('Assessor Feedback:', 'ملاحظات المقيم:')}</span>
                                                {app.notes}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {app.status === 'completed' && (
                                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 p-4 rounded-xl">
                                            <Award className="text-emerald-600 dark:text-emerald-400" size={24} />
                                            <div>
                                                <span className="text-[10px] text-emerald-600 uppercase tracking-wide font-bold">{t('Verified Portfolio Badge', 'شارة موثقة في المحفظة')}</span>
                                                <span className="block text-xs text-gray-500 dark:text-slate-400">{t('Sync complete', 'تمت المزامنة بنجاح')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
