
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, Bug, Clock, Database, Wifi } from 'lucide-react';
import { IntegrationLogEntry } from '@/services/credentialVerification/utils/logger/types';

interface FailurePatternAnalysisProps {
  failureLogs: IntegrationLogEntry[];
}

export const FailurePatternAnalysis: React.FC<FailurePatternAnalysisProps> = ({ failureLogs }) => {
  // Analyze failure patterns
  const analyzeFailurePatterns = () => {
    const serviceFailures = new Map();
    const operationFailures = new Map();
    const errorTypes = new Map();
    const timePatterns = new Map();

    failureLogs.forEach(log => {
      // Service failures
      const service = log.service || 'Unknown';
      serviceFailures.set(service, (serviceFailures.get(service) || 0) + 1);

      // Operation failures
      const operation = log.operation || 'Unknown';
      operationFailures.set(operation, (operationFailures.get(operation) || 0) + 1);

      // Error type analysis
      let errorType = 'Unknown';
      if (log.message.includes('rate limit')) {
        errorType = 'Rate Limit';
      } else if (log.message.includes('timeout')) {
        errorType = 'Timeout';
      } else if (log.message.includes('database')) {
        errorType = 'Database';
      } else if (log.message.includes('network') || log.message.includes('connection')) {
        errorType = 'Network';
      } else if (log.message.includes('validation')) {
        errorType = 'Validation';
      } else if (log.message.includes('authentication')) {
        errorType = 'Authentication';
      }
      errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);

      // Time patterns (hour of day)
      const hour = new Date(log.timestamp).getHours();
      timePatterns.set(hour, (timePatterns.get(hour) || 0) + 1);
    });

    return {
      serviceFailures: Array.from(serviceFailures.entries()).map(([name, value]) => ({ name, value })),
      operationFailures: Array.from(operationFailures.entries()).map(([name, value]) => ({ name, value })),
      errorTypes: Array.from(errorTypes.entries()).map(([name, value]) => ({ name, value })),
      timePatterns: Array.from(timePatterns.entries()).map(([hour, value]) => ({ hour: `${hour}:00`, value }))
    };
  };

  const patterns = analyzeFailurePatterns();

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

  const getErrorIcon = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'timeout':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const getRecommendation = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'rate limit':
        return 'Consider implementing exponential backoff or increasing rate limits.';
      case 'timeout':
        return 'Check network connectivity and increase timeout values if necessary.';
      case 'database':
        return 'Verify database connection and check for performance issues.';
      case 'network':
        return 'Investigate network connectivity and external service availability.';
      case 'validation':
        return 'Review input validation logic and data formats.';
      case 'authentication':
        return 'Check API keys and authentication credentials.';
      default:
        return 'Review error logs for more specific information.';
    }
  };

  if (failureLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            <span>No Failures Detected</span>
          </CardTitle>
          <CardDescription>
            Great news! No verification failures have been recorded recently.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Failure Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Failure Analysis Overview</CardTitle>
          <CardDescription>
            Analyzing {failureLogs.length} failed verification attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failureLogs.length}</div>
              <div className="text-sm text-muted-foreground">Total Failures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{patterns.serviceFailures.length}</div>
              <div className="text-sm text-muted-foreground">Affected Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{patterns.errorTypes.length}</div>
              <div className="text-sm text-muted-foreground">Error Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.max(...patterns.timePatterns.map(p => p.value))}
              </div>
              <div className="text-sm text-muted-foreground">Peak Hour Failures</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Error Types Distribution</CardTitle>
            <CardDescription>Breakdown of failure reasons</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={patterns.errorTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {patterns.errorTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Failures */}
        <Card>
          <CardHeader>
            <CardTitle>Failures by Service</CardTitle>
            <CardDescription>Which services are experiencing issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={patterns.serviceFailures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Failure Time Patterns</CardTitle>
          <CardDescription>When failures are most likely to occur</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={patterns.timePatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>Suggestions to address common failure patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patterns.errorTypes.slice(0, 5).map((errorType, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0">
                  {getErrorIcon(errorType.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{errorType.name}</span>
                    <Badge variant="outline">{errorType.value} occurrences</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getRecommendation(errorType.name)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
