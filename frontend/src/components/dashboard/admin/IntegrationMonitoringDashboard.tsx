
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  Database,
  Shield,
  Zap
} from 'lucide-react';
import { integrationLogger } from '@/services/credentialVerification/utils/logger';
import { VerificationMetricsChart } from './VerificationMetricsChart';
import { SystemHealthIndicators } from './SystemHealthIndicators';
import { FailurePatternAnalysis } from './FailurePatternAnalysis';
import { RecentActivityFeed } from './RecentActivityFeed';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'error';
  icon: React.ComponentType<any>;
}

export const IntegrationMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardMetrics();
    const interval = setInterval(loadDashboardMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Get logs summary from integration logger
      const logSummary = integrationLogger.getLogSummary();
      
      // Calculate metrics from logs
      const recentLogs = integrationLogger.getRecentLogs(1000);
      const last24Hours = recentLogs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      const successfulVerifications = last24Hours.filter(log => 
        log.level === 'info' && log.message.includes('verification completed successfully')
      );
      
      const failedVerifications = last24Hours.filter(log => 
        log.level === 'error' && log.operation.includes('verification')
      );
      
      const totalVerifications = successfulVerifications.length + failedVerifications.length;
      const successRate = totalVerifications > 0 ? (successfulVerifications.length / totalVerifications) * 100 : 0;
      
      // Calculate average response time
      const verificationLogs = last24Hours.filter(log => log.duration);
      const avgResponseTime = verificationLogs.length > 0 
        ? verificationLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / verificationLogs.length
        : 0;

      const calculatedMetrics = {
        summary: logSummary,
        successRate: successRate.toFixed(1),
        totalVerifications,
        failedVerifications: failedVerifications.length,
        avgResponseTime: Math.round(avgResponseTime),
        activeServices: [...new Set(recentLogs.map(log => log.service))].length,
        last24Hours
      };

      setMetrics(calculatedMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 85) return 'warning';
    return 'error';
  };

  const metricCards: MetricCard[] = metrics ? [
    {
      title: 'Success Rate (24h)',
      value: `${metrics.successRate}%`,
      change: '+2.3%',
      trend: 'up',
      status: getStatusColor(parseFloat(metrics.successRate)),
      icon: CheckCircle
    },
    {
      title: 'Total Verifications',
      value: metrics.totalVerifications,
      change: '+15%',
      trend: 'up',
      icon: Database
    },
    {
      title: 'Failed Verifications',
      value: metrics.failedVerifications,
      change: '-8%',
      trend: 'down',
      status: metrics.failedVerifications > 10 ? 'warning' : 'success',
      icon: AlertTriangle
    },
    {
      title: 'Avg Response Time',
      value: `${metrics.avgResponseTime}ms`,
      change: '-5%',
      trend: 'down',
      status: metrics.avgResponseTime > 5000 ? 'warning' : 'success',
      icon: Clock
    },
    {
      title: 'Active Services',
      value: metrics.activeServices,
      status: 'success',
      icon: Zap
    },
    {
      title: 'System Health',
      value: metrics.failedVerifications < 5 ? 'Healthy' : 'Degraded',
      status: metrics.failedVerifications < 5 ? 'success' : 'warning',
      icon: Shield
    }
  ] : [];

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading monitoring dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of credential verification integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            onClick={loadDashboardMetrics} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 me-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert for system issues */}
      {metrics && metrics.failedVerifications > 10 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Failure Rate Detected</AlertTitle>
          <AlertDescription>
            {metrics.failedVerifications} verification failures in the last 24 hours. 
            Please review the failure patterns below.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {metric.status && (
                    <Badge 
                      variant={metric.status === 'success' ? 'default' : 
                              metric.status === 'warning' ? 'secondary' : 'destructive'}
                    >
                      {metric.status}
                    </Badge>
                  )}
                </div>
                {metric.change && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span>{metric.change} from last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 me-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="health">
            <Shield className="h-4 w-4 me-2" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="failures">
            <AlertTriangle className="h-4 w-4 me-2" />
            Failure Analysis
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 me-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <VerificationMetricsChart data={metrics?.last24Hours || []} />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <SystemHealthIndicators metrics={metrics} />
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <FailurePatternAnalysis 
            failureLogs={metrics?.summary.recentErrors || []} 
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <RecentActivityFeed logs={metrics?.last24Hours || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
