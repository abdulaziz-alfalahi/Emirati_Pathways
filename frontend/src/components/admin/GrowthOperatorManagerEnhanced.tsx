/**
 * @fileoverview Enhanced Growth Operator Manager Component
 * 
 * This component provides administrators with comprehensive tools to manage
 * Growth Operators and their domain assignments with advanced features:
 * 
 * - **Drag-and-Drop Assignment**: Visually drag operators to domains
 * - **Workload Visualization**: See domain coverage and balance
 * - **Bulk Assignment**: Assign multiple operators at once
 * - **Activity Tracking**: Monitor operator activity per domain
 * - **Performance Metrics**: View KPIs for each domain
 * 
 * @module components/admin/GrowthOperatorManagerEnhanced
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
  MessageCircle,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  StarOff,
  Settings,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  Move,
  GripVertical,
  ArrowRight,
  UserPlus,
  Download,
  Upload,
  Eye,
  MoreVertical,
  AlertCircle,
  Info
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

// Domain configuration with icons
const DOMAIN_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
  kpis: string[];
}> = {
  candidate: {
    icon: <Users className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Candidate Operations',
    description: 'Manage candidate acquisition, engagement, and profile quality',
    kpis: ['New Registrations', 'Profile Completion Rate', 'Active Candidates']
  },
  company: {
    icon: <Building className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Company Operations',
    description: 'Onboard companies and manage employer engagement',
    kpis: ['New Companies', 'Active Job Postings', 'Company Engagement']
  },
  education: {
    icon: <GraduationCap className="h-5 w-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Education Operations',
    description: 'Partner with schools, universities, and training institutes',
    kpis: ['Partner Institutions', 'Active Programs', 'Student Enrollments']
  },
  assessment: {
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Assessment Operations',
    description: 'Manage assessment centers and certification bodies',
    kpis: ['Assessments Conducted', 'Certifications Issued', 'Pass Rate']
  },
  mentorship: {
    icon: <UserCheck className="h-5 w-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    label: 'Mentorship Operations',
    description: 'Onboard mentors and manage coaching programs',
    kpis: ['Active Mentors', 'Mentorship Matches', 'Session Hours']
  },
  community: {
    icon: <MessageCircle className="h-5 w-5" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    label: 'Community Operations',
    description: 'Moderate communities and manage events',
    kpis: ['Community Members', 'Events Hosted', 'Engagement Rate']
  }
};

// Interfaces
interface Domain {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  permissions: string[];
  operatorCount: number;
}

interface GrowthOperator {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  domains: string[];
  primaryDomain?: string;
  assignments: Array<{
    domain: string;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
  }>;
  performance?: {
    tasksCompleted: number;
    avgResponseTime: string;
    rating: number;
  };
}

interface DomainStats {
  domain: string;
  label: string;
  operatorCount: number;
  activityCount: number;
  icon: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  workload: 'low' | 'medium' | 'high' | 'overloaded';
  kpis: Record<string, number>;
}

interface DragState {
  isDragging: boolean;
  operatorId: number | null;
  sourceElement: HTMLElement | null;
}

/**
 * Enhanced Growth Operator Manager Component
 */
