
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    getPortfolioWithMeta, addPortfolioProject, updatePortfolioProject,
    getPortfolioTemplates, setPortfolioTemplate,
    getAvailability, setAvailability,
    type PortfolioProject, type PortfolioTemplate, type AvailabilityStatus,
} from '@/services/careerServicesAPI';
import { skillGraphAPI, type UserSkill } from '@/services/intelligenceAPI';
import {
    FolderOpen, Eye, Image, BarChart3,
    Briefcase, Code, Palette, GraduationCap, Award,
    Globe, Lock, Mail, Download,
    TrendingUp, CheckCircle, Settings, Plus, Star,
    Loader2, X, Cpu, Factory, Leaf, Landmark, Ship, Rocket, Activity, Target,
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

/* Template icon-name (stored in DB) → lucide component. */
const TPL_ICONS: Record<string, React.ComponentType<any>> = {
    Cpu, Factory, Leaf, Landmark, Ship, Palette, Rocket, Activity, Briefcase, Code, Star,
};

/* Fabricated FALLBACK_PROJECTS removed (data-honesty audit) — an empty portfolio
   must render an honest empty state, never invented projects as the user's own. */

/* ──────────────────────── COMPONENT ──────────────────────── */

const PortfolioPage: React.FC = () => {

    const { i18n } = useTranslation();
    const { user } = useAuth();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    /* ── State ── */
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);

    // Add / edit project form
    const emptyForm = { title: '', description: '', category: '', skills: '', project_url: '' };
    const [showAddForm, setShowAddForm] = useState(false);
    const [addingProject, setAddingProject] = useState(false);
    const [newProject, setNewProject] = useState(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editProject, setEditProject] = useState(emptyForm);
    const [savingEdit, setSavingEdit] = useState(false);

    // D33 templates
    const [templates, setTemplates] = useState<PortfolioTemplate[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<PortfolioTemplate | null>(null);
    const [applyingKey, setApplyingKey] = useState<string | null>(null);
    const [previewKey, setPreviewKey] = useState<string | null>(null);

    // Visibility (drives recruiter + portfolio view)
    const [availability, setAvailabilityState] = useState<AvailabilityStatus>('job_seeking');
    const [savingAvailability, setSavingAvailability] = useState(false);

    const verifiedSkillNames = new Set(userSkills.filter(s => s.verified).map(s => s.skill_name.toLowerCase()));
    const allUserSkillNames = new Set(userSkills.map(s => s.skill_name.toLowerCase()));
    const pick = (l?: { en: string; ar: string }) => l ? (isRTL ? l.ar : l.en) : '';

    const mapProject = (p: PortfolioProject) => ({
        ...p,
        tech: Array.isArray(p.skills_demonstrated) ? p.skills_demonstrated
            : typeof p.skills_demonstrated === 'string'
                ? (() => { try { return JSON.parse(p.skills_demonstrated as string); } catch { return []; } })() : [],
        catBg: catColors[p.category || '']?.bg || catColors.default.bg,
        catColor: catColors[p.category || '']?.color || catColors.default.color,
    });

    useEffect(() => {
        const userId = user?.id || '784000000000030';
        (async () => {
            try {
                const meta = await getPortfolioWithMeta(userId);
                setProjects((meta.projects || []).map(mapProject));
                setActiveTemplate(meta.template || null);
            } catch (err) {
                console.error('Failed to load portfolio:', err);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        })();
        (async () => {
            try { setTemplates(await getPortfolioTemplates()); } catch { /* graceful */ }
        })();
        (async () => {
            try { setAvailabilityState(await getAvailability()); } catch { /* graceful */ }
        })();
        (async () => {
            try {
                const skillData = await skillGraphAPI.getUserSkills();
                setUserSkills(skillData.skills || []);
            } catch { /* graceful fallback */ }
        })();
    }, [user?.id]);

    /* ── Add Project ── */
    const handleAddProject = async () => {
        if (!newProject.title.trim()) return;
        setAddingProject(true);
        try {
            const skillsArr = newProject.skills.split(',').map(s => s.trim()).filter(Boolean);
            const cat = newProject.category || 'Web Development';
            const result = await addPortfolioProject({
                title: newProject.title,
                description: newProject.description,
                category: cat,
                skills_demonstrated: skillsArr,
                project_url: newProject.project_url,
            });
            setProjects(prev => [mapProject({
                id: result.project_id,
                title: newProject.title,
                description: newProject.description,
                category: cat,
                skills_demonstrated: skillsArr,
                project_url: newProject.project_url,
            } as PortfolioProject), ...prev]);
            setShowAddForm(false);
            setNewProject(emptyForm);
        } catch (err) {
            console.error('Failed to add project:', err);
        } finally {
            setAddingProject(false);
        }
    };

    /* ── Edit Project (backend PUT /portfolio/projects/<id>) ── */
    const openEdit = (proj: any) => {
        setEditingId(proj.id);
        setEditProject({
            title: proj.title || '',
            description: proj.description || '',
            category: proj.category || '',
            skills: (proj.tech || proj.skills_demonstrated || []).join(', '),
            project_url: proj.project_url || '',
        });
    };
    const handleUpdateProject = async () => {
        if (editingId == null || !editProject.title.trim()) return;
        setSavingEdit(true);
        try {
            const skillsArr = editProject.skills.split(',').map(s => s.trim()).filter(Boolean);
            const cat = editProject.category || 'Web Development';
            await updatePortfolioProject(editingId, {
                title: editProject.title,
                description: editProject.description,
                category: cat,
                skills_demonstrated: skillsArr,
                project_url: editProject.project_url,
            });
            setProjects(prev => prev.map(p => p.id === editingId ? mapProject({
                ...p,
                title: editProject.title,
                description: editProject.description,
                category: cat,
                skills_demonstrated: skillsArr,
                project_url: editProject.project_url,
            } as PortfolioProject) : p));
            setEditingId(null);
        } catch (err) {
            console.error('Failed to update project:', err);
        } finally {
            setSavingEdit(false);
        }
    };

    /* ── Apply / clear a D33 template ── */
    const handleApplyTemplate = async (key: string) => {
        setApplyingKey(key);
        try {
            const clearing = activeTemplate?.key === key;
            const tpl = await setPortfolioTemplate(clearing ? null : key);
            setActiveTemplate(tpl);
        } catch (err) {
            console.error('Failed to apply template:', err);
        } finally {
            setApplyingKey(null);
        }
    };

    /* ── Change visibility (real: PUT /api/profile/availability) ── */
    const handleSetAvailability = async (status: AvailabilityStatus) => {
        if (status === availability) return;
        setSavingAvailability(true);
        try {
            setAvailabilityState(await setAvailability(status));
        } catch (err) {
            console.error('Failed to set visibility:', err);
        } finally {
            setSavingAvailability(false);
        }
    };

    /* ──────────────────────── DERIVED DATA ──────────────────────── */

    const projectCount = projects.length;
    const allTech = new Set(projects.flatMap(p => p.tech || p.skills_demonstrated || []));

    // Category options for the forms: base set + the active template's recommended ones.
    const categoryOptions = Array.from(new Set([
        ...Object.keys(catColors).filter(k => k !== 'default'),
        ...(activeTemplate?.recommended_categories || []).map(c => c.en),
    ]));

    const stats = [
        { value: String(projectCount), label: t('Projects', 'المشاريع'), icon: FolderOpen },
        { value: String(allTech.size), label: t('Technologies', 'التقنيات'), icon: Code },
        { value: String(templates.length), label: t('D33 Templates', 'قوالب D33'), icon: Target },
        { value: String(userSkills.filter(s => s.verified).length), label: t('Verified Skills', 'مهارات موثقة'), icon: CheckCircle },
    ];

    /* ── Reusable project form fields ── */
    const projectFormFields = (
        values: typeof emptyForm,
        setValues: (v: typeof emptyForm) => void,
    ) => (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Title *', 'العنوان *')}</label>
                    <input value={values.title} onChange={e => setValues({ ...values, title: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}
                        placeholder={t('Project title', 'عنوان المشروع')} />
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Category', 'الفئة')}</label>
                    <select value={values.category} onChange={e => setValues({ ...values, category: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}>
                        <option value="">{t('Select...', 'اختر...')}</option>
                        {categoryOptions.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                </div>
            </div>
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Description', 'الوصف')}</label>
                <textarea value={values.description} onChange={e => setValues({ ...values, description: e.target.value })}
                    rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder={t('Describe your project...', 'وصف المشروع...')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Technologies (comma separated)', 'التقنيات (مفصولة بفاصلة)')}</label>
                    <input value={values.skills} onChange={e => setValues({ ...values, skills: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}
                        placeholder="React, Node.js, MongoDB" />
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 4 }}>{t('Project URL', 'رابط المشروع')}</label>
                    <input value={values.project_url} onChange={e => setValues({ ...values, project_url: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }}
                        placeholder="https://..." />
                </div>
            </div>
        </>
    );

    /* ── Tab 1: My Projects ── */
    const projectsTab = (
        <div>
            {/* Active template guidance banner */}
            {activeTemplate && (
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${activeTemplate.accent_color}`, borderInlineStartWidth: 5, padding: 18, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Target size={16} style={{ color: activeTemplate.accent_color }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: brand.textPrimary }}>
                            {t('Framed for', 'موجّه نحو')} {isRTL ? (activeTemplate.d33_lever_ar || activeTemplate.d33_lever) : activeTemplate.d33_lever}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: activeTemplate.accent_color, background: `${activeTemplate.accent_color}18`, padding: '2px 8px', borderRadius: 99 }}>
                            D33
                        </span>
                    </div>
                    {(activeTemplate.recommended_categories?.length > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            {activeTemplate.recommended_categories.map((c, i) => (
                                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: activeTemplate.accent_color, background: `${activeTemplate.accent_color}14`, padding: '3px 10px', borderRadius: 6 }}>
                                    {pick(c)}
                                </span>
                            ))}
                        </div>
                    )}
                    {(activeTemplate.guidance?.length > 0) && (
                        <ul style={{ margin: 0, paddingInlineStart: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {activeTemplate.guidance.map((g, i) => (
                                <li key={i} style={{ fontSize: 12.5, color: brand.textSecondary, lineHeight: 1.5 }}>{pick(g)}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    {t('My Projects', 'مشاريعي')}
                </h2>
                <button
                    onClick={() => { setShowAddForm(true); setEditingId(null); }}
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

            {/* Add Project Form (inline) */}
            {showAddForm && (
                <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${brand.primary}`, padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Add New Project', 'أضف مشروعاً جديداً')}</h3>
                        <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X size={20} style={{ color: brand.textSecondary }} />
                        </button>
                    </div>
                    {projectFormFields(newProject, setNewProject)}
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

            {/* Edit Project Form (inline) */}
            {editingId != null && (
                <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${brand.primaryDark}`, padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Edit Project', 'تعديل المشروع')}</h3>
                        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X size={20} style={{ color: brand.textSecondary }} />
                        </button>
                    </div>
                    {projectFormFields(editProject, setEditProject)}
                    <button
                        onClick={handleUpdateProject}
                        disabled={savingEdit || !editProject.title.trim()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: (!editProject.title.trim() || savingEdit) ? '#9CA3AF' : brand.primary,
                            color: '#fff', border: 'none',
                            padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        {savingEdit ? <><Loader2 size={14} className="animate-spin" /> {t('Saving...', 'جارٍ الحفظ...')}</> : <>{t('Save Changes', 'حفظ التغييرات')}</>}
                    </button>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                </div>
            ) : projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: brand.textSecondary, background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}` }}>
                    {t('No projects in your portfolio yet. Add your first project to get started.', 'لا توجد مشاريع في ملفك بعد. أضف أول مشروع للبدء.')}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {projects.map((proj, i) => (
                        <div
                            key={proj.id || i}
                            onClick={() => openEdit(proj)}
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

                            {/* Edit affordance (opens the edit form; backend PUT /portfolio/projects/<id>) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, marginTop: 'auto' }}>
                                <Settings size={13} /> {t('Edit Project', 'تعديل المشروع')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── Tab 2: Templates (real, D33 economic levers) ── */
    const templatesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Portfolio Templates — D33 Economic Levers', 'قوالب معرض الأعمال — محاور D33 الاقتصادية')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Frame your portfolio toward a priority sector of the Dubai Economic Agenda (D33). Applying a template tailors the recommended categories, highlighted skills and guidance on your projects — your work stays exactly as you entered it.',
                    'وجّه معرض أعمالك نحو قطاع ذي أولوية في أجندة دبي الاقتصادية (D33). تطبيق القالب يخصّص الفئات المقترحة والمهارات المميزة والإرشادات على مشاريعك — وتبقى أعمالك كما أدخلتها تماماً.'
                )}
            </p>

            {templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {templates.map((tpl) => {
                        const Icon = TPL_ICONS[tpl.icon] || Briefcase;
                        const isActive = activeTemplate?.key === tpl.key;
                        const isPreview = previewKey === tpl.key;
                        const busy = applyingKey === tpl.key;
                        return (
                            <div
                                key={tpl.key}
                                style={{
                                    background: '#fff', borderRadius: 12,
                                    border: `1px solid ${isActive ? tpl.accent_color : brand.border}`,
                                    boxShadow: isActive ? `0 0 0 1px ${tpl.accent_color}` : 'none',
                                    padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                                }}
                            >
                                {/* Icon + D33 lever tag */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${tpl.accent_color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={24} style={{ color: tpl.accent_color }} />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: tpl.accent_color, background: `${tpl.accent_color}14`, padding: '4px 10px', borderRadius: 99 }}>
                                        {t('D33 LEVER', 'محور D33')}
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                                        {isRTL ? (tpl.name_ar || tpl.name) : tpl.name}
                                    </h3>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: tpl.accent_color }}>
                                        {isRTL ? (tpl.d33_lever_ar || tpl.d33_lever) : tpl.d33_lever}
                                    </span>
                                </div>

                                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>
                                    {isRTL ? (tpl.description_ar || tpl.description) : tpl.description}
                                </p>

                                {/* Highlighted skills */}
                                {tpl.highlighted_skills?.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {tpl.highlighted_skills.slice(0, 6).map((s, j) => (
                                            <span key={j} style={{ fontSize: 11, fontWeight: 500, color: brand.textSecondary, background: '#F3F4F6', padding: '3px 10px', borderRadius: 6 }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Inline preview: sections + guidance */}
                                {isPreview && (
                                    <div style={{ background: brand.primarySurface, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: brand.textPrimary, marginBottom: 6 }}>{t('Suggested sections', 'الأقسام المقترحة')}</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {(tpl.sections || []).map((sec, j) => (
                                                    <span key={j} style={{ fontSize: 11, fontWeight: 600, color: tpl.accent_color, background: '#fff', border: `1px solid ${tpl.accent_color}33`, padding: '3px 10px', borderRadius: 6 }}>
                                                        {pick(sec)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {(tpl.guidance?.length > 0) && (
                                            <ul style={{ margin: 0, paddingInlineStart: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {tpl.guidance.map((g, j) => (
                                                    <li key={j} style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.5 }}>{pick(g)}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                    <button
                                        onClick={() => handleApplyTemplate(tpl.key)}
                                        disabled={busy}
                                        title={isActive ? t('Click to remove this template', 'اضغط لإزالة هذا القالب') : ''}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            background: isActive ? '#fff' : tpl.accent_color,
                                            color: isActive ? tpl.accent_color : '#fff',
                                            border: isActive ? `1px solid ${tpl.accent_color}` : 'none',
                                            padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        {busy ? <Loader2 size={14} className="animate-spin" />
                                            : isActive ? <><CheckCircle size={15} /> {t('Applied', 'مُطبّق')}</>
                                                : t('Apply Template', 'تطبيق القالب')}
                                    </button>
                                    <button
                                        onClick={() => setPreviewKey(isPreview ? null : tpl.key)}
                                        title={t('Preview', 'معاينة')}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`,
                                            padding: '8px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer'
                                        }}>
                                        <Eye size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
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

            {projectCount === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary, background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}` }}>
                    {t('Add projects to see your portfolio analytics.', 'أضف مشاريع لرؤية تحليلات معرض أعمالك.')}
                </div>
            ) : (
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
                                const isVerified = verifiedSkillNames.has((tech as string).toLowerCase());
                                return (
                                    <span key={i} style={{
                                        background: isVerified ? brand.green : brand.primarySurface,
                                        color: isVerified ? brand.greenText : brand.primary,
                                        fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 8,
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                    }}>
                                        {tech as string}
                                        {isVerified && <CheckCircle size={10} />}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    /* ── Tab 4: Sharing & Visibility ── */
    const visibilityOptions: { status: AvailabilityStatus; title: string; desc: string; Icon: React.ComponentType<any> }[] = [
        { status: 'job_seeking', title: t('Actively Job Seeking', 'أبحث عن عمل بنشاط'), desc: t('Your portfolio is visible to recruiters searching for candidates.', 'معرض أعمالك ظاهر لمسؤولي التوظيف الباحثين عن مرشحين.'), Icon: Globe },
        { status: 'open_to_opportunities', title: t('Open to Opportunities', 'منفتح على الفرص'), desc: t("Visible to recruiters — signals you're open but not urgently searching.", 'ظاهر لمسؤولي التوظيف — يشير إلى انفتاحك دون بحث عاجل.'), Icon: Eye },
        { status: 'not_visible', title: t('Hidden', 'مخفي'), desc: t('Your portfolio is hidden from recruiters and other viewers. Only you can see it.', 'معرض أعمالك مخفي عن مسؤولي التوظيف والآخرين. أنت وحدك تراه.'), Icon: Lock },
    ];

    const shareByEmail = () => {
        const subject = encodeURIComponent(t('My Professional Portfolio', 'معرض أعمالي المهني'));
        const summary = t(
            `Take a look at my professional portfolio on Emirati Pathways — ${projectCount} project(s) across ${new Set(projects.map(p => p.category)).size} categor(y/ies).`,
            `اطّلع على معرض أعمالي المهني على منصة مسارات إماراتية — ${projectCount} مشروعاً ضمن ${new Set(projects.map(p => p.category)).size} فئة.`
        );
        window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(summary)}`;
    };

    const sharingTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Sharing & Visibility', 'المشاركة والظهور')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "Control whether recruiters can discover your portfolio, and export it to share directly.",
                    'تحكّم بما إذا كان بإمكان مسؤولي التوظيف اكتشاف معرض أعمالك، وصدّره لمشاركته مباشرة.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {/* Visibility — real, backed by availability_status */}
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Visibility', 'الظهور')}</h3>
                        {savingAvailability && <Loader2 size={14} className="animate-spin" style={{ color: brand.primary }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {visibilityOptions.map((opt) => {
                            const active = availability === opt.status;
                            return (
                                <div
                                    key={opt.status}
                                    onClick={() => handleSetAvailability(opt.status)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: 14, borderRadius: 10,
                                        border: `1px solid ${active ? brand.primary : brand.border}`,
                                        background: active ? brand.primarySurface : '#fff',
                                        cursor: savingAvailability ? 'wait' : 'pointer', transition: 'all .2s',
                                        opacity: savingAvailability && !active ? 0.6 : 1,
                                    }}
                                >
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: active ? brand.primary : '#F3F4F6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <opt.Icon size={20} style={{ color: active ? '#fff' : brand.textSecondary }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{opt.title}</div>
                                        <div style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.4 }}>{opt.desc}</div>
                                    </div>
                                    {active && <CheckCircle size={20} style={{ color: brand.primary }} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Export — only genuinely working actions */}
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Export & Share', 'التصدير والمشاركة')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { label: t('Print / Save as PDF', 'طباعة / حفظ PDF'), Icon: Download, onClick: () => window.print() },
                            { label: t('Share via Email', 'مشاركة عبر البريد'), Icon: Mail, onClick: shareByEmail },
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={action.onClick}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: '#fff', border: `1px solid ${brand.border}`,
                                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                                    fontSize: 14, fontWeight: 500, color: brand.textPrimary, transition: 'all .2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.background = brand.primarySurface; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.background = '#fff'; }}
                            >
                                <action.Icon size={18} style={{ color: brand.primary }} />
                                {action.label}
                            </button>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.5, marginTop: 16, marginBottom: 0 }}>
                        {t(
                            'A public shareable portfolio link is on the roadmap. For now, recruiters discover your portfolio through search when your visibility is on.',
                            'رابط معرض عام قابل للمشاركة قيد التطوير. حالياً يكتشف مسؤولو التوظيف معرضك عبر البحث عندما يكون ظهورك مفعّلاً.'
                        )}
                    </p>
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
