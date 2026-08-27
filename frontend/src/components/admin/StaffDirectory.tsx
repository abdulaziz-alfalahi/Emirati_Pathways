import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Users, Search, ShieldCheck, Loader2, AlertTriangle, CircleSlash, Layers,
} from 'lucide-react';

/**
 * Who works on the platform, and what each of them can do.
 *
 * WHY THIS REPLACED WHAT WAS HERE
 *
 * Owner, 2026-08-27: "I need a place where I see the platform operator and what
 * roles they are assigned."
 *
 * The tab previously showed "Growth Operator Management", which found its
 * people with a substring search over raw JSON — `secondary_roles::text ILIKE
 * '%operator%'`. It listed seventeen people as growth operators; one was. The
 * rest were assessment, mentorship, career-services, platform and board
 * operators, plus a candidate carrying twenty-seven secondary roles.
 *
 * It also rendered fields the API never sends — an empty workload badge and a
 * bare "%" on every domain card — and carried a fallback that invented
 * workload, trend and KPI numbers with Math.random() if the statistics call
 * failed. Nobody would have known those were fabricated.
 *
 * THREE RULES THIS SCREEN FOLLOWS
 *
 *   1. Every figure is counted. There is no fallback that invents one, because
 *      an administrator deciding who should hold a role cannot tell a real
 *      number from a plausible one.
 *   2. Roles are shown with WHERE THEY CAME FROM. "Why does this person have
 *      this?" is the actual question, and primary-versus-secondary is the only
 *      provenance the data carries.
 *   3. It reports and does not change. Roles are granted on the Users tab and
 *      growth domains on the assignment screen; a third place to do it is how
 *      "Duplicate locations for role assignment" reached the feedback queue.
 */

const brand = {
    border: '#E5E7EB', text: '#1E1B4B', dim: '#6B7280', muted: '#F9FAFB',
    tealBg: '#ECFDF5', tealText: '#0F766E',
    blueBg: '#EFF6FF', blueText: '#2563EB',
    amberBg: '#FFFBEB', amberText: '#B45309',
    redText: '#DC2626',
};

interface RoleEntry {
    role: string;
    label: string;
    label_ar: string;
    source: 'primary' | 'secondary';
    is_staff_role: boolean;
}

interface StaffMember {
    id: string;
    name: string;
    email?: string | null;
    is_active: boolean;
    last_login?: string | null;
    primary_role?: string | null;
    primary_label?: string | null;
    roles: RoleEntry[];
    staff_role_count: number;
    growth_domains: string[];
}

interface RoleCount { role: string; label: string; label_ar: string; count: number; }

