import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { restClient } from '@/utils/api';
import { getPrefixedDisplayName } from '@/utils/nameUtils';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  DollarSign,
  User,
  Briefcase,
  Calendar,
  AlertTriangle,
  Send
} from 'lucide-react';

interface OfferApproval {
  approval_id: string;
  offer_id: string;
  jd_id: string;
  candidate_id: number;
  recruiter_id: number;
  position_title: string;
  salary_amount: number;
  salary_currency: string;
  status: string;
  requested_at: string;
  created_at: string;
  candidate_first_name?: string;
  candidate_last_name?: string;
  candidate_email?: string;
  recruiter_first_name?: string;
  recruiter_last_name?: string;
  job_title?: string;
  company_name?: string;
  offer_data?: any;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  comments?: string;
}

interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export const OfferApprovalPanel: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<OfferApproval[]>([]);
  const [allApprovals, setAllApprovals] = useState<OfferApproval[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<OfferApproval | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Get user data from localStorage for proper data isolation
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : {};
    } catch {
      return {};
    }
  };
  const userData = getUserData();
  const approverId = userData.id ? String(userData.id) : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get company_id for filtering
      const companyId = userData.company_id || '';
      const companyParam = companyId ? `?company_id=${companyId}` : '';

      const [pendingRes, allRes, statsRes] = await Promise.allSettled([
        restClient.get(`/api/recruiter/offers/approvals/pending${companyParam}`),
        restClient.get(`/api/recruiter/offers/approvals/all${companyParam}`),
        restClient.get('/api/recruiter/offers/approval-stats')
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.success) {
        setPendingApprovals(pendingRes.value.data.data || []);
      }

      if (allRes.status === 'fulfilled' && allRes.value.data?.success) {
        setAllApprovals(allRes.value.data.data || []);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setStats(statsRes.value.data.data);
      }
    } catch (err) {
      setError('Failed to load approval data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    try {
      setProcessing(true);
      const res = await restClient.post(`/api/recruiter/offers/approvals/${selectedApproval.approval_id}/approve`, {
        approver_id: approverId,
        comments
      });

      if (res.data?.success) {
        toast({
          title: 'Offer Approved',
          description: 'The offer has been approved and can now be sent to the candidate.',
        });
        setShowReviewDialog(false);
        setSelectedApproval(null);
        setComments('');
        fetchData();
      } else {
        throw new Error(res.data?.message || 'Failed to approve offer');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve offer',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;

    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejecting this offer.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessing(true);
      const res = await restClient.post(`/api/recruiter/offers/approvals/${selectedApproval.approval_id}/reject`, {
        approver_id: approverId,
        rejection_reason: rejectionReason,
        comments
      });

      if (res.data?.success) {
        toast({
          title: 'Offer Rejected',
          description: 'The offer has been rejected. The recruiter will be notified.',
        });
        setShowRejectDialog(false);
        setSelectedApproval(null);
        setRejectionReason('');
        setComments('');
        fetchData();
      } else {
        throw new Error(res.data?.message || 'Failed to reject offer');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject offer',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
      approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> }
    };
    const { color, icon } = config[status] || config.pending;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-gray-500">Rejected</p>
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

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Offer Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary" className="ms-2">{pendingApprovals.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review and approve offers before they are sent to candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">All caught up!</h3>
              <p className="text-gray-500">No pending offer approvals at the moment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((approval) => (
                  <TableRow key={approval.approval_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{approval.position_title || approval.job_title || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {getPrefixedDisplayName(approval, 'candidate_')}
                          </p>
                          <p className="text-xs text-gray-500">{approval.candidate_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(approval.salary_amount, approval.salary_currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getPrefixedDisplayName(approval, 'recruiter_')}
                    </TableCell>
                    <TableCell>
                      {approval.requested_at ? new Date(approval.requested_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowReviewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 me-1" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowReviewDialog(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 me-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 me-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Approval History</CardTitle>
          <CardDescription>Previously reviewed offers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Decided</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allApprovals.filter(a => a.status !== 'pending').slice(0, 10).map((approval) => (
                <TableRow key={approval.approval_id}>
                  <TableCell className="font-medium">{approval.position_title || approval.job_title || 'N/A'}</TableCell>
                  <TableCell>
                    {getPrefixedDisplayName(approval, 'candidate_')}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(approval.salary_amount, approval.salary_currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(approval.status)}</TableCell>
                  <TableCell>
                    {approval.approved_at ? new Date(approval.approved_at).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {allApprovals.filter(a => a.status !== 'pending').length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No approval history yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review/Approve Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Review Offer</DialogTitle>
            <DialogDescription>
              Review the offer details before approving
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <ScrollArea className="max-h-[70vh] pe-4">
              <div className="space-y-6 py-4">
                {/* Position & Company Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-ehrdc-teal" />
                    Position Details
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-sm">Position</Label>
                      <p className="font-semibold text-lg">{selectedApproval.position_title || selectedApproval.job_title || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-sm">Company</Label>
                      <p className="font-medium">{selectedApproval.company_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Candidate & Recruiter Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Candidate
                    </h3>
                    <p className="font-medium text-lg">
                      {getPrefixedDisplayName(selectedApproval, 'candidate_')}
                    </p>
                    <p className="text-sm text-gray-600">{selectedApproval.candidate_email}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Send className="h-5 w-5 text-purple-600" />
                      Requested By (Recruiter)
                    </h3>
                    <p className="font-medium text-lg">
                      {getPrefixedDisplayName(selectedApproval, 'recruiter_', '') || selectedApproval.offer_data?.recruiter_name || 'Recruiter'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedApproval.requested_at ? new Date(selectedApproval.requested_at).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>

                {/* Compensation Section */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Compensation
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500 text-sm">Salary Offered</Label>
                      <p className="font-bold text-2xl text-green-600">
                        {formatCurrency(selectedApproval.salary_amount, selectedApproval.salary_currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedApproval.offer_data?.salary_period || 'monthly'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Benefits Package</Label>
                      {selectedApproval.offer_data?.benefits ? (
                        <div className="mt-1 space-y-1">
                          {(() => {
                            const benefits = selectedApproval.offer_data.benefits;
                            if (typeof benefits === 'object' && benefits !== null) {
                              return (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {benefits.health_insurance && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span>Health Insurance</span>
                                    </div>
                                  )}
                                  {benefits.housing_allowance && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span>Housing Allowance</span>
                                    </div>
                                  )}
                                  {benefits.transportation_allowance && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span>Transportation</span>
                                    </div>
                                  )}
                                  {benefits.annual_leave_days && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span>{benefits.annual_leave_days} Days Leave</span>
                                    </div>
                                  )}
                                  {benefits.flight_tickets && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span>{benefits.flight_tickets} Flight Tickets</span>
                                    </div>
                                  )}
                                  {benefits.additional_benefits && benefits.additional_benefits.length > 0 && (
                                    <div className="col-span-2">
                                      <span className="text-gray-500">Additional: </span>
                                      {benefits.additional_benefits.join(', ')}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return <p className="text-sm">{String(benefits)}</p>;
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No benefits specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employment Details Section */}
                {selectedApproval.offer_data && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      Employment Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedApproval.offer_data.start_date && (
                        <div>
                          <Label className="text-gray-500 text-sm">Start Date</Label>
                          <p className="font-medium">{selectedApproval.offer_data.start_date}</p>
                        </div>
                      )}
                      {selectedApproval.offer_data.employment_type && (
                        <div>
                          <Label className="text-gray-500 text-sm">Employment Type</Label>
                          <p className="font-medium capitalize">{selectedApproval.offer_data.employment_type}</p>
                        </div>
                      )}
                      {selectedApproval.offer_data.probation_period_months && (
                        <div>
                          <Label className="text-gray-500 text-sm">Probation Period</Label>
                          <p className="font-medium">{selectedApproval.offer_data.probation_period_months} months</p>
                        </div>
                      )}
                      {selectedApproval.offer_data.work_location && (
                        <div>
                          <Label className="text-gray-500 text-sm">Work Location</Label>
                          <p className="font-medium">{selectedApproval.offer_data.work_location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {selectedApproval.offer_data?.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Additional Notes</h3>
                    <p className="text-gray-700">{selectedApproval.offer_data.notes}</p>
                  </div>
                )}

                {/* Comments */}
                <div className="border-t pt-4">
                  <Label htmlFor="comments" className="font-semibold">Comments for Recruiter (Optional)</Label>
                  <Textarea
                    id="comments"
                    placeholder="Add any comments or feedback for the recruiter..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="mt-2 min-h-[80px]"
                  />
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowReviewDialog(false);
                setShowRejectDialog(true);
              }}
            >
              <XCircle className="h-4 w-4 me-1" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2" />
              ) : (
                <CheckCircle className="h-4 w-4 me-1" />
              )}
              Approve Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Offer</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this offer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explain why this offer is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="rejectComments">Additional Comments (Optional)</Label>
              <Textarea
                id="rejectComments"
                placeholder="Any additional feedback for the recruiter..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2" />
              ) : (
                <XCircle className="h-4 w-4 me-1" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfferApprovalPanel;
