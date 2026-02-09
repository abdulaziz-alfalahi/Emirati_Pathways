import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    User,
    Briefcase,
    BookOpen,
    Award,
    Layers,
    Compass,
    ChevronRight
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active }: any) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(path)}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${active
                ? 'bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
        >
            <Icon size={20} />
            <span className="font-medium text-sm">{label}</span>
            {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
        </div>
    );
};

import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';

export const ProfileStudioLayout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const { language, toggleLanguage } = useLanguage();

    // Calculate completion (Mock for now)
    const completion = 65;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <HybridGovernmentNavFixed
                currentPage="profile_studio"
                userRole="job seeker"
                showAuthButtons={false}
                currentLanguage={language}
                onLanguageToggle={toggleLanguage}
            />
            <div className="flex flex-1 pt-20">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-card border-r border-border h-[calc(100vh-5rem)] fixed left-0 top-20 overflow-y-auto px-4 pt-6">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-foreground px-2">Profile Studio</h2>
                        <p className="text-xs text-muted-foreground px-2 mt-1">Unified Candidate Profile</p>
                    </div>

                    {/* Completion Meter */}
                    <div className="mb-8 bg-blue-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-blue-700">Profile Strength</span>
                            <span className="text-xs font-bold text-blue-700">{completion}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1.5">
                            <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${completion}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-blue-600 mt-2">Add 1 more project to reach "All-Star"</p>
                    </div>

                    <nav className="space-y-1">
                        <SidebarItem
                            icon={User}
                            label="Identity & Bio"
                            path="/candidate/profile"
                            active={currentPath === '/candidate/profile'}
                        />
                        <SidebarItem
                            icon={Compass}
                            label="Career Compass"
                            path="/candidate/profile/compass"
                            active={currentPath.includes('compass')}
                        />
                        <div className="w-full h-px bg-border my-2"></div>
                        <SidebarItem
                            icon={Briefcase}
                            label="Experience"
                            path="/candidate/profile/experience"
                            active={currentPath.includes('experience')}
                        />
                        <SidebarItem
                            icon={BookOpen}
                            label="Education"
                            path="/candidate/profile/education"
                            active={currentPath.includes('education')}
                        />
                        <SidebarItem
                            icon={Layers}
                            label="Skills & Assessments"
                            path="/candidate/profile/skills"
                            active={currentPath.includes('skills')}
                        />
                        <div className="w-full h-px bg-border my-2"></div>
                        <SidebarItem
                            icon={Award}
                            label="CV Preview"
                            path="/candidate/profile/preview"
                            active={currentPath.includes('preview')}
                        />
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 ml-64 pt-20 px-8 pb-12">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
