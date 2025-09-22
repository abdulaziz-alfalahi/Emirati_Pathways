
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from '@/components/dashboard/Overview';
import AIRecommendations from '@/components/dashboard/AIRecommendations';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { SettingsDashboard } from '@/components/dashboard/SettingsDashboard';
import { useAuth } from '@/context/AuthContext';
import PersonalizedDashboard from '@/components/personalization/PersonalizedDashboard';
import { PersonalizationProvider } from '@/context/PersonalizationContext';

interface DashboardContainerProps {
  user: any;
  roles: string[];
  activeTab: string;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ user, roles, activeTab: initialActiveTab }) => {
  const [activeRole, setActiveRole] = useState(roles[0]);
  const [activeTab, setActiveTab] = useState(initialActiveTab);

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveRole(event.target.value);
  };

  return (
    <PersonalizationProvider>
      <div className="min-h-screen bg-background">
        <header className="py-4 bg-secondary border-b">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-semibold">
              Welcome to Your Dashboard
            </h1>
          </div>
        </header>
        
        <nav className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div>
              <select
                value={activeRole}
                onChange={handleRoleChange}
                className="p-2 border rounded"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              {/* Add any additional navigation or user info here */}
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="personalized">AI Personalized</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Overview activeRole={activeRole} />
            </TabsContent>

            <TabsContent value="personalized">
              <PersonalizedDashboard />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsDashboard />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PersonalizationProvider>
  );
};

export default DashboardContainer;
