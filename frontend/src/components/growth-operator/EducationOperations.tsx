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
  GraduationCap,
  School,
  BookOpen,
  Plus,
  Search,
  Mail,
  MapPin,
  Users,
  Award,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  RefreshCw,
  Download,
  TrendingUp,
  BarChart3,
  Calendar
} from 'lucide-react';

interface EducationInstitution {
  id: string;
  name: string;
  type: 'school' | 'university' | 'training_center' | 'vocational';
  emirate: string;
  status: 'active' | 'pending' | 'inactive' | 'partner';
  contactPerson: string;
  contactEmail: string;
  studentsCount: number;
  programsOffered: number;
  partnershipDate: string;
  lastActivity: string;
}

const EducationOperations: React.FC = () => {
  const [institutions, setInstitutions] = useState<EducationInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await restClient.get('/api/growth-operator/education');
      if (response.data?.data) {
        setInstitutions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      school: { color: 'bg-blue-100 text-blue-700', label: 'School', icon: School },
      university: { color: 'bg-purple-100 text-purple-700', label: 'University', icon: GraduationCap },
      training_center: { color: 'bg-green-100 text-green-700', label: 'Training Center', icon: BookOpen },
      vocational: { color: 'bg-orange-100 text-orange-700', label: 'Vocational', icon: Award }
    };
    const { color, label } = config[type as keyof typeof config] || config.school;
    return <Badge className={color}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      inactive: { color: 'bg-gray-100 text-gray-700', label: 'Inactive' },
      partner: { color: 'bg-teal-100 text-teal-700', label: 'Partner' }
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredInstitutions = institutions.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || i.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{institutions.length}</p>
                <p className="text-sm text-gray-500">Total Institutions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <School className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{institutions.filter(i => i.type === 'school').length}</p>
                <p className="text-sm text-gray-500">Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{institutions.filter(i => i.type === 'training_center').length}</p>
                <p className="text-sm text-gray-500">Training Centers</p>
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
                <p className="text-2xl font-bold">{institutions.reduce((sum, i) => sum + i.studentsCount, 0)}</p>
                <p className="text-sm text-gray-500">Students Reached</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="institutions">
        <TabsList>
          <TabsTrigger value="institutions">Institution Management</TabsTrigger>
          <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="events">Events & Workshops</TabsTrigger>
        </TabsList>

        {/* Institution Management Tab */}
        <TabsContent value="institutions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Education Institution Management</CardTitle>
                  <CardDescription>Manage schools, universities, and training centers</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Institution
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
                      placeholder="Search institutions..."
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
                    <SelectItem value="school">Schools</SelectItem>
                    <SelectItem value="university">Universities</SelectItem>
                    <SelectItem value="training_center">Training Centers</SelectItem>
                    <SelectItem value="vocational">Vocational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Institutions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Emirate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Students</TableHead>
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
                  ) : filteredInstitutions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No institutions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInstitutions.map((institution) => (
                      <TableRow key={institution.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{institution.name}</p>
                            <p className="text-sm text-gray-500">{institution.contactEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(institution.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {institution.emirate}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(institution.status)}</TableCell>
                        <TableCell>{institution.studentsCount.toLocaleString()}</TableCell>
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

        {/* Partnerships Tab */}
        <TabsContent value="partnerships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Education Partnerships</CardTitle>
              <CardDescription>Manage formal partnerships with educational institutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Partnership management will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Programs</CardTitle>
              <CardDescription>Manage career readiness programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Program management will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Events & Workshops</CardTitle>
              <CardDescription>Manage career fairs and educational workshops</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Event management will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Institution Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Education Institution</DialogTitle>
            <DialogDescription>
              Add a new school, university, or training center
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Institution Name</Label>
              <Input placeholder="Enter institution name" />
            </div>
            <div>
              <Label>Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="training_center">Training Center</SelectItem>
                  <SelectItem value="vocational">Vocational Institute</SelectItem>
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
              Add Institution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EducationOperations;
