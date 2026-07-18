import React, { useEffect, useState } from 'react';
import { profileService, ExperienceEntry } from '@/services/profile/profileService';
import { Briefcase, Calendar, Edit2, MapPin, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/EnhancedLanguageContext';

export const ExperienceModule = () => {
    const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const { language, isRTL } = useLanguage();
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    // New Entry Form State
    const [newEntry, setNewEntry] = useState<ExperienceEntry>({
        job_title: '',
        company: '',
        location: '',
        start_date: '',
        is_current: false,
        description: ''
    });

    const resetForm = () => {
        setNewEntry({
            job_title: '',
            company: '',
            location: '',
            start_date: '',
            is_current: false,
            description: ''
        });
        setEditId(null);
    };

    const handleEdit = (exp: ExperienceEntry) => {
        setNewEntry({
            job_title: exp.job_title || '',
            company: exp.company || '',
            location: exp.location || '',
            start_date: exp.start_date ? exp.start_date.substring(0, 10) : '',
            end_date: exp.end_date ? exp.end_date.substring(0, 10) : '',
            is_current: exp.is_current || false,
            description: exp.description || ''
        });
        setEditId(exp.id || null);
        setShowAddForm(true);
    };

    useEffect(() => {
        loadExperience();
    }, []);

    const loadExperience = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success && res.data.experience) {
                const sorted = res.data.experience.sort((a: any, b: any) =>
                    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
                );
                setExperiences(sorted);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editId) {
                await profileService.updateExperience(editId, newEntry);
            } else {
                await profileService.addExperience(newEntry);
            }
            setShowAddForm(false);
            resetForm();
            loadExperience();
        } catch (e) {
            alert(editId ? t('Failed to update experience', 'فشل تحديث الخبرة') : t('Failed to save experience', 'فشل حفظ الخبرة'));
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!window.confirm(t('Are you sure you want to delete this experience?', 'هل أنت متأكد من حذف هذه الخبرة؟'))) {
            return;
        }
        try {
            const res = await profileService.deleteExperience(id);
            if (res.success) {
                loadExperience();
            } else {
                alert(res.message || t('Failed to delete experience', 'فشل حذف الخبرة'));
            }
        } catch (e) {
            console.error(e);
            alert(t('Failed to delete experience', 'فشل حذف الخبرة'));
        }
    };

    if (loading) return <div className="p-8">{t('Loading experience...', 'جارٍ تحميل الخبرات...')}</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('Work Experience', 'الخبرة المهنية')}</h2>
                    <p className="text-gray-500">{t('Showcase your professional journey.', 'اعرض مسيرتك المهنية.')}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddForm(true);
                    }}
                    className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors shadow-md"
                >
                    <Plus size={18} />
                    <span>{t('Add Experience', 'إضافة خبرة')}</span>
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-teal-100 animate-slide-down">
                    <h3 className="font-bold text-lg mb-4">
                        {editId ? t('Edit Position', 'تعديل المنصب') : t('Add New Role', 'إضافة منصب جديد')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder={t('Job Title', 'المسمى الوظيفي')}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={newEntry.job_title}
                            onChange={e => setNewEntry({ ...newEntry, job_title: e.target.value })}
                        />
                        <input
                            placeholder={t('Company', 'الشركة')}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={newEntry.company}
                            onChange={e => setNewEntry({ ...newEntry, company: e.target.value })}
                        />
                        <input
                            placeholder={t('Location', 'الموقع')}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={newEntry.location}
                            onChange={e => setNewEntry({ ...newEntry, location: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-full"
                                value={newEntry.start_date}
                                onChange={e => setNewEntry({ ...newEntry, start_date: e.target.value })}
                            />
                            {!newEntry.is_current && (
                                <input
                                    type="date"
                                    className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-full"
                                    value={newEntry.end_date || ''}
                                    onChange={e => setNewEntry({ ...newEntry, end_date: e.target.value })}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="current"
                            checked={newEntry.is_current}
                            onChange={e => setNewEntry({ ...newEntry, is_current: e.target.checked })}
                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <label htmlFor="current" className={`ms-2 text-gray-700`}>{t('I currently work here', 'أعمل هنا حالياً')}</label>
                    </div>

                    <textarea
                        placeholder={t('Describe your responsibilities and achievements...', 'صف مسؤولياتك وإنجازاتك...')}
                        className="w-full p-3 border rounded-lg h-32 mb-4 focus:ring-2 focus:ring-teal-500 outline-none"
                        value={newEntry.description}
                        onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                    />

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                resetForm();
                                setShowAddForm(false);
                            }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            {t('Cancel', 'إلغاء')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm"
                        >
                            {editId ? t('Update Position', 'تحديث المنصب') : t('Save Position', 'حفظ المنصب')}
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline View */}
            <div className={`relative border-s-2 ms-3 ps-8 border-gray-200 space-y-8 py-2`}>
                {experiences.length === 0 && !showAddForm && (
                    <p className="text-gray-500 italic">{t('No experience added yet.', 'لم يتم إضافة خبرة بعد.')}</p>
                )}

                {experiences.map((exp, idx) => (
                    <div key={idx} className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        {/* Timeline Dot */}
                        <div className={`absolute -start-[41px] top-6 w-5 h-5 rounded-full border-4 border-white bg-teal-500 shadow-sm`}></div>

                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{exp.job_title}</h3>
                                <div className="text-teal-600 font-medium mb-1">{exp.company}</div>
                                <div className="flex items-center text-sm text-gray-500 gap-4 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        <span>
                                            {new Date(exp.start_date).getFullYear()} -
                                            {exp.is_current ? t(' Present', ' الحالي') : ` ${new Date(exp.end_date!).getFullYear()}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        <span>{exp.location}</span>
                                    </div>
                                </div>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {exp.description}
                                </p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEdit(exp)}
                                    className="text-gray-400 hover:text-teal-600 transition-colors"
                                    title={t('Edit', 'تعديل')}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(exp.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title={t('Delete', 'حذف')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
