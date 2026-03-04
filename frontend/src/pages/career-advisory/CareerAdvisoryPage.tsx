
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    UserCheck, Users, MessageCircle, BookOpen, Target,
    Star, Clock, TrendingUp, Video, Calendar,
    ChevronRight, ChevronLeft, CheckCircle, Award, Shield,
    Lightbulb, Globe, Briefcase, GraduationCap, Phone
} from 'lucide-react';

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

const CareerAdvisoryPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const advisors = [
        { name: t('Dr. Fatima Al-Mansoori', 'د. فاطمة المنصوري'), specialization: t('Career Transition', 'الانتقال المهني'), sector: t('Banking & Finance', 'المصارف والتمويل'), experience: 15, rating: 4.9, sessions: 210, available: true, photo: '👩‍💼', catBg: brand.blue, catColor: brand.blueText },
        { name: t('Khalid Al-Hashmi', 'خالد الهاشمي'), specialization: t('Leadership Development', 'تطوير القيادة'), sector: t('Government', 'الحكومة'), experience: 12, rating: 4.8, sessions: 180, available: true, photo: '👨‍💼', catBg: brand.green, catColor: brand.greenText },
        { name: t('Sara Al-Blooshi', 'سارة البلوشي'), specialization: t('Tech Careers', 'المسارات التقنية'), sector: t('Technology', 'التكنولوجيا'), experience: 10, rating: 4.9, sessions: 155, available: false, photo: '👩‍💻', catBg: brand.purple, catColor: brand.purpleText },
        { name: t('Ahmed Al-Suwaidi', 'أحمد السويدي'), specialization: t('Entrepreneurship', 'ريادة الأعمال'), sector: t('Startups', 'الشركات الناشئة'), experience: 8, rating: 4.7, sessions: 120, available: true, photo: '🧑‍💼', catBg: brand.amber, catColor: brand.amberText },
        { name: t('Maryam Al-Dhaheri', 'مريم الظاهري'), specialization: t('Work-Life Balance', 'التوازن بين العمل والحياة'), sector: t('Healthcare', 'الرعاية الصحية'), experience: 14, rating: 4.8, sessions: 190, available: true, photo: '👩‍⚕️', catBg: brand.red, catColor: brand.redText },
        { name: t('Omar Al-Kaabi', 'عمر الكعبي'), specialization: t('Networking & Branding', 'بناء العلاقات والعلامة الشخصية'), sector: t('Media', 'الإعلام'), experience: 9, rating: 4.6, sessions: 95, available: true, photo: '🧑‍🎨', catBg: brand.primarySurface, catColor: brand.primary },
    ];

    const upcomingSessions = [
        { advisor: t('Dr. Fatima Al-Mansoori', 'د. فاطمة المنصوري'), topic: t('Career Pivot Strategy', 'استراتيجية الانتقال المهني'), date: t('Feb 22, 2026', '22 فبراير 2026'), time: t('10:00 AM', '10:00 صباحاً'), type: t('Video Call', 'مكالمة فيديو'), typeKey: 'Video Call', status: t('Confirmed', 'مؤكّدة'), statusKey: 'Confirmed' },
        { advisor: t('Khalid Al-Hashmi', 'خالد الهاشمي'), topic: t('Leadership Assessment Review', 'مراجعة تقييم القيادة'), date: t('Feb 25, 2026', '25 فبراير 2026'), time: t('2:00 PM', '2:00 مساءً'), type: t('In-Person', 'حضوري'), typeKey: 'In-Person', status: t('Pending', 'قيد الانتظار'), statusKey: 'Pending' },
    ];

    const completedSessions = [
        { advisor: t('Sara Al-Blooshi', 'سارة البلوشي'), topic: t('Tech Career Roadmap', 'خارطة طريق المسار التقني'), date: t('Feb 10, 2026', '10 فبراير 2026'), rating: 5, feedback: t('Excellent strategic guidance on transitioning into cloud architecture', 'توجيه استراتيجي ممتاز حول الانتقال إلى هندسة السحابة') },
        { advisor: t('Dr. Fatima Al-Mansoori', 'د. فاطمة المنصوري'), topic: t('Salary Negotiation Prep', 'التحضير لمفاوضة الراتب'), date: t('Feb 3, 2026', '3 فبراير 2026'), rating: 4, feedback: t('Great frameworks for approaching compensation discussions', 'أُطر رائعة للتعامل مع مناقشات التعويضات') },
        { advisor: t('Ahmed Al-Suwaidi', 'أحمد السويدي'), topic: t('Startup Feasibility Review', 'مراجعة جدوى المشروع الناشئ'), date: t('Jan 28, 2026', '28 يناير 2026'), rating: 5, feedback: t('Invaluable insights on UAE market entry and funding options', 'رؤى لا تُقدّر بثمن حول دخول السوق الإماراتي وخيارات التمويل') },
    ];

    const resources = [
        { title: t('Career Planning Essentials', 'أساسيات التخطيط المهني'), type: t('Article', 'مقال'), category: t('Planning', 'التخطيط'), readTime: t('8 min', '8 دقائق'), Icon: BookOpen, catBg: brand.blue, catColor: brand.blueText },
        { title: t('Leadership in the Digital Age', 'القيادة في العصر الرقمي'), type: t('Video', 'فيديو'), typeKey: 'Video', category: t('Leadership', 'القيادة'), readTime: t('45 min', '45 دقيقة'), Icon: Video, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Networking Strategies for UAE', 'استراتيجيات بناء العلاقات في الإمارات'), type: t('Article', 'مقال'), category: t('Networking', 'بناء العلاقات'), readTime: t('6 min', '6 دقائق'), Icon: Globe, catBg: brand.green, catColor: brand.greenText },
        { title: t('Personal Branding Workshop', 'ورشة العلامة الشخصية'), type: t('Video', 'فيديو'), typeKey: 'Video', category: t('Branding', 'العلامة الشخصية'), readTime: t('30 min', '30 دقيقة'), Icon: Star, catBg: brand.amber, catColor: brand.amberText },
        { title: t('Interview Mastery Course', 'دورة إتقان المقابلات'), type: t('Course', 'دورة'), typeKey: 'Course', category: t('Interview', 'المقابلات'), readTime: t('2 hrs', 'ساعتان'), Icon: MessageCircle, catBg: brand.primarySurface, catColor: brand.primary },
        { title: t('Career Transition Guide', 'دليل الانتقال المهني'), type: t('Guide', 'دليل'), category: t('Transition', 'الانتقال'), readTime: t('15 min', '15 دقيقة'), Icon: TrendingUp, catBg: brand.red, catColor: brand.redText },
    ];

    const goals = [
        { title: t('Complete Leadership Certificate', 'إكمال شهادة القيادة'), category: t('Short-term', 'قصير المدى'), catKey: 'Short-term', progress: 65, deadline: t('Mar 30, 2026', '30 مارس 2026') },
        { title: t('Transition to Senior Manager Role', 'الانتقال إلى دور مدير أقدم'), category: t('Medium-term', 'متوسط المدى'), catKey: 'Medium-term', progress: 30, deadline: t('Sep 2026', 'سبتمبر 2026') },
        { title: t('Launch Consulting Practice', 'إطلاق ممارسة استشارية'), category: t('Long-term', 'طويل المدى'), catKey: 'Long-term', progress: 10, deadline: t('Dec 2027', 'ديسمبر 2027') },
    ];

    const stats = [
        { value: '50+', label: t('Advisors', 'مستشار'), icon: Users },
        { value: '2,000+', label: t('Sessions', 'جلسة'), icon: MessageCircle },
        { value: '95%', label: t('Satisfaction', 'نسبة الرضا'), icon: Star },
        { value: '80%', label: t('Goal Achievement', 'تحقيق الأهداف'), icon: Target },
    ];

    /* ── Tab 1: Find an Advisor ── */
    const advisorsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Find a Career Advisor', 'ابحث عن مستشار مهني')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Connect with expert career advisors who specialize in your industry — get personalized guidance on career transitions, leadership, and growth.',
                    'تواصل مع مستشارين مهنيين خبراء متخصصين في مجالك — احصل على إرشاد شخصي حول الانتقال المهني والقيادة والنمو.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {advisors.map((adv, i) => (
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
                            <div style={{ width: 48, height: 48, borderRadius: 99, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                {adv.photo}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{adv.name}</h3>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{adv.specialization}</span>
                            </div>
                            <span style={{
                                width: 10, height: 10, borderRadius: 99,
                                background: adv.available ? '#22C55E' : '#D1D5DB',
                            }} title={adv.available ? t('Available', 'متاح') : t('Unavailable', 'غير متاح')} />
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ background: adv.catBg, color: adv.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {adv.sector}
                            </span>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                {adv.experience}+ {t('yrs', 'سنة')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Star size={14} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {adv.rating}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MessageCircle size={14} /> {adv.sessions} {t('sessions', 'جلسة')}
                            </span>
                        </div>

                        <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: adv.available ? brand.primary : '#F3F4F6',
                            color: adv.available ? '#fff' : brand.textSecondary,
                            border: 'none', padding: '10px 16px', borderRadius: 8,
                            fontSize: 13, fontWeight: 600, cursor: adv.available ? 'pointer' : 'default',
                            marginTop: 'auto',
                        }}>
                            <Calendar size={16} /> {adv.available ? t('Book Session', 'احجز جلسة') : t('Join Waitlist', 'انضم لقائمة الانتظار')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Sessions ── */
    const sessionsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Sessions', 'جلساتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Manage upcoming sessions and review past advisory meetings with notes and feedback.',
                    'أدِر الجلسات القادمة وراجع الاجتماعات الاستشارية السابقة مع الملاحظات والتقييمات.'
                )}
            </p>

            {/* Upcoming */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Upcoming Sessions', 'الجلسات القادمة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {upcomingSessions.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {s.typeKey === 'Video Call' ? <Video size={22} style={{ color: brand.primary }} /> : <Users size={22} style={{ color: brand.primary }} />}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.topic}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.advisor} · {s.date} {t('at', 'الساعة')} {s.time}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                {s.type}
                            </span>
                            <span style={{
                                background: s.statusKey === 'Confirmed' ? brand.green : brand.amber,
                                color: s.statusKey === 'Confirmed' ? brand.greenText : brand.amberText,
                                fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                            }}>
                                {s.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Completed Sessions', 'الجلسات المكتملة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {completedSessions.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.topic}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.advisor} · {s.date}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={14} style={{ color: j < s.rating ? '#FBBF24' : '#D1D5DB', fill: j < s.rating ? '#FBBF24' : 'none' }} />
                                ))}
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{s.feedback}</p>
                    </div>
                ))}
            </div>

            {/* Session Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {[
                    { label: t('Upcoming', 'القادمة'), value: '2', color: brand.primary },
                    { label: t('Completed', 'المكتملة'), value: '3', color: brand.greenText },
                    { label: t('Cancelled', 'الملغاة'), value: '0', color: brand.textSecondary },
                    { label: t('Total Hours', 'إجمالي الساعات'), value: '4.5', color: brand.blueText },
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <span style={{ fontSize: 13, color: brand.textSecondary }}>{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Resources ── */
    const resourcesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Career Resources', 'مصادر مهنية')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Articles, videos, courses, and guides curated by our advisors to accelerate your career development.',
                    'مقالات وفيديوهات ودورات وأدلة منتقاة من مستشارينا لتسريع تطويرك المهني.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {resources.map((res, i) => (
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
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: res.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <res.Icon size={22} style={{ color: res.catColor }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {res.type}
                                </span>
                                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                    {res.readTime}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{res.title}</h3>
                            <span style={{ fontSize: 12, color: brand.textSecondary }}>{res.category}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, marginTop: 'auto' }}>
                            {res.typeKey === 'Video' || res.typeKey === 'Course' ? t('Watch Now', 'شاهد الآن') : t('Read Now', 'اقرأ الآن')} <ChevronIcon size={14} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Goals ── */
    const goalsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Career Goals', 'الأهداف المهنية')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Set, track, and achieve your career goals with advisor-guided milestones and progress tracking.',
                    'حدّد وتابع وحقّق أهدافك المهنية بمعالم يرشدك إليها المستشار وتتبّع التقدم.'
                )}
            </p>

            {/* Active Goals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {goals.map((g, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{g.title}</h4>
                                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: brand.textSecondary }}>
                                    <span style={{
                                        background: g.catKey === 'Short-term' ? brand.green : g.catKey === 'Medium-term' ? brand.amber : brand.blue,
                                        color: g.catKey === 'Short-term' ? brand.greenText : g.catKey === 'Medium-term' ? brand.amberText : brand.blueText,
                                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                    }}>
                                        {g.category}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {g.deadline}</span>
                                </div>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: g.progress >= 50 ? brand.primary : brand.amberText }}>{g.progress}%</span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${g.progress}%`, height: '100%', background: g.progress >= 50 ? brand.primary : '#F59E0B', borderRadius: 99, transition: 'width .3s' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Goal + Goal Types */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Target size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Set a New Goal', 'حدّد هدفاً جديداً')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                    {[
                        { title: t('Skill Development', 'تطوير المهارات'), desc: t('Learn new skills or earn certifications', 'تعلّم مهارات جديدة أو احصل على شهادات'), Icon: GraduationCap },
                        { title: t('Career Advancement', 'التقدم المهني'), desc: t('Target a promotion or role change', 'استهدف ترقية أو تغيير دور'), Icon: TrendingUp },
                        { title: t('Networking', 'بناء العلاقات'), desc: t('Expand your professional network', 'وسّع شبكتك المهنية'), Icon: Globe },
                        { title: t('Leadership', 'القيادة'), desc: t('Develop management capabilities', 'طوّر قدراتك الإدارية'), Icon: Award },
                    ].map((type, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, cursor: 'pointer', transition: 'box-shadow .2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <type.Icon size={16} style={{ color: brand.primary }} />
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{type.title}</h4>
                            </div>
                            <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.4, margin: 0 }}>{type.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'advisors', label: t('Find an Advisor', 'ابحث عن مستشار'), icon: <Users className="h-4 w-4" />, content: advisorsTab },
        { id: 'sessions', label: t('My Sessions', 'جلساتي'), icon: <MessageCircle className="h-4 w-4" />, content: sessionsTab },
        { id: 'resources', label: t('Resources', 'المصادر'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
        { id: 'goals', label: t('Career Goals', 'الأهداف المهنية'), icon: <Target className="h-4 w-4" />, content: goalsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Career Advisory', 'الاستشارات المهنية')}
            description={t(
                'Connect with expert career advisors for personalized guidance on transitions, leadership, and professional growth in the UAE',
                'تواصل مع مستشارين مهنيين خبراء للحصول على إرشاد شخصي حول الانتقال المهني والقيادة والنمو المهني في الإمارات'
            )}
            icon={<UserCheck className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="advisors"
        />
    );
};

export default CareerAdvisoryPage;
