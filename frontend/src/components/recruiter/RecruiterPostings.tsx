import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { restClient } from '@/utils/api';
import {
    Plus, Briefcase, Users, Eye, EyeOff, Pencil, Trash2, Loader2,
    GraduationCap, Clock, MapPin, Building, ChevronDown, ChevronUp,
    CheckCircle, XCircle, Star, Mail, Phone, MessageSquare, Calendar, ExternalLink
} from 'lucide-react';
import LocationPicker from '@/components/common/LocationPicker';

/* ─────────────── Types ─────────────── */
interface Posting {
    id: number;
    title: string;
    title_ar?: string;
    company: string;
    company_ar?: string;
    location: string;
    sector?: string;
    category?: string;
    duration?: string;
    stipend?: string;
    budget?: string;
    skills?: string[];
    is_active: boolean;
    posting_type: 'internship' | 'gig';
    application_count: number;
    description?: string;
}

interface FormData {
    title: string;
    title_ar: string;
    company: string;
    company_ar: string;
    location: string;
    location_ar: string;
    latitude: number | null;
    longitude: number | null;
    sector: string;
    duration: string;
    stipend: string;
    budget: string;
    description: string;
    description_ar: string;
    skills: string;
    type: string;
    category: string;
}

const emptyForm: FormData = {
    title: '', title_ar: '', company: '', company_ar: '',
    location: '', location_ar: '', latitude: null, longitude: null,
    sector: '', duration: '',
    stipend: '', budget: '', description: '', description_ar: '',
    skills: '', type: 'Full-time', category: '',
};

