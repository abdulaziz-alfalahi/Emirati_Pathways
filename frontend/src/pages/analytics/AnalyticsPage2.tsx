
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    BarChart3, TrendingUp, Target, Award, Users,
    Clock, ChevronRight, Star, CheckCircle, Zap,
    Brain, BookOpen, Briefcase, ArrowUpRight, ArrowDownRight,
    Calendar, Eye, FileText
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

const overviewMetrics = [
    { label: 'Profile Views', value: '1,247', change: '+12%', up: true, Icon: Eye },
    { label: 'Applications Sent', value: '18', change: '+3', up: true, Icon: FileText },
    { label: 'Interview Rate', value: '33%', change: '+5%', up: true, Icon: Users },
    { label: 'Avg. Match Score', value: '87%', change: '+2%', up: true, Icon: Target },
    { label: 'Skills Completed', value: '12', change: '+2', up: true, Icon: Brain },
    { label: 'Certifications', value: '4', change: '+1', up: true, Icon: Award },
];

const weeklyActivity = [
    { day: 'Mon', applications: 3, views: 42 },
    { day: 'Tue', applications: 1, views: 55 },
    { day: 'Wed', applications: 2, views: 38 },
    { day: 'Thu', applications: 4, views: 67 },
    { day: 'Fri', applications: 2, views: 51 },
    { day: 'Sat', applications: 0, views: 22 },
    { day: 'Sun', applications: 1, views: 18 },
];

const topSkills = [
    { name: 'Project Management', level: 92, demand: 'High' },
    { name: 'Data Analysis', level: 85, demand: 'Very High' },
    { name: 'Cloud Architecture', level: 78, demand: 'High' },
    { name: 'Leadership', level: 88, demand: 'Medium' },
    { name: 'Communication', level: 82, demand: 'High' },
];

const careerMilestones = [
    { title: 'Completed Leadership Assessment', date: 'Feb 15, 2026', type: 'Assessment', icon: '🏆' },
    { title: 'Applied to Emirates Group', date: 'Feb 12, 2026', type: 'Application', icon: '📨' },
    { title: 'Earned Digital Literacy Badge', date: 'Feb 10, 2026', type: 'Badge', icon: '🎖️' },
    { title: 'Portfolio viewed by 3 recruiters', date: 'Feb 8, 2026', type: 'Engagement', icon: '👀' },
    { title: 'Completed AWS Cloud Certification', date: 'Feb 5, 2026', type: 'Certification', icon: '📜' },
];

