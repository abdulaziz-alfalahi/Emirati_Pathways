
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    ClipboardCheck, Search, Award, Target, Brain,
    TrendingUp, BookOpen, BarChart3, ChevronRight,
    Clock, Star, CheckCircle, Play, Zap, Users,
    Shield, FileText, Trophy
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

const availableAssessments = [
    { title: 'Technical Skills Assessment', category: 'Technical', duration: '45 min', questions: 40, difficulty: 'Intermediate', desc: 'Evaluate your core technical competencies across programming, systems design, and data analysis', Icon: Brain, catBg: brand.purple, catColor: brand.purpleText },
    { title: 'Leadership Aptitude Test', category: 'Leadership', duration: '30 min', questions: 25, difficulty: 'Advanced', desc: 'Assess your leadership style, decision-making, and team management capabilities', Icon: Award, catBg: brand.amber, catColor: brand.amberText },
    { title: 'Communication & Soft Skills', category: 'Soft Skills', duration: '25 min', questions: 30, difficulty: 'Beginner', desc: 'Measure your verbal, written, and interpersonal communication effectiveness', Icon: Users, catBg: brand.blue, catColor: brand.blueText },
    { title: 'Critical Thinking & Problem Solving', category: 'Cognitive', duration: '40 min', questions: 35, difficulty: 'Intermediate', desc: 'Test your analytical reasoning, logical thinking, and creative problem-solving abilities', Icon: Zap, catBg: brand.primarySurface, catColor: brand.primary },
    { title: 'Industry Knowledge — Banking & Finance', category: 'Industry', duration: '35 min', questions: 30, difficulty: 'Advanced', desc: 'Validate your knowledge of UAE banking regulations, financial products, and market dynamics', Icon: Shield, catBg: brand.green, catColor: brand.greenText },
    { title: 'Digital Literacy Assessment', category: 'Digital', duration: '20 min', questions: 20, difficulty: 'Beginner', desc: 'Evaluate your proficiency with digital tools, cloud platforms, and modern workplace technology', Icon: Target, catBg: brand.red, catColor: brand.redText },
];

const inProgress = [
    { title: 'Technical Skills Assessment', progress: 65, questionsCompleted: 26, totalQuestions: 40, timeRemaining: '18 min', startedDate: 'Feb 17, 2026' },
    { title: 'Communication & Soft Skills', progress: 30, questionsCompleted: 9, totalQuestions: 30, timeRemaining: '20 min', startedDate: 'Feb 16, 2026' },
];

const completedAssessments = [
    { title: 'Digital Literacy Assessment', score: 92, date: 'Feb 10, 2026', badge: 'Digital Expert', percentile: 'Top 8%' },
    { title: 'Critical Thinking & Problem Solving', score: 85, date: 'Feb 5, 2026', badge: 'Analytical Thinker', percentile: 'Top 15%' },
    { title: 'Leadership Aptitude Test', score: 78, date: 'Jan 28, 2026', badge: 'Emerging Leader', percentile: 'Top 25%' },
];

