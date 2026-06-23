import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    User,
    Briefcase,
    BookOpen,
    Award,
    Layers,
    Compass,
    ChevronRight,
    ChevronLeft,
    ArrowLeft,
    ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';

const SidebarItem = ({ icon: Icon, label, path, active, isRTL }: any) => {
    const navigate = useNavigate();
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
    return (
        <div
            onClick={() => navigate(path)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${active
                ? 'bg-teal-50 text-teal-600 shadow-sm dark:bg-teal-900/20 dark:text-teal-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
        >
            <Icon size={20} />
            <span className="font-medium text-sm">{label}</span>
            {active && <ChevronIcon size={16} className={`${isRTL ? 'mr-auto' : 'ml-auto'} opacity-50`} />}
        </div>
    );
};

export const ProfileStudioLayout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t: i18t } = useTranslation();

    // Bilingual helper
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    // Calculate completion dynamically from profile API
    const [completion, setCompletion] = useState(0);
    const [completionHint, setCompletionHint] = useState('');
    const [pillars, setPillars] = useState<{key: string; label: string; label_ar: string; score: number; max: number; complete: boolean}[]>([]);

    useEffect(() => {
        const fetchReadiness = async () => {
            try {
                const { data } = await restClient.get('/api/v2/profile/readiness');
                if (data?.success) {
                    setCompletion(data.overall);
                    setCompletionHint(language === 'ar' ? data.next_action_ar : data.next_action);
                    setPillars(data.pillars || []);
                }
            } catch (err) {
                console.error('Profile readiness fetch failed:', err);
                setCompletion(0);
                setCompletionHint(language === 'ar' ? 'تعذر حساب الجاهزية' : 'Could not calculate readiness');
            }
        };
        fetchReadiness();
    }, [language]);

    const getReadinessColor = (pct: number) => {
        if (pct >= 80) return 'text-green-600';
        if (pct >= 50) return 'text-amber-600';
        return 'text-red-500';
    };

    return (
        <div className={`min-h-screen bg-background flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <HybridGovernmentNavFixed
                currentPage="profile_studio"
                userRole="job seeker"
                showAuthButtons={false}
                currentLanguage={language}
                onLanguageToggle={toggleLanguage}
            />
            <div className="flex flex-1 pt-20">
                {/* Sidebar Navigation */}
                <div
                    className={`w-64 bg-card ${isRTL ? 'border-l' : 'border-r'} border-border h-[calc(100vh-5rem)] fixed top-20 overflow-y-auto px-4 pt-6`}
                    style={isRTL ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }}
                >
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-foreground px-2">{t('Profile Studio', 'استوديو الملف')}</h2>
                        <p className="text-xs text-muted-foreground px-2 mt-1">{t('Unified Candidate Profile', 'الملف الموحد للمرشح')}</p>
                    </div>

                    {/* Readiness Meter */}
                    <div className="mb-6 bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">{t('Profile Readiness', 'جاهزية الملف')}</span>
                            <span className={`text-sm font-bold ${getReadinessColor(completion)}`}>{completion}%</span>
                        </div>
                        <div className="w-full bg-teal-200 dark:bg-teal-800 rounded-full h-2">
                            <div
                                className="bg-teal-600 h-2 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${completion}%` }}
                            ></div>
                        </div>

                        {/* Pillar mini-bars */}
                        {pillars.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                                {pillars.map(p => {
                                    const pct = p.max > 0 ? Math.round((p.score / p.max) * 100) : 0;
                                    return (
                                        <div key={p.key} className="flex items-center gap-2">
                                            <span className="text-[9px] text-teal-700 dark:text-teal-300 w-[72px] truncate" title={language === 'ar' ? p.label_ar : p.label}>
                                                {language === 'ar' ? p.label_ar : p.label}
                                            </span>
                                            <div className="flex-1 bg-teal-200 dark:bg-teal-800 rounded-full h-1">
                                                <div
                                                    className={`h-1 rounded-full transition-all duration-500 ${p.complete ? 'bg-green-500' : 'bg-teal-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                ></div>
                                            </div>
                                            {p.complete && <span className="text-[8px]">✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-2">{completionHint}</p>
                    </div>

                    <nav className="space-y-1">
                        {/* Back to Dashboard */}
                        <div
                            onClick={() => navigate('/candidate-dashboard')}
                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 text-teal-600 hover:bg-teal-50 mb-2 border border-teal-200"
                            id="back-to-dashboard-btn"
                        >
                            {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                            <span className="font-medium text-sm">{t('Back to Dashboard', 'العودة إلى لوحة التحكم')}</span>
                        </div>
                        <div className="w-full h-px bg-border my-2"></div>
                        <SidebarItem
                            icon={User}
                            label={t('Identity & Bio', 'الهوية والسيرة')}
                            path="/candidate/profile"
                            active={currentPath === '/candidate/profile'}
                            isRTL={isRTL}
                        />
                        <SidebarItem
                            icon={Compass}
                            label={t('Career Compass', 'البوصلة المهنية')}
                            path="/candidate/profile/compass"
                            active={currentPath.includes('compass')}
                            isRTL={isRTL}
                        />
                        <div className="w-full h-px bg-border my-2"></div>
                        <SidebarItem
                            icon={Briefcase}
                            label={t('Experience', 'الخبرة')}
                            path="/candidate/profile/experience"
                            active={currentPath.includes('experience')}
                            isRTL={isRTL}
                        />
                        <SidebarItem
                            icon={BookOpen}
                            label={t('Education', 'التعليم')}
                            path="/candidate/profile/education"
                            active={currentPath.includes('education')}
                            isRTL={isRTL}
                        />
                        <SidebarItem
                            icon={Layers}
                            label={t('Skills & Assessments', 'المهارات والتقييمات')}
                            path="/candidate/profile/skills"
                            active={currentPath.includes('skills')}
                            isRTL={isRTL}
                        />
                        <SidebarItem
                            icon={Award}
                            label={t('Assessment Centers', 'مراكز التقييم')}
                            path="/candidate/profile/assessment-centers"
                            active={currentPath.includes('assessment-centers')}
                            isRTL={isRTL}
                        />
                        <div className="w-full h-px bg-border my-2"></div>
                        <SidebarItem
                            icon={Award}
                            label={t('CV Preview', 'معاينة السيرة الذاتية')}
                            path="/candidate/profile/preview"
                            active={currentPath.includes('preview')}
                            isRTL={isRTL}
                        />
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 pt-20 px-8 pb-12" style={isRTL ? { marginRight: '16rem' } : { marginLeft: '16rem' }}>
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
