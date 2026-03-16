import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/tokenUtils';
import { getDisplayName } from '@/utils/nameUtils';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    GraduationCap, Building2, BookOpen, Users, Settings, Search,
    Clock, AlertTriangle, TrendingUp, Plus, Eye, UserCheck, UserX, FileText, CheckCircle, XCircle
} from 'lucide-react';

const brand = {
    primary: '#6D28D9', secondary: '#7C3AED', accent: '#A78BFA',
    bg: '#FAF8FF', cardBg: '#FFFFFF',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280', border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    purpleBg: '#F3E8FF', purpleText: '#7C3AED',
};

const API_BASE = import.meta.env.VITE_API_URL || '';

const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
};

const EducationOperatorDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState<any>({ institutions: 0, active_programs: 0, enrolled_students: 0, pending_approvals: 0, enrollment_by_type: [] });
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [pendingPrograms, setPendingPrograms] = useState<any[]>([]);
    const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
    const [roleRequests, setRoleRequests] = useState<any[]>([]);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                if (activeTab === 'overview') {
                    const [statsResp, pendingResp] = await Promise.all([
                        fetch(`${API_BASE}/api/education/operator/stats`),
                        fetch(`${API_BASE}/api/education/operator/programs/pending`),
                    ]);
                    if (statsResp.ok && !cancelled) setStats(await statsResp.json());
                    if (pendingResp.ok && !cancelled) { const d = await pendingResp.json(); setPendingPrograms(d.programs || []); }
                } else if (activeTab === 'institutions') {
                    const resp = await fetch(`${API_BASE}/api/education/operator/institutions`);
                    if (resp.ok && !cancelled) { const d = await resp.json(); setInstitutions(d.institutions || []); }
                } else if (activeTab === 'programs') {
                    const resp = await fetch(`${API_BASE}/api/education/university-programs`);
                    if (resp.ok && !cancelled) { const d = await resp.json(); setPendingPrograms(d.programs || []); }
                } else if (activeTab === 'enrollment') {
                    const resp = await fetch(`${API_BASE}/api/education/operator/enrollments/recent`);
                    if (resp.ok && !cancelled) { const d = await resp.json(); setRecentEnrollments(d.enrollments || []); }
                } else if (activeTab === 'requests') {
                    const resp = await fetch(`${API_BASE}/api/roles/operator/requests`, { headers: getAuthHeaders() });
                    if (resp.ok && !cancelled) { const d = await resp.json(); setRoleRequests(d.data || []); }
                }
            } catch (err) { console.error('Edu operator fetch error:', err); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [activeTab]);

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'institutions', label: t('Institutions', 'المؤسسات'), icon: Building2 },
        { id: 'programs', label: t('Programs', 'البرامج'), icon: BookOpen },
        { id: 'enrollment', label: t('Enrollment', 'التسجيل'), icon: Users },
        { id: 'requests', label: t('Requests', 'الطلبات'), icon: FileText, badge: roleRequests.length || undefined },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const overviewStats = [
        { label: t('Institutions', 'المؤسسات'), value: stats.institutions?.toLocaleString() || '0', icon: Building2 },
        { label: t('Active Programs', 'البرامج النشطة'), value: stats.active_programs?.toLocaleString() || '0', icon: BookOpen },
        { label: t('Enrolled Students', 'الطلاب المسجلون'), value: stats.enrolled_students?.toLocaleString() || '0', icon: GraduationCap },
        { label: t('Pending Approvals', 'بانتظار الموافقة'), value: stats.pending_approvals?.toLocaleString() || '0', icon: Clock },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.purpleBg, borderRadius: 10, padding: 10 }}><s.icon size={20} color={brand.purpleText} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <AlertTriangle size={16} color={brand.yellowText} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Pending Program Approvals', 'برامج بانتظار الموافقة')}
                    </h3>
                    {pendingPrograms.length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No pending programs', 'لا توجد برامج معلقة')}</div>}
                    {pendingPrograms.slice(0, 5).map((p: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < Math.min(pendingPrograms.length, 5) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (p.name_ar || p.name) : p.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.institution} • {p.program_type} • {p.created_at?.split('T')[0]}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.greenBg, color: brand.greenText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ {t('Approve', 'موافقة')}</button>
                                <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t('Review', 'مراجعة')}</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Enrollment by Type', 'التسجيل حسب النوع')}</h3>
                    {(stats.enrollment_by_type || []).map((e: any, i: number) => {
                        const total = stats.enrolled_students || 1;
                        const pct = Math.round(((e.total_enrolled || 0) / total) * 100);
                        return (
                            <div key={i} style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, color: brand.textPrimary }}>{e.ptype}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary }}>{(e.total_enrolled || 0).toLocaleString()} ({pct}%)</span>
                                </div>
                                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: brand.primary, borderRadius: 4, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderInstitutions = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary }} />
                    <input placeholder={t('Search institutions...', 'بحث عن مؤسسات...')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Institution', 'إضافة مؤسسة')}
                </button>
            </div>
            {institutions.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No institutions found', 'لم يتم العثور على مؤسسات')}</div>}
            {institutions.map((inst: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.purpleBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={20} color={brand.purpleText} /></div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (inst.name_ar || inst.name) : inst.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{inst.type || 'University'} • {inst.location} • {inst.program_count || 0} {t('programs', 'برنامج')} • {(inst.student_count || 0).toLocaleString()} {t('students', 'طالب')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: inst.is_active ? brand.greenBg : brand.yellowBg, color: inst.is_active ? brand.greenText : brand.yellowText }}>
                            {inst.is_active ? t('Active', 'نشط') : t('Pending', 'قيد الانتظار')}
                        </span>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.primary, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('Manage', 'إدارة')}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPrograms = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('All', 'الكل'), t('Active', 'نشط'), t('Pending', 'قيد الانتظار'), t('Draft', 'مسودة')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Program', 'إضافة برنامج')}
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {pendingPrograms.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No programs found', 'لم يتم العثور على برامج')}</div>}
                {pendingPrograms.map((p: any, i: number) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (p.name_ar || p.name) : p.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>{p.institution || p.university} • {p.program_type}</div>
                            </div>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: p.is_active ? brand.greenBg : brand.yellowBg, color: p.is_active ? brand.greenText : brand.yellowText }}>{p.is_active ? t('Published', 'منشور') : t('Pending', 'قيد الانتظار')}</span>
                        </div>
                        <div style={{ fontSize: 13, color: brand.textSecondary }}><Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {p.enrolled || 0} {t('enrolled', 'مسجل')}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderEnrollment = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Recent Enrollments', 'التسجيلات الأخيرة')}</h3>
                {recentEnrollments.length === 0 && !loading && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No recent enrollments', 'لا توجد تسجيلات حديثة')}</div>}
                {recentEnrollments.map((e: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < recentEnrollments.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{e.program}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{e.institution} • {e.program_type} • {(e.enrolled || 0).toLocaleString()} {t('enrolled', 'مسجل')}</div>
                        </div>
                        <span style={{ fontSize: 12, color: brand.textSecondary }}>{e.created_at?.split(' ')[0]}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
        setActioningId(requestId);
        try {
            const resp = await fetch(`${API_BASE}/api/roles/operator/request/${requestId}/action`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ action }),
            });
            if (resp.ok) {
                setRoleRequests(prev => prev.filter(r => String(r.id) !== String(requestId)));
                setExpandedRequestId(null);
            }
        } catch (err) {
            console.error('Request action failed:', err);
        } finally {
            setActioningId(null);
        }
    };

    const renderRoleRequests = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <FileText size={18} color={brand.purpleText} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                        {t('Pending Role Requests', 'طلبات الأدوار المعلقة')}
                    </h3>
                    {roleRequests.length > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: brand.yellowBg, color: brand.yellowText }}>
                            {roleRequests.length}
                        </span>
                    )}
                </div>

                {roleRequests.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
                        <UserCheck size={40} color={brand.border} style={{ marginBottom: 12 }} />
                        <div style={{ fontSize: 14 }}>{t('No pending requests at this time', 'لا توجد طلبات معلقة في الوقت الحالي')}</div>
                    </div>
                )}

                {roleRequests.map((req: any, i: number) => {
                    const isExpanded = expandedRequestId === String(req.id);
                    const isActioning = actioningId === String(req.id);
                    const noteLines = (req.admin_notes || req.notes || '').split('\n').filter((l: string) => l.trim());
                    // Parse documents/role_fields from JSON
                    let documents: Record<string, any> = {};
                    try {
                        documents = typeof req.documents === 'string' ? JSON.parse(req.documents) : (req.documents || {});
                    } catch { /* ignore */ }
                    const roleFields = documents.role_fields || {};
                    const hasDetails = noteLines.length > 0 || Object.keys(roleFields).length > 0;

                    return (
                        <div key={req.id || i} style={{
                            borderRadius: 10,
                            border: isExpanded ? `2px solid ${brand.accent}` : `1px solid ${brand.border}`,
                            marginBottom: i < roleRequests.length - 1 ? 12 : 0,
                            background: isExpanded ? '#FAFAFF' : 'white',
                            transition: 'all 0.2s ease',
                            overflow: 'hidden',
                        }}>
                            {/* Clickable Header Row */}
                            <div
                                onClick={() => setExpandedRequestId(isExpanded ? null : String(req.id))}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '16px 20px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                                onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'; }}
                                onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>
                                            {getDisplayName(req, req.email)}
                                        </span>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                                            background: brand.purpleBg, color: brand.purpleText,
                                        }}>
                                            → {req.requested_role}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                        {req.email} • {t('Submitted', 'قُدّم')}: {req.created_at?.split(' ')[0] || req.created_at?.split('T')[0]}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 12, color: brand.textSecondary }}>
                                        {isExpanded ? t('Hide Details', 'إخفاء التفاصيل') : t('View Details', 'عرض التفاصيل')}
                                    </span>
                                    <Eye size={16} color={brand.primary} style={{ transform: isExpanded ? 'rotate(0deg)' : 'none', transition: 'transform 0.2s' }} />
                                </div>
                            </div>

                            {/* Expandable Detail Panel */}
                            {isExpanded && (
                                <div style={{
                                    padding: '0 20px 20px',
                                    borderTop: `1px solid ${brand.border}`,
                                    animation: 'fadeIn 0.2s ease',
                                }}>
                                    {/* Role-specific fields */}
                                    {Object.keys(roleFields).length > 0 && (
                                        <div style={{ marginTop: 16, marginBottom: 16 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 10 }}>
                                                {t('Application Details', 'تفاصيل الطلب')}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#F9FAFB', borderRadius: 8, padding: 16 }}>
                                                {Object.entries(roleFields).map(([key, value]: [string, any]) => (
                                                    <div key={key}>
                                                        <div style={{ fontSize: 11, color: brand.textSecondary, marginBottom: 2, textTransform: 'capitalize' }}>
                                                            {key.replace(/_/g, ' ')}
                                                        </div>
                                                        <div style={{ fontSize: 13, fontWeight: 500, color: brand.textPrimary }}>{String(value) || '—'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {noteLines.length > 0 && (
                                        <div style={{ marginTop: Object.keys(roleFields).length > 0 ? 0 : 16, marginBottom: 16 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                                                {t('Applicant Notes', 'ملاحظات المتقدم')}
                                            </div>
                                            <div style={{ fontSize: 13, color: brand.textSecondary, background: '#F9FAFB', borderRadius: 8, padding: 14, lineHeight: 1.6 }}>
                                                {noteLines.map((line: string, j: number) => (
                                                    <div key={j} style={{ marginBottom: 4 }}>{line}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No extra details */}
                                    {!hasDetails && (
                                        <div style={{ marginTop: 16, marginBottom: 16, fontSize: 13, color: brand.textSecondary, fontStyle: 'italic' }}>
                                            {t('No additional details were submitted with this request.', 'لم يتم تقديم تفاصيل إضافية مع هذا الطلب.')}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: `1px solid ${brand.border}` }}>
                                        <button
                                            disabled={isActioning}
                                            onClick={(e) => { e.stopPropagation(); handleRequestAction(String(req.id), 'reject'); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '10px 24px', borderRadius: 8,
                                                border: `1px solid ${brand.border}`, background: 'white',
                                                color: '#EF4444',
                                                fontSize: 14, fontWeight: 600, cursor: isActioning ? 'wait' : 'pointer',
                                                opacity: isActioning ? 0.6 : 1,
                                            }}
                                        >
                                            <XCircle size={16} /> {t('Reject', 'رفض')}
                                        </button>
                                        <button
                                            disabled={isActioning}
                                            onClick={(e) => { e.stopPropagation(); handleRequestAction(String(req.id), 'approve'); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '10px 24px', borderRadius: 8, border: 'none',
                                                background: brand.primary, color: 'white',
                                                fontSize: 14, fontWeight: 600, cursor: isActioning ? 'wait' : 'pointer',
                                                opacity: isActioning ? 0.6 : 1,
                                            }}
                                        >
                                            <CheckCircle size={16} /> {t('Approve', 'موافقة')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Auto-Approve Institutions', 'الموافقة التلقائية على المؤسسات'), desc: t('Automatically approve institutions from accredited bodies', 'الموافقة التلقائية على المؤسسات من الجهات المعتمدة'), value: t('Disabled', 'معطّل') },
                { title: t('Program Review SLA', 'مدة مراجعة البرامج'), desc: t('Maximum days to review a submitted program', 'الحد الأقصى لأيام مراجعة البرنامج المقدم'), value: t('3 Days', '3 أيام') },
                { title: t('Enrollment Cap', 'سقف التسجيل'), desc: t('Maximum students per program before requiring approval', 'الحد الأقصى للطلاب لكل برنامج قبل طلب الموافقة'), value: '500' },
                { title: t('KHDA Integration', 'تكامل هيئة المعرفة'), desc: t('Sync with KHDA for school accreditation data', 'المزامنة مع هيئة المعرفة لبيانات الاعتماد'), value: t('Enabled', 'مفعّل') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.purpleBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.purpleBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <GraduationCap size={16} color={brand.purpleText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.purpleText }}>{t('Education Operator', 'مشغل التعليم')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Education Operations Dashboard', 'لوحة عمليات التعليم')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Manage institutions, programs, scholarships, and student enrollment', 'إدارة المؤسسات والبرامج والمنح الدراسية وتسجيل الطلاب')}</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: brand.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${brand.border}`, marginBottom: 24 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: activeTab === tab.id ? brand.primary : 'transparent',
                            color: activeTab === tab.id ? 'white' : brand.textSecondary, transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                            {(tab as any).badge && (
                                <span style={{ fontSize: 10, fontWeight: 700, background: '#EF4444', color: 'white', borderRadius: 10, padding: '1px 6px', marginLeft: 4 }}>
                                    {(tab as any).badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                {loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Loading...', 'جاري التحميل...')}</div>}
                {!loading && activeTab === 'overview' && renderOverview()}
                {!loading && activeTab === 'institutions' && renderInstitutions()}
                {!loading && activeTab === 'programs' && renderPrograms()}
                {!loading && activeTab === 'enrollment' && renderEnrollment()}
                {!loading && activeTab === 'requests' && renderRoleRequests()}
                {!loading && activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default EducationOperatorDashboard;
