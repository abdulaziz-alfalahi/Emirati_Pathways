
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, MessageCircle, Calendar, MapPin, Star,
    Search, Heart, Eye, Clock, Award, Building,
    Briefcase, GraduationCap, ChevronRight, ChevronLeft, CheckCircle,
    Globe, UserCheck, Share2, BookOpen
} from 'lucide-react';

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
    red: '#FEE2E2',
    redText: '#991B1B',
    blue: '#DBEAFE',
    blueText: '#1E40AF',
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const CommunitiesPage2: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    /* ──────────────────────── DATA ──────────────────────── */

    const communities = [
        { name: t('UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات'), description: t('Connect with 5,000+ tech professionals across the UAE — share insights, job leads, and collaborate on projects.', 'تواصل مع أكثر من 5,000 محترف تقني في الإمارات — شارك الأفكار وفرص العمل وتعاون في المشاريع.'), category: t('Technology', 'التكنولوجيا'), members: 5240, posts: 12400, joined: true, verified: true, tags: [t('Software', 'البرمجيات'), t('Cloud', 'السحابة'), t('AI', 'الذكاء الاصطناعي')], avatar: '💻', catBg: brand.blue, catColor: brand.blueText },
        { name: t('Emirati Women in Leadership', 'المرأة الإماراتية في القيادة'), description: t('Empowering UAE women in business, government, and STEM — mentoring, networking, and career resources.', 'تمكين المرأة الإماراتية في الأعمال والحكومة والعلوم — إرشاد وتواصل ومصادر مهنية.'), category: t('Leadership', 'القيادة'), members: 3180, posts: 8200, joined: true, verified: true, tags: [t('Women', 'المرأة'), t('Leadership', 'القيادة'), t('STEM', 'العلوم والتقنية')], avatar: '👩‍💼', catBg: brand.purple, catColor: brand.purpleText },
        { name: t('Dubai Financial Professionals', 'شبكة دبي المالية'), description: t('Financial professionals in Dubai — banking, investment, fintech, and regulatory updates from DIFC and beyond.', 'محترفو المالية في دبي — المصارف والاستثمار والتكنولوجيا المالية وتحديثات مركز دبي المالي العالمي.'), category: t('Finance', 'المالية'), members: 2750, posts: 6800, joined: false, verified: true, tags: [t('Finance', 'المالية'), t('Banking', 'المصارف'), t('Fintech', 'التكنولوجيا المالية')], avatar: '📈', catBg: brand.green, catColor: brand.greenText },
        { name: t('Dubai Innovation Hub', 'مركز دبي للابتكار'), description: t('Entrepreneurs, innovators, and startup founders building the future of Dubai — events, funding, and collaboration.', 'رواد الأعمال والمبتكرون ومؤسسو الشركات الناشئة يبنون مستقبل دبي — فعاليات وتمويل وتعاون.'), category: t('Startups', 'الشركات الناشئة'), members: 4100, posts: 9500, joined: false, verified: true, tags: [t('Startups', 'الشركات الناشئة'), t('Innovation', 'الابتكار'), t('Funding', 'التمويل')], avatar: '🚀', catBg: brand.amber, catColor: brand.amberText },
        { name: t('UAE Energy & Sustainability', 'الطاقة والاستدامة في الإمارات'), description: t('Professionals in oil & gas, renewables, and sustainability — ADNOC, Masdar, and the UAE energy transition.', 'محترفو النفط والغاز والطاقة المتجددة والاستدامة — أدنوك ومصدر والتحول في قطاع الطاقة الإماراتي.'), category: t('Energy', 'الطاقة'), members: 1920, posts: 4300, joined: false, verified: true, tags: [t('Energy', 'الطاقة'), t('Sustainability', 'الاستدامة'), t('Oil & Gas', 'النفط والغاز')], avatar: '⚡', catBg: brand.primarySurface, catColor: brand.primary },
        { name: t('UAE Government Careers', 'الوظائف الحكومية في الإمارات'), description: t('Public sector professionals — career development, government initiatives, Emiratization updates, and policy discussions.', 'محترفو القطاع العام — التطوير المهني والمبادرات الحكومية وتحديثات التوطين ونقاشات السياسات.'), category: t('Government', 'الحكومة'), members: 6200, posts: 15800, joined: true, verified: true, tags: [t('Government', 'الحكومة'), t('Policy', 'السياسات'), t('Careers', 'المسارات المهنية')], avatar: '🏛️', catBg: brand.red, catColor: brand.redText },
    ];

    const feedPosts = [
        { author: t('Fatima Al Mazrouei', 'فاطمة المزروعي'), title: t('VP Engineering', 'نائب رئيس الهندسة'), company: t('ADNOC Digital', 'أدنوك الرقمية'), avatar: '👩‍💼', community: t('UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات'), content: t("Excited to announce our team is hiring 5 cloud architects! If you have AWS or Azure experience and want to work on Abu Dhabi's digital transformation, DM me. 🚀", 'يسعدني الإعلان أن فريقنا يوظّف 5 مهندسي سحابة! إن كنت تمتلك خبرة في AWS أو Azure وترغب في العمل على التحول الرقمي في أبوظبي، راسلني. 🚀'), time: t('2h ago', 'قبل ساعتين'), likes: 48, comments: 12, verified: true },
        { author: t('Ahmed Al Dhaheri', 'أحمد الظاهري'), title: t('Director', 'مدير'), company: t('DIFC Authority', 'سلطة مركز دبي المالي العالمي'), avatar: '👨‍💼', community: t('Dubai Financial Professionals', 'شبكة دبي المالية'), content: t("Great panel discussion today on UAE fintech regulation. Key takeaway: DIFC's innovation hub is accelerating fintech growth faster than expected. Bullish on Dubai digital banking.", 'نقاش ممتاز اليوم حول تنظيم التكنولوجيا المالية في الإمارات. النتيجة الرئيسية: مركز الابتكار في مركز دبي المالي العالمي يسرّع نمو التكنولوجيا المالية أسرع من المتوقع. متفائل بالصيرفة الرقمية في دبي.'), time: t('4h ago', 'قبل 4 ساعات'), likes: 72, comments: 28, verified: true },
        { author: t('Sara Al Shamsi', 'سارة الشامسي'), title: t('AI Lead', 'رئيسة الذكاء الاصطناعي'), company: t('Dubai Future Foundation', 'مؤسسة دبي للمستقبل'), avatar: '👩‍🔬', community: t('Dubai Innovation Hub', 'مركز دبي للابتكار'), content: t('We just published our 2026 AI Readiness Report for the UAE. Download link in bio — covers adoption rates, talent gaps, and investment trends. Key stat: 67% of UAE companies plan to increase AI spending this year.', 'نشرنا للتو تقرير جاهزية الذكاء الاصطناعي 2026 للإمارات. رابط التحميل في الملف الشخصي — يغطي معدلات التبني وفجوات المواهب واتجاهات الاستثمار. إحصائية رئيسية: 67% من شركات الإمارات تخطط لزيادة إنفاقها على الذكاء الاصطناعي هذا العام.'), time: t('6h ago', 'قبل 6 ساعات'), likes: 134, comments: 45, verified: true },
        { author: t('Khalid Al Falasi', 'خالد الفلاسي'), title: t('CTO', 'الرئيس التقني'), company: t('Emirates Group', 'مجموعة الإمارات'), avatar: '👨‍✈️', community: t('UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات'), content: t("Mentoring sessions open for Q2 2026. I'll be focusing on DevOps and cloud migration strategies. First 10 spots go fast — sign up through the mentorship platform.", 'جلسات الإرشاد مفتوحة للربع الثاني 2026. سأركّز على DevOps واستراتيجيات الانتقال السحابي. أول 10 مقاعد تنفد بسرعة — سجّل عبر منصة الإرشاد.'), time: t('8h ago', 'قبل 8 ساعات'), likes: 56, comments: 19, verified: true },
    ];

    const events = [
        { title: t('UAE Tech Summit 2026', 'قمة الإمارات التقنية 2026'), date: t('Mar 15, 2026', '15 مارس 2026'), dateParts: { month: t('Mar', 'مارس'), day: '15' }, time: t('9:00 AM – 5:00 PM', '9:00 ص – 5:00 م'), location: t('ADNEC, Abu Dhabi', 'أدنيك، أبوظبي'), type: t('In-Person', 'حضوري'), typeKey: 'In-Person' as const, attendees: 420, maxAttendees: 500, community: t('UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات'), organizer: 'TechConnect UAE' },
        { title: t('Women in Leadership Lunch', 'غداء المرأة في القيادة'), date: t('Feb 28, 2026', '28 فبراير 2026'), dateParts: { month: t('Feb', 'فبراير'), day: '28' }, time: t('12:00 PM – 2:00 PM', '12:00 م – 2:00 م'), location: t('Jumeirah Emirates Towers, Dubai', 'أبراج الإمارات جميرا، دبي'), type: t('In-Person', 'حضوري'), typeKey: 'In-Person' as const, attendees: 85, maxAttendees: 100, community: t('Emirati Women in Leadership', 'المرأة الإماراتية في القيادة'), organizer: t('EWL Committee', 'لجنة المرأة الإماراتية في القيادة') },
        { title: t('Fintech Regulations Webinar', 'ندوة تنظيمات التكنولوجيا المالية'), date: t('Mar 5, 2026', '5 مارس 2026'), dateParts: { month: t('Mar', 'مارس'), day: '5' }, time: t('2:00 PM – 3:30 PM', '2:00 م – 3:30 م'), location: t('Online (Zoom)', 'إلكتروني (Zoom)'), type: t('Online', 'إلكتروني'), typeKey: 'Online' as const, attendees: 210, maxAttendees: 500, community: t('Dubai Financial Professionals', 'شبكة دبي المالية'), organizer: t('DIFC Academy', 'أكاديمية مركز دبي المالي العالمي') },
        { title: t('Startup Pitch Night', 'ليلة عروض الشركات الناشئة'), date: t('Mar 10, 2026', '10 مارس 2026'), dateParts: { month: t('Mar', 'مارس'), day: '10' }, time: t('6:00 PM – 9:00 PM', '6:00 م – 9:00 م'), location: t('Hub71, Abu Dhabi', 'Hub71، أبوظبي'), type: t('Hybrid', 'هجين'), typeKey: 'Hybrid' as const, attendees: 150, maxAttendees: 200, community: t('Dubai Innovation Hub', 'مركز دبي للابتكار'), organizer: 'Hub71' },
    ];

    const stats = [
        { value: '25+', label: t('Communities', 'مجتمع'), icon: Users },
        { value: '23K+', label: t('Members', 'عضو'), icon: UserCheck },
        { value: '57K+', label: t('Posts', 'منشور'), icon: MessageCircle },
        { value: '120+', label: t('Events/Year', 'فعالية/سنة'), icon: Calendar },
    ];

    /* ── Tab 1: Discover ── */
    const discoverTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Discover Communities', 'اكتشف المجتمعات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Join vibrant professional communities across the UAE — connect with peers, share knowledge, and grow your career network.',
                    'انضم إلى مجتمعات مهنية نابضة بالحياة في الإمارات — تواصل مع أقرانك وشارك المعرفة ووسّع شبكتك المهنية.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {communities.map((c, i) => (
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 28 }}>{c.avatar}</span>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{c.name}</h3>
                                        {c.verified && <CheckCircle size={14} style={{ color: brand.primary }} />}
                                    </div>
                                    <span style={{ background: c.catBg, color: c.catColor, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{c.category}</span>
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{c.description}</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {c.tags.map((tag, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {c.members.toLocaleString()} {t('members', 'عضو')}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MessageCircle size={12} /> {c.posts.toLocaleString()} {t('posts', 'منشور')}</span>
                        </div>

                        <button style={{
                            background: c.joined ? 'transparent' : brand.primary,
                            color: c.joined ? brand.primary : '#fff',
                            border: c.joined ? `1px solid ${brand.primary}` : 'none',
                            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {c.joined ? t('Joined ✓', 'منضم ✓') : t('Join Community', 'انضم للمجتمع')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Feed ── */
    const feedTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Community Feed', 'آخر أخبار المجتمع')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Latest posts, discussions, and updates from your communities.',
                    'أحدث المنشورات والنقاشات والتحديثات من مجتمعاتك.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {feedPosts.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 28 }}>{p.avatar}</span>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{p.author}</span>
                                        {p.verified && <CheckCircle size={12} style={{ color: brand.primary }} />}
                                    </div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.title} {t('at', 'في')} {p.company}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                <span style={{ fontSize: 11, color: brand.textSecondary }}>{p.time}</span>
                                <div style={{ fontSize: 10, color: brand.primary, fontWeight: 500 }}>{p.community}</div>
                            </div>
                        </div>

                        <p style={{ fontSize: 14, color: brand.textPrimary, lineHeight: 1.6, margin: '0 0 14px' }}>{p.content}</p>

                        <div style={{ display: 'flex', gap: 16, borderTop: `1px solid ${brand.border}`, paddingTop: 12 }}>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}>
                                <Heart size={14} /> {p.likes}
                            </button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}>
                                <MessageCircle size={14} /> {p.comments}
                            </button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}>
                                <Share2 size={14} /> {t('Share', 'مشاركة')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Events ── */
    const eventsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Community Events', 'فعاليات المجتمع')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Upcoming meetups, webinars, summits, and networking events across UAE communities.',
                    'لقاءات وندوات وقمم وفعاليات تواصل قادمة عبر مجتمعات الإمارات.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {events.map((ev, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* Date badge */}
                        <div style={{ width: 56, minWidth: 56, textAlign: 'center', background: brand.primarySurface, borderRadius: 10, padding: '8px 4px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: brand.primary, textTransform: 'uppercase' }}>{ev.dateParts.month}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: brand.primaryDark }}>{ev.dateParts.day}</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{ev.title}</h3>
                                <span style={{
                                    background: ev.typeKey === 'Online' ? brand.blue : ev.typeKey === 'In-Person' ? brand.green : brand.amber,
                                    color: ev.typeKey === 'Online' ? brand.blueText : ev.typeKey === 'In-Person' ? brand.greenText : brand.amberText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                                }}>
                                    {ev.type}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: brand.textSecondary, marginBottom: 10 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {ev.time}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {ev.location}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {ev.attendees}/{ev.maxAttendees}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: brand.primary, fontWeight: 500 }}>{t('by', 'بواسطة')} {ev.organizer} · {ev.community}</span>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    {t('Register', 'سجّل')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: My Communities ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Communities', 'مجتمعاتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Communities you've joined — quick access to posts, events, and fellow members.",
                    'المجتمعات التي انضممت إليها — وصول سريع للمنشورات والفعاليات والأعضاء.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {communities.filter(c => c.joined).map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>{c.avatar}</span>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{c.name}</h4>
                                    {c.verified && <CheckCircle size={14} style={{ color: brand.primary }} />}
                                </div>
                                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                    <span>{c.members.toLocaleString()} {t('members', 'عضو')}</span>
                                    <span>{c.posts.toLocaleString()} {t('posts', 'منشور')}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                {t('View', 'عرض')}
                            </button>
                            <button style={{ background: '#fff', color: brand.redText, border: `1px solid ${brand.border}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                {t('Leave', 'مغادرة')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state hint */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, marginTop: 24, textAlign: 'center' }}>
                <Globe size={28} style={{ color: brand.primary, margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{t('Discover More Communities', 'اكتشف المزيد من المجتمعات')}</h4>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>
                    {t(
                        'Explore 25+ professional communities and find your tribe — from tech and finance to government and sustainability.',
                        'استكشف أكثر من 25 مجتمعاً مهنياً وجد مجموعتك — من التكنولوجيا والمالية إلى الحكومة والاستدامة.'
                    )}
                </p>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'discover', label: t('Discover', 'اكتشف'), icon: <Search className="h-4 w-4" />, content: discoverTab },
        { id: 'feed', label: t('Feed', 'آخر الأخبار'), icon: <MessageCircle className="h-4 w-4" />, content: feedTab },
        { id: 'events', label: t('Events', 'الفعاليات'), icon: <Calendar className="h-4 w-4" />, content: eventsTab },
        { id: 'my', label: t('My Communities', 'مجتمعاتي'), icon: <Users className="h-4 w-4" />, content: myTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Professional Communities', 'المجتمعات المهنية')}
            description={t(
                'Join 25+ vibrant professional communities across the UAE — network, share knowledge, attend events, and grow your career alongside 23,000+ members',
                'انضم إلى أكثر من 25 مجتمعاً مهنياً نابضاً بالحياة في الإمارات — تواصل وشارك المعرفة واحضر الفعاليات ونمِّ مسيرتك المهنية مع أكثر من 23,000 عضو'
            )}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="discover"
        />
    );
};

export default CommunitiesPage2;
