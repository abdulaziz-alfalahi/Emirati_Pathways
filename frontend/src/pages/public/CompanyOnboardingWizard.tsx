import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Building2, User, Phone, CheckCircle, Loader2,
    AlertTriangle, ArrowRight, Briefcase, Mail, ShieldCheck,
} from 'lucide-react';

// ─── Color Palette (consistent with Growth Dashboard) ───
const colors = {
    primary: '#0A5C36',
    primaryLight: '#E8F5EE',
    primaryGradient: 'linear-gradient(135deg, #0A5C36 0%, #1B4D3E 100%)',
    accent: '#C4A265',
    accentLight: '#FEF9EE',
    bg: '#F4F6F8',
    card: '#FFFFFF',
    text: '#1A1F36',
    textSecondary: '#5A6B7B',
    border: '#E2E8F0',
    greenBg: '#ECFDF5', greenText: '#059669',
    redBg: '#FEF2F2', redText: '#DC2626',
    blueBg: '#EFF6FF', blueText: '#2563EB',
};

/**
 * The wizard no longer collects name/phone/email or runs an OTP step
 * (issues #90/#103). Identity comes from UAE PASS: the invitee reviews the
 * invitation, then signs in with UAE PASS, and the backend binds the
 * invitation — including the operator-set role (#89) — to the identity UAE
 * PASS proved. Success and follow-on routing happen on /auth/uaepass/callback.
 */
type Step = 'loading' | 'welcome' | 'error';

interface InvitationData {
    /** Role fixed by the operator who issued this invitation. The invitee cannot
     *  change it — the server ignores any role sent from the client (#89). */
    intended_role?: 'recruiter' | 'employer_admin';
    id: string;
    token: string;
    company_name: string;
    company_code: string;
    company_email: string;
    company_phone: string;
    company_sector: string;
    trade_license: string;
}

const API = ''; // proxy

