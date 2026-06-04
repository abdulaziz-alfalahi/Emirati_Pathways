import React, { useState, useEffect } from 'react';
import { restClient } from '@/utils/api';
import {
    Users, Building2, Briefcase, TrendingUp, Search,
    Filter, Loader2, Send, CheckCircle, AlertTriangle,
    X, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';

const brand = {
    primary: '#0A4D68',
    secondary: '#088395',
    accent: '#05BFDB',
    bg: '#F8FBFC',
    cardBg: '#FFFFFF',
    textPrimary: '#0A2540',
    textSecondary: '#5A6B7B',
    border: '#E2E8F0',
    greenBg: '#ECFDF5',
    greenText: '#059669',
    yellowBg: '#FFFBEB',
    yellowText: '#D97706',
    redBg: '#FEF2F2',
    redText: '#DC2626',
    blueBg: '#EFF6FF',
    blueText: '#2563EB',
};

interface DemandSignal {
    company_id: string;
    company_name: string;
    job_count: number;
    sector: string | null;
    emirate: string | null;
    matching_candidates_count: number;
    first_published_at: string | null;
    last_published_at: string | null;
}

interface DemandSummary {
    total_demand_signals: number;
    total_companies: number;
    total_jobs: number;
    total_candidates: number;
}

interface DemandSignalsTabProps {
    isRTL?: boolean;
    t?: (en: string, ar: string) => string;
}

const DemandSignalsTab: React.FC<DemandSignalsTabProps> = ({
    isRTL = false,
    t = (en: string) => en,
}) => {
    // Data state
    const [signals, setSignals] = useState<DemandSignal[]>([]);
    const [summary, setSummary] = useState<DemandSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 25;

    // Filter state
    const [emirateFilter, setEmirateFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter options
    const [filterOptions, setFilterOptions] = useState<{ emirates: string[]; sectors: string[] }>({ emirates: [], sectors: [] });

    // Invite state
    const [inviting, setInviting] = useState<string | null>(null);
    const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string } | null>(null);

    // Fetch demand signals
    const fetchSignals = async (p = 1) => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page: p, limit };
            if (emirateFilter) params.emirate = emirateFilter;
            if (sectorFilter) params.sector = sectorFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await restClient.get('/api/nafis/demand-signals', { params });
            setSignals(res.data.signals || []);
            setTotal(res.data.total || 0);
            setSummary(res.data.summary || null);
            setPage(p);
        } catch (err) {
            console.error('Failed to fetch demand signals:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch filter options
    const fetchFilterOptions = async () => {
        try {
            const res = await restClient.get('/api/nafis/demand-signals/filter-options');
            setFilterOptions({
                emirates: res.data.emirates || [],
                sectors: res.data.sectors || [],
            });
        } catch (err) {
            console.error('Failed to fetch filter options:', err);
        }
    };

    useEffect(() => {
        fetchSignals(1);
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        fetchSignals(1);
    }, [emirateFilter, sectorFilter]);

    // Handle bulk invite
    const handleBulkInvite = async (companyId: string) => {
        setInviting(companyId);
        setInviteResult(null);
        try {
            // First fetch matching candidates
            const candidatesRes = await restClient.get(`/api/nafis/demand-signals/${companyId}/candidates`, {
                params: { limit: 20 },
            });
            const candidateIds = (candidatesRes.data.candidates || []).map((c: any) => c.id);

            if (candidateIds.length === 0) {
                setInviteResult({ success: false, message: t('No matching candidates found', 'لا يوجد مرشحون مطابقون') });
                setInviting(null);
                return;
            }

            // Then send bulk invite
            const res = await restClient.post(`/api/nafis/demand-signals/${companyId}/bulk-invite`, {
                candidate_ids: candidateIds,
            });

            setInviteResult({
                success: res.data.success,
                message: res.data.message || t('Invitations sent successfully', 'تم إرسال الدعوات بنجاح'),
            });
        } catch (err: any) {
            setInviteResult({
                success: false,
                message: err.response?.data?.error || t('Failed to send invitations', 'فشل في إرسال الدعوات'),
            });
        } finally {
            setInviting(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Summary Cards */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    {[
                        {
                            label: t('Total Demand Signals', 'إجمالي إشارات الطلب'),
                            value: summary.total_demand_signals,
                            icon: TrendingUp,
                            bg: brand.blueBg,
                            color: brand.blueText,
                        },
                        {
                            label: t('Companies Hiring', 'شركات توظف'),
                            value: summary.total_companies,
                            icon: Building2,
                            bg: brand.greenBg,
                            color: brand.greenText,
                        },
                        {
                            label: t('Open Positions', 'وظائف مفتوحة'),
                            value: summary.total_jobs,
                            icon: Briefcase,
                            bg: brand.yellowBg,
                            color: brand.yellowText,
                        },
                        {
                            label: t('Matching Candidates', 'مرشحون مطابقون'),
                            value: summary.total_candidates,
                            icon: Users,
                            bg: '#F5F3FF',
                            color: '#7C3AED',
                        },
                    ].map((card, i) => (
                        <div
                            key={i}
                            style={{
                                background: brand.cardBg,
                                borderRadius: 12,
                                padding: 20,
                                border: `1px solid ${brand.border}`,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 16,
                            }}
                        >
                            <div style={{ background: card.bg, borderRadius: 10, padding: 10 }}>
                                <card.icon size={20} color={card.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>
                                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
                background: brand.cardBg, borderRadius: 12, padding: 16,
                border: `1px solid ${brand.border}`,
            }}>
                <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>
                        {t('Search Company', 'البحث عن شركة')}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary }} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') fetchSignals(1); }}
                            placeholder={t('Company name...', 'اسم الشركة...')}
                            style={{
                                width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
                                border: `1px solid ${brand.border}`, fontSize: 13, outline: 'none',
                                background: 'white', color: brand.textPrimary, boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: '0 1 180px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>
                        {t('Emirate', 'الإمارة')}
                    </div>
                    <select
                        value={emirateFilter}
                        onChange={e => setEmirateFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px', borderRadius: 8,
                            border: `1px solid ${brand.border}`, fontSize: 13, outline: 'none',
                            background: 'white', color: brand.textPrimary, cursor: 'pointer',
                            boxSizing: 'border-box',
                        }}
                    >
                        <option value="">{t('All Emirates', 'كل الإمارات')}</option>
                        {filterOptions.emirates.map(e => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '0 1 180px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: brand.textSecondary, marginBottom: 4 }}>
                        {t('Sector', 'القطاع')}
                    </div>
                    <select
                        value={sectorFilter}
                        onChange={e => setSectorFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px', borderRadius: 8,
                            border: `1px solid ${brand.border}`, fontSize: 13, outline: 'none',
                            background: 'white', color: brand.textPrimary, cursor: 'pointer',
                            boxSizing: 'border-box',
                        }}
                    >
                        <option value="">{t('All Sectors', 'كل القطاعات')}</option>
                        {filterOptions.sectors.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => fetchSignals(1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: brand.primary, color: 'white', border: 'none',
                        padding: '8px 16px', borderRadius: 8, fontSize: 13,
                        fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                >
                    <Search size={14} /> {t('Search', 'بحث')}
                </button>

                <button
                    onClick={() => { setEmirateFilter(''); setSectorFilter(''); setSearchQuery(''); fetchSignals(1); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'white', color: brand.textSecondary, border: `1px solid ${brand.border}`,
                        padding: '8px 12px', borderRadius: 8, fontSize: 13,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                >
                    <RefreshCw size={13} /> {t('Reset', 'إعادة تعيين')}
                </button>
            </div>

            {/* Invite Result Banner */}
            {inviteResult && (
                <div style={{
                    background: inviteResult.success ? brand.greenBg : brand.redBg,
                    borderRadius: 12, padding: 16,
                    border: `1px solid ${inviteResult.success ? brand.greenText : brand.redText}30`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{
                        color: inviteResult.success ? brand.greenText : brand.redText,
                        fontWeight: 600, fontSize: 14,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        {inviteResult.success
                            ? <><CheckCircle size={16} />{inviteResult.message}</>
                            : <><AlertTriangle size={16} />{inviteResult.message}</>
                        }
                    </div>
                    <button
                        onClick={() => setInviteResult(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                        <X size={16} color={brand.textSecondary} />
                    </button>
                </div>
            )}

            {/* Table */}
            <div style={{
                background: brand.cardBg, borderRadius: 12, padding: 24,
                border: `1px solid ${brand.border}`,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>
                        {t('Demand Signals', 'إشارات الطلب')}{' '}
                        <span style={{ fontSize: 13, fontWeight: 400, color: brand.textSecondary }}>({total})</span>
                    </h3>
                    <button
                        onClick={() => fetchSignals(page)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'white', border: `1px solid ${brand.border}`,
                            padding: '6px 12px', borderRadius: 6, fontSize: 13,
                            cursor: 'pointer', color: brand.textSecondary,
                        }}
                    >
                        <RefreshCw size={13} /> {t('Refresh', 'تحديث')}
                    </button>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                    </div>
                )}

                {!loading && signals.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: brand.textSecondary }}>
                        <Building2 size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                        <p>{t('No demand signals yet. Companies that publish jobs will appear here.', 'لا توجد إشارات طلب بعد. الشركات التي تنشر وظائف ستظهر هنا.')}</p>
                    </div>
                )}

                {!loading && signals.length > 0 && (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${brand.border}` }}>
                                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>
                                        {t('Company Name', 'اسم الشركة')}
                                    </th>
                                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>
                                        {t('Sector', 'القطاع')}
                                    </th>
                                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>
                                        {t('Emirate', 'الإمارة')}
                                    </th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>
                                        {t('Job Count', 'عدد الوظائف')}
                                    </th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>
                                        {t('Matching Candidates', 'مرشحون مطابقون')}
                                    </th>
                                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>
                                        {t('First Published', 'أول نشر')}
                                    </th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>
                                        {t('Action', 'إجراء')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {signals.map((s, i) => (
                                    <tr key={s.company_id} style={{ borderBottom: `1px solid ${brand.border}` }}>
                                        <td style={{ padding: '12px', fontWeight: 500, color: brand.textPrimary }}>
                                            {s.company_name || s.company_id}
                                        </td>
                                        <td style={{ padding: '12px', color: brand.textSecondary }}>
                                            {s.sector || '—'}
                                        </td>
                                        <td style={{ padding: '12px', color: brand.textSecondary }}>
                                            {s.emirate || '—'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 13, fontWeight: 600, color: brand.primary,
                                                background: brand.blueBg, padding: '3px 10px',
                                                borderRadius: 20,
                                            }}>
                                                {s.job_count}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 13, fontWeight: 600, color: brand.greenText,
                                                background: brand.greenBg, padding: '3px 10px',
                                                borderRadius: 20,
                                            }}>
                                                {s.matching_candidates_count}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: brand.textSecondary, fontSize: 13 }}>
                                            {s.first_published_at
                                                ? new Date(s.first_published_at).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleBulkInvite(s.company_id)}
                                                disabled={inviting === s.company_id}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    background: inviting === s.company_id ? brand.textSecondary : brand.secondary,
                                                    color: 'white', border: 'none',
                                                    padding: '6px 14px', borderRadius: 6, fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: inviting === s.company_id ? 'not-allowed' : 'pointer',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {inviting === s.company_id
                                                    ? <><Loader2 size={12} className="animate-spin" /> {t('Sending...', 'جاري...')}</>
                                                    : <><Send size={12} /> {t('Bulk Invite', 'دعوة جماعية')}</>
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                                <button
                                    disabled={page <= 1}
                                    onClick={() => fetchSignals(page - 1)}
                                    style={{
                                        padding: '6px 12px', borderRadius: 6,
                                        border: `1px solid ${brand.border}`, background: 'white',
                                        cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                        opacity: page <= 1 ? 0.5 : 1,
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: 13, color: brand.textSecondary }}>
                                    {t('Page', 'صفحة')} {page} / {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => fetchSignals(page + 1)}
                                    style={{
                                        padding: '6px 12px', borderRadius: 6,
                                        border: `1px solid ${brand.border}`, background: 'white',
                                        cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                                        opacity: page >= totalPages ? 0.5 : 1,
                                    }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DemandSignalsTab;
