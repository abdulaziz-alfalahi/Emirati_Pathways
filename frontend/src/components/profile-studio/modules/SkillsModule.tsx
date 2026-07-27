import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, Shield, Zap, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileService, CandidateProfile } from '@/services/profile/profileService';
import { restClient } from '@/utils/api';
import { AssessmentModule } from './AssessmentModule';
import { useLanguage } from '@/context/EnhancedLanguageContext';

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const SkillsModule = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    // Add-skill modal state
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newLevel, setNewLevel] = useState('Intermediate');
    const [saving, setSaving] = useState(false);
    const { language, isRTL } = useLanguage();
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            // Merge two stores so what you add is what you see: the profile
            // (carries assessment scores/verification) AND the intelligence
            // user_skills store (where self-reported skills are written).
            const [profRes, intel] = await Promise.allSettled([
                profileService.getProfile(),
                restClient.get('/api/intelligence/skills'),
            ]);

            const byName = new Map<string, any>();
            if (profRes.status === 'fulfilled' && profRes.value?.success) {
                setProfile(profRes.value.data);
                (profRes.value.data.skills || []).forEach((s: any) => {
                    byName.set((s.name || '').toLowerCase(), { ...s, score: s.assessment_score || 0 });
                });
            }
            if (intel.status === 'fulfilled') {
                (intel.value?.data?.skills || []).forEach((s: any) => {
                    const name = s.skill_name || s.name || '';
                    const key = name.toLowerCase();
                    if (!key) return;
                    if (!byName.has(key)) {
                        byName.set(key, {
                            name,
                            category: s.category || 'Technical',
                            level: cap(s.proficiency || 'intermediate'),
                            verified: !!s.verified,
                            score: s.assessment_score || 0,
                        });
                    }
                });
            }
            setSkills(Array.from(byName.values()));
        } catch (error) {
            console.error("Failed to load skills", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async () => {
        const name = newName.trim();
        if (!name) {
            toast.error(t('Enter a skill name', 'أدخل اسم المهارة'));
            return;
        }
        setSaving(true);
        try {
            await restClient.post('/api/intelligence/skills', {
                skill_name: name,
                proficiency: newLevel.toLowerCase(),
                source: 'self_reported',
            });
            toast.success(t('Skill added', 'تمت إضافة المهارة'));
            setNewName('');
            setNewLevel('Intermediate');
            setShowAdd(false);
            await loadSkills();
        } catch (e) {
            toast.error(t('Could not add skill', 'تعذر إضافة المهارة'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-teal-600" /></div>;

    const filterLabels: Record<string, string> = {
        'All': t('All', 'الكل'),
        'Technical': t('Technical', 'تقنية'),
        'Soft': t('Soft', 'شخصية')
    };

    const filteredSkills = filter === 'All' ? skills : skills.filter(s => {
        if (filter === 'Soft') return s.category === 'Soft' || s.category === 'Soft Skills';
        return s.category === filter;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('Skills Matrix', 'مصفوفة المهارات')}</h2>
                    <p className="text-gray-500">{t('Validated competencies from your assessments.', 'الكفاءات المعتمدة من تقييماتك.')}</p>
                </div>
            </div>

            {/* Matrix Content */}
            <div className="flex gap-2">
                {['All', 'Technical', 'Soft'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {filterLabels[f]}
                    </button>
                ))}
            </div>

            {/* Assessment Call-to-Action */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <Shield /> {t('Verify Your Skills', 'تحقق من مهاراتك')}
                    </h3>
                    <p className="opacity-90 max-w-lg">
                        {t("Take our 15-minute standard assessment to earn a \"Verified\" badge. Verified candidates are prioritized by top employers.", 'أكمل تقييمنا المعياري خلال 15 دقيقة للحصول على شارة "موثق". المرشحون الموثقون يحظون بأولوية لدى كبار أصحاب العمل.')}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/assessments')}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-transform hover:-translate-y-1"
                >
                    {t('Start Assessment', 'ابدأ التقييم')}
                </button>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSkills.map((skill, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-teal-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    {skill.name}
                                    {skill.verified && (
                                        <div title={t('Verified by Assessment', 'تم التحقق بالتقييم')}>
                                            <CheckCircle size={16} className="text-teal-500" />
                                        </div>
                                    )}
                                </h4>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                    {skill.category}
                                </span>
                            </div>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${skill.level === 'Expert' ? 'bg-purple-100 text-purple-700' :
                                skill.level === 'Advanced' ? 'bg-green-100 text-green-700' :
                                    'bg-teal-100 text-teal-700'
                                }`}>
                                {skill.level}
                            </span>
                        </div>

                        {/* Progress Bar (Score) */}
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block text-gray-600">
                                        {t('Proficiency Score', 'درجة الإتقان')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold inline-block text-gray-600">
                                        {skill.score > 0 ? `${skill.score}%` : t('Not Assessed', 'لم يُقيّم')}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                <div
                                    style={{ width: `${skill.score}%` }}
                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${skill.verified ? 'bg-gradient-to-r from-teal-400 to-teal-600' : 'bg-gray-300'
                                        }`}
                                ></div>
                            </div>
                        </div>

                        {!skill.verified && (
                            <button
                                onClick={() => navigate(`/mentorship?tab=find&search=${encodeURIComponent(skill.name)}`)}
                                className="text-xs text-teal-600 flex items-center hover:underline mt-2 gap-1"
                            >
                                <Zap size={12} />
                                {t('Verify this skill', 'تحقق من هذه المهارة')}
                            </button>
                        )}
                    </div>
                ))}

                {/* Add New Skill Card */}
                <button
                    onClick={() => setShowAdd(true)}
                    className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors min-h-[160px]"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                        <span className="text-2xl font-light">+</span>
                    </div>
                    <span className="font-medium">{t('Add Skill', 'إضافة مهارة')}</span>
                </button>
            </div>

            {/* Add Skill Modal */}
            {showAdd && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    onClick={() => !saving && setShowAdd(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{t('Add a Skill', 'إضافة مهارة')}</h3>
                            <button onClick={() => !saving && setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Skill name', 'اسم المهارة')}</label>
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(); }}
                            placeholder={t('e.g. Python, Project Management', 'مثال: بايثون، إدارة المشاريع')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Proficiency', 'مستوى الإتقان')}</label>
                        <select
                            value={newLevel}
                            onChange={(e) => setNewLevel(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            {LEVELS.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowAdd(false)}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium disabled:opacity-50"
                            >
                                {t('Cancel', 'إلغاء')}
                            </button>
                            <button
                                onClick={handleAddSkill}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {t('Add Skill', 'إضافة مهارة')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assessment Integration */}
            <div className="mt-12">
                <div className="border-t border-gray-200 my-8"></div>
                {profile && <AssessmentModule profile={profile} />}
            </div>
        </div>
    );
};
