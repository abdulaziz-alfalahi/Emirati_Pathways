import React, { useState } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    ClipboardCheck, Building2, Award, Calendar, Settings, Users,
    CheckCircle, Clock, TrendingUp, Plus, Search,
    ArrowUp, ArrowDown, Eye, AlertTriangle, FileText, BarChart3
} from 'lucide-react';

const brand = {
    primary: '#D97706',
    secondary: '#F59E0B',
    accent: '#FCD34D',
    bg: '#FFFBEB',
    cardBg: '#FFFFFF',
    textPrimary: '#78350F',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    amberBg: '#FEF3C7', amberText: '#D97706',
};

const AssessmentOperatorDashboard: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'centers', label: t('Assessment Centers', 'مراكز التقييم'), icon: Building2 },
        { id: 'certifications', label: t('Certifications', 'الشهادات'), icon: Award },
        { id: 'schedule', label: t('Schedule', 'الجدول'), icon: Calendar },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const stats = [
        { label: t('Assessment Centers', 'مراكز التقييم'), value: '24', change: '+3', up: true, icon: Building2 },
        { label: t('Active Certifications', 'الشهادات النشطة'), value: '156', change: '+12', up: true, icon: Award },
        { label: t('Assessed This Month', 'تم تقييمهم هذا الشهر'), value: '1,842', change: '+245', up: true, icon: Users },
        { label: t('Pending Reviews', 'مراجعات معلقة'), value: '38', change: '-5', up: false, icon: Clock },
    ];

    const centers = [
        { name: t('Abu Dhabi Assessment Hub', 'مركز تقييم أبوظبي'), type: t('Government', 'حكومي'), capacity: 200, utilization: 85, status: 'active', emirate: t('Abu Dhabi', 'أبوظبي'), assessments: 4500 },
        { name: t('Dubai Skills Center', 'مركز مهارات دبي'), type: t('Private', 'خاص'), capacity: 150, utilization: 92, status: 'active', emirate: t('Dubai', 'دبي'), assessments: 3800 },
        { name: t('Sharjah Evaluation Institute', 'معهد الشارقة للتقييم'), type: t('Semi-Government', 'شبه حكومي'), capacity: 100, utilization: 68, status: 'active', emirate: t('Sharjah', 'الشارقة'), assessments: 1200 },
        { name: t('RAK Technical Assessment', 'التقييم التقني في رأس الخيمة'), type: t('Private', 'خاص'), capacity: 60, utilization: 45, status: 'pending', emirate: t('Ras Al Khaimah', 'رأس الخيمة'), assessments: 0 },
        { name: t('Ajman Youth Assessment', 'تقييم شباب عجمان'), type: t('Government', 'حكومي'), capacity: 80, utilization: 72, status: 'active', emirate: t('Ajman', 'عجمان'), assessments: 950 },
    ];

    const certifications = [
        { name: t('Professional Skills Assessment', 'تقييم المهارات المهنية'), provider: t('MOHRE', 'وزارة الموارد البشرية'), level: t('Advanced', 'متقدم'), candidates: 450, passRate: 78, status: 'active' },
        { name: t('Digital Literacy Certificate', 'شهادة المعرفة الرقمية'), provider: t('TRA', 'هيئة تنظيم الاتصالات'), level: t('Intermediate', 'متوسط'), candidates: 1200, passRate: 85, status: 'active' },
        { name: t('Leadership Competency Exam', 'اختبار الكفاءات القيادية'), provider: t('FAHR', 'الهيئة الاتحادية للموارد البشرية'), level: t('Expert', 'خبير'), candidates: 180, passRate: 62, status: 'active' },
        { name: t('Workplace Safety Certification', 'شهادة السلامة المهنية'), provider: t('OSHAD', 'أوشاد'), level: t('Basic', 'أساسي'), candidates: 2100, passRate: 91, status: 'active' },
        { name: t('AI Readiness Assessment', 'تقييم الجاهزية للذكاء الاصطناعي'), provider: t('AI Office', 'مكتب الذكاء الاصطناعي'), level: t('Intermediate', 'متوسط'), candidates: 0, passRate: 0, status: 'draft' },
    ];

    const upcomingSessions = [
        { date: '2026-02-25', center: t('Abu Dhabi Assessment Hub', 'مركز تقييم أبوظبي'), certification: t('Professional Skills', 'المهارات المهنية'), slots: 40, booked: 35 },
        { date: '2026-02-26', center: t('Dubai Skills Center', 'مركز مهارات دبي'), certification: t('Digital Literacy', 'المعرفة الرقمية'), slots: 50, booked: 48 },
        { date: '2026-02-27', center: t('Sharjah Evaluation Institute', 'معهد الشارقة'), certification: t('Leadership Competency', 'الكفاءات القيادية'), slots: 25, booked: 12 },
        { date: '2026-03-01', center: t('Ajman Youth Assessment', 'تقييم شباب عجمان'), certification: t('Workplace Safety', 'السلامة المهنية'), slots: 60, booked: 55 },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {stats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.amberBg, borderRadius: 10, padding: 10 }}>
                            <s.icon size={20} color={brand.amberText} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: s.up ? brand.greenText : brand.redText, display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
                                {s.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {s.change} {t('this month', 'هذا الشهر')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <Calendar size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Upcoming Sessions', 'الجلسات القادمة')}
                    </h3>
                    {upcomingSessions.slice(0, 3).map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.certification}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.center} • {s.date}</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: s.booked >= s.slots * 0.9 ? brand.redText : brand.greenText }}>
                                {s.booked}/{s.slots} {t('booked', 'محجوز')}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <BarChart3 size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Certification Pass Rates', 'معدلات النجاح في الشهادات')}
                    </h3>
                    {certifications.filter(c => c.status === 'active').slice(0, 4).map((c, i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: brand.textPrimary }}>{c.name}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: c.passRate >= 80 ? brand.greenText : c.passRate >= 60 ? brand.yellowText : brand.redText }}>{c.passRate}%</span>
                            </div>
                            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                                <div style={{ height: '100%', width: `${c.passRate}%`, background: c.passRate >= 80 ? brand.greenText : c.passRate >= 60 ? brand.yellowText : brand.redText, borderRadius: 4, transition: 'width 0.5s ease' }} />
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

            {centers.map((c, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.amberBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={20} color={brand.amberText} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                {c.type} • {c.emirate} • {t('Capacity', 'السعة')}: {c.capacity} • {c.assessments.toLocaleString()} {t('assessments', 'تقييم')}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: c.utilization >= 80 ? brand.greenText : c.utilization >= 50 ? brand.yellowText : brand.redText }}>{c.utilization}%</div>
                            <div style={{ fontSize: 10, color: brand.textSecondary }}>{t('Utilization', 'الاستخدام')}</div>
                        </div>
                        <span style={{
                            fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                            background: c.status === 'active' ? brand.greenBg : brand.yellowBg,
                            color: c.status === 'active' ? brand.greenText : brand.yellowText
                        }}>
                            {c.status === 'active' ? t('Active', 'نشط') : t('Pending', 'قيد الانتظار')}
                        </span>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.primary, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('Manage', 'إدارة')}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderCertifications = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('All', 'الكل'), t('Active', 'نشط'), t('Draft', 'مسودة'), t('Archived', 'مؤرشف')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('New Certification', 'شهادة جديدة')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {certifications.map((c, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{c.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>{c.provider} • {c.level}</div>
                            </div>
                            <span style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                                background: c.status === 'active' ? brand.greenBg : '#F1F5F9',
                                color: c.status === 'active' ? brand.greenText : brand.textSecondary
                            }}>{c.status === 'active' ? t('Active', 'نشط') : t('Draft', 'مسودة')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: brand.textSecondary }}>
                            <span><Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{c.candidates.toLocaleString()} {t('candidates', 'مرشح')}</span>
                            {c.passRate > 0 && <span><CheckCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{c.passRate}% {t('pass rate', 'نسبة النجاح')}</span>}
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
            {upcomingSessions.map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.amberBg, borderRadius: 10, padding: 12, textAlign: 'center', minWidth: 50 }}>
                            <Calendar size={18} color={brand.amberText} />
                            <div style={{ fontSize: 11, fontWeight: 700, color: brand.amberText, marginTop: 2 }}>{s.date.split('-')[2]}/{s.date.split('-')[1]}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{s.certification}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.center}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: s.booked >= s.slots * 0.9 ? brand.redText : brand.greenText }}>{s.booked}/{s.slots}</div>
                            <div style={{ fontSize: 10, color: brand.textSecondary }}>{t('Booked', 'محجوز')}</div>
                        </div>
                        <div style={{ height: 6, width: 80, background: '#F1F5F9', borderRadius: 3 }}>
                            <div style={{ height: '100%', width: `${(s.booked / s.slots) * 100}%`, background: s.booked >= s.slots * 0.9 ? brand.redText : brand.greenText, borderRadius: 3 }} />
                        </div>
                    </div>
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
            <HybridGovernmentNavFixed />
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
                            color: activeTab === tab.id ? 'white' : brand.textSecondary,
                            transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'centers' && renderCenters()}
                {activeTab === 'certifications' && renderCertifications()}
                {activeTab === 'schedule' && renderSchedule()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default AssessmentOperatorDashboard;
