import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GrowthTools from '@/components/admin/GrowthTools';
import { GrowthOperations } from '@/components/admin/GrowthOperations';
import AdminRoleRequests from '@/components/admin/AdminRoleRequests';
import Messages from '@/components/recruiter/Messages';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Rocket, UserPlus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OperatorDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    // Determine active operator roles
    const operatorType = React.useMemo(() => {
        // Note: talent_operator is NOT handled here — its canonical home is the
        // NAFIS Talent dashboard (/nafis-talent-dashboard). This generic
        // operator surface previously claimed a "Candidate Onboarding" tab for
        // it that actually rendered role requests, competing with the real
        // dashboard (C6 consolidation).
        const roles = [user?.role, ...(user?.roles || []), ...(user?.secondary_roles || [])].filter(Boolean);
        return {
            isCompanyOps: roles.some(r => r === 'employer_relations'),
            isMonitoringOps: roles.some(r => r === 'platform_operator'),
            isLegacyOps: roles.some(r => r === 'growth_operator')
        };
    }, [user]);

    // Determine default tab based on roles
    const defaultTab = React.useMemo(() => {
        if (operatorType.isCompanyOps) return 'company-onboarding';
        if (operatorType.isMonitoringOps) return 'monitoring';
        return 'ops';
    }, [operatorType]);

    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || defaultTab;

    return (
        <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />

            <main className="container mx-auto px-4 py-8" style={{ paddingTop: 100 }}>
                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('Growth Operations', 'عمليات النمو')}</h2>
                    <p className="text-slate-500">
                        {operatorType.isCompanyOps && t('Manage company onboarding and verification.', 'إدارة تسجيل الشركات والتحقق منها.')}
                        {operatorType.isMonitoringOps && t('Monitor platform activity and metrics.', 'مراقبة نشاط المنصة والمقاييس.')}
                        {!operatorType.isCompanyOps && !operatorType.isMonitoringOps && t('Manage platform growth operations.', 'إدارة عمليات نمو المنصة.')}
                    </p>
                </div>

                <Tabs defaultValue={initialTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 max-w-[900px]">
                        {(operatorType.isLegacyOps || (!operatorType.isCompanyOps && !operatorType.isMonitoringOps)) && (
                            <TabsTrigger value="ops">{t('Campaigns', 'الحملات')}</TabsTrigger>
                        )}

                        {/* Company Ops View */}
                        {(operatorType.isCompanyOps || operatorType.isLegacyOps) && (
                            <TabsTrigger value="company-onboarding">{t('Company Onboarding', 'تسجيل الشركات')}</TabsTrigger>
                        )}

                        {/* Role Requests (admin/legacy ops). This renders the role-request
                            approval queue — it is NOT NAFIS candidate onboarding, which
                            lives on the NAFIS Talent dashboard. */}
                        {operatorType.isLegacyOps && (
                            <TabsTrigger value="role-requests">{t('Role Requests', 'طلبات الأدوار')}</TabsTrigger>
                        )}

                        {/* Monitoring Ops View */}
                        {(operatorType.isMonitoringOps || operatorType.isLegacyOps) && (
                            <TabsTrigger value="monitoring">{t('Monitoring Center', 'مركز المراقبة')}</TabsTrigger>
                        )}

                        {/* Messages - always visible */}
                        <TabsTrigger value="messages">
                            <MessageSquare className="h-4 w-4 me-1" />
                            {t('Messages', 'الرسائل')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Legacy / General Ops Content */}
                    <TabsContent value="ops" className="space-y-4">
                        <GrowthOperations />
                    </TabsContent>

                    {/* Company Onboarding Content */}
                    <TabsContent value="company-onboarding" className="space-y-4">
                        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">{t('Private Sector Companies Onboarding', 'تسجيل شركات القطاع الخاص')}</h3>
                                <Button>{t('Invite Company', 'دعوة شركة')}</Button>
                            </div>
                            <GrowthTools /> {/* Reusing GrowthTools for data imports/management as placeholder */}
                        </div>
                    </TabsContent>

                    {/* Role Requests Content — the role-approval queue. */}
                    <TabsContent value="role-requests" className="space-y-4">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('Role Requests', 'طلبات الأدوار')}</h3>
                            <AdminRoleRequests />
                        </div>
                    </TabsContent>

                    {/* Monitoring Center Content */}
                    <TabsContent value="monitoring" className="space-y-4">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('Monitoring Center', 'مركز المراقبة')}</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                {t('Live platform metrics are on the Operations Center.', 'مقاييس المنصة المباشرة متوفرة في مركز العمليات.')}
                                {' '}
                                <a href="/operations-center" className="text-teal-600 underline">{t('Open Operations Center', 'فتح مركز العمليات')}</a>
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Placeholders — these were previously hardcoded fabricated
                                    figures. Real metrics live on the Operations Center (#26). */}
                                <div className="p-4 bg-muted rounded border border-border">
                                    <p className="text-sm text-slate-500">{t('Active Sessions', 'الجلسات النشطة')}</p>
                                    <p className="text-3xl font-bold text-slate-400">—</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-sm text-slate-500">{t('System Health', 'صحة النظام')}</p>
                                    <p className="text-3xl font-bold text-slate-400">—</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-sm text-slate-500">{t('Pending Alerts', 'التنبيهات المعلقة')}</p>
                                    <p className="text-3xl font-bold text-slate-400">—</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Messages Content */}
                    <TabsContent value="messages" className="space-y-4">
                        <Messages senderRole="growth_operator" />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default OperatorDashboard;
