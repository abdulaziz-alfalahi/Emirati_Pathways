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
  ClipboardCheck,
  Award,
  FileCheck,
  Plus,
  Search,
  Mail,
  MapPin,
  Users,
  CheckCircle,
  Eye,
  Edit,
  RefreshCw,
  Download,
  BarChart3,
  Target,
  Shield
} from 'lucide-react';

interface AssessmentCenter {
  id: string;
  name: string;
  type: 'skills' | 'certification' | 'psychometric' | 'technical';
  emirate: string;
  status: 'active' | 'pending' | 'inactive' | 'accredited';
  contactPerson: string;
  contactEmail: string;
  assessmentsCount: number;
  certificationsIssued: number;
  accreditationDate: string;
  lastActivity: string;
}

const AssessmentOperations: React.FC = () => {
  const [centers, setCenters] = useState<AssessmentCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await restClient.get('/api/growth-operator/assessment');
      if (response.data?.data) {
        setCenters(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch assessment centers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      skills: { color: 'bg-blue-100 text-blue-700', label: 'Skills Assessment' },
      certification: { color: 'bg-green-100 text-green-700', label: 'Certification' },
      psychometric: { color: 'bg-purple-100 text-purple-700', label: 'Psychometric' },
      technical: { color: 'bg-orange-100 text-orange-700', label: 'Technical' }
    };
    const { color, label } = config[type as keyof typeof config] || config.skills;
    return <Badge className={color}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      inactive: { color: 'bg-gray-100 text-gray-700', label: 'Inactive' },
      accredited: { color: 'bg-teal-100 text-teal-700', label: 'Accredited' }
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredCenters = centers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{centers.length}</p>
                <p className="text-sm text-gray-500">Assessment Centers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{centers.filter(c => c.status === 'accredited').length}</p>
                <p className="text-sm text-gray-500">Accredited</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{centers.reduce((sum, c) => sum + c.assessmentsCount, 0)}</p>
                <p className="text-sm text-gray-500">Assessments Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{centers.reduce((sum, c) => sum + c.certificationsIssued, 0)}</p>
                <p className="text-sm text-gray-500">Certifications Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="centers">
        <TabsList>
          <TabsTrigger value="centers">Assessment Centers</TabsTrigger>
          <TabsTrigger value="accreditation">Accreditation</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Assessment Centers Tab */}
        <TabsContent value="centers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessment Center Management</CardTitle>
                  <CardDescription>Manage assessment and certification centers</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Center
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search centers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="skills">Skills Assessment</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="psychometric">Psychometric</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Centers Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Center</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Emirate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assessments</TableHead>
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
                  ) : filteredCenters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No assessment centers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCenters.map((center) => (
                      <TableRow key={center.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{center.name}</p>
                            <p className="text-sm text-gray-500">{center.contactEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(center.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {center.emirate}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(center.status)}</TableCell>
                        <TableCell>{center.assessmentsCount.toLocaleString()}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accreditation Tab */}
        <TabsContent value="accreditation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accreditation Management</CardTitle>
              <CardDescription>Manage center accreditation and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Accreditation management will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certification Programs</CardTitle>
              <CardDescription>Manage available certification programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Certification management will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Analytics</CardTitle>
              <CardDescription>Insights into assessment performance</CardDescription>
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

      {/* Add Center Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Assessment Center</DialogTitle>
            <DialogDescription>
              Add a new assessment or certification center
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Center Name</Label>
              <Input placeholder="Enter center name" />
            </div>
            <div>
              <Label>Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skills">Skills Assessment</SelectItem>
                  <SelectItem value="certification">Certification Body</SelectItem>
                  <SelectItem value="psychometric">Psychometric Testing</SelectItem>
                  <SelectItem value="technical">Technical Assessment</SelectItem>
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
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentOperations;
