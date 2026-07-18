import React, { useEffect, useState } from 'react';
import { profileService, EducationEntry } from '@/services/profile/profileService';
import { GraduationCap, Calendar, CheckCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/EnhancedLanguageContext';

export const EducationModule = () => {
    const [education, setEducation] = useState<EducationEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const { language, isRTL } = useLanguage();
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    // New Entry Form State
    const [newEntry, setNewEntry] = useState<EducationEntry>({
        institution: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: '',
        grade: '',
        verification: { is_verified: false, source: 'self_reported' }
    });

    const resetForm = () => {
        setNewEntry({
            institution: '',
            degree: '',
            field: '',
            start_date: '',
            end_date: '',
            grade: '',
            verification: { is_verified: false, source: 'self_reported' }
        });
        setEditId(null);
    };

    const handleEdit = (edu: EducationEntry) => {
        setNewEntry({
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
            start_date: edu.start_date ? edu.start_date.substring(0, 10) : '',
            end_date: edu.end_date ? edu.end_date.substring(0, 10) : '',
            grade: edu.grade || '',
            verification: edu.verification || { is_verified: false, source: 'self_reported' }
        });
        setEditId(edu.id || null);
        setShowAddForm(true);
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!window.confirm(t('Are you sure you want to delete this education entry?', 'هل أنت متأكد من حذف مؤهل التعليم هذا؟'))) {
            return;
        }
        try {
            const res = await profileService.deleteEducation(id);
            if (res.success) {
                loadEducation();
            } else {
                alert(res.message || t('Failed to delete education', 'فشل حذف التعليم'));
            }
        } catch (e) {
            console.error(e);
            alert(t('Failed to delete education', 'فشل حذف التعليم'));
        }
    };

    useEffect(() => {
        loadEducation();
    }, []);

    const loadEducation = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success && res.data.education) {
                setEducation(res.data.education);
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
                await profileService.updateEducation(editId, newEntry);
            } else {
                await profileService.addEducation(newEntry);
            }
            setShowAddForm(false);
            resetForm();
            loadEducation();
        } catch (e) {
            alert(editId ? t('Failed to update education', 'فشل تحديث التعليم') : t('Failed to save education', 'فشل حفظ التعليم'));
        }
    };

    if (loading) return <div className="p-8">{t('Loading credentials...', 'جارٍ تحميل المؤهلات...')}</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('Education & Credentials', 'التعليم والمؤهلات')}</h2>
                    <p className="text-gray-500">{t('Manage your degrees and verify them with blockchain ID.', 'إدارة شهاداتك والتحقق منها بتقنية البلوكتشين.')}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddForm(true);
                    }}
                    className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors shadow-md"
                >
                    <Plus size={18} />
                    <span>{t('Add Education', 'إضافة تعليم')}</span>
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-teal-100 animate-slide-down">
                    <h3 className="font-bold text-lg mb-4">
                        {editId ? t('Edit Education', 'تعديل التعليم') : t('Add Education', 'إضافة تعليم')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder={t('Institution (e.g. UAE University)', 'المؤسسة (مثال: جامعة الإمارات)')}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={newEntry.institution}
                            onChange={e => setNewEntry({ ...newEntry, institution: e.target.value })}
                        />
                        <input
                            placeholder={t("Degree Level (e.g. Bachelor's)", 'مستوى الشهادة (مثال: بكالوريوس)')}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={newEntry.degree}
                            onChange={e => setNewEntry({ ...newEntry, degree: e.target.value })}
                        />
                        <input
                            placeholder={t('Field of Study (e.g. Computer Science)', 'التخصص (مثال: علوم الحاسوب)')}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={newEntry.field}
                            onChange={e => setNewEntry({ ...newEntry, field: e.target.value })}
                        />
                        <input
                            placeholder={t('Grade / GPA', 'المعدل التراكمي')}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={newEntry.grade}
                            onChange={e => setNewEntry({ ...newEntry, grade: e.target.value })}
                        />
                        <div className="flex gap-2 col-span-2">
                            <div className="w-1/2">
                                <label className="text-xs text-gray-500 mb-1 block">{t('Start Date', 'تاريخ البدء')}</label>
                                <input
                                    type="date"
                                    className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-full"
                                    value={newEntry.start_date}
                                    onChange={e => setNewEntry({ ...newEntry, start_date: e.target.value })}
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="text-xs text-gray-500 mb-1 block">{t('End Date (or Expected)', 'تاريخ الانتهاء (أو المتوقع)')}</label>
                                <input
                                    type="date"
                                    className="p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-full"
                                    value={newEntry.end_date}
                                    onChange={e => setNewEntry({ ...newEntry, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
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
                            {editId ? t('Update', 'تحديث') : t('Save', 'حفظ')}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                {education.map((edu, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:bg-teal-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{edu.institution}</h3>
                                <div className="text-gray-700 font-medium">{edu.degree} {t('in', 'في')} {edu.field}</div>
                                <div className="flex items-center text-sm text-gray-500 mt-1 gap-1">
                                    <Calendar size={14} />
                                    <span>{new Date(edu.start_date).getFullYear()} - {new Date(edu.end_date).getFullYear()}</span>
                                    {edu.grade && <span className={`ms-2`}>• {t('GPA:', 'المعدل:')} {edu.grade}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Verification Badge & Actions */}
                        <div className="flex items-center gap-4">
                            {edu.verification?.is_verified ? (
                                <span className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200 gap-1">
                                    <CheckCircle size={12} />
                                    {t('Verified Credential', 'مؤهل موثق')}
                                </span>
                            ) : (
                                <button className="text-xs text-teal-600 hover:underline">
                                    {t('Request Verification', 'طلب التحقق')}
                                </button>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEdit(edu)}
                                    className="text-gray-400 hover:text-teal-600 transition-colors"
                                    title={t('Edit', 'تعديل')}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(edu.id)}
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

            {/* Blockchain / Government Connection Placeholder */}
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/50">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <img src="/images/khda_logo_placeholder.png" className="w-6 h-6 opacity-50" alt="" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">{t('Connect Government Services', 'ربط الخدمات الحكومية')}</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-4">
                    {t('Automatically import attested degrees from KHDA or Ministry of Education via Blockchain integration.', 'استيراد الشهادات المعتمدة تلقائياً من هيئة المعرفة أو وزارة التربية عبر تقنية البلوكتشين.')}
                </p>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    {t('Connect Account (Coming Soon)', 'ربط الحساب (قريباً)')}
                </button>
            </div>
        </div>
    );
};