const goalProgress = [
    { title: 'Complete 5 Assessments', current: 3, target: 5, deadline: 'Mar 2026' },
    { title: 'Apply to 20 Positions', current: 18, target: 20, deadline: 'Mar 2026' },
    { title: 'Earn 5 Certifications', current: 4, target: 5, deadline: 'Apr 2026' },
    { title: 'Reach 90% Match Score', current: 87, target: 90, deadline: 'Mar 2026' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const AnalyticsPage: React.FC = () => {


    const { t } = useTranslation('analytics');
    const stats = [
        { value: t('stats.match_score_value', '87%'), label: t('stats.match_score', 'Match Score'), icon: Target },
        { value: t('stats.profile_views_value', '1,247'), label: t('stats.profile_views', 'Profile Views'), icon: Eye },
        { value: t('stats.applications_value', '18'), label: t('stats.applications', 'Applications'), icon: FileText },
        { value: t('stats.interview_rate_value', '33%'), label: t('stats.interview_rate', 'Interview Rate'), icon: TrendingUp },
    ];

    /* ── Tab 1: Overview ── */
    const overviewTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Career Overview
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                A snapshot of your career progress — profile engagement, applications, and growth metrics at a glance.
            </p>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                {overviewMetrics.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <m.Icon size={18} style={{ color: brand.primary }} />
                            </div>
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600,
                                color: m.up ? brand.greenText : brand.redText,
                            }}>
                                {m.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {m.change}
                            </span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{m.value}</div>
                        <span style={{ fontSize: 12, color: brand.textSecondary }}>{m.label}</span>
                    </div>
                ))}
            </div>

            {/* Weekly Activity */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 16px' }}>Weekly Activity</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
                    {weeklyActivity.map((d, i) => {
                        const maxViews = Math.max(...weeklyActivity.map(w => w.views));
                        const barHeight = (d.views / maxViews) * 100;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: brand.textSecondary }}>{d.views}</span>
                                <div style={{ width: '100%', maxWidth: 40, height: `${barHeight}%`, background: brand.primary, borderRadius: '6px 6px 0 0', minHeight: 8, opacity: 0.7 + (barHeight / 300) }} />
                                <span style={{ fontSize: 11, color: brand.textSecondary }}>{d.day}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Milestones */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>Recent Milestones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {careerMilestones.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{m.title}</span>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.date}</div>
                        </div>
                        <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                            {m.type}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Skills Analytics ── */
    const skillsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Skills Analytics
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Detailed breakdown of your skill levels compared to market demand — identify where to invest your learning.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {topSkills.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                                <span style={{
                                    background: s.demand === 'Very High' ? brand.green : s.demand === 'High' ? brand.blue : brand.amber,
                                    color: s.demand === 'Very High' ? brand.greenText : s.demand === 'High' ? brand.blueText : brand.amberText,
                                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                }}>
                                    {s.demand} Demand
                                </span>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: s.level >= 85 ? brand.greenText : s.level >= 75 ? brand.primary : brand.amberText }}>
                                {s.level}%
                            </span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                width: `${s.level}%`, height: '100%', borderRadius: 99,
                                background: s.level >= 85 ? '#22C55E' : s.level >= 75 ? brand.primary : '#F59E0B',
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Skill Insights */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Zap size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Skill Insights</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        'Data Analysis is in very high demand — consider advanced certifications',
                        'Your Project Management score positions you for PM roles in 85% of UAE companies',
                        'Cloud Architecture is trending upward — improving by 10% would unlock senior architect roles',
                    ].map((insight, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{insight}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 3: Goals Progress ── */
    const goalsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Goals Progress
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Track progress toward your career objectives with concrete metrics and deadlines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {goalProgress.map((g, i) => {
                    const pct = Math.round((g.current / g.target) * 100);
                    return (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{g.title}</h4>
                                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: brand.textSecondary }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {g.deadline}</span>
                                        <span>{g.current} / {g.target}</span>
                                    </div>
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 700, color: pct >= 80 ? brand.greenText : pct >= 50 ? brand.primary : brand.amberText }}>{pct}%</span>
                            </div>
                            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#22C55E' : pct >= 50 ? brand.primary : '#F59E0B', borderRadius: 99 }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /* ── Tab 4: Career Insights ── */
    const insightsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Career Insights
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                AI-generated insights based on your career activity, UAE market trends, and peer benchmarks.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                    { title: 'Application Success Rate', desc: 'Your 33% interview conversion is 8% above the UAE average — target 40% by refining your CV summary section', Icon: TrendingUp, stat: '33%', statBg: brand.green, statColor: brand.greenText },
                    { title: 'Profile Visibility', desc: 'Your profile was viewed 1,247 times this month — 23% more than last month. Peak views are on weekdays between 9-11 AM', Icon: Eye, stat: '+23%', statBg: brand.blue, statColor: brand.blueText },
                    { title: 'Market Positioning', desc: 'Your skill set aligns with 47 active job postings in the UAE — focus on cloud certifications to unlock 12 more', Icon: Briefcase, stat: '47 matches', statBg: brand.primarySurface, statColor: brand.primary },
                    { title: 'Peer Comparison', desc: 'You rank in the top 15% of candidates in your experience bracket — your leadership score is pulling the average up', Icon: Users, stat: 'Top 15%', statBg: brand.purple, statColor: brand.purpleText },
                ].map((insight, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <insight.Icon size={20} style={{ color: brand.primary }} />
                            </div>
                            <span style={{ background: insight.statBg, color: insight.statColor, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
                                {insight.stat}
                            </span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{insight.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{insight.desc}</p>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer', marginTop: 'auto' }}>
                            View Details <ChevronRight size={14} />
                        </span>
                    </div>
                ))}
            </div>

            {/* Recommendations summary */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Star size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Quick Wins</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        'Add 2 more project case studies to your portfolio to boost recruiter engagement',
                        'Complete the remaining AWS certification to reach your 5-cert goal',
                        'Apply to 2 more positions this week to hit your monthly target',
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'overview', label: t('tabs.overview.label', 'Overview'), icon: <BarChart3 className="h-4 w-4" />, content: overviewTab },
        { id: 'skills', label: t('tabs.skills.label', 'Skills Analytics'), icon: <Brain className="h-4 w-4" />, content: skillsTab },
        { id: 'goals', label: t('tabs.goals.label', 'Goals Progress'), icon: <Target className="h-4 w-4" />, content: goalsTab },
        { id: 'insights', label: t('tabs.insights.label', 'Career Insights'), icon: <TrendingUp className="h-4 w-4" />, content: insightsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Analytics')}
            description={t('description', 'Track your career growth with real-time metrics, skill analytics, goal progress, and AI-powered insights tailored to the UAE market')}
            icon={<BarChart3 className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="overview"
        />
    );
};

export default AnalyticsPage;