const GrowthOperatorManagerEnhanced: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('kanban');
  const [operators, setOperators] = useState<GrowthOperator[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showOperatorDetailModal, setShowOperatorDetailModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<GrowthOperator | null>(null);
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    operatorId: null,
    sourceElement: null
  });
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadOperators(),
        loadDomains(),
        loadDomainStats()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOperators = async () => {
    try {
      const response = await restClient.get('/api/admin/growth-operators', {
        params: { domain: filterDomain || undefined, status: filterStatus || undefined }
      });
      if (response.data?.data?.operators) {
        setOperators(response.data.data.operators);
      } else {
        // Mock data for development
        setOperators([
          {
            id: 1,
            username: 'ahmed.operator',
            email: 'ahmed@emiratipathways.ae',
            full_name: 'Ahmed Al Maktoum',
            role: 'growth_operator',
            is_active: true,
            created_at: '2024-01-15T10:00:00Z',
            last_login: '2024-12-28T08:30:00Z',
            domains: ['candidate', 'community'],
            primaryDomain: 'candidate',
            assignments: [
              { domain: 'candidate', is_primary: true, is_active: true, created_at: '2024-01-15T10:00:00Z' },
              { domain: 'community', is_primary: false, is_active: true, created_at: '2024-03-01T10:00:00Z' }
            ],
            performance: { tasksCompleted: 156, avgResponseTime: '2.5h', rating: 4.8 }
          },
          {
            id: 2,
            username: 'fatima.operator',
            email: 'fatima@emiratipathways.ae',
            full_name: 'Fatima Al Nahyan',
            role: 'growth_operator',
            is_active: true,
            created_at: '2024-02-01T10:00:00Z',
            last_login: '2024-12-28T09:15:00Z',
            domains: ['company', 'education'],
            primaryDomain: 'company',
            assignments: [
              { domain: 'company', is_primary: true, is_active: true, created_at: '2024-02-01T10:00:00Z' },
              { domain: 'education', is_primary: false, is_active: true, created_at: '2024-04-01T10:00:00Z' }
            ],
            performance: { tasksCompleted: 203, avgResponseTime: '1.8h', rating: 4.9 }
          },
          {
            id: 3,
            username: 'mohammed.operator',
            email: 'mohammed@emiratipathways.ae',
            full_name: 'Mohammed Al Qasimi',
            role: 'growth_operator',
            is_active: true,
            created_at: '2024-03-01T10:00:00Z',
            last_login: '2024-12-27T16:45:00Z',
            domains: ['assessment'],
            primaryDomain: 'assessment',
            assignments: [
              { domain: 'assessment', is_primary: true, is_active: true, created_at: '2024-03-01T10:00:00Z' }
            ],
            performance: { tasksCompleted: 89, avgResponseTime: '3.2h', rating: 4.5 }
          },
          {
            id: 4,
            username: 'sara.operator',
            email: 'sara@emiratipathways.ae',
            full_name: 'Sara Al Falasi',
            role: 'growth_operator',
            is_active: true,
            created_at: '2024-04-01T10:00:00Z',
            last_login: '2024-12-28T07:00:00Z',
            domains: ['mentorship'],
            primaryDomain: 'mentorship',
            assignments: [
              { domain: 'mentorship', is_primary: true, is_active: true, created_at: '2024-04-01T10:00:00Z' }
            ],
            performance: { tasksCompleted: 124, avgResponseTime: '2.1h', rating: 4.7 }
          },
          {
            id: 5,
            username: 'khalid.operator',
            email: 'khalid@emiratipathways.ae',
            full_name: 'Khalid Al Mazrouei',
            role: 'growth_operator',
            is_active: false,
            created_at: '2024-05-01T10:00:00Z',
            last_login: '2024-11-15T10:00:00Z',
            domains: [],
            primaryDomain: undefined,
            assignments: [],
            performance: { tasksCompleted: 45, avgResponseTime: '4.5h', rating: 3.8 }
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
      setOperators([]);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await restClient.get('/api/admin/growth-operators/domains');
      if (response.data?.data) {
        setDomains(response.data.data);
      } else {
        setDomains(Object.entries(DOMAIN_CONFIG).map(([key, config]) => ({
          id: key,
          key,
          label: config.label,
          description: config.description,
          icon: key,
          permissions: [],
          operatorCount: 0
        })));
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    }
  };

  const loadDomainStats = async () => {
    try {
      const response = await restClient.get('/api/admin/growth-operators/statistics');
      if (response.data?.data) {
        setDomainStats(response.data.data);
      } else {
        // Generate mock stats
        setDomainStats(Object.entries(DOMAIN_CONFIG).map(([key, config]) => ({
          domain: key,
          label: config.label,
          operatorCount: Math.floor(Math.random() * 5) + 1,
          activityCount: Math.floor(Math.random() * 100) + 20,
          icon: key,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
          trendValue: Math.floor(Math.random() * 30) - 10,
          workload: ['low', 'medium', 'high', 'overloaded'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'overloaded',
          kpis: config.kpis.reduce((acc, kpi) => ({ ...acc, [kpi]: Math.floor(Math.random() * 1000) }), {})
        })));
      }
    } catch (error) {
      console.error('Failed to load domain stats:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, operatorId: number) => {
    e.dataTransfer.setData('operatorId', operatorId.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDragState({
      isDragging: true,
      operatorId,
      sourceElement: e.currentTarget as HTMLElement
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      operatorId: null,
      sourceElement: null
    });
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, domain: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(domain);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDomain: string) => {
    e.preventDefault();
    const operatorId = parseInt(e.dataTransfer.getData('operatorId'));

    if (operatorId && targetDomain) {
      await assignOperatorToDomain(operatorId, targetDomain);
    }

    setDropTarget(null);
    setDragState({
      isDragging: false,
      operatorId: null,
      sourceElement: null
    });
  };

  const assignOperatorToDomain = async (operatorId: number, domain: string) => {
    try {
      const operator = operators.find(op => op.id === operatorId);
      if (!operator) return;

      const newDomains = operator.domains.includes(domain)
        ? operator.domains
        : [...operator.domains, domain];

      await restClient.post(`/api/admin/growth-operators/${operatorId}/domains`, {
        domains: newDomains,
        primary_domain: operator.primaryDomain || domain
      });

      await loadData();
    } catch (error) {
      console.error('Failed to assign operator:', error);
    }
  };

  const removeOperatorFromDomain = async (operatorId: number, domain: string) => {
    try {
      await restClient.delete(`/api/admin/growth-operators/${operatorId}/domains/${domain}`);
      await loadData();
    } catch (error) {
      console.error('Failed to remove operator from domain:', error);
    }
  };

  // Filter operators
  const filteredOperators = operators.filter(op => {
    const matchesSearch = !searchTerm ||
      op.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.email.toLowerCase().includes(searchTerm.toLowerCase());
    op.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = !filterDomain || filterDomain === 'ALL_DOMAINS' || op.domains.includes(filterDomain);
    const matchesStatus = !filterStatus || filterStatus === 'ALL_STATUS' ||
      (filterStatus === 'active' && op.is_active) ||
      (filterStatus === 'inactive' && !op.is_active);
    return matchesSearch && matchesDomain && matchesStatus;
  });

  // Get operators by domain
  const getOperatorsByDomain = (domain: string) => {
    return operators.filter(op => op.domains.includes(domain));
  };

  // Get unassigned operators
  const unassignedOperators = operators.filter(op => op.domains.length === 0);

  // Handle assignment modal
  const handleAssignDomains = (operator: GrowthOperator) => {
    setSelectedOperator(operator);
    setSelectedDomains(operator.domains || []);
    setPrimaryDomain(operator.primaryDomain || '');
    setAssignmentNotes('');
    setShowAssignModal(true);
  };

  const handleDomainToggle = (domain: string) => {
    setSelectedDomains(prev => {
      if (prev.includes(domain)) {
        const newDomains = prev.filter(d => d !== domain);
        if (primaryDomain === domain) {
          setPrimaryDomain(newDomains[0] || '');
        }
        return newDomains;
      } else {
        const newDomains = [...prev, domain];
        if (newDomains.length === 1) {
          setPrimaryDomain(domain);
        }
        return newDomains;
      }
    });
  };

  const handleSaveAssignment = async () => {
    if (!selectedOperator) return;

    setIsSaving(true);
    try {
      await restClient.post(`/api/admin/growth-operators/${selectedOperator.id}/domains`, {
        domains: selectedDomains,
        primary_domain: primaryDomain,
        notes: assignmentNotes
      });

      setShowAssignModal(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save assignment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk assignment
  const handleBulkAssign = async () => {
    if (selectedOperators.length === 0 || selectedDomains.length === 0) return;

    setIsSaving(true);
    try {
      await Promise.all(selectedOperators.map(opId =>
        restClient.post(`/api/admin/growth-operators/${opId}/domains`, {
          domains: selectedDomains,
          primary_domain: selectedDomains[0]
        })
      ));

      setShowBulkAssignModal(false);
      setSelectedOperators([]);
      setSelectedDomains([]);
      await loadData();
    } catch (error) {
      console.error('Failed to bulk assign:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get workload color
  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'overloaded': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-2 text-gray-600">Loading Growth Operators...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Growth Operator Management</h2>
            <p className="text-gray-500">Assign operators to domains and manage workload distribution</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDomains([]);
                setShowBulkAssignModal(true);
              }}
              disabled={selectedOperators.length === 0}
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Assign ({selectedOperators.length})
            </Button>
          </div>
        </div>

        {/* Domain Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
            const stats = domainStats.find(s => s.domain === key);
            const operatorCount = getOperatorsByDomain(key).length;

            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${dropTarget === key ? 'ring-2 ring-teal-500 shadow-lg' : ''
                  }`}
                onDragOver={(e) => handleDragOver(e, key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{config.label.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500">{operatorCount} operators</p>
                    </div>
                  </div>
                  {stats && (
                    <div className="flex items-center justify-between text-xs">
                      <Badge className={getWorkloadColor(stats.workload)}>
                        {stats.workload}
                      </Badge>
                      <span className={`flex items-center ${stats.trend === 'up' ? 'text-green-600' :
                        stats.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {stats.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                          stats.trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                            <Activity className="h-3 w-3 mr-1" />}
                        {stats.trendValue > 0 ? '+' : ''}{stats.trendValue}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Unassigned Operators Alert */}
        {unassignedOperators.length > 0 && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Unassigned Operators</AlertTitle>
            <AlertDescription className="text-amber-700">
              {unassignedOperators.length} operator(s) have no domain assignments.
              Drag them to a domain or use the assignment modal.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="kanban">
              <Move className="h-4 w-4 mr-2" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger value="list">
              <Users className="h-4 w-4 mr-2" />
              Operator List
            </TabsTrigger>
            <TabsTrigger value="domains">
              <Target className="h-4 w-4 mr-2" />
              Domain Details
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Kanban Board Tab */}
          <TabsContent value="kanban" className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* Unassigned Column */}
              <div className="min-w-[280px] flex-shrink-0">
                <Card className="bg-gray-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Unassigned
                      <Badge variant="secondary">{unassignedOperators.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[200px]">
                    {unassignedOperators.map(op => (
                      <div
                        key={op.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, op.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-white rounded-lg border shadow-sm cursor-move hover:shadow-md transition-all ${dragState.operatorId === op.id ? 'opacity-50' : ''
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{op.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{op.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignDomains(op)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {unassignedOperators.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-8">
                        All operators assigned
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Domain Columns */}
              {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
                const domainOperators = getOperatorsByDomain(key);

                return (
                  <div key={key} className="min-w-[280px] flex-shrink-0">
                    <Card
                      className={`transition-all ${dropTarget === key ? 'ring-2 ring-teal-500' : ''
                        }`}
                      onDragOver={(e) => handleDragOver(e, key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, key)}
                    >
                      <CardHeader className={`pb-2 ${config.bgColor}`}>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          {config.label.split(' ')[0]}
                          <Badge variant="secondary">{domainOperators.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 min-h-[200px] pt-3">
                        {domainOperators.map(op => (
                          <div
                            key={op.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, op.id)}
                            onDragEnd={handleDragEnd}
                            className={`p-3 bg-white rounded-lg border shadow-sm cursor-move hover:shadow-md transition-all ${dragState.operatorId === op.id ? 'opacity-50' : ''
                              } ${op.primaryDomain === key ? `border-l-4 ${config.borderColor}` : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="font-medium text-sm truncate">{op.full_name}</p>
                                  {op.primaryDomain === key && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{op.email}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleAssignDomains(op)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Assignments
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedOperator(op);
                                    setShowOperatorDetailModal(true);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => removeOperatorFromDomain(op.id, key)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove from {config.label.split(' ')[0]}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {op.performance && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {op.performance.tasksCompleted}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {op.performance.avgResponseTime}
                                </span>
                                <span className="flex items-center">
                                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                  {op.performance.rating}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {domainOperators.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-gray-400 text-sm">
                              Drop operators here
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Operator List Tab */}
          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search operators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterDomain} onValueChange={setFilterDomain}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_DOMAINS">All Domains</SelectItem>
                      {Object.entries(DOMAIN_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_STATUS">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Operators Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOperators.length === filteredOperators.length && filteredOperators.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOperators(filteredOperators.map(op => op.id));
                          } else {
                            setSelectedOperators([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Domains</TableHead>
                    <TableHead>Primary Domain</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No operators found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOperators.map(operator => (
                      <TableRow key={operator.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOperators.includes(operator.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOperators(prev => [...prev, operator.id]);
                              } else {
                                setSelectedOperators(prev => prev.filter(id => id !== operator.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{operator.full_name}</p>
                            <p className="text-sm text-gray-500">{operator.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {operator.domains.length > 0 ? (
                              operator.domains.map(domain => {
                                const config = DOMAIN_CONFIG[domain];
                                return (
                                  <Badge
                                    key={domain}
                                    className={`${config?.bgColor} ${config?.color} border-0`}
                                  >
                                    {config?.label.split(' ')[0] || domain}
                                  </Badge>
                                );
                              })
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                Unassigned
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {operator.primaryDomain ? (
                            <Badge variant="secondary" className="capitalize">
                              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                              {operator.primaryDomain}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {operator.performance && (
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Tasks:</span>
                                <span className="font-medium">{operator.performance.tasksCompleted}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span>{operator.performance.rating}</span>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={operator.is_active ? 'default' : 'secondary'}>
                            {operator.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignDomains(operator)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOperator(operator);
                                setShowOperatorDetailModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Domain Details Tab */}
          <TabsContent value="domains" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
                const stats = domainStats.find(s => s.domain === key);
                const domainOperators = getOperatorsByDomain(key);

                return (
                  <Card key={key}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${config.bgColor} ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle>{config.label}</CardTitle>
                          <CardDescription>{config.description}</CardDescription>
                        </div>
                        {stats && (
                          <Badge className={getWorkloadColor(stats.workload)}>
                            {stats.workload} workload
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Operators */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Assigned Operators ({domainOperators.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {domainOperators.map(op => (
                            <Tooltip key={op.id}>
                              <TooltipTrigger>
                                <Badge
                                  variant="outline"
                                  className={op.primaryDomain === key ? 'border-yellow-400' : ''}
                                >
                                  {op.primaryDomain === key && (
                                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  )}
                                  {op.full_name}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{op.email}</p>
                                {op.primaryDomain === key && <p className="text-yellow-400">Primary Domain</p>}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {domainOperators.length === 0 && (
                            <span className="text-gray-400 text-sm">No operators assigned</span>
                          )}
                        </div>
                      </div>

                      {/* KPIs */}
                      {stats?.kpis && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(stats.kpis).map(([kpi, value]) => (
                              <div key={kpi} className="text-center p-2 bg-gray-50 rounded">
                                <p className="text-lg font-bold">{value}</p>
                                <p className="text-xs text-gray-500">{kpi}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Workload Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Workload Capacity</span>
                          <span>{domainOperators.length * 25}%</span>
                        </div>
                        <Progress value={domainOperators.length * 25} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setFilterDomain(key);
                          setActiveTab('list');
                        }}
                      >
                        View All Operators
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Operators</p>
                      <p className="text-3xl font-bold">{operators.length}</p>
                    </div>
                    <Users className="h-10 w-10 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Operators</p>
                      <p className="text-3xl font-bold">{operators.filter(op => op.is_active).length}</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Unassigned</p>
                      <p className="text-3xl font-bold">{unassignedOperators.length}</p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg. Domains/Operator</p>
                      <p className="text-3xl font-bold">
                        {(operators.reduce((sum, op) => sum + op.domains.length, 0) / operators.length || 0).toFixed(1)}
                      </p>
                    </div>
                    <Target className="h-10 w-10 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Domain Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Domain Distribution</CardTitle>
                <CardDescription>Number of operators assigned to each domain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
                    const count = getOperatorsByDomain(key).length;
                    const percentage = (count / operators.length) * 100 || 0;

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className={config.color}>{config.icon}</span>
                            {config.label}
                          </span>
                          <span className="font-medium">{count} operators ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Modal */}
        <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Domains to Growth Operator</DialogTitle>
              <DialogDescription>
                Select the domains this operator will be responsible for.
              </DialogDescription>
            </DialogHeader>

            {selectedOperator && (
              <div className="space-y-6">
                {/* Operator Info */}
                <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedOperator.full_name || selectedOperator.username}</p>
                    <p className="text-sm text-gray-500">{selectedOperator.email}</p>
                  </div>
                </div>

                {/* Domain Selection */}
                <div className="space-y-4">
                  <Label>Select Domains</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(DOMAIN_CONFIG).map(([key, config]) => (
                      <div
                        key={key}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedDomains.includes(key)
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => handleDomainToggle(key)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedDomains.includes(key)}
                            onCheckedChange={() => handleDomainToggle(key)}
                          />
                          <div className={`p-2 rounded ${config.bgColor} ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{config.label}</p>
                            <p className="text-xs text-gray-500">{config.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Domain Selection */}
                {selectedDomains.length > 0 && (
                  <div className="space-y-2">
                    <Label>Primary Domain</Label>
                    <Select value={primaryDomain} onValueChange={setPrimaryDomain}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDomains.filter(d => d).map(domain => (
                          <SelectItem key={domain} value={domain}>
                            <span className="capitalize">{DOMAIN_CONFIG[domain]?.label || domain}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      The primary domain determines the operator's main dashboard view.
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Assignment Notes (Optional)</Label>
                  <Textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Add any notes about this assignment..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveAssignment}
                disabled={isSaving || selectedDomains.length === 0}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Assignment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Assignment Modal */}
        <Dialog open={showBulkAssignModal} onOpenChange={setShowBulkAssignModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk Domain Assignment</DialogTitle>
              <DialogDescription>
                Assign {selectedOperators.length} operator(s) to selected domains.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Selected Operators</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedOperators.map(id => {
                    const op = operators.find(o => o.id === id);
                    return op ? (
                      <Badge key={id} variant="secondary">
                        {op.full_name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign to Domains</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DOMAIN_CONFIG).map(([key, config]) => (
                    <div
                      key={key}
                      className={`p-3 border rounded cursor-pointer transition-all ${selectedDomains.includes(key)
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => handleDomainToggle(key)}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selectedDomains.includes(key)} />
                        <span className={config.color}>{config.icon}</span>
                        <span className="text-sm">{config.label.split(' ')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkAssignModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={isSaving || selectedDomains.length === 0}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign to {selectedDomains.length} Domain(s)
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Operator Detail Modal */}
        <Dialog open={showOperatorDetailModal} onOpenChange={setShowOperatorDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Operator Details</DialogTitle>
            </DialogHeader>

            {selectedOperator && (
              <div className="space-y-6">
                {/* Profile */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{selectedOperator.full_name}</h3>
                    <p className="text-gray-500">{selectedOperator.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={selectedOperator.is_active ? 'default' : 'secondary'}>
                        {selectedOperator.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {selectedOperator.primaryDomain && (
                        <Badge variant="outline">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {DOMAIN_CONFIG[selectedOperator.primaryDomain]?.label || selectedOperator.primaryDomain}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Domain Assignments */}
                <div>
                  <h4 className="font-medium mb-3">Domain Assignments</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOperator.domains.length > 0 ? (
                      selectedOperator.domains.map(domain => {
                        const config = DOMAIN_CONFIG[domain];
                        return (
                          <div key={domain} className={`p-3 rounded-lg border ${config?.bgColor}`}>
                            <div className="flex items-center gap-2">
                              <span className={config?.color}>{config?.icon}</span>
                              <span className="font-medium">{config?.label}</span>
                              {selectedOperator.primaryDomain === domain && (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-400 col-span-2">No domains assigned</p>
                    )}
                  </div>
                </div>

                {/* Performance */}
                {selectedOperator.performance && (
                  <div>
                    <h4 className="font-medium mb-3">Performance Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-teal-600">
                          {selectedOperator.performance.tasksCompleted}
                        </p>
                        <p className="text-sm text-gray-500">Tasks Completed</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedOperator.performance.avgResponseTime}
                        </p>
                        <p className="text-sm text-gray-500">Avg Response Time</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                          <Star className="h-5 w-5 mr-1 fill-yellow-400" />
                          {selectedOperator.performance.rating}
                        </p>
                        <p className="text-sm text-gray-500">Rating</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity */}
                <div>
                  <h4 className="font-medium mb-3">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">
                        {new Date(selectedOperator.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Login</p>
                      <p className="font-medium">
                        {selectedOperator.last_login
                          ? new Date(selectedOperator.last_login).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOperatorDetailModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowOperatorDetailModal(false);
                if (selectedOperator) handleAssignDomains(selectedOperator);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default GrowthOperatorManagerEnhanced;
