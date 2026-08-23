import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Award, Plus, Pencil, Eye, EyeOff, Trash2, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

/**
 * Managing the curated scholarship directory.
 *
 * EHRDC does not award these. The directory points at programmes run elsewhere —
 * KHDA's Hamdan bin Mohammed programme, MoHESR's scholarships, university and
 * foundation awards — so an entry's job is to be findable, accurate, and to hand
 * the candidate off to whoever actually takes the application (owner decision,
 * 2026-08-23, after comparing against how Dubai actually runs this).
 *
 * That makes MAINTENANCE the whole feature. Deadlines move every cycle and links
 * rot; an entry nobody has updated sends a candidate to a closed application,
 * which is worse than not listing it. So this screen is built around editing and
 * unpublishing rather than around adding.
 */

const brand = {
    cardBg: '#FFFFFF', border: '#E5E7EB',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280',
    purpleBg: '#F3E8FF', purpleText: '#7C3AED',
    greenBg: '#ECFDF5', greenText: '#059669',
    amberBg: '#FFFBEB', amberText: '#D97706',
    redText: '#DC2626',
};

interface Scholarship {
    id: number;
    title?: string;
    provider_name?: string;
    description?: string;
    amount?: number | string | null;
    coverage_type?: string | null;
    deadline?: string | null;
    min_gpa?: number | string | null;
    academic_level?: string | null;
    application_link?: string | null;
    is_active?: boolean;
}

const BLANK: Partial<Scholarship> = {
    title: '', provider_name: '', description: '', amount: '', coverage_type: '',
    deadline: '', academic_level: '', application_link: '', is_active: true,
};

