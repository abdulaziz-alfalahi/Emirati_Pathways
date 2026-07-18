import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSecurity } from '@/hooks/useSecurity';
import { useAuth } from '@/context/AuthContext';
import { 
  Shield, 
  ShieldAlert, 
  Activity, 
  Eye, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Lock
} from 'lucide-react';

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { 
    securityMetrics, 
    securityEvents, 
    isMonitoring, 
    canAccessSecurityData,
    performSecurityAudit 
  } = useSecurity();
  
  const { user, roles } = useAuth();
  const { toast } = useToast();

  // Auto-refresh security data
  useEffect(() => {
    if (!autoRefresh || !canAccessSecurityData) return;
    
    const interval = setInterval(() => {
      performSecurityAudit();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, canAccessSecurityData, performSecurityAudit]);

  if (!canAccessSecurityData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Security dashboard access requires administrator privileges.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(timestamp);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time security monitoring and threat detection
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 me-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={performSecurityAudit}
            disabled={isMonitoring}
          >
            <Eye className="h-4 w-4 me-2" />
            {isMonitoring ? 'Scanning...' : 'Run Audit'}
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.securityScore)}`}>
                  {securityMetrics.securityScore}%
                </p>
              </div>
              <Shield className={`h-8 w-8 ${getSecurityScoreColor(securityMetrics.securityScore)}`} />
            </div>
            <Progress 
              value={securityMetrics.securityScore} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rate Limit Violations</p>
                <p className="text-2xl font-bold text-orange-600">
                  {securityMetrics.rateLimitViolations}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspicious Activity</p>
                <p className="text-2xl font-bold text-red-600">
                  {securityMetrics.suspiciousActivity}
                </p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Check</p>
                <p className="text-sm font-bold">
                  {formatTimestamp(securityMetrics.lastSecurityCheck)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {securityEvents.some(event => event.severity === 'critical' || event.severity === 'high') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Alerts Detected!</strong> 
            {' '}Review the security events below and take immediate action.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Security Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Security Health</span>
                    <Badge variant={getSecurityScoreVariant(securityMetrics.securityScore)}>
                      {securityMetrics.securityScore >= 90 ? 'Excellent' : 
                       securityMetrics.securityScore >= 70 ? 'Good' : 'Needs Attention'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rate Limiting Status</span>
                    <Badge variant={securityMetrics.rateLimitViolations === 0 ? 'default' : 'destructive'}>
                      {securityMetrics.rateLimitViolations === 0 ? 'Normal' : 'Violations Detected'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Threat Detection</span>
                    <Badge variant={securityMetrics.suspiciousActivity === 0 ? 'default' : 'destructive'}>
                      {securityMetrics.suspiciousActivity === 0 ? 'Clean' : 'Threats Detected'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">HTTPS Enforcement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Content Security Policy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Rate Limiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Input Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Audit Logging</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Security Events
              </CardTitle>
              <CardDescription>
                Latest security events and threats detected in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Security Events</h3>
                  <p className="text-muted-foreground">
                    No security threats or incidents have been detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityEvents.slice(0, 10).map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      {getSeverityIcon(event.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {event.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {event.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(event.timestamp)}
                          {event.clientIP && ` • IP: ${event.clientIP}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Threat Analysis
              </CardTitle>
              <CardDescription>
                Analysis of potential security threats and attack patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Threat Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced threat detection and analysis features coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Current security settings and configuration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Rate Limiting</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Authentication: 5 attempts per 15 minutes</p>
                      <p>• API Requests: 100 requests per minute</p>
                      <p>• Sensitive Operations: 5 per minute</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Security Headers</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Content Security Policy: Enabled</p>
                      <p>• HSTS: Enabled (1 year)</p>
                      <p>• XSS Protection: Enabled</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
