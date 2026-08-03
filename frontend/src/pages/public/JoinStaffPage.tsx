import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Platform-staff invite landing (/join-staff/:token). An admin invites EHRDC
// staff (CRM/career services, operators — typically non-nationals, who cannot
// self-register) by magic link; the invitee completes registration through UAE
// Pass and the OAuth callback redeems the invitation against the identity UAE
// Pass proved (invitation_type=staff).
const API = '';

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  career_services_operator: { en: 'Career Services Operator', ar: 'مشغّل خدمات المسار المهني' },
  call_center_agent: { en: 'Call Centre Agent', ar: 'موظف مركز الاتصال' },
  talent_operator: { en: 'Talent Operator', ar: 'مشغّل المواهب' },
  platform_operator: { en: 'Platform Operator', ar: 'مشغّل المنصة' },
  education_operator: { en: 'Education Operator', ar: 'مشغّل التعليم' },
  assessment_operator: { en: 'Assessment Operator', ar: 'مشغّل التقييم' },
  mentorship_operator: { en: 'Mentorship Operator', ar: 'مشغّل الإرشاد' },
  community_operator: { en: 'Community Operator', ar: 'مشغّل المجتمع' },
  professional_dev_operator: { en: 'Professional Development Operator', ar: 'مشغّل التطوير المهني' },
  employer_relations: { en: 'Employer Relations', ar: 'علاقات أصحاب العمل' },
  advisor: { en: 'Academic Advisor', ar: 'المرشد الأكاديمي' },
  internship_coordinator: { en: 'Internship Coordinator', ar: 'منسّق التدريب' },
  assessor: { en: 'Assessor', ar: 'المقيّم' },
  coach: { en: 'Coach', ar: 'المدرب' },
  mentor: { en: 'Mentor', ar: 'الموجّه' },
  compliance_auditor: { en: 'Compliance Auditor', ar: 'مدقق الامتثال' },
};

const JoinStaffPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'joining'>('loading');
  const [inv, setInv] = useState<{ full_name?: string; role?: string; organization?: string; valid: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setState('invalid'); setError('No invitation token'); return; }
    (async () => {
      try {
        const res = await axios.get(`${API}/api/staff-invitations/${token}/preview`);
        if (res.data?.invitation?.valid) {
          setInv(res.data.invitation); setState('ready');
        } else {
          setError('This invitation link is invalid, expired, or already used.');
          setState('invalid');
        }
      } catch {
        setError('Could not load this invitation.'); setState('invalid');
      }
    })();
  }, [token]);

  const continueWithUaePass = async () => {
    setState('joining');
    try {
      const res = await axios.get(`${API}/api/auth/uaepass/login`, {
        params: { invitation_token: token, invitation_type: 'staff' },
        headers: { Accept: 'application/json' },
      });
      const url = res.data?.data?.authorization_url;
      if (url) { window.location.href = url; return; }
      setError('Could not start sign-in.'); setState('ready');
    } catch { setError('Could not start sign-in.'); setState('ready'); }
  };

  const roleLabel = (r?: string) => (r && ROLE_LABELS[r]?.en) || r || 'Staff';

  const card: React.CSSProperties = {
    maxWidth: 480, margin: '8vh auto', background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 16, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,.08)', textAlign: 'center',
    fontFamily: "'Readex Pro',system-ui,sans-serif",
  };
  const btn: React.CSSProperties = {
    width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 15, fontWeight: 700,
    border: 'none', cursor: 'pointer', background: '#006E6D', color: '#fff', marginTop: 8,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7f8' }}>
      <div style={card}>
        {state === 'loading' && <p style={{ color: '#6b7280' }}>Loading invitation…</p>}

        {state === 'invalid' && (
          <>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '10px 0 6px', color: '#111827' }}>Invitation unavailable</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>{error}</p>
            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 14 }}>
              Ask the administrator who invited you to issue a new link.
            </p>
          </>
        )}

        {(state === 'ready' || state === 'joining') && inv && (
          <>
            <div style={{ fontSize: 40 }}>🪪</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '10px 0 6px', color: '#111827' }}>
              {inv.full_name ? `Welcome, ${inv.full_name}` : 'Join the platform'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 6 }}>
              You've been invited to join the Emirati Human Development Platform as a{' '}
              <b>{roleLabel(inv.role)}</b>{inv.organization ? <> at <b>{inv.organization}</b></> : null}.
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 18 }}>
              Sign in with UAE Pass to complete your registration. Your account is created
              from the identity UAE Pass verifies — nothing else is required.
            </p>
            {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <button style={btn} disabled={state === 'joining'} onClick={continueWithUaePass}>
              {state === 'joining' ? 'Redirecting…' : 'Continue with UAE Pass'}
            </button>
            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 14 }}>
              This link is personal to you and expires — do not forward it.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinStaffPage;