const ScholarshipDirectoryManager: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => (isRTL ? ar : en);

    const [items, setItems] = useState<Scholarship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<Partial<Scholarship> | null>(null);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [formError, setFormError] = useState('');

    /* /manage, not the public list with a flag: the public route has no JWT
       verification, so a role check there can never see the caller. It also
       answers a different question — what we are maintaining, most of which is
       not currently visible to candidates. */
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await restClient.get('/api/education/scholarships/manage');
            setItems(res.data?.scholarships || res.data?.data || []);
        } catch (e: any) {
            setError(e?.response?.data?.error || t('Could not load the directory.', 'تعذّر تحميل الدليل.'));
        } finally {
            setLoading(false);
        }
    }, [language]);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        if (!editing) return;
        setSaving(true);
        setFormError('');
        const payload: any = { ...editing };
        // Empty strings are "not set", not a value to store.
        Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
        try {
            if (editing.id) {
                await restClient.put(`/api/education/scholarships/${editing.id}`, payload);
            } else {
                await restClient.post('/api/education/scholarships', payload);
            }
            setEditing(null);
            load();
        } catch (e: any) {
            // The API explains WHY it refused (a published entry needs a link);
            // showing that beats a generic failure.
            setFormError(e?.response?.data?.error
                || t('Could not save the entry.', 'تعذّر حفظ المدخل.'));
        } finally {
            setSaving(false);
        }
    };

    const togglePublished = async (s: Scholarship) => {
        setBusyId(s.id);
        try {
            if (s.is_active) {
                await restClient.delete(`/api/education/scholarships/${s.id}`);
            } else {
                await restClient.put(`/api/education/scholarships/${s.id}`, { is_active: true });
            }
            load();
        } catch (e: any) {
            setError(e?.response?.data?.error || t('Could not change that entry.', 'تعذّر تغيير المدخل.'));
        } finally {
            setBusyId(null);
        }
    };

    /* Delete is for an entry added in error. Anything a candidate has actually
       used is unpublished instead, and the API refuses the delete outright. */
    const remove = async (s: Scholarship) => {
        const ok = window.confirm(t(
            `Delete "${s.title}" permanently? Unpublishing keeps it for the next cycle — delete only if it was added by mistake.`,
            `حذف "${s.title}" نهائياً؟ إلغاء النشر يحتفظ به للدورة القادمة — احذفه فقط إذا أُضيف بالخطأ.`));
        if (!ok) return;
        setBusyId(s.id);
        try {
            await restClient.delete(`/api/education/scholarships/${s.id}?hard=true`);
            load();
        } catch (e: any) {
            setError(e?.response?.data?.error || t('Could not delete that entry.', 'تعذّر حذف المدخل.'));
        } finally {
            setBusyId(null);
        }
    };

    const field = (label: string, key: keyof Scholarship, opts: any = {}) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: brand.textSecondary }}>{label}</label>
            {opts.textarea ? (
                <textarea
                    value={(editing?.[key] as any) ?? ''}
                    onChange={e => setEditing(p => ({ ...p, [key]: e.target.value }))}
                    rows={3}
                    style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, fontFamily: 'inherit' }}
                />
            ) : (
                <input
                    type={opts.type || 'text'}
                    value={(editing?.[key] as any) ?? ''}
                    onChange={e => setEditing(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={opts.placeholder}
                    style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13 }}
                />
            )}
        </div>
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loader2 className="animate-spin" size={22} color={brand.purpleText} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} dir={isRTL ? 'rtl' : 'ltr'}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ maxWidth: 620 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
                        {t('Scholarship directory', 'دليل المنح الدراسية')}
                    </h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: '6px 0 0', lineHeight: 1.7 }}>
                        {t('These are programmes run by others — KHDA, MoHESR, universities and foundations. The directory helps candidates find them and sends them to the real application. Keeping deadlines and links current is the job: an out-of-date entry sends someone to a closed application.',
                           'هذه برامج تديرها جهات أخرى — هيئة المعرفة، ووزارة التعليم العالي، والجامعات والمؤسسات. مهمة الدليل أن يساعد المرشحين على إيجادها وأن يوجّههم إلى التقديم الفعلي. والحفاظ على تحديث المواعيد والروابط هو العمل الأساسي: فالمدخل القديم يرسل المتقدم إلى باب مغلق.')}
                    </p>
                </div>
                <button
                    onClick={() => { setFormError(''); setEditing({ ...BLANK }); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.purpleText, color: '#fff',
                             border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={15} /> {t('Add a scholarship', 'إضافة منحة')}
                </button>
            </div>

            {error && (
                <div style={{ background: brand.amberBg, color: brand.amberText, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginInlineEnd: 6 }} />{error}
                </div>
            )}

            {editing && (
                <div style={{ background: brand.cardBg, border: `1px solid ${brand.border}`, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: brand.textPrimary }}>
                        {editing.id ? t('Edit entry', 'تعديل المدخل') : t('New entry', 'مدخل جديد')}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                        {field(t('Title', 'العنوان'), 'title')}
                        {field(t('Provider', 'الجهة'), 'provider_name', { placeholder: 'KHDA, MoHESR…' })}
                        {field(t('Application link', 'رابط التقديم'), 'application_link', { placeholder: 'https://…' })}
                        {field(t('Deadline', 'الموعد النهائي'), 'deadline', { type: 'date' })}
                        {field(t('Academic level', 'المرحلة الدراسية'), 'academic_level')}
                        {field(t('Coverage', 'التغطية'), 'coverage_type', { placeholder: t('Full, tuition only…', 'كاملة، الرسوم فقط…') })}
                    </div>
                    <div style={{ marginTop: 12 }}>
                        {field(t('Who it is for, and what it covers', 'لمن هذه المنحة وما الذي تغطيه'), 'description', { textarea: true })}
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: brand.textPrimary }}>
                        <input type="checkbox" checked={!!editing.is_active}
                               onChange={e => setEditing(p => ({ ...p, is_active: e.target.checked }))} />
                        {t('Visible to candidates', 'ظاهرة للمرشحين')}
                    </label>

                    {formError && (
                        <div style={{ marginTop: 12, background: brand.amberBg, color: brand.amberText,
                                      borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.6 }}>
                            {formError}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button onClick={save} disabled={saving || !editing.title}
                                style={{ background: brand.purpleText, color: '#fff', border: 'none', borderRadius: 8,
                                         padding: '9px 16px', fontSize: 13, fontWeight: 600,
                                         cursor: saving || !editing.title ? 'not-allowed' : 'pointer', opacity: saving || !editing.title ? 0.6 : 1 }}>
                            {saving ? <Loader2 className="animate-spin" size={14} /> : t('Save', 'حفظ')}
                        </button>
                        <button onClick={() => { setEditing(null); setFormError(''); }}
                                style={{ background: 'transparent', color: brand.textSecondary, border: `1px solid ${brand.border}`,
                                         borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>
                            {t('Cancel', 'إلغاء')}
                        </button>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div style={{ background: brand.cardBg, border: `1px solid ${brand.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
                    <Award size={34} color={brand.textSecondary} style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                        {t('The directory is empty', 'الدليل فارغ')}
                    </p>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: '6px 0 0' }}>
                        {t('Nothing is listed yet, so the scholarships page shows candidates an empty state.',
                           'لا توجد مدخلات بعد، لذلك تعرض صفحة المنح حالة فارغة للمرشحين.')}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(s => (
                        <div key={s.id} style={{ background: brand.cardBg, border: `1px solid ${brand.border}`, borderRadius: 12,
                                                 padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 8px',
                                                   background: s.is_active ? brand.greenBg : brand.border,
                                                   color: s.is_active ? brand.greenText : brand.textSecondary }}>
                                        {s.is_active ? t('Visible', 'ظاهرة') : t('Hidden', 'مخفية')}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>
                                    {s.provider_name || t('No provider named', 'بدون جهة محددة')}
                                    {s.deadline ? ` · ${t('closes', 'يُغلق')} ${String(s.deadline).slice(0, 10)}` : ''}
                                </div>
                                {s.application_link ? (
                                    <a href={s.application_link} target="_blank" rel="noopener noreferrer"
                                       style={{ fontSize: 12, color: brand.purpleText, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <ExternalLink size={12} /> {t('Check this link still works', 'تحقّق من أن الرابط ما زال يعمل')}
                                    </a>
                                ) : (
                                    <div style={{ fontSize: 12, color: brand.redText, marginTop: 6 }}>
                                        {t('No application link — cannot be published.', 'لا يوجد رابط تقديم — لا يمكن نشرها.')}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button title={t('Edit', 'تعديل')} onClick={() => { setFormError(''); setEditing({ ...s }); }}
                                        style={{ background: 'transparent', border: `1px solid ${brand.border}`, borderRadius: 8,
                                                 padding: 7, cursor: 'pointer', color: brand.textSecondary }}>
                                    <Pencil size={14} />
                                </button>
                                <button title={s.is_active ? t('Unpublish', 'إلغاء النشر') : t('Publish', 'نشر')}
                                        disabled={busyId === s.id} onClick={() => togglePublished(s)}
                                        style={{ background: 'transparent', border: `1px solid ${brand.border}`, borderRadius: 8,
                                                 padding: 7, cursor: 'pointer', color: brand.textSecondary }}>
                                    {busyId === s.id ? <Loader2 className="animate-spin" size={14} />
                                                     : s.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button title={t('Delete', 'حذف')} disabled={busyId === s.id} onClick={() => remove(s)}
                                        style={{ background: 'transparent', border: `1px solid ${brand.border}`, borderRadius: 8,
                                                 padding: 7, cursor: 'pointer', color: brand.redText }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScholarshipDirectoryManager;
