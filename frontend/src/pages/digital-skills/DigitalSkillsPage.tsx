
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Code, BookOpen, Users, TrendingUp, Target,
    Zap, ChevronRight, Clock, Star, CheckCircle,
    Play, Monitor, Cloud, Shield, Globe,
    Award, BarChart3, Layers, Cpu
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

/* ──────────────────────── DATA ──────────────────────── */

const courses = [
    { title: 'Cloud Computing Fundamentals', category: 'Cloud', level: 'Beginner', duration: '6 weeks', modules: 12, enrolled: 2400, rating: 4.8, Icon: Cloud, catBg: brand.blue, catColor: brand.blueText },
    { title: 'Full-Stack Web Development', category: 'Development', level: 'Intermediate', duration: '12 weeks', modules: 24, enrolled: 1800, rating: 4.9, Icon: Code, catBg: brand.purple, catColor: brand.purpleText },
    { title: 'Cybersecurity Essentials', category: 'Security', level: 'Intermediate', duration: '8 weeks', modules: 16, enrolled: 1500, rating: 4.7, Icon: Shield, catBg: brand.red, catColor: brand.redText },
    { title: 'Data Science & Machine Learning', category: 'AI/ML', level: 'Advanced', duration: '10 weeks', modules: 20, enrolled: 2100, rating: 4.8, Icon: Cpu, catBg: brand.green, catColor: brand.greenText },
    { title: 'UI/UX Design Masterclass', category: 'Design', level: 'Beginner', duration: '8 weeks', modules: 14, enrolled: 1200, rating: 4.6, Icon: Layers, catBg: brand.amber, catColor: brand.amberText },
    { title: 'Digital Marketing & Analytics', category: 'Marketing', level: 'Beginner', duration: '6 weeks', modules: 10, enrolled: 3200, rating: 4.7, Icon: Globe, catBg: brand.primarySurface, catColor: brand.primary },
];

