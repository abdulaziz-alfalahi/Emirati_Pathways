
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Star, Users, Briefcase, TrendingUp, Award, Building,
    ArrowRight, ArrowLeft, CheckCircle, Globe, Rocket, Heart,
    Quote, MapPin, ExternalLink, Calendar
} from 'lucide-react';
import { restClient } from '@/utils/api';

// Brand tokens
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
    blue: '#DBEAFE',
    blueText: '#1E40AF',
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const ShareSuccessStoriesPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── API DATA ──────────────────────── */

    const [successStories, setSuccessStories] = useState<any[]>([]);
    const [sectorBreakdown, setSectorBreakdown] = useState<any[]>([]);

    useEffect(() => {
        restClient.get('/api/lifelong/success-stories').then(r => {
            setSuccessStories((r.data as any[]).map((s: any) => ({
                name: t(s.name_en, s.name_ar), role: t(s.role_en, s.role_ar),
                prevRole: t(s.prev_role_en, s.prev_role_ar), company: t(s.company_en, s.company_ar),
                sector: t(s.sector_en, s.sector_ar), location: t(s.location_en, s.location_ar),
                avatar: s.avatar, theme: { bg: s.theme_bg, accent: s.theme_accent, light: s.theme_light },
                story: t(s.story_en, s.story_ar), quote: t(s.quote_en, s.quote_ar),
                highlights: (s.highlights || []).map((h: any) => t(h.highlight_en, h.highlight_ar)),
            })));
        }).catch(() => { });

        restClient.get('/api/lifelong/success-stories/stats').then(r => {
            const d = r.data as any;
            if (d.sectors) setSectorBreakdown(d.sectors.map((s: any) => ({
                sector: t(s.sector_en, s.sector_ar), count: s.count, icon: s.icon,
                color: s.color, colorText: s.color_text,
            })));
        }).catch(() => { });

    }, [isRTL]);

    const stats = [
        { value: '8', label: t('Success Stories', 'قصة نجاح'), icon: Star },
        { value: '6', label: t('Industry Sectors', 'قطاع صناعي'), icon: Briefcase },
        { value: '$100B+', label: t('Value Created', 'قيمة مُنشأة'), icon: TrendingUp },
        { value: '50K+', label: t('Jobs Generated', 'وظيفة مُولّدة'), icon: Users },
    ];

    /* ── Tab 1: Featured Stories ── */
    const storiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Emirati Success in the Private Sector', 'النجاح الإماراتي في القطاع الخاص')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Real stories of Emiratis who built world-class businesses, led breakthrough innovations, and transformed industries — proving that UAE nationals compete at the highest global level.',
                    'قصص حقيقية لإماراتيين بنوا أعمالاً عالمية المستوى وقادوا ابتكارات رائدة وحوّلوا صناعات — مثبتين أن المواطنين الإماراتيين ينافسون على أعلى المستويات العالمية.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {successStories.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            overflow: 'hidden', transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        {/* Header */}
                        <div style={{ background: s.theme.bg, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 36 }}>{s.avatar}</span>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h3>
                                <div style={{ fontSize: 13, color: s.theme.accent, fontWeight: 600 }}>{s.role}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Building size={11} /> {s.company}</span>
                                    <span style={{ margin: '0 8px' }}>·</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {s.location}</span>
                                </div>
                            </div>
                            <span style={{ background: s.theme.light, color: s.theme.accent, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99 }}>
                                {s.sector}
                            </span>
                        </div>
                        {/* Body */}
                        <div style={{ padding: 20 }}>
                            <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.7, margin: '0 0 14px' }}>{s.story}</p>
                            {/* Highlights */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                {s.highlights.map((h, j) => (
                                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle size={14} style={{ color: s.theme.accent, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: brand.textPrimary, fontWeight: 500 }}>{h}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Quote */}
                            <blockquote style={{
                                borderLeft: isRTL ? 'none' : `3px solid ${s.theme.accent}`,
                                borderRight: isRTL ? `3px solid ${s.theme.accent}` : 'none',
                                paddingLeft: isRTL ? 0 : 14,
                                paddingRight: isRTL ? 14 : 0,
                                margin: 0,
                                fontSize: 13, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.6,
                            }}>
                                {s.quote}
                            </blockquote>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: By Sector ── */
    const sectorTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Emiratis by Sector', 'الإماراتيون حسب القطاع')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Emirati professionals and entrepreneurs are making their mark across every major industry — from space exploration and fintech to hospitality and creative media.',
                    'المهنيون ورواد الأعمال الإماراتيون يتركون بصمتهم في كل صناعة كبرى — من استكشاف الفضاء والتكنولوجيا المالية إلى الضيافة والإعلام الإبداعي.'
                )}
            </p>

            {/* Sector cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {sectorBreakdown.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{s.icon}</span>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.colorText }}>{s.count}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginTop: 2 }}>{s.sector}</div>
                    </div>
                ))}
            </div>

            {/* Stories grouped by theme */}
            {[
                { title: t('Builders & Developers', 'البنّاؤون والمطوّرون'), desc: t('Emiratis who built physical and digital infrastructure', 'إماراتيون بنوا البنية التحتية المادية والرقمية'), stories: [successStories[1], successStories[3], successStories[5]].filter(Boolean) },
                { title: t('Innovators & Disruptors', 'المبتكرون والرواد'), desc: t('Emiratis who pioneered new industries and technologies', 'إماراتيون رائدون في صناعات وتقنيات جديدة'), stories: [successStories[0], successStories[2], successStories[7]].filter(Boolean) },
                { title: t('Culture & Capital', 'الثقافة ورأس المال'), desc: t("Emiratis who shaped the nation's creative and investment landscape", 'إماراتيون شكّلوا المشهد الإبداعي والاستثماري للأمة'), stories: [successStories[6], successStories[4]].filter(Boolean) },
            ].map((group, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{group.title}</h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: '0 0 12px' }}>{group.desc}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {group.stories.map((s, j) => (
                            <div key={j} style={{ background: s.theme?.bg || '#F9FAFB', borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 28, flexShrink: 0 }}>{s.avatar}</span>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h4>
                                    <div style={{ fontSize: 11, color: s.theme?.accent || brand.primary, fontWeight: 600 }}>{s.company}</div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
                                        {s.highlights?.[0]}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── Tab 3: Quotes & Wisdom ── */
    const quotesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('In Their Own Words', 'بكلماتهم')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Wisdom and insights from Emirati leaders in the private sector — advice on entrepreneurship, leadership, and building world-class businesses from the UAE.',
                    'حكمة ورؤى من القادة الإماراتيين في القطاع الخاص — نصائح حول ريادة الأعمال والقيادة وبناء أعمال عالمية المستوى من الإمارات.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {successStories.map((s, i) => (
                    <div key={i} style={{
                        background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                        padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                        <blockquote style={{
                            fontSize: 15, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.7, margin: 0,
                            borderLeft: isRTL ? 'none' : `4px solid ${s.theme.accent}`,
                            borderRight: isRTL ? `4px solid ${s.theme.accent}` : 'none',
                            paddingLeft: isRTL ? 0 : 16,
                            paddingRight: isRTL ? 16 : 0,
                            flex: 1,
                        }}>
                            {s.quote}
                        </blockquote>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24 }}>{s.avatar}</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: s.theme.accent }}>{s.company}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 28, marginTop: 24, textAlign: 'center' }}>
                <Quote size={28} style={{ color: brand.primary, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 8px' }}>
                    {t('Share Your Own Success Story', 'شارك قصة نجاحك')}
                </h3>
                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, margin: '0 auto 16px', maxWidth: 500 }}>
                    {t(
                        'Are you an Emirati making an impact in the private sector? Your story could inspire the next generation.',
                        'هل أنت إماراتي تصنع أثراً في القطاع الخاص؟ قصتك يمكن أن تُلهم الجيل القادم.'
                    )}
                </p>
                <button style={{
                    background: brand.primary, color: '#fff', border: 'none', padding: '12px 28px',
                    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                    {t('Submit Your Story', 'أرسل قصتك')} <ArrowIcon size={16} />
                </button>
            </div>
        </div>
    );

    /* ── Tab 4: Impact ── */
    const impactTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Emiratisation Impact', 'أثر التوطين')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'The cumulative impact of Emirati leadership in the private sector — jobs created, value generated, and sectors transformed.',
                    'الأثر التراكمي للقيادة الإماراتية في القطاع الخاص — الوظائف المُنشأة والقيمة المولّدة والقطاعات المحوّلة.'
                )}
            </p>

            {/* Impact metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { value: '$100B+', label: t('Combined Business Value', 'القيمة التجارية المجمّعة'), icon: '💰', color: brand.amber, colorText: brand.amberText },
                    { value: '50,000+', label: t('Jobs Created', 'وظيفة مُنشأة'), icon: '👥', color: brand.green, colorText: brand.greenText },
                    { value: '8', label: t('Industries Transformed', 'صناعة محوّلة'), icon: '🏢', color: brand.blue, colorText: brand.blueText },
                    { value: '170+', label: t('Countries Reached', 'دولة وصلنا إليها'), icon: '🌍', color: brand.purple, colorText: brand.purpleText },
                ].map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>{m.icon}</span>
                        <div style={{ fontSize: 24, fontWeight: 700, color: m.colorText }}>{m.value}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Key takeaways */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={18} style={{ color: brand.primary }} /> {t('Key Takeaways for Emirati Professionals', 'الدروس الرئيسية للمهنيين الإماراتيين')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {[
                        { title: t('Start Where You Are', 'ابدأ من حيث أنت'), desc: t('Khalaf Al Habtoor started as a contractor — Mohamed Alabbar started in government. Every world-class career begins with a first step.', 'بدأ خلف الحبتور كمقاول — ومحمد العبار بدأ في الحكومة. كل مسيرة عالمية المستوى تبدأ بخطوة أولى.') },
                        { title: t('Think Globally, Act Locally', 'فكّر عالمياً، اعمل محلياً'), desc: t("From DMCC's 170-nation reach to Emaar's global brand, Emirati companies prove that UAE-born businesses can compete worldwide.", 'من وصول مركز دبي للسلع إلى 170 دولة إلى علامة إعمار العالمية، الشركات الإماراتية تثبت أنها تنافس عالمياً.') },
                        { title: t('Innovation is the Differentiator', 'الابتكار هو الفارق'), desc: t('Raja Al Mazrouei pioneered FinTech in MENA, Sarah Al Amiri reached Mars. Innovation opens doors that experience alone cannot.', 'رائدة رجاء المزروعي في التكنولوجيا المالية وسارة الأميري وصلت المريخ. الابتكار يفتح أبواباً لا تستطيع الخبرة وحدها فتحها.') },
                        { title: t('The Private Sector Needs You', 'القطاع الخاص يحتاجك'), desc: t('With Emiratisation targets rising across all sectors, private companies are actively seeking Emirati talent with ambition and drive.', 'مع ارتفاع أهداف التوطين في جميع القطاعات، الشركات الخاصة تبحث بنشاط عن الكفاءات الإماراتية الطموحة.') },
                    ].map((item, i) => (
                        <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{item.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emiratisation progress */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={18} style={{ color: brand.primary }} /> {t('Private Sector Emiratisation Progress', 'تقدم التوطين في القطاع الخاص')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                        { label: t('Banking & Finance', 'البنوك والتمويل'), target: '45%', current: '38%', status: t('On Track', 'على المسار') },
                        { label: t('Insurance', 'التأمين'), target: '40%', current: '35%', status: t('Progressing', 'يتقدم') },
                        { label: t('Technology', 'التكنولوجيا'), target: '10%', current: '7%', status: t('Growing Fast', 'نمو سريع') },
                        { label: t('Retail & Hospitality', 'التجزئة والضيافة'), target: '5%', current: '3%', status: t('Early Stage', 'مرحلة مبكرة') },
                    ].map((s, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                                {t('Target', 'الهدف')}: <strong>{s.target}</strong> · {t('Current', 'الحالي')}: <strong>{s.current}</strong>
                            </div>
                            <div style={{ background: '#E5E7EB', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                                <div style={{ background: brand.primary, height: '100%', borderRadius: 99, width: `${(parseFloat(s.current) / parseFloat(s.target)) * 100}%` }} />
                            </div>
                            <div style={{ fontSize: 10, color: brand.primary, fontWeight: 600, marginTop: 4 }}>{s.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'stories', label: t('Success Stories', 'قصص النجاح'), icon: <Star className="h-4 w-4" />, content: storiesTab },
        { id: 'sectors', label: t('By Sector', 'حسب القطاع'), icon: <Briefcase className="h-4 w-4" />, content: sectorTab },
        { id: 'quotes', label: t('In Their Words', 'بكلماتهم'), icon: <Quote className="h-4 w-4" />, content: quotesTab },
        { id: 'impact', label: t('Emiratisation Impact', 'أثر التوطين'), icon: <TrendingUp className="h-4 w-4" />, content: impactTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Emirati Success Stories', 'قصص النجاح الإماراتية')}
            description={t(
                'Real stories of Emiratis who built world-class businesses, led global innovations, and transformed industries from the private sector — inspiring the next generation of UAE talent',
                'قصص حقيقية لإماراتيين بنوا أعمالاً عالمية المستوى وقادوا ابتكارات عالمية وحوّلوا صناعات من القطاع الخاص — ملهمين الجيل القادم من الكفاءات الإماراتية'
            )}
            icon={<Star className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="stories"
        />
    );
};

export default ShareSuccessStoriesPage;
