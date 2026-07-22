/**
 * SeekerOnboardingWizard.tsx
 *
 * Public page accessible via magic link: /register/:token
 * Flow: Validate token → Review NAFIS profile → Continue with UAE PASS.
 *
 * The phone-OTP step was retired: onboarding now hands off to UAE Pass, and
 * the UAE Pass callback redeems the seeker invitation against the
 * government-verified identity (mirrors the employer flow, PR #105). No
 * account is created here — the callback does it.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { restClient } from '@/utils/api';
import {
    User, Mail, Briefcase, GraduationCap, CheckCircle,
    Loader2, AlertTriangle, MapPin, BookOpen, ShieldCheck, ArrowRight
} from 'lucide-react';

const API = ''; // same-origin proxy

const colors = {
    primary: '#0A4D68',
    accent: '#05BFDB',
    text: '#1A1F36',
    textSec: '#5A6B7B',
    border: '#E2E8F0',
    greenBg: '#ECFDF5', greenText: '#059669',
    redText: '#DC2626',
    blueBg: '#EFF6FF', blueText: '#2563EB',
};

interface SeekerInfo {
    invitation_id: string;
    token: string;
    seeker_id: string;
    full_name: string;
    full_name_arabic: string | null;
    emirates_id: string;
    gender: string | null;
    education_level: string | null;
    specialization: string | null;
    experience_years: number;
    emirate_of_residence: string | null;
    phone: string | null;
    email: string | null;
}

type WizardStep = 'loading' | 'confirm' | 'redirecting' | 'success' | 'error';

const SeekerOnboardingWizard: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [step, setStep] = useState<WizardStep>('loading');
    const [seekerData, setSeekerData] = useState<SeekerInfo | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // ─── Validate token on mount ───
    useEffect(() => {
        if (!token) {
            setErrorMsg('No invitation token provided.');
            setStep('error');
            return;
        }
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const res = await restClient.get(`/api/nafis-talent/public/invitation/${token}`);
            if (res.data.success) {
                setSeekerData(res.data.data);
                setStep('confirm');
            } else {
                setErrorMsg(res.data.error || 'Invalid invitation link.');
                setStep('error');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'This invitation link is invalid or has expired.');
            setStep('error');
        }
    };

    // ─── Hand off to UAE Pass ───
    // The invitation token rides in the server-side OAuth state; the callback
    // redeems it against the proven identity and creates/links the account.
    const handleUaePassHandoff = async () => {
        setStep('redirecting');
        try {
            const res = await axios.get(`${API}/api/auth/uaepass/login`, {
                params: { invitation_token: token, invitation_type: 'seeker' },
                headers: { Accept: 'application/json' },
            });
            const url = res.data?.data?.authorization_url;
            if (url) {
                window.location.href = url;
            } else {
                setErrorMsg('Could not start UAE PASS sign-in. Please try again.');
                setStep('error');
            }
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || 'Could not start UAE PASS sign-in. Please try again.');
            setStep('error');
        }
    };

    const goToDashboard = () => {
        navigate('/candidate-dashboard');
        window.location.reload();
    };

    // ───────────────── Render ─────────────────

    const PlatformBanner = () => (
        <div style={{ textAlign: 'center', marginBottom: 24, width: '100%', maxWidth: 560 }}>
            <div style={{
                background: 'linear-gradient(135deg, #0A4D68, #088395)',
                borderRadius: 16, padding: '24px 20px', marginBottom: 4,
                boxShadow: '0 4px 20px rgba(10,77,104,0.25)',
            }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🇦🇪</div>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: 0.3 }}>
                    Emirati Human Development Platform
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '6px 0 0', fontWeight: 400 }}>
                    UAE Nationals Career Development
                </p>
            </div>
        </div>
    );

    if (step === 'loading') {
        return (
            <div style={pageStyle}>
                <PlatformBanner />
                <div style={cardStyle}>
                    <Loader2 size={40} color={colors.accent} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <h2 style={{ color: colors.text, textAlign: 'center' }}>Validating your invitation...</h2>
                </div>
                <style>{spinKeyframes}</style>
            </div>
        );
    }

    if (step === 'redirecting') {
        return (
            <div style={pageStyle}>
                <PlatformBanner />
                <div style={cardStyle}>
                    <Loader2 size={40} color={colors.accent} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <h2 style={{ color: colors.text, textAlign: 'center' }}>Redirecting to UAE PASS…</h2>
                </div>
                <style>{spinKeyframes}</style>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div style={pageStyle}>
                <PlatformBanner />
                <div style={cardStyle}>
                    <AlertTriangle size={48} color={colors.redText} style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ color: colors.text, textAlign: 'center', marginBottom: 8 }}>Invitation Invalid</h2>
                    <p style={{ color: colors.textSec, textAlign: 'center', marginBottom: 24 }}>{errorMsg}</p>
                    <button onClick={() => navigate('/auth')} style={primaryBtn}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div style={pageStyle}>
                <PlatformBanner />
                <div style={cardStyle}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: colors.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <CheckCircle size={36} color={colors.greenText} />
                    </div>
                    <h2 style={{ color: colors.text, textAlign: 'center', marginBottom: 8 }}>Registration Complete!</h2>
                    <p style={{ color: colors.textSec, textAlign: 'center', marginBottom: 8 }}>
                        Welcome to the Emirati Human Development Platform, <strong>{seekerData?.full_name}</strong>.
                    </p>
                    <p style={{ color: colors.textSec, textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
                        Your candidate profile has been created. You can now explore job opportunities and build your career pathway.
                    </p>
                    <button onClick={goToDashboard} style={primaryBtn}>
                        Go to My Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ─── Confirm step: review NAFIS profile → Continue with UAE PASS ───
    return (
        <div style={pageStyle}>
            <PlatformBanner />
            <div style={{ ...cardStyle, maxWidth: 560 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: colors.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <User size={28} color={colors.blueText} />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                        Welcome, {seekerData?.full_name || 'Job Seeker'}!
                    </h2>
                    <p style={{ color: colors.textSec, fontSize: 14 }}>
                        You've been invited to join the platform through NAFIS.
                    </p>
                </div>

                {/* Pre-filled NAFIS data */}
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={16} color={colors.primary} /> Your NAFIS Profile
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <InfoRow icon={<User size={14} />} label="Name" value={seekerData?.full_name || '—'} />
                        {seekerData?.full_name_arabic && (
                            <InfoRow icon={<User size={14} />} label="Arabic Name" value={seekerData.full_name_arabic} />
                        )}
                        <InfoRow icon={<GraduationCap size={14} />} label="Education" value={seekerData?.education_level || '—'} />
                        <InfoRow icon={<Briefcase size={14} />} label="Experience" value={`${seekerData?.experience_years || 0} years`} />
                        {seekerData?.specialization && (
                            <InfoRow icon={<BookOpen size={14} />} label="Specialization" value={seekerData.specialization} />
                        )}
                        {seekerData?.emirate_of_residence && (
                            <InfoRow icon={<MapPin size={14} />} label="Emirate" value={seekerData.emirate_of_residence} />
                        )}
                    </div>
                </div>

                {/* UAE Pass explanation */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: colors.blueBg, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                    <ShieldCheck size={18} color={colors.blueText} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: colors.text, margin: 0, lineHeight: 1.5 }}>
                        Sign in with <strong>UAE PASS</strong> to verify your identity and activate your account —
                        no forms, no codes. Your name and contact details come from your verified UAE PASS profile.
                    </p>
                </div>

                <button onClick={handleUaePassHandoff} style={primaryBtn}>
                    Continue with UAE PASS <ArrowRight size={16} />
                </button>
                <p style={{ textAlign: 'center', fontSize: 12, color: colors.textSec, marginTop: 12 }}>
                    By continuing, you agree to the platform's Terms of Service and Privacy Policy.
                </p>
            </div>
            <style>{spinKeyframes}</style>
        </div>
    );
};

// ─── Small helper component ───
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div>
        <div style={{ fontSize: 11, color: '#5A6B7B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>{icon} {label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1F36' }}>{value}</div>
    </div>
);

// ─── Styles ───
const pageStyle: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
    background: 'linear-gradient(135deg, #F4F6F8 0%, #E8F3F8 100%)',
};

const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', borderRadius: 16, padding: 32,
    maxWidth: 480, width: '100%',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
};

const primaryBtn: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '12px 24px', borderRadius: 12,
    background: 'linear-gradient(135deg, #0A4D68, #088395)',
    color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
};

const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

export default SeekerOnboardingWizard;
