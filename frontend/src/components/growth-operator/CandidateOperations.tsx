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
import { Progress } from '@/components/ui/progress';
import { restClient } from '@/utils/api';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Target,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Send,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  PieChart
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  emirate: string;
  status: 'active' | 'inactive' | 'pending' | 'incomplete';
  profileCompletion: number;
  lastActive: string;
  registeredAt: string;
  cvUploaded: boolean;
  skillsCount: number;
}

interface CampaignMetrics {
  totalReached: number;
  registered: number;
  conversionRate: number;
  activeEngagement: number;
}

const CandidateOperations: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showOutreachDialog, setShowOutreachDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);

  useEffect(() => {
    fetchCandidates();
    fetchMetrics();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await restClient.get('/api/growth-operator/candidates');
      if (response.data?.data) {
        setCandidates(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await restClient.get('/api/growth-operator/candidates/metrics');
      if (response.data?.data) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-700', label: 'Inactive' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      incomplete: { color: 'bg-orange-100 text-orange-700', label: 'Incomplete' }
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.email.toLowerCase().includes(searchTerm.toLowerCase());
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.length}</p>
                <p className="text-sm text-gray-500">Total Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.filter(c => c.status === 'active').length}</p>
                <p className="text-sm text-gray-500">Active Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.filter(c => c.status === 'incomplete').length}</p>
                <p className="text-sm text-gray-500">Incomplete Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.conversionRate || 0}%</p>
                <p className="text-sm text-gray-500">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Candidate Management</TabsTrigger>
          <TabsTrigger value="outreach">Outreach Campaigns</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="quality">Profile Quality</TabsTrigger>
        </TabsList>

        {/* Candidate Management Tab */}
        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Candidate Management</CardTitle>
                  <CardDescription>Monitor and support candidate profiles</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowOutreachDialog(true)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Outreach
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
                      placeholder="Search candidates..."
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
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Candidates Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Emirate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Last Active</TableHead>
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
                  ) : filteredCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No candidates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            <p className="text-sm text-gray-500">{candidate.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {candidate.emirate}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={candidate.profileCompletion} className="w-20 h-2" />
                            <span className="text-sm text-gray-500">{candidate.profileCompletion}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(candidate.lastActive).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
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

        {/* Outreach Campaigns Tab */}
        <TabsContent value="outreach" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outreach Campaigns</CardTitle>
                  <CardDescription>Manage candidate acquisition campaigns</CardDescription>
                </div>
                <Button onClick={() => setShowCampaignDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active campaigns</p>
                <p className="text-sm">Create a new outreach campaign to attract candidates</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Engagement</CardTitle>
              <CardDescription>Track and improve candidate engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Re-engagement Opportunities</h4>
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Engagement data will be populated from API</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Engagement Trends</h4>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Charts will be populated from API</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Quality Assurance</CardTitle>
              <CardDescription>Monitor and improve candidate profile quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {candidates.filter(c => c.profileCompletion >= 80).length}
                  </p>
                  <p className="text-sm text-green-600">Complete Profiles (80%+)</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">
                    {candidates.filter(c => c.profileCompletion >= 50 && c.profileCompletion < 80).length}
                  </p>
                  <p className="text-sm text-yellow-600">Partial Profiles (50-79%)</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">
                    {candidates.filter(c => c.profileCompletion < 50).length}
                  </p>
                  <p className="text-sm text-red-600">Incomplete Profiles (&lt;50%)</p>
                </div>
              </div>
              <div className="text-center py-8 text-gray-500">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Quality metrics visualization will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Outreach Dialog */}
      <Dialog open={showOutreachDialog} onOpenChange={setShowOutreachDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Outreach Message</DialogTitle>
            <DialogDescription>
              Send a personalized message to selected candidates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input placeholder="Enter message subject" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea placeholder="Enter your message..." rows={5} />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select target group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Inactive Candidates</SelectItem>
                  <SelectItem value="incomplete">Incomplete Profiles</SelectItem>
                  <SelectItem value="all">All Candidates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOutreachDialog(false)}>Cancel</Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateOperations;
