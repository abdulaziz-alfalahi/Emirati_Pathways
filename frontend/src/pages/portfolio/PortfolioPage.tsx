
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { getPortfolio, addPortfolioProject, type PortfolioProject } from '@/services/careerServicesAPI';
import { skillGraphAPI, type UserSkill } from '@/services/intelligenceAPI';
import {
    FolderOpen, Eye, Image, BarChart3, Share2,
    Briefcase, Code, Palette, GraduationCap, Award,
    Globe, Lock, Link, Mail, Download, Copy,
    TrendingUp, Users, Monitor, Smartphone, Tablet,
    ChevronRight, ChevronLeft, CheckCircle, Settings, Plus, Star,
    Loader2, X
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

/* ── Category → color map ── */
const catColors: Record<string, { bg: string; color: string }> = {
    'Web Development': { bg: brand.blue, color: brand.blueText },
    'Design': { bg: brand.purple, color: brand.purpleText },
    'Data & Analytics': { bg: brand.green, color: brand.greenText },
    'Mobile Development': { bg: brand.amber, color: brand.amberText },
    'Machine Learning': { bg: brand.primarySurface, color: brand.primary },
    'default': { bg: '#F3F4F6', color: brand.textSecondary },
};

/* ── Fallback data ── */
const FALLBACK_PROJECTS = [
    { title: 'E-Commerce Platform', category: 'Web Development', description: 'Full-stack e-commerce solution with payment integration and real-time inventory', skills_demonstrated: ['React', 'Node.js', 'MongoDB'] },
    { title: 'Brand Identity System', category: 'Design', description: 'Complete brand identity including logo, typography, and color system for a UAE startup', skills_demonstrated: ['Figma', 'Illustrator', 'InDesign'] },
    { title: 'Smart City Dashboard', category: 'Data & Analytics', description: 'Real-time IoT dashboard for monitoring urban infrastructure across Dubai', skills_demonstrated: ['Python', 'D3.js', 'PostgreSQL'] },
    { title: 'Mobile Banking App', category: 'Mobile Development', description: 'Fintech mobile application with biometric authentication and digital wallet', skills_demonstrated: ['Flutter', 'Firebase', 'Stripe'] },
    { title: 'AI Content Generator', category: 'Machine Learning', description: 'NLP-based content generator fine-tuned for Arabic and English bilingual output', skills_demonstrated: ['Python', 'TensorFlow', 'FastAPI'] },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const PortfolioPage: React.FC = () => {

    const { i18n } = useTranslation();
    const { user } = useAuth();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ── State ── */
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addingProject, setAddingProject] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '', category: '', skills: '', project_url: '' });

    const verifiedSkillNames = new Set(userSkills.filter(s => s.verified).map(s => s.skill_name.toLowerCase()));
    const allUserSkillNames = new Set(userSkills.map(s => s.skill_name.toLowerCase()));

    useEffect(() => {
        (async () => {
            try {
                const userId = user?.id || '784000000000030';
                const data = await getPortfolio(userId);
                if (data && data.length > 0) {
                    setProjects(data.map((p: PortfolioProject) => ({
                        ...p,
                        tech: Array.isArray(p.skills_demonstrated) ? p.skills_demonstrated
                            : typeof p.skills_demonstrated === 'string'
                                ? JSON.parse(p.skills_demonstrated) : [],
                        catBg: catColors[p.category || '']?.bg || catColors.default.bg,
                        catColor: catColors[p.category || '']?.color || catColors.default.color,
                    })));
                } else {
                    // Use fallback if no projects in DB
                    setProjects(FALLBACK_PROJECTS.map(p => ({
                        ...p,
                        tech: p.skills_demonstrated,
                        catBg: catColors[p.category]?.bg || catColors.default.bg,
                        catColor: catColors[p.category]?.color || catColors.default.color,
                    })));
                }
            } catch (err) {
                console.error('Failed to load portfolio:', err);
                setProjects(FALLBACK_PROJECTS.map(p => ({
                    ...p,
                    tech: p.skills_demonstrated,
                    catBg: catColors[p.category]?.bg || catColors.default.bg,
                    catColor: catColors[p.category]?.color || catColors.default.color,
                })));
            } finally {
                setLoading(false);
            }
        })();
        // Fetch user skills for verification badges (non-blocking)
        (async () => {
            try {
                const skillData = await skillGraphAPI.getUserSkills();
                setUserSkills(skillData.skills || []);
            } catch { /* graceful fallback */ }
        })();
    }, []);

    /* ── Add Project Handler ── */
    const handleAddProject = async () => {
        if (!newProject.title.trim()) return;
        setAddingProject(true);
        try {
            const skillsArr = newProject.skills.split(',').map(s => s.trim()).filter(Boolean);
            const result = await addPortfolioProject({
                title: newProject.title,
                description: newProject.description,
                category: newProject.category || 'Web Development',
                skills_demonstrated: skillsArr,
                project_url: newProject.project_url,
            });
            // Add to local state
            const cat = newProject.category || 'Web Development';
            setProjects(prev => [{
                id: result.project_id,
                title: newProject.title,
                description: newProject.description,
                category: cat,
                tech: skillsArr,
                skills_demonstrated: skillsArr,
                project_url: newProject.project_url,
                catBg: catColors[cat]?.bg || catColors.default.bg,
                catColor: catColors[cat]?.color || catColors.default.color,
            }, ...prev]);
            setShowAddForm(false);
            setNewProject({ title: '', description: '', category: '', skills: '', project_url: '' });
        } catch (err) {
            console.error('Failed to add project:', err);
        } finally {
            setAddingProject(false);
        }
    };

    /* ──────────────────────── DATA ──────────────────────── */

    const templates = [
        { title: t('Creative Showcase', 'العرض الإبداعي'), desc: t('Visual-first layout perfect for designers and artists', 'تصميم بصري أولاً مثالي للمصممين والفنانين'), Icon: Palette, category: t('Design', 'التصميم'), popular: true },
        { title: t('Developer Portfolio', 'معرض المطوّر'), desc: t('Code-oriented layout with GitHub integration and tech stack display', 'تصميم موجّه للبرمجة مع تكامل GitHub وعرض المهارات التقنية'), Icon: Code, category: t('Tech', 'تقنية'), popular: true },
        { title: t('Business Professional', 'الأعمال الاحترافية'), desc: t('Clean, corporate layout highlighting achievements and metrics', 'تصميم مؤسسي أنيق يبرز الإنجازات والمقاييس'), Icon: Briefcase, category: t('Business', 'أعمال'), popular: false },
        { title: t('Academic Research', 'البحث الأكاديمي'), desc: t('Publication-focused layout with citation support and research timeline', 'تصميم يركز على المنشورات مع دعم الاستشهاد والجدول الزمني للبحث'), Icon: GraduationCap, category: t('Academic', 'أكاديمي'), popular: false },
        { title: t('Freelancer Pro', 'المستقل المحترف'), desc: t('Service-oriented layout with testimonials and project timeline', 'تصميم موجّه للخدمات مع شهادات العملاء والجدول الزمني للمشاريع'), Icon: Star, category: t('Freelance', 'عمل حر'), popular: true },
        { title: t('Minimal Resume+', 'السيرة الذاتية المبسّطة+'), desc: t('Extended resume layout with project galleries and skill charts', 'تصميم سيرة ذاتية موسّع مع معارض المشاريع ومخططات المهارات'), Icon: Award, category: t('General', 'عام'), popular: false },
    ];

    const visibilityOptions = [
        { title: t('Public', 'عام'), desc: t('Anyone can view your portfolio via search or direct link', 'يمكن لأي شخص عرض معرض أعمالك عبر البحث أو الرابط المباشر'), Icon: Globe, active: true },
        { title: t('Link Only', 'بالرابط فقط'), desc: t('Only people with the link can view your portfolio', 'فقط من لديه الرابط يمكنه عرض معرض أعمالك'), Icon: Link, active: false },
        { title: t('Password Protected', 'محمي بكلمة مرور'), desc: t('Require a password to access your portfolio', 'يتطلب كلمة مرور للوصول إلى معرض أعمالك'), Icon: Lock, active: false },
    ];

    // Dynamic stats from API data
    const projectCount = projects.length;
    const allTech = new Set(projects.flatMap(p => p.tech || p.skills_demonstrated || []));

    const stats = [
        { value: String(projectCount), label: t('Projects', 'المشاريع'), icon: FolderOpen },
        { value: String(allTech.size), label: t('Technologies', 'التقنيات'), icon: Code },
        { value: '15+', label: t('Templates', 'القوالب'), icon: Image },
        { value: String(userSkills.filter(s => s.verified).length), label: t('Verified Skills', 'مهارات موثقة'), icon: CheckCircle },
    ];

    /* ── Tab 1: My Projects ── */
    const projectsTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    {t('My Projects', 'مشاريعي')}
                </h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: brand.primary, color: '#fff', border: 'none',
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                    }}
                >
                    <Plus size={16} /> {t('Add Project', 'أضف مشروعاً')}
                </button>
            </div>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Showcase your best work — each project tells your professional story to employers and collaborators.',
                    'اعرض أفضل أعمالك — كل مشروع يروي قصتك المهنية لأصحاب العمل والمتعاونين.'
                )}
            </p>

            {/* Add Project Form (inline modal) */}
            {showAddForm && (
                <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${brand.primary}`, padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Add New Project', 'أضف مشروعاً جديداً')}</h3>
                        <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X size={20} style={{ color: brand.textSecondary }} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Title *', 'العنوان *')}</label>
                            <input value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}
                                placeholder={t('Project title', 'عنوان المشروع')} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Category', 'الفئة')}</label>
                            <select value={newProject.category} onChange={e => setNewProject({ ...newProject, category: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}>
                                <option value="">{t('Select...', 'اختر...')}</option>
                                {Object.keys(catColors).filter(k => k !== 'default').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Description', 'الوصف')}</label>
                        <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                            rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                            placeholder={t('Describe your project...', 'وصف المشروع...')} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Technologies (comma separated)', 'التقنيات (مفصولة بفاصلة)')}</label>
                            <input value={newProject.skills} onChange={e => setNewProject({ ...newProject, skills: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}
                                placeholder="React, Node.js, MongoDB" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Project URL', 'رابط المشروع')}</label>
                            <input value={newProject.project_url} onChange={e => setNewProject({ ...newProject, project_url: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}
                                placeholder="https://..." />
                        </div>
                    </div>
                    <button
                        onClick={handleAddProject}
                        disabled={addingProject || !newProject.title.trim()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: (!newProject.title.trim() || addingProject) ? '#9CA3AF' : brand.primary,
                            color: '#fff', border: 'none',
                            padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        {addingProject ? <><Loader2 size={14} className="animate-spin" /> {t('Saving...', 'جارٍ الحفظ...')}</> : <>{t('Save Project', 'حفظ المشروع')}</>}
                    </button>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {projects.map((proj, i) => (
                        <div
                            key={proj.id || i}
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
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>
                                        {(isRTL && proj.title_ar) ? proj.title_ar : proj.title}
                                    </h3>
                                    <span style={{
                                        display: 'inline-block',
                                        background: proj.catBg || catColors.default.bg,
                                        color: proj.catColor || catColors.default.color,
                                        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6
                                    }}>
                                        {proj.category || t('General', 'عام')}
                                    </span>
                                </div>
                                {proj.project_url && (
                                    <a href={proj.project_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                        style={{ color: brand.primary, fontSize: 12 }}>
                                        <Globe size={16} />
                                    </a>
                                )}
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>
                                {(isRTL && proj.description_ar) ? proj.description_ar : (proj.description || proj.desc || '')}
                            </p>

                            {/* Tech Tags — with skill verification badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(proj.tech || proj.skills_demonstrated || []).map((tag: string, j: number) => {
                                    const isVerified = verifiedSkillNames.has(tag.toLowerCase());
                                    const isKnown = allUserSkillNames.has(tag.toLowerCase());
                                    return (
                                        <span key={j} style={{
                                            background: isVerified ? brand.green : isKnown ? brand.blue : brand.primarySurface,
                                            color: isVerified ? brand.greenText : isKnown ? brand.blueText : brand.primary,
                                            fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6,
                                            display: 'inline-flex', alignItems: 'center', gap: 3,
                                        }}>
                                            {tag}
                                            {isVerified && <CheckCircle size={10} />}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Completion date if available */}
                            {proj.completion_date && (
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>
                                    {t('Completed', 'أُنجز')}: {new Date(proj.completion_date).toLocaleDateString()}
                                </div>
                            )}

                            {/* View link */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, marginTop: 'auto' }}>
                                {t('View Project', 'عرض المشروع')} <ChevronIcon size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
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

    /* ── Tab 3: Analytics (dynamic from projects) ── */
    const analyticsMetrics = [
        { label: t('Total Projects', 'إجمالي المشاريع'), value: String(projectCount), Icon: FolderOpen },
        { label: t('Technologies Used', 'التقنيات المستخدمة'), value: String(allTech.size), Icon: Code },
        { label: t('Categories', 'الفئات'), value: String(new Set(projects.map(p => p.category)).size), Icon: BarChart3 },
        { label: t('Verified Skills', 'مهارات موثقة'), value: String(userSkills.filter(s => s.verified).length), Icon: CheckCircle },
    ];

    const categoryBreakdown = Object.entries(
        projects.reduce<Record<string, number>>((acc, p) => {
            const cat = p.category || 'Other';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]);

    const analyticsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Portfolio Analytics', 'تحليلات معرض الأعمال')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Track how your portfolio is performing — see project distribution and skill coverage.",
                    'تتبّع أداء معرض أعمالك — شاهد توزيع المشاريع وتغطية المهارات.'
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
                    </div>
                ))}
            </div>

            {/* Category Breakdown + Tech Coverage */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Projects by Category', 'المشاريع حسب الفئة')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {categoryBreakdown.map(([cat, count], i) => {
                            const pct = Math.round((count / projectCount) * 100);
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                        <span style={{ color: brand.textPrimary, fontWeight: 500 }}>{cat}</span>
                                        <span style={{ color: brand.textSecondary }}>{count} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Technology Coverage', 'تغطية التقنيات')}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {Array.from(allTech).map((tech, i) => {
                            const isVerified = verifiedSkillNames.has(tech.toLowerCase());
                            return (
                                <span key={i} style={{
                                    background: isVerified ? brand.green : brand.primarySurface,
                                    color: isVerified ? brand.greenText : brand.primary,
                                    fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 8,
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                }}>
                                    {tech}
                                    {isVerified && <CheckCircle size={10} />}
                                </span>
                            );
                        })}
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
