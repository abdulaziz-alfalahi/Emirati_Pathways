import React, { useState } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    UserCheck, Users, Briefcase, Calendar, Settings, Heart,
    CheckCircle, Clock, TrendingUp, Plus, Search,
    ArrowUp, ArrowDown, Eye, Star, MessageSquare, Target
} from 'lucide-react';

const brand = {
    primary: '#4F46E5',
    secondary: '#6366F1',
    accent: '#A5B4FC',
    bg: '#EEF2FF',
    cardBg: '#FFFFFF',
    textPrimary: '#312E81',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    indigoBg: '#E0E7FF', indigoText: '#4F46E5',
};

const MentorshipOperatorDashboard: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'mentors', label: t('Mentors', 'المرشدون'), icon: UserCheck },
        { id: 'programs', label: t('Programs', 'البرامج'), icon: Briefcase },
        { id: 'matches', label: t('Matches', 'المطابقات'), icon: Heart },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const stats = [
        { label: t('Active Mentors', 'المرشدون النشطون'), value: '186', change: '+14', up: true, icon: UserCheck },
        { label: t('Active Programs', 'البرامج النشطة'), value: '32', change: '+4', up: true, icon: Briefcase },
        { label: t('Mentee-Mentor Pairs', 'أزواج المتدربين والمرشدين'), value: '425', change: '+38', up: true, icon: Heart },
        { label: t('Pending Matches', 'مطابقات معلقة'), value: '23', change: '-7', up: false, icon: Clock },
    ];

    const mentors = [
        { name: t('Dr. Sultan Al Jaber', 'د. سلطان الجابر'), expertise: t('Energy & Sustainability', 'الطاقة والاستدامة'), company: t('ADNOC', 'أدنوك'), mentees: 8, rating: 4.9, status: 'active', sessions: 124 },
        { name: t('Eng. Hessa Al Malek', 'م. حصة المالك'), expertise: t('Maritime Engineering', 'الهندسة البحرية'), company: t('Abu Dhabi Ports', 'موانئ أبوظبي'), mentees: 5, rating: 4.8, status: 'active', sessions: 86 },
        { name: t('Noura Al Kaabi', 'نورة الكعبي'), expertise: t('Media & Culture', 'الإعلام والثقافة'), company: t('Government', 'الحكومة'), mentees: 6, rating: 4.7, status: 'active', sessions: 95 },
        { name: t('Ahmad Al Falasi', 'أحمد الفلاسي'), expertise: t('Technology & AI', 'التكنولوجيا والذكاء الاصطناعي'), company: t('G42', 'G42'), mentees: 4, rating: 4.6, status: 'active', sessions: 52 },
        { name: t('Fatima Al Shamsi', 'فاطمة الشامسي'), expertise: t('Finance & Banking', 'المالية والمصرفية'), company: t('First Abu Dhabi Bank', 'بنك أبوظبي الأول'), mentees: 0, rating: 0, status: 'pending', sessions: 0 },
    ];

    const programs = [
        { name: t('Future Leaders Program', 'برنامج قادة المستقبل'), type: t('Leadership', 'القيادة'), duration: t('6 months', '6 أشهر'), mentors: 24, mentees: 96, status: 'active', completion: 72 },
        { name: t('Tech Innovation Track', 'مسار الابتكار التقني'), type: t('Technical', 'تقني'), duration: t('3 months', '3 أشهر'), mentors: 18, mentees: 54, status: 'active', completion: 45 },
        { name: t('Women in Business', 'المرأة في الأعمال'), type: t('Entrepreneurship', 'ريادة الأعمال'), duration: t('4 months', '4 أشهر'), mentors: 12, mentees: 48, status: 'active', completion: 88 },
        { name: t('Graduate Career Launchpad', 'منصة انطلاق الخريجين'), type: t('Career', 'مهني'), duration: t('3 months', '3 أشهر'), mentors: 30, mentees: 120, status: 'active', completion: 60 },
        { name: t('Retiree Knowledge Transfer', 'نقل خبرات المتقاعدين'), type: t('Knowledge Sharing', 'مشاركة المعرفة'), duration: t('Ongoing', 'مستمر'), mentors: 15, mentees: 30, status: 'draft', completion: 0 },
    ];

    const recentMatches = [
        { mentee: t('Khalid Al Nuaimi', 'خالد النعيمي'), mentor: t('Dr. Sultan Al Jaber', 'د. سلطان الجابر'), program: t('Future Leaders', 'قادة المستقبل'), date: '2026-02-20', compatibility: 95 },
        { mentee: t('Mariam Al Dhaheri', 'مريم الظاهري'), mentor: t('Noura Al Kaabi', 'نورة الكعبي'), program: t('Women in Business', 'المرأة في الأعمال'), date: '2026-02-19', compatibility: 92 },
        { mentee: t('Omar Al Suwaidi', 'عمر السويدي'), mentor: t('Ahmad Al Falasi', 'أحمد الفلاسي'), program: t('Tech Innovation', 'الابتكار التقني'), date: '2026-02-18', compatibility: 88 },
        { mentee: t('Sara Al Ketbi', 'سارة الكتبي'), mentor: t('Eng. Hessa Al Malek', 'م. حصة المالك'), program: t('Graduate Launchpad', 'منصة الخريجين'), date: '2026-02-17', compatibility: 85 },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {stats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.indigoBg, borderRadius: 10, padding: 10 }}>
                            <s.icon size={20} color={brand.indigoText} />
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
                        <Heart size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Recent Matches', 'المطابقات الأخيرة')}
                    </h3>
                    {recentMatches.slice(0, 3).map((m, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{m.mentee} ↔ {m.mentor}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.program} • {m.date}</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: m.compatibility >= 90 ? brand.greenText : brand.yellowText, background: m.compatibility >= 90 ? brand.greenBg : brand.yellowBg, padding: '3px 10px', borderRadius: 20 }}>
                                {m.compatibility}% {t('match', 'توافق')}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <Target size={16} color={brand.primary} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Program Completion Rates', 'معدلات إكمال البرامج')}
                    </h3>
                    {programs.filter(p => p.status === 'active').slice(0, 4).map((p, i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: brand.textPrimary }}>{p.name}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: p.completion >= 75 ? brand.greenText : p.completion >= 50 ? brand.yellowText : brand.indigoText }}>{p.completion}%</span>
                            </div>
                            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                                <div style={{ height: '100%', width: `${p.completion}%`, background: p.completion >= 75 ? brand.greenText : p.completion >= 50 ? brand.yellowText : brand.primary, borderRadius: 4, transition: 'width 0.5s ease' }} />
                            </div>
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
                    <input placeholder={t('Search mentors...', 'بحث عن مرشدين...')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Onboard Mentor', 'إضافة مرشد')}
                </button>
            </div>

            {mentors.map((m, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.indigoBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCheck size={20} color={brand.indigoText} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                {m.expertise} • {m.company} • {m.mentees} {t('mentees', 'متدربين')} • {m.sessions} {t('sessions', 'جلسات')}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {m.rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: brand.yellowText }}>
                                <Star size={14} fill={brand.yellowText} /> {m.rating}
                            </div>
                        )}
                        <span style={{
                            fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                            background: m.status === 'active' ? brand.greenBg : brand.yellowBg,
                            color: m.status === 'active' ? brand.greenText : brand.yellowText
                        }}>
                            {m.status === 'active' ? t('Active', 'نشط') : t('Pending', 'قيد الانتظار')}
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
                    {[t('All', 'الكل'), t('Active', 'نشط'), t('Draft', 'مسودة'), t('Completed', 'مكتمل')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Create Program', 'إنشاء برنامج')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {programs.map((p, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{p.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>{p.type} • {p.duration}</div>
                            </div>
                            <span style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                                background: p.status === 'active' ? brand.greenBg : '#F1F5F9',
                                color: p.status === 'active' ? brand.greenText : brand.textSecondary
                            }}>{p.status === 'active' ? t('Active', 'نشط') : t('Draft', 'مسودة')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: brand.textSecondary, marginBottom: 12 }}>
                            <span><UserCheck size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{p.mentors} {t('mentors', 'مرشد')}</span>
                            <span><Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{p.mentees} {t('mentees', 'متدرب')}</span>
                        </div>
                        {p.completion > 0 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: brand.textSecondary }}>{t('Completion', 'الإكمال')}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: brand.primary }}>{p.completion}%</span>
                                </div>
                                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                                    <div style={{ height: '100%', width: `${p.completion}%`, background: brand.primary, borderRadius: 3, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMatches = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Heart size={14} /> {t('Auto-Match', 'مطابقة تلقائية')}
                </button>
            </div>
            {recentMatches.map((m, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.indigoBg, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart size={18} color={brand.indigoText} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>
                                {m.mentee} <span style={{ color: brand.textSecondary, fontWeight: 400 }}>↔</span> {m.mentor}
                            </div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.program} • {t('Matched', 'تم المطابقة')} {m.date}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                            background: m.compatibility >= 90 ? brand.greenBg : brand.yellowBg,
                            color: m.compatibility >= 90 ? brand.greenText : brand.yellowText
                        }}>
                            {m.compatibility}%
                        </span>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.primary, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            <MessageSquare size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('Details', 'تفاصيل')}
                        </button>
                    </div>
                </div>
            ))}
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
            <HybridGovernmentNavFixed />
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
                            color: activeTab === tab.id ? 'white' : brand.textSecondary,
                            transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'mentors' && renderMentors()}
                {activeTab === 'programs' && renderPrograms()}
                {activeTab === 'matches' && renderMatches()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default MentorshipOperatorDashboard;
