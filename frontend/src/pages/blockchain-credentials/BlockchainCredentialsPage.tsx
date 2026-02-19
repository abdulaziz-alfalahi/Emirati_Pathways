
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Shield, Link2, Award, CheckCircle, Globe,
    Clock, ChevronRight, Star, Lock, Eye,
    FileText, Building2, Users, Zap, ExternalLink,
    BadgeCheck, QrCode, Download, Share2
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

const myCredentials = [
    { title: 'Bachelor of Computer Science', issuer: 'Ministry of Education (MOE)', date: 'Feb 2026', txHash: '0x8c4b...f12e', network: 'Ethereum', status: 'Verified' as const, verifications: 28, badge: '🎓', primary: true },
    { title: 'Higher Education Equivalency Certificate', issuer: 'Ministry of Higher Education & Scientific Research (MOHESR)', date: 'Jan 2026', txHash: '0x3e7d...a93c', network: 'Ethereum', status: 'Verified' as const, verifications: 22, badge: '📜', primary: true },
    { title: 'UAE Teaching License', issuer: 'Ministry of Education (MOE)', date: 'Dec 2025', txHash: '0x5a1f...b74d', network: 'Ethereum', status: 'Verified' as const, verifications: 18, badge: '🏛️', primary: true },
    { title: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', date: 'Nov 2025', txHash: '0x7f3a...e82d', network: 'Polygon', status: 'Verified' as const, verifications: 12, badge: '☁️', primary: false },
    { title: 'Google Data Analytics Professional', issuer: 'Google', date: 'Oct 2025', txHash: '0x4b2c...a91f', network: 'Polygon', status: 'Verified' as const, verifications: 8, badge: '📊', primary: false },
    { title: 'UAE Government Excellence Award', issuer: 'Federal Authority for Gov HR (FAHR)', date: 'Sep 2025', txHash: '0x9d1e...c73b', network: 'Ethereum', status: 'Verified' as const, verifications: 15, badge: '🏅', primary: false },
];

const verificationLog = [
    { credential: 'Bachelor of Computer Science (MOE)', verifier: 'Emirates Group HR', date: 'Feb 16, 2026', purpose: 'Job Application' },
    { credential: 'Higher Education Equivalency (MOHESR)', verifier: 'ADNOC Recruitment', date: 'Feb 14, 2026', purpose: 'Credential Check' },
    { credential: 'UAE Teaching License (MOE)', verifier: 'Abu Dhabi Education Council', date: 'Feb 12, 2026', purpose: 'License Validation' },
    { credential: 'Bachelor of Computer Science (MOE)', verifier: 'Etisalat Digital', date: 'Feb 10, 2026', purpose: 'Interview' },
    { credential: 'AWS Cloud Practitioner', verifier: 'Dubai Digital Authority', date: 'Feb 8, 2026', purpose: 'Vendor Pre-qual' },
    { credential: 'Higher Education Equivalency (MOHESR)', verifier: 'Khalifa University', date: 'Feb 5, 2026', purpose: 'Graduate Admission' },
    { credential: 'Google Data Analytics', verifier: 'Careem Engineering', date: 'Feb 3, 2026', purpose: 'Job Application' },
];

const issuers = [
    { name: 'Ministry of Education (MOE)', credentials: 85, verified: 42000, network: 'Ethereum', region: 'UAE', tier: 'Primary' as const },
    { name: 'Ministry of Higher Education & Scientific Research (MOHESR)', credentials: 62, verified: 31500, network: 'Ethereum', region: 'UAE', tier: 'Primary' as const },
    { name: 'Federal Authority for Gov HR (FAHR)', credentials: 28, verified: 15200, network: 'Ethereum', region: 'UAE', tier: 'Government' as const },
    { name: 'Abu Dhabi Education Council (ADEC)', credentials: 34, verified: 12800, network: 'Ethereum', region: 'UAE', tier: 'Government' as const },
    { name: 'Knowledge & Human Development Authority (KHDA)', credentials: 22, verified: 9400, network: 'Ethereum', region: 'UAE', tier: 'Government' as const },
    { name: 'Amazon Web Services', credentials: 45, verified: 12400, network: 'Polygon', region: 'Global', tier: 'Industry' as const },
    { name: 'Google', credentials: 32, verified: 9800, network: 'Polygon', region: 'Global', tier: 'Industry' as const },
    { name: 'Microsoft', credentials: 38, verified: 11200, network: 'Polygon', region: 'Global', tier: 'Industry' as const },
];

/* ──────────────────────── COMPONENT ──────────────────────── */

const BlockchainCredentialsPage: React.FC = () => {


    const { t } = useTranslation('blockchain-credentials');
    const stats = [
        { value: t('stats.my_credentials_value', '6'), label: t('stats.my_credentials', 'My Credentials'), icon: Award },
        { value: t('stats.verifications_value', '103'), label: t('stats.verifications', 'Verifications'), icon: CheckCircle },
        { value: t('stats.issuers_value', '150+'), label: t('stats.issuers', 'Issuers'), icon: Building2 },
        { value: t('stats.on_chain_value', '100%'), label: t('stats.on_chain', 'On-Chain'), icon: Shield },
    ];

    /* ── Tab 1: My Credentials ── */
    const credentialsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                My Blockchain Credentials
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Your tamper-proof, verifiable digital credentials stored on the blockchain — featuring official credentials from the UAE Ministry of Education and Ministry of Higher Education, plus industry certifications.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myCredentials.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ fontSize: 28 }}>{c.badge}</span>
                                    {c.primary && <span style={{ position: 'absolute', top: -4, right: -6, width: 14, height: 14, borderRadius: '50%', background: brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={8} style={{ color: '#fff' }} /></span>}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                        <span>{c.issuer}</span>
                                        <span style={{ margin: '0 6px' }}>·</span>
                                        <span>Issued {c.date}</span>
                                    </div>
                                </div>
                            </div>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <BadgeCheck size={12} /> {c.status}
                            </span>
                        </div>

                        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Link2 size={12} /> {c.txHash}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Globe size={12} /> {c.network}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {c.verifications} verifications</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <QrCode size={12} /> QR
                                </button>
                                <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Download size={12} /> PDF
                                </button>
                                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Share2 size={12} /> Share
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Verification Log ── */
    const verifyTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Verification Log
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                See who has verified your credentials — complete transparency on how your qualifications are being accessed.
            </p>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total Verifications', value: '41', Icon: CheckCircle },
                    { label: 'This Month', value: '5', Icon: Clock },
                    { label: 'Unique Verifiers', value: '12', Icon: Users },
                    { label: 'Job Applications', value: '8', Icon: FileText },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, textAlign: 'center' }}>
                        <s.Icon size={20} style={{ color: brand.primary, margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        <span style={{ fontSize: 11, color: brand.textSecondary }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Log entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {verificationLog.map((v, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle size={18} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{v.verifier}</span>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}> verified </span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: brand.textPrimary }}>{v.credential}</span>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                {v.date} · {v.purpose}
                            </div>
                        </div>
                        <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                            {v.purpose}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Trusted Issuers ── */
    const issuersTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                Trusted Issuers
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Browse verified credential issuers on our blockchain network — led by UAE Ministry of Education and Ministry of Higher Education, plus government bodies and global industry leaders.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {issuers.map((iss, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={20} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{iss.name}</h4>
                                    <span style={{ fontSize: 11, color: brand.textSecondary }}>{iss.region}</span>
                                </div>
                            </div>
                            <span style={{
                                background: iss.tier === 'Primary' ? brand.purple : iss.tier === 'Government' ? brand.blue : brand.green,
                                color: iss.tier === 'Primary' ? brand.purpleText : iss.tier === 'Government' ? brand.blueText : brand.greenText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3
                            }}>
                                <Lock size={10} /> {iss.tier}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span>{iss.credentials} credentials</span>
                            <span>{iss.verified.toLocaleString()} verified</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Globe size={12} /> {iss.network}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: How It Works ── */
    const howTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                How It Works
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                Blockchain credentials are tamper-proof digital certificates stored on a decentralized ledger — no one can forge, alter, or revoke them without your knowledge.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {[
                    { step: 1, title: 'Earn a Credential', desc: 'Complete a certification, training program, or assessment through any trusted issuer on our platform.', Icon: Award },
                    { step: 2, title: 'Issued on Blockchain', desc: 'The issuer mints your credential as a verifiable token on the Polygon or Ethereum blockchain — it\'s permanent and tamper-proof.', Icon: Link2 },
                    { step: 3, title: 'Share Instantly', desc: 'Share your credential via QR code, link, or PDF. Employers can verify it in seconds without contacting the issuer.', Icon: Share2 },
                    { step: 4, title: 'Verify Anywhere', desc: 'Any verifier worldwide can confirm the authenticity, issuer, and date of your credential by checking the blockchain directly.', Icon: CheckCircle },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 16, color: brand.primary }}>
                            {s.step}
                        </div>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{s.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Benefits */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Zap size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>Why Blockchain?</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        'Tamper-proof — no one can forge or alter your credentials after issuance',
                        'Instant verification — employers verify in seconds, no phone calls or emails needed',
                        'You own it — your credential exists on the blockchain forever, even if the issuer closes',
                        'Global recognition — accepted worldwide by any organization that supports W3C verifiable credentials',
                    ].map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{b}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'credentials', label: t('tabs.credentials.label', 'My Credentials'), icon: <Shield className="h-4 w-4" />, content: credentialsTab },
        { id: 'verification', label: t('tabs.verification.label', 'Verification Log'), icon: <CheckCircle className="h-4 w-4" />, content: verifyTab },
        { id: 'issuers', label: t('tabs.issuers.label', 'Trusted Issuers'), icon: <Building2 className="h-4 w-4" />, content: issuersTab },
        { id: 'how-it-works', label: t('tabs.how-it-works.label', 'How It Works'), icon: <Zap className="h-4 w-4" />, content: howTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('title', 'Blockchain Credentials')}
            description={t('description', 'Tamper-proof, instantly verifiable digital credentials stored on the blockchain — own your qualifications and share them with employers worldwide')}
            icon={<Shield className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="credentials"
        />
    );
};

export default BlockchainCredentialsPage;
