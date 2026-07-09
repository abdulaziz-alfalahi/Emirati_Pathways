
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Filter, Users, TrendingUp, Target } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PlatformOverviewTab } from './bi/PlatformOverviewTab';
import { OutcomeTrackingTab } from './bi/OutcomeTrackingTab';
import { PredictiveAnalyticsTab } from './bi/PredictiveAnalyticsTab';
import { StakeholderReportsTab } from './bi/StakeholderReportsTab';

interface BusinessIntelligenceDashboardProps {
  timeRange?: string;
  selectedPhases?: string[];
}

export const BusinessIntelligenceDashboard: React.FC<BusinessIntelligenceDashboardProps> = ({
  timeRange = 'last_30_days',
  selectedPhases = ['education', 'career_development', 'employment', 'retirement']
}) => {
  const { roles } = useAuth();
  const [activeTimeRange, setActiveTimeRange] = useState(timeRange);
  const [selectedStakeholder, setSelectedStakeholder] = useState('compliance_auditor');
  const [activeTab, setActiveTab] = useState('overview');

  const hasAdminAccess = roles.some(role => 
    ['admin', 'super_user', 'platform_operator', 'government_representative'].includes(role)
  );

  if (!hasAdminAccess) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Business Intelligence Dashboard access requires administrator privileges.
          </p>
        </CardContent>
      </Card>
    );
  }

  const exportData = () => {
    // Mock export functionality
    console.log('Exporting BI data for:', { activeTimeRange, selectedStakeholder, selectedPhases });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Business Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for platform performance and policy effectiveness
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Multi-Stakeholder
          </Badge>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Dashboard Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={activeTimeRange} onValueChange={setActiveTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_quarter">Last Quarter</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStakeholder} onValueChange={setSelectedStakeholder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Stakeholder View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='compliance_auditor'>Government Officials</SelectItem>
                <SelectItem value="education">Educational Institutions</SelectItem>
                <SelectItem value="employers">Employers</SelectItem>
                <SelectItem value="communities">Community Organizations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Platform Overview
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Outcome Tracking
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictive Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Stakeholder Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PlatformOverviewTab 
            timeRange={activeTimeRange}
            stakeholderView={selectedStakeholder}
            selectedPhases={selectedPhases}
          />
        </TabsContent>

        <TabsContent value="outcomes">
          <OutcomeTrackingTab 
            timeRange={activeTimeRange}
            stakeholderView={selectedStakeholder}
          />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalyticsTab 
            timeRange={activeTimeRange}
            selectedPhases={selectedPhases}
          />
        </TabsContent>

        <TabsContent value="reports">
          <StakeholderReportsTab 
            stakeholderView={selectedStakeholder}
            timeRange={activeTimeRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
