
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    GraduationCap, BookOpen, Users, TrendingUp,
    Clock, Star, CheckCircle, Play, Calendar,
    Award, Building, MapPin, Briefcase, ChevronRight, ChevronLeft,
    Target, Zap, FileText
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

const TrainingPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const programs = [
        { title: t('UAE Government Leadership Program', 'برنامج القيادة الحكومية الإماراتية'), provider: t('Mohammed Bin Rashid Centre', 'مركز محمد بن راشد'), duration: t('12 weeks', '12 أسبوعاً'), format: t('Hybrid', 'هجين'), formatKey: 'Hybrid', spots: 30, enrolled: 24, rating: 4.9, category: t('Leadership', 'القيادة'), location: t('Dubai', 'دبي'), catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Fintech Innovation Bootcamp', 'معسكر ابتكار التكنولوجيا المالية'), provider: t('DIFC Innovation Hub', 'مركز دبي المالي العالمي للابتكار'), duration: t('8 weeks', '8 أسابيع'), format: t('In-Person', 'حضوري'), formatKey: 'In-Person', spots: 25, enrolled: 18, rating: 4.8, category: t('Finance', 'المالية'), location: t('Dubai', 'دبي'), catBg: brand.green, catColor: brand.greenText },
        { title: t('Smart City Technologies Workshop', 'ورشة تقنيات المدن الذكية'), provider: t('Dubai Future Foundation', 'مؤسسة دبي للمستقبل'), duration: t('6 weeks', '6 أسابيع'), format: t('Online', 'إلكتروني'), formatKey: 'Online', spots: 50, enrolled: 42, rating: 4.7, category: t('Technology', 'التكنولوجيا'), location: t('Dubai', 'دبي'), catBg: brand.blue, catColor: brand.blueText },
        { title: t('Energy Sector Digital Transformation', 'التحول الرقمي في قطاع الطاقة'), provider: t('DEWA Academy', 'أكاديمية هيئة كهرباء ومياه دبي'), duration: t('10 weeks', '10 أسابيع'), format: t('Hybrid', 'هجين'), formatKey: 'Hybrid', spots: 20, enrolled: 15, rating: 4.8, category: t('Energy', 'الطاقة'), location: t('Dubai', 'دبي'), catBg: brand.amber, catColor: brand.amberText },
        { title: t('Healthcare Management Certificate', 'شهادة إدارة الرعاية الصحية'), provider: t('Dubai Health Authority', 'هيئة الصحة بدبي'), duration: t('8 weeks', '8 أسابيع'), format: t('In-Person', 'حضوري'), formatKey: 'In-Person', spots: 35, enrolled: 28, rating: 4.6, category: t('Healthcare', 'الرعاية الصحية'), location: t('Dubai', 'دبي'), catBg: brand.red, catColor: brand.redText },
        { title: t('Aviation Operations Excellence', 'التميز في عمليات الطيران'), provider: t('Emirates Aviation University', 'جامعة الإمارات للطيران'), duration: t('6 weeks', '6 أسابيع'), format: t('Hybrid', 'هجين'), formatKey: 'Hybrid', spots: 40, enrolled: 33, rating: 4.9, category: t('Aviation', 'الطيران'), location: t('Dubai', 'دبي'), catBg: brand.primarySurface, catColor: brand.primary },
    ];

    const myLearning = [
        { title: t('UAE Government Leadership Program', 'برنامج القيادة الحكومية الإماراتية'), progress: 65, modulesCompleted: 8, totalModules: 12, nextSession: t('Wed, Feb 19', 'الأربعاء 19 فبراير'), status: t('In Progress', 'قيد الإنجاز') },
        { title: t('Fintech Innovation Bootcamp', 'معسكر ابتكار التكنولوجيا المالية'), progress: 30, modulesCompleted: 3, totalModules: 10, nextSession: t('Thu, Feb 20', 'الخميس 20 فبراير'), status: t('In Progress', 'قيد الإنجاز') },
    ];

    const completedPrograms = [
        { title: t('Project Management Professional', 'إدارة المشاريع الاحترافية'), provider: t('PMI Arabia', 'PMI العربية'), score: 92, completedDate: t('Jan 2026', 'يناير 2026'), badge: '🏆', hours: 48 },
        { title: t('Agile Scrum Master', 'ماجستير سكرم أجايل'), provider: t('Scrum Alliance UAE', 'تحالف سكرم الإمارات'), score: 88, completedDate: t('Dec 2025', 'ديسمبر 2025'), badge: '🎯', hours: 32 },
        { title: t('Business Analytics Foundations', 'أساسيات تحليلات الأعمال'), provider: t('Dubai Knowledge Village', 'قرية دبي للمعرفة'), score: 95, completedDate: t('Nov 2025', 'نوفمبر 2025'), badge: '📊', hours: 40 },
    ];

    const certificates = [
        { title: t('Project Management Professional (PMP)', 'إدارة المشاريع الاحترافية (PMP)'), issuer: t('PMI Arabia', 'PMI العربية'), date: t('Jan 2026', 'يناير 2026'), credentialId: 'PMP-UAE-2026-1247', status: t('Active', 'فعّالة'), expiresIn: t('2 years', 'سنتان') },
        { title: t('Certified Scrum Master (CSM)', 'ماجستير سكرم معتمد (CSM)'), issuer: t('Scrum Alliance UAE', 'تحالف سكرم الإمارات'), date: t('Dec 2025', 'ديسمبر 2025'), credentialId: 'CSM-2025-8391', status: t('Active', 'فعّالة'), expiresIn: t('1.5 years', 'سنة ونصف') },
        { title: t('UAE Government Excellence Award', 'جائزة التميز الحكومي الإماراتية'), issuer: t('Federal Authority for Gov HR', 'الهيئة الاتحادية للموارد البشرية'), date: t('Nov 2025', 'نوفمبر 2025'), credentialId: 'GEA-2025-0042', status: t('Active', 'فعّالة'), expiresIn: t('Lifetime', 'مدى الحياة') },
    ];

    const stats = [
        { value: '200+', label: t('Programs', 'برنامج'), icon: BookOpen },
        { value: '8,500+', label: t('Graduates', 'خريج'), icon: Users },
        { value: '94%', label: t('Placement', 'نسبة التوظيف'), icon: TrendingUp },
        { value: '50+', label: t('Partners', 'شريك'), icon: Building },
    ];

    /* ── Tab 1: Available Programs ── */
    const programsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Available Training Programs', 'البرامج التدريبية المتاحة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Discover 200+ professional training programs from leading UAE institutions — from government leadership to industry certifications.',
                    'اكتشف أكثر من 200 برنامج تدريبي مهني من مؤسسات إماراتية رائدة — من القيادة الحكومية إلى الشهادات القطاعية.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {programs.map((p, i) => (
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
                            <span style={{ background: p.catBg, color: p.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {p.category}
                            </span>
                            <span style={{
                                background: p.formatKey === 'Online' ? brand.blue : p.formatKey === 'In-Person' ? brand.green : brand.amber,
                                color: p.formatKey === 'Online' ? brand.blueText : p.formatKey === 'In-Person' ? brand.greenText : brand.amberText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {p.format}
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{p.title}</h3>
                            <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Building size={12} /> {p.provider}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {p.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {p.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {p.rating}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: 12, color: p.spots - p.enrolled <= 5 ? brand.redText : brand.textSecondary }}>
                                {p.spots - p.enrolled} {t('spots left', 'مقعد متاح')}
                            </span>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                                {t('Apply Now', 'قدّم الآن')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Learning ── */
    const learningTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Learning', 'تعلّمي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track your active training programs, upcoming sessions, and learning progress.',
                    'تابع برامجك التدريبية النشطة والجلسات القادمة وتقدمك التعليمي.'
                )}
            </p>

            {/* Active Programs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {myLearning.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{p.title}</h3>
                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                                    <span>{p.modulesCompleted}/{p.totalModules} {t('modules', 'وحدة')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {t('Next:', 'التالي:')} {p.nextSession}</span>
                                </div>
                            </div>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <Play size={14} /> {t('Continue', 'متابعة')}
                            </button>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: brand.textSecondary }}>{p.status}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: brand.primary }}>{p.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed Programs */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Completed Programs', 'البرامج المكتملة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {completedPrograms.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{c.badge}</span>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{c.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.provider} · {c.hours}{t('h', 'س')} · {t('Completed', 'أُكمل في')} {c.completedDate}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: c.score >= 90 ? brand.greenText : brand.primary }}>{c.score}%</div>
                            <span style={{ fontSize: 10, color: brand.textSecondary }}>{t('Score', 'الدرجة')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Certificates ── */
    const certsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Certificates', 'شهاداتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'All your earned certificates and professional credentials in one place — share them on your profile or with employers.',
                    'جميع شهاداتك وأوراق اعتمادك المهنية في مكان واحد — شاركها على ملفك الشخصي أو مع أصحاب العمل.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {certificates.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Award size={22} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · {t('Earned', 'حصل عليها')} {c.date}</div>
                                </div>
                            </div>
                            <span style={{
                                background: brand.green, color: brand.greenText,
                                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                            }}>
                                {c.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                <span>{t('ID:', 'المعرّف:')} {c.credentialId}</span>
                                <span>{t('Expires in:', 'تنتهي خلال:')} {c.expiresIn}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{
                                    background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`,
                                    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    {t('Download', 'تحميل')}
                                </button>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    {t('Share', 'مشاركة')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Training Partners ── */
    const partnersTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Training Partners', 'شركاء التدريب')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'We collaborate with 50+ leading UAE institutions and global training providers to bring you world-class programs.',
                    'نتعاون مع أكثر من 50 مؤسسة إماراتية رائدة ومزودي تدريب عالميين لتقديم برامج عالمية المستوى.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {[
                    { name: t('Mohammed Bin Rashid Centre for Leadership', 'مركز محمد بن راشد للقيادة'), type: t('Government', 'الحكومة'), programs: 24, location: t('Dubai', 'دبي') },
                    { name: t('DIFC Innovation Hub', 'مركز دبي المالي العالمي للابتكار'), type: t('Finance', 'المالية'), programs: 18, location: t('Dubai', 'دبي') },
                    { name: t('Dubai Future Foundation', 'مؤسسة دبي للمستقبل'), type: t('Innovation', 'الابتكار'), programs: 15, location: t('Dubai', 'دبي') },
                    { name: t('DEWA Academy', 'أكاديمية هيئة كهرباء ومياه دبي'), type: t('Energy', 'الطاقة'), programs: 12, location: t('Dubai', 'دبي') },
                    { name: t('Emirates Aviation University', 'جامعة الإمارات للطيران'), type: t('Aviation', 'الطيران'), programs: 20, location: t('Dubai', 'دبي') },
                    { name: t('Dubai Health Authority', 'هيئة الصحة بدبي'), type: t('Healthcare', 'الرعاية الصحية'), programs: 16, location: t('Dubai', 'دبي') },
                    { name: t('University of Dubai', 'جامعة دبي'), type: t('Research', 'البحث العلمي'), programs: 22, location: t('Dubai', 'دبي') },
                    { name: t('Dubai Electricity & Water Authority', 'هيئة كهرباء ومياه دبي'), type: t('Sustainability', 'الاستدامة'), programs: 10, location: t('Dubai', 'دبي') },
                ].map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building size={20} style={{ color: brand.primary }} />
                            </div>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>
                                {p.type}
                            </span>
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{p.name}</h4>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {p.location}</span>
                            <span>{p.programs} {t('programs', 'برنامج')}</span>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer', marginTop: 12 }}>
                            {t('View Programs', 'عرض البرامج')} <ChevronIcon size={14} />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'programs', label: t('Available Programs', 'البرامج المتاحة'), icon: <BookOpen className="h-4 w-4" />, content: programsTab },
        { id: 'learning', label: t('My Learning', 'تعلّمي'), icon: <GraduationCap className="h-4 w-4" />, content: learningTab },
        { id: 'certificates', label: t('Certificates', 'الشهادات'), icon: <Award className="h-4 w-4" />, content: certsTab },
        { id: 'partners', label: t('Training Partners', 'شركاء التدريب'), icon: <Building className="h-4 w-4" />, content: partnersTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Training Programs', 'البرامج التدريبية')}
            description={t(
                'Advance your career with 200+ professional training programs from leading UAE institutions — government leadership, industry certifications, and specialized workshops',
                'طوّر مسيرتك المهنية مع أكثر من 200 برنامج تدريبي مهني من مؤسسات إماراتية رائدة — القيادة الحكومية والشهادات القطاعية والورش المتخصصة'
            )}
            icon={<GraduationCap className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default TrainingPage;
