import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ShieldQuestion } from 'lucide-react';
import { PLATFORM_NAME_EN, PLATFORM_NAME_AR, COUNCIL_NAME_EN } from '@/lib/brand';

/**
 * Where a parent lands to confirm or decline a place.
 *
 * PUBLIC, AND THAT IS THE DESIGN
 *
 * Owner decision, 2026-08-30: the young person registers, a parent confirms.
 * The parent is not a platform user and will never have a UAE Pass account.
 * Requiring a sign-in would mean the consent never arrives — and a consent step
 * nobody can complete is worse than none, because the place stays held and the
 * young person never attends.
 *
 * The token in the URL is the credential: 32 random bytes, one registration,
 * single use, expiring in 14 days.
 *
 * The page shows WHAT is being agreed to before offering the buttons. A
 * confirmation nobody understood is not consent, so the programme, its
 * organiser, its dates and the young person's name all appear above the choice.
 */

const brand = {
    primary: '#0F766E', primarySurface: '#F0FDFA',
    border: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280',
    red: '#DC2626', amberBg: '#FFFBEB', amberText: '#B45309',
};

type Request = {
    title?: string; title_ar?: string; organizer?: string; location?: string;
    age_group?: string; start_date?: string; end_date?: string; duration?: string;
    young_person?: string; consent_expires_at?: string;
};

const YouthConsentPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const isAr = (document.documentElement.lang || '').startsWith('ar');
    const t = (en: string, ar: string) => (isAr ? ar : en);

    const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading');
    const [request, setRequest] = useState<Request | null>(null);
    const [expired, setExpired] = useState(false);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        (async () => {
            if (!token) { setState('invalid'); setMessage(t('This link is not valid.', 'هذا الرابط غير صالح.')); return; }
            try {
                const res = await fetch(`/api/youth-programs/consent/${token}`);
                const data = await res.json();
                if (!res.ok || !data.success) {
                    setState('invalid');
                    setMessage(data.error || t('This link is not valid.', 'هذا الرابط غير صالح.'));
                    return;
                }
                setRequest(data.request);
                setExpired(Boolean(data.expired));
                setState('ready');
            } catch {
                setState('invalid');
                setMessage(t('This link could not be opened.', 'تعذّر فتح هذا الرابط.'));
            }
        })();
    }, [token]);

    const decide = async (decision: 'confirm' | 'decline') => {
        setBusy(true);
        try {
            const res = await fetch(`/api/youth-programs/consent/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision }),
            });
            const data = await res.json();
            setMessage(data.message || data.error || '');
            setState(data.success ? 'done' : 'invalid');
        } catch {
            setMessage(t('Something went wrong. Please try the link again.',
                         'حدث خطأ. يرجى المحاولة عبر الرابط مرة أخرى.'));
        } finally { setBusy(false); }
    };

    const row = (label: string, value?: string) => value ? (
        <div style={{ display: 'flex', gap: 10, padding: '7px 0', fontSize: 14 }}>
            <span style={{ color: brand.textSecondary, minWidth: 120 }}>{label}</span>
            <span style={{ color: brand.textPrimary, fontWeight: 500 }}>{value}</span>
        </div>
    ) : null;

    return (
        <div dir={isAr ? 'rtl' : 'ltr'}
             style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`,
                          padding: 28, width: 'min(560px, 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <ShieldQuestion size={22} color={brand.primary} />
                    <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: brand.textPrimary }}>
                        {t('Confirm a place', 'تأكيد المقعد')}
                    </h1>
                </div>
                <p style={{ color: brand.textSecondary, fontSize: 13.5, marginTop: 0 }}>
                    {isAr ? PLATFORM_NAME_AR : PLATFORM_NAME_EN}
                </p>

                {state === 'loading' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: brand.textSecondary }}>
                        <Loader2 size={16} className="animate-spin" /> {t('Loading…', 'جارٍ التحميل…')}
                    </div>
                )}

                {state === 'invalid' && (
                    <div style={{ background: '#FEF2F2', color: brand.red, borderRadius: 10,
                                  padding: '12px 14px', fontSize: 14 }}>
                        {message}
                    </div>
                )}

                {state === 'done' && (
                    <div style={{ background: brand.primarySurface, color: brand.primary,
                                  borderRadius: 10, padding: '14px 16px', fontSize: 14,
                                  display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={18} /> {message}
                    </div>
                )}

                {state === 'ready' && request && (
                    <>
                        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: brand.textPrimary }}>
                            {t(`${request.young_person || 'A young person'} has registered for the programme below. Because its age range may include people under 18, the place is held but not confirmed until you agree to it.`,
                               `سجّل/سجّلت ${request.young_person || 'أحد الشباب'} في البرنامج أدناه. ولأن الفئة العمرية قد تشمل من هم دون الثامنة عشرة، فالمقعد محجوز ولا يُعتمد إلا بموافقتكم.`)}
                        </p>

                        <div style={{ background: '#F9FAFB', border: `1px solid ${brand.border}`,
                                      borderRadius: 12, padding: '10px 16px', margin: '16px 0' }}>
                            {row(t('Programme', 'البرنامج'), isAr ? (request.title_ar || request.title) : request.title)}
                            {row(t('Organiser', 'الجهة المنظِّمة'), request.organizer)}
                            {row(t('Ages', 'الأعمار'), request.age_group)}
                            {row(t('Location', 'المكان'), request.location)}
                            {row(t('Dates', 'التواريخ'),
                                 [request.start_date, request.end_date].filter(Boolean).join(' → '))}
                            {row(t('Duration', 'المدة'), request.duration)}
                        </div>

                        {expired ? (
                            <div style={{ background: brand.amberBg, color: brand.amberText,
                                          borderRadius: 10, padding: '12px 14px', fontSize: 14 }}>
                                {t('This request has expired. The young person can register again.',
                                   'انتهت صلاحية هذا الطلب. يمكن للشاب أو الشابة التسجيل من جديد.')}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button onClick={() => decide('confirm')} disabled={busy}
                                        style={{ flex: '1 1 200px', background: brand.primary, color: '#fff',
                                                 border: 'none', borderRadius: 10, padding: '12px 18px',
                                                 fontSize: 14.5, fontWeight: 600,
                                                 cursor: busy ? 'wait' : 'pointer',
                                                 display: 'flex', alignItems: 'center',
                                                 justifyContent: 'center', gap: 8 }}>
                                    {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    {t('I confirm this place', 'أوافق على هذا المقعد')}
                                </button>
                                <button onClick={() => decide('decline')} disabled={busy}
                                        style={{ flex: '1 1 160px', background: '#fff', color: brand.red,
                                                 border: `1px solid ${brand.border}`, borderRadius: 10,
                                                 padding: '12px 18px', fontSize: 14.5, fontWeight: 600,
                                                 cursor: busy ? 'wait' : 'pointer',
                                                 display: 'flex', alignItems: 'center',
                                                 justifyContent: 'center', gap: 8 }}>
                                    <XCircle size={16} /> {t('Decline', 'رفض')}
                                </button>
                            </div>
                        )}

                        <p style={{ fontSize: 12.5, color: brand.textSecondary, marginTop: 16, lineHeight: 1.6 }}>
                            {t('If you do nothing, the place is released automatically and the programme will not be attended. You do not need an account.',
                               'إذا لم تتخذوا أي إجراء، يُلغى الحجز تلقائياً ولن تتم المشاركة في البرنامج. ولستم بحاجة إلى حساب.')}
                        </p>
                    </>
                )}

                <p style={{ fontSize: 12, color: brand.textSecondary, marginTop: 20, marginBottom: 0 }}>
                    — {COUNCIL_NAME_EN}
                </p>
            </div>
        </div>
    );
};

export default YouthConsentPage;
