import React, { useState, useEffect } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    ClipboardCheck, Building2, Award, Calendar, Settings, Users,
    CheckCircle, Clock, TrendingUp, Plus, Search, Eye, BarChart3
} from 'lucide-react';

const brand = {
    primary: '#D97706', secondary: '#F59E0B', accent: '#FCD34D',
    bg: '#FFFBEB', cardBg: '#FFFFFF',
    textPrimary: '#78350F', textSecondary: '#6B7280', border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    amberBg: '#FEF3C7', amberText: '#D97706',
};

const API_BASE = import.meta.env.VITE_API_URL || '';

const AssessmentOperatorDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState<any>({ total_templates: 0, active_assessments: 0, competency_models: 0, pending_reviews: 0, total_assessed: 0 });
    const [templates, setTemplates] = useState<any[]>([]);
    const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const resp = await fetch(`${API_BASE}/api/assessor/operator/stats`);
                if (resp.ok && !cancelled) {
                    const d = await resp.json();
                    if (d.success) {
                        setStats(d.stats || {});
                        setTemplates(d.templates || []);
                        setRecentAssessments(d.recent_assessments || []);
                    }
                }
            } catch (err) { console.error('Assessment operator fetch error:', err); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, []);

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'centers', label: t('Assessment Centers', 'مراكز التقييم'), icon: Building2 },
        { id: 'certifications', label: t('Certifications', 'الشهادات'), icon: Award },
        { id: 'schedule', label: t('Schedule', 'الجدول'), icon: Calendar },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const overviewStats = [
        { label: t('Assessment Templates', 'قوالب التقييم'), value: String(stats.total_templates || 0), icon: Building2 },
        { label: t('Active Assessments', 'التقييمات النشطة'), value: String(stats.active_assessments || 0), icon: Award },
        { label: t('Competency Models', 'نماذج الكفاءات'), value: String(stats.competency_models || 0), icon: BarChart3 },
        { label: t('Pending Reviews', 'مراجعات معلقة'), value: String(stats.pending_reviews || 0), icon: Clock },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.amberBg, borderRadius: 10, padding: 10 }}><s.icon size={20} color={brand.amberText} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <ClipboardCheck size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Assessment Templates', 'قوالب التقييم')}
                    </h3>
                    {templates.length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No templates yet', 'لا توجد قوالب بعد')}</div>}
                    {templates.slice(0, 4).map((tmpl: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < Math.min(templates.length, 4) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{tmpl.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{tmpl.template_type} • {tmpl.industry_sector || 'General'}</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: tmpl.is_active ? brand.greenText : brand.yellowText, background: tmpl.is_active ? brand.greenBg : brand.yellowBg, padding: '3px 10px', borderRadius: 20 }}>
                                {tmpl.is_active ? t('Active', 'نشط') : t('Draft', 'مسودة')}
                            </span>
                        </div>
                    ))}
                </div>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <Calendar size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Recent Assessments', 'التقييمات الأخيرة')}
                    </h3>
                    {recentAssessments.length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No recent assessments', 'لا توجد تقييمات حديثة')}</div>}
                    {recentAssessments.slice(0, 4).map((a: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < Math.min(recentAssessments.length, 4) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{a.assessment_title || a.title}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{a.status} • {a.assessment_mode || 'Online'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCenters = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary }} />
                    <input placeholder={t('Search centers...', 'بحث عن مراكز...')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Center', 'إضافة مركز')}
                </button>
            </div>
            <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Assessment centers will be loaded from the backend API', 'سيتم تحميل مراكز التقييم من واجهة البرمجة')}</div>
        </div>
    );

    const renderCertifications = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('All', 'الكل'), t('Active', 'نشط'), t('Draft', 'مسودة')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('New Certification', 'شهادة جديدة')}
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {templates.map((tmpl: any, i: number) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{tmpl.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>{tmpl.template_type} • {tmpl.industry_sector || 'General'}</div>
                            </div>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: tmpl.is_active ? brand.greenBg : '#F1F5F9', color: tmpl.is_active ? brand.greenText : brand.textSecondary }}>{tmpl.is_active ? t('Active', 'نشط') : t('Draft', 'مسودة')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: brand.textSecondary }}>
                            <span><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{tmpl.duration_minutes || 60} {t('min', 'دقيقة')}</span>
                            <span><CheckCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{tmpl.passing_score || 70}% {t('pass', 'اجتياز')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSchedule = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Schedule Session', 'جدولة جلسة')}
                </button>
            </div>
            {recentAssessments.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No scheduled assessments', 'لا توجد تقييمات مجدولة')}</div>}
            {recentAssessments.map((a: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.amberBg, borderRadius: 10, padding: 12, textAlign: 'center', minWidth: 50 }}>
                            <Calendar size={18} color={brand.amberText} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{a.assessment_title || a.title}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{a.status} • {a.assessment_mode || 'Online'}</div>
                        </div>
                    </div>
                    <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: a.status === 'scheduled' ? brand.amberBg : brand.greenBg, color: a.status === 'scheduled' ? brand.amberText : brand.greenText }}>
                        {a.status}
                    </span>
                </div>
            ))}
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Auto-Schedule Retakes', 'إعادة الجدولة التلقائية'), desc: t('Automatically schedule retake slots for failed candidates', 'جدولة تلقائية لإعادة الاختبار للمرشحين الراسبين'), value: t('Enabled', 'مفعّل') },
                { title: t('Result Processing SLA', 'مدة معالجة النتائج'), desc: t('Maximum days to publish assessment results', 'الحد الأقصى لأيام نشر نتائج التقييم'), value: t('5 Days', '5 أيام') },
                { title: t('Minimum Pass Score', 'الحد الأدنى للنجاح'), desc: t('Default minimum score required to pass assessments', 'الحد الأدنى الافتراضي للنجاح في التقييمات'), value: '60%' },
                { title: t('MOHRE Integration', 'تكامل وزارة الموارد البشرية'), desc: t('Sync certification results with MOHRE records', 'مزامنة نتائج الشهادات مع سجلات الوزارة'), value: t('Enabled', 'مفعّل') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.amberBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.amberBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <ClipboardCheck size={16} color={brand.amberText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.amberText }}>{t('Assessment Operator', 'مشغل التقييم')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Assessment Operations Dashboard', 'لوحة عمليات التقييم')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Manage assessment centers, certifications, and evaluation schedules', 'إدارة مراكز التقييم والشهادات وجداول التقييم')}</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: brand.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${brand.border}`, marginBottom: 24 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: activeTab === tab.id ? brand.primary : 'transparent',
                            color: activeTab === tab.id ? 'white' : brand.textSecondary, transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>
                {loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Loading...', 'جاري التحميل...')}</div>}
                {!loading && activeTab === 'overview' && renderOverview()}
                {!loading && activeTab === 'centers' && renderCenters()}
                {!loading && activeTab === 'certifications' && renderCertifications()}
                {!loading && activeTab === 'schedule' && renderSchedule()}
                {!loading && activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default AssessmentOperatorDashboard;
