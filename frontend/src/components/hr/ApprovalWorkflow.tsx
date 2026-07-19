import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { restClient } from '@/utils/api';
import { OfferApprovalPanel } from './OfferApprovalPanel';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  Briefcase,
  Calendar,
  AlertTriangle,
  Eye,
  Send,
  UserCheck,
  Building,
  DollarSign,
  FileSignature,
  Shield
} from 'lucide-react';

// Types for approval workflow
interface ApprovalItem {
  id: string;
  type: 'vacancy' | 'shortlist' | 'interview' | 'offer' | 'contract';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  details: Record<string, any>;
}

interface DelegationSetting {
  type: 'vacancy' | 'shortlist' | 'interview' | 'offer' | 'contract';
  delegatedTo: string | null;
  delegatedToName: string | null;
  isActive: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ApprovalWorkflowProps {
  companyId: string;
  hrManagerId: string;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ companyId, hrManagerId }) => {
  const [activeTab, setActiveTab] = useState('offers');
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [delegationSettings, setDelegationSettings] = useState<DelegationSetting[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDelegationDialog, setShowDelegationDialog] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [selectedDelegationType, setSelectedDelegationType] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovalData();
  }, [companyId]);

  const fetchApprovalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsResponse, delegationResponse, teamResponse] = await Promise.allSettled([
        restClient.get(`/api/hr/approvals?company_id=${companyId}`),
        restClient.get(`/api/hr/delegations?hr_manager_id=${hrManagerId}`),
        restClient.get(`/api/company/team/members?company_id=${companyId}`)
      ]);

      if (itemsResponse.status === 'fulfilled' && itemsResponse.value.data?.data) {
        setApprovalItems(itemsResponse.value.data.data);
      }

      if (delegationResponse.status === 'fulfilled' && delegationResponse.value.data?.data) {
        setDelegationSettings(delegationResponse.value.data.data);
      } else {
        // Initialize default delegation settings
        setDelegationSettings([
          { type: 'vacancy', delegatedTo: null, delegatedToName: null, isActive: false },
          { type: 'shortlist', delegatedTo: null, delegatedToName: null, isActive: false },
          { type: 'interview', delegatedTo: null, delegatedToName: null, isActive: false },
          { type: 'offer', delegatedTo: null, delegatedToName: null, isActive: false },
          { type: 'contract', delegatedTo: null, delegatedToName: null, isActive: false }
        ]);
      }

      if (teamResponse.status === 'fulfilled' && teamResponse.value.data?.members) {
        setTeamMembers(teamResponse.value.data.members.filter((m: TeamMember) => m.role === 'recruiter'));
      }
    } catch (err) {
      setError('Failed to load approval data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    try {
      await restClient.post(`/api/hr/approvals/${item.id}/approve`, {
        comment: approvalComment,
        approved_by: hrManagerId
      });

      setApprovalItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'approved' } : i
      ));
      setShowApprovalDialog(false);
      setApprovalComment('');
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to approve item:', err);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      await restClient.post(`/api/hr/approvals/${item.id}/reject`, {
        comment: approvalComment,
        rejected_by: hrManagerId
      });

      setApprovalItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'rejected' } : i
      ));
      setShowApprovalDialog(false);
      setApprovalComment('');
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to reject item:', err);
    }
  };

  const handleDelegationChange = async (type: string, recruiterId: string | null) => {
    try {
      await restClient.post('/api/hr/delegations', {
        hr_manager_id: hrManagerId,
        type,
        delegated_to: recruiterId,
        is_active: recruiterId !== null
      });

      const recruiter = teamMembers.find(m => m.id === recruiterId);

      setDelegationSettings(prev => prev.map(d =>
        d.type === type
          ? {
            ...d,
            delegatedTo: recruiterId,
            delegatedToName: recruiter?.name || null,
            isActive: recruiterId !== null
          }
          : d
      ));
    } catch (err) {
      console.error('Failed to update delegation:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vacancy': return <Briefcase className="h-4 w-4" />;
      case 'shortlist': return <Users className="h-4 w-4" />;
      case 'interview': return <Calendar className="h-4 w-4" />;
      case 'offer': return <DollarSign className="h-4 w-4" />;
      case 'contract': return <FileSignature className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vacancy': return 'Vacancy Posting';
      case 'shortlist': return 'Candidate Shortlist';
      case 'interview': return 'Interview Attendance';
      case 'offer': return 'Job Offer';
      case 'contract': return 'Employment Contract';
      default: return type;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return <Badge className={colors[priority as keyof typeof colors] || colors.low}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
      approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
      delegated: { color: 'bg-purple-100 text-purple-700', icon: <Send className="h-3 w-3" /> }
    };
    const { color, icon } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const pendingItems = approvalItems.filter(i => i.status === 'pending');
  const processedItems = approvalItems.filter(i => i.status !== 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ehrdc-teal"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingItems.length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingItems.filter(i => i.type === 'vacancy').length}</p>
                <p className="text-sm text-gray-500">Vacancies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingItems.filter(i => i.type === 'shortlist').length}</p>
                <p className="text-sm text-gray-500">Shortlists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingItems.filter(i => i.type === 'offer').length}</p>
                <p className="text-sm text-gray-500">Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileSignature className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingItems.filter(i => i.type === 'contract').length}</p>
                <p className="text-sm text-gray-500">Contracts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Offer Approvals
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Other Approvals
            {pendingItems.length > 0 && (
              <Badge variant="secondary" className="ms-1">{pendingItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="delegation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Delegation Settings
          </TabsTrigger>
        </TabsList>

        {/* Offer Approvals Tab */}
        <TabsContent value="offers" className="space-y-4">
          <OfferApprovalPanel />
        </TabsContent>

        {/* Other Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-gray-500">No pending approvals at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve recruitment workflow items</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingItems.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="text-sm">{getTypeLabel(item.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.requestedBy}</TableCell>
                        <TableCell>{new Date(item.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowApprovalDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 me-1" />
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
              <CardDescription>Previously processed approval requests</CardDescription>
            </CardHeader>
            <CardContent>
              {processedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No approval history yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedItems.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="text-sm">{getTypeLabel(item.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.requestedBy}</TableCell>
                        <TableCell>{new Date(item.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delegation Settings Tab */}
        <TabsContent value="delegation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delegation Settings</CardTitle>
              <CardDescription>
                Delegate approval authority to recruiters for specific workflow types.
                Delegated approvals will be handled by the assigned recruiter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {delegationSettings.map((setting, index) => (
                  <div key={`${setting.type}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(setting.type)}
                      <div>
                        <p className="font-medium">{getTypeLabel(setting.type)}</p>
                        <p className="text-sm text-gray-500">
                          {setting.isActive && setting.delegatedToName
                            ? `Delegated to ${setting.delegatedToName}`
                            : 'Not delegated - requires your approval'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={setting.delegatedTo || 'none'}
                        onValueChange={(value) => handleDelegationChange(setting.type, value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select recruiter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No delegation</SelectItem>
                          {teamMembers.map((member, mIndex) => (
                            <SelectItem key={`${member.id}-${mIndex}`} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {setting.isActive && (
                        <Badge className="bg-purple-100 text-purple-700">Delegated</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Even when delegated, you will still receive notifications for all approvals.
                  You can revoke delegation at any time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Review Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && getTypeIcon(selectedItem.type)}
              Review {selectedItem && getTypeLabel(selectedItem.type)}
            </DialogTitle>
            <DialogDescription>
              Review the details and approve or reject this request.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Title</Label>
                  <p className="font-medium">{selectedItem.title}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Requested By</Label>
                  <p className="font-medium">{selectedItem.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Date</Label>
                  <p className="font-medium">{new Date(selectedItem.requestedAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedItem.priority)}</div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Description</Label>
                <p className="mt-1">{selectedItem.description}</p>
              </div>

              {/* Type-specific details */}
              {selectedItem.details && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-gray-500 mb-2 block">Additional Details</Label>
                  <ScrollArea className="h-[150px]">
                    <pre className="text-sm">{JSON.stringify(selectedItem.details, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}

              <div>
                <Label htmlFor="comment">Comment (optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add a comment for this approval decision..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false);
                setSelectedItem(null);
                setApprovalComment('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleReject(selectedItem)}
            >
              <XCircle className="h-4 w-4 me-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedItem && handleApprove(selectedItem)}
            >
              <CheckCircle className="h-4 w-4 me-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalWorkflow;