const learningPaths = [
    { title: 'Cloud Architect Track', courses: 5, duration: '6 months', progress: 40, skills: ['AWS', 'Azure', 'Terraform', 'Docker'], Icon: Cloud },
    { title: 'Full-Stack Developer Track', courses: 6, duration: '8 months', progress: 25, skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'], Icon: Code },
    { title: 'AI & Data Science Track', courses: 5, duration: '7 months', progress: 0, skills: ['Python', 'TensorFlow', 'SQL', 'Pandas'], Icon: Cpu },
];

const myProgress = [
    { course: 'Cloud Computing Fundamentals', progress: 72, modulesCompleted: 9, totalModules: 12, lastAccessed: 'Today' },
    { course: 'Cybersecurity Essentials', progress: 45, modulesCompleted: 7, totalModules: 16, lastAccessed: 'Yesterday' },
];

const skills = [
    { name: 'Python', level: 85, category: 'Programming' },
    { name: 'Cloud (AWS)', level: 72, category: 'Infrastructure' },
    { name: 'JavaScript', level: 78, category: 'Programming' },
    { name: 'SQL', level: 80, category: 'Data' },
    { name: 'Cybersecurity', level: 45, category: 'Security' },
    { name: 'UI/UX Design', level: 35, category: 'Design' },
];

const certifications = [
    { title: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', earned: 'Jan 2026', badge: '☁️' },
    { title: 'Google Data Analytics', issuer: 'Google', earned: 'Dec 2025', badge: '📊' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const DigitalSkillsPage: React.FC = () => {
    const { t } = useTranslation('digital-skills-development');

    const stats = [
        { value: t('stats.courses', '300+'), label: t('stats.coursesLabel', 'Courses'), icon: BookOpen },
        { value: t('stats.learners', '15,000+'), label: t('stats.learnersLabel', 'Learners'), icon: Users },
        { value: t('stats.tracks', '12'), label: t('stats.tracksLabel', 'Skill Tracks'), icon: TrendingUp },
        { value: t('stats.completion', '92%'), label: t('stats.completionLabel', 'Completion'), icon: Target },
    ];

    /* ── Tab 1: Course Catalog ── */
    const catalogTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('tabs.catalog.label', 'Course Catalog')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('tabs.catalog.description', 'Browse 300+ courses across cloud computing, development, cybersecurity, AI, design, and digital marketing — all aligned with UAE industry demands.')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {courses.map((c, i) => (
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
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: c.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <c.Icon size={22} style={{ color: c.catColor }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: c.catBg, color: c.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {c.category}
                                </span>
                                <span style={{
                                    background: c.level === 'Beginner' ? brand.green : c.level === 'Intermediate' ? brand.amber : brand.red,
                                    color: c.level === 'Beginner' ? brand.greenText : c.level === 'Intermediate' ? brand.amberText : brand.redText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                                }}>
                                    {c.level}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {c.duration}</span>
                                <span>{c.modules} {t('modules', 'modules')}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {c.rating}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: 12, color: brand.textSecondary }}>{c.enrolled.toLocaleString()} {t('enrolled', 'enrolled')}</span>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <Play size={14} /> {t('btn_enroll', 'Enroll')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Learning Paths ── */
    const pathsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('tabs.paths.label', 'Learning Paths')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('tabs.paths.description', 'Follow structured multi-course tracks designed by industry experts to take you from beginner to job-ready.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {learningPaths.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p.Icon size={22} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{p.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.courses} courses · {p.duration}</div>
                                </div>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: p.progress > 0 ? brand.primary : brand.textSecondary }}>{p.progress}%</span>
                        </div>

                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {p.skills.map((s, j) => (
                                    <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <button style={{
                                background: p.progress > 0 ? brand.primary : '#fff',
                                color: p.progress > 0 ? '#fff' : brand.primary,
                                border: p.progress > 0 ? 'none' : `1px solid ${brand.primary}`,
                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                                {p.progress > 0 ? t('btn_continue', 'Continue') : t('btn_start_path', 'Start Path')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: My Progress ── */
    const progressTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('tabs.progress.label', 'My Progress')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('tabs.progress.description', 'Track your active courses, skill levels, and earned certifications in one place.')}
            </p>

            {/* Active Courses */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('active_courses', 'Active Courses')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {myProgress.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{p.course}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                    {p.modulesCompleted}/{p.totalModules} modules · Last accessed {p.lastAccessed}
                                </div>
                            </div>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <Play size={14} /> {t('btn_resume', 'Resume')}
                            </button>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, fontSize: 12, color: brand.primary, fontWeight: 600 }}>
                            {p.progress}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Skills Overview */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('skills_overview', 'Skills Overview')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 28 }}>
                {skills.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                                    {s.category}
                                </span>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: s.level >= 75 ? brand.greenText : s.level >= 50 ? brand.primary : brand.amberText }}>
                                {s.level}%
                            </span>
                        </div>
                        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                width: `${s.level}%`, height: '100%', borderRadius: 99,
                                background: s.level >= 75 ? '#22C55E' : s.level >= 50 ? brand.primary : '#F59E0B',
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Certifications */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('earned_certifications', 'Earned Certifications')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {certifications.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{c.badge}</span>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{c.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · Earned {c.earned}</div>
                        </div>
                        <Award size={20} style={{ color: brand.primary }} />
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Practice Lab ── */
    const labTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('tabs.lab.label', 'Practice Lab')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('tabs.lab.description', 'Hands-on coding environments and real-world project exercises — practice what you learn in a safe sandbox.')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {[
                    { title: 'Build a REST API', desc: 'Design and implement a RESTful API with Node.js and Express — includes database integration and authentication', difficulty: 'Intermediate', time: '2 hours', Icon: Code, catBg: brand.purple, catColor: brand.purpleText },
                    { title: 'Deploy to AWS', desc: 'Launch a full-stack application on AWS using EC2, S3, and RDS — practice infrastructure as code with Terraform', difficulty: 'Advanced', time: '3 hours', Icon: Cloud, catBg: brand.blue, catColor: brand.blueText },
                    { title: 'Security Audit Lab', desc: 'Perform a security audit on a sample web application — identify vulnerabilities and implement fixes', difficulty: 'Intermediate', time: '2 hours', Icon: Shield, catBg: brand.red, catColor: brand.redText },
                    { title: 'ML Model Training', desc: 'Train and deploy a machine learning model using Python, scikit-learn, and TensorFlow on a real dataset', difficulty: 'Advanced', time: '4 hours', Icon: Cpu, catBg: brand.green, catColor: brand.greenText },
                    { title: 'Responsive Design Challenge', desc: 'Build a pixel-perfect responsive landing page from a Figma mockup using HTML, CSS, and JavaScript', difficulty: 'Beginner', time: '1.5 hours', Icon: Monitor, catBg: brand.amber, catColor: brand.amberText },
                    { title: 'Data Pipeline Project', desc: 'Create an ETL pipeline that ingests, transforms, and visualizes real UAE government open data', difficulty: 'Intermediate', time: '3 hours', Icon: BarChart3, catBg: brand.primarySurface, catColor: brand.primary },
                ].map((lab, i) => (
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
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: lab.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <lab.Icon size={20} style={{ color: lab.catColor }} />
                            </div>
                            <span style={{
                                background: lab.difficulty === 'Beginner' ? brand.green : lab.difficulty === 'Intermediate' ? brand.amber : brand.red,
                                color: lab.difficulty === 'Beginner' ? brand.greenText : lab.difficulty === 'Intermediate' ? brand.amberText : brand.redText,
                                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                            }}>
                                {lab.difficulty}
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{lab.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{lab.desc}</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}><Clock size={14} /> {lab.time}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                {t('btn_launch_lab', 'Launch Lab')} <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'catalog', label: t('tabs.catalog.label', 'Course Catalog'), icon: <BookOpen className="h-4 w-4" />, content: catalogTab },
        { id: 'paths', label: t('tabs.paths.label', 'Learning Paths'), icon: <TrendingUp className="h-4 w-4" />, content: pathsTab },
        { id: 'progress', label: t('tabs.progress.label', 'My Progress'), icon: <BarChart3 className="h-4 w-4" />, content: progressTab },
        { id: 'lab', label: t('tabs.lab.label', 'Practice Lab'), icon: <Code className="h-4 w-4" />, content: labTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Digital Skills Development')}
            description={t('description', 'Build future-ready technology skills through 300+ courses, structured learning paths, hands-on labs, and industry-recognized certifications')}
            icon={<Code className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="catalog"
        />
    );
};

export default DigitalSkillsPage;