/* ─────────────── Component ─────────────── */
const RecruiterPostings: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const b = (en: string, ar: string) => isRTL ? ar : en;
    const { toast } = useToast();
    const navigate = useNavigate();

    const [postings, setPostings] = useState<Posting[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'internship' | 'gig'>('internship');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<FormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'internship' | 'gig'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [applicants, setApplicants] = useState<Record<string, any[]>>({});
    const [loadingApplicants, setLoadingApplicants] = useState<string | null>(null);
    const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);

    // Load postings
    useEffect(() => { loadPostings(); }, []);

    const loadPostings = async () => {
        setLoading(true);
        try {
            const resp = await restClient.get('/api/career-services/my-postings');
            if (resp.data) {
                const all: Posting[] = [
                    ...(resp.data.internships || []).map((p: any) => ({ ...p, posting_type: 'internship' as const })),
                    ...(resp.data.gigs || []).map((p: any) => ({ ...p, posting_type: 'gig' as const })),
                ];
                setPostings(all);
            }
        } catch {
            // Fallback: if API fails, show empty state
            setPostings([]);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.title || !form.company) {
            toast({ title: b('Missing Fields', 'حقول مفقودة'), description: b('Title and company are required', 'العنوان والشركة مطلوبان'), variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const skillsArr = form.skills.split(',').map(s => s.trim()).filter(Boolean);
            const endpoint = formType === 'internship' ? '/api/career-services/internships' : '/api/career-services/gigs';

            const payload: any = {
                title: form.title, title_ar: form.title_ar,
                company: form.company, company_ar: form.company_ar,
                location: form.location, location_ar: form.location_ar,
                description: form.description, description_ar: form.description_ar,
                skills: skillsArr, duration: form.duration,
            };
            if (formType === 'internship') {
                payload.sector = form.sector;
                payload.stipend = form.stipend;
                payload.type = form.type;
            } else {
                payload.budget = form.budget;
                payload.category = form.category;
            }

            if (editingId) {
                await restClient.put(`${endpoint}/${editingId}`, payload);
                toast({ title: b('Updated', 'تم التحديث'), description: b('Posting updated successfully', 'تم تحديث الإعلان بنجاح') });
            } else {
                await restClient.post(endpoint, payload);
                toast({ title: b('Created', 'تم الإنشاء'), description: b('Posting created successfully', 'تم إنشاء الإعلان بنجاح') });
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });
            loadPostings();
        } catch (err) {
            toast({ title: b('Error', 'خطأ'), description: String(err), variant: 'destructive' });
        }
        setSaving(false);
    };

    const handleEdit = (posting: Posting) => {
        setFormType(posting.posting_type);
        setEditingId(posting.id);
        setForm({
            title: posting.title || '',
            title_ar: posting.title_ar || '',
            company: posting.company || '',
            company_ar: posting.company_ar || '',
            location: posting.location || '',
            location_ar: '',
            latitude: null,
            longitude: null,
            sector: posting.sector || '',
            duration: posting.duration || '',
            stipend: posting.stipend || '',
            budget: posting.budget || '',
            description: posting.description || '',
            description_ar: '',
            skills: (posting.skills || []).join(', '),
            type: 'Full-time',
            category: posting.category || '',
        });
        setShowForm(true);
    };

    const handleDeactivate = async (posting: Posting) => {
        const endpoint = posting.posting_type === 'internship'
            ? `/api/career-services/internships/${posting.id}`
            : `/api/career-services/gigs/${posting.id}`;
        try {
            await restClient.delete(endpoint);
            toast({ title: b('Deactivated', 'تم الإلغاء'), description: b('Posting deactivated', 'تم إلغاء الإعلان') });
            loadPostings();
        } catch {
            toast({ title: b('Error', 'خطأ'), variant: 'destructive' });
        }
    };

    const toggleApplicants = async (posting: Posting) => {
        const key = `${posting.posting_type}-${posting.id}`;
        if (expandedId === key) {
            setExpandedId(null);
            return;
        }
        setExpandedId(key);
        if (!applicants[key]) {
            setLoadingApplicants(key);
            try {
                const endpoint = posting.posting_type === 'internship'
                    ? `/api/career-services/internships/${posting.id}/applicants`
                    : `/api/career-services/gigs/${posting.id}/applicants`;
                const resp = await restClient.get(endpoint);
                setApplicants(prev => ({ ...prev, [key]: resp.data?.applicants || [] }));
            } catch {
                setApplicants(prev => ({ ...prev, [key]: [] }));
            }
            setLoadingApplicants(null);
        }
    };

    const updateApplicationStatus = async (applicationId: number, status: string, postingKey: string) => {
        setUpdatingAppId(applicationId);
        try {
            const isGig = postingKey.startsWith('gig-');
            const endpoint = isGig
                ? `/api/career-services/gig-applications/${applicationId}/status`
                : `/api/career-services/internship-applications/${applicationId}/status`;
            await restClient.put(endpoint, { status });
            // Update local state
            setApplicants(prev => ({
                ...prev,
                [postingKey]: (prev[postingKey] || []).map(a =>
                    a.application_id === applicationId ? { ...a, status } : a
                )
            }));
            toast({ title: b('Updated', 'تم التحديث'), description: b(`Application ${status}`, `الطلب ${status}`) });
        } catch {
            toast({ title: b('Error', 'خطأ'), variant: 'destructive' });
        }
        setUpdatingAppId(null);
    };

    const filtered = activeFilter === 'all' ? postings : postings.filter(p => p.posting_type === activeFilter);

    // ── Render ──
    return (
        <div className="space-y-6">
            {/* Header + Quick Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <h2 className="text-lg font-dubai-bold text-slate-800">
                    {b('Internships & Gigs', 'التدريب والعمل الحر')}
                </h2>
                <div className="flex gap-2">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium gap-1"
                        onClick={() => { setFormType('internship'); setEditingId(null); setForm({ ...emptyForm }); setShowForm(true); }}>
                        <GraduationCap className="h-4 w-4" /> {b('Post Internship', 'نشر تدريب')}
                    </Button>
                    <Button size="sm" variant="outline" className="font-dubai-medium gap-1 border-teal-200 text-teal-700 hover:bg-teal-50"
                        onClick={() => { setFormType('gig'); setEditingId(null); setForm({ ...emptyForm }); setShowForm(true); }}>
                        <Briefcase className="h-4 w-4" /> {b('Post Gig', 'نشر عمل حر')}
                    </Button>
                </div>
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <Card className="border-teal-200 bg-teal-50/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-dubai-bold text-teal-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            {editingId
                                ? b(`Edit ${formType === 'internship' ? 'Internship' : 'Gig'}`, `تعديل ${formType === 'internship' ? 'التدريب' : 'العمل الحر'}`)
                                : b(`New ${formType === 'internship' ? 'Internship' : 'Gig'}`, `${formType === 'internship' ? 'تدريب' : 'عمل حر'} جديد`)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-dubai-medium text-slate-500">{b('Title (EN)', 'العنوان (EN)')}</label>
                                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-dubai-medium text-slate-500">{b('Title (AR)', 'العنوان (AR)')}</label>
                                <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
                            </div>
                            <div>
                                <label className="text-xs font-dubai-medium text-slate-500">{b('Company', 'الشركة')}</label>
                                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-dubai-medium text-slate-500">{b('Location', 'الموقع')}</label>
                                <div className="relative">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                                        value={['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain', 'Remote', '100% Remote / Hybrid'].includes(form.location) ? form.location : (form.location ? '__custom__' : '')}
                                        onChange={e => {
                                            if (e.target.value === '__custom__') {
                                                setForm(f => ({ ...f, location: '' }));
                                            } else {
                                                setForm(f => ({ ...f, location: e.target.value }));
                                            }
                                        }}
                                    >
                                        <option value="">{b('Select location...', 'اختر الموقع...')}</option>
                                        <option value="Dubai">{b('Dubai', 'دبي')}</option>
                                        <option value="Abu Dhabi">{b('Abu Dhabi', 'أبوظبي')}</option>
                                        <option value="Sharjah">{b('Sharjah', 'الشارقة')}</option>
                                        <option value="Ajman">{b('Ajman', 'عجمان')}</option>
                                        <option value="Ras Al Khaimah">{b('Ras Al Khaimah', 'رأس الخيمة')}</option>
                                        <option value="Fujairah">{b('Fujairah', 'الفجيرة')}</option>
                                        <option value="Umm Al Quwain">{b('Umm Al Quwain', 'أم القيوين')}</option>
                                        <option value="Al Ain">{b('Al Ain', 'العين')}</option>
                                        <option value="Remote">{b('Remote', 'عن بُعد')}</option>
                                        <option value="100% Remote / Hybrid">{b('100% Remote / Hybrid', 'عن بُعد / هجين')}</option>
                                        <option value="__custom__">{b('Custom location...', 'موقع مخصص...')}</option>
                                    </select>
                                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 pointer-events-none" />
                                </div>
                                {/* Custom text input for custom location */}
                                {!['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain', 'Remote', '100% Remote / Hybrid', ''].includes(form.location) && (
                                    <Input className="mt-2" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder={b('Enter custom location', 'أدخل الموقع المخصص')} />
                                )}
                                {/* Leaflet Map Picker */}
                                {form.location && form.location !== 'Remote' && form.location !== '100% Remote / Hybrid' && (
                                    <div className="mt-2">
                                        <LocationPicker
                                            lat={form.latitude || undefined}
                                            lng={form.longitude || undefined}
                                            onLocationSelect={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
                                            label={b('Pin exact location on map', 'حدد الموقع على الخريطة')}
                                            height="200px"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-dubai-medium text-slate-500">{b('Duration', 'المدة')}</label>
                                <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder={b('e.g. 3 months', 'مثال: 3 أشهر')} />
                            </div>
                            {formType === 'internship' ? (
                                <>
                                    <div>
                                        <label className="text-xs font-dubai-medium text-slate-500">{b('Sector', 'القطاع')}</label>
                                        <Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-dubai-medium text-slate-500">{b('Stipend', 'الراتب')}</label>
                                        <Input value={form.stipend} onChange={e => setForm(f => ({ ...f, stipend: e.target.value }))} placeholder="e.g. 3,000 AED/month" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-xs font-dubai-medium text-slate-500">{b('Category', 'الفئة')}</label>
                                        <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-dubai-medium text-slate-500">{b('Budget', 'الميزانية')}</label>
                                        <Input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. 5,000 – 10,000 AED" />
                                    </div>
                                </>
                            )}
                            <div className="md:col-span-2">
                                <label className="text-xs font-dubai-medium text-slate-500">{b('Skills (comma-separated)', 'المهارات (مفصولة بفاصلة)')}</label>
                                <Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, Python, Data Analysis" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-dubai-medium text-slate-500">{b('Description', 'الوصف')}</label>
                                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                                {b('Cancel', 'إلغاء')}
                            </Button>
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                {editingId ? b('Update', 'تحديث') : b('Publish', 'نشر')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {(['all', 'internship', 'gig'] as const).map(f => (
                    <Button key={f} size="sm" variant={activeFilter === f ? 'default' : 'outline'}
                        className={`font-dubai-medium text-xs ${activeFilter === f ? 'bg-teal-600 text-white' : 'text-slate-600'}`}
                        onClick={() => setActiveFilter(f)}>
                        {f === 'all' ? b('All', 'الكل') : f === 'internship' ? b('Internships', 'التدريب') : b('Gigs', 'العمل الحر')}
                        <Badge className="ml-1.5 text-[10px] bg-white/20 text-inherit border-0">
                            {f === 'all' ? postings.length : postings.filter(p => p.posting_type === f).length}
                        </Badge>
                    </Button>
                ))}
            </div>

            {/* Postings Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="bg-white border-dashed border-2 border-slate-200">
                    <CardContent className="py-12 text-center">
                        <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-dubai-medium">{b('No postings yet', 'لا توجد إعلانات بعد')}</p>
                        <p className="text-xs text-slate-400 font-dubai mt-1">{b('Post your first internship or gig to get started', 'أنشئ أول تدريب أو عمل حر للبدء')}</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-white border border-slate-200/80">
                    <CardContent className="p-0">
                        <table className="w-full text-sm" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className={`px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Title', 'العنوان')}</th>
                                    <th className={`px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Type', 'النوع')}</th>
                                    <th className={`px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Location', 'الموقع')}</th>
                                    <th className={`px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium text-center`}>{b('Apps', 'طلبات')}</th>
                                    <th className={`px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium text-center`}>{b('Status', 'الحالة')}</th>
                                    <th className={`px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium text-center`}>{b('Actions', 'إجراءات')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <React.Fragment key={`${p.posting_type}-${p.id}`}>
                                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="font-dubai-medium text-slate-800">{isRTL ? (p.title_ar || p.title) : p.title}</div>
                                            <div className="text-xs text-slate-400 font-dubai flex items-center gap-1 mt-0.5">
                                                <Building className="h-3 w-3" /> {p.company}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge className={`text-[10px] font-dubai-medium ${p.posting_type === 'internship' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {p.posting_type === 'internship' ? b('Internship', 'تدريب') : b('Gig', 'عمل حر')}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600 font-dubai text-xs">
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location}</span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                onClick={() => toggleApplicants(p)}
                                                className={`inline-flex items-center gap-1 text-sm font-dubai-bold px-2 py-1 rounded-lg transition-colors ${
                                                    p.application_count > 0
                                                        ? 'text-teal-700 bg-teal-50 hover:bg-teal-100 cursor-pointer'
                                                        : 'text-slate-400 cursor-default'
                                                }`}
                                                disabled={p.application_count === 0}
                                            >
                                                <Users className="h-3.5 w-3.5" /> {p.application_count}
                                                {p.application_count > 0 && (
                                                    expandedId === `${p.posting_type}-${p.id}`
                                                        ? <ChevronUp className="h-3 w-3" />
                                                        : <ChevronDown className="h-3 w-3" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {p.is_active
                                                ? <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]"><Eye className="h-3 w-3 mr-0.5" />{b('Active', 'نشط')}</Badge>
                                                : <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]"><EyeOff className="h-3 w-3 mr-0.5" />{b('Inactive', 'غير نشط')}</Badge>}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {p.application_count > 0 && (
                                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-dubai-medium" onClick={() => toggleApplicants(p)}>
                                                        <Users className="h-3.5 w-3.5 mr-1" />{b('Applicants', 'المتقدمون')}
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-teal-600" onClick={() => handleEdit(p)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                {p.is_active && (
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-red-600" onClick={() => handleDeactivate(p)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Expandable Applicants Row */}
                                    {expandedId === `${p.posting_type}-${p.id}` && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                                                {loadingApplicants === `${p.posting_type}-${p.id}` ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                                                        <span className="ml-2 text-sm text-slate-500 font-dubai">{b('Loading applicants...', 'جارٍ تحميل المتقدمين...')}</span>
                                                    </div>
                                                ) : (applicants[`${p.posting_type}-${p.id}`] || []).length === 0 ? (
                                                    <p className="text-sm text-slate-500 font-dubai text-center py-4">{b('No applicants yet', 'لا يوجد متقدمون بعد')}</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-dubai-bold text-slate-600 uppercase tracking-wider mb-3">
                                                            {b('Applicants', 'المتقدمون')} ({(applicants[`${p.posting_type}-${p.id}`] || []).length})
                                                        </h4>
                                                        {(applicants[`${p.posting_type}-${p.id}`] || []).map((app: any) => (
                                                            <div key={app.application_id} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 cursor-pointer hover:ring-2 hover:ring-teal-300 transition-all"
                                                                        onClick={() => app.user_id && navigate(`/candidate-profile/${app.user_id}`)}
                                                                        title={b('View Profile', 'عرض الملف الشخصي')}>
                                                                        {(app.full_name || 'U').charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-dubai-medium text-slate-800 hover:text-teal-700 cursor-pointer hover:underline transition-colors"
                                                                            onClick={() => app.user_id && navigate(`/candidate-profile/${app.user_id}`)}>
                                                                            {app.full_name || b('Unknown User', 'مستخدم غير معروف')}
                                                                        </p>
                                                                        <div className="flex items-center gap-3 text-xs text-slate-400 font-dubai mt-0.5">
                                                                            {app.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>}
                                                                            {app.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>}
                                                                            {app.applied_at && <span>{b('Applied', 'تقدّم')} {new Date(app.applied_at).toLocaleDateString()}</span>}
                                                                        </div>
                                                                        {/* Quick Action Buttons */}
                                                                        <div className="flex items-center gap-1.5 mt-2">
                                                                            <Button size="sm" variant="outline" className="h-6 px-2 text-[11px] text-teal-700 border-teal-200 hover:bg-teal-50 font-dubai-medium gap-1"
                                                                                onClick={() => app.user_id && navigate(`/candidate-profile/${app.user_id}`)}>
                                                                                <ExternalLink className="h-3 w-3" />{b('View Profile', 'عرض الملف')}
                                                                            </Button>
                                                                            <Button size="sm" variant="outline" className="h-6 px-2 text-[11px] text-blue-700 border-blue-200 hover:bg-blue-50 font-dubai-medium gap-1"
                                                                                onClick={() => navigate(`/recruiter/interviews/schedule?candidateId=${app.user_id}&candidateName=${encodeURIComponent(app.full_name || '')}&source=internship&internshipId=${p.id}`)}>
                                                                                <Calendar className="h-3 w-3" />{b('Schedule Interview', 'جدولة مقابلة')}
                                                                            </Button>
                                                                            <Button size="sm" variant="outline" className="h-6 px-2 text-[11px] text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-dubai-medium gap-1"
                                                                                onClick={() => navigate(`/recruiter?tab=messages`)}>
                                                                                <MessageSquare className="h-3 w-3" />{b('Message', 'رسالة')}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className={`text-[10px] font-dubai-medium ${
                                                                        app.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                        app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                                        app.status === 'shortlisted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                                    }`}>
                                                                        {app.status === 'accepted' ? b('Accepted', 'مقبول') :
                                                                         app.status === 'rejected' ? b('Rejected', 'مرفوض') :
                                                                         app.status === 'shortlisted' ? b('Shortlisted', 'مدرج') :
                                                                         b('Pending', 'قيد الانتظار')}
                                                                    </Badge>
                                                                    {app.status === 'pending' && (
                                                                        <div className="flex gap-1">
                                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 font-dubai-medium"
                                                                                onClick={() => updateApplicationStatus(app.application_id, 'shortlisted', `${p.posting_type}-${p.id}`)}
                                                                                disabled={updatingAppId === app.application_id}>
                                                                                <Star className="h-3 w-3 mr-1" />{b('Shortlist', 'إدراج')}
                                                                            </Button>
                                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 font-dubai-medium"
                                                                                onClick={() => updateApplicationStatus(app.application_id, 'accepted', `${p.posting_type}-${p.id}`)}
                                                                                disabled={updatingAppId === app.application_id}>
                                                                                <CheckCircle className="h-3 w-3 mr-1" />{b('Accept', 'قبول')}
                                                                            </Button>
                                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 font-dubai-medium"
                                                                                onClick={() => updateApplicationStatus(app.application_id, 'rejected', `${p.posting_type}-${p.id}`)}
                                                                                disabled={updatingAppId === app.application_id}>
                                                                                <XCircle className="h-3 w-3 mr-1" />{b('Reject', 'رفض')}
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                    {app.status === 'shortlisted' && (
                                                                        <div className="flex gap-1">
                                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 font-dubai-medium"
                                                                                onClick={() => updateApplicationStatus(app.application_id, 'accepted', `${p.posting_type}-${p.id}`)}
                                                                                disabled={updatingAppId === app.application_id}>
                                                                                <CheckCircle className="h-3 w-3 mr-1" />{b('Accept', 'قبول')}
                                                                            </Button>
                                                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 font-dubai-medium"
                                                                                onClick={() => updateApplicationStatus(app.application_id, 'rejected', `${p.posting_type}-${p.id}`)}
                                                                                disabled={updatingAppId === app.application_id}>
                                                                                <XCircle className="h-3 w-3 mr-1" />{b('Reject', 'رفض')}
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RecruiterPostings;