const CompanyOnboardingWizard: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('loading');
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [error, setError] = useState('');
    const [redirecting, setRedirecting] = useState(false);

    const role = invitation?.intended_role === 'employer_admin' ? 'employer_admin' : 'recruiter';

    // ─── Step 1: Validate token on mount ───
    useEffect(() => {
        if (!token) {
            setError('No invitation token provided');
            setStep('error');
            return;
        }
        (async () => {
            try {
                const res = await axios.get(`${API}/api/public/invitation/${token}`);
                if (res.data?.success && res.data?.data) {
                    setInvitation(res.data.data);
                    setStep('welcome');
                } else {
                    setError(res.data?.error || 'Invalid or expired invitation link');
                    setStep('error');
                }
            } catch (err: any) {
                setError(err?.response?.data?.error || 'Failed to validate invitation');
                setStep('error');
            }
        })();
    }, [token]);

    // ─── Hand off to UAE PASS ───
    // The invitation token travels in the OAuth state on the server, so the
    // callback can redeem it against the authenticated identity; nothing about
    // the invitee is sent from this page.
    const continueWithUaePass = async () => {
        setRedirecting(true);
        try {
            const res = await axios.get(`${API}/api/auth/uaepass/login`, {
                params: { invitation_token: token },
                headers: { Accept: 'application/json' },
            });
            const url = res.data?.data?.authorization_url;
            if (url) {
                window.location.href = url;
            } else {
                setError('Could not start UAE PASS sign-in. Please try again.');
                setStep('error');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Could not start UAE PASS sign-in. Please try again.');
            setStep('error');
        }
    };

    // ─── Render Steps ───

    if (step === 'loading') {
        return (
            <div style={pageContainer}>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
                        <Loader2 size={40} color={colors.primary} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: colors.textSecondary, fontSize: 15 }}>Validating your invitation...</p>
                    </div>
                </div>
                <style>{spinKeyframes}</style>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div style={pageContainer}>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
                        <div style={{ padding: 16, borderRadius: '50%', background: colors.redBg }}>
                            <AlertTriangle size={36} color={colors.redText} />
                        </div>
                        <h2 style={{ color: colors.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Invitation Invalid</h2>
                        <p style={{ color: colors.textSecondary, fontSize: 15, maxWidth: 360 }}>{error}</p>
                        <button onClick={() => navigate('/')} style={secondaryBtnStyle}>Go to Homepage</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={pageContainer}>
            {/* Header / Brand */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h1 style={{
                    fontSize: 28, fontWeight: 800, margin: 0,
                    background: colors.primaryGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Emirati Human Development Platform
                </h1>
                <p style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6 }}>Company Onboarding</p>
            </div>

            {/* Card */}
            <div style={cardStyle}>
                {step === 'welcome' && invitation && (
                    <div style={{ padding: '28px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                            <div style={{ padding: 14, borderRadius: 14, background: colors.primaryLight }}>
                                <Building2 size={28} color={colors.primary} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>
                                    Welcome, {invitation.company_name}!
                                </h2>
                                <p style={{ fontSize: 14, color: colors.textSecondary, margin: '4px 0 0' }}>
                                    You've been invited to join Emirati Human Development Platform
                                </p>
                            </div>
                        </div>

                        {/* Company Details Card */}
                        <div style={{
                            background: '#F8FAFC', borderRadius: 14, padding: 20, marginBottom: 20,
                            border: `1px solid ${colors.border}`,
                        }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Company Information
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                                {[
                                    { label: 'Company', value: invitation.company_name, icon: <Building2 size={14} /> },
                                    { label: 'Sector', value: invitation.company_sector || '—', icon: <Briefcase size={14} /> },
                                    { label: 'Email', value: invitation.company_email || '—', icon: <Mail size={14} /> },
                                    { label: 'Phone', value: invitation.company_phone || '—', icon: <Phone size={14} /> },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ color: colors.primary }}>{item.icon}</div>
                                        <div>
                                            <div style={{ fontSize: 11, color: colors.textSecondary }}>{item.label}</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Role — read-only. Set by the operator who issued the
                            invitation and enforced server-side (#89). */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Your Role on the Platform</label>
                            <div style={{
                                marginTop: 6, padding: '14px 16px', borderRadius: 12,
                                border: `2px solid ${colors.border}`,
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                {role === 'employer_admin' ? <Briefcase size={20} /> : <User size={20} />}
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {role === 'employer_admin' ? 'HR Manager' : 'Recruiter'}
                                    </div>
                                    <div style={{ fontSize: 13, color: colors.textSecondary }}>
                                        {role === 'employer_admin'
                                            ? 'Manage hiring pipeline & team'
                                            : 'Post jobs, source & assess candidates'}
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                                Assigned by your organisation's onboarding contact.
                            </p>
                        </div>

                        <div style={{
                            padding: '12px 16px', borderRadius: 10, background: colors.blueBg,
                            color: colors.blueText, fontSize: 13, marginBottom: 24,
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                        }}>
                            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>
                                Sign in with <strong>UAE PASS</strong> to verify your identity and
                                activate your account — no forms, no codes. Your name and contact
                                details come from your verified UAE PASS profile.
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={continueWithUaePass}
                                disabled={redirecting}
                                style={{ ...primaryBtnStyle, opacity: redirecting ? 0.6 : 1, cursor: redirecting ? 'wait' : 'pointer' }}
                            >
                                {redirecting ? (
                                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Redirecting to UAE PASS...</>
                                ) : (
                                    <>Continue with UAE PASS <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{spinKeyframes}</style>
        </div>
    );
};

// ─── Styles ───
const pageContainer: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: colors.bg,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
};

const cardStyle: React.CSSProperties = {
    background: colors.card,
    borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    width: '100%',
    maxWidth: 560,
    overflow: 'hidden',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 6,
};

const primaryBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '11px 24px',
    borderRadius: 12,
    background: colors.primaryGradient,
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
};

const secondaryBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '11px 24px',
    borderRadius: 12,
    background: colors.card,
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
};

const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

export default CompanyOnboardingWizard;
