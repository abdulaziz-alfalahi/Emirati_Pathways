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
  MessageCircle,
  Users,
  Calendar,
  Plus,
  Search,
  Mail,
  Flag,
  Shield,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  RefreshCw,
  Download,
  BarChart3,
  Heart,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  category: 'career' | 'industry' | 'skill' | 'regional' | 'interest';
  description: string;
  membersCount: number;
  postsCount: number;
  status: 'active' | 'pending' | 'inactive' | 'featured';
  moderators: string[];
  createdAt: string;
  lastActivity: string;
  engagementRate: number;
}

interface Event {
  id: string;
  title: string;
  type: 'webinar' | 'workshop' | 'networking' | 'career_fair' | 'meetup';
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendeesCount: number;
  maxCapacity: number;
}

interface Report {
  id: string;
  type: 'spam' | 'harassment' | 'inappropriate' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reportedAt: string;
  contentPreview: string;
}

const CommunityOperations: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddCommunityDialog, setShowAddCommunityDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [communitiesRes, eventsRes, reportsRes] = await Promise.all([
        restClient.get('/api/growth-operator/communities'),
        restClient.get('/api/growth-operator/events'),
        restClient.get('/api/growth-operator/reports')
      ]);
      if (communitiesRes.data?.data) setCommunities(communitiesRes.data.data);
      if (eventsRes.data?.data) setEvents(eventsRes.data.data);
      if (reportsRes.data?.data) setReports(reportsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const config = {
      career: { color: 'bg-blue-100 text-blue-700', label: 'Career' },
      industry: { color: 'bg-green-100 text-green-700', label: 'Industry' },
      skill: { color: 'bg-purple-100 text-purple-700', label: 'Skill' },
      regional: { color: 'bg-orange-100 text-orange-700', label: 'Regional' },
      interest: { color: 'bg-pink-100 text-pink-700', label: 'Interest' }
    };
    const { color, label } = config[category as keyof typeof config] || config.career;
    return <Badge className={color}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      inactive: { color: 'bg-gray-100 text-gray-700', label: 'Inactive' },
      featured: { color: 'bg-teal-100 text-teal-700', label: 'Featured' }
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const getReportStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      reviewed: { color: 'bg-blue-100 text-blue-700', label: 'Reviewed' },
      resolved: { color: 'bg-green-100 text-green-700', label: 'Resolved' },
      dismissed: { color: 'bg-gray-100 text-gray-700', label: 'Dismissed' }
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{communities.length}</p>
                <p className="text-sm text-gray-500">Communities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{communities.reduce((sum, c) => sum + c.membersCount, 0)}</p>
                <p className="text-sm text-gray-500">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.filter(e => e.status === 'upcoming').length}</p>
                <p className="text-sm text-gray-500">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-gray-500">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="communities">
        <TabsList>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Communities Tab */}
        <TabsContent value="communities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Community Management</CardTitle>
                  <CardDescription>Manage and moderate platform communities</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddCommunityDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
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
                      placeholder="Search communities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Communities Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
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
                  ) : filteredCommunities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No communities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommunities.map((community) => (
                      <TableRow key={community.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{community.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{community.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(community.category)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            {community.membersCount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(community.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className={`h-3 w-3 ${community.engagementRate >= 50 ? 'text-green-500' : 'text-yellow-500'}`} />
                            {community.engagementRate}%
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
                              <Shield className="h-4 w-4" />
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

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Management</CardTitle>
                  <CardDescription>Manage community events and workshops</CardDescription>
                </div>
                <Button onClick={() => setShowAddEventDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Event management will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Review and handle reported content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                    <p>No pending reports</p>
                  </div>
                ) : (
                  reports.filter(r => r.status === 'pending').map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">{report.type}</Badge>
                        {getReportStatusBadge(report.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{report.contentPreview}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button size="sm" variant="outline" className="text-green-600">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Take Action
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Analytics</CardTitle>
              <CardDescription>Insights into community engagement and growth</CardDescription>
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

      {/* Create Community Dialog */}
      <Dialog open={showAddCommunityDialog} onOpenChange={setShowAddCommunityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>
              Create a new community for platform users
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Community Name</Label>
              <Input placeholder="Enter community name" />
            </div>
            <div>
              <Label>Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="industry">Industry</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="interest">Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visibility</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="invite-only">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the community purpose and guidelines..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCommunityDialog(false)}>Cancel</Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityOperations;
