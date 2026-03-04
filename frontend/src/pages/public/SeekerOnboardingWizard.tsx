/**
 * SeekerOnboardingWizard.tsx
 *
 * Public page accessible via magic link: /register/:token
 * Flow: Validate token → Confirm info → Mobile OTP verification → Create account.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restClient } from '@/utils/api';
import {
    User, Mail, Phone, Briefcase, GraduationCap, CheckCircle,
    Loader2, AlertTriangle, MapPin, BookOpen, ShieldCheck, ArrowLeft
} from 'lucide-react';

const colors = {
    primary: '#0A4D68',
    primaryGradient: 'linear-gradient(135deg, #0A4D68, #088395)',
    accent: '#05BFDB',
    bg: '#F4F6F8',
    card: '#FFFFFF',
    text: '#1A1F36',
    textSec: '#5A6B7B',
    border: '#E2E8F0',
    greenBg: '#ECFDF5', greenText: '#059669',
    redBg: '#FEF2F2', redText: '#DC2626',
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

type WizardStep = 'loading' | 'confirm' | 'otp' | 'success' | 'error';

const SeekerOnboardingWizard: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [step, setStep] = useState<WizardStep>('loading');
    const [seekerData, setSeekerData] = useState<SeekerInfo | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Editable fields
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // OTP fields
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [phoneMasked, setPhoneMasked] = useState('');
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // ─── Cooldown timer ───
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

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
                const d = res.data.data;
                setSeekerData(d);
                setEmail(d.email || '');
                setPhone(d.phone || '');
                setStep('confirm');
            } else {
                setErrorMsg(res.data.error || 'Invalid invitation link.');
                setStep('error');
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || 'This invitation link is invalid or has expired.';
            setErrorMsg(msg);
            setStep('error');
        }
    };

    // ─── Send OTP ───
    const handleSendOtp = async () => {
        if (!phone) {
            alert('Please provide your phone number.');
            return;
        }
        if (!email) {
            alert('Please provide your email address.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await restClient.post(`/api/nafis-talent/public/invitation/${token}/send-otp`, { phone });
            if (res.data.success) {
                setPhoneMasked(res.data.phone_masked || phone);
                setOtpDigits(['', '', '', '', '', '']);
                setOtpError('');
                setStep('otp');
                setCooldown(60);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                alert(res.data.error || 'Failed to send verification code.');
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to send verification code.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Resend OTP ───
    const handleResendOtp = async () => {
        setResending(true);
        try {
            const res = await restClient.post(`/api/nafis-talent/public/invitation/${token}/send-otp`, { phone });
            if (res.data.success) {
                setOtpDigits(['', '', '', '', '', '']);
                setOtpError('');
                setCooldown(60);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                setOtpError(res.data.error || 'Failed to resend code.');
            }
        } catch (err: any) {
            setOtpError(err.response?.data?.error || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

    // ─── Verify OTP and create account ───
    const handleVerifyOtp = async (codeOverride?: string) => {
        const code = codeOverride || otpDigits.join('');
        if (code.length !== 6) {
            setOtpError('Please enter the full 6-digit code.');
            return;
        }
        setSubmitting(true);
        setOtpError('');
        try {
            // Step 1: Verify OTP
            const verifyRes = await restClient.post(`/api/nafis-talent/public/invitation/${token}/verify-otp`, { code });
            if (!verifyRes.data.success) {
                setOtpError(verifyRes.data.error || 'Verification failed.');
                setSubmitting(false);
                return;
            }

            // Step 2: Accept invitation and create account
            const res = await restClient.post(`/api/nafis-talent/public/invitation/${token}/accept`, {
                email,
                phone,
            });
            if (res.data.success) {
                const d = res.data.data;
                if (d.access_token) {
                    localStorage.setItem('token', d.access_token);
                    if (d.refresh_token) localStorage.setItem('refresh_token', d.refresh_token);
                    if (d.user) {
                        localStorage.setItem('user', JSON.stringify(d.user));
                        localStorage.setItem('userRole', d.user.role || 'candidate');
                    }
                }
                setStep('success');
            } else {
                setOtpError(res.data.error || 'Registration failed.');
            }
        } catch (err: any) {
            setOtpError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── OTP input handlers ───
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        setOtpError('');

        // Auto-advance or auto-submit
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        if (value && index === 5) {
            // All 6 digits entered — pass code directly to avoid stale state
            const code = newDigits.join('');
            if (code.length === 6) {
                setTimeout(() => handleVerifyOtp(code), 200);
            }
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (paste.length > 0) {
            const newDigits = [...otpDigits];
            for (let i = 0; i < 6; i++) {
                newDigits[i] = paste[i] || '';
            }
            setOtpDigits(newDigits);
            if (paste.length === 6) {
                // Pass code directly to avoid stale state
                setTimeout(() => handleVerifyOtp(paste), 200);
            } else {
                inputRefs.current[paste.length]?.focus();
            }
        }
    };

    const goToDashboard = () => {
        navigate('/candidate-dashboard');
        window.location.reload();
    };

    // ───────────────── Render ─────────────────

    // Branded header shown on all steps
    const PlatformBanner = () => (
        <div style={{
            textAlign: 'center', marginBottom: 24, width: '100%', maxWidth: 560,
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #0A4D68, #088395)',
                borderRadius: 16, padding: '24px 20px', marginBottom: 4,
                boxShadow: '0 4px 20px rgba(10,77,104,0.25)',
            }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🇦🇪</div>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: 0.3 }}>
                    Dubai Human Development Platform
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '6px 0 0', fontWeight: 400 }}>
                    UAE Nationals Career Development
                </p>
            </div>
        </div>
    );

    // Loading
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

    // Error
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

    // Success
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
                        Welcome to the Dubai Human Development Platform, <strong>{seekerData?.full_name}</strong>.
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

    // ─── OTP Step ───
    if (step === 'otp') {
        return (
            <div style={pageStyle}>
                <PlatformBanner />
                <div style={{ ...cardStyle, maxWidth: 440 }}>
                    {/* Back button */}
                    <button
                        onClick={() => setStep('confirm')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4, background: 'none',
                            border: 'none', cursor: 'pointer', color: colors.textSec, fontSize: 13,
                            fontWeight: 500, marginBottom: 20, padding: 0,
                        }}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>

                    {/* Icon */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%', background: colors.blueBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        }}>
                            <ShieldCheck size={32} color={colors.blueText} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                            Verify Your Phone Number
                        </h2>
                        <p style={{ color: colors.textSec, fontSize: 14 }}>
                            We sent a 6-digit verification code to <strong>{phoneMasked}</strong>
                        </p>
                    </div>

                    {/* OTP Input Boxes */}
                    <div
                        style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}
                        onPaste={handleOtpPaste}
                    >
                        {otpDigits.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => { inputRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                style={{
                                    width: 48, height: 56, textAlign: 'center', fontSize: 22,
                                    fontWeight: 700, borderRadius: 12,
                                    border: otpError ? `2px solid ${colors.redText}` : `2px solid ${digit ? colors.primary : colors.border}`,
                                    outline: 'none', transition: 'border 0.2s',
                                    color: colors.text,
                                }}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    {/* Error message */}
                    {otpError && (
                        <p style={{ color: colors.redText, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                            {otpError}
                        </p>
                    )}

                    {/* Verify button */}
                    <button
                        onClick={() => handleVerifyOtp()}
                        disabled={submitting || otpDigits.join('').length !== 6}
                        style={{
                            ...primaryBtn, marginBottom: 16,
                            opacity: submitting || otpDigits.join('').length !== 6 ? 0.7 : 1,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
                        {submitting ? 'Verifying...' : 'Verify & Create Account'}
                    </button>

                    {/* Resend */}
                    <div style={{ textAlign: 'center' }}>
                        {cooldown > 0 ? (
                            <p style={{ fontSize: 13, color: colors.textSec }}>
                                Resend code in <strong>{cooldown}s</strong>
                            </p>
                        ) : (
                            <button
                                onClick={handleResendOtp}
                                disabled={resending}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: colors.blueText, fontWeight: 600, fontSize: 13,
                                    textDecoration: 'underline',
                                }}
                            >
                                {resending ? 'Sending...' : 'Resend Code'}
                            </button>
                        )}
                    </div>

                    <p style={{ textAlign: 'center', fontSize: 11, color: colors.textSec, marginTop: 20 }}>
                        💡 Check the <strong>backend terminal</strong> for the mock SMS with your verification code.
                    </p>
                </div>
                <style>{spinKeyframes}</style>
            </div>
        );
    }

    // ─── Confirm Step ───
    return (
        <div style={pageStyle}>
            <PlatformBanner />
            <div style={{ ...cardStyle, maxWidth: 560 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: colors.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <User size={28} color={colors.blueText} />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Complete Your Registration</h2>
                    <p style={{ color: colors.textSec, fontSize: 14 }}>Please review your information and confirm to continue.</p>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    <div style={{ ...stepDot, background: colors.primary, color: '#fff' }}>1</div>
                    <div style={stepLine} />
                    <div style={{ ...stepDot, background: colors.border, color: colors.textSec }}>2</div>
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

                {/* Editable fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                    <div>
                        <label style={labelStyle}><Mail size={13} style={{ marginRight: 6 }} /> Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}><Phone size={13} style={{ marginRight: 6 }} /> Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+971 XX XXX XXXX"
                            style={inputStyle}
                        />
                        <p style={{ fontSize: 11, color: colors.textSec, marginTop: 4 }}>
                            A verification code will be sent to this number.
                        </p>
                    </div>
                </div>

                {/* Continue to OTP */}
                <button
                    onClick={handleSendOtp}
                    disabled={submitting || !email || !phone}
                    style={{ ...primaryBtn, opacity: submitting || !email || !phone ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                    {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Phone size={16} />}
                    {submitting ? 'Sending Code...' : 'Send Verification Code'}
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

const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', fontSize: 13,
    fontWeight: 600, color: '#1A1F36', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #E2E8F0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
};

const stepDot: React.CSSProperties = {
    width: 28, height: 28, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
};

const stepLine: React.CSSProperties = {
    width: 40, height: 2, background: '#E2E8F0',
};

const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

export default SeekerOnboardingWizard;
