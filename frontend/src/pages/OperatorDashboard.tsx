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

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Operator Header */}
            <header className="bg-white border-b sticky top-0 z-10">
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
                    <p className="text-slate-500">Manage vacancy imports, verification campaigns, and company onboarding.</p>
                </div>

                <Tabs defaultValue="ops" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                        <TabsTrigger value="ops">Campaigns (Growth Ops)</TabsTrigger>
                        <TabsTrigger value="tools">Data Import (Tools)</TabsTrigger>
                        <TabsTrigger value="requests" className="flex gap-2">
                            <UserPlus className="h-4 w-4" />
                            Requests
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ops" className="space-y-4">
                        <GrowthOperations />
                    </TabsContent>

                    <TabsContent value="tools" className="space-y-4">
                        <GrowthTools />
                    </TabsContent>

                    <TabsContent value="requests" className="space-y-4">
                        <AdminRoleRequests />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default OperatorDashboard;
