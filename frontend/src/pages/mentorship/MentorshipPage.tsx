
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, UserCheck, Calendar, Star, MessageCircle,
    BookOpen, Search, ChevronRight, ChevronLeft, Clock, Briefcase,
    MapPin, Globe, Award, Target, Video, Heart,
    CheckCircle, ArrowRight, ArrowLeft
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

const MentorshipPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const mentors = [
        { name: t('Dr. Fatima Al Mazrouei', 'د. فاطمة المزروعي'), title: t('VP of Engineering, DEWA Digital', 'نائبة رئيس الهندسة، ديوا الرقمية'), expertise: [t('Cloud Architecture', 'هندسة السحابة'), t('Team Leadership', 'قيادة الفرق'), t('Energy Tech', 'تكنولوجيا الطاقة')], rating: 4.9, sessions: 124, location: t('Dubai', 'دبي'), available: true, avatar: '👩‍💼' },
        { name: t('Ahmed Al Dhaheri', 'أحمد الظاهري'), title: t('Director of Innovation, Dubai Holding', 'مدير الابتكار، دبي القابضة'), expertise: [t('Investment Strategy', 'استراتيجية الاستثمار'), t('Fintech', 'التكنولوجيا المالية'), t('Startup Growth', 'نمو الشركات الناشئة')], rating: 4.8, sessions: 98, location: t('Dubai', 'دبي'), available: true, avatar: '👨‍💼' },
        { name: t('Sara Al Shamsi', 'سارة الشامسي'), title: t('Head of AI, Dubai Future Foundation', 'رئيسة الذكاء الاصطناعي، مؤسسة دبي للمستقبل'), expertise: [t('Artificial Intelligence', 'الذكاء الاصطناعي'), t('Data Science', 'علم البيانات'), t('Research', 'البحث العلمي')], rating: 4.9, sessions: 156, location: t('Dubai', 'دبي'), available: false, avatar: '👩‍🔬' },
        { name: t('Khalid Al Falasi', 'خالد الفلاسي'), title: t('CTO, Emirates Airlines Group', 'كبير مسؤولي التكنولوجيا، مجموعة الإمارات'), expertise: [t('Aviation Tech', 'تكنولوجيا الطيران'), t('Digital Transformation', 'التحول الرقمي'), t('DevOps', 'DevOps')], rating: 4.7, sessions: 78, location: t('Dubai', 'دبي'), available: true, avatar: '👨‍✈️' },
        { name: t('Mariam Al Ketbi', 'مريم الكتبي'), title: t('CEO, Dubai Smart Solutions', 'الرئيسة التنفيذية، حلول دبي الذكية'), expertise: [t('Smart Cities', 'المدن الذكية'), t('IoT', 'إنترنت الأشياء'), t('Project Management', 'إدارة المشاريع')], rating: 4.8, sessions: 112, location: t('Dubai', 'دبي'), available: true, avatar: '👩‍💻' },
        { name: t('Omar Al Suwaidi', 'عمر السويدي'), title: t('Partner, PwC Middle East', 'شريك، PwC الشرق الأوسط'), expertise: [t('Management Consulting', 'الاستشارات الإدارية'), t('Finance', 'المالية'), t('Strategy', 'الاستراتيجية')], rating: 4.6, sessions: 64, location: t('Dubai', 'دبي'), available: true, avatar: '🧑‍💼' },
    ];

    const myMentorships = [
        { mentor: t('Dr. Fatima Al Mazrouei', 'د. فاطمة المزروعي'), topic: t('Cloud Architecture Career Path', 'مسار مهنة هندسة السحابة'), status: t('Active', 'نشط') as const, nextSession: t('Wed, Feb 19 · 3:00 PM', 'الأربعاء 19 فبراير · 3:00 م'), totalSessions: 8, completed: 5, progress: 62 },
        { mentor: t('Ahmed Al Dhaheri', 'أحمد الظاهري'), topic: t('Fintech Startup Guidance', 'إرشاد شركات التكنولوجيا المالية الناشئة'), status: t('Active', 'نشط') as const, nextSession: t('Thu, Feb 20 · 10:00 AM', 'الخميس 20 فبراير · 10:00 ص'), totalSessions: 6, completed: 2, progress: 33 },
    ];

    const pastMentorships = [
        { mentor: t('Sara Al Shamsi', 'سارة الشامسي'), topic: t('AI/ML Career Transition', 'الانتقال المهني إلى الذكاء الاصطناعي'), sessions: 12, period: t('Jun – Nov 2025', 'يونيو – نوفمبر 2025'), outcome: t('Landed AI Engineer role', 'حصل على وظيفة مهندس ذكاء اصطناعي'), rating: 5.0 },
        { mentor: t('Khalid Al Falasi', 'خالد الفلاسي'), topic: t('DevOps Best Practices', 'أفضل ممارسات DevOps'), sessions: 8, period: t('Mar – Jun 2025', 'مارس – يونيو 2025'), outcome: t('Promoted to Senior Engineer', 'تمت ترقيته إلى مهندس أول'), rating: 4.8 },
    ];

    const resources = [
        { title: t('Effective Mentoring in the UAE Workplace', 'الإرشاد الفعّال في بيئة العمل الإماراتية'), type: t('Guide', 'دليل'), readTime: t('12 min', '12 دقيقة'), icon: '📖' },
        { title: t('Setting Goals with Your Mentor', 'تحديد الأهداف مع مرشدك'), type: t('Template', 'قالب'), readTime: t('5 min', '5 دقائق'), icon: '🎯' },
        { title: t('How to Be a Great Mentee', 'كيف تكون متدرباً مميزاً'), type: t('Video Course', 'دورة فيديو'), readTime: t('45 min', '45 دقيقة'), icon: '🎥' },
        { title: t('Mentorship Meeting Agenda Template', 'قالب جدول أعمال جلسات الإرشاد'), type: t('Template', 'قالب'), readTime: t('3 min', '3 دقائق'), icon: '📋' },
        { title: t('Building Cross-Generational Connections', 'بناء روابط بين الأجيال'), type: t('Article', 'مقالة'), readTime: t('8 min', '8 دقائق'), icon: '🤝' },
        { title: t('UAE Career Development Framework', 'إطار التطوير المهني في الإمارات'), type: t('Guide', 'دليل'), readTime: t('15 min', '15 دقيقة'), icon: '🇦🇪' },
    ];

    const stats = [
        { value: '300+', label: t('Active Mentors', 'مرشد نشط'), icon: UserCheck },
        { value: '800+', label: t('Mentees', 'متدرب'), icon: Users },
        { value: '1,500+', label: t('Sessions', 'جلسة'), icon: Calendar },
        { value: '4.8/5', label: t('Avg Rating', 'متوسط التقييم'), icon: Star },
    ];

    /* ── Tab 1: Find Mentors ── */
    const findTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Find a Mentor', 'ابحث عن مرشد')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Connect with 300+ experienced UAE professionals across technology, finance, energy, aviation, and government — all ready to help you grow.',
                    'تواصل مع أكثر من 300 محترف إماراتي ذو خبرة في التكنولوجيا والمالية والطاقة والطيران والحكومة — جميعهم مستعدون لمساعدتك على النمو.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {mentors.map((m, i) => (
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
                                <span style={{ fontSize: 32 }}>{m.avatar}</span>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{m.name}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.title}</div>
                                </div>
                            </div>
                            <span style={{
                                background: m.available ? brand.green : brand.amber,
                                color: m.available ? brand.greenText : brand.amberText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {m.available ? t('Available', 'متاح') : t('Waitlist', 'قائمة الانتظار')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {m.expertise.map((e, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>{e}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {m.rating}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {m.sessions} {t('sessions', 'جلسة')}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {m.location}</span>
                        </div>

                        <button style={{
                            background: m.available ? brand.primary : 'transparent',
                            color: m.available ? '#fff' : brand.primary,
                            border: m.available ? 'none' : `1px solid ${brand.primary}`,
                            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {m.available ? t('Request Mentorship', 'طلب إرشاد') : t('Join Waitlist', 'انضم لقائمة الانتظار')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Mentorships ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Mentorships', 'إرشاداتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track your active mentorships, upcoming sessions, and progress toward your goals.',
                    'تابع إرشاداتك النشطة والجلسات القادمة وتقدمك نحو أهدافك.'
                )}
            </p>

            {/* Active */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Active', 'نشطة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {myMentorships.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{m.topic}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                    {t('with', 'مع')} <strong>{m.mentor}</strong> · {m.completed}/{m.totalSessions} {t('sessions', 'جلسة')}
                                </div>
                            </div>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                {m.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: brand.textSecondary, marginBottom: 12 }}>
                            <Video size={14} style={{ color: brand.primary }} />
                            <span>{t('Next:', 'التالي:')} <strong>{m.nextSession}</strong></span>
                        </div>

                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${m.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: brand.textSecondary }}>{m.completed} {t('of', 'من')} {m.totalSessions} {t('sessions', 'جلسة')}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: brand.primary }}>{m.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Past Mentorships */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Completed', 'مكتملة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pastMentorships.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={20} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{m.topic}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                {t('with', 'مع')} <strong>{m.mentor}</strong> · {m.sessions} {t('sessions', 'جلسة')} · {m.period}
                            </div>
                        </div>
                        <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: brand.greenText, marginBottom: 2 }}>{m.outcome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                                <Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary }}>{m.rating}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Become a Mentor ── */
    const becomeTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Become a Mentor', 'كن مرشداً')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Share your expertise with the next generation of UAE professionals. Give back to the community while growing your own leadership skills.',
                    'شارك خبرتك مع الجيل القادم من المحترفين الإماراتيين. ساهم في المجتمع بينما تُطوّر مهاراتك القيادية.'
                )}
            </p>

            {/* Benefits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { title: t('Build Leadership Skills', 'بناء مهارات القيادة'), desc: t('Develop coaching and communication abilities', 'طوّر قدرات التدريب والتواصل'), Icon: Target },
                    { title: t('Expand Your Network', 'وسّع شبكتك'), desc: t('Connect with emerging talent across the UAE', 'تواصل مع المواهب الصاعدة في الإمارات'), Icon: Globe },
                    { title: t('Earn Recognition', 'احصل على تقدير'), desc: t('Get certified badges and community awards', 'احصل على شارات معتمدة وجوائز مجتمعية'), Icon: Award },
                    { title: t('Give Back', 'ساهم في المجتمع'), desc: t('Shape the future of UAE workforce development', 'ساهم في تشكيل مستقبل تطوير القوى العاملة الإماراتية'), Icon: Heart },
                ].map((b, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                            <b.Icon size={22} style={{ color: brand.primary }} />
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{b.title}</h4>
                        <span style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.4 }}>{b.desc}</span>
                    </div>
                ))}
            </div>

            {/* Requirements */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 14px' }}>{t('Requirements', 'المتطلبات')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('5+ years of professional experience in your field', 'أكثر من 5 سنوات خبرة مهنية في مجالك'),
                        t('Currently employed or recently retired from a UAE-based organization', 'تعمل حالياً أو تقاعدت مؤخراً من مؤسسة إماراتية'),
                        t('Commitment to at least 2 sessions per month for 3 months', 'الالتزام بجلستين على الأقل شهرياً لمدة 3 أشهر'),
                        t('Pass a brief screening interview with our mentorship team', 'اجتياز مقابلة فحص قصيرة مع فريق الإرشاد'),
                    ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{r}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button style={{
                background: brand.primary, color: '#fff', border: 'none',
                padding: '12px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
            }}>
                {t('Apply to Be a Mentor', 'قدّم طلباً لتكون مرشداً')} <ArrowIcon size={18} />
            </button>
        </div>
    );

    /* ── Tab 4: Resources ── */
    const resourcesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Mentorship Resources', 'موارد الإرشاد')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Guides, templates, and courses to help you get the most out of your mentoring experience.',
                    'أدلة وقوالب ودورات لمساعدتك على تحقيق أقصى استفادة من تجربة الإرشاد.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {resources.map((r, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 24 }}>{r.icon}</span>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>{r.type}</span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{r.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={12} /> {r.readTime}
                            </div>
                        </div>
                        <button style={{
                            background: brand.primary, color: '#fff', border: 'none',
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {t('Access Resource', 'الوصول إلى المورد')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'find', label: t('Find Mentors', 'ابحث عن مرشد'), icon: <Search className="h-4 w-4" />, content: findTab },
        { id: 'my', label: t('My Mentorships', 'إرشاداتي'), icon: <MessageCircle className="h-4 w-4" />, content: myTab },
        { id: 'become', label: t('Become a Mentor', 'كن مرشداً'), icon: <UserCheck className="h-4 w-4" />, content: becomeTab },
        { id: 'resources', label: t('Resources', 'الموارد'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Mentorship Programs', 'برامج الإرشاد')}
            description={t(
                'Connect with 300+ experienced UAE professionals for one-on-one guidance — in tech, finance, energy, aviation, government, and more',
                'تواصل مع أكثر من 300 محترف إماراتي ذو خبرة للإرشاد الفردي — في التكنولوجيا والمالية والطاقة والطيران والحكومة وغيرها'
            )}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="find"
        />
    );
};

export default MentorshipPage;
