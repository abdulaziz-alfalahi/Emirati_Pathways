import React, { useState, useEffect } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    UserCheck, Users, Briefcase, Settings, Heart,
    Clock, TrendingUp, Plus, Search, Eye, Star, MessageSquare, Target
} from 'lucide-react';

const brand = {
    primary: '#4F46E5', secondary: '#6366F1', accent: '#A5B4FC',
    bg: '#EEF2FF', cardBg: '#FFFFFF',
    textPrimary: '#312E81', textSecondary: '#6B7280', border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    indigoBg: '#E0E7FF', indigoText: '#4F46E5',
};

const API_BASE = import.meta.env.VITE_API_URL || '';

const MentorshipOperatorDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState<any>({ total_mentors: 0, active_mentors: 0, total_mentee_pairs: 0, average_rating: 0, pending_matches: 0 });
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const resp = await fetch(`${API_BASE}/api/mentor/operator/stats`);
                if (resp.ok && !cancelled) {
                    const d = await resp.json();
                    if (d.success) {
                        setStats(d.stats || {});
                        setMentors(d.mentors || []);
                    }
                }
            } catch (err) { console.error('Mentorship operator fetch error:', err); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, []);

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'mentors', label: t('Mentors', 'المرشدون'), icon: UserCheck },
        { id: 'programs', label: t('Programs', 'البرامج'), icon: Briefcase },
        { id: 'matches', label: t('Matches', 'المطابقات'), icon: Heart },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const overviewStats = [
        { label: t('Active Mentors', 'المرشدون النشطون'), value: String(stats.active_mentors || 0), icon: UserCheck },
        { label: t('Total Mentors', 'إجمالي المرشدين'), value: String(stats.total_mentors || 0), icon: Briefcase },
        { label: t('Mentee-Mentor Pairs', 'أزواج المتدربين والمرشدين'), value: String(stats.total_mentee_pairs || 0), icon: Heart },
        { label: t('Avg Rating', 'متوسط التقييم'), value: String(stats.average_rating || 0), icon: Star },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.indigoBg, borderRadius: 10, padding: 10 }}><s.icon size={20} color={brand.indigoText} /></div>
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
                        <Target size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Top Mentors', 'أفضل المرشدين')}
                    </h3>
                    {mentors.filter(m => m.rating > 0).sort((a: any, b: any) => b.rating - a.rating).slice(0, 4).map((m: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{m.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.company} • {m.mentees} {t('mentees', 'متدربين')}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: brand.yellowText }}>
                                <Star size={14} fill={brand.yellowText} /> {m.rating}
                            </div>
                        </div>
                    ))}
                    {mentors.filter(m => m.rating > 0).length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No rated mentors yet', 'لا يوجد مرشدون مقيّمون بعد')}</div>}
                </div>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <Heart size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Expertise Distribution', 'توزيع التخصصات')}
                    </h3>
                    {(() => {
                        const expertiseCounts: Record<string, number> = {};
                        mentors.forEach((m: any) => (m.expertise || []).forEach((e: string) => { expertiseCounts[e] = (expertiseCounts[e] || 0) + 1; }));
                        const total = Math.max(Object.values(expertiseCounts).reduce((a: number, b: number) => a + b, 0), 1);
                        return Object.entries(expertiseCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5).map(([area, count], i) => {
                            const pct = Math.round(((count as number) / total) * 100);
                            return (
                                <div key={i} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, color: brand.textPrimary }}>{area}</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary }}>{count as number} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: brand.primary, borderRadius: 4, transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );

    const renderMentors = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary }} />
                    <input placeholder={t('Search mentors...', 'بحث عن مرشدين...')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Onboard Mentor', 'إضافة مرشد')}
                </button>
            </div>
            {mentors.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No mentors found', 'لم يتم العثور على مرشدين')}</div>}
            {mentors.map((m: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.indigoBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCheck size={20} color={brand.indigoText} /></div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{(m.expertise || []).join(', ')} • {m.company} • {m.mentees} {t('mentees', 'متدربين')} • {m.sessions} {t('sessions', 'جلسات')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {m.rating > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: brand.yellowText }}><Star size={14} fill={brand.yellowText} /> {m.rating}</div>}
                        <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: m.status === 'available' ? brand.greenBg : brand.yellowBg, color: m.status === 'available' ? brand.greenText : brand.yellowText }}>
                            {m.status === 'available' ? t('Active', 'نشط') : t('Pending', 'قيد الانتظار')}
                        </span>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.primary, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('Profile', 'الملف')}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPrograms = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('All', 'الكل'), t('Active', 'نشط'), t('Draft', 'مسودة')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Create Program', 'إنشاء برنامج')}
                </button>
            </div>
            <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Programs will be loaded from the mentorship program API', 'سيتم تحميل البرامج من واجهة برامج الإرشاد')}</div>
        </div>
    );

    const renderMatches = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Heart size={14} /> {t('Auto-Match', 'مطابقة تلقائية')}
                </button>
            </div>
            <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Matches will be loaded from the mentor matching API', 'سيتم تحميل المطابقات من واجهة مطابقة المرشدين')}</div>
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Auto-Matching Algorithm', 'خوارزمية المطابقة التلقائية'), desc: t('Use AI to match mentees with mentors based on skills and goals', 'استخدام الذكاء الاصطناعي لمطابقة المتدربين مع المرشدين'), value: t('Enabled', 'مفعّل') },
                { title: t('Session Frequency', 'تكرار الجلسات'), desc: t('Recommended meeting frequency for mentorship pairs', 'عدد الجلسات الموصى بها لأزواج الإرشاد'), value: t('Bi-weekly', 'كل أسبوعين') },
                { title: t('Max Mentees per Mentor', 'الحد الأقصى للمتدربين'), desc: t('Maximum number of mentees a single mentor can take', 'الحد الأقصى لعدد المتدربين لكل مرشد'), value: '8' },
                { title: t('Feedback Requirement', 'متطلبات التقييم'), desc: t('Require feedback after every session', 'طلب تقييم بعد كل جلسة'), value: t('Required', 'مطلوب') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.indigoBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.indigoBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <UserCheck size={16} color={brand.indigoText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.indigoText }}>{t('Mentorship Operator', 'مشغل الإرشاد')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Mentorship Operations Dashboard', 'لوحة عمليات الإرشاد')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Onboard mentors, manage programs, and facilitate mentee-mentor connections', 'إدارة المرشدين والبرامج وتسهيل التواصل بين المتدربين والمرشدين')}</p>
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
                {!loading && activeTab === 'programs' && renderPrograms()}
                {!loading && activeTab === 'matches' && renderMatches()}
                {!loading && activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default MentorshipOperatorDashboard;
