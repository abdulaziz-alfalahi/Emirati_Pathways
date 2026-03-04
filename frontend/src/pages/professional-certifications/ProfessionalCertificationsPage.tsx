
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Award, Building2, TrendingUp, Users, BookOpen,
    Target, ChevronRight, ChevronLeft, Clock, Star, CheckCircle,
    Shield, Globe, Briefcase, Calendar, ExternalLink,
    BadgeCheck, FileText
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

const ProfessionalCertificationsPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const certifications = [
        { title: t('Project Management Professional (PMP)', 'إدارة المشاريع الاحترافية (PMP)'), issuer: 'PMI', category: t('Management', 'الإدارة'), level: t('Advanced', 'متقدم'), levelKey: 'Advanced', duration: t('3–6 months', '3–6 أشهر'), cost: t('AED 2,500', '2,500 د.إ'), demand: t('Very High', 'مرتفع جداً'), demandKey: 'Very High', salaryBoost: '+18%', catBg: brand.purple, catColor: brand.purpleText },
        { title: t('AWS Solutions Architect', 'مهندس حلول AWS'), issuer: t('Amazon Web Services', 'خدمات أمازون السحابية'), category: t('Cloud', 'السحابة'), level: t('Intermediate', 'متوسط'), levelKey: 'Intermediate', duration: t('2–4 months', '2–4 أشهر'), cost: t('AED 1,200', '1,200 د.إ'), demand: t('Very High', 'مرتفع جداً'), demandKey: 'Very High', salaryBoost: '+22%', catBg: brand.blue, catColor: brand.blueText },
        { title: t('Certified Information Systems Security Professional (CISSP)', 'محترف أمن نظم المعلومات المعتمد (CISSP)'), issuer: 'ISC²', category: t('Security', 'الأمان'), level: t('Advanced', 'متقدم'), levelKey: 'Advanced', duration: t('4–6 months', '4–6 أشهر'), cost: t('AED 3,000', '3,000 د.إ'), demand: t('High', 'مرتفع'), demandKey: 'High', salaryBoost: '+25%', catBg: brand.red, catColor: brand.redText },
        { title: t('Google Data Analytics Professional', 'محترف تحليلات البيانات من Google'), issuer: 'Google', category: t('Data', 'البيانات'), level: t('Beginner', 'مبتدئ'), levelKey: 'Beginner', duration: t('3 months', '3 أشهر'), cost: t('AED 800', '800 د.إ'), demand: t('High', 'مرتفع'), demandKey: 'High', salaryBoost: '+15%', catBg: brand.green, catColor: brand.greenText },
        { title: t('Certified Financial Analyst (CFA)', 'المحلل المالي المعتمد (CFA)'), issuer: t('CFA Institute', 'معهد CFA'), category: t('Finance', 'المالية'), level: t('Advanced', 'متقدم'), levelKey: 'Advanced', duration: t('12–18 months', '12–18 شهراً'), cost: t('AED 5,000', '5,000 د.إ'), demand: t('High', 'مرتفع'), demandKey: 'High', salaryBoost: '+30%', catBg: brand.amber, catColor: brand.amberText },
        { title: t('Microsoft Azure Administrator', 'مسؤول Microsoft Azure'), issuer: 'Microsoft', category: t('Cloud', 'السحابة'), level: t('Intermediate', 'متوسط'), levelKey: 'Intermediate', duration: t('2–3 months', '2–3 أشهر'), cost: t('AED 1,000', '1,000 د.إ'), demand: t('High', 'مرتفع'), demandKey: 'High', salaryBoost: '+20%', catBg: brand.primarySurface, catColor: brand.primary },
    ];

    const myCerts = [
        { title: t('AWS Cloud Practitioner', 'ممارس AWS السحابي'), issuer: t('Amazon Web Services', 'خدمات أمازون السحابية'), earned: t('Jan 2026', 'يناير 2026'), expires: t('Jan 2029', 'يناير 2029'), credentialId: 'AWS-CP-2026-1247', status: t('Active', 'فعّالة') as const, badge: '☁️' },
        { title: t('Google Data Analytics', 'تحليلات بيانات Google'), issuer: 'Google', earned: t('Dec 2025', 'ديسمبر 2025'), expires: t('N/A', 'غير محدد'), credentialId: 'GDA-2025-8932', status: t('Active', 'فعّالة') as const, badge: '📊' },
        { title: t('Certified Scrum Master', 'ماجستير سكرم معتمد'), issuer: t('Scrum Alliance', 'تحالف سكرم'), earned: t('Oct 2025', 'أكتوبر 2025'), expires: t('Oct 2027', 'أكتوبر 2027'), credentialId: 'CSM-2025-4291', status: t('Active', 'فعّالة') as const, badge: '🎯' },
    ];

    const recommended = [
        { title: t('AWS Solutions Architect', 'مهندس حلول AWS'), reason: t('Builds on your Cloud Practitioner credential — next step in the AWS path', 'يبني على شهادة الممارس السحابي — الخطوة التالية في مسار AWS'), match: 95, Icon: Shield },
        { title: 'PMP', reason: t('Your leadership assessment scored 88% — PMP would formalize that into a recognized credential', 'درجتك في تقييم القيادة 88% — شهادة PMP ستحوّلها إلى اعتماد معترف به'), match: 88, Icon: Briefcase },
        { title: 'CISSP', reason: t('Cybersecurity skills are in very high demand in UAE — complements your cloud knowledge', 'مهارات الأمن السيبراني مطلوبة بشدة في الإمارات — تكمّل معرفتك السحابية'), match: 82, Icon: Shield },
        { title: t('CFA Level I', 'CFA المستوى الأول'), reason: t('UAE finance sector is growing rapidly — combines well with your analytics certification', 'قطاع المالية في الإمارات ينمو بسرعة — يتكامل مع شهادة التحليلات'), match: 75, Icon: TrendingUp },
    ];

    const stats = [
        { value: '150+', label: t('Certifications', 'شهادة'), icon: Award },
        { value: '25+', label: t('Industry Sectors', 'قطاع'), icon: Building2 },
        { value: '+20%', label: t('Avg Salary Boost', 'زيادة الراتب'), icon: TrendingUp },
        { value: '5,200+', label: t('Certified Pros', 'محترف معتمد'), icon: Users },
    ];

    /* ── Tab 1: Browse Certifications ── */
    const browseTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Browse Certifications', 'تصفّح الشهادات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Explore 150+ industry-recognized certifications across management, cloud, security, data, finance, and more — all valued by UAE employers.',
                    'استكشف أكثر من 150 شهادة معترف بها عبر الإدارة والسحابة والأمان والبيانات والمالية وغيرها — جميعها مطلوبة من أصحاب العمل في الإمارات.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {certifications.map((c, i) => (
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
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: c.catBg, color: c.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>{c.category}</span>
                                <span style={{
                                    background: c.levelKey === 'Beginner' ? brand.green : c.levelKey === 'Intermediate' ? brand.amber : brand.red,
                                    color: c.levelKey === 'Beginner' ? brand.greenText : c.levelKey === 'Intermediate' ? brand.amberText : brand.redText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                                }}>
                                    {c.level}
                                </span>
                            </div>
                            <span style={{
                                background: c.demandKey === 'Very High' ? brand.green : brand.blue,
                                color: c.demandKey === 'Very High' ? brand.greenText : brand.blueText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {c.demand} {t('Demand', 'طلب')}
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer}</div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {c.duration}</span>
                            <span>{c.cost}</span>
                            <span style={{ color: brand.greenText, fontWeight: 600 }}>{c.salaryBoost} {t('salary', 'الراتب')}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                {t('Learn More', 'اعرف المزيد')} <ChevronIcon size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Certifications ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Certifications', 'شهاداتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'All your earned certifications, verification credentials, and renewal status in one place.',
                    'جميع شهاداتك المكتسبة وأوراق اعتمادك وحالة التجديد في مكان واحد.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myCerts.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 28 }}>{c.badge}</span>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · {t('Earned', 'حصل عليها')} {c.earned}</div>
                                </div>
                            </div>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <BadgeCheck size={12} /> {c.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FileText size={12} /> {c.credentialId}</span>
                                <span>{t('Expires:', 'تنتهي:')} {c.expires}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <ExternalLink size={12} /> {t('Verify', 'تحقّق')}
                                </button>
                                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                    {t('Share', 'مشاركة')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Recommended ── */
    const recommendedTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Recommended For You', 'موصى بها لك')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'AI-powered recommendations based on your current certifications, skills assessment results, and UAE market demand.',
                    'توصيات مدعومة بالذكاء الاصطناعي بناءً على شهاداتك الحالية ونتائج تقييم المهارات والطلب في السوق الإماراتي.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {recommended.map((r, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <r.Icon size={22} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{r.title}</h3>
                                <span style={{
                                    background: r.match >= 90 ? brand.green : r.match >= 80 ? brand.blue : brand.amber,
                                    color: r.match >= 90 ? brand.greenText : r.match >= 80 ? brand.blueText : brand.amberText,
                                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                                }}>
                                    {r.match}% {t('match', 'تطابق')}
                                </span>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '0 0 10px' }}>{r.reason}</p>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                {t('Start Preparation', 'ابدأ التحضير')} <ChevronIcon size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tips */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Target size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Certification Strategy Tips', 'نصائح استراتيجية الشهادات')}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('Stack cloud certifications (Practitioner → Solutions Architect → DevOps) for maximum career impact', 'تراكم شهادات السحابة (ممارس ← مهندس حلول ← DevOps) لأقصى تأثير مهني'),
                        t('UAE employers rank PMP as the #1 most valued management certification', 'يصنّف أصحاب العمل في الإمارات PMP كأكثر شهادة إدارة قيمة'),
                        t('CISSP holders in the UAE earn 25% more than non-certified peers in cybersecurity', 'حاملو CISSP في الإمارات يكسبون 25% أكثر من أقرانهم غير المعتمدين في الأمن السيبراني'),
                    ].map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 4: Preparation Resources ── */
    const prepTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Preparation Resources', 'موارد التحضير')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Study guides, practice exams, and learning materials to help you prepare for your next certification.',
                    'أدلة دراسية واختبارات تجريبية ومواد تعليمية لمساعدتك على التحضير لشهادتك التالية.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {[
                    { title: t('PMP Study Guide', 'دليل دراسة PMP'), type: t('Study Guide', 'دليل دراسي'), pages: 320, format: 'PDF', formatKey: 'PDF', icon: '📚' },
                    { title: t('AWS Practice Exam (150 Q)', 'اختبار AWS تجريبي (150 سؤال)'), type: t('Practice Exam', 'اختبار تجريبي'), pages: 150, format: t('Interactive', 'تفاعلي'), formatKey: 'Interactive', icon: '🧪' },
                    { title: t('CISSP Flashcard Deck', 'بطاقات CISSP التعليمية'), type: t('Flashcards', 'بطاقات تعليمية'), pages: 500, format: t('App', 'تطبيق'), formatKey: 'App', icon: '🃏' },
                    { title: t('CFA Level I Formula Sheet', 'ورقة معادلات CFA المستوى الأول'), type: t('Reference', 'مرجع'), pages: 24, format: 'PDF', formatKey: 'PDF', icon: '📋' },
                    { title: t('Cloud Architecture Diagrams', 'مخططات هندسة السحابة'), type: t('Visual Guide', 'دليل بصري'), pages: 48, format: 'PDF', formatKey: 'PDF', icon: '🗺️' },
                    { title: t('Mock Certification Interview', 'مقابلة شهادات تجريبية'), type: t('Video Course', 'دورة فيديو'), pages: 12, format: t('Video', 'فيديو'), formatKey: 'Video', icon: '🎥' },
                ].map((r, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 24 }}>{r.icon}</span>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>{r.format}</span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{r.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{r.type} · {r.pages} {r.formatKey === 'Interactive' ? t('questions', 'سؤال') : r.formatKey === 'Video' ? t('lessons', 'درس') : t('pages', 'صفحة')}</div>
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
        { id: 'browse', label: t('Browse', 'تصفّح'), icon: <Award className="h-4 w-4" />, content: browseTab },
        { id: 'my-certs', label: t('My Certifications', 'شهاداتي'), icon: <BadgeCheck className="h-4 w-4" />, content: myTab },
        { id: 'recommended', label: t('Recommended', 'الموصى بها'), icon: <Target className="h-4 w-4" />, content: recommendedTab },
        { id: 'preparation', label: t('Preparation', 'التحضير'), icon: <BookOpen className="h-4 w-4" />, content: prepTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Professional Certifications', 'الشهادات المهنية')}
            description={t(
                'Earn industry-recognized certifications to boost your career — 150+ programs across cloud, security, management, finance, and data',
                'احصل على شهادات معترف بها لتعزيز مسيرتك المهنية — أكثر من 150 برنامج في السحابة والأمان والإدارة والمالية والبيانات'
            )}
            icon={<Award className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="browse"
        />
    );
};

export default ProfessionalCertificationsPage;
