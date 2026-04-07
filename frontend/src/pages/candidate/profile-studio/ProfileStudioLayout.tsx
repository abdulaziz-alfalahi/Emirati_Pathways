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
    ChevronLeft
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
    const currentPath = location.pathname;
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t: i18t } = useTranslation();

    // Bilingual helper
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    // Calculate completion dynamically from profile API
    const [completion, setCompletion] = useState(0);
    const [completionHint, setCompletionHint] = useState('');

    useEffect(() => {
        const fetchCompletion = async () => {
            try {
                // Fetch profile and CV list in parallel
                const [profileRes, cvRes] = await Promise.allSettled([
                    restClient.get('/api/v2/profile/'),
                    restClient.get('/api/cv/list'),
                ]);

                const profileData = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
                const cvData = cvRes.status === 'fulfilled' ? cvRes.value.data : null;

                const p = profileData?.success ? (profileData.data || profileData.profile) : null;
                const cvCount = cvData?.total_count ?? cvData?.cvs?.length ?? 0;

                let score = 0;
                const missing: string[] = [];

                if (p) {
                    // Basic Info (30%)
                    if (p.first_name || p.full_name) score += 10; else missing.push('name');
                    if (p.headline) score += 10; else missing.push('headline');
                    if (p.bio) score += 10; else missing.push('bio');

                    // Contact (20%)
                    if (p.contact?.phone || p.phone) score += 10; else missing.push('phone');
                    if (p.contact?.location || p.location) score += 10; else missing.push('location');

                    // Skills & Experience (20%)
                    if (p.skills && p.skills.length > 0) score += 10; else missing.push('skills');
                    if (p.experience && p.experience.length > 0) score += 10; else missing.push('experience');
                }

                // CV (30%) — from separate CV endpoint
                if (cvCount > 0) score += 30; else missing.push('CV');

                setCompletion(Math.min(score, 100));
                if (missing.length > 0) {
                    setCompletionHint(language === 'ar'
                        ? `أضف ${missing[0]} للتقدم`
                        : `Add ${missing[0]} to improve`);
                } else {
                    setCompletionHint(language === 'ar' ? 'ملف كامل! 🌟' : 'All-Star Profile! 🌟');
                }
            } catch (err) {
                setCompletion(10);
            }
        };
        fetchCompletion();
    }, [language]);

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

                    {/* Completion Meter */}
                    <div className="mb-8 bg-teal-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-teal-700">{t('Profile Strength', 'قوة الملف')}</span>
                            <span className="text-xs font-bold text-teal-700">{completion}%</span>
                        </div>
                        <div className="w-full bg-teal-200 rounded-full h-1.5">
                            <div
                                className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${completion}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-teal-600 mt-2">{completionHint || t('Add 1 more project to reach "All-Star"', 'أضف مشروعاً واحداً للوصول إلى "نجم"')}</p>
                    </div>

                    <nav className="space-y-1">
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
