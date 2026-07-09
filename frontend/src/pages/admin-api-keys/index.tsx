import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { toast as sonnerToast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Key, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Zap,
  Brain,
  Camera,
  Mic,
  FileText,
  Globe,
  Lock,
  Users,
  Clock,
  TrendingUp,
  Star,
  AlertCircle
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'active' | 'inactive' | 'testing' | 'error';
  is_default: boolean;
  config: Record<string, any>;
  health_metrics?: {
    health_score: number;
    response_time: number;
    error_rate: number;
    last_checked: string;
    status: string;
  };
  available_models?: string[];
  default_model?: string;
  config_schema?: Record<string, any>;
  endpoint?: string;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  provider_id: string;
  details: string;
  status: 'success' | 'error';
  ip_address?: string;
}

interface Statistics {
  overview: {
    total_providers: number;
    active_providers: number;
    configured_providers: number;
    configuration_rate: number;
    average_health_score: number;
  };
  categories: Record<string, {
    total: number;
    active: number;
    default: string | null;
  }>;
  recent_activity: AuditLog[];
  health_summary: {
    healthy_providers: number;
    degraded_providers: number;
    unhealthy_providers: number;
  };
}

const ADMIN_API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/admin';

const AdminApiKeysPage: React.FC = () => {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [backendConnected, setBackendConnected] = useState(false);

  // Check admin access
  const isAdmin = roles.includes('platform_administrator') || roles.includes('super_user') || 
                  (user?.email && (user.email.includes('admin') || user.email.includes('super')));

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!isLoading && !isAdmin) {
      sonnerToast.error('Access Denied', {
        description: 'You need administrator privileges to access this page.'
      });
      navigate('/dashboard');
      return;
    }

    if (user && isAdmin) {
      checkBackendConnection();
    }
  }, [user, isLoading, isAdmin, navigate]);

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-User-Email': user?.email || 'admin@emiratijourney.ae',
      'X-User-Roles': roles.join(',') || 'platform_administrator'
    };
  };

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/health`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setBackendConnected(true);
        await Promise.all([
          loadProviders(),
          loadAuditLogs(),
          loadStatistics()
        ]);
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendConnected(false);
      sonnerToast.error('Backend Connection Failed', {
        description: 'Admin API server is not running. Please start the admin backend service.'
      });
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/providers`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      sonnerToast.error('Failed to load providers');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/audit-logs?limit=20`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/statistics`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleProviderUpdate = async (providerId: string, config: Record<string, any>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/providers/${providerId}/config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ config })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        sonnerToast.success('Provider updated successfully');
        await loadProviders();
        await loadAuditLogs();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      sonnerToast.error('Failed to update provider', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderSwitch = async (providerId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/providers/${providerId}/set-default`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        sonnerToast.success(data.message);
        await loadProviders();
        await loadAuditLogs();
        await loadStatistics();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error switching provider:', error);
      sonnerToast.error('Failed to switch provider', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setIsTesting(providerId);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/providers/${providerId}/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        sonnerToast.success('Provider test successful', {
          description: `Response time: ${data.test_results.health_metrics.response_time}ms`
        });
        await loadProviders();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error testing provider:', error);
      sonnerToast.error('Provider test failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(null);
    }
  };

  const getStatusIcon = (status: Provider['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'testing':
        return <TestTube className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Provider['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      testing: 'outline',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'llm':
        return <Brain className="h-4 w-4" />;
      case 'computer vision':
        return <Camera className="h-4 w-4" />;
      case 'speech processing':
        return <Mic className="h-4 w-4" />;
      case 'nlp':
        return <FileText className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading || isPageLoading) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <p>Loading admin panel...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-10 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin API Keys Management</h1>
              <p className="text-muted-foreground">
                Manage AI service providers and switch between different models for testing and evaluation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin Access
            </Badge>
            {backendConnected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Backend Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Backend Offline
              </Badge>
            )}
          </div>
        </div>

        {/* Backend Connection Warning */}
        {!backendConnected && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Backend Service Offline:</strong> The admin API server is not running. 
              Please start the admin backend service on port 5002 to manage providers.
              <div className="mt-2">
                <code className="bg-red-100 px-2 py-1 rounded text-sm">
                  python admin_api_endpoints.py
                </code>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Warning */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Administrator Notice:</strong> Changes made here affect the entire platform. 
            Always test configurations before switching providers in production.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {statistics && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
                          <p className="text-2xl font-bold">{statistics.overview.total_providers}</p>
                        </div>
                        <Globe className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Providers</p>
                          <p className="text-2xl font-bold text-green-600">
                            {statistics.overview.active_providers}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Health Score</p>
                          <p className="text-2xl font-bold">
                            {Math.round(statistics.overview.average_health_score)}%
                          </p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Configuration Rate</p>
                          <p className="text-2xl font-bold">
                            {Math.round(statistics.overview.configuration_rate)}%
                          </p>
                        </div>
                        <Settings className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Provider Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(statistics.categories).map(([category, data]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          {category} Providers
                        </CardTitle>
                        <CardDescription>
                          {data.total} provider(s) configured, {data.active} active
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Default Provider:</span>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {data.default || 'None set'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium">{data.total}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Active</p>
                              <p className="font-medium text-green-600">{data.active}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {providers.map(provider => (
                <Card key={provider.id} className={`relative ${provider.is_default ? 'ring-2 ring-primary' : ''}`}>
                  {provider.is_default && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Default
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(provider.category)}
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                      </div>
                      {getStatusIcon(provider.status)}
                    </div>
                    <CardDescription>{provider.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Health Metrics */}
                    {provider.health_metrics && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Health Score</p>
                          <p className="font-medium text-green-600">{provider.health_metrics.health_score}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Response Time</p>
                          <p className="font-medium">{provider.health_metrics.response_time}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Error Rate</p>
                          <p className="font-medium text-red-600">{provider.health_metrics.error_rate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Checked</p>
                          <p className="font-medium">{formatTimestamp(provider.health_metrics.last_checked)}</p>
                        </div>
                      </div>
                    )}

                    {/* API Key */}
                    <div className="space-y-2">
                      <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`api-key-${provider.id}`}
                          type={showApiKeys[provider.id] ? 'text' : 'password'}
                          value={provider.config.api_key || ''}
                          onChange={(e) => {
                            const updatedProvider = {
                              ...provider,
                              config: { ...provider.config, api_key: e.target.value }
                            };
                            setProviders(prev => prev.map(p => p.id === provider.id ? updatedProvider : p));
                          }}
                          placeholder="Enter API key"
                          className="font-mono text-sm"
                          disabled={!backendConnected}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleApiKeyVisibility(provider.id)}
                        >
                          {showApiKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Model Selection */}
                    {provider.available_models && provider.available_models.length > 0 && (
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                          value={provider.config.model || provider.default_model}
                          onValueChange={(value) => {
                            const updatedProvider = {
                              ...provider,
                              config: { ...provider.config, model: value }
                            };
                            setProviders(prev => prev.map(p => p.id === provider.id ? updatedProvider : p));
                          }}
                          disabled={!backendConnected}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {provider.available_models.map(model => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={isTesting === provider.id || !provider.config.api_key || !backendConnected}
                        className="flex-1"
                      >
                        {isTesting === provider.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleProviderUpdate(provider.id, provider.config)}
                        disabled={isSaving || !provider.config.api_key || !backendConnected}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>

                    {/* Set as Default */}
                    {!provider.is_default && provider.config.api_key && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleProviderSwitch(provider.id)}
                        disabled={isSaving || !backendConnected}
                        className="w-full"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Set as Default {provider.category} Provider
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Provider Health Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providers.map(provider => (
                      <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(provider.category)}
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {provider.health_metrics ? 
                                `Last checked: ${formatTimestamp(provider.health_metrics.last_checked)}` :
                                'No health data'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            {provider.health_metrics?.health_score || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {provider.health_metrics?.response_time || 0}ms
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statistics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {statistics.health_summary.healthy_providers}
                          </p>
                          <p className="text-sm text-muted-foreground">Healthy Providers</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">
                            {statistics.health_summary.degraded_providers}
                          </p>
                          <p className="text-sm text-muted-foreground">Degraded Providers</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-red-600">
                            {statistics.health_summary.unhealthy_providers}
                          </p>
                          <p className="text-sm text-muted-foreground">Unhealthy Providers</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {Math.round(statistics.overview.average_health_score)}%
                          </p>
                          <p className="text-sm text-muted-foreground">Avg Health Score</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Track all administrative actions and provider changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.length > 0 ? (
                    auditLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="mt-1">
                          {log.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Provider: {providers.find(p => p.id === log.provider_id)?.name || log.provider_id}
                          </p>
                          <p className="text-sm mt-2">{log.details}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {log.user}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit logs available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminApiKeysPage;


