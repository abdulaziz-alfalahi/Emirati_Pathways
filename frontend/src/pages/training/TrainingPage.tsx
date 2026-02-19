
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    GraduationCap, BookOpen, Users, TrendingUp,
    Clock, Star, CheckCircle, Play, Calendar,
    Award, Building, MapPin, Briefcase, ChevronRight,
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

/* ──────────────────────── DATA ──────────────────────── */

const programs = [
    { title: 'UAE Government Leadership Program', provider: 'Mohammed Bin Rashid Centre', duration: '12 weeks', format: 'Hybrid', spots: 30, enrolled: 24, rating: 4.9, category: 'Leadership', location: 'Abu Dhabi', catBg: brand.purple, catColor: brand.purpleText },
    { title: 'Fintech Innovation Bootcamp', provider: 'Abu Dhabi Global Market', duration: '8 weeks', format: 'In-Person', spots: 25, enrolled: 18, rating: 4.8, category: 'Finance', location: 'Abu Dhabi', catBg: brand.green, catColor: brand.greenText },
    { title: 'Smart City Technologies Workshop', provider: 'Dubai Future Foundation', duration: '6 weeks', format: 'Online', spots: 50, enrolled: 42, rating: 4.7, category: 'Technology', location: 'Dubai', catBg: brand.blue, catColor: brand.blueText },
    { title: 'Oil & Gas Digital Transformation', provider: 'ADNOC Academy', duration: '10 weeks', format: 'Hybrid', spots: 20, enrolled: 15, rating: 4.8, category: 'Energy', location: 'Abu Dhabi', catBg: brand.amber, catColor: brand.amberText },
    { title: 'Healthcare Management Certificate', provider: 'Dubai Health Authority', duration: '8 weeks', format: 'In-Person', spots: 35, enrolled: 28, rating: 4.6, category: 'Healthcare', location: 'Dubai', catBg: brand.red, catColor: brand.redText },
    { title: 'Aviation Operations Excellence', provider: 'Emirates Aviation University', duration: '6 weeks', format: 'Hybrid', spots: 40, enrolled: 33, rating: 4.9, category: 'Aviation', location: 'Dubai', catBg: brand.primarySurface, catColor: brand.primary },
];

const myLearning = [
    { title: 'UAE Government Leadership Program', progress: 65, modulesCompleted: 8, totalModules: 12, nextSession: 'Wed, Feb 19', status: 'In Progress' },
    { title: 'Fintech Innovation Bootcamp', progress: 30, modulesCompleted: 3, totalModules: 10, nextSession: 'Thu, Feb 20', status: 'In Progress' },
];

const completed = [
    { title: 'Project Management Professional', provider: 'PMI Arabia', score: 92, completedDate: 'Jan 2026', badge: '🏆', hours: 48 },
    { title: 'Agile Scrum Master', provider: 'Scrum Alliance UAE', score: 88, completedDate: 'Dec 2025', badge: '🎯', hours: 32 },
    { title: 'Business Analytics Foundations', provider: 'Dubai Knowledge Village', score: 95, completedDate: 'Nov 2025', badge: '📊', hours: 40 },
];

