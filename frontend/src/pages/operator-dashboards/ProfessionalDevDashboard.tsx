import React, { useState } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Award, UserCheck, BookOpen, ClipboardCheck, Settings, Search,
    CheckCircle, Clock, TrendingUp, Plus, Star, Users,
    ArrowUp, ArrowDown, Eye, Filter, Shield
} from 'lucide-react';

const brand = {
    primary: '#0D9488',
    secondary: '#14B8A6',
    accent: '#5EEAD4',
    bg: '#F0FDFA',
    cardBg: '#FFFFFF',
    textPrimary: '#134E4A',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    tealBg: '#CCFBF1', tealText: '#0D9488',
};

const ProfessionalDevDashboard: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'mentors', label: t('Mentors', 'الموجهون'), icon: UserCheck },
        { id: 'training', label: t('Training', 'التدريب'), icon: BookOpen },
        { id: 'certifications', label: t('Certifications', 'الشهادات'), icon: Award },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const stats = [
        { label: t('Active Mentors', 'الموجهون النشطون'), value: '284', change: '+18', up: true, icon: UserCheck },
        { label: t('Training Courses', 'الدورات التدريبية'), value: '156', change: '+12', up: true, icon: BookOpen },
        { label: t('Certifications Issued', 'الشهادات الصادرة'), value: '3,420', change: '+205', up: true, icon: Award },
        { label: t('Pending Reviews', 'بانتظار المراجعة'), value: '23', change: '-5', up: false, icon: Clock },
    ];

    const mentors = [
        { name: t('Dr. Sara Al Ketbi', 'د. سارة الكتبي'), expertise: t('AI & Data Science', 'الذكاء الاصطناعي وعلوم البيانات'), rating: 4.9, sessions: 142, status: 'active' },
        { name: t('Eng. Omar Al Suwaidi', 'م. عمر السويدي'), expertise: t('Engineering & Manufacturing', 'الهندسة والتصنيع'), rating: 4.8, sessions: 98, status: 'active' },
        { name: t('Dr. Aisha Al Mazrouei', 'د. عائشة المزروعي'), expertise: t('Healthcare Administration', 'إدارة الرعاية الصحية'), rating: 4.7, sessions: 76, status: 'active' },
        { name: t('Mr. Hamad Al Shamsi', 'السيد حمد الشامسي'), expertise: t('Finance & Banking', 'المالية والمصارف'), rating: 4.9, sessions: 120, status: 'active' },
        { name: t('Ms. Noura Al Dhaheri', 'السيدة نورة الظاهري'), expertise: t('Marketing & Digital', 'التسويق الرقمي'), rating: 0, sessions: 0, status: 'pending' },
    ];

    const trainingCourses = [
        { name: t('UAE Leadership Excellence', 'التميز القيادي الإماراتي'), provider: t('INSEAD Abu Dhabi', 'إنسياد أبوظبي'), enrolled: 45, status: 'published', type: t('Leadership', 'قيادة') },
        { name: t('Agile Project Management', 'إدارة المشاريع المرنة'), provider: t('PwC Academy', 'أكاديمية PwC'), enrolled: 82, status: 'published', type: t('Management', 'إدارة') },
        { name: t('Cybersecurity Fundamentals', 'أساسيات الأمن السيبراني'), provider: t('Etisalat Academy', 'أكاديمية اتصالات'), enrolled: 120, status: 'published', type: t('Technology', 'تكنولوجيا') },
        { name: t('Financial Analysis', 'التحليل المالي'), provider: t('CFA Institute', 'معهد CFA'), enrolled: 0, status: 'pending', type: t('Finance', 'مالية') },
    ];

    const certBodies = [
        { name: 'KHDA', certs: 145, active: true },
        { name: 'ACTVET', certs: 89, active: true },
        { name: 'ADEK', certs: 67, active: true },
        { name: 'ILM', certs: 52, active: true },
        { name: 'CIPD', certs: 38, active: false },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {stats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.tealBg, borderRadius: 10, padding: 10 }}>
                            <s.icon size={20} color={brand.tealText} />
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

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Top Performing Mentors', 'أفضل الموجهين أداءً')}</h3>
                    {mentors.filter(m => m.status === 'active').slice(0, 4).map((m, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{m.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.expertise}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 600, color: '#F59E0B' }}><Star size={13} fill="#F59E0B" /> {m.rating}</span>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{m.sessions} {t('sessions', 'جلسات')}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Certification Bodies', 'جهات الاعتماد')}</h3>
                    {certBodies.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < certBodies.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={14} color={c.active ? brand.tealText : brand.textSecondary} />
                                <span style={{ fontSize: 14, fontWeight: 500, color: brand.textPrimary }}>{c.name}</span>
                            </div>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>{c.certs} {t('certs', 'شهادة')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMentors = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary }} />
                    <input placeholder={t('Search mentors...', 'بحث عن موجهين...')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Mentor', 'إضافة موجه')}
                </button>
            </div>
            {mentors.map((m, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.tealBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCheck size={20} color={brand.tealText} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.expertise} • {m.sessions} {t('sessions completed', 'جلسة مكتملة')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {m.rating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 14, fontWeight: 600, color: '#F59E0B' }}><Star size={14} fill="#F59E0B" /> {m.rating}</span>}
                        <span style={{
                            fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                            background: m.status === 'active' ? brand.greenBg : brand.yellowBg,
                            color: m.status === 'active' ? brand.greenText : brand.yellowText
                        }}>
                            {m.status === 'active' ? t('Active', 'نشط') : t('Pending', 'قيد المراجعة')}
                        </span>
                        {m.status === 'pending' && (
                            <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.greenBg, color: brand.greenText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ {t('Approve', 'موافقة')}</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTraining = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('All', 'الكل'), t('Published', 'منشور'), t('Pending', 'قيد الانتظار')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Course', 'إضافة دورة')}
                </button>
            </div>
            {trainingCourses.map((c, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{c.name}</span>
                            <span style={{ fontSize: 11, background: brand.tealBg, color: brand.tealText, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{c.type}</span>
                        </div>
                        <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.provider} • {c.enrolled} {t('enrolled', 'مسجل')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                            background: c.status === 'published' ? brand.greenBg : brand.yellowBg,
                            color: c.status === 'published' ? brand.greenText : brand.yellowText
                        }}>{c.status === 'published' ? t('Published', 'منشور') : t('Pending', 'قيد الانتظار')}</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {certBodies.map((c, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, textAlign: 'center' }}>
                        <Shield size={24} color={c.active ? brand.tealText : brand.textSecondary} style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary }}>{c.name}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: brand.primary, margin: '8px 0' }}>{c.certs}</div>
                        <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('certifications issued', 'شهادة صادرة')}</div>
                        <span style={{
                            display: 'inline-block', marginTop: 8, fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                            background: c.active ? brand.greenBg : brand.redBg,
                            color: c.active ? brand.greenText : brand.redText
                        }}>{c.active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Mentor Vetting Period', 'فترة التحقق من الموجهين'), desc: t('Days to review new mentor applications', 'أيام مراجعة طلبات الموجهين الجدد'), value: t('5 Days', '5 أيام') },
                { title: t('Min. Mentor Experience', 'الحد الأدنى لخبرة الموجه'), desc: t('Minimum years of industry experience required', 'الحد الأدنى لسنوات الخبرة المطلوبة'), value: t('5 Years', '5 سنوات') },
                { title: t('Training Accreditation', 'اعتماد التدريب'), desc: t('Require KHDA/ACTVET accreditation for all courses', 'طلب اعتماد هيئة المعرفة/ ACTVET لجميع الدورات'), value: t('Required', 'مطلوب') },
                { title: t('Blockchain Credential Issuing', 'إصدار الشهادات الرقمية'), desc: t('Enable blockchain-based digital credential issuance', 'تفعيل إصدار الشهادات الرقمية عبر البلوكتشين'), value: t('Beta', 'تجريبي') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.tealBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.tealBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <Award size={16} color={brand.tealText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.tealText }}>{t('Professional Development Operator', 'مشغل التطوير المهني')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Professional Development Dashboard', 'لوحة التطوير المهني')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Manage mentors, training programs, certifications, and assessments', 'إدارة الموجهين وبرامج التدريب والشهادات والتقييمات')}</p>
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
                {activeTab === 'mentors' && renderMentors()}
                {activeTab === 'training' && renderTraining()}
                {activeTab === 'certifications' && renderCertifications()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default ProfessionalDevDashboard;
