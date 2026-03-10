import React, { useState, useEffect, useRef } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import {
    Users, Upload, UserCheck, BarChart3, Settings, Search,
    CheckCircle, Clock, AlertTriangle, TrendingUp, FileText,
    ArrowUp, ArrowDown, Filter, Download, RefreshCw, Eye,
    Loader2, X, ChevronLeft, ChevronRight, Send, Mail,
    ChevronDown, ChevronUp, RotateCcw
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

interface ImportBatch {
    id: number;
    batch_code: string;
    filename: string | null;
    total_records: number;
    successful: number;
    failed: number;
    duplicates: number;
    status: string;
    created_at: string;
}

interface JobSeeker {
    id: number;
    emirates_id: string;
    full_name: string;
    full_name_arabic: string | null;
    gender: string;
    education_level: string;
    specialization: string | null;
    experience_years: number;
    email: string | null;
    phone: string | null;
    emirate_of_residence: string | null;
    age_group: string | null;
    status: string;
    user_id: number | null;
    created_at: string;
    batch_code: string | null;
}

interface Stats {
    total_seekers: number;
    active_profiles: number;
    pending_import: number;
    invited: number;
    placed: number;
    matched: number;
    total_batches: number;
    total_records_imported: number;
    education_breakdown: { education_level: string; count: number }[];
    gender_breakdown: { gender: string; count: number }[];
}

// ─── Filter Helper Components ───
const filterInputBase: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 8,
    border: '1px solid #E2E8F0', fontSize: 13, outline: 'none',
    background: 'white', color: '#0A2540', boxSizing: 'border-box',
};

const FilterSelect: React.FC<{
    label: string; value: string; options: string[];
    labels?: string[]; onChange: (v: string) => void;
}> = ({ label, value, options, labels, onChange }) => (
    <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#5A6B7B', marginBottom: 4 }}>{label}</div>
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...filterInputBase, cursor: 'pointer' }}>
            <option value="">All</option>
            {options.map((o, i) => (
                <option key={o} value={o}>{labels ? labels[i] : o}</option>
            ))}
        </select>
    </div>
);

const FilterRange: React.FC<{
    label: string; minVal: string; maxVal: string;
    onMinChange: (v: string) => void; onMaxChange: (v: string) => void;
    step?: string;
}> = ({ label, minVal, maxVal, onMinChange, onMaxChange, step }) => (
    <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#5A6B7B', marginBottom: 4 }}>{label}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" placeholder="Min" value={minVal} onChange={e => onMinChange(e.target.value)} step={step} style={{ ...filterInputBase, width: '50%' }} />
            <span style={{ color: '#5A6B7B', fontSize: 12 }}>–</span>
            <input type="number" placeholder="Max" value={maxVal} onChange={e => onMaxChange(e.target.value)} step={step} style={{ ...filterInputBase, width: '50%' }} />
        </div>
    </div>
);

const FilterDate: React.FC<{
    label: string; value: string; onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
    <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#5A6B7B', marginBottom: 4 }}>{label}</div>
        <input type="date" value={value} onChange={e => onChange(e.target.value)} style={filterInputBase} />
    </div>
);