const StaffDirectory: React.FC = () => {
    const { language } = useLanguage();
    const isAr = language === 'ar';
    const b = (en: string, ar: string) => (isAr ? ar : en);

    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [byRole, setByRole] = useState<RoleCount[]>([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await restClient.get('/api/admin/staff');
            setStaff(res.data?.staff || []);
            setByRole(res.data?.by_role || []);
            setNote(res.data?.note || '');
        } catch (e: any) {
            setError(e?.response?.data?.message
                || b('Could not load the directory', 'تعذر تحميل الدليل'));
        } finally {
            setLoading(false);
        }
    }, [language]);

    useEffect(() => { load(); }, [load]);

    // Filtered in the browser. The whole directory is a few dozen rows, and a
    // round trip per keystroke would make it feel slower than it is.
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return staff.filter(p => {
            if (roleFilter && !p.roles.some(r => r.role === roleFilter)) return false;
            if (!q) return true;
            return `${p.name} ${p.email || ''}`.toLowerCase().includes(q);
        });
    }, [staff, search, roleFilter]);

    const label = (r: RoleEntry) => (isAr ? r.label_ar : r.label);

    const roleChip = (r: RoleEntry) => (
        <span key={r.role}
              title={r.source === 'primary'
                  ? b('Primary role', 'الدور الأساسي')
                  : b('Additional role', 'دور إضافي')}
              style={{
                  background: r.source === 'primary' ? brand.tealBg : brand.muted,
                  color: r.source === 'primary' ? brand.tealText : brand.dim,
                  border: `1px solid ${r.source === 'primary' ? brand.tealText + '33' : brand.border}`,
                  borderRadius: 999, padding: '2px 10px', fontSize: 12,
                  marginInlineEnd: 6, marginBottom: 4, display: 'inline-block',
                  fontWeight: r.source === 'primary' ? 600 : 400,
              }}>
            {label(r)}
        </span>
    );

    return (
        <div dir={isAr ? 'rtl' : 'ltr'} style={{ color: brand.text }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Users size={20} color={brand.blueText} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {b('Platform staff', 'فريق المنصة')}
                </h2>
                <span style={{ background: brand.blueBg, color: brand.blueText,
                               borderRadius: 999, padding: '2px 12px', fontSize: 13, fontWeight: 600 }}>
                    {staff.length}
                </span>
            </div>
            <p style={{ color: brand.dim, fontSize: 14, marginTop: 0 }}>
                {b('Everyone who holds a role because of a job, and every role they hold. People the platform serves — candidates, students, parents — are not listed here.',
                   'كل من يحمل دوراً بحكم عمله، وجميع الأدوار التي يحملها. أما من تخدمهم المنصة — المرشحون والطلبة وأولياء الأمور — فلا يظهرون هنا.')}
            </p>

            {error && (
                <div style={{ background: '#FEF2F2', color: brand.redText, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{error}</div>
            )}

            {/* Counts across the whole directory, and a one-click filter. */}
            {byRole.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    <button onClick={() => setRoleFilter('')}
                            style={{ background: roleFilter ? '#fff' : brand.blueBg,
                                     color: roleFilter ? brand.dim : brand.blueText,
                                     border: `1px solid ${brand.border}`, borderRadius: 999,
                                     padding: '4px 12px', fontSize: 12.5, cursor: 'pointer',
                                     fontWeight: roleFilter ? 400 : 600 }}>
                        {b('All', 'الكل')} ({staff.length})
                    </button>
                    {byRole.map(r => (
                        <button key={r.role} onClick={() => setRoleFilter(
                                    roleFilter === r.role ? '' : r.role)}
                                style={{ background: roleFilter === r.role ? brand.blueBg : '#fff',
                                         color: roleFilter === r.role ? brand.blueText : brand.dim,
                                         border: `1px solid ${brand.border}`, borderRadius: 999,
                                         padding: '4px 12px', fontSize: 12.5, cursor: 'pointer',
                                         fontWeight: roleFilter === r.role ? 600 : 400 }}>
                            {isAr ? r.label_ar : r.label} ({r.count})
                        </button>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', marginBottom: 14, maxWidth: 380 }}>
                <Search size={15} color={brand.dim}
                        style={{ position: 'absolute', insetInlineStart: 10, top: 10 }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder={b('Search by name or email', 'ابحث بالاسم أو البريد')}
                       style={{ width: '100%', border: `1px solid ${brand.border}`,
                                borderRadius: 8, padding: '8px 12px', paddingInlineStart: 32,
                                fontSize: 13.5 }} />
            </div>

            {loading ? (
                <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: brand.dim, fontSize: 13 }}>
                    <Loader2 size={15} className="animate-spin" /> {b('Loading…', 'جارٍ التحميل…')}
                </p>
            ) : visible.length === 0 ? (
                <div style={{ background: brand.muted, border: `1px dashed ${brand.border}`,
                              borderRadius: 10, padding: 26, textAlign: 'center', color: brand.dim }}>
                    {search || roleFilter
                        ? b('Nobody matches that.', 'لا أحد يطابق هذا البحث.')
                        : b('No staff are recorded.', 'لا يوجد فريق مسجّل.')}
                </div>
            ) : (
                <div style={{ overflowX: 'auto', border: `1px solid ${brand.border}`, borderRadius: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                        <thead>
                            <tr style={{ background: brand.muted }}>
                                {[b('Person', 'الشخص'), b('Roles held', 'الأدوار'),
                                  b('Growth domains', 'مجالات النمو'),
                                  b('Last signed in', 'آخر دخول')].map(h => (
                                    <th key={h} style={{ textAlign: isAr ? 'right' : 'left',
                                                         padding: '10px 12px', fontWeight: 600,
                                                         borderBottom: `1px solid ${brand.border}` }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map(p => (
                                <tr key={p.id} style={{ borderBottom: `1px solid ${brand.border}` }}>
                                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                                        <div style={{ fontWeight: 600, display: 'flex',
                                                      alignItems: 'center', gap: 6 }}>
                                            {p.name}
                                            {!p.is_active && (
                                                <span title={b('Suspended', 'موقوف')}
                                                      style={{ color: brand.redText, display: 'flex' }}>
                                                    <CircleSlash size={13} />
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: brand.dim, fontSize: 12, direction: 'ltr',
                                                      unicodeBidi: 'embed',
                                                      textAlign: isAr ? 'right' : 'left' }}>
                                            {p.email || '—'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: 460 }}>
                                        {p.roles.filter(r => r.is_staff_role).map(roleChip)}
                                        {/* Non-staff roles are shown quietly rather than
                                            hidden: somebody who is both an operator and a
                                            candidate is a fact worth seeing on this row. */}
                                        {p.roles.some(r => !r.is_staff_role) && (
                                            <div style={{ fontSize: 11.5, color: brand.dim, marginTop: 2 }}>
                                                {b('also', 'وأيضاً')}:{' '}
                                                {p.roles.filter(r => !r.is_staff_role)
                                                        .map(r => label(r)).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                                        {p.growth_domains.length === 0 ? (
                                            <span style={{ color: brand.dim }}>—</span>
                                        ) : p.growth_domains.map(d => (
                                            <span key={d} style={{ background: brand.amberBg,
                                                                   color: brand.amberText,
                                                                   border: `1px solid ${brand.border}`,
                                                                   borderRadius: 999, padding: '2px 9px',
                                                                   fontSize: 12, marginInlineEnd: 5,
                                                                   display: 'inline-flex', alignItems: 'center',
                                                                   gap: 4 }}>
                                                <Layers size={11} />{d}
                                            </span>
                                        ))}
                                    </td>
                                    <td style={{ padding: '10px 12px', verticalAlign: 'top',
                                                 color: brand.dim, whiteSpace: 'nowrap' }}>
                                        {p.last_login
                                            ? new Date(p.last_login).toLocaleDateString()
                                            : b('never', 'لم يسجّل دخولاً')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start',
                          fontSize: 12, color: brand.dim }}>
                <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                    {b('A teal chip is the person\'s primary role; a grey one was added on top. ',
                       'الشارة الخضراء هي الدور الأساسي، والرمادية دور أُضيف إليه. ')}
                    {note && (isAr
                        ? 'تُمنح الأدوار من تبويب المستخدمين، ومجالات النمو من شاشة التعيين. هذه الشاشة للعرض فقط.'
                        : note)}
                </span>
            </div>
        </div>
    );
};

export default StaffDirectory;
