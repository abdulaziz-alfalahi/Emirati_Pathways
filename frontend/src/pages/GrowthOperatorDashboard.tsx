import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { restClient } from '@/utils/api';
import { 
  GrowthOperatorDomain, 
  GROWTH_OPERATOR_DOMAINS,
  isGrowthOperatorRole,
  getGrowthOperatorDomain
} from '@/types/auth';
import {
  Users,
  Building,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
  MessageCircle,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Import domain-specific components
import CandidateOperations from '@/components/growth-operator/CandidateOperations';
import CompanyOperations from '@/components/growth-operator/CompanyOperations';
import EducationOperations from '@/components/growth-operator/EducationOperations';
import AssessmentOperations from '@/components/growth-operator/AssessmentOperations';
import MentorshipOperations from '@/components/growth-operator/MentorshipOperations';
import CommunityOperations from '@/components/growth-operator/CommunityOperations';

interface DomainStats {
  total: number;
  active: number;
  pending: number;
  growth: number;
  lastUpdated: string;
}

interface GrowthMetrics {
  candidate: DomainStats;
  company: DomainStats;
  education: DomainStats;
  assessment: DomainStats;
  mentorship: DomainStats;
  community: DomainStats;
}

const GrowthOperatorDashboard: React.FC = () => {
  const { t } = useTranslation('growth-operator');
  const navigate = useNavigate();
  const { domain } = useParams<{ domain?: string }>();
  
  const [activeTab, setActiveTab] = useState<GrowthOperatorDomain | 'overview'>(
    (domain as GrowthOperatorDomain) || 'overview'
  );
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDomains, setUserDomains] = useState<GrowthOperatorDomain[]>([]);

  useEffect(() => {
    // Get user's assigned domains from auth context or localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.growth_operator_domains) {
        setUserDomains(user.growth_operator_domains);
      } else if (user.role && isGrowthOperatorRole(user.role)) {
        const domain = getGrowthOperatorDomain(user.role);
        if (domain) {
          setUserDomains([domain]);
        } else {
          // Full growth operator - access to all domains
          setUserDomains(['candidate', 'company', 'education', 'assessment', 'mentorship', 'community']);
        }
      }
    }
    
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (domain && Object.keys(GROWTH_OPERATOR_DOMAINS).includes(domain)) {
      setActiveTab(domain as GrowthOperatorDomain);
    }
  }, [domain]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await restClient.get('/api/growth-operator/metrics');
      if (response.data?.data) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const getDomainIcon = (domain: GrowthOperatorDomain) => {
    const icons = {
      candidate: Users,
      company: Building,
      education: GraduationCap,
      assessment: ClipboardCheck,
      mentorship: UserCheck,
      community: MessageCircle
    };
    const Icon = icons[domain];
    return <Icon className="h-5 w-5" />;
  };

  const getDomainColor = (domain: GrowthOperatorDomain) => {
    const colors = {
      candidate: 'bg-blue-100 text-blue-700 border-blue-200',
      company: 'bg-green-100 text-green-700 border-green-200',
      education: 'bg-purple-100 text-purple-700 border-purple-200',
      assessment: 'bg-orange-100 text-orange-700 border-orange-200',
      mentorship: 'bg-teal-100 text-teal-700 border-teal-200',
      community: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[domain];
  };

  const renderDomainContent = (domain: GrowthOperatorDomain) => {
    const components = {
      candidate: CandidateOperations,
      company: CompanyOperations,
      education: EducationOperations,
      assessment: AssessmentOperations,
      mentorship: MentorshipOperations,
      community: CommunityOperations
    };
    const Component = components[domain];
    return <Component />;
  };

  const hasAccessToDomain = (domain: GrowthOperatorDomain) => {
    return userDomains.length === 0 || userDomains.includes(domain);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HybridGovernmentNavFixed />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Growth Operations Dashboard</h1>
              <p className="text-slate-600 mt-1">
                Manage platform growth across all domains
              </p>
            </div>
            <Button onClick={fetchMetrics} variant="outline" className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {/* Domain badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {userDomains.map(domain => (
              <Badge key={domain} className={getDomainColor(domain)}>
                {getDomainIcon(domain)}
                <span className="ml-1">{GROWTH_OPERATOR_DOMAINS[domain].label}</span>
              </Badge>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GrowthOperatorDomain | 'overview')}>
          <TabsList className="grid w-full grid-cols-7 bg-white shadow-sm mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            {Object.keys(GROWTH_OPERATOR_DOMAINS).map((domain) => (
              <TabsTrigger 
                key={domain} 
                value={domain}
                disabled={!hasAccessToDomain(domain as GrowthOperatorDomain)}
                className="flex items-center gap-2"
              >
                {getDomainIcon(domain as GrowthOperatorDomain)}
                <span className="hidden lg:inline">
                  {GROWTH_OPERATOR_DOMAINS[domain as GrowthOperatorDomain].label.split(' ')[0]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(GROWTH_OPERATOR_DOMAINS).map(([domain, config]) => {
                const stats = metrics?.[domain as GrowthOperatorDomain];
                const isAccessible = hasAccessToDomain(domain as GrowthOperatorDomain);
                
                return (
                  <Card 
                    key={domain} 
                    className={`${isAccessible ? 'hover:shadow-md cursor-pointer' : 'opacity-50'} transition-shadow`}
                    onClick={() => isAccessible && setActiveTab(domain as GrowthOperatorDomain)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getDomainColor(domain as GrowthOperatorDomain)}`}>
                          {getDomainIcon(domain as GrowthOperatorDomain)}
                        </div>
                        <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                      </div>
                      {stats?.growth !== undefined && (
                        <div className={`flex items-center text-sm ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {Math.abs(stats.growth)}%
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.total || 0}</div>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {stats?.active || 0} Active
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-yellow-500" />
                          {stats?.pending || 0} Pending
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest actions across all domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Activity feed will be populated from API
                </div>
              </CardContent>
            </Card>

            {/* Growth Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Growth Targets
                </CardTitle>
                <CardDescription>Track progress towards monthly goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Growth targets will be configured by Administrator
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain-specific tabs */}
          {Object.keys(GROWTH_OPERATOR_DOMAINS).map((domain) => (
            <TabsContent key={domain} value={domain} className="space-y-6">
              {hasAccessToDomain(domain as GrowthOperatorDomain) ? (
                renderDomainContent(domain as GrowthOperatorDomain)
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold">Access Restricted</h3>
                    <p className="text-gray-500">You don't have access to this domain. Contact your administrator.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default GrowthOperatorDashboard;
