import React, { useEffect, useState } from 'react';
import { roleLabel as enumRoleLabel } from '@/utils/enumLabels';
import { PLATFORM_NAME_EN } from '@/lib/brand';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Platform-staff invite landing (/join-staff/:token). An admin invites EHRDC
// staff (CRM/career services, operators — typically non-nationals, who cannot
// self-register) by magic link; the invitee completes registration through UAE
// Pass and the OAuth callback redeems the invitation against the identity UAE
// Pass proved (invitation_type=staff).
const API = '';

// Role names come from enumLabels, generated from backend/role_labels.py.
// This file kept its own copy — byte-identical to the one in the other of these
// two files, and different again from the email the invitee had just read: the
// message appointed them "Company Onboarding Operator" while this page called
// them "Employer Relations".

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

  const roleLabel = (r?: string) => (r ? enumRoleLabel(r, 'en') : 'Staff');

  const card: React.CSSProperties = {
    maxWidth: 480, margin: '8vh auto', background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 16, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,.08)', textAlign: 'center',
    fontFamily: "'DIN Next LT Arabic','Readex Pro',system-ui,sans-serif",
  };
  const btn: React.CSSProperties = {
    width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 15, fontWeight: 700,
    border: 'none', cursor: 'pointer', background: '#006E6F', color: '#fff', marginTop: 8,
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
              You've been invited to join the {PLATFORM_NAME_EN} as a{' '}
              <b>{roleLabel(inv.role)}</b>{inv.organization ? <> at <b>{inv.organization}</b></> : null}.
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 18 }}>
              Sign in with UAE Pass to complete your registration. Your account is created
              from the identity UAE Pass verifies — nothing else is required.
            </p>
            {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>{error}</p>}
            {/* The official UAE PASS button, identical to the /auth page — a
                custom teal "Continue with UAE Pass" is not an accepted sign-in
                control (feedback fb_1788426347_8eadbb46, UAE Pass assessment). */}
            <button
              type="button"
              id="uaepass-login-btn"
              style={{ ...btn, background: 'transparent', padding: 0, display: 'flex', justifyContent: 'center' }}
              disabled={state === 'joining'}
              onClick={continueWithUaePass}
              aria-label="Sign in with UAE PASS"
            >
              {state === 'joining' ? (
                <span style={{ height: 50, width: 264, display: 'flex', alignItems: 'center', justifyContent: 'center',
                               background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, color: '#6b7280', fontWeight: 500 }}>
                  Redirecting to UAE PASS…
                </span>
              ) : (
                <img src="/uae-pass-en.svg" alt="Sign in with UAE PASS"
                     style={{ height: 50, width: 264, objectFit: 'contain', borderRadius: 12 }} />
              )}
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
