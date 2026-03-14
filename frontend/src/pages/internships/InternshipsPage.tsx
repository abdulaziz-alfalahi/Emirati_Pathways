
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Briefcase, Building2, MapPin, Clock, Calendar,
    ChevronRight, ChevronLeft, Bookmark, CheckCircle, Search,
    TrendingUp, Star, Users, Award, Shield,
    GraduationCap, Banknote, Globe, Zap, Filter, Loader2
} from 'lucide-react';
import { getInternships, applyForInternship, type Internship } from '@/services/careerServicesAPI';
import { skillGraphAPI, type UserSkill } from '@/services/intelligenceAPI';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// Brand tokens (unified with Education Pathway)
const brand = {
    primary: '#0D9488',
    primaryDark: '#0F766E',
    primarySurface: '#F0FDFA',
    border: '#E5E7EB',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    amber: '#FEF3C7',
    amberText: '#92400E',
    green: '#DCFCE7',
    greenText: '#166534',
    red: '#FEE2E2',
    redText: '#991B1B',
    blue: '#DBEAFE',
    blueText: '#1E40AF',
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const InternshipsPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const loc = (en: string | undefined, ar: string | undefined) => isRTL ? (ar || en || '') : (en || '');
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    // ── API state ──
    const [internships, setInternships] = useState<Internship[]>([]);
    const [loading, setLoading] = useState(true);
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
    const [applyingId, setApplyingId] = useState<number | null>(null);
    const { user } = useAuth();

    const handleApply = async (internshipId: number) => {
        if (appliedIds.has(internshipId)) {
            toast(t('You have already applied for this internship', 'لقد تقدمت بالفعل لهذا التدريب'), { icon: 'ℹ️' });
            return;
        }
        setApplyingId(internshipId);
        try {
            await applyForInternship(internshipId, user?.id ? Number(user.id) : undefined);
            setAppliedIds(prev => new Set(prev).add(internshipId));
            toast.success(t('Application submitted successfully!', 'تم إرسال الطلب بنجاح!'));
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Failed to apply';
            toast.error(msg);
        } finally {
            setApplyingId(null);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const data = await getInternships();
                if (!cancelled) setInternships(data);
            } catch (err) {
                console.error('Failed to load internships:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        // Fetch user skills for matching (non-blocking)
        (async () => {
            try {
                const skillData = await skillGraphAPI.getUserSkills();
                if (!cancelled) setUserSkills(skillData.skills || []);
            } catch { /* not logged in or no skill profile — graceful fallback */ }
        })();
        return () => { cancelled = true; };
    }, []);

    // ── Skill-match scoring ──
    const getMatchScore = (internship: Internship): number => {
        if (!userSkills.length) return 0;
        const userSkillNames = new Set(userSkills.map(s => s.skill_name.toLowerCase()));
        const requiredSkills = (internship.skills || []).map(s => s.toLowerCase());
        if (!requiredSkills.length) return 0;
        const matched = requiredSkills.filter(s => userSkillNames.has(s)).length;
        return Math.round((matched / requiredSkills.length) * 100);
    };

    const recommendedInternships = internships
        .map(i => ({ ...i, matchScore: getMatchScore(i) }))
        .filter(i => i.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

    // Build sector set from data
    const sectorSet = new Set(internships.map(i => i.sector || ''));
    const sectors = [
        t('All Sectors', 'جميع القطاعات'),
        ...Array.from(sectorSet),
    ];
    const [activeSector, setActiveSector] = useState(0);

    const filtered = activeSector === 0
        ? internships
        : internships.filter(i => i.sector === sectors[activeSector]);

    const sectorColor = (sector: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            'Banking & Finance': { bg: brand.blue, color: brand.blueText },
            'Government': { bg: brand.green, color: brand.greenText },
            'Technology': { bg: brand.purple, color: brand.purpleText },
            'Real Estate': { bg: brand.amber, color: brand.amberText },
            'Energy & Oil': { bg: brand.primarySurface, color: brand.primary },
            'Healthcare': { bg: brand.red, color: brand.redText },
        };
        return map[sector] || { bg: '#F3F4F6', color: brand.textSecondary };
    };

    const partnerCompanies = [
        ...new Map(internships.map(i => [i.company, {
            name: loc(i.company, i.company_ar),
            sector: loc(i.sector, i.sector_ar),
            logo: i.company_logo || '🏢',
        }])).values()
    ];

    const stats = [
        { value: `${internships.length}+`, label: t('Open Internships', 'تدريب متاح'), icon: Briefcase },
        { value: `${partnerCompanies.length}+`, label: t('Partner Companies', 'شركة شريكة'), icon: Building2 },
        { value: '1,200+', label: t('Placements', 'توظيف'), icon: Award },
        { value: '72%', label: t('Full-time Conversion', 'التحويل لدوام كامل'), icon: TrendingUp },
    ];

    // Loading state
    if (loading) {
        return (
            <EducationPathwayLayout
                title={t('Internships', 'التدريب العملي')}
                description={t('Loading internship opportunities...', 'جارٍ تحميل فرص التدريب...')}
                icon={<Briefcase className="h-6 w-6" />}
                stats={[]}
                tabs={[{
                    id: 'loading', label: t('Loading', 'تحميل'), icon: <Loader2 className="h-4 w-4 animate-spin" />, content: (
                        <div style={{ textAlign: 'center', padding: '64px 0' }}>
                            <Loader2 style={{ width: 48, height: 48, color: brand.primary, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                            <p style={{ color: brand.textSecondary, fontSize: 16 }}>{t('Loading internships...', 'جارٍ تحميل التدريب...')}</p>
                        </div>
                    )
                }]}
                defaultTab="loading"
            />
        );
    }

    const tips = [
        { title: t('Start Your Search Early', 'ابدأ البحث مبكراً'), desc: t('Begin looking for internships 3–6 months before your desired start date to maximize your options', 'ابدأ البحث عن التدريب قبل 3–6 أشهر من تاريخ البدء المطلوب لتعظيم خياراتك'), Icon: Calendar },
        { title: t('Tailor Every Application', 'خصّص كل طلب'), desc: t('Customize your cover letter and highlight relevant skills for each specific opportunity', 'خصّص رسالة التقديم وأبرز المهارات ذات الصلة لكل فرصة محددة'), Icon: Star },
        { title: t('Leverage University Services', 'استفد من خدمات الجامعة'), desc: t('Use career services, job fairs, and alumni networks at your university for referrals', 'استخدم خدمات التوظيف ومعارض العمل وشبكات الخريجين في جامعتك للترشيحات'), Icon: GraduationCap },
        { title: t('Build a Strong Online Profile', 'ابنِ ملفاً رقمياً قوياً'), desc: t('Keep your LinkedIn and portfolio up to date — UAE recruiters actively source interns online', 'حافظ على تحديث حسابك في لينكدإن ومعرض أعمالك — مسؤولو التوظيف في الإمارات يبحثون عن المتدربين إلكترونياً'), Icon: Globe },
        { title: t('Network at Industry Events', 'تواصل في الفعاليات المهنية'), desc: t('Attend meetups, conferences, and career expos across Dubai and Abu Dhabi', 'احضر اللقاءات والمؤتمرات ومعارض التوظيف في دبي وأبوظبي'), Icon: Users },
        { title: t('Follow Up Professionally', 'تابع بشكل مهني'), desc: t("Send a polite follow-up email 1–2 weeks after applying if you haven't heard back", 'أرسل بريداً إلكترونياً مهذباً للمتابعة بعد 1–2 أسبوع من التقديم إن لم تتلقَّ رداً'), Icon: CheckCircle },
    ];

    /* ── Tab 1: Opportunities ── */
    const opportunitiesTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    {t('Internship Opportunities', 'فرص التدريب')}
                </h2>
            </div>

            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
                {t(
                    "Explore internships across UAE's top companies — filter by sector, location, and duration to find your ideal placement.",
                    'استكشف فرص التدريب في أبرز شركات الإمارات — فلتر حسب القطاع والموقع والمدة للعثور على التدريب المثالي.'
                )}
            </p>

            {/* Filter bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {sectors.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveSector(i)}
                        style={{
                            background: activeSector === i ? brand.primarySurface : '#F3F4F6',
                            color: activeSector === i ? brand.primary : brand.textSecondary,
                            border: `1px solid ${activeSector === i ? brand.primary : brand.border}`,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <p style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 16 }}>
                {t(`Showing ${filtered.length} internship${filtered.length !== 1 ? 's' : ''}`, `عرض ${filtered.length} فرصة تدريب`)}
            </p>

            {/* Listings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {filtered.map((item) => {
                    const sc = sectorColor(item.sector || '');
                    const skills: string[] = Array.isArray(item.skills) ? item.skills : (typeof item.skills === 'string' ? JSON.parse(item.skills) : []);
                    return (
                        <div
                            key={item.id}
                            style={{
                                background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                                padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                                transition: 'box-shadow .2s', cursor: 'pointer',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                        >
                            {/* Top row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                                        {loc(item.title, item.title_ar)}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: brand.textSecondary }}>
                                        <Building2 size={14} /> {loc(item.company, item.company_ar)}
                                    </div>
                                </div>
                                <Bookmark size={18} style={{ color: brand.textSecondary, cursor: 'pointer' }} />
                            </div>

                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>
                                {loc(item.description, item.description_ar)}
                            </p>

                            {/* Meta */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: brand.textSecondary }}>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.location || '') + ', UAE')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: brand.primary, textDecoration: 'none', fontWeight: 500 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <MapPin size={13} /> {loc(item.location, item.location_ar)}
                                </a>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {loc(item.duration, item.duration_ar)}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Banknote size={13} /> {loc(item.stipend, item.stipend_ar)}</span>
                            </div>

                            {/* Location Map */}
                            <div
                                style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${brand.border}`, height: 120, cursor: 'pointer' }}
                                onClick={e => {
                                    e.stopPropagation();
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.location || '') + ', UAE')}`, '_blank');
                                }}
                            >
                                <iframe
                                    title={`Map - ${item.location}`}
                                    width="100%"
                                    height="120"
                                    style={{ border: 0, pointerEvents: 'none' }}
                                    loading="lazy"
                                    src={`https://www.google.com/maps?q=${encodeURIComponent((item.location || '') + ', UAE')}&output=embed&z=12`}
                                />
                            </div>

                            {/* Tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <span style={{ background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {loc(item.sector, item.sector_ar)}
                                </span>
                                <span style={{ background: brand.green, color: brand.greenText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {item.type === 'paid' ? t('Paid', 'مدفوع') : t('Unpaid', 'غير مدفوع')}
                                </span>
                            </div>

                            {/* Skills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {skills.map((sk: string, j: number) => (
                                    <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>
                                        {sk}
                                    </span>
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ fontSize: 11, color: brand.textSecondary }}>
                                    <Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', ...(isRTL ? { marginLeft: 4 } : { marginRight: 4 }) }} />
                                    {t('Deadline:', 'الموعد النهائي:')} {item.deadline ? new Date(item.deadline).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                </span>
                                <button
                                    data-has-handler="true"
                                    onClick={(e) => { e.stopPropagation(); handleApply(item.id); }}
                                    disabled={applyingId === item.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        fontSize: 13, fontWeight: 600,
                                        color: appliedIds.has(item.id) ? brand.greenText : brand.primary,
                                        background: appliedIds.has(item.id) ? brand.green : brand.primarySurface,
                                        border: `1px solid ${appliedIds.has(item.id) ? brand.greenText : brand.primary}33`,
                                        padding: '6px 16px', borderRadius: 8,
                                        cursor: applyingId === item.id ? 'wait' : 'pointer',
                                        transition: 'all .15s',
                                        opacity: applyingId === item.id ? 0.6 : 1,
                                    }}
                                >
                                    {appliedIds.has(item.id)
                                        ? <><CheckCircle size={14} /> {t('Applied', 'تم التقديم')}</>
                                        : applyingId === item.id
                                            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('Applying...', 'جارٍ التقديم...')}</>
                                            : <>{t('Apply', 'قدّم')} <ChevronIcon size={14} /></>
                                    }
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /* ── Tab 2: Partner Companies ── */
    const companiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Partner Companies', 'الشركات الشريكة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Explore partner organizations across the UAE that actively recruit interns — from government entities to private sector leaders.',
                    'استكشف المؤسسات الشريكة في الإمارات التي تستقطب المتدربين بنشاط — من الجهات الحكومية إلى رواد القطاع الخاص.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {partnerCompanies.map((co, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                {co.logo}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{co.name}</h3>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{co.sector}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${brand.border}` }}>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>
                                <Briefcase size={14} style={{ display: 'inline', verticalAlign: '-2px', ...(isRTL ? { marginLeft: 4 } : { marginRight: 4 }) }} />
                                {internships.filter(int => int.company === co.name || int.company_ar === co.name).length} {t('open positions', 'وظائف متاحة')}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary }}>
                                {t('View', 'عرض')} <ChevronIcon size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Tips & Resources ── */
    const tipsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Internship Tips & Resources', 'نصائح ومصادر التدريب')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Expert advice to help you secure, excel in, and convert your internship into a full-time role.',
                    'نصائح خبراء لمساعدتك في الحصول على التدريب والتفوق فيه وتحويله إلى وظيفة بدوام كامل.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {tips.map((tip, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14 }}>
                        <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <tip.Icon size={20} style={{ color: brand.primary }} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{tip.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{tip.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Conversion Advice */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Converting Your Internship to a Full-time Role', 'تحويل تدريبك إلى وظيفة بدوام كامل')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
                    {[
                        { title: t('Exceed Expectations', 'تجاوز التوقعات'), desc: t('Go beyond assigned tasks — propose improvements and take initiative on projects', 'تجاوز المهام المسندة — اقترح تحسينات وبادر بالعمل على المشاريع') },
                        { title: t('Build Relationships', 'ابنِ علاقات'), desc: t('Network with team members, managers, and other departments during your internship', 'تواصل مع أعضاء الفريق والمديرين والأقسام الأخرى أثناء تدريبك') },
                        { title: t('Ask for Feedback', 'اطلب الملاحظات'), desc: t("Request regular feedback and demonstrate how you've actioned it", 'اطلب ملاحظات منتظمة وبيّن كيف طبّقتها') },
                    ].map((item, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <CheckCircle size={16} style={{ color: brand.primary }} />
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{item.title}</h4>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'opportunities', label: t('Opportunities', 'الفرص'), icon: <Briefcase className="h-4 w-4" />, content: opportunitiesTab },
        { id: 'companies', label: t('Partner Companies', 'الشركات الشريكة'), icon: <Building2 className="h-4 w-4" />, content: companiesTab },
        { id: 'tips', label: t('Tips & Resources', 'نصائح ومصادر'), icon: <Star className="h-4 w-4" />, content: tipsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Internships', 'التدريب العملي')}
            description={t(
                'Gain valuable work experience through paid internships with leading companies across the UAE — your bridge from learning to earning',
                'اكتسب خبرة عملية قيّمة من خلال تدريب مدفوع مع شركات رائدة في الإمارات — جسرك من التعلّم إلى الكسب'
            )}
            icon={<Briefcase className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="opportunities"
        />
    );
};

export default InternshipsPage;
