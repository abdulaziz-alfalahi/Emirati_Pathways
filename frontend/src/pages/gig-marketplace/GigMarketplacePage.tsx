
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
    Search, Briefcase, MapPin, Banknote, Clock, ChevronRight, ChevronLeft, Star,
    TrendingUp, Filter, Zap, Eye, Users, Award, CheckCircle, Send, Heart,
    Code, Palette, BarChart3, Globe, BookOpen, MessageSquare, ThumbsUp,
    Calendar, DollarSign, Shield, Target, Sparkles, PenTool
} from 'lucide-react';

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
    const Chevron = isRTL ? ChevronLeft : ChevronRight;

    const [activeTab, setActiveTab] = useState(0);
    const [activeCat, setActiveCat] = useState(0);
    const [reviewGig, setReviewGig] = useState<number | null>(null);

    const categories = [
        { label: t('All Categories', 'جميع الفئات'), icon: Filter },
        { label: t('Technology', 'التكنولوجيا'), icon: Code },
        { label: t('Marketing', 'التسويق'), icon: TrendingUp },
        { label: t('Design', 'التصميم'), icon: Palette },
        { label: t('Consulting', 'الاستشارات'), icon: BarChart3 },
        { label: t('Translation', 'الترجمة'), icon: Globe },
        { label: t('Education', 'التعليم'), icon: BookOpen },
    ];

    const gigs = [
        { title: t('Mobile App Developer', 'مطوّر تطبيقات جوال'), company: t('Careem', 'كريم'), companyRating: 4.6, companyReviews: 23, location: t('Remote', 'عن بُعد'), budget: t('AED 15,000', '15,000 د.إ'), duration: t('3 months', '3 أشهر'), match: 94, posted: t('1 day ago', 'قبل يوم'), desc: t('Build a cross-platform delivery tracking module using React Native', 'بناء وحدة تتبع التوصيل عبر المنصات باستخدام React Native'), skills: ['React Native', 'TypeScript', t('APIs', 'واجهات برمجة')], cat: 1, catBg: brand.blue, catColor: brand.blueText, featured: true },
        { title: t('Content Strategist', 'استراتيجي محتوى'), company: t('Dubai Tourism', 'دبي للسياحة'), companyRating: 4.8, companyReviews: 41, location: t('Dubai', 'دبي'), budget: t('AED 8,000', '8,000 د.إ'), duration: t('6 weeks', '6 أسابيع'), match: 87, posted: t('2 days ago', 'قبل يومين'), desc: t('Develop bilingual content strategy for tourism campaigns', 'تطوير استراتيجية محتوى ثنائية اللغة للحملات السياحية'), skills: [t('Content Strategy', 'استراتيجية المحتوى'), t('Bilingual', 'ثنائي اللغة'), 'SEO'], cat: 2, catBg: brand.green, catColor: brand.greenText, featured: true },
        { title: t('UI/UX Designer', 'مصمّم واجهات'), company: 'Noon.com', companyRating: 4.3, companyReviews: 18, location: t('Hybrid', 'هجين'), budget: t('AED 12,000', '12,000 د.إ'), duration: t('2 months', 'شهران'), match: 91, posted: t('3 days ago', 'قبل 3 أيام'), desc: t('Redesign the checkout experience for the e-commerce super-app', 'إعادة تصميم تجربة الدفع لتطبيق التجارة الإلكتروني'), skills: ['Figma', t('Prototyping', 'النمذجة'), t('User Research', 'أبحاث المستخدم')], cat: 3, catBg: brand.purple, catColor: brand.purpleText, featured: false },
        { title: t('Data Analyst', 'محلّل بيانات'), company: t('ADNOC', 'أدنوك'), companyRating: 4.7, companyReviews: 35, location: t('Abu Dhabi', 'أبوظبي'), budget: t('AED 10,000', '10,000 د.إ'), duration: t('4 weeks', '4 أسابيع'), match: 83, posted: t('5 days ago', 'قبل 5 أيام'), desc: t('Analyze production data and build dashboards for operations team', 'تحليل بيانات الإنتاج وبناء لوحات تحكم لفريق العمليات'), skills: ['Python', 'Power BI', 'SQL'], cat: 1, catBg: brand.amber, catColor: brand.amberText, featured: false },
        { title: t('Arabic Translator', 'مترجم عربي'), company: t('Emirates Group', 'مجموعة الإمارات'), companyRating: 4.9, companyReviews: 52, location: t('Remote', 'عن بُعد'), budget: t('AED 5,000', '5,000 د.إ'), duration: t('2 weeks', 'أسبوعان'), match: 96, posted: t('Today', 'اليوم'), desc: t('Translate aviation safety and compliance documents EN↔AR', 'ترجمة وثائق السلامة والامتثال في مجال الطيران EN↔AR'), skills: [t('Legal Translation', 'ترجمة قانونية'), t('Aviation', 'الطيران'), t('Proofreading', 'تدقيق لغوي')], cat: 5, catBg: brand.pink, catColor: brand.pinkText, featured: true },
        { title: t('STEM Workshop Facilitator', 'ميسّر ورش عمل STEM'), company: t('KHDA', 'هيئة المعرفة'), companyRating: 4.5, companyReviews: 14, location: t('Dubai', 'دبي'), budget: t('AED 7,000', '7,000 د.إ'), duration: t('1 month', 'شهر واحد'), match: 79, posted: t('1 week ago', 'قبل أسبوع'), desc: t('Facilitate hands-on STEM workshops for K-12 students in Dubai schools', 'تيسير ورش عمل STEM تطبيقية لطلاب المدارس في دبي'), skills: [t('Teaching', 'التدريس'), 'STEM', t('Curriculum Design', 'تصميم المناهج')], cat: 6, catBg: brand.primarySurface, catColor: brand.primary, featured: false },
    ];

    const myApps = [
        { title: t('Brand Identity Package', 'حزمة الهوية البصرية'), company: t('Abu Dhabi Media', 'أبوظبي للإعلام'), appliedDate: t('Feb 10, 2026', '10 فبراير 2026'), status: t('In Review', 'قيد المراجعة'), statusBg: brand.amber, statusColor: brand.amberText, budget: t('AED 9,000', '9,000 د.إ'), completed: false },
        { title: t('API Integration Specialist', 'أخصائي تكامل API'), company: t('Mashreq Bank', 'بنك المشرق'), appliedDate: t('Jan 28, 2026', '28 يناير 2026'), status: t('Interview', 'مقابلة'), statusBg: brand.blue, statusColor: brand.blueText, budget: t('AED 14,000', '14,000 د.إ'), completed: false },
        { title: t('Social Media Campaign', 'حملة وسائل التواصل'), company: t('Emaar', 'إعمار'), appliedDate: t('Jan 15, 2026', '15 يناير 2026'), status: t('Completed', 'مكتمل'), statusBg: brand.green, statusColor: brand.greenText, budget: t('AED 6,000', '6,000 د.إ'), completed: true, clientReview: { rating: 5, text: t('Exceptional work! Delivered ahead of schedule with outstanding quality.', 'عمل استثنائي! تم التسليم قبل الموعد بجودة ممتازة.') }, myReview: null },
        { title: t('Data Dashboard Design', 'تصميم لوحة بيانات'), company: t('DEWA', 'هيئة كهرباء ومياه دبي'), appliedDate: t('Dec 20, 2025', '20 ديسمبر 2025'), status: t('Completed', 'مكتمل'), statusBg: brand.green, statusColor: brand.greenText, budget: t('AED 11,000', '11,000 د.إ'), completed: true, clientReview: { rating: 4, text: t('Great collaboration. Minor revisions needed but overall excellent.', 'تعاون رائع. تعديلات طفيفة مطلوبة لكن ممتاز بشكل عام.') }, myReview: { rating: 5, text: t('Clear requirements and prompt payments. Highly recommend.', 'متطلبات واضحة ومدفوعات سريعة. أنصح بشدة.') } },
    ];

    const profileData = {
        rating: 4.8, completedGigs: 12, totalEarned: t('AED 142,000', '142,000 د.إ'), responseRate: '96%',
        skills: [t('React / React Native', 'React / React Native'), t('UI/UX Design', 'تصميم واجهات'), t('Data Analysis', 'تحليل البيانات'), t('Arabic Translation', 'الترجمة العربية'), 'Python', 'Figma'],
        reviews: [
            { client: t('Emirates Group', 'مجموعة الإمارات'), rating: 5, text: t('Outstanding translation quality. Very professional.', 'جودة ترجمة ممتازة. محترف جداً.'), date: t('Feb 2026', 'فبراير 2026') },
            { client: t('Careem', 'كريم'), rating: 5, text: t('Delivered the app module on time with clean code.', 'سلّم وحدة التطبيق في الموعد بكود نظيف.'), date: t('Jan 2026', 'يناير 2026') },
            { client: t('DEWA', 'هيئة كهرباء ومياه دبي'), rating: 4, text: t('Great dashboard work. Responsive and collaborative.', 'عمل رائع على لوحة التحكم. متجاوب ومتعاون.'), date: t('Dec 2025', 'ديسمبر 2025') },
        ],
        badges: [t('Top Rated', 'الأعلى تقييماً'), t('Quick Responder', 'سريع الاستجابة'), t('On-Time Delivery', 'تسليم في الموعد')],
    };

    const stats = [
        { value: '1,200+', label: t('Active Gigs', 'فرصة عمل حرّة'), icon: Briefcase },
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

    const filteredGigs = activeCat === 0 ? gigs : gigs.filter(g => g.cat === activeCat);

    /* ── Shared styles ── */
    const card: React.CSSProperties = { background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 16 };
    const badge = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' as const });
    const tabStyle = (active: boolean): React.CSSProperties => ({ padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? brand.primary : brand.textSecondary, borderBottom: active ? `2px solid ${brand.primary}` : '2px solid transparent', cursor: 'pointer', background: 'none', border: 'none', borderBottomStyle: 'solid' });

    const renderStars = (r: number) => (
        <span style={{ display: 'inline-flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= r ? '#F59E0B' : 'none'} stroke={i <= r ? '#F59E0B' : '#D1D5DB'} />)}
        </span>
    );

    /* ── TAB 1: Browse Gigs ── */
    const browseTab = (
        <div>
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
            {filteredGigs.map((g, i) => (
                <div key={i} style={{ ...card, ...(g.featured ? { borderColor: brand.primary, borderWidth: 1.5 } : {}) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary }}>{g.title}</span>
                                {g.featured && <span style={badge(brand.amber, brand.amberText)}>⚡ {t('Featured', 'مميّز')}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: brand.textSecondary, flexWrap: 'wrap', marginBottom: 8 }}>
                                <span style={{ fontWeight: 500, color: brand.textPrimary }}>{g.company}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{renderStars(Math.round(g.companyRating))} {g.companyRating} ({g.companyReviews})</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {g.location}</span>
                            </div>
                            <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{g.desc}</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {g.skills.map((s, j) => <span key={j} style={badge(g.catBg, g.catColor)}>{s}</span>)}
                            </div>
                        </div>
                        <div style={{ textAlign: isRTL ? 'left' : 'right', minWidth: 130 }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: brand.primary, marginBottom: 4 }}>{g.match}%</div>
                            <div style={{ fontSize: 11, color: brand.textSecondary, marginBottom: 12 }}>{t('Match Score', 'درجة التوافق')}</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 2 }}>{g.budget}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 2 }}>{g.duration}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {g.posted}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button style={{ flex: 1, padding: '10px 0', background: brand.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{t('Apply Now', 'قدّم الآن')}</button>
                        <button style={{ padding: '10px 16px', background: '#F9FAFB', color: brand.textSecondary, border: `1px solid ${brand.border}`, borderRadius: 10, cursor: 'pointer' }}><Heart size={16} /></button>
                        <button style={{ padding: '10px 16px', background: '#F9FAFB', color: brand.textSecondary, border: `1px solid ${brand.border}`, borderRadius: 10, cursor: 'pointer' }}><Eye size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── TAB 2: My Applications (with reviews) ── */
    const appsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('My Gig Applications', 'طلبات العمل الحرّ')}</h2>
            {myApps.map((a, i) => (
                <div key={i} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <span style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{a.title}</span>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{a.company} · {a.budget} · {t('Applied', 'تقدّمت')}: {a.appliedDate}</div>
                        </div>
                        <span style={badge(a.statusBg, a.statusColor)}>{a.status}</span>
                    </div>
                    {a.completed && (
                        <div style={{ marginTop: 16, padding: 16, background: '#F9FAFB', borderRadius: 12 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: brand.textPrimary }}>{t('Reviews', 'التقييمات')}</h4>
                            {a.clientReview && (
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>{t('Client Review', 'تقييم العميل')}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>{renderStars(a.clientReview.rating)} <span style={{ fontSize: 13, fontWeight: 600 }}>{a.clientReview.rating}/5</span></div>
                                    <p style={{ fontSize: 13, color: brand.textSecondary, fontStyle: 'italic' }}>"{a.clientReview.text}"</p>
                                </div>
                            )}
                            {a.myReview ? (
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>{t('Your Review of Client', 'تقييمك للعميل')}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>{renderStars(a.myReview.rating)} <span style={{ fontSize: 13, fontWeight: 600 }}>{a.myReview.rating}/5</span></div>
                                    <p style={{ fontSize: 13, color: brand.textSecondary, fontStyle: 'italic' }}>"{a.myReview.text}"</p>
                                </div>
                            ) : (
                                <button onClick={() => setReviewGig(i)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: brand.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                    <MessageSquare size={14} /> {t('Leave Review for Client', 'قيّم العميل')}
                                </button>
                            )}
                        </div>
                    )}
                    {reviewGig === i && !a.myReview && (
                        <div style={{ marginTop: 12, padding: 16, background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}` }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: brand.textPrimary }}>{t('Rate this Client', 'قيّم هذا العميل')}</h4>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={24} fill='#F59E0B' stroke='#F59E0B' style={{ cursor: 'pointer' }} />)}</div>
                            <textarea placeholder={t('Share your experience working with this client...', 'شارك تجربتك في العمل مع هذا العميل...')} style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => setReviewGig(null)} style={{ padding: '8px 16px', background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>{t('Cancel', 'إلغاء')}</button>
                                <button onClick={() => setReviewGig(null)} style={{ padding: '8px 16px', background: brand.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('Submit Review', 'إرسال التقييم')}</button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
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

    /* ── TAB 4: My Profile (with ratings) ── */
    const profileTab = (
        <div>
            <div style={{ ...card, background: `linear-gradient(135deg, ${brand.primarySurface}, #fff)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, marginBottom: 4 }}>{t('Freelancer Profile', 'ملف المستقل')}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            {renderStars(Math.round(profileData.rating))} <span style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary }}>{profileData.rating}</span>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>({profileData.reviews.length} {t('reviews', 'تقييمات')})</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {profileData.badges.map((b, i) => <span key={i} style={badge(brand.amber, brand.amberText)}>🏆 {b}</span>)}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { label: t('Completed', 'مكتمل'), value: profileData.completedGigs },
                            { label: t('Total Earned', 'إجمالي الأرباح'), value: profileData.totalEarned },
                            { label: t('Response Rate', 'معدل الاستجابة'), value: profileData.responseRate },
                            { label: t('Rating', 'التقييم'), value: `${profileData.rating}/5` },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center', padding: '10px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}` }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: brand.primary }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={card}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Skills', 'المهارات')}</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {profileData.skills.map((s, i) => <span key={i} style={badge(brand.blue, brand.blueText)}>{s}</span>)}
                    </div>
                </div>
                <div style={card}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Client Reviews', 'تقييمات العملاء')}</h3>
                    {profileData.reviews.map((r, i) => (
                        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < profileData.reviews.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{r.client}</span>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{r.date}</span>
                            </div>
                            <div style={{ marginBottom: 4 }}>{renderStars(r.rating)}</div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, fontStyle: 'italic' }}>"{r.text}"</p>
                        </div>
                    ))}
                </div>
            </div>
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
