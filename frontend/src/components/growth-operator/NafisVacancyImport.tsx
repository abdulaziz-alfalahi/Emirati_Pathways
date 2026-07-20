import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    Upload, FileText, X, Search, Filter, Download, CheckCircle,
    Building2, Briefcase, MapPin, Users, TrendingUp, AlertTriangle,
    ChevronDown, ChevronUp, Mail, Phone, Send, Eye, BarChart3,
    ArrowUpRight, SlidersHorizontal, Table2, LayoutGrid, Loader2, ExternalLink, Copy
} from 'lucide-react';
import { restClient } from '@/utils/api';

// ─── Color Palette ───
const colors = {
    primary: '#0A5C36',
    primaryLight: '#E8F5EE',
    secondary: '#1B4D3E',
    accent: '#C4A265',
    accentLight: '#FEF9EE',
    bg: '#F8FAFB',
    card: '#FFFFFF',
    text: '#1A1F36',
    textSecondary: '#5A6B7B',
    border: '#E2E8F0',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    blueBg: '#EFF6FF', blueText: '#2563EB',
    purpleBg: '#F3E8FF', purpleText: '#7C3AED',
};

// ─── Types ───
export interface NafisJob {
    JobsTitle: string;
    'Job ID': string;
    CompanyName: string;
    'Company Code': string;
    CompanyEmail: string;
    CompanyPhone: string;
    CompanySector: string;
    PartnerBusinessType: string;
    BusinessType: string;
    TradeLicenseNo: string;
    JobEmirate: string;
    JobCity: string;
    JobEducationalorSkillsLevel: string;
    Gender: string;
    JobSalary: string;
    JobStatus: string;
    'ENSCO Code': string;
    'ENSCO Title': string;
    'No of Vacancies': string;
    'No of Applications': string;
    'No of Hired': string;
    'Job Posted Date': string;
    'Job Type': string;
    JobID: string;
}

interface CompanyAggregate {
    name: string;
    code: string;
    email: string;
    phone: string;
    sector: string;
    businessType: string;
    tradeLicense: string;
    totalJobs: number;
    totalVacancies: number;
    totalApplications: number;
    totalHired: number;
    emirates: string[];
    jobTypes: string[];
    selected: boolean;
}

interface NafisVacancyImportProps {
    t: (en: string, ar: string) => string;
    isRTL: boolean;
}

// ─── CSV Parser ───
function parseCSV(text: string): NafisJob[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header - handle potential BOM and extra whitespace
    const rawHeader = lines[0].replace(/^\uFEFF/, '');
    const headers = parseCSVLine(rawHeader);

    const jobs: NafisJob[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < 5) continue; // skip malformed rows

        const job: Record<string, string> = {};
        headers.forEach((h, idx) => {
            job[h.trim()] = (values[idx] || '').trim();
        });
        jobs.push(job as unknown as NafisJob);
    }
    return jobs;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// ─── Component ───
