
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
    Search, Briefcase, MapPin, Banknote, Clock, ChevronRight, ChevronLeft, Star,
    TrendingUp, Filter, Zap, Eye, Users, Award, CheckCircle, Send, Heart,
    Code, Palette, BarChart3, Globe, BookOpen, MessageSquare, ThumbsUp,
    Calendar, DollarSign, Shield, Target, Sparkles, PenTool, Loader2
} from 'lucide-react';
import { getGigs, applyForGig, type Gig } from '@/services/careerServicesAPI';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import { skillGraphAPI, type UserSkill } from '@/services/intelligenceAPI';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const brand = {
    primary: '#0D9488', primaryDark: '#0F766E', primarySurface: '#F0FDFA',
    border: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280',
    amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
    red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
    purple: '#F3E8FF', purpleText: '#6B21A8', pink: '#FCE7F3', pinkText: '#9D174D',
};

const GigMarketplacePage: React.FC = () => {
    const { i18n } = useTranslation();
    const { toggleLanguage } = useLanguage();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const loc = (en: string | undefined, ar: string | undefined) => isRTL ? (ar || en || '') : (en || '');
    const Chevron = isRTL ? ChevronLeft : ChevronRight;

    // ── API state ──
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [appliedGigs, setAppliedGigs] = useState<Set<number>>(new Set());
    const [applyingGigId, setApplyingGigId] = useState<number | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const data = await getGigs();
                if (!cancelled) setGigs(data);
            } catch (err) {
                console.error('Failed to load gigs:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        // Fetch user skills for match scoring (non-blocking)
        (async () => {
            try {
                const skillData = await skillGraphAPI.getUserSkills();
                if (!cancelled) setUserSkills(skillData.skills || []);
            } catch { /* not logged in or no skill profile — fallback */ }
        })();
        return () => { cancelled = true; };
    }, []);

    const [activeTab, setActiveTab] = useState(0);
    const [activeCat, setActiveCat] = useState(0);
    const [reviewGig, setReviewGig] = useState<number | null>(null);

    const catColorMap: Record<string, { bg: string; color: string }> = {
        'Technology': { bg: brand.blue, color: brand.blueText },
        'Marketing': { bg: brand.green, color: brand.greenText },
        'Design': { bg: brand.purple, color: brand.purpleText },
        'Translation': { bg: brand.pink, color: brand.pinkText },
        'Education': { bg: brand.primarySurface, color: brand.primary },
        'Consulting': { bg: brand.amber, color: brand.amberText },
    };

    // Build categories from API data
    const catSet = new Set(gigs.map(g => g.category || ''));
    const categories = [
        { label: t('All Categories', 'جميع الفئات'), icon: Filter },
        ...Array.from(catSet).map(c => ({
            label: loc(c, gigs.find(g => g.category === c)?.category_ar),
            icon: c === 'Technology' ? Code : c === 'Marketing' ? TrendingUp : c === 'Design' ? Palette
                : c === 'Consulting' ? BarChart3 : c === 'Translation' ? Globe : BookOpen,
        })),
    ];

    const filteredGigs = activeCat === 0 ? gigs : gigs.filter(g => g.category === Array.from(catSet)[activeCat - 1]);

    // Skill-based match scores (real intelligence integration)
    const computeMatchScore = (gig: Gig): number => {
        if (!userSkills.length) return 0;
        const userSkillNames = new Set(userSkills.map(s => s.skill_name.toLowerCase()));
        const gigSkills = (gig.skills || []).map(s => s.toLowerCase());
        if (!gigSkills.length) return 0;
        const matched = gigSkills.filter(s => userSkillNames.has(s)).length;
        return Math.round((matched / gigSkills.length) * 100);
    };
    const matchScores: Record<number, number> = {};
    gigs.forEach(g => { matchScores[g.id] = computeMatchScore(g); });

    const handleApplyGig = async (gigId: number) => {
        if (appliedGigs.has(gigId)) {
            toast(t('You already applied for this gig', 'لقد تقدمت لهذه الفرصة بالفعل'), { icon: 'ℹ️' });
            return;
        }
        setApplyingGigId(gigId);
        try {
            await applyForGig(gigId, user?.id ? Number(user.id) : undefined);
            setAppliedGigs(prev => new Set(prev).add(gigId));
            toast.success(t('Application submitted!', 'تم تقديم الطلب!'));
        } catch (err: any) {
            const msg = err?.response?.data?.error || '';
            if (msg.includes('already')) {
                setAppliedGigs(prev => new Set(prev).add(gigId));
                toast(t('You already applied for this gig', 'لقد تقدمت لهذه الفرصة بالفعل'), { icon: 'ℹ️' });
            } else {
                toast.error(t('Failed to apply', 'فشل تقديم الطلب'));
            }
        }
        setApplyingGigId(null);
    };

    const stats = [
        { value: `${gigs.length}+`, label: t('Active Gigs', 'فرصة عمل حرّة'), icon: Briefcase },
        { value: '3,400+', label: t('Freelancers', 'مستقلين'), icon: Users },
        { value: t('AED 8,500', '8,500 د.إ'), label: t('Avg. Earnings', 'متوسط الأرباح'), icon: DollarSign },
        { value: '500+', label: t('Companies', 'شركة'), icon: Award },
    ];

    const tabs = [
        t('Browse Gigs', 'تصفّح الفرص'),
        t('My Applications', 'طلباتي'),
        t('Post a Gig', 'أنشر فرصة'),
        t('My Profile', 'ملفي الشخصي'),
    ];

    const whyGig = [
        { icon: Clock, title: t('Flexible Schedule', 'جدول مرن'), desc: t('Work on your own terms and schedule', 'اعمل وفق شروطك وجدولك الخاص') },
        { icon: TrendingUp, title: t('Grow Your Portfolio', 'طوّر أعمالك'), desc: t('Build a diverse portfolio with top UAE companies', 'ابنِ محفظة متنوعة مع كبار شركات الإمارات') },
        { icon: Banknote, title: t('Competitive Pay', 'أجر تنافسي'), desc: t('Earn market-rate compensation for your skills', 'احصل على تعويض بأسعار السوق لمهاراتك') },
        { icon: Shield, title: t('Secure Payments', 'مدفوعات آمنة'), desc: t('Escrow-protected payments released on completion', 'مدفوعات محمية بالضمان تُصرف عند الإنجاز') },
    ];

    /* ── Shared styles ── */
    const card: React.CSSProperties = { background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 16 };
    const badge = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' as const });
    const tabStyle = (active: boolean): React.CSSProperties => ({ padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? brand.primary : brand.textSecondary, borderBottom: active ? `2px solid ${brand.primary}` : '2px solid transparent', cursor: 'pointer', background: 'none', border: 'none', borderBottomStyle: 'solid' });

    const renderStars = (r: number) => (
        <span style={{ display: 'inline-flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= r ? '#F59E0B' : 'none'} stroke={i <= r ? '#F59E0B' : '#D1D5DB'} />)}
        </span>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-background" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={i18n.language as 'en' | 'ar'} />
                <div style={{ textAlign: 'center', padding: '128px 0' }}>
                    <Loader2 style={{ width: 48, height: 48, color: brand.primary, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: brand.textSecondary, fontSize: 16 }}>{t('Loading gig marketplace...', 'جارٍ تحميل سوق العمل الحر...')}</p>
                </div>
            </div>
        );
    }

    /* ── TAB 1: Browse Gigs ── */
    const browseTab = (
        <div>
            <AiAssistPanel
                feature="gig_tips"
                title="AI freelance tips"
                titleAr="نصائح العمل الحر بالذكاء الاصطناعي"
                getContext={() => ({
                    skills: userSkills.map(s => s.skill_name).filter(Boolean).slice(0, 30),
                    categories: Array.from(catSet).filter(Boolean).slice(0, 30),
                })}
                className="mb-6"
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {categories.map((c, i) => (
                    <button key={i} onClick={() => setActiveCat(i)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: activeCat === i ? 600 : 400, background: activeCat === i ? brand.primarySurface : '#F9FAFB', color: activeCat === i ? brand.primary : brand.textSecondary, border: activeCat === i ? `1px solid ${brand.primary}` : `1px solid ${brand.border}`, cursor: 'pointer' }}>
                        <c.icon size={14} /> {c.label}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>{t('Available Gigs', 'الفرص المتاحة')}</h2>
                <span style={{ fontSize: 13, color: brand.textSecondary }}>{filteredGigs.length} {t('gigs', 'فرصة')}</span>
            </div>
            {filteredGigs.map((g) => {
                const skills: string[] = Array.isArray(g.skills) ? g.skills : (typeof g.skills === 'string' ? JSON.parse(g.skills) : []);
                const cc = catColorMap[g.category || ''] || { bg: '#F3F4F6', color: brand.textSecondary };
                const match = matchScores[g.id] || 85;
                return (
                    <div key={g.id} style={{ ...card, ...(g.is_featured ? { borderColor: brand.primary, borderWidth: 1.5 } : {}) }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary }}>{loc(g.title, g.title_ar)}</span>
                                    {g.is_featured && <span style={badge(brand.amber, brand.amberText)}>⚡ {t('Featured', 'مميّز')}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: brand.textSecondary, flexWrap: 'wrap', marginBottom: 8 }}>
                                    <span style={{ fontWeight: 500, color: brand.textPrimary }}>{loc(g.company, g.company_ar)}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{renderStars(Math.round(g.company_rating || 0))} {g.company_rating} ({g.company_reviews})</span>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((g.location || '') + ', UAE')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: brand.primary, textDecoration: 'none', fontWeight: 500 }}
                                    >
                                        <MapPin size={13} /> {loc(g.location, g.location_ar)}
                                    </a>
                                </div>
                                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{loc(g.description, g.description_ar)}</p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {skills.map((s: string, j: number) => <span key={j} style={badge(cc.bg, cc.color)}>{s}</span>)}
                                </div>
                                {/* Location Map */}
                                <div
                                    style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${brand.border}`, height: 100, cursor: 'pointer' }}
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((g.location || '') + ', UAE')}`, '_blank')}
                                >
                                    <iframe
                                        title={`Map - ${g.location}`}
                                        width="100%"
                                        height="100"
                                        style={{ border: 0, pointerEvents: 'none' }}
                                        loading="lazy"
                                        src={`https://www.google.com/maps?q=${encodeURIComponent((g.location || '') + ', UAE')}&output=embed&z=12`}
                                    />
                                </div>
                            </div>
                            <div style={{ textAlign: isRTL ? 'left' : 'right', minWidth: 130 }}>
                                <div style={{ fontSize: 22, fontWeight: 700, color: brand.primary, marginBottom: 4 }}>{match}%</div>
                                <div style={{ fontSize: 11, color: brand.textSecondary, marginBottom: 12 }}>{t('Match Score', 'درجة التوافق')}</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 2 }}>{loc(g.budget, g.budget_ar)}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 2 }}>{loc(g.duration, g.duration_ar)}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button
                                onClick={() => handleApplyGig(g.id)}
                                disabled={applyingGigId === g.id || appliedGigs.has(g.id)}
                                style={{
                                    flex: 1, padding: '10px 0',
                                    background: appliedGigs.has(g.id) ? '#6B7280' : brand.primary,
                                    color: '#fff', border: 'none', borderRadius: 10,
                                    fontWeight: 600, fontSize: 14,
                                    cursor: appliedGigs.has(g.id) ? 'default' : 'pointer',
                                    opacity: applyingGigId === g.id ? 0.7 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                }}
                            >
                                {applyingGigId === g.id
                                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('Applying...', 'جارٍ التقديم...')}</>
                                    : appliedGigs.has(g.id)
                                        ? <><CheckCircle size={16} /> {t('Applied', 'تم التقديم')}</>
                                        : t('Apply Now', 'قدّم الآن')}
                            </button>
                            <button style={{ padding: '10px 16px', background: '#F9FAFB', color: brand.textSecondary, border: `1px solid ${brand.border}`, borderRadius: 10, cursor: 'pointer' }}><Heart size={16} /></button>
                            <button style={{ padding: '10px 16px', background: '#F9FAFB', color: brand.textSecondary, border: `1px solid ${brand.border}`, borderRadius: 10, cursor: 'pointer' }}><Eye size={16} /></button>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    /* ── TAB 3: Post a Gig ── */
    const postTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Post a Gig Opportunity', 'أنشر فرصة عمل حرّة')}</h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24 }}>{t('Connect with top UAE talent for your project needs.', 'تواصل مع أفضل المواهب الإماراتية لاحتياجات مشروعك.')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {[
                    { icon: PenTool, title: t('Describe Your Project', 'صف مشروعك'), desc: t('Detail scope, deliverables, timeline, and budget for your gig.', 'حدد نطاق العمل والمخرجات والجدول الزمني والميزانية.') },
                    { icon: Target, title: t('Set Requirements', 'حدّد المتطلبات'), desc: t('Specify skills, experience level, and location preferences.', 'حدد المهارات ومستوى الخبرة وتفضيلات الموقع.') },
                    { icon: Sparkles, title: t('AI Matching', 'المطابقة الذكية'), desc: t('Our AI instantly matches your gig with qualified freelancers.', 'ذكاؤنا الاصطناعي يطابق فرصتك مع مستقلين مؤهلين فوراً.') },
                    { icon: Shield, title: t('Secure & Compliant', 'آمن ومتوافق'), desc: t('Escrow payments and UAE labor law compliance built in.', 'مدفوعات مضمونة وامتثال مدمج لقوانين العمل الإماراتية.') },
                ].map((s, i) => (
                    <div key={i} style={card}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <s.icon size={24} color={brand.primary} />
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{s.title}</h3>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6 }}>{s.desc}</p>
                    </div>
                ))}
            </div>
            <button style={{ marginTop: 20, padding: '14px 32px', background: brand.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={16} /> {t('Post Your Gig', 'أنشر فرصتك')}
            </button>
        </div>
    );

    /* ── TAB 2: My Applications (placeholder) ── */
    const appsTab = (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Briefcase style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('My Gig Applications', 'طلبات العمل الحرّ')}</h3>
            <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Your gig applications will appear here once you apply.', 'ستظهر طلبات العمل الحر هنا بمجرد أن تتقدم.')}</p>
        </div>
    );

    /* ── TAB 4: My Profile (placeholder) ── */
    const profileTab = (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Users style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Freelancer Profile', 'ملف المستقل')}</h3>
            <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Complete your profile to start receiving gig matches.', 'أكمل ملفك الشخصي لبدء تلقي فرص العمل الحر.')}</p>
        </div>
    );

    const tabContent = [browseTab, appsTab, postTab, profileTab];

    /* ── MAIN RENDER ── */
    return (
        <div className="min-h-screen flex flex-col bg-background" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={i18n.language as 'en' | 'ar'} />
            <main className="flex-1" style={{ background: '#FAFBFC' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }} dir={isRTL ? 'rtl' : 'ltr'}>
                    {/* Hero */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.primarySurface, padding: '8px 20px', borderRadius: 20, marginBottom: 16 }}>
                            <Zap size={16} color={brand.primary} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.primary }}>{t('Gig Marketplace', 'سوق العمل الحر')}</span>
                        </div>
                        <h1 style={{ fontSize: 36, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>
                            {t('Find Freelance Opportunities', 'اعثر على فرص العمل الحرّ')}
                        </h1>
                        <p style={{ fontSize: 16, color: brand.textSecondary, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
                            {t('Connect with top UAE companies for project-based work. Build your portfolio, grow your reputation, and earn on your own terms.',
                                'تواصل مع كبار شركات الإمارات للعمل على المشاريع. ابنِ محفظة أعمالك، وعزّز سمعتك، واكسب وفق شروطك.')}
                        </p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                        {stats.map((s, i) => (
                            <div key={i} style={{ ...card, textAlign: 'center', marginBottom: 0 }}>
                                <s.icon size={24} color={brand.primary} style={{ marginBottom: 8 }} />
                                <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                                <div style={{ fontSize: 13, color: brand.textSecondary }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: `1px solid ${brand.border}`, marginBottom: 24 }}>
                        {tabs.map((label, i) => (
                            <button key={i} onClick={() => setActiveTab(i)} style={tabStyle(activeTab === i)}>{label}</button>
                        ))}
                    </div>

                    {/* Content area */}
                    <div style={{ display: 'grid', gridTemplateColumns: activeTab === 0 ? '1fr 320px' : '1fr', gap: 24 }}>
                        {tabContent[activeTab]}

                        {/* Sidebar — only on Browse tab */}
                        {activeTab === 0 && (
                            <div>
                                <div style={{ ...card, background: `linear-gradient(135deg, ${brand.primarySurface}, #fff)` }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Zap size={18} color={brand.primary} /> {t('Why Go Gig?', 'لماذا العمل الحرّ؟')}
                                    </h3>
                                    {whyGig.map((w, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <w.icon size={16} color={brand.primary} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{w.title}</div>
                                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{w.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={card}>
                                    <h3 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Target size={16} color={brand.primary} /> {t('Quick Tips', 'نصائح سريعة')}
                                    </h3>
                                    {[
                                        t('Complete your profile to increase visibility', 'أكمل ملفك الشخصي لزيادة ظهورك'),
                                        t('Respond within 24h to boost your ranking', 'استجب خلال 24 ساعة لتعزيز ترتيبك'),
                                        t('Ask clients for reviews after each project', 'اطلب تقييمات من العملاء بعد كل مشروع'),
                                    ].map((tip, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 13, color: brand.textSecondary }}>
                                            <CheckCircle size={14} color={brand.primary} /> {tip}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GigMarketplacePage;
