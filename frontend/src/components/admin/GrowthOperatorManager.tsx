import React, { useState, useEffect } from 'react';
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
  Star,
  StarOff,
  Settings,
  Activity
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

// Domain configuration
const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  candidate: <Users className="h-5 w-5" />,
  company: <Building className="h-5 w-5" />,
  education: <GraduationCap className="h-5 w-5" />,
  assessment: <ClipboardCheck className="h-5 w-5" />,
  mentorship: <UserCheck className="h-5 w-5" />,
  community: <MessageCircle className="h-5 w-5" />
};

const DOMAIN_COLORS: Record<string, string> = {
  candidate: 'bg-blue-100 text-blue-800 border-blue-200',
  company: 'bg-green-100 text-green-800 border-green-200',
  education: 'bg-purple-100 text-purple-800 border-purple-200',
  assessment: 'bg-orange-100 text-orange-800 border-orange-200',
  mentorship: 'bg-pink-100 text-pink-800 border-pink-200',
  community: 'bg-cyan-100 text-cyan-800 border-cyan-200'
};

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
}

interface DomainStats {
  domain: string;
  label: string;
  operatorCount: number;
  activityCount: number;
  icon: string;
}

const GrowthOperatorManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('operators');
  const [operators, setOperators] = useState<GrowthOperator[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<GrowthOperator | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
        params: { domain: filterDomain || undefined }
      });
      if (response.data?.data?.operators) {
        setOperators(response.data.data.operators);
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
      // Set mock data for development
      setOperators([]);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await restClient.get('/api/admin/growth-operators/domains');
      if (response.data?.data) {
        setDomains(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
      // Set default domains
      setDomains([
        { id: 'candidate', key: 'candidate', label: 'Candidate Operations', description: 'Manage candidate acquisition and engagement', icon: 'Users', permissions: [], operatorCount: 0 },
        { id: 'company', key: 'company', label: 'Company Operations', description: 'Onboard companies and manage employer engagement', icon: 'Building', permissions: [], operatorCount: 0 },
        { id: 'education', key: 'education', label: 'Education Operations', description: 'Partner with educational institutions', icon: 'GraduationCap', permissions: [], operatorCount: 0 },
        { id: 'assessment', key: 'assessment', label: 'Assessment Operations', description: 'Manage assessment centers', icon: 'ClipboardCheck', permissions: [], operatorCount: 0 },
        { id: 'mentorship', key: 'mentorship', label: 'Mentorship Operations', description: 'Onboard mentors and manage programs', icon: 'UserCheck', permissions: [], operatorCount: 0 },
        { id: 'community', key: 'community', label: 'Community Operations', description: 'Moderate communities and events', icon: 'MessageCircle', permissions: [], operatorCount: 0 }
      ]);
    }
  };

  const loadDomainStats = async () => {
    try {
      const response = await restClient.get('/api/admin/growth-operators/statistics');
      if (response.data?.data) {
        setDomainStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load domain stats:', error);
    }
  };

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
        // Remove domain
        const newDomains = prev.filter(d => d !== domain);
        // If removing primary domain, clear it
        if (primaryDomain === domain) {
          setPrimaryDomain(newDomains[0] || '');
        }
        return newDomains;
      } else {
        // Add domain
        const newDomains = [...prev, domain];
        // If first domain, set as primary
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
      alert('Failed to save domain assignment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDomain = async (operatorId: number, domain: string) => {
    if (!confirm(`Remove ${domain} domain from this operator?`)) return;
    
    try {
      await restClient.delete(`/api/admin/growth-operators/${operatorId}/domains/${domain}`);
      await loadData();
    } catch (error) {
      console.error('Failed to remove domain:', error);
    }
  };

  const handleSetPrimary = async (operatorId: number, domain: string) => {
    try {
      await restClient.put(`/api/admin/growth-operators/${operatorId}/primary-domain`, {
        domain
      });
      await loadData();
    } catch (error) {
      console.error('Failed to set primary domain:', error);
    }
  };

  const filteredOperators = operators.filter(op => {
    const matchesSearch = !searchTerm || 
      op.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDomain = !filterDomain || op.domains?.includes(filterDomain);
    
    return matchesSearch && matchesDomain;
  });

  const renderDomainBadge = (domain: string, isPrimary?: boolean) => (
    <Badge 
      key={domain}
      variant="outline" 
      className={`${DOMAIN_COLORS[domain]} flex items-center gap-1`}
    >
      {DOMAIN_ICONS[domain]}
      <span className="capitalize">{domain}</span>
      {isPrimary && <Star className="h-3 w-3 fill-current" />}
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Growth Operator Management</h2>
          <p className="text-gray-600">Assign operators to specific domains and manage their responsibilities</p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Domain Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {domains.map(domain => (
          <Card 
            key={domain.key} 
            className={`cursor-pointer transition-all hover:shadow-md ${filterDomain === domain.key ? 'ring-2 ring-teal-500' : ''}`}
            onClick={() => setFilterDomain(filterDomain === domain.key ? '' : domain.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${DOMAIN_COLORS[domain.key]}`}>
                  {DOMAIN_ICONS[domain.key]}
                </div>
                <span className="text-2xl font-bold">{domain.operatorCount}</span>
              </div>
              <p className="text-sm font-medium text-gray-700 capitalize">{domain.key}</p>
              <p className="text-xs text-gray-500">Operators</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="operators">
            <Users className="h-4 w-4 mr-2" />
            Operators
          </TabsTrigger>
          <TabsTrigger value="domains">
            <Settings className="h-4 w-4 mr-2" />
            Domain Overview
          </TabsTrigger>
        </TabsList>

        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search operators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Domains</SelectItem>
                {domains.map(d => (
                  <SelectItem key={d.key} value={d.key}>
                    <span className="capitalize">{d.key}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operators Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Assigned Domains</TableHead>
                  <TableHead>Primary Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500">Loading operators...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOperators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="mt-2 text-gray-500">No growth operators found</p>
                      <p className="text-sm text-gray-400">
                        {filterDomain ? 'Try clearing the domain filter' : 'Create users with growth_operator role to get started'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperators.map(operator => (
                    <TableRow key={operator.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{operator.full_name || operator.username}</p>
                          <p className="text-sm text-gray-500">{operator.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {operator.domains?.length > 0 ? (
                            operator.domains.map(domain => (
                              <div key={domain} className="flex items-center gap-1">
                                {renderDomainBadge(domain, domain === operator.primaryDomain)}
                                <button
                                  onClick={() => handleRemoveDomain(operator.id, domain)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No domains assigned</span>
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
                        <Badge variant={operator.is_active ? 'default' : 'secondary'}>
                          {operator.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignDomains(operator)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Assign Domains
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Domain Overview Tab */}
        <TabsContent value="domains" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map(domain => (
              <Card key={domain.key}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${DOMAIN_COLORS[domain.key]}`}>
                      {DOMAIN_ICONS[domain.key]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{domain.label}</CardTitle>
                      <CardDescription>{domain.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Assigned Operators</span>
                      <span className="font-medium">{domain.operatorCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Permissions</span>
                      <span className="font-medium">{domain.permissions?.length || 0}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {domain.permissions?.slice(0, 3).map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {domain.permissions?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{domain.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Domain Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Domains to Growth Operator</DialogTitle>
            <DialogDescription>
              Select the domains this operator will be responsible for. You can assign multiple domains.
            </DialogDescription>
          </DialogHeader>

          {selectedOperator && (
            <div className="space-y-6">
              {/* Operator Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedOperator.full_name || selectedOperator.username}</p>
                <p className="text-sm text-gray-500">{selectedOperator.email}</p>
              </div>

              {/* Domain Selection */}
              <div className="space-y-4">
                <Label>Select Domains</Label>
                <div className="grid grid-cols-2 gap-3">
                  {domains.map(domain => (
                    <div
                      key={domain.key}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedDomains.includes(domain.key)
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleDomainToggle(domain.key)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedDomains.includes(domain.key)}
                          onCheckedChange={() => handleDomainToggle(domain.key)}
                        />
                        <div className={`p-2 rounded ${DOMAIN_COLORS[domain.key]}`}>
                          {DOMAIN_ICONS[domain.key]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{domain.label}</p>
                          <p className="text-xs text-gray-500">{domain.description}</p>
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
                      {selectedDomains.map(domain => (
                        <SelectItem key={domain} value={domain}>
                          <span className="capitalize">{domain}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    The primary domain determines the operator's main dashboard view and role designation.
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
    </div>
  );
};

export default GrowthOperatorManager;
