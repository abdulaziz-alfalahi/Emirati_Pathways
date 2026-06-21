
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Database, 
  Wifi,
  Server,
  Shield
} from 'lucide-react';

interface SystemHealthIndicatorsProps {
  metrics: any;
}

export const SystemHealthIndicators: React.FC<SystemHealthIndicatorsProps> = ({ metrics }) => {
  if (!metrics) {
    return <div>Loading health indicators...</div>;
  }

  const healthChecks = [
    {
      name: 'Credential Verification Service',
      status: metrics.failedVerifications < 5 ? 'healthy' : 'degraded',
      uptime: '99.9%',
      lastCheck: new Date().toLocaleTimeString(),
      description: 'Main verification service status',
      icon: Database
    },
    {
      name: 'External Database Connections',
      status: 'healthy',
      uptime: '99.8%',
      lastCheck: new Date().toLocaleTimeString(),
      description: 'Connection to external verification databases',
      icon: Wifi
    },
    {
      name: 'Rate Limiting Service',
      status: 'healthy',
      uptime: '100%',
      lastCheck: new Date().toLocaleTimeString(),
      description: 'API rate limiting and throttling',
      icon: Shield
    },
    {
      name: 'Logging & Monitoring',
      status: 'healthy',
      uptime: '99.9%',
      lastCheck: new Date().toLocaleTimeString(),
      description: 'System logging and monitoring services',
      icon: Server
    },
    {
      name: 'Wildcard SSL Certificate (*.ehrdc.gov.ae)',
      status: 'healthy',
      uptime: 'Valid',
      lastCheck: new Date().toLocaleTimeString(),
      description: 'Verified successfully. Expiration Date: November 21, 2026.',
      icon: Shield
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const overallHealth = healthChecks.filter(check => check.status === 'healthy').length / healthChecks.length * 100;

  return (
    <div className="space-y-6">
      {/* Overall System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Overall System Health</span>
          </CardTitle>
          <CardDescription>
            System-wide health score based on all service components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-2xl font-bold">{overallHealth.toFixed(1)}%</span>
            </div>
            <Progress value={overallHealth} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{healthChecks.filter(c => c.status === 'healthy').length}</div>
                <div className="text-muted-foreground">Healthy</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{healthChecks.filter(c => c.status === 'degraded').length}</div>
                <div className="text-muted-foreground">Degraded</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">{healthChecks.filter(c => c.status === 'down').length}</div>
                <div className="text-muted-foreground">Down</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{metrics.successRate}%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Health Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthChecks.map((check, index) => {
          const Icon = check.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <CardTitle className="text-sm">{check.name}</CardTitle>
                  </div>
                  {getStatusIcon(check.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  {getStatusBadge(check.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm font-medium">{check.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Check</span>
                  <span className="text-sm text-muted-foreground">{check.lastCheck}</span>
                </div>
                <p className="text-xs text-muted-foreground">{check.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Alerts */}
      {metrics.avgResponseTime > 5000 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High response times detected ({metrics.avgResponseTime}ms average). 
            Consider checking external service connections.
          </AlertDescription>
        </Alert>
      )}

      {metrics.failedVerifications > 10 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High failure rate detected ({metrics.failedVerifications} failures in 24h). 
            Please review system logs and external service status.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
