import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Building2, User, Phone, Shield, CheckCircle, Loader2,
    AlertTriangle, ArrowRight, ArrowLeft, Briefcase, Mail,
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

type Step = 'loading' | 'welcome' | 'details' | 'otp' | 'success' | 'error';

interface InvitationData {
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

    // Wizard state
    const [step, setStep] = useState<Step>('loading');
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [error, setError] = useState('');

    // Step 2 — Details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [positionTitle, setPositionTitle] = useState('');
    const [role, setRole] = useState<'recruiter' | 'hr_manager'>('recruiter');

    // Step 3 — OTP
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [debugOtp, setDebugOtp] = useState('');

    // Step 4 — Success
    const [acceptLoading, setAcceptLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

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
                    setEmail(res.data.data.company_email || '');
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

    // ─── Request OTP ───
    const requestOtp = async () => {
        if (!phone || phone.length < 9) {
            setOtpError('Please enter a valid phone number');
            return;
        }
        setOtpLoading(true);
        setOtpError('');
        setDebugOtp('');
        try {
            const res = await axios.post(`${API}/api/auth/request-otp`, { phone });
            if (res.data?.success) {
                setOtpSent(true);
                if (res.data.debug_otp) setDebugOtp(res.data.debug_otp);
            } else {
                setOtpError(res.data?.message || 'Failed to send OTP');
            }
        } catch (err: any) {
            setOtpError(err?.response?.data?.message || 'Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    // ─── Verify OTP + Accept Invitation ───
    const verifyAndAccept = async () => {
        if (!otpCode || otpCode.length < 4) {
            setOtpError('Please enter the OTP code');
            return;
        }
        setAcceptLoading(true);
        setOtpError('');
        try {
            // 1. Verify OTP
            const otpRes = await axios.post(`${API}/api/auth/login-with-otp`, {
                phone,
                code: otpCode,
            });

            // OTP may create a user already — we still need to accept the invitation
            // to create the HR profile and mark invitation used

            // 2. Accept invitation
            const acceptRes = await axios.post(`${API}/api/public/invitation/${token}/accept`, {
                first_name: firstName,
                last_name: lastName,
                phone,
                email,
                position_title: positionTitle,
                role,
            });

            if (acceptRes.data?.success) {
                const data = acceptRes.data.data;
                // Store tokens for auto-login
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                }
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                setUserData(data.user);
                setStep('success');
            } else {
                setOtpError(acceptRes.data?.error || 'Failed to complete registration');
            }
        } catch (err: any) {
            setOtpError(err?.response?.data?.error || err?.response?.data?.message || 'Verification failed');
        } finally {
            setAcceptLoading(false);
        }
    };

    // ─── Navigate to dashboard ───
    const goToDashboard = () => {
        const dash = role === 'hr_manager' ? '/hr-dashboard' : '/recruiter-dashboard';
        navigate(dash);
    };

    // ─── Validation ───
    const isDetailsValid = firstName.trim() && lastName.trim() && phone.trim() && phone.length >= 9;

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
                    Dubai Human Development Platform
                </h1>
                <p style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6 }}>Company Onboarding</p>
            </div>

            {/* Progress Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
                {['Welcome', 'Details', 'Verify', 'Done'].map((label, i) => {
                    const stepMap: Step[] = ['welcome', 'details', 'otp', 'success'];
                    const currentIdx = stepMap.indexOf(step);
                    const isActive = i === currentIdx;
                    const isDone = i < currentIdx;
                    return (
                        <React.Fragment key={label}>
                            {i > 0 && (
                                <div style={{
                                    width: 40, height: 2,
                                    background: isDone ? colors.primary : colors.border,
                                    transition: 'background 0.3s',
                                }} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700,
                                    background: isDone ? colors.primary : isActive ? colors.primaryLight : '#F1F5F9',
                                    color: isDone ? '#fff' : isActive ? colors.primary : colors.textSecondary,
                                    border: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
                                    transition: 'all 0.3s',
                                }}>
                                    {isDone ? <CheckCircle size={16} /> : i + 1}
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                                    color: isActive ? colors.primary : colors.textSecondary,
                                }}>{label}</span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Card */}
            <div style={cardStyle}>

                {/* ════════ STEP: Welcome ════════ */}
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
                                    You've been invited to join Dubai Human Development Platform
                                </p>
                            </div>
                        </div>

                        {/* Company Details Card */}
                        <div style={{
                            background: '#F8FAFC', borderRadius: 14, padding: 20, marginBottom: 24,
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

                        <div style={{
                            padding: '12px 16px', borderRadius: 10, background: colors.blueBg,
                            color: colors.blueText, fontSize: 13, marginBottom: 24,
                        }}>
                            Complete the following steps to set up your account and start connecting with Emirati talent.
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setStep('details')} style={primaryBtnStyle}>
                                Get Started <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════ STEP: Details + Role ════════ */}
                {step === 'details' && (
                    <div style={{ padding: '28px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ padding: 12, borderRadius: 12, background: colors.primaryLight }}>
                                <User size={24} color={colors.primary} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>Your Details</h2>
                                <p style={{ fontSize: 13, color: colors.textSecondary, margin: '2px 0 0' }}>Tell us about yourself and your role</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>First Name *</label>
                                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ahmed" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name *</label>
                                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Al Ameri" style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Mobile Number * <span style={{ fontWeight: 400, color: colors.textSecondary }}>(for OTP verification)</span></label>
                            <input
                                value={phone} onChange={e => setPhone(e.target.value)}
                                placeholder="+971 50 123 4567" type="tel"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Email</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ahmed@company.ae" type="email" style={inputStyle} />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Position Title</label>
                            <input value={positionTitle} onChange={e => setPositionTitle(e.target.value)} placeholder="HR Director" style={inputStyle} />
                        </div>

                        {/* Role Selector */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>Your Role on the Platform *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
                                {([
                                    { value: 'recruiter', label: 'Recruiter', desc: 'Post jobs, source & assess candidates', icon: <User size={20} /> },
                                    { value: 'hr_manager', label: 'HR Manager', desc: 'Manage hiring pipeline & team', icon: <Briefcase size={20} /> },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setRole(opt.value)}
                                        style={{
                                            padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                                            border: role === opt.value ? `2px solid ${colors.primary}` : `2px solid ${colors.border}`,
                                            background: role === opt.value ? colors.primaryLight : colors.card,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ color: role === opt.value ? colors.primary : colors.textSecondary }}>{opt.icon}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: role === opt.value ? colors.primary : colors.text }}>{opt.label}</div>
                                                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{opt.desc}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setStep('welcome')} style={secondaryBtnStyle}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                disabled={!isDetailsValid}
                                onClick={() => { setStep('otp'); requestOtp(); }}
                                style={{ ...primaryBtnStyle, opacity: isDetailsValid ? 1 : 0.5, cursor: isDetailsValid ? 'pointer' : 'not-allowed' }}
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════ STEP: OTP Verification ════════ */}
                {step === 'otp' && (
                    <div style={{ padding: '28px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ padding: 12, borderRadius: 12, background: colors.primaryLight }}>
                                <Shield size={24} color={colors.primary} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>Verify Your Mobile</h2>
                                <p style={{ fontSize: 13, color: colors.textSecondary, margin: '2px 0 0' }}>
                                    We sent a verification code to <strong>{phone}</strong>
                                </p>
                            </div>
                        </div>

                        {otpError && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                                background: colors.redBg, color: colors.redText, fontSize: 13,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <AlertTriangle size={16} /> {otpError}
                            </div>
                        )}

                        {debugOtp && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                                background: colors.accentLight, color: '#92400E', fontSize: 13,
                                border: '1px dashed #F59E0B',
                            }}>
                                🛠 <strong>Dev Mode</strong> — Your OTP code is: <code style={{ fontWeight: 700, fontSize: 16 }}>{debugOtp}</code>
                            </div>
                        )}

                        {!otpSent ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Loader2 size={28} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
                                <p style={{ color: colors.textSecondary, fontSize: 14, marginTop: 10 }}>Sending OTP...</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={labelStyle}>Enter OTP Code</label>
                                    <input
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="123456"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        style={{
                                            ...inputStyle,
                                            textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: '0.3em',
                                            maxWidth: 240, margin: '0 auto', display: 'block',
                                        }}
                                    />
                                </div>

                                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                    <button
                                        onClick={requestOtp}
                                        disabled={otpLoading}
                                        style={{ background: 'none', border: 'none', color: colors.blueText, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        {otpLoading ? 'Sending...' : 'Resend OTP'}
                                    </button>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => { setStep('details'); setOtpSent(false); setOtpCode(''); setOtpError(''); setDebugOtp(''); }} style={secondaryBtnStyle}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                disabled={!otpCode || otpCode.length < 4 || acceptLoading}
                                onClick={verifyAndAccept}
                                style={{
                                    ...primaryBtnStyle,
                                    opacity: (otpCode.length >= 4 && !acceptLoading) ? 1 : 0.5,
                                    cursor: (otpCode.length >= 4 && !acceptLoading) ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {acceptLoading ? (
                                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                                ) : (
                                    <>Verify & Complete <CheckCircle size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════ STEP: Success ════════ */}
                {step === 'success' && (
                    <div style={{ padding: '40px 32px', textAlign: 'center' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%', background: colors.greenBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                        }}>
                            <CheckCircle size={36} color={colors.greenText} />
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: '0 0 8px' }}>
                            Welcome Aboard! 🎉
                        </h2>
                        <p style={{ color: colors.textSecondary, fontSize: 15, margin: '0 0 8px' }}>
                            Your account has been created for <strong>{invitation?.company_name}</strong>
                        </p>
                        <p style={{ color: colors.textSecondary, fontSize: 14, margin: '0 0 28px' }}>
                            Role: <strong style={{ color: colors.primary }}>{role === 'hr_manager' ? 'HR Manager' : 'Recruiter'}</strong>
                        </p>

                        <button onClick={goToDashboard} style={{ ...primaryBtnStyle, padding: '14px 36px', fontSize: 16 }}>
                            Go to Dashboard <ArrowRight size={18} />
                        </button>
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

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    fontSize: 14,
    color: colors.text,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
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
