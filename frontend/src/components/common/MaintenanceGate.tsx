import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Full-screen maintenance notice. Shown when an admin has turned on
// maintenance mode (Admin Dashboard → Modules) and the current visitor is not
// an administrator — admins keep using the platform so they can switch it off.
// Backend enforcement is the before_request gate; this is the human-facing
// half, so a user sees an explanation instead of failing requests.

interface MaintenanceState {
  is_enabled: boolean;
  message_en?: string | null;
  message_ar?: string | null;
  expected_end?: string | null;
}

const POLL_MS = 60000;

const isAdminUser = (): boolean => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return false;
    const u = JSON.parse(raw);
    const roles = [u?.role, ...(Array.isArray(u?.secondary_roles) ? u.secondary_roles : [])]
      .filter(Boolean).map((r: string) => String(r).toLowerCase());
    return roles.some((r) => ['admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator'].includes(r));
  } catch {
    return false;
  }
};

const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MaintenanceState | null>(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await axios.get('/api/maintenance', { headers: { Accept: 'application/json' } });
        if (alive) setState(res.data?.data || { is_enabled: false });
      } catch {
        // Never block the app because the check itself failed.
        if (alive) setState({ is_enabled: false });
      }
    };
    check();
    const id = setInterval(check, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!state?.is_enabled || isAdminUser()) return <>{children}</>;

  const en = state.message_en || 'The \"Emirati\" Human Development Platform is temporarily unavailable while we roll out an upgrade. We will be back shortly — thank you for your patience.';
  const ar = state.message_ar || 'منصة \"إماراتي\" للتنمية البشرية غير متاحة مؤقتاً بينما نعمل على إطلاق تحديث. سنعود قريباً — شكراً لصبركم.';

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg,#f8fafc 0%,#eef6f6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'Readex Pro',system-ui,sans-serif",
    }}>
      <main style={{
        maxWidth: 640, width: '100%', background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 16, padding: '48px 40px', textAlign: 'center',
        boxShadow: '0 10px 30px rgba(15,23,42,.06)',
      }}>
        <img src="/ehrdc-logo.svg" alt="EHRDC" style={{ height: 64, marginBottom: 28 }}
             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f766e', marginBottom: 12 }}>
          We&rsquo;re upgrading the platform
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#475569' }}>{en}</p>
        <div style={{ height: 1, background: '#e2e8f0', margin: '28px 0' }} />
        <div dir="rtl" lang="ar">
          <h1 style={{ fontSize: '1.45rem', fontWeight: 600, color: '#0f766e', marginBottom: 12 }}>
            نعمل على تطوير المنصة
          </h1>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#475569' }}>{ar}</p>
        </div>
        {state.expected_end && (
          <p style={{ marginTop: 24, fontSize: '.85rem', color: '#94a3b8' }}>
            Expected back: {new Date(state.expected_end).toLocaleString()}
          </p>
        )}
        <p style={{ marginTop: 32, fontSize: '.8rem', color: '#94a3b8' }}>
          Emirates Human Resources Development Council &mdash; مجلس تنمية الموارد البشرية الإماراتية
        </p>
      </main>
    </div>
  );
};

export default MaintenanceGate;
