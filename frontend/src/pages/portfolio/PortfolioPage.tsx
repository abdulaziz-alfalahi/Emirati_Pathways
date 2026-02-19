
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    FolderOpen, Eye, Image, BarChart3, Share2,
    Briefcase, Code, Palette, GraduationCap, Award,
    Globe, Lock, Link, Mail, Download, Copy,
    TrendingUp, Users, Monitor, Smartphone, Tablet,
    ChevronRight, ChevronLeft, CheckCircle, Settings, Plus, Star
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

const PortfolioPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const projects = [
        { title: t('E-Commerce Platform', 'منصة التجارة الإلكترونية'), category: t('Web Development', 'تطوير الويب'), desc: t('Full-stack e-commerce solution with payment integration and real-time inventory', 'حل تجارة إلكترونية متكامل مع تكامل الدفع والمخزون الفوري'), tech: ['React', 'Node.js', 'MongoDB'], featured: true, views: 342, catBg: brand.blue, catColor: brand.blueText },
        { title: t('Brand Identity System', 'نظام الهوية البصرية'), category: t('Design', 'التصميم'), desc: t('Complete brand identity including logo, typography, and color system for a UAE startup', 'هوية بصرية كاملة تشمل الشعار والخطوط ونظام الألوان لشركة ناشئة إماراتية'), tech: ['Figma', 'Illustrator', 'InDesign'], featured: true, views: 287, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Smart City Dashboard', 'لوحة المدينة الذكية'), category: t('Data & Analytics', 'البيانات والتحليلات'), desc: t('Real-time IoT dashboard for monitoring urban infrastructure across Dubai', 'لوحة بيانات إنترنت الأشياء لمراقبة البنية التحتية الحضرية في دبي'), tech: ['Python', 'D3.js', 'PostgreSQL'], featured: false, views: 198, catBg: brand.green, catColor: brand.greenText },
        { title: t('Mobile Banking App', 'تطبيق الخدمات المصرفية'), category: t('Mobile Development', 'تطوير الجوال'), desc: t('Fintech mobile application with biometric authentication and digital wallet', 'تطبيق تقنية مالية مع المصادقة البيومترية والمحفظة الرقمية'), tech: ['Flutter', 'Firebase', 'Stripe'], featured: false, views: 256, catBg: brand.amber, catColor: brand.amberText },
        { title: t('AI Content Generator', 'مولّد المحتوى بالذكاء الاصطناعي'), category: t('Machine Learning', 'التعلّم الآلي'), desc: t('NLP-based content generator fine-tuned for Arabic and English bilingual output', 'مولّد محتوى قائم على معالجة اللغات الطبيعية ومحسّن للمخرجات ثنائية اللغة'), tech: ['Python', 'TensorFlow', 'FastAPI'], featured: true, views: 421, catBg: brand.primarySurface, catColor: brand.primary },
        { title: t('Event Management System', 'نظام إدارة الفعاليات'), category: t('Web Development', 'تطوير الويب'), desc: t('Full event lifecycle platform with ticketing, seating, and live streaming', 'منصة لدورة حياة الفعاليات الكاملة مع التذاكر والمقاعد والبث المباشر'), tech: ['Next.js', 'Prisma', 'Stripe'], featured: false, views: 164, catBg: brand.red, catColor: brand.redText },
    ];

    const templates = [
        { title: t('Creative Showcase', 'العرض الإبداعي'), desc: t('Visual-first layout perfect for designers and artists', 'تصميم بصري أولاً مثالي للمصممين والفنانين'), Icon: Palette, category: t('Design', 'التصميم'), popular: true },
        { title: t('Developer Portfolio', 'معرض المطوّر'), desc: t('Code-oriented layout with GitHub integration and tech stack display', 'تصميم موجّه للبرمجة مع تكامل GitHub وعرض المهارات التقنية'), Icon: Code, category: t('Tech', 'تقنية'), popular: true },
        { title: t('Business Professional', 'الأعمال الاحترافية'), desc: t('Clean, corporate layout highlighting achievements and metrics', 'تصميم مؤسسي أنيق يبرز الإنجازات والمقاييس'), Icon: Briefcase, category: t('Business', 'أعمال'), popular: false },
        { title: t('Academic Research', 'البحث الأكاديمي'), desc: t('Publication-focused layout with citation support and research timeline', 'تصميم يركز على المنشورات مع دعم الاستشهاد والجدول الزمني للبحث'), Icon: GraduationCap, category: t('Academic', 'أكاديمي'), popular: false },
        { title: t('Freelancer Pro', 'المستقل المحترف'), desc: t('Service-oriented layout with testimonials and project timeline', 'تصميم موجّه للخدمات مع شهادات العملاء والجدول الزمني للمشاريع'), Icon: Star, category: t('Freelance', 'عمل حر'), popular: true },
        { title: t('Minimal Resume+', 'السيرة الذاتية المبسّطة+'), desc: t('Extended resume layout with project galleries and skill charts', 'تصميم سيرة ذاتية موسّع مع معارض المشاريع ومخططات المهارات'), Icon: Award, category: t('General', 'عام'), popular: false },
    ];

    const analyticsMetrics = [
        { label: t('Total Views', 'إجمالي المشاهدات'), value: '1,847', change: '+12%', Icon: Eye },
        { label: t('Unique Visitors', 'الزوار الفريدون'), value: '932', change: '+8%', Icon: Users },
        { label: t('Downloads', 'التنزيلات'), value: '156', change: '+23%', Icon: Download },
        { label: t('Shares', 'المشاركات'), value: '89', change: '+15%', Icon: Share2 },
        { label: t('Contact Clicks', 'نقرات التواصل'), value: '47', change: '+31%', Icon: Mail },
        { label: t('Avg. Time on Page', 'متوسط وقت الصفحة'), value: t('2m 34s', '2د 34ث'), change: '+5%', Icon: TrendingUp },
    ];

    const topPages = [
        { page: t('About Me', 'نبذة عني'), pct: 45 },
        { page: t('Projects', 'المشاريع'), pct: 32 },
        { page: t('Experience', 'الخبرات'), pct: 23 },
    ];

    const deviceBreakdown = [
        { device: t('Desktop', 'سطح المكتب'), pct: 52, Icon: Monitor },
        { device: t('Mobile', 'الجوال'), pct: 38, Icon: Smartphone },
        { device: t('Tablet', 'الجهاز اللوحي'), pct: 10, Icon: Tablet },
    ];

    const visibilityOptions = [
        { title: t('Public', 'عام'), desc: t('Anyone can view your portfolio via search or direct link', 'يمكن لأي شخص عرض معرض أعمالك عبر البحث أو الرابط المباشر'), Icon: Globe, active: true },
        { title: t('Link Only', 'بالرابط فقط'), desc: t('Only people with the link can view your portfolio', 'فقط من لديه الرابط يمكنه عرض معرض أعمالك'), Icon: Link, active: false },
        { title: t('Password Protected', 'محمي بكلمة مرور'), desc: t('Require a password to access your portfolio', 'يتطلب كلمة مرور للوصول إلى معرض أعمالك'), Icon: Lock, active: false },
    ];

    const stats = [
        { value: '6', label: t('Projects', 'المشاريع'), icon: FolderOpen },
        { value: '1.8K', label: t('Total Views', 'إجمالي المشاهدات'), icon: Eye },
        { value: '15+', label: t('Templates', 'القوالب'), icon: Image },
        { value: '89', label: t('Shares', 'المشاركات'), icon: Share2 },
    ];

    /* ── Tab 1: My Projects ── */
    const projectsTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    {t('My Projects', 'مشاريعي')}
                </h2>
                <button style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: brand.primary, color: '#fff', border: 'none',
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>
                    <Plus size={16} /> {t('Add Project', 'أضف مشروعاً')}
                </button>
            </div>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Showcase your best work — each project tells your professional story to employers and collaborators.',
                    'اعرض أفضل أعمالك — كل مشروع يروي قصتك المهنية لأصحاب العمل والمتعاونين.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {projects.map((proj, i) => (
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
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{proj.title}</h3>
                                    {proj.featured && (
                                        <span style={{ background: brand.amber, color: brand.amberText, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                                            ★ {t('Featured', 'مميّز')}
                                        </span>
                                    )}
                                </div>
                                <span style={{ display: 'inline-block', background: proj.catBg, color: proj.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {proj.category}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}>
                                <Eye size={14} /> {proj.views}
                            </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{proj.desc}</p>

                        {/* Tech Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {proj.tech.map((tag, j) => (
                                <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* View link */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, marginTop: 'auto' }}>
                            {t('View Project', 'عرض المشروع')} <ChevronIcon size={14} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Templates ── */
    const templatesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Portfolio Templates', 'قوالب معرض الأعمال')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Choose a professional template to showcase your work — fully customizable to match your personal brand.',
                    'اختر قالباً احترافياً لعرض أعمالك — قابل للتخصيص بالكامل ليتوافق مع هويتك الشخصية.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {templates.map((tpl, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                            transition: 'box-shadow .2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        {/* Icon + Popular badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <tpl.Icon size={24} style={{ color: brand.primary }} />
                            </div>
                            {tpl.popular && (
                                <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                    {t('Popular', 'رائج')}
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{tpl.title}</h3>
                            <span style={{ fontSize: 11, fontWeight: 500, color: brand.textSecondary, background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>
                                {tpl.category}
                            </span>
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{tpl.desc}</p>

                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                            <button style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                            }}>
                                {t('Use Template', 'استخدم القالب')}
                            </button>
                            <button style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`,
                                padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer'
                            }}>
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Analytics ── */
    const analyticsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Portfolio Analytics', 'تحليلات معرض الأعمال')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Track how your portfolio is performing — see who's viewing your work and which projects attract the most attention.",
                    'تتبّع أداء معرض أعمالك — شاهد من يستعرض أعمالك وأي المشاريع تجذب أكبر اهتمام.'
                )}
            </p>

            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                {analyticsMetrics.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: brand.textSecondary, fontWeight: 500 }}>{m.label}</span>
                            <m.Icon size={18} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{m.value}</div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: brand.greenText }}>{m.change} {t('this month', 'هذا الشهر')}</span>
                    </div>
                ))}
            </div>

            {/* Details row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {/* Top Pages */}
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Top Pages', 'أبرز الصفحات')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {topPages.map((p, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                    <span style={{ color: brand.textPrimary, fontWeight: 500 }}>{p.page}</span>
                                    <span style={{ color: brand.textSecondary }}>{p.pct}%</span>
                                </div>
                                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ width: `${p.pct}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device Breakdown */}
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Device Breakdown', 'توزيع الأجهزة')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {deviceBreakdown.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <d.Icon size={18} style={{ color: brand.primary }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                        <span style={{ fontWeight: 500, color: brand.textPrimary }}>{d.device}</span>
                                        <span style={{ color: brand.textSecondary }}>{d.pct}%</span>
                                    </div>
                                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ width: `${d.pct}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    /* ── Tab 4: Sharing & Visibility ── */
    const sharingTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Sharing & Visibility', 'المشاركة والظهور')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Control who can see your portfolio and how it's shared — manage privacy, generate share links, and export your work.",
                    'تحكّم بمن يستطيع رؤية معرض أعمالك وكيفية مشاركته — أدِر الخصوصية وأنشئ روابط المشاركة وصدّر أعمالك.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {/* Visibility Settings */}
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Visibility Settings', 'إعدادات الظهور')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {visibilityOptions.map((opt, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: 14, borderRadius: 10,
                                    border: `1px solid ${opt.active ? brand.primary : brand.border}`,
                                    background: opt.active ? brand.primarySurface : '#fff',
                                    cursor: 'pointer', transition: 'all .2s'
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: opt.active ? brand.primary : '#F3F4F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <opt.Icon size={20} style={{ color: opt.active ? '#fff' : brand.textSecondary }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{opt.title}</div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.4 }}>{opt.desc}</div>
                                </div>
                                {opt.active && <CheckCircle size={20} style={{ color: brand.primary }} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Share & Export */}
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Share & Export', 'المشاركة والتصدير')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { label: t('Copy Portfolio Link', 'نسخ رابط المعرض'), Icon: Copy },
                            { label: t('Share via Email', 'مشاركة عبر البريد'), Icon: Mail },
                            { label: t('Share on LinkedIn', 'مشاركة على لينكدإن'), Icon: Share2 },
                            { label: t('Download as PDF', 'تنزيل كملف PDF'), Icon: Download },
                        ].map((action, i) => (
                            <button
                                key={i}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: '#fff', border: `1px solid ${brand.border}`,
                                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                                    fontSize: 14, fontWeight: 500, color: brand.textPrimary,
                                    transition: 'all .2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.background = brand.primarySurface; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.background = '#fff'; }}
                            >
                                <action.Icon size={18} style={{ color: brand.primary }} />
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom URL */}
                    <div style={{ marginTop: 20, padding: 14, background: brand.primarySurface, borderRadius: 10, border: `1px solid ${brand.primary}22` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{t('Custom Portfolio URL', 'رابط المعرض المخصص')}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{
                                flex: 1, background: '#fff', border: `1px solid ${brand.border}`,
                                borderRadius: 8, padding: '8px 12px', fontSize: 13, color: brand.textSecondary,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>
                                emiratipathway.ae/portfolio/your-name
                            </div>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                            }}>
                                {t('Copy', 'نسخ')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'projects', label: t('My Projects', 'مشاريعي'), icon: <FolderOpen className="h-4 w-4" />, content: projectsTab },
        { id: 'templates', label: t('Templates', 'القوالب'), icon: <Image className="h-4 w-4" />, content: templatesTab },
        { id: 'analytics', label: t('Analytics', 'التحليلات'), icon: <BarChart3 className="h-4 w-4" />, content: analyticsTab },
        { id: 'sharing', label: t('Sharing & Visibility', 'المشاركة والظهور'), icon: <Settings className="h-4 w-4" />, content: sharingTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Professional Portfolio', 'معرض الأعمال الاحترافي')}
            description={t(
                'Showcase your work, projects, and achievements to employers and collaborators worldwide',
                'اعرض أعمالك ومشاريعك وإنجازاتك لأصحاب العمل والمتعاونين حول العالم'
            )}
            icon={<FolderOpen className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="projects"
        />
    );
};

export default PortfolioPage;
