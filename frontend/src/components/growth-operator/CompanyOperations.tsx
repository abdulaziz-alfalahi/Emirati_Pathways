import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { restClient } from '@/utils/api';
import {
  Building,
  Building2,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  RefreshCw,
  Download,
  Upload,
  TrendingUp,
  BarChart3
} from 'lucide-react';

import GrowthTools from '@/components/admin/GrowthTools';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  emirate: string;
  status: 'active' | 'pending' | 'inactive' | 'onboarding';
  contactPerson: string;
  contactEmail: string;
  jobsPosted: number;
  hiresCount: number;
  registeredAt: string;
  lastActivity: string;
}

const CompanyOperations: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showOnboardDialog, setShowOnboardDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await restClient.get('/api/growth-operator/companies');
      if (response.data?.data) {
        setCompanies(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      inactive: { color: 'bg-gray-100 text-gray-700', label: 'Inactive' },
      onboarding: { color: 'bg-blue-100 text-blue-700', label: 'Onboarding' }
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.length}</p>
                <p className="text-sm text-gray-500">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.filter(c => c.status === 'active').length}</p>
                <p className="text-sm text-gray-500">Active Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.reduce((sum, c) => sum + c.jobsPosted, 0)}</p>
                <p className="text-sm text-gray-500">Jobs Posted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.reduce((sum, c) => sum + c.hiresCount, 0)}</p>
                <p className="text-sm text-gray-500">Total Hires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Company Management</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding Pipeline</TabsTrigger>
          <TabsTrigger value="engagement">Employer Engagement</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Company Management Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Company Management</CardTitle>
                  <CardDescription>Manage employer partnerships and relationships</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowOnboardDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Onboard Company
                  </Button>
                  <Button
                    variant={showBulkImport ? "secondary" : "outline"}
                    onClick={() => setShowBulkImport(!showBulkImport)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {showBulkImport ? "Back to List" : "Bulk Import"}
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showBulkImport ? (
                <GrowthTools />
              ) : (
                <>
                  {/* Filters */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search companies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Companies Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Jobs/Hires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                          </TableCell>
                        </TableRow>
                      ) : filteredCompanies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No companies found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCompanies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{company.name}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {company.emirate}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{company.industry}</TableCell>
                            <TableCell>{company.size}</TableCell>
                            <TableCell>{getStatusBadge(company.status)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="text-blue-600">{company.jobsPosted} jobs</span>
                                <span className="mx-1">/</span>
                                <span className="text-green-600">{company.hiresCount} hires</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Pipeline Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Pipeline</CardTitle>
              <CardDescription>Track companies through the onboarding process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-2">Initial Contact</h4>
                  <p className="text-2xl font-bold text-blue-800">
                    {companies.filter(c => c.status === 'pending').length}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <h4 className="font-medium text-yellow-700 mb-2">Documentation</h4>
                  <p className="text-2xl font-bold text-yellow-800">0</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="font-medium text-purple-700 mb-2">Verification</h4>
                  <p className="text-2xl font-bold text-purple-800">
                    {companies.filter(c => c.status === 'onboarding').length}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <h4 className="font-medium text-green-700 mb-2">Active</h4>
                  <p className="text-2xl font-bold text-green-800">
                    {companies.filter(c => c.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employer Engagement</CardTitle>
              <CardDescription>Track and improve employer engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Engagement metrics will be populated from API</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Analytics</CardTitle>
              <CardDescription>Insights into employer partnerships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Analytics charts will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Onboard Company Dialog */}
      <Dialog open={showOnboardDialog} onOpenChange={setShowOnboardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Onboard New Company</DialogTitle>
            <DialogDescription>
              Add a new company to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input placeholder="Enter company name" />
            </div>
            <div>
              <Label>Industry</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company Size</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-50">1-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Emirate</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select emirate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Sharjah">Sharjah</SelectItem>
                  <SelectItem value="Ajman">Ajman</SelectItem>
                  <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                  <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                  <SelectItem value="Fujairah">Fujairah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input placeholder="Enter contact name" />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" placeholder="Enter contact email" />
            </div>
            <div className="col-span-2">
              <Label>Website</Label>
              <Input placeholder="https://www.company.com" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes about the company..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOnboardDialog(false)}>Cancel</Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyOperations;
