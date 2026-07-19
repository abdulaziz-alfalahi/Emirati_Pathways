import React, { useState, useEffect } from 'react';
import { Compass, Target, MapPin, DollarSign, Clock, Save, Building2 } from 'lucide-react';
import { profileService } from '@/services/profile/profileService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/EnhancedLanguageContext';

export const CareerCompassModule = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { language, isRTL } = useLanguage();
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    const [preferences, setPreferences] = useState({
        targetRoles: [] as string[],
        relocation: false,
        salary: '',
        noticePeriod: '',
        preferredCity: ''
    });

    const [roleInput, setRoleInput] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success && res.data.career_compass) {
                const compass = res.data.career_compass;
                const rawRoles = compass.target_roles || [];
                const cleanRoles = rawRoles.filter((r: string) => !r.startsWith('__CITY__:'));
                const cityTag = rawRoles.find((r: string) => r.startsWith('__CITY__:'));
                const savedCity = cityTag ? cityTag.split('__CITY__:')[1] : '';

                setPreferences({
                    targetRoles: cleanRoles,
                    relocation: compass.relocation || false,
                    salary: compass.salary || '',
                    noticePeriod: compass.notice_period || '',
                    preferredCity: savedCity || res.data.contact?.location || ''
                });
            }
        } catch (e) {
            console.error("Failed to load compass", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileService.updateIdentity({
                target_roles: preferences.targetRoles,
                expected_salary: preferences.salary,
                relocation: preferences.relocation,
                notice_period: preferences.noticePeriod,
                preferred_city: preferences.preferredCity
            } as any);

            toast({ title: t("Preferences Saved", "تم حفظ التفضيلات"), description: t("Your career compass has been updated.", "تم تحديث بوصلتك المهنية.") });
        } catch (e) {
            toast({ variant: "destructive", title: t("Error", "خطأ"), description: t("Failed to save preferences.", "فشل حفظ التفضيلات.") });
        } finally {
            setSaving(false);
        }
    };

    const addRole = () => {
        if (roleInput && !preferences.targetRoles.includes(roleInput)) {
            setPreferences(prev => ({
                ...prev,
                targetRoles: [...prev.targetRoles, roleInput]
            }));
            setRoleInput('');
        }
    };

    const removeRole = (role: string) => {
        setPreferences(prev => ({
            ...prev,
            targetRoles: prev.targetRoles.filter(r => r !== role)
        }));
    };

    if (loading) return <div className="p-8">{t('Loading...', 'جارٍ التحميل...')}</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 end-0 w-64 h-64 bg-teal-500 opacity-10 rounded-full blur-3xl -me-16 -mt-16`}></div>
                <div className="relative z-10 flex items-start gap-6">
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <Compass size={48} className="text-teal-300" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">{t('My Career Compass', 'بوصلتي المهنية')}</h2>
                        <p className="text-teal-100 max-w-xl text-lg leading-relaxed">
                            {t('Define your future. Our AI Matching Engine uses this data to find opportunities that align with your goals.', 'حدد مستقبلك. محرك المطابقة بالذكاء الاصطناعي يستخدم هذه البيانات لإيجاد فرص تتوافق مع أهدافك.')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Target Roles */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="text-teal-600" />
                        <h3 className="text-lg font-bold text-gray-900">{t('Target Roles', 'الأدوار المستهدفة')}</h3>
                    </div>
                    <div className="flex-grow">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {preferences.targetRoles.map((role, idx) => (
                                <span key={idx} className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full font-medium text-sm border border-teal-100 flex items-center gap-2">
                                    {role}
                                    <button onClick={() => removeRole(role)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={roleInput}
                                onChange={(e) => setRoleInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addRole()}
                                placeholder={t('Add a role (e.g. Product Manager)', 'أضف دوراً (مثال: مدير منتجات)')}
                                className="flex-grow p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                            <button onClick={addRole} className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg font-medium hover:bg-teal-200">
                                {t('Add', 'إضافة')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-gray-500" />
                            <label className="font-semibold text-gray-700">{t('Expected Salary (Monthly)', 'الراتب المتوقع (شهرياً)')}</label>
                        </div>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer hover:border-teal-300 transition-colors"
                            value={preferences.salary}
                            onChange={(e) => setPreferences({ ...preferences, salary: e.target.value })}
                        >
                            <option value="">{t('Select Range', 'اختر النطاق')}</option>
                            <option>{t('10,000 - 15,000 AED', '10,000 - 15,000 درهم')}</option>
                            <option>{t('15,000 - 20,000 AED', '15,000 - 20,000 درهم')}</option>
                            <option>{t('20,000 - 30,000 AED', '20,000 - 30,000 درهم')}</option>
                            <option>{t('30,000 - 40,000 AED', '30,000 - 40,000 درهم')}</option>
                            <option>{t('40,000 - 50,000 AED', '40,000 - 50,000 درهم')}</option>
                            <option>{t('50,000 - 75,000 AED', '50,000 - 75,000 درهم')}</option>
                            <option>{t('75,000 - 100,000 AED', '75,000 - 100,000 درهم')}</option>
                            <option>{t('100,000+ AED', '100,000+ درهم')}</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 size={18} className="text-gray-500" />
                            <label className="font-semibold text-gray-700">{t('Preferred Work City', 'مدينة العمل المفضلة')}</label>
                        </div>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer"
                            value={preferences.preferredCity}
                            onChange={(e) => setPreferences({ ...preferences, preferredCity: e.target.value })}
                        >
                            <option value="">{t('Any / Flexible', 'أي مدينة / مرن')}</option>
                            <option>{t('Abu Dhabi', 'أبوظبي')}</option>
                            <option>{t('Dubai', 'دبي')}</option>
                            <option>{t('Sharjah', 'الشارقة')}</option>
                            <option>{t('Ajman', 'عجمان')}</option>
                            <option>{t('Ras Al Khaimah', 'رأس الخيمة')}</option>
                            <option>{t('Fujairah', 'الفجيرة')}</option>
                            <option>{t('Umm Al Quwain', 'أم القيوين')}</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin size={18} className="text-gray-500" />
                            <label className="font-semibold text-gray-700">{t('Willing to Relocate?', 'مستعد للانتقال؟')}</label>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center cursor-pointer gap-2">
                                <input
                                    type="radio"
                                    name="relocate"
                                    checked={preferences.relocation}
                                    onChange={() => setPreferences({ ...preferences, relocation: true })}
                                    className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-gray-700">{t('Yes, anywhere in UAE', 'نعم، في أي مكان بالإمارات')}</span>
                            </label>
                            <label className="flex items-center cursor-pointer gap-2">
                                <input
                                    type="radio"
                                    name="relocate"
                                    checked={!preferences.relocation}
                                    onChange={() => setPreferences({ ...preferences, relocation: false })}
                                    className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-gray-700">{t('No, current city only', 'لا، المدينة الحالية فقط')}</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={18} className="text-gray-500" />
                            <label className="font-semibold text-gray-700">{t('Notice Period', 'فترة الإشعار')}</label>
                        </div>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                            value={preferences.noticePeriod}
                            onChange={(e) => setPreferences({ ...preferences, noticePeriod: e.target.value })}
                        >
                            <option value="">{t('Select Period', 'اختر الفترة')}</option>
                            <option>{t('Immediate', 'فوري')}</option>
                            <option>{t('1 Month', 'شهر واحد')}</option>
                            <option>{t('2 Months', 'شهران')}</option>
                            <option>{t('3 Months', '3 أشهر')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-teal-700 transition-all disabled:opacity-70"
                >
                    <Save size={20} />
                    {saving ? t('Saving...', 'جارٍ الحفظ...') : t('Save Preferences', 'حفظ التفضيلات')}
                </button>
            </div>
        </div>
    );
};