const skillScores = [
    { name: 'Problem Solving', score: 88 },
    { name: 'Communication', score: 82 },
    { name: 'Technical Knowledge', score: 76 },
    { name: 'Leadership', score: 78 },
    { name: 'Digital Literacy', score: 92 },
    { name: 'Critical Thinking', score: 85 },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const AssessmentsPage: React.FC = () => {


    const { t } = useTranslation('assessments');
    const stats = [
        { value: t('stats.assessments_value', '500+'), label: t('stats.assessments', 'Assessments'), icon: ClipboardCheck },
        { value: t('stats.completion_rate_value', '92%'), label: t('stats.completion_rate', 'Completion Rate'), icon: TrendingUp },
        { value: t('stats.categories_value', '15+'), label: t('stats.categories', 'Categories'), icon: Target },
        { value: t('stats.access_value', '24/7'), label: t('stats.access', 'Access'), icon: BookOpen },
    ];

    /* ── Tab 1: Available Assessments ── */
    const availableTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Available Assessments
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Choose from 500+ assessments across technical, leadership, cognitive, and industry-specific categories to validate and grow your skills.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {availableAssessments.map((a, i) => (
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
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: a.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <a.Icon size={22} style={{ color: a.catColor }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: a.catBg, color: a.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {a.category}
                                </span>
                                <span style={{
                                    background: a.difficulty === 'Beginner' ? brand.green : a.difficulty === 'Intermediate' ? brand.amber : brand.red,
                                    color: a.difficulty === 'Beginner' ? brand.greenText : a.difficulty === 'Intermediate' ? brand.amberText : brand.redText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                                }}>
                                    {a.difficulty}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{a.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{a.desc}</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {a.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14} /> {a.questions} questions</span>
                        </div>

                        <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: brand.primary, color: '#fff', border: 'none',
                            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto',
                        }}>
                            <Play size={16} /> Start Assessment
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: In Progress & Completed ── */
    const progressTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Progress
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Resume in-progress assessments and review your completed results with badges and percentile rankings.
            </p>

            {/* In Progress */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>In Progress</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {inProgress.map((a, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{a.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                    Started {a.startedDate} · {a.questionsCompleted}/{a.totalQuestions} questions · {a.timeRemaining} remaining
                                </div>
                            </div>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <Play size={14} /> Resume
                            </button>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${a.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, fontSize: 12, color: brand.primary, fontWeight: 600 }}>
                            {a.progress}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>Completed</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completedAssessments.map((a, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: a.score >= 85 ? brand.green : a.score >= 75 ? brand.primarySurface : brand.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trophy size={22} style={{ color: a.score >= 85 ? brand.greenText : a.score >= 75 ? brand.primary : brand.amberText }} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{a.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>Completed {a.date}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {a.badge}
                            </span>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {a.percentile}
                            </span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: a.score >= 85 ? brand.greenText : a.score >= 75 ? brand.primary : brand.amberText }}>
                                {a.score}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Skills Map ── */
    const skillsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Skills Map
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Visualize your competency scores across all assessed skill areas — identify strengths and areas for growth.
            </p>

            {/* Skill Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {skillScores.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: s.score >= 85 ? brand.greenText : s.score >= 75 ? brand.primary : brand.amberText }}>
                                {s.score}%
                            </span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                width: `${s.score}%`, height: '100%', borderRadius: 99,
                                background: s.score >= 85 ? '#22C55E' : s.score >= 75 ? brand.primary : '#F59E0B',
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Overall Summary */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Overall Summary</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                    {[
                        { label: 'Overall Score', value: '83%' },
                        { label: 'Strongest Skill', value: 'Digital Literacy' },
                        { label: 'Assessments Taken', value: '3' },
                        { label: 'Badges Earned', value: '3' },
                    ].map((stat, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: brand.primary }}>{stat.value}</div>
                            <span style={{ fontSize: 12, color: brand.textSecondary }}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 4: Recommendations ── */
    const recsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Growth Recommendations
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Based on your assessment results, here are tailored recommendations to accelerate your professional development.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                    { title: 'Strengthen Technical Skills', desc: 'Your technical score of 76% suggests focusing on cloud architecture and system design — consider the AWS Solutions Architect certification', Icon: Brain, area: 'Technical Knowledge', score: 76 },
                    { title: 'Develop Leadership Presence', desc: 'At 78%, your leadership aptitude shows potential — enroll in our UAE Leadership Excellence program for hands-on coaching', Icon: Award, area: 'Leadership', score: 78 },
                    { title: 'Advance Communication Skills', desc: 'Build on your 82% communication score by joining Toastmasters UAE or taking our Advanced Business Writing course', Icon: Users, area: 'Communication', score: 82 },
                    { title: 'Take the Industry Assessment', desc: 'You haven\'t yet completed an industry-specific assessment — banking & finance or technology sectors are strongly recommended', Icon: Shield, area: 'Industry', score: null },
                ].map((rec, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <rec.Icon size={20} style={{ color: brand.primary }} />
                            </div>
                            {rec.score && (
                                <span style={{ background: rec.score >= 80 ? brand.green : brand.amber, color: rec.score >= 80 ? brand.greenText : brand.amberText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {rec.area}: {rec.score}%
                                </span>
                            )}
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{rec.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{rec.desc}</p>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer', marginTop: 'auto' }}>
                            Take Action <ChevronRight size={14} />
                        </span>
                    </div>
                ))}
            </div>

            {/* Next Steps */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Suggested Next Assessments</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Project Management Fundamentals (30 min)', 'Emotional Intelligence Assessment (25 min)', 'Data Analysis & Visualization (40 min)'].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'available', label: t('tabs.available.label', 'Available'), icon: <Search className="h-4 w-4" />, content: availableTab },
        { id: 'progress', label: t('tabs.progress.label', 'My Progress'), icon: <TrendingUp className="h-4 w-4" />, content: progressTab },
        { id: 'skills', label: t('tabs.skills.label', 'Skills Map'), icon: <Target className="h-4 w-4" />, content: skillsTab },
        { id: 'recommendations', label: t('tabs.recommendations.label', 'Recommendations'), icon: <Star className="h-4 w-4" />, content: recsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Assessments')}
            description={t('description', 'Validate your skills with 500+ assessments across technical, leadership, and cognitive categories — earn badges and track your growth')}
            icon={<ClipboardCheck className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="available"
        />
    );
};

export default AssessmentsPage;
