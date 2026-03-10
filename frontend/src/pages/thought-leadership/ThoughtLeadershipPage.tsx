
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    BookOpen, Users, Award, Star, Crown, Quote,
    Lightbulb, Globe, Heart, TrendingUp, CheckCircle,
    ArrowRight, ArrowLeft, ExternalLink, Calendar
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
    gold: '#FEF9C3',
    goldText: '#854D0E',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const ThoughtLeadershipPage2: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── API DATA ──────────────────────── */

    const [leaders, setLeaders] = useState<any[]>([]);

    useEffect(() => {
        restClient.get('/api/lifelong/thought-leadership/leaders').then(r => {
            const data = (r.data as any[]).map((l: any) => ({
                id: l.leader_id,
                name: t(l.name_en, l.name_ar),
                title: t(l.title_en, l.title_ar),
                era: l.era,
                role: t(l.role_en, l.role_ar),
                avatar: l.avatar,
                theme: { bg: l.theme_bg, accent: l.theme_accent, light: l.theme_light },
                bio: t(l.bio_en, l.bio_ar),
                books: (l.books || []).map((b: any) => ({
                    title: t(b.title_en, b.title_ar),
                    author: t(b.author_en, b.author_ar),
                    year: b.year,
                    desc: t(b.desc_en, b.desc_ar),
                })),
                speeches: (l.speeches || []).map((s: any) => ({
                    title: t(s.title_en, s.title_ar),
                    quote: t(s.quote_en, s.quote_ar),
                })),
            }));
            setLeaders(data);
        }).catch(() => { });
    }, [isRTL]);

    const coreValues = [
        { icon: '🤝', title: t('Unity & Federation', 'الوحدة والاتحاد'), desc: t('Building a nation from seven diverse emirates — strength through solidarity', 'بناء أمة من سبع إمارات متنوعة — القوة من خلال التضامن') },
        { icon: '📚', title: t('Education as Foundation', 'التعليم كأساس'), desc: t('Investing in human capital as the true wealth of the nation', 'الاستثمار في رأس المال البشري باعتباره الثروة الحقيقية للأمة') },
        { icon: '🌍', title: t('Global Engagement', 'الانخراط العالمي'), desc: t('Tolerance, diplomacy, and cultural bridges connecting East and West', 'التسامح والدبلوماسية والجسور الثقافية التي تربط الشرق بالغرب') },
        { icon: '🌱', title: t('Sustainability', 'الاستدامة'), desc: t('Environmental stewardship from desert greening to clean energy leadership', 'الرعاية البيئية من تخضير الصحراء إلى قيادة الطاقة النظيفة') },
        { icon: '🚀', title: t('Innovation & Ambition', 'الابتكار والطموح'), desc: t('Nothing is impossible — from Burj Khalifa to the Mars Hope Probe', 'لا شيء مستحيل — من برج خليفة إلى مسبار الأمل إلى المريخ') },
        { icon: '❤️', title: t('Happiness & Well-being', 'السعادة والرفاهية'), desc: t('Government as a service — putting citizen happiness at the centre of policy', 'الحكومة كخدمة — وضع سعادة المواطن في صميم السياسة') },
    ];

    const stats = [
        { value: '4', label: t('Visionary Leaders', 'قادة رؤيويون'), icon: Crown },
        { value: '20+', label: t('Publications', 'منشور'), icon: BookOpen },
        { value: '50+', label: t('Years of Wisdom', 'عام من الحكمة'), icon: Star },
        { value: t('1 Nation', 'أمة واحدة'), label: t('United Vision', 'رؤية موحدة'), icon: Globe },
    ];

    /* ── Tab 1: Leaders' Library ── */
    const libraryTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t("The Leaders' Library", 'مكتبة القادة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "All biography books, publications, and written works of the UAE's founding fathers and current leaders — in one place. Study the vision that built a nation.",
                    'جميع كتب السيرة الذاتية والمنشورات والأعمال المكتوبة لآباء الإمارات المؤسسين والقادة الحاليين — في مكان واحد. ادرس الرؤية التي بنت أمة.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {leaders.map((leader) => (
                    <div key={leader.id}>
                        {/* Leader header */}
                        <div style={{ background: leader.theme.bg, borderRadius: 12, padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 36 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: '0 0 2px' }}>{leader.name}</h3>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{leader.role} · {leader.era}</div>
                            </div>
                        </div>
                        {/* Books */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {leader.books.map((book, j) => (
                                <div
                                    key={j}
                                    style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, transition: 'box-shadow .2s', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <BookOpen size={16} style={{ color: leader.theme.accent, flexShrink: 0 }} />
                                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{book.title}</h4>
                                    </div>
                                    <div style={{ fontSize: 11, color: leader.theme.accent, fontWeight: 600 }}>{book.author} · {book.year}</div>
                                    <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{book.desc}</p>
                                    <button style={{ background: leader.theme.light, color: leader.theme.accent, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 'auto', alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
                                        {t('Learn More', 'اعرف المزيد')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Speeches & Quotes ── */
    const speechesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Speeches & Quotes', 'الخطابات والاقتباسات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "The most powerful words from the UAE's leaders — on unity, governance, education, innovation, and the human spirit. Guiding the nation and serving as role models for generations.",
                    'أقوى الكلمات من قادة الإمارات — عن الوحدة والحوكمة والتعليم والابتكار والروح الإنسانية. ترشد الأمة وتكون قدوة للأجيال.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {leaders.map((leader) => (
                    <div key={leader.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: 28 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{leader.name}</h3>
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>{leader.title}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {leader.speeches.map((s, j) => (
                                <div key={j} style={{ background: leader.theme.bg, borderRadius: 10, padding: 18, borderLeft: isRTL ? 'none' : `4px solid ${leader.theme.accent}`, borderRight: isRTL ? `4px solid ${leader.theme.accent}` : 'none' }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: leader.theme.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {s.title}
                                    </div>
                                    <blockquote style={{ fontSize: 14, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                                        {s.quote}
                                    </blockquote>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Biographies ── */
    const biographiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Leader Biographies', 'السِّيَر الذاتية للقادة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'The stories behind the visionaries who built the UAE from desert sands into a global powerhouse — from federation to the world stage.',
                    'القصص وراء الرؤيويين الذين بنوا الإمارات من رمال الصحراء إلى قوة عالمية — من الاتحاد إلى المسرح العالمي.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {leaders.map((leader) => (
                    <div key={leader.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, overflow: 'hidden' }}>
                        <div style={{ background: leader.theme.bg, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <span style={{ fontSize: 42, lineHeight: 1 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 4px' }}>{leader.name}</h3>
                                <div style={{ fontSize: 13, color: leader.theme.accent, fontWeight: 600 }}>{leader.role}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>{leader.era}</div>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.7, margin: '0 0 16px' }}>
                                {leader.bio}
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ background: leader.theme.light, color: leader.theme.accent, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                                    📚 {leader.books.length} {t('Publications', 'منشور')}
                                </span>
                                <span style={{ background: leader.theme.light, color: leader.theme.accent, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                                    🎙️ {leader.speeches.length} {t('Key Speeches', 'خطابات رئيسية')}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Values & Legacy ── */
    const valuesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Core Values & National Legacy', 'القيم الجوهرية والإرث الوطني')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "The enduring principles drawn from the UAE's leaders — values that guide the nation's present and shape its future.",
                    'المبادئ الخالدة المستقاة من قادة الإمارات — قيم ترشد حاضر الأمة وتشكّل مستقبلها.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
                {coreValues.map((v, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 32, display: 'block', marginBottom: 10 }}>{v.icon}</span>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{v.title}</h3>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
                    </div>
                ))}
            </div>

            {/* Guiding Vision CTA */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 28, textAlign: 'center' }}>
                <Crown size={28} style={{ color: brand.primary, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 8px' }}>
                    {t('"A nation without a past has neither a present nor a future"', '"أمة بلا ماضٍ ليس لها حاضر ولا مستقبل"')}
                </h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6, margin: '0 0 6px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                    — {t('Sheikh Zayed bin Sultan Al Nahyan', 'الشيخ زايد بن سلطان آل نهيان')}
                </p>
                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, margin: '16px auto 20px', maxWidth: 600 }}>
                    {t(
                        'These words remind every Emirati that understanding the vision and values of our leaders is essential to carrying their legacy forward. Study their works. Live their values. Build the future they imagined.',
                        'هذه الكلمات تذكّر كل إماراتي بأن فهم رؤية قادتنا وقيمهم ضروري لحمل إرثهم. ادرس أعمالهم. عِش قيمهم. ابنِ المستقبل الذي تخيّلوه.'
                    )}
                </p>
                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {t('Explore the Library', 'استكشف المكتبة')} <ArrowIcon size={18} />
                </button>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'library', label: t("Leaders' Library", 'مكتبة القادة'), icon: <BookOpen className="h-4 w-4" />, content: libraryTab },
        { id: 'speeches', label: t('Speeches & Quotes', 'الخطابات والاقتباسات'), icon: <Quote className="h-4 w-4" />, content: speechesTab },
        { id: 'biographies', label: t('Biographies', 'السِّيَر الذاتية'), icon: <Crown className="h-4 w-4" />, content: biographiesTab },
        { id: 'values', label: t('Values & Legacy', 'القيم والإرث'), icon: <Heart className="h-4 w-4" />, content: valuesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Thought Leadership', 'القيادة الفكرية')}
            description={t(
                "The biography books, publications, speeches, and wisdom of the UAE's founding fathers and current leaders — all in one place, guiding the nation and serving as role models for every Emirati",
                'كتب السيرة الذاتية والمنشورات والخطابات وحكمة آباء الإمارات المؤسسين والقادة الحاليين — في مكان واحد، ترشد الأمة وتكون قدوة لكل إماراتي'
            )}
            icon={<Crown className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="library"
        />
    );
};

export default ThoughtLeadershipPage2;