const certificates = [
    { title: 'Project Management Professional (PMP)', issuer: 'PMI Arabia', date: 'Jan 2026', credentialId: 'PMP-UAE-2026-1247', status: 'Active', expiresIn: '2 years' },
    { title: 'Certified Scrum Master (CSM)', issuer: 'Scrum Alliance UAE', date: 'Dec 2025', credentialId: 'CSM-2025-8391', status: 'Active', expiresIn: '1.5 years' },
    { title: 'UAE Government Excellence Award', issuer: 'Federal Authority for Gov HR', date: 'Nov 2025', credentialId: 'GEA-2025-0042', status: 'Active', expiresIn: 'Lifetime' },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const TrainingPage: React.FC = () => {


    const { t } = useTranslation('training');
    const stats = [
        { value: t('stats.programs_value', '200+'), label: t('stats.programs', 'Programs'), icon: BookOpen },
        { value: t('stats.graduates_value', '8,500+'), label: t('stats.graduates', 'Graduates'), icon: Users },
        { value: t('stats.placement_value', '94%'), label: t('stats.placement', 'Placement'), icon: TrendingUp },
        { value: t('stats.partners_value', '50+'), label: t('stats.partners', 'Partners'), icon: Building },
    ];

    /* ── Tab 1: Available Programs ── */
    const programsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Available Training Programs
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Discover 200+ professional training programs from leading UAE institutions — from government leadership to industry certifications.
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
                                background: p.format === 'Online' ? brand.blue : p.format === 'In-Person' ? brand.green : brand.amber,
                                color: p.format === 'Online' ? brand.blueText : p.format === 'In-Person' ? brand.greenText : brand.amberText,
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
                                {p.spots - p.enrolled} spots left
                            </span>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                                Apply Now
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
                My Learning
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Track your active training programs, upcoming sessions, and learning progress.
            </p>

            {/* Active Programs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {myLearning.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{p.title}</h3>
                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                                    <span>{p.modulesCompleted}/{p.totalModules} modules</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> Next: {p.nextSession}</span>
                                </div>
                            </div>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <Play size={14} /> Continue
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
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>Completed Programs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {completed.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{c.badge}</span>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{c.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.provider} · {c.hours}h · Completed {c.completedDate}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: c.score >= 90 ? brand.greenText : brand.primary }}>{c.score}%</div>
                            <span style={{ fontSize: 10, color: brand.textSecondary }}>Score</span>
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
                My Certificates
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                All your earned certificates and professional credentials in one place — share them on your profile or with employers.
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
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · Earned {c.date}</div>
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
                                <span>ID: {c.credentialId}</span>
                                <span>Expires in: {c.expiresIn}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{
                                    background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`,
                                    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    Download
                                </button>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    Share
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
                Training Partners
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                We collaborate with 50+ leading UAE institutions and global training providers to bring you world-class programs.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {[
                    { name: 'Mohammed Bin Rashid Centre for Leadership', type: 'Government', programs: 24, location: 'Abu Dhabi' },
                    { name: 'Abu Dhabi Global Market', type: 'Finance', programs: 18, location: 'Abu Dhabi' },
                    { name: 'Dubai Future Foundation', type: 'Innovation', programs: 15, location: 'Dubai' },
                    { name: 'ADNOC Academy', type: 'Energy', programs: 12, location: 'Abu Dhabi' },
                    { name: 'Emirates Aviation University', type: 'Aviation', programs: 20, location: 'Dubai' },
                    { name: 'Dubai Health Authority', type: 'Healthcare', programs: 16, location: 'Dubai' },
                    { name: 'Khalifa University', type: 'Research', programs: 22, location: 'Abu Dhabi' },
                    { name: 'Masdar Institute', type: 'Sustainability', programs: 10, location: 'Abu Dhabi' },
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
                            <span>{p.programs} programs</span>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer', marginTop: 12 }}>
                            View Programs <ChevronRight size={14} />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'programs', label: t('tabs.programs.label', 'Available Programs'), icon: <BookOpen className="h-4 w-4" />, content: programsTab },
        { id: 'learning', label: t('tabs.learning.label', 'My Learning'), icon: <GraduationCap className="h-4 w-4" />, content: learningTab },
        { id: 'certificates', label: t('tabs.certificates.label', 'Certificates'), icon: <Award className="h-4 w-4" />, content: certsTab },
        { id: 'partners', label: t('tabs.partners.label', 'Training Partners'), icon: <Building className="h-4 w-4" />, content: partnersTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Training Programs')}
            description={t('description', 'Advance your career with 200+ professional training programs from leading UAE institutions — government leadership, industry certifications, and specialized workshops')}
            icon={<GraduationCap className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default TrainingPage;
