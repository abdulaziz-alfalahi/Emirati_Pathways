import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { restClient } from '@/utils/api';
import {
    Plus, Briefcase, Users, Eye, EyeOff, Pencil, Trash2, Loader2,
    GraduationCap, Clock, MapPin, Building
} from 'lucide-react';

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
    location: '', location_ar: '', sector: '', duration: '',
    stipend: '', budget: '', description: '', description_ar: '',
    skills: '', type: 'Full-time', category: '',
};

/* ─────────────── Component ─────────────── */
const RecruiterPostings: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const b = (en: string, ar: string) => isRTL ? ar : en;
    const { toast } = useToast();

    const [postings, setPostings] = useState<Posting[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'internship' | 'gig'>('internship');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<FormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'internship' | 'gig'>('all');

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
                                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
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
                                    <tr key={`${p.posting_type}-${p.id}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
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
                                            <span className="inline-flex items-center gap-1 text-sm font-dubai-bold text-teal-700">
                                                <Users className="h-3.5 w-3.5" /> {p.application_count}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {p.is_active
                                                ? <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]"><Eye className="h-3 w-3 mr-0.5" />{b('Active', 'نشط')}</Badge>
                                                : <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]"><EyeOff className="h-3 w-3 mr-0.5" />{b('Inactive', 'غير نشط')}</Badge>}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
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