const FilterMultiSelect: React.FC<{
    label: string; selected: string[]; options: string[]; onChange: (v: string[]) => void;
}> = ({ label, selected, options, onChange }) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = search
        ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
        : options;

    const toggle = (val: string) => {
        onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#5A6B7B', marginBottom: 4 }}>{label}</div>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    ...filterInputBase, cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.length === 0 ? 'All' : `${selected.length} selected`}
                </span>
                <span style={{ fontSize: 10, color: '#5A6B7B' }}>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'white', border: '1px solid #E2E8F0', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,.12)', maxHeight: 260, display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0' }}>
                        <input
                            type="text" placeholder="Search..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ ...filterInputBase, border: '1px solid #CBD5E1', fontSize: 12 }}
                            autoFocus
                        />
                    </div>
                    {selected.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            style={{
                                padding: '4px 10px', fontSize: 11, color: '#E53E3E', background: 'none',
                                border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600,
                            }}
                        >Clear all ({selected.length})</button>
                    )}
                    <div style={{ overflowY: 'auto', maxHeight: 200 }}>
                        {filtered.map(o => (
                            <label
                                key={o}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                                    fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                                    background: selected.includes(o) ? '#EBF5FF' : 'transparent',
                                }}
                            >
                                <input
                                    type="checkbox" checked={selected.includes(o)}
                                    onChange={() => toggle(o)}
                                    style={{ accentColor: '#0073E6' }}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o}</span>
                            </label>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ padding: 12, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>No matches</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const NafisTalentDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    // Data state
    const [stats, setStats] = useState<Stats | null>(null);
    const [batches, setBatches] = useState<ImportBatch[]>([]);
    const [seekers, setSeekers] = useState<JobSeeker[]>([]);
    const [seekerTotal, setSeekerTotal] = useState(0);
    const [seekerPage, setSeekerPage] = useState(1);
    const [seekerSearch, setSeekerSearch] = useState('');
    const [seekerStatusFilter, setSeekerStatusFilter] = useState('');
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [loadingSeekers, setLoadingSeekers] = useState(false);

    // Import state
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selection & invite state
    const [selectedSeekers, setSelectedSeekers] = useState<Set<number>>(new Set());
    const [inviting, setInviting] = useState(false);
    const [inviteResult, setInviteResult] = useState<any>(null);

    // Advanced filters state
    const [showFilters, setShowFilters] = useState(false);
    const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({
        gender: '', age_group: '', education_level: '', specialization: '',
        sub_specialization: '', job_seeker_type: '', preferred_work_mode: '',
        national_service: '', emirate_of_origin: '', emirate_of_residence: '',
        city_name: '', marital_status: '', determination_type: '',
        is_student: '', is_person_of_determination: '',
        experience_min: '', experience_max: '', gpa_min: '', gpa_max: '',
        registered_from: '', registered_to: '', job_seeker_date_from: '', job_seeker_date_to: '',
    });
    const activeFilterCount = Object.values(advancedFilters).filter(v => v !== '').length;

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: BarChart3 },
        { id: 'import', label: t('Bulk Import', 'استيراد جماعي'), icon: Upload },
        { id: 'audit', label: t('Profile Audit', 'تدقيق الملفات'), icon: UserCheck },
        { id: 'tracking', label: t('Placement Tracking', 'تتبع التوظيف'), icon: TrendingUp },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    // ─── Data Fetching ───
    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await restClient.get('/api/nafis-talent/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchBatches = async () => {
        setLoadingBatches(true);
        try {
            const res = await restClient.get('/api/nafis-talent/batches');
            setBatches(res.data.batches || []);
        } catch (err) {
            console.error('Failed to fetch batches:', err);
        } finally {
            setLoadingBatches(false);
        }
    };

    const fetchSeekers = async (page = 1) => {
        setLoadingSeekers(true);
        try {
            const params: any = { page, limit: 25 };
            if (seekerSearch) params.search = seekerSearch;
            if (seekerStatusFilter) params.status = seekerStatusFilter;
            // Append advanced filters
            for (const [k, v] of Object.entries(advancedFilters)) {
                if (v !== '') params[k] = v;
            }
            const res = await restClient.get('/api/nafis-talent/seekers', { params });
            setSeekers(res.data.seekers || []);
            setSeekerTotal(res.data.total || 0);
            setSeekerPage(page);
        } catch (err) {
            console.error('Failed to fetch seekers:', err);
        } finally {
            setLoadingSeekers(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const res = await restClient.get('/api/nafis-talent/filter-options');
            console.log('[NAFIS] filter-options response:', res.data);
            setFilterOptions(res.data || {});
        } catch (err) {
            console.error('Failed to fetch filter options:', err);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchBatches();
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        if (activeTab === 'audit') {
            fetchSeekers(1);
        }
    }, [activeTab, seekerStatusFilter]);

    // ─── CSV Import ───
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await restClient.post('/api/nafis-talent/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setImportResult(res.data);
            // Refresh data
            fetchBatches();
            fetchStats();
        } catch (err: any) {
            setImportResult({
                error: err.response?.data?.error || 'Import failed',
            });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ─── Overview Tab ───
    const renderOverview = () => {
        const kpis = stats ? [
            { label: t('Total Candidates', 'إجمالي المرشحين'), value: stats.total_seekers.toLocaleString(), change: `+${stats.total_records_imported}`, up: true, icon: Users },
            { label: t('Active Profiles', 'الملفات النشطة'), value: stats.active_profiles.toLocaleString(), change: '', up: true, icon: CheckCircle },
            { label: t('Pending Import', 'قيد الاستيراد'), value: stats.pending_import.toLocaleString(), change: '', up: false, icon: Clock },
            { label: t('Placed', 'تم توظيفهم'), value: stats.placed.toLocaleString(), change: '', up: true, icon: TrendingUp },
        ] : [];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {loadingStats && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                    </div>
                )}

                {!loadingStats && stats && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                            {kpis.map((s, i) => (
                                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                    <div style={{ background: brand.blueBg, borderRadius: 10, padding: 10 }}>
                                        <s.icon size={20} color={brand.blueText} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                                        {s.change && (
                                            <div style={{ fontSize: 12, color: s.up ? brand.greenText : brand.redText, display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
                                                {s.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {s.change} {t('total imported', 'إجمالي المستورد')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Recent Imports */}
                            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Recent Imports', 'آخر عمليات الاستيراد')}</h3>
                                {batches.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 20, color: brand.textSecondary, fontSize: 14 }}>
                                        {t('No imports yet', 'لا توجد عمليات استيراد بعد')}
                                    </div>
                                )}
                                {batches.slice(0, 4).map((imp, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < Math.min(batches.length, 4) - 1 ? `1px solid ${brand.border}` : 'none' }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{imp.batch_code}</div>
                                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{imp.total_records} {t('records', 'سجل')} • {new Date(imp.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {imp.status === 'completed' && <span style={{ fontSize: 12, color: brand.greenText, background: brand.greenBg, padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>✓ {imp.successful} {t('imported', 'مستورد')}</span>}
                                            {imp.status === 'processing' && <span style={{ fontSize: 12, color: brand.yellowText, background: brand.yellowBg, padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>⟳ {t('Processing', 'قيد المعالجة')}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Education Breakdown */}
                            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Education Breakdown', 'توزيع المستوى التعليمي')}</h3>
                                {stats.education_breakdown.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 20, color: brand.textSecondary, fontSize: 14 }}>
                                        {t('No data yet', 'لا توجد بيانات بعد')}
                                    </div>
                                )}
                                {stats.education_breakdown.map((p, i) => {
                                    const maxCount = Math.max(...stats.education_breakdown.map(x => x.count), 1);
                                    const pct = Math.round((p.count / maxCount) * 100);
                                    return (
                                        <div key={i} style={{ marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: 13, color: brand.textPrimary }}>{p.education_level || t('Not specified', 'غير محدد')}</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary }}>{p.count}</span>
                                            </div>
                                            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                                                <div style={{ height: '100%', width: `${pct}%`, background: brand.accent, borderRadius: 4, transition: 'width 0.5s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {!loadingStats && !stats && (
                    <div style={{ textAlign: 'center', padding: 60, color: brand.textSecondary }}>
                        <Users size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                        <p>{t('Import job seekers to see statistics', 'قم باستيراد باحثين عن عمل لعرض الإحصائيات')}</p>
                    </div>
                )}
            </div>
        );
    };

    // ─── Bulk Import Tab ───
    const renderBulkImport = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Upload Area */}
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 32, border: `2px dashed ${brand.accent}`, textAlign: 'center' }}>
                <Upload size={40} color={brand.accent} style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Import from NAFIS', 'استيراد من نافس')}</h3>
                <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 8 }}>{t('Upload a CSV file with columns: EID, FullName, Gender, Education, Experience', 'رفع ملف CSV بالأعمدة: رقم الهوية، الاسم الكامل، الجنس، التعليم، الخبرة')}</p>
                <p style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 16 }}>{t('Supported formats: .csv', 'الصيغ المدعومة: .csv')}</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="nafis-csv-upload"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        style={{
                            background: importing ? brand.textSecondary : brand.primary,
                            color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8,
                            fontSize: 14, fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}
                    >
                        {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {importing ? t('Importing...', 'جاري الاستيراد...') : t('Upload CSV', 'رفع ملف CSV')}
                    </button>
                </div>
            </div>

            {/* Import Result */}
            {importResult && (
                <div style={{
                    background: importResult.error ? brand.redBg : brand.greenBg,
                    borderRadius: 12, padding: 20,
                    border: `1px solid ${importResult.error ? brand.redText : brand.greenText}30`,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            {importResult.error ? (
                                <div style={{ color: brand.redText, fontWeight: 600, fontSize: 14 }}>
                                    <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                    {t('Import Failed', 'فشل الاستيراد')}: {importResult.error}
                                </div>
                            ) : (
                                <>
                                    <div style={{ color: brand.greenText, fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                                        <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                        {t('Import Complete', 'اكتمل الاستيراد')} — {importResult.batch_code}
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                                        <span><strong>{importResult.total_rows}</strong> {t('total', 'إجمالي')}</span>
                                        <span style={{ color: brand.greenText }}><strong>{importResult.successful}</strong> {t('imported', 'مستورد')}</span>
                                        {importResult.duplicates > 0 && <span style={{ color: brand.yellowText }}><strong>{importResult.duplicates}</strong> {t('duplicates', 'مكررات')}</span>}
                                        {importResult.failed > 0 && <span style={{ color: brand.redText }}><strong>{importResult.failed}</strong> {t('failed', 'فشل')}</span>}
                                        {importResult.users_created > 0 && <span style={{ color: brand.blueText }}><strong>{importResult.users_created}</strong> {t('accounts created', 'حسابات أنشئت')}</span>}
                                    </div>
                                </>
                            )}
                        </div>
                        <button onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X size={16} color={brand.textSecondary} />
                        </button>
                    </div>
                </div>
            )}

            {/* Import History Table */}
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{t('Import History', 'سجل الاستيراد')}</h3>
                    <button onClick={fetchBatches} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: `1px solid ${brand.border}`, padding: '6px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: brand.textSecondary }}>
                        <RefreshCw size={13} /> {t('Refresh', 'تحديث')}
                    </button>
                </div>

                {loadingBatches && (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: brand.primary }} />
                    </div>
                )}

                {!loadingBatches && batches.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 30, color: brand.textSecondary, fontSize: 14 }}>
                        {t('No import history yet. Upload a CSV to get started.', 'لا يوجد سجل استيراد بعد. قم برفع ملف CSV للبدء.')}
                    </div>
                )}

                {!loadingBatches && batches.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${brand.border}` }}>
                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('Batch ID', 'رقم الدفعة')}</th>
                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('File', 'الملف')}</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>{t('Records', 'السجلات')}</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>{t('Success', 'نجاح')}</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>{t('Dupes', 'مكررات')}</th>
                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('Date', 'التاريخ')}</th>
                                <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('Status', 'الحالة')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((imp, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${brand.border}` }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 600, color: brand.primary }}>{imp.batch_code}</td>
                                    <td style={{ padding: '10px 12px', color: brand.textSecondary, fontSize: 13 }}>{imp.filename || '—'}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: brand.textPrimary }}>{imp.total_records}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: brand.greenText, fontWeight: 600 }}>{imp.successful}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: brand.yellowText }}>{imp.duplicates || 0}</td>
                                    <td style={{ padding: '10px 12px', color: brand.textSecondary }}>{new Date(imp.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: imp.status === 'completed' ? brand.greenBg : brand.yellowBg, color: imp.status === 'completed' ? brand.greenText : brand.yellowText }}>
                                            {imp.status === 'completed' ? t('Completed', 'مكتمل') : t('Processing', 'قيد المعالجة')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    // ─── Invite selected seekers ───
    const handleInviteSeekers = async () => {
        if (selectedSeekers.size === 0) return;
        setInviting(true);
        setInviteResult(null);
        try {
            const res = await restClient.post('/api/nafis-talent/invite', {
                seeker_ids: Array.from(selectedSeekers),
            });
            setInviteResult(res.data);
            setSelectedSeekers(new Set());
            fetchSeekers(seekerPage);
            fetchStats();
        } catch (err: any) {
            setInviteResult({ success: false, error: err.response?.data?.error || 'Failed to send invitations' });
        } finally {
            setInviting(false);
        }
    };

    const toggleSeeker = (id: number) => {
        setSelectedSeekers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAllSeekers = () => {
        if (selectedSeekers.size === seekers.length) {
            setSelectedSeekers(new Set());
        } else {
            setSelectedSeekers(new Set(seekers.map(s => s.id)));
        }
    };

    // ─── Profile Audit Tab ───
    const renderProfileAudit = () => {
        const statusFilters = [
            { key: '', label: t('All', 'الكل') },
            { key: 'imported', label: t('Imported', 'مستورد') },
            { key: 'invited', label: t('Invited', 'تمت الدعوة') },
            { key: 'profile_created', label: t('Profile Created', 'ملف أنشئ') },
            { key: 'matched', label: t('Matched', 'مطابق') },
            { key: 'placed', label: t('Placed', 'تم التوظيف') },
        ];

        const totalPages = Math.ceil(seekerTotal / 25);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary }} />
                        <input
                            value={seekerSearch}
                            onChange={e => setSeekerSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') fetchSeekers(1); }}
                            placeholder={t('Search by name or Emirates ID...', 'بحث بالاسم أو رقم الهوية الإماراتية...')}
                            style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
                        />
                    </div>
                    <button onClick={() => fetchSeekers(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                        <Search size={14} /> {t('Search', 'بحث')}
                    </button>
                </div>

                {/* Status Filter Pills */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {statusFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setSeekerStatusFilter(f.key)}
                            style={{
                                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                border: seekerStatusFilter === f.key ? `2px solid ${brand.primary}` : `1px solid ${brand.border}`,
                                background: seekerStatusFilter === f.key ? brand.blueBg : 'white',
                                color: seekerStatusFilter === f.key ? brand.primary : brand.textSecondary,
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Advanced Filters Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            border: `1px solid ${activeFilterCount > 0 ? brand.primary : brand.border}`,
                            background: activeFilterCount > 0 ? brand.blueBg : 'white',
                            color: activeFilterCount > 0 ? brand.primary : brand.textSecondary,
                        }}
                    >
                        <Filter size={14} />
                        {t('Filters', 'تصفية')}
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: brand.primary, color: 'white', borderRadius: '50%',
                                width: 18, height: 18, display: 'inline-flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 11, fontWeight: 700,
                            }}>{activeFilterCount}</span>
                        )}
                        {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => {
                                setAdvancedFilters(Object.fromEntries(Object.keys(advancedFilters).map(k => [k, ''])));
                                setTimeout(() => fetchSeekers(1), 50);
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px',
                                borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                                border: `1px solid ${brand.border}`, background: 'white', color: brand.redText,
                            }}
                        >
                            <RotateCcw size={13} /> {t('Reset All', 'إعادة تعيين')}
                        </button>
                    )}
                </div>

                {/* Collapsible Filter Panel */}
                {showFilters && (
                    <div style={{
                        background: '#F8FAFC', borderRadius: 12, padding: 20,
                        border: `1px solid ${brand.border}`,
                    }}>
                        {/* Demographics */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                {t('Demographics', 'البيانات الديموغرافية')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <FilterSelect label={t('Gender', 'الجنس')} value={advancedFilters.gender} options={filterOptions.gender || []} onChange={v => setAdvancedFilters(p => ({ ...p, gender: v }))} />
                                <FilterSelect label={t('Age Group', 'الفئة العمرية')} value={advancedFilters.age_group} options={filterOptions.age_group || []} onChange={v => setAdvancedFilters(p => ({ ...p, age_group: v }))} />
                                <FilterSelect label={t('Marital Status', 'الحالة الاجتماعية')} value={advancedFilters.marital_status} options={filterOptions.marital_status || []} onChange={v => setAdvancedFilters(p => ({ ...p, marital_status: v }))} />
                            </div>
                        </div>

                        {/* Education */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                {t('Education', 'التعليم')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <FilterSelect label={t('Education Level', 'المستوى التعليمي')} value={advancedFilters.education_level} options={filterOptions.education_level || []} onChange={v => setAdvancedFilters(p => ({ ...p, education_level: v }))} />
                                <FilterMultiSelect label={t('Specialization', 'التخصص')} selected={advancedFilters.specialization ? advancedFilters.specialization.split('|||') : []} options={filterOptions.specialization || []} onChange={v => setAdvancedFilters(p => ({ ...p, specialization: v.join('|||') }))} />
                                <FilterMultiSelect label={t('Sub-Specialization', 'التخصص الفرعي')} selected={advancedFilters.sub_specialization ? advancedFilters.sub_specialization.split('|||') : []} options={filterOptions.sub_specialization || []} onChange={v => setAdvancedFilters(p => ({ ...p, sub_specialization: v.join('|||') }))} />
                                <FilterSelect label={t('Is Student', 'طالب')} value={advancedFilters.is_student} options={['true', 'false']} labels={[t('Yes', 'نعم'), t('No', 'لا')]} onChange={v => setAdvancedFilters(p => ({ ...p, is_student: v }))} />
                                <FilterRange label={t('GPA', 'المعدل')} minVal={advancedFilters.gpa_min} maxVal={advancedFilters.gpa_max} onMinChange={v => setAdvancedFilters(p => ({ ...p, gpa_min: v }))} onMaxChange={v => setAdvancedFilters(p => ({ ...p, gpa_max: v }))} step="0.1" />
                            </div>
                        </div>

                        {/* Work */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                {t('Work & Service', 'العمل والخدمة')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <FilterRange label={t('Experience (yrs)', 'الخبرة (سنوات)')} minVal={advancedFilters.experience_min} maxVal={advancedFilters.experience_max} onMinChange={v => setAdvancedFilters(p => ({ ...p, experience_min: v }))} onMaxChange={v => setAdvancedFilters(p => ({ ...p, experience_max: v }))} step="1" />
                                <FilterSelect label={t('Job Seeker Type', 'نوع الباحث')} value={advancedFilters.job_seeker_type} options={filterOptions.job_seeker_type || []} onChange={v => setAdvancedFilters(p => ({ ...p, job_seeker_type: v }))} />
                                <FilterSelect label={t('Preferred Work Mode', 'نوع العمل المفضل')} value={advancedFilters.preferred_work_mode} options={filterOptions.preferred_work_mode || []} onChange={v => setAdvancedFilters(p => ({ ...p, preferred_work_mode: v }))} />
                                <FilterSelect label={t('National Service', 'الخدمة الوطنية')} value={advancedFilters.national_service} options={filterOptions.national_service || []} onChange={v => setAdvancedFilters(p => ({ ...p, national_service: v }))} />
                            </div>
                        </div>

                        {/* Location */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                {t('Location', 'الموقع')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <FilterSelect label={t('Emirate of Origin', 'إمارة الأصل')} value={advancedFilters.emirate_of_origin} options={filterOptions.emirate_of_origin || []} onChange={v => setAdvancedFilters(p => ({ ...p, emirate_of_origin: v }))} />
                                <FilterSelect label={t('Emirate of Residence', 'إمارة الإقامة')} value={advancedFilters.emirate_of_residence} options={filterOptions.emirate_of_residence || []} onChange={v => setAdvancedFilters(p => ({ ...p, emirate_of_residence: v }))} />
                                <FilterSelect label={t('City', 'المدينة')} value={advancedFilters.city_name} options={filterOptions.city_name || []} onChange={v => setAdvancedFilters(p => ({ ...p, city_name: v }))} />
                            </div>
                        </div>

                        {/* Accessibility */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                {t('Accessibility', 'إمكانية الوصول')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <FilterSelect label={t('Person of Determination', 'أصحاب الهمم')} value={advancedFilters.is_person_of_determination} options={['true', 'false']} labels={[t('Yes', 'نعم'), t('No', 'لا')]} onChange={v => setAdvancedFilters(p => ({ ...p, is_person_of_determination: v }))} />
                                <FilterSelect label={t('Determination Type', 'نوع الإعاقة')} value={advancedFilters.determination_type} options={filterOptions.determination_type || []} onChange={v => setAdvancedFilters(p => ({ ...p, determination_type: v }))} />
                            </div>
                        </div>

                        {/* Dates */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                {t('Dates', 'التواريخ')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <FilterDate label={t('Registered From', 'مسجل من')} value={advancedFilters.registered_from} onChange={v => setAdvancedFilters(p => ({ ...p, registered_from: v }))} />
                                <FilterDate label={t('Registered To', 'مسجل إلى')} value={advancedFilters.registered_to} onChange={v => setAdvancedFilters(p => ({ ...p, registered_to: v }))} />
                                <FilterDate label={t('Seeker Date From', 'تاريخ الباحث من')} value={advancedFilters.job_seeker_date_from} onChange={v => setAdvancedFilters(p => ({ ...p, job_seeker_date_from: v }))} />
                                <FilterDate label={t('Seeker Date To', 'تاريخ الباحث إلى')} value={advancedFilters.job_seeker_date_to} onChange={v => setAdvancedFilters(p => ({ ...p, job_seeker_date_to: v }))} />
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: `1px solid ${brand.border}` }}>
                            <button
                                onClick={() => fetchSeekers(1)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: brand.primary, color: 'white', border: 'none',
                                    padding: '8px 20px', borderRadius: 8, fontSize: 13,
                                    fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                <Search size={14} /> {t('Apply Filters', 'تطبيق الفلاتر')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Invite Result */}
                {inviteResult && (
                    <div style={{
                        background: inviteResult.success ? brand.greenBg : brand.redBg,
                        borderRadius: 12, padding: 16,
                        border: `1px solid ${inviteResult.success ? brand.greenText : brand.redText}30`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div style={{ color: inviteResult.success ? brand.greenText : brand.redText, fontWeight: 600, fontSize: 14 }}>
                            {inviteResult.success
                                ? <><Mail size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{inviteResult.message}</>
                                : <><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{inviteResult.error}</>
                            }
                        </div>
                        <button onClick={() => setInviteResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X size={16} color={brand.textSecondary} />
                        </button>
                    </div>
                )}

                {/* Results */}
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>
                            {t('Job Seekers', 'باحثون عن عمل')} <span style={{ fontSize: 13, fontWeight: 400, color: brand.textSecondary }}>({seekerTotal})</span>
                        </h3>
                        {selectedSeekers.size > 0 && (
                            <button
                                onClick={handleInviteSeekers}
                                disabled={inviting}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: brand.primary, color: 'white', border: 'none',
                                    padding: '8px 16px', borderRadius: 8, fontSize: 13,
                                    fontWeight: 600, cursor: inviting ? 'not-allowed' : 'pointer',
                                    opacity: inviting ? 0.7 : 1,
                                }}
                            >
                                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {inviting
                                    ? t('Sending...', 'جاري الإرسال...')
                                    : t(`Send Invitation (${selectedSeekers.size})`, `إرسال دعوة (${selectedSeekers.size})`)}
                            </button>
                        )}
                    </div>

                    {loadingSeekers && (
                        <div style={{ textAlign: 'center', padding: 30 }}>
                            <Loader2 size={20} className="animate-spin" style={{ color: brand.primary }} />
                        </div>
                    )}

                    {!loadingSeekers && seekers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
                            {t('No job seekers found. Import a CSV to get started.', 'لم يتم العثور على باحثين عن عمل. قم بالاستيراد للبدء.')}
                        </div>
                    )}

                    {!loadingSeekers && seekers.length > 0 && (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${brand.border}` }}>
                                        <th style={{ padding: '10px 8px', width: 36 }}>
                                            <input type="checkbox" checked={selectedSeekers.size === seekers.length && seekers.length > 0} onChange={toggleAllSeekers} style={{ cursor: 'pointer' }} />
                                        </th>
                                        <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('Name', 'الاسم')}</th>
                                        <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('Emirates ID', 'الهوية')}</th>
                                        <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('Email', 'البريد')}</th>
                                        <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: brand.textSecondary, fontWeight: 600 }}>{t('Education', 'التعليم')}</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>{t('Exp (yrs)', 'الخبرة')}</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', color: brand.textSecondary, fontWeight: 600 }}>{t('Status', 'الحالة')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {seekers.map((s) => {
                                        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                                            imported: { bg: brand.blueBg, text: brand.blueText, label: t('Imported', 'مستورد') },
                                            invited: { bg: brand.yellowBg, text: brand.yellowText, label: t('Invited', 'تمت الدعوة') },
                                            profile_created: { bg: brand.greenBg, text: brand.greenText, label: t('Profile', 'ملف') },
                                            matched: { bg: '#FFF7ED', text: '#EA580C', label: t('Matched', 'مطابق') },
                                            placed: { bg: brand.greenBg, text: brand.greenText, label: t('Placed', 'تم التوظيف') },
                                        };
                                        const sc = statusConfig[s.status] || statusConfig.imported;
                                        return (
                                            <tr key={s.id} style={{ borderBottom: `1px solid ${brand.border}`, background: selectedSeekers.has(s.id) ? '#F0F9FF' : 'transparent' }}>
                                                <td style={{ padding: '12px 8px', width: 36 }}>
                                                    <input type="checkbox" checked={selectedSeekers.has(s.id)} onChange={() => toggleSeeker(s.id)} style={{ cursor: 'pointer' }} />
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: 500, color: brand.textPrimary }}>{s.full_name}</td>
                                                <td style={{ padding: '12px', color: brand.textSecondary, fontSize: 13, fontFamily: 'monospace' }}>{s.emirates_id}</td>
                                                <td style={{ padding: '12px', color: brand.textSecondary, fontSize: 13 }}>{s.email || '—'}</td>
                                                <td style={{ padding: '12px', color: brand.textPrimary }}>{s.education_level || '—'}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: brand.primary }}>{s.experience_years}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: sc.bg, color: sc.text }}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                                    <button disabled={seekerPage <= 1} onClick={() => fetchSeekers(seekerPage - 1)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', cursor: seekerPage <= 1 ? 'not-allowed' : 'pointer', opacity: seekerPage <= 1 ? 0.5 : 1 }}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span style={{ fontSize: 13, color: brand.textSecondary }}>{t('Page', 'صفحة')} {seekerPage} / {totalPages}</span>
                                    <button disabled={seekerPage >= totalPages} onClick={() => fetchSeekers(seekerPage + 1)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', cursor: seekerPage >= totalPages ? 'not-allowed' : 'pointer', opacity: seekerPage >= totalPages ? 0.5 : 1 }}>
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

    // ─── Placement Tracking (kept as display - will show placed seekers) ───
    const renderPlacementTracking = () => {
        const placedSeekers = stats?.placed || 0;
        const matchedSeekers = stats?.matched || 0;

        return (
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{t('Placement Overview', 'نظرة عامة على التوظيف')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20, background: brand.greenBg, borderRadius: 12 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: brand.greenText }}>{placedSeekers}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{t('Placed', 'تم توظيفهم')}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20, background: brand.yellowBg, borderRadius: 12 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: brand.yellowText }}>{matchedSeekers}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{t('Matched', 'مطابقون')}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20, background: brand.blueBg, borderRadius: 12 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: brand.blueText }}>{stats?.total_seekers || 0}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{t('Total Pool', 'إجمالي المرشحين')}</div>
                    </div>
                </div>

                {/* Gender breakdown */}
                {stats && stats.gender_breakdown.length > 0 && (
                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Gender Distribution', 'توزيع الجنس')}</h4>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {stats.gender_breakdown.map((g, i) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center', padding: 16, background: '#F8FAFC', borderRadius: 10 }}>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: brand.primary }}>{g.count}</div>
                                    <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{g.gender || t('Not specified', 'غير محدد')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!stats && (
                    <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
                        {t('Import job seekers to see placement data', 'قم باستيراد باحثين عن عمل لعرض بيانات التوظيف')}
                    </div>
                )}
            </div>
        );
    };

    // ─── Settings Tab (unchanged) ───
    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Auto-sync Schedule', 'جدول المزامنة التلقائية'), desc: t('Configure automatic NAFIS database sync interval', 'ضبط فترة المزامنة التلقائية مع قاعدة بيانات نافس'), value: t('Daily at 2:00 AM', 'يومياً الساعة 2:00 صباحاً') },
                { title: t('Profile Completeness Threshold', 'حد اكتمال الملف الشخصي'), desc: t('Minimum fields required before a profile is marked complete', 'الحد الأدنى للحقول المطلوبة لاعتبار الملف مكتملاً'), value: '85%' },
                { title: t('Match Score Minimum', 'الحد الأدنى لدرجة المطابقة'), desc: t('Minimum AI match score for job recommendations', 'الحد الأدنى لدرجة المطابقة بالذكاء الاصطناعي لتوصيات الوظائف'), value: '70%' },
                { title: t('Emirates ID Verification', 'التحقق من الهوية الإماراتية'), desc: t('Require Emirates ID verification for all imports', 'طلب التحقق من الهوية الإماراتية لجميع عمليات الاستيراد'), value: t('Enabled', 'مفعّل') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.blueBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.blueBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <Users size={16} color={brand.blueText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.blueText }}>{t('NAFIS Talent Operator', 'مشغل كوادر نافس')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Job Seeker Onboarding', 'استقطاب الباحثين عن عمل')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Import, verify, and track Emirati job seekers from NAFIS', 'استيراد ومتابعة الباحثين عن عمل الإماراتيين من نافس')}</p>
                </div>

                <div style={{ display: 'flex', gap: 4, background: brand.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${brand.border}`, marginBottom: 24 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: activeTab === tab.id ? brand.primary : 'transparent',
                            color: activeTab === tab.id ? 'white' : brand.textSecondary,
                            transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'import' && renderBulkImport()}
                {activeTab === 'audit' && renderProfileAudit()}
                {activeTab === 'tracking' && renderPlacementTracking()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default NafisTalentDashboard;

