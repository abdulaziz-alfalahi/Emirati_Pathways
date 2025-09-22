
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Search, 
  Filter,
  Clock,
  User,
  Database
} from 'lucide-react';
import { IntegrationLogEntry } from '@/services/credentialVerification/utils/logger/types';

interface RecentActivityFeedProps {
  logs: IntegrationLogEntry[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'debug':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      error: 'destructive',
      warn: 'secondary',
      info: 'default',
      debug: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return null;
    return `${duration}ms`;
  };

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesService = serviceFilter === 'all' || log.service === serviceFilter;
    
    return matchesSearch && matchesLevel && matchesService;
  });

  // Get unique services for filter
  const uniqueServices = [...new Set(logs.map(log => log.service))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {uniqueServices.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs match your current filters
              </div>
            ) : (
              filteredLogs.slice(0, 50).map((log, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-shrink-0 mt-1">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getLevelBadge(log.level)}
                      <Badge variant="outline">{log.service}</Badge>
                      <span className="text-sm text-muted-foreground">{log.operation}</span>
                    </div>
                    <p className="text-sm font-medium mb-1">{log.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      {log.userId && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{log.userId.slice(0, 8)}...</span>
                        </div>
                      )}
                      {log.requestId && (
                        <div className="flex items-center space-x-1">
                          <Database className="h-3 w-3" />
                          <span>{log.requestId.slice(0, 8)}...</span>
                        </div>
                      )}
                      {log.duration && (
                        <span className="font-medium">{formatDuration(log.duration)}</span>
                      )}
                    </div>
                    {log.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <strong>Error:</strong> {JSON.stringify(log.error, null, 2)}
                      </div>
                    )}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <strong>Metadata:</strong> {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
