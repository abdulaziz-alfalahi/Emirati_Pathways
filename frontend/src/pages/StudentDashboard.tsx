import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HybridGovernmentNav from "@/components/layout/HybridGovernmentNavFixed";
import UserMenu from "@/components/layout/UserMenu";
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Award, BookOpen, User, Calendar, ExternalLink } from "lucide-react";

import { restClient } from '@/utils/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

const fetchStudentData = async () => {
    try {
        const response = await restClient.get('/api/student/dashboard/stats');
        return response.data;
    } catch (e) {
        console.error(e);
        return {
            success: true,
            data: {
                applications_submitted: 0,
                upcoming_interviews: 0,
            }
        };
    }
};

export const StudentDashboard = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const { language, toggleLanguage } = useLanguage();

    const [activeTab, setActiveTab] = useState("scholarships");
    const [stats, setStats] = useState<any>(null);
    const [scholarships, setScholarships] = useState<any[]>([]);
    const [camps, setCamps] = useState<any[]>([]);
    const [gradPrograms, setGradPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const s = await fetchStudentData();
            setStats(s?.data || {});
        })();
    }, []);

    // Fetch data for each tab independently from education APIs
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                if (activeTab === 'scholarships') {
                    const resp = await fetch(`${API_BASE}/api/education/scholarships`);
                    if (resp.ok) {
                        const data = await resp.json();
                        if (!cancelled) setScholarships(data.scholarships || []);
                    }
                } else if (activeTab === 'camps') {
                    const resp = await fetch(`${API_BASE}/api/education/camps`);
                    if (resp.ok) {
                        const data = await resp.json();
                        if (!cancelled) setCamps(data.camps || []);
                    }
                } else if (activeTab === 'university') {
                    const resp = await fetch(`${API_BASE}/api/education/graduate-programs`);
                    if (resp.ok) {
                        const data = await resp.json();
                        if (!cancelled) setGradPrograms(data.programs || []);
                    }
                }
            } catch (err) {
                console.error('Failed to load tab data:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai" dir={isRTL ? 'rtl' : 'ltr'}>
            <HybridGovernmentNav showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('Welcome, Future Leader! 🇦🇪', 'مرحباً، قائد المستقبل! 🇦🇪')}</h1>
                        <p className="text-muted-foreground mt-2">{t('Your journey to excellence starts here.', 'رحلتك نحو التميّز تبدأ من هنا.')}</p>
                    </div>
                    <UserMenu />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Applications Active', 'الطلبات النشطة')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.applications_submitted || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t('Scholarships & Programs', 'المنح الدراسية والبرامج')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Upcoming Programs', 'البرامج القادمة')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.saved_programs || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">{t("Events you're interested in", 'الفعاليات التي تهمك')}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">{t('Student Profile', 'الملف الأكاديمي')}</h3>
                                <GraduationCap className="h-6 w-6 opacity-80" />
                            </div>
                            <p className="text-teal-50 text-sm mb-4">{t('Complete your academic profile to unlock more opportunities.', 'أكمل ملفك الأكاديمي لفتح المزيد من الفرص.')}</p>
                            <Button variant="secondary" size="sm" className="w-full text-teal-700 font-semibold" onClick={() => window.location.href = '/profile'}>
                                {t('Update Profile', 'تحديث الملف')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="scholarships">{t('Scholarships', 'المنح الدراسية')}</TabsTrigger>
                        <TabsTrigger value="camps">{t('Knowledge Camps', 'المعسكرات المعرفية')}</TabsTrigger>
                        <TabsTrigger value="university">{t('University', 'الجامعة')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scholarships" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {scholarships.map((p: any) => (
                                <Card key={p.id} className="bg-card hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="outline" className="mb-2">{p.scholarship_type || p.type}</Badge>
                                                <CardTitle className="text-xl">{isRTL ? (p.title_ar || p.title) : p.title}</CardTitle>
                                                <CardDescription>{p.provider || p.institution}</CardDescription>
                                            </div>
                                            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">{p.amount || p.value}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-gray-500 gap-4 mb-4">
                                            <span className="flex items-center"><Calendar className="h-4 w-4 me-1" /> {t('Deadline:', 'الموعد النهائي:')} {p.deadline || 'Open'}</span>
                                            {p.min_gpa && <span className="flex items-center"><Award className="h-4 w-4 me-1" /> {t('Min GPA:', 'الحد الأدنى للمعدل:')} {p.min_gpa}</span>}
                                        </div>
                                        <Button className="w-full">{t('Apply Now', 'قدّم الآن')}</Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {scholarships.length === 0 && !loading && (
                                <p className="text-center text-gray-500 col-span-2 py-8">{t('No scholarships found matching your profile.', 'لم يتم العثور على منح دراسية تتوافق مع ملفك.')}</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="camps" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {camps.map((p: any) => (
                                <Card key={p.id} className="bg-card hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="secondary" className="mb-2">{p.age_group} {t('Years', 'سنة')}</Badge>
                                                <CardTitle className="text-xl">{isRTL ? (p.title_ar || p.title) : p.title}</CardTitle>
                                                <CardDescription>{p.organizer || p.category}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-gray-500 gap-4 mb-4">
                                            <span className="flex items-center"><Calendar className="h-4 w-4 me-1" /> {p.duration}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 flex items-center"><ExternalLink className="h-3 w-3 me-1" /> {p.location}</p>
                                        <Button variant="outline" className="w-full">{t('View Details', 'عرض التفاصيل')}</Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {camps.length === 0 && !loading && (
                                <p className="text-center text-gray-500 col-span-2 py-8">{t('No knowledge camps available.', 'لا توجد معسكرات معرفية متاحة.')}</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="university" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {gradPrograms.map((p: any) => (
                                <Card key={p.id} className="bg-card hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="outline" className="mb-2">{p.program_type || p.type_label}</Badge>
                                                <CardTitle className="text-xl">{isRTL ? (p.title_ar || p.title) : p.title}</CardTitle>
                                                <CardDescription>{isRTL ? (p.university_ar || p.university) : p.university}</CardDescription>
                                            </div>
                                            {p.featured && <Badge className="bg-amber-100 text-amber-800">★</Badge>}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-gray-500 gap-4 mb-4">
                                            <span className="flex items-center"><Calendar className="h-4 w-4 me-1" /> {isRTL ? (p.duration_ar || p.duration) : p.duration}</span>
                                            <span className="flex items-center"><Award className="h-4 w-4 me-1" /> {isRTL ? (p.tuition_ar || p.tuition) : p.tuition}</span>
                                        </div>
                                        <Button className="w-full">{t('View Program', 'عرض البرنامج')}</Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {gradPrograms.length === 0 && !loading && (
                                <p className="text-center text-gray-500 col-span-2 py-8">{t('No university programs available yet.', 'لا توجد برامج جامعية متاحة حالياً.')}</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div >
    );
};

export default StudentDashboard;
