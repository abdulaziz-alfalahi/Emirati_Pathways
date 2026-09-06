import React, { useEffect, useState } from 'react';
import { PLATFORM_NAME_EN } from '@/lib/brand';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { restClient } from '@/utils/api';

// Team invite landing (/join-team/:token). A teammate joins the platform + the
// workspace via a magic link an HR manager shared. New/logged-out users go through
// UAE Pass (the token rides in the OAuth state, invitation_type=team); an already
// signed-in user joins the workspace directly.
const API = '';

const roleLabel = (r?: string) =>
  r === 'hr_manager' ? 'HR Manager' : r === 'hr' ? 'HR' : 'Recruiter';

const JoinTeamPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'joining' | 'joined'>('loading');
  const [inv, setInv] = useState<{ company_name: string; role: string; valid: boolean } | null>(null);
  const [error, setError] = useState('');
  const loggedIn = (() => { try { return !!localStorage.getItem('access_token'); } catch { return false; } })();

  useEffect(() => {
    if (!token) { setState('invalid'); setError('No invitation token'); return; }
    (async () => {
      try {
        const res = await axios.get(`${API}/api/company/team/invitation/${token}/preview`);
        if (res.data?.success && res.data.invitation?.valid) {
          setInv(res.data.invitation); setState('ready');
        } else {
          setInv(res.data?.invitation || null);
          setError('This invitation link is invalid, expired, or already used.');
          setState('invalid');
        }
      } catch {
        setError('Could not load this invitation.'); setState('invalid');
      }
    })();
  }, [token]);

  const joinWithUaePass = async () => {
    setState('joining');
    try {
      const res = await axios.get(`${API}/api/auth/uaepass/login`, {
        params: { invitation_token: token, invitation_type: 'team' },
        headers: { Accept: 'application/json' },
      });
      const url = res.data?.data?.authorization_url;
      if (url) { window.location.href = url; return; }
      setError('Could not start sign-in.'); setState('ready');
    } catch { setError('Could not start sign-in.'); setState('ready'); }
  };

  const joinAsLoggedIn = async () => {
    setState('joining');
    try {
      await restClient.post(`/api/company/team/invitation/${token}/redeem`, {});
      setState('joined');
      setTimeout(() => navigate('/hr-dashboard'), 1600);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not join the workspace.');
      setState('ready');
    }
  };

  const card: React.CSSProperties = {
    maxWidth: 460, margin: '8vh auto', background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 16, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,.08)', textAlign: 'center',
    fontFamily: "'DIN Next LT Arabic','Readex Pro',system-ui,sans-serif",
  };
  const btn: React.CSSProperties = {
    width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 15, fontWeight: 700,
    border: 'none', cursor: 'pointer', background: '#0d9488', color: '#fff', marginTop: 8,
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
          </>
        )}

        {(state === 'ready' || state === 'joining') && inv && (
          <>
            <div style={{ fontSize: 40 }}>🤝</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '10px 0 6px', color: '#111827' }}>Join {inv.company_name}</h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 18 }}>
              You've been invited to join <b>{inv.company_name}</b> on the {PLATFORM_NAME_EN} as a <b>{roleLabel(inv.role)}</b>.
            </p>
            {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>{error}</p>}
            {loggedIn ? (
              <>
                <button style={btn} disabled={state === 'joining'} onClick={joinAsLoggedIn}>
                  {state === 'joining' ? 'Joining…' : 'Join this workspace'}
                </button>
                <button style={{ ...btn, background: 'transparent', color: '#0d9488', border: '1px solid #0d9488' }}
                  disabled={state === 'joining'} onClick={joinWithUaePass}>
                  Use a different account (UAE Pass)
                </button>
              </>
            ) : (
              // The official UAE PASS button, identical to /auth — the custom teal
              // "Continue with UAE Pass" was rejected in UAT (fb_1788426347_8eadbb46).
              <button
                type="button"
                id="uaepass-login-btn"
                style={{ ...btn, background: 'transparent', padding: 0, display: 'flex', justifyContent: 'center' }}
                disabled={state === 'joining'}
                onClick={joinWithUaePass}
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
            )}
          </>
        )}

        {state === 'joined' && (
          <>
            <div style={{ fontSize: 40 }}>✅</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '10px 0 6px', color: '#111827' }}>You're in!</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Taking you to your workspace…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinTeamPage;