const NafisVacancyImport: React.FC<NafisVacancyImportProps> = ({ t, isRTL }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Kept so a failed platform sync can be retried without re-picking the file.
    const lastFileRef = useRef<File | null>(null);
    const [jobs, setJobs] = useState<NafisJob[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState('');
    const [viewMode, setViewMode] = useState<'companies' | 'jobs'>('companies');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
    const [showInviteConfirm, setShowInviteConfirm] = useState(false);
    const [inviteSending, setInviteSending] = useState(false);
    const [inviteResults, setInviteResults] = useState<any[] | null>(null);
    const [inviteError, setInviteError] = useState('');
    // Platform sync: the CSV must also reach POST /api/growth/import — that is
    // what creates the companies (lead_source='nafis_import') and their NAFIS
    // job postings in the DB. Without it the funnel has no leads and there is
    // nothing to auto-assign to the recruiter who redeems an invitation.
    // The in-browser parse below is only the preview/filter working set.
    const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');
    const [syncReport, setSyncReport] = useState<any>(null);
    const [syncError, setSyncError] = useState('');
    // Role each selected company's invitation will confer — decided by the
    // OPERATOR here (#89). The invitee cannot change it.
    const [inviteRoles, setInviteRoles] = useState<Record<string, 'recruiter' | 'employer_admin'>>({});
    // NAFIS company names that already exist on the platform — badged so the
    // operator does not re-invite an active employer (a name-matched
    // re-invite spawns a duplicate "shadow" company, #99).
    const [existingCompanies, setExistingCompanies] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<string>('totalVacancies');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Filters
    const [sectorFilter, setSectorFilter] = useState<string[]>([]);
    const [emirateFilter, setEmirateFilter] = useState<string[]>([]);
    const [jobTypeFilter, setJobTypeFilter] = useState<string[]>([]);
    const [minVacancies, setMinVacancies] = useState(0);
    const [businessTypeFilter, setBusinessTypeFilter] = useState<string[]>([]);
    const [educationFilter, setEducationFilter] = useState<string[]>([]);

    // ─── Restore from sessionStorage on mount ───
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem('nafis_import_data');
            const cachedName = sessionStorage.getItem('nafis_import_filename');
            if (cached && cachedName) {
                const parsed = JSON.parse(cached) as NafisJob[];
                if (parsed.length > 0) {
                    setJobs(parsed);
                    setFileName(cachedName);
                }
            }
        } catch (e) {
            // Ignore parse errors — user will just re-upload
        }
    }, []);

    // ─── Which of these employers are already on the platform? ───
    // Runs on every loaded file (including sessionStorage restore) so the
    // "On platform" badges are always current. Failure is non-fatal — the
    // badges simply don't render.
    useEffect(() => {
        if (jobs.length === 0) {
            setExistingCompanies(new Set());
            return;
        }
        const names = Array.from(new Set(jobs.map(j => j.CompanyName || j['Company Code'] || 'Unknown')));
        (async () => {
            try {
                const res = await restClient.post('/api/growth/check-companies', { companies: names });
                setExistingCompanies(new Set((res.data?.existing || []) as string[]));
            } catch (err) {
                console.error('check-companies failed:', err);
            }
        })();
    }, [jobs]);

    // ─── Platform sync ───
    const syncToPlatform = useCallback(async (file: File) => {
        setSyncState('syncing');
        setSyncError('');
        setSyncReport(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await restClient.post('/api/growth/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data?.success) {
                setSyncReport(response.data.report || null);
                setSyncState('synced');
            } else {
                setSyncError(response.data?.error || t('Import failed', 'فشل الاستيراد'));
                setSyncState('failed');
            }
        } catch (err: any) {
            setSyncError(err?.response?.data?.error || err?.message || t('Import failed', 'فشل الاستيراد'));
            setSyncState('failed');
        }
    }, [t]);

    // ─── File Handling ───
    const handleFile = useCallback((file: File) => {
        if (!file.name.endsWith('.csv')) {
            alert(t('Please upload a CSV file', 'يرجى رفع ملف CSV'));
            return;
        }
        setFileName(file.name);
        lastFileRef.current = file;
        // Upload the SAME file to the platform importer — see syncState note.
        syncToPlatform(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsed = parseCSV(text);
            setJobs(parsed);
            setSelectedCompanies(new Set());
            // Reset filters
            setSectorFilter([]);
            setEmirateFilter([]);
            setJobTypeFilter([]);
            setMinVacancies(0);
            setBusinessTypeFilter([]);
            setEducationFilter([]);
            // Persist to sessionStorage so data survives tab switches
            try {
                sessionStorage.setItem('nafis_import_data', JSON.stringify(parsed));
                sessionStorage.setItem('nafis_import_filename', file.name);
            } catch (e) {
                // sessionStorage might be full for very large files — silently ignore
            }
        };
        reader.readAsText(file);
    }, [t, syncToPlatform]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragOver(false), []);

    // ─── Unique values for filter dropdowns ───
    const uniqueValues = useMemo(() => {
        const sectors = new Set<string>();
        const emirates = new Set<string>();
        const jobTypes = new Set<string>();
        const businessTypes = new Set<string>();
        const educationLevels = new Set<string>();

        jobs.forEach(j => {
            if (j.CompanySector) sectors.add(j.CompanySector);
            if (j.JobEmirate) emirates.add(j.JobEmirate);
            if (j['Job Type']) jobTypes.add(j['Job Type']);
            if (j.BusinessType) businessTypes.add(j.BusinessType);
            if (j.JobEducationalorSkillsLevel) educationLevels.add(j.JobEducationalorSkillsLevel);
        });

        return {
            sectors: Array.from(sectors).sort(),
            emirates: Array.from(emirates).sort(),
            jobTypes: Array.from(jobTypes).sort(),
            businessTypes: Array.from(businessTypes).sort(),
            educationLevels: Array.from(educationLevels).sort(),
        };
    }, [jobs]);

    // ─── Filtered Jobs ───
    const filteredJobs = useMemo(() => {
        return jobs.filter(j => {
            const matchesSearch = !searchTerm ||
                j.CompanyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                j.JobsTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                j.CompanySector?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSector = sectorFilter.length === 0 || sectorFilter.includes(j.CompanySector);
            const matchesEmirate = emirateFilter.length === 0 || emirateFilter.includes(j.JobEmirate);
            const matchesJobType = jobTypeFilter.length === 0 || jobTypeFilter.includes(j['Job Type']);
            const matchesBusiness = businessTypeFilter.length === 0 || businessTypeFilter.includes(j.BusinessType);
            const matchesEducation = educationFilter.length === 0 || educationFilter.includes(j.JobEducationalorSkillsLevel);
            const matchesVacancies = parseInt(j['No of Vacancies'] || '0') >= minVacancies;

            return matchesSearch && matchesSector && matchesEmirate && matchesJobType && matchesBusiness && matchesEducation && matchesVacancies;
        });
    }, [jobs, searchTerm, sectorFilter, emirateFilter, jobTypeFilter, businessTypeFilter, educationFilter, minVacancies]);

    // ─── Company Aggregation ───
    const companyAggregates = useMemo(() => {
        const map = new Map<string, CompanyAggregate>();

        filteredJobs.forEach(j => {
            const key = j.CompanyName || j['Company Code'] || 'Unknown';
            const existing = map.get(key);
            const vacancies = parseInt(j['No of Vacancies'] || '0');
            const applications = parseInt(j['No of Applications'] || '0');
            const hired = parseInt(j['No of Hired'] || '0');

            if (existing) {
                existing.totalJobs++;
                existing.totalVacancies += vacancies;
                existing.totalApplications += applications;
                existing.totalHired += hired;
                if (j.JobEmirate && !existing.emirates.includes(j.JobEmirate)) existing.emirates.push(j.JobEmirate);
                if (j['Job Type'] && !existing.jobTypes.includes(j['Job Type'])) existing.jobTypes.push(j['Job Type']);
            } else {
                map.set(key, {
                    name: key,
                    code: j['Company Code'] || '',
                    email: j.CompanyEmail || '',
                    phone: j.CompanyPhone || '',
                    sector: j.CompanySector || '',
                    businessType: j.BusinessType || '',
                    tradeLicense: j.TradeLicenseNo || '',
                    totalJobs: 1,
                    totalVacancies: vacancies,
                    totalApplications: applications,
                    totalHired: hired,
                    emirates: j.JobEmirate ? [j.JobEmirate] : [],
                    jobTypes: j['Job Type'] ? [j['Job Type']] : [],
                    selected: selectedCompanies.has(key),
                });
            }
        });

        // Sort
        const arr = Array.from(map.values());
        arr.sort((a, b) => {
            const aVal = (a as any)[sortField] ?? 0;
            const bVal = (b as any)[sortField] ?? 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
            }
            return sortDir === 'desc'
                ? String(bVal).localeCompare(String(aVal))
                : String(aVal).localeCompare(String(bVal));
        });

        return arr;
    }, [filteredJobs, selectedCompanies, sortField, sortDir]);

    // ─── Stats ───
    const stats = useMemo(() => ({
        totalJobs: filteredJobs.length,
        totalCompanies: companyAggregates.length,
        totalVacancies: filteredJobs.reduce((s, j) => s + parseInt(j['No of Vacancies'] || '0'), 0),
        totalApplications: filteredJobs.reduce((s, j) => s + parseInt(j['No of Applications'] || '0'), 0),
        totalHired: filteredJobs.reduce((s, j) => s + parseInt(j['No of Hired'] || '0'), 0),
    }), [filteredJobs, companyAggregates]);

    const activeFilterCount = [sectorFilter, emirateFilter, jobTypeFilter, businessTypeFilter, educationFilter].filter(f => f.length > 0).length + (minVacancies > 0 ? 1 : 0);

    // ─── Selection ───
    const toggleCompanySelection = (name: string) => {
        setSelectedCompanies(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const selectAllVisible = () => {
        const next = new Set(selectedCompanies);
        companyAggregates.forEach(c => next.add(c.name));
        setSelectedCompanies(next);
    };

    const deselectAll = () => setSelectedCompanies(new Set());

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null;
        return sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    // ─── Multi-select filter chip ───
    const FilterChipGroup = ({ label, options, selected, onChange }: {
        label: string; options: string[]; selected: string[];
        onChange: (v: string[]) => void;
    }) => (
        <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {options.map(opt => {
                    const isSelected = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => {
                                onChange(isSelected ? selected.filter(s => s !== opt) : [...selected, opt]);
                            }}
                            style={{
                                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                                border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                                background: isSelected ? colors.primaryLight : colors.card,
                                color: isSelected ? colors.primary : colors.textSecondary,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ═══════ UPLOAD ZONE (no file loaded) ═══════
    if (jobs.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Upload Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? colors.primary : colors.border}`,
                        borderRadius: 20, padding: '60px 40px', textAlign: 'center',
                        background: dragOver ? colors.primaryLight : colors.card,
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                >
                    <input
                        ref={fileInputRef} type="file" accept=".csv"
                        style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                    />
                    <div style={{ padding: 20, borderRadius: 20, background: colors.primaryLight, display: 'inline-flex', marginBottom: 20 }}>
                        <Upload size={40} color={colors.primary} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: colors.text, marginBottom: 8 }}>
                        {t('Upload NAFIS Vacancy File', 'رفع ملف شواغر نافس')}
                    </h3>
                    <p style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
                        {t(
                            'Drag and drop a CSV file exported from the NAFIS platform, or click to browse. The file should contain active vacancy listings with company details.',
                            'اسحب وأفلت ملف CSV المصدّر من منصة نافس، أو انقر للاستعراض. يجب أن يحتوي الملف على قوائم الشواغر النشطة مع تفاصيل الشركات.'
                        )}
                    </p>
                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13, color: colors.textSecondary }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} /> {t('CSV format', 'صيغة CSV')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={14} /> {t('NAFIS export', 'تصدير نافس')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Briefcase size={14} /> {t('Active vacancies', 'شواغر نشطة')}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════ DATA LOADED VIEW ═══════
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* File Info Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: colors.primaryLight, borderRadius: 14, padding: '12px 20px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileText size={18} color={colors.primary} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.primary }}>{fileName}</span>
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>
                        — {jobs.length} {t('records loaded', 'سجل تم تحميله')}
                    </span>
                </div>
                <button
                    onClick={() => { setJobs([]); setFileName(''); setSelectedCompanies(new Set()); setInviteRoles({}); setSyncState('idle'); setSyncReport(null); setSyncError(''); lastFileRef.current = null; sessionStorage.removeItem('nafis_import_data'); sessionStorage.removeItem('nafis_import_filename'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer', fontSize: 13, color: colors.textSecondary }}
                >
                    <X size={14} /> {t('Clear', 'مسح')}
                </button>
            </div>

            {/* Platform Sync Status — the CSV must reach the platform importer,
                not just this browser tab; say clearly which of the two happened. */}
            {syncState === 'syncing' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: colors.blueBg, color: colors.blueText, fontSize: 13 }}>
                    <Loader2 size={15} className="animate-spin" />
                    {t('Uploading to the platform — creating company leads and vacancy records...', 'جاري الرفع إلى المنصة — إنشاء سجلات الشركات والشواغر...')}
                </div>
            )}
            {syncState === 'synced' && syncReport && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: colors.greenBg, color: colors.greenText, fontSize: 13 }}>
                    <CheckCircle size={15} />
                    {t(
                        `Synced to platform: ${syncReport.companies_created ?? 0} new companies, ${syncReport.jobs_created ?? 0} new vacancies (${syncReport.total_rows ?? 0} rows processed).`,
                        `تمت المزامنة مع المنصة: ${syncReport.companies_created ?? 0} شركة جديدة، ${syncReport.jobs_created ?? 0} شاغر جديد (${syncReport.total_rows ?? 0} صف تمت معالجته).`
                    )}
                </div>
            )}
            {syncState === 'failed' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 16px', borderRadius: 12, background: colors.yellowBg, color: colors.yellowText, fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={15} />
                        {t(
                            `Platform sync failed — you are previewing locally only. Invitations will still work, but the funnel and vacancy auto-assignment will not reflect this file. (${syncError})`,
                            `فشلت المزامنة مع المنصة — أنت تعاين محليًا فقط. ستعمل الدعوات، لكن خط الإلحاق وإسناد الشواغر لن يعكسا هذا الملف. (${syncError})`
                        )}
                    </span>
                    {lastFileRef.current && (
                        <button
                            onClick={() => lastFileRef.current && syncToPlatform(lastFileRef.current)}
                            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${colors.yellowText}`, background: 'transparent', color: colors.yellowText, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                        >
                            {t('Retry', 'إعادة المحاولة')}
                        </button>
                    )}
                </div>
            )}

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[
                    { icon: Building2, label: t('Companies', 'شركات'), value: stats.totalCompanies, color: colors.primary },
                    { icon: Briefcase, label: t('Job Postings', 'إعلانات وظيفية'), value: stats.totalJobs, color: colors.blueText },
                    { icon: Users, label: t('Vacancies', 'شواغر'), value: stats.totalVacancies, color: colors.accent },
                    { icon: TrendingUp, label: t('Applications', 'طلبات'), value: stats.totalApplications, color: colors.purpleText },
                    { icon: CheckCircle, label: t('Hired', 'تم التوظيف'), value: stats.totalHired, color: colors.greenText },
                ].map((s, i) => (
                    <div key={i} style={{ background: colors.card, borderRadius: 12, padding: '16px 18px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <s.icon size={16} color={s.color} />
                            <span style={{ fontSize: 12, color: colors.textSecondary }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginTop: 6 }}>{s.value.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* Search + View Toggle + Filters + Actions Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                background: colors.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${colors.border}`,
            }}>
                {/* Search */}
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
                    <input
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t('Search company, job title, sector...', 'البحث عن شركة، مسمى وظيفي، قطاع...')}
                        style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, outline: 'none', background: '#F8FAFC' }}
                    />
                </div>

                {/* View Toggle */}
                <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
                    <button
                        onClick={() => setViewMode('companies')}
                        style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                            background: viewMode === 'companies' ? colors.card : 'transparent',
                            color: viewMode === 'companies' ? colors.text : colors.textSecondary,
                            boxShadow: viewMode === 'companies' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <LayoutGrid size={14} /> {t('Companies', 'شركات')}
                    </button>
                    <button
                        onClick={() => setViewMode('jobs')}
                        style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                            background: viewMode === 'jobs' ? colors.card : 'transparent',
                            color: viewMode === 'jobs' ? colors.text : colors.textSecondary,
                            boxShadow: viewMode === 'jobs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <Table2 size={14} /> {t('Jobs', 'وظائف')}
                    </button>
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10,
                        border: `1px solid ${activeFilterCount > 0 ? colors.primary : colors.border}`,
                        background: activeFilterCount > 0 ? colors.primaryLight : colors.card,
                        color: activeFilterCount > 0 ? colors.primary : colors.textSecondary,
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    }}
                >
                    <SlidersHorizontal size={14} />
                    {t('Filters', 'تصفية')}
                    {activeFilterCount > 0 && (
                        <span style={{
                            background: colors.primary, color: '#fff', borderRadius: '50%', width: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                        }}>
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Selection Actions (Companies View only) */}
                {viewMode === 'companies' && (
                    <>
                        <div style={{ height: 24, width: 1, background: colors.border }} />
                        <button onClick={selectAllVisible} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer', fontSize: 13, color: colors.textSecondary }}>
                            {t('Select All', 'تحديد الكل')}
                        </button>
                        {selectedCompanies.size > 0 && (
                            <>
                                <button onClick={deselectAll} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer', fontSize: 13, color: colors.textSecondary }}>
                                    {t('Deselect', 'إلغاء التحديد')} ({selectedCompanies.size})
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', background: colors.primaryLight, padding: '4px 4px 4px 12px', borderRadius: 12, border: `1px solid ${colors.primary}30` }}>
                                    <div style={{ marginRight: 12, fontSize: 12, color: colors.primary }}>
                                        <span style={{ fontWeight: 700 }}>{selectedVacancies.toLocaleString()}</span> / {stats.totalVacancies.toLocaleString()} {t('vacancies', 'شواغر')} ({coveragePct}%)
                                    </div>
                                    <button
                                        onClick={() => setShowInviteConfirm(true)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                                            background: colors.primary, color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                        }}
                                    >
                                        <Send size={14} />
                                        {t(`Invite ${selectedCompanies.size}`, `دعوة ${selectedCompanies.size}`)}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Filters Panel (collapsible) */}
            {showFilters && (
                <div style={{
                    background: colors.card, borderRadius: 14, padding: 24, border: `1px solid ${colors.border}`,
                    animation: 'fadeIn 0.2s ease',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{t('Filter Criteria', 'معايير التصفية')}</h4>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => { setSectorFilter([]); setEmirateFilter([]); setJobTypeFilter([]); setMinVacancies(0); setBusinessTypeFilter([]); setEducationFilter([]); }}
                                style={{ fontSize: 13, color: colors.redText, cursor: 'pointer', background: 'none', border: 'none', fontWeight: 500 }}
                            >
                                {t('Clear All Filters', 'مسح جميع الفلاتر')}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                        {uniqueValues.sectors.length > 0 && (
                            <FilterChipGroup label={t('Sector', 'القطاع')} options={uniqueValues.sectors} selected={sectorFilter} onChange={setSectorFilter} />
                        )}
                        {uniqueValues.emirates.length > 0 && (
                            <FilterChipGroup label={t('Emirate', 'الإمارة')} options={uniqueValues.emirates} selected={emirateFilter} onChange={setEmirateFilter} />
                        )}
                        {uniqueValues.jobTypes.length > 0 && (
                            <FilterChipGroup label={t('Job Type', 'نوع الوظيفة')} options={uniqueValues.jobTypes} selected={jobTypeFilter} onChange={setJobTypeFilter} />
                        )}
                        {uniqueValues.businessTypes.length > 0 && (
                            <FilterChipGroup label={t('Business Type', 'نوع النشاط')} options={uniqueValues.businessTypes} selected={businessTypeFilter} onChange={setBusinessTypeFilter} />
                        )}
                        {uniqueValues.educationLevels.length > 0 && (
                            <FilterChipGroup label={t('Education Level', 'المستوى التعليمي')} options={uniqueValues.educationLevels} selected={educationFilter} onChange={setEducationFilter} />
                        )}
                    </div>

                    {/* Min Vacancies Slider */}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {t('Minimum Vacancies per Job', 'الحد الأدنى للشواغر لكل وظيفة')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <input
                                type="range" min={0} max={50} value={minVacancies}
                                onChange={(e) => setMinVacancies(parseInt(e.target.value))}
                                style={{ flex: 1, accentColor: colors.primary }}
                            />
                            <span style={{ fontSize: 16, fontWeight: 700, color: colors.primary, minWidth: 40, textAlign: 'center' }}>
                                {minVacancies}+
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ COMPANIES VIEW ═══════ */}
            {viewMode === 'companies' && (
                <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: `2px solid ${colors.border}` }}>
                                    <th style={{ padding: '14px 12px', width: 40 }}>
                                        <input
                                            type="checkbox"
                                            checked={companyAggregates.length > 0 && companyAggregates.every(c => selectedCompanies.has(c.name))}
                                            onChange={(e) => e.target.checked ? selectAllVisible() : deselectAll()}
                                            style={{ accentColor: colors.primary, width: 16, height: 16 }}
                                        />
                                    </th>
                                    <th onClick={() => handleSort('name')} style={{ ...thStyle, cursor: 'pointer', textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('Company', 'الشركة')} <SortIcon field="name" />
                                    </th>
                                    <th style={{ ...thStyle, textAlign: isRTL ? 'right' : 'left' }}>{t('Sector', 'القطاع')}</th>
                                    <th onClick={() => handleSort('totalJobs')} style={{ ...thStyle, cursor: 'pointer', textAlign: 'center' }}>
                                        {t('Jobs', 'وظائف')} <SortIcon field="totalJobs" />
                                    </th>
                                    <th onClick={() => handleSort('totalVacancies')} style={{ ...thStyle, cursor: 'pointer', textAlign: 'center' }}>
                                        {t('Vacancies', 'شواغر')} <SortIcon field="totalVacancies" />
                                    </th>
                                    <th onClick={() => handleSort('totalApplications')} style={{ ...thStyle, cursor: 'pointer', textAlign: 'center' }}>
                                        {t('Apps', 'طلبات')} <SortIcon field="totalApplications" />
                                    </th>
                                    <th onClick={() => handleSort('totalHired')} style={{ ...thStyle, cursor: 'pointer', textAlign: 'center' }}>
                                        {t('Hired', 'معينين')} <SortIcon field="totalHired" />
                                    </th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Emirates', 'الإمارات')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Contact', 'اتصال')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companyAggregates.map((company, i) => {
                                    const isSelected = selectedCompanies.has(company.name);
                                    const fillRate = company.totalVacancies > 0
                                        ? ((company.totalHired / company.totalVacancies) * 100).toFixed(0)
                                        : '—';

                                    return (
                                        <tr
                                            key={company.name}
                                            style={{
                                                borderBottom: `1px solid ${colors.border}`,
                                                background: isSelected ? colors.primaryLight : (i % 2 === 0 ? colors.card : '#FAFBFC'),
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox" checked={isSelected}
                                                    onChange={() => toggleCompanySelection(company.name)}
                                                    style={{ accentColor: colors.primary, width: 16, height: 16 }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ fontWeight: 600, color: colors.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {company.name}
                                                    {existingCompanies.has(company.name) && (
                                                        <span
                                                            title={t('This employer is already registered on the platform — check the pipeline before re-inviting', 'صاحب العمل هذا مسجل بالفعل على المنصة — تحقق من خط الإلحاق قبل إعادة الدعوة')}
                                                            style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: colors.greenBg, color: colors.greenText, letterSpacing: '0.03em', flexShrink: 0 }}
                                                        >
                                                            {t('ON PLATFORM', 'على المنصة')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{company.tradeLicense || '—'}</div>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: colors.blueBg, color: colors.blueText }}>
                                                    {company.sector || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: colors.text }}>{company.totalJobs}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{ fontWeight: 700, color: company.totalVacancies > 5 ? colors.primary : colors.text }}>
                                                    {company.totalVacancies}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: colors.textSecondary }}>{company.totalApplications}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{ fontWeight: 600, color: colors.greenText }}>{company.totalHired}</span>
                                                <span style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 4 }}>({fillRate}%)</span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                                                    {company.emirates.map(e => (
                                                        <span key={e} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F1F5F9', color: colors.textSecondary }}>
                                                            {e}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                    {company.email && (
                                                        <a href={`mailto:${company.email}`} title={company.email} style={{ color: colors.blueText }}>
                                                            <Mail size={14} />
                                                        </a>
                                                    )}
                                                    {company.phone && (
                                                        <a href={`tel:${company.phone}`} title={company.phone} style={{ color: colors.greenText }}>
                                                            <Phone size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {companyAggregates.length === 0 && (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>
                                            {t('No companies match the current filters', 'لا توجد شركات تطابق الفلاتر الحالية')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════ JOBS VIEW ═══════ */}
            {viewMode === 'jobs' && (
                <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: `2px solid ${colors.border}` }}>
                                    <th style={{ ...thStyle, textAlign: isRTL ? 'right' : 'left' }}>{t('Job Title', 'المسمى الوظيفي')}</th>
                                    <th style={{ ...thStyle, textAlign: isRTL ? 'right' : 'left' }}>{t('Company', 'الشركة')}</th>
                                    <th style={{ ...thStyle, textAlign: isRTL ? 'right' : 'left' }}>{t('Sector', 'القطاع')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Emirate', 'الإمارة')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Vacancies', 'شواغر')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Apps', 'طلبات')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Hired', 'معينين')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Type', 'النوع')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Salary', 'الراتب')}</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Posted', 'تاريخ النشر')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.slice(0, 100).map((job, i) => (
                                    <tr key={i} style={{ borderBottom: `1px solid ${colors.border}`, background: i % 2 === 0 ? colors.card : '#FAFBFC' }}>
                                        <td style={{ padding: '10px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 500, color: colors.text }}>{job.JobsTitle || '—'}</span>
                                        </td>
                                        <td style={{ padding: '10px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.text }}>
                                            {job.CompanyName || '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: colors.blueBg, color: colors.blueText }}>
                                                {job.CompanySector || '—'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: colors.textSecondary }}>{job.JobEmirate || '—'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: parseInt(job['No of Vacancies'] || '0') > 5 ? colors.primary : colors.text }}>
                                            {job['No of Vacancies'] || '0'}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', color: colors.textSecondary }}>{job['No of Applications'] || '0'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', color: colors.greenText, fontWeight: 600 }}>{job['No of Hired'] || '0'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: colors.textSecondary }}>{job['Job Type'] || '—'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: colors.text }}>{job.JobSalary || '—'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: colors.textSecondary }}>{job['Job Posted Date'] || '—'}</td>
                                    </tr>
                                ))}
                                {filteredJobs.length === 0 && (
                                    <tr>
                                        <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>
                                            {t('No jobs match the current filters', 'لا توجد وظائف تطابق الفلاتر الحالية')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredJobs.length > 100 && (
                        <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: colors.textSecondary, borderTop: `1px solid ${colors.border}` }}>
                            {t(`Showing 100 of ${filteredJobs.length} jobs`, `عرض 100 من ${filteredJobs.length} وظيفة`)}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ INVITE CONFIRMATION DIALOG ═══════ */}
            {showInviteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: colors.card, borderRadius: 20, padding: 32, maxWidth: 620,
                        width: '90%', maxHeight: '80vh', overflowY: 'auto',
                    }}>
                        {/* ── Header ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: 12, borderRadius: 12, background: colors.primaryLight }}>
                                <Send size={24} color={colors.primary} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>
                                    {inviteResults ? t('Invitations Sent', 'تم إرسال الدعوات') : t('Confirm Invitation', 'تأكيد الدعوة')}
                                </h3>
                                <p style={{ fontSize: 14, color: colors.textSecondary, margin: '4px 0 0' }}>
                                    {inviteResults
                                        ? t(`${inviteResults.length} magic links generated`, `تم إنشاء ${inviteResults.length} رابط سحري`)
                                        : t(
                                            `You are about to invite ${selectedCompanies.size} companies to join Emirati Human Development Platform`,
                                            `أنت على وشك دعوة ${selectedCompanies.size} شركة للانضمام إلى المسارات الإماراتية`
                                        )}
                                </p>
                            </div>
                        </div>

                        {/* ── Error ── */}
                        {inviteError && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                                background: colors.redBg, color: colors.redText, fontSize: 13,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <AlertTriangle size={16} /> {inviteError}
                            </div>
                        )}

                        {/* ── SUCCESS: Magic Links List ── */}
                        {inviteResults ? (
                            <>
                                <div style={{ maxHeight: 350, overflowY: 'auto', marginBottom: 20 }}>
                                    {inviteResults.map((inv, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                                            background: i % 2 === 0 ? '#F8FAFC' : colors.card,
                                            border: `1px solid ${colors.border}`,
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <CheckCircle size={14} color={colors.greenText} />
                                                    {inv.company_name}
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                                                        background: inv.intended_role === 'employer_admin' ? colors.purpleBg : colors.blueBg,
                                                        color: inv.intended_role === 'employer_admin' ? colors.purpleText : colors.blueText,
                                                    }}>
                                                        {inv.intended_role === 'employer_admin' ? t('HR MANAGER', 'مدير موارد بشرية') : t('RECRUITER', 'مسؤول توظيف')}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {inv.magic_link}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(inv.magic_link); }}
                                                    title={t('Copy link', 'نسخ الرابط')}
                                                    style={{ padding: 6, borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer' }}
                                                >
                                                    <Copy size={13} color={colors.textSecondary} />
                                                </button>
                                                <a
                                                    href={inv.magic_link} target="_blank" rel="noopener noreferrer"
                                                    style={{ padding: 6, borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.card, display: 'flex' }}
                                                >
                                                    <ExternalLink size={13} color={colors.blueText} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { setShowInviteConfirm(false); setInviteResults(null); setInviteError(''); setSelectedCompanies(new Set()); }}
                                        style={{
                                            padding: '10px 24px', borderRadius: 10,
                                            background: colors.primary, color: '#fff', border: 'none',
                                            fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                        }}
                                    >
                                        {t('Done', 'تم')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* ── PENDING: Companies List ── */}
                                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                                    {Array.from(selectedCompanies).map((name, i) => {
                                        const company = companyAggregates.find(c => c.name === name);
                                        return (
                                            <div key={name} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                                                background: i % 2 === 0 ? '#F8FAFC' : colors.card,
                                                border: `1px solid ${colors.border}`,
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {name}
                                                        {existingCompanies.has(name) && (
                                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: colors.yellowBg, color: colors.yellowText, flexShrink: 0 }}>
                                                                {t('ALREADY ON PLATFORM', 'مسجلة بالفعل')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: colors.textSecondary }}>
                                                        {company?.sector} • {company?.email || t('No email', 'لا يوجد بريد')} • {company?.totalVacancies} {t('vacancies', 'شواغر')}
                                                    </div>
                                                </div>
                                                {/* Role this invitation will confer — the operator's
                                                    decision (#89); the invitee cannot change it. */}
                                                <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                                                    {([['recruiter', t('Recruiter', 'مسؤول توظيف')], ['employer_admin', t('HR Manager', 'مدير موارد بشرية')]] as const).map(([value, label]) => {
                                                        const active = (inviteRoles[name] || 'recruiter') === value;
                                                        return (
                                                            <button
                                                                key={value}
                                                                disabled={inviteSending}
                                                                onClick={() => setInviteRoles(prev => ({ ...prev, [name]: value }))}
                                                                style={{
                                                                    padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                                                    border: `1px solid ${active ? colors.primary : colors.border}`,
                                                                    background: active ? colors.primaryLight : colors.card,
                                                                    color: active ? colors.primary : colors.textSecondary,
                                                                    cursor: inviteSending ? 'default' : 'pointer',
                                                                }}
                                                            >
                                                                {label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={() => toggleCompanySelection(name)}
                                                    disabled={inviteSending}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, padding: 4, marginLeft: 4 }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── Info note ── */}
                                <div style={{
                                    padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                                    background: colors.blueBg, color: colors.blueText, fontSize: 13,
                                }}>
                                    {t(
                                        'Each magic link grants exactly the role you choose above — the invitee cannot change it. They activate their account by signing in with UAE PASS.',
                                        'يمنح كل رابط سحري الدور الذي تختاره أعلاه بالضبط — ولا يمكن للمدعو تغييره. يقوم المدعو بتفعيل حسابه عبر تسجيل الدخول بالهوية الرقمية.'
                                    )}
                                </div>

                                {/* ── Actions ── */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button
                                        onClick={() => { setShowInviteConfirm(false); setInviteError(''); }}
                                        disabled={inviteSending}
                                        style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.card, cursor: 'pointer', fontSize: 14, color: colors.textSecondary }}
                                    >
                                        {t('Cancel', 'إلغاء')}
                                    </button>
                                    <button
                                        disabled={inviteSending}
                                        onClick={async () => {
                                            setInviteSending(true);
                                            setInviteError('');
                                            try {
                                                const companiesPayload = Array.from(selectedCompanies).map(name => {
                                                    const c = companyAggregates.find(co => co.name === name);
                                                    return {
                                                        name: c?.name || name,
                                                        code: c?.code || '',
                                                        email: c?.email || '',
                                                        phone: c?.phone || '',
                                                        sector: c?.sector || '',
                                                        tradeLicense: c?.tradeLicense || '',
                                                        // Operator-chosen role this invitation confers (#89).
                                                        role: inviteRoles[name] || 'recruiter',
                                                    };
                                                });

                                                const response = await restClient.post('/api/growth/invite-companies', {
                                                    companies: companiesPayload,
                                                });

                                                if (response.data?.success) {
                                                    setInviteResults(response.data.invitations || []);
                                                } else {
                                                    setInviteError(response.data?.error || t('Failed to send invitations', 'فشل إرسال الدعوات'));
                                                }
                                            } catch (err: any) {
                                                setInviteError(err?.response?.data?.error || err?.message || t('Failed to send invitations', 'فشل إرسال الدعوات'));
                                            } finally {
                                                setInviteSending(false);
                                            }
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10,
                                            background: inviteSending ? '#9DA8B6' : colors.primary, color: '#fff',
                                            border: 'none', fontWeight: 600, fontSize: 14, cursor: inviteSending ? 'wait' : 'pointer',
                                        }}
                                    >
                                        {inviteSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        {inviteSending
                                            ? t('Sending...', 'جاري الإرسال...')
                                            : t('Send Invitations', 'إرسال الدعوات')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Shared styles ───
const thStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#5A6B7B',
    whiteSpace: 'nowrap',
};

export default NafisVacancyImport;
