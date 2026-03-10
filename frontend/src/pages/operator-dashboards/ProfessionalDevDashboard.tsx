import React, { useState, useEffect } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Award, UserCheck, BookOpen, Settings, Search,
    Clock, TrendingUp, Plus, Star, Users, Eye, Shield
} from 'lucide-react';

const brand = {
    primary: '#0D9488', secondary: '#14B8A6', accent: '#5EEAD4',
    bg: '#F0FDFA', cardBg: '#FFFFFF',
    textPrimary: '#134E4A', textSecondary: '#6B7280', border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    tealBg: '#CCFBF1', tealText: '#0D9488',
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const ProfessionalDevDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState<any>({ training_courses: 0, published_courses: 0, pending_courses: 0, total_enrolled: 0, total_certs_issued: 0, cert_bodies: 0 });
    const [courses, setCourses] = useState<any[]>([]);
    const [certBodies, setCertBodies] = useState<any[]>([]);
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [profResp, mentorResp] = await Promise.all([
                    fetch(`${API_BASE}/api/education/profdev/operator/stats`),
                    fetch(`${API_BASE}/api/mentor/operator/stats`).catch(() => null),
                ]);
                if (profResp.ok && !cancelled) {
                    const d = await profResp.json();
                    setStats(d.stats || {});
                    setCourses(d.courses || []);
                    setCertBodies(d.certification_bodies || []);
                }
                if (mentorResp && mentorResp.ok && !cancelled) {
                    const d = await mentorResp.json();
                    setMentors(d.mentors || []);
                }
            } catch (err) { console.error('ProfDev operator fetch error:', err); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, []);

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'mentors', label: t('Mentors', 'الموجهون'), icon: UserCheck },
        { id: 'training', label: t('Training', 'التدريب'), icon: BookOpen },
        { id: 'certifications', label: t('Certifications', 'الشهادات'), icon: Award },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const overviewStats = [
        { label: t('Active Mentors', 'الموجهون النشطون'), value: String(mentors.filter((m: any) => m.status === 'available').length), icon: UserCheck },
        { label: t('Training Courses', 'الدورات التدريبية'), value: String(stats.training_courses || 0), icon: BookOpen },
        { label: t('Certifications Issued', 'الشهادات الصادرة'), value: String(stats.total_certs_issued || 0), icon: Award },
        { label: t('Pending Reviews', 'بانتظار المراجعة'), value: String(stats.pending_courses || 0), icon: Clock },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.tealBg, borderRadius: 10, padding: 10 }}><s.icon size={20} color={brand.tealText} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Top Performing Mentors', 'أفضل الموجهين أداءً')}</h3>
                    {mentors.filter((m: any) => m.rating > 0).sort((a: any, b: any) => b.rating - a.rating).slice(0, 4).map((m: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{m.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{(m.expertise || []).join(', ')}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 600, color: '#F59E0B' }}><Star size={13} fill="#F59E0B" /> {m.rating}</span>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{m.sessions || 0} {t('sessions', 'جلسات')}</span>
                            </div>
                        </div>
                    ))}
                    {mentors.filter((m: any) => m.rating > 0).length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No rated mentors yet', 'لا يوجد موجهين مقيّمين بعد')}</div>}
                </div>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Certification Bodies', 'جهات الاعتماد')}</h3>
                    {certBodies.map((c: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < certBodies.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={14} color={c.is_active ? brand.tealText : brand.textSecondary} />
                                <span style={{ fontSize: 14, fontWeight: 500, color: brand.textPrimary }}>{c.name}</span>
                            </div>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>{c.certs_issued} {t('certs', 'شهادة')}</span>
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
            {mentors.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No mentors found', 'لم يتم العثور على موجهين')}</div>}
            {mentors.map((m: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.tealBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCheck size={20} color={brand.tealText} /></div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{(m.expertise || []).join(', ')} • {m.sessions || 0} {t('sessions completed', 'جلسة مكتملة')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {m.rating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 14, fontWeight: 600, color: '#F59E0B' }}><Star size={14} fill="#F59E0B" /> {m.rating}</span>}
                        <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: m.status === 'available' ? brand.greenBg : brand.yellowBg, color: m.status === 'available' ? brand.greenText : brand.yellowText }}>
                            {m.status === 'available' ? t('Active', 'نشط') : t('Pending', 'قيد المراجعة')}
                        </span>
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
            {courses.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No courses found', 'لم يتم العثور على دورات')}</div>}
            {courses.map((c: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (c.name_ar || c.name) : c.name}</span>
                            <span style={{ fontSize: 11, background: brand.tealBg, color: brand.tealText, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{c.course_type}</span>
                        </div>
                        <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.provider} • {c.enrolled || 0} {t('enrolled', 'مسجل')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: c.status === 'published' ? brand.greenBg : brand.yellowBg, color: c.status === 'published' ? brand.greenText : brand.yellowText }}>
                            {c.status === 'published' ? t('Published', 'منشور') : t('Pending', 'قيد الانتظار')}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {certBodies.map((c: any, i: number) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, textAlign: 'center' }}>
                        <Shield size={24} color={c.is_active ? brand.tealText : brand.textSecondary} style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary }}>{c.name}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: brand.primary, margin: '8px 0' }}>{c.certs_issued}</div>
                        <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('certifications issued', 'شهادة صادرة')}</div>
                        <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: c.is_active ? brand.greenBg : brand.redBg, color: c.is_active ? brand.greenText : brand.redText }}>
                            {c.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                        </span>
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
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
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
                            color: activeTab === tab.id ? 'white' : brand.textSecondary, transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>
                {loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Loading...', 'جاري التحميل...')}</div>}
                {!loading && activeTab === 'overview' && renderOverview()}
                {!loading && activeTab === 'mentors' && renderMentors()}
                {!loading && activeTab === 'training' && renderTraining()}
                {!loading && activeTab === 'certifications' && renderCertifications()}
                {!loading && activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default ProfessionalDevDashboard;
