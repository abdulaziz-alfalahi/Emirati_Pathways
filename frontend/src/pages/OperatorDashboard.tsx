import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GrowthTools from '@/components/admin/GrowthTools';
import { GrowthOperations } from '@/components/admin/GrowthOperations';
import AdminRoleRequests from '@/components/admin/AdminRoleRequests';
import { LogOut, Rocket, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OperatorDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    // Determine active operator roles
    const operatorType = React.useMemo(() => {
        const roles = [user?.role, ...(user?.roles || []), ...(user?.secondary_roles || [])].filter(Boolean);
        return {
            isCompanyOps: roles.some(r => r === 'growth_operator_company'),
            isCandidateOps: roles.some(r => r === 'growth_operator_candidate'),
            isMonitoringOps: roles.some(r => r === 'growth_operator_monitoring'),
            isLegacyOps: roles.some(r => r === 'growth_operator')
        };
    }, [user]);

    // Determine default tab based on roles
    const defaultTab = React.useMemo(() => {
        if (operatorType.isCompanyOps) return 'company-onboarding';
        if (operatorType.isCandidateOps) return 'candidate-onboarding';
        if (operatorType.isMonitoringOps) return 'monitoring';
        return 'ops';
    }, [operatorType]);

    return (
        <div className="min-h-screen bg-background">
            {/* Operator Header */}
            <header className="bg-card border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-600 p-2 rounded-lg">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-800">Emirati Pathway</h1>
                            <p className="text-xs text-teal-600 font-medium tracking-wide">OPERATIONS CONSOLE</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                            <LogOut className="h-5 w-5 text-slate-400 hover:text-red-500" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Growth Operations</h2>
                    <p className="text-slate-500">
                        {operatorType.isCompanyOps && "Manage company onboarding and verification."}
                        {operatorType.isCandidateOps && "Manage candidate onboarding and support."}
                        {operatorType.isMonitoringOps && "Monitor platform activity and metrics."}
                        {!operatorType.isCompanyOps && !operatorType.isCandidateOps && !operatorType.isMonitoringOps && "Manage platform growth operations."}
                    </p>
                </div>

                <Tabs defaultValue={defaultTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
                        {(operatorType.isLegacyOps || (!operatorType.isCompanyOps && !operatorType.isCandidateOps && !operatorType.isMonitoringOps)) && (
                            <TabsTrigger value="ops">Campaigns</TabsTrigger>
                        )}

                        {/* Company Ops View */}
                        {(operatorType.isCompanyOps || operatorType.isLegacyOps) && (
                            <TabsTrigger value="company-onboarding">Company Onboarding</TabsTrigger>
                        )}

                        {/* Candidate Ops View */}
                        {(operatorType.isCandidateOps || operatorType.isLegacyOps) && (
                            <TabsTrigger value="candidate-onboarding">Candidate Onboarding</TabsTrigger>
                        )}

                        {/* Monitoring Ops View */}
                        {(operatorType.isMonitoringOps || operatorType.isLegacyOps) && (
                            <TabsTrigger value="monitoring">Monitoring Center</TabsTrigger>
                        )}
                    </TabsList>

                    {/* Legacy / General Ops Content */}
                    <TabsContent value="ops" className="space-y-4">
                        <GrowthOperations />
                    </TabsContent>

                    {/* Company Onboarding Content */}
                    <TabsContent value="company-onboarding" className="space-y-4">
                        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Private Sector Companies Onboarding</h3>
                                <Button>Invite Company</Button>
                            </div>
                            <GrowthTools /> {/* Reusing GrowthTools for data imports/management as placeholder */}
                        </div>
                    </TabsContent>

                    {/* Candidate Onboarding Content */}
                    <TabsContent value="candidate-onboarding" className="space-y-4">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Candidate Onboarding Queue</h3>
                            <AdminRoleRequests />
                        </div>
                    </TabsContent>

                    {/* Monitoring Center Content */}
                    <TabsContent value="monitoring" className="space-y-4">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Monitoring Center</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 bg-muted rounded border border-border">
                                    <p className="text-sm text-slate-500">Active Sessions</p>
                                    <p className="text-3xl font-bold text-slate-900">1,248</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-sm text-slate-500">System Health</p>
                                    <p className="text-3xl font-bold text-green-600">99.9%</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-sm text-slate-500">Pending Alerts</p>
                                    <p className="text-3xl font-bold text-amber-500">3</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default OperatorDashboard;
